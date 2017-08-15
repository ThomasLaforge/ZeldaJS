import {Position} from '../Position';

export abstract class Event {

    protected tile: Position;

    constructor(tile: Position) {
        this.tile = tile;
    }

    abstract execute(): boolean;

    getTile(): Position {
        return this.tile;
    }

    abstract shouldOccur(): boolean;

    abstract update(): void;
}
