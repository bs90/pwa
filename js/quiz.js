/**
 * Shared Math Quiz Module
 * Reusable quiz logic for all Phaser games
 * Provides start quiz and game over quiz with math questions
 * Requires Phaser to be available globally
 */

// Note: Phaser must be loaded before this module
// In Phaser games, Phaser is available globally via CDN or import

export class MathQuiz {
    /**
     * Show a quiz overlay on a Phaser scene
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {Object} options - Configuration options
     * @param {string} options.title - Quiz title text (e.g., 'すうじゲーム')
     * @param {string} options.instruction - Instruction text (e.g., 'はじめるには こたえてね!')
     * @param {Function} options.onCorrect - Callback when correct answer is given
     * @param {string} [options.type='start'] - Quiz type: 'start' or 'gameover'
     */
    static show(scene, options) {
        const {
            title,
            instruction,
            onCorrect,
            type = 'start'
        } = options;

        const { width, height } = scene.scale;

        // Quiz overlay
        const overlay = scene.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(300);

        // Title text
        const titleColor = type === 'start' ? '#FFD700' : '#FF5252';
        const titleText = scene.add.text(width / 2, height * 0.12, title, {
            fontSize: '56px',
            fontFamily: 'Arial',
            color: titleColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(301);

        // Instruction text
        const instructionText = scene.add.text(width / 2, height * 0.20, instruction, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(301);

        // Show first math question
        scene.currentQuestionContainer = null;
        this.showMathQuestion(scene, overlay, titleText, instructionText, onCorrect);
    }

    /**
     * Show a math question with multiple choice answers
     * @private
     */
    static showMathQuestion(scene, overlay, titleText, instructionText, onCorrect) {
        const { width, height } = scene.scale;

        // Destroy previous question container if exists
        if (scene.currentQuestionContainer) {
            scene.currentQuestionContainer.destroy(true);
            scene.currentQuestionContainer = null;
        }

        // Generate math question (addition within 100)
        const num1 = Math.floor(Math.random() * 50) + 1;
        const num2 = Math.floor(Math.random() * 50) + 1;
        const correctAnswer = num1 + num2;

        // Generate 5 wrong answers
        const wrongAnswers = [];
        const offsets = [-10, -7, -5, -3, -1, 1, 3, 5, 7, 10];

        while (wrongAnswers.length < 5) {
            const offset = offsets[Math.floor(Math.random() * offsets.length)];
            const wrongAnswer = correctAnswer + offset;

            if (wrongAnswer > 0 &&
                wrongAnswer <= 100 &&
                wrongAnswer !== correctAnswer &&
                !wrongAnswers.includes(wrongAnswer)) {
                wrongAnswers.push(wrongAnswer);
            }
        }

        // Combine and shuffle answers (Fisher-Yates shuffle)
        const allAnswers = [correctAnswer, ...wrongAnswers];
        for (let i = allAnswers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
        }

        // Container for question elements
        scene.currentQuestionContainer = scene.add.container(0, 0);
        scene.currentQuestionContainer.setDepth(301);

        // Display question in vertical format
        const questionY = height * 0.35;
        const rightX = width / 2 + 60;

        // First number (right-aligned)
        const num1Text = scene.add.text(rightX, questionY, num1.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(1, 0.5);
        scene.currentQuestionContainer.add(num1Text);

        // Plus sign
        const plusText = scene.add.text(rightX - 100, questionY + 40, '+', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        scene.currentQuestionContainer.add(plusText);

        // Second number (right-aligned)
        const num2Text = scene.add.text(rightX, questionY + 80, num2.toString(), {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(1, 0.5);
        scene.currentQuestionContainer.add(num2Text);

        // Horizontal line
        const line = scene.add.graphics();
        line.lineStyle(4, 0xffffff, 1);
        line.beginPath();
        line.moveTo(rightX - 120, questionY + 130);
        line.lineTo(rightX + 10, questionY + 130);
        line.strokePath();
        scene.currentQuestionContainer.add(line);

        // Answer buttons (6 choices in 3x2 grid)
        const buttonStartY = height * 0.58 + 50; // Moved down 50px
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
            const button = scene.add.graphics();
            button.fillStyle(0x667eea, 1);
            button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
            button.lineStyle(4, 0xffffff, 0.5);
            button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
            // Use Phaser's built-in Rectangle for hit area
            button.setInteractive(
                new Phaser.Geom.Rectangle(pos.x, pos.y, buttonWidth, buttonHeight),
                Phaser.Geom.Rectangle.Contains
            );
            scene.currentQuestionContainer.add(button);

            // Button text
            const buttonText = scene.add.text(
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
            scene.currentQuestionContainer.add(buttonText);

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
                scene.currentQuestionContainer.iterate((child) => {
                    if (child.input) {
                        child.disableInteractive();
                    }
                });

                if (isCorrect) {
                    // Correct answer!
                    button.clear();
                    button.fillStyle(0x4CAF50, 1);
                    button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                    button.lineStyle(6, 0xFFD700, 1);
                    button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);

                    // Success text
                    const successText = scene.add.text(width / 2, height * 0.50 + 50, '⭐ せいかい! ⭐', {
                        fontSize: '48px',
                        fontFamily: 'Arial',
                        color: '#4CAF50',
                        fontStyle: 'bold',
                        stroke: '#000000',
                        strokeThickness: 6
                    }).setOrigin(0.5).setDepth(301);

                    // Execute onCorrect callback after 1 second
                    scene.time.delayedCall(1000, () => {
                        // Clean up quiz elements
                        overlay.destroy();
                        titleText.destroy();
                        instructionText.destroy();
                        successText.destroy();
                        if (scene.currentQuestionContainer) {
                            scene.currentQuestionContainer.destroy(true);
                        }

                        // Call the success callback
                        onCorrect();
                    });
                } else {
                    // Wrong answer - show new question
                    button.clear();
                    button.fillStyle(0xFF5252, 1);
                    button.fillRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);
                    button.lineStyle(6, 0xFF0000, 1);
                    button.strokeRoundedRect(pos.x, pos.y, buttonWidth, buttonHeight, 20);

                    // Shake screen
                    scene.cameras.main.shake(200, 0.01);

                    // Show new question after delay
                    scene.time.delayedCall(800, () => {
                        this.showMathQuestion(scene, overlay, titleText, instructionText, onCorrect);
                    });
                }
            });
        });
    }
}
