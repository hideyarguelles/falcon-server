import * as Router from "koa-router";
import FacultyMemberController from "../controllers/faculty_member";
import FacultyMemberView from "../views/faculty_member";

const facultyMemberView = new FacultyMemberView(new FacultyMemberController());
export default new Router()
    .prefix("/faculty-members")
    .get("/", facultyMemberView.getAll)
    .get("/current", facultyMemberView.getCurrentFaculty)
    .post("/", facultyMemberView.add)
    .get("/:facultyId", facultyMemberView.get)
    .put("/:facultyId", facultyMemberView.update);
