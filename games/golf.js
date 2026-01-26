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
                radius: 8,  // Reduced from 15 to 8 (for iPad view)
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
            },
            wall: {
                thickness: 10,
                color: 0x8B4513,  // Brown
                bounceReduction: 0.7  // Keep 70% velocity after bounce
            }
        };

        // ===== GAME STATE =====
        this.gameState = {
            isGameOver: false,
            gameStarted: false,  // Wait for quiz
            hasWon: false,
            level: 1,
            totalStrokes: 0,
            levelStrokes: 0,
            par: 3,
            timeRemaining: 0,
            maxTime: 0
        };
        
        // ===== LEVEL OBSTACLES =====
        this.obstacles = [];
        
        // ===== GOLF HOLE =====
        this.hole = {
            worldX: 500,  // Will be set by generateLevel
            worldY: 0,
            radius: 12,   // Reduced from 25 to 12 (half size for iPad)
            captureRadius: 15  // Reduced from 30 to 15
        };

        // ===== GOLF BALL =====
        // World position (actual position in game world)
        this.ball = {
            worldX: 0,  // Start at world origin
            worldY: 0,
            velocityX: 0,
            velocityY: 0,
            isMoving: false
        };

        // Screen position (fixed at center)
        this.ballScreenX = width / 2;
        this.ballScreenY = height / 2;

        // Create custom golf ball with dimples
        this.createGolfBall();

        // ===== WORLD CONTAINER =====
        // Container for all world objects (scrolls with camera)
        this.worldContainer = this.add.container(0, 0);
        this.worldContainer.setDepth(0);

        // ===== BACKGROUND GRID =====
        // Create grid pattern for visual feedback
        this.createBackgroundGrid();
        
        // ===== GOLF HOLE =====
        this.createGolfHole();

        // ===== WALLS (Maze-like) =====
        this.mazeWalls = [];

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

        // Input handlers (check distance from screen position)
        this.input.on('pointerdown', (pointer) => {
            if (this.gameState.gameStarted && !this.ball.isMoving) {
                const dist = Phaser.Math.Distance.Between(
                    pointer.x, pointer.y,
                    this.ballScreenX, this.ballScreenY
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
                
                // Generate first level
                this.generateLevel(1);
            }
        });
    }

    generateLevel(levelNumber) {
        console.log('🏌️ Generating Level', levelNumber);
        
        // Update level state
        this.gameState.level = levelNumber;
        this.gameState.levelStrokes = 0;
        this.gameState.hasWon = false;
        
        // Set time limit (fixed 30 seconds for all levels)
        this.gameState.maxTime = 30;
        this.gameState.timeRemaining = this.gameState.maxTime;
        
        // Calculate difficulty scaling
        // Distance = furthest wall + small margin (100-150px)
        const wallCount = Math.min(levelNumber, 12);
        const furthestWallDistance = wallCount > 0 ? 100 + (levelNumber * 20) : 0;
        const baseDistance = 300;
        const wallSpread = 200; // Space for walls along path
        const distance = baseDistance + wallSpread + furthestWallDistance + Phaser.Math.Between(100, 150);
        
        // Calculate par (ideal strokes based on distance)
        const par = Math.ceil(distance / 600) + Math.floor(levelNumber / 4);
        this.gameState.par = par;
        
        // Clear old obstacles
        this.clearObstacles();
        
        // Place hole
        const holeOffsetY = (levelNumber > 1) ? Phaser.Math.Between(-150, 150) : 0;
        this.hole.worldX = distance;
        this.hole.worldY = holeOffsetY;
        
        // Update hole sprite position
        if (this.holeSprite) {
            this.holeSprite.x = this.hole.worldX;
            this.holeSprite.y = this.hole.worldY;
        }
        
        // Generate maze walls (progressive difficulty)
        this.generateMazeWalls(levelNumber, distance);
        
        // Reset ball position
        this.ball.worldX = 0;
        this.ball.worldY = 0;
        this.ball.velocityX = 0;
        this.ball.velocityY = 0;
        this.ball.isMoving = false;
        this.updateWorldPosition();
        
        // Show timer UI
        this.showTimerUI();
    }

    generateObstacles(count, holeDistance) {
        if (count === 0) return;
        
        for (let i = 0; i < count; i++) {
            // Position obstacles between start and hole
            const progress = (i + 1) / (count + 1);
            const x = holeDistance * progress + Phaser.Math.Between(-100, 100);
            const y = Phaser.Math.Between(-200, 200);
            
            this.createObstacle(x, y);
        }
    }

    createObstacle(x, y) {
        const obstacleRadius = 30;
        
        // Create obstacle graphics
        const graphics = this.add.graphics();
        
        // Rock emoji style
        graphics.fillStyle(0x808080, 1);  // Gray
        graphics.fillCircle(obstacleRadius, obstacleRadius, obstacleRadius);
        
        // Shadow
        graphics.fillStyle(0x505050, 1);
        graphics.fillCircle(obstacleRadius + 3, obstacleRadius + 3, obstacleRadius * 0.8);
        
        // Highlight
        graphics.fillStyle(0xA0A0A0, 0.5);
        graphics.fillCircle(obstacleRadius - 5, obstacleRadius - 5, obstacleRadius * 0.5);
        
        const size = obstacleRadius * 2 + 6;
        graphics.generateTexture('obstacle_' + Date.now(), size, size);
        graphics.destroy();
        
        // Create obstacle sprite
        const obstacleSprite = this.add.sprite(x, y, 'obstacle_' + Date.now());
        obstacleSprite.setOrigin(0.5, 0.5);
        
        // Store obstacle data
        const obstacle = {
            x: x,
            y: y,
            radius: obstacleRadius,
            sprite: obstacleSprite
        };
        
        this.obstacles.push(obstacle);
        this.worldContainer.add(obstacleSprite);
    }

    clearObstacles() {
        for (let obstacle of this.obstacles) {
            if (obstacle.sprite) {
                obstacle.sprite.destroy();
            }
        }
        this.obstacles = [];
    }

    generateMazeWalls(levelNumber, holeDistance) {
        // Clear old walls
        for (let wall of this.mazeWalls) {
            if (wall.sprite) {
                wall.sprite.destroy();
            }
        }
        this.mazeWalls = [];
        
        // No walls on level 1 (tutorial)
        if (levelNumber === 1) return;
        
        const wallThickness = 20;
        const wallColor = 0x8B4513; // Brown
        
        // Progressive wall complexity - walls concentrate around hole
        const wallCount = Math.min(levelNumber, 12); // More walls as difficulty increases
        
        // Strategy: Create concentric maze layers around hole
        for (let i = 0; i < wallCount; i++) {
            // Position: mix of path walls and hole-surrounding walls
            const isNearHole = i >= wallCount / 2; // Second half focuses on hole area
            
            let baseX, baseY;
            
            if (isNearHole) {
                // Walls surrounding hole (70% of distance to hole)
                const angleAroundHole = (i / wallCount) * Math.PI * 2;
                const distanceFromHole = 100 + (levelNumber * 20); // Expand with difficulty
                
                baseX = this.hole.worldX + Math.cos(angleAroundHole) * distanceFromHole;
                baseY = this.hole.worldY + Math.sin(angleAroundHole) * distanceFromHole;
            } else {
                // Walls along the path
                const progress = (i + 1) / (wallCount / 2 + 1);
                baseX = holeDistance * progress * 0.7; // 70% toward hole
                baseY = Phaser.Math.Between(-200, 200);
            }
            
            // Random wall orientation (horizontal or vertical)
            const isHorizontal = Math.random() < 0.5;
            
            // Gap size decreases with difficulty
            const gapSize = Math.max(100, 150 - levelNumber * 3);
            
            if (isHorizontal) {
                // Horizontal wall with gap
                const gapPosition = Phaser.Math.Between(-100, 100);
                const wallLength = 250 + Phaser.Math.Between(-50, 50);
                
                // Left part of wall
                const leftWallLength = wallLength / 2 + gapPosition;
                if (leftWallLength > 40) {
                    this.createMazeWall(
                        baseX - gapSize / 2 - leftWallLength / 2,
                        baseY,
                        leftWallLength,
                        wallThickness,
                        wallColor
                    );
                }
                
                // Right part of wall
                const rightWallLength = wallLength / 2 - gapPosition;
                if (rightWallLength > 40) {
                    this.createMazeWall(
                        baseX + gapSize / 2 + rightWallLength / 2,
                        baseY,
                        rightWallLength,
                        wallThickness,
                        wallColor
                    );
                }
            } else {
                // Vertical wall with gap
                const gapPosition = Phaser.Math.Between(-100, 100);
                const wallLength = 250 + Phaser.Math.Between(-50, 50);
                
                // Top part of wall
                const topWallLength = wallLength / 2 + gapPosition;
                if (topWallLength > 40) {
                    this.createMazeWall(
                        baseX,
                        baseY - gapSize / 2 - topWallLength / 2,
                        wallThickness,
                        topWallLength,
                        wallColor
                    );
                }
                
                // Bottom part of wall
                const bottomWallLength = wallLength / 2 - gapPosition;
                if (bottomWallLength > 40) {
                    this.createMazeWall(
                        baseX,
                        baseY + gapSize / 2 + bottomWallLength / 2,
                        wallThickness,
                        bottomWallLength,
                        wallColor
                    );
                }
            }
        }
    }

    createMazeWall(x, y, width, height, color) {
        // Check if wall would overlap with hole (safety distance)
        const safeDistance = 80; // Minimum distance from hole center
        const distToHole = Math.sqrt(
            Math.pow(x - this.hole.worldX, 2) + 
            Math.pow(y - this.hole.worldY, 2)
        );
        
        // Don't create wall if too close to hole
        if (distToHole < safeDistance) {
            console.log('⚠️ Wall too close to hole, skipping');
            return;
        }
        
        const wallSprite = this.add.rectangle(x, y, width, height, color);
        wallSprite.setOrigin(0.5, 0.5);
        
        const wall = {
            x: x,
            y: y,
            width: width,
            height: height,
            sprite: wallSprite
        };
        
        this.mazeWalls.push(wall);
        this.worldContainer.add(wallSprite);
    }

    checkMazeWallCollision() {
        if (!this.ball.isMoving) return false;
        
        const ballRadius = this.golfConfig.ball.radius;
        
        for (let wall of this.mazeWalls) {
            // Rectangle collision with ball
            const closestX = Math.max(wall.x - wall.width / 2, Math.min(this.ball.worldX, wall.x + wall.width / 2));
            const closestY = Math.max(wall.y - wall.height / 2, Math.min(this.ball.worldY, wall.y + wall.height / 2));
            
            const distX = this.ball.worldX - closestX;
            const distY = this.ball.worldY - closestY;
            const distance = Math.sqrt(distX * distX + distY * distY);
            
            if (distance < ballRadius) {
                // Collision! Bounce ball away
                const angle = Math.atan2(distY, distX);
                const overlap = ballRadius - distance;
                
                // Push ball out
                this.ball.worldX += Math.cos(angle) * overlap;
                this.ball.worldY += Math.sin(angle) * overlap;
                
                // Bounce with velocity reduction
                const speed = Math.sqrt(
                    this.ball.velocityX * this.ball.velocityX + 
                    this.ball.velocityY * this.ball.velocityY
                );
                
                this.ball.velocityX = Math.cos(angle) * speed * 0.6;
                this.ball.velocityY = Math.sin(angle) * speed * 0.6;
                
                // Visual feedback
                this.cameras.main.shake(100, 0.008);
                
                return true;
            }
        }
        
        return false;
    }

    checkObstacleCollision() {
        if (!this.ball.isMoving) return false;
        
        for (let obstacle of this.obstacles) {
            const distX = this.ball.worldX - obstacle.x;
            const distY = this.ball.worldY - obstacle.y;
            const distance = Math.sqrt(distX * distX + distY * distY);
            
            const minDist = this.golfConfig.ball.radius + obstacle.radius;
            
            if (distance < minDist) {
                // Collision! Bounce ball away
                const angle = Math.atan2(distY, distX);
                const overlap = minDist - distance;
                
                // Push ball out of obstacle
                this.ball.worldX += Math.cos(angle) * overlap;
                this.ball.worldY += Math.sin(angle) * overlap;
                
                // Reflect velocity
                const speed = Math.sqrt(
                    this.ball.velocityX * this.ball.velocityX + 
                    this.ball.velocityY * this.ball.velocityY
                );
                
                this.ball.velocityX = Math.cos(angle) * speed * 0.7;
                this.ball.velocityY = Math.sin(angle) * speed * 0.7;
                
                // Visual feedback
                this.cameras.main.shake(100, 0.008);
                
                return true;
            }
        }
        
        return false;
    }



    showTimerUI() {
        const { width } = this.scale;
        
        // Remove old timer if exists
        if (this.timerUI) {
            this.timerUI.destroy();
        }
        
        // Create timer display (top-center)
        const timerText = `⏰ ${Math.ceil(this.gameState.timeRemaining)}`;
        this.timerUI = this.add.text(width / 2, 20, timerText, {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        });
        this.timerUI.setOrigin(0.5, 0);
        this.timerUI.setDepth(150);
        this.timerUI.setScrollFactor(0);
    }

    updateTimer(delta) {
        if (this.gameState.hasWon) return;
        
        // Countdown
        this.gameState.timeRemaining -= delta / 1000;
        
        // Update UI
        if (this.timerUI) {
            const timeLeft = Math.ceil(this.gameState.timeRemaining);
            this.timerUI.setText(`⏰ ${timeLeft}`);
            
            // Color warning based on time
            if (timeLeft <= 5) {
                this.timerUI.setColor('#FF0000'); // Red
                this.timerUI.setFontSize('40px');
            } else if (timeLeft <= 10) {
                this.timerUI.setColor('#FFA500'); // Orange
                this.timerUI.setFontSize('38px');
            } else {
                this.timerUI.setColor('#FFFFFF'); // White
                this.timerUI.setFontSize('36px');
            }
        }
        
        // Check time out
        if (this.gameState.timeRemaining <= 0) {
            this.triggerTimeOut();
        }
    }

    triggerTimeOut() {
        if (this.gameState.isGameOver) return;
        
        this.gameState.isGameOver = true;
        this.ball.isMoving = false;
        this.ball.velocityX = 0;
        this.ball.velocityY = 0;
        
        const { width, height } = this.scale;
        
        // Game Over overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85)
            .setOrigin(0, 0)
            .setDepth(200)
            .setScrollFactor(0);
        
        // Time's up text
        const gameOverText = this.add.text(width / 2, height * 0.35, '⏰ じかんぎれ！', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#FF5252',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        // Pulsing animation
        this.tweens.add({
            targets: gameOverText,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Retry button
        const retryBtn = this.add.text(width / 2, height * 0.55, '🔄 もういちど', {
            fontSize: '40px',
            color: '#FFFFFF',
            backgroundColor: '#4CAF50',
            padding: { x: 40, y: 20 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        retryBtn.setInteractive({ useHandCursor: true });
        retryBtn.on('pointerover', () => retryBtn.setScale(1.1));
        retryBtn.on('pointerout', () => retryBtn.setScale(1));
        retryBtn.on('pointerdown', () => {
            // Clean up time out screen
            overlay.destroy();
            gameOverText.destroy();
            retryBtn.destroy();
            
            // Show quiz before retry
            MathQuiz.show(this, {
                title: 'ゴルフ',
                instruction: 'もういちど やるには こたえてね!',
                type: 'start',
                onCorrect: () => {
                    // Restore ball
                    this.ballContainer.setAlpha(1);
                    this.ballContainer.setScale(1);
                    
                    // Reset game state
                    this.gameState.isGameOver = false;
                    
                    // Regenerate same level
                    this.generateLevel(this.gameState.level);
                }
            });
        });
    }

    updateFlagIndicator() {
        if (!this.flagIndicator) return;
        
        const { width, height } = this.scale;
        
        // Calculate hole position on screen
        // Hole world position relative to ball
        const holeRelativeX = this.hole.worldX - this.ball.worldX;
        const holeRelativeY = this.hole.worldY - this.ball.worldY;
        
        // Screen position of hole (if it were visible)
        const holeScreenX = this.ballScreenX + holeRelativeX;
        const holeScreenY = this.ballScreenY + holeRelativeY;
        
        // Check if hole is on screen
        const margin = 80; // Safety margin from edge
        const isHoleOnScreen = (
            holeScreenX > margin && 
            holeScreenX < width - margin &&
            holeScreenY > margin + 60 && // Account for flag height
            holeScreenY < height - margin
        );
        
        if (isHoleOnScreen) {
            // Hole visible → place flag directly above hole
            this.flagIndicator.x = holeScreenX;
            this.flagIndicator.y = holeScreenY - 40;
        } else {
            // Hole off-screen → place flag at edge, pointing toward hole
            
            // Calculate direction to hole
            const angle = Math.atan2(holeRelativeY, holeRelativeX);
            
            // Find intersection with screen edge
            let flagX, flagY;
            
            // Calculate where the line from center to hole intersects screen edge
            const centerX = this.ballScreenX;
            const centerY = this.ballScreenY;
            
            // Check which edge the hole is closest to
            const normalizedAngle = Math.atan2(holeRelativeY, holeRelativeX);
            
            // Test all 4 edges and find closest intersection
            const intersections = [];
            
            // Right edge
            const tRight = (width - margin - centerX) / Math.cos(normalizedAngle);
            if (tRight > 0) {
                const yRight = centerY + tRight * Math.sin(normalizedAngle);
                if (yRight >= margin && yRight <= height - margin) {
                    intersections.push({ x: width - margin, y: yRight, t: tRight });
                }
            }
            
            // Left edge  
            const tLeft = (margin - centerX) / Math.cos(normalizedAngle);
            if (tLeft > 0) {
                const yLeft = centerY + tLeft * Math.sin(normalizedAngle);
                if (yLeft >= margin && yLeft <= height - margin) {
                    intersections.push({ x: margin, y: yLeft, t: tLeft });
                }
            }
            
            // Bottom edge
            const tBottom = (height - margin - centerY) / Math.sin(normalizedAngle);
            if (tBottom > 0) {
                const xBottom = centerX + tBottom * Math.cos(normalizedAngle);
                if (xBottom >= margin && xBottom <= width - margin) {
                    intersections.push({ x: xBottom, y: height - margin, t: tBottom });
                }
            }
            
            // Top edge
            const tTop = (margin + 60 - centerY) / Math.sin(normalizedAngle); // +60 for flag height
            if (tTop > 0) {
                const xTop = centerX + tTop * Math.cos(normalizedAngle);
                if (xTop >= margin && xTop <= width - margin) {
                    intersections.push({ x: xTop, y: margin + 60, t: tTop });
                }
            }
            
            // Find closest intersection
            if (intersections.length > 0) {
                intersections.sort((a, b) => a.t - b.t);
                flagX = intersections[0].x;
                flagY = intersections[0].y;
            } else {
                // Fallback: center of screen
                flagX = centerX;
                flagY = centerY;
            }
            
            this.flagIndicator.x = flagX;
            this.flagIndicator.y = flagY;
        }
    }

    createGolfBall() {
        const { width, height } = this.scale;
        const ballRadius = this.golfConfig.ball.radius;
        
        // ===== STEP 1: Create tileable dimples pattern texture =====
        const patternSize = 64; // Tileable pattern size
        const patternGraphics = this.add.graphics();
        
        // White background
        patternGraphics.fillStyle(0xFFFFFF, 1);
        patternGraphics.fillRect(0, 0, patternSize, patternSize);
        
        // Draw dimples in tileable grid pattern
        patternGraphics.fillStyle(0xE0E0E0, 1);
        const dimpleRadius = 2;
        const spacing = 10;
        
        // Create grid of dimples (tileable)
        for (let x = 0; x < patternSize + spacing; x += spacing) {
            for (let y = 0; y < patternSize + spacing; y += spacing) {
                // Offset every other row for hexagonal-like pattern
                const offsetX = (Math.floor(y / spacing) % 2) * (spacing / 2);
                patternGraphics.fillCircle(x + offsetX, y, dimpleRadius);
            }
        }
        
        // Generate tileable texture
        patternGraphics.generateTexture('dimplePattern', patternSize, patternSize);
        patternGraphics.destroy();
        
        // ===== STEP 2: Create main ball body (circle mask) =====
        const ballGraphics = this.add.graphics();
        
        // Shadow
        ballGraphics.fillStyle(0xCCCCCC, 1);
        ballGraphics.fillCircle(ballRadius + 2, ballRadius + 2, ballRadius);
        
        // Main ball body
        ballGraphics.fillStyle(0xFFFFFF, 1);
        ballGraphics.fillCircle(ballRadius, ballRadius, ballRadius);
        
        // Gradient highlight (3D effect)
        ballGraphics.fillStyle(0xF5F5F5, 0.6);
        ballGraphics.fillCircle(ballRadius - 3, ballRadius - 3, ballRadius * 0.6);
        
        // Border
        ballGraphics.lineStyle(2, 0xDDDDDD, 1);
        ballGraphics.strokeCircle(ballRadius, ballRadius, ballRadius);
        
        const ballSize = ballRadius * 2 + 4;
        ballGraphics.generateTexture('golfBallBase', ballSize, ballSize);
        ballGraphics.destroy();
        
        // ===== STEP 3: Create container for ball components =====
        this.ballContainer = this.add.container(this.ballScreenX, this.ballScreenY);
        this.ballContainer.setDepth(100);
        
        // Background dimple pattern (TileSprite for scrolling)
        const tileSize = ballRadius * 3; // Larger than ball for smooth scrolling
        this.dimpleSprite = this.add.tileSprite(0, 0, tileSize, tileSize, 'dimplePattern');
        this.dimpleSprite.setOrigin(0.5, 0.5);
        
        // Create circular mask for dimples
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillCircle(this.ballScreenX, this.ballScreenY, ballRadius);
        const mask = maskShape.createGeometryMask();
        this.dimpleSprite.setMask(mask);
        
        // Ball overlay (with gradient and shadow)
        this.ballSprite = this.add.sprite(0, 0, 'golfBallBase');
        this.ballSprite.setOrigin(0.5, 0.5);
        
        // Add both to container
        this.ballContainer.add([this.dimpleSprite, this.ballSprite]);
        
        // Track texture scroll offset
        this.textureOffsetX = 0;
        this.textureOffsetY = 0;
    }

    createBackgroundGrid() {
        // Create a grid of grass patterns for visual feedback
        const gridSize = 100;  // Grid cell size
        const gridRange = 30;  // How many cells to create
        
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.lineStyle(1, 0x5A9216, 0.3);  // Dark green lines
        
        // Draw grid lines
        for (let i = -gridRange; i <= gridRange; i++) {
            // Vertical lines
            this.gridGraphics.beginPath();
            this.gridGraphics.moveTo(i * gridSize, -gridRange * gridSize);
            this.gridGraphics.lineTo(i * gridSize, gridRange * gridSize);
            this.gridGraphics.strokePath();
            
            // Horizontal lines
            this.gridGraphics.beginPath();
            this.gridGraphics.moveTo(-gridRange * gridSize, i * gridSize);
            this.gridGraphics.lineTo(gridRange * gridSize, i * gridSize);
            this.gridGraphics.strokePath();
        }
        
        this.worldContainer.add(this.gridGraphics);
    }

    createGolfHole() {
        const holeRadius = this.hole.radius;
        
        // Create hole graphics
        const holeGraphics = this.add.graphics();
        
        // Outer rim (darker)
        holeGraphics.fillStyle(0x2E7D32, 1);  // Dark green
        holeGraphics.fillCircle(holeRadius + 2, holeRadius + 2, holeRadius + 3);
        
        // Hole (black with gradient)
        holeGraphics.fillStyle(0x000000, 1);
        holeGraphics.fillCircle(holeRadius + 2, holeRadius + 2, holeRadius);
        
        // Inner shadow effect
        holeGraphics.fillStyle(0x1A1A1A, 0.8);
        holeGraphics.fillCircle(holeRadius + 2, holeRadius + 2, holeRadius * 0.7);
        
        // Create texture
        const holeSize = holeRadius * 2 + 8;
        holeGraphics.generateTexture('golfHole', holeSize, holeSize);
        holeGraphics.destroy();
        
        // Create hole sprite in world
        this.holeSprite = this.add.sprite(this.hole.worldX, this.hole.worldY, 'golfHole');
        this.holeSprite.setOrigin(0.5, 0.5);
        this.holeSprite.setDepth(1);
        
        // Add to world container
        this.worldContainer.add([this.holeSprite]);
        
        // Create flag indicator (fixed to screen, not in world container)
        this.flagIndicator = this.add.text(0, 0, '🚩', {
            fontSize: '48px'
        });
        this.flagIndicator.setOrigin(0.5, 1);
        this.flagIndicator.setDepth(150);
        this.flagIndicator.setScrollFactor(0);
    }

    checkHoleCapture() {
        // Calculate distance from ball to hole (world coordinates)
        const distX = this.ball.worldX - this.hole.worldX;
        const distY = this.ball.worldY - this.hole.worldY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        // Check if ball is close enough to hole
        if (distance < this.hole.captureRadius) {
            // Ball enters hole!
            this.triggerWin();
        }
    }

    triggerWin() {
        if (this.gameState.hasWon) return;
        
        this.gameState.hasWon = true;
        this.ball.isMoving = false;
        this.ball.velocityX = 0;
        this.ball.velocityY = 0;
        
        const { width, height } = this.scale;
        
        // Animate ball falling into hole
        this.tweens.add({
            targets: this.ballContainer,
            scaleX: 0.3,
            scaleY: 0.3,
            alpha: 0,
            duration: 500,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                this.showWinScreen();
            }
        });
    }

    showWinScreen() {
        const { width, height } = this.scale;
        
        // Victory overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85)
            .setOrigin(0, 0)
            .setDepth(200)
            .setScrollFactor(0);
        
        // Win celebration
        const winText = this.add.text(width / 2, height * 0.40, '🎉 やった！ 🎉', {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        // Pulsing animation
        this.tweens.add({
            targets: winText,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Next level button
        const nextBtn = this.add.text(width / 2, height * 0.60, '⛳ つぎへ', {
            fontSize: '48px',
            color: '#FFFFFF',
            backgroundColor: '#4CAF50',
            padding: { x: 40, y: 20 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        nextBtn.setInteractive({ useHandCursor: true });
        nextBtn.on('pointerover', () => nextBtn.setScale(1.1));
        nextBtn.on('pointerout', () => nextBtn.setScale(1));
        nextBtn.on('pointerdown', () => {
            // Clean up win screen
            overlay.destroy();
            winText.destroy();
            nextBtn.destroy();
            
            // Restore ball container visibility
            this.ballContainer.setAlpha(1);
            this.ballContainer.setScale(1);
            
            // Generate next level
            this.generateLevel(this.gameState.level + 1);
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
            
            // Count stroke
            this.gameState.levelStrokes++;
            this.gameState.totalStrokes++;
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

        // Arrow end position (from ball screen position, in drag direction)
        const arrowLength = clampedPower;
        const arrowEndX = this.ballScreenX + Math.cos(angle) * arrowLength;
        const arrowEndY = this.ballScreenY + Math.sin(angle) * arrowLength;

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

        // Draw main line with pulsing width (from ball screen position)
        this.powerIndicator.lineStyle(this.golfConfig.indicator.lineWidth * pulse, color, alpha);
        this.powerIndicator.beginPath();
        this.powerIndicator.moveTo(this.ballScreenX, this.ballScreenY);
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

        // Draw glow circle at ball (screen position)
        this.powerIndicator.lineStyle(3 * pulse, color, alpha * 0.5);
        this.powerIndicator.strokeCircle(this.ballScreenX, this.ballScreenY, this.golfConfig.ball.radius + 5);
    }

    updateWorldPosition() {
        // Calculate offset to keep ball centered
        // World moves opposite to ball's world position
        const offsetX = -this.ball.worldX;
        const offsetY = -this.ball.worldY;
        
        // Update world container position
        this.worldContainer.x = offsetX + this.ballScreenX;
        this.worldContainer.y = offsetY + this.ballScreenY;
    }



    update(time, delta) {
        // Stop all updates if game is over or hasn't started
        if (this.gameState.isGameOver || !this.gameState.gameStarted) return;

        // Update pulse time for animation
        this.pulseTime += delta / 1000;
        
        // Update timer
        this.updateTimer(delta);

        // Update flag indicator position
        this.updateFlagIndicator();
        
        // Draw power indicator if dragging
        this.drawPowerIndicator();

        // Check hole capture
        this.checkHoleCapture();
        
        // Check maze wall collision
        this.checkMazeWallCollision();

        // Update ball physics
        if (this.ball.isMoving) {
            // Apply velocity to WORLD position
            const deltaX = this.ball.velocityX * (delta / 1000);
            const deltaY = this.ball.velocityY * (delta / 1000);
            
            this.ball.worldX += deltaX;
            this.ball.worldY += deltaY;
            
            // ===== ROLLING EFFECT: Scroll dimples texture =====
            // Texture scrolls in OPPOSITE direction of movement (like treadmill)
            // Scale factor to match ball circumference rolling
            const scrollScale = 2.0; // Adjust for realistic rolling speed
            
            this.textureOffsetX -= deltaX * scrollScale;
            this.textureOffsetY -= deltaY * scrollScale;
            
            // Apply texture offset using TileSprite's tilePosition
            this.dimpleSprite.tilePositionX = this.textureOffsetX;
            this.dimpleSprite.tilePositionY = this.textureOffsetY;

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

            // Update world container position (camera follow)
            this.updateWorldPosition();
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
