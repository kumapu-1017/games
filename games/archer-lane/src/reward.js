// スキル適用 + ボス報酬モーダル
import { EQUIP_POOL, pickN } from './stats.js';
import { getState } from './state.js';
import { addFloat } from './combat.js';
import { ui, refreshBuilds } from './ui.js';
import { nextArea } from './spawn.js';

export function applySkill(skill) {
  const state = getState();
  skill.apply(state.player);
  state.builds.push({ type: 'skill', name: skill.name });
  addFloat(state.player.x, state.player.y - 30, skill.name, '#5eead4', 14);
  state.flash = 0.4;
  state.flashColor = '#5eead4';
  refreshBuilds();
}

export function weightedRarity() {
  const state = getState();
  const r = Math.random();
  const lvlBonus = state.area * 0.03;
  if (r < 0.15 + lvlBonus) return 3;
  if (r < 0.45 + lvlBonus) return 2;
  return 1;
}

export function showRewardModal() {
  const state = getState();
  const picks = pickN(EQUIP_POOL, 3);
  ui.rewardGrid.innerHTML = '';
  ui.rewardTitle.textContent = '🎁 賞を選んでください';
  picks.forEach((eq) => {
    const rarity = weightedRarity();
    const card = document.createElement('button');
    card.className = 'reward-card';
    card.dataset.rarity = rarity;
    card.innerHTML = `
      <div class="icon">${eq.icon}</div>
      <div class="name">${eq.name}</div>
      <div class="stars">${'★'.repeat(rarity)}${'☆'.repeat(3 - rarity)}</div>
      <div class="desc">${eq.desc}${rarity > 1 ? ' ×' + rarity : ''}</div>
    `;
    card.addEventListener('click', () => {
      eq.apply(state.player, rarity);
      state.builds.push({ type: 'equip', name: eq.name, icon: eq.icon, rarity });
      refreshBuilds();
      ui.overlayReward.classList.remove('show');
      state.running = true;
      nextArea();
    });
    ui.rewardGrid.appendChild(card);
  });
  ui.overlayReward.classList.add('show');
}
