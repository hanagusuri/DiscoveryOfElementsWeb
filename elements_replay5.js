// 追体験(第5弾): ポーリングのαヘリックス・サンガーのインスリン配列・カロザースのナイロン・アボガドロ定数の測定
(function (_T, _rowOf, _D) {
  const R = _D.REPLAY, rnd = R.rnd;
  _D.ITEM_ROWS.push(
    ["protein_structure", "タンパク質の立体構造", "🌀", "concept", 4, "タンパク質の主鎖は、水素結合で、らせん(αヘリックス)やシートに、折りたたまれる。形が、働きを決める。", "1951年 ポーリング(追体験で得る)"],
    ["protein_sequence", "タンパク質の配列", "🔤", "concept", 4, "タンパク質は、アミノ酸が、決まった順序でつながった、鎖。順序を、1つずつ、決められる。", "1955年 サンガー(追体験で得る)"],
    ["polymer_chemistry", "高分子化学", "🧵", "concept", 4, "小さな分子を、ほぼ完全に、反応させると、数千個がつながった、長い分子ができる。繊維やプラスチックの、基礎。", "1935年 カロザース(追体験で得る)"],
    ["avogadro_number", "アボガドロ定数", "🔢", "concept", 4, "1 mol の粒子の数は、約6.0×10²³。電気分解(ファラデー定数)と、電気素量から、求められる。", "1900年代 ペラン・ミリカンら(追体験で得る)"]
  );
  Object.assign(_D.REPLAY_GRANTS, { pauling: "protein_structure", sanger: "protein_sequence", carothers: "polymer_chemistry", avogadro: "avogadro_number" });
  Object.assign(_D.REPLAY_GATES, {
    "casein+formaldehyde": "protein_structure", // ガラリット(タンパク質の架橋)
    "adipic_acid+ammonia+fire": "polymer_chemistry", // ナイロン
  });
  // 「物質量(モル)」の理解に、アボガドロ定数の測定が、必要になる
  { const i = _D.INSIGHTS.find((x) => x.id === "mole"); if (i && !i.need.includes("avogadro_number")) i.need.push("avogadro_number"); }
  // 工場に必要な知識: 1つでも、複数でも、よい(配列に、そろえる)
  _D.plantNeeds = (id) => [].concat((_D.PLANT_NEED && _D.PLANT_NEED[id]) || []);
  ["nylon", "pet", "polyethylene", "polypropylene", "pvc", "polystyrene"].forEach((id) => { _D.PLANT_NEED[id] = "polymer_chemistry"; });
  _D.PLANT_NEED.insulin = ["homeostasis", "protein_sequence"];

  // ---- 計算 ----
  // ポーリング: αヘリックス。1回転あたりのアミノ酸の数 n。N−H···O=C の水素結合の長さ(Å)は、n = 3.6 で、最も良い(約2.9 Å)
  R.pauling = function (n) { const d = 2.9 + 2.2 * Math.abs(n - 3.6), pitch = 1.5 * n; return { n, d: Math.round(d * 100) / 100, pitch: Math.round(pitch * 10) / 10, ok: d <= 3.1, clash: n < 3.3, loose: n > 3.9 }; };
  // サンガー: インスリンB鎖の、N末端10残基
  R.sanger = { seq: "FVNQHLCGSH", names: { F: "フェニルアラニン", V: "バリン", N: "アスパラギン", Q: "グルタミン", H: "ヒスチジン", L: "ロイシン", C: "システイン", G: "グリシン", S: "セリン" } };
  R.sangerFrags = () => { const s = R.sanger.seq, f = []; for (let i = 0; i < s.length - 1; i++) f.push(s.slice(i, i + 2)); const r = rnd(41); return f.map((x) => [r(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); };
  // カロザース: 縮合重合。平均重合度 Xn = (1 + r) / (1 + r − 2rp)
  R.carothers = function (r, hours, vac) { const pmax = vac ? 0.995 : 0.95, p = pmax * (1 - Math.exp(-hours / 1.5)), Xn = (1 + r) / (1 + r - 2 * r * p); return { r, hours, vac, p: Math.round(p * 10000) / 10000, Xn: Math.round(Xn * 10) / 10, mw: Math.round(Xn * 113), fiber: Xn >= 80 }; };
  // アボガドロ定数: 電気分解で、ファラデー定数 F を求め、電気素量 e で割る
  R.faradayConst = function (I, tMin, seed) { const Q = I * tMin * 60, m = 63.55 * Q / (2 * 96485) * (1 + (rnd(seed)() - 0.5) * 0.008); return { I, t: tMin, Q: Math.round(Q), m: Math.round(m * 1000) / 1000, F: Math.round(63.55 * Q / (2 * m)) }; };
  R.NA = (F, e) => F / e;

  _D.REPLAYS.push(
    { id: "pauling", title: "ポーリングの、αヘリックスの模型", year: "1951年", who: "ポーリング", emoji: "🌀", era: 4, gear: ["glycine", "alanine", "hydrogen_bond"],
      period: "使えるもの: 結合の長さ・角度の、精密なデータ(X線で、測ったもの)、紙と、厚紙の、分子模型。 使えないもの: コンピュータによる、構造計算。",
      story: "ポーリングは、病床で、紙を折って、ペプチドの鎖を、折り曲げ、水素結合が、うまくつながる、形を探した。主鎖の N−H と C=O が、水素結合で、結びつくように、巻くと、1回転あたり、アミノ酸が、何個になるだろうか。",
      goal: "1回転あたりのアミノ酸の数を変えて、模型を組み、水素結合が、ちょうど良い長さ(約2.9〜3.1 Å)になる、構造を探そう。" },
    { id: "sanger", title: "サンガーの、インスリンの配列決定", year: "1945〜55年", who: "サンガー", emoji: "🔤", era: 4, gear: ["glycine", "alanine", "hcl"],
      period: "使えるもの: N末端を標識する試薬(FDNB)、酸による部分加水分解、ペーパークロマトグラフィー。 使えないもの: 自動の、アミノ酸配列分析装置。",
      story: "タンパク質は、アミノ酸が、決まった順序で、つながっているのか、それとも、ばらばらなのか。サンガーは、鎖の端のアミノ酸を、標識し、鎖を、酸で、短い断片に切って、断片の、重なりを手がかりに、順序を、読み解いた。",
      goal: "N末端を標識して、最初のアミノ酸を知り、部分加水分解の断片(2つ組)を、つなぎ合わせて、10個の並びを、決めよう。" },
    { id: "carothers", title: "カロザースの、ナイロンの発明", year: "1935年", who: "カロザース", emoji: "🧵", era: 4, gear: ["adipic_acid", "ammonia"],
      period: "使えるもの: 反応釜(加熱・減圧)、2種類の原料(二塩基酸とジアミン)、粘度計、紡糸の装置。 使えないもの: 高分子の、分子量の、精密な測定機器。",
      story: "デュポン社の、カロザースは、小さな分子を、反応させて、長い鎖状の分子(高分子)を、作ろうとした。原料の割合と、反応の進み具合が、鎖の長さを決める。糸を引ける、長さに、するには?",
      goal: "原料のモル比、反応の時間、水を取り除くかを、変えて、平均重合度が、80以上(糸を引ける)の、ナイロンを、作ろう。" },
    { id: "avogadro", title: "アボガドロ定数の測定", year: "1900年代", who: "ペラン・ミリカン", emoji: "🔢", era: 4, gear: ["electric_quantity", "elementary_charge", "copper_sulfate"],
      period: "使えるもの: 電気分解の装置(電流計・時計・天秤)、あなたの測った、電気素量。 使えないもの: 質量分析計、X線結晶密度法。",
      story: "1 mol の物質の中に、粒子は、いくつあるのだろう。電気分解で、1 mol の電子が運ぶ電気の量(ファラデー定数)は、測れる。また、ミリカンの実験で、電子1個の電気量(電気素量)が、分かった。2つを、組み合わせれば…?",
      goal: "電気分解で、銅の析出量から、ファラデー定数を、求めよう(3回以上)。次に、電気素量で割って、1 mol の電子の個数を、計算する。" }
  );
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
