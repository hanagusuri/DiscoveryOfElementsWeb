// 電池の自作: 2つの金属(電極)と電解液の組み合わせで起電力が決まる
(function (_T, _rowOf, _D) {
  // 電解液になる物質: cond=電気の通しやすさ(1-3) acid=酸 alkali=アルカリ ox=酸化剤(去極剤) ion=含まれる金属イオン
  _D.ELECTROLYTES = {
    salt: { cond: 2 }, sulfuric: { cond: 3, acid: true }, hcl: { cond: 3, acid: true }, nitric: { cond: 3, acid: true, ox: true },
    acetic_acid: { cond: 1, acid: true }, naoh: { cond: 3, alkali: true }, koh: { cond: 3, alkali: true }, lye: { cond: 2, alkali: true },
    soda_ash: { cond: 2, alkali: true }, ammonium_chloride: { cond: 2 }, copper_sulfate: { cond: 2, ion: "copper" },
    zinc_sulfate: { cond: 2, ion: "zinc" }, silver_nitrate: { cond: 2, ion: "silver" }, vitriol: { cond: 2, ion: "iron" },
    calcium_chloride: { cond: 2 }, magnesium_chloride: { cond: 2 }, alum: { cond: 1 },
  };

  _D.ITEM_ROWS.push(
    ["leclanche_cell", "マンガン乾電池", "🔋", "tool", 3, "亜鉛の缶に、二酸化マンガンと塩化アンモニウムのペーストを詰めた電池。液がこぼれず、持ち運べる。", "1866年 ルクランシェ"],
    ["lead_acid_cell", "鉛蓄電池", "🔋", "tool", 3, "鉛と酸化鉛を硫酸に浸した電池。電気を流すと充電でき、何度も使える。", "1859年 プランテ"],
    ["galvanic_cell", "化学電池", "⚡", "concept", 3, "2種類の金属を電解液に浸して導線でつなぐと、電流が流れる。化学反応で電気を作る装置。", "1800年 ボルタ"],
    ["emf", "起電力", "📏", "concept", 3, "電池の電圧は、2つの金属の『イオンになりやすさ』の差で決まる。差が大きいほど、電圧が高い。", "ネルンスト以前の理解"],
    ["electrochemical_series", "電気化学列", "📶", "concept", 3, "金属をイオンになりやすい順に並べた列。2つの金属の位置が離れているほど、電池の電圧が高い。", "ボルタ以来の発見"],
    ["secondary_cell", "二次電池", "🔁", "concept", 3, "電流を逆向きに流すと、放電した電池を元に戻せる。充電できる電池。", "1859年 プランテ"]
  );
  _D.SPECIAL_ITEMS.push("galvanic_cell", "emf", "electrochemical_series");
  _D.SOURCES.leclanche_cell = { name: "マンガン乾電池", perCell: 1.5, maxCells: 40, drift: 0.04, level: 2 };
  _D.SOURCES.lead_acid_cell = { name: "鉛蓄電池", perCell: 2.0, maxCells: 40, drift: 0.02, level: 2 };
  _D.RECIPE_ROWS.push(
    [["zinc", "pyrolusite", "ammonium_chloride"], ["leclanche_cell"], "亜鉛の缶に黒い鉱石の粉と塩化アンモニウムのペーストを詰めると、液がこぼれない電池になった。"],
    [["lead", "lead_oxide", "sulfuric"], ["lead_acid_cell", "secondary_cell"], "鉛と酸化鉛を硫酸に浸すと、強い電圧が出た。電気を逆向きに流すと、また元に戻った。"]
  );
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
