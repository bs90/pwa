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
        
        // Simple background - light gray road
        this.cameras.main.setBackgroundColor('#888888');
        
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
    
    update() {
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
