const BOSS_TYPES = [
    { type: 'bouncer',  name: 'Grumpy Snail',     color: 0x66aa44, eyeColor: 0xff0000, width: 40, height: 36, baseHp: 3, speed: 80,  pattern: 'pace' },
    { type: 'floater',  name: 'Moon Jelly',        color: 0x8888cc, eyeColor: 0xffff00, width: 44, height: 40, baseHp: 3, speed: 60,  pattern: 'float' },
    { type: 'charger',  name: 'Candy Crab',        color: 0xff66aa, eyeColor: 0x000000, width: 48, height: 32, baseHp: 3, speed: 200, pattern: 'charge' },
    { type: 'jumper',   name: 'Frost Frog',        color: 0x66ccee, eyeColor: 0xff4444, width: 40, height: 36, baseHp: 4, speed: 100, pattern: 'hop' },
    { type: 'spinner',  name: 'Lava Beetle',       color: 0xcc4422, eyeColor: 0xffaa00, width: 44, height: 40, baseHp: 4, speed: 120, pattern: 'pace' },
    { type: 'swooper',  name: 'Crystal Bat',       color: 0xaa44cc, eyeColor: 0x44ffff, width: 48, height: 36, baseHp: 4, speed: 140, pattern: 'float' },
    { type: 'rusher',   name: 'Cloud Ram',         color: 0xccccee, eyeColor: 0xff6644, width: 44, height: 40, baseHp: 5, speed: 180, pattern: 'charge' },
    { type: 'stomper',  name: 'Junk Golem',        color: 0x886644, eyeColor: 0x44ff44, width: 52, height: 48, baseHp: 5, speed: 70,  pattern: 'hop' },
    { type: 'dasher',   name: 'Neon Wasp',         color: 0x44ffaa, eyeColor: 0xff00ff, width: 40, height: 36, baseHp: 5, speed: 220, pattern: 'charge' },
    { type: 'overlord', name: 'Station Commander', color: 0x555566, eyeColor: 0xff0000, width: 56, height: 52, baseHp: 6, speed: 150, pattern: 'hop' }
];

function getBossForLevel(levelNum) {
    if (levelNum % 5 !== 0) return null;
    const bossIndex = (Math.floor(levelNum / 5) - 1) % BOSS_TYPES.length;
    const encounter = Math.floor((levelNum / 5 - 1) / BOSS_TYPES.length);
    const base = BOSS_TYPES[bossIndex];
    return {
        ...base,
        hp: base.baseHp + encounter * 2,
        speed: base.speed + encounter * 20
    };
}
