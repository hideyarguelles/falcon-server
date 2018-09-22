import * as Router from "koa-router";
import { FacultyMemberView } from "../views";
import { FacultyMemberController } from "../controllers";

const facultyMemberView = new FacultyMemberView(new FacultyMemberController());
export default new Router()
    .prefix("/faculty")
    .get("/", facultyMemberView.getAll)
    .post("/", facultyMemberView.add)
    .get("/:id", facultyMemberView.get)
    .put("/:id", facultyMemberView.update);
