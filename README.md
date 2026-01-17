# 🎮 Minigame Collection PWA

Progressive Web App (PWA) chứa các minigame thú vị có thể chơi offline, cài đặt trên điện thoại và chạy như một ứng dụng native.

## ✨ Tính năng PWA

### ✅ Ba trụ cột của PWA

1. **Capable (Có khả năng)** - Trải nghiệm như native app
   - Chạy trong cửa sổ độc lập (standalone)
   - Có icon riêng trên màn hình chính
   - Hỗ trợ keyboard shortcuts
   - Tương tác mượt mà

2. **Reliable (Đáng tin cậy)** 
   - ⚡ Tải nhanh với Service Worker caching
   - 📡 Hoạt động offline hoàn toàn
   - 🔄 Tự động sync khi có mạng trở lại

3. **Installable (Có thể cài đặt)**
   - 📱 Cài đặt trên điện thoại như app thật
   - 💻 Cài đặt trên desktop (Windows, macOS, Linux)
   - 🚀 Khởi động nhanh từ màn hình chính

## 🎯 Tiêu chuẩn PWA được áp dụng

### ✅ Manifest File (manifest.json)
- `name` & `short_name` - Tên ứng dụng
- `icons` - Đầy đủ kích thước (72px → 512px)
- `start_url` - URL khởi động
- `display: standalone` - Hiển thị như native app
- `theme_color` & `background_color` - Màu sắc thương hiệu
- `description` - Mô tả ứng dụng
- `categories` - Phân loại (games, entertainment)

### ✅ Service Worker (sw.js)
- **Install**: Precache các assets quan trọng
- **Activate**: Xóa cache cũ tự động
- **Fetch**: Cache-first strategy cho offline
- **Background Sync**: Đồng bộ khi có mạng

### ✅ HTTPS Requirement
- Yêu cầu chạy trên HTTPS cho production
- Localhost được miễn (cho development)

### ✅ Responsive Design
- Hoạt động trên mọi kích thước màn hình
- Mobile-first approach
- Touch-friendly interface

### ✅ Offline Support
- Trang offline tùy chỉnh
- Cache games để chơi offline
- Hiển thị trạng thái online/offline

## 🎮 Games hiện có

1. **🐍 Snake Game** - Game rắn săn mồi cổ điển
   - Điều khiển bằng phím mũi tên
   - Lưu high score
   - Chơi được offline

2. **🧠 Memory Game** - Trò chơi lật thẻ trí nhớ
   - 8 cặp thẻ cần tìm
   - Đếm thời gian và số nước đi
   - Lưu best time

## 📁 Cấu trúc Project

```
pwa_base/
├── index.html              # Trang chính
├── offline.html            # Trang offline
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── css/
│   └── style.css          # Styles chính
├── js/
│   └── app.js             # App logic
├── games/
│   ├── snake.js           # Snake game
│   └── memory.js          # Memory game
├── images/
│   └── icons/             # PWA icons (cần tạo)
└── README.md              # Tài liệu này
```

## 🚀 Cài đặt và Chạy

### Development (Local)

1. **Clone hoặc download project**
   ```bash
   cd pwa_base
   ```

2. **Chạy local server** (cần HTTPS cho PWA features)
   
   Option 1 - Python:
   ```bash
   python3 -m http.server 8000
   ```
   
   Option 2 - Node.js (với http-server):
   ```bash
   npx http-server -p 8000
   ```
   
   Option 3 - PHP:
   ```bash
   php -S localhost:8000
   ```

3. **Truy cập**: http://localhost:8000

### Tạo Icons

Icons là **BẮT BUỘC** để PWA có thể cài đặt được. Bạn có 3 cách:

**Cách 1: Online Tool (Dễ nhất)**
1. Truy cập https://realfavicongenerator.net/
2. Upload logo của bạn (khuyến nghị 512x512px)
3. Generate và download icons
4. Giải nén vào thư mục `images/icons/`

