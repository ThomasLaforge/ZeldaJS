module zelda {
    'use strict';

    export class TitleState extends _BaseState {

        private _lastKeypressTime: number;

        /**
         * State that renders the title screen.
         * @constructor
         */
        constructor(args?: zelda.ZeldaGame | gtp.BaseStateArgs) {
            super(args);
        }

        enter() {

            super.enter(game);

            game.canvas.addEventListener('touchstart', this.handleStart, false);
            this._lastKeypressTime = game.playTime;
        }

        leaving(game: gtp.Game) {
            game.canvas.removeEventListener('touchstart', this.handleStart, false);
        }

        handleStart() {
            console.log('Yee, touch detected!');
            this._startGame();
        }

        render(ctx: CanvasRenderingContext2D) {

            this.game.clearScreen();

            // Title banner
            const title: gtp.Image = game.assets.get('title');
            title.draw(ctx, 0, 0);

            if (!game.audio.isInitialized()) {
                this._renderNoSoundMessage();
            }
        }

        private _renderNoSoundMessage() {

            const w: number = game.getWidth();

            let text: string = 'SOUND IS DISABLED AS';
            let x: number = (w - this.stringWidth(text)) / 2;
            let y: number = game.getHeight() - 20 - 9 * 3;
            this.getGame().drawString(x, y, text);
            text = 'YOUR BROWSER DOES NOT';
            x = ( w - this.stringWidth(text)) / 2;
            y += 9;
            this.getGame().drawString(x, y, text);
            text = 'SUPPORT WEB AUDIO';
            x = (w - this.stringWidth(text)) / 2;
            y += 9;
            this.getGame().drawString(x, y, text);
        }

        _startGame() {
            game.setState(new gtp.FadeOutInState(this, new MainGameState(),
                    function() {
                        game.startNewGame();
                    }));
        }

        update(delta: number) {

            this.handleDefaultKeys();

            const playTime: number = game.playTime;
            if (playTime > this._lastKeypressTime + _BaseState.INPUT_REPEAT_MILLIS + 100) {

                const im: gtp.InputManager = game.inputManager;

                if (im.enter(true)) {
                    this._startGame();
                }
            }

        }
    }
}
