import { MeetingDays, MeetingHours } from "../../enums";

export interface ChildClassScheduleForm {
    meetingDays: MeetingDays;
    meetingHours: MeetingHours;
    room: string;
    course: string;
    section: string;
    forAdjunct: boolean;
}

export interface ParentClassSchedulesForm {
    subjectId: number;
    classSchedules: ChildClassScheduleForm[];
}
