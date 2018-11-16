import * as _ from "lodash";
import {
    ClassSchedule,
    Degree,
    ExtensionWork,
    FacultyMember,
    FacultyMemberClassFeedback,
    InstructionalMaterial,
    Presentation,
    Recognition,
    Term,
} from "../entities";
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

class FacultyScore {
    public facultyMember: FacultyMember;

    constructor(fm: FacultyMember) {
        this.facultyMember = fm;
    }

    calculateSubdocumentScore(program: Program): number {
        let score = 0;
        const subdocuments: FacultySubdocumentEntity[] = [
            ...this.facultyMember.degrees,
            ...this.facultyMember.recognitions,
            ...this.facultyMember.presentations,
            ...this.facultyMember.instructionalMaterials,
            ...this.facultyMember.extensionWorks,
        ];

        subdocuments.forEach(s => {
            console.log("Typeof s", typeof s);
            if (s.associatedPrograms.includes(program)) {
                switch (typeof s) {
                    case Degree.name:
                        score += 250;
                        return;
                    case InstructionalMaterial.name:
                        score += 200;
                        return;
                    case Presentation.name:
                        score += 150;
                        return;
                    case ExtensionWork.name:
                        score += 100;
                        return;
                    case Recognition.name:
                        score += 50;
                        return;
                }
            }
        });
        return score;
    }

    get rankScore() {
        switch (this.facultyMember.type) {
            case FacultyMemberType.Instructor:
                return 350;
            case FacultyMemberType.AssistantProfessor:
                return 300;
            case FacultyMemberType.AssociateProfessor:
                return 250;
            case FacultyMemberType.FullProfessor:
                return 200;
            case FacultyMemberType.Adjunct:
                return 150;
            case FacultyMemberType.PartTime:
                return 100;
            default:
                return 0;
        }
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
        return await ClassSchedule.count({
            where: {
                feedback: {
                    facultyMember: {
                        id: fm.id,
                    },
                },
                term: {
                    id: t.id,
                },
            },
        });
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
        const availability = t.timeConstraints
            .filter(tc => tc.facultyMember.id === fs.facultyMember.id)
            .find(tc => cs.meetingDays === tc.meetingDays && cs.meetingHours === tc.meetingHours);

        if (!availability) {
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

        const classHoursOfTheDay = csForFaculty
            .filter(cs2 => cs2.meetingDays === availability.meetingDays)
            .map(cs2 => cs2.meetingHours);

        const isThirdConsecutive =
            cs.meetingHours !== MeetingHours.AM_7_9 &&
            cs.meetingHours !== MeetingHours.AM_9_11 &&
            classHoursOfTheDay.every(
                cohtd => !twoMeetingHoursBefore(cs.meetingHours).includes(cohtd),
            );

        if (isThirdConsecutive) {
            console.log("THIRD CONSECUTIVE YO");
            return UNASSIGNABLE; // if it's the third consecutive, do not consider
        }

        //
        // ─── Schedule conflicting considerations ────────────────────────────────────────────────────────────
        //

        if (classHoursOfTheDay.includes(cs.meetingHours)) {
            console.log("CONFLICTING YO");
            return UNASSIGNABLE;
            // if the faculty is assigned to a class on this day, on the time slot
            // we cannot consider because people can't split themselves
        } else {
            console.log("Class hours", classHoursOfTheDay, cs.meetingHours);
        }

        //
        // ─── Preference consideration ────────────────────────────────────────────────────────────
        //

        if (availability.isPreferred) {
            score += BASE_POINTS;
        }

        //
        // ─── Experience considerations ────────────────────────────────────────────────────────────
        //

        const timesTaught = await this.numberOfTimesTaught(fs.facultyMember, cs.subject);
        score *= timesTaught * BASE_POINTS; // Every time the subject was taught, that's 100 points

        return score;
    }

    public async makeSchedule(term: Term) {
        const css = await term.classSchedules
            // sort by meeting hours
            // third consecutive restriction check won't work without this sort
            .sort((csa, csb) => compareMeetingHours(csa.meetingHours, csb.meetingHours))
            // Only unassigned class schedules
            .filter(cs => !Boolean(cs.feedback));

        console.log(css.length);

        for (const cs of css) {
            const candidates = await this.candidatesForClassSchedule(cs, term);

            if (candidates.length === 0) {
                console.log(`For ${cs.section} ${cs.subject.name}, no one is good enough`);
                return;
            }

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
