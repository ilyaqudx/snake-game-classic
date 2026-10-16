import './style.css';
import { SnakeEngine, SPEED_LEVELS } from './snake-engine.js';
import { audio } from './audio.js';

// DOM Elements
const canvas = document.getElementById('snake-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score-val');
const bestScoreEl = document.getElementById('best-score-val');
const btnRestartEl = document.getElementById('btn-restart');
const btnPauseEl = document.getElementById('btn-pause');
const pauseIconEl = document.getElementById('pause-icon');
const pauseTextEl = document.getElementById('pause-text');

const selectSpeedEl = document.getElementById('select-speed');
const selectModeEl = document.getElementById('select-mode');
const selectThemeEl = document.getElementById('select-theme');

const canvasOverlayEl = document.getElementById('canvas-overlay');
const overlayTitleEl = document.getElementById('overlay-title');
const overlayDescEl = document.getElementById('overlay-desc');

const modalGameOverEl = document.getElementById('modal-gameover');
const finalScoreEl = document.getElementById('final-score');
const btnPlayAgainLoss = document.getElementById('btn-play-again-loss');

const btnSoundEl = document.getElementById('btn-sound');
const soundIconEl = document.getElementById('sound-icon');
const btnHelpEl = document.getElementById('btn-help');
const modalHelpEl = document.getElementById('modal-help');

const dpadBtns = document.querySelectorAll('.dpad-btn');

// Game Initialization
const game = new SnakeEngine(22);
bestScoreEl.textContent = game.bestScore;

// Audio Setup
function updateSoundIcon() {
  soundIconEl.textContent = audio.isMuted() ? '🔇' : '🔊';
}
updateSoundIcon();
btnSoundEl.addEventListener('click', () => {
  audio.toggleMute();
  updateSoundIcon();
});

// Canvas Setup
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', () => {
  resizeCanvas();
  render();
});
resizeCanvas();

// Game Loop Timing
let lastStepTime = performance.now();

function gameLoop(currentTime) {
  const currentInterval = SPEED_LEVELS[game.speedLevel].interval;

  if (game.status === 'playing') {
    if (currentTime - lastStepTime >= currentInterval) {
      lastStepTime = currentTime;
      const res = game.step();

      if (res.ateFood) {
        audio.playEat(game.food?.type);
        scoreEl.textContent = game.score;
        bestScoreEl.textContent = game.bestScore;
      }

      if (res.status === 'gameover') {
        audio.playDie();
        finalScoreEl.textContent = game.score;
        setTimeout(() => { modalGameOverEl.hidden = false; }, 400);
      }
    }
  }

  render();
  requestAnimationFrame(gameLoop);
}

