class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create(data) {
        // Launch UI overlay (safe to call even if already running — stop first)
        this.scene.stop('UI');
        this.scene.launch('UI');

        // Level setup
        this.currentLevel = (data && data.level) ? data.level : 1;
        const level = LevelGenerator.generateLevel(this.currentLevel);
        this.levelData = level;
        this.stardustCollected = 0;
        this.levelComplete = false;

        // World bounds
        this.physics.world.setBounds(0, 0, level.width, level.height);

        // Background with theme colors
        this.createBackground(level);

        // Platforms group
        this.platforms = this.physics.add.staticGroup();

        // Ground segments — themed ground
        const theme = level.theme;
        level.ground.forEach(g => {
            const tilesNeeded = Math.ceil(g.width / 64);
            for (let i = 0; i < tilesNeeded; i++) {
                const tile = this.platforms.create(
                    g.x + i * 64 + 32,
                    g.y + g.height / 2,
                    'ground'
                );
                tile.setDisplaySize(64, g.height);
                tile.setTint(theme.groundColor);
                tile.refreshBody();
            }
        });

        // Floating platforms — themed
        level.platforms.forEach(p => {
            const key = p.width <= 96 ? 'platform_small' : 'platform';
            const plat = this.platforms.create(p.x + p.width / 2, p.y + p.height / 2, key);
            plat.setDisplaySize(p.width, p.height);
            plat.setTint(theme.platformColor);
            plat.refreshBody();
        });

        // Stardust collectibles
        this.stardustGroup = this.physics.add.group({ allowGravity: false });
        level.stardust.forEach(s => {
            const dust = this.stardustGroup.create(s.x, s.y, 'stardust');
            dust.setScale(1.5);
            dust.body.setSize(12, 12);
            this.tweens.add({
                targets: dust,
                y: s.y - 6,
                duration: Phaser.Math.Between(1000, 1800),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Phaser.Math.Between(0, 500)
            });
            this.tweens.add({
                targets: dust,
                angle: 360,
                duration: 3000,
                repeat: -1
            });
        });

