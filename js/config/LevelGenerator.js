const PLANET_THEMES = [
    { name: 'Green Planet',    groundColor: 0x4CAF50, groundTop: 0x66BB6A, platformColor: 0x6a8a6a, bgTop: 0x0a2e0a, bgBot: 0x1a4e1a, starDensity: 1.0 },
    { name: 'Moon Base',       groundColor: 0x888899, groundTop: 0xaaaabb, platformColor: 0x7777aa, bgTop: 0x0a0a2e, bgBot: 0x1a1a3e, starDensity: 1.5 },
    { name: 'Candy Planet',    groundColor: 0xff88aa, groundTop: 0xffaacc, platformColor: 0xcc77aa, bgTop: 0x2e0a1a, bgBot: 0x4e1a3a, starDensity: 0.8 },
    { name: 'Ice World',       groundColor: 0x88ccee, groundTop: 0xaaddff, platformColor: 0x6699bb, bgTop: 0x0a1a2e, bgBot: 0x1a3a5e, starDensity: 1.2 },
    { name: 'Lava Planet',     groundColor: 0xaa4422, groundTop: 0xcc5533, platformColor: 0x8a5a3a, bgTop: 0x2e0a0a, bgBot: 0x4e1a0a, starDensity: 0.6 },
    { name: 'Crystal Caves',   groundColor: 0x8844aa, groundTop: 0xaa66cc, platformColor: 0x7755aa, bgTop: 0x1a0a2e, bgBot: 0x3a1a5e, starDensity: 0.9 },
    { name: 'Cloud Kingdom',   groundColor: 0xccccdd, groundTop: 0xeeeeff, platformColor: 0xaabbcc, bgTop: 0x2244aa, bgBot: 0x4466cc, starDensity: 0.5 },
    { name: 'Junk Yard',       groundColor: 0x886644, groundTop: 0xaa8866, platformColor: 0x776655, bgTop: 0x1a1a0a, bgBot: 0x2e2e1a, starDensity: 0.7 },
    { name: 'Neon City',       groundColor: 0x224466, groundTop: 0x336688, platformColor: 0x445588, bgTop: 0x0a0a1e, bgBot: 0x1a0a2e, starDensity: 1.3 },
    { name: 'Boss Station',    groundColor: 0x333344, groundTop: 0x444455, platformColor: 0x555566, bgTop: 0x050510, bgBot: 0x0a0a20, starDensity: 2.0 }
];