// Render Functions
function render() {
  const rect = canvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  const cellSize = W / game.gridSize;

  ctx.clearRect(0, 0, W, H);

  // 1. Draw Background Grid
  if (game.theme === 'nokia') {
    ctx.fillStyle = '#9bbc0f';
    ctx.fillRect(0, 0, W, H);
  } else if (game.theme === 'neon') {
    ctx.fillStyle = '#05050d';
    ctx.fillRect(0, 0, W, H);
    // Neon grid lines
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= game.gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(W, i * cellSize);
      ctx.stroke();
    }
  } else {
    // Modern Dark
    ctx.fillStyle = '#0f1118';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= game.gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(W, i * cellSize);
      ctx.stroke();
    }
  }

  // 2. Draw Food with Pulsing Effect
  if (game.food) {
    const fx = game.food.x * cellSize + cellSize / 2;
    const fy = game.food.y * cellSize + cellSize / 2;
    const pulse = Math.sin(performance.now() * 0.008) * 1.5;
    const r = (cellSize / 2.3) + pulse;

    if (game.theme === 'nokia') {
      ctx.fillStyle = '#0f380f';
      ctx.fillRect(
        game.food.x * cellSize + 2,
        game.food.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );
    } else {
      ctx.beginPath();
      ctx.arc(fx, fy, Math.max(3, r), 0, Math.PI * 2);
      ctx.fillStyle = game.food.color;
      ctx.shadowColor = game.food.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Small specular highlight
      ctx.beginPath();
      ctx.arc(fx - r / 3, fy - r / 3, r / 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
    }
  }

  // 3. Draw Snake
  game.snake.forEach((seg, idx) => {
    const sx = seg.x * cellSize;
    const sy = seg.y * cellSize;
    const isHead = idx === 0;

    if (game.theme === 'nokia') {
      ctx.fillStyle = '#0f380f';
      ctx.fillRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);
      if (isHead) {
        ctx.fillStyle = '#9bbc0f';
        ctx.fillRect(sx + cellSize / 3, sy + cellSize / 3, cellSize / 3, cellSize / 3);
      }
    } else if (game.theme === 'neon') {
      ctx.fillStyle = isHead ? '#38bdf8' : '#a855f7';
      ctx.shadowColor = isHead ? '#38bdf8' : '#a855f7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(sx + 1.5, sy + 1.5, cellSize - 3, cellSize - 3, 5);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Modern Clean
      ctx.fillStyle = isHead ? '#4ade80' : '#22c55e';
      ctx.beginPath();
      ctx.roundRect(sx + 1.5, sy + 1.5, cellSize - 3, cellSize - 3, isHead ? 6 : 4);
      ctx.fill();

      // Cute Eyes on Head
      if (isHead) {
        ctx.fillStyle = '#0f172a';
        const eyeOffset = cellSize / 4;
        const eyeSize = cellSize / 7;

        let e1x = sx + cellSize / 2, e1y = sy + eyeOffset;
        let e2x = sx + cellSize / 2, e2y = sy + cellSize - eyeOffset;

        if (game.direction.x !== 0) {
          const eyeForward = game.direction.x > 0 ? cellSize - eyeOffset : eyeOffset;
          e1x = sx + eyeForward; e1y = sy + eyeOffset;
          e2x = sx + eyeForward; e2y = sy + cellSize - eyeOffset;
        } else if (game.direction.y !== 0) {
          const eyeForward = game.direction.y > 0 ? cellSize - eyeOffset : eyeOffset;
          e1x = sx + eyeOffset; e1y = sy + eyeForward;
          e2x = sx + cellSize - eyeOffset; e2y = sy + eyeForward;
        }

        ctx.beginPath();
        ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2);
        ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  // Overlay Visibility
  if (game.status === 'ready') {
    canvasOverlayEl.hidden = false;
    overlayTitleEl.textContent = '🐍 Ready to Slither!';
    overlayDescEl.textContent = 'Press any Arrow key, W-A-S-D, or Swipe to start!';
  } else if (game.status === 'paused') {
    canvasOverlayEl.hidden = false;
    overlayTitleEl.textContent = '⏸️ Game Paused';
    overlayDescEl.textContent = 'Press Spacebar or click Resume to continue';
  } else {
    canvasOverlayEl.hidden = true;
  }
}

// User Move Input
function handleDirectionInput(dx, dy) {
  if (game.status === 'ready' || game.status === 'paused') {
    game.status = 'playing';
  }
  audio.playTurn();
  game.setDirection({ x: dx, y: dy });
}

// Keyboard Mapping
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  const k = e.key.toLowerCase();
  switch (k) {
    case 'arrowup':
    case 'w':
      e.preventDefault();
      handleDirectionInput(0, -1);
      break;
    case 'arrowdown':
    case 's':
      e.preventDefault();
      handleDirectionInput(0, 1);
      break;
    case 'arrowleft':
    case 'a':
      e.preventDefault();
      handleDirectionInput(-1, 0);
      break;
    case 'arrowright':
    case 'd':
      e.preventDefault();
      handleDirectionInput(1, 0);
      break;
    case ' ':
    case 'p':
      e.preventDefault();
      togglePause();
      break;
  }
});

// D-Pad Buttons
dpadBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const dir = btn.dataset.dir;
    if (dir === 'up') handleDirectionInput(0, -1);
    else if (dir === 'down') handleDirectionInput(0, 1);
    else if (dir === 'left') handleDirectionInput(-1, 0);
    else if (dir === 'right') handleDirectionInput(1, 0);
  });
});

// Touch and Swipe Gestures
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) < 25) return; // Ignore small tap

  if (absX > absY) {
    handleDirectionInput(dx > 0 ? 1 : -1, 0);
  } else {
    handleDirectionInput(0, dy > 0 ? 1 : -1);
  }
}, { passive: true });

// Toolbar Controls
function togglePause() {
  const st = game.togglePause();
  pauseIconEl.textContent = st === 'paused' ? '▶️' : '⏸️';
  pauseTextEl.textContent = st === 'paused' ? 'Resume' : 'Pause';
}
btnPauseEl.addEventListener('click', togglePause);

btnRestartEl.addEventListener('click', () => {
  game.reset();
  modalGameOverEl.hidden = true;
  scoreEl.textContent = '0';
  pauseIconEl.textContent = '⏸️';
  pauseTextEl.textContent = 'Pause';
});

btnPlayAgainLoss.addEventListener('click', () => {
  game.reset();
  modalGameOverEl.hidden = true;
  scoreEl.textContent = '0';
});

// Settings Changes
selectSpeedEl.addEventListener('change', (e) => {
  game.speedLevel = e.target.value;
});

selectModeEl.addEventListener('change', (e) => {
  game.mode = e.target.value;
});

selectThemeEl.addEventListener('change', (e) => {
  game.theme = e.target.value;
});

// Help Modal
btnHelpEl.addEventListener('click', () => { modalHelpEl.hidden = false; });
document.querySelectorAll('.modal-close').forEach(b => {
  b.addEventListener('click', () => { modalHelpEl.hidden = true; });
});
modalHelpEl.addEventListener('click', (e) => {
  if (e.target === modalHelpEl) modalHelpEl.hidden = true;
});

// Start Animation Loop
requestAnimationFrame(gameLoop);
