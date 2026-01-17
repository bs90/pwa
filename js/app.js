// ===== PWA App Main Script =====

// Toast notification function
function showToast(message, icon = '💾', duration = 3000) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = toast.querySelector('.toast-icon');
  
  if (toast && toastMessage) {
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Listen for messages from Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'CACHE_UPDATED') {
            showToast(event.data.message, '✅');
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Install Prompt
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissBtn = document.getElementById('dismissBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent default browser install prompt
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install banner
  installBanner.style.display = 'block';
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  
  // Show install prompt
  deferredPrompt.prompt();
  
  // Wait for user choice
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to install prompt: ${outcome}`);
  
  // Reset deferred prompt
  deferredPrompt = null;
  installBanner.style.display = 'none';
});

dismissBtn?.addEventListener('click', () => {
  installBanner.style.display = 'none';
});

// Check if app is already installed
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed successfully');
  installBanner.style.display = 'none';
  deferredPrompt = null;
});

// ===== Online/Offline Status =====
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');

function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  
  if (statusBar && statusText) {
    if (isOnline) {
      statusBar.className = 'status-bar online';
      statusText.textContent = '🟢 Online';
    } else {
      statusBar.className = 'status-bar offline';
      statusText.textContent = '🔴 Offline';
    }
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ===== Game Navigation =====
const gameList = document.querySelector('.game-list');
const gameContainer = document.getElementById('gameContainer');
const gameContent = document.getElementById('gameContent');
const backBtn = document.getElementById('backBtn');

// Game data
const games = {
  'number-game': {
    title: '🔢 すうじげーむ',
    file: './games/number-game.js'
  },
  gestures: {
    title: '👆 見本',
    file: './games/gestures.js'
  }
};

// Track loaded game script
let currentGameScript = null;

// Load game
function loadGame(gameName) {
  const game = games[gameName];
  if (!game) return;
  
  // Remove previous game script if exists
  if (currentGameScript) {
    currentGameScript.remove();
    currentGameScript = null;
  }
  
  // Update UI
  gameList.style.display = 'none';
  gameContainer.style.display = 'block';
  gameContent.innerHTML = ''; // Clear content
  
  // Load game script
  const script = document.createElement('script');
  script.type = 'module'; // Enable ES6 modules
  script.src = game.file + '?t=' + Date.now(); // Cache busting
  script.onload = () => {
    console.log(`✅ Game ${gameName} loaded`);
    currentGameScript = script;
  };
  script.onerror = (event) => {
    console.error('Script load error:', event);
    gameContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: white;">
        <h3>⚠️ Không thể tải game</h3>
        <p>Game file: ${game.file}</p>
        <p>Error: Script failed to load</p>
        <p style="font-size: 12px; margin-top: 20px;">
          Có thể do:<br>
          - Không có internet (lần đầu)<br>
          - CDN bị chặn<br>
          - Safari không hỗ trợ ES modules
        </p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px;">
          Thử lại
        </button>
      </div>
    `;
  };
  
  document.body.appendChild(script);
}

// Back to game list
backBtn?.addEventListener('click', () => {
  // Remove current game script
  if (currentGameScript) {
    currentGameScript.remove();
    currentGameScript = null;
  }
  
  gameContainer.style.display = 'none';
  gameList.style.display = 'grid';
  gameContent.innerHTML = '';
});

// Handle game card clicks (click vào toàn bộ card)
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', (e) => {
    const gameName = card.getAttribute('data-game');
    if (gameName) {
      loadGame(gameName);
    }
  });
});

// ===== Performance Monitoring =====
if ('PerformanceObserver' in window) {
  // Observe loading performance
  const perfObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`⚡ ${entry.name}: ${entry.duration.toFixed(2)}ms`);
    }
  });
  
  perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
}

// ===== Share API (if supported) =====
if (navigator.share) {
  console.log('✅ Web Share API supported');
  
  window.shareApp = async function() {
    try {
      await navigator.share({
        title: 'ミニゲーム',
        text: 'オフラインでもあそべるミニゲーム!',
        url: window.location.href
      });
      console.log('✅ Shared successfully');
    } catch (err) {
      console.log('Share cancelled or failed:', err);
    }
  };
}

// ===== Background Sync (for future use) =====
if ('sync' in navigator.serviceWorker.ready) {
  console.log('✅ Background Sync supported');
}

// ===== Push Notifications (for future use) =====
if ('PushManager' in window) {
  console.log('✅ Push Notifications supported');
}

// ===== Log PWA capabilities =====
console.log('🎮 Minigame Collection PWA Initialized');
console.log('📱 Capabilities:', {
  serviceWorker: 'serviceWorker' in navigator,
  installPrompt: true,
  offlineSupport: true,
  responsive: true,
  share: 'share' in navigator,
  notifications: 'Notification' in window,
  backgroundSync: 'sync' in (navigator.serviceWorker?.ready || {}),
});
