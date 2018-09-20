export default class EntityNotFoundError extends Error {
    entityId: number;
    entityClassName: string;

    constructor(id: number, name: string) {
        super(`Could not find ${name} of id ${id}`);
        this.entityId = id;
        this.entityClassName = name;
        
        Object.setPrototypeOf(this, EntityNotFoundError.prototype);
    }
}
