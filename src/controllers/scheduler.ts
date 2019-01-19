import * as _ from "lodash";
import {
    ClassSchedule,
    FacultyMember,
    FacultyMemberClassFeedback,
    Subject,
    Term,
    TimeConstraint,
} from "../entities";
import { FacultyMemberType, FeedbackStatus } from "../enums";
import { FacultyMemberTypeLoadingLimit } from "../enums/faculty_member_type";
import MeetingHours, { compareMeetingHours, twoMeetingHoursBefore } from "../enums/meeting_hours";
import FacultySubdocumentEntity from "../interfaces/faculty_subdocument";

const MAXIMUM_PREPS = 2;
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

class FacultyClassScheduleScore {
    public facultyMember: FacultyMember;
    public classSchedule: ClassSchedule;
    private classSchedules: ClassSchedule[];
    public availabilities: TimeConstraint[];
    public pros: string[] = [];
    public cons: string[] = [];
    public errors: string[] = [];
    public score: number = 0;

    get isAssignable() {
        return this.errors.length === 0;
    }

    constructor(
        fm: FacultyMember,
        cs: ClassSchedule,
        css: ClassSchedule[],
        availabilities: TimeConstraint[],
    ) {
        this.facultyMember = fm;
        this.classSchedule = cs;
        this.classSchedules = css;
        this.availabilities = availabilities;
    }

    get classSchedulesForFaculty() {
        return this.classSchedules
            .filter(cs => Boolean(cs.feedback))
            .filter(cs => cs.feedback.facultyMember.id === this.facultyMember.id);
    }

    async calculateScore() {
        await Promise.all([
            this.calculateSubdocumentScore(),
            this.calculateRankScore(),
            this.calculatePreparations(),
            this.calculateScheduleCompatibility(),
            this.calculateExperience(),
            this.calculateAvailability(),
        ]);
    }

    async calculateSubdocumentScore() {
        const associatedCount = (subdocuments: FacultySubdocumentEntity[]) => {
            const program = this.classSchedule.subject.program;
            return subdocuments.filter(s => s.associatedPrograms.includes(program)).length;
        };

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

        this.score +=
            scoreWithDiminishingReturns(degreeCount, PRESETS.DEGREE) +
            scoreWithDiminishingReturns(extensionWorkCount, PRESETS.EXTENSION_WORKS) +
            scoreWithDiminishingReturns(presentationCount, PRESETS.PRESENTATIONS) +
            scoreWithDiminishingReturns(
                instructionalMaterialCount,
                PRESETS.INSTRUCTIONAL_MATERIALS,
            ) +
            scoreWithDiminishingReturns(recognitionCount, PRESETS.RECOGNITIONS);
    }

    async calculateRankScore() {
        let rankScore = 0;
        switch (this.facultyMember.type) {
            case FacultyMemberType.Instructor:
                rankScore += BASE_POINTS;
            case FacultyMemberType.AssistantProfessor:
                rankScore += BASE_POINTS;
            case FacultyMemberType.AssociateProfessor:
                rankScore += BASE_POINTS;
            case FacultyMemberType.FullProfessor:
                rankScore += BASE_POINTS;
            case FacultyMemberType.PartTime:
                rankScore += BASE_POINTS;
        }
        this.score += rankScore;
    }

    async calculatePreparations() {
        const subjectsForFaculty = _.uniqBy(
            this.classSchedulesForFaculty.map(c => c.subject),
            "id",
        );

        const assignedToSameSubject = subjectsForFaculty.includes(this.classSchedule.subject);
        const prepsCanTake = subjectsForFaculty.length < MAXIMUM_PREPS || assignedToSameSubject;

        if (!prepsCanTake) {
            this.cons.push(`Already assigned to ${subjectsForFaculty.length} subjects`);
        }

        if (assignedToSameSubject) {
            this.pros.push("Already assigned to a class with this subject");
        }
    }

    async calculateScheduleCompatibility() {
        const cs = this.classSchedule;

        const classHoursOfTheDays = this.classSchedulesForFaculty
            .filter(cs2 => cs2.meetingDays === cs.meetingDays)
            .map(cs2 => cs2.meetingHours);

        const tmhb = twoMeetingHoursBefore(cs.meetingHours);

        const isThirdConsecutive =
            cs.meetingHours !== MeetingHours.AM_7_9 &&
            cs.meetingHours !== MeetingHours.AM_9_11 &&
            classHoursOfTheDays.includes(tmhb[0]) &&
            classHoursOfTheDays.includes(tmhb[1]);

        if (!isThirdConsecutive) {
            this.errors.push("This class is the third consecutive");
        }

        if (classHoursOfTheDays.includes(cs.meetingHours)) {
            this.errors.push(
                "This class is found to be conflicting with another class of this time slot",
            );
        }
    }

