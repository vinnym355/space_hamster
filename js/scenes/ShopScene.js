class ShopScene extends Phaser.Scene {
    constructor() {
        super('Shop');
    }

    create() {
        this.cameras.main.fadeIn(400);

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a1a4e, 0x1a1a4e, 1);
        bg.fillRect(0, 0, 800, 600);

        // Title
        this.add.text(400, 25, 'SQUEAKY\'S SHOP', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#ff88cc',
            stroke: '#000',
            strokeThickness: 5
        }).setOrigin(0.5);

        // Wallet display
        const walletIcon = this.add.image(680, 25, 'stardust').setScale(2);
        this.tweens.add({ targets: walletIcon, angle: 360, duration: 4000, repeat: -1 });
        this.walletText = this.add.text(700, 15, String(SaveManager.getStardust()), {
            fontFamily: 'Arial Black',
            fontSize: '20px',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 3
        });

        // Status message
        this.statusText = this.add.text(400, 575, '', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#88ff88',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0);

        // --- Left panel: Squeaky preview ---
        this.add.graphics()
            .fillStyle(0x222244, 0.6)
            .fillRoundedRect(20, 55, 200, 280, 10)
            .lineStyle(2, 0x4466aa)
            .strokeRoundedRect(20, 55, 200, 280, 10);

        this.add.text(120, 65, 'PREVIEW', {
            fontFamily: 'Arial Black',
            fontSize: '14px',
            color: '#88ccff',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.previewSprite = this.add.image(120, 180, 'squeaky').setScale(5);
        this.tweens.add({
            targets: this.previewSprite,
            y: 175,
            angle: { from: -3, to: 3 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Preview cosmetic overlays
        this.previewHelmet = this.add.image(120, 130, '__DEFAULT').setScale(5).setVisible(false);
        this.previewSuit = this.add.image(120, 190, '__DEFAULT').setScale(5).setVisible(false).setAlpha(0.7);
        this.previewJetpack = this.add.image(90, 185, '__DEFAULT').setScale(5).setVisible(false);

        // Equipped label
        this.equippedText = this.add.text(120, 290, '', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#aaaacc',
            stroke: '#000',
            strokeThickness: 2,
            align: 'center',
            wordWrap: { width: 180 }
        }).setOrigin(0.5);

        this.updatePreview();

        // --- Category tabs ---
        this.currentCategory = 0;
        this.tabButtons = [];

        SHOP_CATEGORIES.forEach((cat, i) => {
            const tabX = 260 + i * 130;
            const tabY = 62;
            const label = cat.charAt(0).toUpperCase() + cat.slice(1) + 's';

            const tabBg = this.add.graphics();
            const tabText = this.add.text(tabX, tabY, label, {
                fontFamily: 'Arial Black',
                fontSize: '14px',
                color: '#ffffff',
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            tabText.on('pointerdown', () => {
                this.currentCategory = i;
                this.updateTabs();
                this.updateItemGrid();
            });

            this.tabButtons.push({ bg: tabBg, text: tabText, x: tabX, y: tabY });
        });

        this.updateTabs();

        // --- Item grid ---
        this.itemContainer = this.add.container(0, 0);
        this.updateItemGrid();

        // Back button
        const backBtn = this.add.text(50, 25, '< BACK', {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#aaaacc',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#ffdd66'));
        backBtn.on('pointerout', () => backBtn.setColor('#aaaacc'));
        backBtn.on('pointerdown', () => this.goBack());

        // ESC to go back
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this._transitioning = false;
    }

    updateTabs() {
        this.tabButtons.forEach((tab, i) => {
            tab.bg.clear();
            if (i === this.currentCategory) {
                tab.bg.fillStyle(0x4466aa, 0.7);
                tab.bg.fillRoundedRect(tab.x - 55, tab.y - 14, 110, 28, 6);
                tab.text.setColor('#ffdd66');
            } else {
                tab.bg.fillStyle(0x333355, 0.3);
                tab.bg.fillRoundedRect(tab.x - 55, tab.y - 14, 110, 28, 6);
                tab.text.setColor('#aaaacc');
            }
        });
    }

    updateItemGrid() {
        this.itemContainer.removeAll(true);

        const category = SHOP_CATEGORIES[this.currentCategory];
        const items = getShopItemsByCategory(category);
        const startX = 250;
        const startY = 95;
        const cardW = 250;
        const cardH = 70;
        const cols = 2;

        items.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = startX + col * (cardW + 15);
            const cy = startY + row * (cardH + 10);

            const owned = SaveManager.hasPurchased(item.id);
            const equipped = SaveManager.getEquipped();
            const isEquipped = equipped[category] === item.id;

            // Card background
            const card = this.add.graphics();
            card.fillStyle(isEquipped ? 0x446644 : 0x222244, 0.7);
            card.fillRoundedRect(cx, cy, cardW, cardH, 8);
            card.lineStyle(2, isEquipped ? 0x88ff88 : (owned ? 0x6688aa : 0x444466));
            card.strokeRoundedRect(cx, cy, cardW, cardH, 8);
            this.itemContainer.add(card);

            // Item icon
            if (this.textures.exists(item.id)) {
                const icon = this.add.image(cx + 30, cy + cardH / 2, item.id).setScale(2);
                this.itemContainer.add(icon);
            }

            // Item name
            const nameText = this.add.text(cx + 60, cy + 10, item.name, {
                fontFamily: 'Arial Black',
                fontSize: '13px',
                color: '#ffffff',
                stroke: '#000',
                strokeThickness: 2
            });
            this.itemContainer.add(nameText);

            // Description
            const descText = this.add.text(cx + 60, cy + 30, item.desc, {
                fontFamily: 'Arial',
                fontSize: '10px',
                color: '#aaaacc'
            });
            this.itemContainer.add(descText);

            // Action button
            let btnLabel, btnColor, btnAction;
            if (isEquipped) {
                btnLabel = 'UNEQUIP';
                btnColor = '#88ff88';
                btnAction = () => {
                    SaveManager.unequipItem(category);
                    this.updateItemGrid();
                    this.updatePreview();
                    this.showStatus('Unequipped ' + item.name);
                };
            } else if (owned) {
                btnLabel = 'EQUIP';
                btnColor = '#88ccff';
                btnAction = () => {
                    SaveManager.equipItem(category, item.id);
                    this.updateItemGrid();
                    this.updatePreview();
                    this.showStatus('Equipped ' + item.name + '!');
                };
            } else {
                btnLabel = item.price + ' ★';
                btnColor = SaveManager.getStardust() >= item.price ? '#ffd700' : '#ff4444';
                btnAction = () => {
                    if (SaveManager.spendStardust(item.price)) {
                        SaveManager.purchaseItem(item.id);
                        this.walletText.setText(String(SaveManager.getStardust()));
                        this.updateItemGrid();
                        this.showStatus('Purchased ' + item.name + '!');
                    } else {
                        this.showStatus('Not enough stardust!', '#ff4444');
                    }
                };
            }

            const actionBtn = this.add.text(cx + cardW - 10, cy + cardH / 2, btnLabel, {
                fontFamily: 'Arial Black',
                fontSize: '12px',
                color: btnColor,
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

            actionBtn.on('pointerover', () => {
                actionBtn.setScale(1.1);
                // Preview on hover
                this.showPreviewItem(category, item.id);
            });
            actionBtn.on('pointerout', () => {
                actionBtn.setScale(1);
                this.updatePreview();
            });
            actionBtn.on('pointerdown', btnAction);
            this.itemContainer.add(actionBtn);

            // Hover on entire card to preview
            const hitZone = this.add.zone(cx + cardW / 2, cy + cardH / 2, cardW, cardH)
                .setInteractive({ useHandCursor: true });
            hitZone.on('pointerover', () => {
                card.clear();
                card.fillStyle(isEquipped ? 0x557755 : 0x334466, 0.8);
                card.fillRoundedRect(cx, cy, cardW, cardH, 8);
                card.lineStyle(2, 0xffdd66);
                card.strokeRoundedRect(cx, cy, cardW, cardH, 8);
                this.showPreviewItem(category, item.id);
            });
            hitZone.on('pointerout', () => {
                card.clear();
                card.fillStyle(isEquipped ? 0x446644 : 0x222244, 0.7);
                card.fillRoundedRect(cx, cy, cardW, cardH, 8);
                card.lineStyle(2, isEquipped ? 0x88ff88 : (owned ? 0x6688aa : 0x444466));
                card.strokeRoundedRect(cx, cy, cardW, cardH, 8);
                this.updatePreview();
            });
            hitZone.on('pointerdown', btnAction);
            this.itemContainer.add(hitZone);
        });
    }

    showPreviewItem(category, itemId) {
        // Temporarily show an item on the preview
        if (category === 'helmet') {
            if (this.textures.exists(itemId)) {
                this.previewHelmet.setTexture(itemId).setVisible(true);
            }
        } else if (category === 'suit') {
            if (this.textures.exists(itemId)) {
                this.previewSuit.setTexture(itemId).setVisible(true);
            }
        } else if (category === 'jetpack') {
            if (this.textures.exists(itemId)) {
                this.previewJetpack.setTexture(itemId).setVisible(true);
            }
        }
    }

    updatePreview() {
        const equipped = SaveManager.getEquipped();

        // Helmet
        if (equipped.helmet && this.textures.exists(equipped.helmet)) {
            this.previewHelmet.setTexture(equipped.helmet).setVisible(true);
        } else {
            this.previewHelmet.setVisible(false);
        }

        // Suit
        if (equipped.suit && this.textures.exists(equipped.suit)) {
            this.previewSuit.setTexture(equipped.suit).setVisible(true);
        } else {
            this.previewSuit.setVisible(false);
        }

        // Jetpack
        if (equipped.jetpack && this.textures.exists(equipped.jetpack)) {
            this.previewJetpack.setTexture(equipped.jetpack).setVisible(true);
        } else {
            this.previewJetpack.setVisible(false);
        }

        // Equipped text
        const parts = [];
        if (equipped.helmet) { const it = getShopItem(equipped.helmet); if (it) parts.push(it.name); }
        if (equipped.suit) { const it = getShopItem(equipped.suit); if (it) parts.push(it.name); }
        if (equipped.jetpack) { const it = getShopItem(equipped.jetpack); if (it) parts.push(it.name); }
        if (equipped.emote) { const it = getShopItem(equipped.emote); if (it) parts.push(it.name); }
        this.equippedText.setText(parts.length > 0 ? 'Wearing: ' + parts.join(', ') : 'No items equipped');
    }

    showStatus(msg, color) {
        color = color || '#88ff88';
        this.statusText.setText(msg).setColor(color).setAlpha(1);
        this.tweens.add({
            targets: this.statusText,
            alpha: 0,
            duration: 2000,
            delay: 1000
        });
    }

    goBack() {
        if (this._transitioning) return;
        this._transitioning = true;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Menu');
        });
    }

    update() {
        if (this._transitioning) return;

        if (this.escKey.isDown) {
            this.goBack();
            return;
        }

        // Gamepad B to go back
        if (this.input.gamepad && this.input.gamepad.total > 0) {
            const pad = this.input.gamepad.getPad(0);
            if (pad && pad.buttons[1] && pad.buttons[1].pressed) {
                this.goBack();
            }
        }
    }
}
