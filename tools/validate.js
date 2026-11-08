// データの整合性と到達可能性を検証する: node tools/validate.js
const D = require("../data.js");
const P = require("../elements.js");
require("../elements_extra.js");
require("../elements_compounds.js");
require("../elements_safety.js");
require("../elements_phases.js");
require("../elements_distill.js");
require("../elements_electric.js");
require("../elements_cells.js");
require("../elements_organic.js");
require("../elements_chem.js");
require("../elements_dyn.js");
require("../elements_yield.js");
require("../elements_yield2.js");
require("../elements_why.js");
require("../elements_market.js");
require("../elements_invest.js");
require("../elements_risk.js");
require("../elements_uses.js");
require("../elements_era.js");
require("../elements_more.js");
require("../elements_inorg.js");
require("../elements_org2.js");
require("../elements_bio.js");
require("../elements_org3.js");
require("../elements_inorg2.js");
require("../elements_adv.js");
require("../elements_nat.js");
require("../elements_extract.js");
require("../elements_yield3.js");
require("../elements_econ.js");
require("../elements_history.js");
require("../elements_replay.js");
require("../elements_replay2.js");
require("../elements_replay3.js");
require("../elements_replay4.js");
require("../elements_replay5.js");
require("../elements_know.js");
require("../elements_myth.js");
require("../elements_myth2.js");
const items = {};
for (const r of D.ITEM_ROWS) {
  if (items[r[0]]) throw new Error("duplicate item " + r[0]);
  items[r[0]] = { id: r[0], type: r[3], era: r[4], sym: r[7] };
}
const errs = [];
const keys = new Set();
for (const [ins, outs] of D.RECIPE_ROWS) {
  const k = [...ins].sort().join("+");
  if (keys.has(k)) errs.push("duplicate recipe " + k);
  keys.add(k);
  if (ins.length < 1 || ins.length > 3) errs.push("bad input count " + k);
  [...ins, ...outs].forEach((i) => !items[i] && errs.push("unknown item " + i));
}
for (const [, , , , ratio] of D.RECIPE_ROWS) if (ratio) for (const n of Object.values(ratio)) if (n > D.MAX_AMT) errs.push("配合比が最大量を超えている");
for (const r of D.RECIPE_ROWS) if (r[6] !== undefined && !(Number.isInteger(r[6]) && r[6] > 1)) errs.push("repeat が不正: " + r[0].join("+"));
for (const t of D.TECHS) {
  [...t.req, ...t.grants].forEach((i) => !items[i] && errs.push("unknown item in tech " + i));
}

