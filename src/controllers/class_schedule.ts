import Controller from "../interfaces/controller";
import { ClassSchedule } from "../entities";
import EntityNotFoundError from "../errors/not_found";

export default class ClassScheduleController implements Controller {
    async findById(id: number): Promise<ClassSchedule> {
        const cs = await ClassSchedule.findOne(id);
        if (!cs) {
            throw new EntityNotFoundError(`Could not find ${ClassSchedule.name} of id ${id}`);
        }
        return cs;
    }

    async remove(id: number): Promise<void> {
        const entity = await this.findById(id);
        await entity.remove();
    }
}
