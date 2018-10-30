import { Sex, FacultyMemberType, ActivityType } from "../enums";
import {
    Presentation,
    Recognition,
    InstructionalMaterial,
    ExtensionWork,
    Degree,
} from "../entities";

export default interface FacultyProfile {
    id: number;
    sex: Sex;
    type: FacultyMemberType;
    activity: ActivityType;
    birthDate: string;
    pnuId: string;

    // User fields
    firstName: string;
    lastName: string;
    email: string;

    // Relations
    presentations?: Presentation[];
    recognitions?: Recognition[];
    instructionalMaterials?: InstructionalMaterial[];
    extensionWorks?: ExtensionWork[];
    degrees?: Degree[];

    taughtSubjects?: { [key: string]: number };
}
