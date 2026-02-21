class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create() {
        SaveManager.load();
        this.generateTextures();
        this.generateShopTextures();
        this.generatePowerUpTextures();
        this.generateBossTextures();
        this.scene.start('Menu');
    }

    generateTextures() {
        // Squeaky the hamster
        const hamster = this.make.graphics({ add: false });
        hamster.fillStyle(0xff8c42);
        hamster.fillRoundedRect(0, 8, 32, 32, 4);
        hamster.fillStyle(0xffaa66);
        hamster.fillCircle(6, 8, 5);
        hamster.fillCircle(26, 8, 5);
        hamster.fillStyle(0xffccaa);
        hamster.fillCircle(6, 8, 3);
        hamster.fillCircle(26, 8, 3);
        hamster.fillStyle(0x000000);
        hamster.fillCircle(11, 20, 3);
        hamster.fillCircle(21, 20, 3);
        hamster.fillStyle(0xffffff);
        hamster.fillCircle(12, 19, 1);
        hamster.fillCircle(22, 19, 1);
        hamster.fillStyle(0xff6699);
        hamster.fillCircle(16, 25, 2);
        hamster.fillStyle(0xffbb88, 0.5);
        hamster.fillCircle(6, 26, 4);
        hamster.fillCircle(26, 26, 4);
        hamster.lineStyle(2, 0x88ccff, 0.6);
        hamster.strokeCircle(16, 20, 16);
        hamster.generateTexture('squeaky', 32, 40);
        hamster.destroy();

        // Platform
        const platform = this.make.graphics({ add: false });
        platform.fillStyle(0x6a6a8a);
        platform.fillRoundedRect(0, 0, 128, 24, 4);
        platform.fillStyle(0x8888aa);
        platform.fillRect(2, 2, 124, 8);
        platform.fillStyle(0x555577);
        platform.fillRect(2, 16, 124, 6);
        platform.generateTexture('platform', 128, 24);
        platform.destroy();

        // Small platform
        const smallPlat = this.make.graphics({ add: false });
        smallPlat.fillStyle(0x6a6a8a);
        smallPlat.fillRoundedRect(0, 0, 96, 24, 4);
        smallPlat.fillStyle(0x8888aa);
        smallPlat.fillRect(2, 2, 92, 8);
        smallPlat.fillStyle(0x555577);
        smallPlat.fillRect(2, 16, 92, 6);
        smallPlat.generateTexture('platform_small', 96, 24);
        smallPlat.destroy();

        // Ground
        const ground = this.make.graphics({ add: false });
        ground.fillStyle(0x8B5E3C);
        ground.fillRect(0, 0, 64, 48);
        ground.fillStyle(0x4CAF50);
        ground.fillRect(0, 0, 64, 8);
        ground.fillStyle(0x66BB6A);
        ground.fillRect(0, 0, 64, 4);
        ground.generateTexture('ground', 64, 48);
        ground.destroy();

        // Stardust
        const star = this.make.graphics({ add: false });
        star.fillStyle(0xffd700);
        star.beginPath();
        star.moveTo(6, 0); star.lineTo(12, 6); star.lineTo(6, 12); star.lineTo(0, 6);
        star.closePath(); star.fillPath();
        star.fillStyle(0xffee88);
        star.beginPath();
        star.moveTo(6, 2); star.lineTo(10, 6); star.lineTo(6, 10); star.lineTo(2, 6);
        star.closePath(); star.fillPath();
        star.generateTexture('stardust', 12, 12);
        star.destroy();

        // Finish flag
        const flag = this.make.graphics({ add: false });
        flag.fillStyle(0xcccccc);
        flag.fillRect(6, 0, 4, 48);
        flag.fillStyle(0x00ff88);
        flag.fillTriangle(10, 4, 32, 12, 10, 20);
        flag.fillStyle(0xffd700);
        flag.fillCircle(18, 12, 3);
        flag.generateTexture('flag', 32, 48);
        flag.destroy();

        // Background stars
        const bgStar = this.make.graphics({ add: false });
        bgStar.fillStyle(0xffffff);
        bgStar.fillCircle(2, 2, 2);
        bgStar.generateTexture('bg_star', 4, 4);
        bgStar.destroy();

        const bgStarSmall = this.make.graphics({ add: false });
        bgStarSmall.fillStyle(0xaaaacc);
        bgStarSmall.fillCircle(1, 1, 1);
        bgStarSmall.generateTexture('bg_star_small', 2, 2);
        bgStarSmall.destroy();

        // Sneeze particle
        const sneeze = this.make.graphics({ add: false });
        sneeze.fillStyle(0xffffff, 0.8);
        sneeze.fillCircle(3, 3, 3);
        sneeze.generateTexture('sneeze_particle', 6, 6);
        sneeze.destroy();

        // Lock icon for level select
        const lock = this.make.graphics({ add: false });
        lock.fillStyle(0x666688);
        lock.fillRoundedRect(4, 10, 16, 12, 2);
        lock.lineStyle(3, 0x666688);
        lock.strokeCircle(12, 8, 6);
        lock.generateTexture('lock_icon', 24, 24);
        lock.destroy();

        // Star icon for ratings
        const starIcon = this.make.graphics({ add: false });
        starIcon.fillStyle(0xffd700);
        starIcon.fillTriangle(8, 0, 10, 6, 16, 6);
        starIcon.fillTriangle(8, 0, 6, 6, 0, 6);
        starIcon.fillTriangle(2, 10, 8, 7, 14, 10);
        starIcon.fillTriangle(2, 10, 5, 14, 8, 7);
        starIcon.fillTriangle(14, 10, 11, 14, 8, 7);
        starIcon.generateTexture('star_icon', 16, 16);
        starIcon.destroy();

        const starEmpty = this.make.graphics({ add: false });
        starEmpty.lineStyle(1, 0x666688);
        starEmpty.strokeTriangle(8, 0, 10, 6, 16, 6);
        starEmpty.strokeTriangle(8, 0, 6, 6, 0, 6);
        starEmpty.generateTexture('star_empty', 16, 16);
        starEmpty.destroy();
    }

    generateShopTextures() {
        // Helmets
        this._genTex('hat_party', 24, 16, (g) => {
            g.fillStyle(0xff44aa); g.fillTriangle(12, 0, 20, 16, 4, 16);
            g.fillStyle(0xffff00); g.fillCircle(12, 2, 3);
        });
        this._genTex('hat_crown', 24, 14, (g) => {
            g.fillStyle(0xffd700);
            g.fillRect(2, 6, 20, 8);
            g.fillTriangle(2, 6, 6, 0, 10, 6);
            g.fillTriangle(10, 6, 14, 0, 18, 6);
            g.fillTriangle(14, 6, 18, 0, 22, 6);
            g.fillStyle(0xff4444); g.fillCircle(6, 10, 2); g.fillCircle(18, 10, 2);
        });
        this._genTex('hat_propeller', 24, 18, (g) => {
            g.fillStyle(0x4444ff); g.fillRoundedRect(4, 8, 16, 10, 3);
            g.fillStyle(0xff0000);
            g.fillRect(6, 4, 3, 6); g.fillRect(15, 4, 3, 6);
            g.fillStyle(0xffff00); g.fillCircle(12, 6, 3);
        });
        this._genTex('hat_googly', 28, 16, (g) => {
            g.fillStyle(0xffffff); g.fillCircle(8, 8, 8); g.fillCircle(20, 8, 8);
            g.fillStyle(0x000000); g.fillCircle(10, 8, 4); g.fillCircle(22, 8, 4);
        });
        this._genTex('hat_fishbowl', 28, 24, (g) => {
            g.lineStyle(2, 0x66ddff, 0.8); g.strokeCircle(14, 12, 12);
            g.fillStyle(0x66ddff, 0.3); g.fillCircle(14, 12, 11);
            g.fillStyle(0xff8800); g.fillEllipse(14, 14, 6, 4);
        });
        this._genTex('hat_viking', 28, 18, (g) => {
            g.fillStyle(0x888888); g.fillRoundedRect(4, 6, 20, 12, 3);
            g.fillStyle(0xaa7744);
            g.fillTriangle(0, 14, 4, 0, 6, 10);
            g.fillTriangle(28, 14, 24, 0, 22, 10);
        });

        // Suits
        this._genTex('suit_duck', 28, 12, (g) => {
            g.fillStyle(0xffdd00, 0.6); g.fillEllipse(14, 6, 28, 12);
            g.fillStyle(0xff8800); g.fillTriangle(14, 0, 18, 4, 14, 4);
        });
        this._genTex('suit_pizza', 24, 20, (g) => {
            g.fillStyle(0xff8833, 0.5); g.fillRoundedRect(0, 0, 24, 20, 4);
            g.fillStyle(0xff4444); g.fillCircle(6, 6, 3); g.fillCircle(16, 12, 3); g.fillCircle(8, 16, 2);
        });
        this._genTex('suit_glow', 28, 20, (g) => {
            g.fillStyle(0x44ff88, 0.4); g.fillRect(2, 0, 4, 20);
            g.fillStyle(0xff44ff, 0.4); g.fillRect(10, 0, 4, 20);
            g.fillStyle(0x44aaff, 0.4); g.fillRect(18, 0, 4, 20);
        });
        this._genTex('suit_disco', 24, 20, (g) => {
            g.fillStyle(0xccccff, 0.5); g.fillCircle(12, 10, 10);
            for (let i = 0; i < 6; i++) {
                g.fillStyle([0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff][i], 0.6);
                g.fillCircle(12 + Math.cos(i) * 5, 10 + Math.sin(i) * 5, 2);
            }
        });

        // Jetpacks
        this._genTex('jet_balloon', 20, 24, (g) => {
            g.fillStyle(0xff4444); g.fillEllipse(5, 6, 8, 10);
            g.fillStyle(0x44ff44); g.fillEllipse(15, 4, 8, 10);
            g.fillStyle(0x4444ff); g.fillEllipse(10, 8, 8, 10);
            g.fillStyle(0x888888); g.fillRect(8, 16, 4, 8);
        });
        this._genTex('jet_soda', 16, 24, (g) => {
            g.fillStyle(0xff4444); g.fillRoundedRect(2, 0, 12, 20, 3);
            g.fillStyle(0xffffff); g.fillRect(5, 3, 6, 4);
            g.fillStyle(0xff8800); g.fillTriangle(4, 20, 8, 24, 12, 20);
        });
        this._genTex('jet_toaster', 18, 20, (g) => {
            g.fillStyle(0xccaa66); g.fillRoundedRect(1, 2, 16, 14, 2);
            g.fillStyle(0x444444); g.fillRect(4, 0, 4, 4); g.fillRect(10, 0, 4, 4);
            g.fillStyle(0xff6600); g.fillRect(4, 16, 10, 4);
        });
        this._genTex('jet_butterfly', 28, 20, (g) => {
            g.fillStyle(0xee88ff, 0.7);
            g.fillEllipse(6, 6, 12, 10);
            g.fillEllipse(22, 6, 12, 10);
            g.fillEllipse(6, 14, 10, 8);
            g.fillEllipse(22, 14, 10, 8);
            g.fillStyle(0x442244); g.fillRect(13, 2, 2, 18);
        });

        // Emotes (small icons)
        this._genTex('emote_dab', 20, 20, (g) => {
            g.fillStyle(0xff4488); g.fillTriangle(2, 4, 18, 10, 10, 18);
            g.fillStyle(0xffffff); g.fillCircle(8, 8, 3);
        });
        this._genTex('emote_guns', 20, 16, (g) => {
            g.fillStyle(0xffaa00);
            g.fillRect(0, 6, 8, 4); g.fillRect(12, 6, 8, 4);
            g.fillStyle(0xff4400); g.fillCircle(2, 4, 2); g.fillCircle(18, 4, 2);
        });
        this._genTex('emote_walk', 16, 20, (g) => {
            g.fillStyle(0xaaaaff);
            g.fillCircle(8, 4, 4);
            g.fillRect(6, 8, 4, 6);
            g.fillRect(2, 14, 4, 6); g.fillRect(10, 14, 4, 6);
        });
        this._genTex('emote_faint', 20, 20, (g) => {
            g.fillStyle(0xff6666);
            g.lineStyle(2, 0xff6666);
            g.strokeCircle(10, 10, 8);
            g.fillStyle(0xff6666);
            g.fillRect(4, 4, 4, 4); g.fillRect(12, 4, 4, 4);
            g.beginPath(); g.moveTo(6, 14); g.lineTo(14, 12); g.strokePath();
        });

        // Hamster finger-gun hand (pointing right)
        this._genTex('gun_hand', 16, 16, (g) => {
            // Palm/paw (orange hamster color)
            g.fillStyle(0xff8c42);
            g.fillRoundedRect(2, 6, 10, 8, 3);
            // Index finger pointing right
            g.fillStyle(0xffaa66);
            g.fillRoundedRect(8, 8, 8, 4, 2);
            // Thumb sticking up
            g.fillStyle(0xffaa66);
            g.fillRoundedRect(6, 2, 4, 6, 2);
            // Fingertip highlight
            g.fillStyle(0xffccaa);
            g.fillCircle(15, 10, 1);
            // Paw pad
            g.fillStyle(0xffbb88);
            g.fillCircle(6, 10, 2);
        });

        // Sound pack icons (speaker shapes)
        this._genTex('snd_silly', 20, 20, (g) => {
            g.fillStyle(0xff88ff);
            g.fillRect(2, 6, 6, 8); g.fillTriangle(8, 4, 8, 16, 16, 10);
            g.lineStyle(2, 0xff88ff); g.strokeCircle(18, 10, 3);
        });
        this._genTex('snd_scifi', 20, 20, (g) => {
            g.fillStyle(0x44ffff);
            g.fillRect(2, 6, 6, 8); g.fillTriangle(8, 4, 8, 16, 16, 10);
            g.lineStyle(2, 0x44ffff); g.strokeCircle(18, 10, 3); g.strokeCircle(18, 10, 6);
        });
        this._genTex('snd_musical', 20, 20, (g) => {
            g.fillStyle(0xffdd44);
            g.fillCircle(6, 14, 4); g.fillRect(9, 4, 2, 12);
            g.fillCircle(14, 10, 4); g.fillRect(17, 0, 2, 12);
            g.fillRect(9, 2, 10, 3);
        });
        this._genTex('snd_retro', 20, 20, (g) => {
            g.fillStyle(0x44ff44);
            g.fillRect(2, 6, 6, 8); g.fillTriangle(8, 4, 8, 16, 14, 10);
            g.fillRect(16, 4, 2, 4); g.fillRect(16, 12, 2, 4); g.fillRect(18, 8, 2, 4);
        });
    }

    generatePowerUpTextures() {
        // Speed - lightning bolt
        this._genTex('pu_speed', 16, 16, (g) => {
            g.fillStyle(0xffdd00);
            g.fillTriangle(10, 0, 4, 8, 9, 8);
            g.fillTriangle(7, 8, 12, 8, 6, 16);
        });
        // Shield - circle
        this._genTex('pu_shield', 16, 16, (g) => {
            g.fillStyle(0x44ddff, 0.5); g.fillCircle(8, 8, 7);
            g.lineStyle(2, 0x44ddff); g.strokeCircle(8, 8, 7);
        });
        // Magnet - U shape
        this._genTex('pu_magnet', 16, 16, (g) => {
            g.fillStyle(0xff4444);
            g.fillRect(2, 0, 4, 10); g.fillRect(10, 0, 4, 10);
            g.fillRect(2, 10, 12, 4);
            g.fillStyle(0xcccccc); g.fillRect(2, 0, 4, 4); g.fillRect(10, 0, 4, 4);
        });
        // Super Jump - up arrow
        this._genTex('pu_superjump', 16, 16, (g) => {
            g.fillStyle(0x44ff44);
            g.fillTriangle(8, 0, 15, 9, 1, 9);
            g.fillRect(5, 9, 6, 7);
        });
        // Double Stardust - x2
        this._genTex('pu_double', 16, 16, (g) => {
            g.fillStyle(0xffd700);
            g.fillRect(2, 2, 5, 3); g.fillRect(5, 5, 3, 3); g.fillRect(2, 8, 3, 3); g.fillRect(2, 11, 6, 3);
            g.fillRect(10, 4, 2, 4); g.fillRect(12, 2, 2, 4); g.fillRect(10, 8, 2, 4); g.fillRect(12, 10, 2, 4);
        });
        // Invincibility - star
        this._genTex('pu_invincible', 16, 16, (g) => {
            g.fillStyle(0xffffff);
            g.fillTriangle(8, 0, 10, 6, 16, 6);
            g.fillTriangle(8, 0, 6, 6, 0, 6);
            g.fillTriangle(2, 10, 8, 7, 14, 10);
            g.fillTriangle(2, 10, 5, 15, 8, 7);
            g.fillTriangle(14, 10, 11, 15, 8, 7);
        });
    }

    generateBossTextures() {
        BOSS_TYPES.forEach(boss => {
            this._genTex('boss_' + boss.type, boss.width, boss.height, (g) => {
                const w = boss.width;
                const h = boss.height;
                // Body
                g.fillStyle(boss.color);
                g.fillRoundedRect(2, h * 0.2, w - 4, h * 0.7, 6);
                // Eyes
                g.fillStyle(0xffffff);
                g.fillCircle(w * 0.3, h * 0.35, 5);
                g.fillCircle(w * 0.7, h * 0.35, 5);
                g.fillStyle(boss.eyeColor);
                g.fillCircle(w * 0.3, h * 0.35, 3);
                g.fillCircle(w * 0.7, h * 0.35, 3);
                // Angry eyebrows
                g.lineStyle(2, boss.color);
                g.beginPath();
                g.moveTo(w * 0.15, h * 0.2); g.lineTo(w * 0.4, h * 0.28);
                g.strokePath();
                g.beginPath();
                g.moveTo(w * 0.85, h * 0.2); g.lineTo(w * 0.6, h * 0.28);
                g.strokePath();
                // Mouth
                g.lineStyle(2, 0x000000);
                g.beginPath();
                g.moveTo(w * 0.3, h * 0.6); g.lineTo(w * 0.5, h * 0.55); g.lineTo(w * 0.7, h * 0.6);
                g.strokePath();
            });
        });
    }

    _genTex(key, w, h, drawFn) {
        const g = this.make.graphics({ add: false });
        drawFn(g);
        g.generateTexture(key, w, h);
        g.destroy();
    }
}
