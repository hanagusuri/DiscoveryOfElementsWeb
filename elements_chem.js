// 酸化還元・試薬・モル・イオン・エネルギー: 反応式と数値データ、分析試薬、概念
(function (_T, _rowOf, _D) {
  const MV = typeof module !== "undefined" ? require("./molviz.js") : window.MolViz;

  // ---- 新しい物質・概念・道具 ----
  _D.ITEM_ROWS.push(
    // --- 試薬・測定器具 ---
    ["litmus", "リトマス", "🟣", "material", 3, "酸性で赤く、アルカリ性で青く変わる植物色素。最も古い指示薬。", "14世紀 アルナルドゥス"],
    ["phenolphthalein", "フェノールフタレイン", "🌸", "compound", 4, "アルカリ性(pH8.2以上)で赤紫色に変わり、酸性・中性では無色の指示薬。", "1871年 バイヤー"],
    ["barium_chloride", "塩化バリウム", "🧂", "compound", 3, "硫酸イオンと出会うと、白い沈殿をつくる試薬。", ""],
    ["potassium_permanganate", "過マンガン酸カリウム", "🟪", "compound", 4, "赤紫色の結晶。強い酸化剤で、還元剤に出会うと色が消える。", "1830年代 ミッチャーリヒ"],
    ["hydrogen_peroxide", "過酸化水素", "🫧", "compound", 4, "水に酸素原子が1つ多い液体。酸化剤にも還元剤にもなる。", "1818年 テナール"],
    ["ph_meter", "pHメーター", "📟", "tool", 4, "水素イオンの濃さを電圧で測り、pHを数値で読む装置。", "1909年 ゼーレンセン/クレーマー"],
    ["burette", "ビュレット", "📏", "tool", 3, "目盛りの付いた細いガラス管。滴下した液の体積を正確に量る。", "1824年 ゲイ=リュサック"],
    ["calorimeter", "熱量計", "🌡️", "tool", 4, "反応で出入りする熱を、水温の変化から量る装置。", "1782年 ラヴォアジエ/ラプラス"],
    // --- 量・イオン・酸塩基 ---
    ["avogadro_law", "アヴォガドロの法則", "🎈", "concept", 4, "同じ温度・圧力では、同じ体積の気体には、気体の種類によらず、同じ数の分子が含まれる。", "1811年 アヴォガドロ"],
    ["molar_mass", "モル質量", "⚖️", "concept", 4, "原子量(分子量)に g をつけた量は、その物質の同じ数の粒子の重さ。元素ごとの重さの比が、周期表に並んでいる。", "1860年 カニッツァーロ"],
    ["mole", "物質量(モル)", "🔢", "concept", 4, "6.02×10²³ 個の粒子の集まりを 1 mol とする。重さを量ることで、粒子の数を数えられる。", "1900年代 オストワルト"],
    ["molar_volume", "気体のモル体積", "🫙", "concept", 4, "気体 1 mol は、0℃・1気圧で約 22.4 L を占める。", "1811年〜"],
    ["stoichiometry", "化学量論", "⚖️", "concept", 4, "反応式の係数は、物質量(mol)の比を表す。必要な量や生成量を計算できる。", "1792年 リヒター"],
    ["concentration", "モル濃度", "🧪", "concept", 4, "溶液 1 L あたりに溶けている物質量(mol/L)。", "19世紀"],
    ["titration", "滴定", "💧", "concept", 4, "濃度が分かっている溶液を少しずつ加え、中和が完了する体積から、未知の濃度を求める。", "1824年 ゲイ=リュサック"],
    ["ion", "イオン", "➕", "concept", 4, "電気を帯びた原子や原子団。電気を流すと陽極と陰極へ移動する。", "1834年 ファラデー"],
    ["ionization", "電離", "✂️", "concept", 4, "電解質は、水に溶けると陽イオンと陰イオンに分かれる。", "1884年 アレニウス"],
    ["acid_base", "酸と塩基", "⚗️", "concept", 4, "酸は水中で H⁺ を出すもの、塩基は OH⁻ を出すもの。", "1884年 アレニウス"],
    ["neutralization", "中和", "⚖️", "concept", 4, "酸の H⁺ と塩基の OH⁻ が結びついて水ができ、熱が出る。H⁺ + OH⁻ → H₂O", "19世紀"],
    ["ph", "pH", "📉", "concept", 4, "水素イオン濃度の目盛り。pH = −log[H⁺]。7が中性、小さいほど酸性、大きいほどアルカリ性。", "1909年 ゼーレンセン"],
    ["indicator", "指示薬", "🎨", "concept", 3, "液の酸性・アルカリ性によって色が変わる色素。", "17世紀 ボイル"],
    ["flame_test", "炎色反応", "🔥", "concept", 4, "金属イオンを炎に入れると、元素ごとに決まった色が出る。分光学の出発点。", "1850年代 ブンゼン"],
    // --- 酸化還元 ---
    ["oxidation_number", "酸化数", "🔢", "concept", 4, "結合の電子を電気陰性度の大きい原子に割り当てたときの、原子の電荷。酸化数が増えれば酸化、減れば還元。", "20世紀"],
    ["redox", "酸化還元反応", "🔄", "concept", 4, "酸化と還元は、必ず同時に起こる。酸化数が増える物質と、減る物質が、電子をやり取りしている。", "20世紀"],
    ["oxidizing_agent", "酸化剤", "🟥", "concept", 4, "相手を酸化し、自分は還元される物質。O₂, KMnO₄, H₂O₂ など。", ""],
    ["reducing_agent", "還元剤", "🟦", "concept", 4, "相手を還元し、自分は酸化される物質。H₂, C, Zn, Al など。", ""],
    ["electron_transfer", "電子の移動", "⚡", "concept", 4, "酸化還元の本体は電子の受け渡し。電池や電気分解は、この電子の流れを導線に取り出す、あるいは外から与えるもの。", "1897年 電子の発見以降"],
    ["half_reaction", "半反応式", "½", "concept", 4, "酸化と還元を別々に書いた式。Zn → Zn²⁺ + 2e⁻、Cu²⁺ + 2e⁻ → Cu のように、電子を含めて表す。", ""],
    // --- エネルギー ---
    ["energy_conservation", "エネルギー保存", "♾️", "concept", 4, "エネルギーは形を変えても、全体の量は変わらない。熱も仕事も同じ『エネルギー』。", "1840年代 ジュール/マイヤー/ヘルムホルツ"],
    ["enthalpy", "反応熱(エンタルピー)", "🔥", "concept", 4, "反応で出入りする熱。生成物と反応物のエネルギーの差で決まる。", "1840年 ヘス"],
    ["exothermic", "発熱反応", "♨️", "concept", 4, "反応で熱が出る。生成物のほうがエネルギーが低い。", ""],
    ["endothermic", "吸熱反応", "🧊", "concept", 4, "反応で熱を吸う。外から加熱し続けないと進まない。", ""],
    ["activation_energy", "活性化エネルギー", "⛰️", "concept", 4, "反応が始まるために越える必要のあるエネルギーの山。触媒は、この山を低くする。", "1889年 アレニウス"],
    ["hess_law", "ヘスの法則", "🧮", "concept", 4, "反応熱は、反応の経路によらず、始めと終わりの状態だけで決まる。", "1840年 ヘス"],
    ["bond_energy", "結合エネルギー", "🔗", "concept", 4, "結合を切るのに必要なエネルギー。切るのに吸収し、結合を作るときに放出する。", "20世紀"]
  );
  _D.SPECIAL_ITEMS.push("avogadro_law", "molar_mass", "mole", "molar_volume", "stoichiometry", "concentration", "titration", "ion", "ionization", "acid_base", "neutralization",
    "ph", "indicator", "flame_test", "oxidation_number", "redox", "oxidizing_agent", "reducing_agent", "electron_transfer", "half_reaction", "energy_conservation", "enthalpy",
    "exothermic", "endothermic", "activation_energy", "hess_law", "bond_energy");

  // ---- 試薬・器具の作り方 ----
  const R = (inp, out, text, o = {}) => [inp, out, text, o.c, o.ratio, o.miss, o.repeat, o.eq, o.elec];
  _D.RECIPE_ROWS.push(
    R(["fruit", "lye", "air"], ["litmus"], "植物の色素をアルカリと空気に晒すと、酸で赤、アルカリで青に変わる紫色の染料ができた。"),
    R(["benzene", "sulfuric", "naoh"], ["phenolphthalein"], "ベンゼンの誘導体を酸とアルカリで処理すると、アルカリ性で鮮やかな赤紫になる色素が得られた。"),
    R(["baryte", "hcl"], ["barium_chloride"], "重い石を塩酸で処理して、水に溶ける塩を得た。"),
    R(["pyrolusite", "lye", "chlorate"], ["potassium_permanganate"], "黒い鉱石を灰汁と塩素酸塩と融かして水に溶かすと、緑から赤紫に色が変わる溶液になった。", { c: _T(3, 4) }),
    R(["barium", "oxygen", "hcl"], ["hydrogen_peroxide"], "酸素を取り込んだバリウムを酸で処理すると、水に似た、しかし酸素の多い液体が得られた。"),
    R(["glass_flask", "silver_chloride", "voltmeter"], ["ph_meter"], "ガラス膜を隔てた2つの液の電圧差を測ると、水素イオンの濃さが読み取れた。"),
    R(["glass", "glass_flask"], ["burette"], "目盛りを刻んだ細いガラス管に、栓を付けた。液を一滴ずつ落とせる。"),
    R(["ice", "copper", "thermometer"], ["calorimeter"], "氷を詰めた銅の容器で、反応で融けた氷の量から、出た熱を量れる。")
  );
  _D.HAZ_TAGS.hydrogen_peroxide = "CR"; _D.HAZ_TAGS.potassium_permanganate = "CR"; _D.HAZ_TAGS.barium_chloride = "P";

  // ---- 追加の構造式(酸化数・イオンの計算に使う) ----
  Object.assign(_D.MOLS, {
    slaked_lime: ["[Ca+2].[OH-].[OH-]", { kind: "ionic", formula: "Ca(OH)₂" }], limestone: ["[Ca+2].[O-]C(=O)[O-]", { kind: "ionic", formula: "CaCO₃" }],
    hgo: ["[Hg+2].[O-2]", { kind: "ionic", formula: "HgO" }], lead_oxide: ["[Pb+2].[O-2]", { kind: "ionic", formula: "PbO" }], zinc_oxide: ["[Zn+2].[O-2]", { kind: "ionic", formula: "ZnO" }],
    copper_oxide: ["[Cu+2].[O-2]", { kind: "ionic", formula: "CuO" }], tin_oxide: ["[Sn+4].[O-2].[O-2]", { kind: "ionic", formula: "SnO₂" }],
    iron_oxide: ["[Fe+3].[Fe+3].[O-2].[O-2].[O-2]", { kind: "ionic", formula: "Fe₂O₃" }], alumina: ["[Al+3].[Al+3].[O-2].[O-2].[O-2]", { kind: "ionic", formula: "Al₂O₃" }],
    zinc_sulfate: ["[Zn+2].[O-]S(=O)(=O)[O-]", { kind: "ionic", formula: "ZnSO₄" }], vitriol: ["[Fe+2].[O-]S(=O)(=O)[O-]", { kind: "ionic", formula: "FeSO₄" }],
    sodium_sulfate: ["[Na+].[Na+].[O-]S(=O)(=O)[O-]", { kind: "ionic", formula: "Na₂SO₄" }], iron_sulfide: ["[Fe+2].[S-2]", { kind: "ionic", formula: "FeS" }],
    chlorate: ["[K+].[O-][Cl](=O)=O", { kind: "ionic", formula: "KClO₃" }], barium_chloride: ["[Ba+2].[Cl-].[Cl-]", { kind: "ionic", formula: "BaCl₂" }],
    potassium_permanganate: ["[K+].[O-][Mn](=O)(=O)=O", { kind: "ionic", formula: "KMnO₄" }], hydrogen_peroxide: ["OO", { polar: "折れた構造の極性分子", name: "過酸化水素" }],
    silver_chloride: ["[Ag+].[Cl-]", { kind: "ionic", formula: "AgCl" }], sand: ["O=[Si]=O", { kind: "network", formula: "SiO₂", note: "実際は Si と O が三次元の網目につながった共有結合の結晶(石英)" }],
    magnesia: ["[Mg+2].[O-2]", { kind: "ionic", formula: "MgO" }], lead_acetate: ["[Pb+2].CC(=O)[O-].CC(=O)[O-]", { kind: "ionic", formula: "Pb(CH₃COO)₂" }],
    copper_sulfate_ion: ["[Cu+2].[O-]S(=O)(=O)[O-]", { kind: "ionic" }],
  });
  delete _D.MOLS.copper_sulfate_ion;
  // 慣用の化学式で表示する
  Object.entries({ sulfuric: "H₂SO₄", nitric: "HNO₃", acetic_acid: "CH₃COOH", ammonia: "NH₃", hcl: "HCl", h2s: "H₂S", so2: "SO₂", co: "CO", co2: "CO₂", alcohol: "C₂H₅OH", urea: "CO(NH₂)₂",
    hydrogen_peroxide: "H₂O₂", methanol: "CH₃OH", glucose: "C₆H₁₂O₆", fructose: "C₆H₁₂O₆", water: "H₂O", steam: "H₂O", methane: "CH₄", ethane: "C₂H₆", ethylene: "C₂H₄",
    acetylene: "C₂H₂", benzene: "C₆H₆", hydrogen: "H₂", oxygen: "O₂", nitrogen: "N₂", chlorine: "Cl₂" }).forEach(([id, f]) => { if (_D.MOLS[id]) _D.MOLS[id][1].formula = f; });
  // 物質に対応しない化学種(反応式にだけ出る)
  _D.SPECIES = { kcl: ["[K+].[Cl-]", "塩化カリウム"] };

  // ---- 標準生成エンタルピー ΔfH° (kJ/mol, 25℃) ----
  _D.HF = {
    hydrogen: 0, oxygen: 0, nitrogen: 0, chlorine: 0, carbon: 0, sulfur: 0, mercury: 0, zinc: 0, copper: 0, lead: 0, iron: 0, sodium: 0, aluminium: 0,
    water: -285.8, steam: -241.8, co2: -393.5, co: -110.5, hgo: -90.8, limestone: -1206.9, lime: -635.1, slaked_lime: -986.1, sulfuric: -814, zinc_sulfate: -982.8,
    salt: -411.2, sodium_sulfate: -1387.1, hcl: -92.3, copper_oxide: -157.3, lead_oxide: -217.3, copper_sulfate: -771.4, vitriol: -928.4, iron_oxide: -824.2,
    alumina: -1675.7, ammonia: -45.9, so2: -296.8, methane: -74.8, ethylene: 52.4, ethane: -84.7, acetylene: 226.7, benzene: 49, carbide: -59.8, chlorate: -397.7,
    kcl: -436.7, naoh: -425.6, hydrogen_peroxide: -187.8, glucose: -1273.3, alcohol: -277.6, h2s: -20.6, calcium_chloride: -795.4,
  };

  // ---- 化学反応式 ----
  // L / R: [[係数, 物質id], ...]  rec: 対応するレシピの材料  tags: 反応の種類  cat: 触媒を使う  dh: 反応熱の直接指定(kJ, 水溶液など)
  _D.EQUATIONS = [
    { id: "water_syn", name: "水の合成", rec: ["hydrogen", "oxygen", "fire"], L: [[2, "hydrogen"], [1, "oxygen"]], R: [[2, "water"]], tags: ["化合", "燃焼"] },
    { id: "coal_burn", name: "炭の燃焼", rec: ["charcoal", "air", "fire"], L: [[1, "carbon"], [1, "oxygen"]], R: [[1, "co2"]], tags: ["化合", "燃焼"] },
    { id: "methane_burn", name: "メタンの燃焼", rec: null, need: "methane", L: [[1, "methane"], [2, "oxygen"]], R: [[1, "co2"], [2, "water"]], tags: ["燃焼"] },
    { id: "sulfur_burn", name: "硫黄の燃焼", rec: ["sulfur", "air", "fire"], L: [[1, "sulfur"], [1, "oxygen"]], R: [[1, "so2"]], tags: ["化合", "燃焼"] },
    { id: "hg_ox", name: "水銀の酸化", rec: ["mercury", "air", "fire"], L: [[2, "mercury"], [1, "oxygen"]], R: [[2, "hgo"]], tags: ["化合"] },
    { id: "hgo_dec", name: "酸化水銀の熱分解(酸素の発見)", rec: ["hgo", "fire"], L: [[2, "hgo"]], R: [[2, "mercury"], [1, "oxygen"]], tags: ["分解"] },
    { id: "cu_ox", name: "銅の酸化", rec: ["copper", "air", "fire"], L: [[2, "copper"], [1, "oxygen"]], R: [[2, "copper_oxide"]], tags: ["化合"] },
    { id: "rust", name: "鉄の錆", rec: ["iron", "water", "air"], L: [[4, "iron"], [3, "oxygen"]], R: [[2, "iron_oxide"]], tags: ["化合"] },
    { id: "caco3_dec", name: "石灰石の熱分解", rec: ["limestone", "fire"], L: [[1, "limestone"]], R: [[1, "lime"], [1, "co2"]], tags: ["分解"] },
    { id: "lime_slake", name: "生石灰に水", rec: ["lime", "water"], L: [[1, "lime"], [1, "water"]], R: [[1, "slaked_lime"]], tags: ["化合"] },
    { id: "zn_acid", name: "亜鉛と硫酸(水素の発生)", rec: ["zinc", "sulfuric"], L: [[1, "zinc"], [1, "sulfuric"]], R: [[1, "zinc_sulfate"], [1, "hydrogen"]], tags: ["置換"] },
    { id: "nacl_acid", name: "塩と硫酸(塩酸の製法)", rec: ["salt", "sulfuric"], L: [[2, "salt"], [1, "sulfuric"]], R: [[1, "sodium_sulfate"], [2, "hcl"]], tags: ["複分解"] },
    { id: "cuo_h2", name: "酸化銅の水素還元", rec: ["copper_oxide", "hydrogen", "fire"], L: [[1, "copper_oxide"], [1, "hydrogen"]], R: [[1, "copper"], [1, "water"]], tags: ["還元"] },
    { id: "pbo_h2", name: "酸化鉛の水素還元", rec: ["lead_oxide", "hydrogen", "fire"], L: [[1, "lead_oxide"], [1, "hydrogen"]], R: [[1, "lead"], [1, "water"]], tags: ["還元"] },
    { id: "cement", name: "硫酸銅と鉄(セメンテーション)", rec: ["copper_sulfate", "iron"], L: [[1, "copper_sulfate"], [1, "iron"]], R: [[1, "vitriol"], [1, "copper"]], tags: ["置換"] },
    { id: "blast", name: "高炉での鉄の還元", rec: ["iron_ore", "co", "fire"], L: [[1, "iron_oxide"], [3, "co"]], R: [[2, "iron"], [3, "co2"]], tags: ["還元"] },
    { id: "thermite", name: "テルミット反応", rec: ["iron_ore", "aluminium", "fire"], L: [[1, "iron_oxide"], [2, "aluminium"]], R: [[1, "alumina"], [2, "iron"]], tags: ["還元", "金属熱還元"] },
    { id: "water_elec", name: "水の電気分解", rec: ["electricity", "water"], L: [[2, "water"]], R: [[2, "hydrogen"], [1, "oxygen"]], tags: ["分解", "電気分解"] },
    { id: "nacl_elec", name: "融解した塩の電気分解", rec: ["salt", "electricity", "fire"], L: [[2, "salt"]], R: [[2, "sodium"], [1, "chlorine"]], tags: ["分解", "電気分解"] },
    { id: "alumina_elec", name: "アルミナの電解(ホール・エルー法)", rec: ["alumina", "electricity", "fire"], L: [[2, "alumina"]], R: [[4, "aluminium"], [3, "oxygen"]], tags: ["分解", "電気分解"] },
    { id: "haber", name: "アンモニアの合成(ハーバー法)", rec: ["hydrogen", "nitrogen", "iron"], L: [[1, "nitrogen"], [3, "hydrogen"]], R: [[2, "ammonia"]], tags: ["化合"], cat: true },
    { id: "sabatier", name: "メタンの合成(サバティエ反応)", rec: ["co", "hydrogen", "nickel"], L: [[1, "co"], [3, "hydrogen"]], R: [[1, "methane"], [1, "water"]], tags: ["還元"], cat: true },
    { id: "hydrogenation", name: "エチレンの水素付加", rec: ["ethylene", "hydrogen", "nickel"], L: [[1, "ethylene"], [1, "hydrogen"]], R: [[1, "ethane"]], tags: ["付加"], cat: true },
    { id: "benzene_syn", name: "アセチレンからベンゼン", rec: ["acetylene", "fire"], L: [[3, "acetylene"]], R: [[1, "benzene"]], tags: ["付加"] },
    { id: "carbide_water", name: "カーバイドと水", rec: ["carbide", "water"], L: [[1, "carbide"], [2, "water"]], R: [[1, "acetylene"], [1, "slaked_lime"]], tags: ["加水分解"] },
    { id: "chlorate_dec", name: "塩素酸カリウムの分解(酸素の製法)", rec: ["chlorate", "pyrolusite", "fire"], L: [[2, "chlorate"]], R: [[2, "kcl"], [3, "oxygen"]], tags: ["分解"], cat: true },
    { id: "na_water", name: "ナトリウムと水", rec: ["sodium", "water"], L: [[2, "sodium"], [2, "water"]], R: [[2, "naoh"], [1, "hydrogen"]], tags: ["置換"] },
    { id: "limestone_acid", name: "石灰石と塩酸", rec: ["limestone", "hcl"], L: [[1, "limestone"], [2, "hcl"]], R: [[1, "calcium_chloride"], [1, "water"], [1, "co2"]], tags: ["複分解"] },
    { id: "claus", name: "二酸化硫黄と硫化水素", rec: ["so2", "h2s"], L: [[1, "so2"], [2, "h2s"]], R: [[3, "sulfur"], [2, "water"]], tags: ["酸化還元"] },
    { id: "neutral", name: "塩酸と水酸化ナトリウム(中和)", rec: null, need: "neutralization", L: [[1, "hcl"], [1, "naoh"]], R: [[1, "salt"], [1, "water"]], tags: ["中和"], dh: -57.3, aq: true },
    { id: "h2o2_dec", name: "過酸化水素の分解", rec: null, need: "hydrogen_peroxide", L: [[2, "hydrogen_peroxide"]], R: [[2, "water"], [1, "oxygen"]], tags: ["分解"], cat: true },
    { id: "glucose_burn", name: "グルコースの燃焼(呼吸)", rec: null, need: "glucose", L: [[1, "glucose"], [6, "oxygen"]], R: [[6, "co2"], [6, "water"]], tags: ["燃焼"] },
    { id: "ferment", name: "アルコール発酵", rec: null, need: "glucose", L: [[1, "glucose"]], R: [[2, "alcohol"], [2, "co2"]], tags: ["分解"] },
  ];

  // ---- 化学種の情報(式・質量・酸化数) ----
  const ELEM_ITEMS = {};
  _D.ITEM_ROWS.forEach((r) => { if (r[3] === "element" && r[7]) ELEM_ITEMS[r[0]] = r[7]; });
  const ALIAS = { charcoal: "carbon" };
  _D.speciesInfo = function (id) {
    id = ALIAS[id] || id;
    let name = null, smi = null, opt = {};
    if (_D.SPECIES[id]) { smi = _D.SPECIES[id][0]; name = _D.SPECIES[id][1]; }
    else if (_D.MOLS[id]) { smi = _D.MOLS[id][0]; opt = _D.MOLS[id][1]; }
    if (smi) {
      const m = MV.parse(smi), prof = MV.oxProfile(m), oxArr = MV.oxNumbers(m), ox = {};
      m.atoms.forEach((a, i) => { (ox[a.el] = ox[a.el] || []).push(oxArr[i]); if (a.hs) for (let k = 0; k < a.hs; k++) (ox.H = ox.H || []).push((MV.EN[a.el] || 2) < MV.EN.H ? -1 : 1); });
      return { id, name, formula: opt.formula || MV.formulaOf(m), mass: MV.massOf(m), prof, ox, comps: MV.components(m), mol: m };
    }
    const sym = ELEM_ITEMS[id];
    if (sym) return { id, name, formula: sym, mass: MV.MASS[sym], prof: { [sym]: { n: 1, sum: 0 } }, ox: { [sym]: [0] }, comps: [], mol: null };
    return null;
  };

  // ---- 電離(イオンに分かれる) ----
  _D.IONIZE = {
    hcl: { eq: "HCl → H⁺ + Cl⁻", power: "強酸(ほぼ完全に電離)" }, sulfuric: { eq: "H₂SO₄ → 2H⁺ + SO₄²⁻", power: "強酸" }, nitric: { eq: "HNO₃ → H⁺ + NO₃⁻", power: "強酸" },
    acetic_acid: { eq: "CH₃COOH ⇌ H⁺ + CH₃COO⁻", power: "弱酸(一部だけ電離)" }, h2s: { eq: "H₂S ⇌ H⁺ + HS⁻", power: "弱酸" }, co2: { eq: "CO₂ + H₂O ⇌ H⁺ + HCO₃⁻", power: "弱酸(炭酸)" },
    ammonia: { eq: "NH₃ + H₂O ⇌ NH₄⁺ + OH⁻", power: "弱塩基(一部だけ電離)" }, so2: { eq: "SO₂ + H₂O ⇌ H⁺ + HSO₃⁻", power: "弱酸" },
  };
  _D.ION_INFO = {
    "H⁺": ["水素イオン", "無色", ""], "OH⁻": ["水酸化物イオン", "無色", ""], "Na⁺": ["ナトリウムイオン", "無色", "黄色"], "K⁺": ["カリウムイオン", "無色", "赤紫色"], "Li⁺": ["リチウムイオン", "無色", "赤色"],
    "Ca²⁺": ["カルシウムイオン", "無色", "橙赤色"], "Sr²⁺": ["ストロンチウムイオン", "無色", "深赤色"], "Ba²⁺": ["バリウムイオン", "無色", "黄緑色"], "Mg²⁺": ["マグネシウムイオン", "無色", "(なし)"],
    "Cu²⁺": ["銅(II)イオン", "青色", "青緑色"], "Fe²⁺": ["鉄(II)イオン", "淡緑色", ""], "Fe³⁺": ["鉄(III)イオン", "黄褐色", ""], "Zn²⁺": ["亜鉛イオン", "無色", ""],
    "Ag⁺": ["銀イオン", "無色", ""], "Pb²⁺": ["鉛(II)イオン", "無色", ""], "Al³⁺": ["アルミニウムイオン", "無色", ""], "NH₄⁺": ["アンモニウムイオン", "無色", ""],
    "Cl⁻": ["塩化物イオン", "無色", ""], "SO₄²⁻": ["硫酸イオン", "無色", ""], "NO₃⁻": ["硝酸イオン", "無色", ""], "CO₃²⁻": ["炭酸イオン", "無色", ""],
    "CH₃COO⁻": ["酢酸イオン", "無色", ""], "MnO₄⁻": ["過マンガン酸イオン", "赤紫色", ""], "ClO₃⁻": ["塩素酸イオン", "無色", ""], "S²⁻": ["硫化物イオン", "無色", ""], "HCO₃⁻": ["炭酸水素イオン", "無色", ""],
  };
  // 沈殿の表: 陽イオン × 陰イオン  (s=溶ける)
  _D.SOLUBILITY = {
    cols: ["Cl⁻", "SO₄²⁻", "CO₃²⁻", "OH⁻", "S²⁻"],
    rows: [
      ["Ag⁺", ["白色沈殿", "微溶", "白〜淡黄沈殿", "褐色沈殿", "黒色沈殿"]], ["Ba²⁺", ["s", "白色沈殿", "白色沈殿", "s", "s"]], ["Ca²⁺", ["s", "微溶", "白色沈殿", "微溶", "s"]],
      ["Cu²⁺", ["s", "s", "青緑沈殿", "青白色沈殿", "黒色沈殿"]], ["Fe³⁺", ["s", "s", "赤褐色沈殿", "赤褐色沈殿", "黒色沈殿"]], ["Pb²⁺", ["白色沈殿", "白色沈殿", "白色沈殿", "白色沈殿", "黒色沈殿"]],
      ["Zn²⁺", ["s", "s", "白色沈殿", "白色沈殿", "白色沈殿"]], ["Na⁺ K⁺ NH₄⁺", ["s", "s", "s", "s", "s"]],
    ],
  };
  _D.FLAME = { "Na⁺": "黄色", "K⁺": "赤紫色", "Li⁺": "赤色", "Ca²⁺": "橙赤色", "Sr²⁺": "深赤色", "Ba²⁺": "黄緑色", "Cu²⁺": "青緑色" };
  // 分析の試料: pH(約0.1mol/L)、含まれるイオン、還元剤か(red)、CO₂を出すか
  _D.PROPS = {
    water: { ph: 7 }, hcl: { ph: 1, cat: ["H⁺"], an: ["Cl⁻"], acid: true }, sulfuric: { ph: 0.7, cat: ["H⁺"], an: ["SO₄²⁻"], acid: true }, nitric: { ph: 1, cat: ["H⁺"], an: ["NO₃⁻"], acid: true },
    acetic_acid: { ph: 2.9, cat: ["H⁺"], an: ["CH₃COO⁻"], acid: true }, naoh: { ph: 13, cat: ["Na⁺"], an: ["OH⁻"] }, koh: { ph: 13, cat: ["K⁺"], an: ["OH⁻"] },
    lye: { ph: 11.6, cat: ["K⁺"], an: ["CO₃²⁻"] }, soda_ash: { ph: 11.6, cat: ["Na⁺"], an: ["CO₃²⁻"] }, slaked_lime: { ph: 12.4, cat: ["Ca²⁺"], an: ["OH⁻"] },
    ammonia: { ph: 11.1, cat: ["NH₄⁺"], an: ["OH⁻"] }, ammonium_chloride: { ph: 5.1, cat: ["NH₄⁺"], an: ["Cl⁻"] }, ammonium_nitrate: { ph: 5.4, cat: ["NH₄⁺"], an: ["NO₃⁻"] },
    salt: { ph: 7, cat: ["Na⁺"], an: ["Cl⁻"] }, calcium_chloride: { ph: 7, cat: ["Ca²⁺"], an: ["Cl⁻"] }, magnesium_chloride: { ph: 6.5, cat: ["Mg²⁺"], an: ["Cl⁻"] },
    sodium_sulfate: { ph: 7, cat: ["Na⁺"], an: ["SO₄²⁻"] }, copper_sulfate: { ph: 4, cat: ["Cu²⁺"], an: ["SO₄²⁻"] }, zinc_sulfate: { ph: 5.5, cat: ["Zn²⁺"], an: ["SO₄²⁻"] },
    vitriol: { ph: 4.5, cat: ["Fe²⁺"], an: ["SO₄²⁻"], red: true }, silver_nitrate: { ph: 5.5, cat: ["Ag⁺"], an: ["NO₃⁻"] }, alum: { ph: 3.5, cat: ["K⁺", "Al³⁺"], an: ["SO₄²⁻"] },
    lead_acetate: { ph: 5.5, cat: ["Pb²⁺"], an: ["CH₃COO⁻"] }, barium_chloride: { ph: 7, cat: ["Ba²⁺"], an: ["Cl⁻"] }, potassium_permanganate: { ph: 7, cat: ["K⁺"], an: ["MnO₄⁻"], ox: true },
    hydrogen_peroxide: { ph: 6.5, ox: true, red: true }, chlorate: { ph: 7, cat: ["K⁺"], an: ["ClO₃⁻"], ox: true },
    co2: { ph: 5.6, an: ["HCO₃⁻"], co2: true, acid: true }, so2: { ph: 3, red: true, acid: true }, h2s: { ph: 4.5, an: ["S²⁻"], red: true, acid: true },
    limestone: { solid: true, cat: ["Ca²⁺"], an: ["CO₃²⁻"] }, iron_sulfide: { solid: true, cat: ["Fe²⁺"], an: ["S²⁻"] },
    alcohol: { ph: 7 }, glucose: { ph: 7, red: true }, urea: { ph: 7 }, sodium: { solid: true, cat: ["Na⁺"], metal: true }, potassium: { solid: true, cat: ["K⁺"], metal: true },
    lithium: { solid: true, cat: ["Li⁺"], metal: true }, calcium: { solid: true, cat: ["Ca²⁺"], metal: true }, strontium: { solid: true, cat: ["Sr²⁺"], metal: true },
    barium: { solid: true, cat: ["Ba²⁺"], metal: true }, copper: { solid: true, cat: ["Cu²⁺"], metal: true }, zinc: { solid: true, metal: true }, iron: { solid: true, metal: true },
    magnesium: { solid: true, cat: ["Mg²⁺"], metal: true }, aluminium: { solid: true, metal: true },
  };
  // 試薬の種類
  _D.REAGENTS = {
    litmus: "litmus", phenolphthalein: "php", ph_meter: "ph", silver_nitrate: "ag", barium_chloride: "ba", slaked_lime: "limewater", naoh: "alkali", lead_acetate: "pb",
    potassium_permanganate: "mno4", hcl: "acid", sulfuric: "acid", nitric: "acid", hydrogen_peroxide: "h2o2", bunsen: "flame",
  };

  // ---- 概念の自動付与 ----
  _D.INSIGHTS.push(
    { id: "avogadro_law", need: ["atom", "water_compound", "hydrogen", "oxygen"] },
    { id: "molar_mass", need: ["atom", "balance", "periodic"] },
    { id: "mole", need: ["avogadro_law", "molar_mass"] },
    { id: "molar_volume", need: ["mole", "co2", "hydrogen"] },
    { id: "stoichiometry", need: ["mole", "conservation"] },
    { id: "concentration", need: ["mole", "hcl", "naoh"] },
    { id: "ion", need: ["electrolysis", "atom"] },
    { id: "ionization", need: ["ion", "electrolyte"] },
    { id: "acid_base", need: ["hcl", "naoh", "indicator"] },
    { id: "ph", need: ["ionization", "acid_base", "indicator"] },
    { id: "oxidation_number", need: ["oxidation", "reduction", "atom", "valence"] },
    { id: "redox", need: ["oxidation_number"] },
    { id: "oxidizing_agent", need: ["redox"] },
    { id: "reducing_agent", need: ["redox"] },
    { id: "electron_transfer", need: ["redox", "galvanic_cell"] },
    { id: "half_reaction", need: ["electron_transfer", "electrolysis"] },
    { id: "energy_conservation", need: ["conservation", "combustion"] },
    { id: "enthalpy", need: ["energy_conservation", "calorimeter"] },
    { id: "activation_energy", need: ["exothermic", "catalyst"] },
    { id: "bond_energy", need: ["covalent_bond", "enthalpy"] },
  );
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
