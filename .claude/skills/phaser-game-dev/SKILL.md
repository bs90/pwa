---
name: phaser-game-dev
description: Expert guidance for building HTML5 games with Phaser.js framework. Use when creating games, implementing Phaser features (scenes, physics, sprites, input, audio), debugging Phaser issues, or optimizing game performance.
---

# Phaser Game Development

Expert skill for building 2D HTML5 games with Phaser.js (v3.x).

## Core Principles

### 1. Scene-Based Architecture
Phaser games use Scenes as containers for game logic:
```javascript
class GameScene extends Phaser.Scene {
    preload() { /* Load assets */ }
    create() { /* Setup game */ }
    update(time, delta) { /* Game loop */ }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: GameScene
};
const game = new Phaser.Game(config);
```

### 2. Asset Loading Strategy
**Always** load assets in `preload()`, use in `create()`:
```javascript
preload() {
    this.load.image('sprite', 'path/to/sprite.png');
    this.load.spritesheet('player', 'player.png', {
        frameWidth: 32, frameHeight: 32
    });
}
```

### 3. Game Loop Pattern
- `create()`: One-time setup
- `update(time, delta)`: Per-frame logic
- Use `delta` for frame-independent movement

## Common Patterns

### Responsive Canvas
```javascript
scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
}
```

### Sprite Management
```javascript
// Create sprite
this.player = this.add.sprite(x, y, 'key');
this.player.setScale(1.5);

// Animation
this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('player', {start: 0, end: 7}),
    frameRate: 10,
    repeat: -1
});
this.player.play('walk');
```

### Input Handling
```javascript
// Pointer/Touch
this.input.on('pointerdown', (pointer) => {
    console.log(pointer.x, pointer.y);
});

// Keyboard
this.cursors = this.input.keyboard.createCursorKeys();
if (this.cursors.left.isDown) { /* move left */ }
```

### Physics (Arcade)
```javascript
physics: {
    default: 'arcade',
    arcade: { gravity: { y: 300 }, debug: false }
}

// In scene
this.physics.add.existing(this.player);
this.player.body.setVelocityX(100);
```

### Collision Detection
```javascript
this.physics.add.collider(player, platforms);
this.physics.add.overlap(player, coins, collectCoin, null, this);
```

## Best Practices

### Performance
1. **Object Pooling**: Reuse objects instead of destroy/create
2. **Sprite Sheets**: Reduce draw calls
3. **Depth Sorting**: Use `setDepth()` instead of constant re-ordering
4. **Camera Bounds**: Set camera bounds to avoid rendering off-screen

### Code Organization
```
/game
  /scenes       - GameScene, MenuScene, etc.
  /entities     - Player, Enemy classes
  /config       - Game config
  main.js       - Entry point
```

### Mobile Optimization
```javascript
// Disable context menu
this.input.mouse.disableContextMenu();

// Touch-friendly hit areas
sprite.setInteractive();
sprite.input.hitArea.setSize(48, 48);
```

### Common Pitfalls
1. ❌ Loading assets in `create()` → Load in `preload()`
2. ❌ Hardcoded frame rates → Use `delta` for movement
3. ❌ Not disposing scenes → Use `scene.stop()` / `scene.start()`
4. ❌ Memory leaks → Destroy unused objects

## Safari/iOS Compatibility
- **NO ES Modules**: Use global `window.Phaser` with IIFE
- **Audio**: Requires user gesture to start
- **Canvas**: Use `Phaser.AUTO` to fallback to Canvas

```javascript
// Safari-safe pattern (IIFE)
(function() {
    'use strict';
    if (!window.Phaser) throw new Error('Phaser not loaded');
    
    class MyGame extends Phaser.Scene { /* ... */ }
    const game = new Phaser.Game({/* ... */});
})();
```

## Debugging
```javascript
// Enable physics debug
physics: { arcade: { debug: true } }

// FPS display
const fpsText = this.add.text(10, 10, '', {fontSize: '16px'});
update() {
    fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
}
```

## Quick Reference
- [Official Examples](https://phaser.io/examples) - 700+ code examples
- [API Docs](https://newdocs.phaser.io) - Full API reference
- [Making First Game](https://phaser.io/tutorials/making-your-first-phaser-3-game) - Official tutorial

## When to Load References
- Complex physics → Load `references/physics-guide.md`
- Multiplayer/networking → Research externally (Phaser doesn't include)
- Advanced shaders/FX → Load `references/fx-guide.md`
