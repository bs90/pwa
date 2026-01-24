// ===== Simple Game Loader (No Service Worker, No Cache) =====

console.log('🎮 App loaded');

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
  }
};

// Track loaded game script
let currentGameScript = null;

// Load game (simple approach)
function loadGame(gameName) {
  const game = games[gameName];
  if (!game) return;
  
  console.log('Loading game:', gameName);
  
  // Remove previous game script if exists
  if (currentGameScript) {
    currentGameScript.remove();
    currentGameScript = null;
  }
  
  // Update UI
  gameList.style.display = 'none';
  gameContainer.style.display = 'block';
  gameContent.innerHTML = '';
  
  // Load game script
  const script = document.createElement('script');
  script.src = game.file + '?t=' + Date.now();
  script.onload = () => {
    console.log('✅ Game loaded:', gameName);
    currentGameScript = script;
  };
  script.onerror = (err) => {
    console.error('❌ Failed to load game:', err);
    gameContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: white;">
        <h3>⚠️ ゲームを読み込めませんでした</h3>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;">
          リロード
        </button>
      </div>
    `;
  };
  
  document.body.appendChild(script);
}

// Back to game list
backBtn?.addEventListener('click', () => {
  if (currentGameScript) {
    currentGameScript.remove();
    currentGameScript = null;
  }
  
  gameContainer.style.display = 'none';
  gameList.style.display = 'grid';
  gameContent.innerHTML = '';
});

// Handle game card clicks
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const gameName = card.getAttribute('data-game');
    if (gameName) {
      loadGame(gameName);
    }
  });
});

console.log('✅ App ready');
