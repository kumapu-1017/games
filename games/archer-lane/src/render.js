// 描画関連
import { W, H, LANE_LEFT, LANE_RIGHT } from './config.js';
import { getState } from './state.js';

let ctx = null;

export function bindRender(canvas) {
  ctx = canvas.getContext('2d');
}

export function render() {
  const state = getState();
  if (!ctx || !state) return;
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  // 道路（レーン）背景
  ctx.fillStyle = '#3b6b3a';
  ctx.fillRect(0, 0, W, H);
  // 両側の濃緑「壁」
  ctx.fillStyle = '#1f3a1f';
  ctx.fillRect(0, 0, LANE_LEFT, H);
  ctx.fillRect(LANE_RIGHT, 0, W - LANE_RIGHT, H);
  // レーン路面
  ctx.fillStyle = 'rgba(196,166,115,.32)';
  ctx.fillRect(LANE_LEFT, 0, LANE_RIGHT - LANE_LEFT, H);
  // 路面のスクロールライン（縦）
  ctx.strokeStyle = 'rgba(255,255,255,.08)';
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 18]);
  ctx.lineDashOffset = -state.scrollY;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);
  // 壁の境界線
  ctx.fillStyle = '#0e1a0e';
  ctx.fillRect(LANE_LEFT - 4, 0, 4, H);
  ctx.fillRect(LANE_RIGHT, 0, 4, H);

  // 壁側の装飾（草・石）
  for (const d of state.decor) {
    const y = (d.y + state.scrollY) % H;
    if (d.x > LANE_LEFT - 10 && d.x < LANE_RIGHT + 10) continue;
    if (d.type === 'rock') {
      ctx.fillStyle = '#3b423b';
      ctx.beginPath();
      ctx.arc(d.x, y, d.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#0f2a0f';
      ctx.fillRect(d.x - 1, y - d.size, 2, d.size);
    }
  }

  // ゲート
  for (const g of state.gates) {
    if (!g.active) continue;
    ctx.fillStyle = 'rgba(94,234,212,.18)';
    roundRect(g.x - g.w / 2, g.y - g.h / 2, g.w, g.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#5eead4';
    ctx.lineWidth = 3;
    ctx.stroke();
    // 柱
    ctx.fillStyle = '#7c5e3a';
    ctx.fillRect(g.x - g.w / 2 - 4, g.y - g.h / 2 - 6, 8, g.h + 12);
    ctx.fillRect(g.x + g.w / 2 - 4, g.y - g.h / 2 - 6, 8, g.h + 12);
    ctx.fillRect(g.x - g.w / 2 - 10, g.y - g.h / 2 - 10, g.w + 20, 8);
    // ラベル
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g.skill.name, g.x, g.y);
  }

  // 矢
  for (const a of state.arrows) {
    if (a.fromEnemy) {
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(a.x, a.y, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const ang = Math.atan2(a.vy, a.vx);
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(ang);
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(4, -5);
      ctx.lineTo(4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // pickups
  for (const c of state.pickups) {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // enemies
  for (const e of state.enemies) {
    if (!e.alive) continue;
    drawEnemy(e);
  }

  // boss
  if (state.bossActive) drawBoss(state.bossActive);

  // player
  drawPlayer(state.player);

  // floats
  for (const f of state.floats) {
    const alpha = Math.min(1, f.life / 0.8);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = f.color;
    ctx.font = `bold ${f.size}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  // HPバー (player)
  {
    const p = state.player;
    const w = 32, h = 4;
    ctx.fillStyle = '#1b1f3b';
    ctx.fillRect(p.x - w / 2, p.y + 16, w, h);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(p.x - w / 2, p.y + 16, w * Math.max(0, p.hp / p.maxHp), h);
  }

  // flash
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(${hexToRgb(state.flashColor)},${state.flash * 0.25})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

function drawPlayer(p) {
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 22, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5eead4';
  ctx.fillRect(p.x - 10, p.y - 6, 20, 22);
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 16, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x + 12, p.y - 4, 12, -Math.PI / 2 - 0.7, -Math.PI / 2 + 0.7, false);
  ctx.stroke();
}

function drawEnemy(e) {
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + e.r - 2, e.r * 0.85, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const col = e.kind === 'tank' ? '#b91c1c' : e.kind === 'ranger' ? '#a855f7' : '#fb7185';
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(e.x - 5, e.y - 3, 3, 0, Math.PI * 2);
  ctx.arc(e.x + 5, e.y - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(e.x - 5, e.y - 3, 1.5, 0, Math.PI * 2);
  ctx.arc(e.x + 5, e.y - 3, 1.5, 0, Math.PI * 2);
  ctx.fill();
  const w = e.r * 2;
  ctx.fillStyle = '#1b1f3b';
  ctx.fillRect(e.x - w / 2, e.y - e.r - 9, w, 5);
  ctx.fillStyle = '#86efac';
  ctx.fillRect(e.x - w / 2, e.y - e.r - 9, w * (e.hp / e.maxHp), 5);
}

function drawBoss(b) {
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.beginPath();
  ctx.ellipse(b.x, b.y + b.r - 4, b.r * 0.9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.arc(b.x, b.y - 6, b.r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1f3b';
  ctx.beginPath();
  ctx.moveTo(b.x - 20, b.y - 24);
  ctx.lineTo(b.x - 10, b.y - 36);
  ctx.lineTo(b.x - 6, b.y - 20);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(b.x + 20, b.y - 24);
  ctx.lineTo(b.x + 10, b.y - 36);
  ctx.lineTo(b.x + 6, b.y - 20);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(b.x - 8, b.y - 6, 4, 0, Math.PI * 2);
  ctx.arc(b.x + 8, b.y - 6, 4, 0, Math.PI * 2);
  ctx.fill();
  const w = W - 60;
  ctx.fillStyle = '#1b1f3b';
  ctx.fillRect(30, 10, w, 10);
  ctx.fillStyle = '#fb7185';
  ctx.fillRect(30, 10, w * (b.hp / b.maxHp), 10);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 10, w, 10);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS  ' + Math.max(0, Math.ceil(b.hp)) + '/' + b.maxHp, W / 2, 18);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexToRgb(hex) {
  const m = hex.match(/[0-9a-f]{2}/gi);
  if (!m) return '255,255,255';
  return m.map(x => parseInt(x, 16)).join(',');
}

export function renderIdle() {
  if (!ctx) return;
  ctx.fillStyle = '#3b6b3a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(196,166,115,.35)';
  ctx.fillRect(W / 2 - 90, 0, 180, H);
}
