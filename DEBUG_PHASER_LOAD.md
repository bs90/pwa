# 🐛 DEBUG: Phaser Load Issue

## ✅ FIXED - Path Error

### Bug
```
❌ Failed to load Phaser: [error]
```

### Root Cause
**Wrong import path** in `js/app.js`:

```javascript
// ❌ WRONG (app.js is in js/ folder!)
import('./vendor/phaser.esm.js')

// ✅ CORRECT
import('../vendor/phaser.esm.js')
```

**File structure:**
```
pwa_base/
├── js/
│   └── app.js          ← Script is HERE
├── vendor/
│   └── phaser.esm.js   ← Need to go UP one level first
```

### Fixed in commit: `b3e6855`

---

## 🧪 Test Again

### 1. Hard Refresh
- iPad Safari: Settings → Clear History and Data
- Or: Hold Shift + Reload

### 2. Open App
Debug console should show:
```
✅ Service Worker registered
[SW] Cached: ./vendor/phaser.esm.js
📦 Cache Storage: X.XXmb / XXXXmb
```

### 3. Click Game (e.g., Karate)
Console should now show:
```
⏳ Loading Phaser...
✅ Phaser loaded globally
✅ Phaser.Game: function
✅ Phaser.Scene: function
✅ Karate game loaded with Phaser v3.90.0
```

### 4. Game Should Work
- Quiz appears ✅
- Game plays ✅
- **NO "Failed to load Phaser" error** ✅

---

## 🔍 If Still Fails

Check debug console for specific error:

### Error: "Failed to fetch"
```
❌ Failed to load Phaser: TypeError: Failed to fetch
```

**Cause:** File not found or network issue

**Fix:**
1. Check file exists: `vendor/phaser.esm.js` (7.5MB)
2. Check Service Worker cached it:
   ```
   [SW] Cached: ./vendor/phaser.esm.js
   ```
3. If not cached, online required for first load

### Error: "MIME type"
```
❌ Failed to load Phaser: MIME type 'text/plain' is not a valid...
```

**Cause:** Server serving wrong MIME type

**Fix:** Add to server config:
```
# .htaccess (Apache)
AddType application/javascript .js

# nginx
types {
    application/javascript js;
}
```

### Error: "Cannot use import outside a module"
```
❌ SyntaxError: Cannot use import statement outside a module
```

**Cause:** File not ES module

**Fix:** Check file starts with webpack exports (it does)

---

## 📊 Expected Load Flow

```
User clicks game
    ↓
app.js: ensurePhaserLoaded()
    ↓
Dynamic import('../vendor/phaser.esm.js')
    ↓
Check cache first (Service Worker)
    ↓
If cached: instant load (< 0.5s)
If not: download from server (2-3s)
    ↓
window.Phaser = Phaser module
    ↓
phaserLoaded = true
    ↓
Load game script (games/karate.js)
    ↓
Game uses window.Phaser
    ↓
Game runs ✅
```

---

## 🎯 Quick Verification

Run these checks in debug console (or see logs):

### Check 1: File cached?
Look for in console:
```
[SW] Cached: ./vendor/phaser.esm.js
```
✅ If yes → File available offline

### Check 2: Phaser loaded?
After clicking game, check:
```javascript
typeof window.Phaser        // Should be: "object"
typeof window.Phaser.Game   // Should be: "function"
```

### Check 3: Path correct?
In browser DevTools (if available):
- Network tab
- Filter: "phaser"
- Should see: `vendor/phaser.esm.js` (status 200 or cached)
- Should NOT see: 404 error

---

## 💡 Prevention Tips

### Always check paths!
When importing from nested folders:

```javascript
// If file is at: js/app.js
import('../vendor/file.js')   // ✅ Go up one level
import('./vendor/file.js')    // ❌ Wrong - looks in js/vendor/

// If file is at: games/karate.js
import('../vendor/file.js')   // ✅ Go up one level
import('./vendor/file.js')    // ❌ Wrong - looks in games/vendor/
```

### Use absolute paths (from root):
Not recommended for dynamic imports but for reference:
```javascript
import('/vendor/phaser.esm.js')  // From site root
```

---

## ✅ Success Criteria

All must show in debug console:

- [ ] `✅ Service Worker registered`
- [ ] `[SW] Cached: ./vendor/phaser.esm.js`
- [ ] `⏳ Loading Phaser...` (when click game)
- [ ] `✅ Phaser loaded globally`
- [ ] `✅ Phaser.Game: function`
- [ ] `✅ Phaser.Scene: function`
- [ ] `✅ [Game name] loaded with Phaser v3.90.0`
- [ ] Game plays without errors

---

## 🚀 Deploy & Test

Latest version pushed: **b3e6855**
Cache version: **202601250815**

1. Deploy/reload app
2. Clear Safari data
3. Open app
4. Click game
5. Should work! 🎉

If not → Screenshot debug console and check error message.
