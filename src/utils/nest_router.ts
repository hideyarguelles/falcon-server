import * as Router from "koa-router";

export const nestRouter = (parent: Router, child: Router | Router[]): void => {
    const nestToParent = (child: Router) => parent.use(child.routes()); 
    if (Array.isArray(child)) {
        child.forEach((r: Router) => nestToParent(r));
    } else {
        nestToParent(child);
    }
};
