/**
 * ゴルフ (Golf Game)
 * Golf game with math quiz integration
 * Ready for custom gameplay implementation
 */

// Wrap in IIFE to avoid global variable conflicts
(function() {
'use strict';

// Check dependencies loaded (from index.html script tags)
if (!window.Phaser) {
    console.error('❌ Phaser not loaded! Check index.html');
    throw new Error('Phaser is required');
}
if (!window.MathQuiz) {
    console.error('❌ MathQuiz not loaded! Check index.html');
    throw new Error('MathQuiz is required');
}

// Use global Phaser and MathQuiz directly (no const to avoid redeclaration)
console.log('✅ Base game starting...');
console.log('  - Phaser:', Phaser.VERSION);
console.log('  - MathQuiz:', typeof MathQuiz);

// ===== BASE GAME SCENE =====
class BaseGame extends Phaser.Scene {
    constructor() {
        super({ key: 'BaseGame' });
    }

    preload() {
        // Add your assets here
        // Example: this.load.image('player', 'images/game/player.png');
    }

    create() {
        const { width, height } = this.scale;

        // Grass green background
        this.cameras.main.setBackgroundColor('#7CB342');

        // ===== GOLF CONFIG =====
        this.golfConfig = {
            ball: {
                radius: 15,
                friction: 0.99,  // Lose 1% speed per frame
                stopThreshold: 10  // Stop when speed < 10 px/s
            },
            input: {
                maxPower: 5000,  // Max drag distance
                powerMultiplier: 7  // Velocity = power * multiplier
            },
            indicator: {
                lineWidth: 6,
                pulseSpeed: 2,  // Hz
                arrowSize: 20
            }
        };

        // ===== GAME STATE =====
        this.gameState = {
            isGameOver: false,
            gameStarted: false  // Wait for quiz
        };

        // ===== GOLF BALL =====
        this.ball = {
            x: width / 2,
            y: height * 0.7,
            velocityX: 0,
            velocityY: 0,
            isMoving: false
        };

        // Create ball sprite (white circle)
        this.ballSprite = this.add.circle(
            this.ball.x, 
            this.ball.y, 
            this.golfConfig.ball.radius, 
            0xFFFFFF
        );
        this.ballSprite.setStrokeStyle(2, 0x000000);

        // ===== INPUT SYSTEM =====
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragCurrentX = 0;
        this.dragCurrentY = 0;

        // Power indicator graphics
        this.powerIndicator = this.add.graphics();
        this.powerIndicator.setDepth(10);

        // Pulse animation time
        this.pulseTime = 0;

        // Input handlers
        this.input.on('pointerdown', (pointer) => {
            if (this.gameState.gameStarted && !this.ball.isMoving) {
                const dist = Phaser.Math.Distance.Between(
                    pointer.x, pointer.y,
                    this.ball.x, this.ball.y
                );
                
                // Start drag if near ball (within 100px)
                if (dist < 100) {
                    this.isDragging = true;
                    this.dragStartX = pointer.x;
                    this.dragStartY = pointer.y;
                    this.dragCurrentX = pointer.x;
                    this.dragCurrentY = pointer.y;
                }
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                this.dragCurrentX = pointer.x;
                this.dragCurrentY = pointer.y;
            }
        });

        this.input.on('pointerup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.shoot();
            }
        });

        // ===== START QUIZ =====
        MathQuiz.show(this, {
            title: 'ゴルフ',
            instruction: 'はじめるには こたえてね!',
            type: 'start',
            onCorrect: () => {
                // Start the game
                this.gameState.gameStarted = true;
                console.log('✅ Game started!');
            }
        });
    }

    shoot() {
        // Calculate drag vector (from current to start = opposite direction)
        const dragX = this.dragStartX - this.dragCurrentX;
        const dragY = this.dragStartY - this.dragCurrentY;
        
        // Calculate power (limited by maxPower)
        const power = Math.min(
            Math.sqrt(dragX * dragX + dragY * dragY),
            this.golfConfig.input.maxPower
        );

        // Only shoot if power > 5 (minimum drag)
        if (power > 5) {
            // Normalize direction and apply power
            const angle = Math.atan2(dragY, dragX);
            const velocity = power * this.golfConfig.input.powerMultiplier;
            
            this.ball.velocityX = Math.cos(angle) * velocity;
            this.ball.velocityY = Math.sin(angle) * velocity;
            this.ball.isMoving = true;
        }

        // Clear power indicator
        this.powerIndicator.clear();
    }

    drawPowerIndicator() {
        this.powerIndicator.clear();

        if (!this.isDragging) return;

        // Calculate drag vector (opposite direction)
        const dragX = this.dragStartX - this.dragCurrentX;
        const dragY = this.dragStartY - this.dragCurrentY;
        const power = Math.sqrt(dragX * dragX + dragY * dragY);

        // Clamp power to maxPower
        const clampedPower = Math.min(power, this.golfConfig.input.maxPower);
        const powerPercent = clampedPower / this.golfConfig.input.maxPower;

        // Don't draw if power too small
        if (power < 5) return;

        // Calculate direction
        const angle = Math.atan2(dragY, dragX);

        // Arrow end position (from ball, in drag direction)
        const arrowLength = clampedPower;
        const arrowEndX = this.ball.x + Math.cos(angle) * arrowLength;
        const arrowEndY = this.ball.y + Math.sin(angle) * arrowLength;

        // Pulse effect (0.9 - 1.1)
        const pulse = 1.0 + Math.sin(this.pulseTime * this.golfConfig.indicator.pulseSpeed * Math.PI * 2) * 0.1;

        // Color based on power (green → yellow → red)
        let color;
        if (powerPercent < 0.33) {
            color = 0x4CAF50;  // Green
        } else if (powerPercent < 0.66) {
            color = 0xFFD700;  // Yellow
        } else {
            color = 0xFF5252;  // Red
        }

        // Alpha pulse (0.7 - 1.0)
        const alpha = 0.7 + Math.sin(this.pulseTime * this.golfConfig.indicator.pulseSpeed * Math.PI * 2) * 0.15;

        // Draw main line with pulsing width
        this.powerIndicator.lineStyle(this.golfConfig.indicator.lineWidth * pulse, color, alpha);
        this.powerIndicator.beginPath();
        this.powerIndicator.moveTo(this.ball.x, this.ball.y);
        this.powerIndicator.lineTo(arrowEndX, arrowEndY);
        this.powerIndicator.strokePath();

        // Draw arrowhead
        const arrowSize = this.golfConfig.indicator.arrowSize * pulse;
        const arrowAngle = 0.5;  // 30 degrees

        const leftX = arrowEndX - Math.cos(angle - arrowAngle) * arrowSize;
        const leftY = arrowEndY - Math.sin(angle - arrowAngle) * arrowSize;
        const rightX = arrowEndX - Math.cos(angle + arrowAngle) * arrowSize;
        const rightY = arrowEndY - Math.sin(angle + arrowAngle) * arrowSize;

        this.powerIndicator.fillStyle(color, alpha);
        this.powerIndicator.beginPath();
        this.powerIndicator.moveTo(arrowEndX, arrowEndY);
        this.powerIndicator.lineTo(leftX, leftY);
        this.powerIndicator.lineTo(rightX, rightY);
        this.powerIndicator.closePath();
        this.powerIndicator.fillPath();

        // Draw glow circle at ball
        this.powerIndicator.lineStyle(3 * pulse, color, alpha * 0.5);
        this.powerIndicator.strokeCircle(this.ball.x, this.ball.y, this.golfConfig.ball.radius + 5);
    }

    triggerGameOver() {
        this.gameState.isGameOver = true;
        
        const { width, height } = this.scale;
        
        // Darken background
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setDepth(200);
        
        // Game Over text
        const gameOverText = this.add.text(width / 2, height / 2 - 50, 'ゲームオーバー', {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FF0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(201);
        
        // Restart button
        const restartBtn = this.add.text(width / 2, height / 2 + 70, '🔄 もう一度', {
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
        // Stop all updates if game is over or hasn't started
        if (this.gameState.isGameOver || !this.gameState.gameStarted) return;

        // Update pulse time for animation
        this.pulseTime += delta / 1000;

        // Draw power indicator if dragging
        this.drawPowerIndicator();

        // Update ball physics
        if (this.ball.isMoving) {
            // Apply velocity
            this.ball.x += this.ball.velocityX * (delta / 1000);
            this.ball.y += this.ball.velocityY * (delta / 1000);

            // Apply friction
            this.ball.velocityX *= this.golfConfig.ball.friction;
            this.ball.velocityY *= this.golfConfig.ball.friction;

            // Calculate current speed
            const speed = Math.sqrt(
                this.ball.velocityX * this.ball.velocityX + 
                this.ball.velocityY * this.ball.velocityY
            );

            // Stop if too slow
            if (speed < this.golfConfig.ball.stopThreshold) {
                this.ball.isMoving = false;
                this.ball.velocityX = 0;
                this.ball.velocityY = 0;
            }

            // Update sprite position
            this.ballSprite.x = this.ball.x;
            this.ballSprite.y = this.ball.y;
        }
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'gameContent',
    width: Math.max(window.innerWidth, 320),  // Min 320px width
    height: Math.max(window.innerHeight, 480), // Min 480px height
    backgroundColor: '#ffffff',
    scene: BaseGame,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Initialize game
const game = new Phaser.Game(config);

})(); // End IIFE
