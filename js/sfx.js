// 효과음 (배경음악 없음, Web Audio API로 합성한 8비트풍 효과음만)
const SFX = (function () {
  let ctx = null;

  function ensureCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        ctx = null;
      }
    } else if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function tone(freq, duration, type, startGain, sweepTo) {
    const ac = ensureCtx();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), ac.currentTime + duration);
    }
    gain.gain.setValueAtTime(startGain, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  }

  function noise(duration, startGain) {
    const ac = ensureCtx();
    if (!ac) return;
    const bufferSize = Math.max(1, Math.floor(ac.sampleRate * duration));
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(startGain, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
  }

  return {
    // 모바일 자동재생 정책 때문에 반드시 첫 사용자 입력(타이틀 클릭 등) 안에서 호출해야 함
    unlock() {
      ensureCtx();
    },
    shoot() {
      tone(720, 0.08, 'square', 0.12, 300);
    },
    shootSpecial() {
      tone(320, 0.16, 'sawtooth', 0.15, 900);
    },
    wallBreak() {
      noise(0.15, 0.22);
    },
    enemyKill() {
      tone(220, 0.22, 'square', 0.18, 40);
      noise(0.1, 0.1);
    },
    bossKill() {
      tone(140, 0.5, 'sawtooth', 0.24, 30);
      noise(0.3, 0.18);
    },
    playerHit() {
      tone(150, 0.25, 'square', 0.2, 60);
    },
    itemPickup() {
      tone(880, 0.1, 'sine', 0.15, 1320);
    },
    weaponSwitch() {
      tone(500, 0.06, 'triangle', 0.1, 700);
    },
    stageClear() {
      [660, 880, 1320].forEach((f, i) => setTimeout(() => tone(f, 0.15, 'square', 0.15), i * 90));
    },
    gameOver() {
      tone(220, 0.6, 'sawtooth', 0.2, 55);
    },
  };
})();
