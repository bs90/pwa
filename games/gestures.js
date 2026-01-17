/**
 * Touch Gestures Demo Game
 * Demo các cử chỉ touch trên mobile:
 * - Tap: Chạm 1 lần
 * - Double Tap: Chạm 2 lần nhanh
 * - Long Press: Giữ lâu
 * - Swipe: Vuốt (lên/xuống/trái/phải)
 * - Pinch: Véo (zoom in/out với 2 ngón)
 * - Rotate: Xoay (với 2 ngón)
 */

(function() {
    'use strict';

    const gameContent = document.getElementById('gameContent');
    const gameTitle = document.getElementById('gameTitle');
    
    gameTitle.textContent = '👆 Touch Gestures Demo';

    // Game HTML
    gameContent.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div id="canvas-container" style="position: relative; margin: 20px auto; max-width: 600px;">
                <canvas id="gestureCanvas" width="350" height="500" style="
                    border: 3px solid #2196F3;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    touch-action: none;
                    max-width: 100%;
                    height: auto;
                "></canvas>
            </div>
            
            <div id="gestureInfo" style="
                margin-top: 20px;
                padding: 20px;
                background: #f5f5f5;
                border-radius: 10px;
                font-size: 18px;
                min-height: 100px;
            ">
                <strong>🎯 Hãy thử các cử chỉ:</strong><br>
                <div style="text-align: left; margin-top: 15px; line-height: 2;">
                    👆 <strong>Tap:</strong> Chạm 1 lần<br>
                    👆👆 <strong>Double Tap:</strong> Chạm 2 lần nhanh<br>
                    ⏱️ <strong>Long Press:</strong> Giữ lâu (1s)<br>
                    👉 <strong>Swipe:</strong> Vuốt (↑↓←→)<br>
                    🤏 <strong>Pinch:</strong> Véo 2 ngón (zoom)<br>
                    🔄 <strong>Rotate:</strong> Xoay 2 ngón
                </div>
            </div>

            <div id="stats" style="
                margin-top: 20px;
                padding: 15px;
                background: #e3f2fd;
                border-radius: 10px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
                text-align: center;
            ">
                <div><strong>Taps:</strong> <span id="tapCount">0</span></div>
                <div><strong>Swipes:</strong> <span id="swipeCount">0</span></div>
                <div><strong>Pinches:</strong> <span id="pinchCount">0</span></div>
                <div><strong>Rotates:</strong> <span id="rotateCount">0</span></div>
            </div>

            <button id="resetBtn" style="
                margin-top: 20px;
                padding: 12px 30px;
                background: #f44336;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
            ">🔄 Reset</button>
        </div>
    `;

    // Canvas setup
    const canvas = document.getElementById('gestureCanvas');
    const ctx = canvas.getContext('2d');
    
    // Stats
    let stats = {
        taps: 0,
        swipes: 0,
        pinches: 0,
        rotates: 0
    };

    // Touch state
    let touchState = {
        lastTap: 0,
        longPressTimer: null,
        startTouch: null,
        touches: [],
        lastDistance: 0,
        lastAngle: 0
    };

    // Canvas objects
    let circle = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 50,
        color: '#FFD700',
        scale: 1,
        rotation: 0
    };

    let particles = [];

    // Update stats display
    function updateStats() {
        document.getElementById('tapCount').textContent = stats.taps;
        document.getElementById('swipeCount').textContent = stats.swipes;
        document.getElementById('pinchCount').textContent = stats.pinches;
        document.getElementById('rotateCount').textContent = stats.rotates;
    }

    // Show gesture feedback
    function showGesture(text, emoji) {
        const info = document.getElementById('gestureInfo');
        info.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px;">${emoji}</div>
            <strong style="font-size: 24px; color: #2196F3;">${text}</strong>
        `;
        
        setTimeout(() => {
            info.innerHTML = `
                <strong>🎯 Hãy thử các cử chỉ:</strong><br>
                <div style="text-align: left; margin-top: 15px; line-height: 2;">
                    👆 <strong>Tap:</strong> Chạm 1 lần<br>
                    👆👆 <strong>Double Tap:</strong> Chạm 2 lần nhanh<br>
                    ⏱️ <strong>Long Press:</strong> Giữ lâu (1s)<br>
                    👉 <strong>Swipe:</strong> Vuốt (↑↓←→)<br>
                    🤏 <strong>Pinch:</strong> Véo 2 ngón (zoom)<br>
                    🔄 <strong>Rotate:</strong> Xoay 2 ngón
                </div>
            `;
        }, 2000);
    }

    // Add particle effect
    function addParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 60,
                color: color
            });
        }
    }

    // Calculate distance between two touches
    function getDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate angle between two touches
    function getAngle(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    // Get touch position relative to canvas
    function getTouchPos(touch) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    // Touch Start
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        
        const touches = Array.from(e.touches);
        touchState.touches = touches;
        
        if (touches.length === 1) {
            const pos = getTouchPos(touches[0]);
            touchState.startTouch = pos;
            
            // Long press detection
            touchState.longPressTimer = setTimeout(() => {
                showGesture('Long Press!', '⏱️');
                addParticles(pos.x, pos.y, 20, '#FF6B6B');
                navigator.vibrate && navigator.vibrate(100);
            }, 1000);
            
        } else if (touches.length === 2) {
            // Two finger gestures
            touchState.lastDistance = getDistance(touches[0], touches[1]);
            touchState.lastAngle = getAngle(touches[0], touches[1]);
            clearTimeout(touchState.longPressTimer);
        }
    });

    // Touch Move
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        const touches = Array.from(e.touches);
        
        if (touches.length === 2) {
            // Pinch to zoom
            const distance = getDistance(touches[0], touches[1]);
            if (touchState.lastDistance > 0) {
                const scale = distance / touchState.lastDistance;
                circle.scale *= scale;
                circle.scale = Math.max(0.5, Math.min(circle.scale, 3));
                
                if (Math.abs(scale - 1) > 0.02) {
                    stats.pinches++;
                    updateStats();
                }
            }
            touchState.lastDistance = distance;
            
            // Rotate
            const angle = getAngle(touches[0], touches[1]);
            if (touchState.lastAngle !== 0) {
                const diff = angle - touchState.lastAngle;
                if (Math.abs(diff) > 2 && Math.abs(diff) < 180) {
                    circle.rotation += diff;
                    stats.rotates++;
                    updateStats();
                }
            }
            touchState.lastAngle = angle;
        }
        
        clearTimeout(touchState.longPressTimer);
    });

    // Touch End
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        
        clearTimeout(touchState.longPressTimer);
        
        const touches = Array.from(e.changedTouches);
        
        if (touches.length === 1 && touchState.startTouch) {
            const pos = getTouchPos(touches[0]);
            const dx = pos.x - touchState.startTouch.x;
            const dy = pos.y - touchState.startTouch.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 10) {
                // Tap or Double Tap
                const now = Date.now();
                const timeSinceLast = now - touchState.lastTap;
                
                if (timeSinceLast < 300) {
                    // Double Tap
                    showGesture('Double Tap!', '👆👆');
                    circle.color = '#' + Math.floor(Math.random()*16777215).toString(16);
                    addParticles(pos.x, pos.y, 30, circle.color);
                } else {
                    // Single Tap
                    showGesture('Tap!', '👆');
                    addParticles(pos.x, pos.y, 10, '#FFD700');
                }
                
                stats.taps++;
                updateStats();
                touchState.lastTap = now;
                
            } else if (distance > 50) {
                // Swipe
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                let direction;
                
                if (angle > -45 && angle <= 45) {
                    direction = 'RIGHT ➡️';
                    circle.x = Math.min(circle.x + 50, canvas.width - 60);
                } else if (angle > 45 && angle <= 135) {
                    direction = 'DOWN ⬇️';
                    circle.y = Math.min(circle.y + 50, canvas.height - 60);
                } else if (angle < -45 && angle >= -135) {
                    direction = 'UP ⬆️';
                    circle.y = Math.max(circle.y - 50, 60);
                } else {
                    direction = 'LEFT ⬅️';
                    circle.x = Math.max(circle.x - 50, 60);
                }
                
                showGesture(`Swipe ${direction}`, '👉');
                addParticles(pos.x, pos.y, 15, '#4CAF50');
                stats.swipes++;
                updateStats();
            }
        }
        
        if (e.touches.length === 0) {
            touchState.startTouch = null;
            touchState.lastDistance = 0;
            touchState.lastAngle = 0;
        }
    });

    // Also handle mouse for desktop testing
    let mouseDown = false;
    let mouseStart = null;
    
    canvas.addEventListener('mousedown', (e) => {
        mouseDown = true;
        const rect = canvas.getBoundingClientRect();
        mouseStart = {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    });
    
    canvas.addEventListener('mouseup', (e) => {
        if (mouseDown && mouseStart) {
            const rect = canvas.getBoundingClientRect();
            const pos = {
                x: (e.clientX - rect.left) * (canvas.width / rect.width),
                y: (e.clientY - rect.top) * (canvas.height / rect.height)
            };
            
            const distance = Math.sqrt(
                Math.pow(pos.x - mouseStart.x, 2) + 
                Math.pow(pos.y - mouseStart.y, 2)
            );
            
            if (distance < 10) {
                showGesture('Click!', '🖱️');
                addParticles(pos.x, pos.y, 10, '#FFD700');
                stats.taps++;
                updateStats();
            }
        }
        mouseDown = false;
        mouseStart = null;
    });

    // Animation loop
    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw particles
        particles = particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            ctx.globalAlpha = p.life / 60;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            return p.life > 0;
        });
        ctx.globalAlpha = 1;
        
        // Draw circle with transformations
        ctx.save();
        ctx.translate(circle.x, circle.y);
        ctx.rotate(circle.rotation * Math.PI / 180);
        ctx.scale(circle.scale, circle.scale);
        
        // Draw circle
        ctx.fillStyle = circle.color;
        ctx.beginPath();
        ctx.arc(0, 0, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw smile face
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-15, -10, 5, 0, Math.PI * 2);
        ctx.arc(15, -10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 5, 25, 0, Math.PI);
        ctx.stroke();
        
        ctx.restore();
        
        requestAnimationFrame(animate);
    }
    
    animate();

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        stats = { taps: 0, swipes: 0, pinches: 0, rotates: 0 };
        circle = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 50,
            color: '#FFD700',
            scale: 1,
            rotation: 0
        };
        particles = [];
        updateStats();
        showGesture('Reset!', '🔄');
    });

})();
