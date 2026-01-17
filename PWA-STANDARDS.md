# 📋 PWA Standards & Checklist

## Tiêu chuẩn bắt buộc để trở thành PWA

### 1. HTTPS (Secure Connection) ✅
- **Yêu cầu**: App phải chạy trên HTTPS (production)
- **Ngoại lệ**: Localhost được miễn trong development
- **Lý do**: Bảo mật dữ liệu người dùng, yêu cầu cho Service Worker

### 2. Web App Manifest ✅
File `manifest.json` phải có các trường bắt buộc:

#### Bắt buộc (Required)
```json
{
  "name": "Tên đầy đủ của app",
  "short_name": "Tên ngắn (≤12 ký tự)",
  "start_url": "/",
  "display": "standalone",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Khuyến nghị (Recommended)
```json
{
  "description": "Mô tả app",
  "background_color": "#ffffff",
  "theme_color": "#2196F3",
  "orientation": "portrait",
  "categories": ["games", "entertainment"],
  "screenshots": [...],
  "prefer_related_applications": false
}
```

### 3. Service Worker ✅
File `sw.js` phải implement:

#### Install Event
```javascript
self.addEventListener('install', (event) => {
  // Precache app shell
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
  );
});
```

#### Activate Event
```javascript
self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      ))
  );
});
```

#### Fetch Event
```javascript
self.addEventListener('fetch', (event) => {
  // Cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### 4. Icons ✅
**Kích thước bắt buộc:**
- 192x192px (minimum)
- 512x512px (recommended)

**Kích thước khuyến nghị thêm:**
- 72x72, 96x96, 128x128, 144x144, 152x152, 384x384

**Format:** PNG với transparent background

### 5. User Engagement ✅
- User phải tương tác ít nhất 30 giây
- User phải click/tap ít nhất 1 lần
- Chỉ áp dụng trên Chrome/Edge

---

## Ba trụ cột của PWA (Core Principles)

### 1. Capable (Có khả năng)
✅ **App-like experience:**
- Chạy trong standalone window
- Không hiển thị browser UI
- Có app icon riêng
- Keyboard shortcuts
- OS integration

✅ **Modern APIs:**
- Geolocation
- Camera/Microphone
- Push Notifications
- Background Sync
- File System Access

### 2. Reliable (Đáng tin cậy)
✅ **Fast loading:**
- First Contentful Paint < 3s
- Time to Interactive < 5s
- Core Web Vitals đạt chuẩn

✅ **Offline support:**
- Service Worker caching
- Offline page
- Sync khi có mạng

✅ **Always accessible:**
- Không có blank page
- Graceful degradation

### 3. Installable (Có thể cài đặt)
✅ **Install criteria met:**
- Manifest hợp lệ
- Service Worker active
- HTTPS
- User engagement đủ

✅ **Platform integration:**
- Home screen icon
- App switcher
- Splash screen
- Share target

---

## PWA Checklist (Chi tiết)

### Core (Bắt buộc)

#### ✅ Starts fast, stays fast
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 5s
- [ ] Lighthouse Performance score ≥ 90

#### ✅ Works in any browser
- [ ] Progressive enhancement
- [ ] Feature detection
- [ ] Fallbacks cho browsers cũ

#### ✅ Responsive to any screen size
- [ ] Mobile-first design
- [ ] Flexible layouts
- [ ] Touch-friendly (44x44px minimum)

#### ✅ Provides a custom offline page
- [ ] `offline.html` exists
- [ ] Service Worker serves offline page
- [ ] Thông báo rõ ràng cho user

#### ✅ Is installable
- [ ] Manifest với đầy đủ fields
- [ ] Icons 192px & 512px
- [ ] Service Worker registered
- [ ] HTTPS enabled
- [ ] Install prompt handled

### Optimal (Nâng cao)

#### ✅ Provides an offline experience
- [ ] Core content cache
- [ ] IndexedDB cho data
- [ ] Background Sync
- [ ] Queue failed requests

#### ✅ Fully accessible
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast ≥ 4.5:1

#### ✅ Discoverable in search
- [ ] Semantic HTML
- [ ] Meta tags đầy đủ
- [ ] Sitemap.xml
- [ ] Structured data

#### ✅ Works with any input type
- [ ] Mouse support
- [ ] Touch support
- [ ] Keyboard support
- [ ] Stylus support (nếu có)

#### ✅ Provides context for permission requests
- [ ] Explain why cần permission
- [ ] Ask at right time
- [ ] Handle rejection gracefully

#### ✅ Follows best practices for healthy code
- [ ] No console errors
- [ ] HTTPS
- [ ] No deprecated APIs
- [ ] Secure dependencies

---

## Testing Checklist

### Chrome DevTools
```
1. Application tab → Manifest
   ✓ All fields correct
   ✓ Icons load properly

2. Application tab → Service Workers
   ✓ SW registered & active
   ✓ Update on reload works

3. Application tab → Cache Storage
   ✓ Assets cached
   ✓ Old caches deleted

4. Network tab → Offline mode
   ✓ App works offline
   ✓ Offline page shows
```

### Lighthouse Audit
```
Run: Chrome DevTools → Lighthouse → PWA

Target scores:
✓ PWA: 100/100
✓ Performance: ≥90/100
✓ Accessibility: ≥90/100
✓ Best Practices: 100/100
✓ SEO: ≥90/100
```

### Manual Testing
```
Android:
✓ Install from Chrome
✓ Icon on home screen
✓ Opens in standalone
✓ Works offline

iOS:
✓ Add to Home Screen
✓ Icon appears
✓ Opens in browser (Safari)
✓ Basic offline works

Desktop:
✓ Install from Chrome/Edge
✓ Opens in app window
✓ Appears in app list
✓ Works offline
```

---

## Common Issues & Solutions

### Issue: Install prompt không hiện
**Giải pháp:**
1. Kiểm tra HTTPS
2. Verify manifest có icons 192px & 512px
3. Service Worker phải active
4. User engagement đủ 30s

### Issue: Offline không hoạt động
**Giải pháp:**
1. Check Service Worker active
2. Verify fetch event handler
3. Check cache strategy
4. Test với Chrome DevTools offline mode

### Issue: Icons không hiển thị
**Giải pháp:**
1. Check file paths trong manifest
2. Verify PNG files tồn tại
3. Check sizes correct (192, 512)
4. Clear cache và reinstall

### Issue: Service Worker không update
**Giải pháp:**
1. Change CACHE_VERSION
2. Use `self.skipWaiting()`
3. Use `clients.claim()`
4. Hard refresh browser

---

## Performance Best Practices

### Caching Strategies

#### Cache First (cho static assets)
```javascript
// Good for: CSS, JS, images, fonts
caches.match(request) || fetch(request)
```

#### Network First (cho dynamic content)
```javascript
// Good for: API calls, user data
fetch(request).catch(() => caches.match(request))
```

#### Stale While Revalidate
```javascript
// Good for: Content that updates frequently
caches.match(request).then(response => {
  const fetchPromise = fetch(request).then(networkResponse => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });
  return response || fetchPromise;
});
```

### Code Splitting
- Load critical CSS inline
- Defer non-critical JavaScript
- Lazy load images
- Preload key resources

### Optimization
- Minify CSS/JS
- Compress images (WebP)
- Use CDN
- Enable gzip/brotli

---

## Resources & Tools

### Documentation
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [W3C Web App Manifest](https://www.w3.org/TR/appmanifest/)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA audit
- [Workbox](https://developers.google.com/web/tools/workbox) - SW library
- [PWA Builder](https://www.pwabuilder.com/) - Generate PWA assets
- [Real Favicon Generator](https://realfavicongenerator.net/) - Generate icons

### Testing
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Webhint](https://webhint.io/) - Best practices checker
- [PWA Stats](https://www.pwastats.com/) - Performance benchmarks

---

**Tất cả tiêu chuẩn trên đã được áp dụng trong project này!** ✨
