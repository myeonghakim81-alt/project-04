(function () {
  const canvas = document.getElementById('game-canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');

  const titleScreen = document.getElementById('title-screen');
  const difficultyScreen = document.getElementById('difficulty-screen');
  const stageClearScreen = document.getElementById('stageclear-screen');
  const gameOverScreen = document.getElementById('gameover-screen');
  const stageClearInfo = document.getElementById('stageclear-info');
  const stageClearTitle = document.getElementById('stageclear-title');
  const gameOverInfo = document.getElementById('gameover-info');
  const gameOverTitle = document.getElementById('gameover-title');
  const continueBtn = document.getElementById('continue-btn');
  const restartBtn = document.getElementById('restart-btn');
  const stageClearBtn = document.getElementById('next-stage-btn');

  const KEY_MAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  const input = new Set();
  let weaponTogglePressed = false;

  // 발사 버튼을 누른 시각(performance.now(), 안 누르고 있으면 null).
  // requestAnimationFrame 루프의 프레임 단위 상태 비교 대신 이벤트 자체에서 직접
  // 누른/뗀 시각을 기록해서, 화면 전환 등으로 프레임이 스킵되어도 어긋나지 않게 한다.
  let fireHoldStartTime = null;

  function handleFirePress() {
    if (fireHoldStartTime !== null) return; // 이미 누르고 있음 (키 반복 등) - 무시
    fireHoldStartTime = performance.now();
    if (game.player) game.player.fireHeld = true;
    if (game.state === 'PLAYING' && game.player.canFire()) {
      game.bullets.push(game.player.fire());
    }
  }

  function handleFireRelease() {
    if (fireHoldStartTime === null) return;
    const heldSeconds = (performance.now() - fireHoldStartTime) / 1000;
    fireHoldStartTime = null;
    if (game.player) game.player.fireHeld = false;
    if (game.state === 'PLAYING' && game.player.specialAmmo <= 0 && heldSeconds >= CHARGE_HOLD_TIME) {
      game.bullets.push(game.player.fireCharged());
    }
  }

  window.addEventListener('keydown', (e) => {
    if (KEY_MAP[e.code]) {
      input.add(KEY_MAP[e.code]);
      e.preventDefault();
    }
    if (e.code === 'Space') {
      handleFirePress();
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
      if (!titleScreen.classList.contains('hidden')) {
        goToDifficultySelect();
      } else if (!difficultyScreen.classList.contains('hidden')) {
        chooseDifficulty('normal');
      } else if (!stageClearScreen.classList.contains('hidden')) {
        if (game.stage >= MAX_STAGE) backToDifficultySelect();
        else goNextStage();
      } else if (!gameOverScreen.classList.contains('hidden')) {
        gameOverScreen.classList.add('hidden');
        startRun();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (KEY_MAP[e.code]) input.delete(KEY_MAP[e.code]);
    if (e.code === 'Space') handleFireRelease();
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') weaponTogglePressed = false;
  });

  // 창 포커스를 잃으면(alt-tab 등) keyup을 못 받아 발사 상태가 고정될 수 있으므로 안전하게 초기화
  window.addEventListener('blur', () => {
    input.clear();
    fireHoldStartTime = null;
    if (game.player) game.player.fireHeld = false;
    weaponTogglePressed = false;
    joystickPointerId = null;
    resetJoystick();
  });

  // ---- 터치(모바일) 조작: 가상 조이스틱 + 발사/무기전환 버튼 ----
  const joystickZone = document.getElementById('joystick-zone');
  const joystickStick = document.getElementById('joystick-stick');
  const fireBtn = document.getElementById('fire-btn');
  const weaponBtn = document.getElementById('weapon-btn');
  const JOYSTICK_MAX = 38;
  const JOYSTICK_DEADZONE = 10;
  let joystickPointerId = null;

  function setDirectionFromVector(dx, dy) {
    input.delete('up');
    input.delete('down');
    input.delete('left');
    input.delete('right');
    if (Math.hypot(dx, dy) < JOYSTICK_DEADZONE) return;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI; // 0=right, 90=down, ±180=left, -90=up
    if (deg > -157.5 && deg < -22.5) input.add('up');
    if (deg > 22.5 && deg < 157.5) input.add('down');
    if (deg > 112.5 || deg < -112.5) input.add('left');
    if (deg > -67.5 && deg < 67.5) input.add('right');
  }

  function moveJoystick(clientX, clientY) {
    const rect = joystickZone.getBoundingClientRect();
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_MAX) {
      dx = (dx / dist) * JOYSTICK_MAX;
      dy = (dy / dist) * JOYSTICK_MAX;
    }
    joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
    setDirectionFromVector(dx, dy);
  }

  function resetJoystick() {
    joystickStick.style.transform = 'translate(0px, 0px)';
    input.delete('up');
    input.delete('down');
    input.delete('left');
    input.delete('right');
  }

  joystickZone.addEventListener('pointerdown', (e) => {
    joystickPointerId = e.pointerId;
    try {
      joystickZone.setPointerCapture(e.pointerId);
    } catch (err) {
      // 일부 환경에서 포인터 캡처가 거부될 수 있음 - 무시하고 계속 진행
    }
    moveJoystick(e.clientX, e.clientY);
    e.preventDefault();
  });
  joystickZone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== joystickPointerId) return;
    moveJoystick(e.clientX, e.clientY);
    e.preventDefault();
  });
  const endJoystick = (e) => {
    if (e.pointerId !== joystickPointerId) return;
    joystickPointerId = null;
    resetJoystick();
  };
  joystickZone.addEventListener('pointerup', endJoystick);
  joystickZone.addEventListener('pointercancel', endJoystick);

  fireBtn.addEventListener('pointerdown', (e) => {
    // 조이스틱과 동일하게 포인터를 캡처해야, 손가락이 버튼 밖으로 살짝 벗어나도
    // (0.45초 이상 누르고 있으면 미세하게 흔들리기 매우 쉬움) pointerleave로 오인해
    // 히든 강화 발사가 중간에 끊기지 않는다. 캡처된 포인터는 releasePointerCapture나
    // 실제 pointerup/pointercancel 전까지는 계속 이 버튼으로 이벤트가 전달된다.
    try {
      fireBtn.setPointerCapture(e.pointerId);
    } catch (err) {
      // 일부 환경에서 포인터 캡처가 거부될 수 있음 - 무시하고 계속 진행
    }
    handleFirePress();
    e.preventDefault();
  });
  ['pointerup', 'pointercancel'].forEach((evt) =>
    fireBtn.addEventListener(evt, () => {
      handleFireRelease();
    })
  );
  // 모바일에서 발사 버튼을 히든 강화 발사에 필요한 시간(CHARGE_HOLD_TIME) 이상 누르고 있으면
  // iOS/Android가 자체적으로 "길게 누르기" 제스처(컨텍스트 메뉴, 콜아웃, 텍스트 선택)로 인식해
  // 우리 포인터 이벤트보다 먼저 터치를 가로채 pointercancel을 유발할 수 있음 - 이를 차단
  fireBtn.addEventListener('contextmenu', (e) => e.preventDefault());

  // Pointer Events는 브라우저/웹뷰(카카오톡 인앱브라우저 등)마다 캡처·경계 판정 구현이
  // 미묘하게 달라 신뢰하기 어려울 수 있으므로, 더 원초적이고 표준화된 Touch Events로도
  // 동일한 로직을 걸어 이중 안전장치를 둔다. touchend는 손가락이 화면 어디로 움직였든
  // 항상 touchstart가 시작된 요소로 전달되므로 "버튼 밖으로 벗어남" 판정 자체가 없다.
  // handleFirePress/handleFireRelease는 이미 중복 호출에 안전하도록 가드되어 있어
  // 포인터 이벤트와 함께 걸려도 문제없다.
  // preventDefault를 호출하지 않는다 - 스크롤/줌 방지는 이미 CSS touch-action:none이
  // 담당하고 있고, 여기서 preventDefault를 부르면 일부 브라우저에서 버튼의 기본 눌림
  // 시각효과(:active)와 탭 시 발생하는 미세한 햅틱 피드백까지 함께 억제되어 버린다.
  fireBtn.addEventListener('touchstart', () => {
    handleFirePress();
  });
  ['touchend', 'touchcancel'].forEach((evt) =>
    fireBtn.addEventListener(evt, () => {
      handleFireRelease();
    })
  );

  weaponBtn.addEventListener('pointerdown', (e) => {
    if (game.state === 'PLAYING') game.player.toggleWeapon();
    e.preventDefault();
  });

  // ---- 타이틀 / 난이도 선택 ----
  titleScreen.addEventListener('click', goToDifficultySelect);

  document.querySelectorAll('.diff-card').forEach((card) => {
    card.addEventListener('click', () => chooseDifficulty(card.dataset.diff));
  });

  function goToDifficultySelect() {
    titleScreen.classList.add('hidden');
    difficultyScreen.classList.remove('hidden');
    game.state = 'DIFFICULTY_SELECT';
  }

  function backToDifficultySelect() {
    stageClearScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    difficultyScreen.classList.remove('hidden');
    game.state = 'DIFFICULTY_SELECT';
  }

  function chooseDifficulty(key) {
    game.difficulty = key;
    game.diff = DIFFICULTIES[key];
    difficultyScreen.classList.add('hidden');
    startRun();
  }

  restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startRun();
  });

  continueBtn.addEventListener('click', () => {
    if (!game.diff.allowContinue) return;
    gameOverScreen.classList.add('hidden');
    game.timeLeft += timeLimitForStage(game.stage, game.diff);
    startStage(game.stage); // 스테이지/점수는 유지, 그 스테이지부터 이어감
  });

  stageClearBtn.addEventListener('click', () => {
    if (game.stage >= MAX_STAGE) backToDifficultySelect();
    else goNextStage();
  });

  const game = {
    state: 'TITLE', // TITLE | DIFFICULTY_SELECT | PLAYING | STAGE_CLEAR | GAME_OVER
    difficulty: null,
    diff: null,
    stage: 1,
    score: 0,
    timeLeft: 0,
    grid: null,
    player: null,
    enemies: [],
    bullets: [],
    items: [],
    enemiesToSpawn: 0,
    ammoGraceTimer: null, // 특수탄 0 상태가 된 뒤 남은 유예 시간 (null = 카운트다운 없음)
    isBossStage: false,
    isVeteranStage: false,
  };

  function addScore(base) {
    game.score += Math.round(base * game.diff.scoreMul);
  }

  function startRun() {
    game.stage = 1;
    game.score = 0;
    game.timeLeft = timeLimitForStage(1, game.diff);
    startStage(game.stage);
  }

  function goNextStage() {
    stageClearScreen.classList.add('hidden');
    game.stage++;
    game.timeLeft += timeLimitForStage(game.stage, game.diff); // 초기화 대신 누적 추가
    startStage(game.stage);
  }

  function startStage(stage) {
    const seed = stage * 7919 + 13;
    game.grid = createMaze(seed, game.diff.wallDensity);
    game.player = new Player(1 * TILE + TILE / 2, 1 * TILE + TILE / 2, game.diff.maxEnergy, game.diff.startSpecialAmmo);
    game.enemies = [];
    game.bullets = [];
    game.items = [];
    game.isBossStage = isBossStage(stage);
    game.isVeteranStage = isVeteranStage(stage);
    // 보스/베테랑 스테이지는 정해진 수 대신 딱 1기만 등장한다
    game.enemiesToSpawn = game.isBossStage || game.isVeteranStage ? 1 : enemiesForStage(stage);
    game.ammoGraceTimer = null;
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
      const kind = game.isBossStage ? 'boss' : pickEnemyKind(game.stage, game.diff);
      const extra = { stage: game.stage, veteran: game.isVeteranStage };
      game.enemies.push(new Enemy(candidate.x, candidate.y, kind, game.diff, extra));
      game.enemiesToSpawn--;
    }
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
      addScore(SCORE_WALL);
      tryDropItem(c * TILE + TILE / 2, r * TILE + TILE / 2, Math.min(1, ITEM_DROP_CHANCE_WALL * game.diff.itemDropMul));
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

    // 특수탄이 0인 동안 유예 시간이 흐르고, 다 떨어지면 게임오버
    if (player.specialAmmo <= 0) {
      if (game.ammoGraceTimer === null) game.ammoGraceTimer = game.diff.zeroAmmoGrace;
      else game.ammoGraceTimer -= dt;
    } else {
      game.ammoGraceTimer = null;
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
              if (enemy.kind === 'boss') {
                addScore(SCORE_BOSS);
                tryDropItem(enemy.x, enemy.y, 1); // 보스는 아이템 드랍 확정
              } else {
                addScore(SCORE_ENEMY);
                tryDropItem(enemy.x, enemy.y, Math.min(1, ITEM_DROP_CHANCE_ENEMY * game.diff.itemDropMul));
              }
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
        addScore(SCORE_ITEM);
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

    if (game.ammoGraceTimer !== null && game.ammoGraceTimer <= 0) {
      triggerGameOver('ammo_empty');
      return;
    }

    if (game.enemiesToSpawn <= 0 && game.enemies.length === 0) {
      triggerStageClear();
    }
  }

  function triggerStageClear() {
    game.state = 'STAGE_CLEAR';
    const bonus = Math.round(game.timeLeft * TIME_BONUS_PER_SEC * game.diff.scoreMul);
    game.score += bonus;

    if (game.stage >= MAX_STAGE) {
      stageClearTitle.textContent = '🏆 ALL CLEAR!';
      stageClearInfo.innerHTML =
        `전체 ${MAX_STAGE}스테이지를 모두 클리어했습니다! (${game.diff.label})<br/>최종 점수: ${game.score}`;
      stageClearBtn.textContent = '난이도 선택으로';
    } else if (game.isBossStage) {
      stageClearTitle.textContent = '💥 BOSS DOWN!';
      stageClearInfo.innerHTML =
        `중간보스 격파!<br/>남은 시간 보너스: +${bonus}<br/>누적 시간: ${Math.ceil(game.timeLeft)}s<br/>현재 점수: ${game.score}`;
      stageClearBtn.textContent = '다음 스테이지';
    } else {
      stageClearTitle.textContent = 'STAGE CLEAR!';
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
      reason === 'ammo_empty' ? '특수탄약 소진 - 제한시간 초과' :
      '에너지 소진';
    gameOverInfo.innerHTML = `${reasonText}<br/>도달 스테이지: ${game.stage}<br/>최종 점수: ${game.score}`;
    if (game.diff.allowContinue) continueBtn.classList.remove('hidden');
    else continueBtn.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
  }

  function drawHUD() {
    ctx.fillStyle = '#151a28';
    ctx.fillRect(0, 0, CANVAS_W, HUD_TOP);
    ctx.fillRect(0, HUD_TOP + PLAY_H, CANVAS_W, HUD_BOTTOM);

    ctx.fillStyle = '#e8ecf4';
    ctx.font = 'bold 14px sans-serif';
    ctx.textBaseline = 'middle';

    // 에너지 하트
    ctx.textAlign = 'left';
    const heartsX = 30;
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

    // 현재 장전된 무기 + 잔여 특수탄 (상단 중앙, 한 그룹으로 가운데 정렬)
    const weaponLabel = game.player.weapon === 'special' ? '특수' : '일반';
    const weaponText = `무기: ${weaponLabel}`;
    const weaponColor = game.player.weapon === 'special' ? '#ffd23f' : '#e8ecf4';
    let ammoText, ammoColor;
    if (game.player.specialAmmo > 0) {
      ammoText = `특수탄 ${game.player.specialAmmo}`;
      ammoColor = '#ffd23f';
    } else {
      const graceLabel = game.ammoGraceTimer !== null ? Math.ceil(game.ammoGraceTimer) : 0;
      ammoText = `특수탄 0 · ${graceLabel}s`;
      ammoColor = '#ff5d5d';
    }
    const gap = 16;
    ctx.textAlign = 'left';
    const weaponWidth = ctx.measureText(weaponText).width;
    const ammoWidth = ctx.measureText(ammoText).width;
    const groupStartX = CANVAS_W / 2 - (weaponWidth + gap + ammoWidth) / 2;
    ctx.fillStyle = weaponColor;
    ctx.fillText(weaponText, groupStartX, HUD_TOP / 2);
    ctx.fillStyle = ammoColor;
    ctx.fillText(ammoText, groupStartX + weaponWidth + gap, HUD_TOP / 2);

    const bottomY = HUD_TOP + PLAY_H + HUD_BOTTOM / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e8ecf4';
    const stageText = `STAGE ${game.stage}/${MAX_STAGE}`;
    ctx.fillText(stageText, 12, bottomY);
    const stageWidth = ctx.measureText(stageText).width;
    ctx.fillStyle = game.diff.color;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(game.diff.label, 12 + stageWidth + 10, bottomY);
    ctx.font = 'bold 14px sans-serif';

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8ecf4';
    ctx.fillText(`SCORE ${game.score}`, CANVAS_W / 2, bottomY);

    ctx.textAlign = 'right';
    const remaining = game.enemiesToSpawn + game.enemies.length;
    if (game.isBossStage) {
      ctx.fillStyle = '#ff2d55';
      ctx.fillText('⚠ BOSS', CANVAS_W - 12, bottomY);
    } else {
      ctx.fillStyle = '#e8ecf4';
      ctx.fillText(`남은 적 ${remaining}`, CANVAS_W - 12, bottomY);
    }
  }

  // ---- 타이틀 / 난이도 선택 화면 배경 (탱크 히어로 샷) ----
  let titleGrid = null;
  function renderTitleBackground() {
    if (!titleGrid) titleGrid = createMaze(4242, 0.42);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#11151f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawMaze(ctx, titleGrid);

    const t = performance.now() / 1000;
    const angle = -Math.PI / 2 + Math.sin(t * 0.5) * 0.4;
    ctx.save();
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
    ctx.scale(2.6, 2.6);
    drawTankShape(ctx, 0, 0, angle, '#3ddc84', '#1f7a44');
    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  function render() {
    if (game.state === 'TITLE' || game.state === 'DIFFICULTY_SELECT') {
      renderTitleBackground();
      return;
    }

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
      drawDebugOverlay(); // TEMP: 모바일 히든 발사 문제 진단용 - 원인 확인되면 제거 예정
    }
  }

  // TEMP: 모바일 히든 발사 문제 진단용. game.player의 실시간 상태를 화면에 그대로 노출해서,
  // 실제 기기에서 무엇이 다르게 동작하는지 눈으로 바로 확인하기 위한 디버그 오버레이.
  // 원인이 확인되고 나면 이 함수 호출과 정의를 제거할 예정.
  function drawDebugOverlay() {
    const p = game.player;
    if (!p) return;
    const heldMs = fireHoldStartTime !== null ? Math.round(performance.now() - fireHoldStartTime) : 0;
    const lines = [
      `fireHeld=${p.fireHeld} charging=${p.charging} ammo=${p.specialAmmo}`,
      `scale=${p.chargeScale.toFixed(2)} heldMs=${heldMs}`,
    ];
    ctx.save();
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const boxW = 230;
    const boxH = lines.length * 14 + 8;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(4, HUD_TOP + 4, boxW, boxH);
    ctx.fillStyle = '#ffcf4d';
    lines.forEach((line, i) => {
      ctx.fillText(line, 10, HUD_TOP + 8 + i * 14);
    });
    ctx.restore();
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
