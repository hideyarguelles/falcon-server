import { MeetingDays, MeetingHours } from "../../enums";

export interface ClassScheduleForm {
    meetingDays: MeetingDays;
    meetingHours: MeetingHours;
    room: string;
    course: string;
    section: string;
    subject: number;
}