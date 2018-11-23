import * as _ from "lodash";
import { ClassSchedule, FacultyMember, FacultyMemberClassFeedback, Term } from "../entities";
import Subject from "../entities/subject";
import { FacultyMemberType, FeedbackStatus, MeetingHours, SubjectCategory } from "../enums";
import { FacultyMemberTypeLoadingLimit } from "../enums/faculty_member_type";
import { compareMeetingHours, twoMeetingHoursBefore } from "../enums/meeting_hours";
import Program from "../enums/program";
import Controller from "../interfaces/controller";
import FacultySubdocumentEntity from "../interfaces/faculty_subdocument";

const MAXIMUM_PREPS = 2;
const UNASSIGNABLE = -1;
const BASE_POINTS = 100;

const PRESETS = {
    TIMES_TAUGHT: {
        multiplier: 4 / 5,
        basePoints: BASE_POINTS,
    },
    DEGREE: {
        multiplier: 4 / 5,
        basePoints: BASE_POINTS * 5,
    },
    INSTRUCTIONAL_MATERIALS: {
        multiplier: 1 / 2,
        basePoints: BASE_POINTS * 4,
    },
    PRESENTATIONS: {
        multiplier: 1 / 2,
        basePoints: BASE_POINTS * 3,
    },
    EXTENSION_WORKS: {
        multiplier: 1 / 2,
        basePoints: BASE_POINTS * 2,
    },
    RECOGNITIONS: {
        multiplier: 1 / 2,
        basePoints: BASE_POINTS,
    },
};

function scoreWithDiminishingReturns(count, { multiplier, basePoints }): number {
    let score = 0;

    for (let i = 1; i <= count; i++) {
        const gain = basePoints * Math.pow(multiplier, i - 1);
        score += gain;
    }

    return score;
}

class FacultyScore {
    public facultyMember: FacultyMember;

    constructor(fm: FacultyMember) {
        this.facultyMember = fm;
    }

    calculateSubdocumentScore(program: Program): number {
        function associatedCount(subdocuments: FacultySubdocumentEntity[]) {
            return subdocuments.filter(s => s.associatedPrograms.includes(program)).length;
        }

        const {
            degrees,
            extensionWorks,
            presentations,
            instructionalMaterials,
            recognitions,
        } = this.facultyMember;
        const degreeCount = associatedCount(degrees);
        const extensionWorkCount = associatedCount(extensionWorks);
        const presentationCount = associatedCount(presentations);
        const instructionalMaterialCount = associatedCount(instructionalMaterials);
        const recognitionCount = associatedCount(recognitions);

        return (
            scoreWithDiminishingReturns(degreeCount, PRESETS.DEGREE) +
            scoreWithDiminishingReturns(extensionWorkCount, PRESETS.EXTENSION_WORKS) +
            scoreWithDiminishingReturns(presentationCount, PRESETS.PRESENTATIONS) +
            scoreWithDiminishingReturns(
                instructionalMaterialCount,
                PRESETS.INSTRUCTIONAL_MATERIALS,
            ) +
            scoreWithDiminishingReturns(recognitionCount, PRESETS.RECOGNITIONS)
        );
    }

    get rankScore() {
        let score = 0;
        switch (this.facultyMember.type) {
            case FacultyMemberType.Instructor:
                score += BASE_POINTS;
            case FacultyMemberType.AssistantProfessor:
                score += BASE_POINTS;
            case FacultyMemberType.AssociateProfessor:
                score += BASE_POINTS;
            case FacultyMemberType.FullProfessor:
                score += BASE_POINTS;
            case FacultyMemberType.Adjunct:
                score += BASE_POINTS;
            case FacultyMemberType.PartTime:
                score += BASE_POINTS;
        }
        return score;
    }
}

interface ICandidate {
    faculty: FacultyMember;
    score: number;
}

