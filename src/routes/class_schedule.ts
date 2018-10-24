import * as Router from "koa-router";
import ClassScheduleView from "../views/class_schedule";
import ClassScheduleController from "../controllers/class_schedule";

const csView = new ClassScheduleView(new ClassScheduleController());
export default new Router().prefix("/class-schedules").delete("/:classScheduleId", csView.remove);
