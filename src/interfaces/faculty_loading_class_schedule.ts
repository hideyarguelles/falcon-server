import { MeetingDays, MeetingHours, FacultyMemberType, SubjectCategory } from "../enums";
import Program from "../enums/program";

interface ClassScheduleItemFacultyMember {
    facultyId: number;
    firstName: string;
    lastName: string;
    pnuId: string;
    type: FacultyMemberType;
}

export default interface FacultyLoadingClassScheduleItem {
    classScheduleId: number;
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
