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
    .get("/:termId/my-schedules", termView.getMySchedule)
    .post("/:termId/my-schedules/time-constraints", termView.setTimeConstraints)
    .post("/:termId/my-schedules/feedback", termView.setFeedback)
    .post("/:termId/my-schedules/notice", termView.setNotice)
    .get("/:termId/class-schedules", termView.getClassSchedules)
    .post("/:termId/class-schedules", termView.addClassSchedule)
    .get("/:termId/class-schedules/:classScheduleId/", termView.getRecommendedFaculties)
    .post("/:termId/class-schedules/:classScheduleId/set-faculty/:facultyId", termView.setFaculty)
    .delete("/:termId/notices/:noticeId", termView.removeNotice)
    .post("/auto-assign", termView.autoAssign)
    .post("/advance", termView.advance)
    .post("/regress", termView.regress);