// シミュレーション: 全レシピを実行 → 買える技術を安い順に購入 を繰り返す
const have = new Set([...D.START_ITEMS, ...(D.SPECIAL_ITEMS || [])]);
const boughtT = new Set();
let pt = 0;
const doneR = new Set();
let progress = true;
while (progress) {
  progress = false;
  const maxT = () => { let m = 0; D.TEMPS.forEach((t, i) => { if (t && (!t.need || have.has(t.need)) && i > m) m = i; }); return m; };
  const srcs = () => D.SOURCES ? Object.keys(D.SOURCES).filter((s) => have.has(s)) : [];
  if (srcs().length) have.add("electricity");
  for (const rp of D.REPLAYS || []) { const g = D.REPLAY_GRANTS && D.REPLAY_GRANTS[rp.id]; if (g && !have.has(g) && rp.gear.every((x) => have.has(x))) { have.add(g); progress = true; } } // 追体験で、知識を得る
  const ELP = (e) => { // 電気の条件を満たせるか
    const list = srcs(); if (!list.length) return false;
    const best = Math.max(...list.map((s) => D.SOURCES[s].level));
    const maxV = Math.max(...list.map((s) => (D.SOURCES[s].maxV || D.SOURCES[s].perCell * D.SOURCES[s].maxCells)));
    if (e.v[0] > maxV) return false;
    if ((e.cur || 1) > best) return false;
    const okEl = (spec) => !spec || (spec === "inert" ? D.INERT.some((x) => have.has(x)) : spec.every((x) => have.has(x)) || spec.some((x) => have.has(x)));
    return okEl(e.an) && okEl(e.ca);
  };
  for (const [ins, outs, , cond, , , , equip, elec] of D.RECIPE_ROWS) {
    const k = ins.join("+");
    if (doneR.has(k) || !ins.every((i) => have.has(i))) continue;
    { const gt = D.REPLAY_GATES && D.REPLAY_GATES[[...ins].sort().join("+")]; if (gt && !have.has(gt)) continue; } // 追体験の知識が、必要な実験
    if (equip && !equip.every((e) => have.has(e))) continue;
    if (elec && !ELP(elec)) continue;
    if (cond) {
      let okT = false;
      for (let L = 1; L <= maxT(); L++) if (L >= cond.t[0] && L <= cond.t[1]) okT = true;
      if (!okT) continue;
      if (cond.sealed === true && !have.has(D.SEAL_NEED)) continue;
      if (cond.fine && !have.has("mortar")) continue;
    }
    doneR.add(k);
    for (const o of outs) if (!have.has(o)) { have.add(o); pt += D.PT_BY_TYPE[items[o].type]; progress = true; }
  }
  for (const [mix, d] of Object.entries(D.DIST || {})) { // 蒸留で取り出せる成分
    if (!have.has(mix) || !have.has("alembic")) continue;
    const sharp = have.has("rectification_column") ? 2 : have.has("fractionating_column") ? 8 : 25;
    for (let i = 0; i < d.comps.length; i++) {
      const c = d.comps[i], nx = d.comps[i + 1];
      if (!c.res && nx && !nx.res && nx.bp - sharp <= c.bp) break; // この装置では分けられない
      if (c.out && !have.has(c.out)) { have.add(c.out); pt += D.PT_BY_TYPE[items[c.out].type]; progress = true; }
    }
  }
  const elCount = () => [...have].filter((i) => items[i].type === "element").length;
  const avail = D.TECHS.filter((t) => !boughtT.has(t.id) && t.req.every((i) => have.has(i)) && (!t.reqEl || elCount() >= t.reqEl) && pt >= t.cost).sort((a, b) => a.cost - b.cost);
  if (avail.length) {
    const t = avail[0];
    pt -= t.cost; boughtT.add(t.id);
    t.grants.forEach((g) => have.add(g));
    progress = true;
  }
}
const syms = new Set(D.ITEM_ROWS.map((r) => r[7]).filter(Boolean));
const noSym = P.PERIODIC.filter((e) => !syms.has(e[1])).map((e) => e[1]);
if (noSym.length) errs.push("周期表に対応アイテムなし: " + noSym.join(","));
const missing = Object.keys(items).filter((i) => !have.has(i));
if (missing.length) errs.push("到達不能: " + missing.join(", "));
if (boughtT.size !== D.TECHS.length) errs.push("未購入の技術: " + D.TECHS.filter((t) => !boughtT.has(t.id)).map((t) => t.id).join(", "));
// 収率: 各モデルが、レシピの温度窓と圧力段階のどこかで、しきい値を超えられるか
if (D.YIELDS) for (const [key, m] of Object.entries(D.YIELDS)) {
  const row = D.RECIPE_ROWS.find((r) => [...r[0]].sort().join("+") === key); if (!row) { errs.push("収率モデルのレシピなし: " + key); continue; }
  const win = (row[3] && row[3].t) || [1, 5]; let best = 0;
  const temps = m.ambient ? D.COOL_C : [];
  if (!m.ambient) for (let lv = win[0]; lv <= win[1]; lv++) temps.push(D.TEMP_C[lv]);
  for (const T of temps) for (const pl of D.PRESS_LEVELS) { const yy = D.yieldOf(key, T, pl.p, false); if (yy) best = Math.max(best, yy.y); }
  if (best < m.threshold) errs.push("収率が届かない: " + key + " 最大 " + best.toFixed(3));
}
// 反応式: 原子数が釣り合っているか、化学種と ΔfH が揃っているか
if (D.EQUATIONS) {
  for (const eq of D.EQUATIONS) {
    const tot = (side) => { const c = {}; for (const [k, id] of side) { const sp = D.speciesInfo(id); if (!sp) { errs.push("反応式の化学種なし: " + eq.id + " " + id); return null; } for (const [el, p] of Object.entries(sp.prof)) c[el] = (c[el] || 0) + k * p.n; } return c; };
    const L = tot(eq.L), R = tot(eq.R); if (!L || !R) continue;
    for (const el of new Set([...Object.keys(L), ...Object.keys(R)])) if ((L[el] || 0) !== (R[el] || 0)) errs.push("反応式が釣り合わない: " + eq.id + " " + el + " " + (L[el] || 0) + "≠" + (R[el] || 0));
    if (eq.dh === undefined) for (const [, id] of [...eq.L, ...eq.R]) if (D.HF[id] === undefined && !(D.SPECIES[id] && D.HF[id] !== undefined)) errs.push("ΔfH なし: " + eq.id + " " + id);
  }
}
console.log(`items=${Object.keys(items).length} recipes=${D.RECIPE_ROWS.length} techs=${D.TECHS.length} leftoverPt=${pt}`);
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log("OK: すべてのアイテムに到達可能");

