#!/bin/bash
# Script tạo icons PWA với các kích thước khác nhau

# Tạo file SVG đơn giản cho icon
cat > /tmp/icon.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2196F3;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1976D2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="100" fill="url(#grad1)"/>
  
  <!-- Game controller icon -->
  <g transform="translate(256, 256)">
    <!-- Controller body -->
    <rect x="-120" y="-60" width="240" height="120" rx="30" fill="#fff"/>
    
    <!-- D-pad -->
    <rect x="-80" y="-10" width="40" height="20" rx="5" fill="#2196F3"/>
    <rect x="-60" y="-30" width="20" height="40" rx="5" fill="#2196F3"/>
    
    <!-- Buttons -->
    <circle cx="60" cy="-20" r="15" fill="#FFC107"/>
    <circle cx="90" cy="0" r="15" fill="#4CAF50"/>
    <circle cx="60" cy="20" r="15" fill="#f44336"/>
    <circle cx="30" cy="0" r="15" fill="#9C27B0"/>
  </g>
</svg>
EOF

echo "Icon SVG template created successfully!"
echo ""
echo "⚠️  LƯU Ý: Script này tạo file SVG mẫu."
echo ""
echo "Để tạo PNG icons với đúng kích thước, bạn cần:"
echo "1. Sử dụng ImageMagick: brew install imagemagick (trên macOS)"
echo "2. Hoặc dùng online tool: https://realfavicongenerator.net/"
echo "3. Hoặc dùng design tool như Figma, Sketch, Photoshop"
echo ""
echo "Các kích thước cần tạo:"
echo "- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512"
