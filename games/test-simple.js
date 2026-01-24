/**
 * Simple Test Game - NO ES6, NO classes, NO modules
 * Pure ES5 JavaScript for maximum Safari compatibility
 */

console.log('=== TEST GAME STARTING ===');
console.log('window.Phaser:', typeof window.Phaser);
console.log('window.MathQuiz:', typeof window.MathQuiz);

// Check Phaser
if (!window.Phaser) {
    alert('ERROR: Phaser not loaded!');
    throw new Error('Phaser required');
}

// Check MathQuiz
if (!window.MathQuiz) {
    alert('ERROR: MathQuiz not loaded!');
    throw new Error('MathQuiz required');
}

console.log('✅ All dependencies loaded');

// Simple Phaser game config (ES5 style)
var config = {
    type: Phaser.AUTO,
    parent: 'gameContent',
    width: 768,
    height: 1024,
    backgroundColor: '#2196F3',
    scene: {
        create: function() {
            console.log('✅ Phaser scene created!');
            
            var text = this.add.text(384, 512, 'TEST GAME WORKS!', {
                fontSize: '48px',
                color: '#ffffff',
                fontFamily: 'Arial'
            });
            text.setOrigin(0.5);
            
            console.log('✅ Text created');
            
            // Show success message
            alert('✅ SUCCESS! Game loaded and Phaser works!\n\nIf you see this, the issue is in the complex game code, not the loading mechanism.');
        }
    }
};

console.log('Creating Phaser game...');
var game = new Phaser.Game(config);
console.log('✅ Phaser game created');
