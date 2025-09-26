(() => {
  const COLS = 10,
    ROWS = 20;
  let CELL = 24;

  const cvs = document.getElementById("game");
  const ctx = cvs.getContext("2d");
  const nextCanvas = document.getElementById("next");
  const nctx = nextCanvas.getContext("2d");
  const overlayHolder = document.getElementById("overlayHolder");

  const scoreEl = document.getElementById("score");
  const levelEl = document.getElementById("level");
  const linesEl = document.getElementById("lines");

  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");

  const btnLeft = document.getElementById("btnLeft");
  const btnRight = document.getElementById("btnRight");
  const btnRotate = document.getElementById("btnRotate");
  const btnDrop = document.getElementById("btnDrop");

  const music = document.getElementById("tetrisMusic");

  const COLORS = [
    "#000",
    "#ff5f6d",
    "#ffc371",
    "#9be15d",
    "#00d2ff",
    "#7a9cff",
    "#f58fff",
    "#ffd86b",
  ];

  const TETROMINOS = {
    I: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
    ],
    J: [
      [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
      ],
      [
        [0, 2, 2],
        [0, 2, 0],
        [0, 2, 0],
      ],
      [
        [0, 0, 0],
        [2, 2, 2],
        [0, 0, 2],
      ],
      [
        [0, 2, 0],
        [0, 2, 0],
        [2, 2, 0],
      ],
    ],
    L: [
      [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
      ],
      [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3],
      ],
      [
        [0, 0, 0],
        [3, 3, 3],
        [3, 0, 0],
      ],
      [
        [3, 3, 0],
        [0, 3, 0],
        [0, 3, 0],
      ],
    ],
    O: [
      [
        [4, 4],
        [4, 4],
      ],
    ],
    S: [
      [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
      ],
      [
        [0, 5, 0],
        [0, 5, 5],
        [0, 0, 5],
      ],
    ],
    T: [
      [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0],
      ],
      [
        [0, 6, 0],
        [0, 6, 6],
        [0, 6, 0],
      ],
      [
        [0, 0, 0],
        [6, 6, 6],
        [0, 6, 0],
      ],
      [
        [0, 6, 0],
        [6, 6, 0],
        [0, 6, 0],
      ],
    ],
    Z: [
      [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
      ],
      [
        [0, 0, 7],
        [0, 7, 7],
        [0, 7, 0],
      ],
    ],
  };

  const PIECE_KEYS = Object.keys(TETROMINOS);

  let grid = [];
  let current = null;
  let nextPiece = null;
  let dropInterval = 800;
  let dropTimer = null;
  let score = 0,
    level = 1,
    lines = 0;
  let gameOver = false,
    paused = true;

  // -------------------- Funções do jogo --------------------
  function makeGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function randomPiece() {
    const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
    const rotations = TETROMINOS[key];
    const matrix = rotations[0];
    return {
      key,
      rotations,
      rotation: 0,
      matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: -matrix.length,
    };
  }

  function drawCell(x, y, val) {
    if (!val) return;
    ctx.fillStyle = COLORS[val];
    ctx.shadowColor = "#00d2ff88";
    ctx.shadowBlur = 6;
    ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
    ctx.shadowBlur = 0;
  }

  function draw() {
    if (!grid) return;
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // desenha grid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = grid[r][c] ? COLORS[grid[r][c]] : "#06121a";
        ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
        ctx.strokeStyle = "#fff3";
        ctx.strokeRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
      }
    }

    // desenha peça atual
    if (current) {
      const m = current.rotations[current.rotation];
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (m[r][c]) drawCell(current.x + c, current.y + r, m[r][c]);
        }
      }
    }
  }

  function collide(xOffset = 0, yOffset = 0, rot = null) {
    const m =
      rot === null
        ? current.rotations[current.rotation]
        : current.rotations[rot];
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) {
          const x = current.x + c + xOffset;
          const y = current.y + r + yOffset;
          if (x < 0 || x >= COLS || y >= ROWS) return true;
          if (y >= 0 && grid[y][x]) return true;
        }
      }
    }
    return false;
  }

  function freeze() {
    const m = current.rotations[current.rotation];
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) {
          const x = current.x + c;
          const y = current.y + r;
          if (y >= 0) grid[y][x] = m[r][c];
          else {
            gameOver = true;
            stop();
            showOverlay("GAME OVER");
          }
        }
      }
    }
    clearLines();
    spawn();
  }

  function clearLines() {
    let rowCount = 0;
    outer: for (let r = ROWS - 1; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) if (!grid[r][c]) continue outer;
      grid.splice(r, 1);
      grid.unshift(Array(COLS).fill(0));
      rowCount++;
      r++;
    }
    if (rowCount > 0) {
      lines += rowCount;
      score += [0, 40, 100, 300, 1200][rowCount] * level;
      scoreEl.textContent = score;
      linesEl.textContent = lines;

      // Nível sobe a cada 5 linhas
      const newLevel = Math.floor(lines / 5) + 1;
      if (newLevel !== level) {
        level = newLevel;
        levelEl.textContent = level;

        // Faz o dropInterval diminuir a cada nível
        dropInterval = Math.max(80, 800 - (level - 1) * 50); // a cada 5 linhas + nível, cai 50ms
        if (!paused) restartTimer();
      }
    }
  }

  function spawn() {
    current = nextPiece || randomPiece();
    nextPiece = randomPiece();
    current.x = Math.floor(
      (COLS - current.rotations[current.rotation][0].length) / 2
    );
    current.y = -current.rotations[current.rotation].length;
    drawNext();
    if (collide()) {
      gameOver = true;
      stop();
      showOverlay("GAME OVER");
    }
  }

  function rotate(dir = 1) {
    const len = current.rotations.length;
    const newRot = (current.rotation + dir + len) % len;
    if (!collide(0, 0, newRot)) current.rotation = newRot;
  }

  function move(offset) {
    if (!collide(offset, 0)) current.x += offset;
  }

  function drop() {
    if (!current) return;
    current.y++;
    if (collide(0, 0)) {
      current.y--;
      freeze();
    }
    draw();
  }

  function hardDrop() {
    if (!current) return;
    while (!collide(0, 1)) current.y++;
    freeze();
    draw();
  }

  function start() {
    if (gameOver) reset();
    paused = false;
    hideOverlay();
    restartTimer();
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    music.play();
  }

  function stop() {
    clearInterval(dropTimer);
    dropTimer = null;
    paused = true;
  }

  function restartTimer() {
    clearInterval(dropTimer);
    dropTimer = setInterval(() => {
      if (!paused && !gameOver) drop();
    }, dropInterval);
  }

  function reset() {
    grid = makeGrid();
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    paused = true;
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
    nextPiece = randomPiece();
    spawn();
    draw();
    hideOverlay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
  }

  function drawNext() {
    if (!nextPiece) return;
    nctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const m = nextPiece.rotations[nextPiece.rotation];
    const size = Math.min(
      nextCanvas.width / m[0].length,
      nextCanvas.height / m.length
    );
    const offsetX = (nextCanvas.width - m[0].length * size) / 2;
    const offsetY = (nextCanvas.height - m.length * size) / 2;
    nctx.save();
    nctx.translate(offsetX, offsetY);
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) {
          nctx.fillStyle = COLORS[m[r][c]];
          nctx.shadowColor = "#00d2ff55";
          nctx.shadowBlur = 4;
          nctx.fillRect(c * size, r * size, size - 2, size - 2);
          nctx.strokeStyle = "#fff3";
          nctx.strokeRect(c * size, r * size, size - 2, size - 2);
          nctx.shadowBlur = 0;
        }
      }
    }
    nctx.restore();
  }

  function showOverlay(text) {
    overlayHolder.innerHTML = `
    <div class="game-over text-center">
      <h3>${text}</h3>
      <p class="small">Pressione o botão Start para reiniciar</p>
      <button id="overlayStart" class="btn btn-success btn-sm mt-2">Start</button>
    </div>`;

    // Adiciona o listener para o botão dentro do overlay
    const overlayStart = document.getElementById("overlayStart");
    overlayStart.addEventListener("click", () => {
      reset();
      hideOverlay();
    });
  }

  function hideOverlay() {
    overlayHolder.innerHTML = "";
  }

  function resizeCanvas() {
    const wrap = document.querySelector(".board-container");
    const w = wrap.clientWidth;
    const h = window.innerHeight - 200;

    CELL = Math.floor(Math.min(w / COLS, h / ROWS));

    cvs.width = COLS * CELL;
    cvs.height = ROWS * CELL;

    const nextSize = Math.min(80, CELL * 2);
    nextCanvas.width = nextSize;
    nextCanvas.height = nextSize;

    draw();
    drawNext();
  }

  window.addEventListener("resize", resizeCanvas);

  // -------------------- Controles --------------------
  document.addEventListener("keydown", (e) => {
    if (gameOver || paused) return;
    switch (e.key) {
      case "ArrowLeft":
        move(-1);
        draw();
        break;
      case "ArrowRight":
        move(1);
        draw();
        break;
      case "ArrowUp":
        rotate(1);
        draw();
        break;
      case "ArrowDown":
        drop();
        break;
      case " ":
        e.preventDefault();
        hardDrop();
        break;
      case "p":
        paused = !paused;
        paused ? stop() : restartTimer();
        break;
    }
  });

  btnLeft.addEventListener("click", () => {
    if (!paused && !gameOver) {
      move(-1);
      draw();
    }
  });
  btnRight.addEventListener("click", () => {
    if (!paused && !gameOver) {
      move(1);
      draw();
    }
  });
  btnRotate.addEventListener("click", () => {
    if (!paused && !gameOver) {
      rotate(1);
      draw();
    }
  });
  btnDrop.addEventListener("click", () => {
    if (!paused && !gameOver) drop();
  });

  startBtn.addEventListener("click", start);
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    paused ? stop() : restartTimer();
  });
  resetBtn.addEventListener("click", reset);

  // -------------------- Inicialização --------------------
  reset();
  resizeCanvas();
})();
