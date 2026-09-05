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
const FIRE_COOLDOWN_NORMAL = 0.28;
const FIRE_COOLDOWN_SPECIAL = 0.5;
const PLAYER_INVULN_TIME = 1.3;
const CHARGE_HOLD_TIME = 0.45; // 발사 버튼을 이만큼 눌렀다 떼면(특수탄 0일 때) 강화 발사 - 비공개
const PLAYER_CHARGE_SCALE = 1.4; // 강화 발사를 위해 누르고 있는 동안 탱크가 커지는 배율 - 비공개
const CHARGE_VISUAL_DELAY = 0.15; // 누른 직후 이 시간까지는 시각 효과를 보이지 않음(바로 티나는 것 방지) - 비공개

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

// 적 종류의 기본(=NORMAL 난이도 기준) 스탯. 실제 스탯은 난이도 배율이 곱해져 결정된다.
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
  boss: { // 중간보스: 크고 단단하고, 3way 탄막을 쏘는 벽파괴형
    color: '#ff2d55', colorDark: '#7a0f26',
    speed: ENEMY_SPEED * 0.6, detectRange: ENEMY_DETECT_RANGE * 1.3, fireRange: ENEMY_FIRE_RANGE * 1.3,
    fireCooldown: ENEMY_FIRE_COOLDOWN * 0.6, bulletSpeed: ENEMY_BULLET_SPEED,
    breaksWalls: true, contactDamage: false,
  },
};

// ==================== 중간보스 ====================
const BOSS_STAGE_INTERVAL = 5; // 이 배수 스테이지마다 중간보스 등장 (5, 10, 15, ...)
const BOSS_VISUAL_SCALE = 1.6; // 보스 탱크 그래픽 확대 배율
const BOSS_RADIUS = 17; // 충돌 반경 (미로 통로 폭보다 충분히 작게 유지)
const BOSS_BASE_HP = 6; // 보스 기본 체력(피격 횟수)
const SCORE_BOSS = 500; // 보스 처치 기본 점수 (난이도 배율 적용 전)
const VETERAN_SPEED_MUL = 1.3; // 보스를 넘긴 직후 스테이지에 등장하는 강화 개체 속도 배율
const VETERAN_WEAVE_AMOUNT = 0.7; // 강화 개체의 회피 기동 강도

function isBossStage(stage) {
  return stage % BOSS_STAGE_INTERVAL === 0;
}

function isVeteranStage(stage) {
  return stage > 1 && (stage - 1) % BOSS_STAGE_INTERVAL === 0;
}

function bossHpForStage(stage) {
  return BOSS_BASE_HP + Math.floor((stage - 1) / 25);
}

// 아이템
const ITEM_RADIUS = 11;
const ITEM_DROP_CHANCE_WALL = 0.24;
const ITEM_DROP_CHANCE_ENEMY = 0.4;
const ITEM_AMMO_GRANT = 3;
const ITEM_ENERGY_HEAL = 1;

// 점수 기본값 (난이도별 scoreMul이 곱해져 최종 반영됨)
const SCORE_WALL = 10;
const SCORE_ENEMY = 100;
const SCORE_ITEM = 20;
const TIME_BONUS_PER_SEC = 5;

const WALL_DENSITY = 0.42; // 미로 생성 시 기본 벽 밀도 (난이도 미지정 시 fallback)

const MAX_STAGE = 100;

// ==================== 난이도 ====================
const DIFFICULTIES = {
  easy: {
    key: 'easy', label: '이지', sub: '여유로운 진행 · 실패해도 이어하기 가능',
    color: '#4be08a', colorDark: '#1c5c37',
    maxEnergy: 4, startSpecialAmmo: 4, zeroAmmoGrace: 20,
    stageTimeStart: 110, stageTimeStep: 2, stageTimeMin: 60,
    enemySpeedMul: 0.85, enemyFireCooldownMul: 1.3, enemyRangeMul: 0.85,
    itemDropMul: 1.4, wallDensity: 0.36, varietyStage: 16,
    scoreMul: 1.0, allowContinue: true,
  },
  normal: {
    key: 'normal', label: '노멀', sub: '표준 난이도 · 실패해도 이어하기 가능',
    color: '#ffd23f', colorDark: '#a97e00',
    maxEnergy: 3, startSpecialAmmo: 3, zeroAmmoGrace: 15,
    stageTimeStart: 90, stageTimeStep: 3, stageTimeMin: 45,
    enemySpeedMul: 1.0, enemyFireCooldownMul: 1.0, enemyRangeMul: 1.0,
    itemDropMul: 1.0, wallDensity: 0.42, varietyStage: 11,
    scoreMul: 1.5, allowContinue: true,
  },
  hard: {
    key: 'hard', label: '하드', sub: '이어하기 없음 · 오직 하이스코어',
    color: '#ff5d5d', colorDark: '#8a2727',
    maxEnergy: 3, startSpecialAmmo: 2, zeroAmmoGrace: 8,
    stageTimeStart: 75, stageTimeStep: 3.5, stageTimeMin: 35,
    enemySpeedMul: 1.2, enemyFireCooldownMul: 0.75, enemyRangeMul: 1.2,
    itemDropMul: 0.7, wallDensity: 0.48, varietyStage: 6,
    scoreMul: 2.2, allowContinue: false,
  },
};

function pickEnemyKind(stage, diff) {
  if (stage < diff.varietyStage) return 'basic';
  const roll = Math.random();
  if (roll < 0.4) return 'basic';
  if (roll < 0.6) return 'sniper';
  if (roll < 0.8) return 'rusher';
  return 'breaker';
}

function enemiesForStage(stage) {
  if (stage === 1) return 1;
  if (stage === 2) return 2;
  if (stage === 3) return 4;
  if (stage === 4) return 8;
  return Math.min(60, Math.round(8 * Math.pow(1.5, stage - 4)));
}

function timeLimitForStage(stage, diff) {
  return Math.max(diff.stageTimeMin, diff.stageTimeStart - (stage - 1) * diff.stageTimeStep);
}
