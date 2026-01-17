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

    // Game HTML - Fullscreen cho iPad 8 (810x1080)
    gameContent.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-evenly;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        ">
            <div id="canvas-container" style="flex: 0 0 auto;">
                <canvas id="gestureCanvas" width="700" height="700" style="
                    border: 4px solid #fff;
                    border-radius: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    touch-action: none;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                "></canvas>
            </div>
            
            <div id="gestureInfo" style="
                padding: 20px 30px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 15px;
                font-size: 20px;
                min-height: 80px;
                width: 700px;
                text-align: center;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            ">
                <strong style="font-size: 24px;">🎯 Hãy thử các cử chỉ trên canvas!</strong>
            </div>

            <div id="stats" style="
                padding: 20px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 15px;
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                text-align: center;
                width: 700px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            ">
                <div style="font-size: 18px;"><strong>Taps:</strong><br><span id="tapCount" style="font-size: 28px; color: #2196F3; font-weight: bold;">0</span></div>
                <div style="font-size: 18px;"><strong>Swipes:</strong><br><span id="swipeCount" style="font-size: 28px; color: #4CAF50; font-weight: bold;">0</span></div>
                <div style="font-size: 18px;"><strong>Pinches:</strong><br><span id="pinchCount" style="font-size: 28px; color: #FF9800; font-weight: bold;">0</span></div>
                <div style="font-size: 18px;"><strong>Rotates:</strong><br><span id="rotateCount" style="font-size: 28px; color: #9C27B0; font-weight: bold;">0</span></div>
            </div>

            <button id="resetBtn" style="
                padding: 18px 50px;
                background: #f44336;
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 20px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(244, 67, 54, 0.4);
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
            <div style="font-size: 60px; margin-bottom: 10px;">${emoji}</div>
            <strong style="font-size: 28px; color: #2196F3;">${text}</strong>
        `;
        
        setTimeout(() => {
            info.innerHTML = `
                <strong style="font-size: 24px;">🎯 Hãy thử các cử chỉ trên canvas!</strong>
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
