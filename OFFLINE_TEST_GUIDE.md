# 📱 OFFLINE PWA TESTING GUIDE - iPad 8 (9.7")

## 🎯 MỤC ĐÍCH
Kiểm tra PWA chạy **100% offline** trên iPad sau khi cài đặt, không cần internet.

---

## 📋 CHECKLIST TESTING

### ✅ PHASE 1: FIRST INSTALL (CẦN INTERNET)

#### Step 1: Clear Safari Data
1. Mở **Settings** → **Safari**
2. Chọn **Clear History and Website Data**
3. Confirm **Clear History and Data**
4. ✅ Đảm bảo không có cache cũ

#### Step 2: Connect WiFi & Open App
1. Bật **WiFi**
2. Mở **Safari** trên iPad
3. Vào URL của app (localhost hoặc deployed URL)
4. ✅ Trang load thành công

#### Step 3: Check Debug Console
Ở dưới màn hình sẽ có **Debug Console** màu xanh lá:

Kiểm tra thông tin:
```
=== SYSTEM INFO ===
User Agent: ... iPad ...
Platform: MacIntel
Online: true
Standalone: false
Screen: 768x1024 (hoặc 1024x768)
Service Worker: Supported
iOS Device: YES
iOS Version: 15.x (hoặc 16.x)
==================
```

✅ Xác nhận:
- iOS Device: YES
- Service Worker: Supported
- Screen: 768x1024 (portrait)

#### Step 4: Wait for Caching
Trong debug console, bạn sẽ thấy log:

```
✅ Service Worker registered
[Service Worker] Install
[Service Worker] Precaching app shell
[Service Worker] Cached new resource: ./vendor/phaser.esm.js
[Service Worker] Cached new resource: ./games/karate.js
[Service Worker] Cached new resource: ./games/number-game.js
...
```

⏱️ **Đợi khoảng 5-10 giây** để cache hoàn tất.

✅ Kiểm tra cache size trong debug console footer:
```
Cache: 8.45MB / 2048MB (0.4%)
```

**Note:** Nếu cache > 40MB, console sẽ cảnh báo màu đỏ.

#### Step 5: Check iOS Install Banner
Sau 2 giây, sẽ xuất hiện banner màu xanh dương:

```
📱 iOSにインストール
1️⃣ Safariの共有ボタン [↑] をタップ
2️⃣ 「ホーム画面に追加」を選択
3️⃣ オフラインでもあそべるよ! 🎮
```

✅ Banner hiển thị đúng

#### Step 6: Add to Home Screen
1. Tap nút **Share** (↑) trong Safari toolbar
2. Scroll down, tìm **"Add to Home Screen"**
3. Tap **"Add to Home Screen"**
4. Đặt tên (default: "ミニゲーム - PWA")
5. Tap **Add**

✅ Icon xuất hiện trên Home Screen

---

### ✅ PHASE 2: OFFLINE TESTING (KHÔNG CẦN INTERNET)

#### Step 1: Close All Apps
1. Swipe up từ bottom để xem **App Switcher**
2. **Swipe up** Safari để đóng hoàn toàn
3. ✅ Safari không còn trong background

#### Step 2: Turn OFF Internet
**Option A: Airplane Mode**
1. Mở **Control Center** (swipe down từ góc trên bên phải)
2. Tap **Airplane icon** ✈️
3. ✅ Airplane mode ON

**Option B: WiFi + Cellular OFF**
1. Settings → WiFi → OFF
2. Settings → Cellular → OFF
3. ✅ Cả WiFi và Cellular đều OFF

#### Step 3: Open App from Home Screen
1. Tìm icon **"ミニゲーム"** trên Home Screen
2. **Tap** icon để mở app
3. ⏱️ App sẽ mở **INSTANTLY** (< 1 giây)

✅ Kiểm tra:
- App mở không có Safari toolbar (standalone mode)
- Status bar ở top (thời gian, pin, wifi) vẫn hiển thị
- Debug console ở bottom màu xanh lá

#### Step 4: Check Debug Console (Offline)
Debug console sẽ hiển thị:

```
=== SYSTEM INFO ===
Online: false          ← QUAN TRỌNG: phải false!
Standalone: true       ← QUAN TRỌNG: phải true!
iOS Device: YES
...
```

✅ Xác nhận:
- **Online: false** (đang offline)
- **Standalone: true** (chạy như native app)

Console logs sẽ có:
```
[SW] Cache hit: ./
[SW] Cache hit: ./index.html
[SW] Cache hit: ./css/style.css
[SW] Cache hit: ./js/debug.js
[SW] Cache hit: ./js/app.js
...
```

✅ Tất cả files load từ cache (không có network request)

---

