// 入力イベント（左右ドラッグ / 矢印キー / WASD）
import { W } from './config.js';
import { getState } from './state.js';

export const keys = {};
export let dragging = false;

function clientToCanvasX(canvas, clientX) {
  const rect = canvas.getBoundingClientRect();
  return (clientX - rect.left) * (W / rect.width);
}

export function bindInput(canvas) {
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    const s = getState();
    if (s && s.running) s.target.x = clientToCanvasX(canvas, e.clientX);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const s = getState();
    if (s && s.running) s.target.x = clientToCanvasX(canvas, e.clientX);
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });

  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (['arrowleft','arrowright','a','d',' '].includes(e.key.toLowerCase())) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
}

// dragging はモジュール変数なので、外部から読み出すアクセサ
export function isDragging() { return dragging; }
