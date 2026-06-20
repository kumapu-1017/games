// プレイヤーのステータス定義と、スキル/装備プール

export const baseStats = () => ({
  arrowDmg: 2,
  fireRate: 2.4,   // shots / sec
  arrowSpeed: 1.0,
  pierce: 0,
  multi: 1,
  critRate: 0.05,
  critMul: 2.0,
  lifeSteal: 0,
  moveSpeed: 1.0,
  maxHp: 100,
  hp: 100,
  dmgReduce: 0,
});

// ゲートで降ってくるスキル
export const SKILL_POOL = [
  { key: 'arrowDmg',   name: '矢ダメ +1',    apply: s => s.arrowDmg += 1 },
  { key: 'fireRate',   name: '連射速度 +15%', apply: s => s.fireRate *= 1.15 },
  { key: 'arrowSpeed', name: '矢速 +20%',    apply: s => s.arrowSpeed *= 1.20 },
  { key: 'pierce',     name: '貫通 +1',      apply: s => s.pierce += 1 },
  { key: 'multi',      name: '多段矢 +1',    apply: s => s.multi += 1 },
  { key: 'crit',       name: '会心率 +8%',   apply: s => s.critRate += 0.08 },
  { key: 'critDmg',    name: '会心ダメ +50%', apply: s => s.critMul += 0.5 },
  { key: 'moveSpeed',  name: '移動速度 +10%', apply: s => s.moveSpeed *= 1.10 },
  { key: 'maxHp',      name: 'HP上限 +20',   apply: s => { s.maxHp += 20; s.hp += 20; } },
  { key: 'heal',       name: '回復 30',      apply: s => { s.hp = Math.min(s.maxHp, s.hp + 30); } },
];

// ボス撃破後の報酬カード
export const EQUIP_POOL = [
  { name: '射手のグローブ',  icon: '🧤', desc: 'ライフ吸収 +6%', apply: (s, r) => s.lifeSteal += 0.06 * r },
  { name: '炎の矢じり',      icon: '🔥', desc: '矢ダメ +2',      apply: (s, r) => s.arrowDmg += 2 * r },
  { name: '俊敏のブーツ',    icon: '👢', desc: '移動速度 +15%',  apply: (s, r) => s.moveSpeed *= (1 + 0.15 * r) },
  { name: '鷹の眼',          icon: '🥽', desc: '会心率 +10%',    apply: (s, r) => s.critRate += 0.10 * r },
  { name: '鉄の鎧',          icon: '🛡', desc: 'ダメ軽減 +10%',  apply: (s, r) => s.dmgReduce = Math.min(0.7, s.dmgReduce + 0.10 * r) },
  { name: '雷の弓',          icon: '⚡', desc: '連射 +25%',      apply: (s, r) => s.fireRate *= (1 + 0.25 * r) },
  { name: '貫通の矢',        icon: '🏹', desc: '貫通 +1',        apply: (s, r) => s.pierce += 1 * r },
  { name: '生命の指輪',      icon: '💍', desc: 'HP上限 +30',     apply: (s, r) => { s.maxHp += 30 * r; s.hp += 30 * r; } },
];

// 配列からn個ランダムに重複なしで抽出
export function pickN(pool, n) {
  const arr = pool.slice();
  const out = [];
  for (let i = 0; i < n && arr.length; i++) {
    const idx = Math.floor(Math.random() * arr.length);
    out.push(arr.splice(idx, 1)[0]);
  }
  return out;
}
