/**
 * カラテゲーム (Karate Game)
 * Tap anywhere on screen to play random punch or kick animation
 * Sprite sheet: 2 rows x 8 columns (2378x565 total, 297x282.5 per frame)
 * Idle: 7 ↔ 15
 * Punch: 7 → 6 → 5 → 4 → 3 → 2
 * Kick: 15 → 14 → 13 → 12 → 11 → 10 → 9 → 8
 */

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js';
import { MathQuiz } from '../js/quiz.js';

// ===== FALLING ITEM CLASS =====
class FallingItem {
    constructor(scene, x, y, emoji, type) {
        this.scene = scene;
        this.type = type;  // 'good' or 'bad'
        this.emoji = emoji;
        this.isActive = true;
        this.startY = y;
        
        // Physics for gravity
        this.velocityY = 0;  // Starting velocity
        this.gravity = 800;  // Pixels per second squared (gravity acceleration)
        
        // Create emoji text - 120x120px
        this.sprite = scene.add.text(x, y, emoji, {
            fontSize: '120px'  // 120x120px size
        }).setOrigin(0.5);
        
        this.sprite.setDepth(10);  // Above background, below player
    }
    
    update(delta) {
        if (!this.isActive) return;
        
        // Calculate hit zone bottom position
        const frameHeight = 297 * 1.67;
        const hitZoneOffsetY = -frameHeight / 4;
        const hitZoneY = this.scene.player.y + hitZoneOffsetY;
        const hitZoneBottom = hitZoneY + this.scene.itemConfig.hitZoneHeight / 2;
        
        // Stop position: 200px below hit zone
        const stopY = hitZoneBottom + 200;
        
        // Fall down with gravity until reaching stop position
        if (this.sprite.y < stopY) {
            // Apply gravity: v = v + a * t
            this.velocityY += this.gravity * (delta / 1000);
            
            // Update position: y = y + v * t
            this.sprite.y += this.velocityY * (delta / 1000);
            
            // Check if passed stop position
            if (this.sprite.y >= stopY) {
                this.sprite.y = stopY;  // Clamp to stop position
                this.velocityY = 0;     // Stop velocity
            }
        } else {
            // At stop position: fade out over 1 second
            this.sprite.alpha -= delta / 1000;  // Fade over 1 second
            
            if (this.sprite.alpha <= 0) {
                this.destroy();
            }
        }
        
        // Update bounds debug position
        if (this.boundsDebug) {
            this.boundsDebug.setPosition(this.sprite.x, this.sprite.y);
            this.boundsDebug.setAlpha(this.sprite.alpha * 0.1);  // Match sprite alpha
        }
    }
    
    // Launch item with parabola (for good items) - realistic physics
    launch() {
        this.isActive = false;  // Stop normal update
        
        // Initial velocity for parabolic arc
        const launchVelocityX = -500;  // Left
        const launchVelocityY = -300;  // Up initially
        const launchGravity = 1200;    // Gravity pulls down
        
        // Stop position
        const frameHeight = 297 * 1.67;
        const hitZoneOffsetY = -frameHeight / 4;
        const hitZoneY = this.scene.player.y + hitZoneOffsetY;
        const hitZoneBottom = hitZoneY + this.scene.itemConfig.hitZoneHeight / 2;
        const stopY = hitZoneBottom + 200;
        
        let velocityX = launchVelocityX;
        let velocityY = launchVelocityY;
        
        // Use time event for physics simulation
        const physicsUpdate = this.scene.time.addEvent({
            delay: 16,  // ~60 FPS
            callback: () => {
                // Apply gravity
                velocityY += launchGravity * 0.016;
                
                // Update position
                this.sprite.x += velocityX * 0.016;
                this.sprite.y += velocityY * 0.016;
                
                // Rotate
                this.sprite.angle += 10;
                
                // Check if reached stop position
                if (this.sprite.y >= stopY) {
                    this.sprite.y = stopY;
                    physicsUpdate.remove();
                    
                    // Fade out at stop position
                    this.scene.tweens.add({
                        targets: this.sprite,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => this.destroy()
                    });
                }
            },
            loop: true
        });
    }
    
