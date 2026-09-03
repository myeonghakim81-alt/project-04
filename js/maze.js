// 시드 기반 미로(파괴 가능한 벽 필드) 생성 - 배틀시티 스타일
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createMaze(seed, density) {
  const wallDensity = density === undefined ? WALL_DENSITY : density;
  const rng = mulberry32(seed);
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      let cell = WALL_NONE;
      const isBorder = r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1;
      const isPillar = r % 2 === 0 && c % 2 === 0;
      if (isBorder || isPillar) {
        cell = WALL_SOLID;
      } else if (rng() < wallDensity) {
        cell = WALL_BREAKABLE;
      }
      row.push(cell);
    }
    grid.push(row);
  }

  // 플레이어 스폰(좌상단)과 적 스폰 후보(우상, 좌하, 우하) 주변은 개방
  clearArea(grid, 1, 1);
  clearArea(grid, COLS - 2, 1);
  clearArea(grid, 1, ROWS - 2);
  clearArea(grid, COLS - 2, ROWS - 2);
  clearArea(grid, Math.floor(COLS / 2), Math.floor(ROWS / 2));

  return grid;
}

function clearArea(grid, cx, cy) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const r = cy + dy;
      const c = cx + dx;
      if (r <= 0 || c <= 0 || r >= ROWS - 1 || c >= COLS - 1) continue;
      if (r % 2 === 0 && c % 2 === 0) continue; // 기둥은 유지
      grid[r][c] = WALL_NONE;
    }
  }
}

function tileAt(grid, px, py) {
  const c = Math.floor(px / TILE);
  const r = Math.floor(py / TILE);
  if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return WALL_SOLID;
  return grid[r][c];
}

function isSolidAt(grid, px, py) {
  return tileAt(grid, px, py) !== WALL_NONE;
}

// 원형(반지름 radius) 충돌체가 (x,y)에 있을 때 벽과 겹치는지 검사
function circleHitsWall(grid, x, y, radius) {
  const points = [
    [x - radius, y - radius],
    [x + radius, y - radius],
    [x - radius, y + radius],
    [x + radius, y + radius],
    [x, y - radius],
    [x, y + radius],
    [x - radius, y],
    [x + radius, y],
  ];
  for (const [px, py] of points) {
    if (isSolidAt(grid, px, py)) return true;
  }
  return false;
}

function listOpenCells(grid) {
  const cells = [];
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (grid[r][c] === WALL_NONE) cells.push({ r, c });
    }
  }
  return cells;
}

function drawMaze(ctx, grid) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (cell === WALL_NONE) continue;
      const x = c * TILE;
      const y = r * TILE;
      if (cell === WALL_SOLID) {
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
      } else {
        ctx.fillStyle = '#b7622f';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = '#7c3f1d';
        ctx.lineWidth = 1;
        for (let i = 0; i < TILE; i += 10) {
          ctx.beginPath();
          ctx.moveTo(x, y + i);
          ctx.lineTo(x + TILE, y + i);
          ctx.stroke();
        }
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      }
    }
  }
}
