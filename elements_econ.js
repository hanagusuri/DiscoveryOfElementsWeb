// 産業の経済計算(純粋な関数)。ゲーム(industry.js)・管理画面・バランス検証が、同じ計算を共有する。
// ctx = { era, eng(技師の数), sales(営業の数), idx(業界)=>景気の倍率, press: 使える圧力(atm)の配列 }
(function (_T, _rowOf, _D) {
  const E = (_D.ECON = {});
  let _IT = {}, _n = -1;
  const T = () => { if (_n !== _D.ITEM_ROWS.length) { _IT = {}; _D.ITEM_ROWS.forEach((r) => { _IT[r[0]] = { type: r[3], era: r[4] }; }); _n = _D.ITEM_ROWS.length; } return _IT; };
  const BASIC = new Set(["fire", "water", "earth", "wood", "stone", "air", "steam", "ash", "sand", "seawater", "ice"]);
  const CATALYST = ["platinum", "nickel", "aluminium_chloride", "titanium_chloride", "pyrolusite", "vanadium_pentoxide"];
  const CAT_KEY = { "hydrogen+iron+nitrogen": ["iron"], "air+hydrogen+iron": ["iron"], "air+copper+methanol": ["copper"], "chloromethane+copper+silicon": ["copper"], "graphite+iron+pressure_vessel": ["iron"] };
  const recipeCache = {};
  // 工業的な製法: 収率モデルのある(大量生産向きの)製法を優先し、なければ、最初の製法
  E.recipeOf = (id) => { if (id in recipeCache) return recipeCache[id]; const L = _D.RECIPE_ROWS.filter((r) => r[1].includes(id)); return (recipeCache[id] = L.find((r) => _D.YIELDS && _D.YIELDS[[...r[0]].sort().join("+")]) || L[0] || null); };
  const keyOf = (r) => [...r[0]].sort().join("+");
  const dflt = (ctx) => Object.assign({ era: 4, eng: 0, sales: 0, idx: () => 1, press: [1] }, ctx || {});

  E.unitCost = function (id) {
    const r = E.recipeOf(id), m = _D.marketOf(id);
    if (!m) return 0;
    if (!r) return Math.max(0.2, m.price * 0.35);
    const cat = new Set([...CATALYST, ...(CAT_KEY[keyOf(r)] || [])]); // 触媒は、反応の前後で減らないので、原料費に含めない
    const ing = r[0].filter((i) => T()[i] && T()[i].type !== "tool" && T()[i].type !== "concept" && !cat.has(i));
    const c = ing.reduce((a, i) => a + (BASIC.has(i) ? 0.3 : Math.max(0.3, (_D.marketOf(i) || { price: 1 }).price * 0.55)), 0);
    return Math.max(0.2, c / Math.max(1, r[1].filter((o) => _D.marketOf(o)).length));
  };
  E.needs = function (id) {
    const r = E.recipeOf(id), L = [];
    if (!r) return L;
    (r[7] || []).forEach((e) => L.push(e));
    const c = r[3];
    if (c) {
      if (c.t && c.t[0] >= 3 && _D.TEMPS[c.t[0]].need) L.push(_D.TEMPS[c.t[0]].need);
      if (c.sealed === true && _D.SEAL_NEED) L.push(_D.SEAL_NEED);
      if (c.fine) L.push("mortar");
    }
    if (r[8]) L.push("electricity");
    return [...new Set(L)];
  };
  // 建設費 = 設備・原料の費用 + 運転資金(売上の約1か月分)。維持費は、運転資金を除いた分にかかる
  E.baseCost = function (id, lv) {
    const L = _D.PLANT_LV[lv], era = (T()[id] && T()[id].era) || 1;
    const em = [1, 1, 1.2, 2.5, 4][Math.min(4, era)]; // 新しい時代の設備ほど、建設費が高い
    return Math.round(((60 + 30 * era + 50 * E.needs(id).length) * L.mult + L.cap * E.unitCost(id) * 4) * em);
  };
  E.buildCost = function (id, lv) {
    const m = _D.marketOf(id) || { dem: 0, price: 0 };
    return E.baseCost(id, lv) + Math.round(Math.min(_D.PLANT_LV[lv].cap, m.dem * 2) * m.price * 0.8);
  };
  E.upkeep = (id, lv) => Math.round(E.baseCost(id, lv) * _D.PLANT_LV[lv].up);
  E.demand = (id, era) => { const m = _D.marketOf(id); return m ? Math.round(m.dem * _D.demandMul(id, m.sec, era)) : 0; };
  E.price = function (id, ctx) {
    ctx = dflt(ctx); const m = _D.marketOf(id); if (!m) return 0;
    return 0.6 * m.price * _D.priceMul(id, ctx.era) * ctx.idx(m.sec) * (1 + 0.05 * ctx.sales);
  };
  E.baseYield = (ctx) => Math.min(0.98, 0.85 + 0.03 * dflt(ctx).eng);
  E.cap = (lv, ctx) => Math.floor(_D.PLANT_LV[lv].cap * (1 + 0.1 * dflt(ctx).eng));
  // 化学平衡・反応速度による収率(工業では未反応の原料を、循環して再利用するため、3回通した扱い)
  E.yieldInfo = function (id, ctx) {
    ctx = dflt(ctx);
    const r = E.recipeOf(id); if (!r || !_D.YIELDS || !_D.yieldOf) return null;
    const key = keyOf(r), m = _D.YIELDS[key]; if (!m) return null;
    const win = (r[3] && r[3].t) || [1, 5], sealed = !!(r[3] && r[3].sealed === true);
    let best = 0, bt = null, bp = 1;
    for (let lv = win[0]; lv <= win[1]; lv++) for (const p of ctx.press) {
      const y = _D.yieldOf(key, _D.TEMP_C[lv], p, sealed);
      if (y && y.y > best) { best = y.y; bt = _D.TEMP_C[lv]; bp = p; }
    }
    return { y: best, thr: m.threshold, yf: Math.max(0.05, 1 - Math.pow(1 - best, 3)), temp: bt, press: bp, what: m.what, low: best < m.threshold };
  };
  E.plan = function (id, lv, ctx) {
    ctx = dflt(ctx);
    const yi = E.yieldInfo(id, ctx), yf = yi ? yi.yf : 1;
    const out = Math.floor(E.cap(lv, ctx) * E.baseYield(ctx) * yf);
    const sold = Math.min(out, E.demand(id, ctx.era));
    const rev = sold * E.price(id, ctx), cost = sold * E.unitCost(id) / yf, up = E.upkeep(id, lv);
    return { units: sold, sold, out, rev, cost, up, profit: rev - cost - up, yf, yi };
  };
  // 事業が大きくなるほど、管理・物流・競争のコスト(管理費)が、増えていく
  E.overhead = (n) => Math.round(n <= 3 ? 0 : 20 * Math.pow(n - 3, 1.6));
  // ---- バランス検証: 資金100Gから、投資回収の早い工場から順に建てるプレイヤー ----
  E.available = function (era) { // その時代に、作れる品目(材料・設備の時代が合うもの)
    return _D.ITEM_ROWS.map((r) => r[0]).filter((id) => {
      const m = _D.marketOf(id); if (!m || !T()[id] || T()[id].era > era) return false;
      if (E.demand(id, era) <= 0) return false;
      return E.needs(id).every((n) => !T()[n] || T()[n].era <= era);
    });
  };
  E.simulate = function (era, months, opts) {
    opts = Object.assign({ gold: _D.GOLD_START, staffCost: 0, eng: 0, sales: 0, disc: 4 }, opts || {});
    const ctx = { era, eng: opts.eng, sales: opts.sales, idx: () => 1, press: _D.PRESS_LEVELS.filter((l) => !l.need || (T()[l.need] && T()[l.need].era <= era)).map((l) => l.p) };
    const ids = E.available(era), built = {}, hist = [];
    const order = ids.slice().sort((x, y) => (_D.marketOf(x).price - _D.marketOf(y).price)); let di = 0; // 毎月、新しい物質を発見して、謝礼を得る
    let gold = opts.gold;
    for (let mo = 1; mo <= months; mo++) {
      let net = 0;
      Object.entries(built).forEach(([id, lv]) => { net += E.plan(id, lv, ctx).profit; });
      net -= opts.staffCost + E.overhead(Object.keys(built).length); gold += net;
      for (let k = 0; k < opts.disc && di < order.length; k++) gold += Math.round(_D.marketOf(order[di++]).price * 1);
      // 最良の投資(投資回収が早い順)を、買えるだけ買う
      for (let k = 0; k < 20; k++) {
        let best = null;
        for (const id of ids) {
          const cur = built[id] || 0;
          for (let lv = cur + 1; lv <= 3; lv++) {
            const c = E.buildCost(id, lv) - (cur ? E.buildCost(id, cur) : 0), p = E.plan(id, lv, ctx).profit - (cur ? E.plan(id, cur, ctx).profit : 0) - (cur ? 0 : E.overhead(Object.keys(built).length + 1) - E.overhead(Object.keys(built).length));
            if (p <= 0 || c > gold) continue;
            const pb = c / p; if (!best || pb < best.pb) best = { id, lv, c, pb };
          }
        }
        if (!best || best.pb > 24) break;
        gold -= best.c; built[best.id] = best.lv;
      }
      hist.push({ m: mo, gold: Math.round(gold), net: Math.round(net), plants: Object.keys(built).length });
    }
    return { hist, built, ids };
  };
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
