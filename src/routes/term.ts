import * as Router from "koa-router";
import TermController from "../controllers/term";
import TermView from "../views/term";

const termView = new TermView(new TermController());
export default new Router()
    .prefix("/terms")
    .get("/", termView.getAll)
    .post("/", termView.add)
    .get("/:termId", termView.get)
    .get("/:termId/faculty-members", termView.getFacultyMembers)
    .get("/:termId/class-schedules", termView.getClassSchedules)
    .post("/:termId/class-schedules", termView.addClassSchedule);
