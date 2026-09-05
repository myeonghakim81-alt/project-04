// 플레이어 탱크
class Player {
  constructor(x, y, maxEnergy, startSpecialAmmo) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.radius = PLAYER_RADIUS;
    this.speed = PLAYER_SPEED;
    this.maxEnergy = maxEnergy;
    this.energy = maxEnergy;
    this.weapon = 'normal'; // 'normal' | 'special'
    this.specialAmmo = startSpecialAmmo;
    this.cooldown = 0;
    this.invuln = 0;
    this.alive = true;
    this.fireHeld = false;
    this.charging = false;
    this.chargeScale = 1;
  }

  toggleWeapon() {
    this.weapon = this.weapon === 'normal' ? 'special' : 'normal';
  }

  update(dt, input, grid) {
    if (!this.alive) return;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.cooldown > 0) this.cooldown -= dt;

    // 매 프레임 탄약 상태를 다시 확인 (버튼을 누른 "순간"에만 체크하면, 마지막 한 발을
    // 쏘자마자 계속 누르고 있는 경우처럼 탄약이 0이 되는 시점을 놓쳐 커지는 연출이 빠질 수 있음)
    this.charging = this.fireHeld && this.specialAmmo <= 0;
    const targetScale = this.charging ? PLAYER_CHARGE_SCALE : 1;
    if (this.chargeScale < targetScale) {
      const growRate = (PLAYER_CHARGE_SCALE - 1) / CHARGE_HOLD_TIME;
      this.chargeScale = Math.min(targetScale, this.chargeScale + growRate * dt);
    } else if (this.chargeScale > targetScale) {
      const shrinkRate = (PLAYER_CHARGE_SCALE - 1) / 0.12;
      this.chargeScale = Math.max(targetScale, this.chargeScale - shrinkRate * dt);
    }

    let dx = 0;
    let dy = 0;
    if (input.has('up')) dy -= 1;
    if (input.has('down')) dy += 1;
    if (input.has('left')) dx -= 1;
    if (input.has('right')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.angle = Math.atan2(dy, dx);

      const nx = this.x + dx * this.speed * dt;
      if (!circleHitsWall(grid, nx, this.y, this.radius)) this.x = nx;
      const ny = this.y + dy * this.speed * dt;
      if (!circleHitsWall(grid, this.x, ny, this.radius)) this.y = ny;
    }

    // 특수탄이 0이면 자동으로 일반 미사일로 전환
    if (this.weapon === 'special' && this.specialAmmo <= 0) {
      this.weapon = 'normal';
    }
  }

  canFire() {
    if (this.cooldown > 0) return false;
    if (this.weapon === 'special' && this.specialAmmo <= 0) return false;
    return true;
  }

  fire() {
    const type = this.weapon;
    this.cooldown = type === 'special' ? FIRE_COOLDOWN_SPECIAL : FIRE_COOLDOWN_NORMAL;
    if (type === 'special') this.specialAmmo--;
    const speed = type === 'special' ? BULLET_SPEED_SPECIAL : BULLET_SPEED_NORMAL;
    const bx = this.x + Math.cos(this.angle) * (this.radius + 6);
    const by = this.y + Math.sin(this.angle) * (this.radius + 6);
    return new Bullet(
      bx, by, Math.cos(this.angle) * speed, Math.sin(this.angle) * speed,
      type, 'player', type === 'special'
    );
  }

  // 탄약을 소모하지 않는 강화 발사 (특수탄 소진 후 발사 버튼을 길게 눌렀다 뗄 때만 호출됨)
  fireCharged() {
    const bx = this.x + Math.cos(this.angle) * (this.radius + 6);
    const by = this.y + Math.sin(this.angle) * (this.radius + 6);
    return new Bullet(
      bx, by, Math.cos(this.angle) * BULLET_SPEED_SPECIAL, Math.sin(this.angle) * BULLET_SPEED_SPECIAL,
      'special', 'player', true
    );
  }

  takeHit() {
    if (this.invuln > 0 || !this.alive) return false;
    this.energy--;
    this.invuln = PLAYER_INVULN_TIME;
    if (this.energy <= 0) {
      this.energy = 0;
      this.alive = false;
    }
    return true;
  }

  heal(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  draw(ctx) {
    if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) return; // 피격 무적 점멸
    const charged = this.chargeScale > 1.01;
    const bodyColor = charged ? '#ffcf4d' : '#3ddc84';
    const darkColor = charged ? '#8a6300' : '#1f7a44';
    if (this.chargeScale !== 1) {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (charged) {
        ctx.shadowColor = 'rgba(255, 207, 77, 0.9)';
        ctx.shadowBlur = 16;
      }
      ctx.scale(this.chargeScale, this.chargeScale);
      drawTankShape(ctx, 0, 0, this.angle, bodyColor, darkColor);
      ctx.restore();
    } else {
      drawTankShape(ctx, this.x, this.y, this.angle, bodyColor, darkColor);
    }
  }
}

