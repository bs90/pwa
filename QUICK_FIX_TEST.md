# 🔧 QUICK FIX TEST - Script Load Error

## 🐛 Issue Fixed
**Error:** `script load error: { "isTrusted": true }`

**Root Cause:** Safari không load được Phaser ESM module từ static import

**Solution:** Chuyển sang dynamic import() và load on-demand

---

## ✅ Testing Steps (5 minutes)

### 1. Clear Browser Cache
```
Safari → Settings → Clear History and Website Data
```

### 2. Open App
```
Open in Safari → Your app URL
```

### 3. Check Debug Console
Ở bottom màn hình, xem log:

**SHOULD SEE:**
```
✅ Service Worker registered
[SW] Precaching app shell
[SW] Cached: ./vendor/phaser.esm.js
...
📦 Cache Storage: X.XXmb / XXXXmb (X.X%)
```

**SHOULD NOT SEE:**
```
❌ Failed to load Phaser: ...
❌ Script load error: ...
```

### 4. Click Game (e.g., Karate)
Debug console should show:
```
⏳ Loading Phaser...
✅ Phaser loaded globally: v3.90.0
[SW] Cache hit: ./vendor/phaser.esm.js
[SW] Cache hit: ./games/karate.js
✅ Karate game loaded with Phaser v3.90.0
```

### 5. Check Game Loads
- Quiz appears ✅
- Answer question ✅
- Game starts ✅
- **NO ERRORS** ✅

---

## 🔍 What Changed

### Before (Broken):
```javascript
// games/karate.js
import * as Phaser from '../vendor/phaser.esm.js';  // ❌ Safari chokes

// Loaded immediately when game script loads
```

### After (Fixed):
```javascript
// js/app.js
async function loadGame(name) {
  await ensurePhaserLoaded();  // ✅ Dynamic import
  // Then load game...
}

// games/karate.js
const Phaser = window.Phaser;  // ✅ Use preloaded
if (!Phaser) throw new Error(...);
```

**Flow:**
1. User clicks game card
2. app.js: `await ensurePhaserLoaded()` → dynamic import
3. Phaser loads → `window.Phaser = Phaser`
4. Game script loads → uses `window.Phaser`
5. Game runs ✅

---

## 🎯 Expected Behavior

### ✅ Success Indicators:
- [ ] No "script load error" in console
- [ ] Phaser version shows in debug console
- [ ] Game loads with "⏳ Loading..." then quiz
- [ ] Both games (Karate, Number) work
- [ ] Offline mode still works (after cached)

### ❌ If Still Broken:
Check debug console for:
```
❌ Phaser not loaded! Check index.html preload.
❌ Failed to load Phaser: [error details]
```

**Possible causes:**
1. vendor/phaser.esm.js file corrupt → Re-download
2. Safari too old (iOS < 14) → ES modules not supported
3. MIME type wrong → Server config issue

---

## 🛠️ Manual Fallback (If Still Fails)

If dynamic import still fails, use script tag method:

```html
<!-- index.html -->
<script src="./vendor/phaser.min.js"></script>
<!-- Note: Use phaser.min.js (UMD) instead of phaser.esm.js -->
```

Then download UMD version:
```bash
curl -L https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js -o vendor/phaser.min.js
```

Update sw.js PRECACHE:
```javascript
'./vendor/phaser.min.js'  // instead of phaser.esm.js
```

---

## 📊 Performance Impact

### Before Fix:
- Phaser loaded immediately on page load: **~2-3s**
- Game load: instant (Phaser already loaded)

### After Fix:
- Page load: **< 0.5s** (no Phaser yet)
- Click game → Phaser loads: **~1-2s** (first time)
- Subsequent games: **instant** (Phaser cached in memory)

**Trade-off:** Slightly slower first game load, but faster initial page load.

**Offline:** Same speed (Phaser cached by Service Worker)

---

## 🎉 Success Checklist

Test cả 2 game:

### すうじゲーム (Number Game):
- [ ] Click card → "⏳ Loading..." appears
- [ ] Phaser loads → Quiz appears
- [ ] Answer quiz → Game starts
- [ ] Car drives, numbers fall
- [ ] No errors in debug console

### カラテ (Karate):
- [ ] Click card → "⏳ Loading..." appears
- [ ] Phaser loads → Quiz appears
- [ ] Answer quiz → Game starts
- [ ] Karateman animates, items fall
- [ ] No errors in debug console

### Offline Test:
- [ ] Turn OFF wifi
- [ ] Close app, reopen from Home Screen
- [ ] Click game → Loads instantly (from cache)
- [ ] Game works perfectly offline

---

## 📝 Notes

1. **First time load:** Phaser downloads ~7.5MB, may take 2-3s on slow connection
2. **Cached load:** Instant (< 0.5s) from Service Worker cache
3. **Offline:** Works same as cached load
4. **Debug console:** Always shows Phaser load status

**Cache version:** 202601250810

---

If this works → Game sẽ chạy smooth trên iPad! 🚀

If still broken → Screenshot debug console và send error message.
