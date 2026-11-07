// 収率モデルの拡張: 接触法(硫酸)・オストワルト法(硝酸)・メタノール合成・ベンゼン・尿素・塩素酸塩
(function (_T, _rowOf, _D) {
  const R = 8.314;
  // ---- メタノール合成の平衡と、新しいレシピ(高圧法) ----
  _D.EQUILIBRIA.push({ id: "methanol", name: "メタノールの合成(高圧法)", eq: "CO + 2H₂ ⇌ CH₃OH", sp: [["CO", -1], ["H₂", -2], ["CH₃OH", 1]], n0: [1, 2, 0], dG: -25.1, dH: -90.7, T: [350, 650],
    note: "気体の分子数が3から1に減る発熱反応。高圧が有利で、酸化亜鉛などの触媒で、250〜400℃ほどで行う。", cat: true });
  _D.RECIPE_ROWS.push(
    [["co", "hydrogen", "zinc_oxide"], ["methanol"], "高圧の一酸化炭素と水素を、酸化亜鉛を触媒に通すと、木材を乾留しなくても、メタノールが得られた。(高圧法)", { t: [2, 3], sealed: true }, undefined, undefined, undefined, ["pressure_vessel", "compressor"]]
  );
  // 接触法は、触媒を働かせる中温(約400℃)で行う
  _rowOf(["so2", "platinum", "water"])[3] = { t: [2, 3] };
  _rowOf(["so2", "platinum", "water"])[7] = ["pressure_vessel"];

  // ---- 収率モデルを追加 ----
  // sel: 最適温度付近でだけ高収率(副反応や分解が起きる)  rate: 触媒つきの反応速度だけで決まる
  Object.assign(_D.YIELDS, {
    "platinum+so2+water": { kind: "eq", rx: "so3", Ea: 70, k673: 5e-3, tRun: 3600, threshold: 0.05, what: "硫酸(三酸化硫黄)" },
    "co+hydrogen+zinc_oxide": { kind: "eq", rx: "methanol", Ea: 90, k673: 2e-4, tRun: 3600, threshold: 0.03, what: "メタノール" },
    "air+ammonia+platinum": { kind: "sel", Topt: 850, w: 300, ymax: 0.96, threshold: 0.05, what: "硝酸(一酸化窒素)", cold: "白金の温度が低いと、アンモニアが NO にならず、窒素まで分解したり、反応が不完全になる。", hot: "温度が高すぎると、アンモニアが窒素と水素に分解してしまい、NO が得られない。最適な温度は800〜900℃。" },
    "acetylene+fire": { kind: "sel", Topt: 750, w: 350, ymax: 0.4, threshold: 0.03, what: "ベンゼン", cold: "温度が低く、三分子がつながる反応が進まない。", hot: "温度が高すぎて、アセチレンが炭素と水素に分解し、すすになってしまった。" },
    "fire+kerosene": { kind: "sel", Topt: 1100, w: 500, ymax: 0.6, threshold: 0.05, what: "軽い気体(エチレンなど)", cold: "温度が低く、分解がほとんど進まない。", hot: "温度が高すぎて、分解しすぎて炭素のすすになってしまった。" },
    "ammonium_cyanate+fire": { kind: "sel", Topt: 100, w: 120, ymax: 0.9, threshold: 0.05, what: "尿素", cold: "温度が低く、転位がほとんど進まない。", hot: "温度が高すぎて、尿素になる前に、アンモニアとシアン酸に分解して逃げてしまった。穏やかに加熱しよう。" },
    "chlorate+fire+pyrolusite": { kind: "rate", Ea: 95, k673: 8e-4, tRun: 3600, threshold: 0.05, what: "酸素", cold: "温度が低く、分解が遅すぎる。触媒があっても、ある程度の温度は必要だ。" },
  });

  // ---- yieldOf を拡張(sel / rate) ----
  const old = _D.yieldOf;
  _D.yieldOf = function (key, TC, P, sealed) {
    const m = _D.YIELDS[key];
    if (m && m.kind === "sel") {
      const y = m.ymax * Math.exp(-Math.pow((TC - m.Topt) / m.w, 2));
      return { y, eq: y, approach: 1, threshold: m.threshold, what: m.what, why: y < m.threshold ? (TC < m.Topt ? m.cold : m.hot) : "" };
    }
    if (m && m.kind === "rate") {
      const TK = TC + 273.15, k = m.k673 * Math.exp(-(m.Ea * 1000 / R) * (1 / TK - 1 / 673.15)), y = 1 - Math.exp(-k * m.tRun);
      return { y, eq: 1, approach: y, threshold: m.threshold, what: m.what, why: y < m.threshold ? m.cold : "" };
    }
    return old(key, TC, P, sealed);
  };
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
