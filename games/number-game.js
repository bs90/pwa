/**
 * すうじげーむ (Number Game)
 * Demo: 2D Pseudo-3D Perspective
 * Player là vòng tròn có số, đứng yên
 * Các vật thể chạy về phía player tạo hiệu ứng depth
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
        
        // Draw perspective grid (road effect)
        this.drawPerspectiveGrid();
        
        // Player car with number
        this.player = {
            number: 1,
            car: null,
            text: null
        };
        
        // Create player at bottom center (closer to bottom, bigger)
        const playerY = height * 0.85;
        
        // Draw player car (simple top-down view)
        const carGraphics = this.add.graphics();
        
        // Car body (blue)
        carGraphics.fillStyle(0x3498db, 1);
        carGraphics.fillRoundedRect(-40, -60, 80, 120, 10);
        
        // Car windows (darker blue)
        carGraphics.fillStyle(0x2c3e50, 1);
        carGraphics.fillRoundedRect(-30, -40, 60, 35, 5); // Front window
        carGraphics.fillRoundedRect(-30, 10, 60, 35, 5);  // Back window
        
        // Car outline
        carGraphics.lineStyle(3, 0x000000, 1);
        carGraphics.strokeRoundedRect(-40, -60, 80, 120, 10);
        
        // Wheels (black circles)
        carGraphics.fillStyle(0x000000, 1);
        carGraphics.fillCircle(-35, -45, 8);  // Front left
        carGraphics.fillCircle(35, -45, 8);   // Front right
        carGraphics.fillCircle(-35, 45, 8);   // Back left
        carGraphics.fillCircle(35, 45, 8);    // Back right
        
        carGraphics.generateTexture('playerCar', 100, 140);
        carGraphics.destroy();
        
        this.player.car = this.add.sprite(width / 2, playerY, 'playerCar');
        
        // Add number text on car (bigger font, white for contrast)
        this.player.text = this.add.text(width / 2, playerY - 10, '1', {
            fontSize: '52px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.player.text.setOrigin(0.5);
        
        // Array to hold incoming objects
        this.objects = [];
        
        // Spawn objects periodically (slower: 2s → 4s)
        this.time.addEvent({
            delay: 4000,
            callback: this.spawnObject,
            callbackScope: this,
            loop: true
        });
        
        // Instructions
        this.add.text(width / 2, 50, 'すうじげーむ Demo', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, 90, 'ゆびでスライドしてうごかすよ!', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Touch controls - drag to move
        this.isDragging = false;
        this.targetX = width / 2;
        
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
        const { width, height } = this.scale;
        
        // Random type: circle with number or obstacle
        const isNumber = Math.random() > 0.5;
        const number = Phaser.Math.Between(1, 5);
        
        // Start from horizon (small) - closer to title
        const startY = height * 0.15;
        const endY = height * 0.85;
        const startScale = 0.1;
        const endScale = 1.0;
        
        // Random X position
        const lanes = [-150, 0, 150];
        const randomLane = Phaser.Utils.Array.GetRandom(lanes);
        const startX = width / 2 + randomLane * startScale;
        const endX = width / 2 + randomLane;
        
        let obj;
        let text = null;
        
        if (isNumber) {
            // Create number circle
            const graphics = this.add.graphics();
            graphics.fillStyle(0x4CAF50, 1);
            graphics.fillCircle(0, 0, 30);
            graphics.lineStyle(3, 0x000000, 1);
            graphics.strokeCircle(0, 0, 30);
            graphics.generateTexture('numberCircle_' + this.objects.length, 60, 60);
            graphics.destroy();
            
            obj = this.add.sprite(startX, startY, 'numberCircle_' + this.objects.length);
            obj.setScale(startScale);
            
            // Add number text
            text = this.add.text(startX, startY, number.toString(), {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            text.setOrigin(0.5);
            text.setScale(startScale);
            
            obj.isNumber = true;
            obj.value = number;
        } else {
            // Create obstacle (red square)
            const graphics = this.add.graphics();
            graphics.fillStyle(0xFF6B6B, 1);
            graphics.fillRect(-25, -25, 50, 50);
            graphics.lineStyle(3, 0x000000, 1);
            graphics.strokeRect(-25, -25, 50, 50);
            graphics.generateTexture('obstacle_' + this.objects.length, 50, 50);
            graphics.destroy();
            
            obj = this.add.sprite(startX, startY, 'obstacle_' + this.objects.length);
            obj.setScale(startScale);
            
            obj.isNumber = false;
        }
        
        // Animate toward player (pseudo 3D effect, slower: 2s → 4s)
        this.tweens.add({
            targets: obj,
            x: endX,
            y: endY,
            scale: endScale,
            duration: 4000,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                // Check collision with player
                const distance = Phaser.Math.Distance.Between(
                    obj.x, obj.y,
                    this.player.car.x, this.player.car.y
                );
                
                if (distance < 80) {
                    if (obj.isNumber) {
                        // Collect number
                        this.player.number += obj.value;
                        this.player.text.setText(this.player.number.toString());
                    }
                }
                
                obj.destroy();
                if (text) text.destroy();
            }
        });
        
        if (text) {
            this.tweens.add({
                targets: text,
                x: endX,
                y: endY,
                scale: endScale,
                duration: 4000,
                ease: 'Cubic.easeIn'
            });
        }
        
        this.objects.push({ sprite: obj, text: text });
    }
    
    update() {
        // Smooth follow target X position
        if (this.isDragging || Math.abs(this.player.car.x - this.targetX) > 1) {
            // Clamp target within bounds
            this.targetX = Phaser.Math.Clamp(this.targetX, this.minX, this.maxX);
            
            // Smooth lerp movement
            const smoothing = 0.15;
            const newX = Phaser.Math.Linear(this.player.car.x, this.targetX, smoothing);
            
            this.player.car.x = newX;
            this.player.text.x = newX;
        }
        
        // Clean up destroyed objects
        this.objects = this.objects.filter(obj => obj.sprite.active);
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
