const GRID_SIZE = 8;
const gridElement = document.getElementById("grid");

// Internal grid data (we'll use this later)
const grid = Array.from({ length: GRID_SIZE }, () =>
  Array(GRID_SIZE).fill(null)
);

let lastPreview = {
  valid: false,
  cells: []
};

function spawnFloatingScore(text, x, y) {
  const el = document.createElement("div");
  el.className = "floating-score";
  el.textContent = text;

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 800);
}

let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;

  scoreSound.play().then(() => {
    scoreSound.pause();
    scoreSound.currentTime = 0;
    audioUnlocked = true;
  }).catch(() => {});
}



const scoreSound = new Audio("assets/sounds/meow.wav");
scoreSound.volume = 0.6;
const DRAG_BIAS = 10; // tweak 4–8px to taste
let score = 0;
let bestScore = Number(localStorage.getItem("catblast_best")) || 0;

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");

function updateScoreUI() {
  scoreEl.textContent = `Score: ${score}`;
  bestScoreEl.textContent = `Best ❤️: ${bestScore}`;
}
updateScoreUI();



let activePointerId = null;

const BLOCK_PRESETS = [
  // Single
  [[0, 0]],

  // Lines
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2]],

  // L shapes
  [[0, 0], [1, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0], [0, 1]],
];

const CAT_TYPES = ["orange", "gray" , "white"];

function pickFaceIndex(shape) {
  // Try center-ish tile first
  const centerX =
    shape.reduce((sum, p) => sum + p[0], 0) / shape.length;
  const centerY =
    shape.reduce((sum, p) => sum + p[1], 0) / shape.length;

  let bestIndex = 0;
  let bestDist = Infinity;

  shape.forEach((p, i) => {
    const dx = p[0] - centerX;
    const dy = p[1] - centerY;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  });

  return bestIndex;
}


// Create the grid visually
for (let row = 0; row < GRID_SIZE; row++) {
  for (let col = 0; col < GRID_SIZE; col++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    // Store position info on the element
    cell.dataset.row = row;
    cell.dataset.col = col;

    gridElement.appendChild(cell);
  }
}

function renderTile(row, col, tile) {
  const index = row * GRID_SIZE + col;
  const cell = gridElement.children[index];

  cell.innerHTML = "";

  if (!tile) return;

  const img = document.createElement("img");

  const basePath = "assets/cats/";
  img.src = tile.isFace
    ? `${basePath}${tile.catType}_face.png`
    : `${basePath}${tile.catType}_body.png`;

if (tile.isFace) {
  img.classList.add("face");
  img.style.animationDelay = `${Math.random() * 2}s`; //desync the wiggle
}


  img.classList.add("pop"); 

  cell.appendChild(img);
}


// TEMP TEST TILE
//grid[3][3] = { catType: "orange", isFace: true };
//grid[3][4] = { catType: "orange", isFace: false };

//renderTile(3, 3, grid[3][3]);
//renderTile(3, 4, grid[3][4]);

const blocksContainer = document.getElementById("blocks");

function spawnPreviewBlock() {
  blocksContainer.innerHTML = "";

  const shape =
    BLOCK_PRESETS[Math.floor(Math.random() * BLOCK_PRESETS.length)];
  const catType =
    CAT_TYPES[Math.floor(Math.random() * CAT_TYPES.length)];

  const faceIndex = pickFaceIndex(shape);

  // Determine block grid size
  const maxX = Math.max(...shape.map(p => p[0]));
  const maxY = Math.max(...shape.map(p => p[1]));

  const blockEl = document.createElement("div");
  blockEl.classList.add("block");
  blockEl.style.gridTemplateColumns = `repeat(${maxX + 1}, 32px)`;
  blockEl.style.gridTemplateRows = `repeat(${maxY + 1}, 32px)`;
  blockEl.style.display = "grid";
blockEl.style.width = `${(maxX + 1) * 32}px`;
blockEl.style.height = `${(maxY + 1) * 32}px`;


  shape.forEach((pos, i) => {
    const tile = document.createElement("div");
    tile.classList.add("block-tile");

    const img = document.createElement("img");
    const isFace = i === faceIndex;

    img.src = `assets/cats/${catType}_${isFace ? "face" : "body"}.png`;

    tile.style.gridColumn = pos[0] + 1;
    tile.style.gridRow = pos[1] + 1;

    tile.appendChild(img);
    blockEl.appendChild(tile);

    blockEl.style.background = "rgba(255,0,0,0.2)";
  });
  
  activeBlock = {
    shape,
    catType,
    faceIndex,
    element: blockEl
  };
  
  blockEl.style.cursor = "grab";

  blockEl.addEventListener("pointerdown", (e) => {
    unlockAudio();
    e.preventDefault(); 
    isDragging = true;
    activePointerId = e.pointerId;

    // store initial pointer pos
    lastPointer.x = e.clientX;
    lastPointer.y = e.clientY;

 if (blockEl.hasPointerCapture(activePointerId) === false) {
  blockEl.setPointerCapture(activePointerId);
}

    const rect = blockEl.getBoundingClientRect();
    dragOffset.x = rect.width / 2 - DRAG_BIAS;
    dragOffset.y = rect.height / 2 - DRAG_BIAS;

    blockEl.style.position = "absolute";
    blockEl.style.zIndex = 1000;
    blockEl.style.cursor = "grabbing";
  });

  blocksContainer.appendChild(blockEl);
  blockEl.style.position = "relative";
blockEl.style.left = "auto";
blockEl.style.top = "auto";

// GAME OVER CHECK
if (!canPlaceBlockAnywhere(shape)) {
  triggerGameOver();
}

}

