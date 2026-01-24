/**
 * カラテゲーム (Karate Game)
 * Tap anywhere on screen to play random punch or kick animation
 * Sprite sheet: 2 rows x 8 columns (2378x565 total, 297x282.5 per frame)
 * Idle: 7 ↔ 15
 * Punch: 7 → 6 → 5 → 4 → 3 → 2
 * Kick: 15 → 14 → 13 → 12 → 11 → 10 → 9 → 8
 */

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js';

class KarateGame extends Phaser.Scene {
    constructor() {
        super({ key: 'KarateGame' });
    }

    preload() {
        // Load sprite sheet: 8 cols x 2 rows (2378x565 total)
        // frameWidth: 2378 / 8 = 297.25 ≈ 297
        // frameHeight: 565 / 2 = 282.5 (use exact to get exactly 2 rows)
        this.load.spritesheet('karate', 'images/game/karateman.png', {
            frameWidth: 297,
            frameHeight: 282.5,
            endFrame: 15  // Only load frames 0-15
        });

        this.load.on('loaderror', (file) => {
            console.error('Error loading:', file.src);
        });
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(0, 0, width, height, 0x2C3E50).setOrigin(0, 0);

        // Idle animation: alternate between frames 7 and 15
        this.anims.create({
            key: 'idle',
            frames: [
                { key: 'karate', frame: 7 },
                { key: 'karate', frame: 15 }
            ],
            frameRate: 2,
            repeat: -1
        });

        // Punch animation: 7 → 6 → 5 → 4 → 3 → 2
        this.anims.create({
            key: 'punch',
            frames: [
                { key: 'karate', frame: 7 },
                { key: 'karate', frame: 6 },
                { key: 'karate', frame: 5 },
                { key: 'karate', frame: 4 },
                { key: 'karate', frame: 3 },
                { key: 'karate', frame: 2 }
            ],
            frameRate: 12,
            repeat: 0
        });

        // Kick animation: 15 → 14 → 13 → 12 → 11 → 10 → 9 → 8
        this.anims.create({
            key: 'kick',
            frames: [
                { key: 'karate', frame: 15 },
                { key: 'karate', frame: 14 },
                { key: 'karate', frame: 13 },
                { key: 'karate', frame: 12 },
                { key: 'karate', frame: 11 },
                { key: 'karate', frame: 10 },
                { key: 'karate', frame: 9 },
                { key: 'karate', frame: 8 }
            ],
            frameRate: 12,
            repeat: 0
        });

        // Create main character sprite - positioned higher up on screen
        this.player = this.add.sprite(width / 2, height / 3, 'karate');
        this.player.setScale(1.67);
        this.player.play('idle');

        // Return to idle after action animations complete
        this.player.on('animationcomplete', (animation) => {
            if (animation.key === 'punch' || animation.key === 'kick') {
                this.player.play('idle');
            }
        });

        // Make entire screen tappable for random animation
        this.input.on('pointerdown', () => {
            const currentAnim = this.player.anims.currentAnim;
            
            // Only play new animation if currently idle
            if (!currentAnim || currentAnim.key === 'idle') {
                // Randomly choose punch or kick (50/50 chance)
                const randomAction = Math.random() < 0.5 ? 'punch' : 'kick';
                this.player.play(randomAction);
            }
        });
    }

}

// Game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'gameContent',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#87CEEB',
    scene: KarateGame,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Initialize game
const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
