# 🚀 Deploy Checklist

## Trước khi Deploy

### 1. Tạo Icons (BẮT BUỘC!)
- [ ] Tạo icon 192x192px
- [ ] Tạo icon 512x512px
- [ ] Tạo các sizes khác: 72, 96, 128, 144, 152, 384
- [ ] Đặt vào thư mục `images/icons/`
- [ ] Test icons hiển thị đúng

**Cách nhanh nhất:** https://realfavicongenerator.net/

### 2. Kiểm tra Manifest
- [ ] Mở `manifest.json`
- [ ] Đổi `name` và `short_name` theo ý bạn
- [ ] Đổi `description`
- [ ] Đổi `theme_color` và `background_color` nếu muốn
- [ ] Verify paths của icons đúng

### 3. Test Local
```bash
# Chạy local server
python3 -m http.server 8000
# hoặc
npx http-server -p 8000
```

- [ ] Mở http://localhost:8000
- [ ] Test cả 2 games hoạt động
- [ ] Test offline mode (DevTools → Network → Offline)
- [ ] Check console không có errors

### 4. Lighthouse Audit
- [ ] Mở Chrome DevTools (F12)
- [ ] Tab Lighthouse
- [ ] Chọn "Progressive Web App"
- [ ] Generate report
- [ ] PWA score phải ≥ 90

---

## Deploy Options

### Option 1: Netlify (Khuyến nghị - Dễ nhất)

**Ưu điểm:** 
- Miễn phí
- HTTPS tự động
- Deploy trong 1 phút
- Custom domain miễn phí

**Các bước:**

1. **Cài Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login**
```bash
netlify login
```

3. **Deploy**
```bash
cd /Users/tran.ba.trong/pwa_base
netlify deploy
```

4. **Chọn options:**
- Create & configure new site? `Yes`
- Team: Chọn team của bạn
- Site name: Đặt tên (vd: my-minigames)
- Publish directory: `.` (thư mục hiện tại)

5. **Production deploy:**
```bash
netlify deploy --prod
```

6. **Kết quả:**
- URL: https://your-site-name.netlify.app
- Test install PWA trên điện thoại!

---

### Option 2: Vercel

**Ưu điểm:**
- Miễn phí
- HTTPS tự động
- Performance tốt
- Git integration

**Các bước:**

1. **Cài Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd /Users/tran.ba.trong/pwa_base
vercel
```

3. **Follow prompts**
- Setup and deploy? `Yes`
- Which scope? Chọn account
- Link to project? `No`
- Project name: Đặt tên
- Directory: `./`
- Override settings? `No`

4. **Production:**
```bash
vercel --prod
```

---

### Option 3: GitHub Pages

**Ưu điểm:**
- Miễn phí
- Git integration
- Custom domain

**Lưu ý:** Cần custom domain hoặc subdomain cho HTTPS

**Các bước:**

1. **Init Git**
```bash
cd /Users/tran.ba.trong/pwa_base
git init
git add .
git commit -m "Initial PWA minigames"
```

2. **Create GitHub repo**
- Vào https://github.com/new
- Tạo repo mới (public)
- Copy URL

3. **Push code**
```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

4. **Enable GitHub Pages**
- Vào repo → Settings → Pages
- Source: Deploy from branch
- Branch: `main`, folder: `/ (root)`
- Save

5. **Access:**
- URL: https://username.github.io/repo-name/

---

### Option 4: Firebase Hosting

**Ưu điểm:**
- Google infrastructure
- HTTPS tự động
- Custom domain
- Analytics built-in

**Các bước:**

1. **Install Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Login**
```bash
firebase login
```

3. **Init**
```bash
cd /Users/tran.ba.trong/pwa_base
firebase init hosting
```

- Use existing project? Chọn hoặc tạo mới
- Public directory: `.`
- Single-page app? `Yes`
- Set up automatic builds? `No`

4. **Deploy**
```bash
firebase deploy
```

---

## Sau khi Deploy

### 1. Test PWA
- [ ] Mở URL production trên Chrome (desktop)
- [ ] Check install button xuất hiện
- [ ] Install app
- [ ] Test app chạy standalone
- [ ] Test offline works

### 2. Test trên Mobile
- [ ] Mở URL trên Chrome Android
- [ ] Install app
- [ ] Check icon trên home screen
- [ ] Test games hoạt động
- [ ] Test offline

### 3. Test trên iOS
- [ ] Mở URL trên Safari
- [ ] Add to Home Screen
- [ ] Check icon xuất hiện
- [ ] Test basic functionality

### 4. Share với bạn bè
- [ ] Copy URL
- [ ] Share trên social media
- [ ] Hướng dẫn cách install
- [ ] Thu thập feedback

---

## Update sau này

### Update Code

**Netlify:**
```bash
netlify deploy --prod
```

**Vercel:**
```bash
vercel --prod
```

**GitHub Pages:**
```bash
git add .
git commit -m "Update games"
git push
```

**Firebase:**
```bash
firebase deploy
```

### Update Service Worker

**QUAN TRỌNG:** Khi update code, nhớ đổi CACHE_VERSION trong `sw.js`:

```javascript
// Trong sw.js
const CACHE_VERSION = 'v2'; // Tăng version
```

Điều này đảm bảo users sẽ nhận được version mới nhất!

---

## Troubleshooting

### PWA không install được
**Nguyên nhân:**
- Chưa có icons 192px & 512px
- Manifest không đúng format
- Service Worker chưa active
- Không phải HTTPS

**Giải pháp:**
1. Check Chrome DevTools → Application → Manifest
2. Check có errors không
3. Generate icons với tool online
4. Deploy lại

### Offline không hoạt động
**Nguyên nhân:**
- Service Worker chưa cache assets
- Fetch event handler sai

**Giải pháp:**
1. Check DevTools → Application → Service Workers
2. Check Cache Storage có files
3. Test với offline mode
4. Check console logs

### Games không load
**Nguyên nhân:**
- Đường dẫn files sai
- CORS issues

**Giải pháp:**
1. Check paths trong code
2. Check browser console errors
3. Verify files deployed đúng

---

## Custom Domain (Optional)

### Netlify
1. Mua domain (Google Domains, Namecheap, etc.)
2. Netlify dashboard → Domain settings
3. Add custom domain
4. Update DNS records
5. HTTPS tự động kích hoạt

### Vercel
1. Vercel dashboard → Domains
2. Add domain
3. Update DNS records

### GitHub Pages
1. Repo Settings → Pages
2. Custom domain
3. Add CNAME record

---

## Next Steps

Sau khi deploy thành công:

1. **Analytics** (optional)
   - Add Google Analytics
   - Track user engagement
   - Monitor performance

2. **SEO**
   - Submit to Google Search Console
   - Create sitemap
   - Add meta descriptions

3. **Marketing**
   - Share on social media
   - Post on Product Hunt
   - Write blog post

4. **Improvements**
   - Add more games
   - Improve UI/UX
   - Add multiplayer
   - Add leaderboards

---

**Ready to deploy? Follow the steps above!** 🚀
