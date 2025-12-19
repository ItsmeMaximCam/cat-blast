const GRID_SIZE = 8;
const gridElement = document.getElementById("grid");

// Internal grid data (we'll use this later)
const grid = Array.from({ length: GRID_SIZE }, () =>
  Array(GRID_SIZE).fill(null)
);

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
grid[3][3] = { catType: "orange", isFace: true };
grid[3][4] = { catType: "orange", isFace: false };

renderTile(3, 3, grid[3][3]);
renderTile(3, 4, grid[3][4]);
