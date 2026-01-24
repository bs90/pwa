# 🥋 KARATE GAME - DETAILED IMPLEMENTATION PLAN

**Created:** 2026-01-24  
**Status:** Ready for Implementation

---

## 📋 I. REQUIREMENTS SUMMARY

### ✅ Confirmed Specifications

#### **Spawn & Movement:**
- ✅ **Vị trí X:** Cố định (sẽ tune sau khi test)
- ✅ **Spawn:** Từ trên ngoài màn hình (Y < 0)
- ✅ **Quỹ đạo:** Rơi thẳng xuống (vertical only)
- ✅ **Tốc độ:** Chậm (2-3 giây để rơi qua màn hình)
- ✅ **Spawn rate:** Mỗi 2-3 giây spawn 1 vật
- ✅ **Fade out:** Khi rơi qua nhân vật → alpha giảm dần → biến mất

#### **Hit Detection:**
- ✅ **Hit zone:** 100x100px (hình chữ nhật)
- ✅ **Punch vs Kick:** Giống nhau (cùng hit zone size)
- ✅ **Timing:** Check va chạm **chỉ ở frame cuối cùng** của animation punch/kick
- ✅ **Miss penalty:** Không có (đồ vật biến mất, không ảnh hưởng gì)

#### **Items (Đồ vật):**

**Good Items (60% chance):**
- 10 loại emoji: 🪑 🎂 🍬 💎 🍎 🍕 🎁 🏀 ⚽ 🎮
- Khi hit: **+1 điểm**, bay theo parabola sang trái

**Bad Items (40% chance):**
- 2 loại: 💣 (bom) và 🪨 (đá)
- Khi hit: **-1 mạng**, nhân vật đỏ dần, camera shake, đồ vật rơi thẳng xuống

