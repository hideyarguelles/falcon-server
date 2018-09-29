import * as Router from "koa-router";
import { FacultyMemberView } from "../views";
import { FacultyMemberController } from "../controllers";

const facultyMemberView = new FacultyMemberView(new FacultyMemberController());
export default new Router()
    .prefix("/faculty-members")
    .get("/", facultyMemberView.getAll)
    .post("/", facultyMemberView.add)
    .get("/:facultyId", facultyMemberView.get)
    .put("/:facultyId", facultyMemberView.update);
