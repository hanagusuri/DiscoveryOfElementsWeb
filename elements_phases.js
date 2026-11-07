// 物質の三態: 融点・沸点・昇華、冷却、揮発性の高い金属の取り扱い
(function (_T, _rowOf, _D) {
  // 温度段階の実際の温度(℃)。0番目は常温。
  _D.TEMP_C = [20, 100, 400, 1100, 1600, 3000];
  _D.TEMPS[3].c = "〜1100℃"; _D.TEMPS[4].c = "〜1600℃";
  const fixDesc = (id, a, b) => { const r = _D.ITEM_ROWS.find((x) => x[0] === id); if (r) r[5] = r[5].replace(a, b); };
  fixDesc("kiln", "約800℃", "約1100℃");
  fixDesc("furnace", "約1500℃", "約1600℃");

  // 冷却段階(加熱していないときに使える)
  _D.COOL_C = [20, 0, -20, -190];
  _D.COOL_NAME = ["常温", "氷水", "寒剤", "液体空気"];
  _D.COOL_NEED = [null, "ice", "freezing_mixture", "liquid_air"];

  // [融点℃, 沸点℃, 昇華℃]  mp=null で液体にならない。昇華は1気圧で直接気体になる温度(目安)
  // 元素(記号で指定)
  _D.PHASE_SYM = {
    H: [-259, -253], He: [-272, -269], Li: [181, 1342], Be: [1287, 2470], B: [2076, 3927], C: [null, null, 3640], N: [-210, -196],
    O: [-218, -183], F: [-220, -188], Ne: [-249, -246], Na: [98, 883], Mg: [650, 1090], Al: [660, 2470], Si: [1414, 3265], P: [44, 280],
    S: [115, 445], Cl: [-101, -34], Ar: [-189, -186], K: [63, 759], Ca: [842, 1484], Sc: [1541, 2836], Ti: [1668, 3287], V: [1910, 3407],
    Cr: [1907, 2671], Mn: [1246, 2061], Fe: [1538, 2862], Co: [1495, 2927], Ni: [1455, 2913], Cu: [1085, 2562], Zn: [420, 907],
    Ga: [30, 2204], Ge: [938, 2833], As: [null, null, 615], Se: [221, 685], Br: [-7, 59], Kr: [-157, -153], Rb: [39, 688], Sr: [777, 1377],
    Y: [1526, 3345], Zr: [1855, 4409], Nb: [2477, 4744], Mo: [2623, 4639], Tc: [2157, 4265], Ru: [2334, 4150], Rh: [1964, 3695],
    Pd: [1555, 2963], Ag: [962, 2162], Cd: [321, 767], In: [157, 2072], Sn: [232, 2602], Sb: [631, 1587], Te: [450, 988],
    I: [114, 184, 90], Xe: [-112, -108], Cs: [28, 671], Ba: [727, 1845], La: [920, 3464], Ce: [795, 3443], Pr: [935, 3520],
    Nd: [1024, 3074], Pm: [1042, 3000], Sm: [1072, 1794], Eu: [826, 1529], Gd: [1312, 3273], Tb: [1356, 3230], Dy: [1407, 2567],
    Ho: [1461, 2720], Er: [1529, 2868], Tm: [1545, 1950], Yb: [824, 1196], Lu: [1652, 3402], Hf: [2233, 4603], Ta: [3017, 5458],
    W: [3422, 5555], Re: [3186, 5596], Os: [3033, 5012], Ir: [2446, 4428], Pt: [1768, 3825], Au: [1064, 2856], Hg: [-39, 357],
    Tl: [304, 1473], Pb: [327, 1749], Bi: [271, 1564], Po: [254, 962], At: [302, 337], Rn: [-71, -62], Fr: [27, 677], Ra: [700, 1737],
    Ac: [1050, 3200], Th: [1750, 4788], Pa: [1572, 4000], U: [1135, 4131], Np: [644, 3902], Pu: [640, 3228], Am: [1176, 2011],
    Cm: [1345, 3100],
  };
  // 化合物・素材(idで指定)
  _D.PHASE_ID = {
    water: [0, 100], steam: [0, 100], ice: [0, 100], alcohol: [-114, 78], ammonia: [-78, -33], hcl: [-114, -85], co2: [null, null, -78],
    so2: [-72, -10], h2s: [-86, -60], co: [-205, -191], sulfuric: [10, 337], nitric: [-42, 83], acetic_acid: [17, 118],
    salt: [801, 1413], naoh: [318, 1388], koh: [406, 1327], lime: [2613, 2850], copper_oxide: [1326, 3200], lead_oxide: [888, 1470],
    zinc_oxide: [1975, null], alumina: [2072, 2977], sand: [1713, 2230], bronze: [950, 2300], kerosene: [-30, 200],
    ammonium_chloride: [null, null, 338], calomel: [null, null, 383], acetylene: [null, null, -84], dry_ice: [null, null, -78],
    tin_oxide: [1630, 1800], iron_oxide: [1565, null], carbide: [2300, null],
  };
  // 常温でも別の状態として扱うもの
  _D.AMBIENT_FORCE = { steam: "g", ice: "s", dry_ice: "s" };
  // 状態変化から得られるもの
  _D.PHASE_OUT = { "freezing:water": "ice", "deposition:co2": "dry_ice" };

  _D.ITEM_ROWS.push(
    ["ice", "氷", "🧊", "material", 1, "水が凍った固体。冬の氷室に蓄えると、夏にも冷たさを使える。", "古代 氷室"],
    ["freezing_mixture", "寒剤", "🥶", "material", 3, "氷に塩を混ぜると、氷点下まで冷える。0℃より低い温度が作れる。", "1714年頃 ファーレンハイト"],
    ["dry_ice", "ドライアイス", "☁️", "material", 4, "二酸化炭素を冷やして固めたもの。融けずに直接気体に戻る(昇華)。", "1835年 ティロリエ"],
    ["melting", "融解", "💧", "concept", 1, "固体を熱すると、液体になる。固体から液体への状態変化。", "状態変化"],
    ["boiling", "沸騰", "♨️", "concept", 1, "液体を熱し続けると、内部から気体の泡が湧き、液体が気体に変わる。", "状態変化"],
    ["freezing", "凝固", "❄️", "concept", 1, "液体を冷やすと、固体になる。融解の逆。", "状態変化"],
    ["sublimation", "昇華", "🌫️", "concept", 2, "固体が液体を経ずに、直接気体になる。ヨウ素やドライアイスで見られる。", "状態変化"],
    ["deposition", "凝華", "🌨️", "concept", 2, "気体が液体を経ずに、直接固体になる。昇華の逆。霜や雪の結晶も同じ。", "状態変化"],
    ["melting_point", "融点", "📍", "concept", 2, "物質ごとに決まった温度で融ける。融点は物質を見分ける目印になる。", "物質の性質"],
    ["boiling_point", "沸点", "📍", "concept", 2, "物質ごとに決まった温度で沸騰する。沸点の違いを使えば、混合物を蒸留で分けられる。", "物質の性質"],
    ["three_states", "物質の三態", "🧊", "concept", 2, "同じ物質が、温度によって固体・液体・気体のすがたをとる。", "物質の基本"]
  );
  _D.TECHS.push({ id: "t_ice", name: "氷室の利用", era: 1, cost: 4, req: ["condense"], grants: ["ice"], desc: "冬の氷を貯蔵し、夏にも冷却に使う。" });
  _D.RECIPE_ROWS.push([["ice", "salt"], ["freezing_mixture"], "氷に塩を混ぜると、氷が融けながら温度がさらに下がった。氷点よりずっと冷たい。"]);
  // 水を熱すれば沸騰を知る
  _rowOf(["fire", "water"])[1] = ["steam", "boiling"];

  // 揮発性の高い金属は、蒸気を冷やして集める仕掛け(蒸留器)が要る
  _D.EQUIP_WHY.alembic = "金属が蒸気になって逃げてしまう。沸点より高い温度では、蒸気を冷やして集める仕掛けが要りそうだ。";
  const needAlembic = (inp) => { const r = _rowOf(inp); r[7] = [...(r[7] || []), "alembic"]; };
  needAlembic(["zinc_oxide", "charcoal", "fire"]);
  needAlembic(["cinnabar", "fire"]);
  needAlembic(["urine", "charcoal", "fire"]);
  needAlembic(["urine", "sand", "charcoal"]);
  needAlembic(["orpiment", "charcoal", "fire"]);

  _D.SPECIAL_ITEMS.push("melting", "freezing", "sublimation", "deposition", "melting_point", "boiling_point", "three_states", "dry_ice");
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
