import { ClassSchedule, TimeConstraint } from "../entities";
import { FacultyMemberType } from "../enums";

export default interface FacultyLoadingFacultyMemberItem {
    facultyId: number;
    firstName: string;
    lastName: string;
    pnuId: string;
    type: FacultyMemberType;
    
    classSchedules: [ClassSchedule];
    timeConstraints: [TimeConstraint];
}