let activeBlock = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let lastPointer = { x: 0, y: 0 };

document.addEventListener("pointermove", (e) => {
  if (!isDragging || !activeBlock) return;
  e.preventDefault(); 

  // update last known pointer coords
  lastPointer.x = e.clientX;
  lastPointer.y = e.clientY;

  activeBlock.element.style.left = e.clientX - dragOffset.x + "px";
  activeBlock.element.style.top = e.clientY - dragOffset.y + "px";

  previewPlacement(e.clientX, e.clientY);
});

document.addEventListener("pointerup", (e) => {
  if (!isDragging || !activeBlock) return;

  try {
     if (activeBlock.element && typeof activeBlock.element.releasePointerCapture === "function") {
      activeBlock.element.releasePointerCapture(activePointerId);
    }
  } catch (_) {}

  const px = (e && typeof e.clientX === "number") ? e.clientX : lastPointer.x;
  const py = (e && typeof e.clientY === "number") ? e.clientY : lastPointer.y;

  previewPlacement(px, py);

  if (lastPreview.valid) {
    placeActiveBlock();
  }

  clearPreview();
  isDragging = false;
  activePointerId = null;

  if (activeBlock && activeBlock.element) {
    activeBlock.element.style.cursor = "grab";
  }
});



function placeActiveBlock() {
  const { shape, catType, faceIndex } = activeBlock;

  // Get the base position from the first preview cell
  const firstCell = lastPreview.cells[0];
  const firstShapeOffset = shape[0];
  const baseRow = firstCell.row - firstShapeOffset[1];
  const baseCol = firstCell.col - firstShapeOffset[0];

  lastPreview.cells.forEach((pos) => {
    const shapeIndex = activeBlock.shape.findIndex(
      ([dx, dy]) =>
        pos.row === baseRow + dy && pos.col === baseCol + dx
    );

    const isFace = shapeIndex === faceIndex;

    grid[pos.row][pos.col] = {
      catType,
      isFace
    };

    renderTile(pos.row, pos.col, grid[pos.row][pos.col]);

  });

      clearCompletedLines();

  // Remove preview block
  activeBlock.element.remove();
  activeBlock = null;

  // Reset preview state
  lastPreview.valid = false;
  lastPreview.cells = [];

  // Spawn next block
  spawnPreviewBlock();
}


function clearPreview() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove(
      "preview-valid",
      "preview-invalid",
      "preview-clear"
    );
  });
}

