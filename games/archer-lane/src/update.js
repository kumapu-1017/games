// 毎フレームのゲームロジック
import { W, H, SCROLL_SPEED, LANE_LEFT, LANE_RIGHT, PLAYER_R, PLAYER_Y } from './config.js';
import { getState } from './state.js';
import { keys, isDragging } from './input.js';
import { spawnEnemy, spawnGates, nextArea } from './spawn.js';
import { autoFire, enemyShoot, bossShoot, damagePlayer, dropCoin, addFloat } from './combat.js';
import { applySkill, showRewardModal } from './reward.js';
import { refreshHud } from './ui.js';
import { render, renderIdle } from './render.js';

export function update(dt) {
  const state = getState();
  if (!state.running) { renderIdle(); return; }
  const p = state.player;

  // input (左右のみ)
  let kx = 0;
  if (keys['arrowleft'] || keys['a']) kx -= 1;
  if (keys['arrowright'] || keys['d']) kx += 1;
  const moveSpeed = 240 * p.moveSpeed;
  if (kx) {
    p.x += kx * moveSpeed * dt;
    state.target.x = p.x;
  } else if (isDragging()) {
    const dx = state.target.x - p.x;
    const dist = Math.abs(dx);
    if (dist > 2) {
      const v = Math.min(dist / dt, moveSpeed);
      p.x += Math.sign(dx) * v * dt;
    }
  }
  p.x = Math.max(LANE_LEFT + PLAYER_R, Math.min(LANE_RIGHT - PLAYER_R, p.x));
  p.y = PLAYER_Y; // 縦は固定（強制スクロール）

  // 背景スクロール
  state.scrollY = (state.scrollY + SCROLL_SPEED * dt) % 60;

  // === Fight state: ウェーブで敵を配置 + ゲート常時供給 ===
  if (state.areaState === 'fight') {
    if (state.enemiesToSpawn > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        const burst = Math.min(state.enemiesToSpawn, 2 + Math.floor(Math.random() * 2));
        for (let i = 0; i < burst; i++) spawnEnemy();
        state.enemiesToSpawn -= burst;
        state.spawnTimer = 2.5 + Math.random() * 1.0;
      }
    }
    if (state.gateScheduleTimer != null) {
      state.gateScheduleTimer -= dt;
      if (state.gateScheduleTimer <= 0) {
        spawnGates();
        state.gateScheduleTimer = null;
      }
    }
    if (state.enemiesToSpawn === 0 && state.enemies.every(e => !e.alive)) {
      if (state.areaState !== 'cleared') {
        state.areaState = 'cleared';
        addFloat(W / 2, p.y - 60, 'CLEAR!', '#86efac', 26);
        state.clearTimer = 1.2;
      }
    }
  }

  // cleared状態でタイマー消化 → 次エリア
  // ただし、降下中で未取得のゲートがある間は待つ（取り損ねバグ防止）
  if (state.areaState === 'cleared') {
    const hasPendingGate = state.gates.some(g => !g.consumed);
    if (!hasPendingGate) {
      state.clearTimer -= dt;
      if (state.clearTimer <= 0) {
        nextArea();
      }
    }
  }

  // === Boss state ===
  if (state.areaState === 'boss' && state.bossActive) {
    const b = state.bossActive;
    if (b.y < 130) {
      b.y += 80 * dt;
    } else {
      b.x += Math.sin(performance.now() / 700) * 100 * dt * 2;
      b.x = Math.max(LANE_LEFT + b.r, Math.min(LANE_RIGHT - b.r, b.x));
      b.shootTimer -= dt;
      if (b.shootTimer <= 0) {
        bossShoot(b);
        b.shootTimer = 1.6;
      }
    }
    if (!b.alive) {
      state.bossActive = null;
      state.areaState = 'reward';
      state.running = false;
      setTimeout(() => showRewardModal(), 600);
    }
  }

  // === Auto fire ===
  state.fireTimer -= dt;
  if (state.fireTimer <= 0) {
    autoFire();
    state.fireTimer = 1 / p.fireRate;
  }

  // === Enemies (静止 + スクロール) ===
  for (const e of state.enemies) {
    if (!e.alive) continue;
    e.y += SCROLL_SPEED * dt;
    if (e.kind === 'ranger') {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && e.y > -10 && e.y < H + 10) {
        enemyShoot(e);
        e.shootTimer = 1.6 + Math.random() * 0.4;
      }
    } else if (e.kind === 'runner') {
      const dx = p.x - e.x;
      if (Math.abs(dx) < 60 && e.y < p.y - 20) {
        e.x += Math.sign(dx) * 40 * dt;
      }
    }
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    if (d < e.r + PLAYER_R) {
      damagePlayer(e.dmg * dt);
      const push = (e.r + PLAYER_R - d);
      e.x += ((e.x - p.x) / Math.max(d, 0.1)) * push * 0.5;
    }
    if (e.y > H + 40) e.alive = false;
  }

  // boss contact
  if (state.bossActive) {
    const b = state.bossActive;
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    if (d < b.r + PLAYER_R) damagePlayer(b.dmg * dt);
  }

  // === Update arrows ===
  for (const a of state.arrows) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
  }
  state.arrows = state.arrows.filter(a => a.y > -40 && a.y < H + 40 && a.x > -40 && a.x < W + 40 && !a.dead);

  // arrow vs enemies / boss
  for (const a of state.arrows) {
    if (a.fromEnemy) continue;
    let hit = false;
    for (const e of state.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(a.x - e.x, a.y - e.y);
      if (d < e.r + 8) {
        if (!a.hits) a.hits = new Set();
        if (a.hits.has(e)) continue;
        a.hits.add(e);
        const isCrit = Math.random() < p.critRate;
        const dmg = a.dmg * (isCrit ? p.critMul : 1);
        e.hp -= dmg;
        addFloat(e.x, e.y - e.r - 4, Math.round(dmg), isCrit ? '#fde047' : '#ffffff', isCrit ? 16 : 13);
        if (p.lifeSteal > 0) p.hp = Math.min(p.maxHp, p.hp + dmg * p.lifeSteal);
        if (e.hp <= 0) {
          e.alive = false;
          state.score += 10;
          if (Math.random() < 0.5) dropCoin(e.x, e.y);
          addFloat(e.x, e.y, '+10', '#86efac', 13);
        }
        if (a.pierceLeft > 0) { a.pierceLeft--; }
        else { a.dead = true; hit = true; break; }
      }
    }
    if (hit) continue;
    if (state.bossActive) {
      const b = state.bossActive;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < b.r + 8 && !(a.hits && a.hits.has(b))) {
        if (!a.hits) a.hits = new Set();
        a.hits.add(b);
        const isCrit = Math.random() < p.critRate;
        const dmg = a.dmg * (isCrit ? p.critMul : 1);
        b.hp -= dmg;
        addFloat(b.x, b.y - b.r - 4, Math.round(dmg), isCrit ? '#fde047' : '#ffffff', isCrit ? 18 : 14);
        if (p.lifeSteal > 0) p.hp = Math.min(p.maxHp, p.hp + dmg * p.lifeSteal);
        if (b.hp <= 0) {
          b.alive = false;
          state.score += 200;
          addFloat(b.x, b.y, '+200', '#fde047', 22);
          for (let i = 0; i < 8; i++) dropCoin(b.x + (Math.random() - 0.5) * 40, b.y + (Math.random() - 0.5) * 40);
        }
        if (a.pierceLeft > 0) a.pierceLeft--;
        else a.dead = true;
      }
    }
  }

  // enemy arrows vs player
  for (const a of state.arrows) {
    if (!a.fromEnemy) continue;
    const d = Math.hypot(a.x - p.x, a.y - p.y);
    if (d < PLAYER_R + 6) {
      damagePlayer(a.dmg);
      a.dead = true;
    }
  }

  // pickups
  for (const c of state.pickups) {
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < 40) {
      const ang = Math.atan2(p.y - c.y, p.x - c.x);
      c.x += Math.cos(ang) * 220 * dt;
      c.y += Math.sin(ang) * 220 * dt;
    }
    if (d < PLAYER_R + 6) {
      c.dead = true;
      state.coins += 1;
      state.score += 2;
    }
  }
  state.pickups = state.pickups.filter(c => !c.dead);

  // floats
  for (const f of state.floats) {
    f.y -= 40 * dt;
    f.life -= dt;
  }
  state.floats = state.floats.filter(f => f.life > 0);

  // === Gate scroll + pickup ===
  for (const g of state.gates) {
    if (g.consumed) continue;
    g.y += SCROLL_SPEED * dt;
  }
  for (const g of state.gates) {
    if (g.consumed) continue;
    const top = g.y - g.h / 2;
    const bottom = g.y + g.h / 2;
    if (bottom >= p.y - PLAYER_R && top <= p.y + PLAYER_R) {
      if (p.x >= g.x - g.w / 2 && p.x <= g.x + g.w / 2) {
        applySkill(g.skill);
        state.gates.forEach(x => x.consumed = true);
        state.gateApplied = true;
        break;
      }
    }
  }
  if (state.gates.length && state.gates.every(g => g.consumed || (g.y - g.h / 2) > (p.y + PLAYER_R))) {
    if (!state.gateApplied) {
      addFloat(p.x, p.y - 40, '取り損ね…', '#9aa3d0', 16);
    }
    state.gates = [];
    state.gateApplied = false;
    if (state.areaState === 'fight') {
      state.gateScheduleTimer = 1.8 + Math.random() * 0.8;
    }
  }

  // visual
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 25);
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 2.5);

  // 死亡
  if (p.hp <= 0 && state.running) {
    state.running = false;
    state.gameOver = true;
    setTimeout(() => endGameDispatch(), 500);
  }

  refreshHud();
  render();
}

// 死亡時のエンディング表示をmain側に通知するためのフック
let _endGameHandler = null;
export function onEndGame(handler) { _endGameHandler = handler; }
function endGameDispatch() { if (_endGameHandler) _endGameHandler(false); }
