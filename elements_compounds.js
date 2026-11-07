// 化合物と、化合・還元の網羅: 元素への複数ルート
//   酸化(化合) → 還元(炭素/水素/一酸化炭素/金属熱/電気分解/置換) の体系
(function (_T, _rowOf, _D) {
  _D.PT_BY_TYPE.compound = 3;
  // 既存の化合物を「化合物」種別に付け替える
  ["salt","lye","bronze","glass","soap","wine","alcohol","sulfuric","hcl","nitric","aqua_regia","gunpowder","ammonia","lime","co2","hgo",
   "urea","fertilizer","penicillin","kerosene","gasoline","plastic","nucleic","lead_oxide","bismuth_oxide","zinc_oxide","molybdenum_oxide",
   "cobalt_oxide","nickel_oxide","rh_salt","pt_salt","saltpeter","vitriol"].forEach((id) => {
    const r = _D.ITEM_ROWS.find((x) => x[0] === id); if (r) r[3] = "compound";
  });
  // 化学式(図鑑・手持ちに表示)
  _D.FORMULAS = {
    water: "H₂O", steam: "H₂O", salt: "NaCl", lye: "K₂CO₃", sulfuric: "H₂SO₄", hcl: "HCl", nitric: "HNO₃", aqua_regia: "HNO₃+3HCl", ammonia: "NH₃",
    lime: "CaO", co2: "CO₂", hgo: "HgO", urea: "CO(NH₂)₂", alcohol: "C₂H₅OH", saltpeter: "KNO₃", vitriol: "FeSO₄", limestone: "CaCO₃", sand: "SiO₂",
    alumina: "Al₂O₃", magnesia: "MgO", rutile: "TiO₂", zircon: "ZrSiO₄", fluorite: "CaF₂", baryte: "BaSO₄", borax: "Na₂B₄O₇", cinnabar: "HgS", galena: "PbS",
    stibnite: "Sb₂S₃", sphalerite: "ZnS", pyrolusite: "MnO₂", chromite: "FeCr₂O₄", lead_oxide: "PbO", zinc_oxide: "ZnO", bismuth_oxide: "Bi₂O₃",
    molybdenum_oxide: "MoO₃", cobalt_oxide: "CoO", nickel_oxide: "NiO", gunpowder: "KNO₃+S+C",
    copper_oxide: "CuO", tin_oxide: "SnO₂", iron_oxide: "Fe₂O₃", copper_sulfate: "CuSO₄", iron_sulfide: "FeS", h2s: "H₂S", so2: "SO₂", slaked_lime: "Ca(OH)₂",
    sodium_sulfate: "Na₂SO₄", soda_ash: "Na₂CO₃", naoh: "NaOH", koh: "KOH", calcium_chloride: "CaCl₂", magnesium_chloride: "MgCl₂", lithium_chloride: "LiCl",
    strontium_chloride: "SrCl₂", aluminium_chloride: "AlCl₃", titanium_chloride: "TiCl₄", silver_nitrate: "AgNO₃", silver_chloride: "AgCl", zinc_sulfate: "ZnSO₄",
    calomel: "Hg₂Cl₂", acetic_acid: "CH₃COOH", verdigris: "Cu(CH₃COO)₂", lead_acetate: "Pb(CH₃COO)₂", lead_white: "2PbCO₃·Pb(OH)₂", alum: "KAl(SO₄)₂",
    ammonium_chloride: "NH₄Cl", ammonium_nitrate: "NH₄NO₃", co: "CO", carbide: "CaC₂", acetylene: "C₂H₂", chlorate: "KClO₃",
  };

  _D.ITEM_ROWS.push(
    // --- 概念 ---
    ["oxidation", "酸化", "🔥", "concept", 3, "金属を空気中で熱すると、酸素と結びついて酸化物(カルクス)になる。重さは増える。", "ラヴォアジエ以前から観察"],
    ["reduction", "還元", "↩️", "concept", 3, "酸化物から酸素を奪えば、金属が戻る。炭・水素・より活発な金属が『酸素を奪うもの』になる。", "製錬の本質"],
    ["activity_series", "金属の反応性", "📶", "concept", 3, "酸素や酸と結びつきやすい金属ほど『活発』。活発な金属は、不活発な金属を追い出せる。", "イオン化傾向の原型"],
    ["thermite", "金属熱還元", "🎆", "concept", 4, "アルミニウムは酸素との結びつきが強く、鉄やクロムなどの酸化物から酸素を奪って金属を取り出せる。", "1895年 ゴルトシュミット"],
    ["catalyst", "触媒", "🧲", "concept", 4, "白金などの表面に触れると、自分は変わらずに反応だけが速く進む物質がある。", "1835年 ベルセリウスが命名"],
    // --- 酸化物・硫化物 ---
    ["copper_oxide", "酸化銅", "⬛", "compound", 3, "銅を空気中で熱すると表面にできる黒い膜。", ""],
    ["tin_oxide", "酸化錫", "⬜", "compound", 3, "錫を空気中で熱して得た白い粉。陶器の釉薬や研磨剤に使われた。", ""],
    ["iron_oxide", "錆(酸化鉄)", "🟫", "compound", 3, "鉄を湿った空気に放置すると赤茶色に変わる。", ""],
    ["iron_sulfide", "硫化鉄", "🪨", "compound", 3, "鉄粉と硫黄を熱すると、赤熱して反応して黒い塊になる。", "18世紀"],
    ["h2s", "硫化水素", "🥚", "compound", 3, "腐った卵の臭いの有毒な気体。金属イオンを沈殿させる分析試薬になる。", "1777年 シェーレ"],
    ["so2", "二酸化硫黄", "🌫️", "compound", 2, "硫黄を燃やすと出る、鼻をつく臭いの気体。", "古代 漂白に使用"],
    // --- 塩類・水酸化物 ---
    ["copper_sulfate", "硫酸銅", "🟦", "compound", 3, "鮮やかな青色の結晶。水に溶けると鉄の釘に銅が付く。", "胆礬"],
    ["slaked_lime", "消石灰", "🥛", "compound", 3, "生石灰に水をかけると激しく発熱して得られる。", ""],
    ["sodium_sulfate", "硫酸ナトリウム", "🧂", "compound", 3, "塩と硫酸を反応させたときに残る白い塩。", "芒硝"],
    ["soda_ash", "ソーダ灰", "🥣", "compound", 3, "炭酸ナトリウム。ガラスや石鹸の原料として需要が爆発的に増えた。", "1791年 ルブラン/1861年 ソルベー"],
    ["naoh", "苛性ソーダ", "⚗️", "compound", 3, "水酸化ナトリウム。強いアルカリで、皮膚を侵す。", ""],
    ["koh", "苛性カリ", "⚗️", "compound", 3, "水酸化カリウム。灰汁からつくる強いアルカリ。", ""],
    ["calcium_chloride", "塩化カルシウム", "🧊", "compound", 3, "石灰石を塩酸に溶かして得られる、水を吸い込みやすい塩。", ""],
    ["magnesium_chloride", "塩化マグネシウム", "🧊", "compound", 3, "苦土を塩酸に溶かして得られる塩。にがりの主成分。", ""],
    ["lithium_chloride", "塩化リチウム", "🧊", "compound", 3, "ペタル石から得られた、炎を赤く染める塩。", ""],
    ["strontium_chloride", "塩化ストロンチウム", "🧊", "compound", 3, "赤い炎色反応を示す塩。", ""],
    ["aluminium_chloride", "塩化アルミニウム", "🧊", "compound", 3, "アルミナと炭、塩素から得る揮発しやすい塩。", "1825年 エルステッド"],
    ["titanium_chloride", "四塩化チタン", "💨", "compound", 4, "金紅石を炭と塩素で処理して得る、空気中で白煙を上げる液体。", ""],
    ["silver_nitrate", "硝酸銀", "💠", "compound", 2, "銀を硝酸に溶かした無色の結晶。皮膚を黒く染める。", "「ルナ・コースティック」"],
    ["silver_chloride", "塩化銀", "⬜", "compound", 2, "硝酸銀に塩水を加えると白く沈む。光に当たると黒ずむ。", "ルナ・コルネア"],
    ["zinc_sulfate", "硫酸亜鉛", "⬜", "compound", 3, "酸化亜鉛を硫酸に溶かして得る白い結晶。", "皓礬"],
    ["calomel", "甘汞(塩化水銀)", "⚪", "compound", 3, "水銀と塩素の化合物。昔は薬として使われた。", ""],
    ["acetic_acid", "酢酸", "🍶", "compound", 1, "酒が空気に触れて酸っぱく変わったもの。酢の主成分。", "古代"],
    ["verdigris", "緑青", "🟩", "compound", 1, "銅を酢に晒すと吹く緑色の粉。古代の顔料。", "古代"],
    ["lead_acetate", "酢酸鉛", "🍬", "compound", 2, "甘い味のする有毒な鉛塩。『鉛糖』と呼ばれた。", ""],
    ["lead_white", "鉛白", "⚪", "compound", 1, "鉛を酢と二酸化炭素に晒してつくる白い顔料。", "古代"],
    ["alum", "明礬", "💎", "compound", 2, "染物の定着剤として中世ヨーロッパの貿易を支えた塩。", "古代〜"],
    ["ammonium_chloride", "塩化アンモニウム", "🌫️", "compound", 2, "「硇砂」。錬金術師が愛用した、昇華する白い塩。", ""],
    ["ammonium_nitrate", "硝酸アンモニウム", "🧨", "compound", 4, "肥料にも爆薬にもなる塩。", "1659年 グラウバー"],
    ["chlorate", "塩素酸カリウム", "🧂", "compound", 3, "加熱すると酸素を放つ白い結晶。", "1786年 ベルトレ"],
    // --- 炭素化合物 ---
    ["co", "一酸化炭素", "☠️", "compound", 3, "炭が不完全燃焼するときにできる、無色無臭で有毒な可燃性気体。鉄の製錬で酸素を奪う主役。", "1799年 プリーストリー"],
    ["carbide", "炭化カルシウム", "🪨", "compound", 4, "電気炉で石灰と炭を融かすとできる灰色の塊。水をかけるとガスが出る。", "1892年 モアッサン"],
    ["acetylene", "アセチレン", "🔦", "compound", 4, "炭化カルシウムと水から出る、明るく燃える気体。有機合成の出発点にもなった。", "1836年 デービー"]
  );

  const _R = (inp, out, text, o = {}) => [inp, out, text, o.c, o.ratio, o.miss, o.repeat, o.eq];
  const _OX = _T(2, 3, false);
  _D.RECIPE_ROWS.push(
    // ---------------- 化合 (酸化・塩・酸/塩基) ----------------
    _R(["copper", "air", "fire"], ["copper_oxide", "oxidation"], "赤い銅を空気中で熱すると、表面が黒く変わった。重さは増えている。空気中の何かと結びついたのだ。", { c: _OX }),
    _R(["tin", "air", "fire"], ["tin_oxide"], "錫を空気中で熱すると、白い粉になった。", { c: _T(2, 4, false) }),
    _R(["iron", "water", "air"], ["iron_oxide"], "湿った空気の中に鉄を置いておくと、赤茶色の粉になって崩れた。"),
    _R(["iron", "sulfur", "fire"], ["iron_sulfide"], "鉄粉と硫黄を混ぜて熱すると、赤く光って反応し、黒い塊になった。", { c: _T(2, 3) }),
    _R(["sulfur", "air", "fire"], ["so2"], "硫黄は青い炎で燃え、鼻をつく気体になった。", { c: _T(2, 3, false) }),
    _R(["copper_oxide", "sulfuric"], ["copper_sulfate"], "黒い粉を硫酸に溶かすと、美しい青色の溶液になった。蒸発させると青い結晶が現れた。"),
    _R(["lime", "water"], ["slaked_lime"], "生石灰に水を注ぐと、激しく発熱して白い粉になった。"),
    _R(["iron_sulfide", "hcl"], ["h2s"], "硫化鉄に酸を注ぐと、腐った卵の臭いの気体が出た。有毒だ!", { eq: ["pneumatic_trough"] }),
    _R(["sodium_sulfate", "limestone", "charcoal"], ["soda_ash"], "硫酸ナトリウムを石灰石と炭で焼くと、灰の中に炭酸ナトリウムが生じた。(ルブラン法)", { c: _T(4, 5) }),
    _R(["salt", "ammonia", "co2"], ["soda_ash", "ammonium_chloride"], "食塩水にアンモニアと二酸化炭素を吹き込むと、白い結晶が沈んだ。副産物も有用だった。(ソルベー法)", { eq: ["pneumatic_trough"] }),
    _R(["soda_ash", "slaked_lime"], ["naoh"], "ソーダ灰に消石灰を加えると、白い沈殿が生じ、強いアルカリの溶液が残った。"),
    _R(["lye", "slaked_lime"], ["koh"], "灰汁に消石灰を加えると、さらに強いアルカリの溶液ができた。"),
    _R(["limestone", "hcl"], ["co2", "calcium_chloride"], "石灰石に塩酸を注ぐと、盛大に泡立った。溶液を蒸発させると水を吸う塩が残った。", { eq: ["pneumatic_trough"] }),
    _R(["magnesia", "hcl"], ["magnesium_chloride"], "白い粉が塩酸に溶けて、にがみのある塩になった。"),
    _R(["lithium_ore", "hcl"], ["lithium_chloride"], "石を酸で処理すると、炎を紅色に染める塩が得られた。"),
    _R(["strontianite", "hcl"], ["strontium_chloride"], "ストロンチアン石を酸で処理すると、炎を真紅に染める塩が得られた。"),
    _R(["alumina", "charcoal", "chlorine"], ["aluminium_chloride"], "アルミナと炭の混合物に塩素を通して熱すると、揮発性の塩が得られた。", { c: _T(4, 5) }),
    _R(["rutile", "charcoal", "chlorine"], ["titanium_chloride"], "金紅石と炭に塩素を通して熱すると、白煙を上げる重い液体が得られた。", { c: _T(4, 5) }),
    _R(["silver", "nitric"], ["silver_nitrate"], "銀を硝酸に溶かすと、無色透明の溶液になった。蒸発させると結晶が現れた。", { eq: ["glass_flask"] }),
    _R(["silver_nitrate", "salt"], ["silver_chloride", "precipitation"], "硝酸銀の溶液に食塩水を加えると、白いチーズ状の沈殿がたちまち生じた。"),
    _R(["zinc_oxide", "sulfuric"], ["zinc_sulfate"], "白い粉を硫酸に溶かすと、無色の溶液から白い結晶が得られた。"),
    _R(["mercury", "chlorine"], ["calomel"], "水銀に塩素を作用させると、白い粉ができた。昔の薬になった。"),
    _R(["wine", "air"], ["acetic_acid"], "栓を開けたままの酒は、いつしか酸っぱくなっていた。"),
    _R(["copper", "acetic_acid", "air"], ["verdigris"], "銅板を酢の蒸気に晒すと、青緑色の粉が吹いた。"),
    _R(["lead_oxide", "acetic_acid"], ["lead_acetate"], "黄色い粉が酢に溶けて、甘い味のする(が有毒な)結晶になった。"),
    _R(["lead", "acetic_acid", "co2"], ["lead_white"], "鉛板を酢と発酵の気体の中に置くと、表面が白い粉に変わった。"),
    _R(["alumina", "sulfuric"], ["alum"], "白い土を硫酸で処理すると、透明な結晶が得られた。染物の色止めになる。"),
    _R(["ammonia", "hcl"], ["ammonium_chloride"], "二つの気体を混ぜると、白い煙が立ち、白い粉が降り積もった。"),
    _R(["ammonia", "nitric"], ["ammonium_nitrate"], "アルカリと酸が出会い、肥料にも爆薬にもなる塩ができた。"),
    _R(["chlorine", "lye", "fire"], ["chlorate"], "塩素を熱い灰汁に通すと、酸素を放つ白い結晶が得られた。", { c: _T(2, 3) }),
    _R(["charcoal", "co2", "fire"], ["co"], "二酸化炭素に灼熱の炭を通すと、燃える別の気体に変わった。無色・無臭で、猛毒だ。", { c: _T(3, 5, true) }),
    _R(["lime", "charcoal", "battery"], ["carbide"], "石灰と炭を電気炉で融かすと、灰色の塊ができた。水をかけると気体が出る。", { c: _T(5, 5), eq: ["arc_furnace"] }),
    _R(["carbide", "water"], ["acetylene"], "灰色の塊に水を注ぐと、明るく燃える気体が泡立った。", { eq: ["pneumatic_trough"] }),
    // ---------------- 還元 ----------------
    _R(["copper_oxide", "hydrogen", "fire"], ["copper", "reduction"], "黒い酸化銅に水素を通して熱すると、赤い銅に戻った。水が副産物としてできた。酸素が奪われたのだ。", { c: _T(2, 3) }),
    _R(["lead_oxide", "hydrogen", "fire"], ["lead"], "黄色い粉を水素で還元すると、柔らかな鉛が戻った。", { c: _T(2, 3) }),
    _R(["copper_sulfate", "iron"], ["copper", "vitriol", "activity_series"], "青い溶液に鉄の釘を入れると、釘の表面が赤い銅で覆われた。鉄は溶け、銅は追い出された。"),
    _R(["silver_chloride", "zinc"], ["silver", "activity_series"], "白い沈殿に亜鉛片を加えると、銀が灰色の粉になって現れた。"),
    _R(["zinc_sulfate", "battery"], ["zinc"], "硫酸亜鉛の水溶液に電気を流すと、電極に金属亜鉛が析出した。"),
    _R(["iron_ore", "co", "fire"], ["iron"], "高炉の中で、炭が作る一酸化炭素ガスが鉄鉱石から酸素を奪っていく。", { c: _T(4, 5) }),
    _R(["iron_ore", "aluminium", "fire"], ["iron", "thermite"], "アルミ粉と鉄鉱石の混合物に点火すると、閃光とともに溶けた鉄が流れ出た。", { c: _T(4, 5) }),
    _R(["pyrolusite", "aluminium", "fire"], ["manganese"], "アルミニウムが酸素を奪い、溶けたマンガンが流れ出た。", { c: _T(4, 5) }),
    _R(["chromite", "aluminium", "fire"], ["chromium"], "アルミニウムによる金属熱還元で、純度の高いクロムが得られた。", { c: _T(4, 5) }),
    _R(["wolframite", "hydrogen", "fire"], ["tungsten"], "水素気流中で熱すると、灰色の金属粉末が得られた。", { c: { t: [4, 5], fine: true } }),
    _R(["molybdenum_oxide", "hydrogen", "fire"], ["molybdenum"], "水素で還元して、灰色のモリブデン粉末が得られた。", { c: _T(4, 5) }),
    _R(["cobalt_oxide", "hydrogen", "fire"], ["cobalt"], "水素気流中で熱すると、磁性のある金属粉が得られた。", { c: _T(3, 4) }),
    _R(["nickel_oxide", "hydrogen", "fire"], ["nickel"], "水素で還元すると、微細なニッケル粉が得られた。", { c: _T(3, 4) }),
    _R(["naoh", "battery", "fire"], ["sodium"], "融けたアルカリに電気を流すと、電極に銀白色の金属の玉が現れた。", { c: _T(2, 4) }),
    _R(["koh", "battery", "fire"], ["potassium"], "融けた苛性カリに電気を流すと、紫の炎を上げて燃える金属が現れた。", { c: _T(2, 4) }),
    _R(["calcium_chloride", "battery", "fire"], ["calcium"], "融かした塩化カルシウムを電気分解すると、銀白色の金属が得られた。", { c: _T(3, 5) }),
    _R(["magnesium_chloride", "battery", "fire"], ["magnesium"], "融かした塩化マグネシウムを電気分解すると、白く輝く軽い金属が得られた。", { c: _T(3, 5) }),
    _R(["lithium_chloride", "battery", "fire"], ["lithium"], "融かした塩化リチウムを電気分解すると、最も軽い金属が得られた。", { c: _T(3, 5) }),
    _R(["strontium_chloride", "battery", "fire"], ["strontium"], "融かした塩化ストロンチウムを電気分解すると、金属が得られた。", { c: _T(3, 5) }),
    _R(["aluminium_chloride", "sodium", "fire"], ["aluminium"], "塩化アルミニウムをナトリウムで還元すると、銀白色の金属が塊で得られた。", { c: _T(2, 3) }),
    _R(["alumina", "battery", "fire"], ["aluminium"], "融かした氷晶石にアルミナを溶かして電気分解すると、大量のアルミニウムが得られた。", { c: _T(4, 5), eq: ["arc_furnace"] }),
    _R(["titanium_chloride", "magnesium"], ["titanium"], "マグネシウムで還元すると、スポンジ状のチタンが得られた。", { c: _T(4, 5, true) }),
    _R(["sand", "magnesium", "fire"], ["silicon"], "砂とマグネシウム粉を熱すると、閃光とともに褐色の粉(ケイ素)が生じた。", { c: _T(4, 5) }),
    _R(["borax", "magnesium"], ["boron"], "ホウ酸塩をマグネシウムで還元すると、純度の高い褐色の粉が得られた。", { c: _T(4, 5) }),
    _R(["uranium_ore", "calcium", "fire"], ["uranium"], "カルシウムで還元すると、重い銀白色の金属ウランが得られた。", { c: _T(4, 5, true) }),
    _R(["sodium", "water"], ["hydrogen", "naoh"], "ナトリウムを水に投げ込むと、激しく走り回って気体を出した。水が分解されたのだ。", { eq: ["pneumatic_trough"] }),
    _R(["iron", "steam", "fire"], ["hydrogen", "iron_oxide"], "赤熱した鉄管に水蒸気を通すと、出口から燃える気体が出た。鉄は錆びた。", { c: _T(3, 5), eq: ["pneumatic_trough"] }),
    _R(["chlorate", "pyrolusite", "fire"], ["oxygen"], "白い結晶を黒い粉と共に熱すると、穏やかに酸素が出続けた。(黒い粉は変化しない!)", { c: _T(2, 3), eq: ["pneumatic_trough"] }),
    _R(["pyrolusite", "hcl"], ["chlorine"], "黒い鉱石を塩酸に加えて温めると、黄緑色の気体が出た。", { eq: ["pneumatic_trough"] }),
    _R(["hydrogen", "nitrogen", "iron"], ["ammonia"], "高圧の密閉容器で水素と窒素を鉄触媒に通すと、アンモニアが直接合成できた。(ハーバー法)", { c: _T(2, 3, true), eq: ["pressure_vessel"] }),
    _R(["ammonia", "air", "platinum"], ["nitric", "catalyst"], "熱した白金網にアンモニアと空気を通すと、白金自身は変わらずに硝酸が生じた。", { c: _T(3, 4) }),
    _R(["so2", "platinum", "water"], ["sulfuric", "catalyst"], "白金を触れさせると、二酸化硫黄が速やかに酸化されて硫酸になった。(接触法)", { c: _T(3, 4) })
  );
  // 塩と硫酸の反応では、硫酸ナトリウムも得られる(ルブラン法の前提)
  _rowOf(["salt", "sulfuric"])[1] = ["hcl", "sodium_sulfate"];

  // ---------------- 単独ルートだった元素への代替ルート ----------------
  _D.RECIPE_ROWS.push(
    _R(["tin_oxide", "charcoal", "fire"], ["tin"], "白い酸化錫の粉を炭で還元すると、柔らかい銀白色の金属が戻った。", { c: _T(3, 5) }),
    _R(["tin_oxide", "hydrogen", "fire"], ["tin"], "酸化錫を水素気流中で熱すると、金属錫が得られた。", { c: _T(3, 4) }),
    _R(["bismuth_oxide", "hydrogen", "fire"], ["bismuth"], "黄色い粉を水素で還元すると、赤みがかった金属が戻った。", { c: _T(2, 3) }),
    _R(["calomel", "lye"], ["mercury"], "白い粉に灰汁を加えると、黒く変わり、やがて銀色の水銀の滴が現れた。"),
    _R(["beryl", "calcium", "fire"], ["beryllium"], "緑柱石をカルシウムで還元すると、軽くて硬い金属が得られた。", { c: _T(4, 5, true) }),
    _R(["zircon", "magnesium", "fire"], ["zirconium"], "ジルコンをマグネシウムで還元すると、金属ジルコニウムが得られた。", { c: _T(4, 5, true) }),
    _R(["vanadinite", "calcium", "fire"], ["vanadium"], "バナジウム鉱石をカルシウムで還元すると、純度の高い金属が得られた。", { c: _T(4, 5, true) }),
    _R(["kelp", "chlorine"], ["iodine"], "海藻の灰の溶液に塩素を通すと、紫がかった褐色の沈殿が生じた。より活発なハロゲンが追い出したのだ。"),
    _R(["so2", "h2s"], ["sulfur"], "二つの気体を混ぜると、黄色い粉が析出した。硫黄は両者から生じていた。"),
    _R(["h2s", "air", "fire"], ["sulfur"], "硫化水素を不十分な空気で燃やすと、黄色い硫黄が析出した。", { c: _T(2, 3, false) }),
    _R(["urine", "sand", "charcoal"], ["phosphorus"], "砂を加えて炭と強熱すると、より安定して光る物質が得られた。", { c: _T(3, 5, true) }),
    _R(["co2", "magnesium", "fire"], ["carbon"], "火のついたマグネシウムを二酸化炭素の中に入れると、燃え続けて黒い炭の粒が現れた。", { c: _T(4, 5) }),
    _R(["ammonia", "copper_oxide", "fire"], ["nitrogen", "copper"], "アンモニアを熱した酸化銅に通すと、燃えない気体が出て、赤い銅が戻った。", { c: _T(3, 4), eq: ["pneumatic_trough"] })
  );
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
