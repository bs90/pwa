#!/bin/bash

# PWA Icon Generator Script
# Tạo tất cả kích thước icons cần thiết cho PWA

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_IMAGE="$SCRIPT_DIR/source-image.jpg"
OUTPUT_DIR="$SCRIPT_DIR/images/icons"

# Kiểm tra input image tồn tại
if [ ! -f "$INPUT_IMAGE" ]; then
    echo "❌ Không tìm thấy file: $INPUT_IMAGE"
    echo "Vui lòng đặt ảnh nguồn vào thư mục project với tên 'source-image.jpg'"
    exit 1
fi

# Tạo output directory
mkdir -p "$OUTPUT_DIR"

echo "🎨 Đang tạo PWA icons từ: $INPUT_IMAGE"
echo "📁 Output folder: $OUTPUT_DIR"
echo ""

# Các kích thước cần tạo
SIZES=(72 96 128 144 152 192 384 512)

# Tạo icons với rounded corners và resize
for SIZE in "${SIZES[@]}"; do
    OUTPUT_FILE="$OUTPUT_DIR/icon-${SIZE}x${SIZE}.png"
    
    echo "⚙️  Generating ${SIZE}x${SIZE}..."
    
    # Resize và tạo rounded corners
    convert "$INPUT_IMAGE" \
        -resize ${SIZE}x${SIZE}^ \
        -gravity center \
        -extent ${SIZE}x${SIZE} \
        -alpha set \
        \( +clone -distort DePolar 0 -virtual-pixel HorizontalTile -background None -distort Polar 0 \) \
        -compose Dst_In -composite \
        -trim +repage \
        -gravity center \
        -extent ${SIZE}x${SIZE} \
        "$OUTPUT_FILE"
    
    echo "   ✅ Created: icon-${SIZE}x${SIZE}.png"
done

echo ""
echo "🎉 Hoàn thành! Đã tạo ${#SIZES[@]} icons"
echo ""
echo "📋 Danh sách icons đã tạo:"
ls -lh "$OUTPUT_DIR"/*.png | awk '{print "   " $9 " (" $5 ")"}'
echo ""
echo "✅ Bạn có thể test PWA ngay!"
echo "   1. Reload: http://localhost:8000"
echo "   2. F12 → Application → Manifest"
echo "   3. Check icons load OK"

