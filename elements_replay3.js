// 追体験(第3弾): 新しい課題4つ(ブラウン運動・核分裂の発見・ベルナールの肝臓・分光分析)と、
// 最初の6課題(ラヴォアジエ〜ヴェーラー)を、通常の実験・知識の条件に結びつける
(function (_T, _rowOf, _D) {
  const R = _D.REPLAY, rnd = R.rnd;
  // ---- 新しい知識(追体験の達成で、得る) ----
  _D.ITEM_ROWS.push(
    ["quantitative_method", "定量的な実験", "⚖️", "concept", 3, "反応の前後の質量を、天秤で量って、比べる。数量で、確かめる方法が、近代化学の基礎になる。", "1774年 ラヴォアジエ(追体験で得る)"],
    ["pneumatic_chemistry", "気体化学", "🫧", "concept", 3, "気体を、水上置換などで、集めて、性質を調べる。空気は、1種類の気体ではないことが、分かる。", "1774年 プリーストリー(追体験で得る)"],
    ["gas_volume_law", "気体反応の法則", "💧", "concept", 3, "気体が反応するときの、体積は、簡単な整数比になる。分子の数の、手がかりになる。", "1805年 ゲイ=リュサック(追体験で得る)"],
    ["crystal_handedness", "結晶の右と左", "🔬", "concept", 4, "結晶の形に、左右の鏡像がある。分子にも、右手と左手のような、関係があるかもしれない。", "1848年 パスツール(追体験で得る)"],
    ["electric_quantity", "電気の量の測定", "⚡", "concept", 3, "電流×時間で、電気の量を表し、析出する物質の量と、比べる。", "1833年 ファラデー(追体験で得る)"],
    ["compound_identification", "物質の同定", "🧪", "concept", 3, "いくつかの試験で、性質を比べ、物質が、同じか、違うかを、確かめる。", "1828年 ヴェーラー(追体験で得る)"],
    ["molecular_motion", "分子の熱運動", "🌀", "concept", 4, "目に見えない分子は、絶えず、不規則に動いている。温度が高いほど、激しい。", "1827年 ブラウン/1908年 ペラン(追体験で得る)"],
    ["fission_products", "核分裂生成物", "☢️", "concept", 4, "ウランに中性子を当てると、より軽い元素(バリウムなど)ができる。化学分析で、原子核の分裂を、確かめる。", "1938年 ハーン(追体験で得る)"],
    ["homeostasis", "内部環境の恒常性", "🩸", "concept", 4, "体の中の環境(血糖など)は、体の働きによって、一定に、保たれる。", "1850年代 ベルナール(追体験で得る)"],
    ["spectral_analysis", "分光分析", "🌈", "concept", 3, "炎や光のスペクトル線の位置から、元素を、見分ける。未知の線は、未知の元素の、しるし。", "1860年 ブンゼン/キルヒホフ(追体験で得る)"]
  );
  Object.assign(_D.REPLAY_GRANTS, { lavoisier: "quantitative_method", priestley: "pneumatic_chemistry", cavendish: "gas_volume_law", pasteur: "crystal_handedness", faraday: "electric_quantity", wohler: "compound_identification", brown: "molecular_motion", hahn: "fission_products", bernard: "homeostasis", bunsen: "spectral_analysis" });
  Object.assign(_D.REPLAY_GATES, {
    "conservation+water_compound": "quantitative_method", // 原子論(ドルトン)は、定量的な実験の上に、成り立つ
    "fire+hgo": "pneumatic_chemistry", // 酸化水銀から、気体を集める
    "microscope+racemic_acid+sodium": "crystal_handedness", // 光学分割
    "balance+copper_sulfate+electricity": "electric_quantity", // ファラデーの法則
    "ammonium_cyanate+fire": "compound_identification", // 尿素の合成(同定)
    "cyclotron+uranium": "fission_products", // ネプツニウム・プルトニウム
    "dna+glucose+microbe": "homeostasis", // インスリン
    "lepidolite+spectroscope": "spectral_analysis", // ルビジウム・セシウム
  });
  // 自動で得る知識(気づき)の条件に、追体験の知識を、加える
  [["avogadro_law", "gas_volume_law"], ["reaction_rate", "molecular_motion"]].forEach(([id, need]) => { const i = _D.INSIGHTS.find((x) => x.id === id); if (i && !i.need.includes(need)) i.need.push(need); });

  // ---- 計算 ----
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const ETA = { 20: 1.002e-3, 40: 0.653e-3, 60: 0.467e-3 };
  // ブラウン運動: 半径 0.5 µm の粒子。平面(顕微鏡の視野)での、平均二乗変位(µm²)= 4Dt
  R.brownD = (T) => 1.380649e-23 * (273.15 + T) / (6 * Math.PI * ETA[T] * 0.5e-6) * 1e12; // µm²/s
  R.brown = function (t, T, seed) {
    const r = rnd(seed), s = Math.sqrt(2 * R.brownD(T) * t); let sum = 0;
    for (let i = 0; i < 100; i++) { const x = gauss(r) * s, y = gauss(r) * s; sum += x * x + y * y; }
    const path = [[0, 0]], sd = Math.sqrt(2 * R.brownD(T) * t / 30); let px = 0, py = 0;
    for (let i = 0; i < 30; i++) { px += gauss(r) * sd; py += gauss(r) * sd; path.push([px, py]); }
    return { t, T, msd: Math.round(sum / 100 * 100) / 100, theory: Math.round(4 * R.brownD(T) * t * 100) / 100, path };
  };
  // ハーン: ウランに中性子を当てた生成物に、バリウムを加えて、分別結晶する。放射能(1分あたりの計数)
  R.hahnFrac = function (step, seed) {
    const r = rnd(seed + step * 7), n = (v) => Math.round(v * (1 + (r() - 0.5) * 0.06));
    return { step, observed: n(1000), ifRadium: Math.round(1000 * Math.pow(2.2, step)) }; // ラジウムなら、1回ごとに、約2倍に濃縮されるはず
  };
  // ベルナール: 肝臓の糖(ベネディクト反応の、強さ 0〜4)
  R.bernard = { blood: 3, washes: [3, 2, 1, 0], after: 3 };
  // 分光分析: 観察された線(nm)と、既知の元素
  R.spectrum = { lines: [589.0, 670.8, 766.5, 460.7, 455.5, 459.3], answer: ["Na", "Li", "K", "Sr", "?", "?"], known: ["Na", "K", "Li", "Sr", "Ca", "Ba"] };

  _D.REPLAYS.push(
    { id: "brown", title: "ブラウンの、分子運動の観察", year: "1827年(ペランの測定: 1908年)", who: "ブラウン", emoji: "🌀", era: 4, gear: ["microscope", "atom"],
      period: "使えるもの: 顕微鏡、水、微粒子、時計、温度の調節(湯)。 使えないもの: 電子顕微鏡、レーザー。",
      story: "植物学者のブラウンは、水に浮かべた花粉の粒が、顕微鏡の中で、絶えず、ふるえるように動くのを見た。生きているからだろうか? ところが、死んだ花粉や、鉱物の粉でも、同じように動いた。後に、ペランは、粒の動きを、定量的に調べ、分子の実在を、確かめた。",
      goal: "時間と温度を変えて、粒の動き(平均二乗変位)を測ろう(6回以上)。動きの大きさは、何で決まるか?" },
    { id: "hahn", title: "ハーンの、核分裂の発見", year: "1938年", who: "ハーン", emoji: "☢️", era: 4, gear: ["radioactivity", "uranium", "barium", "fractional"],
      period: "使えるもの: ウラン、中性子源、バリウムの塩、分別結晶の器具、放射線の計数管(ガイガー)。 使えないもの: 質量分析計。",
      story: "ウランに中性子を当てると、バリウムのように振る舞う、放射性の物質ができた。ハーンとシュトラスマンは、ラジウム(バリウムと、似た性質)ではないかと、疑った。ラジウムなら、分別結晶で、濃縮されるはずだ。",
      goal: "分別結晶を繰り返して、放射能が、濃縮されるかを、測ろう(4回)。生成物の正体は?" },
    { id: "bernard", title: "ベルナールの、肝臓の実験", year: "1855年ごろ", who: "ベルナール", emoji: "🩸", era: 4, gear: ["glucose", "copper_sulfate", "lye", "tartaric_acid"],
      period: "使えるもの: 銅の塩とアルカリと、酒石酸の試薬(糖を調べる)、水、摘出した肝臓。 使えないもの: 血糖値の測定器。",
      story: "当時は、糖は、植物だけが作り、動物は、食べて、取り込むだけ、と考えられていた。ベルナールは、糖を含まない食事を与えた動物の、血液と肝臓を調べた。また、摘出した肝臓を、水で洗い流して、糖を取り除き、一日置いて、もう一度、調べた。",
      goal: "糖の試験(赤く変わるほど、糖が、多い)を使って、血液と、洗った肝臓を、調べよう。体は、糖を作るだろうか?" },
    { id: "bunsen", title: "ブンゼンとキルヒホフの、分光分析", year: "1860年", who: "ブンゼン", emoji: "🌈", era: 3, gear: ["spectroscope", "sodium", "potassium", "lithium", "strontium"],
      period: "使えるもの: ブンゼンバーナー、プリズム分光器、既知の元素の、スペクトル線の表。 使えないもの: 回折格子の分光計(電子式)。",
      story: "ブンゼンとキルヒホフは、炎の光を、プリズムで、分けて、元素ごとに、決まった位置に、輝線が出ることを、見つけた。デュルクハイムの鉱泉水を、濃縮して、炎に入れると、既知の線のほかに、見たことのない、青い2本の線が、見えた。",
      goal: "観察した6本の線が、どの元素のものか、表と見比べて、分けよう。表にない線は、『未知』にする。" }
  );
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
