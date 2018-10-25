import { User } from "../entities";
import Controller from "../interfaces/controller";

export default class UserController implements Controller {
    async signIn(email: string, password: string): Promise<User> {
        if (!email || !password) {
            throw new Error("email and password is required");
        }

        const user = await User.findByEmail(email);
        const isValidPassword = user && (await user.comparePassword(password));

        if (!user || !isValidPassword) {
            throw new Error("Invalid credentials");
        }

        return user;
    }

    async setPassword(user: User, form: any): Promise<void> {
        const { password } = form;
        await user.setPassword(password);
        await user.save();
    }
}
