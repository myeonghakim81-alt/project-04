// 공용 상수 정의
const TILE = 40;
const COLS = 15;
const ROWS = 11;

const HUD_TOP = 52;
const HUD_BOTTOM = 46;

const PLAY_W = COLS * TILE; // 600
const PLAY_H = ROWS * TILE; // 440

const CANVAS_W = PLAY_W;
const CANVAS_H = HUD_TOP + PLAY_H + HUD_BOTTOM;

// 벽 종류
const WALL_NONE = 0; // 빈 바닥
const WALL_BREAKABLE = 1; // 특수 미사일로만 파괴 가능
const WALL_SOLID = 2; // 파괴 불가 (기둥/외곽)

// 플레이어
const PLAYER_RADIUS = 15;
const PLAYER_SPEED = 150; // px/s
const PLAYER_MAX_ENERGY = 3;
const PLAYER_START_SPECIAL_AMMO = 3;
const FIRE_COOLDOWN_NORMAL = 0.28;
const FIRE_COOLDOWN_SPECIAL = 0.5;
const PLAYER_INVULN_TIME = 1.3;
const ZERO_AMMO_GRACE_TIME = 10; // 특수탄 소진 후 이 시간 안에 보충하지 못하면 게임오버
const CHARGE_HOLD_TIME = 0.6; // 발사 버튼을 이만큼 눌렀다 떼면(특수탄 0일 때) 강화 발사 - 비공개

// 미사일
const BULLET_RADIUS = 5;
const BULLET_SPEED_NORMAL = 380;
const BULLET_SPEED_SPECIAL = 300;
const ENEMY_BULLET_SPEED = 240;

// 적
const ENEMY_RADIUS = 15;
const ENEMY_SPEED = 68;
const ENEMY_DETECT_RANGE = 260;
const ENEMY_FIRE_RANGE = 320;
const ENEMY_FIRE_COOLDOWN = 1.5;
const ENEMY_MAX_ACTIVE = 6; // 동시 활성 적 수 (웨이브 방식)

// 적 종류 (스테이지 11부터 다양화)
const ENEMY_VARIETY_STAGE = 11;
const ENEMY_KINDS = {
  basic: {
    color: '#ff5d5d', colorDark: '#8a2727',
    speed: ENEMY_SPEED, detectRange: ENEMY_DETECT_RANGE, fireRange: ENEMY_FIRE_RANGE,
    fireCooldown: ENEMY_FIRE_COOLDOWN, bulletSpeed: ENEMY_BULLET_SPEED,
    breaksWalls: false, contactDamage: false,
  },
  sniper: { // 저격형: 사거리 길고 명중률 높음, 대신 느림
    color: '#b083ff', colorDark: '#5a3999',
    speed: ENEMY_SPEED * 0.55, detectRange: ENEMY_DETECT_RANGE * 1.7, fireRange: ENEMY_FIRE_RANGE * 1.7,
    fireCooldown: ENEMY_FIRE_COOLDOWN * 1.4, bulletSpeed: ENEMY_BULLET_SPEED * 1.5,
    breaksWalls: false, contactDamage: false,
  },
  rusher: { // 돌격형: 빠르게 접근, 근접 공격 위주 (발사 없음)
    color: '#ff9d3d', colorDark: '#8a4c10',
    speed: ENEMY_SPEED * 2.0, detectRange: ENEMY_DETECT_RANGE, fireRange: 0,
    fireCooldown: 999, bulletSpeed: 0,
    breaksWalls: false, contactDamage: true,
  },
  breaker: { // 벽 파괴형: 적도 벽을 부수며 접근
    color: '#3ddad0', colorDark: '#1c6e68',
    speed: ENEMY_SPEED * 0.85, detectRange: ENEMY_DETECT_RANGE, fireRange: ENEMY_FIRE_RANGE,
    fireCooldown: ENEMY_FIRE_COOLDOWN * 1.2, bulletSpeed: ENEMY_BULLET_SPEED,
    breaksWalls: true, contactDamage: false,
  },
};

function pickEnemyKind(stage) {
  if (stage < ENEMY_VARIETY_STAGE) return 'basic';
  const roll = Math.random();
  if (roll < 0.4) return 'basic';
  if (roll < 0.6) return 'sniper';
  if (roll < 0.8) return 'rusher';
  return 'breaker';
}

// 아이템
const ITEM_RADIUS = 11;
const ITEM_DROP_CHANCE_WALL = 0.24;
const ITEM_DROP_CHANCE_ENEMY = 0.4;
const ITEM_AMMO_GRANT = 3;
const ITEM_ENERGY_HEAL = 1;

// 점수
const SCORE_WALL = 10;
const SCORE_ENEMY = 100;
const SCORE_ITEM = 20;
const TIME_BONUS_PER_SEC = 5;

// 미로 생성
const WALL_DENSITY = 0.42; // 부술 수 있는 벽이 배치될 확률

const MAX_STAGE = 100;

function enemiesForStage(stage) {
  if (stage === 1) return 1;
  if (stage === 2) return 2;
  if (stage === 3) return 4;
  if (stage === 4) return 8;
  return Math.min(60, Math.round(8 * Math.pow(1.5, stage - 4)));
}

function timeLimitForStage(stage) {
  return Math.max(45, 90 - (stage - 1) * 3);
}
