class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, bossData) {
        super(scene, x, y, 'boss_' + bossData.type);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(2);
        this.bossData = bossData;
        this.health = bossData.hp;
        this.maxHealth = bossData.hp;
        this.speed = bossData.speed;
        this.pattern = bossData.pattern;
        this.defeated = false;

        // Stun/invulnerability after taking damage
        this.stunned = false;
        this.stunTimer = 0;
        this.invulnerable = false;
        this.invulTimer = 0;

        // AI state
        this.direction = 1;
        this.aiTimer = 0;
        this.aiState = 'idle'; // idle, attacking, recovering
        this.patrolLeft = x - 200;
        this.patrolRight = x + 200;
        this.homeY = y;
        this.chargeTarget = 0;

        // Physics
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0);

        // Floating patterns don't need gravity
        if (this.pattern === 'float') {
            this.body.setAllowGravity(false);
        }
    }

    update(time, delta) {
        if (this.defeated) return;

        // Stun timer
        if (this.stunned) {
            this.stunTimer -= delta;
            if (this.stunTimer <= 0) {
                this.stunned = false;
                this.body.setVelocityX(0);
            }
            return;
        }

        // Invulnerability timer
        if (this.invulnerable) {
            this.invulTimer -= delta;
            // Flash effect
            this.setAlpha(Math.sin(time * 0.02) > 0 ? 1 : 0.3);
            if (this.invulTimer <= 0) {
                this.invulnerable = false;
                this.setAlpha(1);
            }
        }

        this.aiTimer += delta;

        // Run pattern
        switch (this.pattern) {
            case 'pace': this.doPace(delta); break;
            case 'charge': this.doCharge(delta); break;
            case 'hop': this.doHop(delta); break;
            case 'float': this.doFloat(delta); break;
        }
    }

    doPace(delta) {
        this.body.setVelocityX(this.speed * this.direction);

        if (this.x >= this.patrolRight) {
            this.direction = -1;
            this.setFlipX(true);
        } else if (this.x <= this.patrolLeft) {
            this.direction = 1;
            this.setFlipX(false);
        }
    }

    doCharge(delta) {
        const player = this.scene.player;
        if (!player) return;

        if (this.aiState === 'idle') {
            // Face player
            this.body.setVelocityX(0);
            this.direction = player.x > this.x ? 1 : -1;
            this.setFlipX(this.direction < 0);

            if (this.aiTimer > 1500) {
                this.aiState = 'attacking';
                this.aiTimer = 0;
                this.chargeTarget = player.x;
            }
        } else if (this.aiState === 'attacking') {
            // Rush toward target
            const dir = this.chargeTarget > this.x ? 1 : -1;
            this.body.setVelocityX(this.speed * dir);
            this.setFlipX(dir < 0);

            if (Math.abs(this.x - this.chargeTarget) < 20 || this.aiTimer > 1000) {
                this.aiState = 'recovering';
                this.aiTimer = 0;
                this.body.setVelocityX(0);
            }
        } else if (this.aiState === 'recovering') {
            if (this.aiTimer > 800) {
                this.aiState = 'idle';
                this.aiTimer = 0;
            }
        }
    }

    doHop(delta) {
        const onFloor = this.body.blocked.down || this.body.touching.down;

        if (this.aiState === 'idle' && onFloor) {
            // Pace slowly
            this.body.setVelocityX(this.speed * 0.3 * this.direction);

            if (this.x >= this.patrolRight) { this.direction = -1; this.setFlipX(true); }
            else if (this.x <= this.patrolLeft) { this.direction = 1; this.setFlipX(false); }

            if (this.aiTimer > 2000) {
                this.aiState = 'attacking';
                this.aiTimer = 0;
                this.body.setVelocityY(-500);
                this.body.setVelocityX(this.speed * 0.5 * this.direction);
            }
        } else if (this.aiState === 'attacking') {
            if (onFloor && this.aiTimer > 200) {
                // Landed — camera shake
                this.scene.cameras.main.shake(200, 0.01);
                this.aiState = 'recovering';
                this.aiTimer = 0;
                this.body.setVelocityX(0);
            }
        } else if (this.aiState === 'recovering') {
            if (this.aiTimer > 600) {
                this.aiState = 'idle';
                this.aiTimer = 0;
            }
        }
    }

    doFloat(delta) {
        const player = this.scene.player;
        if (!player) return;

        if (this.aiState === 'idle') {
            // Hover side to side
            this.body.setVelocityX(this.speed * 0.4 * this.direction);
            this.body.setVelocityY(Math.sin(this.aiTimer * 0.003) * 30);

            if (this.x >= this.patrolRight) { this.direction = -1; this.setFlipX(true); }
            else if (this.x <= this.patrolLeft) { this.direction = 1; this.setFlipX(false); }

            if (this.aiTimer > 2500) {
                this.aiState = 'attacking';
                this.aiTimer = 0;
            }
        } else if (this.aiState === 'attacking') {
            // Swoop down toward player
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            this.body.setVelocityX((dx / dist) * this.speed);
            this.body.setVelocityY((dy / dist) * this.speed);

            if (this.aiTimer > 800 || this.y > this.homeY + 50) {
                this.aiState = 'recovering';
                this.aiTimer = 0;
            }
        } else if (this.aiState === 'recovering') {
            // Return to hover height
            const dy = this.homeY - this.y;
            this.body.setVelocityY(dy * 2);
            this.body.setVelocityX(0);

            if (Math.abs(dy) < 5 || this.aiTimer > 1000) {
                this.aiState = 'idle';
                this.aiTimer = 0;
            }
        }
    }

    takeDamage() {
        if (this.invulnerable || this.defeated) return false;

        this.health--;
        this.stunned = true;
        this.stunTimer = 500;
        this.invulnerable = true;
        this.invulTimer = 1500;

        // Knockback
        this.body.setVelocityX(-this.direction * 150);
        this.body.setVelocityY(-200);

        // Flash white
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (!this.defeated) this.clearTint();
        });

        // Emit damage event for UI
        this.scene.events.emit('bossHealthUpdate', this.health, this.maxHealth);

        if (this.health <= 0) {
            this.defeat();
        }

        return true;
    }

    defeat() {
        this.defeated = true;
        this.body.setVelocity(0, 0);
        this.body.setAllowGravity(false);

        // Defeat animation: spin, shrink, fade
        this.scene.tweens.add({
            targets: this,
            angle: 720,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 800,
            ease: 'Back.easeIn',
            onComplete: () => {
                // Burst of stardust particles
                for (let i = 0; i < 8; i++) {
                    const dust = this.scene.add.image(
                        this.x + Phaser.Math.Between(-30, 30),
                        this.y + Phaser.Math.Between(-30, 30),
                        'stardust'
                    ).setScale(2);
                    this.scene.tweens.add({
                        targets: dust,
                        y: dust.y - 60,
                        alpha: 0,
                        scale: 0,
                        duration: 600,
                        delay: i * 50,
                        onComplete: () => dust.destroy()
                    });
                }
                this.destroy();
            }
        });

        this.scene.events.emit('bossDefeated');
    }

    isDefeated() {
        return this.defeated;
    }
}
