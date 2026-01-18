/**
 * すうじゲーム (Number Game)
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
        
        // Player position (raised 50px higher)
        this.playerX = width / 2;
        this.playerY = height * 0.85 - 50;
        
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
        
        // Countdown timer (15 seconds to collect a number or game over)
        this.countdown = 15;
        
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
        
        // Display countdown timer as circular progress ring in center of car
        this.countdownCircle = this.add.graphics();
        this.countdownCircleX = this.playerX;
        this.countdownCircleY = this.playerY + 20; // Dịch xuống 20px từ tâm xe
        this.countdownRadius = 20; // Smaller circle radius (was 40)
        this.maxCountdown = 15; // Max countdown time for calculating percentage
        
        // Road boundaries
        const roadWidth = width * 0.7;
        this.roadLeft = (width - roadWidth) / 2;
        this.roadRight = this.roadLeft + roadWidth;
        
        // Game numbers on road
        this.roadNumbers = [];
        this.maxRoadNumbers = 3;
        this.minNumberGap = 200; // Minimum distance between numbers
        
        // Obstacles on road
        this.obstacles = [];
        this.maxObstacles = 2; // Max 2 obstacles at once
        
        // Power-up items
        this.powerUps = [];
        this.powerUpActive = false;
        this.powerUpType = null; // 'bigger' or 'smaller'
        this.powerUpEndTime = 0;
        this.originalCarScale = 1.5;
        this.powerUpEffect = null; // Visual effect when power-up is active
        
        // Game time tracking
        this.gameTime = 0;
        
        // Game state
        this.isGameOver = false;
        
        // Spawn initial numbers
        this.spawnRoadNumber();
        this.spawnRoadNumber();
        
        // Spawn initial obstacle
        this.spawnObstacle();
        
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
        this.roadSpeed = 240; // pixels per second (increased from 200, +20%)
        
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
    
    getCurrentSpeed() {
        // Base speed, multiplied by 1.5 during power mode
        return this.roadSpeed * (this.powerUpActive ? 1.5 : 1);
    }
    
    getMaxObstacles() {
        // Start with 2 obstacles, add 1 every 60 seconds (max 5)
        return Math.min(5, 2 + Math.floor(this.gameTime / 60));
    }
    
    
    spawnRoadNumber() {
        // Don't spawn if already at max
        if (this.roadNumbers.length >= this.maxRoadNumbers) return;
        
        const { width, height } = this.scale;
        
        // Generate number value: positive (1-10) or negative (-10 to -1)
        // Difficulty increases over time (more dangerous spawns)
        let numberValue;
        const hasSmaller = this.roadNumbers.some(n => n.getData('value') > 0 && n.getData('value') < this.playerScore);
        
        // Difficulty scaling: every 30 seconds, reduce safe spawn chance by 5%
        const difficultyLevel = Math.floor(this.gameTime / 30); // 0, 1, 2, 3...
        const safeChance = Math.max(0.1, 0.3 - (difficultyLevel * 0.05)); // 30% → 25% → 20% → ... → 10% (min)
        const negativeChance = Math.min(0.4, 0.2 + (difficultyLevel * 0.05)); // 20% → 25% → 30% → ... → 40% (max)
        // Remaining goes to dangerous numbers
        
        if (!hasSmaller) {
            // Always ensure at least one safe positive number exists (1-10)
            numberValue = Phaser.Math.Between(1, Math.min(10, Math.max(1, this.playerScore - 1)));
        } else {
            const rand = Math.random();
            
            if (rand < safeChance) {
                // Safe positive numbers (1-10, less than current score)
                const maxSafe = Math.min(10, Math.max(1, this.playerScore - 1));
                numberValue = Phaser.Math.Between(1, maxSafe);
            } else if (rand < safeChance + negativeChance) {
                // Negative numbers (-10 to -1) to subtract points
                numberValue = Phaser.Math.Between(-10, -1);
            } else {
                // Dangerous numbers (MUCH larger than current score)
                // Make them at least +20 above current score to avoid accidental collection
                const minDanger = this.playerScore + 20;
                const maxDanger = this.playerScore + 50;
                numberValue = Phaser.Math.Between(minDanger, maxDanger);
            }
        }
        
        // Find safe position that doesn't overlap with ANY objects
        let randomX;
        let startY;
        let attempts = 0;
        let tooClose = true;
        
        while (tooClose && attempts < 20) {
            randomX = Phaser.Math.Between(this.roadLeft + 80, this.roadRight - 80);
            
            // Always spawn far above screen - find the highest existing object
            startY = -300; // Default
            
            // Check all objects (numbers, obstacles, power-ups)
            const allObjects = [...this.roadNumbers, ...this.obstacles, ...this.powerUps];
            
            if (allObjects.length > 0) {
                // Find the topmost object
                let topmostY = 0;
                for (let obj of allObjects) {
                    if (obj.y < topmostY) {
                        topmostY = obj.y;
                    }
                }
                // Spawn above the topmost with spacing
                startY = topmostY - 250 - Phaser.Math.Between(0, 100);
            }
            
            tooClose = false;
            
            // Check distance from ALL existing objects (X and Y)
            for (let obj of allObjects) {
                const distX = Math.abs(obj.x - randomX);
                const distY = Math.abs(obj.y - startY);
                
                // Objects should be far apart (check both X and Y)
                if (distX < 150 && distY < 250) {
                    tooClose = true;
                    break;
                }
            }
            attempts++;
        }
        
        // Create number text - all numbers same white color
        const numberText = this.add.text(randomX, startY, numberValue.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#ffffff', // All numbers white
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 10
        });
        numberText.setOrigin(0.5);
        numberText.setData('value', numberValue);
        
        // Add random horizontal movement (slow drift)
        // Random direction: -1 (left) or 1 (right)
        const horizontalDirection = Math.random() < 0.5 ? -1 : 1;
        // Random slow speed: 20-50 pixels per second
        const horizontalSpeed = Phaser.Math.Between(20, 50) * horizontalDirection;
        numberText.setData('horizontalSpeed', horizontalSpeed);
        
        this.roadNumbers.push(numberText);
    }
    
    spawnObstacle() {
        // Don't spawn if already at max (increases over time)
        if (this.obstacles.length >= this.getMaxObstacles()) return;
        
        const { width, height } = this.scale;
        
        // Only rocks as obstacles
        const emoji = '🪨'; // Just rock emoji
        
        // Find safe position that doesn't overlap with ANY objects
        let randomX;
        let startY;
        let attempts = 0;
        let tooClose = true;
        
        while (tooClose && attempts < 20) {
            randomX = Phaser.Math.Between(this.roadLeft + 80, this.roadRight - 80);
            
            // Always spawn far above screen - find the highest existing object
            startY = -400; // Default
            
            // Check all objects (numbers, obstacles, power-ups)
            const allObjects = [...this.roadNumbers, ...this.obstacles, ...this.powerUps];
            
            if (allObjects.length > 0) {
                // Find the topmost object
                let topmostY = 0;
                for (let obj of allObjects) {
                    if (obj.y < topmostY) {
                        topmostY = obj.y;
                    }
                }
                // Spawn above the topmost with spacing
                startY = topmostY - 300 - Phaser.Math.Between(0, 150);
            }
            
            tooClose = false;
            
            // Check distance from ALL existing objects (X and Y)
            for (let obj of allObjects) {
                const distX = Math.abs(obj.x - randomX);
                const distY = Math.abs(obj.y - startY);
                
                // Objects should be far apart (check both X and Y)
                // Obstacles are bigger (128px), so need more space
                if (distX < 180 && distY < 300) {
                    tooClose = true;
                    break;
                }
            }
            attempts++;
        }
        
        // Create obstacle - much bigger and more visible!
        const obstacle = this.add.text(randomX, startY, emoji, {
            fontSize: '128px' // Double size! (was 64px)
        });
        obstacle.setOrigin(0.5);
        
        this.obstacles.push(obstacle);
    }
    
    spawnPowerUp() {
        // Only spawn rarely (5% chance when called - reduced from 20%)
        if (Math.random() > 0.05) return;
        if (this.powerUps.length > 0) return; // Only 1 power-up at a time
        
        const { width, height } = this.scale;
        
        // Only one type: power-up to make car bigger (stronger)
        const type = 'bigger';
        const icon = '⚡'; // Lightning bolt for power
        
        // Random X position
        const randomX = Phaser.Math.Between(this.roadLeft + 80, this.roadRight - 80);
        const startY = -500 - Math.random() * 200;
        
        // Create power-up
        const powerUp = this.add.text(randomX, startY, icon, {
            fontSize: '72px' // Bigger for visibility
        });
        powerUp.setOrigin(0.5);
        powerUp.setData('type', type);
        
        // Add glow effect by adding a circle behind
        const glow = this.add.graphics();
        glow.fillStyle(0xFFD700, 0.4); // Golden glow for power
        glow.fillCircle(0, 0, 45);
        powerUp.setData('glow', glow);
        
        this.powerUps.push(powerUp);
    }
    
    checkPowerUpCollision() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            const distance = Phaser.Math.Distance.Between(
                powerUp.x, powerUp.y,
                this.playerCar.x, this.playerCar.y
            );
            
            if (distance < 80) {
                const type = powerUp.getData('type');
                
                
                // Activate power-up (always bigger now)
                this.powerUpActive = true;
                this.powerUpType = type;
                this.powerUpEndTime = this.gameTime + 5; // 5 seconds
                
                // Make car bigger
                this.playerCar.setScale(this.originalCarScale * 1.5); // 1.5x bigger
                
                // Create visual effect around car (pulsing circle with golden glow)
                if (this.powerUpEffect) {
                    this.powerUpEffect.destroy();
                }
                this.powerUpEffect = this.add.graphics();
                this.powerUpEffect.lineStyle(6, 0xFFD700, 0.8); // Golden color
                this.powerUpEffect.strokeCircle(0, 0, 100);
                this.powerUpEffect.x = this.playerCar.x;
                this.powerUpEffect.y = this.playerCar.y;
                
                // Store effect animation data
                this.powerUpEffect.setData('pulseScale', 1);
                this.powerUpEffect.setData('pulseDirection', 1);
                
                // Clean up power-up
                const glow = powerUp.getData('glow');
                if (glow) glow.destroy();
                powerUp.destroy();
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    shakeObject(obj) {
        // Save original position
        const originalX = obj.x;
        
        // Shake effect - rapid left-right movement
        this.tweens.add({
            targets: obj,
            x: originalX - 10,
            duration: 50,
            yoyo: true,
            repeat: 3, // Shake 4 times total
            ease: 'Linear'
        });
    }
    
    checkObstacleCollision() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            
            // Check if obstacle hit the car
            const distance = Phaser.Math.Distance.Between(
                obs.x, obs.y,
                this.playerCar.x, this.playerCar.y
            );
            
            if (distance < 80) {
                // Shake the obstacle before game over
                this.shakeObject(obs);
                
                // Game over after shake
                this.time.delayedCall(200, () => {
                    this.endGame();
                });
                return;
            }
        }
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
                
                // Check if collecting a number larger than current score -> GAME OVER
                if (value > 0 && value >= this.playerScore) {
                    // Shake the number before game over
                    this.shakeObject(num);
                    
                    // Game over after shake
                    this.time.delayedCall(200, () => {
                        this.endGame();
                    });
                    return;
                }
                
                
                // Reset countdown timer (collecting any number resets it to 15s)
                this.countdown = 15;
                
                // Update player score (can be positive or negative)
                this.playerScore += value;
                
                // Check game over (score <= 0)
                if (this.playerScore <= 0) {
                    this.endGame();
                    return;
                }
                
                // Level up when score exceeds 100 (only increase car size, no score subtraction)
                if (this.playerScore >= 100) {
                    const levels = Math.floor(this.playerScore / 100);
                    const targetScale = 1.5 * Math.pow(1.05, levels);
                    
                    // Only update if not already at this level
                    if (this.originalCarScale < targetScale) {
                        this.originalCarScale = targetScale;
                        
                        // Update car scale (considering power-up state)
                        if (this.powerUpActive) {
                            this.playerCar.setScale(this.originalCarScale * 1.5);
                        } else {
                            this.playerCar.setScale(this.originalCarScale);
                        }
                    }
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
    
    drawCountdownCircle() {
        // Clear previous drawing
        this.countdownCircle.clear();
        
        // Calculate progress (0 to 1, where 1 is full circle)
        const progress = Math.max(0, this.countdown / this.maxCountdown);
        
        // Determine color based on remaining time
        let color;
        if (this.countdown <= 3) {
            color = 0xFF0000; // Bright red when < 3s
        } else if (this.countdown <= 5) {
            color = 0xFFA500; // Orange when < 5s
        } else {
            color = 0x4CAF50; // Green when normal
        }
        
        // Draw background circle (gray, thinner line for smaller circle)
        this.countdownCircle.lineStyle(5, 0x333333, 0.3);
        this.countdownCircle.strokeCircle(this.countdownCircleX, this.countdownCircleY, this.countdownRadius);
        
        // Draw progress arc (colored based on time remaining)
        if (progress > 0) {
            this.countdownCircle.lineStyle(5, color, 1);
            
            // Start from top (-90 degrees) and draw clockwise
            const startAngle = -Math.PI / 2; // Top of circle
            const endAngle = startAngle + (progress * Math.PI * 2); // Progress around circle
            
            // Create arc path
            this.countdownCircle.beginPath();
            this.countdownCircle.arc(
                this.countdownCircleX,
                this.countdownCircleY,
                this.countdownRadius,
                startAngle,
                endAngle,
                false // Clockwise
            );
            this.countdownCircle.strokePath();
        }
    }
    
    update(time, delta) {
        // Stop all updates if game is over
        if (this.isGameOver) return;
        
        // Update game time
        this.gameTime += delta / 1000; // Convert to seconds
        
        // Update countdown timer
        this.countdown -= delta / 1000;
        if (this.countdown <= 0) {
            // Game over when countdown reaches 0
            this.endGame();
            return;
        }
        
        // Update countdown circle display
        this.drawCountdownCircle();
        
        // Animate road dashes moving down
        const { height } = this.scale;
        const totalDashSpace = this.dashHeight + this.dashGap;
        const currentSpeed = this.getCurrentSpeed();
        
        for (let dash of this.roadDashes) {
            // Move dash down
            dash.y += (currentSpeed * delta) / 1000;
            
            // Reset to top when it goes off bottom
            if (dash.y > height) {
                dash.y -= totalDashSpace * Math.ceil((height + totalDashSpace) / totalDashSpace);
            }
        }
        
        // Animate roadside objects (trees & houses)
        const objectGap = 150;
        for (let obj of this.roadsideObjects) {
            // Move object down at same speed as road
            obj.y += (currentSpeed * delta) / 1000;
            
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
            num.y += (currentSpeed * delta) / 1000;
            
            // Move horizontally (random drift)
            const horizontalSpeed = num.getData('horizontalSpeed') || 0;
            num.x += (horizontalSpeed * delta) / 1000;
            
            // Bounce back if hitting road edges
            if (num.x < this.roadLeft + 50) {
                num.x = this.roadLeft + 50;
                num.setData('horizontalSpeed', Math.abs(horizontalSpeed)); // Reverse to right
            } else if (num.x > this.roadRight - 50) {
                num.x = this.roadRight - 50;
                num.setData('horizontalSpeed', -Math.abs(horizontalSpeed)); // Reverse to left
            }
            
            // Fade out when passing the car
            if (num.y > this.playerY && !num.getData('fading')) {
                num.setData('fading', true);
                this.tweens.add({
                    targets: num,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        num.destroy();
                    }
                });
                this.roadNumbers.splice(i, 1);
            }
        }
        
        // Move obstacles down
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.y += (currentSpeed * delta) / 1000;
            
            // Fade out when passing the car
            if (obs.y > this.playerY && !obs.getData('fading')) {
                obs.setData('fading', true);
                this.tweens.add({
                    targets: obs,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        obs.destroy();
                    }
                });
                this.obstacles.splice(i, 1);
            }
        }
        
        // Move power-ups down
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += (currentSpeed * delta) / 1000;
            
            // Update glow position
            const glow = powerUp.getData('glow');
            if (glow) {
                glow.x = powerUp.x;
                glow.y = powerUp.y;
            }
            
            // Fade out when passing the car
            if (powerUp.y > this.playerY && !powerUp.getData('fading')) {
                powerUp.setData('fading', true);
                this.tweens.add({
                    targets: [powerUp, glow],
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        if (glow) glow.destroy();
                        powerUp.destroy();
                    }
                });
                this.powerUps.splice(i, 1);
            }
        }
        
        // Animate power-up effect (pulsing circle)
        if (this.powerUpActive && this.powerUpEffect) {
            // Update position to follow car
            this.powerUpEffect.x = this.playerCar.x;
            this.powerUpEffect.y = this.playerCar.y;
            
            // Pulsing animation
            let pulseScale = this.powerUpEffect.getData('pulseScale');
            let pulseDirection = this.powerUpEffect.getData('pulseDirection');
            
            pulseScale += pulseDirection * 0.02;
            
            if (pulseScale >= 1.3) {
                pulseDirection = -1;
            } else if (pulseScale <= 0.9) {
                pulseDirection = 1;
            }
            
            this.powerUpEffect.setData('pulseScale', pulseScale);
            this.powerUpEffect.setData('pulseDirection', pulseDirection);
            this.powerUpEffect.setScale(pulseScale);
        }
        
        // Check power-up expiration
        if (this.powerUpActive && this.gameTime >= this.powerUpEndTime) {
            this.powerUpActive = false;
            this.powerUpType = null;
            this.playerCar.setScale(this.originalCarScale); // Reset to normal
            
            // Remove visual effect
            if (this.powerUpEffect) {
                this.powerUpEffect.destroy();
                this.powerUpEffect = null;
            }
        }
        
        // Occasionally spawn power-ups (1% chance per frame)
        if (Math.random() < 0.01) {
            this.spawnPowerUp();
        }
        
        // Always maintain numbers and obstacles on screen (difficulty scales)
        while (this.roadNumbers.length < this.maxRoadNumbers) {
            this.spawnRoadNumber();
        }
        
        while (this.obstacles.length < this.getMaxObstacles()) {
            this.spawnObstacle();
        }
        
        // Check collisions
        this.checkObstacleCollision(); // Check obstacles first (instant death)
        this.checkNumberCollision();
        this.checkPowerUpCollision(); // Check power-up collection
        
        // Smooth car movement
        if (this.isDragging || Math.abs(this.playerX - this.targetX) > 1) {
            this.targetX = Phaser.Math.Clamp(this.targetX, this.minX, this.maxX);
            const smoothing = 0.15;
            this.playerX = Phaser.Math.Linear(this.playerX, this.targetX, smoothing);
            
            // Move car, score text, and countdown circle together
            this.playerCar.x = this.playerX;
            this.scoreText.x = this.playerX;
            this.countdownCircleX = this.playerX;
        }
    }
    
    playDeathAnimation() {
        // Set game over flag to stop movements
        this.isGameOver = true;
        
        // Hide score and countdown circle during animation
        this.scoreText.setVisible(false);
        this.countdownCircle.setVisible(false);
        
        const { height } = this.scale;
        
        // Death animation: rotate 720° and fall down off screen
        this.tweens.add({
            targets: this.playerCar,
            angle: 720, // Rotate 2 full circles
            y: height + 200, // Fall down below screen
            alpha: 0.5, // Fade out a bit
            duration: 1000, // 1 second
            ease: 'Cubic.easeIn', // Accelerate as it falls (gravity effect)
            onComplete: () => {
                // After animation, show game over
                this.showGameOver();
            }
        });
    }
    
    showGameOver() {
        const { width, height } = this.scale;
        
        // Game over overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        
        // Game over text
        this.add.text(width / 2, height / 2 - 40, 'ゲームオーバー', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#FF5252',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);
        
        // Restart instruction
        this.add.text(width / 2, height / 2 + 60, 'タップしてもういちど!', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Allow restart
        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
    
    endGame() {
        // Play death animation first, then show game over
        this.playDeathAnimation();
    }
    
    shutdown() {
        // Called when scene is destroyed (e.g., going back to menu)
        // Nothing to clean up now (no audio)
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