export default class SchedulerController implements Controller {
    public async candidatesForClassSchedule(cs: ClassSchedule, term: Term): Promise<ICandidate[]> {
        let faculties = await FacultyMember.find({
            relations: [
                "degrees",
                "recognitions",
                "presentations",
                "instructionalMaterials",
                "extensionWorks",
                "user",
            ],
        });

        //
        // ─── Ensure full time faculties get assigned first ────────────────────────────────────────────────────────────
        //

        const fullTimeFaculties = faculties.filter(f => f.type !== FacultyMemberType.PartTime);
        let fullTimeFacultiesHaveMinium = true;

        for (const f of fullTimeFaculties) {
            const loadCount = await this.numberOfAssignments(f, term);
            const loadingLimit = FacultyMemberTypeLoadingLimit.get(f.type)!;

            // Everyone must be at least minimum
            if (loadCount < loadingLimit.minimum) {
                fullTimeFacultiesHaveMinium = false;
                break;
            }
        }

        if (!fullTimeFacultiesHaveMinium) {
            faculties = fullTimeFaculties;
        }

        //
        // ─── Calculate scores ────────────────────────────────────────────────────────────
        //

        const facultyScores = faculties.map(f => new FacultyScore(f));

        const candidates = await Promise.all(
            facultyScores.map(async fs => ({
                faculty: fs.facultyMember,
                score: await this.scoreForFacultyMember(term, fs, cs),
            })),
        );

        // Scort highest to lowest
        return candidates
            .filter(c => c.score !== UNASSIGNABLE)
            .sort((a, b) => {
                if (a.score < b.score) {
                    return -1;
                }

                if (a.score > b.score) {
                    return 1;
                }

                return 0;
            })
            .reverse();
    }

    public async numberOfTimesTaught(fm: FacultyMember, s: Subject) {
        return await ClassSchedule.count({
            where: {
                subject: {
                    id: s.id,
                },
                feedback: {
                    facultyMember: {
                        id: fm.id,
                    },
                    status: FeedbackStatus.Accepted,
                },
            },
        });
    }

    public async numberOfAssignments(fm: FacultyMember, t: Term) {
        const cs = await ClassSchedule.find({
            relations: ["feedback", "feedback.facultyMember"],
            where: {
                term: {
                    id: t.id,
                },
            },
        });
        return cs.filter(cs => cs.feedback && cs.feedback.facultyMember.id === fm.id).length;
    }