        // Power-ups
        this.powerupGroup = this.physics.add.group({ allowGravity: false });
        if (level.powerups) {
            level.powerups.forEach(pu => {
                const sprite = this.powerupGroup.create(pu.x, pu.y, pu.type);
                sprite.setScale(2);
                sprite.body.setSize(16, 16);
                sprite.setData('puType', pu.type);
                // Float animation
                this.tweens.add({
                    targets: sprite,
                    y: pu.y - 10,
                    duration: 1200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                // Glow pulse
                this.tweens.add({
                    targets: sprite,
                    alpha: { from: 0.7, to: 1 },
                    duration: 600,
                    yoyo: true,
                    repeat: -1
                });
            });
        }

        // Finish flag
        this.finishFlag = this.physics.add.sprite(
            level.finishFlag.x, level.finishFlag.y, 'flag'
        );
        this.finishFlag.setScale(2);
        this.finishFlag.body.setAllowGravity(false);
        this.finishFlag.body.setImmovable(true);
        this.tweens.add({
            targets: this.finishFlag,
            angle: { from: -5, to: 5 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Player (created before boss so boss overlap can reference player directly)
        this.player = new Player(this, level.playerStart.x, level.playerStart.y);

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.stardustGroup, this.collectStardust, null, this);
        this.physics.add.overlap(this.player, this.finishFlag, this.reachFinish, null, this);
        this.physics.add.overlap(this.player, this.powerupGroup, this.collectPowerup, null, this);

        // Boss setup (after player exists)
        this.boss = null;
        if (level.boss) {
            console.log('[SpaceHamster] Boss level', this.currentLevel, '- spawning:', level.boss.name, level.boss);
            this.boss = new Boss(this, level.boss.x, level.boss.y, level.boss);
            this.boss.setDepth(5);
            this.physics.add.collider(this.boss, this.platforms);
            this.physics.add.overlap(this.player, this.boss, this.handleBossContact, null, this);

            // Hide finish flag until boss is defeated
            this.finishFlag.setVisible(false);
            this.finishFlag.body.enable = false;

            // Boss fight announcement
            const bossAnnounce = this.add.text(level.width / 2, 200, 'BOSS FIGHT!', {
                fontFamily: 'Arial Black',
                fontSize: '48px',
                color: '#ff4444',
                stroke: '#000',
                strokeThickness: 6
            }).setOrigin(0.5).setDepth(20).setAlpha(0);

            const bossNameAnnounce = this.add.text(level.width / 2, 260, level.boss.name, {
                fontFamily: 'Arial Black',
                fontSize: '24px',
                color: '#ffaa44',
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(20).setAlpha(0);

            this.tweens.add({
                targets: [bossAnnounce, bossNameAnnounce],
                alpha: 1,
                duration: 400,
                ease: 'Back.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: [bossAnnounce, bossNameAnnounce],
                        alpha: 0,
                        y: '-=30',
                        duration: 800,
                        delay: 1500,
                        onComplete: () => {
                            bossAnnounce.destroy();
                            bossNameAnnounce.destroy();
                        }
                    });
                }
            });

            // Boss defeated event
            this.events.on('bossDefeated', () => {
                // Reveal finish flag
                this.finishFlag.setVisible(true);
                this.finishFlag.body.enable = true;

                // Drop bonus stardust
                const bonusCount = 10 + Math.floor(this.currentLevel / 5) * 3;
                for (let i = 0; i < bonusCount; i++) {
                    const bx = this.boss.x + Phaser.Math.Between(-80, 80);
                    const by = this.boss.y + Phaser.Math.Between(-40, 40);
                    const bonusDust = this.stardustGroup.create(bx, by, 'stardust');
                    bonusDust.setScale(1.5);
                    bonusDust.body.setSize(12, 12);
                    bonusDust.body.setAllowGravity(false);
                    // Scatter animation
                    this.tweens.add({
                        targets: bonusDust,
                        x: bx + Phaser.Math.Between(-60, 60),
                        y: by - Phaser.Math.Between(20, 60),
                        duration: 400,
                        ease: 'Back.easeOut'
                    });
                }
                this.stardustTotal += bonusCount;
                this.events.emit('stardustUpdate', this.stardustCollected, this.stardustTotal);
            });
        }

        // Camera
        this.cameras.main.setBounds(0, 0, level.width, level.height);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(100, 50);
        this.cameras.main.fadeIn(500);

        // Death check - falling off the world
        this.deathY = level.height + 100;

        // Store total for UI to query on init
        this.stardustTotal = level.stardust.length;
    }

    createBackground(level) {
        const theme = level.theme;

        // Deep space gradient via theme colors
        const bg = this.add.graphics();
        bg.fillGradientStyle(theme.bgTop, theme.bgTop, theme.bgBot, theme.bgBot, 1);
        bg.fillRect(0, 0, level.width, level.height);
        bg.setScrollFactor(0, 0);
        bg.setDepth(-10);

        // Parallax star layers — density from theme
        const farCount = Math.floor(80 * theme.starDensity);
        for (let i = 0; i < farCount; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, level.width),
                Phaser.Math.Between(0, level.height - 100),
                'bg_star_small'
            );
            star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
            star.setScrollFactor(0.2);
            star.setDepth(-9);
            this.tweens.add({
                targets: star,
                alpha: star.alpha * 0.3,
                duration: Phaser.Math.Between(2000, 5000),
                yoyo: true,
                repeat: -1
            });
        }

        const nearCount = Math.floor(40 * theme.starDensity);
        for (let i = 0; i < nearCount; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, level.width),
                Phaser.Math.Between(0, level.height - 100),
                'bg_star'
            );
            star.setAlpha(Phaser.Math.FloatBetween(0.4, 1));
            star.setScrollFactor(0.5);
            star.setDepth(-8);
            this.tweens.add({
                targets: star,
                alpha: star.alpha * 0.4,
                duration: Phaser.Math.Between(1500, 3000),
                yoyo: true,
                repeat: -1
            });
        }
    }

    collectStardust(player, dust) {
        this.tweens.add({
            targets: dust,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            y: dust.y - 30,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => { dust.destroy(); }
        });
        dust.body.enable = false;

        // Double stardust power-up
        const amount = player.hasActivePowerUp && player.hasActivePowerUp('pu_double') ? 2 : 1;
        this.stardustCollected += amount;
        this.events.emit('stardustUpdate', this.stardustCollected, this.stardustTotal);

        const plusText = this.add.text(dust.x, dust.y, '+' + amount, {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: amount > 1 ? '#ffaa00' : '#ffd700',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: plusText,
            y: dust.y - 40,
            alpha: 0,
            duration: 600,
            onComplete: () => plusText.destroy()
        });
    }

    collectPowerup(player, powerup) {
        const puType = powerup.getData('puType');
        const puData = getPowerUpData(puType);
        powerup.body.enable = false;

        // Pickup animation
        this.tweens.add({
            targets: powerup,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            y: powerup.y - 40,
            duration: 400,
            ease: 'Back.easeIn',
            onComplete: () => powerup.destroy()
        });

        // Apply to player
        if (player.applyPowerUp) {
            player.applyPowerUp(puType, puData ? puData.duration : 5000);
        }

        // Show pickup text
        const nameText = this.add.text(powerup.x, powerup.y - 20, puData ? puData.name : 'Power Up!', {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#44ffaa',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({
            targets: nameText,
            y: nameText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => nameText.destroy()
        });

        // Emit for UI
        this.events.emit('powerupCollected', puType, puData);
    }

    handleBossContact(player, boss) {
        if (!boss || boss.defeated || boss.stunned) return;

        // Check if player is above boss (stomp)
        const playerBottom = player.y + player.body.halfHeight;
        const bossTop = boss.y - boss.body.halfHeight;

        if (playerBottom < bossTop + 10 && player.body.velocity.y > 0) {
            // Stomp damage
            if (boss.takeDamage()) {
                player.body.setVelocityY(-400); // bounce up
            }
            return;
        }

        // Check if player is puff-charging
        if (player.isCharging) {
            if (boss.takeDamage()) {
                // Knockback player away from boss
                const dir = player.x < boss.x ? -1 : 1;
                player.body.setVelocityX(dir * 200);
                player.body.setVelocityY(-200);
                player.isCharging = false;
                player.jumpChargeTime = 0;
                player.clearTint();
                player.puffGfx.clear();
            }
            return;
        }

        // Player takes hit
        if (player.hasActivePowerUp && player.hasActivePowerUp('pu_invincible')) {
            // Invincible — boss takes damage instead!
            boss.takeDamage();
            return;
        }

        // Respawn player on hit
        this.respawnPlayer();
    }

    reachFinish(player, flag) {
        if (this.levelComplete) return;
        this.levelComplete = true;

        player.freeze();

        // Save progress
        const stars = SaveManager.setLevelResult(this.currentLevel, this.stardustCollected, this.stardustTotal);
        SaveManager.addStardust(this.stardustCollected);
        if (this.currentLevel < 100) {
            SaveManager.unlockLevel(this.currentLevel + 1);
        }

        // Victory animation
        this.tweens.add({
            targets: player,
            scaleX: 2.5,
            scaleY: 2.5,
            angle: 360,
            duration: 600,
            ease: 'Back.easeOut',
            onComplete: () => {
                player.setScale(2);
                player.setAngle(0);
            }
        });

        this.events.emit('levelComplete', {
            collected: this.stardustCollected,
            total: this.stardustTotal,
            stars: stars,
            levelNum: this.currentLevel
        });
    }

    update(time, delta) {
        if (!this.levelComplete) {
            this.player.update(time, delta);

            // Boss update
            if (this.boss && !this.boss.defeated) {
                this.boss.update(time, delta);
            }

            // Magnet power-up: attract nearby stardust
            if (this.player.hasActivePowerUp && this.player.hasActivePowerUp('pu_magnet')) {
                this.stardustGroup.getChildren().forEach(dust => {
                    if (!dust.body || !dust.body.enable) return;
                    const dx = this.player.x - dust.x;
                    const dy = this.player.y - dust.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150 && dist > 5) {
                        dust.x += (dx / dist) * 4;
                        dust.y += (dy / dist) * 4;
                    }
                });
            }

            if (this.player.y > this.deathY) {
                // Shield power-up: save from pit
                if (this.player.hasActivePowerUp && this.player.hasActivePowerUp('pu_shield')) {
                    this.player.removePowerUp('pu_shield');
                    // Teleport to last safe ground
                    this.player.setPosition(this.levelData.playerStart.x, this.levelData.playerStart.y);
                    this.player.body.setVelocity(0, 0);
                    this.cameras.main.flash(300, 100, 200, 255);
                    // Show shield used text
                    const shieldText = this.add.text(this.player.x, this.player.y - 40, 'Shield Saved You!', {
                        fontFamily: 'Arial Black', fontSize: '14px', color: '#44ddff',
                        stroke: '#000', strokeThickness: 3
                    }).setOrigin(0.5);
                    this.tweens.add({
                        targets: shieldText, y: shieldText.y - 50, alpha: 0, duration: 1200,
                        onComplete: () => shieldText.destroy()
                    });
                } else {
                    this.respawnPlayer();
                }
            }
        }
    }

    respawnPlayer() {
        this.player.setPosition(this.levelData.playerStart.x, this.levelData.playerStart.y);
        this.player.body.setVelocity(0, 0);
        this.player.isCharging = false;
        this.player.jumpChargeTime = 0;
        this.player.sneezed = false;
        this.player.sneezeCooldown = 0;
        this.player.clearTint();
        this.player.setScale(2);

        this.cameras.main.flash(300, 255, 100, 100);
    }

    restartLevel() {
        this.scene.restart({ level: this.currentLevel });
    }

    nextLevel() {
        if (this.currentLevel < 100) {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.restart({ level: this.currentLevel + 1 });
            });
        } else {
            this.goToLevelSelect();
        }
    }

    goToLevelSelect() {
        this.scene.stop('UI');
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('LevelSelect');
        });
    }
}
