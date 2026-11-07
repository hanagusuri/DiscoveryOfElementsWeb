// 実験の収率: 化学平衡と反応速度で、成功・不成功と収量が決まる
(function (_T, _rowOf, _D) {
  const R = 8.314;
  // ---- 高圧装置と、収率・反応式の概念 ----
  _D.ITEM_ROWS.push(
    ["compressor", "圧縮機", "🗜️", "tool", 3, "蒸気機関で動くピストンで、気体を何十気圧にも圧縮する。工業的な高圧反応の前提になった。", "1895年 リンデ"],
    ["high_pressure_reactor", "高圧反応装置", "🏗️", "tool", 4, "数百気圧と数百℃に耐える鋼鉄の反応容器。水素に侵されにくい内張りを持つ。", "1910年 ボッシュ"],
    ["yield", "収率", "📊", "concept", 4, "理論上できる量のうち、実際に得られた割合。平衡や反応速度の条件で、大きく変わる。", "化学工業の基本"],
    ["chemical_equation", "化学反応式", "✍️", "concept", 4, "反応を、物質の式と係数で表す。左右で原子の種類と数が等しくなるように、係数を決める。", "1814年 ベルセリウス"]
  );
  _D.SPECIAL_ITEMS.push("yield", "chemical_equation");
  _D.RECIPE_ROWS.push(
    [["steam_engine", "pressure_vessel", "copper"], ["compressor"], "蒸気機関でピストンを往復させると、容器の中の気体が、ぎゅっと圧縮された。"],
    [["compressor", "iron", "furnace"], ["high_pressure_reactor"], "炉で鍛えた厚い鋼の容器に、圧縮機をつなぐと、百気圧を超える高圧に耐えた。"]
  );
  // 圧力の段階(atm)。装置を持つと選べる
  _D.PRESS_LEVELS = [{ p: 1, need: null }, { p: 10, need: "pressure_vessel" }, { p: 100, need: "compressor" }, { p: 300, need: "high_pressure_reactor" }];

  // ---- 平衡の追加: サバティエ反応 ----
  _D.EQUILIBRIA.push({ id: "sabatier", name: "メタンの合成(サバティエ反応)", eq: "CO + 3H₂ ⇌ CH₄ + H₂O", sp: [["CO", -1], ["H₂", -3], ["CH₄", 1], ["H₂O", 1]], n0: [1, 3, 0, 0], dG: -142.2, dH: -206.1, T: [400, 1100],
    note: "発熱で、気体の分子数が4から2に減る反応。低温・高圧ほど有利だが、ニッケル触媒が働く300〜400℃ほどが実用的。", cat: true });

  // ---- 平衡の解法(圧力・温度から、反応の進み ξ を求める) ----
  _D.solveEq = function (rx, TK, P, n) {
    const nu = rx.sp.map((s) => s[1]), dn = nu.reduce((p, q) => p + q, 0);
    const Tr = rx.Tref || 298.15, lnK = (rx.Kref ? Math.log(rx.Kref) : -rx.dG * 1000 / (R * Tr)) - (rx.dH * 1000 / R) * (1 / TK - 1 / Tr);
    let lo = -Infinity, hi = Infinity;
    nu.forEach((v, i) => { if (v > 0) lo = Math.max(lo, -n[i] / v); else hi = Math.min(hi, n[i] / -v); });
    if (!isFinite(lo)) lo = -1e3; if (!isFinite(hi)) hi = 1e3;
    const f = (x) => { let tot = 0; const ns = n.map((q, i) => { const v = Math.max(q + nu[i] * x, 1e-300); tot += v; return v; }); let s = dn * Math.log(P); nu.forEach((v, i) => { s += v * Math.log(ns[i] / tot); }); return s - lnK; };
    for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    const x = (lo + hi) / 2, xmax = Math.min(...nu.map((v, i) => (v < 0 ? n[i] / -v : Infinity)));
    return { x, xmax, frac: x / xmax, K: Math.exp(lnK), dn };
  };

  // ---- 収率モデル(レシピの材料キー → 平衡/反応速度) ----
  // kind=eq: 平衡(ξ)に、触媒つき反応速度が近づく度合いを掛ける。k673: 673 K での速度定数, Ea: kJ/mol, tRun: 実験の時間(秒)
  _D.YIELDS = {
    "hydrogen+iron+nitrogen": { kind: "eq", rx: "haber", Ea: 100, k673: 6e-4, tRun: 3600, threshold: 0.02, what: "アンモニア" },
    "air+hydrogen+iron": { kind: "eq", rx: "haber", Ea: 100, k673: 6e-4, tRun: 3600, threshold: 0.02, what: "アンモニア" },
    "co+hydrogen+nickel": { kind: "eq", rx: "sabatier", Ea: 80, k673: 1e-3, tRun: 3600, threshold: 0.05, what: "メタン" },
    "fire+limestone": { kind: "dec", threshold: 0.05, what: "生石灰" },
  };
  // 収率を計算する。戻り値 { y(0〜1), eq, approach, threshold, why }
  _D.yieldOf = function (key, TC, P, sealed) {
    const m = _D.YIELDS[key]; if (!m) return null;
    const TK = TC + 273.15;
    if (m.kind === "eq") {
      const rx = _D.EQUILIBRIA.find((e) => e.id === m.rx), r = _D.solveEq(rx, TK, P, rx.n0);
      const k = m.k673 * Math.exp(-(m.Ea * 1000 / R) * (1 / TK - 1 / 673.15)), approach = 1 - Math.exp(-k * m.tRun);
      const eq = Math.max(0, Math.min(1, r.frac)), y = eq * approach;
      let why = "";
      if (y < m.threshold) {
        if (approach < 0.2) why = "反応が遅すぎて、ほとんど進まなかった。もっと温度を上げて、速くしたい。";
        else if (eq < m.threshold * 3 && r.dn < 0 && P < 100) why = "平衡が原料側に傾いていて、生成物がほとんど残らない。気体の分子数が減る反応なので、圧力を上げると有利になりそうだ。";
        else why = "高温では平衡が原料側に傾き、生成物はほとんど残らない。温度を下げたいが、下げると反応が遅くなる…。";
      }
      return { y, eq, approach, threshold: m.threshold, why, what: m.what };
    }
    if (m.kind === "dec") { // 石灰石の熱分解: CaCO₃ ⇌ CaO + CO₂ (K = pCO₂)
      const lnK = -130.4 * 1000 / (R * 298.15) - (178.3 * 1000 / R) * (1 / TK - 1 / 298.15), K = Math.exp(lnK);
      const y = sealed ? Math.min(1, K * 0.009) : 1 - Math.exp(-K * 8); // 密閉(約1L): K[atm] の CO₂ が入る分だけ分解して止まる
      return { y, eq: y, approach: 1, threshold: m.threshold, what: m.what, why: sealed ? "密閉したため、出た CO₂ がたまって、分解が途中で止まった。CO₂ を逃がす(開放する)と、平衡が生成物側へ進む。" : "まだ温度が足りず、CO₂ の圧力が上がらないので、ほとんど分解しない。" };
    }
    return null;
  };

  _D.EQUIP_WHY.compressor = "高い圧力が作れない。気体を強く圧縮する、力強い装置が要りそうだ。";
  _D.EQUIP_WHY.high_pressure_reactor = "この圧力に耐えられる容器がない。もっと頑丈な反応装置が要りそうだ。";
  // ---- 既存レシピの調整 ----
  const set = (inp, f) => f(_rowOf(inp));
  set(["hydrogen", "nitrogen", "iron"], (r) => { r[7] = ["pressure_vessel", "compressor"]; });
  set(["hydrogen", "air", "iron"], (r) => { r[7] = ["pressure_vessel", "compressor"]; });
  set(["co", "hydrogen", "nickel"], (r) => { r[3] = { t: [2, 3] }; }); // 触媒反応は中温で
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
