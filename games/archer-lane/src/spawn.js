// 敵・ボス・ゲートのスポーン
import { W, LANE_LEFT, LANE_RIGHT, ENEMY_R, BOSS_R } from './config.js';
import { SKILL_POOL, pickN } from './stats.js';
import { getState } from './state.js';

export function spawnEnemy() {
  const state = getState();
  const tier = Math.min(4, 1 + Math.floor(state.area / 2));
  const types = ['runner','ranger','tank'];
  const w = [0.6, 0.25, 0.15];
  let r = Math.random(), kind = 'runner';
  let acc = 0;
  for (let i = 0; i < types.length; i++) {
    acc += w[i];
    if (r < acc) { kind = types[i]; break; }
  }
  const x = LANE_LEFT + ENEMY_R + Math.random() * (LANE_RIGHT - LANE_LEFT - ENEMY_R * 2);
  // ウェーブ内で縦にもバラけさせる（同時にプレイヤーに到達しないように）
  const y = -30 - Math.random() * 200;
  const baseHp = { runner: 4, ranger: 3, tank: 10 }[kind];
  const hp = baseHp + tier + Math.floor(state.area * 0.6);
  const speed = 0; // 静止
  const dmg = { runner: 20, ranger: 14, tank: 30 }[kind]; // 接触ダメ/秒
  state.enemies.push({
    x, y, r: ENEMY_R, kind,
    hp, maxHp: hp,
    speed,
    dmg,
    shootTimer: kind === 'ranger' ? 1.5 : 0,
    alive: true,
  });
}

export function spawnBoss() {
  const state = getState();
  const tier = 1 + Math.floor(state.area / 3);
  const hp = 60 + state.area * 18;
  state.bossActive = {
    x: W / 2, y: -80, r: BOSS_R,
    hp, maxHp: hp,
    speed: 35,
    dmg: 18,
    shootTimer: 1.8,
    pattern: 0,
    tier,
    alive: true,
  };
}

export function spawnGates() {
  const state = getState();
  // 2つのゲート（左右）から1つを選んで通る。画面上端の外から降ってくる
  const picks = pickN(SKILL_POOL, 2);
  const laneW = LANE_RIGHT - LANE_LEFT;
  const gateW = (laneW - 16) / 2;
  const positions = [LANE_LEFT + gateW / 2 + 4, LANE_RIGHT - gateW / 2 - 4];
  for (let i = 0; i < 2; i++) {
    state.gates.push({
      x: positions[i],
      y: -70,
      w: gateW, h: 80,
      skill: picks[i],
      active: true,
      consumed: false,
    });
  }
}

export function startArea() {
  const state = getState();
  const a = state.area;
  state.gateApplied = false;
  state.bossActive = null;
  if (a % 3 === 0) {
    // ボスエリア（ゲートはここでは降ってこない）
    state.areaState = 'boss';
    state.enemiesToSpawn = 0;
    state.gates = [];
    state.gateScheduleTimer = null;
    spawnBoss();
  } else {
    // 通常エリア：少ない数の雑魚をウェーブで配置、ゲート常時供給
    state.areaState = 'fight';
    state.enemiesToSpawn = 3 + Math.floor(a * 0.7);
    state.spawnTimer = 0.6;
    if (state.gateScheduleTimer == null) state.gateScheduleTimer = 1.5;
  }
}

export function nextArea() {
  const state = getState();
  state.area++;
  state.enemies = [];
  state.arrows = [];
  // 未取得のゲートは持ち越し（取り損ねバグ防止）。consumed済みは捨てる
  state.gates = state.gates.filter(g => !g.consumed);
  state.pickups = [];
  startArea();
}
