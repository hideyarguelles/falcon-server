import { Context } from "koa";
import ClassScheduleController from "../controllers/class_schedule";
import { UserType } from "../enums";
import View from "../interfaces/view";
import { RequireAuthorization } from "../utils/require_authorization";

export default class ClassScheduleView extends View<ClassScheduleController> {
    @RequireAuthorization([UserType.Clerk, UserType.Dean, UserType.AssociateDean])
    remove = async (ctx: Context): Promise<void> => {
        const { classScheduleId } = ctx.params;
        await this.controller.remove(classScheduleId);
    };
}
