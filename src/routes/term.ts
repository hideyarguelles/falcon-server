import * as Router from "koa-router";
import TermView from "../views/term";
import TermController from "../controllers/term";

const termView = new TermView(new TermController());
export default new Router()
    .prefix("/terms")
    .get("/", termView.getAll)
    .get("/:termId", termView.get);
