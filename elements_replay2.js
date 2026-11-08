// 追体験の課題(第2弾)と、ゲームとの連動: 課題でデータを取ると「知識」を得て、特定の実験・研究が、可能になる
(function (_T, _rowOf, _D) {
  const R = _D.REPLAY, rnd = R.rnd;
  // ---- 新しい概念(追体験の達成で、得る) ----
  _D.ITEM_ROWS.push(
    ["boyle_law", "ボイルの法則", "🎈", "concept", 3, "温度が一定なら、気体の体積は、圧力に反比例する(P×V=一定)。ポンプや圧縮機の設計の基礎になる。", "1662年 ボイル(追体験で得る)"],
    ["charles_law", "気体の膨張の法則", "🌡️", "concept", 3, "圧力が一定なら、気体の体積は、絶対温度に比例する。気体を冷やして、液体にする技術の基礎になる。", "1802年 ゲイ=リュサック(追体験で得る)"],
    ["nucleus", "原子核", "🎯", "concept", 4, "原子の質量と、正の電荷は、ごく小さな中心に、集まっている。原子の内部は、ほとんど空っぽ。核反応を、理解する鍵。", "1911年 ラザフォード(追体験で得る)"],
    ["elementary_charge", "電気素量", "🔋", "concept", 4, "電気の量には、これ以上、分けられない、最小の単位がある(約1.6×10⁻¹⁹ C)。電子1個の電荷。半導体を、理解する基礎になる。", "1909年 ミリカン(追体験で得る)"],
    ["periodic_prediction", "周期律による予言", "🗂️", "concept", 3, "周期表の空欄にあたる元素の性質は、隣の元素から、予測できる。予測があれば、探し方が分かる。", "1871年 メンデレーエフ(追体験で得る)"],
    ["process_optimization", "反応条件の最適化", "⚙️", "concept", 4, "収率は、温度・圧力・触媒の折り合いで決まる。最適な条件を、系統的に探す方法。工業プロセスの改良に、つながる。", "1909年 ハーバー(追体験で得る)"]
  );
  // 追体験の達成で得る知識
  _D.REPLAY_GRANTS = { boyle: "boyle_law", gaylussac: "charles_law", rutherford: "nucleus", millikan: "elementary_charge", mendeleev: "periodic_prediction", haber: "process_optimization" };
  // この知識がないと、できない実験(レシピのキー → 必要な知識)
  _D.REPLAY_GATES = {
    "copper+pressure_vessel+steam_engine": "boyle_law", // 圧縮機
    "glass_flask+iron+mercury": "boyle_law", // 真空ポンプ
    "air+refrigerator": "charles_law", // 空気の液化
    "radioactivity+uranium_ore+water": "nucleus", // 核分裂
    "copper+semiconductor": "elementary_charge", // トランジスタ
    "spectroscope+sphalerite": "periodic_prediction", // ガリウム・インジウム
    "argyrodite+fire+hydrogen": "periodic_prediction", // ゲルマニウム
    "erbium+fire+nitric": "periodic_prediction", // スカンジウム・イッテルビウム
  };
  // 産業技術の研究に、必要な知識
  (_D.IND_TECHS || []).forEach((t) => { if (t.id === "process") t.need = ["process_optimization"]; });

  // ---- 計算 ----
  const noise = (seed, amp) => (rnd(seed)() - 0.5) * 2 * amp;
  // ボイル: J字管に、水銀を注ぐ。閉じた側の、空気の柱の長さ(cm)。大気圧 760 mmHg
  R.boyle = function (h) { const P = 760 + h, L = 30.5 * 760 / P * (1 + noise(Math.round(h) + 3, 0.0025)); return { h, P, L: Math.round(L * 100) / 100, PV: Math.round(P * L) }; };
  // ゲイ=リュサック: 一定の圧力で、気体を温める。0℃で 1.000 L
  R.charles = function (T) { const V = (273.15 + T) / 273.15 * (1 + noise(Math.round(T) + 9, 0.002)); return { T, K: Math.round((T + 273.15) * 10) / 10, V: Math.round(V * 1000) / 1000, VT: Math.round(V / (T + 273.15) * 1e5) / 1e5 }; };
  // ラザフォード: α粒子を、金箔に当てる。角度ごとの、粒子の数
  R.rutherford = function (N, seed) {
    const r = rnd(seed), bins = [0, 0, 0, 0]; // 〜5° / 5〜30° / 30〜90° / 90°以上(跳ね返り)
    for (let i = 0; i < N; i++) { const u = r(); if (u < 0.9855) bins[0]++; else if (u < 0.9997) bins[1]++; else if (u < 0.99988) bins[2]++; else bins[3]++; }
    return { N, bins };
  };
  // メンデレーエフ: エカアルミニウム(のちのガリウム)の、予言と、実際
  R.eka = { neighbors: [["アルミニウム(Al)", 27.0, 2.70, 660], ["インジウム(In)", 114.8, 7.31, 157], ["亜鉛(Zn)", 65.4, 7.14, 420], ["ヒ素(As)", 74.9, 5.73, 817]], actual: { w: 69.7, d: 5.91, mp: 29.8 }, predicted: { w: 68, d: 5.9 } };
  R.ekaJudge = function (w, d) { const a = R.eka.actual; return { ew: Math.round(Math.abs(w - a.w) * 10) / 10, ed: Math.round(Math.abs(d - a.d) * 100) / 100, ok: Math.abs(w - a.w) <= 4 && Math.abs(d - a.d) <= 0.6 }; };
  // ハーバー: アンモニア合成の収率(平衡と、反応速度で決まる)
  R.haber = function (T, P) { const y = _D.yieldOf("hydrogen+iron+nitrogen", T, P, true); return { T, P, y: y ? y.y : 0, eq: y ? y.eq : 0, approach: y ? y.approach : 0 }; };
  // ミリカン: 油滴の電荷(10⁻¹⁹ C)。電気素量の整数倍
  R.millikanDrops = [3, 5, 2, 1, 4, 6, 2, 3, 8, 4, 5, 2];
  R.millikan = function (i) { const n = R.millikanDrops[i % R.millikanDrops.length]; return { i, q: Math.round(n * 1.602 * (1 + noise(i + 21, 0.006)) * 100) / 100, n }; };

  _D.REPLAYS.push(
    { id: "boyle", title: "ボイルの、気体の圧力の実験", year: "1662年", who: "ボイル", emoji: "🎈", era: 3, gear: ["mercury", "glass_flask"],
      period: "使えるもの: J字に曲げたガラス管、水銀、物差し、気圧計。 使えないもの: 電子式の圧力計。",
      story: "ボイルは、J字形のガラス管の、短い方を閉じて、空気を閉じ込めた。長い方から、水銀を注ぐと、閉じ込めた空気の柱は、縮んでいった。水銀の高さの差と、空気の柱の長さに、決まった関係があるはずだ。",
      goal: "水銀を、注ぎ足して、圧力(大気圧+水銀の高さの差)と、空気の柱の長さの、関係を調べよう(5回以上)。" },
    { id: "gaylussac", title: "ゲイ=リュサックの、気体の膨張の実験", year: "1802年", who: "ゲイ=リュサック", emoji: "🎈", era: 3, gear: ["glass_flask", "mercury", "thermometer"],
      period: "使えるもの: 水銀の栓をした目盛りつきの管、湯と氷、水銀温度計。 使えないもの: 温度の絶対零度の概念(のちに、ケルビンが、整理)。",
      story: "ゲイ=リュサックは、空気、水素、酸素などの気体を、同じ圧力のまま、温め、体積の変化を測った。気体の種類によらず、同じ割合で、膨らむことに気づいた。のちに、彼は、気球で、約7000 m まで昇り、高空の大気を調べた。",
      goal: "管の中の気体を、いろいろな温度にして、体積を測ろう(5回以上)。温度と体積の関係を、見つける。" },
    { id: "rutherford", title: "ラザフォードの、金箔の散乱実験", year: "1909年", who: "ラザフォード", emoji: "🎯", era: 4, gear: ["radioactivity", "gold", "electron"],
      period: "使えるもの: α線源(ラジウム)、薄い金箔、硫化亜鉛のスクリーン(粒子が当たると光る)、顕微鏡。 使えないもの: 電子式の、粒子検出器。",
      story: "当時の、有力な原子模型は、正電荷が、原子全体に、広がっている『ぶどうパン模型』(トムソン)だった。この模型なら、α粒子は、ほとんどまっすぐ、わずかに曲がるだけのはず。助手のガイガーとマースデンが、金箔に、α粒子を当てて、散乱した粒子を、数えた。",
      goal: "α粒子を、たくさん金箔に当てて、どの角度に、いくつ飛ぶかを調べよう。大きく跳ね返る粒子が、見つかるまで、続ける。" },
    { id: "mendeleev", title: "メンデレーエフの、元素の予言", year: "1871年", who: "メンデレーエフ", emoji: "🗂️", era: 3, gear: ["periodic"],
      period: "使えるもの: 周期表、既知の元素の、原子量・密度・融点のデータ。 使えないもの: 原子番号(1913年に、モーズリーが、確立)、分光分析。",
      story: "メンデレーエフは、周期表で、アルミニウムの下に、空欄を残した。『エカアルミニウム』と、名づけて、その性質を、隣の元素から、予測した。4年後に、ルコック・ド・ボワボードランが、ガリウムを発見した。",
      goal: "周期表の、まわりの元素のデータから、空欄の元素の、原子量と密度を、予測しよう。そして、実際に、発見された、ガリウムと、比べる。" },
    { id: "haber", title: "ハーバーの、アンモニア合成の条件探し", year: "1909年", who: "ハーバー", emoji: "🌾", era: 4, gear: ["compressor", "hydrogen", "nitrogen", "iron"],
      period: "使えるもの: 高圧の反応容器、圧縮機、鉄の触媒、ガスの分析。 使えないもの: コンピュータによる、条件の最適化。",
      story: "N₂ + 3H₂ ⇌ 2NH₃。ハーバーは、温度と圧力を、いろいろ変えて、アンモニアの収率を、測った。低温ほど、平衡は有利だが、反応が遅い。高温は、速いが、平衡が、不利。どこかに、ちょうどよい、条件があるはずだ。",
      goal: "温度と圧力を変えて、アンモニアの収率が、30%以上になる条件を、見つけよう。(圧力は、持っている装置で、決まる)" },
    { id: "millikan", title: "ミリカンの、油滴の実験", year: "1909年", who: "ミリカン", emoji: "🔋", era: 4, gear: ["electron", "microscope", "battery"],
      period: "使えるもの: 霧吹きの油滴、電場をかける平行な金属板、顕微鏡、ストップウォッチ。 使えないもの: 電子の、直接の観測。",
      story: "ミリカンは、霧吹きで、微小な油滴を、電場の中に、浮かべた。油滴は、帯電している。電場の強さと、落ちる速さから、1つ1つの油滴の電荷を、計算した。測った電荷は、どんな値だったのだろう。",
      goal: "たくさんの油滴の電荷を、測ろう(8個以上)。値のならびから、規則を、見つける。" }
  );
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
