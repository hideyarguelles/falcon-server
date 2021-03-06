import * as bcrypt from "bcryptjs";
import { IsEmail, IsEnum, IsNotEmpty } from "class-validator";
import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { UserType } from "../enums";
import { UserForm } from "./forms/user";

const SALT_ROUNDS = 10;

@Entity()
export default class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    firstName: string;

    @Column()
    @IsNotEmpty()
    lastName: string;

    @Column({ select: false })
    secret: string;

    @Column({ select: false })
    @IsNotEmpty()
    passwordIsTemporary: boolean;

    @Column("enum", { enum: UserType, select: false })
    @IsEnum(UserType)
    authorization: UserType;

    @Column()
    @Index({ unique: true })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    //
    // ─── Functions ───────────────────────────────────────────────────────────────────────────
    //

    comparePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.secret);
    }

    static findByEmail(email: string): Promise<User | undefined> {
        return this.findOne({
            select: [
                "id",
                "firstName",
                "lastName",
                "secret",
                "passwordIsTemporary",
                "authorization",
                "email",
            ],
            where: { email },
        });
    }

    static createFromForm(form: UserForm): Promise<User> {
        return new Promise((resolve, reject) =>
            bcrypt.hash(form.password, SALT_ROUNDS, (err, hash) => {
                if (err) {
                    reject(err);
                    return;
                }

                const user = User.create({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    passwordIsTemporary: true,
                    authorization: UserType.Faculty,
                    email: form.email,
                    secret: hash,
                });

                resolve(user);
            }),
        );
    }

    setPassword(newPassword: string): Promise<User> {
        return new Promise((resolve, reject) =>
            bcrypt.hash(newPassword, SALT_ROUNDS, (err, hash) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.secret = hash;
                resolve(this);
            }),
        );
    }
}
