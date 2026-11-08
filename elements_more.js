// 化合物の追加(第1弾: 無機の塩・酸・酸化物・顔料・肥料)。
// 1つの品目に、図鑑・化学式・構造式・状態・危険性・用途・価格・合成レシピ・解説を、まとめて登録する仕組み(_D.addBatch)も、ここで定義する。
(function (_T, _rowOf, _D) {
  _D.addBatch = function (list) {
    list.forEach((s) => {
      _D.ITEM_ROWS.push([s.id, s.name, s.emoji || "🧪", s.type || "compound", s.era, s.desc, s.note || ""]);
      if (s.f) _D.FORMULAS[s.id] = s.f;
      if (s.smiles) _D.MOLS[s.id] = [s.smiles, Object.assign({ formula: s.f }, s.mo || {})];
      else if (s.ionic) _D.MOLS[s.id] = [s.ionic, Object.assign({ kind: "ionic", formula: s.f }, s.mo || {})];
      if (s.ph) _D.PHASE_ID[s.id] = s.ph;
      if (s.haz) _D.HAZ_TAGS[s.id] = s.haz;
      if (s.use) _D.USES[s.id] = s.use;
      if (s.eu) _D.ERA_USES[s.id] = s.eu;
      if (s.dm) _D.DEMAND_ERA[s.id] = s.dm;
      if (s.mk) _D.MARKET[s.id] = { sec: s.mk[0], price: s.mk[1], dem: s.mk[2] };
      (s.rs || []).forEach(([inp, text, o]) => {
        o = o || {};
        _D.RECIPE_ROWS.push([inp, o.out || [s.id], text, o.c, o.ratio, o.miss, o.repeat, o.eq, o.elec]);
        if (o.why) _D.WHY[[...inp].sort().join("+")] = o.why;
      });
    });
  };
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
