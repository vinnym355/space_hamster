const POWER_UPS = [
    { id: 'pu_speed',      name: 'Speed Boost',     color: 0xffdd00, duration: 5000,  desc: 'Zoom zoom!' },
    { id: 'pu_shield',     name: 'Shield',          color: 0x44ddff, duration: -1,     desc: 'Survive one fall!' },
    { id: 'pu_magnet',     name: 'Stardust Magnet', color: 0xff4444, duration: 6000,  desc: 'Attract stardust!' },
    { id: 'pu_superjump',  name: 'Super Jump',      color: 0x44ff44, duration: 5000,  desc: 'Jump higher!' },
    { id: 'pu_double',     name: 'Double Stardust',  color: 0xffd700, duration: -1,     desc: 'x2 stardust!' },
    { id: 'pu_invincible', name: 'Invincibility',   color: 0xffffff, duration: 4000,  desc: 'Unstoppable!' }
];

function getPowerUpData(id) {
    return POWER_UPS.find(p => p.id === id);
}

function getRandomPowerUpId(rand) {
    return POWER_UPS[Math.floor(rand * POWER_UPS.length)].id;
}
