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
        
        // White background for contrast
        this.cameras.main.setBackgroundColor('#ffffff');
        
        // Draw simple 2D top-down road
        this.drawTopDownRoad();
        
        // Player position
        this.playerX = width / 2;
        this.playerY = height * 0.85;
        
        // Player car sprite - NO rotation, keep original orientation
        if (this.textures.exists('car')) {
            this.playerCar = this.add.sprite(this.playerX, this.playerY, 'car');
            this.playerCar.setScale(1.5);
        } else {
            // Fallback
            const carGraphics = this.add.graphics();
            carGraphics.fillStyle(0xFF6B6B, 1);
            carGraphics.fillRect(-40, -25, 80, 50);
            const carTexture = carGraphics.generateTexture('carFallback', 80, 50);
            carGraphics.destroy();
            this.playerCar = this.add.sprite(this.playerX, this.playerY, 'carFallback');
            this.playerCar.setScale(1.5);
        }
        
        // Player score/number - starts at 10
        this.playerScore = 10;
        
        // Display score way below car to avoid overlap
        this.scoreText = this.add.text(this.playerX, this.playerY + 150, this.playerScore.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        });
        this.scoreText.setOrigin(0.5);
        
        // Road boundaries
        const roadWidth = width * 0.7;
        this.roadLeft = (width - roadWidth) / 2;
        this.roadRight = this.roadLeft + roadWidth;
        
        // Game numbers on road
        this.roadNumbers = [];
        this.maxRoadNumbers = 3;
        this.minNumberGap = 200; // Minimum distance between numbers
        
        // Spawn initial numbers
        this.spawnRoadNumber();
        this.spawnRoadNumber();
        
        // Touch controls
        this.isDragging = false;
        this.targetX = width / 2;
        
        this.minX = this.roadLeft + 50;
        this.maxX = this.roadRight - 50;
        
        this.input.on('pointerdown', (pointer) => {
            this.isDragging = true;
            this.targetX = pointer.x;
        });
        
        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                this.targetX = pointer.x;
            }
        });
        
        this.input.on('pointerup', () => {
            this.isDragging = false;
        });
    }
    
    drawTopDownRoad() {
        const { width, height } = this.scale;
        const graphics = this.add.graphics();
        
        // Draw simple vertical road (lighter gray for contrast with black car)
        const roadWidth = width * 0.7;
        const roadX = (width - roadWidth) / 2;
        
        graphics.fillStyle(0x888888, 1); // Lighter gray (was 0x444444)
        graphics.fillRect(roadX, 0, roadWidth, height);
        
        // White lane dividers (3 lanes) - static
        graphics.lineStyle(4, 0xffffff, 0.8);
        
        const laneWidth = roadWidth / 3;
        
        // Left divider
        graphics.lineBetween(roadX + laneWidth, 0, roadX + laneWidth, height);
        
        // Right divider
        graphics.lineBetween(roadX + laneWidth * 2, 0, roadX + laneWidth * 2, height);
        
        // Create animated yellow dashes
        this.roadDashes = [];
        this.dashHeight = 40;
        this.dashGap = 30;
        this.roadSpeed = 200; // pixels per second
        
        // Create initial dashes
        const totalDashSpace = this.dashHeight + this.dashGap;
        const numDashes = Math.ceil(height / totalDashSpace) + 2; // Extra for seamless loop
        
        for (let i = 0; i < numDashes; i++) {
            const startY = i * totalDashSpace - totalDashSpace;
            
            // Left lane dash
            const leftDash = this.add.graphics();
            leftDash.lineStyle(8, 0xffff00, 0.5);
            leftDash.lineBetween(0, 0, 0, this.dashHeight);
            leftDash.x = roadX + laneWidth / 2;
            leftDash.y = startY;
            this.roadDashes.push(leftDash);
            
            // Middle lane dash
            const middleDash = this.add.graphics();
            middleDash.lineStyle(8, 0xffff00, 0.5);
            middleDash.lineBetween(0, 0, 0, this.dashHeight);
            middleDash.x = roadX + laneWidth * 1.5;
            middleDash.y = startY;
            this.roadDashes.push(middleDash);
            
            // Right lane dash
            const rightDash = this.add.graphics();
            rightDash.lineStyle(8, 0xffff00, 0.5);
            rightDash.lineBetween(0, 0, 0, this.dashHeight);
            rightDash.x = roadX + laneWidth * 2.5;
            rightDash.y = startY;
            this.roadDashes.push(rightDash);
        }
        
        // Create roadside objects (trees and houses)
        this.roadsideObjects = [];
        const emojis = ['🌲', '🏠', '🌳', '🏡'];
        const objectGap = 150; // Space between objects
        const numObjects = Math.ceil(height / objectGap) + 2;
        
        for (let i = 0; i < numObjects; i++) {
            const startY = i * objectGap - objectGap;
            
            // Left side object
            const leftEmoji = Phaser.Utils.Array.GetRandom(emojis);
            const leftObj = this.add.text(roadX - 60, startY, leftEmoji, {
                fontSize: '48px'
            });
            leftObj.setOrigin(0.5);
            this.roadsideObjects.push(leftObj);
            
            // Right side object (offset a bit for variety)
            const rightEmoji = Phaser.Utils.Array.GetRandom(emojis);
            const rightObj = this.add.text(roadX + roadWidth + 60, startY + objectGap / 2, rightEmoji, {
                fontSize: '48px'
            });
            rightObj.setOrigin(0.5);
            this.roadsideObjects.push(rightObj);
        }
    }
    
    spawnRoadNumber() {
        // Don't spawn if already at max
        if (this.roadNumbers.length >= this.maxRoadNumbers) return;
        
        const { width, height } = this.scale;
        
        // Predict max possible score: current score + sum of all smaller numbers on screen
        let predictedMaxScore = this.playerScore;
        for (let num of this.roadNumbers) {
            const val = num.getData('value');
            if (val < this.playerScore) {
                predictedMaxScore += val;
            }
        }
        
        // Generate number value based on predicted max
        let numberValue;
        const hasSmaller = this.roadNumbers.some(n => n.getData('value') < this.playerScore);
        
        if (!hasSmaller || Math.random() < 0.5) {
            // 50% chance for smaller (safe) - between 1 and current score-1
            numberValue = Phaser.Math.Between(1, Math.max(1, this.playerScore - 1));
        } else {
            // 50% chance for dangerous - use predicted max score
            // Range: current score to predicted max + some buffer
            const minDanger = this.playerScore;
            const maxDanger = predictedMaxScore + 15;
            numberValue = Phaser.Math.Between(minDanger, maxDanger);
        }
        
        // Random X position on road, with padding
        let randomX;
        let attempts = 0;
        let tooClose = true;
        
        while (tooClose && attempts < 10) {
            randomX = Phaser.Math.Between(this.roadLeft + 80, this.roadRight - 80);
            tooClose = false;
            
            // Check distance from existing numbers (both X and Y for even distribution)
            for (let existingNum of this.roadNumbers) {
                const distX = Math.abs(existingNum.x - randomX);
                
                // Numbers should be far apart horizontally
                if (distX < 120) {
                    tooClose = true;
                    break;
                }
            }
            attempts++;
        }
        
        // Always spawn far above screen - find the highest existing number
        let startY = -300; // Default
        
        if (this.roadNumbers.length > 0) {
            // Find the topmost (most negative Y) number
            let topmostY = 0;
            for (let num of this.roadNumbers) {
                if (num.y < topmostY) {
                    topmostY = num.y;
                }
            }
            // Spawn above the topmost number with good spacing
            startY = topmostY - 300 - Phaser.Math.Between(0, 100);
        }
        
        // Create number text - same width as car
        const numberText = this.add.text(randomX, startY, numberValue.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 10
        });
        numberText.setOrigin(0.5);
        numberText.setData('value', numberValue);
        
        this.roadNumbers.push(numberText);
    }
    
    checkNumberCollision() {
        for (let i = this.roadNumbers.length - 1; i >= 0; i--) {
            const num = this.roadNumbers[i];
            
            // Check if number reached the car
            const distance = Phaser.Math.Distance.Between(
                num.x, num.y,
                this.playerCar.x, this.playerCar.y
            );
            
            if (distance < 100) {
                const value = num.getData('value');
                
                // Update player score
                if (value < this.playerScore) {
                    this.playerScore += value;
                } else {
                    this.playerScore = Math.ceil(this.playerScore / 2);
                }
                
                // Update display
                this.scoreText.setText(this.playerScore.toString());
                
                // Remove number
                num.destroy();
                this.roadNumbers.splice(i, 1);
                
                // Spawn new number
                this.spawnRoadNumber();
            }
        }
    }
    
    update(time, delta) {
        // Animate road dashes moving down
        const { height } = this.scale;
        const totalDashSpace = this.dashHeight + this.dashGap;
        
        for (let dash of this.roadDashes) {
            // Move dash down
            dash.y += (this.roadSpeed * delta) / 1000;
            
            // Reset to top when it goes off bottom
            if (dash.y > height) {
                dash.y -= totalDashSpace * Math.ceil((height + totalDashSpace) / totalDashSpace);
            }
        }
        
        // Animate roadside objects (trees & houses)
        const objectGap = 150;
        for (let obj of this.roadsideObjects) {
            // Move object down at same speed as road
            obj.y += (this.roadSpeed * delta) / 1000;
            
            // Reset to top when it goes off bottom
            if (obj.y > height + 50) {
                obj.y -= objectGap * Math.ceil((height + objectGap) / objectGap);
                
                // Change emoji when resetting for variety
                const emojis = ['🌲', '🏠', '🌳', '🏡'];
                obj.setText(Phaser.Utils.Array.GetRandom(emojis));
            }
        }
        
        // Move road numbers down (they're "stationary" on road, but road moves toward car)
        for (let i = this.roadNumbers.length - 1; i >= 0; i--) {
            const num = this.roadNumbers[i];
            num.y += (this.roadSpeed * delta) / 1000;
            
            // Remove if passed the car (gone past without collision) or off screen
            if (num.y > this.playerY + 100) {
                num.destroy();
                this.roadNumbers.splice(i, 1);
            }
        }
        
        // Always maintain 3 numbers on screen - spawn continuously
        while (this.roadNumbers.length < this.maxRoadNumbers) {
            this.spawnRoadNumber();
        }
        
        // Check collisions
        this.checkNumberCollision();
        
        // Smooth car movement
        if (this.isDragging || Math.abs(this.playerX - this.targetX) > 1) {
            this.targetX = Phaser.Math.Clamp(this.targetX, this.minX, this.maxX);
            const smoothing = 0.15;
            this.playerX = Phaser.Math.Linear(this.playerX, this.targetX, smoothing);
            
            // Move car and score text together
            this.playerCar.x = this.playerX;
            this.scoreText.x = this.playerX;
        }
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
