const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const COLS = 10,
  ROWS = 20;
let CELL,
  board = [],
  piece,
  nextPiece;
let score = 0,
  lines = 0,
  level = 1,
  dropInterval = 1000;
let lastTime = 0,
  requestId,
  gameOver = false,
  paused = false;

const COLORS = [
  "#000000",
  "#00f",
  "#0f0",
  "#f00",
  "#ff0",
  "#0ff",
  "#f0f",
  "#ffa500",
];
const TETROMINOS = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

// AUDIO
const music = document.getElementById("tetrisMusic");

// BOTOES
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const btnRotate = document.getElementById("btnRotate");
const btnDrop = document.getElementById("btnDrop");

function setButtonsState({ start, pause, reset, move }) {
  startBtn.disabled = !start;
  pauseBtn.disabled = !pause;
  resetBtn.disabled = !reset;
  btnLeft.disabled = !move;
  btnRight.disabled = !move;
  btnRotate.disabled = !move;
  btnDrop.disabled = !move;
}

// PEÇAS
function randomPiece() {
  const keys = Object.keys(TETROMINOS);
  const shape = TETROMINOS[keys[Math.floor(Math.random() * keys.length)]];
  return {
    shape: shape.map((r) => r.slice()),
    x: 3,
    y: 0,
    color: Math.floor(Math.random() * 7) + 1,
  };
}

// RESIZE
function resizeCanvas() {
  const container = document.querySelector(".board-container");
  const width = container.clientWidth;
  const height = container.clientHeight;
  CELL = Math.floor(Math.min(width / COLS, height / ROWS));
  canvas.width = CELL * COLS;
  canvas.height = CELL * ROWS;
  drawBoard();
  drawPiece();
}
window.addEventListener("resize", resizeCanvas);

// DESENHO
function drawCell(x, y, val, context = ctx) {
  context.strokeStyle = "#fff";
  context.lineWidth = 1;
  context.strokeRect(x * CELL, y * CELL, CELL, CELL);
  if (val) {
    context.fillStyle = COLORS[val];
    context.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, y) => row.forEach((val, x) => drawCell(x, y, val)));
}

function drawPiece(p = piece, context = ctx) {
  p.shape.forEach((row, dy) =>
    row.forEach((val, dx) => {
      if (val) drawCell(p.x + dx, p.y + dy, p.color, context);
    })
  );
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const size = nextCanvas.width / 4;
  const nx = Math.floor(
    (nextCanvas.width - nextPiece.shape[0].length * size) / 2
  );
  const ny = Math.floor(
    (nextCanvas.height - nextPiece.shape.length * size) / 2
  );
  nextPiece.shape.forEach((row, dy) =>
    row.forEach((val, dx) => {
      if (val) {
        nextCtx.fillStyle = COLORS[nextPiece.color];
        nextCtx.fillRect(
          nx + dx * size + 1,
          ny + dy * size + 1,
          size - 2,
          size - 2
        );
        nextCtx.strokeStyle = "#fff";
        nextCtx.strokeRect(nx + dx * size, ny + dy * size, size, size);
      }
    })
  );
}

// COLISÃO
function collide(p) {
  return p.shape.some((row, dy) =>
    row.some((val, dx) => {
      const x = p.x + dx,
        y = p.y + dy;
      return val && (x < 0 || x >= COLS || y >= ROWS || board[y][x]);
    })
  );
}

// MERGE & CLEAR
function merge() {
  piece.shape.forEach((row, dy) =>
    row.forEach((val, dx) => {
      if (val) board[piece.y + dy][piece.x + dx] = piece.color;
    })
  );
}

function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map((r) => r[i]).reverse());
}
function rotatePiece() {
  const tmp = piece.shape;
  piece.shape = rotate(piece.shape);
  if (collide(piece)) piece.shape = tmp;
}
function move(dir) {
  piece.x += dir;
  if (collide(piece)) piece.x -= dir;
}
function hardDrop() {
  while (!collide(piece)) piece.y++;
  piece.y--;
  merge();
  clearLines();
  nextTurn();
}

function clearLines() {
  let linesCleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every((val) => val)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      y++;
    }
  }
  if (linesCleared) {
    score += linesCleared * 100;
    lines += linesCleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(200, 1000 - (level - 1) * 100);
    updateStats();
  }
}

function updateStats() {
  document.getElementById("score").textContent = score;
  document.getElementById("lines").textContent = lines;
  document.getElementById("level").textContent = level;
}

// PROXIMA PEÇA
function nextTurn() {
  piece = nextPiece;
  nextPiece = randomPiece();
  drawNext();
  if (collide(piece)) endGame();
}

// UPDATE
function update(time = 0) {
  if (!paused) {
    const delta = time - lastTime;
    if (delta > dropInterval) {
      piece.y++;
      if (collide(piece)) {
        piece.y--;
        merge();
        clearLines();
        nextTurn();
      }
      lastTime = time;
    }
    drawBoard();
    drawPiece();
    requestId = requestAnimationFrame(update);
  }
}

// GAME FUNCTIONS
function startGame() {
  if (gameOver) resetGame();
  paused = false;
  lastTime = 0;
  setButtonsState({ start: false, pause: true, reset: true, move: true });
  update();
  music.play().catch(() => {});
}

function pauseGame() {
  paused = true;
  cancelAnimationFrame(requestId);
  requestId = null;
  setButtonsState({ start: true, pause: false, reset: true, move: false });
  music.pause();
}

function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  piece = randomPiece();
  nextPiece = randomPiece();
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 1000;
  gameOver = false;
  paused = false;
  updateStats();
  drawBoard();
  drawPiece();
  drawNext();
  resizeCanvas();
  document.getElementById("overlayHolder").innerHTML = "";
  setButtonsState({ start: true, pause: false, reset: false, move: false });
  music.pause();
  music.currentTime = 0;
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(requestId);
  requestId = null;
  document.getElementById(
    "overlayHolder"
  ).innerHTML = `<div class="game-over">💀 GAME OVER<br><small>Pressione RESET</small></div>`;
  setButtonsState({ start: true, pause: false, reset: true, move: false });
  music.pause();
}

// CONTROLS
startBtn.onclick = startGame;
pauseBtn.onclick = pauseGame;
resetBtn.onclick = resetGame;
// TOUCH + MOUSE/CLICK CONTROLS
function addControl(button, action) {
  button.addEventListener("touchstart", action);
  button.addEventListener("mousedown", action);
}

addControl(btnLeft, () => move(-1));
addControl(btnRight, () => move(1));
addControl(btnRotate, rotatePiece);
addControl(btnDrop, hardDrop);
// TOUCH CONTROLS
btnLeft.addEventListener("touchstart", () => move(-1));
btnRight.addEventListener("touchstart", () => move(1));
btnRotate.addEventListener("touchstart", rotatePiece);
btnDrop.addEventListener("touchstart", hardDrop);

// KEYBOARD
document.addEventListener("keydown", (e) => {
  if (paused || gameOver) return;
  if (e.key === "ArrowLeft") move(-1);
  if (e.key === "ArrowRight") move(1);
  if (e.key === "ArrowUp") rotatePiece();
  if (e.key === "ArrowDown") hardDrop();
});

// INIT
resetGame();
