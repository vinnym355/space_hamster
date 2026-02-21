const SHOP_CATEGORIES = ['helmet', 'suit', 'jetpack', 'emote', 'sound'];

const SHOP_ITEMS = [
    // --- Helmets ---
    { id: 'hat_party',     category: 'helmet',  name: 'Party Hat',       price: 40,  color: 0xff44aa, desc: 'Every day is a party!' },
    { id: 'hat_crown',     category: 'helmet',  name: 'Crown',           price: 50,  color: 0xffd700, desc: 'Royal hamster vibes' },
    { id: 'hat_propeller', category: 'helmet',  name: 'Propeller Beanie',price: 75,  color: 0x44aaff, desc: 'Spin to win!' },
    { id: 'hat_googly',    category: 'helmet',  name: 'Googly Eyes',     price: 100, color: 0xffffff, desc: 'O_o eyes that wiggle' },
    { id: 'hat_fishbowl',  category: 'helmet',  name: 'Fish Bowl',       price: 150, color: 0x66ddff, desc: 'A fish lives in there!' },
    { id: 'hat_viking',    category: 'helmet',  name: 'Viking Horns',    price: 200, color: 0xaa7744, desc: 'Hamster of the north!' },

    // --- Suits ---
    { id: 'suit_duck',     category: 'suit',    name: 'Duck Ring',       price: 60,  color: 0xffdd00, desc: 'Quack quack!' },
    { id: 'suit_pizza',    category: 'suit',    name: 'Pizza Pattern',   price: 80,  color: 0xff8833, desc: 'Cheesy fashion' },
    { id: 'suit_glow',     category: 'suit',    name: 'Glow Sticks',     price: 100, color: 0x44ff88, desc: 'Rave hamster!' },
    { id: 'suit_disco',    category: 'suit',    name: 'Disco Ball',      price: 120, color: 0xccccff, desc: 'Sparkling dancer' },

    // --- Jetpacks ---
    { id: 'jet_balloon',   category: 'jetpack', name: 'Balloon Cluster', price: 80,  color: 0xff6688, desc: 'Float away!' },
    { id: 'jet_soda',      category: 'jetpack', name: 'Soda Rockets',    price: 100, color: 0xff4444, desc: 'Fizzy propulsion' },
    { id: 'jet_toaster',   category: 'jetpack', name: 'Toaster Pack',    price: 150, color: 0xccaa66, desc: 'Toast-powered flight' },
    { id: 'jet_butterfly',  category: 'jetpack', name: 'Butterfly Wings', price: 200, color: 0xee88ff, desc: 'Beautiful flutter' },

    // --- Emotes ---
    { id: 'emote_dab',     category: 'emote',   name: 'Victory Dab',     price: 50,  color: 0xff4488, desc: 'Dab on the haters' },
    { id: 'emote_guns',    category: 'emote',   name: 'Finger Guns',     price: 60,  color: 0xffaa00, desc: 'Pew pew!' },
    { id: 'emote_walk',    category: 'emote',   name: 'Moonwalk',        price: 75,  color: 0xaaaaff, desc: 'Smooth moves' },
    { id: 'emote_faint',   category: 'emote',   name: 'Dramatic Faint',  price: 90,  color: 0xff6666, desc: 'So dramatic!' },

    // --- Sound Packs ---
    { id: 'snd_silly',    category: 'sound',   name: 'Silly Sounds',    price: 60,  color: 0xff88ff, desc: 'Boings, squishes & toots!' },
    { id: 'snd_scifi',    category: 'sound',   name: 'Sci-Fi Sounds',   price: 80,  color: 0x44ffff, desc: 'Lasers & whooshes!' },
    { id: 'snd_musical',  category: 'sound',   name: 'Musical Sounds',  price: 100, color: 0xffdd44, desc: 'Notes & chimes!' },
    { id: 'snd_retro',    category: 'sound',   name: 'Retro 8-Bit',     price: 75,  color: 0x44ff44, desc: 'Classic beeps & boops!' }
];

function getShopItemsByCategory(category) {
    return SHOP_ITEMS.filter(item => item.category === category);
}

function getShopItem(id) {
    return SHOP_ITEMS.find(item => item.id === id);
}
