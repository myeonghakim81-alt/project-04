(function () {
  const canvas = document.getElementById('game-canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');

  const startScreen = document.getElementById('start-screen');
  const stageClearScreen = document.getElementById('stageclear-screen');
  const gameOverScreen = document.getElementById('gameover-screen');
  const stageClearInfo = document.getElementById('stageclear-info');
  const gameOverInfo = document.getElementById('gameover-info');
  const gameOverTitle = document.getElementById('gameover-title');

  const KEY_MAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  const input = new Set();
  let fireHeld = false;
  let weaponTogglePressed = false;

  window.addEventListener('keydown', (e) => {
    if (KEY_MAP[e.code]) {
      input.add(KEY_MAP[e.code]);
      e.preventDefault();
    }
    if (e.code === 'Space') {
      fireHeld = true;
      e.preventDefault();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      if (!weaponTogglePressed) {
        weaponTogglePressed = true;
        if (game.state === 'PLAYING') game.player.toggleWeapon();
      }
      e.preventDefault();
    }
    if (e.code === 'Enter') {
      if (!startScreen.classList.contains('hidden')) startGame();
      else if (!stageClearScreen.classList.contains('hidden')) {
        if (game.stage >= MAX_STAGE) restartGame();
        else goNextStage();
      } else if (!gameOverScreen.classList.contains('hidden')) restartGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (KEY_MAP[e.code]) input.delete(KEY_MAP[e.code]);
    if (e.code === 'Space') fireHeld = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') weaponTogglePressed = false;
  });

  const stageClearBtn = document.getElementById('next-stage-btn');

  document.getElementById('start-btn').addEventListener('click', startGame);
  stageClearBtn.addEventListener('click', () => {
    if (game.stage >= MAX_STAGE) restartGame();
    else goNextStage();
  });
  document.getElementById('restart-btn').addEventListener('click', restartGame);

  const game = {
    state: 'START', // START | PLAYING | STAGE_CLEAR | GAME_OVER
    stage: 1,
    score: 0,
    timeLeft: 0,
    grid: null,
    player: null,
    enemies: [],
    bullets: [],
    items: [],
    enemiesToSpawn: 0,
  };

  function startGame() {
    startScreen.classList.add('hidden');
    game.stage = 1;
    game.score = 0;
    game.timeLeft = timeLimitForStage(1); // 전체 누적 시간 풀 시작
    startStage(game.stage);
  }

  function goNextStage() {
    stageClearScreen.classList.add('hidden');
    game.stage++;
    game.timeLeft += timeLimitForStage(game.stage); // 초기화 대신 누적 추가
    startStage(game.stage);
  }

  function restartGame() {
    gameOverScreen.classList.add('hidden');
    stageClearScreen.classList.add('hidden');
    game.stage = 1;
    game.score = 0;
    game.timeLeft = timeLimitForStage(1);
    startStage(game.stage);
  }

  function startStage(stage) {
    const seed = stage * 7919 + 13;
    game.grid = createMaze(seed);
    game.player = new Player(1 * TILE + TILE / 2, 1 * TILE + TILE / 2);
    game.enemies = [];
    game.bullets = [];
    game.items = [];
    game.enemiesToSpawn = enemiesForStage(stage);
    game.state = 'PLAYING';
    spawnWave();
  }

  function spawnWave() {
    const open = listOpenCells(game.grid);
    while (game.enemies.length < ENEMY_MAX_ACTIVE && game.enemiesToSpawn > 0 && open.length > 0) {
      let candidate = null;
      for (let tries = 0; tries < 20; tries++) {
        const cell = open[Math.floor(Math.random() * open.length)];
        const x = cell.c * TILE + TILE / 2;
        const y = cell.r * TILE + TILE / 2;
        if (Math.hypot(x - game.player.x, y - game.player.y) > 150) {
          candidate = { x, y };
          break;
        }
      }
      if (!candidate) {
        const cell = open[Math.floor(Math.random() * open.length)];
        candidate = { x: cell.c * TILE + TILE / 2, y: cell.r * TILE + TILE / 2 };
      }
      game.enemies.push(new Enemy(candidate.x, candidate.y, pickEnemyKind(game.stage)));
      game.enemiesToSpawn--;
    }
  }

  // 특수탄약이 없고, 남은 적이 전부 스폰되었는데 벽에 막혀 아무 데도 닿을 수 없으면 고립으로 판정
  function isPlayerTrapped() {
    const player = game.player;
    if (player.specialAmmo > 0) return false;
    if (game.enemiesToSpawn > 0) return false;
    if (game.enemies.length === 0) return false;

    const pr = Math.floor(player.y / TILE);
    const pc = Math.floor(player.x / TILE);
    const reachable = floodFillOpen(game.grid, pr, pc);

    const key = (x, y) => Math.floor(y / TILE) + ',' + Math.floor(x / TILE);

    const enemyReachable = game.enemies.some((e) => reachable.has(key(e.x, e.y)));
    if (enemyReachable) return false;

    const ammoItemReachable = game.items.some((i) => i.type === 'ammo' && reachable.has(key(i.x, i.y)));
    if (ammoItemReachable) return false;

    return true;
  }

  function tryDropItem(x, y, chance) {
    if (Math.random() > chance) return;
    const type = Math.random() < 0.5 ? 'ammo' : 'energy';
    game.items.push(new Item(x, y, type));
  }

  function destroyWallAt(x, y) {
    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return;
    if (game.grid[r][c] === WALL_BREAKABLE) {
      game.grid[r][c] = WALL_NONE;
      game.score += SCORE_WALL;
      tryDropItem(c * TILE + TILE / 2, r * TILE + TILE / 2, ITEM_DROP_CHANCE_WALL);
    }
  }

  function update(dt) {
    if (game.state !== 'PLAYING') return;

    game.timeLeft -= dt;
    if (game.timeLeft <= 0) {
      game.timeLeft = 0;
      triggerGameOver('time');
      return;
    }

    const player = game.player;
    player.update(dt, input, game.grid);
    if (fireHeld && player.canFire()) {
      game.bullets.push(player.fire());
    }

    for (const enemy of game.enemies) {
      enemy.update(dt, player, game.grid, game.bullets);
    }

    for (const bullet of game.bullets) {
      bullet.update(dt);
      if (!bullet.alive) continue;

      const c = Math.floor(bullet.x / TILE);
      const r = Math.floor(bullet.y / TILE);
      const cell = r >= 0 && c >= 0 && r < ROWS && c < COLS ? game.grid[r][c] : WALL_SOLID;
      if (cell === WALL_SOLID) {
        bullet.alive = false;
      } else if (cell === WALL_BREAKABLE) {
        if (bullet.breaksWalls) destroyWallAt(bullet.x, bullet.y);
        bullet.alive = false;
      }
      if (!bullet.alive) continue;

      if (bullet.owner === 'enemy' && player.alive) {
        if (Math.hypot(bullet.x - player.x, bullet.y - player.y) < bullet.radius + player.radius) {
          player.takeHit();
          bullet.alive = false;
        }
      } else if (bullet.owner === 'player') {
        for (const enemy of game.enemies) {
          if (!enemy.alive) continue;
          if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < bullet.radius + enemy.radius) {
            enemy.takeHit();
            bullet.alive = false;
            if (!enemy.alive) {
              game.score += SCORE_ENEMY;
              tryDropItem(enemy.x, enemy.y, ITEM_DROP_CHANCE_ENEMY);
            }
            break;
          }
        }
      }
    }

    for (const item of game.items) {
      item.update(dt);
      if (Math.hypot(item.x - player.x, item.y - player.y) < item.radius + player.radius) {
        item.alive = false;
        game.score += SCORE_ITEM;
        if (item.type === 'ammo') player.specialAmmo += ITEM_AMMO_GRANT;
        else player.heal(ITEM_ENERGY_HEAL);
      }
    }

    game.enemies = game.enemies.filter((e) => e.alive);
    game.bullets = game.bullets.filter((b) => b.alive);
    game.items = game.items.filter((i) => i.alive);

    if (game.enemies.length < ENEMY_MAX_ACTIVE && game.enemiesToSpawn > 0) spawnWave();

    if (!player.alive) {
      triggerGameOver('dead');
      return;
    }

    if (isPlayerTrapped()) {
      triggerGameOver('trapped');
      return;
    }

    if (game.enemiesToSpawn <= 0 && game.enemies.length === 0) {
      triggerStageClear();
    }
  }

  function triggerStageClear() {
    game.state = 'STAGE_CLEAR';
    const bonus = Math.round(game.timeLeft * TIME_BONUS_PER_SEC);
    game.score += bonus;

    if (game.stage >= MAX_STAGE) {
      stageClearInfo.innerHTML =
        `🏆 전체 ${MAX_STAGE}스테이지를 모두 클리어했습니다!<br/>최종 점수: ${game.score}`;
      stageClearBtn.textContent = '처음부터 다시';
    } else {
      stageClearInfo.innerHTML =
        `스테이지 ${game.stage} 클리어!<br/>남은 시간 보너스: +${bonus}<br/>누적 시간: ${Math.ceil(game.timeLeft)}s<br/>현재 점수: ${game.score}`;
      stageClearBtn.textContent = '다음 스테이지';
    }
    stageClearScreen.classList.remove('hidden');
  }

  function triggerGameOver(reason) {
    game.state = 'GAME_OVER';
    gameOverTitle.textContent = 'GAME OVER';
    const reasonText =
      reason === 'time' ? '전체 제한시간 초과' :
      reason === 'trapped' ? '특수탄약 소진 - 더 이상 나아갈 수 없음' :
      '에너지 소진';
    gameOverInfo.innerHTML = `${reasonText}<br/>도달 스테이지: ${game.stage}<br/>최종 점수: ${game.score}`;
    gameOverScreen.classList.remove('hidden');
  }

  function drawHUD() {
    ctx.fillStyle = '#151a28';
    ctx.fillRect(0, 0, CANVAS_W, HUD_TOP);
    ctx.fillRect(0, HUD_TOP + PLAY_H, CANVAS_W, HUD_BOTTOM);

    ctx.fillStyle = '#e8ecf4';
    ctx.font = 'bold 14px sans-serif';
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'left';
    ctx.fillText(`STAGE ${game.stage}`, 12, HUD_TOP / 2);

    // 에너지 하트
    const heartsX = 130;
    for (let i = 0; i < game.player.maxEnergy; i++) {
      ctx.fillStyle = i < game.player.energy ? '#ff5d5d' : '#3a3f4d';
      ctx.beginPath();
      const hx = heartsX + i * 26;
      const hy = HUD_TOP / 2;
      ctx.arc(hx - 5, hy - 3, 6, 0, Math.PI * 2);
      ctx.arc(hx + 5, hy - 3, 6, 0, Math.PI * 2);
      ctx.moveTo(hx - 10, hy - 1);
      ctx.lineTo(hx, hy + 9);
      ctx.lineTo(hx + 10, hy - 1);
      ctx.closePath();
      ctx.fill();
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = game.timeLeft < 10 ? '#ff5d5d' : '#e8ecf4';
    ctx.fillText(`TIME ${Math.ceil(game.timeLeft)}s`, CANVAS_W - 12, HUD_TOP / 2);

    const bottomY = HUD_TOP + PLAY_H + HUD_BOTTOM / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = game.player.weapon === 'special' ? '#ffd23f' : '#e8ecf4';
    const weaponLabel = game.player.weapon === 'special' ? '특수' : '일반';
    const weaponText = `무기: ${weaponLabel}`;
    ctx.fillText(weaponText, 12, bottomY);
    const weaponWidth = ctx.measureText(weaponText).width;
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(`특수탄 ${game.player.specialAmmo}`, 12 + weaponWidth + 14, bottomY);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8ecf4';
    ctx.fillText(`SCORE ${game.score}`, CANVAS_W / 2, bottomY);

    ctx.textAlign = 'right';
    const remaining = game.enemiesToSpawn + game.enemies.length;
    ctx.fillText(`남은 적 ${remaining}`, CANVAS_W - 12, bottomY);
  }

  function render() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (game.grid) {
      ctx.save();
      ctx.translate(0, HUD_TOP);
      ctx.fillStyle = '#11151f';
      ctx.fillRect(0, 0, PLAY_W, PLAY_H);
      drawMaze(ctx, game.grid);
      for (const item of game.items) item.draw(ctx);
      for (const bullet of game.bullets) bullet.draw(ctx);
      for (const enemy of game.enemies) enemy.draw(ctx);
      if (game.player) game.player.draw(ctx);
      ctx.restore();
      drawHUD();
    }
  }

  window.__game = game; // 디버그/테스트용 참조

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
