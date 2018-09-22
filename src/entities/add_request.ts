import { IsNotEmpty, IsEnum } from "class-validator";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ChangeRequestStatus } from "../enums";
import {
    Degree,
    ExtensionWork,
    InstructionalMaterial,
    Presentation,
    Recognition,
} from "./faculty_subdocuments";

@Entity()
class AddRequest extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("enum", { enum: ChangeRequestStatus })
    @IsEnum(ChangeRequestStatus)
    status: ChangeRequestStatus;

    @Column({ nullable: true })
    rejectionReason: string;

    @Column()
    @IsNotEmpty()
    submittedDate: string;
}

//
// ─── Implementations ─────────────────────────────────────────────────────────────
//

@Entity()
export class DegreeAddRequest extends Degree {
    @Column((type?: any) => AddRequest)
    addRequest: AddRequest;
}

@Entity()
export class RecognitionAddRequest extends Recognition {
    @Column((type?: any) => AddRequest)
    addRequest: AddRequest;
}

@Entity()
export class PresentationAddRequest extends Presentation {
    @Column((type?: any) => AddRequest)
    addRequest: AddRequest;
}

@Entity()
export class InstructionalMaterialAddRequest extends InstructionalMaterial {
    @Column((type?: any) => AddRequest)
    addRequest: AddRequest;
}

@Entity()
export class ExtensionWorkAddRequest extends ExtensionWork {
    @Column((type?: any) => AddRequest)
    addRequest: AddRequest;
}
