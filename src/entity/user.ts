import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, FindOneOptions } from "typeorm";
import { Length, IsEmail, IsNotEmpty } from "class-validator";
import { UserType } from "../enum";
import * as bcrypt from "bcryptjs";

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    firstName: string;

    @Column()
    @IsNotEmpty()
    lastName: string;

    @Column()
    @IsNotEmpty()
    secret: string;

    @Column()
    @IsNotEmpty()
    passwordIsTemporary: boolean;

    @Column("enum", { enum: UserType })
    authorization: UserType;

    @Column()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    comparePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.secret);
    }

    static findByEmail(email: string): Promise<User | undefined> {
        return this.findOne({
            where: { email },
        });
    }
}
