// 歴史上の実験の追体験: 課題の定義と、シミュレーションの計算(純粋な関数。node でも、検証できる)
(function (_T, _rowOf, _D) {
  const R = (_D.REPLAY = {});
  // ---- 計算 ----
  const rnd = (seed) => { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; };
  R.rnd = rnd;
  const bal = (x, seed) => Math.round((x + (rnd(seed)() - 0.5) * 0.01) * 100) / 100; // 18世紀の精密天秤: 0.01 g まで
  // ラヴォアジエ: 錫を、フラスコに入れて加熱する(1774年)。密閉と、開放を、比べる
  R.lavoisier = function (sealed) {
    const MO2 = 32.0, MSN = 118.7, flask = 213.4, tin = 12.0;
    const air = 1.0, o2 = 0.21 * air * 1.43; // 空気 1 L 中の酸素の質量(約0.30 g)
    if (sealed) {
      const sn = o2 * MSN / MO2, oxide = sn + o2; // 酸素が尽きるまで、錫が反応する
      const total0 = flask + tin + 1.29 * air, inflow = 0.21 * air * 1.29; // 酸素が減り、圧力が下がる → 開栓で、空気が流れ込む
      return { sealed: true, before: bal(total0, 1), afterClosed: bal(total0, 2), afterOpen: bal(total0 + inflow, 3), metalBefore: tin, metalAfter: Math.round((tin - sn + oxide) * 100) / 100, gain: Math.round(o2 * 100) / 100, oxide: Math.round(oxide * 100) / 100 };
    }
    const gain = 1.5; // 開放の坩堝では、空気がいくらでも、入る
    return { sealed: false, metalBefore: bal(tin, 4), metalAfter: bal(tin + gain, 5), gain };
  };
  // プリーストリー: 酸化水銀を、レンズの光で熱して、気体を集める(1774年)
  R.priestley = function (m) {
    const mol = m / 216.6, o2L = mol / 2 * 24; // 2HgO → 2Hg + O₂(室温で約24 L/mol)
    return { hg: Math.round(m * 200.6 / 216.6 * 100) / 100, o2mL: Math.round(o2L * 1000), o2g: Math.round(mol / 2 * 32 * 1000) / 1000 };
  };
  // 気体の反応(水素と酸素): 2H₂ + O₂ → 2H₂O (体積比 2:1)
  R.gasReact = function (h2, o2) {
    const useO = Math.min(o2, h2 / 2), useH = useO * 2;
    const left = { h2: Math.round((h2 - useH) * 10) / 10, o2: Math.round((o2 - useO) * 10) / 10 };
    const waterG = Math.round(useH / 24000 * 18.0 * 1000) / 1000; // 水素 useH mL → 水 g
    return { used: { h2: Math.round(useH * 10) / 10, o2: Math.round(useO * 10) / 10 }, left, waterMg: Math.round(waterG * 1000), exact: left.h2 < 0.5 && left.o2 < 0.5 && h2 >= 10 && o2 >= 10 };
  };
  // パスツール: 結晶の形(左右)を、判別する
  R.crystals = function (seed) {
    const r = rnd(seed), list = [];
    for (let i = 0; i < 10; i++) list.push({ side: i < 5 ? "R" : "L", tilt: Math.round((r() - 0.5) * 16), size: 0.85 + r() * 0.3 });
    return list.map((c) => [r(), c]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  };
  R.rotation = { R: 12.0, L: -12.0, mix: 0.0 }; // 旋光度(比旋光度)の、見かけの値(°)
  // ファラデー: 硫酸銅の水溶液を、電気分解する。析出する銅の質量(g)
  R.faraday = function (I, tMin) { const Q = I * tMin * 60; return { Q: Math.round(Q), cu: Math.round(63.55 * Q / (2 * 96485) * 1000) / 1000 }; };
  // ヴェーラー: 同定の、ための試験
  R.wohlerTests = [
    { id: "ag", name: "硝酸銀の溶液を加える", a: "白い沈殿ができた(シアン酸銀)", b: "変化がない" },
    { id: "hno3", name: "濃い硝酸を加えて、冷やす", a: "変化がない", b: "真珠のような、光沢のある結晶が、析出した(硝酸尿素)" },
    { id: "oxalic", name: "シュウ酸の溶液を加える", a: "変化がない", b: "白い結晶が、析出した(シュウ酸尿素)" },
    { id: "mp", name: "融点を調べる", a: "約60℃で、分解して、気体が出る", b: "133℃で、融ける" },
    { id: "odor", name: "においをかぐ", a: "ほとんど、においがない", b: "ほとんど、においがない" },
    { id: "color", name: "色を見る", a: "無色", b: "無色" },
  ];
  // ---- 課題 ----
  // gear: 必要な器具・材料(すべて発見している必要がある)  period: この時代に、使えた器具と、使えなかったもの
  _D.REPLAYS = [
    { id: "lavoisier", title: "ラヴォアジエの、質量保存の実験", year: "1774年", who: "ラヴォアジエ", emoji: "⚖️", era: 3, gear: ["balance", "glass_flask", "tin"],
      period: "使えるもの: 精密天秤(0.01 g)、ガラスの、密閉できるフラスコ、錫、炭火。 使えないもの: 質量分析計、気体の組成分析器。",
      story: "当時、金属を熱すると、『フロギストン』が逃げて、金属が、灰(酸化物)になる、と信じられていた。しかし、金属の灰は、元の金属より、重くなることが、知られていた。ラヴォアジエは、『密閉した容器の中で、熱したら、何が起こるのか』を、天秤で、確かめようとした。",
      goal: "錫を、フラスコに入れて加熱し、前後の質量を、天秤で量ろう。開放と、密閉の両方を、行う。" },
    { id: "priestley", title: "プリーストリーの、酸素の発見", year: "1774年", who: "プリーストリー", emoji: "🕯️", era: 3, gear: ["lens", "hgo", "pneumatic_trough"],
      period: "使えるもの: 大きな凸レンズ(太陽光を集める)、水銀を満たした水槽、ガラスの鐘、ろうそく。 使えないもの: 電気ヒーター、ガスクロマトグラフ。",
      story: "プリーストリーは、赤い『水銀灰』(酸化水銀)に、大きなレンズで、太陽光を集めた。すると、水銀の玉と、気体が出てきた。その気体の中に、ろうそくを入れると、驚くほど、明るく燃えた。",
      goal: "酸化水銀の量を決めて、レンズで加熱し、出てくる気体の量を測ろう。その気体の性質を、試験する。" },
    { id: "cavendish", title: "水の合成と、気体反応の法則", year: "1781〜1805年", who: "キャベンディッシュ", emoji: "💧", era: 3, gear: ["eudiometer", "hydrogen", "oxygen"],
      period: "使えるもの: ユーディオメーター(気体の体積を測る管、電気火花つき)、水素、酸素。 使えないもの: 質量分析計、デジタルの、流量計。",
      story: "キャベンディッシュは、水素('燃える空気')を、空気中で燃やすと、水ができることを、確かめた。のちに、ゲイ=リュサックらは、気体が反応する体積に、簡単な整数比があることに、気づいた。",
      goal: "水素と酸素の体積を変えて、火花を飛ばし、残る気体が出ない(ちょうど、反応しきる)比を、見つけよう。" },
    { id: "pasteur", title: "パスツールの、光学分割", year: "1848年", who: "パスツール", emoji: "🔬", era: 4, gear: ["microscope", "racemic_acid"],
      period: "使えるもの: 顕微鏡、ピンセット、旋光計(偏光を、回す角度を測る)、ラセミ酸のナトリウムアンモニウム塩の結晶。 使えないもの: X線結晶構造解析。",
      story: "同じ組成なのに、光を回す酒石酸と、回さないラセミ酸がある。当時25歳のパスツールは、ラセミ酸の塩の結晶を、顕微鏡で調べて、気づいた。結晶の形が、2種類あり、左右が、鏡像になっている!",
      goal: "結晶を、ピンセットで、左型と右型に、仕分けよう。それぞれの溶液の、旋光度を、測る。" },
    { id: "faraday", title: "ファラデーの、電気分解の法則", year: "1833年", who: "ファラデー", emoji: "🧲", era: 3, gear: ["battery", "copper_sulfate", "electrolysis"],
      period: "使えるもの: ボルタ電堆(電池)、電流計(ガルバノメーター)、白金の電極、天秤、時計。 使えないもの: 電子の知識(1897年に発見)。",
      story: "ファラデーは、電気分解で、析出する物質の質量を、流した電気の量(電流 × 時間)と、比べた。電気の量と、物質の量の間に、簡単な関係が、あるはずだと考えた。",
      goal: "電流と時間を変えて、銅が析出する質量を、測ろう。関係を、見つける。" },
    { id: "wohler", title: "ヴェーラーの、尿素の合成", year: "1828年", who: "ヴェーラー", emoji: "🧪", era: 3, gear: ["ammonium_cyanate", "urea", "silver_nitrate", "nitric"],
      period: "使えるもの: 試薬(硝酸銀、硝酸、シュウ酸)、融点の測定、結晶の観察。 使えないもの: 赤外分光、NMR、質量分析。",
      story: "ヴェーラーは、シアン酸アンモニウムの溶液を、加熱して、蒸発させると、無色の結晶が得られた。その結晶は、シアン酸アンモニウムの性質を、示さなかった。尿から取り出した、尿素と、同じだろうか?",
      goal: "試験を選んで、結晶の正体を、調べよう。複数の試験で、尿素と、同じ性質か、確かめる。" },
  ];
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
