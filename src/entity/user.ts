import * as bcrypt from "bcryptjs";
import { IsEmail, IsNotEmpty, IsEnum } from "class-validator";
import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { UserType } from "../enum";

const SALT_ROUNDS = 10;

export interface UserForm {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordIsTemporary: boolean;
}

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

    @Column()
    @IsNotEmpty()
    secret: string;

    @Column()
    @IsNotEmpty()
    passwordIsTemporary: boolean;

    @Column("enum", { enum: UserType })
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
                    passwordIsTemporary: form.passwordIsTemporary,
                    authorization: UserType.Faculty,
                    email: form.email,
                    secret: hash,
                });

                resolve(user);
            }),
        );
    }
}
