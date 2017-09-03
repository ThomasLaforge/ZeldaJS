import { Actor, ActorData } from './Actor';
import { Constants } from './Constants';
import { Enemy } from './Enemy';
import { EnemyGroup, EnemyGroupData, EnemyInfo } from './EnemyGroup';
import { Map } from './Map';
import { InstanceLoader } from './InstanceLoader';
import { Position } from './Position';
import { Event, EventData } from './event/Event';
import { Projectile } from './Projectile';
import { Link } from './Link';
import { Tileset } from './Tileset';
import { ZeldaGame } from './ZeldaGame';
import { Sword } from './Sword';
import EventLoader from './editor/event-loader';
declare let game: ZeldaGame;

export class Screen {

    private _parent: Map;
    private _tiles: number[][];
    private _actors: Actor[];
    enemyGroup: EnemyGroup | undefined | null;
    private flattenedEnemyGroup: EnemyGroup; // TODO: Can we flatten iff we know we're in the game, not the editor?
    private _firstTimeThrough: boolean;
    events: Event<any>[];
    music?: string | null;

    constructor(parent: Map, enemyGroup?: EnemyGroup | null, tiles?: number[][]) {

        this._parent = parent;

        if (!tiles) {
            tiles = Screen._createEmptyTiles();
        }
        this._tiles = tiles;

        this._actors = [];
        this._setEnemyGroup(enemyGroup);
        this._firstTimeThrough = true;
        this.events = [];
    }

    addActor(actor: Actor) {
        this._actors.push(actor);
    }

    private static _createEmptyTiles(): number[][] {
        const tiles: number[][] = [];
        for (let row: number = 0; row < Constants.SCREEN_ROW_COUNT; row++) {
            const rowData: number[] = [];
            for (let col: number = 0; col < Constants.SCREEN_COL_COUNT; col++) {
                rowData.push(0);
            }
            tiles.push(rowData);
        }
        return tiles;
    }

    enter() {

        if (this.enemyGroup) {

            if (this._firstTimeThrough) {
                this.enemyGroup.enemies.forEach((enemyInfo: EnemyInfo) => {
                    const count: number = enemyInfo.count || 1;
                    for (let i: number = 0; i < count; i++) {
                        const enemy: Enemy = InstanceLoader.create<Enemy>(enemyInfo.type, ...enemyInfo.args!);
                        enemy.setLocationToSpawnPoint(this);
                        this._actors.push(enemy);
                    }
                });
                //this.enemyGroup.clear();
                this._firstTimeThrough = false;
            }

            else {

                // First N enemies in the enemy list respawn; see:
                // https://www.gamefaqs.com/boards/563433-the-legend-of-zelda/73732540?jumpto=9

                const count: number = this._actors.length; // Assuming here that "actors" is remaining enemies
                this._actors = [];
                for (let i: number = 0; i < count; i++) {
                    const enemyInfo: EnemyInfo = this.flattenedEnemyGroup.enemies[i];
                    const enemy: Enemy = InstanceLoader.create<Enemy>(enemyInfo.type, ...enemyInfo.args!);
                    enemy.setLocationToSpawnPoint(this);
                    this._actors.push(enemy);
                }
            }
        }
    }

    exit() {

        // Clear out any "temporary" actors, such as projectiles
        this._actors = this._actors.filter((actor: Actor): boolean => {
            return !(actor instanceof Projectile);
        });
        //this._actors = [];
    }

    fromJson(json: ScreenData): Screen {

        this._tiles = json.tiles;
        this._actors.length = 0;
        //json.actors.forEach((actorData: ActorData) => {
        //    this._actors.push(new Actor().fromJson(actorData));
        //});
        this._setEnemyGroup(new EnemyGroup().fromJson(json.enemyGroup));

        if (json.events) {
            this.events = json.events.map((eventData: EventData) => { return EventLoader.load(eventData); });
        }

        return this;
    }

    getTile(row: number, col: number): number {
        return this._tiles[row][col];
    }

    isWalkable(actor: Actor, x: number, y: number): boolean {

        const row: number = Math.floor(y / 16);
        const col: number = Math.floor(x / 16);

        if (row < 0 || row >= Constants.SCREEN_ROW_COUNT ||
                col < 0 || col >= Constants.SCREEN_COL_COUNT) {
            return false;
        }

        const tileType: number = this.getTile(row, col);
        const walkability: number = Constants.WALKABLE[tileType];
        const x0: number = x % 16;
        const y0: number = 15 - (y % 16);

        if (actor instanceof Link) {
            let walkabilityStr: string;
            switch (walkability) {
                case 1:
                    walkabilityStr = 'true';
                    break;
                case 2:
                    walkabilityStr = (y0 > 16 - x0).toString();
                    break;
                case 3:
                    walkabilityStr = (y0 > x0).toString();
                    break;
                case 4:
                    walkabilityStr = (y0 < x0).toString();
                    break;
                case 5:
                    walkabilityStr = (y0 < 16 - x0).toString();
                    break;
                case 6:
                    walkabilityStr = (y0 < 8).toString();
                    break;
                default:
                    walkabilityStr = 'false';
                    break;
            }
        }

        return walkability === 1 ||
            (walkability === 2 && y0 > 16 - x0) || // Top "\"
            (walkability === 3 && y0 > x0) || // Top "/"
            (walkability === 4 && y0 < x0) || // Bottom "/"
            (walkability === 5 && y0 < 16 - x0) || // Bottom "\"
            (walkability === 6 && y0 < 8); // bottom half of tile
    }