### ✅ PHASE 3: GAME TESTING (OFFLINE)

#### Test 1: すうじゲーム (Number Game)
1. Tap card **"すうじゲーム"** (với car icon)
2. ⏱️ Game load ngay lập tức

Debug console sẽ log:
```
[SW] Cache hit: ./games/number-game.js
[SW] Cache hit: ./vendor/phaser.esm.js
[SW] Cache hit: ./images/game/car.png
✅ Number game loaded with local Phaser
```

3. **Quiz** sẽ xuất hiện:
   - Câu hỏi toán (ví dụ: 23 + 45 = ?)
   - 6 nút trả lời
4. Chọn đáp án đúng → "⭐ せいかい! ⭐"
5. Game bắt đầu:
   - Xe chạy
   - Numbers xuất hiện
   - Điểm tăng/giảm

✅ Game chạy **HOÀN TOÀN MƯỢT**, không lag, không lỗi

6. Tap nút **"← もどる"** để về home

#### Test 2: カラテ (Karate Game)
1. Tap card **"カラテ"** (với 🥋 icon)
2. ⏱️ Game load ngay lập tức

Debug console sẽ log:
```
[SW] Cache hit: ./games/karate.js
[SW] Cache hit: ./vendor/phaser.esm.js
[SW] Cache hit: ./images/game/karateman.png
✅ Karate game loaded with local Phaser
```

3. **Quiz** xuất hiện (tương tự number game)
4. Sau quiz, game bắt đầu:
   - Karateman đứng yên (idle animation)
   - Items rơi xuống (🎂 📺️ 💎 🍎 🍕 💣 🪨)
   - Tap màn hình → Karateman punch/kick

✅ Game chạy mượt, tất cả animations hoạt động

5. Chơi đến **Game Over**:
   - Đánh nhầm 3 items xấu (💣 🪨)
   - Game Over screen hiển thị
   - Tap **"🔄 もう一度"** để chơi lại
   - Quiz xuất hiện lại

✅ Game Over flow hoạt động đúng

6. Tap **"← もどる"** để về home

---

### ✅ PHASE 4: CACHE PERSISTENCE TESTING

#### Test 1: Close App (Force Quit)
1. Swipe up từ bottom → App Switcher
2. Swipe up app để **force quit**
3. Đợi 5 giây
4. Mở lại app từ Home Screen

✅ App vẫn load instant, không cần internet

#### Test 2: Restart iPad
1. Power OFF iPad (hold Power + Volume)
2. Slide to Power Off
3. Đợi iPad tắt hoàn toàn
4. Power ON iPad
5. Unlock, vào Home Screen
6. Mở app (vẫn **OFFLINE MODE**)

✅ App vẫn chạy bình thường sau restart

#### Test 3: Wait 24 Hours
1. Giữ iPad offline
2. Đợi 24 giờ
3. Mở app lại

✅ Cache không bị xóa, app vẫn hoạt động

**Note iOS Cache Eviction:**
- iPadOS sẽ **KHÔNG** xóa cache nếu:
  - App được add to Home Screen
  - Còn đủ storage (cache < 50MB)
  - User chưa Clear Safari Data

---

### ✅ PHASE 5: UPDATE TESTING (CẦN INTERNET)

#### Scenario: Developer Deploy New Version
1. Turn ON internet (WiFi)
2. Mở app từ Home Screen
3. Service Worker sẽ tự động check update

Debug console sẽ log:
```
[Service Worker] Install
[Service Worker] New version available
[Service Worker] Activate
✅ アプリが更新されました
```

4. App sẽ tự động reload với version mới
5. Turn OFF internet
6. Test lại games offline

✅ Update flow hoạt động, cache mới replace cache cũ

---

## 🐛 DEBUG CONSOLE CONTROLS

### Buttons:
- **_** (Minimize): Thu nhỏ console, chỉ hiện header
- **Clear**: Xóa tất cả logs
- **Hide**: Ẩn console hoàn toàn (tap lại để show)

### Footer Info:
- **X logs**: Số lượng logs hiện tại (max 50)
- **Cache: X.XXmb / XXXXmb (X.X%)**: Cache usage real-time

### Console Colors:
- 🔵 **Blue (info)**: Normal logs
- 🟢 **Green (success)**: ✅ Success messages
- 🟡 **Yellow (warn)**: ⚠️ Warnings
- 🔴 **Red (error)**: ❌ Errors (bold)

---

## ❌ TROUBLESHOOTING

### Issue 1: Service Worker không register
**Triệu chứng:**
```
❌ Service Worker registration failed: ...
```

**Giải pháp:**
1. Check URL phải là **https://** (không phải http://)
2. Hoặc dùng **localhost** (được exempt)
3. Clear Safari data và thử lại

