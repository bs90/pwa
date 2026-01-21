# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Progressive Web App (PWA) minigame collection that runs offline. The app features a number-based driving game built with Phaser 3, with a focus on installability and offline-first functionality.

**Primary language:** Mixed (HTML/CSS/JavaScript) with Japanese UI text
**Main framework:** Phaser 3.90.0 (loaded via CDN)

## Development Commands

```bash
# Start local development server
npm start
# or
npm run dev    # Opens browser automatically

# Alternative servers if npm is unavailable
python3 -m http.server 8000
php -S localhost:8000

# Deployment commands
npm run deploy:netlify
npm run deploy:vercel

# Note: No build step needed - this is a static PWA
npm run build  # Just echoes "No build step needed"
```

## Architecture Overview

### PWA Structure

The app follows standard PWA architecture with three core components:

1. **Service Worker (sw.js)** - Handles caching and offline functionality
   - Uses versioned cache names (`CACHE_VERSION` format: `yyyymmddHHMM`)
   - Network-first strategy for game files and CDN resources
   - Cache-first strategy for static assets (HTML, CSS, JS, images)
   - Precaches essential assets on install
   - Automatically cleans up old caches on activate

2. **Web App Manifest (manifest.json)** - Defines app metadata
   - Configured for portrait orientation
   - Icons from 72x72 to 512x512 pixels
   - Standalone display mode (no browser UI)

3. **Main App (js/app.js)** - Handles app lifecycle
   - Service Worker registration and messaging
   - Install prompt management
   - Online/offline status detection
   - Game loading system with module support

### Game Architecture

Games are loaded dynamically as ES6 modules:

- **Game files location:** `games/` directory
- **Current game:** `number-game.js` - A Phaser 3 driving game with number collection mechanics
- Games are registered in `js/app.js` in the `games` object
- Each game card in `index.html` has `data-game` attribute matching the game key
- Games are loaded with cache-busting query parameter (`?t=Date.now()`)
- Previous game scripts are removed before loading new ones

### Cache Management

**Critical synchronization requirement:** The cache version must be identical in both files:
- `sw.js`: Line 3 - `const CACHE_VERSION = 'yyyymmddHHMM'`
- `js/app.js`: Line 4 - `const CACHE_VERSION = 'yyyymmddHHMM'`

When updating cached assets, increment the cache version in BOTH files to ensure proper cache invalidation.

### Phaser Game Integration

The number game (`games/number-game.js`):
- Imports Phaser from CDN: `https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js`
- Uses a single scene class: `NumberGame extends Phaser.Scene`
- Loads car image from `images/game/car.png`
- Implements error handlers for debugging load failures
- Game is injected into `#gameContent` div

## Key Files

- `index.html` - Main entry point with game selection UI
- `offline.html` - Fallback page shown when offline
- `sw.js` - Service Worker with caching logic
- `js/app.js` - Main application logic and game loader
- `games/number-game.js` - Phaser 3 driving game (1166 lines)
- `css/style.css` - All styling
- `manifest.json` - PWA manifest configuration
- `package.json` - npm scripts (no dependencies except Phaser loaded via CDN)

## Adding New Games

To add a new game to the collection:

1. Create the game file in `games/your-game.js`
   - Use ES6 module format if needed
   - Ensure game renders to `#gameContent` element
   - Add error handling for debugging

2. Register the game in `js/app.js`:
   ```javascript
   const games = {
     'your-game': {
       title: '🎮 Your Game Title',
       file: './games/your-game.js'
     }
   };
   ```

3. Add a game card in `index.html`:
   ```html
   <div class="game-card" data-game="your-game">
     <div class="game-icon">🎮</div>
     <div class="game-title">Your Game Title</div>
   </div>
   ```

4. Update Service Worker cache in `sw.js`:
   - Add the game file to `PRECACHE_ASSETS` array if it should be cached immediately
   - Increment `CACHE_VERSION` in both `sw.js` and `js/app.js`

## iOS Compatibility

The app includes iOS-specific PWA support:
- `viewport-fit=cover` for safe area handling
- `apple-mobile-web-app-capable` meta tag
- `apple-mobile-web-app-status-bar-style` set to black-translucent
- Apple touch icons configured in manifest

## Deployment Notes

- **HTTPS is required** for PWA features in production (localhost exempted for development)
- Icons must exist at `images/icons/` for app to be installable
- The app works on Netlify, Vercel, and GitHub Pages
- Use `create-icons.sh` or `create-icons-simple.sh` scripts to generate PWA icons from source images

## Testing PWA Features

Use Chrome DevTools → Application tab:
- **Manifest**: Verify manifest loads correctly, no errors
- **Service Workers**: Check SW is active and caching works
- **Storage → Cache Storage**: Inspect cached resources
- **Lighthouse**: Run PWA audit (target score ≥90)

## UI Language

The user interface uses Japanese:
- "すうじゲーム" (Number Game)
- "オンライン" / "オフライン" (Online/Offline)
- "もどる" (Back button)
- "インストール" (Install)

Keep Japanese UI text when modifying interface elements.
