// 다국어 지원. 두 종류의 텍스트를 구분한다:
//  1) "큰 화면" 텍스트 (제목/버튼/HUD 등 게임 진행에 직접 관련된 문구) - 아래 STRINGS의
//     선택된 언어 하나로만 표시된다. 기본값은 영어.
//  2) "세부 설명" 텍스트 (난이도 카드 설명, 하단 안내문 등) - 언어 선택과 무관하게
//     항상 영어/한국어를 함께(작은 글씨로) 보여준다. I18N.t2()가 이 조합을 만든다.
const I18N = (function () {
  const LANGS = [
    { code: 'en', label: 'EN' },
    { code: 'ko', label: '한국어' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'es', label: 'ES' },
    { code: 'fr', label: 'FR' },
  ];

  const STRINGS = {
    en: {
      titleTagline: 'Blast through, survive to the end!',
      titlePrompt: 'TAP TO DEPLOY!',
      diffScreenTitle: 'SELECT DIFFICULTY',
      diffEasy: 'EASY', diffNormal: 'NORMAL', diffHard: 'HARD',
      ctrlMove: 'MOVE', ctrlFire: 'FIRE', ctrlSwitch: 'SWITCH',
      btnFire: 'FIRE', btnSwap: 'SWAP',
      hudTimeLabel: 'TIME', hudWeaponLabel: 'WPN',
      hudWeaponNormal: 'NORMAL', hudWeaponSpecial: 'SPECIAL',
      hudAmmoLabel: 'AMMO', hudStageLabel: 'STAGE', hudScoreLabel: 'SCORE',
      hudBossLabel: 'BOSS', hudEnemiesLabel: 'ENEMY',
      scAllClearTitle: '🏆 ALL CLEAR!', scBossDownTitle: '💥 BOSS DOWN!', scStageClearTitle: 'STAGE CLEAR!',
      lblBonus: 'BONUS', lblTimeLeft: 'TIME LEFT', lblScore: 'SCORE', lblStagesCleared: 'STAGES CLEARED',
      scBtnToDifficulty: 'SELECT DIFFICULTY', scBtnNextStage: 'NEXT STAGE',
      goTitle: 'GAME OVER',
      goReasonTime: "TIME'S UP", goReasonAmmo: 'OUT OF AMMO', goReasonEnergy: 'NO ENERGY LEFT',
      lblStageReached: 'STAGE REACHED',
      goBtnRestart: 'RESTART', goBtnContinue: 'CONTINUE',
      langLabel: 'LANG',
    },
    ko: {
      titleTagline: '미로를 폭파하며 끝까지 생존하라!',
      titlePrompt: '터치해서 출격!',
      diffScreenTitle: '난이도 선택',
      diffEasy: '이지', diffNormal: '노멀', diffHard: '하드',
      ctrlMove: '이동', ctrlFire: '발사', ctrlSwitch: '전환',
      btnFire: '발사', btnSwap: '전환',
      hudTimeLabel: '시간', hudWeaponLabel: '무기',
      hudWeaponNormal: '일반', hudWeaponSpecial: '특수',
      hudAmmoLabel: '탄약', hudStageLabel: '스테이지', hudScoreLabel: '점수',
      hudBossLabel: '보스', hudEnemiesLabel: '적',
      scAllClearTitle: '🏆 올 클리어!', scBossDownTitle: '💥 보스 격파!', scStageClearTitle: '스테이지 클리어!',
      lblBonus: '보너스', lblTimeLeft: '누적 시간', lblScore: '점수', lblStagesCleared: '클리어 스테이지',
      scBtnToDifficulty: '난이도 선택으로', scBtnNextStage: '다음 스테이지',
      goTitle: '게임 오버',
      goReasonTime: '시간 초과', goReasonAmmo: '탄약 소진', goReasonEnergy: '에너지 소진',
      lblStageReached: '도달 스테이지',
      goBtnRestart: '처음부터', goBtnContinue: '이어하기',
      langLabel: '언어',
    },
    zh: {
      titleTagline: '炸穿迷宫,坚持到底!',
      titlePrompt: '点击出击!',
      diffScreenTitle: '选择难度',
      diffEasy: '简单', diffNormal: '普通', diffHard: '困难',
      ctrlMove: '移动', ctrlFire: '射击', ctrlSwitch: '切换',
      btnFire: '射击', btnSwap: '切换',
      hudTimeLabel: '时间', hudWeaponLabel: '武器',
      hudWeaponNormal: '普通', hudWeaponSpecial: '特殊',
      hudAmmoLabel: '弹药', hudStageLabel: '关卡', hudScoreLabel: '分数',
      hudBossLabel: 'BOSS', hudEnemiesLabel: '敌人',
      scAllClearTitle: '🏆 全部通关!', scBossDownTitle: '💥 击败首领!', scStageClearTitle: '关卡通关!',
      lblBonus: '奖励', lblTimeLeft: '剩余时间', lblScore: '分数', lblStagesCleared: '已通关关卡',
      scBtnToDifficulty: '返回难度选择', scBtnNextStage: '下一关',
      goTitle: '游戏结束',
      goReasonTime: '时间耗尽', goReasonAmmo: '弹药耗尽', goReasonEnergy: '能量耗尽',
      lblStageReached: '到达关卡',
      goBtnRestart: '重新开始', goBtnContinue: '继续',
      langLabel: '语言',
    },
    ja: {
      titleTagline: '迷路を爆破して生き残れ!',
      titlePrompt: 'タップして出撃!',
      diffScreenTitle: '難易度選択',
      diffEasy: 'イージー', diffNormal: 'ノーマル', diffHard: 'ハード',
      ctrlMove: '移動', ctrlFire: '発射', ctrlSwitch: '切替',
      btnFire: '発射', btnSwap: '切替',
      hudTimeLabel: '時間', hudWeaponLabel: '武器',
      hudWeaponNormal: '通常', hudWeaponSpecial: '特殊',
      hudAmmoLabel: '弾薬', hudStageLabel: 'ステージ', hudScoreLabel: 'スコア',
      hudBossLabel: 'ボス', hudEnemiesLabel: '敵',
      scAllClearTitle: '🏆 オールクリア!', scBossDownTitle: '💥 ボス撃破!', scStageClearTitle: 'ステージクリア!',
      lblBonus: 'ボーナス', lblTimeLeft: '残り時間', lblScore: 'スコア', lblStagesCleared: 'クリアステージ',
      scBtnToDifficulty: '難易度選択へ', scBtnNextStage: '次のステージ',
      goTitle: 'ゲームオーバー',
      goReasonTime: '時間切れ', goReasonAmmo: '弾薬切れ', goReasonEnergy: 'エネルギー切れ',
      lblStageReached: '到達ステージ',
      goBtnRestart: '最初から', goBtnContinue: 'コンティニュー',
      langLabel: '言語',
    },
    es: {
      titleTagline: '¡Vuela el laberinto y sobrevive!',
      titlePrompt: '¡TOCA PARA JUGAR!',
      diffScreenTitle: 'ELIGE DIFICULTAD',
      diffEasy: 'FÁCIL', diffNormal: 'NORMAL', diffHard: 'DIFÍCIL',
      ctrlMove: 'MOVER', ctrlFire: 'DISPARAR', ctrlSwitch: 'CAMBIAR',
      btnFire: 'TIRO', btnSwap: 'CAMB',
      hudTimeLabel: 'TIEMPO', hudWeaponLabel: 'ARMA',
      hudWeaponNormal: 'NORMAL', hudWeaponSpecial: 'ESPECIAL',
      hudAmmoLabel: 'MUN.', hudStageLabel: 'ETAPA', hudScoreLabel: 'PUNTOS',
      hudBossLabel: 'JEFE', hudEnemiesLabel: 'ENEMIGOS',
      scAllClearTitle: '🏆 ¡TODO SUPERADO!', scBossDownTitle: '💥 ¡JEFE DERROTADO!', scStageClearTitle: '¡ETAPA SUPERADA!',
      lblBonus: 'BONO', lblTimeLeft: 'TIEMPO TOTAL', lblScore: 'PUNTOS', lblStagesCleared: 'ETAPAS SUPERADAS',
      scBtnToDifficulty: 'ELEGIR DIFICULTAD', scBtnNextStage: 'SIGUIENTE ETAPA',
      goTitle: 'FIN DEL JUEGO',
      goReasonTime: 'TIEMPO AGOTADO', goReasonAmmo: 'SIN MUNICIÓN', goReasonEnergy: 'SIN ENERGÍA',
      lblStageReached: 'ETAPA ALCANZADA',
      goBtnRestart: 'REINICIAR', goBtnContinue: 'CONTINUAR',
      langLabel: 'IDIOMA',
    },
    fr: {
      titleTagline: 'Détruisez le labyrinthe, survivez !',
      titlePrompt: 'TOUCHEZ POUR JOUER !',
      diffScreenTitle: 'CHOISIR LA DIFFICULTÉ',
      diffEasy: 'FACILE', diffNormal: 'NORMAL', diffHard: 'DIFFICILE',
      ctrlMove: 'BOUGER', ctrlFire: 'TIRER', ctrlSwitch: 'CHANGER',
      btnFire: 'TIR', btnSwap: 'CHNG',
      hudTimeLabel: 'TEMPS', hudWeaponLabel: 'ARME',
      hudWeaponNormal: 'NORMAL', hudWeaponSpecial: 'SPÉCIAL',
      hudAmmoLabel: 'MUNIT.', hudStageLabel: 'NIVEAU', hudScoreLabel: 'SCORE',
      hudBossLabel: 'BOSS', hudEnemiesLabel: 'ENNEMIS',
      scAllClearTitle: '🏆 TOUT TERMINÉ !', scBossDownTitle: '💥 BOSS VAINCU !', scStageClearTitle: 'NIVEAU TERMINÉ !',
      lblBonus: 'BONUS', lblTimeLeft: 'TEMPS RESTANT', lblScore: 'SCORE', lblStagesCleared: 'NIVEAUX TERMINÉS',
      scBtnToDifficulty: 'CHOISIR DIFFICULTÉ', scBtnNextStage: 'NIVEAU SUIVANT',
      goTitle: 'GAME OVER',
      goReasonTime: 'TEMPS ÉCOULÉ', goReasonAmmo: 'PLUS DE MUNITIONS', goReasonEnergy: "PLUS D'ÉNERGIE",
      lblStageReached: 'NIVEAU ATTEINT',
      goBtnRestart: 'RECOMMENCER', goBtnContinue: 'CONTINUER',
      langLabel: 'LANGUE',
    },
  };

  // 세부 설명(작은 글씨) 전용 - 언어 선택과 무관하게 항상 영어+한국어를 함께 표기한다.
  const DETAIL = {
    diffEasyDesc: { en: 'Relaxed · continue on fail', ko: '여유로운 진행 · 이어하기 가능' },
    diffNormalDesc: { en: 'Standard · continue on fail', ko: '표준 난이도 · 이어하기 가능' },
    diffHardDesc: { en: 'No continues · high score only', ko: '이어하기 없음 · 하이스코어만' },
    mobileNote: { en: 'Use the joystick & buttons below', ko: '하단 조이스틱과 버튼으로 조작' },
    hintText: {
      en: 'Yellow missiles break walls & enemies (limited ammo). A boss appears every 5 stages.',
      ko: '노란 미사일은 벽·적을 모두 파괴(탄약 제한). 5스테이지마다 보스 등장.',
    },
  };

  let current = 'en';
  try {
    const saved = localStorage.getItem('tanktank_lang');
    if (saved && STRINGS[saved]) current = saved;
  } catch (e) {
    // localStorage 접근 불가 환경(프라이빗 모드 등) - 기본값(en) 유지
  }

  function t(key) {
    return (STRINGS[current] && STRINGS[current][key]) || STRINGS.en[key] || key;
  }

  function t2(key) {
    const entry = DETAIL[key];
    if (!entry) return key;
    return `${entry.en} / ${entry.ko}`;
  }

  function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-bi]').forEach((el) => {
      el.textContent = t2(el.getAttribute('data-i18n-bi'));
    });
  }

  function setLang(lang) {
    if (!STRINGS[lang] || lang === current) return;
    current = lang;
    try {
      localStorage.setItem('tanktank_lang', lang);
    } catch (e) {
      // 저장 실패해도 이번 세션 표시 언어는 정상 적용됨
    }
    applyStatic();
  }

  function getLang() {
    return current;
  }

  return { LANGS, t, t2, applyStatic, setLang, getLang };
})();