#### **Lives & Game Progression:**
- ✅ **Starting lives:** 3 mạng
- ✅ **Nhân vật tint:**
  - 0 hit: Normal (white #FFFFFF)
  - 1 hit: Hơi đỏ (#FFCCCC)
  - 2 hit: Đỏ (#FF9999)
  - 3 hit: Đỏ đậm (#FF6666) → **Game Over**

- ✅ **Difficulty increase:** Sau mỗi **10 điểm**, tỷ lệ bad items tăng 5%
  - Score 0-9: 40% bad
  - Score 10-19: 45% bad
  - Score 20-29: 50% bad
  - Score 30+: 55% bad (max)

#### **UI & Visuals:**
- ✅ **Items:** Emoji text objects (64px font size)
- ✅ **Score display:** Góc dưới bên trái
- ✅ **Lives display:** Góc dưới bên phải (hearts: ❤️❤️❤️)
- ✅ **Game Over screen:** Score + Restart button
- ✅ **Good item hit effect:** Bay parabola sang trái
- ✅ **Bad item hit effect:** Camera shake + nhân vật đỏ dần + item rơi thẳng

---

## 🏗️ II. IMPLEMENTATION PHASES

### **Phase 1: Core Game State Setup** ⏱️ 20 min

#### 1.1 Add Game State Variables
```javascript
// In create() method
this.gameState = {
    score: 0,
    lives: 3,
    hitCount: 0,           // Track số lần bị hit (0-3)
    isGameOver: false,
    difficulty: 0,         // Level tăng sau mỗi 10 điểm
    itemSpawnX: 0,         // Will calculate based on hit zone position
    isAnimating: false     // Track if punch/kick is playing
};

// Calculate item spawn X to match hit zone position
// Hit zone offset: -100/2 - 120 = -170px from player center
const frameHeight = 297 * 1.67; // frame height * scale
const hitZoneOffsetX = -this.itemConfig.hitZone / 2 - 120; // -170px
const hitZoneOffsetY = -frameHeight / 4; // -124px

// Item spawn X = player X + hit zone offset X
this.gameState.itemSpawnX = this.player.x + hitZoneOffsetX;

console.log('Item spawn X:', this.gameState.itemSpawnX);
console.log('Hit zone center:', {
    x: this.player.x + hitZoneOffsetX,
    y: this.player.y + hitZoneOffsetY
});
```

#### 1.2 Item Configuration
```javascript
this.itemConfig = {
    good: ['🎂', '💎', '🍎', '🍕', '🎁', '🏀', '⚽', '🎮'],
    bad: ['💣', '🪨'],
    baseSpawnRate: 2500,   // 2.5 seconds between spawns
    fallSpeed: 120,        // pixels/second (tune for 2-3s fall)
    hitZone: 100,          // 100x100px hit zone
    baseBadChance: 0.4,    // 40% bad items at start
    difficultyIncrease: 0.05  // +5% bad per difficulty level
};
```

#### 1.3 Items Array
```javascript
this.items = [];  // Active falling items
```

---

### **Phase 2: Item Spawning System** ⏱️ 30 min

#### 2.1 Create FallingItem Class
```javascript
class FallingItem {
    constructor(scene, x, y, emoji, type) {
        this.scene = scene;
        this.type = type;  // 'good' or 'bad'
        this.emoji = emoji;
        this.isActive = true;
        this.startY = y;
        
        // Create emoji text
        this.sprite = scene.add.text(x, y, emoji, {
            fontSize: '64px'
        }).setOrigin(0.5);
        
        this.sprite.setDepth(10);  // Above background
    }
    
    update(delta) {
        if (!this.isActive) return;
        
        // Fall down
        const fallAmount = this.scene.itemConfig.fallSpeed * (delta / 1000);
        this.sprite.y += fallAmount;
        
        // Calculate player Y position (bottom of character)
        const playerBottomY = this.scene.player.y + 150;  // Approximate
        
        // Start fading when passing player
        if (this.sprite.y > playerBottomY) {
            this.sprite.alpha -= delta / 500;  // Fade over 0.5 seconds
            
            if (this.sprite.alpha <= 0) {
                this.destroy();
            }
        }
    }
    
    // Launch item with parabola (for good items)
    launch() {
        this.isActive = false;  // Stop normal update
        
        // Parabola trajectory: up-left
        const angle = -135;  // degrees (up and to the left)
        const speed = 500;
        
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.sprite.x - 300,  // Move 300px left
            y: this.sprite.y - 200,  // Arc up 200px
            angle: 360,              // Full rotation
            alpha: 0,                // Fade out
            duration: 800,
            ease: 'Quad.easeOut',
            onComplete: () => this.destroy()
        });
    }
    
    // Drop straight down (for bad items)
    drop() {
        this.isActive = false;
        
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y + 300,  // Drop 300px
            alpha: 0,
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => this.destroy()
        });
    }
    
    destroy() {
        this.isActive = false;
        this.sprite.destroy();
        
        // Remove from scene's items array
        const index = this.scene.items.indexOf(this);
        if (index > -1) {
            this.scene.items.splice(index, 1);
        }
    }
    
    getBounds() {
        return {
            x: this.sprite.x - 32,  // Emoji width ~64px
            y: this.sprite.y - 32,
            width: 64,
            height: 64
        };
    }
}
```

#### 2.2 Spawn Timer Setup
```javascript
// In create() method, after item config
this.spawnTimer = this.time.addEvent({
    delay: this.itemConfig.baseSpawnRate,
    callback: this.spawnItem,
    callbackScope: this,
    loop: true
});
```

#### 2.3 Spawn Logic Method
```javascript
spawnItem() {
    if (this.gameState.isGameOver) return;
    
    // Calculate bad item chance based on difficulty
    const baseBad = this.itemConfig.baseBadChance;
    const increase = this.gameState.difficulty * this.itemConfig.difficultyIncrease;
    const badChance = Math.min(baseBad + increase, 0.55);  // Max 55%
    
    const isBad = Math.random() < badChance;
    
    let emoji, type;
    if (isBad) {
        emoji = Phaser.Utils.Array.GetRandom(this.itemConfig.bad);
        type = 'bad';
    } else {
        emoji = Phaser.Utils.Array.GetRandom(this.itemConfig.good);
        type = 'good';
    }
    
    // IMPORTANT: Spawn at hit zone X position so items fall through hit zone
    const item = new FallingItem(
        this,
        this.gameState.itemSpawnX,  // X matches hit zone center
        -50,  // Start above screen
        emoji,
        type
    );
    
    this.items.push(item);
}
```

#### 2.4 Update Loop for Items
```javascript
// Add update() method to KarateGame class
update(time, delta) {
    // Update all falling items
    for (let item of this.items) {
        item.update(delta);
    }
}
```

---

### **Phase 3: Hit Detection System** ⏱️ 25 min

#### 3.1 Modify Animation Complete Handler
```javascript
// Replace existing animationcomplete handler in create()
this.player.on('animationcomplete', (animation) => {
    if (animation.key === 'punch' || animation.key === 'kick') {
        // Check collision on LAST frame of animation
        this.checkItemCollision();
        
        // Return to idle
        this.player.play('idle');
        this.gameState.isAnimating = false;
    }
});
```

#### 3.2 Track Animation State
```javascript
// Modify pointerdown handler to track animation
this.input.on('pointerdown', () => {
    const currentAnim = this.player.anims.currentAnim;
    
    // Only play new animation if idle
    if (!currentAnim || currentAnim.key === 'idle') {
        const randomAction = Math.random() < 0.5 ? 'punch' : 'kick';
        this.player.play(randomAction);
        this.gameState.isAnimating = true;
    }
});
```

#### 3.3 Collision Detection Method
```javascript
checkItemCollision() {
    if (this.gameState.isGameOver) return;
    
    const hitZone = this.itemConfig.hitZone;
    
    // Define hit zone bounds (matching debug visualization)
    // Hit zone is offset from player center
    const frameHeight = 297 * 1.67;
    const hitZoneOffsetX = -hitZone / 2 - 120; // -170px
    const hitZoneOffsetY = -frameHeight / 4;    // -124px
    
    const playerBounds = {
        x: this.player.x + hitZoneOffsetX - hitZone / 2,
        y: this.player.y + hitZoneOffsetY - hitZone / 2,
        width: hitZone,
        height: hitZone
    };
    
    // Check each item
    for (let item of this.items) {
        if (!item.isActive) continue;
        
        const itemBounds = item.getBounds();
        
        // Simple rectangle intersection
        if (this.checkRectOverlap(playerBounds, itemBounds)) {
            this.handleItemHit(item);
            return;  // Only hit one item per attack
        }
    }
}

checkRectOverlap(rect1, rect2) {
    return !(
        rect1.x + rect1.width < rect2.x ||
        rect2.x + rect2.width < rect1.x ||
        rect1.y + rect1.height < rect2.y ||
        rect2.y + rect2.height < rect1.y
    );
}
```

#### 3.4 Handle Hit Method
```javascript
handleItemHit(item) {
    if (item.type === 'good') {
        // Good item: +1 score, launch item
        this.gameState.score += 1;
        this.updateScoreUI();
        
        // Launch item with parabola
        item.launch();
        
        // Check for difficulty increase every 10 points
        if (this.gameState.score % 10 === 0 && this.gameState.score > 0) {
            this.gameState.difficulty += 1;
            console.log(`Difficulty increased to level ${this.gameState.difficulty}`);
        }
        
    } else {
        // Bad item: -1 life, visual effects
        this.gameState.lives -= 1;
        this.gameState.hitCount += 1;
        
        // Update player tint (progressively redder)
        const tints = [0xFFFFFF, 0xFFCCCC, 0xFF9999, 0xFF6666];
        this.player.setTint(tints[this.gameState.hitCount]);
        
        // Camera shake
        this.cameras.main.shake(300, 0.015);
        
        // Drop item straight down
        item.drop();
        
        // Update lives UI
        this.updateLivesUI();
        
        // Check game over
        if (this.gameState.lives <= 0) {
            this.triggerGameOver();
        }
    }
}
```

---

### **Phase 4: UI System** ⏱️ 20 min

#### 4.1 Create UI Elements in create()
```javascript
// Score display (bottom-left)
this.scoreText = this.add.text(20, height - 60, 'Score: 0', {
    fontSize: '32px',
    fontFamily: 'Arial',
    color: '#FFFFFF',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 4
}).setDepth(100);

// Lives display (bottom-right)
this.livesText = this.add.text(width - 20, height - 60, '❤️❤️❤️', {
    fontSize: '32px'
}).setOrigin(1, 0).setDepth(100);
```

#### 4.2 Update UI Methods
```javascript
updateScoreUI() {
    this.scoreText.setText(`Score: ${this.gameState.score}`);
}

updateLivesUI() {
    const hearts = '❤️'.repeat(this.gameState.lives);
    this.livesText.setText(hearts);
}
```

#### 4.3 Game Over Screen
```javascript
triggerGameOver() {
    this.gameState.isGameOver = true;
    
    // Stop spawning
    this.spawnTimer.remove();
    
    // Destroy all active items
    for (let item of [...this.items]) {
        item.destroy();
    }
    
    // Darken background
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
        .setOrigin(0, 0)
        .setDepth(200);
    
    // Game Over text
    const gameOverText = this.add.text(width / 2, height / 2 - 100, 'GAME OVER', {
        fontSize: '72px',
        fontFamily: 'Arial',
        color: '#FF0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8
    }).setOrigin(0.5).setDepth(201);
    
    // Final score
    const finalScoreText = this.add.text(width / 2, height / 2, `Final Score: ${this.gameState.score}`, {
        fontSize: '48px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
    }).setOrigin(0.5).setDepth(201);
    
    // Restart button
    const restartBtn = this.add.text(width / 2, height / 2 + 100, '🔄 RESTART', {
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
```

---

### **Phase 5: Polish & Tuning** ⏱️ 15 min

#### 5.1 Tuning Variables to Adjust
```javascript
// Test and adjust these values:
this.gameState.itemSpawnX  // Where items spawn (X position)
this.itemConfig.fallSpeed   // Speed of falling
this.itemConfig.baseSpawnRate  // Time between spawns
this.itemConfig.hitZone     // Size of hit detection area
```

#### 5.2 Visual Polish
- ✅ Add subtle particle effect when hitting good items (optional)
- ✅ Add screen flash when hitting bad items (optional)
- ✅ Smooth transitions for UI elements

#### 5.3 Debug Tools (temporary)
```javascript
// Add to create() for testing hit zone visualization
const DEBUG_MODE = false;  // Set to true for debugging

if (DEBUG_MODE) {
    this.hitZoneDebug = this.add.rectangle(
        this.player.x,
        this.player.y,
        this.itemConfig.hitZone,
        this.itemConfig.hitZone,
        0x00FF00,
        0.3
    ).setDepth(50);
}

// Update hit zone position in update()
if (this.hitZoneDebug) {
    this.hitZoneDebug.setPosition(this.player.x, this.player.y);
}
```

---

## 🎯 III. TESTING CHECKLIST

### Functional Tests:
- [ ] Items spawn correctly at fixed X position
- [ ] Items fall at correct speed (2-3 seconds)
- [ ] Items fade out when passing player
- [ ] Hit detection works on last frame of punch/kick
- [ ] Good items: +1 score, launch parabola
- [ ] Bad items: -1 life, shake, drop straight
- [ ] Player tint changes correctly (white → light red → red → dark red)
- [ ] Lives display updates correctly
- [ ] Score display updates correctly
- [ ] Difficulty increases every 10 points
- [ ] Bad item spawn rate increases with difficulty
- [ ] Game over triggers at 0 lives
- [ ] Restart button works correctly

### Visual Tests:
- [ ] Items render clearly (emoji visible)
- [ ] Animations smooth (punch/kick)
- [ ] Parabola trajectory looks natural
- [ ] Camera shake feels good (not too strong)
- [ ] UI text readable (good contrast)
- [ ] Game over screen clear and centered

### Tuning Tests:
- [ ] Item spawn X position feels natural
- [ ] Hit zone size feels fair (not too easy/hard)
- [ ] Fall speed feels balanced
- [ ] Spawn rate feels comfortable
- [ ] Difficulty curve feels progressive

---

## 📝 IV. IMPLEMENTATION NOTES

### Code Structure:
```
games/karate.js
├── Imports & Class Definition
├── preload() - Load assets
├── create()
│   ├── Background setup (existing)
│   ├── Animations (existing)
│   ├── Game state initialization
│   ├── Item configuration
│   ├── Spawn timer setup
│   ├── UI creation
│   └── Input handlers
├── update(time, delta)
│   ├── Update falling items
│   └── Update debug visuals (if enabled)
├── spawnItem()
├── checkItemCollision()
├── checkRectOverlap()
├── handleItemHit()
├── updateScoreUI()
├── updateLivesUI()
└── triggerGameOver()

class FallingItem (define before KarateGame class)
├── constructor()
├── update()
├── launch()
├── drop()
├── destroy()
└── getBounds()
```

### Variables to Keep Track Of:
- `this.gameState` - Main game state object
- `this.itemConfig` - Item spawning configuration
- `this.items[]` - Array of active falling items
- `this.spawnTimer` - Phaser timer event for spawning
- `this.scoreText` - UI text for score
- `this.livesText` - UI text for lives

---

## 🚀 V. NEXT STEPS

1. **Implement Phase 1:** Core game state setup
2. **Implement Phase 2:** Item spawning system with FallingItem class
3. **Implement Phase 3:** Hit detection and collision handling
4. **Implement Phase 4:** UI system (score, lives, game over)
5. **Implement Phase 5:** Polish, tuning, and testing
6. **Test thoroughly** using the testing checklist
7. **Tune parameters** based on playtesting feel
8. **Commit final version** when everything works well

---

## ⚠️ POTENTIAL ISSUES & SOLUTIONS

### Issue 1: Items spawn too frequently
**Solution:** Increase `baseSpawnRate` value (e.g., 3000ms)

### Issue 2: Hit detection too strict/loose
**Solution:** Adjust `hitZone` size (try 80px or 120px)

### Issue 3: Items fall too fast/slow
**Solution:** Tune `fallSpeed` value until 2-3 second fall time achieved

### Issue 4: Parabola launch looks unnatural
**Solution:** Adjust tween parameters in `item.launch()` method

### Issue 5: Bad item shake too aggressive
**Solution:** Reduce shake intensity in `cameras.main.shake()` call

### Issue 6: Difficulty increases too fast
**Solution:** Reduce `difficultyIncrease` from 0.05 to 0.03

---

## 📚 REFERENCE

### Phaser 3 APIs Used:
- `this.add.text()` - Create emoji text objects
- `this.time.addEvent()` - Timer for spawning
- `this.tweens.add()` - Smooth animations for launching items
- `this.cameras.main.shake()` - Screen shake effect
- `sprite.setTint()` - Color tinting for player damage
- `sprite.setDepth()` - Z-index layering
- `this.scene.restart()` - Restart game

### Math & Physics:
- Rectangle overlap detection (AABB)
- Parabolic trajectory using tweens
- Progressive difficulty scaling
- Alpha fade calculations

---

**END OF PLAN**

Ready for implementation! 🥋✨
