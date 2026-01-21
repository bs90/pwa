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

        // Survival timer (2 minutes - survive to win!)
        this.survivalTimer = 120; // 2 minutes = 120 seconds
        this.survivalTimerMax = 120; // Customizable later

        // Display survival timer at top center
        this.survivalTimerText = this.add.text(width / 2, 50, this.formatTime(this.survivalTimer), {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        });
        this.survivalTimerText.setOrigin(0.5);
        this.survivalTimerText.setScrollFactor(0); // Fixed position (doesn't scroll)

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
        this.maxRoadPairs = 2; // Number of pairs on screen (was maxRoadNumbers = 3)
        this.minPairGap = 300; // Minimum vertical distance between pairs
        
        // Obstacles on road
        this.obstacles = [];
        this.maxObstacles = 1; // Max 1 obstacle at once (reduced from 2)
        
        // Power-up items
        this.powerUps = [];
        this.powerUpActive = false;
        this.powerUpType = null; // 'bigger' or 'smaller'
        this.powerUpEndTime = 0;
        this.originalCarScale = 1.5;
        this.powerUpEffect = null; // Visual effect when power-up is active
        
        // Game time tracking
        this.gameTime = 0;

        // Collection cooldown system
        this.collectionCooldown = 0; // Time remaining until can collect again
        this.cooldownDuration = 2; // 2 seconds cooldown
        this.canCollect = true; // Whether car can collect numbers

        // Game state
        this.isGameOver = false;
        this.gameStarted = false; // Game hasn't started yet (waiting for quiz)

        // Don't spawn anything yet - wait for quiz to be answered
        // Spawn initial pairs
        // this.spawnNumberPair();
        // this.spawnNumberPair();

        // Spawn initial obstacle
        // this.spawnObstacle();

        // Show start quiz first
        this.showStartQuiz();
        
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
    
    formatTime(seconds) {
        // Format time as MM:SS
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        // Start with 1 obstacle, add 1 every 60 seconds (max 3)
        return Math.min(3, 1 + Math.floor(this.gameTime / 60));
    }
    

    countNumberPairs() {
        // Count how many pairs we currently have
        // Numbers are tagged with pairId, count unique pairIds
        const pairIds = new Set();
        for (let num of this.roadNumbers) {
            const pairId = num.getData('pairId');
            if (pairId !== undefined) {
                pairIds.add(pairId);
            }
        }
        return pairIds.size;
    }

    spawnNumberPair() {
        // Don't spawn if already at max pairs
        if (this.countNumberPairs() >= this.maxRoadPairs) return;

        const { width, height } = this.scale;

        // Generate unique pair ID
        const pairId = Date.now() + Math.random();

        // Difficulty scaling
        const difficultyLevel = Math.floor(this.gameTime / 30);
        const safeChance = Math.max(0.1, 0.3 - (difficultyLevel * 0.05));
        const negativeChance = Math.min(0.4, 0.2 + (difficultyLevel * 0.05));

        // Generate two different number values for the pair
        const values = [];

        // First number - ensure at least one safe option exists
        const hasSmaller = this.roadNumbers.some(n => n.getData('value') > 0 && n.getData('value') < this.playerScore);

        if (!hasSmaller) {
            // First number is safe
            values.push(Phaser.Math.Between(1, Math.min(10, Math.max(1, this.playerScore - 1))));
        } else {
            values.push(this.generateNumberValue(safeChance, negativeChance));
        }

        // Second number - different from first
        let secondValue;
        let attempts = 0;
        do {
            secondValue = this.generateNumberValue(safeChance, negativeChance);
            attempts++;
        } while (secondValue === values[0] && attempts < 10);
        values.push(secondValue);

        // Find Y position that doesn't overlap with existing pairs
        let startY = -300;
        const allObjects = [...this.roadNumbers, ...this.obstacles, ...this.powerUps];

        if (allObjects.length > 0) {
            let topmostY = 0;
            for (let obj of allObjects) {
                if (obj.y < topmostY) {
                    topmostY = obj.y;
                }
            }
            startY = topmostY - this.minPairGap;
        }

        // Calculate horizontal positions with good spacing
        const roadWidth = this.roadRight - this.roadLeft;
        const horizontalSpacing = roadWidth * 0.4; // 40% of road width between numbers
        const centerX = (this.roadLeft + this.roadRight) / 2;

        const positions = [
            centerX - horizontalSpacing / 2, // Left position
            centerX + horizontalSpacing / 2  // Right position
        ];

        // Randomly decide which number goes left/right
        if (Math.random() < 0.5) {
            values.reverse();
        }

        // Add slow horizontal movement for the entire pair (same direction)
        const horizontalDirection = Math.random() < 0.5 ? -1 : 1;
        const horizontalSpeed = Phaser.Math.Between(20, 50) * horizontalDirection; // Slow drift

        // Create both numbers in the pair
        for (let i = 0; i < 2; i++) {
            const numberText = this.add.text(positions[i], startY, values[i].toString(), {
                fontSize: '72px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 10
            });
            numberText.setOrigin(0.5);
            numberText.setData('value', values[i]);
            numberText.setData('pairId', pairId);
            numberText.setData('horizontalSpeed', horizontalSpeed); // Both numbers move together

            this.roadNumbers.push(numberText);
        }
    }

    generateNumberValue(safeChance, negativeChance) {
        const rand = Math.random();

        if (rand < safeChance) {
            // Safe positive numbers (1-10, less than current score)
            const maxSafe = Math.min(10, Math.max(1, this.playerScore - 1));
            return Phaser.Math.Between(1, maxSafe);
        } else if (rand < safeChance + negativeChance) {
            // Negative numbers (-10 to -1)
            return Phaser.Math.Between(-10, -1);
        } else {
            // Dangerous numbers (larger than current score)
            const minDanger = this.playerScore + 20;
            const maxDanger = this.playerScore + 50;
            return Phaser.Math.Between(minDanger, maxDanger);
        }
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

        // Add slow horizontal movement for rocks
        const horizontalDirection = Math.random() < 0.5 ? -1 : 1;
        const horizontalSpeed = Phaser.Math.Between(15, 30) * horizontalDirection; // Slower than numbers
        obstacle.setData('horizontalSpeed', horizontalSpeed);

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
        
        // Create power-up (just lightning, no glow)
        const powerUp = this.add.text(randomX, startY, icon, {
            fontSize: '72px' // Bigger for visibility
        });
        powerUp.setOrigin(0.5);
        powerUp.setData('type', type);

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
        // Skip collision check if in cooldown
        if (!this.canCollect) return;

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

                // Activate cooldown
                this.collectionCooldown = this.cooldownDuration;
                this.canCollect = false;

                // Remove number
                num.destroy();
                this.roadNumbers.splice(i, 1);

                // Don't spawn immediately - let the regular maintenance handle it
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
        // Stop all updates if game is over or hasn't started yet
        if (this.isGameOver || !this.gameStarted) return;

        // Update game time
        this.gameTime += delta / 1000; // Convert to seconds

        // Update collection cooldown
        if (this.collectionCooldown > 0) {
            this.collectionCooldown -= delta / 1000;

            // Visual feedback: make car slightly transparent during cooldown
            const cooldownAlpha = 0.5 + (0.5 * (1 - this.collectionCooldown / this.cooldownDuration));
            this.playerCar.setAlpha(cooldownAlpha);

            if (this.collectionCooldown <= 0) {
                this.collectionCooldown = 0;
                this.canCollect = true;
                this.playerCar.setAlpha(1); // Restore full opacity
            }
        }

        // Update survival timer
        this.survivalTimer -= delta / 1000;
        this.survivalTimerText.setText(this.formatTime(Math.max(0, this.survivalTimer)));

        // Change color based on remaining time
        if (this.survivalTimer <= 10) {
            this.survivalTimerText.setColor('#FF0000'); // Red when < 10s
        } else if (this.survivalTimer <= 20) {
            this.survivalTimerText.setColor('#FFA500'); // Orange when < 20s
        } else {
            this.survivalTimerText.setColor('#FFD700'); // Gold when normal
        }

        // Check if survival timer reached 0 - PLAYER WINS!
        if (this.survivalTimer <= 0) {
            this.showWinScreen();
            return;
        }

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

            // Move horizontally (slow drift)
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

            // Move horizontally (slow drift like rocks rolling)
            const horizontalSpeed = obs.getData('horizontalSpeed') || 0;
            obs.x += (horizontalSpeed * delta) / 1000;

            // Bounce back if hitting road edges
            if (obs.x < this.roadLeft + 80) {
                obs.x = this.roadLeft + 80;
                obs.setData('horizontalSpeed', Math.abs(horizontalSpeed)); // Reverse to right
            } else if (obs.x > this.roadRight - 80) {
                obs.x = this.roadRight - 80;
                obs.setData('horizontalSpeed', -Math.abs(horizontalSpeed)); // Reverse to left
            }

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

            // Fade out when passing the car
            if (powerUp.y > this.playerY && !powerUp.getData('fading')) {
                powerUp.setData('fading', true);
                this.tweens.add({
                    targets: powerUp,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
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
        
        // Always maintain number pairs and obstacles on screen (difficulty scales)
        while (this.countNumberPairs() < this.maxRoadPairs) {
            this.spawnNumberPair();
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
    
    showWinScreen() {
        // Set game over flag to stop movements
        this.isGameOver = true;

        // Hide score, countdown circle, and survival timer during win screen
        this.scoreText.setVisible(false);
        this.countdownCircle.setVisible(false);
        this.survivalTimerText.setVisible(false);

        const { width, height } = this.scale;

        // Win overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);

        // WIN text with celebration
        const winText = this.add.text(width / 2, height * 0.25, '🎉 かった! 🎉', {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Pulsing animation for win text
        this.tweens.add({
            targets: winText,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Score label
        const scoreLabel = this.add.text(width / 2, height * 0.45, 'あなたのスコア:', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Final score (big and prominent)
        const finalScoreText = this.add.text(width / 2, height * 0.55, this.playerScore.toString(), {
            fontSize: '120px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 10
        }).setOrigin(0.5);

        // Restart instruction
        const restartText = this.add.text(width / 2, height * 0.75, 'もういちど あそぶ？', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Restart button
        const buttonWidth = 200;
        const buttonHeight = 80;
        const buttonX = width / 2 - buttonWidth / 2;
        const buttonY = height * 0.82;

        const button = this.add.graphics();
        button.fillStyle(0x4CAF50, 1);
        button.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 20);
        button.lineStyle(4, 0xFFD700, 1);
        button.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 20);
        button.setInteractive(
            new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight),
            Phaser.Geom.Rectangle.Contains
        );

        const buttonText = this.add.text(width / 2, buttonY + buttonHeight / 2, 'もういちど', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Button hover effect
        button.on('pointerover', () => {
            button.clear();
            button.fillStyle(0x66BB6A, 1);
            button.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 20);
            button.lineStyle(6, 0xFFD700, 1);
            button.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 20);
        });

        button.on('pointerout', () => {
            button.clear();
            button.fillStyle(0x4CAF50, 1);
            button.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 20);
            button.lineStyle(4, 0xFFD700, 1);
            button.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 20);
        });

        // Button click - restart game
        button.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    showStartQuiz() {
        const { width, height } = this.scale;

        // Start quiz overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);

        // Welcome text
        const welcomeText = this.add.text(width / 2, height * 0.12, 'すうじゲーム', {
            fontSize: '56px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Instruction text
        const instructionText = this.add.text(width / 2, height * 0.20, 'はじめるには こたえてね!', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Show math question
        this.currentQuestionContainer = null;
        this.showStartMathQuestion(overlay, welcomeText, instructionText);
    }

    showStartMathQuestion(overlay, welcomeText, instructionText) {
        const { width, height } = this.scale;

        // Destroy previous question container if exists
        if (this.currentQuestionContainer) {
            this.currentQuestionContainer.destroy(true);
            this.currentQuestionContainer = null;
        }

        // Generate math question (addition within 100)
        const num1 = Phaser.Math.Between(1, 50);
        const num2 = Phaser.Math.Between(1, 50);
        const correctAnswer = num1 + num2;

        // Generate 5 wrong answers
        const wrongAnswers = [];
        const offsets = [-10, -7, -5, -3, -1, 1, 3, 5, 7, 10];

        while (wrongAnswers.length < 5) {
            const offset = Phaser.Utils.Array.GetRandom(offsets);
            const wrongAnswer = correctAnswer + offset;

            if (wrongAnswer > 0 &&
                wrongAnswer <= 100 &&
                wrongAnswer !== correctAnswer &&
                !wrongAnswers.includes(wrongAnswer)) {
                wrongAnswers.push(wrongAnswer);
            }
        }

        // Combine and shuffle answers
        const allAnswers = [correctAnswer, ...wrongAnswers];
        Phaser.Utils.Array.Shuffle(allAnswers);

        // Container for question elements
        this.currentQuestionContainer = this.add.container(0, 0);

        // Display question in vertical format
        const questionY = height * 0.35;
        const rightX = width / 2 + 60;

        // First number (right-aligned)
        const num1Text = this.add.text(rightX, questionY, num1.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(1, 0.5);
        this.currentQuestionContainer.add(num1Text);

        // Plus sign (centered between two numbers)
        const plusText = this.add.text(rightX - 100, questionY + 40, '+', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.currentQuestionContainer.add(plusText);

        // Second number (right-aligned)
        const num2Text = this.add.text(rightX, questionY + 80, num2.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(1, 0.5);
        this.currentQuestionContainer.add(num2Text);

        // Horizontal line
        const line = this.add.graphics();
        line.lineStyle(4, 0xffffff, 1);
        line.beginPath();
        line.moveTo(rightX - 120, questionY + 130);
        line.lineTo(rightX + 10, questionY + 130);
        line.strokePath();
        this.currentQuestionContainer.add(line);

        // Answer buttons (6 choices in 3x2 grid)
        const buttonStartY = height * 0.58;
        const buttonWidth = 120;
        const buttonHeight = 90;
        const gapX = 30;
        const gapY = 25;

        const positions = [
            { x: width / 2 - buttonWidth * 1.5 - gapX, y: buttonStartY },
            { x: width / 2 - buttonWidth / 2, y: buttonStartY },
            { x: width / 2 + buttonWidth / 2 + gapX, y: buttonStartY },
            { x: width / 2 - buttonWidth * 1.5 - gapX, y: buttonStartY + buttonHeight + gapY },
            { x: width / 2 - buttonWidth / 2, y: buttonStartY + buttonHeight + gapY },
            { x: width / 2 + buttonWidth / 2 + gapX, y: buttonStartY + buttonHeight + gapY }
        ];

        // Create answer buttons
        allAnswers.forEach((answer, index) => {
            const pos = positions[index];
            const isCorrect = answer === correctAnswer;

            // Button background
            const button = this.add.graphics();
            button.fillStyle(0x667eea, 1);
            button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
            button.lineStyle(4, 0xffffff, 0.5);
            button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
            button.setInteractive(
                new Phaser.Geom.Rectangle(pos.x, pos.y, buttonWidth, buttonHeight),
                Phaser.Geom.Rectangle.Contains
            );
            this.currentQuestionContainer.add(button);

            // Button text
            const buttonText = this.add.text(
                pos.x + buttonWidth / 2,
                pos.y + buttonHeight / 2,
                answer.toString(),
                {
                    fontSize: '48px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);
            this.currentQuestionContainer.add(buttonText);

            // Button hover effect
            button.on('pointerover', () => {
                button.clear();
                button.fillStyle(0x764ba2, 1);
                button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                button.lineStyle(6, 0xFFD700, 1);
                button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
            });

            button.on('pointerout', () => {
                button.clear();
                button.fillStyle(0x667eea, 1);
                button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                button.lineStyle(4, 0xffffff, 0.5);
                button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
            });

            // Button click
            button.on('pointerdown', () => {
                // Disable all buttons
                this.currentQuestionContainer.iterate((child) => {
                    if (child.input) {
                        child.disableInteractive();
                    }
                });

                if (isCorrect) {
                    // Correct answer - start the game!
                    button.clear();
                    button.fillStyle(0x4CAF50, 1);
                    button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                    button.lineStyle(6, 0xFFD700, 1);
                    button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);

                    // Success text
                    const successText = this.add.text(width / 2, height * 0.50, '⭐ せいかい! ⭐', {
                        fontSize: '48px',
                        fontFamily: 'Arial',
                        color: '#4CAF50',
                        fontStyle: 'bold',
                        stroke: '#000000',
                        strokeThickness: 6
                    }).setOrigin(0.5);

                    // Start game after 1 second
                    this.time.delayedCall(1000, () => {
                        // Remove overlay and quiz elements
                        overlay.destroy();
                        welcomeText.destroy();
                        instructionText.destroy();
                        successText.destroy();
                        if (this.currentQuestionContainer) {
                            this.currentQuestionContainer.destroy(true);
                        }

                        // Start the game
                        this.gameStarted = true;

                        // Spawn initial pairs and obstacles
                        this.spawnNumberPair();
                        this.spawnNumberPair();
                        this.spawnObstacle();
                    });
                } else {
                    // Wrong answer - show new question
                    button.clear();
                    button.fillStyle(0xFF5252, 1);
                    button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                    button.lineStyle(6, 0xffffff, 1);
                    button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);

                    // Shake animation
                    this.tweens.add({
                        targets: [button, buttonText],
                        x: '+=10',
                        duration: 50,
                        yoyo: true,
                        repeat: 3,
                        onComplete: () => {
                            // Show new question
                            this.time.delayedCall(300, () => {
                                this.showStartMathQuestion(overlay, welcomeText, instructionText);
                            });
                        }
                    });
                }
            });
        });
    }

    showGameOver() {
        const { width, height } = this.scale;

        // Game over overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);
        
        // Game over text (smaller, at top)
        const gameOverText = this.add.text(width / 2, height * 0.12, 'ゲームオーバー', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#FF5252',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Instruction text
        const instructionText = this.add.text(width / 2, height * 0.20, 'もういちどあそぶには こたえてね!', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Show math question (will be called recursively on wrong answer)
        this.currentQuestionContainer = null; // Track current question container
        this.showMathQuestion(overlay, gameOverText, instructionText);
    }
    
    showMathQuestion(overlay, gameOverText, instructionText) {
        const { width, height } = this.scale;
        
        // Destroy previous question container if exists
        if (this.currentQuestionContainer) {
            this.currentQuestionContainer.destroy(true); // true = destroy all children
            this.currentQuestionContainer = null;
        }
        
        // Generate math question (addition within 100)
        const num1 = Phaser.Math.Between(1, 50);
        const num2 = Phaser.Math.Between(1, 50);
        const correctAnswer = num1 + num2;
        
        // Generate 5 wrong answers (close to correct answer but different)
        const wrongAnswers = [];
        const offsets = [-10, -7, -5, -3, -1, 1, 3, 5, 7, 10]; // Possible differences
        
        while (wrongAnswers.length < 5) {
            const offset = Phaser.Utils.Array.GetRandom(offsets);
            const wrongAnswer = correctAnswer + offset;
            
            // Make sure wrong answer is valid (>0, <=100) and unique
            if (wrongAnswer > 0 && 
                wrongAnswer <= 100 && 
                wrongAnswer !== correctAnswer && 
                !wrongAnswers.includes(wrongAnswer)) {
                wrongAnswers.push(wrongAnswer);
            }
        }
        
        // Combine and shuffle answers
        const allAnswers = [correctAnswer, ...wrongAnswers];
        Phaser.Utils.Array.Shuffle(allAnswers);
        
        // Container for question elements (so we can clear them on wrong answer)
        this.currentQuestionContainer = this.add.container(0, 0);
        
        // Display question in vertical format (上下)
        // Align right so that digits line up properly (ones place, tens place)
        const questionY = height * 0.35;
        const rightX = width / 2 + 60; // Right alignment point
        
        // First number (right-aligned)
        const num1Text = this.add.text(rightX, questionY, num1.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(1, 0.5); // Right-aligned
        this.currentQuestionContainer.add(num1Text);
        
        // Plus sign (centered between two numbers)
        const plusText = this.add.text(rightX - 100, questionY + 40, '+', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.currentQuestionContainer.add(plusText);
        
        // Second number (right-aligned, same x as first number)
        const num2Text = this.add.text(rightX, questionY + 80, num2.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(1, 0.5); // Right-aligned
        this.currentQuestionContainer.add(num2Text);
        
        // Horizontal line (extends from left of plus sign to right of numbers)
        const line = this.add.graphics();
        line.lineStyle(4, 0xffffff, 1);
        line.beginPath();
        line.moveTo(rightX - 120, questionY + 130);
        line.lineTo(rightX + 10, questionY + 130);
        line.strokePath();
        this.currentQuestionContainer.add(line);
        
        // Answer buttons (6 choices in 3x2 grid)
        const buttonStartY = height * 0.58;
        const buttonWidth = 120;
        const buttonHeight = 90;
        const gapX = 30;
        const gapY = 25;
        
        const positions = [
            { x: width / 2 - buttonWidth * 1.5 - gapX, y: buttonStartY },
            { x: width / 2 - buttonWidth / 2, y: buttonStartY },
            { x: width / 2 + buttonWidth / 2 + gapX, y: buttonStartY },
            { x: width / 2 - buttonWidth * 1.5 - gapX, y: buttonStartY + buttonHeight + gapY },
            { x: width / 2 - buttonWidth / 2, y: buttonStartY + buttonHeight + gapY },
            { x: width / 2 + buttonWidth / 2 + gapX, y: buttonStartY + buttonHeight + gapY }
        ];
        
        // Create answer buttons
        allAnswers.forEach((answer, index) => {
            const pos = positions[index];
            const isCorrect = answer === correctAnswer;
            
            // Button background
            const button = this.add.graphics();
            button.fillStyle(0x667eea, 1);
            button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
            button.lineStyle(4, 0xffffff, 0.5);
            button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
            button.setInteractive(
                new Phaser.Geom.Rectangle(pos.x, pos.y, buttonWidth, buttonHeight),
                Phaser.Geom.Rectangle.Contains
            );
            this.currentQuestionContainer.add(button);
            
            // Button text
            const buttonText = this.add.text(
                pos.x + buttonWidth / 2, 
                pos.y + buttonHeight / 2, 
                answer.toString(), 
                {
                    fontSize: '48px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);
            this.currentQuestionContainer.add(buttonText);
            
            // Button hover effect
            button.on('pointerover', () => {
                button.clear();
                button.fillStyle(0x764ba2, 1);
                button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                button.lineStyle(6, 0xFFD700, 1);
                button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
            });
            
            button.on('pointerout', () => {
                button.clear();
                button.fillStyle(0x667eea, 1);
                button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                button.lineStyle(4, 0xffffff, 0.5);
                button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
            });
            
            // Button click
            button.on('pointerdown', () => {
                // Disable all buttons to prevent multiple clicks
                this.currentQuestionContainer.iterate((child) => {
                    if (child.input) {
                        child.disableInteractive();
                    }
                });
                
                if (isCorrect) {
                    // Correct answer - show feedback and restart
                    button.clear();
                    button.fillStyle(0x4CAF50, 1);
                    button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                    button.lineStyle(6, 0xFFD700, 1);
                    button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                    
                    // Success text
                    const successText = this.add.text(width / 2, height * 0.50, '⭐ せいかい! ⭐', {
                        fontSize: '48px',
                        fontFamily: 'Arial',
                        color: '#4CAF50',
                        fontStyle: 'bold',
                        stroke: '#000000',
                        strokeThickness: 6
                    }).setOrigin(0.5);
                    
                    // Restart after 1 second
                    this.time.delayedCall(1000, () => {
                        this.scene.restart();
                    });
                } else {
                    // Wrong answer - shake, show it's wrong, then generate new question
                    button.clear();
                    button.fillStyle(0xFF5252, 1);
                    button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                    button.lineStyle(6, 0xffffff, 1);
                    button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                    
                    // Shake animation
                    this.tweens.add({
                        targets: [button, buttonText],
                        x: '+=10',
                        duration: 50,
                        yoyo: true,
                        repeat: 3,
                        onComplete: () => {
                            // Show new random question after short delay
                            // (container will be auto-destroyed by showMathQuestion)
                            this.time.delayedCall(300, () => {
                                this.showMathQuestion(overlay, gameOverText, instructionText);
                            });
                        }
                    });
                }
            });
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
