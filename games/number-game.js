/**
 * すうじげーむ (Number Game)
 * Pure number game: collect smaller numbers, avoid larger numbers
 * Progressive difficulty
 */

// Error handler for debugging
window.addEventListener('error', (e) => {
    console.error('Game Error:', e.error);
    const gameContent = document.getElementById('gameContent');
    if (gameContent) {
        gameContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: white;">
                <h3>🐛 Game Error</h3>
                <p style="font-size: 14px; color: #ffcccc;">
                    ${e.message || 'Unknown error'}
                </p>
                <pre style="font-size: 12px; text-align: left; background: rgba(0,0,0,0.5); padding: 10px; margin: 20px; overflow: auto;">
${e.error?.stack || 'No stack trace'}
                </pre>
                <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px;">
                    Reload
                </button>
            </div>
        `;
    }
});

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js';

class NumberGame extends Phaser.Scene {
    constructor() {
        super({ key: 'NumberGame' });
    }

    preload() {
        // Load car image with absolute path from root
        this.load.image('car', 'images/game/car.png');
        
        // Add error handler
        this.load.on('loaderror', (file) => {
            console.error('Error loading:', file.src);
        });
    }

    create() {
        const { width, height } = this.scale;
        
        // Check if car image loaded
        if (!this.textures.exists('car')) {
            console.error('Car texture not loaded!');
        }
        
        // Simple background - light gray road
        this.cameras.main.setBackgroundColor('#888888');
        
        // Draw simple 2D top-down road
        this.drawTopDownRoad();
        
        // Player number (starting at 10)
        this.playerNumber = 10;
        this.playerX = width / 2;
        this.playerY = height * 0.85; // Near bottom
        
        // Player car sprite - simple 2D top view, rotated -90 degrees (pointing up)
        if (this.textures.exists('car')) {
            this.playerCar = this.add.sprite(this.playerX, this.playerY, 'car');
            this.playerCar.setScale(0.8);
            this.playerCar.setAngle(-90); // Rotate to point upward
        } else {
            // Fallback: draw a simple car from top view
            console.warn('Using fallback car drawing');
            const carGraphics = this.add.graphics();
            // Simple rectangle car (top view)
            carGraphics.fillStyle(0xFF6B6B, 1);
            carGraphics.fillRect(-25, -40, 50, 80);
            carGraphics.fillStyle(0x000000, 1);
            carGraphics.fillRect(-20, -30, 40, 25); // Window
            const carTexture = carGraphics.generateTexture('carFallback', 50, 80);
            carGraphics.destroy();
            this.playerCar = this.add.sprite(this.playerX, this.playerY, 'carFallback');
            this.playerCar.setScale(0.8);
        }
        
        // Player number text below car - bigger and clearer
        this.playerText = this.add.text(this.playerX, this.playerY + 60, this.playerNumber.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        });
        this.playerText.setOrigin(0.5);
        
        // Game state
        this.objects = [];
        this.gameOver = false;
        this.score = 0;
        this.objectsCollected = 0; // For difficulty progression
        
        // Difficulty settings
        this.spawnDelay = 4500; // Slower spawn (was 3000)
        this.objectSpeed = 5000; // Much slower movement (was 3000)
        this.minNumber = 1;
        this.maxNumber = 15;
        
        // Spawn multiple objects at once
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            callback: this.spawnMultipleObjects,
            callbackScope: this,
            loop: true
        });
        
        // Instructions
        this.titleText = this.add.text(width / 2, 50, 'すうじげーむ', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.instructionText = this.add.text(width / 2, 90, 'ちいさいかずをあつめよう!', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Score display
        this.scoreText = this.add.text(20, 130, 'スコア: 0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        
        // Touch controls - drag to move
        this.isDragging = false;
        this.targetX = width / 2;
        
        this.input.on('pointerdown', (pointer) => {
            if (this.gameOver) {
                this.scene.restart();
                return;
            }
            this.isDragging = true;
            this.targetX = pointer.x;
        });
        
        this.input.on('pointermove', (pointer) => {
            if (this.isDragging && !this.gameOver) {
                this.targetX = pointer.x;
            }
        });
        
        this.input.on('pointerup', () => {
            this.isDragging = false;
        });
        
        // Keep player within bounds
        this.minX = 100;
        this.maxX = width - 100;
    }
    
    drawTopDownRoad() {
        const { width, height } = this.scale;
        const graphics = this.add.graphics();
        
        // Draw simple vertical road (dark gray)
        const roadWidth = width * 0.7;
        const roadX = (width - roadWidth) / 2;
        
        graphics.fillStyle(0x444444, 1);
        graphics.fillRect(roadX, 0, roadWidth, height);
        
        // White lane dividers (3 lanes)
        graphics.lineStyle(4, 0xffffff, 0.8);
        
        const laneWidth = roadWidth / 3;
        
        // Left divider
        graphics.lineBetween(roadX + laneWidth, 0, roadX + laneWidth, height);
        
        // Right divider
        graphics.lineBetween(roadX + laneWidth * 2, 0, roadX + laneWidth * 2, height);
        
        // Dashed center lines for effect
        graphics.lineStyle(8, 0xffff00, 0.5);
        const dashHeight = 40;
        const dashGap = 30;
        for (let y = 0; y < height; y += dashHeight + dashGap) {
            // Left lane center
            graphics.lineBetween(
                roadX + laneWidth / 2, y,
                roadX + laneWidth / 2, y + dashHeight
            );
            // Middle lane center
            graphics.lineBetween(
                roadX + laneWidth * 1.5, y,
                roadX + laneWidth * 1.5, y + dashHeight
            );
            // Right lane center
            graphics.lineBetween(
                roadX + laneWidth * 2.5, y,
                roadX + laneWidth * 2.5, y + dashHeight
            );
        }
    }
    
    spawnMultipleObjects() {
        if (this.gameOver) return;
        
        // Always spawn exactly 2-3 numbers with GUARANTEED choices:
        // - At least 1 smaller (safe to collect)
        // - At least 1 larger (dangerous)
        const count = Phaser.Math.Between(2, 3);
        const lanes = [-150, 0, 150];
        const usedLanes = [];
        
        for (let i = 0; i < count; i++) {
            // Pick a random lane that hasn't been used
            const availableLanes = lanes.filter(lane => !usedLanes.includes(lane));
            if (availableLanes.length === 0) break;
            
            const lane = Phaser.Utils.Array.GetRandom(availableLanes);
            usedLanes.push(lane);
            
            let number;
            
            if (i === 0) {
                // First number: ALWAYS smaller than player (safe choice)
                const maxSafe = Math.max(1, this.playerNumber - 1);
                number = Phaser.Math.Between(this.minNumber, maxSafe);
            } else if (i === 1) {
                // Second number: ALWAYS larger than player (risky choice)
                const minRisky = this.playerNumber + 1;
                number = Phaser.Math.Between(minRisky, Math.min(this.maxNumber, this.playerNumber + 10));
            } else {
                // Third number (if count=3): Random (could be smaller or larger)
                const rand = Math.random();
                if (rand < 0.5) {
                    // Another safe option
                    const maxSafe = Math.max(1, this.playerNumber - 1);
                    number = Phaser.Math.Between(this.minNumber, maxSafe);
                } else {
                    // Another risky option
                    const minRisky = this.playerNumber + 1;
                    number = Phaser.Math.Between(minRisky, Math.min(this.maxNumber, this.playerNumber + 10));
                }
            }
            
            this.spawnObjectAtLane(lane, number);
        }
    }
    
    spawnObjectAtLane(lane, number) {
        if (this.gameOver) return;
        
        const { width, height } = this.scale;
        
        // Progressive difficulty: increase max number range
        if (this.objectsCollected > 10) {
            this.maxNumber = 20;
        }
        if (this.objectsCollected > 20) {
            this.maxNumber = 30;
        }
        if (this.objectsCollected > 30) {
            this.maxNumber = 50;
        }
        
        // Simple 2D top-down: spawn from top, move straight down
        const startY = -50; // Start above screen
        const endY = height + 50; // End below screen
        
        // Calculate X position for this lane (simple, no scaling)
        const laneX = width / 2 + lane;
        
        // Create number text - BIG and clear for kids
        const text = this.add.text(laneX, startY, number.toString(), {
            fontSize: '80px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 10
        });
        text.setOrigin(0.5);
        text.setData('value', number);
        
        // Animate straight down (simple movement)
        this.tweens.add({
            targets: text,
            y: endY,
            duration: this.objectSpeed,
            ease: 'Linear',
            onUpdate: () => {
                // Check collision continuously as number moves down
                if (this.gameOver) return;
                
                const distance = Phaser.Math.Distance.Between(
                    text.x, text.y,
                    this.playerX, this.playerY
                );
                
                if (distance < 100 && text.getData('collected') !== true) {
                    text.setData('collected', true);
                    const objNumber = text.getData('value');
                    
                    if (objNumber < this.playerNumber) {
                        // Collect: add to player number
                        this.playerNumber += objNumber;
                        this.score += objNumber;
                        this.objectsCollected++;
                    } else {
                        // Hit larger number: lose half (rounded up)
                        const penalty = Math.ceil(this.playerNumber / 2);
                        this.playerNumber -= penalty;
                        this.score = Math.max(0, this.score - penalty);
                        
                        // Check game over
                        if (this.playerNumber <= 0) {
                            this.endGame();
                        }
                    }
                    
                    // Update display
                    this.playerText.setText(this.playerNumber.toString());
                    this.scoreText.setText('スコア: ' + this.score);
                    
                    // Fade out collected number
                    this.tweens.add({
                        targets: text,
                        alpha: 0,
                        scale: 2,
                        duration: 300,
                        onComplete: () => text.destroy()
                    });
                }
            },
            onComplete: () => {
                text.destroy();
            }
        });
        
        this.objects.push(text);
    }
    
    endGame() {
        this.gameOver = true;
        this.spawnTimer.destroy();
        
        const { width, height } = this.scale;
        
        // Game Over overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        
        // Game Over text
        this.add.text(width / 2, height / 2 - 80, 'ゲームオーバー', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#FF5252',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);
        
        // Final score
        this.add.text(width / 2, height / 2, 'スコア: ' + this.score, {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Restart instruction
        this.add.text(width / 2, height / 2 + 80, 'タップしてもういちど!', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
    }
    
    update() {
        if (this.gameOver) return;
        
        // Smooth follow target X position
        if (this.isDragging || Math.abs(this.playerX - this.targetX) > 1) {
            // Clamp target within bounds
            this.targetX = Phaser.Math.Clamp(this.targetX, this.minX, this.maxX);
            
            // Smooth lerp movement
            const smoothing = 0.15;
            this.playerX = Phaser.Math.Linear(this.playerX, this.targetX, smoothing);
            
            // Move both car and text
            this.playerCar.x = this.playerX;
            this.playerText.x = this.playerX;
        }
        
        // Clean up destroyed objects
        this.objects = this.objects.filter(obj => obj.active);
    }
}

// Check if Phaser loaded
if (typeof Phaser === 'undefined' || !Phaser.Game) {
    console.error('Phaser failed to load from CDN');
    const gameContent = document.getElementById('gameContent');
    if (gameContent) {
        gameContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: white;">
                <h3>⚠️ Phaser library failed to load</h3>
                <p>CDN may be blocked or offline</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px;">
                    Retry
                </button>
            </div>
        `;
    }
    throw new Error('Phaser library not available');
}

// Phaser game config
const config = {
    type: Phaser.AUTO,
    parent: 'gameContent',
    width: window.innerWidth,
    height: window.innerHeight,
    scene: NumberGame,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#667eea'
};

// Start game
try {
    console.log('Starting Phaser game...');
    const game = new Phaser.Game(config);
    console.log('✅ Game started successfully');
} catch (error) {
    console.error('Failed to start game:', error);
    const gameContent = document.getElementById('gameContent');
    if (gameContent) {
        gameContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: white;">
                <h3>⚠️ Game initialization failed</h3>
                <p style="font-size: 14px;">${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px;">
                    Retry
                </button>
            </div>
        `;
    }
}