const LevelGenerator = {
    // Simple seeded PRNG (mulberry32)
    _seed: 1,
    _rand() {
        let t = this._seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },

    _randBetween(min, max) {
        return min + this._rand() * (max - min);
    },

    _randInt(min, max) {
        return Math.floor(this._randBetween(min, max + 1));
    },

    getTheme(levelNum) {
        const idx = Math.floor((levelNum - 1) / 10) % PLANET_THEMES.length;
        return PLANET_THEMES[idx];
    },

    getDifficulty(levelNum) {
        // Returns 0.0 (easiest) to 1.0 (hardest)
        return Math.min((levelNum - 1) / 99, 1.0);
    },

    isBossLevel(levelNum) {
        return levelNum % 5 === 0;
    },

    generateLevel(levelNum) {
        this._seed = levelNum * 12345 + 67890;
        const diff = this.getDifficulty(levelNum);
        const theme = this.getTheme(levelNum);
        const isBoss = this.isBossLevel(levelNum);

        // Boss levels get a flat arena
        if (isBoss) {
            return this._generateBossLevel(levelNum, diff, theme);
        }

        // Scale parameters with difficulty
        const levelWidth = Math.floor(2400 + diff * 2400);       // 2400 → 4800
        const groundY = 520;
        const groundHeight = 80;
        const gapChance = 0.15 + diff * 0.25;                    // 15% → 40%
        const gapWidthMin = 100 + diff * 50;                     // 100 → 150
        const gapWidthMax = 150 + diff * 150;                    // 150 → 300
        const platformCount = Math.floor(8 + diff * 14);         // 8 → 22
        const stardustCount = Math.floor(10 + diff * 15);        // 10 → 25
        const minPlatY = 320 + (1 - diff) * 40;                  // 360 → 320 (reachable from ground)
        const maxPlatY = 460;

        // Generate ground segments with gaps
        const ground = [];
        let x = 0;
        const segMinWidth = Math.floor(300 - diff * 100);        // 300 → 200
        const segMaxWidth = Math.floor(600 - diff * 200);        // 600 → 400

        // Always start with solid ground under player
        const firstSegWidth = Math.max(300, this._randInt(segMinWidth, segMaxWidth));
        ground.push({ x: 0, y: groundY, width: firstSegWidth, height: groundHeight });
        x = firstSegWidth;

        while (x < levelWidth - 400) {
            if (this._rand() < gapChance) {
                // Gap
                const gapW = this._randInt(gapWidthMin, gapWidthMax);
                x += gapW;
            }
            const segW = this._randInt(segMinWidth, segMaxWidth);
            if (x + segW > levelWidth) break;
            ground.push({ x: x, y: groundY, width: segW, height: groundHeight });
            x += segW;
        }
        // Final segment to finish line
        if (x < levelWidth) {
            ground.push({ x: x, y: groundY, width: levelWidth - x, height: groundHeight });
        }

        // Generate floating platforms
        const platforms = [];
        const usedZones = [];

        for (let i = 0; i < platformCount; i++) {
            let px, py, pw;
            let attempts = 0;
            do {
                pw = this._rand() > 0.5 ? 128 : 96;
                px = this._randInt(200, levelWidth - 200);
                py = this._randInt(minPlatY, maxPlatY);
                attempts++;
            } while (attempts < 20 && usedZones.some(z =>
                Math.abs(z.x - px) < 120 && Math.abs(z.y - py) < 60
            ));

            platforms.push({ x: px, y: py, width: pw, height: 24 });
            usedZones.push({ x: px, y: py });
        }

        // Place platforms over gaps to ensure traversability
        for (let i = 0; i < ground.length - 1; i++) {
            const gapStart = ground[i].x + ground[i].width;
            const gapEnd = ground[i + 1].x;
            const gapWidth = gapEnd - gapStart;

            if (gapWidth > 200) {
                // Place a stepping stone platform in the middle of wide gaps
                const midX = gapStart + gapWidth / 2;
                platforms.push({ x: midX - 48, y: groundY - 60 - this._randInt(0, 40), width: 96, height: 24 });
            }
        }

        // Generate stardust — only on ground or on reachable platforms
        const stardust = [];

        // Filter platforms to only those with ground nearby to jump from
        const reachablePlatforms = platforms.filter(plat => {
            const platCenterX = plat.x + plat.width / 2;
            return ground.some(g =>
                platCenterX >= g.x - 80 && platCenterX <= g.x + g.width + 80
            );
        });

        // 50% on ground level (always reachable by walking)
        const groundStarCount = Math.floor(stardustCount * 0.5);
        for (let i = 0; i < groundStarCount; i++) {
            const seg = ground[this._randInt(0, ground.length - 1)];
            const margin = Math.min(20, Math.floor(seg.width * 0.1));
            stardust.push({
                x: seg.x + this._randInt(margin, Math.max(margin + 1, seg.width - margin)),
                y: groundY - 30
            });
        }

        // 50% on reachable platforms (fall back to ground if none available)
        const platStarCount = stardustCount - groundStarCount;
        for (let i = 0; i < platStarCount; i++) {
            if (reachablePlatforms.length > 0) {
                const plat = reachablePlatforms[i % reachablePlatforms.length];
                stardust.push({
                    x: plat.x + plat.width / 2 + this._randInt(-10, 10),
                    y: plat.y - 20
                });
            } else {
                // No reachable platforms — put on ground instead
                const seg = ground[this._randInt(0, ground.length - 1)];
                const margin = Math.min(20, Math.floor(seg.width * 0.1));
                stardust.push({
                    x: seg.x + this._randInt(margin, Math.max(margin + 1, seg.width - margin)),
                    y: groundY - 30
                });
            }
        }

        // Power-ups: 1-3 in regular levels
        const powerups = [];
        const puCount = this._randInt(1, 3);
        for (let i = 0; i < puCount; i++) {
            const seg = ground[this._randInt(0, ground.length - 1)];
            const margin = Math.min(40, Math.floor(seg.width * 0.1));
            powerups.push({
                x: seg.x + this._randInt(margin, Math.max(margin + 1, seg.width - margin)),
                y: groundY - 30,
                type: getRandomPowerUpId(this._rand())
            });
        }

        return {
            levelNum: levelNum,
            width: levelWidth,
            height: 600,
            theme: theme,
            playerStart: { x: 80, y: groundY - 80 },
            finishFlag: { x: levelWidth - 100, y: groundY - 60 },
            ground: ground,
            platforms: platforms,
            stardust: stardust,
            powerups: powerups,
            boss: null
        };
    },

    _generateBossLevel(levelNum, diff, theme) {
        const groundY = 520;
        const groundHeight = 80;
        const arenaWidth = 1200;

        // Flat arena — one big ground, no gaps
        const ground = [
            { x: 0, y: groundY, width: arenaWidth, height: groundHeight }
        ];

        // A couple elevated platforms for dodging
        const platforms = [
            { x: 200, y: 400, width: 128, height: 24 },
            { x: 500, y: 360, width: 96, height: 24 },
            { x: 850, y: 400, width: 128, height: 24 }
        ];

        // Minimal stardust (boss drops reward)
        const stardust = [];
        for (let i = 0; i < 5; i++) {
            stardust.push({
                x: 100 + this._randInt(0, arenaWidth - 200),
                y: groundY - 30
            });
        }

        // One helpful power-up near player start (shield or invincibility)
        const helpfulPU = this._rand() > 0.5 ? 'pu_shield' : 'pu_invincible';
        const powerups = [{
            x: 200,
            y: groundY - 30,
            type: helpfulPU
        }];

        // Boss data
        const bossData = getBossForLevel(levelNum);

        return {
            levelNum: levelNum,
            width: arenaWidth,
            height: 600,
            theme: theme,
            playerStart: { x: 80, y: groundY - 80 },
            finishFlag: { x: arenaWidth - 100, y: groundY - 60 },
            ground: ground,
            platforms: platforms,
            stardust: stardust,
            powerups: powerups,
            boss: bossData ? {
                ...bossData,
                x: arenaWidth / 2,
                y: groundY - 60
            } : null
        };
    }
};
