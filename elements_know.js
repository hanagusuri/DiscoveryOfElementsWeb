// 知識の効果: 理解した概念(追体験で得る知識を含む)が、通常の実験の、成功率・収量・事故・分離の効率を、高める
(function (_T, _rowOf, _D) {
  // yield: 収率の上乗せ(kinds: 収率モデルの種類 eq=平衡 sel=最適温度 rate=反応速度 dec=熱分解 / minPress: この圧力以上で、効く)
  // acc: 事故の確率の削減(kinds: 事故の種類。省略は、すべて) drift: 火力の揺らぎの削減 eff: 分離の効率(分別結晶の、繰り返し回数が、減る)
  _D.KNOW_FX = [
    { id: "catalyst", need: ["catalyst"], name: "触媒の理解", emoji: "🧲", yield: 0.10, desc: "触媒を使う反応(収率で決まる反応)の収率 +10%。" },
    { id: "le_chatelier", need: ["le_chatelier"], name: "ル・シャトリエの原理", emoji: "⚖️", yield: 0.08, kinds: ["eq"], desc: "平衡で決まる反応の収率 +8%。条件を、押す向きが、分かる。" },
    { id: "arrhenius", need: ["arrhenius"], name: "アレニウスの式", emoji: "📈", yield: 0.08, kinds: ["rate", "sel", "dec"], desc: "反応速度や、最適温度で決まる反応の収率 +8%。" },
    { id: "process_optimization", need: ["process_optimization"], name: "反応条件の最適化(ハーバーの課題)", emoji: "⚙️", yield: 0.12, desc: "すべての収率の反応で、収率 +12%。" },
    { id: "boyle_law", need: ["boyle_law"], name: "ボイルの法則(追体験)", emoji: "🎈", yield: 0.06, minPress: 10, desc: "高圧(10気圧以上)での、反応の収率 +6%。圧縮の見積もりが、正確になる。" },
    { id: "charles_law", need: ["charles_law"], name: "気体の膨張の法則(追体験)", emoji: "🌡️", drift: 0.2, desc: "火力の揺らぎ −20%。温度の、制御が、うまくなる。" },
    { id: "quantitative_method", need: ["quantitative_method"], name: "定量的な実験(追体験)", emoji: "⚖️", acc: 0.10, desc: "実験の事故の確率 −10%。分量を、正確に、量る習慣。" },
    { id: "gas_volume_law", need: ["gas_volume_law"], name: "気体反応の法則(追体験)", emoji: "💧", acc: 0.15, kindsA: ["gas", "expl", "pressure"], desc: "有毒ガス・爆発・容器の破裂の事故 −15%。気体の量の、見積もりが、正確になる。" },
    { id: "compound_identification", need: ["compound_identification"], name: "物質の同定(追体験)", emoji: "🧪", acc: 0.10, kindsA: ["poison", "corr", "gas"], desc: "中毒・薬傷・有毒ガスの事故 −10%。物質を、見分けられる。" },
    { id: "spectral_analysis", need: ["spectral_analysis"], name: "分光分析(追体験)", emoji: "🌈", eff: 0.15, desc: "分別結晶などの、分離の効率 +15%。純度を、確かめながら、進められる。" },
    { id: "crystal_handedness", need: ["crystal_handedness"], name: "結晶の右と左(追体験)", emoji: "🔬", eff: 0.10, desc: "分離の効率 +10%。結晶を、見分けて、取り分けられる。" },
    { id: "crystal_structure", need: ["crystal_structure"], name: "結晶構造の解析(追体験)", emoji: "💎", eff: 0.10, desc: "分離の効率 +10%。結晶の、質を、見極められる。" },
    { id: "safety_first", need: ["safety_first"], name: "安全第一", emoji: "⛑️", acc: 0.10, desc: "実験の事故の確率 −10%。" },
    { id: "molecular_motion", need: ["molecular_motion"], name: "分子の熱運動(追体験)", emoji: "🌀", drift: 0.1, desc: "火力の揺らぎ −10%。温度の、意味が、分かる。" },
    { id: "protein_structure", need: ["protein_structure"], name: "タンパク質の構造(追体験)", emoji: "🧬", eff: 0.05, desc: "分離の効率 +5%。" },
  ];
  // 理解している知識から、効果を、まとめる。has: 所持の判定
  // 産業(工場)での、効果。cost=原料費の削減 yadd=歩留まりの上乗せ acc=事故の確率の削減
  const IND = { catalyst: { cost: 0.03, yadd: 0.01 }, le_chatelier: { yadd: 0.01 }, arrhenius: { cost: 0.02 }, process_optimization: { cost: 0.05, yadd: 0.02 }, quantitative_method: { cost: 0.03, acc: 0.10 }, gas_volume_law: { acc: 0.10 },
    compound_identification: { cost: 0.02, acc: 0.05 }, spectral_analysis: { yadd: 0.01 }, safety_first: { acc: 0.15 }, boyle_law: { yadd: 0.01 }, charles_law: { acc: 0.05 }, crystal_structure: { yadd: 0.01 }, molecular_motion: { cost: 0.02 }, protein_structure: { yadd: 0.01 } };
  _D.KNOW_FX.push(
    { id: "stoichiometry", need: ["stoichiometry"], name: "化学量論", emoji: "🧮", ind: { cost: 0.05 }, desc: "(産業)原料の、無駄が、減る。" },
    { id: "energy_conservation", need: ["energy_conservation"], name: "エネルギー保存", emoji: "🔋", ind: { cost: 0.04 }, desc: "(産業)燃料・電力の、無駄が、減る。" },
    { id: "polymer_chemistry", need: ["polymer_chemistry"], name: "高分子化学(追体験)", emoji: "🧵", ind: { cost: 0.03, yadd: 0.02 }, desc: "(産業)重合の、原料の無駄が、減り、歩留まりが、上がる。" },
    { id: "avogadro_number", need: ["avogadro_number"], name: "アボガドロ定数(追体験)", emoji: "🔢", ind: { cost: 0.02 }, desc: "(産業)物質量の、見積もりが、正確になる。" }
  );
  _D.KNOW_FX.forEach((k) => { if (!k.ind && IND[k.id]) k.ind = IND[k.id]; });
  _D.knowIndText = (k) => { if (!k.ind) return ""; const p = []; if (k.ind.cost) p.push("原料費 −" + Math.round(k.ind.cost * 100) + "%"); if (k.ind.yadd) p.push("歩留まり +" + Math.round(k.ind.yadd * 100) + "%"); if (k.ind.acc) p.push("事故率 −" + Math.round(k.ind.acc * 100) + "%"); return p.join("・"); };
  _D.knowFx = function (has) {
    const act = _D.KNOW_FX.filter((k) => k.need.every(has));
    return {
      active: act,
      indCost() { return act.reduce((a, k) => a + ((k.ind && k.ind.cost) || 0), 0); },
      indYadd() { return act.reduce((a, k) => a + ((k.ind && k.ind.yadd) || 0), 0); },
      indAcc() { return Math.max(0.4, 1 - act.reduce((a, k) => a + ((k.ind && k.ind.acc) || 0), 0)); },
      yieldMul(kind0, press) { const kind = kind0 === "rate2" ? "rate" : kind0 === "selp" ? "sel" : kind0; let m = 1; act.forEach((k) => { if (k.yield && (!k.kinds || k.kinds.includes(kind)) && (!k.minPress || press >= k.minPress)) m += k.yield; }); return m; },
      accMul(kind) { let m = 1; act.forEach((k) => { if (k.acc && (!k.kindsA || k.kindsA.includes(kind))) m -= k.acc; }); return Math.max(0.3, m); },
      driftMul() { let m = 1; act.forEach((k) => { if (k.drift) m -= k.drift; }); return Math.max(0.4, m); },
      effAdd() { return act.reduce((a, k) => a + (k.eff || 0), 0); },
    };
  };
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
