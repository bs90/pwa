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
        
        // Player car sprite - NO rotation, original orientation
        if (this.textures.exists('car')) {
            this.playerCar = this.add.sprite(this.playerX, this.playerY, 'car');
            this.playerCar.setScale(1.5); // Big and clear
        } else {
            // Fallback: draw a simple car
            console.warn('Using fallback car drawing');
            const carGraphics = this.add.graphics();
            carGraphics.fillStyle(0xFF6B6B, 1);
            carGraphics.fillRect(-40, -25, 80, 50);
            carGraphics.fillStyle(0x000000, 1);
            carGraphics.fillRect(-30, -20, 25, 40);
            const carTexture = carGraphics.generateTexture('carFallback', 80, 50);
            carGraphics.destroy();
            this.playerCar = this.add.sprite(this.playerX, this.playerY, 'carFallback');
            this.playerCar.setScale(1.5);
        }
        
        // Player number text below car
        this.playerText = this.add.text(this.playerX, this.playerY + 80, this.playerNumber.toString(), {
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
        this.objectsCollected = 0;
        
        // New logic: maintain 2-3 numbers on screen at all times
        this.activeNumbers = 0;
        this.minActiveNumbers = 2;
        this.maxActiveNumbers = 3;
        
        // Difficulty settings
        this.objectSpeed = 4000; // Speed of numbers falling
        this.minNumber = 1;
        this.maxNumber = 15;
        
        // Road boundaries for random X position
        const roadWidth = width * 0.7;
        this.roadLeft = (width - roadWidth) / 2 + 50; // Add padding
        this.roadRight = width - (width - roadWidth) / 2 - 50;
        
        // Spawn initial numbers
        this.spawnRandomNumber();
        this.spawnRandomNumber();
        
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
        
        // Keep player within road bounds
        this.minX = this.roadLeft + 50;
        this.maxX = this.roadRight - 50;
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
    
    spawnRandomNumber() {
        if (this.gameOver) return;
        
        const { width, height } = this.scale;
        
        // Progressive difficulty
        if (this.objectsCollected > 10 && this.maxNumber < 20) {
            this.maxNumber = 20;
        } else if (this.objectsCollected > 20 && this.maxNumber < 30) {
            this.maxNumber = 30;
        } else if (this.objectsCollected > 30 && this.maxNumber < 50) {
            this.maxNumber = 50;
        }
        
        // Generate random number (mix of smaller and larger)
        let number;
        const rand = Math.random();
        if (rand < 0.5) {
            // 50% chance: smaller than player (safe)
            number = Phaser.Math.Between(this.minNumber, Math.max(1, this.playerNumber - 1));
        } else {
            // 50% chance: larger than player (dangerous)
            number = Phaser.Math.Between(this.playerNumber + 1, Math.min(this.maxNumber, this.playerNumber + 10));
        }
        
        // Random X position within road boundaries (not in lanes!)
        const randomX = Phaser.Math.Between(this.roadLeft, this.roadRight);
        const startY = -50;
        const endY = height + 50;
        
        // Create number text - BIG and clear
        const text = this.add.text(randomX, startY, number.toString(), {
            fontSize: '80px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 10
        });
        text.setOrigin(0.5);
        text.setData('value', number);
        text.setData('collected', false);
        
        this.activeNumbers++;
        
        // Animate straight down
        this.tweens.add({
            targets: text,
            y: endY,
            duration: this.objectSpeed,
            ease: 'Linear',
            onComplete: () => {
                // Number reached bottom without collision
                text.destroy();
                this.activeNumbers--;
                // Spawn new number to maintain 2-3 on screen
                if (this.activeNumbers < this.minActiveNumbers) {
                    this.spawnRandomNumber();
                }
            }
        });
        
        this.objects.push(text);
    }
    
    checkCollisions() {
        if (this.gameOver) return;
        
        // Check collision with car sprite bounds
        const carBounds = this.playerCar.getBounds();
        
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (!obj || obj.getData('collected')) continue;
            
            const objBounds = obj.getBounds();
            
            // Check if number overlaps with car
            if (Phaser.Geom.Intersects.RectangleToRectangle(carBounds, objBounds)) {
                obj.setData('collected', true);
                const objNumber = obj.getData('value');
                
                if (objNumber < this.playerNumber) {
                    // Collect smaller: add to player number
                    this.playerNumber += objNumber;
                    this.score += objNumber;
                    this.objectsCollected++;
                } else if (objNumber === this.playerNumber) {
                    // Equal: just add to score
                    this.score += objNumber;
                    this.objectsCollected++;
                } else {
                    // Hit larger: divide by 2
                    this.playerNumber = Math.ceil(this.playerNumber / 2);
                    this.score = Math.ceil(this.score / 2);
                    
                    if (this.playerNumber <= 0) {
                        this.endGame();
                        return;
                    }
                }
                
                // Update display
                this.playerText.setText(this.playerNumber.toString());
                this.scoreText.setText('スコア: ' + this.score);
                
                // Remove collected number
                this.activeNumbers--;
                this.objects.splice(i, 1);
                
                // Fade out
                this.tweens.add({
                    targets: obj,
                    alpha: 0,
                    scale: 2,
                    duration: 300,
                    onComplete: () => {
                        obj.destroy();
                        // Spawn new number to maintain 2-3 on screen
                        if (this.activeNumbers < this.maxActiveNumbers && !this.gameOver) {
                            this.spawnRandomNumber();
                        }
                    }
                });
            }
        }
    }
    
    endGame() {
        this.gameOver = true;
        
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
        
        // Check collisions with car
        this.checkCollisions();
        
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
