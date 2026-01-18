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
        
        // Simple background - lighter gray to match road
        this.cameras.main.setBackgroundColor('#999999');
        
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
        
        // Touch controls
        this.isDragging = false;
        this.targetX = width / 2;
        
        const roadWidth = width * 0.7;
        this.minX = (width - roadWidth) / 2 + 50;
        this.maxX = width - (width - roadWidth) / 2 - 50;
        
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
        
        // Smooth car movement
        if (this.isDragging || Math.abs(this.playerX - this.targetX) > 1) {
            this.targetX = Phaser.Math.Clamp(this.targetX, this.minX, this.maxX);
            const smoothing = 0.15;
            this.playerX = Phaser.Math.Linear(this.playerX, this.targetX, smoothing);
            this.playerCar.x = this.playerX;
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
