module zelda {
    'use strict';

    export class ZeldaGame extends gtp.Game {

        link: Link;

        constructor(args?: any) {
            super(args);

            this.link = new Link();
            this.link.setLocation(100, 100);
        }

        drawString(x: number, y: number, text: string|number,
                   ctx: CanvasRenderingContext2D = game.canvas.getContext('2d')) {

            const str: string = text.toString(); // Allow us to pass in stuff like numerics

            // Note we have a gtp.SpriteSheet, not a gtp.BitmapFont, so our
            // calculation of what sub-image to draw is a little convoluted
            const fontImage: gtp.SpriteSheet = <gtp.SpriteSheet>this.assets.get('font');
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
            // TODO: Implement me
            return true;
            //return this.curScreen.isWalkable(actor, x, y);
        }
    }
}