function previewPlacement(mouseX, mouseY) {
  clearPreview();

  const gridRect = gridElement.getBoundingClientRect();

  if (
    mouseX < gridRect.left ||
    mouseX > gridRect.right ||
    mouseY < gridRect.top ||
    mouseY > gridRect.bottom
  ) return;

  const cellSize = gridRect.width / GRID_SIZE;

  const baseCol = Math.floor((mouseX - gridRect.left) / cellSize);
  const baseRow = Math.floor((mouseY - gridRect.top) / cellSize);

  let valid = true;
  const targetCells = [];

  activeBlock.shape.forEach(([dx, dy]) => {
    const row = baseRow + dy;
    const col = baseCol + dx;

    if (
      row < 0 ||
      row >= GRID_SIZE ||
      col < 0 ||
      col >= GRID_SIZE ||
      grid[row][col] !== null
    ) {
      valid = false;
    } else {
      targetCells.push({ row, col });
    }
  });

  // Only simulate clears if placement is valid
  if (valid) {
    const simulated = grid.map(row => row.slice());

    targetCells.forEach(({ row, col }) => {
      simulated[row][col] = {};
    });

    const clears = getPotentialClears(simulated);

    clears.rows.forEach(r => {
      for (let c = 0; c < GRID_SIZE; c++) {
        const index = r * GRID_SIZE + c;
        gridElement.children[index].classList.add("preview-clear");
      }
    });

    clears.cols.forEach(c => {
      for (let r = 0; r < GRID_SIZE; r++) {
        const index = r * GRID_SIZE + c;
        gridElement.children[index].classList.add("preview-clear");
      }
    });
  }

  lastPreview.valid = valid;
  lastPreview.cells = valid ? targetCells : [];

  targetCells.forEach(({ row, col }) => {
    const index = row * GRID_SIZE + col;
    const cell = gridElement.children[index];
    cell.classList.add(valid ? "preview-valid" : "preview-invalid");
  });
}

function clearCompletedLines() {
  const rowsToClear = [];
  const colsToClear = [];

  // Check rows
  for (let r = 0; r < GRID_SIZE; r++) {
    let full = true;
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) rowsToClear.push(r);
  }

  // Check columns
  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) colsToClear.push(c);
  }

  // Nothing to clear
  if (rowsToClear.length === 0 && colsToClear.length === 0) return;

  // Clear rows
  rowsToClear.forEach(r => {
    for (let c = 0; c < GRID_SIZE; c++) {
      grid[r][c] = null;
      renderTile(r, c, null);
    }
  });

  // Clear columns
  colsToClear.forEach(c => {
    for (let r = 0; r < GRID_SIZE; r++) {
      grid[r][c] = null;
      renderTile(r, c, null);
    }
  });

const linesCleared = rowsToClear.length + colsToClear.length;


if (linesCleared > 0) {

scoreSound.currentTime = 0; // rewind so rapid clears still play
scoreSound.playbackRate = 0.95 + Math.random() * 0.1;
scoreSound.play().catch(() => {});

  score += linesCleared * 100;
    const points = linesCleared * 100;

rowsToClear.forEach(r => {
  for (let c = 0; c < GRID_SIZE; c++) {
    const index = r * GRID_SIZE + c;
    gridElement.children[index].classList.add("clearing");
  }
});

  gridElement.style.animationDuration = `${0.15 + linesCleared * 0.05}s`;
  gridElement.classList.add("shake");
    setTimeout(() => {
    gridElement.classList.remove("shake");
  }, 250);

   const gridRect = gridElement.getBoundingClientRect();
    spawnFloatingScore(
    `+${points}`,
    gridRect.left + gridRect.width / 2 - 20,
    gridRect.top + gridRect.height / 2);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("catblast_best", bestScore);
  }

  updateScoreUI();
}
}

function canPlaceBlockAnywhere(shape) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {

      let valid = true;

      for (const [dx, dy] of shape) {
        const r = row + dy;
        const c = col + dx;

        if (
          r < 0 ||
          r >= GRID_SIZE ||
          c < 0 ||
          c >= GRID_SIZE ||
          grid[r][c] !== null
        ) {
          valid = false;
          break;
        }
      }

      if (valid) return true;
    }
  }

  return false;
}

const gameOverEl = document.getElementById("game-over");
const restartBtn = document.getElementById("restart");

function triggerGameOver() {
  gameOverEl.hidden = false;
}

restartBtn.addEventListener("click", () => {
  // Clear grid
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      grid[r][c] = null;
      renderTile(r, c, null);
    }
  }

  score = 0;
  updateScoreUI();

  gameOverEl.hidden = true;
  spawnPreviewBlock();
});

function getPotentialClears(simulatedGrid) {
  const rows = [];
  const cols = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    if (simulatedGrid[r].every(cell => cell !== null)) {
      rows.push(r);
    }
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (simulatedGrid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }

  return { rows, cols };
}




// TEMP: spawn one block on load
spawnPreviewBlock();

