# 🎨 Hướng dẫn tạo Icons cho PWA

## Bước 1: Chuẩn bị ảnh

### Lưu ảnh vào project

**Terminal:**
```bash
# Từ Desktop
cp ~/Desktop/your-photo.jpg /Users/tran.ba.trong/pwa_base/source-image.jpg

# Từ Downloads  
cp ~/Downloads/your-photo.jpg /Users/tran.ba.trong/pwa_base/source-image.jpg

# Hoặc drag & drop vào Finder
open /Users/tran.ba.trong/pwa_base
```

**Đổi tên thành:** `source-image.jpg` hoặc `source-image.png`

---

## Bước 2: Chạy script tạo icons

```bash
cd /Users/tran.ba.trong/pwa_base
./create-icons-simple.sh
```

Script sẽ tự động:
- ✅ Tìm ảnh trong thư mục
- ✅ Crop vuông ở giữa
- ✅ Resize thành 8 kích thước
- ✅ Lưu vào `images/icons/`

**Output:**
```
images/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png    ← BẮT BUỘC
├── icon-384x384.png
└── icon-512x512.png    ← BẮT BUỘC
```

---

## Bước 3: Test PWA

1. **Reload trang:**
   ```
   http://localhost:8000
   ```

2. **Mở DevTools (F12)**
   - Application tab → Manifest
   - Check icons load OK
   - Không có errors

3. **Install PWA**
   - Nút Install sẽ xuất hiện trong address bar
   - Click để install
   - App sẽ mở trong cửa sổ riêng!

---

## Nếu không có ImageMagick

### Cài đặt ImageMagick:

**macOS:**
```bash
brew install imagemagick
```

**Hoặc dùng online tool:**
1. Vào: https://realfavicongenerator.net/
2. Upload ảnh của bạn
3. Generate và download
4. Giải nén vào `images/icons/`

---

## Tips cho ảnh đẹp

### Ảnh nguồn tốt:
- ✅ Vuông hoặc gần vuông
- ✅ Độ phân giải ≥ 512x512px
- ✅ Đối tượng ở giữa
- ✅ Background đơn giản

### Nếu ảnh chữ nhật:
Script sẽ tự động crop ở giữa, nhưng có thể:
- Crop thủ công trước (vuông)
- Hoặc thêm padding/background

---

## Customize script (Advanced)

Muốn rounded corners? Edit `create-icons-simple.sh`:

```bash
# Thêm rounded corners (20% radius)
convert "$INPUT_IMAGE" \
    -resize ${SIZE}x${SIZE}^ \
    -gravity center \
    -extent ${SIZE}x${SIZE} \
    \( +clone -alpha extract \
       -draw "fill black polygon 0,0 0,${SIZE} ${SIZE},${SIZE} ${SIZE},0" \
       -blur 0x${SIZE}/5 \) \
    -alpha off -compose CopyOpacity -composite \
    "$OUTPUT_FILE"
```

---

## Troubleshooting

### Script báo "command not found"?
```bash
chmod +x create-icons-simple.sh
```

### ImageMagick chưa cài?
```bash
brew install imagemagick
```

### Muốn thử lại?
```bash
# Xóa icons cũ
rm -rf images/icons/*.png

# Tạo lại
./create-icons-simple.sh
```

---

**Ready to create icons!** 🎨✨
