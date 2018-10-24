import { FacultyMemberType, MeetingDays, MeetingHours, SubjectCategory } from "../enums";
import Program from "../enums/program";

interface ClassScheduleItemFacultyMember {
    id: number;
    firstName: string;
    lastName: string;
    pnuId: string;
    type: FacultyMemberType;
}

export default interface FacultyLoadingClassScheduleItem {
    id: number;
    meetingDays: MeetingDays;
    meetingHours: MeetingHours;
    room: string;
    section: string;
    course: string;

    subjectName: string;
    subjectCode: string;
    subjectDescription: string;
    subjectCategory: SubjectCategory;
    subjectProgram: Program;

    facultyMember?: ClassScheduleItemFacultyMember;
}
