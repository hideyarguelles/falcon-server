import FacultyMemberType, { FacultyMemberTypeLoadingLimit } from "./faculty_member_type";

export enum LoadAmountStatus {
    Unassigned = "Unassigned",
    Underloaded = "Underloaded",
    Adequate = "Adequate",
    Extra = "Extra",
    Max = "Max",
    Overloaded = "Overloaded",
}

export function getStatusForLoadAmount(
    facultyMemberType: FacultyMemberType,
    loadAmount: number,
): LoadAmountStatus {
    const loadingLimit = FacultyMemberTypeLoadingLimit.get(facultyMemberType)!;

    if (loadAmount === 0) {
        return LoadAmountStatus.Unassigned;
    }

    if (loadAmount < loadingLimit.minimum) {
        return LoadAmountStatus.Underloaded;
    }

    if (loadAmount < loadingLimit.extra) {
        return LoadAmountStatus.Adequate;
    }

    if (loadAmount < loadingLimit.maximum) {
        return LoadAmountStatus.Extra;
    }

    if (loadAmount === loadingLimit.maximum) {
        return LoadAmountStatus.Max;
    }

    return LoadAmountStatus.Overloaded;
}

export default LoadAmountStatus;
