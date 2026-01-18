# PWA Minigame Project Context

## Project Overview
A Progressive Web App (PWA) minigame collection for iPad, optimized for children learning Japanese.

**Repository:** https://github.com/bs90/pwa  
**Deployed URL:** https://bs90.github.io/pwa  
**Local Dev:** `python3 -m http.server 8000` → http://localhost:8000

## Target Audience
- Primary device: iPad 8 (portrait mode)
- Users: Children learning Japanese
- Language: All UI in Japanese (hiragana preferred)

## Tech Stack
- **Frontend:** Pure HTML5/CSS/JavaScript (no build tools)
- **Game Engine:** Phaser 3 (installed via npm, imported as ES modules)
- **PWA:** Service Worker + Web App Manifest
- **Deployment:** GitHub Pages (DO NOT deploy without user request)

## Project Structure
```
/Users/tran.ba.trong/pwa_base/
├── index.html              # Home screen (iPad-style app grid)
├── manifest.json           # PWA manifest (Japanese)
├── sw.js                   # Service Worker (cache v3)
├── offline.html            # Custom offline page
├── css/
│   └── style.css          # iPad-style home + fullscreen game layout
├── js/
│   └── app.js             # PWA logic, game loading, install prompt
├── games/
│   ├── number-game.js     # すうじゲーム (current game)
│   └── gestures.js        # Demo/reference game
├── images/icons/          # PWA icons (8 sizes: 72-512px)
├── package.json           # Phaser 3 dependency
└── node_modules/phaser/   # Phaser 3 game engine
```

## Current Games

### すうじゲーム (Number Game) - ACTIVE
**File:** `games/number-game.js`

**Concept:**
- Pseudo-3D endless runner perspective
- Player: Large circle (radius 70px) with number on top
- Position: Bottom 85% of screen
- Vanishing point: Top 15% (near title)

**Gameplay:**
- Touch drag controls: Touch and slide finger, player follows smoothly
- Green circles with numbers: Collect to increase player's number
- Red squares: Obstacles (collision causes camera shake)
- Objects spawn from vanishing point, grow as they approach (perspective effect)

**Technical Implementation:**
- Phaser 3 ES module import: `import * as Phaser from '../node_modules/phaser/dist/phaser.esm.js'`
- Touch controls: pointerdown → pointermove → pointerup with smooth lerp
- Perspective road: Trapezoid shape with grass sides, white edges, dashed center line
- Collision detection: Distance-based when objects reach player position

**Key Parameters:**
- Player: 70px radius, 48px font, at 85% height
- Vanishing point: 15% height
- Object spawn: Every 2 seconds, 2-second animation duration
- Lanes: 3 lanes (-150, 0, +150 from center)
- Movement smoothing: 0.15 lerp factor

## PWA Architecture

### Service Worker (sw.js)
- **Cache Strategy:** Cache-first with network fallback
- **Current Version:** v3
- **Precached Assets:**
  - App shell: index.html, offline.html, style.css, app.js
  - Games: number-game.js, gestures.js
  - Icons: icon-192x192.png, icon-512x512.png
  - Manifest: manifest.json
  - Phaser: Auto-cached on first load

**Important:** Bump `CACHE_VERSION` when adding new games or updating existing files.

### Game Loading System (js/app.js)
```javascript
const games = {
  'number-game': {
    title: '🔢 すうじゲーム',
    file: './games/number-game.js'
  }
};

// Load games as ES modules
script.type = 'module';  // CRITICAL for Phaser imports
```