    // Drop straight down (for bad items) with gravity
    drop() {
        this.isActive = false;
        
        // Calculate stop position: 200px below hit zone
        const frameHeight = 297 * 1.67;
        const hitZoneOffsetY = -frameHeight / 4;
        const hitZoneY = this.scene.player.y + hitZoneOffsetY;
        const hitZoneBottom = hitZoneY + this.scene.itemConfig.hitZoneHeight / 2;
        const stopY = hitZoneBottom + 200;
        
        // Reset velocity for dropping
        this.velocityY = 0;
        const dropGravity = 1000;
        
        // Use time event for gravity-based drop
        const dropUpdate = this.scene.time.addEvent({
            delay: 16,  // ~60 FPS
            callback: () => {
                // Apply gravity
                this.velocityY += dropGravity * 0.016;
                
                // Update position
                this.sprite.y += this.velocityY * 0.016;
                
                // Check if reached stop position
                if (this.sprite.y >= stopY) {
                    this.sprite.y = stopY;
                    dropUpdate.remove();
                    
                    // Fade out at stop position
                    this.scene.tweens.add({
                        targets: this.sprite,
                        alpha: 0,
                        duration: 1000,  // 1 second fade
                        onComplete: () => this.destroy()
                    });
                }
            },
            loop: true
        });
    }
    
    destroy() {
        this.isActive = false;
        this.sprite.destroy();
        
        // Destroy bounds debug
        if (this.boundsDebug) {
            this.boundsDebug.destroy();
        }
        
        // Remove from scene's items array
        const index = this.scene.items.indexOf(this);
        if (index > -1) {
            this.scene.items.splice(index, 1);
        }
    }
    
    getBounds() {
        return {
            x: this.sprite.x - 60,  // Emoji width ~120px
            y: this.sprite.y - 60,
            width: 120,
            height: 120
        };
    }
}

