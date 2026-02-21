class MenuScene extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        // Starfield background
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const star = this.add.image(x, y, Math.random() > 0.5 ? 'bg_star' : 'bg_star_small');
            star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
            this.tweens.add({
                targets: star,
                alpha: { from: star.alpha, to: star.alpha * 0.3 },
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1
            });
        }

        // Title
        this.add.text(cx, 80, 'SPACE HAMSTER', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '48px',
            color: '#ffaa42',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 5, fill: true }
        }).setOrigin(0.5);

        this.add.text(cx, 130, 'Cosmic Capers', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#88ccff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Squeaky preview with float animation
        const squeaky = this.add.image(cx, 220, 'squeaky').setScale(4);
        this.tweens.add({
            targets: squeaky,
            y: 215,
            angle: { from: -5, to: 5 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Stardust wallet display
        const walletIcon = this.add.image(700, 30, 'stardust').setScale(2);
        this.tweens.add({ targets: walletIcon, angle: 360, duration: 4000, repeat: -1 });
        this.add.text(720, 20, String(SaveManager.getStardust()), {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 3
        });

        // Menu buttons
        this.buttons = [];
        this.selectedIndex = 0;

        const buttonData = [
            { label: 'PLAY', action: () => this.goToLevelSelect() },
            { label: 'SHOP', action: () => this.goToShop() }
        ];

        buttonData.forEach((btn, i) => {
            const y = 340 + i * 70;
            const bg = this.add.graphics();
            const text = this.add.text(cx, y, btn.label, {
                fontFamily: 'Arial Black',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.buttons.push({ bg, text, y, action: btn.action });
        });

        this.updateButtonHighlight();

        // Controls info
        this.add.text(cx, 540, 'Arrow Keys / WASD = Move  |  SPACE = Puff Jump  |  SHIFT = Run  |  C = Crouch', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#888899'
        }).setOrigin(0.5);

        this.add.text(cx, 565, 'Gamepad: D-Pad/Stick = Navigate  |  A = Select', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#666688'
        }).setOrigin(0.5);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        this._navCooldown = 0;
        this._padConfirmWasDown = false;
        this.transitioning = false;

        this.cameras.main.fadeIn(400);
    }

    updateButtonHighlight() {
        this.buttons.forEach((btn, i) => {
            btn.bg.clear();
            if (i === this.selectedIndex) {
                btn.bg.fillStyle(0x4466aa, 0.6);
                btn.bg.fillRoundedRect(400 - 120, btn.y - 22, 240, 44, 10);
                btn.bg.lineStyle(2, 0x88ccff);
                btn.bg.strokeRoundedRect(400 - 120, btn.y - 22, 240, 44, 10);
                btn.text.setColor('#ffdd66');
            } else {
                btn.bg.fillStyle(0x333355, 0.4);
                btn.bg.fillRoundedRect(400 - 120, btn.y - 22, 240, 44, 10);
                btn.text.setColor('#aaaacc');
            }
        });
    }

    goToLevelSelect() {
        if (this.transitioning) return;
        this.transitioning = true;
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('LevelSelect');
        });
    }

    goToShop() {
        if (this.transitioning) return;
        this.transitioning = true;
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Shop');
        });
    }

    update(time, delta) {
        if (this.transitioning) return;

        this._navCooldown -= delta;

        let navDir = 0;
        let confirm = false;

        // Keyboard navigation
        if (this.cursors.up.isDown || this.keyW.isDown) navDir = -1;
        else if (this.cursors.down.isDown || this.keyS.isDown) navDir = 1;

        if (this.enterKey.isDown || this.spaceKey.isDown) confirm = true;

        // Gamepad
        const pad = this.input.gamepad && this.input.gamepad.total > 0
            ? this.input.gamepad.getPad(0) : null;
        if (pad) {
            const stickY = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
            const dpadUp = pad.buttons[12] && pad.buttons[12].pressed;
            const dpadDown = pad.buttons[13] && pad.buttons[13].pressed;
            if (stickY < -0.5 || dpadUp) navDir = -1;
            else if (stickY > 0.5 || dpadDown) navDir = 1;

            const padConfirm = pad.buttons[0] && pad.buttons[0].pressed;
            if (padConfirm && !this._padConfirmWasDown) confirm = true;
            this._padConfirmWasDown = padConfirm;
        }

        if (navDir !== 0 && this._navCooldown <= 0) {
            this._navCooldown = 200;
            this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + navDir, 0, this.buttons.length);
            this.updateButtonHighlight();
        }

        if (confirm) {
            this.buttons[this.selectedIndex].action();
        }
    }
}
