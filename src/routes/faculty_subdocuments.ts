import * as Router from "koa-router";
import {
    DegreeController,
    RecognitionController,
    PresentationController,
    InstructionalMaterialController,
    ExtensionWorkController,
} from "../controllers/faculty_subdocuments";
import {
    DegreeView,
    RecognitionView,
    FacultySubdocumentView,
    PresentationView,
    InstructionalMaterialView,
    ExtensionWorkView,
} from "../views/faculty_subdocuments";
import { nestRouter } from "../utils/nest_router";

const subdocumentRouter = new Router().prefix("/faculty-subdocuments");

const makeRouterForSubdocument = (prefix: string, view: FacultySubdocumentView<any>) =>
    new Router()
        .prefix(prefix)
        .post("/", view.add)
        .put(`/:${view.paramId}`, view.update)
        .put(`/:${view.paramId}/toggle-ongoing`, view.toggleOngoing)
        .delete(`/:${view.paramId}`, view.remove);

const degreeView = new DegreeView(new DegreeController());
const degreeRouter = makeRouterForSubdocument("/degrees", degreeView);

const recognitionView = new RecognitionView(new RecognitionController());
const recognitionRouter = makeRouterForSubdocument("/recognitions", recognitionView);

const presentationView = new PresentationView(new PresentationController());
const presentationRouter = makeRouterForSubdocument("/presentations", presentationView);

const instructionalMaterialView = new InstructionalMaterialView(
    new InstructionalMaterialController(),
);
const instructionalMaterialRouter = makeRouterForSubdocument(
    "/instructional-materials",
    instructionalMaterialView,
);

const extensionWorkView = new ExtensionWorkView(new ExtensionWorkController());
const extensionWorkRouter = makeRouterForSubdocument("/extension-works", extensionWorkView);

nestRouter(subdocumentRouter, [
    degreeRouter,
    recognitionRouter,
    presentationRouter,
    instructionalMaterialRouter,
    extensionWorkRouter,
]);

export default subdocumentRouter;