    async calculateExperience() {
        const timesTaught = await ClassSchedule.count({
            where: {
                subject: {
                    id: this.classSchedule.subject.id,
                },
                feedback: {
                    facultyMember: {
                        id: this.facultyMember.id,
                    },
                    status: FeedbackStatus.Accepted,
                },
            },
        });

        if (timesTaught > 0) {
            this.pros.push(`Has taught this subject ${timesTaught} times before`);
        }

        this.score += scoreWithDiminishingReturns(timesTaught, PRESETS.TIMES_TAUGHT);
    }

    async calculateAvailability() {
        const availability = this.availabilities.find(
            tc =>
                this.classSchedule.meetingDays === tc.meetingDays &&
                this.classSchedule.meetingHours === tc.meetingHours,
        );

        // Faculty members that did not submit any availability information is automatically available every time
        const isAvailable = this.availabilities.length === 0 || availability !== undefined;

        if (!isAvailable) {
            // console.log("Unassignable because is not available or preferred");
            this.cons.push("Not available at this time slot");
        } else if (availability && availability.isPreferred) {
            this.score += BASE_POINTS;
            this.pros.push("The time slot of this class is preferred");
        }
    }
}

export async function candidatesForClassSchedule(
    cs: ClassSchedule,
    term: Term,
): Promise<FacultyClassScheduleScore[]> {
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
    let fullTimeFacultiesHaveMinimum = true;

    for (const f of fullTimeFaculties) {
        const loadCount = await numberOfAssignments(f, term);
        const loadingLimit = FacultyMemberTypeLoadingLimit.get(f.type)!;

        // Everyone must be at least minimum
        if (loadCount < loadingLimit.minimum) {
            fullTimeFacultiesHaveMinimum = false;
            break;
        }
    }

    if (!fullTimeFacultiesHaveMinimum) {
        faculties = fullTimeFaculties;
    }

    //
    // ─── Calculate scores ────────────────────────────────────────────────────────────
    //
    const candidates = await Promise.all(
        faculties.map(async fs => {
            const css = term.classSchedules;
            const availabilties = term.timeConstraints.filter(tc => tc.facultyMember.id === fs.id);
            const fcss = new FacultyClassScheduleScore(fs, cs, css, availabilties);
            await fcss.calculateScore();
            return fcss;
        }),
    );

    // Scort highest to lowest
    return candidates
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

export async function numberOfTimesTaught(fm: FacultyMember, s: Subject) {
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

export async function numberOfAssignments(fm: FacultyMember, t: Term) {
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

export async function makeSchedule(term: Term) {
    const css = await term.classSchedules
        // sort by meeting hours
        // third consecutive restriction check won't work without this sort
        .sort((csa, csb) => compareMeetingHours(csa.meetingHours, csb.meetingHours))
        // Only unassigned class schedule
        .filter(cs => !Boolean(cs.feedback))
        // Only non-for-adjuncts
        .filter(cs => !cs.forAdjunct);

    for (const cs of css) {
        console.log(`\nSearching for candidates for ${cs.section} ${cs.subject.name}`);

        let candidates = await candidatesForClassSchedule(cs, term);

        // We can only assign candidates without errors in compatibility or cons
        candidates = candidates.filter(c => c.errors.length === 0 && c.cons.length === 0);

        console.log(`Found ${candidates.length} candidates`);

        if (candidates.length === 0) {
            console.log(`For ${cs.section} ${cs.subject.name}, no one is good enough`);
            continue;
        }

        console.log("Candidates", candidates);

        cs.feedback = FacultyMemberClassFeedback.create({
            status: FeedbackStatus.Pending,
            facultyMember: candidates[0].facultyMember,
            classSchedule: cs,
        });

        console.log(
            `Class schedule ${cs.section} ${cs.subject.name} is being assigned ${
                candidates[0].facultyMember.id
            } with a score of ${candidates[0].score}`,
        );

        await cs.feedback.save();
        await cs.save();
    }
}
