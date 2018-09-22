import { Context } from "koa";
import { DegreeController } from "../controllers/faculty_subdocuments";
import { UserType } from "../enums";
import View from "../interfaces/view";
import { RequireAuthorization } from "../utils/require_authorization";

export class DegreeView extends View<DegreeController> {
    @RequireAuthorization([UserType.Clerk])
    add = async (ctx: Context): Promise<void> => {
        return;
    }

    @RequireAuthorization([UserType.Clerk])
    update = async (ctx: Context): Promise<void> => {
        return;
    }

    @RequireAuthorization([UserType.Clerk])
    remove = (ctx: Context): Promise<void> => {
        return;
    }
}
