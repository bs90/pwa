# ⚡ Quick Start Guide

## Chạy Project trong 5 phút

### Bước 1: Chuẩn bị Icons (BẮT BUỘC)

**Cách nhanh nhất** - Dùng online tool:

1. Vào https://realfavicongenerator.net/
2. Upload logo/icon của bạn (khuyến nghị 512x512px)
3. Generate và download
4. Giải nén vào thư mục `images/icons/`

**Cần ít nhất:** `icon-192x192.png` và `icon-512x512.png`

---

### Bước 2: Chạy Local

```bash
# Navigate to project
cd /Users/tran.ba.trong/pwa_base

# Start server (chọn 1 trong các cách)
npm start                           # Nếu có npm
python3 -m http.server 8000        # Python
php -S localhost:8000              # PHP
```

Mở: http://localhost:8000

---

### Bước 3: Test PWA

1. Mở Chrome
2. F12 → Application tab → Manifest
3. Kiểm tra không có errors
4. Service Workers tab → Check active

---

### Bước 4: Deploy (1 phút)

**Netlify (Khuyến nghị):**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

---

## Tính năng chính

### ✅ Đã implement
- ✅ PWA với manifest.json đầy đủ
- ✅ Service Worker cho offline
- ✅ 2 minigames (Snake, Memory)
- ✅ Responsive design
- ✅ Install prompt
- ✅ Offline support
- ✅ Cache strategy

### 🎮 Games
1. **Snake** - Game rắn săn mồi
   - Phím mũi tên điều khiển
   - Lưu high score

2. **Memory** - Game lật thẻ
   - 8 cặp thẻ
   - Đếm thời gian & moves

---

## Cấu trúc Files

```
pwa_base/
├── index.html          ← Trang chính
├── manifest.json       ← PWA manifest
├── sw.js              ← Service Worker
├── offline.html       ← Trang offline
├── css/
│   └── style.css      ← Styles
├── js/
│   └── app.js         ← App logic
├── games/
│   ├── snake.js       ← Snake game
│   └── memory.js      ← Memory game
└── images/icons/      ← PWA icons (TẠO TRƯỚC!)
```

---

## PWA Standards Applied

### 1. Manifest
- ✅ name, short_name
- ✅ icons (192px, 512px)
- ✅ start_url
- ✅ display: standalone
- ✅ theme_color, background_color

### 2. Service Worker
- ✅ Install: precache assets
- ✅ Activate: cleanup old caches
- ✅ Fetch: cache-first strategy
- ✅ Offline support

### 3. HTTPS
- ✅ Required for production
- ✅ Localhost OK for dev

### 4. Responsive
- ✅ Mobile-first
- ✅ Touch-friendly
- ✅ All screen sizes

---

## Thêm Game Mới

### 1. Tạo file game
```javascript
// games/your-game.js
(function() {
  const gameContent = document.getElementById('gameContent');
  gameContent.innerHTML = `<div>Your game here</div>`;
  // Game logic
})();
```

### 2. Update app.js
```javascript
const games = {
  yourgame: {
    title: '🎯 Your Game',
    file: '/games/your-game.js'
  }
};
```

### 3. Add card trong index.html
```html
<div class="game-card">
  <div class="game-icon">🎯</div>
  <h3>Your Game</h3>
  <p>Description</p>
  <button class="btn-play" data-game="yourgame">Chơi</button>
</div>
```

---

## Troubleshooting

### Icon không hiện
→ Check `images/icons/` có files 192px & 512px

### Install button không có
→ Cần HTTPS (hoặc localhost) + icons đầy đủ

### Offline không work
→ Check Service Worker active trong DevTools

### Game không load
→ Check console errors, verify file paths

---

## Support

Cần giúp? Check:
- 📖 `README.md` - Hướng dẫn đầy đủ
- 📋 `PWA-STANDARDS.md` - Chi tiết tiêu chuẩn PWA
- 🚀 `DEPLOY.md` - Hướng dẫn deploy chi tiết

---

## Next Steps

1. ✅ Tạo icons
2. ✅ Test local
3. ✅ Deploy production
4. 📱 Test trên mobile
5. 🎮 Add more games!

**Happy coding!** 🚀
