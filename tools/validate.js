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
  for (let lv = win[0]; lv <= win[1]; lv++) for (const pl of D.PRESS_LEVELS) { const yy = D.yieldOf(key, D.TEMP_C[lv], pl.p, false); if (yy) best = Math.max(best, yy.y); }
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
