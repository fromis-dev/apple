const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const rows = 10;
const cols = 17;
const squareSize = 50;
const padding = squareSize;

canvas.width = cols * squareSize + padding * 2;
canvas.height = rows * squareSize + padding * 2;

let scale = 1;

function updateScale() {
  scale = Math.min(
    1,
    window.innerWidth / canvas.width,
    window.innerHeight / canvas.height
  );
  canvas.style.transform = `scale(${scale})`;
  canvas.style.transformOrigin = "center";

  console.log(window.innerWidth > window.innerHeight ? "row" : "column");
  const info = document.querySelector("#info");
  info.style.flexDirection =
    window.innerWidth > window.innerHeight ? "row" : "column";
  if (window.innerHeight < 450) {
    const container = document.querySelector("#container");
    container.style.display = "block";
    canvas.style.transform = "scale(0.5)";
    canvas.style.transformOrigin = "top";
  }
}

window.addEventListener("resize", updateScale);
updateScale();

function getEventPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  if (e.touches) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  } else {
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }
}

const offsetX = padding;
const offsetY = padding;

let grid,
  isDragging,
  startX,
  startY,
  currentX,
  currentY,
  selectedSquares,
  timeLeft,
  timerId;

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then((registration) =>
      console.log("Service Worker registered:", registration)
    )
    .catch((error) =>
      console.log("Service Worker registration failed:", error)
    );
}

function startGame() {
  overlay.style.display = "none";
  initGame();
}

function initGame() {
  grid = Array.from({ length: rows }, (_, row) =>
    Array.from(
      { length: cols },
      (_, col) =>
        new Square(
          offsetX + col * squareSize,
          offsetY + row * squareSize,
          squareSize
        )
    )
  );
  timeLeft = 120;
  isDragging = false;
  selectedSquares = [];
  drawGrid();
  updateScore();
  updateTimer();
}

// Square 객체 정의
class Square {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.value = Math.floor(Math.random() * 9) + 1;
    this.active = true;
  }

  getCenter() {
    return { cx: this.x + this.size / 2, cy: this.y + this.size / 2 };
  }

  draw(color = "#fff") {
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(this.x, this.y, this.size, this.size);
    if (this.active) {
      ctx.fillStyle = "#000";
      ctx.font = `${this.size / 2}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.value, this.x + this.size / 2, this.y + this.size / 2);
    }
  }
}

// 그리드 그리기
function drawGrid(selectedSquares = [], color = "#fff") {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  grid.forEach((row) =>
    row.forEach((square) => {
      const isSelected = selectedSquares.includes(square);
      square.draw(isSelected ? color : "#fff");
    })
  );
}

function updateScore() {
  const score = grid.flat().filter((square) => !square.active).length;
  document.getElementById("score").textContent = `Score: ${score}`;
}

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById("timer").textContent = `Time: ${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;

  if (timeLeft > 0) {
    timeLeft--;
    setTimeout(updateTimer, 1000);
  } else {
    const score = grid.flat().filter((square) => !square.active).length;
    const message = document.querySelector(
      "#overlay > .container > #overlayMessage"
    );
    message.innerText = "Score : " + score;
    overlay.style.display = "flex";
  }
}

function handleStart(e) {
  e.preventDefault();
  isDragging = true;
  const pos = getEventPos(e);
  startX = pos.x;
  startY = pos.y;
}

function handleMove(e) {
  if (!isDragging) return;
  const pos = getEventPos(e);
  currentX = pos.x;
  currentY = pos.y;

  const minX = Math.min(startX, currentX);
  const maxX = Math.max(startX, currentX);
  const minY = Math.min(startY, currentY);
  const maxY = Math.max(startY, currentY);

  let sum = 0;
  selectedSquares = [];
  grid.forEach((row) =>
    row.forEach((square) => {
      const { cx, cy } = square.getCenter();
      if (
        cx >= minX &&
        cx <= maxX &&
        cy >= minY &&
        cy <= maxY &&
        square.active
      ) {
        selectedSquares.push(square);
        sum += square.value;
      }
    })
  );

  const color = sum === 10 ? "#b0e57c" : "#ddd";
  drawGrid(selectedSquares, color);

  ctx.strokeStyle = "grey";
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
}

function handleEnd() {
  isDragging = false;
  let sum = selectedSquares.reduce((acc, square) => acc + square.value, 0);
  if (sum === 10) {
    selectedSquares.forEach((square) => (square.active = false));
    updateScore();
  }
  drawGrid();
}

canvas.addEventListener("mousedown", handleStart);
canvas.addEventListener("mousemove", handleMove);
canvas.addEventListener("mouseup", handleEnd);

canvas.addEventListener("touchstart", handleStart);
canvas.addEventListener("touchmove", handleMove);
canvas.addEventListener("touchend", handleEnd);

document.body.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);

function copyGameUrl() {
  const shareUrl = window.location.href;
  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      alert("Game URL copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy URL: ", err);
    });
}
