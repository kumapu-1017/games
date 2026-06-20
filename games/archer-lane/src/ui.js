// HUD / オーバーレイ / ビルド一覧の更新
import { getState } from './state.js';

const $ = (id) => document.getElementById(id);

export const ui = {
  hudHp: $('hudHp'),
  hudArea: $('hudArea'),
  hudScore: $('hudScore'),
  hudCoin: $('hudCoin'),
  overlayStart: $('overlayStart'),
  overlayReward: $('overlayReward'),
  overlayEnd: $('overlayEnd'),
  rewardGrid: $('rewardGrid'),
  rewardTitle: $('rewardTitle'),
  buildList: $('buildList'),
  endTitle: $('endTitle'),
  endScore: $('endScore'),
  endSub: $('endSub'),
  btnStart: $('btnStart'),
  btnRetry: $('btnRetry'),
};

export function refreshHud() {
  const s = getState();
  if (!s) return;
  ui.hudHp.textContent = Math.max(0, Math.ceil(s.player.hp)) + '/' + s.player.maxHp;
  ui.hudArea.textContent = s.area;
  ui.hudScore.textContent = s.score;
  ui.hudCoin.textContent = s.coins;
}

export function refreshBuilds() {
  const s = getState();
  if (!s || s.builds.length === 0) {
    ui.buildList.textContent = 'まだ何も取得していないよ';
    return;
  }
  ui.buildList.innerHTML = s.builds.map(b => {
    const star = b.rarity ? '★'.repeat(b.rarity) : '';
    return `<span class="build-tag">${b.icon || ''} ${b.name}${star ? ' ' + star : ''}</span>`;
  }).join(' ');
}
