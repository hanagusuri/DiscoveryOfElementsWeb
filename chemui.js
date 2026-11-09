// 化学タブの拡張UI: 反応式(酸化還元・エネルギー)・イオン・分析試薬・滴定・モル計算
(function () {
  "use strict";
  let api = null;
  const D = () => api.DATA;
  const S = () => api.S();
  const has = (id) => api.has(id) || S().cheat;
  const owned = (id) => api.has(id);
  const spi = (id) => D().speciesInfo(id);
  const GAS = new Set(["hydrogen", "oxygen", "nitrogen", "chlorine", "co2", "co", "so2", "h2s", "ammonia", "methane", "ethylene", "ethane", "acetylene"]);
  const BASE_C = 0.1, VA = 20.0; // 滴定: NaOH 0.100 mol/L で、未知の塩酸 20.0 mL を滴定する

  let anaSample = null, anaReagent = null, anaLog = [], titrInd = "php", calcSel = null, calcVal = "", calcUnit = "g", quizQ = null;

  // ---------------- 反応式の計算 ----------------
  const name = (id) => { const sp = spi(id); return (sp && sp.name) || (api.items[id] ? api.items[id].name : id); };
  const formula = (id) => { const sp = spi(id); return sp ? sp.formula : id; };
  const side = (s) => s.map(([k, id]) => (k > 1 ? k : "") + formula(id)).join(" + ");
  const eqText = (eq) => side(eq.L) + " → " + side(eq.R);
  function eqDH(eq) {
    if (eq.dh !== undefined) return eq.dh;
    let t = 0; const HF = D().HF;
    for (const [k, id] of eq.R) { if (HF[id] === undefined) return null; t += k * HF[id]; }
    for (const [k, id] of eq.L) { if (HF[id] === undefined) return null; t -= k * HF[id]; }
    return +t.toFixed(1);
  }
  function sideLevel(s) { const HF = D().HF; let t = 0; for (const [k, id] of s) { if (HF[id] === undefined) return null; t += k * HF[id]; } return t; }
  // 酸化数の変化・酸化剤/還元剤・電子の数
  function redoxOf(eq) {
    const lists = (side_) => { const c = {}; side_.forEach(([k, id]) => { const sp = spi(id); Object.entries(sp.ox).forEach(([el, arr]) => { (c[el] = c[el] || []); for (let i = 0; i < k; i++) c[el].push(...arr); }); }); return c; };
    const L = lists(eq.L), R = lists(eq.R), changes = [];
    let electrons = 0;
    Object.keys(L).forEach((el) => {
      const a = [...L[el]].sort((x, y) => x - y), b = [...(R[el] || [])].sort((x, y) => x - y);
      const ua = [...new Set(a)], ub = [...new Set(b)];
      if (ua.join() === ub.join()) return;
      changes.push({ el, from: ua, to: ub });
      for (let i = 0; i < Math.min(a.length, b.length); i++) if (b[i] > a[i]) electrons += b[i] - a[i];
    });
    const avg = (arr) => arr.reduce((p, q) => p + q, 0) / arr.length;
    const oxidizers = new Set(), reducers = new Set();
    changes.forEach((ch) => {
      const rAvg = avg(R[ch.el]);
      eq.L.forEach(([, id]) => {
        const arr = spi(id).ox[ch.el]; if (!arr) return;
        const m = avg(arr);
        if (m > rAvg + 1e-6) oxidizers.add(id); else if (m < rAvg - 1e-6) reducers.add(id);
        else if (ch.to.some((v) => v > m) && ch.to.some((v) => v < m)) { oxidizers.add(id); reducers.add(id); } // 不均化
      });
    });
    return { changes, electrons, redox: changes.length > 0 && electrons > 0, oxidizers: [...oxidizers], reducers: [...reducers] };
  }
  const oxTxt = (arr) => arr.map((v) => (v > 0 ? "+" + v : v)).join($t("・"));

  // エネルギー図(模式)
  function energySVG(eq) {
    const eL = sideLevel(eq.L), eR = sideLevel(eq.R);
    if (eL === null || eR === null) return "";
    const dh = eq.dh !== undefined ? eq.dh : eR - eL;
    const sc = 50 / Math.max(Math.abs(dh), 60), d = Math.max(-50, Math.min(50, -dh * sc)); // d>0: 生成物のほうが低い
    const yL = 78 - d / 2, yR = 78 + d / 2;
    const peak = Math.min(yL, yR) - 36, cat = Math.min(yL, yR) - 18;
    const path = (p) => `M30 ${yL} L70 ${yL} C95 ${yL} 95 ${p} 120 ${p} C145 ${p} 145 ${yR} 170 ${yR} L210 ${yR}`;
    const col = dh < 0 ? "#e8923d" : "#7db8e8";
    return `<svg viewBox="0 0 240 130" class="molsvg esvg"><g font-family="sans-serif" font-size="9" fill="currentColor">` +
      `<line x1="26" y1="${yL}" x2="74" y2="${yL}" stroke="currentColor" stroke-width="2.4"/><line x1="166" y1="${yR}" x2="214" y2="${yR}" stroke="currentColor" stroke-width="2.4"/>` +
      `<path d="${path(peak)}" fill="none" stroke="${col}" stroke-width="1.8"/>` + (eq.cat ? $t(`<path d="{0}" fill="none" stroke="#6ec1b0" stroke-width="1.5" stroke-dasharray="3 3"/><text x="124" y="{1}" fill="#6ec1b0">触媒あり</text>`, [path(cat), cat - 4]) : "") +
      $t(`<text x="50" y="{0}" text-anchor="middle">反応物</text><text x="190" y="{1}" text-anchor="middle">生成物</text><text x="120" y="{2}" text-anchor="middle">活性化エネルギー(模式)</text>`, [yL + 14, yR + 14, peak - 5]) +
      `<line x1="222" y1="${yL}" x2="222" y2="${yR}" stroke="${col}" stroke-width="1.6"/><text x="236" y="${(yL + yR) / 2 + 3}" text-anchor="end" fill="${col}" font-size="9">ΔH</text></g></svg>`;
  }

  // ---------------- 反応式タブ ----------------
  function eqVisible(eq) {
    if (S().cheat) return true;
    if (eq.rec) return !!(S().eqSeen && S().eqSeen[eq.id]);
    return eq.need ? owned(eq.need) : false;
  }
  function reactionsHTML() {
    const eqs = D().EQUATIONS.filter(eqVisible);
    let html = $t(`<p class="lead">実験で起きた反応を、化学反応式として整理しよう。係数、電子の移動、熱が見えてくる。</p>`);
    if (!eqs.length) return html + $t(`<p class="lead">まだ反応式はない。実験で反応を起こすと、ここに記録される。</p>`);
    const sp = (id) => spi(id);
    eqs.forEach((eq) => {
      html += `<div class="eqcard"><h4>${eq.name}</h4><div class="kinds">${eq.tags.map((x) => `<span class="kind">${x}</span>`).join("")}</div>`;
      html += `<div class="eqline">${eqText(eq)}</div>`;
      // モル・質量・体積
      if (has("stoichiometry") || has("mole")) {
        const all = [...eq.L, ...eq.R];
        html += $t(`<div class="eqrow"><b>物質量の比</b> {0}  →  {1} (mol)</div>`, [eq.L.map(([k]) => k).join(" : "), eq.R.map(([k]) => k).join(" : ")]);
        if (has("molar_mass")) {
          const m = (s) => s.map(([k, id]) => (k * sp(id).mass).toFixed(1) + " g").join(" + ");
          const tl = eq.L.reduce((p, [k, id]) => p + k * sp(id).mass, 0), tr = eq.R.reduce((p, [k, id]) => p + k * sp(id).mass, 0);
          html += $t(`<div class="eqrow"><b>質量</b> {0} → {1}<br><small>{2} g → {3} g{4}</small></div>`, [m(eq.L), m(eq.R), tl.toFixed(1), tr.toFixed(1), has("conservation") ? $t("(質量保存)") : ""]);
        }
        if (has("molar_volume")) {
          const v = (s) => s.map(([k, id]) => (GAS.has(id) ? (k * 22.4).toFixed(1) + " L" : "—")).join(" + ");
          html += $t(`<div class="eqrow"><b>気体の体積(0℃・1気圧)</b> {0} → {1}</div>`, [v(eq.L), v(eq.R)]);
        }
      } else html += $t(`<div class="eqrow dim">🔒 係数の意味は「物質量(モル)」の概念で分かる</div>`);
      // 酸化還元
      const rx = redoxOf(eq);
      if (has("oxidation_number")) {
        if (rx.changes.length) {
          html += `<div class="eqrow"><b>${has("redox") ? $t("酸化還元反応") : $t("酸化数の変化")}</b>: ` + rx.changes.map((c) => `${c.el}(${oxTxt(c.from)} → ${oxTxt(c.to)})`).join($t("、")) + (has("electron_transfer") ? $t(`<br><small>電子 {0} 個が移動</small>`, [rx.electrons]) : "") + `</div>`;
          if (has("oxidizing_agent")) html += $t(`<div class="eqrow"><b>酸化剤</b> {0}　<b>還元剤</b> {1}</div>`, [rx.oxidizers.map(name).join($t("・")) || "—", rx.reducers.map(name).join($t("・")) || "—"]);
        } else html += $t(`<div class="eqrow"><b>酸化数</b>: 変化なし(酸化還元反応ではない)</div>`);
      } else html += $t(`<div class="eqrow dim">🔒 電子の移動は「酸化数」の概念で分かる</div>`);
      // エネルギー
      const dh = eqDH(eq);
      if (dh !== null) {
        if (has("enthalpy")) html += $t(`<div class="eqrow"><b>反応熱</b> ΔH = <b>{0}{1} kJ</b>({2}){3}</div>`, [dh > 0 ? "+" : "", dh, dh < 0 ? $t("発熱") : $t("吸熱"), eq.aq ? $t("(水溶液)") : ""]) + energySVG(eq);
        else html += $t(`<div class="eqrow"><b>熱</b> {0}</div>`, [dh < 0 ? $t("熱が出る(発熱反応)") : $t("熱を吸う(吸熱反応)")]);
        if (has("activation_energy") && eq.cat) html += $t(`<div class="eqrow"><small>触媒が活性化エネルギーの山を低くして、反応を速める</small></div>`);
      }
      html += `</div>`;
    });
    if (has("hess_law")) html += $t(`<p class="lead">💡 ヘスの法則: 経路が違っても、反応熱の合計は同じ。生成熱(ΔfH)から、実験できない反応の熱も計算できる。</p>`);
    return html;
  }

  // ---------------- イオンタブ ----------------
  function ionsHTML() {
    if (!has("ion")) return $t(`<p class="lead">🔒 電気分解の実験を通して、物質が電気を帯びた粒子(イオン)に分かれることが分かる。</p>`);
    let html = $t(`<p class="lead">イオンは、電気を帯びた原子や原子団。水に溶けるとイオンに分かれる(電離)ものを電解質という。</p>`);
    const MV = api.MolViz, MOLS = D().MOLS;
    const lines = [];
    Object.keys(MOLS).forEach((id) => {
      if (!owned(id) && !S().cheat) return;
      const o = MOLS[id][1];
      if (o.kind === "ionic") {
        const m = MV.parse(MOLS[id][0]), cs = MV.components(m);
        lines.push(`<div class="ionrow"><b>${api.items[id].emoji} ${api.items[id].name}</b> <span>${o.formula || MV.formulaOf(m)} → ${cs.map((c) => (c.n > 1 ? c.n : "") + c.label).join(" + ")}</span></div>`);
      } else if (D().IONIZE[id]) lines.push(`<div class="ionrow"><b>${api.items[id].emoji} ${api.items[id].name}</b> <span>${D().IONIZE[id].eq}</span><small>${D().IONIZE[id].power}</small></div>`);
    });
    html += $t(`<h4>電離(水溶液中で)</h4>`) + (has("ionization") ? (lines.join("") || $t(`<p class="mdesc">電解質を発見すると、電離の様子が出る。</p>`)) : $t(`<div class="perf">🔒 「電離」の考え方を得ると、電離式が見える</div>`));
    // イオンの表
    html += $t(`<h4>イオンの色と炎色反応</h4><table class="btable"><tr><th>イオン</th><th>名前</th><th>水溶液の色</th><th>炎色</th></tr>`) +
      Object.entries(D().ION_INFO).map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v[0]}</td><td>${v[1]}</td><td>${has("flame_test") ? v[2] || "—" : "?"}</td></tr>`).join("") + `</table>`;
    // 沈殿の表
    const SOL = D().SOLUBILITY;
    html += $t(`<h4>沈殿の表(イオンの組み合わせ)</h4>`) + (has("precipitation") ?
      `<table class="btable soltable"><tr><th></th>${SOL.cols.map((c) => `<th>${c}</th>`).join("")}</tr>` +
      SOL.rows.map(([cat, row]) => `<tr><td><b>${cat}</b></td>${row.map((x) => `<td class="${x === "s" ? "sol" : x === "微溶" ? "part" : "ppt"}">${x === "s" ? $t("溶ける") : $t(x)}</td>`).join("")}</tr>`).join("") + `</table>` : $t(`<div class="perf">🔒 沈殿反応の実験で、表が見えてくる</div>`));
    return html;
  }

  // ---------------- 分析タブ ----------------
  const samplesOwned = () => Object.keys(D().PROPS).filter((id) => api.items[id] && (owned(id) || S().cheat));
  const reagentsOwned = () => Object.keys(D().REAGENTS).filter((id) => api.items[id] && (owned(id) || S().cheat));
  function testResult(sid, rid) {
    const P = D().PROPS[sid] || {}, kind = D().REAGENTS[rid];
    const ans = P.an || [], cats = P.cat || [];
    const R = { text: $t("変化は見られなかった。"), color: null, grants: [] };
    const has_ = (arr, x) => arr.includes(x);
    switch (kind) {
      case "litmus":
        if (P.ph === undefined) R.text = $t("固体なので、色は変わらなかった(溶かして調べよう)。");
        else if (P.ph < 5) { R.text = $t("リトマスは赤くなった。→ 酸性"); R.color = "#e05a5a"; } else if (P.ph > 8) { R.text = $t("リトマスは青くなった。→ アルカリ性"); R.color = "#4a7ae8"; } else { R.text = $t("リトマスは紫のまま。→ ほぼ中性"); R.color = "#9a6ad0"; }
        R.grants.push("indicator"); break;
      case "php":
        if (P.ph === undefined) R.text = $t("溶けていないので、色は変わらなかった。");
        else if (P.ph > 8.2) { R.text = $t("鮮やかな赤紫色になった。→ アルカリ性(pH 8.2以上)"); R.color = "#e0409a"; } else { R.text = $t("無色のまま。→ 酸性か中性(pH 8.2未満)"); R.color = "#cfd3dc"; }
        R.grants.push("indicator"); break;
      case "ph":
        R.text = P.ph === undefined ? $t("溶液でないので、測れない。") : `pH = ${P.ph}(${P.ph < 6.5 ? $t("酸性") : P.ph > 7.5 ? $t("アルカリ性") : $t("中性")})`; if (P.ph !== undefined) R.grants.push("ph"); break;
      case "ag":
        if (has_(ans, "Cl⁻")) { R.text = $t("白色の沈殿ができた。→ 塩化物イオン Cl⁻ が含まれる(AgCl)"); R.color = "#f0f0f0"; R.grants.push("precipitation"); }
        else if (has_(ans, "CO₃²⁻")) { R.text = $t("白〜淡黄色の沈殿ができた。→ 炭酸イオン(Ag₂CO₃)"); R.color = "#f0e8c0"; R.grants.push("precipitation"); }
        else if (has_(ans, "S²⁻")) { R.text = $t("黒色の沈殿ができた。→ 硫化物イオン(Ag₂S)"); R.color = "#303030"; R.grants.push("precipitation"); }
        else if (has_(ans, "OH⁻")) { R.text = $t("褐色の沈殿ができた。→ Ag₂O"); R.color = "#8a5a3a"; R.grants.push("precipitation"); }
        else if (has_(ans, "SO₄²⁻")) R.text = $t("わずかに白く濁った(硫酸銀はやや溶けにくい)。");
        break;
      case "ba":
        if (has_(ans, "SO₄²⁻")) { R.text = $t("白色の沈殿ができた。酸を加えても溶けない。→ 硫酸イオン SO₄²⁻(BaSO₄)"); R.color = "#f0f0f0"; R.grants.push("precipitation"); }
        else if (has_(ans, "CO₃²⁻")) { R.text = $t("白色の沈殿ができたが、酸を加えると溶けて泡が出た。→ 炭酸イオン CO₃²⁻"); R.color = "#f0f0f0"; R.grants.push("precipitation"); }
        break;
      case "limewater":
        if (P.co2) { R.text = $t("石灰水が白く濁った。→ 二酸化炭素(CaCO₃の沈殿)"); R.color = "#f0f0f0"; R.grants.push("precipitation"); }
        break;
      case "alkali": {
        const r = [["Cu²⁺", $t("青白色の沈殿 → Cu(OH)₂"), "#6a9aff"], ["Fe²⁺", $t("緑白色の沈殿 → Fe(OH)₂(空気中で赤褐色に変わる)"), "#a8c8a0"], ["Fe³⁺", $t("赤褐色の沈殿 → Fe(OH)₃"), "#a04a2a"],
          ["Zn²⁺", $t("白色の沈殿 → Zn(OH)₂(過剰に加えると溶ける)"), "#f0f0f0"], ["Ag⁺", $t("褐色の沈殿 → Ag₂O"), "#8a5a3a"], ["Pb²⁺", $t("白色の沈殿 → Pb(OH)₂"), "#f0f0f0"], ["Mg²⁺", $t("白色の沈殿 → Mg(OH)₂"), "#f0f0f0"], ["Al³⁺", $t("白色の沈殿(過剰に加えると溶ける)"), "#f0f0f0"]];
        const hit = r.find(([ion]) => has_(cats, ion));
        if (hit) { R.text = hit[1]; R.color = hit[2]; R.grants.push("precipitation"); }
        else if (has_(cats, "NH₄⁺")) R.text = $t("加熱するとアンモニアの刺激臭がした。→ アンモニウムイオン NH₄⁺");
        else if (P.acid) { R.text = $t("中和が起こった。熱が出て、塩と水ができる。"); R.grants.push("neutralization"); R.neutral = true; }
        break; }
      case "pb":
        if (has_(ans, "S²⁻")) { R.text = $t("黒色の沈殿ができた。→ 硫化物イオン(PbS)。腐った卵の臭いの気体にも反応する"); R.color = "#303030"; R.grants.push("precipitation"); }
        else if (has_(ans, "Cl⁻") || has_(ans, "SO₄²⁻") || has_(ans, "CO₃²⁻")) { R.text = $t("白色の沈殿ができた。(PbCl₂/PbSO₄/PbCO₃のどれか)"); R.color = "#f0f0f0"; R.grants.push("precipitation"); }
        break;
      case "mno4":
        if (P.red) R.text = $t("赤紫色が消えた。→ 還元剤(MnO₄⁻が還元されて、ほぼ無色のMn²⁺になった)"); else R.text = $t("赤紫色のまま。→ 還元剤ではない");
        R.color = P.red ? "#cfd3dc" : "#a03ab0"; break;
      case "h2o2":
        if (sid === "vitriol") { R.text = $t("淡緑色が黄褐色に変わった。Fe²⁺ が酸化されて Fe³⁺ になった。"); R.color = "#c8a040"; }
        else if (sid === "potassium_permanganate") R.text = $t("赤紫色が消え、酸素の泡が出た。過酸化水素が還元剤として働いた。");
        else if (P.red) R.text = $t("還元剤として反応した。");
        break;
      case "acid": {
        if (P.ph !== undefined && P.ph > 10 && !P.acid) { R.text = has_(ans, "CO₃²⁻") ? $t("盛んに泡(CO₂)が出ながら、中和が起こった。熱も出た。") : $t("中和が起こり、熱が出た。酸の H⁺ とアルカリの OH⁻ が結びついて水になった。"); R.grants.push("neutralization"); R.neutral = true; }
        else if (has_(ans, "CO₃²⁻")) { R.text = $t("盛んに泡が出た。→ 炭酸塩(CO₂が発生)"); R.color = "#cfe8ff"; }
        else if (has_(ans, "S²⁻") && P.solid) { R.text = $t("腐った卵の臭いの気体が出た。→ 硫化物(H₂S)"); R.color = "#e8d34a"; }
        else if (P.metal && ["zinc", "iron", "magnesium", "aluminium", "calcium", "sodium", "potassium", "lithium"].includes(sid)) { R.text = $t("水素の泡を出して溶けた。→ 酸より反応しやすい金属"); R.color = "#cfe8ff"; }
        else if (P.metal) R.text = $t("ほとんど溶けなかった。→ 酸より反応しにくい金属(銅など)");
        break; }
      case "flame": {
        const hit = cats.find((c) => D().FLAME[c]);
        if (hit) { R.text = $t(`炎が{0}に染まった。→ {1}`, [D().FLAME[hit], hit]); R.color = flameCol(D().FLAME[hit]); R.grants.push("flame_test"); }
        else R.text = $t("炎の色は変わらなかった。");
        break; }
    }
    return R;
  }
  const flameCol = (n) => ({ "黄色": "#f0d020", "赤紫色": "#c060d0", "赤色": "#e03030", "橙赤色": "#e8803a", "深赤色": "#c02040", "黄緑色": "#a8d838", "青緑色": "#30c8b0" })[n] || "#cfd3dc";
  function runTest() {
    const sid = anaSample, rid = anaReagent; if (!sid || !rid) return;
    const r = testResult(sid, rid);
    let gain = 0; r.grants.forEach((c) => { gain += api.grantConcept(c); });
    if (r.neutral) { const S_ = S(); S_.eqSeen = S_.eqSeen || {}; S_.eqSeen.neutral = 1; }
    anaLog.unshift({ s: sid, r: rid, text: r.text, color: r.color });
    anaLog = anaLog.slice(0, 6);
    api.save(); api.render();
  }
  function analysisHTML() {
    const ss = samplesOwned(), rs = reagentsOwned();
    let html = $t(`<p class="lead">試料に試薬を加えて、中に何が入っているかを調べよう。</p>`);
    if (!rs.length) html += $t(`<p class="mdesc">試薬がまだない。リトマス、硝酸銀、塩化バリウム、過マンガン酸カリウムなどを作ろう。</p>`);
    else {
      if (!anaSample || !ss.includes(anaSample)) anaSample = ss[0];
      if (!anaReagent || !rs.includes(anaReagent)) anaReagent = rs[0];
      const opt = (list, sel) => list.map((id) => `<option value="${id}" ${id === sel ? "selected" : ""}>${api.items[id].emoji} ${api.items[id].name}</option>`).join("");
      html += $t(`<div class="entool"><div class="row"><span class="lbl">試料</span><select class="x-sel" data-xsel="sample">{0}</select></div>`, [opt(ss, anaSample)]) +
        $t(`<div class="row" style="margin-top:6px"><span class="lbl">試薬</span><select class="x-sel" data-xsel="reagent">{0}</select></div>`, [opt(rs, anaReagent)]) +
        $t(`<div style="margin-top:8px"><button class="primary" data-xa="test">加えてみる</button></div></div>`);
      if (anaLog.length) html += `<div class="anlog">` + anaLog.map((l) => `<div class="anrow"><span class="dot" style="background:${l.color || "var(--line)"}"></span><div><b>${api.items[l.s].name} + ${api.items[l.r].name}</b><br>${l.text}</div></div>`).join("") + `</div>`;
    }
    html += titrationHTML();
    return html;
  }

  // ---------------- 滴定 ----------------
  function phNow(t) { // 強酸を強塩基で滴定
    const nA = t.c * VA, nB = BASE_C * t.added, V = VA + t.added;
    if (Math.abs(nA - nB) < 1e-9) return 7;
    return nA > nB ? -Math.log10((nA - nB) / V) : 14 + Math.log10((nB - nA) / V);
  }
  function indColor(ind, ph) {
    if (ind === "php") return ph > 8.2 ? "#e0409a" : "#e8ecf4";
    return ph < 5 ? "#e05a5a" : ph > 8 ? "#4a7ae8" : "#9a6ad0";
  }
  function titrationHTML() {
    let html = $t(`<h4>滴定: 塩酸の濃度を求めよう</h4>`);
    const ok = owned("burette") && owned("naoh") && owned("hcl") && (owned("litmus") || owned("phenolphthalein"));
    if (!has("concentration") && !S().cheat) return html + $t(`<div class="perf">🔒 「モル濃度」の考え方を得ると挑戦できる(ビュレットと指示薬も必要)</div>`);
    if (!ok && !S().cheat) return html + $t(`<div class="perf">🔒 ビュレット、塩酸、水酸化ナトリウム、指示薬(リトマスかフェノールフタレイン)が必要</div>`);
    const t = S().titr;
    if (!t || t.done) {
      return html + $t(`<p class="mdesc">濃度が分からない塩酸 {0} mL に、0.100 mol/L の水酸化ナトリウム水溶液を滴下して、ちょうど中和する体積を探す。</p><button class="primary" data-xa="titstart">新しい滴定を始める</button>{1}`, [VA.toFixed(1), t && t.done ? $t(`<p class="mdesc">前回の答え: {0} mol/L</p>`, [t.c.toFixed(3)]) : ""]);
    }
    const ph = phNow(t), col = indColor(titrInd, ph);
    html += `<div class="tflask"><div class="liquid" style="background:${col}"></div></div>` +
      $t(`<div class="titrow"><span>加えたNaOH: <b>{0} mL</b></span>{1}</div>`, [t.added.toFixed(2), has("ph") || owned("ph_meter") ? `<span>pH ${ph.toFixed(1)}</span>` : ""]) +
      $t(`<div class="titbtns"><button data-xa="tit" data-v="1">+1 mL</button><button data-xa="tit" data-v="0.1">+0.1 mL</button><button data-xa="tit" data-v="0.05">+0.05 mL</button><button data-xa="tit" data-v="reset">最初から</button></div>`) +
      $t(`<div class="titrow"><span>指示薬:</span><button class="seal {0}" data-xa="ind" data-v="php">フェノールフタレイン</button><button class="seal {1}" data-xa="ind" data-v="litmus">リトマス</button></div>`, [titrInd === "php" ? "on" : "", titrInd === "litmus" ? "on" : ""]) +
      $t(`<p class="mdesc">ちょうど色が変わった体積から、塩酸の濃度を計算しよう。(C×V の物質量が等しい)</p>`) +
      $t(`<div class="titrow"><input id="titAns" type="number" step="0.001" placeholder="塩酸の濃度 mol/L" class="x-in"><button class="primary" data-xa="titans">答える</button></div>`);
    return html;
  }
  function titrationAct(a, v) {
    const S_ = S();
    if (a === "titstart") { S_.titr = { c: Math.round((0.05 + Math.random() * 0.15) * 200) / 200, added: 0, done: false }; api.save(); api.render(); return; }
    const t = S_.titr; if (!t) return;
    if (a === "tit") { if (v === "reset") t.added = 0; else t.added = Math.min(60, +(t.added + +v).toFixed(2)); if (Math.abs(t.c * VA - BASE_C * t.added) < 0.006 * 1) api.grantConcept("neutralization"); api.save(); api.render(); return; }
    if (a === "ind") { titrInd = v; api.render(); return; }
    if (a === "titans") {
      const val = parseFloat(document.getElementById("titAns").value); if (isNaN(val)) { api.toast($t("濃度を入力しよう")); return; }
      if (Math.abs(val - t.c) / t.c <= 0.03) {
        t.done = true; let gain = 4; S_.titrDone = (S_.titrDone || 0) + 1;
        if (S_.titrDone <= 8) S_.pt += gain; else gain = 0;
        gain += api.grantConcept("titration"); api.grantConcept("neutralization");
        api.say($t(`滴定成功: 塩酸は {0} mol/L(答え {1}){2}`, [t.c.toFixed(3), val, gain ? " +" + gain + "pt" : ""]));
        api.toast($t("正解! 塩酸は ") + t.c.toFixed(3) + " mol/L");
      } else { api.toast($t("ずれている。当量点の体積を確かめて、 C(酸)×20.0 = 0.100×V を解こう")); }
      api.save(); api.render();
    }
  }

  // ---------------- モルタブ ----------------
  const calcable = () => { const MOLS = D().MOLS; return api.order.filter((id) => owned(id) && spi(id)); };
  function newQuiz() {
    const ids = calcable().filter((id) => spi(id).mass > 1); if (!ids.length) return null;
    const id = ids[Math.floor(Math.random() * ids.length)], n = [0.5, 1, 2, 3, 0.25, 1.5][Math.floor(Math.random() * 6)];
    return { id, n };
  }
  function moleHTML() {
    if (!has("molar_mass")) return $t(`<p class="lead">🔒 原子量の表(周期表)と天秤で、物質の重さを比べられるようになると、モルの考え方が見えてくる。</p>`);
    const ids = calcable(); if (!calcSel || !ids.includes(calcSel)) calcSel = ids[0];
    let html = $t(`<p class="lead">原子や分子は小さすぎて数えられない。そこで、6.02×10²³個を 1 mol として、重さで量る。</p>`);
    const opt = ids.map((id) => `<option value="${id}" ${id === calcSel ? "selected" : ""}>${api.items[id].emoji} ${api.items[id].name} (${formula(id)})</option>`).join("");
    html += $t(`<div class="entool"><div class="stt">物質量の計算</div><div class="row"><select class="x-sel" data-xsel="calc">{0}</select></div>`, [opt]) +
      $t(`<div class="row" style="margin-top:6px"><input id="calcVal" class="x-in" type="number" step="any" placeholder="数値" value="{0}"><select id="calcUnit" class="x-sel" data-xsel="unit"><option value="g" {1}>g(質量)</option><option value="mol" {2}>mol(物質量)</option></select></div><div id="calcOut" class="perf"></div></div>`, [calcVal, calcUnit === "g" ? "selected" : "", calcUnit === "mol" ? "selected" : ""]);
    if (has("mole")) {
      if (!quizQ) quizQ = newQuiz();
      if (quizQ) html += $t(`<div class="entool"><div class="stt">計算ドリル(正解で知識+1)</div><div class="mdesc"><b>{0} mol</b> の {1}({2})は、何 g?</div><div class="row"><input id="quizAns" class="x-in" type="number" step="any" placeholder="g"><button class="primary" data-xa="quiz">答える</button></div></div>`, [quizQ.n, name(quizQ.id), formula(quizQ.id)]);
    } else html += $t(`<div class="perf">🔒 「物質量(モル)」の考え方を得ると、粒子の数や計算ドリルが使える</div>`);
    return html;
  }
  function updateCalc() {
    const out = document.getElementById("calcOut"); if (!out || !calcSel) return;
    const sp = spi(calcSel), v = parseFloat(calcVal);
    let h = $t(`モル質量 <b>{0} g/mol</b>`, [sp.mass.toFixed(2)]);
    if (!isNaN(v) && v >= 0) {
      const mol = calcUnit === "g" ? v / sp.mass : v, g = calcUnit === "g" ? v : v * sp.mass;
      h += $t(`<br>物質量 <b>{0} mol</b>　質量 <b>{1} g</b>`, [mol.toPrecision(4), g.toPrecision(4)]);
      if (has("mole")) h += $t(`<br>粒子の数 <b>{0}</b> 個`, [(mol * 6.022e23).toExponential(3)]);
      if (has("molar_volume") && GAS.has(calcSel)) h += $t(`<br>気体の体積 <b>{0} L</b>(0℃・1気圧)`, [(mol * 22.4).toPrecision(4)]);
    }
    out.innerHTML = h;
  }
  function quizAct() {
    const v = parseFloat(document.getElementById("quizAns").value); if (isNaN(v) || !quizQ) return;
    const want = quizQ.n * spi(quizQ.id).mass;
    if (Math.abs(v - want) / want <= 0.02) {
      const S_ = S(); S_.quiz = (S_.quiz || 0) + 1; if (S_.quiz <= 20) S_.pt += 1;
      api.toast($t("正解! ") + want.toFixed(1) + " g" + (S_.quiz <= 20 ? "(+1pt)" : ""));
    } else api.toast($t("ちがう。質量 = 物質量 × モル質量 (") + spi(quizQ.id).mass.toFixed(2) + " g/mol)");
    quizQ = null; api.save(); api.render();
  }

  // ---------------- 反応式づくり(係数合わせ) ----------------
  const bld = { id: null, c: null, solved: false, oxAns: null, redAns: null, q: null };
  const ownsSp = (id) => (id === "carbon" ? owned("carbon") || owned("charcoal") : D().SPECIES[id] ? true : owned(id));
  const bldList = () => D().EQUATIONS.filter((eq) => has("atom") && ([...eq.L, ...eq.R].every(([, id]) => ownsSp(id)) || eqVisible(eq)));
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  function bldReset(id) { bld.id = id; const eq = D().EQUATIONS.find((e) => e.id === id); bld.c = { L: eq.L.map(() => 1), R: eq.R.map(() => 1) }; bld.solved = false; bld.oxAns = null; bld.redAns = null; bld.q = null; }
  function atomTotals(eq) {
    const tot = (s, cs) => { const c = {}; s.forEach(([, id], i) => Object.entries(spi(id).prof).forEach(([el, p]) => { c[el] = (c[el] || 0) + cs[i] * p.n; })); return c; };
    return [tot(eq.L, bld.c.L), tot(eq.R, bld.c.R)];
  }
  function builderHTML() {
    if (!has("atom")) return $t(`<p class="lead">🔒 原子論を得ると、反応式の係数を考えられるようになる。</p>`);
    const list = bldList();
    let html = $t(`<p class="lead">反応の前後で、原子の種類と数は変わらない。係数を調整して、左右の原子の数を等しくしよう。</p>`);
    if (!list.length) return html + $t(`<p class="lead">発見した物質の反応式が、ここで練習できる。`);
    if (!bld.id || !list.find((e) => e.id === bld.id)) bldReset(list[0].id);
    const eq = D().EQUATIONS.find((e) => e.id === bld.id), S_ = S();
    const opts = list.map((e) => `<option value="${e.id}" ${e.id === bld.id ? "selected" : ""}>${(S_.bld && S_.bld[e.id] ? "✅ " : "") + e.name}</option>`).join("");
    html += `<div class="entool"><select class="x-sel" data-xsel="bld">${opts}</select>`;
    const sp = (s, key) => s.map(([, id], i) => $t(`<div class="bsp"><div class="bc"><button data-xa="bm" data-s="{0}{1}">−</button><b>{2}</b><button data-xa="bp" data-s="{3}{4}">＋</button></div><div class="bf">{5}</div></div>`, [key, i, bld.c[key][i], key, i, formula(id)])).join($t('<span class="bplus">＋</span>'));
    html += `<div class="beq">${sp(eq.L, "L")}<span class="barrow">→</span>${sp(eq.R, "R")}</div>`;
    const [L, R] = atomTotals(eq), els_ = [...new Set([...Object.keys(L), ...Object.keys(R)])];
    const bal = els_.every((el) => (L[el] || 0) === (R[el] || 0));
    html += $t(`<table class="btable"><tr><th>原子</th><th>左辺</th><th>右辺</th><th></th></tr>`) + els_.map((el) => { const ok = (L[el] || 0) === (R[el] || 0); return `<tr><td><b>${el}</b></td><td>${L[el] || 0}</td><td>${R[el] || 0}</td><td>${ok ? "✅" : "❌"}</td></tr>`; }).join("") + `</table>`;
    const coefs = [...bld.c.L, ...bld.c.R], g = coefs.reduce((p, q) => gcd(p, q), 0);
    if (!bld.solved) {
      html += $t(`<div class="titbtns"><button class="primary" data-xa="bcheck">確認する</button><button data-xa="breset">係数を1に戻す</button></div>`);
      html += `<div class="perf">${bal ? (g > 1 ? $t("原子の数は合ったが、最も簡単な整数比にしよう。") : $t("原子の数が合った! 「確認する」を押そう。")) : $t("左右で、原子の数が違う元素がある。係数を調整しよう。")}</div>`;
    } else {
      html += $t(`<div class="eqline" style="font-size:18px">✅ {0}</div><p class="mdesc">反応式の完成!</p>`, [eqText(eq)]);
      const rx = redoxOf(eq);
      if (has("oxidation_number") && rx.redox) {
        const pick = (role, ans) => eq.L.map(([, id]) => `<button class="seal ${ans === id ? "on" : ""}" data-xa="bpick" data-role="${role}" data-sid="${id}">${formula(id)}</button>`).join("");
        html += $t(`<h4>酸化数で考えよう</h4><div class="eqrow">{0}</div>`, [rx.changes.map((c) => c.el + "(" + oxTxt(c.from) + " → " + oxTxt(c.to) + ")").join($t("、"))]) +
          $t(`<div class="eqrow"><b>酸化剤</b>(自分は還元される)は?<div class="chipset">{0}</div></div><div class="eqrow"><b>還元剤</b>(自分は酸化される)は?<div class="chipset">{1}</div></div>`, [pick("ox", bld.oxAns), pick("red", bld.redAns)]);
        const doneR = bld.oxAns && bld.redAns && rx.oxidizers.includes(bld.oxAns) && rx.reducers.includes(bld.redAns);
        if (doneR) html += $t(`<div class="perf">✅ 酸化還元の問題に正解!</div>`);
        else if (bld.oxAns && bld.redAns) html += $t(`<div class="perf">❌ どちらかが違う。酸化数が減る元素を含むものが酸化剤。</div>`);
      }
      if (has("mole") && eq.L.length) {
        if (!bld.q) { const k = [0.5, 1, 2, 3][Math.floor(Math.random() * 4)]; bld.q = { k, a: null }; }
        const i0 = 0, id0 = eq.L[i0][1], idR = eq.R[0][1], m0 = bld.q.k * eq.L[i0][0] * spi(id0).mass;
        html += $t(`<h4>反応式から量を求めよう</h4><div class="mdesc">{0}({1}) <b>{2} g</b> が完全に反応すると、{3}({4})は何 g できる?</div><div class="titrow"><input id="bldAns" class="x-in" type="number" step="any" placeholder="g"><button class="primary" data-xa="bcalc">答える</button></div>`, [name(id0), formula(id0), m0.toFixed(1), name(idR), formula(idR)]);
      }
    }
    return html + `</div>`;
  }
  function builderAct(a, v, ds) {
    const eq = D().EQUATIONS.find((e) => e.id === bld.id); if (!eq) return;
    const S_ = S(); S_.bld = S_.bld || {};
    if (a === "bp" || a === "bm") { const key = ds.s[0], i = +ds.s.slice(1); bld.c[key][i] = Math.max(1, Math.min(12, bld.c[key][i] + (a === "bp" ? 1 : -1))); api.render(); return; }
    if (a === "breset") { bldReset(bld.id); api.render(); return; }
    if (a === "bcheck") {
      const [L, R] = atomTotals(eq), coefs = [...bld.c.L, ...bld.c.R], g = coefs.reduce((p, q) => gcd(p, q), 0);
      const ok = Object.keys(L).concat(Object.keys(R)).every((el) => (L[el] || 0) === (R[el] || 0));
      if (!ok) { api.toast($t("まだ原子の数が合っていない")); return; }
      if (g > 1) { api.toast($t("最も簡単な整数の比にしよう")); return; }
      bld.solved = true; let gain = 0;
      if (!S_.bld[eq.id]) { S_.bld[eq.id] = 1; S_.pt += 3; gain += 3; }
      gain += api.grantConcept("chemical_equation");
      api.say($t("反応式を完成: ") + eqText(eq) + (gain ? " +" + gain + "pt" : "")); api.toast($t("正解! 反応式の完成") + (gain ? " (+" + gain + "pt)" : "")); api.save(); api.render(); return;
    }
    if (a === "bpick") {
      bld[ds.role === "ox" ? "oxAns" : "redAns"] = ds.sid;
      const rx = redoxOf(eq);
      if (bld.oxAns && bld.redAns && rx.oxidizers.includes(bld.oxAns) && rx.reducers.includes(bld.redAns) && !S_.bld[eq.id + "_r"]) { S_.bld[eq.id + "_r"] = 1; S_.pt += 2; api.toast($t("正解! (+2pt)")); api.grantConcept("oxidizing_agent"); api.save(); }
      api.render(); return;
    }
    if (a === "bcalc") {
      const val = parseFloat(document.getElementById("bldAns").value); if (isNaN(val) || !bld.q) return;
      const id0 = eq.L[0][1], idR = eq.R[0][1], want = bld.q.k * eq.R[0][0] * spi(idR).mass;
      if (Math.abs(val - want) / want <= 0.02) { if (!S_.bld[eq.id + "_c"]) { S_.bld[eq.id + "_c"] = 1; S_.pt += 2; api.toast($t("正解! ") + want.toFixed(1) + " g (+2pt)"); } else api.toast($t("正解! ") + want.toFixed(1) + " g"); bld.q = null; api.save(); api.render(); }
      else api.toast($t("ちがう。係数の比 = 物質量の比。質量 ÷ モル質量 で mol にして考えよう"));
    }
  }

  // ---------------- フック ----------------
  let eqByKey = null;
  function onRecipe(r) { // 実験が成功したときに呼ばれる。反応式との対応と、熱の観察
    if (!eqByKey) { eqByKey = {}; D().EQUATIONS.forEach((e) => { if (e.rec) eqByKey[[...e.rec].sort().join("+")] = e; }); }
    const eq = eqByKey[r.key]; if (!eq) return "";
    const S_ = S(); S_.eqSeen = S_.eqSeen || {}; const fresh = !S_.eqSeen[eq.id]; S_.eqSeen[eq.id] = 1;
    const dh = eqDH(eq); let note = "";
    if (dh !== null) {
      api.grantConcept(dh < 0 ? "exothermic" : "endothermic");
      note = owned("calorimeter") ? $t(`(熱量計: ΔH = {0}{1} kJ)`, [dh > 0 ? "+" : "", dh]) : dh < 0 ? $t("(熱が出た)") : $t("(熱を吸った)");
    }
    if (owned("enthalpy") || owned("calorimeter")) { if (Object.keys(S_.eqSeen).length >= 6 && owned("enthalpy")) api.grantConcept("hess_law"); }
    return (fresh ? $t(" 📐反応式を記録") : "") + (note ? " " + note : "");
  }

  function render(i) { return [reactionsHTML, ionsHTML, analysisHTML, moleHTML, builderHTML][i](); }
  function after(i) { if (i === 3) updateCalc(); }
  function attach() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-xa]"); if (!t) return;
      const a = t.dataset.xa;
      if (a === "test") runTest(); else if (a === "quiz") quizAct(); else if (/^b(p|m|check|reset|pick|calc)$/.test(a)) builderAct(a, t.dataset.v, t.dataset); else titrationAct(a, t.dataset.v);
    });
    document.addEventListener("change", (e) => {
      const k = e.target && e.target.dataset && e.target.dataset.xsel; if (!k) return;
      if (k === "bld") { bldReset(e.target.value); api.render(); return; }
      if (k === "sample") anaSample = e.target.value; else if (k === "reagent") anaReagent = e.target.value;
      else if (k === "calc") { calcSel = e.target.value; updateCalc(); } else if (k === "unit") { calcUnit = e.target.value; updateCalc(); }
    });
    document.addEventListener("input", (e) => { if (e.target && e.target.id === "calcVal") { calcVal = e.target.value; updateCalc(); } });
  }
  window.EODX = { subs: [$t("反応式"), $t("イオン"), $t("分析"), $t("モル"), $t("反応式づくり")], init(a) { api = a; attach(); }, render, after, onRecipe };
})();
