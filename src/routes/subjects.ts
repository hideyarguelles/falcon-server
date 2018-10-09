import * as Router from "koa-router";
import SubjectView from "src/views/subject";
import SubjectController from "src/controllers/subject";

const subjectsView = new SubjectView(new SubjectController());
export default new Router()
    .prefix("/subjects")
    .get("/", subjectsView.getAll)
    .post("/", subjectsView.add)
    .get("/:subjectId", subjectsView.get)
    .put("/:subjectId", subjectsView.update);