// ===== KARATE GAME SCENE =====
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

        // Calculate player position first to determine ground line
        const playerY = height / 3 - 50;
        const playerHeight = 297 * 1.67; // frame height * scale
        const groundLineY = playerY + (playerHeight * 0.9); // 10% below character = 90% from top of character
        
        // Expand ground upward (make it 2x taller), then lower by 10%
        const groundHeight = height - groundLineY;
        const groundY = groundLineY - groundHeight + (height * 0.1); // Start ground 2x higher, then lower by 10%

        // Background - Realistic Sky with Gradient
        const skyGradient = this.add.graphics();
        // Deep blue at top, lighter blue at horizon
        skyGradient.fillGradientStyle(0x5B9BD5, 0x5B9BD5, 0xB4D7F0, 0xB4D7F0, 1);
        skyGradient.fillRect(0, 0, width, groundY);

        // Sun in top-left corner - softer and more subtle
        const sunGlow2 = this.add.circle(width * 0.15, groundY * 0.2, 70, 0xFFE5B4, 0.15);
        const sunGlow1 = this.add.circle(width * 0.15, groundY * 0.2, 50, 0xFFD700, 0.3);
        const sun = this.add.circle(width * 0.15, groundY * 0.2, 35, 0xFFF4E0, 0.9);
        
        // Ground - natural earth texture with organic feel
        const groundGradient = this.add.graphics();
        // Sandy brown fading to darker earth
        groundGradient.fillGradientStyle(0xC4A57B, 0xC4A57B, 0x8B7355, 0x8B7355, 1);
        groundGradient.fillRect(0, groundY, width, height - groundY);
        
        // Add organic ground texture (random patches instead of lines)
        const groundTexture = this.add.graphics();
        
        // Random dark patches for texture
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * width;
            const y = groundY + Math.random() * (height - groundY);
            const size = 10 + Math.random() * 30;
            const alpha = 0.05 + Math.random() * 0.1;
            
            groundTexture.fillStyle(0x6B5344, alpha);
            groundTexture.fillEllipse(x, y, size, size * 0.6);
        }
        
        // Add subtle horizon shading
        const horizonShade = this.add.graphics();
        horizonShade.fillGradientStyle(0x000000, 0x000000, 0x8B7355, 0x8B7355, 0.1, 0.1, 0, 0);
        horizonShade.fillRect(0, groundY, width, 50);

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

        // ===== PHASE 1: Game State Setup =====
        this.itemConfig = {
            good: ['🪑', '🎂', '🍬', '💎', '🍎', '🍕', '🎁', '🏀', '⚽', '🎮'],
            bad: ['💣', '🪨'],
            baseSpawnRate: 2500,   // 2.5 seconds between spawns
            fallSpeed: 360,        // pixels/second (2x faster: 180 * 2)
            hitZoneWidth: 100,     // 100px width
            hitZoneHeight: 100,    // 100px height (reduced from 150, keeping bottom position)
            baseBadChance: 0.4,    // 40% bad items at start
            difficultyIncrease: 0.05  // +5% bad per difficulty level
        };

        this.items = [];  // Active falling items

        // Create main character sprite - positioned right and higher
        this.player = this.add.sprite(width / 2 + 100, height / 3 - 50, 'karate');
        this.player.setScale(1.67);
        this.player.play('idle');

        // ===== Calculate Hit Zone Position =====
        // Hit zone: bên trái nhân vật, cao hơn 1/4 chiều cao frame
        const frameHeight = 297 * 1.67; // frame height * scale
        const hitZoneOffsetX = -this.itemConfig.hitZoneWidth / 2 - 120; // -170px left
        // Adjust Y to keep bottom position same: old bottom was at -94px + 75 = -19px
        // New: want bottom at -19px, so center = -19 - 50 = -69px
        const hitZoneOffsetY = -frameHeight / 4 + 30 + 25; // Move down 25px to keep bottom position

        // Initialize game state with calculated spawn position
        this.gameState = {
            score: 0,
            lives: 3,
            hitCount: 0,           // Track số lần bị hit (0-3)
            isGameOver: false,
            difficulty: 0,         // Level tăng sau mỗi 10 điểm
            itemSpawnX: this.player.x + hitZoneOffsetX,  // Items fall through hit zone
            isAnimating: false,    // Track if punch/kick is playing
            gameStarted: false     // Game hasn't started yet (waiting for quiz)
        };



        // Hit zone offsets stored for collision detection
        this.hitZoneOffset = {
            x: hitZoneOffsetX,
            y: hitZoneOffsetY
        };

        // Track animation frame updates
        this.player.on('animationupdate', (animation, frame) => {
            if (animation.key === 'punch' || animation.key === 'kick') {
                const totalFrames = animation.frames.length;
                const currentFrameIndex = frame.index;
                
                // Check hit on last 2 frames
                if (currentFrameIndex >= totalFrames - 2) {
                    this.checkItemCollision();
                }
            }
        });

        // Return to idle after action animations complete
        this.player.on('animationcomplete', (animation) => {
            if (animation.key === 'punch' || animation.key === 'kick') {
                this.player.play('idle');
                this.gameState.isAnimating = false;
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
                this.gameState.isAnimating = true;
            }
        });

        // ===== PHASE 2: Item Spawning System =====
        // Don't start spawning yet - wait for quiz
        this.spawnTimer = null;

        // ===== PHASE 4: UI System =====
        // Lives display - above player head, centered with frame
        // Frame width at scale 1.67: 297 * 1.67 ≈ 496px
        // Shift right by half frame width to center with right edge of frame
        const frameWidth = 297 * 1.67;
        this.livesText = this.add.text(this.player.x + frameWidth / 4, this.player.y - frameHeight / 2 - 40, '❤️❤️❤️', {
            fontSize: '48px'
        }).setOrigin(0.5, 0.5).setDepth(100);
        
        // Score display - center, below fade area
        const scoreY = this.player.y + hitZoneOffsetY + this.itemConfig.hitZoneHeight / 2 + 300; // +50px lower
        this.scoreText = this.add.text(width / 2, scoreY, '0', {
            fontSize: '64px',  // Larger font
            fontFamily: 'Arial',
            color: '#FFFFFF',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5, 0.5).setDepth(100);

        // Show start quiz first
        MathQuiz.show(this, {
            title: 'カラテゲーム',
            instruction: 'はじめるには こたえてね!',
            type: 'start',
            onCorrect: () => {
                // Start the game
                this.gameState.gameStarted = true;
                
                // Start spawning items
                this.spawnTimer = this.time.addEvent({
                    delay: this.itemConfig.baseSpawnRate,
                    callback: this.spawnItem,
                    callbackScope: this,
                    loop: true
                });
            }
        });
    }

    spawnItem() {
        if (this.gameState.isGameOver || !this.gameState.gameStarted) return;
        
        // Calculate bad item chance based on difficulty
        const baseBad = this.itemConfig.baseBadChance;
        const increase = this.gameState.difficulty * this.itemConfig.difficultyIncrease;
        const badChance = Math.min(baseBad + increase, 0.55);  // Max 55%
        
        const isBad = Math.random() < badChance;
        
        let emoji, type;
        if (isBad) {
            emoji = Phaser.Utils.Array.GetRandom(this.itemConfig.bad);
            type = 'bad';
        } else {
            emoji = Phaser.Utils.Array.GetRandom(this.itemConfig.good);
            type = 'good';
        }
        
        // Spawn at hit zone X position so items fall through hit zone
        const item = new FallingItem(
            this,
            this.gameState.itemSpawnX,  // X matches hit zone center
            -50,  // Start above screen
            emoji,
            type
        );
        
        this.items.push(item);
    }

    // ===== PHASE 3: Hit Detection =====
    checkItemCollision() {
        if (this.gameState.isGameOver || !this.gameState.gameStarted) return;
        
        // Prevent multiple hits on same item
        if (this.lastHitTime && Date.now() - this.lastHitTime < 100) return;
        
        const hitZoneWidth = this.itemConfig.hitZoneWidth;
        const hitZoneHeight = this.itemConfig.hitZoneHeight;
        
        // Define hit zone bounds (matching debug visualization)
        const frameHeight = 297 * 1.67;
        const hitZoneOffsetX = -hitZoneWidth / 2 - 120; // -170px
        const hitZoneOffsetY = -frameHeight / 4;         // -124px
        
        const playerBounds = {
            x: this.player.x + hitZoneOffsetX - hitZoneWidth / 2,
            y: this.player.y + hitZoneOffsetY - hitZoneHeight / 2,
            width: hitZoneWidth,
            height: hitZoneHeight
        };
        
        // Check each item
        for (let item of this.items) {
            if (!item.isActive) continue;
            
            const itemBounds = item.getBounds();
            
            // Simple rectangle intersection
            if (this.checkRectOverlap(playerBounds, itemBounds)) {
                this.handleItemHit(item);
                this.lastHitTime = Date.now();  // Record hit time
                return;  // Only hit one item per attack
            }
        }
    }

    checkRectOverlap(rect1, rect2) {
        return !(
            rect1.x + rect1.width < rect2.x ||
            rect2.x + rect2.width < rect1.x ||
            rect1.y + rect1.height < rect2.y ||
            rect2.y + rect2.height < rect1.y
        );
    }

    handleItemHit(item) {
        if (item.type === 'good') {
            // Good item: +1 score, launch item
            this.gameState.score += 1;
            
            // Update UI
            this.updateScoreUI();
            
            // Launch item with parabola
            item.launch();
            
            // Check for difficulty increase every 10 points
            if (this.gameState.score % 10 === 0 && this.gameState.score > 0) {
                this.gameState.difficulty += 1;
            }
            
        } else {
            // Bad item: -1 life, visual effects
            this.gameState.lives -= 1;
            this.gameState.hitCount += 1;
            
            // Update UI
            this.updateLivesUI();
            
            // Update player tint (progressively redder)
            const tints = [0xFFFFFF, 0xFFCCCC, 0xFF9999, 0xFF6666];
            this.player.setTint(tints[this.gameState.hitCount]);
            
            // Camera shake
            this.cameras.main.shake(300, 0.015);
            
            // Drop item straight down
            item.drop();
            
            // Check game over
            if (this.gameState.lives <= 0) {
                this.triggerGameOver();
            }
        }
    }

    updateScoreUI() {
        this.scoreText.setText(`${this.gameState.score}`);
    }

    updateLivesUI() {
        const hearts = '❤️'.repeat(this.gameState.lives);
        this.livesText.setText(hearts);
    }

    triggerGameOver() {
        this.gameState.isGameOver = true;
        
        // Stop spawning
        this.spawnTimer.remove();
        
        // Destroy all active items
        for (let item of [...this.items]) {
            item.destroy();
        }
        
        const { width, height } = this.scale;
        
        // Darken background
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setDepth(200);
        
        // Game Over text (Japanese)
        const gameOverText = this.add.text(width / 2, height / 2 - 100, 'ゲームオーバー', {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FF0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(201);
        
        // Final score
        const finalScoreText = this.add.text(width / 2, height / 2, `${this.gameState.score}`, {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(201);
        
        // Restart button (Japanese)
        const restartBtn = this.add.text(width / 2, height / 2 + 100, '🔄 もう一度', {
            fontSize: '40px',
            color: '#FFFFFF',
            backgroundColor: '#4CAF50',
            padding: { x: 40, y: 20 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(201);
        
        restartBtn.setInteractive({ useHandCursor: true });
        restartBtn.on('pointerover', () => restartBtn.setScale(1.1));
        restartBtn.on('pointerout', () => restartBtn.setScale(1));
        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    update(time, delta) {
        // Update all falling items
        for (let item of this.items) {
            item.update(delta);
        }
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