    // Negative numbers means the faculty member is incompatible
    // The higher the score, the more compatible
    public async scoreForFacultyMember(
        t: Term,
        fs: FacultyScore,
        cs: ClassSchedule,
    ): Promise<number> {
        //
        // ─── Initial score ────────────────────────────────────────────────────────────
        //

        let score = 0;

        // Teacher type ranking considerations
        score += fs.rankScore;

        // Subdocument score for program
        score += fs.calculateSubdocumentScore(cs.subject.program);

        //
        // ─── Loading count considerations ────────────────────────────────────────────────────────────
        //

        const loadCount = await this.numberOfAssignments(fs.facultyMember, t);
        const loadingLimit = FacultyMemberTypeLoadingLimit.get(fs.facultyMember.type)!;

        // Strictly do not assign above maximum
        if (loadCount >= loadingLimit.maximum) {
            console.log("Unassignable because above maximum load", loadCount, loadingLimit);
            return UNASSIGNABLE;
        }

        // Boost the underloaded
        if (loadCount < loadingLimit.minimum) {
            score += BASE_POINTS;
        }

        //
        // ─── Extra load considerations ────────────────────────────────────────────────────────────
        //

        const hasExternalLoad = Boolean(
            t.externalLoads.find(el => el.facultyMember.id === fs.facultyMember.id),
        );

        // If has external load, cannot obtain load above extra
        if (hasExternalLoad && loadCount >= loadingLimit.extra) {
            console.log(
                "Unassignable because has external load and is above extra",
                hasExternalLoad,
            );
            return UNASSIGNABLE;
        }

        //
        // ─── Availability considerations ────────────────────────────────────────────────────────────
        //
        const facultyMemberAvailabilities = t.timeConstraints.filter(
            tc => tc.facultyMember.id === fs.facultyMember.id,
        );

        const availability = facultyMemberAvailabilities.find(
            tc => cs.meetingDays === tc.meetingDays && cs.meetingHours === tc.meetingHours,
        );

        const isAvailable = facultyMemberAvailabilities.length === 0 || availability !== undefined;

        if (!isAvailable) {
            // console.log("Unassignable because is not available or preferred");
            return UNASSIGNABLE;
        }

        //
        // ─── Adjunct special cases ────────────────────────────────────────────────────────────
        //

        // This does not allow assignment of adjunct members to major subjects, a business rule
        if (
            fs.facultyMember.type === FacultyMemberType.Adjunct &&
            cs.subject.category !== SubjectCategory.General
        ) {
            console.log("Unassignable because they are adjunct being assigned to a major subject");
            return UNASSIGNABLE;
        }

        //
        // ─── Preparation considerations ────────────────────────────────────────────────────────────
        //

        // Use this instead of t.classSchedules because t.classSchedules is not updated
        // with previous schedulings; update the query every single time
        const classSchedules = await ClassSchedule.find({
            relations: ["feedback", "feedback.facultyMember"],
            where: {
                term: {
                    id: t.id,
                },
            },
        });

        const csForFaculty = classSchedules
            .filter(cs2 => Boolean(cs2.feedback))
            .filter(cs2 => cs2.feedback.facultyMember.id === fs.facultyMember.id);

        const subjectsForFaculty = _.uniqBy(csForFaculty.map(c => c.subject), "id");

        const assignedToSameSubject = subjectsForFaculty.includes(cs.subject);
        const prepsCanTake = subjectsForFaculty.length < MAXIMUM_PREPS || assignedToSameSubject;

        if (!prepsCanTake) {
            console.log("Unassignable because more preps than 2", prepsCanTake);
            return UNASSIGNABLE;
        } else if (assignedToSameSubject) {
            score += BASE_POINTS;
        }

        //
        // ─── Third consecutive special cases ────────────────────────────────────────────────────────────
        //

        const classHoursOfTheDays = csForFaculty
            .filter(cs2 => cs2.meetingDays === cs.meetingDays)
            .map(cs2 => cs2.meetingHours);

        const tmhb = twoMeetingHoursBefore(cs.meetingHours);

        const isThirdConsecutive =
            cs.meetingHours !== MeetingHours.AM_7_9 &&
            cs.meetingHours !== MeetingHours.AM_9_11 &&
            classHoursOfTheDays.includes(tmhb[0]) &&
            classHoursOfTheDays.includes(tmhb[1]);

        if (isThirdConsecutive) {
            return UNASSIGNABLE; // if it's the third consecutive, do not consider
        }

        //
        // ─── Schedule conflicting considerations ────────────────────────────────────────────────────────────
        //

        if (classHoursOfTheDays.includes(cs.meetingHours)) {
            return UNASSIGNABLE;
            // if the faculty is assigned to a class on this day, on the time slot
            // we cannot consider because people can't split themselves
        }

        //
        // ─── Preference consideration ────────────────────────────────────────────────────────────
        //

        if (availability && availability.isPreferred) {
            score += BASE_POINTS;
        }

        //
        // ─── Experience considerations ────────────────────────────────────────────────────────────
        //

        const timesTaught = await this.numberOfTimesTaught(fs.facultyMember, cs.subject);

        // Applies diminishing returns per times taught
        score += scoreWithDiminishingReturns(timesTaught, PRESETS.TIMES_TAUGHT); // Every time the subject was taught, that's 100 points

        return score;
    }

    public async makeSchedule(term: Term) {
        const css = await term.classSchedules
            // sort by meeting hours
            // third consecutive restriction check won't work without this sort
            .sort((csa, csb) => compareMeetingHours(csa.meetingHours, csb.meetingHours))
            // Only unassigned class schedules
            .filter(cs => !Boolean(cs.feedback));

        for (const cs of css) {
            console.log(`\nSearching for candidates for ${cs.section} ${cs.subject.name}`);

            const candidates = await this.candidatesForClassSchedule(cs, term);

            console.log(`Found ${candidates.length} candidates`);

            if (candidates.length === 0) {
                console.log(`For ${cs.section} ${cs.subject.name}, no one is good enough`);
                continue;
            }

            console.log("Candidates", candidates);

            cs.feedback = FacultyMemberClassFeedback.create({
                status: FeedbackStatus.Pending,
                facultyMember: candidates[0].faculty,
                classSchedule: cs,
            });

            console.log(
                `Class schedule ${cs.section} ${cs.subject.name} is being assigned ${
                    candidates[0].faculty.id
                } with a score of ${candidates[0].score}`,
            );

            await cs.feedback.save();
            await cs.save();
        }
    }
}
