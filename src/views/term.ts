import * as status from "http-status-codes";
import { Context } from "koa";
import TermController from "../controllers/term";
import View from "../interfaces/view";
import FacultyMemberController from "../controllers/faculty_member";

export default class TermView extends View<TermController> {
    getAll = async (ctx: Context): Promise<void> => {
        await this.controller.getAll().then(t => {
            ctx.status = status.OK;
            ctx.body = t;
        });
    };

    get = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        await this.controller.get(termId).then(t => {
            ctx.status = status.OK;
            ctx.body = t;
        });
    };

    add = async (ctx: Context): Promise<void> => {
        const form = ctx.request.body;
        await this.controller.add(form).then(t => {
            ctx.status = status.CREATED;
            ctx.body = t;
        });
    };

    addClassSchedule = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        const form = ctx.request.body;
        await this.controller.addClassSchedule(termId, form).then(cs => {
            ctx.status = status.CREATED;
            ctx.body = cs;
        });
    };

    getFacultyMembers = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        await this.controller.getFacultyMembers(termId).then(fm => {
            ctx.status = status.OK;
            ctx.body = fm;
        });
    };

    getClassSchedules = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        await this.controller.getClassSchedules(termId).then(cs => {
            ctx.status = status.OK;
            ctx.body = cs;
        });
    };

    getMySchedule = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        const { user } = ctx.state;
        await this.controller.getMySchedule(termId, user).then(ms => {
            ctx.status = status.OK;
            ctx.body = ms;
        });
    };

    setTimeConstraints = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        const { user } = ctx.state;
        const form = ctx.request.body;
        await this.controller.setMyTimeConstraints(termId, user, form).then(tcs => {
            ctx.status = status.CREATED;
            ctx.body = tcs;
        });
    };

    autoAssign = async (ctx: Context): Promise<void> => {
        await this.controller.autoAssign().then(cs => {
            ctx.status = status.OK;
            ctx.body = cs;
        });
    };

    advance = async (ctx: Context): Promise<void> => {
        await this.controller.advance().then(t => {
            ctx.status = status.OK;
            ctx.body = t;
        });
    };

    regress = async (ctx: Context): Promise<void> => {
        await this.controller.regress().then(t => {
            ctx.status = status.OK;
            ctx.body = t;
        });
    };

    setFeedback = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        const { user } = ctx.state;
        const feedback = ctx.request.body;

        await this.controller.setFeedback(termId, feedback, user).then(ms => {
            ctx.status = status.OK;
            ctx.body = ms;
        });
    };

    getRecommendedFaculties = async (ctx: Context): Promise<void> => {
        const { classScheduleId, termId } = ctx.params;
        const recommendations = await this.controller.getRecommendedFaculties(
            classScheduleId,
            termId,
        );

        let allFaculties = await new FacultyMemberController().getAllActiveFaculties();
        allFaculties = allFaculties.filter(
            f => recommendations.findIndex(r => r.id === f.id) === -1,
        );

        ctx.status = status.OK;
        ctx.body = {
            recommendations,
            allFaculties,
        };
    };

    setFaculty = async (ctx: Context) => {
        const { classScheduleId, termId, facultyId } = ctx.params;
        await this.controller.setFaculty(termId, classScheduleId, facultyId).then(cs => {
            ctx.status = status.OK;
            ctx.body = cs;
        });
    };

    // getNotices = async (ctx: Context) => {
    //     const { termId } = ctx.params;
    //     await this.controller.getNotices(termId).then(n => {
    //         ctx.status = status.OK;
    //         ctx.body = n;
    //     });
    // };

    // setNotice = async (ctx: Context) => {
    //     const { termId } = ctx.params;
    //     const { user } = ctx.state;
    //     const { message } = ctx.request.body;
    //     await this.controller.setNotice(termId, user, message).then(n => {
    //         ctx.status = status.OK;
    //         ctx.body = n;
    //     });
    // };
}
