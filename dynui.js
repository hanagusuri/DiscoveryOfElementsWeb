// 溶解度・化学平衡・反応速度のシミュレーター(化学タブのサブタブ)
(function () {
  "use strict";
  const base = window.EODX; if (!base) return;
  let api = null;
  const R = 8.314, D = () => api.DATA, S = () => api.S();
  const has = (id) => api.has(id) || S().cheat;
  const items = () => api.items;
  const n0 = base.subs.length;

  const st = { sol: "saltpeter", solT: 20, amt: 60, T1: 80, T2: 20, demoT2: 20, gas: "co2", gasT: 20, gasP: 1, ksp: 0, qa: -3, qb: -3, cc: -9,
    eq: "haber", eqT: 450, eqP: 200, eqN: null, eqPrev: null, eqLast: null, wa: 0, waC: -1, waCb: -9,
    kin: "h2o2", kT: 25, kC: 1, kCat: false, kPow: false, dec: "c14", decN: 1 };

  // ---------------- 共通 ----------------
  const fmt = (x) => (x === 0 ? "0" : Math.abs(x) >= 1000 ? x.toExponential(2) : Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : Math.abs(x) >= 1 ? x.toFixed(2) : Math.abs(x) >= 0.01 ? x.toFixed(3) : x.toExponential(2));
  function fmtTime(s) {
    if (!isFinite(s)) return "∞";
    if (s < 1e-3) return s.toExponential(2) + " 秒"; if (s < 60) return s.toPrecision(3) + " 秒"; if (s < 3600) return (s / 60).toPrecision(3) + " 分";
    if (s < 86400) return (s / 3600).toPrecision(3) + " 時間"; if (s < 3.156e7) return (s / 86400).toPrecision(3) + " 日"; if (s < 3.156e10) return (s / 3.156e7).toPrecision(3) + " 年";
    return (s / 3.156e7).toExponential(2) + " 年";
  }
  const interp = (xs, ys, x) => { if (x <= xs[0]) return ys[0]; for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[ys.length - 1]; };
  const grant = (id, cond) => { if (cond !== false && !api.has(id)) { api.grantConcept(id); api.save(); } };
  const lock = (msg) => `<p class="lead">🔒 ${msg}</p>`;
  function plot(series, o) {
    const W = 290, H = 160, L = 38, B = 28, Tp = 10, Rr = 10, pw = W - L - Rr, ph = H - B - Tp;
    const sx = (x) => L + (x - o.x0) / (o.x1 - o.x0) * pw, sy = (y) => Tp + ph - (y - o.y0) / (o.y1 - o.y0) * ph;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="molsvg dgraph"><g font-family="sans-serif" font-size="9" fill="currentColor" stroke="none">`;
    for (let i = 0; i <= 4; i++) { const xv = o.x0 + (o.x1 - o.x0) * i / 4, yv = o.y0 + (o.y1 - o.y0) * i / 4; s += `<text x="${sx(xv)}" y="${H - 14}" text-anchor="middle">${o.xf ? o.xf(xv) : fmt(xv)}</text><text x="${L - 4}" y="${sy(yv) + 3}" text-anchor="end">${o.yf ? o.yf(yv) : fmt(yv)}</text>`; }
    s += `<text x="${L + pw / 2}" y="${H - 2}" text-anchor="middle" fill="#8d93a8">${o.xl}</text><text x="8" y="${Tp + 8}" fill="#8d93a8">${o.yl}</text></g><g fill="none" stroke-width="1.4">`;
    s += `<rect x="${L}" y="${Tp}" width="${pw}" height="${ph}" stroke="#2d3348"/>`;
    series.forEach((se) => { s += `<polyline stroke="${se.color || "#e8a33d"}" ${se.dash ? 'stroke-dasharray="4 3"' : ""} points="${se.pts.map(([x, y]) => sx(x).toFixed(1) + "," + sy(Math.max(o.y0, Math.min(o.y1, y))).toFixed(1)).join(" ")}"/>`; });
    (o.marks || []).forEach((m) => { s += `<circle cx="${sx(m.x)}" cy="${sy(m.y)}" r="3.5" fill="${m.color || "#6ec1b0"}" stroke="none"/>`; });
    return s + `</g></svg>`;
  }
  const slider = (key, label, min, max, step, sub) => `<div class="drow"><span class="dl">${label}</span><input type="range" class="dr" data-din="${key}" data-dsub="${sub}" min="${min}" max="${max}" step="${step}" value="${st[key]}"><b class="dv" id="lab_${key}"></b></div>`;
  const select = (key, opts, sub) => `<select class="x-sel" data-dsel="${key}" data-dsub="${sub}">${opts.map(([v, t]) => `<option value="${v}" ${String(st[key]) === String(v) ? "selected" : ""}>${t}</option>`).join("")}</select>`;
  const setHTML = (id, h) => { const e = document.getElementById(id); if (e) e.innerHTML = h; };
  const setLab = (key, t) => { const e = document.getElementById("lab_" + key); if (e) e.textContent = t; };

  // ---------------- 溶解度 ----------------
  const solSubs = () => Object.keys(D().SOLUB).filter((id) => items()[id] && (api.has(id) || S().cheat));
  function solutionHTML() {
    if (!has("solubility")) return lock("温度計で測りながら、沈殿や結晶を観察すると、「溶解度」が見えてくる。");
    const ids = solSubs();
    if (!ids.length) return `<p class="lead">溶解度を調べる塩(食塩、硝石、硫酸銅など)を手に入れよう。</p>`;
    if (!ids.includes(st.sol)) st.sol = ids[0];
    const opts = ids.map((id) => [id, items()[id].emoji + " " + items()[id].name]);
    let h = `<p class="lead">水100gに溶ける量は、物質と温度で決まっている。</p>`;
    h += `<div class="entool"><div class="stt">溶解度曲線</div>${select("sol", opts, 0)}<div id="solPlot"></div>${slider("solT", "温度", 0, 100, 1, 0)}<div id="solOut" class="perf"></div></div>`;
    h += `<div class="entool"><div class="stt">溶かして、冷やして、結晶を取り出す(再結晶)</div><div class="mdesc">水100 g に、選んだ物質を溶かす。</div>` +
      slider("amt", "入れる量", 1, 250, 1, 0) + slider("T1", "溶かす温度", 0, 100, 1, 0) + slider("T2", "冷やす温度", 0, 100, 1, 0) + `<div id="recOut" class="perf"></div></div>`;
    if (D().SOLUB.saltpeter && D().SOLUB.salt) h += `<div class="entool"><div class="stt">硝酸カリウム50 g と食塩20 g の混合物を分ける</div><div class="mdesc">100℃の水100 g にすべて溶かし、冷やす。食塩は温度で溶解度がほとんど変わらないが、硝酸カリウムは大きく変わる。</div>` + slider("demoT2", "冷やす温度", 0, 80, 1, 0) + `<div id="demoOut" class="perf"></div></div>`;
    // 気体
    h += `<div class="entool"><div class="stt">気体の溶解度</div>${select("gas", Object.entries(D().GAS_SOL).map(([k, v]) => [k, v.name]), 0)}` + slider("gasT", "温度", 0, 60, 1, 0) + slider("gasP", "圧力 (気圧)", 1, 5, 0.5, 0) + `<div id="gasOut" class="perf"></div></div>`;
    // 溶解度積
    h += `<div class="entool"><div class="stt">溶けにくい塩: 溶解度積 Ksp</div>${select("ksp", D().KSP.map((k, i) => [i, k[0]]), 0)}` +
      slider("qa", "陽イオン濃度 (10^x mol/L)", -7, 0, 0.5, 0) + slider("qb", "陰イオン濃度 (10^x mol/L)", -7, 0, 0.5, 0) + slider("cc", "共通イオン(陰イオン)を加える (10^x)", -9, 0, 0.5, 0) + `<div id="kspOut" class="perf"></div></div>`;
    return h;
  }
  const solAt = (id, T) => interp(D().SOLUB_T, D().SOLUB[id].S, T);
  function updateSolution() {
    const ids = solSubs(); if (!ids.length || !has("solubility")) return;
    const sp = D().SOLUB[st.sol]; if (!sp) return;
    setLab("solT", st.solT + " ℃"); setLab("amt", st.amt + " g"); setLab("T1", st.T1 + " ℃"); setLab("T2", st.T2 + " ℃"); setLab("demoT2", st.demoT2 + " ℃");
    setLab("gasT", st.gasT + " ℃"); setLab("gasP", st.gasP + " 気圧"); setLab("qa", "10^" + st.qa); setLab("qb", "10^" + st.qb); setLab("cc", st.cc <= -9 ? "なし" : "10^" + st.cc);
    const ys = sp.S, ymax = Math.max(...ys) * 1.1;
    setHTML("solPlot", plot([{ pts: D().SOLUB_T.map((t, i) => [t, ys[i]]) }], { x0: 0, x1: 100, y0: 0, y1: ymax, xl: "温度 (℃)", yl: "g/100g水", marks: [{ x: st.solT, y: solAt(st.sol, st.solT) }] }));
    setHTML("solOut", `${items()[st.sol].name}は ${st.solT}℃で水100 gに <b>${fmt(solAt(st.sol, st.solT))} g</b> まで溶ける。<br><small>${sp.note}</small>`);
    const s1 = solAt(st.sol, st.T1), s2 = solAt(st.sol, st.T2), dis = Math.min(st.amt, s1), left = Math.max(0, st.amt - s1), cry = Math.max(0, dis - s2);
    setHTML("recOut", `${st.T1}℃の溶解度 ${fmt(s1)} g → ${left > 0 ? `<b>${fmt(left)} g が溶け残り</b>(飽和溶液)` : "すべて溶けた"}。<br>${st.T2}℃まで冷やすと、溶解度は ${fmt(s2)} g → 結晶 <b>${fmt(cry)} g</b> が析出(${st.amt ? (cry / st.amt * 100).toFixed(0) : 0}%を回収)。`);
    if (left > 0) grant("saturated_solution"); if (cry > 0.5) grant("recrystallization", has("saturated_solution"));
    if (D().SOLUB.saltpeter && D().SOLUB.salt) {
      const kc = Math.max(0, 50 - solAt("saltpeter", st.demoT2)), nc = Math.max(0, 20 - solAt("salt", st.demoT2));
      setHTML("demoOut", `硝酸カリウムの結晶 <b>${fmt(kc)} g</b>、食塩の結晶 <b>${fmt(nc)} g</b>。<br>${nc < 0.05 && kc > 0 ? "食塩は溶けたまま。<b>純粋な硝酸カリウム</b>が取り出せた。" : kc > 0 ? "食塩も混ざってしまった(冷やしすぎ)。" : "まだ結晶は出ない。もっと冷やそう。"}`);
      if (nc < 0.05 && kc > 5) grant("recrystallization", has("saturated_solution") || true);
    }
    const g = D().GAS_SOL[st.gas], sg = interp(D().GAS_SOL_T, g.S, st.gasT) * st.gasP;
    setHTML("gasOut", `${g.name}は ${st.gasT}℃・${st.gasP}気圧で水100 gに <b>${fmt(sg)} g</b> 溶ける。<br><small>${g.note}</small><br><small>圧力が2倍になると溶ける量も2倍(ヘンリーの法則)。温度を上げると、気体は逆に溶けにくくなる。</small>`);
    if (st.gasP !== 1) grant("henry_law");
    // Ksp
    const k = D().KSP[+st.ksp], [nm, Ksp, a, b, M, ci, ai] = k, c = st.cc <= -9 ? 0 : Math.pow(10, st.cc);
    const f = (s) => Math.pow(a * s, a) * Math.pow(b * s + c, b) - Ksp; let lo = 0, hi = 10; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    const s = (lo + hi) / 2, A = Math.pow(10, st.qa), Bc = Math.pow(10, st.qb), Q = Math.pow(A, a) * Math.pow(Bc, b);
    setHTML("kspOut", `${nm}: Ksp = ${Ksp.toExponential(1)}<br>${c ? `共通イオン ${c.toExponential(1)} mol/L があるとき` : "純水への"}溶解度 <b>${s.toExponential(2)} mol/L</b>(${(s * M).toExponential(2)} g/L)<br>` +
      `[${ci}]${a > 1 ? "^" + a : ""}[${ai}]${b > 1 ? "^" + b : ""} = ${Q.toExponential(1)} <b>${Q > Ksp ? "> Ksp → 沈殿する" : "< Ksp → 溶けたまま"}</b>`);
    if (st.qa !== -3 || st.qb !== -3) grant("ksp", has("ionization")); if (c > 0) grant("common_ion_effect", has("ksp"));
  }

  // ---------------- 化学平衡 ----------------
  const eqRx = () => D().EQUILIBRIA.find((e) => e.id === st.eq);
  function equilibrium(rx, TK, P, n) {
    const nu = rx.sp.map((s) => s[1]), dn = nu.reduce((p, q) => p + q, 0);
    const Tr = rx.Tref || 298.15, lnK = (rx.Kref ? Math.log(rx.Kref) : -rx.dG * 1000 / (R * Tr)) - (rx.dH * 1000 / R) * (1 / TK - 1 / Tr);
    let lo = -Infinity, hi = Infinity;
    nu.forEach((v, i) => { if (v > 0) lo = Math.max(lo, -n[i] / v); else hi = Math.min(hi, n[i] / -v); });
    if (!isFinite(lo)) lo = -1e3; if (!isFinite(hi)) hi = 1e3;
    const f = (x) => { let tot = 0; const ns = n.map((q, i) => { const v = Math.max(q + nu[i] * x, 1e-300); tot += v; return v; }); let s = dn * Math.log(P); nu.forEach((v, i) => { s += v * Math.log(ns[i] / tot); }); return s - lnK; };
    for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    const x = (lo + hi) / 2;
    return { x, ns: n.map((q, i) => Math.max(0, q + nu[i] * x)), K: Math.exp(lnK), dn };
  }
  function equilibriumHTML() {
    if (!has("reversible_reaction")) return lock("アンモニアの合成など、反応が途中で止まる現象を発見すると、「可逆反応」が分かる。");
    const rx = eqRx(); if (!st.eqN || st.eqN.length !== rx.sp.length) st.eqN = [...rx.n0];
    let h = `<p class="lead">反応は、行ったり来たりしながら、やがて釣り合う。条件を変えて、平衡がどう動くか見よう。</p>`;
    h += `<div class="entool">${select("eq", D().EQUILIBRIA.map((e) => [e.id, e.name]), 1)}<div class="eqline" style="font-size:16px">${rx.eq}</div>` +
      slider("eqT", "温度", rx.T[0] - 273, rx.T[1] - 273, 5, 1) + (rx.sp.some((s, i) => true) ? slider("eqP", "全圧 (気圧)", 1, 400, 1, 1) : "") +
      `${rx.sp.map((s, i) => `<div class="drow"><span class="dl">${s[0]} (初期量)</span><button class="mini" data-da="n-" data-i="${i}">−</button><b id="n_${i}" class="dv" style="flex:1;text-align:center"></b><button class="mini" data-da="n+" data-i="${i}">＋</button></div>`).join("")}` +
      `<div id="eqVis"></div><div id="eqOut" class="perf"></div></div>`;
    if (rx.note) h += `<p class="mdesc">${rx.note}</p>`;
    // 弱酸
    h += `<div class="entool"><div class="stt">弱酸・弱塩基の電離平衡</div>${select("wa", D().WEAK_ACIDS.map((w, i) => [i, w.name]), 1)}` +
      slider("waC", "濃度 (10^x mol/L)", -4, 0, 0.25, 1) + slider("waCb", "共通イオンを加える (10^x mol/L)", -9, 0, 0.5, 1) + `<div id="waOut" class="perf"></div></div>`;
    return h;
  }
  function updateEquilibrium() {
    if (!has("reversible_reaction")) return;
    const rx = eqRx(); if (!st.eqN || st.eqN.length !== rx.sp.length) st.eqN = [...rx.n0];
    const TK = st.eqT + 273.15; setLab("eqT", st.eqT + " ℃ (" + (st.eqT + 273).toFixed(0) + " K)"); setLab("eqP", st.eqP + " 気圧");
    st.eqN.forEach((v, i) => setHTML("n_" + i, v.toFixed(1) + " mol"));
    const r = equilibrium(rx, TK, st.eqP, st.eqN), prod = rx.sp.map((s, i) => (s[1] > 0 ? r.ns[i] : 0)).reduce((p, q) => p + q, 0);
    const tot = r.ns.reduce((p, q) => p + q, 0);
    const bars = rx.sp.map(([nm, nu], i) => `<div class="ebar"><span>${nm}</span><i style="width:${Math.min(100, r.ns[i] / Math.max(...r.ns, 1e-9) * 100)}%;background:${nu > 0 ? "#6ec1b0" : "#e8a33d"}"></i><b>${r.ns[i].toFixed(3)} mol</b></div>`).join("");
    let vis = "";
    if (rx.colors) { const frac = r.ns[0] / tot; vis = `<div class="tflask"><div class="liquid" style="background:${rx.colors[0]};opacity:${(0.15 + 0.85 * Math.min(1, frac * 1.6)).toFixed(2)};height:75%"></div></div><div class="cap" style="text-align:center">フラスコの色(褐色 = NO₂)</div>`; }
    setHTML("eqVis", bars + vis);
    let shift = "";
    if (st.eqPrev !== null && st.eqLast) {
      const d = prod - st.eqPrev, upT = st.eqT > (st.eqPrevT === undefined ? st.eqT : st.eqPrevT), upP = st.eqP > (st.eqPrevP === undefined ? st.eqP : st.eqPrevP);
      const why = { T: rx.dH < 0 ? (upT ? "温度を上げると、熱を吸収する向き(逆反応)に傾く" : "温度を下げると、熱を出す向き(正反応)に傾く") : (upT ? "温度を上げると、熱を吸収する向き(正反応)に傾く" : "温度を下げると、熱を出す向き(逆反応)に傾く"),
        P: r.dn === 0 ? "" : (upP ? "圧力を上げると、気体の分子数が減る向きに動く" : "圧力を下げると、気体の分子数が増える向きに動く"), n: "加えた物質を減らす向き(取り除いた物質を補う向き)に動く" }[st.eqLast];
      shift = Math.abs(d) < 1e-6 ? `<br>平衡は<b>動かない</b>。${st.eqLast === "P" && r.dn === 0 ? "(気体の分子数が変わらないので、圧力は無関係)" : ""}` : `<br>前の状態から、<b>${d > 0 ? "生成物側(→)" : "反応物側(←)"}</b>へ移動。<small>${why || ""}</small>`;
      grant("le_chatelier");
    }
    st.eqPrev = prod; st.eqPrevT = st.eqT; st.eqPrevP = st.eqP;
    const x0 = rx.sp.filter((s) => s[1] < 0).map((s) => s[0]);
    setHTML("eqOut", `K(${st.eqT}℃) = <b>${r.K.toExponential(2)}</b>${r.dn ? "(分圧の単位は気圧)" : ""}<br>生成物の量 <b>${prod.toFixed(3)} mol</b>${st.eqN.length ? "" : ""} (反応の進み ξ = ${r.x.toFixed(3)})${shift}`);
    grant("equilibrium"); grant("equilibrium_constant", has("stoichiometry"));
    // 弱酸
    const w = D().WEAK_ACIDS[+st.wa], C = Math.pow(10, st.waC), Cb = st.waCb <= -9 ? 0 : Math.pow(10, st.waCb);
    setLab("waC", "10^" + st.waC + " = " + C.toExponential(1) + " mol/L"); setLab("waCb", st.waCb <= -9 ? "なし" : "10^" + st.waCb);
    const x = (-(Cb + w.Ka) + Math.sqrt((Cb + w.Ka) ** 2 + 4 * w.Ka * C)) / 2, pH = w.base ? 14 + Math.log10(x) : -Math.log10(x), alpha = x / C;
    setHTML("waOut", `Ka = ${w.Ka.toExponential(1)}　${w.base ? "[OH⁻]" : "[H⁺]"} = ${x.toExponential(2)} mol/L<br>pH = <b>${pH.toFixed(2)}</b>　電離度 α = <b>${(alpha * 100).toFixed(2)}%</b><br><small>${Cb ? "共通イオン(" + w.salt + ")を加えると、電離が抑えられ、pHの変化が小さい(緩衝作用)。" : "薄めるほど電離度は大きくなる(オストワルトの希釈律)。"}</small>`);
    grant("ionization_degree", has("ionization"));
  }

  // ---------------- 反応速度 ----------------
  const kRx = () => D().KINETICS.find((k) => k.id === st.kin);
  function kRate(rx, TC, cat, pow) {
    const TK = TC + 273.15, Ea = (cat && rx.catalyst ? rx.catalyst.Ea : rx.Ea) * 1000;
    const A = rx.k298 * Math.exp(rx.Ea * 1000 / (R * 298.15)); // 頻度因子(触媒でも変わらない)
    let k = A * Math.exp(-Ea / (R * TK));
    if (pow && rx.powder) k *= rx.powder;
    return k;
  }
  function kineticsHTML() {
    if (!has("reaction_rate")) return lock("熱の出る反応を、温度計で観察すると、「反応速度」の考え方が見えてくる。");
    const rx = kRx(); if (st.kT < rx.T[0] || st.kT > rx.T[1]) st.kT = Math.max(rx.T[0], Math.min(rx.T[1], st.kT));
    let h = `<p class="lead">反応には、一瞬のものも、何年もかかるものもある。温度、濃度、触媒、表面積で、速さはどう変わるか。</p>`;
    h += `<div class="entool">${select("kin", D().KINETICS.map((k) => [k.id, k.name]), 2)}` + slider("kT", "温度", rx.T[0], rx.T[1], 1, 2) + slider("kC", "初期濃度 (mol/L)", 0.1, 2, 0.1, 2);
    h += `<div class="drow">${rx.catalyst ? `<label class="chk"><input type="checkbox" data-dchk="kCat" data-dsub="2" ${st.kCat ? "checked" : ""}> 触媒を加える(${rx.catalyst.name})</label>` : ""}${rx.powder ? `<label class="chk"><input type="checkbox" data-dchk="kPow" data-dsub="2" ${st.kPow ? "checked" : ""}> 粉末にする(表面積 ×${rx.powder})</label>` : ""}</div>`;
    h += `<div id="kinPlot"></div><div id="kinOut" class="perf"></div></div><p class="mdesc">${rx.note}</p>`;
    if (has("radioactivity")) h += `<div class="entool"><div class="stt">放射性元素の崩壊(半減期)</div>${select("dec", D().DECAY.map((d) => [d.id, d.name]), 2)}` + slider("decN", "経過時間(半減期の何倍か)", 0, 6, 0.1, 2) + `<div id="decPlot"></div><div id="decOut" class="perf"></div></div>`;
    return h;
  }
  function updateKinetics() {
    if (!has("reaction_rate")) return;
    const rx = kRx(); setLab("kT", st.kT + " ℃"); setLab("kC", st.kC.toFixed(1) + " mol/L"); setLab("decN", st.decN.toFixed(1) + " 倍");
    const k = kRate(rx, st.kT, st.kCat, st.kPow), C0 = st.kC;
    const half = rx.order === 1 ? Math.LN2 / k : 1 / (k * C0), t90 = rx.order === 1 ? Math.LN10 / k : 9 / (k * C0);
    const cf = (t) => (rx.order === 1 ? C0 * Math.exp(-k * t) : C0 / (1 + k * C0 * t));
    const tmax = half * 4, pts = []; for (let i = 0; i <= 60; i++) { const t = tmax * i / 60; pts.push([t, cf(t)]); }
    const unit = tmax < 120 ? [1, "秒"] : tmax < 7200 ? [60, "分"] : tmax < 172800 ? [3600, "時間"] : tmax < 6e7 ? [86400, "日"] : [3.156e7, "年"];
    setHTML("kinPlot", plot([{ pts: pts.map(([t, c]) => [t / unit[0], c]) }], { x0: 0, x1: tmax / unit[0], y0: 0, y1: C0 * 1.05, xl: "時間 (" + unit[1] + ")", yl: "濃度 mol/L", marks: [{ x: half / unit[0], y: C0 / 2 }] }));
    const k10 = kRate(rx, Math.min(rx.T[1] + 10, st.kT + 10), st.kCat, st.kPow) / k;
    setHTML("kinOut", `速度定数 k = <b>${k.toExponential(2)}</b> ${rx.order === 1 ? "s⁻¹" : "L/(mol·s)"}(${rx.order}次反応)<br>半減期 <b>${fmtTime(half)}</b>　90%反応するまで <b>${fmtTime(t90)}</b><br>初期の速さ v = k·C${rx.order === 2 ? "²" : ""} = ${(k * Math.pow(C0, rx.order)).toExponential(2)} mol/(L·s)<br><small>温度を10℃上げると、速さは約 ${k10.toFixed(1)} 倍</small>`);
    const d = D().DECAY.find((x) => x.id === st.dec);
    if (d && document.getElementById("decPlot")) {
      const frac = Math.pow(0.5, st.decN), dp = []; for (let i = 0; i <= 60; i++) { const n = 6 * i / 60; dp.push([n, Math.pow(0.5, n) * 100]); }
      setHTML("decPlot", plot([{ pts: dp }], { x0: 0, x1: 6, y0: 0, y1: 105, xl: "半減期の数", yl: "残り %", marks: [{ x: st.decN, y: frac * 100 }] }));
      setHTML("decOut", `${d.name}の半減期は <b>${fmtTime(d.t12)}</b>。<br>${st.decN.toFixed(1)}倍(${fmtTime(d.t12 * st.decN)})たつと、<b>${(frac * 100).toFixed(1)}%</b>が残る。<br><small>放射性崩壊は、温度・圧力・化学結合によらず、半減期がいつも一定。</small>`);
      grant("half_life", has("radioactivity"));
    }
  }

  // ---------------- 公開 ----------------
  const renders = [solutionHTML, equilibriumHTML, kineticsHTML];
  const updates = [updateSolution, updateEquilibrium, updateKinetics];
  function after(i) { updates[i](); }
  function attach() {
    document.addEventListener("input", (e) => {
      const t = e.target; if (!t || !t.dataset || t.dataset.din === undefined) return;
      const key = t.dataset.din, sub = +t.dataset.dsub, v = parseFloat(t.value);
      if (sub === 1 && (key === "eqT" || key === "eqP")) st.eqLast = key === "eqT" ? "T" : "P";
      st[key] = v;
      if (sub === 2) { if (key === "kT") grant("arrhenius", has("activation_energy")); if (key === "kC") grant("rate_law", has("concentration")); }
      updates[sub]();
    });
    document.addEventListener("change", (e) => {
      const t = e.target; if (!t || !t.dataset) return;
      if (t.dataset.dsel !== undefined) { const key = t.dataset.dsel, sub = +t.dataset.dsub; st[key] = isNaN(+t.value) || key === "sol" || key === "gas" || key === "kin" || key === "dec" || key === "eq" ? t.value : +t.value; if (key === "eq") { st.eqN = null; st.eqPrev = null; st.eqLast = null; const rx = eqRx(); st.eqT = Math.round(((rx.T[0] + rx.T[1]) / 2) - 273); st.eqP = rx.id === "no2" || rx.id === "hi" ? 1 : st.eqP; api.render(); return; } if (key === "kin") { const rx = kRx(); st.kT = Math.max(rx.T[0], Math.min(rx.T[1], st.kT)); st.kCat = false; st.kPow = false; api.render(); return; } if (key === "dec" || key === "gas" || key === "sol" || key === "ksp" || key === "wa") { updates[sub]();  return; } updates[sub](); }
      if (t.dataset.dchk) { st[t.dataset.dchk] = t.checked; if (t.dataset.dchk === "kPow") grant("collision_theory"); updates[+t.dataset.dsub](); }
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-da]"); if (!b) return;
      const a = b.dataset.da, i = +b.dataset.i;
      if (a === "n+" || a === "n-") { st.eqN[i] = Math.max(0, +(st.eqN[i] + (a === "n+" ? 0.5 : -0.5)).toFixed(1)); st.eqLast = "n"; updateEquilibrium(); }
    });
  }
  window.EODX = {
    subs: base.subs.concat(["溶解度", "平衡", "反応速度"]),
    init(a) { base.init(a); api = a; attach(); },
    render(i) { return i < n0 ? base.render(i) : renders[i - n0](); },
    after(i) { if (i < n0) base.after(i); else after(i - n0); },
    onRecipe: base.onRecipe,
  };
})();
