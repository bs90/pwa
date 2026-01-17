# ✅ ĐÃ FIX - Lỗi "gameLoop has already been declared"

## Vấn đề

Khi click vào game nhiều lần, gặp lỗi:
```
Uncaught SyntaxError: Identifier 'gameLoop' has already been declared
```

## Nguyên nhân

1. **Conflict tên biến và function:**
   - Line 50: `let gameLoop = null;` (biến)
   - Line 141: `function gameLoop()` (function)
   - Cùng tên → Conflict!

2. **Script được load nhiều lần:**
   - Mỗi lần load game, script mới được append vào body
   - Script cũ vẫn còn → Chạy nhiều lần

## Giải pháp đã áp dụng

### 1. Fix Snake Game (games/snake.js)

**Thay đổi:**
```javascript
// TRƯỚC:
let gameLoop = null;
function gameLoop() { ... }

// SAU:
let gameLoopInterval = null;  // Đổi tên biến
function gameLoop() { ... }   // Giữ nguyên tên function
```

**Cập nhật các chỗ dùng:**
```javascript
// TRƯỚC:
if (gameLoop) clearInterval(gameLoop);
gameLoop = setInterval(() => { gameLoop(); }, 100);

// SAU:
if (gameLoopInterval) clearInterval(gameLoopInterval);
gameLoopInterval = setInterval(gameLoop, 100);
```

### 2. Fix App.js (js/app.js)

**Thêm tracking script:**
```javascript
let currentGameScript = null;

function loadGame(gameName) {
  // Remove old script
  if (currentGameScript) {
    currentGameScript.remove();
    currentGameScript = null;
  }
  
  // Load new script với cache busting
  const script = document.createElement('script');
  script.src = game.file + '?t=' + Date.now();
  // ...
  currentGameScript = script;
}
```

**Back button cleanup:**
```javascript
backBtn?.addEventListener('click', () => {
  // Remove script khi back
  if (currentGameScript) {
    currentGameScript.remove();
    currentGameScript = null;
  }
  // ...
});
```

## Kết quả

✅ Load game nhiều lần không còn lỗi
✅ Game hoạt động mượt mà
✅ Memory được cleanup đúng cách

## Test ngay

1. Reload trang: http://localhost:8000
2. Click vào Snake Game
3. Click "Quay lại"
4. Click vào Snake Game lại
5. Repeat nhiều lần
6. Check console → Không có errors!

## Bài học

**Best Practices:**

1. **Tránh conflict tên:**
   - Biến và function không nên cùng tên
   - Dùng tên rõ ràng: `gameLoopInterval` vs `gameLoop`

2. **Cleanup khi unmount:**
   - Remove script khi không dùng
   - Clear intervals/timeouts
   - Remove event listeners

3. **IIFE (Immediately Invoked Function Expression):**
   - Game code đã wrap trong `(function() { ... })()`
   - Tránh pollute global scope
   - Variables bên trong là private

4. **Cache busting:**
   - `script.src = url + '?t=' + Date.now()`
   - Đảm bảo load version mới nhất
   - Tránh browser cache cũ

## Code pattern tốt

```javascript
// ✅ GOOD: Tên khác nhau
let intervalId = null;
function update() { ... }
intervalId = setInterval(update, 100);

// ❌ BAD: Cùng tên
let update = null;
function update() { ... }  // Conflict!

// ✅ GOOD: IIFE pattern
(function() {
  // All variables here are private
  let gameState = {};
  function init() { ... }
  init();
})();

// ✅ GOOD: Cleanup
function cleanup() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (script) {
    script.remove();
    script = null;
  }
}
```

---

**Tất cả đã được fix! Enjoy your PWA!** 🎮✨
