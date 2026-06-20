// エントリポイント: 初期化・ループ・開始/終了フロー
import { initState, getState } from './state.js';
import { bindInput } from './input.js';
import { bindRender } from './render.js';
import { update, onEndGame } from './update.js';
import { ui, refreshBuilds } from './ui.js';
import { startArea } from './spawn.js';

const canvas = document.getElementById('game');
bindRender(canvas);
bindInput(canvas);

// タブが非表示でも進行できるよう、rAFと setTimeout を併用
function scheduleNext() {
  if (document.hidden) setTimeout(() => loop(performance.now()), 50);
  else requestAnimationFrame(loop);
}

function loop(ts) {
  const state = getState();
  if (!state) return;
  if (!state.lastTs) state.lastTs = ts;
  const dt = Math.min(0.05, (ts - state.lastTs) / 1000);
  state.lastTs = ts;
  update(dt);
  scheduleNext();
}

function startGame() {
  initState();
  const state = getState();
  state.running = true;
  window.__state = state; // debug
  refreshBuilds();
  ui.overlayStart.classList.remove('show');
  ui.overlayEnd.classList.remove('show');
  ui.overlayReward.classList.remove('show');
  startArea();
}

function endGame(cleared) {
  const state = getState();
  ui.endTitle.textContent = cleared ? '🎉 CLEAR!' : 'やられた…';
  ui.endScore.textContent = state.score;
  ui.endSub.textContent = `エリア ${state.area} まで到達 / コイン ${state.coins}`;
  ui.overlayEnd.classList.add('show');
}

onEndGame(endGame);

ui.btnStart.addEventListener('click', startGame);
ui.btnRetry.addEventListener('click', startGame);

// 初期state（タイトル画面表示用）
initState();
getState().running = false;
window.__state = getState();
window.__update = update; // debug: 同期テスト用
scheduleNext();
