// ゲーム全体の state を提供。他モジュールは getState() / setState() を使う。
import { W, H, PLAYER_Y } from './config.js';
import { baseStats } from './stats.js';

let _state = null;

export function getState() { return _state; }

export function initState() {
  _state = {
    player: { x: W / 2, y: PLAYER_Y, ...baseStats() },
    target: { x: W / 2 },
    enemies: [],
    arrows: [],
    gates: [],
    pickups: [],     // dropped coins
    floats: [],      // damage text
    area: 1,
    areaState: 'fight', // fight | cleared | boss | reward
    enemiesToSpawn: 0,
    spawnTimer: 0,
    fireTimer: 0,
    clearTimer: 0,
    gateScheduleTimer: null,
    gateApplied: false,
    score: 0,
    coins: 0,
    builds: [],
    running: false,
    gameOver: false,
    lastTs: 0,
    shake: 0,
    flash: 0,
    flashColor: '#ffffff',
    bossActive: null,
    decor: makeDecor(),
    scrollY: 0,
  };
  return _state;
}

function makeDecor() {
  // 草や石をランダム配置（描画用）
  const arr = [];
  for (let i = 0; i < 40; i++) {
    arr.push({
      x: Math.random() * W,
      y: Math.random() * H,
      type: Math.random() < 0.3 ? 'rock' : 'grass',
      size: 3 + Math.random() * 5,
    });
  }
  return arr;
}
