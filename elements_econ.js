// 産業の経済計算(純粋な関数)。ゲーム(industry.js)・管理画面・バランス検証が、同じ計算を共有する。
// ctx = { era, eng(技師の数), sales(営業の数), idx(業界)=>景気の倍率, press: 使える圧力(atm)の配列 }
(function (_T, _rowOf, _D) {
  const E = (_D.ECON = {});
  let _IT = {}, _n = -1;
  const T = () => { if (_n !== _D.ITEM_ROWS.length) { _IT = {}; _D.ITEM_ROWS.forEach((r) => { _IT[r[0]] = { type: r[3], era: r[4] }; }); _n = _D.ITEM_ROWS.length; } return _IT; };
  const BASIC = new Set(["fire", "water", "earth", "wood", "stone", "air", "steam", "ash", "sand", "seawater", "ice"]);
  const CATALYST = ["platinum", "nickel", "aluminium_chloride", "titanium_chloride", "pyrolusite", "vanadium_pentoxide"];
  const CAT_KEY = { "hydrogen+iron+nitrogen": ["iron"], "air+hydrogen+iron": ["iron"], "air+copper+methanol": ["copper"], "chloromethane+copper+silicon": ["copper"], "graphite+iron+pressure_vessel": ["iron"] };
  const recipeCache = {}, rawCache = {};
  // 工業的な製法: 収率モデルのある(大量生産向きの)製法を優先し、なければ、最初の製法
  E.recipeOf = (id) => { if (id in recipeCache) return recipeCache[id]; const L = _D.RECIPE_ROWS.filter((r) => r[1].includes(id)); return (recipeCache[id] = L.find((r) => _D.YIELDS && _D.YIELDS[[...r[0]].sort().join("+")]) || L[0] || null); };
  const keyOf = (r) => [...r[0]].sort().join("+");
  const dflt = (ctx) => Object.assign({ era: 4, eng: 0, sales: 0, idx: () => 1, press: [1], cap: 0, cost: 0, yadd: 0, price: 0, ovh: 0, dem: 0, imp: () => 0, patent: () => false, sp: () => 0, sc: () => 0, sdem: () => 0, pdisc: 0, know: null }, ctx || {});

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
    return 0.6 * m.price * _D.priceMul(id, ctx.era) * ctx.idx(m.sec) * (1 + 0.05 * ctx.sales + ctx.price + ctx.sp(m.sec) + (ctx.patent(id) ? (_D.PATENT || { bonus: 0.15 }).bonus : 0));
  };
  E.baseYield = (ctx, id) => { ctx = dflt(ctx); return Math.min(0.98, 0.85 + 0.03 * ctx.eng + ctx.yadd + 0.03 * (id ? ctx.imp(id) : 0)); };
  E.cap = (lv, ctx) => { ctx = dflt(ctx); return Math.floor(_D.PLANT_LV[lv].cap * (1 + 0.1 * ctx.eng + ctx.cap)); };
  E.demandX = (id, ctx) => { ctx = dflt(ctx); const m = _D.marketOf(id); return Math.max(0, Math.round(E.demand(id, ctx.era) * (1 + ctx.dem + (m ? ctx.sdem(m.sec) : 0)))); };
  // 特許のライセンス収入(工場がなくても、毎月入る)
  E.royalty = (id, ctx) => Math.round((_D.PATENT || { royalty: 0.1 }).royalty * E.price(id, ctx) * E.demandX(id, ctx));
  E.patentCost = (id, ctx) => Math.round(E.royalty(id, Object.assign({}, ctx, { patent: () => false })) * (_D.PATENT || { years: 10 }).payback * (1 - dflt(ctx).pdisc));
  // 化学平衡・反応速度による収率(工業では未反応の原料を、循環して再利用するため、3回通した扱い)
  E.yieldInfo = function (id, ctx) {
    ctx = dflt(ctx);
    const r = E.recipeOf(id); if (!r || !_D.YIELDS || !_D.yieldOf) return null;
    const key = keyOf(r), m = _D.YIELDS[key]; if (!m) return null;
    const win = (r[3] && r[3].t) || [1, 5], sealed = !!(r[3] && r[3].sealed === true);
    const rk = id + "|" + ctx.press.join(","); // 圧力・温度の探索は、重いので、結果を覚えておく
    let raw = rawCache[rk];
    if (!raw) {
      let b0 = 0, t0 = null, p0 = 1;
      const temps = m.ambient ? [m.Topt || 25] : []; // 火を使わない反応(発酵など)は、槽の温度を、最適に管理できる
      if (!m.ambient) for (let lv = win[0]; lv <= win[1]; lv++) temps.push(_D.TEMP_C[lv]);
      for (const T of temps) for (const p of ctx.press) { const y = _D.yieldOf(key, T, p, sealed); if (y && y.y > b0) { b0 = y.y; t0 = T; p0 = p; } }
      raw = rawCache[rk] = { best: b0, bt: t0, bp: p0 };
    }
    let best = raw.best; const bt = raw.bt, bp = raw.bp;
    if (ctx.know && best > 0) { const mul = ctx.know.yieldMul(m.kind, bp); const ny = Math.min(Math.max(best, 0.99), best * mul); if (ny > best) best = ny; } // 知識の効果
    return { y: best, thr: m.threshold, yf: Math.max(0.05, 1 - Math.pow(1 - best, 3)), temp: bt, press: bp, what: m.what, low: best < m.threshold };
  };
  E.plan = function (id, lv, ctx) {
    ctx = dflt(ctx);
    const yi = E.yieldInfo(id, ctx), imp = ctx.imp(id);
    const yf = yi ? Math.max(0.05, 1 - Math.pow(1 - Math.min(0.99, yi.y + 0.02 * imp), 3)) : 1; // 工程の改良で、触媒・条件が良くなる
    const out = Math.floor(E.cap(lv, ctx) * E.baseYield(ctx, id) * yf);
    const sold = Math.min(out, E.demandX(id, ctx));
    const rev = sold * E.price(id, ctx), cost = sold * E.unitCost(id) * Math.max(0.4, 1 - ctx.cost - ctx.sc((_D.marketOf(id) || {}).sec) - 0.08 * imp) / yf, up = E.upkeep(id, lv);
    return { units: sold, sold, out, rev, cost, up, profit: rev - cost - up, yf, yi };
  };
  // 事業が大きくなるほど、管理・物流・競争のコスト(管理費)が、増えていく
  E.overhead = (n, ctx) => Math.round((n <= 3 ? 0 : 20 * Math.pow(n - 3, 1.6)) * (1 - (ctx ? dflt(ctx).ovh : 0)));
  // ---- バランス検証: 資金100Gから、投資回収の早い工場から順に建てるプレイヤー ----
  E.available = function (era) { // その時代に、作れる品目(材料・設備の時代が合うもの)
    return _D.ITEM_ROWS.map((r) => r[0]).filter((id) => {
      const m = _D.marketOf(id); if (!m || !T()[id] || T()[id].era > era) return false;
      if (E.demand(id, era) <= 0) return false;
      if (!E.needs(id).every((n) => !T()[n] || T()[n].era <= era)) return false;
      return !(_D.plantNeeds ? _D.plantNeeds(id) : []).some((k) => T()[k] && T()[k].era > era);
    });
  };
  // opts.research: 研究所・産業技術・特許にも、自動で投資するプレイヤー(知識ポイントは、毎月 opts.ptRate + 研究所の分、増える)
  E.simulate = function (era, months, opts) {
    opts = Object.assign({ gold: _D.GOLD_START, staffCost: 0, eng: 0, sales: 0, disc: 4, research: false, members: false, improve: false, ptRate: 10, know: false }, opts || {});
    const knowObj = opts.know && _D.knowFx ? _D.knowFx(opts.know === true ? () => true : (x) => opts.know.includes(x)) : null; // 理解した知識の効果
    const press = _D.PRESS_LEVELS.filter((l) => !l.need || (T()[l.need] && T()[l.need].era <= era)).map((l) => l.p);
    const techs = {}, patents = {}, members = {}, improve = {}; let lab = 1, pt = 0;
    const MS = () => (_D.MEMBERS || []).filter((m) => members[m.id]);
    const mf = (k) => MS().reduce((s_, m) => s_ + (typeof m.fx[k] === "number" ? m.fx[k] : 0), 0);
    const ms = (k, sec) => MS().reduce((s_, m) => s_ + ((m.fx[k] || {})[sec] || 0), 0);
    const fx = (k) => (_D.IND_TECHS || []).reduce((a, t) => a + (techs[t.id] && t.fx[k] ? t.fx[k] : 0), 0);
    const mk = () => ({ era, eng: opts.eng, sales: opts.sales, idx: () => 1, press, cap: fx("cap") + mf("cap"), cost: fx("cost") + (knowObj ? knowObj.indCost() : 0), yadd: fx("yadd") + mf("yadd") + (knowObj ? knowObj.indYadd() : 0), know: knowObj, price: fx("price"), ovh: Math.min(0.8, fx("ovh") + mf("ovh")), dem: fx("dem"), patent: (id) => !!patents[id], imp: (id) => improve[id] || 0, sp: (sec) => ms("sp", sec), sc: (sec) => ms("sc", sec), pdisc: Math.min(0.8, mf("pdisc")) });
    let ctx = mk();
    const ids = E.available(era), built = {}, hist = [];
    const order = ids.slice().sort((x, y) => (_D.marketOf(x).price - _D.marketOf(y).price)); let di = 0; // 毎月、新しい物質を発見して、謝礼を得る
    let gold = opts.gold;
    for (let mo = 1; mo <= months; mo++) {
      ctx = mk();
      let net = 0, roy = 0;
      Object.entries(built).forEach(([id, lv]) => { net += E.plan(id, lv, ctx).profit; });
      Object.keys(patents).forEach((id) => { roy += E.royalty(id, ctx); });
      const sal = MS().reduce((s_, m) => s_ + m.salary, 0);
      net += roy - opts.staffCost - sal - E.overhead(Object.keys(built).length, ctx); gold += net;
      pt += opts.ptRate + (opts.research ? _D.LAB_LV[lab].ptm : 0) + mf("ptm");
      for (let k = 0; k < opts.disc && di < order.length; k++) gold += Math.round(_D.marketOf(order[di++]).price * (1 + mf("disc")));
      if (opts.research) {
        // 産業技術: 安い順に、資金の半分以内で、買う
        (_D.IND_TECHS || []).filter((t) => !techs[t.id] && t.era <= era && (t.req || []).every((q) => techs[q])).sort((a, b) => a.gold - b.gold).forEach((t) => {
          if (t.gold <= gold * 0.5 && t.pt <= pt) { gold -= t.gold; pt -= t.pt; techs[t.id] = 1; }
        });
        const L = _D.LAB_LV[lab + 1];
        if (L && L.era <= era && L.gold * 2 <= gold && L.pt <= pt) { gold -= L.gold; pt -= L.pt; lab++; }
        ctx = mk();
        if (opts.members) { // 研究員: 月益の増加が、給料を上回り、資金に余裕があるなら、迎える
          const slots = _D.MEMBER_SLOTS[lab], base0 = Object.entries(built).reduce((s_, [id, lv]) => s_ + E.plan(id, lv, mk()).profit, 0);
          for (let k = 0; k < 4 && Object.keys(members).length < slots; k++) {
            let best = null;
            for (const m of _D.MEMBERS) {
              if (members[m.id] || m.era > era || m.gold * 2 > gold || m.pt > pt) continue;
              members[m.id] = 1; const c2 = mk(); const d = Object.entries(built).reduce((s_, [id, lv]) => s_ + E.plan(id, lv, c2).profit, 0) - base0 + 0.0 - m.salary + (m.fx.ptm ? m.fx.ptm * 5 : 0) + (m.fx.disc ? 20 : 0); delete members[m.id];
              if (d > 0 && (!best || d / m.gold > best.v)) best = { m, d, v: d / m.gold };
            }
            if (!best) break;
            gold -= best.m.gold; pt -= best.m.pt; members[best.m.id] = 1;
          }
        }
        ctx = mk();
        // 特許: 収入に対して、取得費が安いものから
        for (let k = 0; k < 10 && Object.keys(patents).length < _D.LAB_LV[lab].patents; k++) {
          let best = null;
          for (const id of ids) { if (patents[id]) continue; const c = E.patentCost(id, ctx), r = E.royalty(id, Object.assign({}, ctx, { patent: () => true })); if (c * 2 <= gold && r > 0 && (!best || r / c > best.v)) best = { id, c, v: r / c }; }
          if (!best) break;
          gold -= best.c; patents[best.id] = 1;
        }
        ctx = mk();
      }
      // 最良の投資(投資回収が早い順)を、買えるだけ買う
      for (let k = 0; k < 20; k++) {
        let best = null;
        for (const id of ids) {
          const cur = built[id] || 0;
          for (let lv = cur + 1; lv <= 3; lv++) {
            const c = E.buildCost(id, lv) - (cur ? E.buildCost(id, cur) : 0), p = E.plan(id, lv, ctx).profit - (cur ? E.plan(id, cur, ctx).profit : 0) - (cur ? 0 : E.overhead(Object.keys(built).length + 1, ctx) - E.overhead(Object.keys(built).length, ctx));
            if (p <= 0 || c > gold) continue;
            const pb = c / p; if (!best || pb < best.pb) best = { id, lv, c, pb };
          }
        }
        if (!best || best.pb > 24) break;
        gold -= best.c; built[best.id] = best.lv;
      }
      if (opts.improve) { // 工程の改良: 18か月以内に回収できるなら、改良する
        for (let k = 0; k < 6; k++) {
          let best = null;
          for (const [id, lv] of Object.entries(built)) {
            const il = improve[id] || 0; if (il >= _D.IMPROVE.max) continue;
            const cg = Math.round(E.baseCost(id, 1) * _D.IMPROVE.goldMul * (il + 1) * (1 - Math.min(0.8, mf("imp")))), cp = _D.IMPROVE.ptMul * (il + 1) * ((T()[id] || {}).era || 1);
            if (cg > gold || cp > pt) continue;
            const before = E.plan(id, lv, ctx).profit; improve[id] = il + 1; const after = E.plan(id, lv, mk()).profit; improve[id] = il;
            const d = after - before; if (d > 0 && cg / d <= 18 && (!best || cg / d < best.pb)) best = { id, il, cg, cp, pb: cg / d };
          }
          if (!best) break;
          gold -= best.cg; pt -= best.cp; improve[best.id] = best.il + 1; ctx = mk();
        }
      }
      hist.push({ m: mo, gold: Math.round(gold), net: Math.round(net), plants: Object.keys(built).length, techs: Object.keys(techs).length, lab, patents: Object.keys(patents).length, roy: Math.round(roy), pt: Math.round(pt), members: Object.keys(members).length, imp: Object.values(improve).reduce((s_, x) => s_ + x, 0) });
    }
    return { hist, built, ids, techs, patents, lab, members, improve };
  };
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
