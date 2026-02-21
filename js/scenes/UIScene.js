class UIScene extends Phaser.Scene {
    constructor() {
        super('UI');
    }

    create() {
        this.stardustCount = 0;
        this.stardustTotal = 0;

        const gameScene = this.scene.get('Game');

        // Level info (top-center)
        const levelNum = gameScene.currentLevel || 1;
        const theme = LevelGenerator.getTheme(levelNum);
        const isBoss = LevelGenerator.isBossLevel(levelNum);

        this.add.text(400, 10, `Level ${levelNum} - ${theme.name}`, {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#88ccff',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5, 0);

        // Stardust counter (top-left)
        const starIcon = this.add.image(30, 40, 'stardust').setScale(2.5);
        this.tweens.add({
            targets: starIcon,
            angle: 360,
            duration: 4000,
            repeat: -1
        });

        this.stardustText = this.add.text(50, 30, '0 / 0', {
            fontFamily: 'Arial Black',
            fontSize: '22px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        });

        // Wallet display (top-left, smaller)
        const walletIcon = this.add.image(30, 68, 'stardust').setScale(1.5).setAlpha(0.7);
        this.walletText = this.add.text(50, 60, 'Total: ' + SaveManager.getStardust(), {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ffaa44',
            stroke: '#000',
            strokeThickness: 2
        });

        // Charge meter background (top-right)
        this.chargeBg = this.add.graphics();
        this.chargeBg.fillStyle(0x333355, 0.8);
        this.chargeBg.fillRoundedRect(620, 25, 160, 20, 5);
        this.chargeBg.lineStyle(2, 0x6666aa);
        this.chargeBg.strokeRoundedRect(620, 25, 160, 20, 5);

        this.chargeFill = this.add.graphics();

        this.add.text(625, 48, 'PUFF POWER', {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#8888aa'
        });

        // --- Boss Health Bar (top-center, below level name) ---
        this.bossBarContainer = this.add.container(400, 35).setVisible(false);

        const bossBarBg = this.add.graphics();
        bossBarBg.fillStyle(0x333333, 0.8);
        bossBarBg.fillRoundedRect(-110, 0, 220, 18, 4);
        bossBarBg.lineStyle(2, 0xff4444);
        bossBarBg.strokeRoundedRect(-110, 0, 220, 18, 4);

        this.bossBarFill = this.add.graphics();
        this.bossNameText = this.add.text(0, -2, '', {
            fontFamily: 'Arial Black',
            fontSize: '11px',
            color: '#ff6666',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5, 1);

        this.bossBarContainer.add([bossBarBg, this.bossBarFill, this.bossNameText]);

        if (isBoss && gameScene.levelData && gameScene.levelData.boss) {
            this.bossBarContainer.setVisible(true);
            this.bossNameText.setText(gameScene.levelData.boss.name || 'BOSS');
            this.updateBossHealth(gameScene.levelData.boss.hp, gameScene.levelData.boss.hp);
        }

        // --- Power-Up Indicators (bottom-left) ---
        this.puIndicators = {}; // { type: { container, bar, icon, text } }
        this.puContainer = this.add.container(10, 540);

        // --- Level complete overlay (hidden initially) ---
        this.completeContainer = this.add.container(400, 300).setVisible(false).setAlpha(0);

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRoundedRect(-220, -150, 440, 300, 20);

        const completeTitle = this.add.text(0, -120, 'LEVEL COMPLETE!', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#00ff88',
            stroke: '#000',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.completeStardust = this.add.text(0, -60, '', {
            fontFamily: 'Arial Black',
            fontSize: '22px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Star rating display
        this.starIcons = [];
        for (let i = 0; i < 3; i++) {
            const sIcon = this.add.image(-30 + i * 30, -25, 'star_empty').setScale(2);
            this.starIcons.push(sIcon);
        }

        this.completeRating = this.add.text(0, 10, '', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Stardust earned
        this.completeEarned = this.add.text(0, 40, '', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffaa44',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Action buttons
        const nextText = this.add.text(0, 80, 'SPACE: Next Level', {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#88ff88',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({ targets: nextText, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });

        const replayText = this.add.text(0, 110, 'R: Replay  |  ESC: Level Select', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#aaaacc',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.completeContainer.add([
            overlay, completeTitle, this.completeStardust,
            ...this.starIcons, this.completeRating, this.completeEarned,
            nextText, replayText
        ]);

        // Listen for game events
        gameScene.events.on('stardustUpdate', this.updateStardust, this);
        gameScene.events.on('chargeUpdate', this.updateCharge, this);
        gameScene.events.on('levelComplete', this.showLevelComplete, this);
        gameScene.events.on('bossHealthUpdate', this.updateBossHealth, this);
        gameScene.events.on('bossDefeated', this.onBossDefeated, this);
        gameScene.events.on('powerupCollected', this.onPowerupCollected, this);
        gameScene.events.on('powerupActive', this.onPowerupActive, this);
        gameScene.events.on('powerupExpired', this.onPowerupExpired, this);

        // Fetch initial stardust state from game scene
        this.updateStardust(gameScene.stardustCollected || 0, gameScene.stardustTotal || 0);

        // Input for complete screen
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.showingComplete = false;
    }

    updateStardust(count, total) {
        this.stardustCount = count;
        this.stardustTotal = total;
        this.stardustText.setText(`${count} / ${total}`);

        if (count > 0) {
            this.tweens.add({
                targets: this.stardustText,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 100,
                yoyo: true,
                ease: 'Back.easeOut'
            });
        }
    }

    updateCharge(ratio) {
        this.chargeFill.clear();
        if (ratio <= 0) return;

        const width = 156 * ratio;

        let color;
        if (ratio < 0.5) {
            color = Phaser.Display.Color.Interpolate.ColorWithColor(
                new Phaser.Display.Color(0, 255, 100),
                new Phaser.Display.Color(255, 220, 0),
                100,
                ratio * 200
            );
        } else {
            color = Phaser.Display.Color.Interpolate.ColorWithColor(
                new Phaser.Display.Color(255, 220, 0),
                new Phaser.Display.Color(255, 50, 50),
                100,
                (ratio - 0.5) * 200
            );
        }
        const fillColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

        this.chargeFill.fillStyle(fillColor, 1);
        this.chargeFill.fillRoundedRect(622, 27, width, 16, 3);

        if (ratio > 0.8) {
            this.chargeFill.lineStyle(2, 0xff0000, Math.sin(this.time.now * 0.01) * 0.5 + 0.5);
            this.chargeFill.strokeRoundedRect(620, 25, 160, 20, 5);
        }
    }

    updateBossHealth(health, maxHealth) {
        this.bossBarFill.clear();
        if (health <= 0) return;

        const ratio = health / maxHealth;
        const width = Math.floor(216 * ratio);

        // Color: green → yellow → red
        let fillColor;
        if (ratio > 0.5) fillColor = 0x44ff44;
        else if (ratio > 0.25) fillColor = 0xffaa00;
        else fillColor = 0xff4444;

        this.bossBarFill.fillStyle(fillColor, 1);
        this.bossBarFill.fillRoundedRect(-108, 2, width, 14, 3);
    }

    onBossDefeated() {
        // Flash the boss bar and hide it
        this.tweens.add({
            targets: this.bossBarContainer,
            alpha: 0,
            duration: 800,
            ease: 'Power2'
        });
    }

    onPowerupCollected(type, puData) {
        // Handled via onPowerupActive
    }

    onPowerupActive(type, duration) {
        // Remove old indicator if exists
        if (this.puIndicators[type]) {
            this.puIndicators[type].container.destroy();
        }

        const puData = getPowerUpData(type);
        const idx = Object.keys(this.puIndicators).length;
        const yOffset = -30 * (idx + 1);

        const container = this.add.container(0, yOffset);

        // Icon
        let icon = null;
        if (this.textures.exists(type)) {
            icon = this.add.image(10, 0, type).setScale(1.5);
            container.add(icon);
        }

        // Name text
        const nameText = this.add.text(24, -6, puData ? puData.name : type, {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#44ffaa',
            stroke: '#000',
            strokeThickness: 2
        });
        container.add(nameText);

        // Timer bar background
        const barBg = this.add.graphics();
        barBg.fillStyle(0x333333, 0.6);
        barBg.fillRoundedRect(24, 6, 80, 6, 2);
        container.add(barBg);

        // Timer bar fill
        const barFill = this.add.graphics();
        container.add(barFill);

        this.puContainer.add(container);

        this.puIndicators[type] = {
            container: container,
            barFill: barFill,
            duration: duration,
            maxDuration: duration,
            nameText: nameText
        };
    }

    onPowerupExpired(type) {
        if (this.puIndicators[type]) {
            // Fade out
            this.tweens.add({
                targets: this.puIndicators[type].container,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (this.puIndicators[type]) {
                        this.puIndicators[type].container.destroy();
                        delete this.puIndicators[type];
                        this.repositionPuIndicators();
                    }
                }
            });
        }
    }

    repositionPuIndicators() {
        let idx = 0;
        for (const type in this.puIndicators) {
            this.puIndicators[type].container.setY(-30 * (idx + 1));
            idx++;
        }
    }

    showLevelComplete(data) {
        this.showingComplete = true;
        this.completeData = data;

        this.completeStardust.setText(`Stardust: ${data.collected} / ${data.total}`);

        // Star icons
        for (let i = 0; i < 3; i++) {
            this.starIcons[i].setTexture(i < data.stars ? 'star_icon' : 'star_empty');
        }

        let rating;
        const ratio = data.total > 0 ? data.collected / data.total : 0;
        if (ratio >= 1) rating = 'PERFECT! Amazing!';
        else if (ratio >= 0.75) rating = 'Great Job!';
        else if (ratio >= 0.5) rating = 'Good Run!';
        else rating = 'Nice Try!';
        this.completeRating.setText(rating);

        this.completeEarned.setText(`+${data.collected} stardust earned!`);

        // Update wallet display
        this.walletText.setText('Total: ' + SaveManager.getStardust());

        // Show hamster doing emote below the overlay
        const equipped = SaveManager.getEquipped();
        if (equipped.emote) {
            const hamX = 400;
            const hamY = 480;
            const hamster = this.add.image(hamX, hamY, 'squeaky').setScale(4).setAlpha(0);

            // Pop in
            this.tweens.add({
                targets: hamster,
                alpha: 1,
                duration: 300,
                delay: 400
            });

            // Run the emote body animation after pop-in
            this.time.delayedCall(700, () => {
                switch (equipped.emote) {
                    case 'emote_dab':
                        this.tweens.add({
                            targets: hamster,
                            rotation: 0.8,
                            duration: 200,
                            ease: 'Back.easeOut',
                            yoyo: true,
                            hold: 600,
                            onStart: () => hamster.setTint(0xff44aa),
                            onComplete: () => { hamster.setRotation(0); hamster.clearTint(); }
                        });
                        break;
                    case 'emote_guns': {
                        // Draw hands with graphics
                        const gunGfx = this.add.graphics();
                        const rHX = hamX + 40;
                        const lHX = hamX - 40;
                        const hY = hamY + 4;

                        // Right hand
                        gunGfx.fillStyle(0xff8c42);
                        gunGfx.fillRoundedRect(rHX - 8, hY - 7, 16, 14, 4);
                        gunGfx.fillStyle(0xffaa66);
                        gunGfx.fillRect(rHX + 6, hY - 4, 20, 7);
                        gunGfx.fillRect(rHX, hY - 14, 7, 10);
                        gunGfx.fillStyle(0xffbb88);
                        gunGfx.fillCircle(rHX, hY, 4);

                        // Left hand
                        gunGfx.fillStyle(0xff8c42);
                        gunGfx.fillRoundedRect(lHX - 8, hY - 7, 16, 14, 4);
                        gunGfx.fillStyle(0xffaa66);
                        gunGfx.fillRect(lHX - 26, hY - 4, 20, 7);
                        gunGfx.fillRect(lHX - 7, hY - 14, 7, 10);
                        gunGfx.fillStyle(0xffbb88);
                        gunGfx.fillCircle(lHX, hY, 4);

                        // Pew pew shots with delayed calls
                        const uiShots = [
                            { dir: 1, tipX: rHX + 26, delay: 100 },
                            { dir: -1, tipX: lHX - 26, delay: 350 },
                            { dir: 1, tipX: rHX + 26, delay: 600 },
                            { dir: -1, tipX: lHX - 26, delay: 850 },
                        ];
                        uiShots.forEach(shot => {
                            this.time.delayedCall(shot.delay, () => {
                                // Muzzle flash
                                const flashGfx = this.add.graphics();
                                flashGfx.fillStyle(0xffff44, 0.9);
                                flashGfx.fillCircle(shot.tipX, hY, 8);
                                flashGfx.fillStyle(0xffffff, 0.7);
                                flashGfx.fillCircle(shot.tipX, hY, 4);
                                this.time.delayedCall(80, () => flashGfx.destroy());

                                // PEW text
                                const pew = this.add.text(shot.tipX, hY - 14, 'PEW!', {
                                    fontFamily: 'Arial Black',
                                    fontSize: '18px',
                                    color: '#ffdd00',
                                    stroke: '#000',
                                    strokeThickness: 4
                                }).setOrigin(0.5);
                                this.tweens.add({
                                    targets: pew,
                                    x: pew.x + shot.dir * 60,
                                    y: pew.y - 25,
                                    alpha: 0,
                                    duration: 500,
                                    ease: 'Power2',
                                    onComplete: () => pew.destroy()
                                });
                            });
                        });
                        this.time.delayedCall(1300, () => gunGfx.destroy());
                        break;
                    }
                    case 'emote_walk':
                        hamster.setTint(0xaaaaff);
                        this.tweens.add({
                            targets: hamster,
                            x: hamX + 60,
                            duration: 1200,
                            ease: 'Linear'
                        });
                        this.tweens.add({
                            targets: hamster,
                            rotation: 0.2,
                            duration: 150,
                            yoyo: true,
                            repeat: 7
                        });
                        this.time.delayedCall(1200, () => { hamster.clearTint(); hamster.setRotation(0); });
                        break;
                    case 'emote_faint':
                        hamster.setTint(0xff6666);
                        this.tweens.add({
                            targets: hamster,
                            rotation: 1.57,
                            duration: 400,
                            ease: 'Bounce.easeOut',
                            hold: 800,
                            yoyo: true,
                            onComplete: () => { hamster.setRotation(0); hamster.clearTint(); }
                        });
                        break;
                }
            });
        }

        this.completeContainer.setVisible(true);
        this.tweens.add({
            targets: this.completeContainer,
            alpha: 1,
            y: 280,
            duration: 500,
            ease: 'Back.easeOut'
        });
    }

    update(time, delta) {
        // Update power-up indicator bars
        const gameScene = this.scene.get('Game');
        if (gameScene && gameScene.player && gameScene.player.activePowerUps) {
            for (const type in this.puIndicators) {
                const indicator = this.puIndicators[type];
                const remaining = gameScene.player.activePowerUps[type];
                if (remaining !== undefined && indicator.maxDuration > 0) {
                    const ratio = Math.max(0, remaining / indicator.maxDuration);
                    indicator.barFill.clear();
                    indicator.barFill.fillStyle(ratio > 0.2 ? 0x44ffaa : 0xff4444, 1);
                    indicator.barFill.fillRoundedRect(24, 6, Math.floor(80 * ratio), 6, 2);

                    // Flash when about to expire
                    if (ratio < 0.2) {
                        indicator.nameText.setAlpha(Math.sin(time * 0.01) > 0 ? 1 : 0.3);
                    }
                }
            }
        }

        if (this.showingComplete) {
            let next = this.spaceKey.isDown;
            let replay = this.rKey.isDown;
            let levelSelect = this.escKey.isDown;

            // Gamepad
            if (this.input.gamepad && this.input.gamepad.total > 0) {
                const pad = this.input.gamepad.getPad(0);
                if (pad) {
                    if (pad.buttons[0] && pad.buttons[0].pressed) next = true;
                    if (pad.buttons[2] && pad.buttons[2].pressed) replay = true;
                    if (pad.buttons[1] && pad.buttons[1].pressed) levelSelect = true;
                }
            }

            const gs = this.scene.get('Game');
            if (next) {
                this.showingComplete = false;
                gs.nextLevel();
            } else if (replay) {
                this.showingComplete = false;
                gs.restartLevel();
            } else if (levelSelect) {
                this.showingComplete = false;
                gs.goToLevelSelect();
            }
        }
    }
}
