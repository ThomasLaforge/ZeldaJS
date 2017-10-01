import { Link } from './Link';
import { Actor } from './Actor';
import { Animation } from './Animation';
import { Map } from './Map';
import { Position } from './Position';
import { Game, SpriteSheet } from 'gtp';
import { ItemDropStrategy } from './item/ItemDropStrategy';
declare let game: ZeldaGame;

export class ZeldaGame extends Game {

    map: Map;
    link: Link;
    itemDropStrategy: ItemDropStrategy;
    private animations: Animation[];

    constructor(args?: any) {
        super(args);
        this.itemDropStrategy = new ItemDropStrategy();
        this.animations = [];
    }

    addEnemyDiesAnimation(x: number, y: number) {
        this.animations.push(this.createEnemyDiesAnimation(x, y));
    }

    paintAnimations(ctx: CanvasRenderingContext2D) {
        this.animations.forEach((anim: Animation) => {
            anim.paint(ctx);
        });
    }

    private createEnemyDiesAnimation(x: number, y: number): Animation {
        const sheet: SpriteSheet = this.assets.get('enemyDies') as SpriteSheet;
        const anim: Animation = new Animation(x, y);
        anim.addFrame({ sheet: sheet, index: 0 }, 30);
        anim.addFrame({ sheet: sheet, index: 1 }, 30);
        anim.addFrame({ sheet: sheet, index: 2 }, 30);
        anim.addFrame({ sheet: sheet, index: 3 }, 30);
        anim.addFrame({ sheet: sheet, index: 16 }, 30);
        anim.addFrame({ sheet: sheet, index: 17 }, 30);
        anim.addFrame({ sheet: sheet, index: 18 }, 30);
        anim.addFrame({ sheet: sheet, index: 19 }, 30);
        anim.addFrame({ sheet: sheet, index: 0 }, 30);
        anim.addFrame({ sheet: sheet, index: 1 }, 30);
        anim.addFrame({ sheet: sheet, index: 2 }, 30);
        anim.addFrame({ sheet: sheet, index: 3 }, 30);
        return anim;
    }

    // TODO: Convert to a gtp BitmapFont
    drawString(x: number, y: number, text: string | number,
               ctx: CanvasRenderingContext2D = game.canvas.getContext('2d')!) {

        const str: string = text.toString(); // Allow us to pass in stuff like numerics

        // Note we have a gtp.SpriteSheet, not a gtp.BitmapFont, so our
        // calculation of what sub-image to draw is a little convoluted
        const fontImage: SpriteSheet = this.assets.get('font') as SpriteSheet;
        const alphaOffs: number = 'A'.charCodeAt(0);
        const numericOffs: number = '0'.charCodeAt(0);
        let index: number;

        for (let i: number = 0; i < str.length; i++) {

            let ch: string = str[i];
            let chCharCode: number = str.charCodeAt(i);
            if (ch >= 'A' && ch <= 'Z') {
                index = fontImage.colCount + (chCharCode - alphaOffs);
            }
            else if (ch >= '0' && ch <= '9') {
                index = chCharCode - numericOffs;
            }
            else {
                switch (ch) {
                    case '-':
                        index = 10;
                        break;
                    case '.':
                        index = 11;
                        break;
                    case '>':
                        index = 12;
                        break;
                    case '@':
                        index = 13;
                        break;
                    case '!':
                        index = 14;
                        break;
                    default:
                        index = 15; // whitespace
                        break;
                }
            }
            fontImage.drawByIndex(ctx, x, y, index);
            x += 9; //CHAR_WIDTH
        }
    }

    isWalkable(actor: Actor, x: number, y: number): boolean {
        return this.map.currentScreen.isWalkable(actor, x, y);
    }

    linkDied() {
        game.audio.playMusic('linkDies');
    }

    get paintHitBoxes(): boolean {
        return false;
    }

    resumeMusic() {
        const music: string | null | undefined = this.map.currentScreenMusic;
        if (music && music !== 'none') {
            game.audio.playMusic(music, true);
        }
    }

    setMap(name: string, destScreen: Position, destPos: Position, immediatelyStartMusic: boolean = true) {

        if (!/\.map$/.test(name)) {
            name += '.map';
        }

        // TODO: Load more than one map, and honor the map name parameter!
        this.map.setCurrentScreen(destScreen.row, destScreen.col);
        this.link.setLocation(destPos.col * 16, destPos.row * 16);

        if (immediatelyStartMusic) {
            this.resumeMusic();
        }
    }

    startNewGame() {
        this.map = new Map();
        this.map.fromJson(this.assets.get('overworldData'));
        this.map.setCurrentScreen(7, 6);
        this.link = new Link();
        this.link.setLocation(100, 100);
    }

    updateAnimations() {
        if (!this.link.done && this.animations.length > 0) {
            const newAnims: Animation[] = [];
            this.animations.forEach((anim: Animation) => {
                anim.update();
                if (!anim.done) {
                    newAnims.push(anim);
                }
            });
            this.animations = newAnims;
        }
    }
}