{ const D = require("../elements_extra.js")._D; if (D.MARKET_UNKNOWN.length) { console.log("価格表に存在しないID:", D.MARKET_UNKNOWN.join(" ")); process.exitCode = 1; } else console.log("OK: 価格表のIDはすべて実在(" + Object.keys(D.MARKET).length + "品目)"); }

{ const D = require("../elements_extra.js")._D; const miss = D.ITEM_ROWS.filter((r) => ["element", "compound", "material"].includes(r[3]) && !D.USES[r[0]]).map((r) => r[0]); console.log(miss.length ? "用途が未記入: " + miss.join(" ") : "OK: 元素・化合物・素材のすべてに用途がある"); if (miss.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D; const ids = new Set(D.ITEM_ROWS.map((r) => r[0])); const bad = [...Object.keys(D.ERA_USES), ...Object.keys(D.DEMAND_ERA), ...Object.keys(D.PRICE_ERA)].filter((k) => !ids.has(k)); console.log(bad.length ? "時代データに存在しないID: " + bad.join(" ") : "OK: 時代別の用途・需要・価格のIDはすべて実在"); if (bad.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D; const ids = new Set(D.IND_TECHS.map((t) => t.id)); const bad = D.IND_TECHS.flatMap((t) => (t.req || []).filter((q) => !ids.has(q)).map((q) => t.id + "→" + q)); console.log(bad.length ? "産業技術の前提が不正: " + bad.join(" ") : "OK: 産業技術の前提(" + D.IND_TECHS.length + "件)"); if (bad.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D; const ids = new Set(D.ITEM_ROWS.map((r) => r[0])); const bad = [];
  (D.PEOPLE || []).forEach((p) => p.works.forEach((w) => { if (!ids.has(w)) bad.push(p.key + ":" + w); }));
  (D.EPISODES || []).forEach((e) => [...e.need, ...e.links].forEach((w) => { if (!ids.has(w)) bad.push(e.id + ":" + w); }));
  const noted = D.ITEM_ROWS.filter((r) => /[0-9]{3,4}年/.test(r[6] || "")), hit = noted.filter((r) => D.PEOPLE.some((p) => r[6].includes(p.key)));
  console.log(bad.length ? "化学史データの不正なID: " + bad.join(" ") : "OK: 化学史(科学者 " + D.PEOPLE.length + "人・転換点 " + D.EPISODES.length + "件・年代つきの発見 " + noted.length + "件のうち、科学者の紹介が付くもの " + hit.length + "件)"); if (bad.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D; const ids = new Set(D.ITEM_ROWS.map((r) => r[0])); const bad = [];
  D.REPLAYS.forEach((r) => r.gear.forEach((g) => { if (!ids.has(g)) bad.push(r.id + ":" + g); }));
  const R = D.REPLAY, errs = [];
  const l = R.lavoisier(true); if (Math.abs(l.before - l.afterClosed) > 0.011) errs.push("ラヴォアジエ: 密閉の質量が、変わった"); if (!(l.afterOpen - l.afterClosed > 0.2)) errs.push("ラヴォアジエ: 開栓で、重くならない"); if (!(R.lavoisier(false).metalAfter > R.lavoisier(false).metalBefore)) errs.push("ラヴォアジエ: 開放で、重くならない");
  if (Math.abs(R.priestley(10).o2mL - 555) > 5) errs.push("プリーストリー: 酸素の体積"); if (!R.gasReact(40, 20).exact || R.gasReact(40, 40).exact) errs.push("気体反応");
  if (Math.abs(R.faraday(2, 20).cu - 2 * 1200 * 63.55 / 192970) > 0.002) errs.push("ファラデー"); if (R.crystals(11).filter((c) => c.side === "L").length !== 5) errs.push("パスツール: 結晶の数");
  console.log(bad.length || errs.length ? "追体験の不正: " + bad.concat(errs).join(" ") : "OK: 追体験(" + D.REPLAYS.length + "課題)の器具と、計算"); if (bad.length || errs.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D, R = D.REPLAY, errs = [];
  const keys = new Set(D.RECIPE_ROWS.map((r) => [...r[0]].sort().join("+")));
  Object.entries(D.REPLAY_GATES).forEach(([k, c]) => { if (!keys.has(k)) errs.push("ゲートのレシピなし: " + k); if (!D.ITEM_ROWS.some((r) => r[0] === c)) errs.push("ゲートの知識なし: " + c); });
  Object.entries(D.REPLAY_GRANTS).forEach(([rid, c]) => { if (!D.REPLAYS.some((r) => r.id === rid)) errs.push("課題なし: " + rid); if (!D.ITEM_ROWS.some((r) => r[0] === c)) errs.push("知識なし: " + c); });
  const pv = [0, 300, 700, 1200].map((h) => R.boyle(h).PV); if (Math.max(...pv) / Math.min(...pv) > 1.02) errs.push("ボイル: P×V が、一定でない");
  const vt = [-20, 30, 100].map((T) => R.charles(T).VT); if (Math.max(...vt) / Math.min(...vt) > 1.01) errs.push("ゲイ=リュサック: V/T が、一定でない");
  const rr = R.rutherford(100000, 5); if (!(rr.bins[3] > 0 && rr.bins[0] / 100000 > 0.97)) errs.push("ラザフォード: 分布");
  if (!R.ekaJudge(70.9, 5.9).ok) errs.push("メンデレーエフ: 平均で、予測できない");
  const best = Math.max(...[300, 350, 400, 450, 500].map((T) => R.haber(T, 100).y)); if (best < 0.3) errs.push("ハーバー: 100気圧で、30%に届かない " + best);
  const q = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => R.millikan(i)); if (q.some((d) => Math.abs(d.q / d.n - 1.602) > 0.03)) errs.push("ミリカン: 整数倍でない"); if (!q.some((d) => d.n === 1)) errs.push("ミリカン: 最小の油滴がない");
  console.log(errs.length ? "追体験(第2弾)の不正: " + errs.join(" ") : "OK: 追体験の連動(ゲート " + Object.keys(D.REPLAY_GATES).length + "件・知識 " + Object.keys(D.REPLAY_GRANTS).length + "件)と計算"); if (errs.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D, R = D.REPLAY, errs = [];
  const m = [1, 4, 9, 16].map((t) => R.brown(t, 20, 3).msd / (4 * R.brownD(20) * t)); if (m.some((x) => x < 0.7 || x > 1.3)) errs.push("ブラウン運動: 平均二乗変位が、理論からずれる " + m.map((x) => x.toFixed(2)));
  if (!(R.brownD(60) > R.brownD(20) * 1.5)) errs.push("ブラウン運動: 温度の効果");
  const h4 = [1, 2, 3, 4].map((s) => R.hahnFrac(s, 7)); if (h4.some((x) => Math.abs(x.observed - 1000) > 60 || x.ifRadium <= x.observed)) errs.push("ハーン");
  D.INSIGHTS.forEach((i) => i.need.forEach((n) => { if (!D.ITEM_ROWS.some((r) => r[0] === n)) errs.push("気づきの条件の知識がない: " + i.id + "→" + n); }));
  console.log(errs.length ? "追体験(第3弾)の不正: " + errs.join(" ") : "OK: 追体験(第3弾)と、通常の実験への連動(ゲート " + Object.keys(D.REPLAY_GATES).length + "件・知識 " + Object.keys(D.REPLAY_GRANTS).length + "件)"); if (errs.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D, ids = new Set(D.ITEM_ROWS.map((r) => r[0])), bad = [];
  (D.MYTHS || []).forEach((m) => { [...m.need, ...m.links].forEach((x) => { if (!ids.has(x)) bad.push(m.id + ":" + x); }); if (!(m.q.ans >= 0 && m.q.ans < m.q.opts.length)) bad.push(m.id + ":答え"); ["theory", "why", "strong", "cracks", "turning", "modern"].forEach((k) => { if (!m[k]) bad.push(m.id + ":" + k); }); });
  console.log(bad.length ? "誤概念カードの不正: " + bad.join(" ") : "OK: 誤概念カード(" + D.MYTHS.length + "件)"); if (bad.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D, bad = [];
  (D.MYTHS || []).forEach((m) => { if (!m.obs || m.obs.length < 3) bad.push(m.id + ":判定が少ない"); else { if (!m.obs.some((o) => o.old) || !m.obs.some((o) => !o.old)) bad.push(m.id + ":判定が、片寄る"); m.obs.forEach((o, i) => { if (!o.text || !o.why || typeof o.old !== "boolean") bad.push(m.id + ":" + i); }); } });
  const concepts = D.ITEM_ROWS.filter((r) => r[3] === "concept" && r[5]).length;
  console.log(bad.length ? "判定チャレンジの不正: " + bad.join(" ") : "OK: 判定チャレンジ(" + D.MYTHS.reduce((a, m) => a + m.obs.length, 0) + "問)・用語集の対象 " + concepts + "語"); if (bad.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D, R = D.REPLAY, errs = [], ids = new Set(D.ITEM_ROWS.map((r) => r[0])), grants = new Set(Object.values(D.REPLAY_GRANTS));
  Object.keys(D.PLANT_NEED || {}).forEach((id) => { if (!ids.has(id)) errs.push("工場の品目なし: " + id); D.plantNeeds(id).forEach((c) => { if (!grants.has(c)) errs.push("工場の知識が、追体験で得られない: " + c); }); });
  D.IND_TECHS.forEach((t) => (t.need || []).forEach((c) => { if (!grants.has(c)) errs.push("産業技術の知識が、追体験で得られない: " + t.id + "→" + c); }));
  D.TECHS.forEach((t) => t.req.forEach((c) => { if (!ids.has(c)) errs.push("技術の前提なし: " + t.id + "→" + c); }));
  const pk = R.braggPeaks(); if (Math.abs(pk[0] - 15.8) > 0.2 || !(R.braggI(pk[0]) > 60) || !(R.braggI(pk[1]) > 20) || !(R.braggI(pk[2]) > 20)) errs.push("ブラッグ: ピーク");
  const E = [20, 25, 27, 28, 30].map((z) => Math.sqrt(R.moseleyE(z))); for (let i = 1; i < E.length; i++) if (!(E[i] > E[i - 1])) errs.push("モーズリー: √E が、単調でない");
  if (!(R.moseleyE(28) > R.moseleyE(27))) errs.push("モーズリー: Ni > Co");
  const m1 = R.miller({ ch4: true, nh3: true, h2: false, spark: true }, 3), m0 = R.miller({ ch4: true, nh3: true, h2: true, spark: false }, 7); if (!(m1.gly > 0) || m0.gly !== 0) errs.push("ミラー");
  R.chargaff.forEach((r) => { if (Math.abs(r[1] - r[2]) > 2.5 || Math.abs(r[3] - r[4]) > 2.5 || Math.abs(r[1] + r[2] + r[3] + r[4] - 100) > 1) errs.push("シャルガフのデータ: " + r[0]); });
  if (!(R.fleming("staph", 1).mm > R.fleming("staph", 10000).mm && R.fleming("ecoli", 1).mm === 0)) errs.push("フレミング");
  console.log(errs.length ? "追体験(第4弾)・産業連動の不正: " + errs.join(" ") : "OK: 追体験(第4弾・" + D.REPLAYS.length + "課題)と、研究・産業への連動(研究 " + D.TECHS.filter((t) => t.req.some((c) => grants.has(c))).length + "件・産業技術 " + D.IND_TECHS.filter((t) => t.need).length + "件・工場 " + Object.keys(D.PLANT_NEED).length + "品目)"); if (errs.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D, R = D.REPLAY, errs = [], ids = new Set(D.ITEM_ROWS.map((r) => r[0]));
  D.KNOW_FX.forEach((k) => k.need.forEach((c) => { if (!ids.has(c)) errs.push("知識の効果の、概念なし: " + k.id + "→" + c); }));
  if (!(R.pauling(3.6).ok && !R.pauling(3.0).ok && !R.pauling(4.4).ok)) errs.push("ポーリング");
  const fr = R.sangerFrags(); if (fr.length !== 9 || !fr.includes("FV") || !fr.includes("SH")) errs.push("サンガー");
  if (!(R.carothers(1, 8, true).fiber && !R.carothers(1, 8, false).fiber && !R.carothers(0.9, 10, true).fiber)) errs.push("カロザース");
  const fs_ = [[2, 20], [4, 30], [1, 50]].map(([I, t], i) => R.faradayConst(I, t, i + 1).F); const NA = R.NA(fs_.reduce((a, b) => a + b) / 3, 1.602e-19); if (Math.abs(NA / 6.022e23 - 1) > 0.02) errs.push("アボガドロ定数: " + NA);
  const K = D.knowFx((x) => x === "catalyst" || x === "process_optimization"); if (!(K.yieldMul("eq", 1) > 1.2 && K.yieldMul("eq", 1) < 1.3)) errs.push("知識の効果: 収率の上乗せ");
  const hy = D.yieldOf("hydrogen+iron+nitrogen", 400, 100, true).y; if (!(Math.min(0.99, hy * K.yieldMul("eq", 100)) > hy)) errs.push("知識の効果: 収率");
  console.log(errs.length ? "追体験(第5弾)・知識の効果の不正: " + errs.join(" ") : "OK: 追体験(第5弾・" + D.REPLAYS.length + "課題)と、知識の効果(" + D.KNOW_FX.length + "種類)"); if (errs.length) process.exitCode = 1; }

{ const D = require("../elements_extra.js")._D, errs = [], ids = new Set(D.ITEM_ROWS.map((r) => r[0]));
  const rows = {}; D.RECIPE_ROWS.forEach((r) => { rows[[...r[0]].sort().join("+")] = r; });
  Object.entries(D.EXTRACTS).forEach(([k, e]) => { const r = rows[k]; if (!r) errs.push("抽出のレシピなし: " + k); else { if (!r[1].includes(e.out)) errs.push("抽出の産物が、違う: " + k); if (!r[0].includes(e.from)) errs.push("抽出の、もとの材料が、レシピにない: " + k); } if (!ids.has(e.out) || !ids.has(e.from)) errs.push("抽出のID: " + k); });
  console.log(errs.length ? "抽出・精製の表の不正: " + errs.join(" ") : "OK: 抽出・精製・分離のレシピ(" + Object.keys(D.EXTRACTS).length + "件)"); if (errs.length) process.exitCode = 1; }
