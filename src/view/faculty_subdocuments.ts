import { Context } from "koa";
import { DegreeController } from "../controller/faculty_subdocuments";
import { UserType } from "../enum";
import View from "../interfaces/view";
import { requireAuthorization } from "../utils/require_authorization";

export class DegreeView extends View<DegreeController> {
    @requireAuthorization([UserType.Clerk])
    add = async (ctx: Context): Promise<void> => {
        return;
    }

    @requireAuthorization([UserType.Clerk])
    update = async (ctx: Context): Promise<void> => {
        return;
    }

    @requireAuthorization([UserType.Clerk])
    remove = (ctx: Context): Promise<void> => {
        return;
    }
}
