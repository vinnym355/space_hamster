const SaveManager = {
    STORAGE_KEY: 'space_hamster_save',

    _data: null,

    _defaults() {
        return {
            unlockedLevel: 100,
            stardust: 999999,
            purchased: [],
            equipped: { helmet: null, suit: null, jetpack: null, emote: null, sound: null },
            levelStars: {},   // { "1": 3, "2": 2, ... }
            levelBest: {}     // { "1": 18, "2": 12, ... } best stardust count per level
        };
    },

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                this._data = Object.assign(this._defaults(), JSON.parse(raw));
            } else {
                this._data = this._defaults();
            }
        } catch (e) {
            this._data = this._defaults();
        }
        return this._data;
    },

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._data));
        } catch (e) { /* quota exceeded or private mode */ }
    },

    getData() {
        if (!this._data) this.load();
        return this._data;
    },

    getStardust() {
        return this.getData().stardust;
    },

    addStardust(amount) {
        this.getData().stardust += amount;
        this.save();
    },

    spendStardust(amount) {
        // DEBUG: infinite stardust — always succeed, never deduct
        return true;
    },

    getUnlockedLevel() {
        return this.getData().unlockedLevel;
    },

    unlockLevel(n) {
        const d = this.getData();
        if (n > d.unlockedLevel) {
            d.unlockedLevel = n;
            this.save();
        }
    },

    setLevelResult(levelNum, stardustCollected, stardustTotal) {
        const d = this.getData();
        const key = String(levelNum);
        const ratio = stardustTotal > 0 ? stardustCollected / stardustTotal : 0;
        let stars = 1;
        if (ratio >= 0.5) stars = 2;
        if (ratio >= 1) stars = 3;

        const prevStars = d.levelStars[key] || 0;
        const prevBest = d.levelBest[key] || 0;

        if (stars > prevStars) d.levelStars[key] = stars;
        if (stardustCollected > prevBest) d.levelBest[key] = stardustCollected;

        this.save();
        return stars;
    },

    getLevelStars(levelNum) {
        return this.getData().levelStars[String(levelNum)] || 0;
    },

    purchaseItem(itemId) {
        const d = this.getData();
        if (!d.purchased.includes(itemId)) {
            d.purchased.push(itemId);
            this.save();
        }
    },

    hasPurchased(itemId) {
        return this.getData().purchased.includes(itemId);
    },

    equipItem(slot, itemId) {
        const d = this.getData();
        d.equipped[slot] = itemId;
        this.save();
    },

    unequipItem(slot) {
        const d = this.getData();
        d.equipped[slot] = null;
        this.save();
    },

    getEquipped() {
        return this.getData().equipped;
    },

    resetAll() {
        this._data = this._defaults();
        this.save();
    }
};