---

### Issue 2: Game load lỗi "Script failed to load"
**Triệu chứng:**
```
⚠️ Không thể tải game
Game file: ./games/karate.js
Error: Script failed to load
```

**Giải pháp:**
1. Check console: có thể **CORS error**
2. Đảm bảo file exists: `/games/karate.js`
3. Force refresh: Settings → Safari → Clear Data

---

### Issue 3: Phaser import error
**Triệu chứng:**
```
❌ ERROR: Failed to resolve module specifier '../vendor/phaser.esm.js'
```

**Giải pháp:**
1. Check file exists: `vendor/phaser.esm.js` (7.5MB)
2. Clear cache và reload
3. Check Service Worker cached Phaser:
   ```
   [SW] Cached: ./vendor/phaser.esm.js
   ```

---

### Issue 4: Cache size quá lớn (> 50MB)
**Triệu chứng:**
```
⚠️ Cache approaching iOS limit! (52.34MB / 50MB)
```

**Giải pháp:**
1. iPadOS limit: ~50MB per domain
2. Current cache: ~8-10MB (OK!)
3. Nếu vượt quá:
   - Remove unused assets
   - Optimize images (compress)
   - Don't cache unnecessary files

---

### Issue 5: iOS không show "Add to Home Screen"
**Triệu chứng:**
- Share menu không có option "Add to Home Screen"

**Giải pháp:**
1. **Phải dùng Safari** (không phải Chrome/Firefox)
2. Check manifest.json có icon đủ sizes
3. Check console:
   ```
   [SW] Cached: ./images/icons/icon-192x192.png
   [SW] Cached: ./manifest.json
   ```
4. Reload page và thử lại

---

## 📊 EXPECTED RESULTS

### Performance Metrics:

| Metric | First Load (Online) | Subsequent (Online) | Offline |
|--------|---------------------|---------------------|---------|
| App Shell | ~1-2s | < 0.5s | < 0.5s |
| Phaser Load | ~2-3s | < 0.5s | < 0.5s |
| Game Start | ~1s | < 0.5s | < 0.5s |
| **Total** | **~4-6s** | **< 1.5s** | **< 1.5s** |

### Cache Size:
- **Precache (install)**: ~8-10MB
  - Phaser: ~7.5MB
  - Games: ~0.5MB
  - Assets: ~0.2MB
  - Icons: ~0.8MB

- **Total after gameplay**: ~10-12MB
  - Includes runtime cached resources

✅ **Well under iOS 50MB limit**

---

## ✅ SUCCESS CRITERIA

All must PASS:

### Critical (P0):
- [ ] Service Worker registers successfully
- [ ] All PRECACHE_ASSETS cached (check console logs)
- [ ] App works 100% offline after first install
- [ ] Both games load and play smoothly offline
- [ ] Debug console shows all logs correctly
- [ ] iOS install instructions appear on first visit
- [ ] Add to Home Screen works (icon on home screen)
- [ ] Standalone mode works (no Safari UI)

### Important (P1):
- [ ] Cache size < 15MB
- [ ] App load < 2s offline
- [ ] Game load < 1s offline
- [ ] No errors in debug console
- [ ] Quiz works in both games
- [ ] Game Over → Restart works
- [ ] Back button works

### Nice to Have (P2):
- [ ] Cache persists after 24 hours
- [ ] Cache persists after iPad restart
- [ ] Update mechanism works (online)
- [ ] Debug console minimize/hide works
- [ ] Cache size monitor updates real-time

---

## 📝 REPORTING ISSUES

Nếu có lỗi, screenshot **Debug Console** và gửi kèm:

1. **System Info** (từ console):
   - iOS Version
   - Screen size
   - Standalone mode
   - Online status

2. **Error Logs** (từ console):
   - Full error message
   - Stack trace nếu có

3. **Reproduction Steps**:
   - Làm gì trước khi lỗi xảy ra
   - Lỗi xảy ra khi nào (first load, offline, game play?)

4. **Cache Info**:
   - Cache size (từ console footer)
   - Files cached (check console logs)

---

## 🎉 COMPLETION

Nếu tất cả checklist PASS:

```
🎊 CONGRATULATIONS! 🎊

PWA của bạn đã 100% OFFLINE-CAPABLE!

✅ Chạy mượt trên iPad 8 (9.7")
✅ Không cần internet sau install
✅ Games hoạt động hoàn hảo
✅ Cache < 50MB iOS limit
✅ Standalone mode như native app

Ready for production! 🚀
```

---

**Version:** 202601250758  
**Tested on:** iPad 8 (9.7") - iPadOS 15.x / 16.x  
**Last updated:** 2026-01-25
