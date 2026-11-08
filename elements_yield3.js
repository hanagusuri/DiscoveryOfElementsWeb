// 収率のモデルを、他の反応にも、広げる: 重合・発酵・製錬・ガラス・セメント・エステル化・分解など
// sel: 最適温度付近でだけ高収率  selp: sel に、圧力の効果を加えたもの  rate2: 反応速度で決まり、平衡の上限(ymax)がある
// ambient: 火を使わない反応。実験室の温度(常温・氷水など)で、決まる
(function (_T, _rowOf, _D) {
  const R = 8.314;
  // ---- 既存レシピの、温度条件の調整(実際の反応温度に、近づける) ----
  _rowOf(["alcohol", "sulfuric"])[3] = { t: [1, 2] }; // エーテルは、低温(約130℃)。高温では、エチレンになる
  _rowOf(["adipic_acid", "ammonia", "fire"])[3] = { t: [2, 3] }; // ナイロンの縮合重合(約270℃)
  _rowOf(["ethylene_glycol", "terephthalic_acid"])[3] = { t: [2, 3] };
  Object.assign(_D.YIELDS, {
    // ---- 高分子 ----
    "ethylene+fire+pressure_vessel": { kind: "selp", Topt: 400, w: 250, ymax: 0.9, pRef: 100, pexp: 0.4, threshold: 0.05, what: "ポリエチレン", cold: "温度が低く、重合が、進まない。", hot: "温度が高すぎる。重合には、上限の温度(天井温度)があり、それを超えると、鎖が、ほどけて、重合しない。", plow: "圧力が低く、エチレンが、混み合わないので、鎖が、なかなか、伸びない。圧力を、上げよう。" },
    "pressure_vessel+vinyl_chloride": { kind: "sel", Topt: 400, w: 250, ymax: 0.85, threshold: 0.05, what: "ポリ塩化ビニル", cold: "温度が低く、重合が、遅い。", hot: "温度が高すぎて、塩化水素が抜け、分解して、黒く変色する。" },
    "pressure_vessel+styrene": { kind: "sel", Topt: 400, w: 250, ymax: 0.85, threshold: 0.05, what: "ポリスチレン", cold: "温度が低く、重合が、遅い。", hot: "温度が高すぎて、鎖が、ほどけてしまう(解重合)。" },
    "propylene+titanium_chloride": { kind: "sel", Topt: 100, w: 150, ymax: 0.9, threshold: 0.05, what: "ポリプロピレン", cold: "温度が低く、触媒が、働かない。", hot: "温度が高すぎて、触媒が、壊れ、鎖の向きが、そろわず、できが、悪い。" },
    "adipic_acid+ammonia+fire": { kind: "sel", Topt: 400, w: 250, ymax: 0.9, threshold: 0.05, what: "ナイロン", cold: "温度が低く、縮合が、進まない。", hot: "温度が高すぎて、原料が、分解して、黄色く焦げる。" },
    "ethylene_glycol+terephthalic_acid": { kind: "sel", Topt: 400, w: 250, ymax: 0.9, threshold: 0.05, what: "PET", cold: "温度が低く、縮合が、進まない。", hot: "温度が高すぎて、分解して、色がつく。" },
    "fire+latex+sulfur": { kind: "sel", Topt: 400, w: 250, ymax: 0.9, threshold: 0.05, what: "加硫ゴム", cold: "温度が低く、硫黄の架橋が、進まない。", hot: "温度が高すぎて、焦げて、ぼろぼろになる(エボナイトの前に、劣化する)。" },
    "fire+petroleum+sulfuric": { kind: "sel", Topt: 400, w: 250, ymax: 0.8, threshold: 0.05, what: "プラスチック", cold: "温度が低く、重合が、進まない。", hot: "温度が高すぎて、炭化(すす)してしまう。" },
    // ---- 有機合成 ----
    "alcohol+sulfuric": { kind: "sel", Topt: 100, w: 130, ymax: 0.8, threshold: 0.05, what: "エーテル", cold: "温度が低く、脱水が進まない。", hot: "温度が高すぎる。高温では、水が、もう1分子取れて、エチレンになってしまい、エーテルが、できない。" },
    "alcohol+fire+sulfuric": { kind: "sel", Topt: 400, w: 250, ymax: 0.8, threshold: 0.05, what: "エチレン", cold: "温度が低い。エーテルが、できてしまう。もっと温度を上げると、1分子の水が、取れて、エチレンになる。", hot: "温度が高すぎて、炭化して、すすが出る。" },
    "acetic_acid+alcohol+sulfuric": { kind: "rate2", ambient: true, Ea: 40, k673: 0.5, tRun: 7200, ymax: 0.67, threshold: 0.05, what: "酢酸エチル", cold: "温度が低く、反応が、遅すぎる。(平衡で、約67%までしか、進まない)" },
    "ammonium_nitrate+fire": { kind: "sel", Topt: 400, w: 200, ymax: 0.9, threshold: 0.05, what: "笑気(亜酸化窒素)", cold: "温度が低く、分解しない。", hot: "温度が高すぎて、爆発的に分解し、窒素と酸素になる。" },
    "chlorine+fire+lye": { kind: "sel", Topt: 400, w: 250, ymax: 0.85, threshold: 0.05, what: "塩素酸カリウム", cold: "温度が低く、不均化が、進まない。", hot: "温度が高すぎて、塩素酸塩が、分解して、酸素が出る。" },
    // ---- 製錬・窯業 ----
    "ash+fire+sand": { kind: "sel", Topt: 1600, w: 350, ymax: 0.95, threshold: 0.08, what: "ガラス", cold: "温度が低く、砂が、融けない(融剤があっても、約1400℃は必要)。", hot: "温度が高すぎて、融けた成分が、蒸発し、気泡だらけになる。" },
    "charcoal+fire+iron": { kind: "sel", Topt: 1600, w: 400, ymax: 0.95, threshold: 0.08, what: "鋼", cold: "温度が低く、炭素が、鉄に染み込まない。", hot: "温度が高すぎて、炭素が、入りすぎ、もろい鋳鉄になる。" },
    "earth+fire+limestone": { kind: "sel", Topt: 1600, w: 350, ymax: 0.95, threshold: 0.08, what: "セメント", cold: "温度が低く、石灰と粘土が、反応しない(約1450℃が、必要)。", hot: "温度が高すぎて、融けすぎ、固まってしまう。" },
    "earth+fire+sand": { kind: "sel", Topt: 1600, w: 400, ymax: 0.95, threshold: 0.08, what: "磁器", cold: "温度が低く、ガラス質に、ならない。", hot: "温度が高すぎて、形が、くずれる。" },
    "copper+fire+zinc": { kind: "sel", Topt: 1100, w: 300, ymax: 0.95, threshold: 0.05, what: "黄銅", cold: "温度が低く、融けない。", hot: "温度が高すぎて、亜鉛が、蒸発して、逃げる(亜鉛の沸点は、約907℃)。" },
    "charcoal+fire+iron_ore": { kind: "sel", Topt: 1600, w: 450, ymax: 0.9, threshold: 0.08, what: "鉄", cold: "温度が低く、還元が、進まない。", hot: "温度が高すぎて、鉄が、炭素を吸いすぎ、不純になる。" },
    "co+fire+iron_ore": { kind: "sel", Topt: 1600, w: 450, ymax: 0.9, threshold: 0.08, what: "鉄", cold: "温度が低く、還元が、進まない。", hot: "温度が高すぎる。" },
    "charcoal+sand+urine": { kind: "sel", Topt: 1100, w: 400, ymax: 0.6, threshold: 0.05, what: "リン", cold: "温度が低く、リン酸が、還元されない。", hot: "温度が高すぎて、リンの蒸気が、燃えてしまう。" },
    // ---- 発酵・培養(火を使わず、常温で行う。微生物が、働く温度がある) ----
    "fruit+pottery": { kind: "sel", ambient: true, Topt: 25, w: 15, ymax: 0.85, threshold: 0.05, what: "酒(ワイン)", cold: "冷たすぎて、酵母が、ほとんど、活動しない。", hot: "熱すぎて、酵母が、死んでしまう。" },
    "grain+pottery+water": { kind: "sel", ambient: true, Topt: 25, w: 15, ymax: 0.85, threshold: 0.05, what: "ビール", cold: "冷たすぎて、酵母が、ほとんど、活動しない。", hot: "熱すぎて、酵母が、死んでしまう。" },
    "air+wine": { kind: "sel", ambient: true, Topt: 30, w: 15, ymax: 0.8, threshold: 0.05, what: "酢", cold: "冷たすぎて、酢酸菌が、働かない。", hot: "熱すぎて、酢酸菌が、死んでしまう。" },
    "air+milk": { kind: "sel", ambient: true, Topt: 30, w: 15, ymax: 0.8, threshold: 0.05, what: "乳酸", cold: "冷たすぎて、乳酸菌が、ほとんど、増えない。", hot: "熱すぎて、乳酸菌が、死んでしまう。" },
    "glucose+microbe": { kind: "sel", ambient: true, Topt: 30, w: 15, ymax: 0.8, threshold: 0.05, what: "乳酸", cold: "冷たすぎて、細菌が、増えない。", hot: "熱すぎて、細菌が、死んでしまう。" },
    "fruit+microbe": { kind: "sel", ambient: true, Topt: 25, w: 8, ymax: 0.5, threshold: 0.03, what: "ペニシリン", cold: "冷たすぎて、カビが、あまり育たない。", hot: "熱すぎて、アオカビが、育たない(約25℃が、適温)。" },
    "earth+glucose+microbe": { kind: "sel", ambient: true, Topt: 28, w: 8, ymax: 0.5, threshold: 0.03, what: "ストレプトマイシン", cold: "冷たすぎて、放線菌が、あまり育たない。", hot: "熱すぎて、放線菌が、育たない。" },
  });
  // ---- yieldOf を拡張(selp / rate2) ----
  const old = _D.yieldOf;
  _D.yieldOf = function (key, TC, P, sealed) {
    const m = _D.YIELDS[key];
    if (m && m.kind === "selp") {
      const yt = m.ymax * Math.exp(-Math.pow((TC - m.Topt) / m.w, 2)), pf = Math.min(1, Math.pow(Math.max(P, 1) / m.pRef, m.pexp)), y = yt * pf;
      return { y, eq: yt, approach: pf, threshold: m.threshold, what: m.what, why: y < m.threshold ? (yt < m.threshold ? (TC < m.Topt ? m.cold : m.hot) : m.plow) : "" };
    }
    if (m && m.kind === "rate2") {
      const TK = TC + 273.15, k = m.k673 * Math.exp(-(m.Ea * 1000 / R) * (1 / TK - 1 / 673.15)), y = m.ymax * (1 - Math.exp(-k * m.tRun));
      return { y, eq: m.ymax, approach: 1 - Math.exp(-k * m.tRun), threshold: m.threshold, what: m.what, why: y < m.threshold ? m.cold : "" };
    }
    return old(key, TC, P, sealed);
  };
  // 工業的な、最適温度(火を使わない反応は、発酵槽などで、温度を管理できる)
  _D.yieldTopt = (key) => { const m = _D.YIELDS[key]; return m && (m.Topt || (m.ambient ? 25 : null)); };
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
