import { ClassSchedule, TimeConstraint } from "../entities";
import { FacultyMemberType } from "../enums";
import LoadAmountStatus from "../enums/load_amount_status";

export interface OngoingSubdocumentItem {
    title: string;
    type: string;
}

export default interface FacultyLoadingFacultyMemberItem {
    facultyId: number;
    firstName: string;
    lastName: string;
    pnuId: string;
    type: FacultyMemberType;

    loadAmountStatus: LoadAmountStatus;

    classSchedules: ClassSchedule[];
    timeConstraints: TimeConstraint[];
    
    hasExternalLoad: boolean;
    ongoingSubdocuments: OngoingSubdocumentItem[];
}
