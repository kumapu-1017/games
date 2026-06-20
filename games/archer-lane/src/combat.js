// 射撃ロジック、ダメージ計算
import { ARROW_BASE_SPEED } from './config.js';
import { getState } from './state.js';

export function autoFire() {
  const state = getState();
  const p = state.player;
  const target = nearestTarget();
  if (!target) return;
  const ang = Math.atan2(target.y - p.y, target.x - p.x);
  const speed = ARROW_BASE_SPEED * p.arrowSpeed;
  const n = p.multi;
  const spread = (n - 1) * 0.15;
  for (let i = 0; i < n; i++) {
    const a = ang - spread / 2 + (n === 1 ? 0 : spread * (i / (n - 1)));
    state.arrows.push({
      x: p.x, y: p.y - 6,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      dmg: p.arrowDmg,
      pierceLeft: p.pierce,
      fromEnemy: false,
    });
  }
}

export function nearestTarget() {
  const state = getState();
  const p = state.player;
  let best = null, bd = Infinity;
  for (const e of state.enemies) {
    if (!e.alive) continue;
    if (e.y < 0) continue; // 画面外のものは狙わない
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < bd) { bd = d; best = e; }
  }
  if (state.bossActive && state.bossActive.alive && state.bossActive.y > 0) {
    const b = state.bossActive;
    const d = Math.hypot(b.x - p.x, b.y - p.y);
    if (d < bd || best === null) { bd = d; best = b; }
  }
  return best;
}

export function enemyShoot(e) {
  const state = getState();
  const p = state.player;
  const ang = Math.atan2(p.y - e.y, p.x - e.x);
  const speed = 260;
  state.arrows.push({
    x: e.x, y: e.y,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    dmg: 10,
    fromEnemy: true,
  });
}

export function bossShoot(b) {
  const state = getState();
  const p = state.player;
  const baseAng = Math.atan2(p.y - b.y, p.x - b.x);
  const n = 5;
  const spread = 0.6;
  for (let i = 0; i < n; i++) {
    const a = baseAng - spread / 2 + spread * (i / (n - 1));
    state.arrows.push({
      x: b.x, y: b.y,
      vx: Math.cos(a) * 240,
      vy: Math.sin(a) * 240,
      dmg: 10,
      fromEnemy: true,
    });
  }
}

export function damagePlayer(amount) {
  const state = getState();
  const p = state.player;
  const reduced = amount * (1 - p.dmgReduce);
  p.hp -= reduced;
  if (reduced > 2) {
    state.shake = 6;
    state.flash = 0.4;
    state.flashColor = '#fb7185';
  }
}

export function dropCoin(x, y) {
  getState().pickups.push({ x, y, dead: false, t: 0 });
}

export function addFloat(x, y, text, color, size) {
  getState().floats.push({ x, y, text: String(text), color, size: size || 13, life: 0.8 });
}
