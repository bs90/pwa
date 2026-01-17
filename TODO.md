# ✅ TODO LIST

## Bước 1: Tạo Icons (BẮT BUỘC!) ⚠️

PWA **KHÔNG THỂ CÀI ĐẶT** nếu thiếu icons!

### Cách 1: Online Tool (Dễ nhất - 2 phút)
1. Truy cập: https://realfavicongenerator.net/
2. Upload logo của bạn (512x512px PNG hoặc SVG)
3. Click "Generate your Favicons and HTML code"
4. Download package
5. Copy các file PNG vào `images/icons/`

**Cần có:**
- [ ] `icon-72x72.png`
- [ ] `icon-96x96.png`
- [ ] `icon-128x128.png`
- [ ] `icon-144x144.png`
- [ ] `icon-152x152.png`
- [ ] `icon-192x192.png` ← BẮT BUỘC
- [ ] `icon-384x384.png`
- [ ] `icon-512x512.png` ← BẮT BUỘC

### Cách 2: Canva (Miễn phí)
1. Vào https://canva.com
2. Tạo design 512x512px
3. Design icon của bạn
4. Download PNG
5. Resize thành các sizes cần thiết
6. Copy vào `images/icons/`

### Cách 3: Figma/Sketch/Photoshop
Nếu bạn biết dùng design tools:
1. Tạo artboard 512x512px
2. Design icon
3. Export các sizes: 72, 96, 128, 144, 152, 192, 384, 512
4. Save vào `images/icons/`

---

## Bước 2: Test Local

- [ ] Mở terminal
- [ ] Chạy: `npm start` hoặc `python3 -m http.server 8000`
- [ ] Mở: http://localhost:8000
- [ ] Test 2 games hoạt động
- [ ] Check console không có errors

---

## Bước 3: Lighthouse Audit

- [ ] Mở Chrome DevTools (F12)
- [ ] Tab "Lighthouse"
- [ ] Check "Progressive Web App"
- [ ] Click "Generate report"
- [ ] Score phải ≥ 90/100

Nếu score thấp, check:
- Icons có đủ không?
- Service Worker active chưa?
- Console có errors không?

---

## Bước 4: Deploy Production

### Option A: Netlify (Khuyến nghị)
- [ ] `npm install -g netlify-cli`
- [ ] `netlify login`
- [ ] `netlify deploy --prod`
- [ ] Copy URL

### Option B: Vercel
- [ ] `npm install -g vercel`
- [ ] `vercel --prod`
- [ ] Copy URL

### Option C: GitHub Pages
- [ ] Create GitHub repo
- [ ] `git init && git add . && git commit -m "PWA"`
- [ ] `git push origin main`
- [ ] Enable Pages in Settings

---

## Bước 5: Test PWA trên Production

### Desktop (Chrome)
- [ ] Mở URL production
- [ ] Check install button xuất hiện (address bar)
- [ ] Click install
- [ ] App mở trong cửa sổ riêng
- [ ] Test offline mode (DevTools → Network → Offline)

### Android (Chrome)
- [ ] Mở URL trên phone
- [ ] Menu (⋮) → "Install app"
- [ ] Icon xuất hiện trên home screen
- [ ] Tap icon → Opens như native app
- [ ] Tắt wifi → Test vẫn chạy được

### iOS (Safari)
- [ ] Mở URL trên iPhone
- [ ] Share button → "Add to Home Screen"
- [ ] Icon xuất hiện
- [ ] Tap icon → Opens
- [ ] Test basic functionality

---

## Bước 6: Tùy chỉnh (Optional)

### Đổi màu sắc
Mở `manifest.json`:
```json
{
  "theme_color": "#YOUR_COLOR",      // Màu thanh browser
  "background_color": "#YOUR_COLOR"  // Màu splash screen
}
```

### Đổi tên app
```json
{
  "name": "Tên App của bạn",
  "short_name": "Tên ngắn"
}
```

### Thêm game mới
1. Tạo file `games/new-game.js`
2. Update `js/app.js` → object `games`
3. Thêm card trong `index.html`

---

## Bước 7: Share & Get Feedback

- [ ] Share URL với bạn bè
- [ ] Post trên social media
- [ ] Hướng dẫn cách install
- [ ] Thu thập feedback
- [ ] Improve dựa trên feedback

---

## Future Ideas (Khi rảnh)

### Easy
- [ ] Thêm sound effects
- [ ] Thêm vibration feedback
- [ ] Dark mode toggle
- [ ] More games (Tic-tac-toe, 2048, etc.)

### Medium
- [ ] Leaderboard (local)
- [ ] Achievements system
- [ ] Stats tracking
- [ ] Game difficulty settings

### Advanced
- [ ] Online multiplayer
- [ ] Push notifications
- [ ] Background sync
- [ ] Share score API
- [ ] Cloud save (Firebase)

---

## Troubleshooting Checklist

### PWA không install được?
- [ ] Icons có trong `images/icons/`?
- [ ] Icon sizes đúng (192, 512)?
- [ ] HTTPS enabled (production)?
- [ ] Service Worker active?
- [ ] Manifest không có errors?

### Offline không work?
- [ ] Service Worker registered?
- [ ] Cache có files?
- [ ] Console có errors?

### Deploy failed?
- [ ] Check syntax errors
- [ ] Verify file paths
- [ ] Check deployment logs

---

## Checklist Summary

**Minimum để có PWA hoạt động:**
1. ✅ Icons (192, 512)
2. ✅ Deploy lên HTTPS
3. ✅ Test install

**Recommended:**
1. ✅ Test trên mobile
2. ✅ Lighthouse audit
3. ✅ Share với người khác

---

## Quick Commands Reference

```bash
# Start local
npm start

# Deploy Netlify
netlify deploy --prod

# Deploy Vercel
vercel --prod

# Git push
git add . && git commit -m "Update" && git push
```

---

**Bắt đầu từ Bước 1! Good luck!** 🚀

---

## Progress Tracking

### Hoàn thành:
- [x] ✅ Setup project structure
- [x] ✅ Create manifest.json
- [x] ✅ Create service worker
- [x] ✅ Build 2 games
- [x] ✅ Write documentation

### Cần làm:
- [ ] 🎨 Generate icons
- [ ] 🧪 Test local
- [ ] 🚀 Deploy
- [ ] 📱 Test mobile
- [ ] 🎉 Launch!
