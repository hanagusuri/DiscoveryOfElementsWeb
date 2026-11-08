// 産業・市場のデータ: 品目の価格と業界、人員、工場の規模。ゲーム側(industry.js)と、検証・管理画面が共有する。
(function (_T, _rowOf, _D) {
  const IT = {}; _D.ITEM_ROWS.forEach((r) => { IT[r[0]] = { id: r[0], type: r[3], era: r[4] }; });
  _D.SECTORS = {
    prec: { name: "貴金属・宝飾", emoji: "💎", vol: 0.10 },
    metal: { name: "建設・金属", emoji: "🏗️", vol: 0.12 },
    ceram: { name: "窯業・ガラス", emoji: "🏺", vol: 0.10 },
    fuel: { name: "燃料・エネルギー", emoji: "⛽", vol: 0.25 },
    chem: { name: "化学工業", emoji: "⚗️", vol: 0.15 },
    agri: { name: "農業・食品", emoji: "🌾", vol: 0.18 },
    med: { name: "医薬・衛生", emoji: "💊", vol: 0.12 },
    elec: { name: "電子・精密", emoji: "🔌", vol: 0.20 },
    mil: { name: "火薬・軍需", emoji: "💥", vol: 0.30 },
  };
  // [id, 業界, 単価(G/単位), 月の需要(単位)] 需要は省略すると業界の標準値
  const P = [
    // 貴金属
    ["gold", "prec", 500, 6], ["silver", "prec", 220, 8], ["platinum", "prec", 650, 4], ["palladium", "prec", 500, 4], ["rhodium", "prec", 900, 2], ["iridium", "prec", 700, 2],
    ["osmium", "prec", 600, 2], ["ruthenium", "prec", 450, 3], ["diamond", "prec", 900, 3], ["silver_plated", "prec", 60, 10], ["copper_plated", "prec", 25, 10],
    // 金属・建設
    ["copper", "metal", 14, 60], ["tin", "metal", 28, 40], ["bronze", "metal", 22, 50], ["iron", "metal", 8, 120], ["lead", "metal", 7, 60], ["zinc", "metal", 11, 50], ["aluminium", "metal", 45, 40],
    ["magnesium", "metal", 40, 30], ["titanium", "metal", 70, 25], ["tungsten", "metal", 80, 20], ["nickel", "metal", 35, 30], ["chromium", "metal", 38, 30], ["manganese", "metal", 20, 40], ["cobalt", "metal", 45, 20],
    ["molybdenum", "metal", 55, 20], ["vanadium", "metal", 60, 15], ["pure_copper", "metal", 24, 50], ["lime", "metal", 3, 150], ["slaked_lime", "metal", 3, 120], ["limestone", "metal", 1, 200], ["stone", "metal", 1, 200], ["sand", "metal", 1, 200], ["asphalt", "metal", 6, 80],
    ["mercury", "metal", 40, 20], ["wood", "metal", 1, 200],
    // 窯業・ガラス
    ["pottery", "ceram", 4, 120], ["glass", "ceram", 9, 100], ["lens", "ceram", 60, 15], ["earth", "ceram", 1, 150], ["borax", "ceram", 8, 60], ["alumina", "ceram", 12, 60], ["zircon", "ceram", 30, 20], ["fluorite", "ceram", 12, 30],
    // 燃料・エネルギー
    ["charcoal", "fuel", 2, 200], ["petroleum", "fuel", 6, 200], ["kerosene", "fuel", 10, 150], ["gasoline", "fuel", 14, 150], ["heavy_oil", "fuel", 5, 150], ["methane", "fuel", 7, 100], ["propane", "fuel", 9, 80], ["alcohol", "fuel", 12, 80],
    ["hydrogen", "fuel", 12, 40], ["methanol", "fuel", 15, 80], ["uranium", "fuel", 160, 8], ["uranium_ore", "fuel", 30, 20], ["thorium", "fuel", 120, 6], ["battery", "fuel", 40, 20], ["acetylene", "fuel", 10, 40],
    // 化学工業
    ["sulfuric", "chem", 12, 150], ["nitric", "chem", 15, 80], ["hcl", "chem", 10, 100], ["naoh", "chem", 12, 120], ["koh", "chem", 14, 60], ["soda_ash", "chem", 9, 150], ["lye", "chem", 4, 100], ["sulfur", "chem", 5, 120],
    ["chlorine", "chem", 11, 80], ["plastic", "chem", 30, 100], ["benzene", "chem", 16, 60], ["toluene", "chem", 16, 60], ["acetone", "chem", 15, 60], ["acetic_acid", "chem", 10, 80], ["aqua_regia", "chem", 25, 10],
    ["ethylene", "chem", 14, 100], ["propylene", "chem", 14, 80], ["hydrogen_peroxide", "chem", 20, 40], ["alum", "chem", 6, 60], ["carbide", "chem", 12, 50], ["chlorate", "chem", 14, 40], ["vitriol", "chem", 5, 60],
    ["potassium_permanganate", "chem", 22, 20], ["co2", "chem", 2, 100], ["oxygen", "chem", 6, 80], ["nitrogen", "chem", 4, 80],
    // 農業・食品
    ["salt", "agri", 3, 250], ["wine", "agri", 12, 100], ["fruit", "agri", 2, 150], ["milk", "agri", 2, 120], ["glucose", "agri", 6, 100], ["fertilizer", "agri", 8, 200], ["ammonia", "agri", 18, 120],
    ["ammonium_nitrate", "agri", 14, 120], ["urea", "agri", 12, 150], ["saltpeter", "agri", 8, 60], ["ammonium_chloride", "agri", 6, 60], ["fat", "agri", 3, 120], ["seawater", "agri", 0.2, 300], ["kelp", "agri", 2, 80],
    // 医薬・衛生
    ["soap", "med", 8, 150], ["penicillin", "med", 90, 30], ["radium", "med", 800, 3], ["distilled_water", "med", 2, 100], ["iodine", "med", 60, 20], ["nucleic", "med", 70, 15], ["lithium", "med", 50, 20],
    ["fructose", "med", 8, 40], ["lactic_acid", "med", 10, 40], ["phenolphthalein", "med", 30, 10],
    // 電子・精密
    ["silicon", "elec", 55, 40], ["semiconductor", "elec", 90, 30], ["transistor", "elec", 120, 40], ["ic", "elec", 400, 30], ["vacuum_tube", "elec", 80, 30], ["germanium", "elec", 150, 10], ["gallium", "elec", 200, 8],
    ["neodymium", "elec", 100, 15], ["indium", "elec", 150, 8], ["thermometer", "elec", 25, 20], ["balance", "elec", 60, 10], ["dynamo", "elec", 180, 10], ["electromagnet", "elec", 60, 20], ["steam_engine", "elec", 300, 5],
    // 火薬・軍需
    ["gunpowder", "mil", 30, 60], ["phosphorus", "mil", 35, 30],
  ];
  _D.MARKET = {};
  P.forEach(([id, sec, price, dem]) => { if (IT[id]) _D.MARKET[id] = { sec, price, dem }; });
  _D.MARKET_UNKNOWN = P.filter(([id]) => !IT[id]).map((r) => r[0]); // 検証用(存在しないID)
  // 明示がない品目の既定: 元素・化合物・素材。道具・概念は売れない
  const DEF = { element: ["chem", 25, 20], compound: ["chem", 9, 40], material: ["metal", 2, 80] };
  const NOT_SELL = new Set(["fire", "water", "air", "steam", "ice", "electricity", "freezing_mixture", "dry_ice", "liquid_air"]);
  _D.marketOf = function (id) {
    if (NOT_SELL.has(id)) return null;
    if (_D.MARKET[id]) return _D.MARKET[id];
    const it = IT[id]; if (!it || !DEF[it.type]) return null;
    const d = DEF[it.type];
    // 新しい時代の稀少元素ほど高価・少量需要
    const k = it.type === "element" ? 1 + (it.era - 1) * 0.6 : 1;
    return { sec: it.type === "element" && it.era >= 4 ? "med" : d[0], price: Math.round(d[1] * k * 10) / 10, dem: it.type === "element" && it.era >= 4 ? 4 : d[2], auto: true };
  };
  _D.sellable = (id) => !!_D.marketOf(id);

  // ---- 人員 ----
  _D.STAFF = {
    assistant: { name: "助手", emoji: "🧑‍🔬", era: 1, salary: 15, hire: 30, max: 5, desc: "毎月、知識ポイント+1。実験の下ごしらえをしてくれる。" },
    engineer: { name: "技師", emoji: "👷", era: 2, salary: 40, hire: 90, max: 5, desc: "工場の生産量+10%、歩留まり+3%(1人あたり)。" },
    salesman: { name: "営業担当", emoji: "🤝", era: 2, salary: 35, hire: 70, max: 5, desc: "販売価格+5%(1人あたり)。" },
    safety: { name: "安全管理者", emoji: "⛑️", era: 3, salary: 50, hire: 120, max: 3, desc: "工場事故の確率を、1人あたり3分の1減らす。" },
    scientist: { name: "研究員", emoji: "🔬", era: 3, salary: 80, hire: 200, max: 5, desc: "毎月、知識ポイント+3。" },
  };
  // 工場の規模(月産の上限と建設費の倍率)
  _D.PLANT_LV = [null, { name: "工房", cap: 20, mult: 1, up: 0.12 }, { name: "工場", cap: 60, mult: 3, up: 0.10 }, { name: "大工場", cap: 200, mult: 9, up: 0.09 }];
  _D.GOLD_START = 100;
  _D.DAYS_PER_MONTH = 30;
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
