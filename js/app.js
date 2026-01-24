// ===== PWA App Main Script =====

// Cache version (must match sw.js)
// UPDATED: Phaser now local, 100% offline-capable!
const CACHE_VERSION = '202601250823';

// Update cache version display on page load
window.addEventListener('DOMContentLoaded', () => {
  const cacheVersionDisplay = document.getElementById('cacheVersionDisplay');
  if (cacheVersionDisplay) {
    cacheVersionDisplay.textContent = `v${CACHE_VERSION}`;
  }
});

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

// ===== iOS Detection =====
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.navigator.standalone || 
                     window.matchMedia('(display-mode: standalone)').matches;

console.log(`📱 iOS Device: ${isIOS}`);
console.log(`🎯 Standalone Mode: ${isStandalone}`);

// ===== Install Prompt =====
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissBtn = document.getElementById('dismissBtn');
const iosInstallBanner = document.getElementById('iosInstallBanner');
const iosDismissBtn = document.getElementById('iosDismissBtn');

// iOS Install Instructions (iOS doesn't have beforeinstallprompt)
if (isIOS && !isStandalone) {
  console.log('🍎 Showing iOS install instructions');
  // Show after 2 seconds
  setTimeout(() => {
    iosInstallBanner.style.display = 'block';
  }, 2000);
}

iosDismissBtn?.addEventListener('click', () => {
  iosInstallBanner.style.display = 'none';
  localStorage.setItem('iosInstallDismissed', 'true');
});

// Don't show iOS banner if dismissed before
if (localStorage.getItem('iosInstallDismissed') === 'true') {
  iosInstallBanner.style.display = 'none';
}

// Android/Desktop Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 Install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install banner (Android/Desktop only)
  if (!isIOS) {
    installBanner.style.display = 'block';
  }
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`✅ Install outcome: ${outcome}`);
  
  deferredPrompt = null;
  installBanner.style.display = 'none';
});

dismissBtn?.addEventListener('click', () => {
  installBanner.style.display = 'none';
});

window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed successfully');
  installBanner.style.display = 'none';
  iosInstallBanner.style.display = 'none';
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
    title: '🔢 すうじゲーム',
    file: './games/number-game.js'
  },
  'karate': {
    title: '🥋 カラテ',
    file: './games/karate.js'
  },
  gestures: {
    title: '👆 見本',
    file: './games/gestures.js'
  }
};

// Track loaded game script
let currentGameScript = null;

// Phaser check (loaded via script tag in index.html - UMD build)
function ensurePhaserLoaded() {
  if (!window.Phaser) {
    console.error('❌ Phaser not loaded! Check index.html');
    throw new Error('Phaser is required but not loaded');
  }
  console.log('✅ Phaser ready:', window.Phaser.VERSION);
}

// Load game
function loadGame(gameName) {
  const game = games[gameName];
  if (!game) return;
  
  // Update UI first
  gameList.style.display = 'none';
  gameContainer.style.display = 'block';
  gameContent.innerHTML = '⏳ Loading game...'; // Show loading
  
  try {
    // Check Phaser is loaded (should be from index.html script tag)
    ensurePhaserLoaded();
    
    // Remove previous game script if exists
    if (currentGameScript) {
      currentGameScript.remove();
      currentGameScript = null;
    }
    
    // Clear loading message
    gameContent.innerHTML = '';
    
    // Load game script
    const script = document.createElement('script');
    script.type = 'module'; // Enable ES6 modules
    script.src = game.file + '?t=' + Date.now(); // Cache busting
    script.onload = () => {
      console.log(`✅ Game ${gameName} loaded`);
      currentGameScript = script;
    };
    script.onerror = (event) => {
      console.error('❌ Script load error:', event);
      gameContent.innerHTML = `
        <div style="text-align: center; padding: 40px; color: white;">
          <h3>⚠️ Không thể tải game</h3>
          <p>Game file: ${game.file}</p>
          <p>Error: Script failed to load</p>
          <p style="font-size: 12px; margin-top: 20px;">
            Check debug console for details<br>
            Phaser loaded: ${window.phaserLoaded ? 'YES' : 'NO'}
          </p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px;">
            Thử lại
          </button>
        </div>
      `;
    };
    
    document.body.appendChild(script);
  } catch (error) {
    console.error('❌ Failed to load game:', error);
    gameContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: white;">
        <h3>⚠️ Lỗi tải game</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px;">
          Thử lại
        </button>
      </div>
    `;
  }
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

// ===== Cache Size Monitor =====
if ('storage' in navigator && 'estimate' in navigator.storage) {
  navigator.storage.estimate().then(({usage, quota}) => {
    const usageMB = (usage / 1024 / 1024).toFixed(2);
    const quotaMB = (quota / 1024 / 1024).toFixed(0);
    const percent = (usage / quota * 100).toFixed(1);
    
    console.log(`📦 Cache Storage: ${usageMB}MB / ${quotaMB}MB (${percent}%)`);
    
    // Warning if approaching iOS limit (50MB)
    if (usage > 40 * 1024 * 1024) {
      console.warn(`⚠️ Cache approaching iOS limit! (${usageMB}MB / 50MB)`);
    }
  }).catch(err => {
    console.log('⚠️ Storage estimate not available:', err);
  });
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
  localStorage: 'localStorage' in window,
  storageEstimate: 'storage' in navigator && 'estimate' in navigator.storage
});