### Home Screen UI
- iPad-style app grid (4 columns, responsive)
- Dark gradient background (#667eea to #764ba2)
- Game cards: Icon + Title in Japanese
- Fixed "もどる" (Back) button in game view

## Development Workflow

### Adding New Games
1. Create game file in `games/` folder
2. Import Phaser: `import * as Phaser from '../node_modules/phaser/dist/phaser.esm.js'`
3. Add game card to `index.html`:
   ```html
   <div class="game-card" data-game="game-id">
     <div class="game-icon">🎮</div>
     <div class="game-title">ゲーム名</div>
   </div>
   ```
4. Add entry to `js/app.js` games object
5. Update `sw.js`: Bump version + add to PRECACHE_ASSETS
6. Test locally before committing

### Testing
```bash
cd /Users/tran.ba.trong/pwa_base
python3 -m http.server 8000
# Open http://localhost:8000
# Test on iPad if possible
```

### Git Workflow
- **NEVER push to GitHub without user request**
- Always test locally first
- Use descriptive commit messages in English
- Mention Japanese game names in commits

## Important Constraints

### Language
- All UI text: Japanese (hiragana for children)
- Code comments: Can be Vietnamese/English
- Git commits: English

### Design
- Minimalist: No stats/reset buttons in games
- Clean interface: Back button only
- Fullscreen canvas: Games use entire viewport
- Responsive: Works on various screen sizes

### Technical
- No build tools: Pure vanilla JS
- ES6 modules: Required for Phaser imports
- Offline-first: Must work after first load
- Touch-optimized: Primary input method

## Common Issues & Solutions

### Issue: "Cannot use import statement outside a module"
**Solution:** Set `script.type = 'module'` when loading game scripts (fixed in app.js:113)

### Issue: "does not provide an export named 'default'"
**Solution:** Use namespace import for Phaser: `import * as Phaser from '...'` not `import Phaser from '...'`

### Issue: Game doesn't update after changes
**Solution:** Hard refresh (Cmd+Shift+R) to clear Service Worker cache

### Issue: Service Worker not updating
**Solution:** Bump `CACHE_VERSION` in sw.js (e.g., v3 → v4)

## Phaser 3 Integration

### Installation
```bash
npm install phaser
```

### Import in Games
```javascript
import * as Phaser from '../node_modules/phaser/dist/phaser.esm.js';

class MyGame extends Phaser.Scene {
  constructor() {
    super({ key: 'MyGame' });
  }
  
  create() {
    // Game setup
  }
  
  update() {
    // Game loop
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'gameContent',
  width: window.innerWidth,
  height: window.innerHeight,
  scene: MyGame,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
```

### Touch Controls Pattern
```javascript
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

// In update()
const smoothing = 0.15;
const newX = Phaser.Math.Linear(this.player.x, this.targetX, smoothing);
this.player.x = newX;
```

### Perspective Effect Pattern
```javascript
// Vanishing point
const vanishY = height * 0.15;

// Spawn objects from horizon
const startY = vanishY;
const endY = height * 0.85;
const startScale = 0.1;
const endScale = 1.0;

this.tweens.add({
  targets: obj,
  y: endY,
  scale: endScale,
  duration: 2000,
  ease: 'Cubic.easeIn'  // Accelerates toward player
});
```

## Next Development Steps (Ideas)

### Game Mechanics (Not Yet Decided)
- Win/lose conditions?
- Score system?
- Level progression?
- Time limit?
- Lives system?
- Special number combinations?
- Power-ups?

### Polish (Future)
- Sound effects
- Particle effects
- Tutorial/instructions screen
- More visual feedback

### New Games
- Other minigames using similar perspective
- Different gameplay mechanics
- Reuse common patterns (touch controls, perspective)

## Key Files Reference

### index.html:42-48
Game card structure:
```html
<div class="game-card" data-game="number-game">
  <div class="game-icon">🔢</div>
  <div class="game-title">すうじゲーム</div>
</div>
```

### js/app.js:86-91
Games registry:
```javascript
const games = {
  'number-game': {
    title: '🔢 すうじゲーム',
    file: './games/number-game.js'
  }
};
```

### js/app.js:113
ES module loading:
```javascript
script.type = 'module'; // Enable ES6 modules
```

### sw.js:3
Cache version:
```javascript
const CACHE_VERSION = 'v3';
```

### games/number-game.js:8
Phaser import:
```javascript
import * as Phaser from '../node_modules/phaser/dist/phaser.esm.js';
```

## User Preferences
- Test locally first, don't auto-deploy
- Use Japanese for all user-facing text
- Keep interface minimal and clean
- Prioritize touch controls over keyboard
- iPad portrait orientation is primary
