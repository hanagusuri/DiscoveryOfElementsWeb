// 追体験(第4弾): ブラッグ・モーズリー・ミラー・ワトソンとクリック・フレミング。
// 課題の達成を、通常の実験だけでなく、研究(技術)や産業(工場・産業技術)の条件にも、広げる
(function (_T, _rowOf, _D) {
  const R = _D.REPLAY, rnd = R.rnd;
  _D.ITEM_ROWS.push(
    ["crystal_structure", "結晶構造の解析", "💎", "concept", 4, "X線を結晶に当て、反射の角度から、原子の面の間隔を求める。原子の並び方が、わかる。", "1913年 ブラッグ父子(追体験で得る)"],
    ["atomic_number", "原子番号", "🔢", "concept", 4, "元素のX線の波長は、原子核の陽子の数(原子番号)で決まる。周期表の本当の順序と、空欄が、はっきり分かる。", "1913年 モーズリー(追体験で得る)"],
    ["chemical_evolution", "化学進化", "🌩️", "concept", 4, "原始地球の気体と雷から、生命の材料(アミノ酸)が、自然にできる。生命の起源への、手がかり。", "1953年 ミラー(追体験で得る)"],
    ["double_helix", "二重らせん構造", "🧬", "concept", 4, "DNAは、2本の鎖が、らせん状に巻き、塩基(AとT、GとC)が、対になる。遺伝情報の複製の仕組みが、見える。", "1953年 ワトソンとクリック(追体験で得る)"],
    ["antibiosis", "抗生(カビが細菌を抑える)", "🍄", "concept", 4, "微生物が出す物質が、他の微生物の増殖を、抑える。薬としての、可能性。", "1928年 フレミング(追体験で得る)"]
  );
  Object.assign(_D.REPLAY_GRANTS, { bragg: "crystal_structure", moseley: "atomic_number", miller: "chemical_evolution", watsoncrick: "double_helix", fleming: "antibiosis" });
  Object.assign(_D.REPLAY_GATES, {
    "nucleic+xray": "crystal_structure", // DNAのX線解析
    "dna+microbe": "double_helix", // 遺伝子工学
    "xray+zircon": "atomic_number", // ハフニウム
    "columbite+xray": "atomic_number", // レニウム
    "fruit+microbe": "antibiosis", // ペニシリン
    "earth+glucose+microbe": "antibiosis", // ストレプトマイシン
    "ammonia+electricity+methane": "chemical_evolution", // アミノ酸の、放電合成(新しい経路)
  });
  // 新しい経路: メタンとアンモニアに、放電して、アミノ酸を得る(ミラー・ユーリーの実験)
  _D.RECIPE_ROWS.push([["methane", "ammonia", "electricity"], ["glycine", "alanine"], "メタンとアンモニアの気体に、電気の火花を飛ばし続けると、水が赤褐色になり、アミノ酸が、見つかった。", undefined, undefined, undefined, undefined, ["glass_flask"], { v: [10, 120], cur: 2 }]);
  _D.WHY["ammonia+electricity+methane"] = "メタン、アンモニア、水素、水蒸気の混合気体に、放電(雷)を、続けると、気体の分子が、壊れて、結びつき直し、シアン化水素やアルデヒドができる。これが水に溶けて、反応を重ね、アミノ酸(グリシン、アラニンなど)になる(ストレッカー合成)。生命の材料が、無生物の環境で、できる可能性を示した。";
  // ---- 研究(技術)の条件: 追体験で得る知識 ----
  const tech = (id, c) => { const t = _D.TECHS.find((x) => x.id === id); if (t && !t.req.includes(c)) t.req.push(c); };
  [["t_cryo", "charles_law"], ["t_accel", "nucleus"], ["t_earths", "electric_quantity"], ["t_rare", "spectral_analysis"], ["t_newmetal", "compound_identification"], ["t_periodic", "gas_volume_law"]].forEach(([t, c]) => tech(t, c));
  // ---- 産業の条件: 産業技術と、工場 ----
  const itech = (id, c) => { const t = _D.IND_TECHS.find((x) => x.id === id); if (t) t.need = [...(t.need || []), c]; };
  [["steampower", "boyle_law"], ["analysis", "quantitative_method"], ["recycle", "molecular_motion"], ["automation", "elementary_charge"]].forEach(([t, c]) => itech(t, c));
  _D.PLANT_NEED = { ammonia: "process_optimization", sulfuric: "gas_volume_law", nitric: "gas_volume_law", uranium: "fission_products", silicon: "elementary_charge", semiconductor: "elementary_charge", transistor: "elementary_charge", ic: "elementary_charge", aspirin: "compound_identification", penicillin: "antibiosis", streptomycin: "antibiosis", insulin: "homeostasis", hafnium: "atomic_number", rhenium: "atomic_number" };

  // ---- 計算 ----
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  // ブラッグ: NaCl の(200)面。λ = 0.154 nm、d = 0.282 nm。 nλ = 2d sinθ
  R.bragg = { lambda: 0.154, d: 0.282 };
  R.braggPeaks = () => [1, 2, 3].map((n) => Math.asin(n * R.bragg.lambda / (2 * R.bragg.d)) * 180 / Math.PI);
  R.braggI = function (th) {
    const r = rnd(Math.round(th * 10) + 5); let I = 4 + r() * 3;
    R.braggPeaks().forEach((p, i) => { I += (100 / (i + 1.4)) * Math.exp(-Math.pow((th - p) / 0.55, 2)); });
    return Math.round(I);
  };
  // モーズリー: Kα の光子エネルギー E = 10.2 eV × (Z−1)²
  R.moseley = [[20, "Ca", 40.08], [22, "Ti", 47.87], [23, "V", 50.94], [24, "Cr", 52.0], [25, "Mn", 54.94], [26, "Fe", 55.85], [27, "Co", 58.93], [28, "Ni", 58.69], [29, "Cu", 63.55], [30, "Zn", 65.38]];
  R.moseleyE = function (Z) { const e = 10.2 * Math.pow(Z - 1, 2) / 1000 * (1 + (rnd(Z * 13)() - 0.5) * 0.008); return Math.round(e * 1000) / 1000; };
  // ミラー: 水・メタン・アンモニア・(水素)に放電。アミノ酸(µmol)
  R.miller = function (c, days) {
    const ok = c.ch4 && c.nh3 && c.spark, k = ok ? (c.h2 ? 1.4 : 1) : 0, f = Math.pow(days, 0.9);
    return { days, c, gly: Math.round(2.4 * f * k * 10) / 10, ala: Math.round(1.6 * f * k * 10) / 10, asp: Math.round(0.3 * f * k * 10) / 10, color: !ok ? "透明のまま" : days < 3 ? "淡い黄色" : days < 6 ? "赤みがかる" : "赤褐色" };
  };
  // ワトソンとクリック: 塩基の組成(%)(おおよその値)
  R.chargaff = [["ヒト", 30.9, 29.4, 19.9, 19.8], ["ウシ", 28.7, 27.2, 22.2, 22.0], ["酵母", 31.3, 32.9, 18.7, 17.1], ["大腸菌", 26.0, 23.9, 24.9, 25.2]];
  R.pair = { A: "T", T: "A", G: "C", C: "G" };
  // フレミング: 阻止円の直径(mm)
  R.flemingDils = [1, 10, 100, 1000, 10000];
  R.fleming = function (bact, dil) {
    const i = R.flemingDils.indexOf(dil), staph = [30, 26, 21, 15, 8][i], r = rnd(i * 7 + (bact === "staph" ? 1 : 2));
    return { bact, dil, mm: bact === "staph" ? Math.round(staph + (r() - 0.5) * 2) : 0 };
  };
  _D.REPLAYS.push(
    { id: "bragg", title: "ブラッグの、X線による結晶構造の解析", year: "1913年", who: "ブラッグ", emoji: "💎", era: 4, gear: ["xray", "salt"],
      period: "使えるもの: X線管、岩塩の単結晶、回転台、電離箱(X線の強さを測る)。 使えないもの: 電子式の、X線カメラ、コンピュータ。",
      story: "X線は、光の仲間(波)なのか、粒子なのか。ラウエは、結晶にX線を当てると、規則的な、回折の模様が出ることを見つけた。ブラッグ父子は、結晶を回しながら、X線の強さを測り、ある決まった角度で、強く反射することから、原子の面の間隔を、求めた。",
      goal: "結晶を、回転させて、X線の強さを測ろう。強さが、急に大きくなる角度(ピーク)を、2つ以上、見つける。" },
    { id: "moseley", title: "モーズリーの、原子番号の発見", year: "1913年", who: "モーズリー", emoji: "🔢", era: 4, gear: ["xray", "periodic"],
      period: "使えるもの: X線管、元素の板(標的)、結晶(分光用)、写真乾板。 使えないもの: 電子式の、エネルギー分析器。",
      story: "周期表は、原子量の順に、並んでいるが、コバルトとニッケルのように、原子量の順と、性質の順が、合わない所がある。モーズリーは、元素に電子をぶつけて出る、特性X線のエネルギーを、測った。",
      goal: "いろいろな元素の、特性X線のエネルギーを測り、元素の並びとの、関係を、見つけよう(6元素以上。コバルトとニッケルを、含める)。" },
    { id: "miller", title: "ミラーの、原始スープの実験", year: "1953年", who: "ミラー", emoji: "🌩️", era: 4, gear: ["methane", "ammonia", "electricity", "glass_flask"],
      period: "使えるもの: ガラスの密閉装置(フラスコ)、電極、水、メタン、アンモニア、水素、ペーパークロマトグラフィー(成分を調べる)。 使えないもの: 質量分析計。",
      story: "原始地球の大気は、メタン、アンモニア、水素、水蒸気だった、と考えられた。ミラーとユーリーは、この混合気体を、密閉装置に入れ、雷を模した、放電を、続けた。数日後、水は、赤褐色に、変わった。",
      goal: "気体の組み合わせと、放電の、有無を変えて、実験しよう(3回以上)。アミノ酸が、できる条件を、見つける。" },
    { id: "watsoncrick", title: "ワトソンとクリックの、DNAの二重らせん", year: "1953年", who: "ワトソンとクリック", emoji: "🧬", era: 4, gear: ["nucleic", "xray", "crystal_structure"],
      period: "使えるもの: シャルガフのデータ(塩基の量)、フランクリンの、X線回折写真、厚紙の、分子模型。 使えないもの: 電子顕微鏡、塩基配列の解読。",
      story: "DNAが、遺伝子の本体だと、分かってきた。しかし、その構造は?シャルガフは、DNAの塩基の量に、規則を見つけ、フランクリンは、X線写真を撮った。ワトソンとクリックは、これらを、手がかりに、模型を組み立てた。",
      goal: "塩基の量の規則を、見つけ、塩基の対を、決め、X線写真のデータから、らせんの構造を、考えよう。" },
    { id: "fleming", title: "フレミングの、ペニシリンの発見", year: "1928年", who: "フレミング", emoji: "🍄", era: 4, gear: ["microbe", "glucose", "microscope"],
      period: "使えるもの: 寒天培地、シャーレ、ブドウ球菌と大腸菌の培養、カビの培養液、顕微鏡。 使えないもの: 抗生物質の純粋な結晶、遠心分離機。",
      story: "休暇から戻ったフレミングは、放置していた、ブドウ球菌の培養皿に、青いカビが生え、その周りだけ、細菌が育っていないことに気づいた。カビが、細菌を殺す、何かを、出しているのか。",
      goal: "カビの培養液を薄めて、いろいろな細菌に試し、阻止円(細菌が育たない範囲)の大きさを、測ろう(4回以上)。" }
  );
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
