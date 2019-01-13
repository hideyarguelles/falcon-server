import * as _ from "lodash";
import { ClassSchedule, FacultyMember, TimeConstraint } from "../entities";
import { FacultyMemberType, FeedbackStatus } from "../enums";
import FacultySubdocumentEntity from "../interfaces/faculty_subdocument";
import MeetingHours, { twoMeetingHoursBefore } from "../enums/meeting_hours";

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
        ]);
    }

    async calculateSubdocumentScore() {
        function associatedCount(subdocuments: FacultySubdocumentEntity[]) {
            const program = this.classSchedule.subject.program;
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
