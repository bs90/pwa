/**
 * Touch Gestures Demo Game - Simple Canvas
 * Chỉ có canvas tương tác, không có UI phụ
 */

(function() {
    'use strict';

    const gameContent = document.getElementById('gameContent');
    
    // Create fullscreen canvas
    gameContent.innerHTML = '<canvas id="gestureCanvas"></canvas>';
    
    const canvas = document.getElementById('gestureCanvas');
    const ctx = canvas.getContext('2d');
    
    // Setup canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Game state
    const state = {
        message: { text: 'Try gestures!', emoji: '👆', time: 0 },
        circle: {
            x: 0,
            y: 0,
            radius: 80,
            color: '#FFD700',
            scale: 1,
            rotation: 0
        },
        particles: [],
        touch: {
            lastTap: 0,
            longPressTimer: null,
            startTouch: null,
            lastDistance: 0,
            lastAngle: 0
        }
    };
    
    // Initialize circle position
    state.circle.x = canvas.width / 2;
    state.circle.y = canvas.height / 2;
    
    // Utils
    function showMessage(text, emoji) {
        state.message = { text, emoji, time: 120 }; // 2 seconds at 60fps
    }
    
    function addParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            state.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 60,
                color
            });
        }
    }
    
    function getDistance(t1, t2) {
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    function getAngle(t1, t2) {
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }
    
    function getTouchPos(touch) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }
    
    // Touch handlers
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touches = Array.from(e.touches);
        
        if (touches.length === 1) {
            const pos = getTouchPos(touches[0]);
            state.touch.startTouch = pos;
            
            // Long press
            state.touch.longPressTimer = setTimeout(() => {
                showMessage('Long Press!', '⏱️');
                addParticles(pos.x, pos.y, 30, '#FF6B6B');
                navigator.vibrate && navigator.vibrate(100);
            }, 1000);
            
        } else if (touches.length === 2) {
            state.touch.lastDistance = getDistance(touches[0], touches[1]);
            state.touch.lastAngle = getAngle(touches[0], touches[1]);
            clearTimeout(state.touch.longPressTimer);
        }
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touches = Array.from(e.touches);
        
        if (touches.length === 2) {
            // Pinch
            const distance = getDistance(touches[0], touches[1]);
            if (state.touch.lastDistance > 0) {
                const scale = distance / state.touch.lastDistance;
                state.circle.scale *= scale;
                state.circle.scale = Math.max(0.5, Math.min(state.circle.scale, 3));
            }
            state.touch.lastDistance = distance;
            
            // Rotate
            const angle = getAngle(touches[0], touches[1]);
            if (state.touch.lastAngle !== 0) {
                const diff = angle - state.touch.lastAngle;
                if (Math.abs(diff) > 2 && Math.abs(diff) < 180) {
                    state.circle.rotation += diff;
                }
            }
            state.touch.lastAngle = angle;
        }
        
        clearTimeout(state.touch.longPressTimer);
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        clearTimeout(state.touch.longPressTimer);
        
        const touches = Array.from(e.changedTouches);
        
        if (touches.length === 1 && state.touch.startTouch) {
            const pos = getTouchPos(touches[0]);
            const dx = pos.x - state.touch.startTouch.x;
            const dy = pos.y - state.touch.startTouch.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 15) {
                // Tap or Double Tap
                const now = Date.now();
                const timeSinceLast = now - state.touch.lastTap;
                
                if (timeSinceLast < 300) {
                    showMessage('Double Tap!', '👆👆');
                    state.circle.color = '#' + Math.floor(Math.random()*16777215).toString(16);
                    addParticles(pos.x, pos.y, 40, state.circle.color);
                } else {
                    showMessage('Tap!', '👆');
                    addParticles(pos.x, pos.y, 15, '#FFD700');
                }
                
                state.touch.lastTap = now;
                
            } else if (distance > 50) {
                // Swipe
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                let direction;
                const moveDistance = Math.min(120, canvas.width * 0.15);
                
                if (angle > -45 && angle <= 45) {
                    direction = 'RIGHT ➡️';
                    state.circle.x = Math.min(state.circle.x + moveDistance, canvas.width - state.circle.radius * 2);
                } else if (angle > 45 && angle <= 135) {
                    direction = 'DOWN ⬇️';
                    state.circle.y = Math.min(state.circle.y + moveDistance, canvas.height - state.circle.radius * 2);
                } else if (angle < -45 && angle >= -135) {
                    direction = 'UP ⬆️';
                    state.circle.y = Math.max(state.circle.y - moveDistance, state.circle.radius * 2);
                } else {
                    direction = 'LEFT ⬅️';
                    state.circle.x = Math.max(state.circle.x - moveDistance, state.circle.radius * 2);
                }
                
                showMessage(`Swipe ${direction}`, '👉');
                addParticles(pos.x, pos.y, 20, '#4CAF50');
            }
        }
        
        if (e.touches.length === 0) {
            state.touch.startTouch = null;
            state.touch.lastDistance = 0;
            state.touch.lastAngle = 0;
        }
    });
    
    // Mouse support for desktop
    let mouseDown = false, mouseStart = null;
    canvas.addEventListener('mousedown', (e) => {
        mouseDown = true;
        mouseStart = { x: e.offsetX, y: e.offsetY };
    });
    canvas.addEventListener('mouseup', (e) => {
        if (mouseDown && mouseStart) {
            const pos = { x: e.offsetX, y: e.offsetY };
            const distance = Math.sqrt(
                Math.pow(pos.x - mouseStart.x, 2) + 
                Math.pow(pos.y - mouseStart.y, 2)
            );
            
            if (distance < 15) {
                showMessage('Click!', '🖱️');
                addParticles(pos.x, pos.y, 15, '#FFD700');
            }
        }
        mouseDown = false;
        mouseStart = null;
    });
    
    // Draw functions
    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawCircle() {
        const c = state.circle;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation * Math.PI / 180);
        ctx.scale(c.scale, c.scale);
        
        // Circle
        ctx.fillStyle = c.color;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Face
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-25, -15, 8, 0, Math.PI * 2);
        ctx.arc(25, -15, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 10, 35, 0, Math.PI);
        ctx.stroke();
        
        ctx.restore();
    }
    
    function drawParticles() {
        state.particles = state.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity
            p.life--;
            
            ctx.globalAlpha = p.life / 60;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            return p.life > 0;
        });
        ctx.globalAlpha = 1;
    }
    
    function drawMessage() {
        if (state.message.time > 0) {
            const fontSize = Math.min(canvas.width, canvas.height) * 0.1;
            
            // Emoji
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(state.message.emoji, canvas.width / 2, canvas.height * 0.25);
            
            // Text with shadow
            ctx.font = `bold ${fontSize * 0.5}px Arial`;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.fillText(state.message.text, canvas.width / 2, canvas.height * 0.35);
            ctx.shadowBlur = 0;
            
            state.message.time--;
        } else {
            // Instruction text
            const fontSize = Math.min(canvas.width, canvas.height) * 0.04;
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText('👆 Tap, Double Tap, Long Press, Swipe, Pinch, Rotate', canvas.width / 2, canvas.height * 0.95);
        }
    }
    
    // Animation loop
    function animate() {
        drawBackground();
        drawCircle();
        drawParticles();
        drawMessage();
        
        requestAnimationFrame(animate);
    }
    
    animate();
})();
