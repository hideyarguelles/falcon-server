import Controller from "./controller";

export default abstract class View<C extends Controller> {
    controller: C;

    constructor(controller: C) {
        this.controller = controller;
    }
}