**Cách 2: ImageMagick (Command line)**
```bash
# Install ImageMagick
brew install imagemagick  # macOS
# sudo apt install imagemagick  # Linux

# Tạo icons từ file SVG
bash create-icons.sh
```

**Cách 3: Design Tool**
- Figma / Sketch / Photoshop
- Tạo các kích thước: 72, 96, 128, 144, 152, 192, 384, 512px
- Export dạng PNG vào `images/icons/`

### Deploy Production

#### Netlify (Miễn phí, có HTTPS)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Vercel (Miễn phí, có HTTPS)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### GitHub Pages (Cần custom domain cho HTTPS)
```bash
# Push code lên GitHub
git init
git add .
git commit -m "Initial PWA"
git branch -M main
git remote add origin <your-repo>
git push -u origin main

# Enable GitHub Pages trong Settings
```

## 📱 Cài đặt PWA

### Trên Android (Chrome)
1. Truy cập web app
2. Tap menu (⋮) → "Install app" hoặc "Add to Home screen"
3. Confirm → Icon sẽ xuất hiện trên màn hình chính

### Trên iOS (Safari)
1. Truy cập web app
2. Tap Share button (□↑)
3. Chọn "Add to Home Screen"
4. Confirm → Icon sẽ xuất hiện trên màn hình chính

### Trên Desktop (Chrome/Edge)
1. Truy cập web app
2. Nhìn vào address bar → Click icon install (⊕)
3. Click "Install" → App sẽ mở trong cửa sổ riêng

## 🛠️ Kiểm tra PWA

### Chrome DevTools
1. Mở Chrome DevTools (F12)
2. Tab "Application" → "Manifest"
3. Kiểm tra manifest có đúng không
4. Tab "Service Workers" → Kiểm tra SW active
5. Tab "Storage" → Kiểm tra cache

### Lighthouse Audit
1. Chrome DevTools → Tab "Lighthouse"
2. Chọn "Progressive Web App"
3. Click "Generate report"
4. Kiểm tra điểm PWA (nên ≥ 90)

### PWA Checklist
- ✅ Manifest file hợp lệ
- ✅ Service Worker registered
- ✅ HTTPS (production)
- ✅ Icons đầy đủ (192px, 512px)
- ✅ Offline page
- ✅ Responsive design
- ✅ Installable

## 🎨 Thêm Game Mới

Tạo file mới trong `games/your-game.js`:

```javascript
(function() {
  const gameContent = document.getElementById('gameContent');
  
  // Render game UI
  gameContent.innerHTML = `
    <div>Your game HTML here</div>
  `;
  
  // Game logic here
})();
```

Cập nhật `js/app.js` để thêm game mới:

```javascript
const games = {
  yourgame: {
    title: '🎯 Your Game',
    file: '/games/your-game.js'
  }
};
```

Thêm card vào `index.html`:

```html
<div class="game-card" data-game="yourgame">
  <div class="game-icon">🎯</div>
  <h3>Your Game</h3>
  <p>Game description</p>
  <button class="btn-play" data-game="yourgame">Chơi ngay</button>
</div>
```

## 📚 Tài liệu tham khảo

- [Web.dev - Progressive Web Apps](https://web.dev/progressive-web-apps/)
- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [PWA Checklist](https://web.dev/articles/pwa-checklist)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🔧 Troubleshooting

### PWA không hiện install button?
- Kiểm tra HTTPS (production) hoặc localhost (dev)
- Kiểm tra manifest.json có đúng format
- Kiểm tra icons có đầy đủ 192px và 512px
- Kiểm tra Service Worker đã register thành công

### Offline không hoạt động?
- Kiểm tra Service Worker active trong DevTools
- Kiểm tra Cache Storage có files cần thiết
- Clear cache và reload lại

### Icons không hiển thị?
- Kiểm tra đường dẫn trong manifest.json
- Kiểm tra files PNG tồn tại
- Kiểm tra Content-Type: image/png

## 📝 License

MIT License - Free to use for personal and commercial projects.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new games
- Improve UI/UX
- Fix bugs
- Add features

---

**Made with ❤️ for learning PWA development**
