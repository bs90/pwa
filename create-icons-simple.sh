#!/bin/bash

# Simple PWA Icon Generator
# Dùng ảnh bất kỳ trong thư mục để tạo icons

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/images/icons"

echo "🔍 Tìm kiếm ảnh trong thư mục..."

# Tìm file ảnh đầu tiên
INPUT_IMAGE=$(find "$SCRIPT_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | head -1)

if [ -z "$INPUT_IMAGE" ]; then
    echo ""
    echo "❌ Không tìm thấy ảnh nào trong thư mục!"
    echo ""
    echo "📝 Hướng dẫn:"
    echo "   1. Copy ảnh của bạn vào: $SCRIPT_DIR"
    echo "   2. Đổi tên thành: source-image.jpg (hoặc .png)"
    echo "   3. Chạy lại script này"
    echo ""
    exit 1
fi

echo "✅ Tìm thấy: $(basename "$INPUT_IMAGE")"
echo ""

# Tạo output directory
mkdir -p "$OUTPUT_DIR"

echo "🎨 Đang tạo PWA icons..."
echo "📁 Output: $OUTPUT_DIR"
echo ""

# Các kích thước cần tạo
SIZES=(72 96 128 144 152 192 384 512)

for SIZE in "${SIZES[@]}"; do
    OUTPUT_FILE="$OUTPUT_DIR/icon-${SIZE}x${SIZE}.png"
    
    echo "   ⚙️  ${SIZE}x${SIZE}..."
    
    # Simple crop center và resize
    convert "$INPUT_IMAGE" \
        -resize ${SIZE}x${SIZE}^ \
        -gravity center \
        -extent ${SIZE}x${SIZE} \
        "$OUTPUT_FILE"
done

echo ""
echo "🎉 Hoàn thành!"
echo ""
echo "📋 Đã tạo các icons:"
ls -lh "$OUTPUT_DIR"/icon-*.png 2>/dev/null | awk '{print "   ✓ " $9 " (" $5 ")"}'
echo ""
echo "🚀 Bước tiếp theo:"
echo "   1. Reload: http://localhost:8000"
echo "   2. Mở DevTools (F12)"
echo "   3. Application → Manifest"
echo "   4. Check icons hiển thị OK"
echo "   5. Nút Install sẽ xuất hiện!"
echo ""

