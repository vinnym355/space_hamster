class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'squeaky');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(2);
        this.setDepth(10);
        this.setCollideWorldBounds(false);
        this.body.setMaxVelocityY(600);

        // Movement config
        this.walkSpeed = 160;
        this.runSpeed = 280;
        this.isRunning = false;

        // Jump / Puff config
        this.jumpChargeTime = 0;
        this.maxChargeTime = 1500;    // ms
        this.minJumpVelocity = -300;
        this.maxJumpVelocity = -580;
        this.tapJumpVelocity = -300;
        this.isCharging = false;
        this.sneezed = false;
        this.sneezeCooldown = 0;
        this.inputFrozen = false;

        // Crouch
        this.isCrouching = false;
        this.crouchSpeed = 60;

        // Coyote time & jump buffer
        this.coyoteTime = 80;         // ms
        this.coyoteTimer = 0;
        this.jumpBufferTime = 100;    // ms
        this.jumpBufferTimer = 0;

        // Animation state
        this.waddleTimer = 0;
        this.breatheTimer = 0;
        this.wasInAir = false;

        // Fall gravity multiplier
        this.normalGravity = 800;
        this.fallGravity = 1200;

        // Puff visual overlay (separate from physics sprite)
        this.puffGfx = scene.add.graphics();

        // Power-ups
        this.activePowerUps = {}; // { type: remainingMs } — duration -1 means permanent until removed

        // Emote state
        this.isEmoting = false;
        this.emoteTimer = 0;
        this._bKeyWasDown = false;

        // Cosmetics overlays
        this.setupCosmetics(scene);

        // Keyboard input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyShift = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyC = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.keyB = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

        // Sneeze emitter
        this.sneezeEmitter = scene.add.particles(0, 0, 'sneeze_particle', {
            speed: { min: 50, max: 150 },
            angle: { min: -30, max: 30 },
            scale: { start: 1, end: 0 },
            lifespan: 400,
            quantity: 8,
            emitting: false
        });

        // Sound pack
        this.soundPack = SoundGenerator.getPack(SaveManager.getEquipped().sound);
        this._sprintSoundCooldown = 0;
    }

    setupCosmetics(scene) {
        const equipped = SaveManager.getEquipped();
        const d = this.depth;

        // Puff overlay depth (behind player)
        this.puffGfx.setDepth(d - 1);

        // Helmet — rendered above player
        this.helmetSprite = null;
        if (equipped.helmet && scene.textures.exists(equipped.helmet)) {
            this.helmetSprite = scene.add.image(this.x, this.y - 24, equipped.helmet);
            this.helmetSprite.setScale(2);
            this.helmetSprite.setDepth(d + 1);
        }

        // Suit — rendered on body with transparency
        this.suitSprite = null;
        if (equipped.suit && scene.textures.exists(equipped.suit)) {
            this.suitSprite = scene.add.image(this.x, this.y + 4, equipped.suit);
            this.suitSprite.setScale(2);
            this.suitSprite.setAlpha(0.6);
            this.suitSprite.setDepth(d + 1);
        }

        // Jetpack — rendered behind player
        this.jetpackSprite = null;
        this.jetFlameGfx = null;
        this.jetFlameTimer = 0;
        if (equipped.jetpack && scene.textures.exists(equipped.jetpack)) {
            this.jetpackSprite = scene.add.image(this.x - 20, this.y, equipped.jetpack);
            this.jetpackSprite.setScale(2);
            this.jetpackSprite.setDepth(d - 1);

            // Flame/thrust graphics drawn below jetpack
            this.jetFlameGfx = scene.add.graphics();
            this.jetFlameGfx.setDepth(d - 2);
        }
    }

    updateCosmetics() {
        if (this.helmetSprite) {
            this.helmetSprite.setPosition(this.x, this.y - 24);
            this.helmetSprite.setFlipX(this.flipX);
            this.helmetSprite.setRotation(this.rotation);
        }
        if (this.suitSprite) {
            this.suitSprite.setPosition(this.x, this.y + 4);
            this.suitSprite.setFlipX(this.flipX);
            this.suitSprite.setRotation(this.rotation);
        }
        if (this.jetpackSprite) {
            const offsetX = this.flipX ? 20 : -20;
            this.jetpackSprite.setPosition(this.x + offsetX, this.y);
            this.jetpackSprite.setFlipX(this.flipX);
            this.jetpackSprite.setRotation(this.rotation);
        }
    }

    updateJetFlame(time, delta, onFloor) {
        if (!this.jetFlameGfx) return;
        this.jetFlameGfx.clear();

        // Show flame when airborne or charging
        if (onFloor && !this.isCharging) return;

        this.jetFlameTimer += delta * 0.015;
        const offsetX = this.flipX ? 20 : -20;
        const flameX = this.x + offsetX;
        const flameY = this.y + 12;

        // Flame flicker using sine
        const flicker = Math.sin(this.jetFlameTimer * 8) * 0.3 + 0.7;
        const flicker2 = Math.cos(this.jetFlameTimer * 11) * 0.2 + 0.8;

        if (this.body.velocity.y < 0) {
            // Going UP — big thrust flames
            const thrust = Math.min(Math.abs(this.body.velocity.y) / 580, 1);
            const flameLen = 14 + thrust * 18;

            // Outer flame (orange-red)
            this.jetFlameGfx.fillStyle(0xff6600, 0.7 * flicker);
            this.jetFlameGfx.fillTriangle(
                flameX - 6, flameY,
                flameX + 6, flameY,
                flameX + Math.sin(this.jetFlameTimer * 6) * 3, flameY + flameLen * flicker2
            );

            // Inner flame (yellow-white)
            this.jetFlameGfx.fillStyle(0xffdd44, 0.8 * flicker);
            this.jetFlameGfx.fillTriangle(
                flameX - 3, flameY,
                flameX + 3, flameY,
                flameX + Math.sin(this.jetFlameTimer * 9) * 2, flameY + flameLen * 0.6 * flicker
            );

            // Core (white-hot)
            this.jetFlameGfx.fillStyle(0xffffff, 0.6 * flicker2);
            this.jetFlameGfx.fillCircle(flameX, flameY + 2, 3 * thrust + 1);
        } else if (!onFloor) {
            // Falling — small idle putter flame
            const flameLen = 6 + Math.sin(this.jetFlameTimer * 10) * 3;
            this.jetFlameGfx.fillStyle(0xff8844, 0.5 * flicker);
            this.jetFlameGfx.fillTriangle(
                flameX - 3, flameY,
                flameX + 3, flameY,
                flameX + Math.sin(this.jetFlameTimer * 7) * 2, flameY + flameLen
            );
            this.jetFlameGfx.fillStyle(0xffcc66, 0.4 * flicker2);
            this.jetFlameGfx.fillCircle(flameX, flameY + 1, 2);
        }

        // During charge — sputtering buildup
        if (this.isCharging) {
            const chargeRatio = Math.min(this.jumpChargeTime / this.maxChargeTime, 1);
            const sputter = Math.sin(this.jetFlameTimer * 15) > 0 ? 1 : 0;
            const sparks = chargeRatio * 8 + 3;
            this.jetFlameGfx.fillStyle(0xff4400, 0.6 * sputter * chargeRatio);
            this.jetFlameGfx.fillTriangle(
                flameX - 2, flameY,
                flameX + 2, flameY,
                flameX, flameY + sparks
            );
        }
    }

    // --- Power-Up Methods ---
    applyPowerUp(type, duration) {
        this.activePowerUps[type] = duration; // -1 = permanent until removed

        // Emit event for UI
        this.scene.events.emit('powerupActive', type, duration);
    }

    hasActivePowerUp(type) {
        return this.activePowerUps.hasOwnProperty(type) && this.activePowerUps[type] !== 0;
    }

    removePowerUp(type) {
        delete this.activePowerUps[type];
        this.scene.events.emit('powerupExpired', type);
    }

    updatePowerUps(delta) {
        const expired = [];
        for (const type in this.activePowerUps) {
            if (this.activePowerUps[type] === -1) continue; // permanent
            this.activePowerUps[type] -= delta;
            if (this.activePowerUps[type] <= 0) {
                expired.push(type);
            }
        }
        expired.forEach(type => {
            this.removePowerUp(type);
        });
    }

    getEffectiveWalkSpeed() {
        if (this.hasActivePowerUp('pu_speed')) return 250;
        return this.walkSpeed;
    }

    getEffectiveRunSpeed() {
        if (this.hasActivePowerUp('pu_speed')) return 400;
        return this.runSpeed;
    }

    getEffectiveMaxJumpVelocity() {
        if (this.hasActivePowerUp('pu_superjump')) return -800;
        return this.maxJumpVelocity;
    }

    // --- Emote (hamster body animations) ---
    triggerEmote() {
        const equipped = SaveManager.getEquipped();
        if (!equipped.emote) return;
        if (this.isEmoting) return;

        this.isEmoting = true;
        this.emoteTimer = 1200;
        this._emoteType = equipped.emote;

        // Stop horizontal movement during emote
        this.body.setVelocityX(0);

        switch (equipped.emote) {
            case 'emote_dab':
                this._emoteDab();
                break;
            case 'emote_guns':
                this._emoteGuns();
                break;
            case 'emote_walk':
                this._emoteMoonwalk();
                break;
            case 'emote_faint':
                this._emoteFaint();
                break;
        }
    }

    _emoteDab() {
        // Lean hard to one side, hold, return
        const dir = this.flipX ? 1 : -1;
        this.scene.tweens.add({
            targets: this,
            rotation: dir * 0.8,
            duration: 200,
            ease: 'Back.easeOut',
            yoyo: true,
            hold: 600,
            onComplete: () => { this.setRotation(0); }
        });
        this.setTint(0xff44aa);
        this.scene.time.delayedCall(1000, () => {
            if (!this.hasActivePowerUp('pu_invincible')) this.clearTint();
        });
    }

    _emoteGuns() {
        this.emoteTimer = 1400;
        this._gunGfx = this.scene.add.graphics().setDepth(this.depth + 2);
        this._gunShotTimer = 0;
        this._gunShotIndex = 0;
        this._gunFlashTimer = 0;
        this._gunFlashSide = 0;
        // Shot schedule: which side fires at what elapsed time
        this._gunShotTimes = [100, 350, 600, 850];
        this._gunElapsed = 0;
    }

    _emoteMoonwalk() {
        // Slide backwards with exaggerated waddle
        const dir = this.flipX ? 1 : -1; // slide opposite to facing
        this.emoteTimer = 1400;
        this._moonwalkDir = dir;
        // Tint to distinguish
        this.setTint(0xaaaaff);
        this.scene.time.delayedCall(1200, () => {
            if (!this.hasActivePowerUp('pu_invincible')) this.clearTint();
        });
    }

    _emoteFaint() {
        // Dramatic fall over
        this.emoteTimer = 1600;
        this.setTint(0xff6666);
        this.scene.tweens.add({
            targets: this,
            rotation: this.flipX ? -1.57 : 1.57,
            duration: 400,
            ease: 'Bounce.easeOut',
            hold: 800,
            yoyo: true,
            onComplete: () => {
                this.setRotation(0);
                if (!this.hasActivePowerUp('pu_invincible')) this.clearTint();
            }
        });
    }

    _cleanupGunHands() {
        if (this._gunGfx) { this._gunGfx.destroy(); this._gunGfx = null; }
    }

    updateEmote(delta) {
        if (!this.isEmoting) return;

        this.emoteTimer -= delta;

        // --- Finger guns: draw hands + fire PEW each frame ---
        if (this._emoteType === 'emote_guns' && this._gunGfx) {
            this._gunElapsed += delta;
            this._gunGfx.clear();

            const handOffsetX = 24;
            const rHandX = this.x + handOffsetX;
            const lHandX = this.x - handOffsetX;
            const handY = this.y + 2;

            // Draw right hand (finger pointing right)
            this._gunGfx.fillStyle(0xff8c42);
            this._gunGfx.fillRoundedRect(rHandX - 6, handY - 5, 12, 10, 3);
            this._gunGfx.fillStyle(0xffaa66);
            this._gunGfx.fillRect(rHandX + 4, handY - 3, 14, 5);
            this._gunGfx.fillRect(rHandX, handY - 10, 5, 8);
            this._gunGfx.fillStyle(0xffbb88);
            this._gunGfx.fillCircle(rHandX, handY, 3);

            // Draw left hand (finger pointing left)
            this._gunGfx.fillStyle(0xff8c42);
            this._gunGfx.fillRoundedRect(lHandX - 6, handY - 5, 12, 10, 3);
            this._gunGfx.fillStyle(0xffaa66);
            this._gunGfx.fillRect(lHandX - 18, handY - 3, 14, 5);
            this._gunGfx.fillRect(lHandX - 5, handY - 10, 5, 8);
            this._gunGfx.fillStyle(0xffbb88);
            this._gunGfx.fillCircle(lHandX, handY, 3);

            // Check if it's time to fire a shot
            if (this._gunShotIndex < this._gunShotTimes.length &&
                this._gunElapsed >= this._gunShotTimes[this._gunShotIndex]) {
                const side = this._gunShotIndex % 2 === 0 ? 1 : -1; // R, L, R, L
                const tipX = side === 1 ? rHandX + 18 : lHandX - 18;

                // Muzzle flash (drawn for a few frames)
                this._gunFlashTimer = 80;
                this._gunFlashSide = side;

                // Spawn PEW! text that flies outward
                const pewText = this.scene.add.text(tipX, handY - 12, 'PEW!', {
                    fontFamily: 'Arial Black',
                    fontSize: '16px',
                    color: '#ffdd00',
                    stroke: '#000',
                    strokeThickness: 4
                }).setOrigin(0.5).setDepth(this.depth + 5);
                this.scene.tweens.add({
                    targets: pewText,
                    x: tipX + side * 60,
                    y: handY - 30,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => pewText.destroy()
                });

                this._gunShotIndex++;
            }

            // Draw muzzle flash if active
            if (this._gunFlashTimer > 0) {
                this._gunFlashTimer -= delta;
                const flashSide = this._gunFlashSide;
                const fX = flashSide === 1 ? rHandX + 18 : lHandX - 18;
                // Yellow flash burst
                this._gunGfx.fillStyle(0xffff44, 0.9);
                this._gunGfx.fillCircle(fX, handY, 6);
                this._gunGfx.fillStyle(0xffffff, 0.7);
                this._gunGfx.fillCircle(fX, handY, 3);
            }
        }

        // Moonwalk slide
        if (this._emoteType === 'emote_walk' && this._moonwalkDir && this.emoteTimer > 200) {
            this.body.setVelocityX(this._moonwalkDir * 80);
            // Exaggerated waddle
            this.setRotation(Math.sin(this.emoteTimer * 0.015) * 0.2);
        }

        if (this.emoteTimer <= 0) {
            this.isEmoting = false;
            if (this._emoteType === 'emote_guns') this._cleanupGunHands();
            this._emoteType = null;
            this._moonwalkDir = 0;
            this.setRotation(0);
            this.body.setVelocityX(0);
            if (!this.hasActivePowerUp('pu_invincible')) this.clearTint();
        }
    }

    getGamepad() {
        if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
            return this.scene.input.gamepad.getPad(0);
        }
        return null;
    }

    getInputAxis() {
        let moveX = 0;
        const pad = this.getGamepad();

        if (this.cursors.left.isDown || this.keyA.isDown) moveX = -1;
        else if (this.cursors.right.isDown || this.keyD.isDown) moveX = 1;

        if (pad) {
            const stickX = pad.axes.length > 0 ? pad.axes[0].getValue() : 0;
            const dpadLeft = pad.buttons[14] && pad.buttons[14].pressed;
            const dpadRight = pad.buttons[15] && pad.buttons[15].pressed;

            if (Math.abs(stickX) > 0.2) moveX = stickX;
            else if (dpadLeft) moveX = -1;
            else if (dpadRight) moveX = 1;
        }

        return moveX;
    }

    isJumpPressed() {
        const pad = this.getGamepad();
        return this.spaceKey.isDown || (pad && pad.buttons[0] && pad.buttons[0].pressed);
    }

    isJumpJustReleased() {
        const pad = this.getGamepad();
        const keyReleased = Phaser.Input.Keyboard.JustUp(this.spaceKey);
        const padReleased = pad && pad.buttons[0] && !pad.buttons[0].pressed && this._padJumpWasDown;
        return keyReleased || padReleased;
    }

    isRunPressed() {
        const pad = this.getGamepad();
        const keyRun = this.keyShift.isDown;
        const padRun = pad && (
            (pad.buttons[1] && pad.buttons[1].pressed) ||
            (pad.buttons[7] && pad.buttons[7].value > 0.3)
        );
        return keyRun || padRun;
    }

    isCrouchPressed() {
        const pad = this.getGamepad();
        const keyCrouch = this.keyC.isDown || this.cursors.down.isDown || this.keyS.isDown;
        const padCrouch = pad && (
            (pad.buttons[13] && pad.buttons[13].pressed) ||
            (pad.axes.length > 1 && pad.axes[1].getValue() > 0.5)
        );
        return keyCrouch || padCrouch;
    }

    update(time, delta) {
        if (this.inputFrozen) return;

        const onFloor = this.body.blocked.down || this.body.touching.down;
        const moveX = this.getInputAxis();

        const padJumpDownNow = (() => {
            const p = this.getGamepad();
            return p && p.buttons[0] && p.buttons[0].pressed;
        })();

        // Power-up tick
        this.updatePowerUps(delta);

        // Emote tick
        this.updateEmote(delta);

        // Emote trigger (B key — manual edge detection)
        const bDown = this.keyB.isDown;
        if (bDown && !this._bKeyWasDown && !this.isCharging && !this.sneezed) {
            this.triggerEmote();
        }
        this._bKeyWasDown = bDown;

        // Invincibility visual
        if (this.hasActivePowerUp('pu_invincible')) {
            const colors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff];
            const idx = Math.floor(time * 0.01) % colors.length;
            this.setTint(colors[idx]);
        }

        // Sneeze cooldown
        if (this.sneezeCooldown > 0) {
            this.sneezeCooldown -= delta;
            if (this.sneezeCooldown <= 0) {
                this.sneezed = false;
                this.sneezeCooldown = 0;
            }
        }

        // --- Coyote Time ---
        if (onFloor) {
            this.coyoteTimer = this.coyoteTime;
        } else {
            this.coyoteTimer -= delta;
        }
        const canJump = this.coyoteTimer > 0;

        // --- Jump Buffer ---
        if (this.isJumpPressed() && !onFloor && !this.isCharging) {
            this.jumpBufferTimer = this.jumpBufferTime;
        }
        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer -= delta;
        }

        // --- Fall gravity ---
        if (this.body.velocity.y > 0 && !onFloor) {
            this.body.setGravityY(this.fallGravity - this.normalGravity);
        } else {
            this.body.setGravityY(0);
        }

        // --- Crouch ---
        const wantsCrouch = this.isCrouchPressed() && onFloor && !this.isCharging && !this.sneezed;
        if (wantsCrouch && !this.isCrouching) {
            this.isCrouching = true;
            this.setScale(2.4, 0.8);
            this.y += 24;              // shift down so feet stay on ground
            if (this.soundPack) this.soundPack.crouch();
        } else if (!wantsCrouch && this.isCrouching) {
            this.isCrouching = false;
            this.y -= 24;              // shift back up before restoring scale
            this.setScale(2, 2);
        }

        // Sprint sound cooldown
        if (this._sprintSoundCooldown > 0) this._sprintSoundCooldown -= delta;

        // --- Horizontal movement ---
        if (!this.sneezed && !this.isEmoting) {
            const wasRunning = this.isRunning;
            this.isRunning = this.isRunPressed();
            const speed = this.isCrouching ? this.crouchSpeed :
                (this.isRunning ? this.getEffectiveRunSpeed() : this.getEffectiveWalkSpeed());

            if (moveX !== 0) {
                this.body.setVelocityX(moveX * speed);
                this.setFlipX(moveX < 0);
                // Sprint sound
                if (this.isRunning && onFloor && this.soundPack && this._sprintSoundCooldown <= 0) {
                    this.soundPack.sprint();
                    this._sprintSoundCooldown = 200;
                }
            } else {
                this.body.setVelocityX(this.body.velocity.x * 0.8);
                if (Math.abs(this.body.velocity.x) < 10) {
                    this.body.setVelocityX(0);
                }
            }
        }

        // --- Puff Jump System (can't charge while crouching) ---
        if (!this.sneezed && !this.isCrouching) {
            if (this.isJumpPressed() && canJump && !this.isCharging) {
                this.isCharging = true;
                this.jumpChargeTime = 0;
            }

            if (this.isCharging) {
                this.jumpChargeTime += delta;
                const chargeRatio = Math.min(this.jumpChargeTime / this.maxChargeTime, 1);

                // Visual: tint shift (orange → red) — NO scale change
                if (!this.hasActivePowerUp('pu_invincible')) {
                    const r = 0xff;
                    const g = Math.floor(0x8c - chargeRatio * 0x4c);
                    const b = Math.floor(0x42 - chargeRatio * 0x42);
                    this.setTint(Phaser.Display.Color.GetColor(r, g, b));
                }

                this.drawPuffOverlay(chargeRatio);

                if (chargeRatio > 0.7) {
                    this.scene.cameras.main.shake(50, 0.003);
                }

                // Sneeze fail — overcharged!
                if (this.jumpChargeTime >= this.maxChargeTime) {
                    this.triggerSneeze();
                    this._padJumpWasDown = padJumpDownNow;
                    return;
                }

                // Released jump
                if (this.isJumpJustReleased() || !this.isJumpPressed()) {
                    this.executeJump();
                    this._padJumpWasDown = padJumpDownNow;
                    return;
                }
            }

            // Jump buffer
            if (onFloor && this.jumpBufferTimer > 0 && !this.isCharging) {
                this.jumpBufferTimer = 0;
                this.body.setVelocityY(this.tapJumpVelocity);
            }
        }

        // --- Landing detection ---
        if (onFloor && this.wasInAir) {
            this.doLandingEffect();
        }
        this.wasInAir = !onFloor;

        // --- Animations (rotation & tint only, NEVER scale) ---
        if (!this.isCharging && !this.sneezed && !this.isEmoting && !this.hasActivePowerUp('pu_invincible')) {
            if (onFloor && Math.abs(this.body.velocity.x) > 10) {
                this.doWaddleAnimation(delta);
            } else if (onFloor) {
                this.doIdleAnimation(delta);
            } else {
                this.setRotation(this.body.velocity.x * 0.0003);
            }
        }

        // Clear puff overlay when not charging
        if (!this.isCharging) {
            this.puffGfx.clear();
        }

        // Emit charge event for UI
        if (this.isCharging) {
            this.scene.events.emit('chargeUpdate', this.jumpChargeTime / this.maxChargeTime);
        } else {
            this.scene.events.emit('chargeUpdate', 0);
        }

        // Update cosmetic positions
        this.updateCosmetics();

        // Jetpack flame effect
        this.updateJetFlame(time, delta, onFloor);

        this._padJumpWasDown = padJumpDownNow;
    }

    drawPuffOverlay(chargeRatio) {
        this.puffGfx.clear();
        const puffWidth = 20 + chargeRatio * 30;
        const puffAlpha = 0.3 + chargeRatio * 0.3;
        this.puffGfx.fillStyle(0xff6644, puffAlpha);
        this.puffGfx.fillEllipse(this.x, this.y, puffWidth, 20 + chargeRatio * 10);
    }

    executeJump() {
        const chargeRatio = Math.min(this.jumpChargeTime / this.maxChargeTime, 1);
        const maxJump = this.getEffectiveMaxJumpVelocity();
        const jumpVel = Phaser.Math.Linear(this.minJumpVelocity, maxJump, chargeRatio);

        this.body.setVelocityY(jumpVel);
        this.isCharging = false;
        if (this.soundPack) this.soundPack.jump();
        this.jumpChargeTime = 0;
        this.coyoteTimer = 0;
        this.puffGfx.clear();

        if (!this.hasActivePowerUp('pu_invincible')) {
            this.clearTint();
            this.setTintFill(0xffff88);
            this.scene.time.delayedCall(60, () => {
                if (!this.isCharging && !this.hasActivePowerUp('pu_invincible')) this.clearTint();
            });
        }
    }

    triggerSneeze() {
        this.isCharging = false;
        this.jumpChargeTime = 0;
        this.sneezed = true;
        this.sneezeCooldown = 400;
        this.puffGfx.clear();

        if (!this.hasActivePowerUp('pu_invincible')) {
            this.clearTint();
        }

        const knockDir = this.flipX ? 1 : -1;
        this.body.setVelocityX(knockDir * 120);
        this.body.setVelocityY(-80);

        if (!this.hasActivePowerUp('pu_invincible')) {
            this.setTintFill(0xffffff);
            this.scene.time.delayedCall(150, () => {
                if (!this.hasActivePowerUp('pu_invincible')) this.clearTint();
            });
        }

        const emitX = this.x + (this.flipX ? -30 : 30);
        this.sneezeEmitter.explode(8, emitX, this.y);
        if (this.soundPack) this.soundPack.sneeze();

        this.scene.events.emit('chargeUpdate', 0);
    }

    doLandingEffect() {
        if (!this.hasActivePowerUp('pu_invincible')) {
            this.setTintFill(0xccddff);
            this.scene.time.delayedCall(60, () => {
                if (!this.isCharging && !this.sneezed && !this.hasActivePowerUp('pu_invincible')) this.clearTint();
            });
        }
        if (this.soundPack) this.soundPack.land();
    }

    doWaddleAnimation(delta) {
        this.waddleTimer += delta * 0.012 * (this.isRunning ? 1.5 : 1);
        this.setRotation(Math.sin(this.waddleTimer) * 0.09);
    }

    doIdleAnimation(delta) {
        this.breatheTimer += delta * 0.003;
        this.setRotation(Math.sin(this.breatheTimer) * 0.03);
    }

    freeze() {
        this.inputFrozen = true;
        if (this.isCrouching) {
            this.y -= 24;
            this.isCrouching = false;
        }
        this.body.setVelocity(0, 0);
        this.body.setAllowGravity(false);
        this.clearTint();
        this.setScale(2);
        this.setRotation(0);
        this.puffGfx.clear();
        if (this.jetFlameGfx) this.jetFlameGfx.clear();
        this._cleanupGunHands();
    }
}
