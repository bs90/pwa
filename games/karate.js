/**
 * カラテゲーム (Karate Game)
 * Tap anywhere on screen to play random punch or kick animation
 * Sprite sheet: 2 rows x 8 columns (2391x583 total, 299x291 per frame)
 * Row 1: frames 0-7 (punch animation)
 * Row 2: frames 8-15 (kick animation)
 */

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js';

class KarateGame extends Phaser.Scene {
    constructor() {
        super({ key: 'KarateGame' });
    }

    preload() {
        // Load sprite sheet: 8 cols x 2 rows (2391x583 total)
        // Skip first 2px from left edge
        this.load.spritesheet('karate', 'images/game/karate_final.png', {
            frameWidth: 299,   // 2389 / 8
            frameHeight: 292,  // 583 / 2
            startFrame: 0,
            endFrame: 15,
            margin: 2,         // Skip 2px from the left edge
            spacing: 0
        });

        this.load.on('loaderror', (file) => {
            console.error('Error loading:', file.src);
        });
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(0, 0, width, height, 0x2C3E50).setOrigin(0, 0);

        // Create animations
        // Idle animation (standing still)
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'karate', frame: 6 }],
            frameRate: 10,
            repeat: -1
        });

        // Punch animation: 6 → 5 → 4 → 3 → 2
        this.anims.create({
            key: 'punch',
            frames: [
                { key: 'karate', frame: 6 },
                { key: 'karate', frame: 5 },
                { key: 'karate', frame: 4 },
                { key: 'karate', frame: 3 },
                { key: 'karate', frame: 2 }
            ],
            frameRate: 10,
            repeat: 0
        });

        // Kick animation: Row 2 frames 8-15 (forward sequence)
        this.anims.create({
            key: 'kick',
            frames: this.anims.generateFrameNumbers('karate', { start: 8, end: 15 }),
            frameRate: 10,
            repeat: 0
        });

        // Create main character sprite - positioned higher up on screen
        this.player = this.add.sprite(width / 2, height / 3, 'karate');
        this.player.setScale(1.67); // 2.5 * (2/3) = 1.67
        this.player.play('idle'); // Start with idle animation

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
