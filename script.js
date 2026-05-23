const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo');
const bestScoreEl = document.getElementById('bestScore');
const missesEl = document.getElementById('misses');
const progressBar = document.getElementById('progressBar');
const tipText = document.getElementById('tipText');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const soundBtn = document.getElementById('soundBtn');
const statusEl = document.getElementById('status');
const arena = document.getElementById('arena');
const overlay = document.getElementById('arenaOverlay');

const GAME_TIME = 20;
const LEVEL_STEP = 5;
const STORAGE_KEY = 'catch-the-star-best-score';

let score = 0;
let timeLeft = GAME_TIME;
let level = 1;
let combo = 0;
let misses = 0;
let gameActive = false;
let timerId = null;
let soundEnabled = true;
let bestScore = 0;
let audioCtx = null;

try {
  const savedBest = Number(localStorage.getItem(STORAGE_KEY));
  bestScore = Number.isFinite(savedBest) ? savedBest : 0;
} catch (error) {
  bestScore = 0;
}

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = AudioContextClass ? new AudioContextClass() : null;
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playHitSound() {
  if (!soundEnabled || !audioCtx) {
    return;
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);

  gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.2);
}

function updateHud() {
  scoreEl.textContent = score;
  timerEl.textContent = timeLeft;
  levelEl.textContent = level;
  comboEl.textContent = `${combo}x`;
  bestScoreEl.textContent = bestScore;
  missesEl.textContent = misses;
  progressBar.style.width = `${(timeLeft / GAME_TIME) * 100}%`;
  soundBtn.textContent = soundEnabled ? '🔊 Suara: ON' : '🔇 Suara: OFF';
}

function setStatus(message) {
  statusEl.textContent = message;
}

function showOverlay(title, subtitle) {
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div>
      <p>${title}</p>
      ${subtitle ? `<small>${subtitle}</small>` : ''}
    </div>
  `;
}

function clearTargets() {
  document.querySelectorAll('.target').forEach((target) => target.remove());
}

function saveBestScore() {
  if (score > bestScore) {
    bestScore = score;
    try {
      localStorage.setItem(STORAGE_KEY, String(bestScore));
    } catch (error) {
      // localStorage tidak tersedia, skor tetap berada di memori sesi
    }
  }
}

function getLevelFromScore() {
  return Math.floor(score / LEVEL_STEP) + 1;
}

function getTargetLife() {
  return Math.max(700, 1500 - (level - 1) * 80);
}

function spawnTarget() {
  if (!gameActive) {
    return;
  }

  const target = document.createElement('button');
  target.className = 'target';
  target.innerHTML = '✨';
  target.type = 'button';

  const arenaRect = arena.getBoundingClientRect();
  const size = 72;
  const maxX = Math.max(0, arenaRect.width - size);
  const maxY = Math.max(0, arenaRect.height - size);

  target.style.left = `${Math.random() * maxX}px`;
  target.style.top = `${Math.random() * maxY}px`;

  const removeTarget = () => {
    if (target.isConnected) {
      target.remove();
    }
  };

  const clickHandler = () => {
    score += 1;
    combo += 1;
    playHitSound();

    const nextLevel = getLevelFromScore();
    if (nextLevel !== level) {
      level = nextLevel;
      setStatus(`Level ${level}! Bintang semakin cepat!`);
    } else {
      setStatus('Nice! Combo bertambah!');
    }

    updateHud();
    tipText.textContent = `Tip: combo ${combo}x membuat kamu semakin fokus.`;
    removeTarget();
    spawnTarget();
  };

  target.addEventListener('click', clickHandler);
  arena.appendChild(target);

  window.setTimeout(() => {
    if (!target.isConnected) {
      return;
    }

    removeTarget();
    misses += 1;
    combo = 0;
    updateHud();
    setStatus('Aduh, kamu kelewatan! Tetap fokus!');
    tipText.textContent = 'Tip: jangan terlalu lama, bintang cepat berpindah!';
    spawnTarget();
  }, getTargetLife());
}

function endGame() {
  gameActive = false;
  clearInterval(timerId);
  clearTargets();
  saveBestScore();
  showOverlay('Waktu habis!', `Skor akhir: ${score} • Best: ${bestScore}`);
  setStatus(`Game selesai. Skor akhir: ${score}. Best: ${bestScore}.`);
  startBtn.disabled = false;
}

function resetGame() {
  clearInterval(timerId);
  gameActive = false;
  score = 0;
  timeLeft = GAME_TIME;
  level = 1;
  combo = 0;
  misses = 0;
  clearTargets();
  updateHud();
  showOverlay('Siap?', 'Tangkap bintang sebanyak mungkin!');
  setStatus('Klik mulai untuk bermain.');
  tipText.textContent = 'Tip: raih combo 5 untuk menaikkan level lebih cepat.';
  startBtn.disabled = false;
}

function startGame() {
  resetGame();
  gameActive = true;
  startBtn.disabled = true;
  overlay.style.display = 'none';
  setStatus('Awas, bintang-bintang mulai muncul!');
  initAudio();

  timerId = setInterval(() => {
    timeLeft -= 1;
    updateHud();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  spawnTarget();
}

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);
soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  updateHud();
});

updateHud();
