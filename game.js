const GRID_SIZE = 8;
const gridElement = document.getElementById("grid");

// Internal grid data (we'll use this later)
const grid = Array.from({ length: GRID_SIZE }, () =>
  Array(GRID_SIZE).fill(null)
);

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

const CAT_TYPES = ["orange", "gray"];

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

  // Clear previous content
  cell.innerHTML = "";

  if (!tile) return;

  const img = document.createElement("img");

  const basePath = "assets/cats/";
  if (tile.isFace) {
    img.src = `${basePath}${tile.catType}_face.png`;
  } else {
    img.src = `${basePath}${tile.catType}_body.png`;
  }

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
  });

  blocksContainer.appendChild(blockEl);
}

// TEMP: spawn one block on load
spawnPreviewBlock();