    paint(ctx: CanvasRenderingContext2D) {

        const paintWalkability: boolean = false;
        let walkabilityColor: string;
        if (paintWalkability) {
            walkabilityColor = 'red'; //new Color(192,192,255, 192);
            //p = new Polygon();
        }

        for (let row: number = 0; row < this._tiles.length; row++) {
            const y: number = row * Constants.TILE_HEIGHT;
            this.paintRow(ctx, row, y, paintWalkability);
        }

        if (this._parent.showEvents) {
            this.events.forEach((event: Event<any>) => {
                const tile: Position = event.getTile();
                const x: number = tile.col * Constants.TILE_WIDTH;
                const y: number = tile.row * Constants.TILE_WIDTH;
                ctx.strokeStyle = 'red';
                ctx.strokeRect(x, y, Constants.TILE_WIDTH, Constants.TILE_HEIGHT);
            });
        }
    }

    paintActors(ctx: CanvasRenderingContext2D) {
        this._actors.forEach((actor: Actor) => {
            actor.paint(ctx);
        });
    }

    /**
     * Paints a specific column of this screen.  Used by the tile editor.
     *
     * @param {CanvasRenderingContext2D} ctx The rendering context.
     * @param {number} col The column to paint.
     * @param {number} x The x-index at which to paint.
     * @param {boolean} paintWalkability Whether to paint a walkability indicator for each tile.
     */
    paintCol(ctx: CanvasRenderingContext2D, col: number, x: number, paintWalkability: boolean = false) {

        const tileset: Tileset = this._parent.tileset;

        for (let row: number = 0; row < this._tiles.length; row++) {

            const y: number = row * Constants.TILE_HEIGHT;
            const tile: number = this._tiles[row][col];
            tileset.paintTile(ctx, tile, x,  y);

            if (paintWalkability) {
                // TODO: Implement me
            }
        }
    }

    /**
     * Paints a specific row of this screen.  Used by the tile editor.
     *
     * @param {CanvasRenderingContext2D} ctx The rendering context.
     * @param {number} row The row to paint.
     * @param {number} y The y-index at which to paint.
     * @param {boolean} paintWalkability Whether to paint a walkability indicator for each tile.
     */
    paintRow(ctx: CanvasRenderingContext2D, row: number, y: number, paintWalkability: boolean = false) {

        const tileset: Tileset = this._parent.tileset;

        for (let col: number = 0; col < this._tiles[row].length; col++) {

            const x: number = col * Constants.TILE_WIDTH;
            const tile: number = this._tiles[row][col];
            tileset.paintTile(ctx, tile, x, y);

            if (paintWalkability) {
                // TODO: Implement me
            }
        }
    }

    removeLinksSwordActor() {
        for (let i: number = 0; i < this._actors.length; i++) {
            const actor: Actor = this._actors[i];
            if (actor instanceof Sword) {
                this._actors.splice(i, 1);
                break;
            }
        }
    }

    private _setEnemyGroup(enemyGroup?: EnemyGroup | null) {
        this.enemyGroup = enemyGroup;
        if (this.enemyGroup) {
            this.flattenedEnemyGroup = this.enemyGroup.clone(true);
        }
    }

    setTile(row: number, col: number, tile: number) {
        this._tiles[row][col] = tile;
    }

    toJson(): ScreenData {

        const actorData: ActorData[] = [];
        this._actors.forEach((actor: Actor) => {
            actorData.push(actor.toJson());
        });

        const screenData: ScreenData = {
            tiles: this._tiles,
            //actors: actorData,
            enemyGroup: this.enemyGroup ? this.enemyGroup.toJson() : null
        };
        if (this.events && this.events.length) {
            screenData.events = this.events.map((e: Event<any>) => {
                return e.toJson();
            });
        }

        return screenData;
    }

    toString(): string {
        return '[Screen: ' +
                'enemyGroup=' + this.enemyGroup +
                ']';
    }

    update() {
        this._updateActors();
        this._updateActions();
    }

    private _updateActions() {

        // TODO: Optimize me
        const remainingEvents: Event<any>[] = [];

        this.events.forEach((event: Event<any>) => {
            event.update();
            if (event.shouldOccur()) {
                if (!event.execute()) { // execute() returning true => event is done
                    remainingEvents.push(event);
                }
            }
            else {
                remainingEvents.push(event);
            }
        });

        this.events = remainingEvents;
    }

    private _updateActors() {

        const actors: Actor[] = this._actors.slice();
        actors.push(game.link);

        // Handle collisions between actors.  This is really crude, but due
        // to the low number of actors per screen, this works
        for (let i: number = 0; i < actors.length; i++) {
            const actor1: Actor = actors[i];
            for (let j: number = i + 1; j < actors.length; j++) {
                const actor2: Actor = actors[j];
                if (actor1.intersects(actor2)) {
                    actor1.collidedWith(actor2);
                    actor2.collidedWith(actor1);
                }
            }
        }

        for (let i: number = 0; i < this._actors.length; i++) {
            const actor: Actor = this._actors[i];
            actor.update();
            if (actor.done) {
                this._actors.splice(i, 1);
                i--;
            }
        }
    }
}

export interface ScreenData {
    tiles: number[][];
    //actors: ActorData[];
    enemyGroup: EnemyGroupData | undefined | null;
    events?: EventData[] | undefined | null;
}
