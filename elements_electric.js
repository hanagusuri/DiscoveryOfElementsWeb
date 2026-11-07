// 電気と電極: 電源(ボルタ電池/ダニエル電池/発電機)、電圧と電流、電極の素材、電気分解・めっき・電解精錬
(function (_T, _rowOf, _D) {
  _D.ITEM_ROWS.push(
    ["electricity", "電気", "⚡", "material", 3, "電池や発電機から取り出す電流。電極を通して物質に流すと、物質が分解される。", "電源を持つと使える"],
    ["daniell_cell", "ダニエル電池", "🔋", "tool", 3, "硫酸銅と亜鉛を使い、ボルタ電池より安定した電圧と電流を長く保てる電池。", "1836年 ダニエル"],
    ["electromagnet", "電磁石", "🧲", "tool", 3, "鉄心にコイルを巻いて電流を流すと、磁石になる。電気と磁気がつながった。", "1820年 エルステッド/1825年 スタージャン"],
    ["steam_engine", "蒸気機関", "🚂", "tool", 3, "蒸気の力で、回転する動力を取り出す機械。", "1769年 ワット"],
    ["dynamo", "発電機", "⚙️", "tool", 3, "磁石の中でコイルを回すと、大きな電流が連続して得られる。電池と違い、電圧を自在に調整できる。", "1831年 ファラデー/1866年 ジーメンス"],
    ["voltmeter", "電圧計", "🧭", "tool", 3, "電流で針が振れる計器。電圧を数値で読み取れる。", "1820年 シュヴァイガー(検流計)"],
    ["copper_plated", "銅めっきの鉄", "🟠", "material", 3, "鉄の表面に、電気で銅の薄い膜を着けたもの。", "1830年代"],
    ["silver_plated", "銀めっきの銅", "🥈", "material", 3, "銅の表面に、電気で銀の膜を着けたもの。", "1840年 エルキントン"],
    ["pure_copper", "電気銅", "🟧", "material", 3, "電解精錬で得た、純度99.9%以上の銅。電線に使える。", "1865年 エルキントン"],
    ["electrode", "電極", "🔌", "concept", 3, "電流を物質に出し入れする導体。+側を陽極、−側を陰極と呼ぶ。素材によって、反応の結果が変わる。", "ファラデーが命名"],
    ["electrolyte", "電解質", "🧂", "concept", 3, "水に溶かす、または融かすと電気を通す物質。電流を通すと、陽極と陰極で別々の反応が起こる。", "ファラデーが命名"],
    ["electroplating", "電気めっき", "✨", "concept", 3, "電気で、陰極の表面に金属の薄い膜を着ける。", "1805年 ブルニャテッリ"],
    ["electrorefining", "電解精錬", "🔬", "concept", 3, "不純な金属を陽極にして電流を流すと、陰極に純粋な金属だけが析出する。", "1865年 エルキントン"],
    ["faraday_law", "ファラデーの法則", "📐", "concept", 3, "析出する物質の量は、流れた電気の量に比例する。", "1833年 ファラデー"]
  );
  _D.SPECIAL_ITEMS.push("electricity");
  _D.HAZ_KINDS.shock = { icon: "⚡", name: "感電", p: 0.55, sev: 2,
    title: "高い電圧に触れて感電した", cause: "多数の電池を直列につないだ高電圧の回路に、素手で触れた。",
    lesson: "耐薬手袋(絶縁)を着け、通電中の回路に触れないようにしよう。",
    hist: "ボルタ電池を何百個もつないだデービーの大電池は強力だったが、実験者たちは感電の危険と隣り合わせだった。ガルヴァーニが蛙の脚の痙攣から電気を見つけたのも、人体と電気の関わりの始まりだった。" };

  // ---- 電源・電極 ----
  _D.SOURCES = { // perCell: 1セルの電圧 / maxCells / drift: 電圧の揺らぎ / level: 電流の強さ(1:弱 2:安定 3:大電流)
    battery: { name: "ボルタ電池", perCell: 1.1, maxCells: 40, drift: 0.1, level: 1 },
    daniell_cell: { name: "ダニエル電池", perCell: 1.1, maxCells: 40, drift: 0.02, level: 2 },
    dynamo: { name: "発電機", maxV: 120, drift: 0.01, level: 3 },
  };
  _D.ELECTRODES = ["charcoal", "platinum", "gold", "copper", "iron", "zinc", "silver", "lead", "mercury", "aluminium", "tin"];
  _D.ELECTRODE_LABEL = { charcoal: "炭素棒" };
  _D.INERT = ["charcoal", "platinum", "gold"]; // 溶け出さない電極
  _D.POTENTIAL = { // 標準電極電位 E° (V)
    Li: -3.04, K: -2.93, Ba: -2.91, Sr: -2.9, Ca: -2.87, Na: -2.71, Mg: -2.37, Be: -1.85, Al: -1.66, Ti: -1.63, Mn: -1.18, Zn: -0.76, Cr: -0.74,
    Fe: -0.44, Cd: -0.4, Ni: -0.26, Sn: -0.14, Pb: -0.13, H: 0, Cu: 0.34, Ag: 0.8, Hg: 0.85, Pt: 1.18, Au: 1.5,
  };

  _D.RECIPE_ROWS.push(
    [["copper", "copper_sulfate", "zinc"], ["daniell_cell"], "硫酸銅の液に銅、硫酸亜鉛の液に亜鉛を浸し、素焼きの壁で仕切ると、電圧が長く安定した。"],
    [["iron", "copper", "battery"], ["electromagnet"], "鉄の棒に銅線を巻いて電流を流すと、鉄が強い磁石に変わった。"],
    [["iron", "pressure_vessel", "steam"], ["steam_engine"], "密閉した鉄の釜から出る蒸気でピストンを動かすと、休みなく回転する動力が得られた。"],
    [["electromagnet", "copper", "steam_engine"], ["dynamo"], "磁石の間でコイルを蒸気機関で回すと、電池より桁違いに大きな電流が連続して得られた。"],
    [["electromagnet", "copper", "glass"], ["voltmeter"], "コイルに電流を通すと針が振れた。振れ幅から、電圧を読み取れる。"]
  );

  // ---- 電気分解レシピを「電源・電圧・電極」を使う形に置き換える ----
  // 材料の 'battery'(ボルタ電池) → 'electricity'(電気)。elec: v=[最小,最大]V, an=陽極, ca=陰極, cur=必要な電流の強さ
  const conv = (inp, elec, extraOut) => {
    const r = _rowOf(inp);
    r[0] = inp.map((i) => (i === "battery" ? "electricity" : i));
    r[8] = elec;
    if (extraOut) r[1] = [...r[1], ...extraOut];
  };
  const inert = "inert";
  conv(["battery", "water"], { v: [1.5, 40], an: inert }, ["electrode"]);
  conv(["salt", "battery", "fire"], { v: [4, 40], an: inert });
  conv(["lye", "battery", "fire"], { v: [4, 40], an: inert });
  conv(["lime", "battery", "fire"], { v: [6, 60], an: inert, ca: ["mercury"] });
  conv(["naoh", "battery", "fire"], { v: [4, 40], an: inert });
  conv(["koh", "battery", "fire"], { v: [4, 40], an: inert });
  conv(["calcium_chloride", "battery", "fire"], { v: [3, 40], an: inert });
  conv(["magnesium_chloride", "battery", "fire"], { v: [3, 40], an: inert });
  conv(["lithium_chloride", "battery", "fire"], { v: [4, 40], an: inert });
  conv(["strontium_chloride", "battery", "fire"], { v: [4, 40], an: inert });
  conv(["magnesia", "battery", "fire"], { v: [6, 60], an: inert, ca: ["mercury"] });
  conv(["strontianite", "battery", "fire"], { v: [6, 60], an: inert, ca: ["mercury"] });
  conv(["baryte", "battery", "fire"], { v: [6, 60], an: inert, ca: ["mercury"] });
  conv(["lithium_ore", "battery", "fire"], { v: [6, 60], an: inert, ca: ["mercury"] });
  conv(["zinc_sulfate", "battery"], { v: [2.5, 10], an: inert });
  conv(["alumina", "battery", "fire"], { v: [4, 12], an: ["charcoal"], cur: 3 });
  conv(["fluorite", "sulfuric", "battery"], { v: [8, 60], an: ["platinum"] });
  conv(["sand", "charcoal", "battery"], { v: [30, 120], an: ["charcoal"], ca: ["charcoal"], cur: 3 });
  conv(["lime", "charcoal", "battery"], { v: [40, 120], an: ["charcoal"], ca: ["charcoal"], cur: 3 });

  // ---- 新しい電気化学の実験 ----
  _D.RECIPE_ROWS.push(
    [["salt", "water", "electricity"], ["chlorine", "hydrogen", "naoh", "electrolyte"], "食塩水に電流を通すと、陽極から黄緑の気体、陰極から燃える気体が出て、液はアルカリ性になった。",
      undefined, undefined, undefined, undefined, ["pneumatic_trough"], { v: [3, 30], an: inert }],
    [["copper_sulfate", "iron", "electricity"], ["copper_plated", "electroplating"], "青い液に鉄の板を陰極として浸し、陽極に銅を使って電流を流すと、鉄の表面が赤い銅で覆われた。",
      undefined, undefined, undefined, undefined, undefined, { v: [0.5, 6], an: ["copper"], ca: ["iron"], cur: 2 }],
    [["silver_nitrate", "copper", "electricity"], ["silver_plated", "electroplating"], "硝酸銀の液に銅の板を陰極として浸し、陽極に銀を使って電流を流すと、銅が銀色に輝いた。",
      undefined, undefined, undefined, undefined, undefined, { v: [0.5, 6], an: ["silver"], ca: ["copper"], cur: 2 }],
    [["copper", "copper_sulfate", "electricity"], ["pure_copper", "electrorefining"], "不純な銅を陽極、薄い銅板を陰極にして低い電圧で電流を流すと、陰極に純粋な銅だけが析出した。",
      undefined, undefined, undefined, undefined, undefined, { v: [0.2, 2], an: ["copper"], ca: ["copper"], cur: 2 }],
    [["copper_sulfate", "electricity", "balance"], ["faraday_law"], "電流と時間を変えて銅の析出量を量ると、流れた電気の量に正確に比例していた。",
      undefined, undefined, undefined, undefined, undefined, { v: [0.5, 6], an: ["copper"], ca: ["copper"], cur: 2 }]
  );
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
