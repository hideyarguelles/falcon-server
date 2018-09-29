import { Sex, FacultyMemberType, ActivityType } from "../../enums";
import { User } from "..";

export interface FacultyMemberForm {
    sex: Sex;
    type: FacultyMemberType;
    activity: ActivityType;
    birthDate: string;
    user: User;
}
