/**
 * すうじげーむ (Number Game)
 * Pure number game: collect smaller numbers, avoid larger numbers
 * Progressive difficulty
 */

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js';

class NumberGame extends Phaser.Scene {
    constructor() {
        super({ key: 'NumberGame' });
    }

    create() {
        const { width, height } = this.scale;
        
        // Background gradient
        this.cameras.main.setBackgroundColor('#667eea');
        
        // Draw perspective road
        this.drawPerspectiveGrid();
        
        // Player number (starting at 10)
        this.playerNumber = 10;
        this.playerX = width / 2;
        this.playerY = height * 0.85;
        
        // Player number text only (no sprite)
        this.playerText = this.add.text(this.playerX, this.playerY, this.playerNumber.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.playerText.setOrigin(0.5);
        
        // Game state
        this.objects = [];
        this.gameOver = false;
        this.score = 0;
        this.objectsCollected = 0; // For difficulty progression
        
        // Difficulty settings
        this.spawnDelay = 3000;
        this.minNumber = 1;
        this.maxNumber = 15;
        
        // Spawn objects periodically
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            callback: this.spawnObject,
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
    
    drawPerspectiveGrid() {
        const { width, height } = this.scale;
        const graphics = this.add.graphics();
        
        // Vanishing point (near title)
        const vanishX = width / 2;
        const vanishY = height * 0.15;
        
        // Road color - dark gray asphalt
        const roadColor = 0x3d3d5c;
        const grassColor = 0x2d5016;
        const lineColor = 0xffffff;
        
        // Draw grass background on sides
        graphics.fillStyle(grassColor, 1);
        graphics.fillRect(0, 0, width, height);
        
        // Draw main road as trapezoid (perspective)
        const roadBottomWidth = width * 0.8;
        const roadTopWidth = width * 0.1;
        
        graphics.fillStyle(roadColor, 1);
        graphics.beginPath();
        graphics.moveTo(vanishX - roadTopWidth / 2, vanishY); // Top left
        graphics.lineTo(vanishX + roadTopWidth / 2, vanishY); // Top right
        graphics.lineTo(width / 2 + roadBottomWidth / 2, height); // Bottom right
        graphics.lineTo(width / 2 - roadBottomWidth / 2, height); // Bottom left
        graphics.closePath();
        graphics.fillPath();
        
        // Draw center dashed line
        graphics.lineStyle(3, lineColor, 0.6);
        const dashCount = 10;
        for (let i = 0; i < dashCount; i++) {
            const t1 = i / dashCount;
            const t2 = (i + 0.5) / dashCount;
            
            // Interpolate from vanishing point to bottom center
            const y1 = vanishY + (height - vanishY) * t1;
            const y2 = vanishY + (height - vanishY) * t2;
            
            // Line gets wider as it approaches bottom (perspective)
            const width1 = 2 + (8 * t1);
            const width2 = 2 + (8 * t2);
            
            graphics.lineStyle(width1, lineColor, 0.6);
            graphics.lineBetween(vanishX, y1, vanishX, y2);
        }
        
        // Draw side lines (road edges)
        graphics.lineStyle(4, lineColor, 0.5);
        
        // Left edge
        graphics.lineBetween(
            vanishX - roadTopWidth / 2, vanishY,
            width / 2 - roadBottomWidth / 2, height
        );
        
        // Right edge
        graphics.lineBetween(
            vanishX + roadTopWidth / 2, vanishY,
            width / 2 + roadBottomWidth / 2, height
        );
    }
    
    spawnObject() {
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
        
        // Spawn faster over time
        if (this.objectsCollected > 15 && this.spawnDelay > 2000) {
            this.spawnDelay = 2000;
            this.spawnTimer.delay = this.spawnDelay;
        }
        
        // Generate random number with higher chance of numbers near player's number
        let number;
        const rand = Math.random();
        
        if (rand < 0.4) {
            // 40% chance: smaller than player (easy to collect)
            number = Phaser.Math.Between(this.minNumber, Math.max(1, this.playerNumber - 2));
        } else if (rand < 0.7) {
            // 30% chance: around player's number (±3)
            const min = Math.max(this.minNumber, this.playerNumber - 3);
            const max = Math.min(this.maxNumber, this.playerNumber + 3);
            number = Phaser.Math.Between(min, max);
        } else {
            // 30% chance: larger than player (dangerous)
            number = Phaser.Math.Between(this.playerNumber + 1, this.maxNumber);
        }
        
        // Start from horizon
        const startY = height * 0.15;
        const endY = height * 0.85;
        const startScale = 0.1;
        const endScale = 1.0;
        
        // Random lane
        const lanes = [-150, 0, 150];
        const randomLane = Phaser.Utils.Array.GetRandom(lanes);
        const startX = width / 2 + randomLane * startScale;
        const endX = width / 2 + randomLane;
        
        // Determine color based on comparison with player
        let color;
        if (number < this.playerNumber) {
            color = 0x4CAF50; // Green - good to collect
        } else if (number === this.playerNumber) {
            color = 0xFFA726; // Orange - neutral
        } else {
            color = 0xFF5252; // Red - dangerous
        }
        
        // Create number text (no circle, just text)
        const text = this.add.text(startX, startY, number.toString(), {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: Phaser.Display.Color.IntegerToColor(color).rgba,
            strokeThickness: 8
        });
        text.setOrigin(0.5);
        text.setScale(startScale);
        text.setData('value', number);
        
        // Animate toward player
        this.tweens.add({
            targets: text,
            x: endX,
            y: endY,
            scale: endScale,
            duration: 3000,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                // Check collision with player
                const distance = Phaser.Math.Distance.Between(
                    text.x, text.y,
                    this.playerX, this.playerY
                );
                
                if (distance < 100 && !this.gameOver) {
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
                }
                
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
            
            this.playerText.x = this.playerX;
        }
        
        // Clean up destroyed objects
        this.objects = this.objects.filter(obj => obj.active);
    }
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
const game = new Phaser.Game(config);