// 적 탱크
class Enemy {
  constructor(x, y, kind, diff, extra) {
    extra = extra || {};
    this.x = x;
    this.y = y;
    this.kind = kind || 'basic';
    this.veteran = !!extra.veteran; // 중간보스를 넘긴 직후 스테이지의 강화 개체
    const base = ENEMY_KINDS[this.kind];
    this.stats = {
      color: base.color,
      colorDark: base.colorDark,
      speed: base.speed * diff.enemySpeedMul * (this.veteran ? VETERAN_SPEED_MUL : 1),
      detectRange: base.detectRange * diff.enemyRangeMul,
      fireRange: base.fireRange * diff.enemyRangeMul,
      fireCooldown: base.fireCooldown * diff.enemyFireCooldownMul,
      bulletSpeed: base.bulletSpeed,
      breaksWalls: base.breaksWalls,
      contactDamage: base.contactDamage,
      multiShot: this.kind === 'boss',
    };
    this.angle = Math.random() * Math.PI * 2;
    this.radius = this.kind === 'boss' ? BOSS_RADIUS : ENEMY_RADIUS;
    this.speed = this.stats.speed;
    this.hp = this.kind === 'boss' ? bossHpForStage(extra.stage || 1) : 1;
    this.maxHp = this.hp;
    this.state = 'patrol';
    this.fireCooldown = this.stats.fireCooldown * Math.random();
    this.wanderTimer = 0;
    this.dir = { x: 0, y: 0 };
    this.weavePhase = Math.random() * Math.PI * 2;
    this.alive = true;
  }

