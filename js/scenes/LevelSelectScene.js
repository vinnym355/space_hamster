class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super('LevelSelect');
    }

    create() {
        this.cameras.main.fadeIn(400);

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
        bg.fillRect(0, 0, 800, 600);

        // Title
        this.add.text(400, 30, 'SELECT LEVEL', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#88ccff',
            stroke: '#000',
            strokeThickness: 5
        }).setOrigin(0.5);

        // Stardust wallet
        const walletIcon = this.add.image(700, 30, 'stardust').setScale(2);
        this.tweens.add({ targets: walletIcon, angle: 360, duration: 4000, repeat: -1 });
        this.add.text(720, 20, String(SaveManager.getStardust()), {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 3
        });

        // Grid config
        const cols = 10;
        const rows = 10;
        const cellW = 60;
        const cellH = 50;
        const gridX = 400 - (cols * cellW) / 2;
        const gridY = 65;
        const unlocked = SaveManager.getUnlockedLevel();

        // Scrollable container
        this.gridContainer = this.add.container(0, 0);

        // Planet theme labels + level cells
        for (let row = 0; row < rows; row++) {
            const theme = PLANET_THEMES[row % PLANET_THEMES.length];
            const labelY = gridY + row * cellH + cellH / 2;

            // Theme label on the left
            this.gridContainer.add(
                this.add.text(gridX - 8, labelY, theme.name, {
                    fontFamily: 'Arial',
                    fontSize: '9px',
                    color: '#' + theme.platformColor.toString(16).padStart(6, '0'),
                    stroke: '#000',
                    strokeThickness: 2
                }).setOrigin(1, 0.5)
            );

            for (let col = 0; col < cols; col++) {
                const levelNum = row * cols + col + 1;
                const cx = gridX + col * cellW + cellW / 2;
                const cy = labelY;
                const isUnlocked = levelNum <= unlocked;
                const stars = SaveManager.getLevelStars(levelNum);

                // Cell background
                const cell = this.add.graphics();
                if (isUnlocked) {
                    cell.fillStyle(theme.platformColor, 0.5);
                    cell.fillRoundedRect(cx - 25, cy - 20, 50, 40, 6);
                    cell.lineStyle(2, theme.platformColor, 0.8);
                    cell.strokeRoundedRect(cx - 25, cy - 20, 50, 40, 6);
                } else {
                    cell.fillStyle(0x333344, 0.4);
                    cell.fillRoundedRect(cx - 25, cy - 20, 50, 40, 6);
                    cell.lineStyle(1, 0x555566, 0.5);
                    cell.strokeRoundedRect(cx - 25, cy - 20, 50, 40, 6);
                }
                this.gridContainer.add(cell);

                if (isUnlocked) {
                    // Level number
                    const numText = this.add.text(cx, cy - 5, String(levelNum), {
                        fontFamily: 'Arial Black',
                        fontSize: '16px',
                        color: '#ffffff',
                        stroke: '#000',
                        strokeThickness: 3
                    }).setOrigin(0.5);
                    this.gridContainer.add(numText);

                    // Star icons
                    for (let s = 0; s < 3; s++) {
                        const starX = cx - 10 + s * 10;
                        const starY = cy + 12;
                        const icon = this.add.image(starX, starY, s < stars ? 'star_icon' : 'star_empty')
                            .setScale(0.6);
                        this.gridContainer.add(icon);
                    }

                    // Make clickable
                    const hitZone = this.add.zone(cx, cy, 50, 40).setInteractive({ useHandCursor: true });
                    hitZone.on('pointerover', () => {
                        cell.clear();
                        cell.fillStyle(theme.platformColor, 0.8);
                        cell.fillRoundedRect(cx - 25, cy - 20, 50, 40, 6);
                        cell.lineStyle(2, 0xffdd66);
                        cell.strokeRoundedRect(cx - 25, cy - 20, 50, 40, 6);
                    });
                    hitZone.on('pointerout', () => {
                        cell.clear();
                        cell.fillStyle(theme.platformColor, 0.5);
                        cell.fillRoundedRect(cx - 25, cy - 20, 50, 40, 6);
                        cell.lineStyle(2, theme.platformColor, 0.8);
                        cell.strokeRoundedRect(cx - 25, cy - 20, 50, 40, 6);
                    });
                    hitZone.on('pointerdown', () => {
                        this.startLevel(levelNum);
                    });
                    this.gridContainer.add(hitZone);
                } else {
                    // Lock icon
                    const lock = this.add.image(cx, cy, 'lock_icon').setScale(1).setAlpha(0.5);
                    this.gridContainer.add(lock);
                }
            }
        }

        // Scroll support
        this.gridScrollY = 0;
        const totalGridHeight = rows * cellH + gridY + 20;
        this.maxScroll = Math.max(0, totalGridHeight - 600);

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this.gridScrollY = Phaser.Math.Clamp(this.gridScrollY + deltaY * 0.5, 0, this.maxScroll);
            this.gridContainer.y = -this.gridScrollY;
        });

        // Back button
        const backBtn = this.add.text(60, 30, '< BACK', {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#aaaacc',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#ffdd66'));
        backBtn.on('pointerout', () => backBtn.setColor('#aaaacc'));
        backBtn.on('pointerdown', () => this.goBack());

        // ESC / Gamepad B to go back
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this._transitioning = false;
    }

    startLevel(levelNum) {
        if (this._transitioning) return;
        this._transitioning = true;
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game', { level: levelNum });
        });
    }

    goBack() {
        if (this._transitioning) return;
        this._transitioning = true;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Menu');
        });
    }

    update() {
        if (this._transitioning) return;

        if (this.escKey.isDown) {
            this.goBack();
            return;
        }

        // Gamepad B button to go back
        if (this.input.gamepad && this.input.gamepad.total > 0) {
            const pad = this.input.gamepad.getPad(0);
            if (pad && pad.buttons[1] && pad.buttons[1].pressed) {
                this.goBack();
            }
        }

        // Arrow key scrolling
        const cursors = this.input.keyboard.createCursorKeys();
        if (cursors.up.isDown) {
            this.gridScrollY = Phaser.Math.Clamp(this.gridScrollY - 3, 0, this.maxScroll);
            this.gridContainer.y = -this.gridScrollY;
        } else if (cursors.down.isDown) {
            this.gridScrollY = Phaser.Math.Clamp(this.gridScrollY + 3, 0, this.maxScroll);
            this.gridContainer.y = -this.gridScrollY;
        }
    }
}
