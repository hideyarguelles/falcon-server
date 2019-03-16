import * as Router from "koa-router";
import SubjectView from "../views/subject";
import SubjectController from "../controllers/subject";

const subjectsView = new SubjectView(new SubjectController());
export default new Router()
    .prefix("/subjects")
    .get("/", subjectsView.getAll)
    .post("/", subjectsView.add)
    .get("/courses", subjectsView.getCourses)
    .get("/:subjectId", subjectsView.get)
    .put("/:subjectId", subjectsView.update);