  update(dt, player, grid, bullets) {
    if (!this.alive) return;
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    this.state = player.alive && distToPlayer < this.stats.detectRange ? 'chase' : 'patrol';

    let dx = 0;
    let dy = 0;
    if (this.state === 'chase') {
      dx = player.x - this.x;
      dy = player.y - this.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;

      if (this.veteran) {
        // 회피 기동: 접근 방향에 수직인 성분을 섞어 좌우로 흔들며 다가온다 (맞히기 어려움)
        this.weavePhase += dt * 4;
        const weave = Math.sin(this.weavePhase) * VETERAN_WEAVE_AMOUNT;
        const perpX = -dy;
        const perpY = dx;
        dx += perpX * weave;
        dy += perpY * weave;
        const wlen = Math.hypot(dx, dy) || 1;
        dx /= wlen;
        dy /= wlen;
      }

      this.angle = Math.atan2(dy, dx);
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0 || (this.dir.x === 0 && this.dir.y === 0)) {
        const dirs = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ];
        this.dir = dirs[Math.floor(Math.random() * dirs.length)];
        this.wanderTimer = 0.8 + Math.random() * 1.2;
        this.angle = Math.atan2(this.dir.y, this.dir.x);
      }
      dx = this.dir.x;
      dy = this.dir.y;
    }

    const nx = this.x + dx * this.speed * dt;
    const ny = this.y + dy * this.speed * dt;
    let moved = false;
    if (!circleHitsWall(grid, nx, this.y, this.radius)) {
      this.x = nx;
      moved = true;
    }
    if (!circleHitsWall(grid, this.x, ny, this.radius)) {
      this.y = ny;
      moved = true;
    }
    if (!moved && this.state === 'patrol') this.wanderTimer = 0; // 막히면 다음 프레임에 새 방향 선택

    // 돌격형: 근접 시 직접 접촉 피해
    if (this.stats.contactDamage && this.state === 'chase' && distToPlayer < this.radius + player.radius) {
      player.takeHit();
    }

    this.fireCooldown -= dt;
    if (
      this.stats.fireRange > 0 &&
      this.state === 'chase' &&
      distToPlayer < this.stats.fireRange &&
      this.fireCooldown <= 0
    ) {
      this.fireCooldown = this.stats.fireCooldown;
      const angles = this.stats.multiShot ? [this.angle - 0.24, this.angle, this.angle + 0.24] : [this.angle];
      for (const a of angles) {
        const bx = this.x + Math.cos(a) * (this.radius + 6);
        const by = this.y + Math.sin(a) * (this.radius + 6);
        bullets.push(
          new Bullet(
            bx,
            by,
            Math.cos(a) * this.stats.bulletSpeed,
            Math.sin(a) * this.stats.bulletSpeed,
            'normal',
            'enemy',
            this.stats.breaksWalls
          )
        );
      }
    }
  }

  takeHit() {
    this.hp--;
    if (this.hp <= 0) this.alive = false;
  }

  draw(ctx) {
    if (this.kind === 'boss') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(BOSS_VISUAL_SCALE, BOSS_VISUAL_SCALE);
      drawTankShape(ctx, 0, 0, this.angle, this.stats.color, this.stats.colorDark);
      ctx.restore();
      this.drawHealthBar(ctx);
    } else {
      drawTankShape(ctx, this.x, this.y, this.angle, this.stats.color, this.stats.colorDark);
    }
  }

  drawHealthBar(ctx) {
    const w = 46;
    const h = 6;
    const x = this.x - w / 2;
    const y = this.y - 34;
    const ratio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#3a3f4d';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = ratio > 0.4 ? '#ff5d5d' : '#ff2d2d';
    ctx.fillRect(x, y, w * ratio, h);
  }
}

function drawTankShape(ctx, x, y, angle, bodyColor, darkColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.fillRect(-15, -11, 30, 22);
  ctx.strokeRect(-15, -11, 30, 22);
  ctx.fillStyle = darkColor;
  ctx.fillRect(-11, -15, 22, 5);
  ctx.fillRect(-11, 10, 22, 5);
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = darkColor;
  ctx.stroke();
  ctx.fillStyle = darkColor;
  ctx.fillRect(0, -3, 19, 6);
  ctx.restore();
}

// 미사일
class Bullet {
  constructor(x, y, vx, vy, type, owner, breaksWalls) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type; // 'normal' | 'special'
    this.owner = owner; // 'player' | 'enemy'
    this.breaksWalls = breaksWalls || type === 'special'; // 벽 파괴 가능 여부
    this.radius = BULLET_RADIUS;
    this.alive = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < 0 || this.y < 0 || this.x > PLAY_W || this.y > PLAY_H) this.alive = false;
  }

  draw(ctx) {
    let color;
    if (this.owner === 'player') color = this.type === 'special' ? '#ffd23f' : '#ffffff';
    else color = this.breaksWalls ? '#3ddad0' : '#ff8a3d';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 아이템
class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'ammo' | 'energy'
    this.radius = ITEM_RADIUS;
    this.alive = true;
    this.bob = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.bob += dt * 4;
  }

  draw(ctx) {
    const yOff = Math.sin(this.bob) * 3;
    ctx.save();
    ctx.translate(this.x, this.y + yOff);
    if (this.type === 'ammo') {
      ctx.fillStyle = '#ffd23f';
      ctx.strokeStyle = '#a97e00';
    } else {
      ctx.fillStyle = '#ff5d8f';
      ctx.strokeStyle = '#8f1d47';
    }
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type === 'ammo' ? 'S' : '+', 0, 1);
    ctx.restore();
  }
}
