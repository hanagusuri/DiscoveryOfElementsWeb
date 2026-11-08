(() => {
  const { ERAS, ITEM_ROWS, PT_BY_TYPE, START_ITEMS, RECIPE_ROWS, TECHS, TEMPS, SEAL_NEED, MAX_AMT } = DATA;
  const SAVE_KEY = "eod_save_v1";
  const MAX_SLOTS = 3, HINT_COST = 3;
  const TYPE_LABEL = { material: "素材", compound: "化合物", tool: "道具", element: "元素", concept: "概念" };

  // ---- データ索引 ----
  const items = {}, order = [];
  ITEM_ROWS.forEach((r, i) => { items[r[0]] = { id: r[0], name: r[1], emoji: r[2], type: r[3], era: r[4], desc: r[5], note: r[6], sym: r[7], idx: i }; order.push(r[0]); });
  order.sort((a, b) => items[a].era - items[b].era || items[a].idx - items[b].idx);
  const keyOf = (ids) => [...ids].sort().join("+");
  const recipes = RECIPE_ROWS.map(([inp, out, text, cond, ratio, miss, repeat, equip, elec]) => ({ inp, out, text, cond, ratio, miss, repeat, equip, elec, key: keyOf(inp) }));
  const recipeByKey = Object.fromEntries(recipes.map((r) => [r.key, r]));
  const ptOf = (id) => PT_BY_TYPE[items[id].type];

  // ---- 状態 ----
  const fresh = () => ({ have: [...START_ITEMS], techs: [], pt: 0, how: {}, seen: [...START_ITEMS], log: ["火と水を選んで「実験する」を押してみよう。"], maxEra: 1, cheat: false, prog: {}, acc: {}, injured: 0, safeDone: {}, phase: {}, states: {}, still: null, cellsBuilt: {} });
  let S = load();
  let slots = [], amts = []; // 素材IDと、それぞれの量
  let filter = "all";
  let busy = false;
  let temp = 2, sealed = false, ground = false, press = 1; // press: 圧力(atm)
  let cooling = 0;
  let dialT = null, dialMix = null;
  let srcSel = null, cells = 1, dynV = 12, anode = null, cathode = null; // 電気回路 // 蒸留の温度ダイヤル
  let vtl = 0, vent = false, ppe = false, slow = false, grad = false, purge = false, cool = false; // 手順と安全措置 // 実験条件(セッション内のみ)

  function load() {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.have) return Object.assign(fresh(), s); } catch (e) {}
    return fresh();
  }
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} };
  const has = (id) => S.have.includes(id);
  // 時代は「節目の発見」で決まる(単にその時代のアイテムを持っているだけでは進まない)
  function currentEra() { let e = 1; for (let k = 2; k <= 4; k++) { if ((DATA.ERA_GATES[k] || []).every((id) => S.have.includes(id))) e = k; else break; } return e; }
  const $ = (id) => document.getElementById(id);
  const say = (t) => {
    if (window.FX) FX.onSay(t); S.log.unshift(t); S.log = S.log.slice(0, 30); };
  const elementCount = () => S.have.filter((i) => items[i].type === "element").length;

  // ---- 実験条件 ----
  const tempUnlocked = (l) => !TEMPS[l].need || has(TEMPS[l].need);
  const sealUnlocked = () => has(SEAL_NEED);
  function condText(c) {
    if (!c) return "";
    const parts = [];
    const [lo, hi] = c.t;
    if (!(lo === 1 && hi === 5)) parts.push(lo === hi ? TEMPS[lo].name : hi === 5 ? TEMPS[lo].name + "以上" : lo === 1 ? TEMPS[hi].name + "以下" : TEMPS[lo].name + "〜" + TEMPS[hi].name);
    if (c.sealed === true) parts.push("密閉"); else if (c.sealed === false) parts.push("開放(空気あり)");
    if (c.fine) parts.push("粉末");
    return parts.join("・");
  }
  // 設備の性能
  const sum = (tbl) => Object.entries(tbl).reduce((a, [id, v]) => a + (has(id) ? v : 0), 0);
  const KNOW = () => (DATA.knowFx ? DATA.knowFx(has) : null); // 理解した知識の効果(収率・事故・火力の揺らぎ・分離の効率)
  const drift = () => Math.max(0.02, (DATA.DRIFT_BASE - sum(DATA.EQUIP_STAB)) * (KNOW() ? KNOW().driftMul() : 1));
  const efficiency = () => 1 + sum(DATA.EQUIP_EFF) + (KNOW() ? KNOW().effAdd() : 0);
  const maxTemp = () => { let m = 1; TEMPS.forEach((t, i) => { if (t && tempUnlocked(i)) m = Math.max(m, i); }); return m; };
  const fmt = (x) => String(+x.toFixed(2));

  // 条件を満たさない理由 (満たすなら null)
  function condFail(c, tt = temp) {
    if (!c) return null;
    if (tt < c.t[0]) return "反応の気配はあるのに、熱が足りないようだ。";
    if (tt > c.t[1]) return "熱が強すぎた。材料が台無しになってしまった。";
    if (c.sealed === true && !sealed) return "空気が反応の邪魔をしているようだ。空気を断ったらどうだろう。";
    if (c.sealed === false && sealed) return "密閉したせいで、反応に必要な空気が足りない。";
    if (c.fine && !ground) return "塊のままでは反応が進まない。細かくすり潰してみたらどうだろう。";
    return null;
  }

  const label = (i) => items[slots[i]].name + (amts[i] > 1 ? "×" + amts[i] : "");
  function ratioText(ra) { return Object.entries(ra).map(([id, n]) => items[id].name + " " + n).join(" : "); }
  // 配合比が合わなければ理由を返す
  function ratioFail(r) {
    if (!r.ratio) return null;
    const ids = Object.keys(r.ratio);
    const v = ids.map((id) => amts[slots.indexOf(id)] / r.ratio[id]);
    if (v.every((x) => Math.abs(x - v[0]) < 1e-9)) return null;
    const hi = v.indexOf(Math.max(...v)), lo = v.indexOf(Math.min(...v));
    return `反応しかけたが、うまくいかない。${items[ids[hi]].name}が多すぎる(または${items[ids[lo]].name}が足りない)ようだ。`;
  }

  // ---- 物質の状態(固体・液体・気体) ----
  const TEMP_C = DATA.TEMP_C, COOL_C = DATA.COOL_C;
  const PH = {};
  ITEM_ROWS.forEach((r) => { const p = (r[7] && DATA.PHASE_SYM[r[7]]) || DATA.PHASE_ID[r[0]]; if (p) PH[r[0]] = p; });
  const COOL_NAME_ALL = DATA.COOL_NAME;
  const ST_ICON = { s: "🧊", l: "💧", g: "💨" }, ST_NAME = { s: "固体", l: "液体", g: "気体" };
  function stateAt(id, T) {
    const p = PH[id]; if (!p) return null;
    const [mp, bp, sub] = p;
    if (sub != null && (mp == null || T < mp) && T >= sub) return "g";
    if (mp == null && bp == null) return "s";
    if (mp != null && T < mp) return "s";
    if (bp != null && T >= bp) return "g";
    if (mp == null) return "s";
    return "l";
  }
  const ambient = (id) => DATA.AMBIENT_FORCE[id] || stateAt(id, 20);
  // 常温からTにしたときの状態変化
  function transitions(id, T) {
    const p = PH[id], s0 = ambient(id), s1 = stateAt(id, T);
    if (!p || s0 === s1) return { s0, s1, kinds: [] };
    const [mp, , sub] = p;
    const subType = sub != null && (mp == null || T < mp);
    const k = s0 + s1;
    const kinds = k === "sl" ? ["melting"] : k === "lg" ? ["boiling"] : k === "sg" ? (subType ? ["sublimation"] : ["melting", "boiling"])
      : k === "gl" ? ["condense"] : k === "ls" ? ["freezing"] : k === "gs" ? (subType ? ["deposition"] : ["condense", "freezing"]) : [];
    return { s0, s1, kinds };
  }
  const KIND_VALUE = (id, kind) => { const p = PH[id]; return kind === "melting" || kind === "freezing" ? p[0] : kind === "boiling" || kind === "condense" ? p[1] : p[2]; };
  const KIND_VERB = { melting: "融けて液体になった", boiling: "沸騰して気体になった", freezing: "凝固して固体になった", condense: "凝縮して液体になった", sublimation: "液体を経ずに直接気体になった(昇華)", deposition: "気体が直接固体になった(凝華)" };
  function grantConcept(cid) {
    if (has(cid)) return 0;
    S.have.push(cid); S.seen.push(cid); S.pt += ptOf(cid);
    if (window.JOURNAL) JOURNAL.add(S, { t: "concept", id: cid });
    toast("新しい知識: " + items[cid].name);
    return ptOf(cid);
  }
  // 観察を記録する。戻り値: 新規に観察した種類 [kind]
  function recordPhase(id, tr) {
    const o = (S.phase[id] = S.phase[id] || {});
    const fresh = [];
    tr.kinds.forEach((kd) => {
      const real = KIND_VALUE(id, kd);
      const val = has("thermometer") && real != null ? real : true;
      if (!o[kd]) fresh.push(kd);
      if (!o[kd] || (o[kd] === true && val !== true)) o[kd] = val;
    });
    S.states[id] = [...new Set((S.states[id] || "") + tr.s0 + tr.s1)].join("");
    return fresh;
  }
  // 融点・沸点・三態の気づき
  function checkPhaseInsights() {
    let gain = 0;
    const withKey = (a, b) => Object.values(S.phase).filter((o) => o[a] || o[b]).length;
    if (withKey("melting", "freezing") >= 2) gain += grantConcept("melting_point");
    if (withKey("boiling", "condense") >= 2) gain += grantConcept("boiling_point");
    if (Object.values(S.states).some((s) => s.length >= 3)) gain += grantConcept("three_states");
    return gain;
  }
  const KIND_CONCEPT = { melting: "melting", boiling: "boiling", freezing: "freezing", condense: "condense", sublimation: "sublimation", deposition: "deposition" };
  const curTempC = (hasFire) => (hasFire ? TEMP_C[temp] : COOL_C[cooling]);
  function phaseText(id) {
    const p = PH[id]; if (!p) return "";
    const o = S.phase[id] || {}, ch = S.cheat;
    const f = (v, real) => (ch || typeof v === "number" ? real + "℃" : "未測定(温度計が必要)");
    const parts = ["常温: " + ST_NAME[ambient(id)]];
    if (p[0] != null && (ch || o.melting || o.freezing)) parts.push("融点 " + f(o.melting || o.freezing, p[0]));
    if (p[1] != null && (ch || o.boiling || o.condense)) parts.push("沸点 " + f(o.boiling || o.condense, p[1]));
    if (p[2] != null && (ch || o.sublimation || o.deposition)) parts.push("昇華 " + f(o.sublimation || o.deposition, p[2]));
    return parts.join(" ・ ");
  }

  // 物質単体を加熱・冷却して、状態変化を観察する
  function phaseExperiment(names) {
    if (slots.length < 1 || slots.length > 2) return false;
    const heated = slots.includes("fire");
    if (slots.length === 2 && !heated) return false;
    const subs = slots.filter((i) => i !== "fire");
    if (subs.length !== 1 || !PH[subs[0]]) return false;
    if (!heated && cooling === 0) return false;
    const id = subs[0], T = curTempC(heated);
    const tr = transitions(id, T);
    // 加熱で蒸気が出る有毒物・可燃物の危険
    if (!S.cheat) {
      const haz = new Set();
      if (tr.s1 === "g" && /[GP]/.test(tagsOf(id))) haz.add("gas");
      if (heated && tagsOf(id).includes("F")) haz.add("fire");
      const res = rollAccident(haz, 0.7);
      if (res.worst) { accident(res.worst.kind, res.worst.sev, names); return true; }
    }
    if (!tr.kinds.length) {
      say(`${names} … ${ST_NAME[tr.s1]}のまま、変化は見られなかった。`);
      renderLab(); return true;
    }
    const fresh = recordPhase(id, tr);
    let gain = 0;
    fresh.forEach((kd) => { gain += 1; gain += grantConcept(KIND_CONCEPT[kd]); });
    const outs = [];
    tr.kinds.forEach((kd) => { const oid = DATA.PHASE_OUT[kd + ":" + id]; if (oid && !has(oid)) { S.have.push(oid); S.seen.push(oid); S.pt += ptOf(oid); gain += ptOf(oid); outs.push(oid); } });
    gain += checkPhaseInsights();
    S.pt += fresh.length; // 新しい観察ごとに +1 (概念の知識は grantConcept 内で加算済み)
    const last = tr.kinds[tr.kinds.length - 1], real = KIND_VALUE(id, last);
    say(`${items[id].name}: ${tr.kinds.map((kd) => KIND_VERB[kd]).join("、さらに")}。${has("thermometer") && real != null ? "(温度計は" + real + "℃を示した)" : ""}${gain ? " +" + gain + "pt" : ""}${outs.length ? " → " + outs.map((o) => items[o].name).join("・") + "を得た" : ""}`);
    save(); render();
    return true;
  }

  // ---- 分子の構造・化学結合・異性体 ----
  let molSub = 0, molSel = null;
  const MOLS = DATA.MOLS, FAMS = DATA.FAMILIES;
  const svgCache = {};
  const BOND_NAME = { covalent: "共有結合", polar: "極性共有結合", ionic: "イオン結合", metallic: "金属結合", coordinate: "配位結合" };
  const isMetalItem = (id) => items[id] && items[id].type === "element" && items[id].sym && MolViz.METALS.has(items[id].sym);
  const molAvail = (id) => has(id) && (MOLS[id] || isMetalItem(id));
  const famsOf = (id) => FAMS.filter((f) => f.members.some((m) => m.item === id));
  const famKnown = (f) => f.members.filter((m) => m.item && has(m.item)).length;
  function molSVG(id) {
    if (svgCache[id]) return svgCache[id];
    const [smi, o] = MOLS[id];
    return (svgCache[id] = MolViz.toSVG(smi, { full: o.full, hb: o.hb, label: items[id].name }));
  }
  const smilesSVG = (smi, o) => MolViz.toSVG(smi, o || {});
  // 概念の自動付与(結合・異性)
  function checkMolInsights() {
    let any = false;
    DATA.INSIGHTS.forEach((i) => { if (!has(i.id) && i.need.every(has)) { grantConcept(i.id); any = true; } });
    FAMS.forEach((f) => { if (famKnown(f) >= (f.min || 2)) f.grant.forEach((c) => { if (!has(c)) { grantConcept(c); any = true; } }); });
    if (any) save();
  }
  const chip = (t) => `<span class="bchip ${t}">${BOND_NAME[t]}</span>`;

  function molDetail(id) {
    const it = items[id];
    if (isMetalItem(id) && !MOLS[id]) {
      return `<button class="mini back" data-molback="1">← 戻る</button><h3 class="mname">${it.emoji} ${it.name} <small>${it.sym}</small></h3>` +
        `<div class="molbox">${MolViz.metalLattice(it.sym)}</div><div class="bchips">${chip("metallic")}</div>` +
        `<p class="mdesc">金属は、原子が価電子を出し合い、自由に動く電子(緑の点)が陽イオンの間を満たす「金属結合」でできている。電気や熱をよく伝え、叩いて広げられる。</p>` +
        (it.desc ? `<p class="mdesc">${it.desc}</p>` : "");
    }
    const [smi, o] = MOLS[id], r = molSVG(id), info = r.info;
    const formula = o.formula || info.formula;
    const kindName = { ionic: "イオン結晶(ユニット)", complex: "錯イオン", network: "共有結合の結晶(部分図)" }[o.kind] || "分子";
    let html = `<button class="mini back" data-molback="1">← 戻る</button><h3 class="mname">${it.emoji} ${it.name} <small>${formula}</small></h3>`;
    html += `<div class="molbox">${r.svg}</div>`;
    if (o.lattice) html += `<div class="molbox small">${MolViz.ionicLattice(...o.lattice)}<div class="cap">結晶では、陽イオンと陰イオンが交互に並ぶ</div></div>`;
    html += `<div class="mmeta"><span>${kindName}</span><span>式量・分子量 ${info.mass}</span></div>`;
    // 結合
    const rows = info.bonds.map((b) => `<tr><td>${b.key.replace("→", "→")}</td><td>${b.n}</td><td>${b.d}</td><td>${chip(b.type)}</td><td>${b.data ? b.data[0] + "Å / " + b.data[1] + "kJ" : "—"}</td></tr>`).join("");
    html += `<h4>化学結合</h4><table class="btable"><tr><th>結合</th><th>数</th><th>Δχ</th><th>種類</th><th>長さ/エネルギー</th></tr>${rows}</table><div class="perf">Δχ = 電気陰性度の差。0.4未満:無極性、0.4〜1.7:極性、1.7以上:イオン性</div>`;
    // 立体形
    if (has("structural_formula") || S.cheat) {
      const sh = info.shapes; if (sh.length) html += `<h4>立体形(VSEPR)</h4><div class="shapes">${sh.slice(0, 6).map((s) => `${s.el}${s.atom + 1}: ${s.name}(約${s.angle}°)`).join("<br>")}</div>`;
    } else html += `<div class="perf">🔒 立体形は、「構造式」の考えを得ると分かる</div>`;
    if (o.polar && (has("covalent_bond") || S.cheat)) html += `<h4>極性</h4><p class="mdesc">${o.polar}</p>`;
    if (PH[id] && (has(id))) html += `<p class="how">${phaseText(id)}</p>`;
    if (o.note) html += `<p class="mdesc">📝 ${o.note}</p>`;
    html += `<p class="mdesc">${it.desc}</p>`;
    // 異性体の仲間
    const fs_ = famsOf(id);
    fs_.forEach((f) => {
      html += `<h4>異性体・同素体: ${f.title} <small>${f.formula}</small></h4><div class="sibs">` +
        f.members.filter((m) => m.item && m.item !== id).map((m) => (has(m.item) && MOLS[m.item]) ? `<button class="sib" data-mol="${m.item}">${items[m.item].emoji} ${items[m.item].name}</button>` : `<span class="sib off">❔ まだ見つかっていない仲間</span>`).join("") + `</div>`;
    });
    return html;
  }

  function molList() {
    const ids = order.filter(molAvail);
    if (!ids.length) return `<p class="lead">発見した物質の分子構造が、ここに並ぶ。</p>`;
    return `<div class="lead">発見した物質: ${ids.length}種。タップして構造を見よう。</div><div class="molgrid">` +
      ids.map((id) => { const it = items[id], o = MOLS[id]; const f = o ? (o.formula || MolViz.formulaOf(MolViz.parse(o[0]))) : it.sym;
        return `<button class="moltile" data-mol="${id}"><div class="e">${it.emoji}</div><div class="n">${it.name}</div><div class="f">${f}</div></button>`; }).join("") + `</div>`;
  }

  function bondsTab() {
    let html = `<p class="lead">原子どうしをつなぐ力には、いくつかの種類がある。物質を発見するほど、その仕組みが見えてくる。</p>`;
    // 電気陰性度ツール
    if (has("covalent_bond") || S.cheat) {
      const els_ = Object.entries(MolViz.EN).sort((a, b) => a[1] - b[1]);
      const opt = (sel) => els_.map(([s, v]) => `<option value="${s}" ${s === sel ? "selected" : ""}>${s} (${v})</option>`).join("");
      html += `<div class="entool"><div class="stt">電気陰性度で結合の種類を調べる</div><div class="row"><select class="en-sel" id="enA">${opt("Na")}</select><span>−</span><select class="en-sel" id="enB">${opt("Cl")}</select></div><div id="enOut" class="perf"></div></div>`;
    }
    DATA.BONDS.forEach((b) => {
      const ok = has(b.id) || S.cheat;
      html += `<div class="bondcard ${ok ? "" : "lock"}"><h4>${ok ? items[b.id].emoji : "🔒"} ${b.name}</h4>`;
      if (!ok) { const ins = DATA.INSIGHTS.find((x) => x.id === b.id); html += `<p class="mdesc">まだ分からない。${ins ? "(関わる発見: " + ins.need.filter((n) => !has(n)).slice(0, 3).map((n) => items[n].name).join("・") + ")" : ""}</p></div>`; return; }
      html += `<div class="perf">${b.rule}</div><p class="mdesc">${b.summary}</p>`;
      let fig;
      if (b.id === "metallic_bond") fig = MolViz.metalLattice("Cu");
      else if (b.hb) fig = smilesSVG("O.O", { full: true, hb: [[0, 4]] }).svg;
      else if (b.id === "ionic_bond") fig = MolViz.ionicLattice("Na", "Cl", 1, 1);
      else if (MOLS[b.sample]) fig = molSVG(b.sample).svg;
      html += fig ? `<div class="molbox small">${fig}</div>` : "";
      html += `</div>`;
    });
    return html;
  }

  function isomersTab() {
    let html = `<p class="lead">同じ分子式でも、つながり方や空間配置が違えば別の物質。異性体を集めよう。</p>`;
    const cats = FAMS.filter((f) => famKnown(f) >= 1 || S.cheat);
    if (!cats.length) return html + `<p class="lead">まだ手がかりがない。有機化合物を発見しよう。</p>`;
    const fig = (m) => {
      if (m.item && MOLS[m.item] && (has(m.item) || S.cheat)) return `<button class="fmem" data-mol="${m.item}">${molSVG(m.item).svg}<div class="cap">${m.label}</div></button>`;
      if (m.concept) return `<div class="fmem">${smilesSVG(m.smiles, {}).svg}<div class="cap">${m.label}</div></div>`;
      if (m.item && (has(m.item) || S.cheat)) return `<div class="fmem txt"><div class="e">${items[m.item].emoji}</div><div class="cap">${m.label}${m.text ? "<br><small>" + m.text + "</small>" : ""}${m.mix ? "<br><small>(混合物)</small>" : ""}</div></div>`;
      return `<div class="fmem off"><div class="e">❔</div><div class="cap">未発見</div></div>`;
    };
    cats.forEach((f) => {
      const k = famKnown(f), need = f.min || 2, unlocked = k >= need || S.cheat;
      html += `<div class="famcard"><h4>${f.title} <small>${f.formula}</small></h4>`;
      if (!unlocked) { html += `<p class="mdesc">同じ分子式 ${f.formula} の、別の物質が存在する。探してみよう。(発見 ${k}/${f.members.filter((m) => m.item).length})</p></div>`; return; }
      html += `<div class="kinds">${f.kinds.map((x) => `<span class="kind">${x}</span>`).join("")}</div><p class="mdesc">${f.story}</p><div class="fmems">${f.members.map(fig).join("")}</div></div>`;
    });
    return html;
  }

  function renderMol() {
    const body = $("molBody"); if (!body) return;
    if (!has("atom") && !S.cheat) { body.innerHTML = `<p class="lead">🔒 物質が「原子」のつながりでできていると分かる(原子論)と、分子の構造が見えるようになる。</p>`; return; }
    const tabs = ["構造図鑑", "化学結合", "異性体"].concat(window.EODX ? EODX.subs : []).map((n, i) => `<button data-msub="${i}" class="${molSub === i ? "on" : ""}">${n}</button>`).join("");
    let html = `<div class="chips msub">${tabs}</div>`;
    if (molSub === 0) html += molSel && (MOLS[molSel] || isMetalItem(molSel)) ? molDetail(molSel) : molList();
    else if (molSub === 1) html += bondsTab();
    else if (molSub === 2) html += isomersTab();
    else if (window.EODX) html += EODX.render(molSub - 3);
    body.innerHTML = html;
    if (window.EODX && molSub >= 3) EODX.after(molSub - 3);
    updateEN();
  }
  function updateEN() {
    const a = document.getElementById("enA"), b = document.getElementById("enB"), out = document.getElementById("enOut"); if (!a || !out) return;
    const d = Math.abs(MolViz.EN[a.value] - MolViz.EN[b.value]);
    const t = MolViz.classify(a.value, b.value, false);
    out.innerHTML = `Δχ = <b>${d.toFixed(2)}</b> → <b>${BOND_NAME[t]}</b>${t === "ionic" ? "(電子が移ってイオンになる)" : t === "polar" ? "(電子が電気陰性度の大きい側に偏る)" : t === "metallic" ? "(自由電子の海)" : "(電子をほぼ均等に共有)"}`;
  }

  // ---- 電池の自作: 2つの金属 + 電解液 → 起電力 ----
  function metalE(id) {
    if (id === "charcoal") return 0; // 炭素棒(水素電極に近い)
    const it = items[id];
    if (!it || !it.sym || DATA.POTENTIAL[it.sym] === undefined || it.sym === "H") return null;
    return DATA.POTENTIAL[it.sym];
  }
  function cellBuild(names) {
    if (slots.length !== 3) return false;
    const els = slots.filter((s) => DATA.ELECTROLYTES[s]);
    if (els.length !== 1) return false;
    const el = els[0], ms = slots.filter((s) => s !== el);
    if (ms.length !== 2 || ms[0] === ms[1] || metalE(ms[0]) === null || metalE(ms[1]) === null) return false;
    const [a, c] = ms.sort((x, y) => metalE(x) - metalE(y));
    const Ea = metalE(a), Ec0 = metalE(c), E = DATA.ELECTROLYTES[el];
    if (Ec0 - Ea < 0.05) { say(`${names} … 2つの金属がほとんど同じ性質で、電流は流れなかった。`); renderLab(); return true; }
    if (Ea < -2.5) { // 水と激しく反応する金属(Mg程度までは電池にできる)
      if (!S.cheat) { const res = rollAccident(new Set(["exo", "fire"]), 1); if (res.worst) { accident(res.worst.kind, res.worst.sev, names); return true; } }
      say(`${names} … ${items[a].name}が電解液の水と激しく反応して泡立ち、電池にならなかった。`); renderLab(); return true;
    }
    if (!S.cheat) { // 酸や毒性の電解液の取り扱い
      const kinds = new Set([...hazardKinds([el], [], null, [], 1)].filter((k) => ["corr", "gas", "poison"].includes(k)));
      const res = rollAccident(kinds, 0.4);
      if (res.worst) { accident(res.worst.kind, res.worst.sev, names); return true; }
    }
    const inert = DATA.INERT.includes(c);
    let Ec = Ec0, eta, notes = [];
    const stable = E.ion === c;
    if (E.ox && inert) { Ec = Math.max(Ec0, 0.96); notes.push("硝酸が泡(水素)を酸化して消すため、電圧が落ちにくい"); }
    eta = stable ? 0.95 : E.acid ? 0.8 : E.alkali ? 0.85 : 0.88;
    if (stable) notes.push("陰極のまわりに、その金属自身のイオンがあるため、泡がつかず電圧が安定");
    else if (!E.ox) notes.push("陰極に水素の泡がつき、使うほど電圧が落ちる(分極)");
    if (E.acid && Ec0 < 0 && !inert) { eta *= 0.6; notes.push("酸が両方の金属を溶かしてしまい、電圧が出にくい"); }
    if (E.ox && !inert && Ec0 < 0.9) { eta *= 0.5; notes.push("硝酸が陰極の金属まで溶かしてしまう"); }
    if (E.acid && Ea < -0.2) notes.push("陽極が酸に直接溶け、使わなくても減っていく");
    const V = +((Ec - Ea) * eta).toFixed(2);
    const level = stable && E.cond >= 2 ? 2 : 1;
    const drift = stable ? 0.02 : E.ox && inert ? 0.05 : 0.1;
    const id = `cell:${a}|${c}|${el}`;
    const name = `${elLabel(a)}-${elLabel(c)}電池(${items[el].name})`;
    const isNew = !S.cellsBuilt[id];
    if (isNew) S.cellsBuilt[id] = { a, c, el, V, level, drift, name, notes };
    let gain = 0;
    if (isNew) {
      gain += 2; S.pt += 2;
      gain += grantConcept("galvanic_cell");
      gain += grantConcept("emf");
      if (Object.keys(S.cellsBuilt).length >= 3) gain += grantConcept("electrochemical_series");
    }
    const vTxt = has("voltmeter") ? `起電力 ${V} V` : V >= 2 ? "強い電流が出た" : V >= 1 ? "電球が点いた" : V > 0.4 ? "わずかに針が振れた" : "ほとんど電流が出ない";
    say(`${isNew ? "電池を組んだ" : "同じ電池を組み直した"}: ${name} — ${vTxt}${gain ? " +" + gain + "pt" : ""}`);
    syncElectricity(); save(); render();
    if (isNew) showCard(
      `<div class="big">🔋</div><div class="kind">電池を自作した</div><h2>${name}</h2>` +
      `<div class="story">陽極(−): ${elLabel(a)}(E° ${Ea}V)<br>陰極(＋): ${elLabel(c)}(E° ${Ec0}V)<br>電解液: ${items[el].name}</div>` +
      `<div class="desc"><b>${vTxt}</b>${has("voltmeter") ? "" : "(電圧計があると数値で読める)"}</div>` +
      notes.map((n) => `<div class="desc">・${n}</div>`).join("") +
      (gain ? `<div class="note">知識 +${gain}</div>` : "")
    );
    return true;
  }

  // ---- 電気と電極 ----
  const SRC = DATA.SOURCES;
  const srcInfo = (id) => SRC[id] || (S.cellsBuilt[id] ? { name: S.cellsBuilt[id].name, perCell: S.cellsBuilt[id].V, maxCells: 40, drift: S.cellsBuilt[id].drift, level: S.cellsBuilt[id].level } : null);
  function syncElectricity() { // 電源を持てば『電気』が使える
    const any = Object.keys(SRC).some(has) || Object.keys(S.cellsBuilt).length > 0;
    if (any && !has("electricity")) { S.have.push("electricity"); S.seen.push("electricity"); }
    if (!any && has("electricity")) S.have.splice(S.have.indexOf("electricity"), 1);
  }
  const ownedSrc = () => Object.keys(SRC).filter(has).concat(Object.keys(S.cellsBuilt));
  function curSrc() { const l = ownedSrc(); if (!l.length) return null; if (!srcSel || !l.includes(srcSel)) srcSel = l[0]; return srcSel; }
  const nominalV = () => { const id = curSrc(); if (!id) return 0; return id === "dynamo" ? dynV : +(cells * srcInfo(id).perCell).toFixed(2); };
  const effectiveV = () => { const id = curSrc(); return id ? nominalV() * (1 + (Math.random() * 2 - 1) * srcInfo(id).drift) : 0; };
  const eAvail = () => DATA.ELECTRODES.filter(has);
  const anodeId = () => (eAvail().includes(anode) ? anode : eAvail()[0]);
  const cathodeId = () => (eAvail().includes(cathode) ? cathode : eAvail()[0]);
  const elLabel = (id) => (id ? DATA.ELECTRODE_LABEL[id] || items[id].name : "なし");
  function elecText(e) {
    const spec = (s) => (s === "inert" ? "不活性(炭素/白金/金)" : s.map((x) => elLabel(x)).join("/"));
    return [`電圧 ${e.v[0]}〜${e.v[1]}V`, e.cur === 3 ? "大電流(発電機)" : e.cur === 2 ? "安定した電源" : "", e.an ? "陽極:" + spec(e.an) : "", e.ca ? "陰極:" + spec(e.ca) : ""].filter(Boolean).join("・");
  }
  function elecFail(r, V) {
    const e = r.elec; if (!e) return null;
    const id = curSrc(); if (!id) return "電源がない。";
    const s = srcInfo(id);
    if ((e.cur || 1) > s.level) return e.cur === 3 ? "電流が足りない。電池では力不足だ。巨大な電流を安定して流せる電源が要る。" : "電流が安定せず、きれいに反応しない。ボルタ電池は使うほど電圧が落ちてしまう。もっと安定した電池が要りそうだ。";
    if (V < e.v[0] * 0.5) return "何も起こらない。電圧がまるで足りない。";
    if (V < e.v[0]) return "電極に小さな泡がつくが、すぐに止まる。電圧が足りないようだ。";
    if (V > e.v[1]) return "電圧が高すぎて、別の反応(水の分解や電極の溶解)が起きてしまった。もう少し下げてみよう。";
    const ok = (spec, mat) => !spec || (spec === "inert" ? DATA.INERT.includes(mat) : spec.includes(mat));
    if (!ok(e.an, anodeId())) return e.an === "inert" ? "陽極の金属が溶け出して、目的の反応が起きない。溶け出さない電極(炭素や白金など)を陽極にしよう。" : "陽極の素材が合っていないようだ。この反応では、陽極の素材が結果を左右する。";
    if (!ok(e.ca, cathodeId())) return Array.isArray(e.ca) && e.ca[0] === "mercury" ? "析出した金属が、すぐ水や空気と反応して消えてしまう。析出した金属を捕まえておく工夫(液体の陰極)が要りそうだ。" : "陰極の素材が合っていないようだ。この反応では、陰極の素材が結果を左右する。";
    return null;
  }
  function elecPanel() {
    if (!slots.includes("electricity")) return "";
    const id = curSrc(); if (!id) return "";
    const s = srcInfo(id), list = ownedSrc(), vm = has("voltmeter"), nom = nominalV();
    const vtxt = vm ? nom + " V" : id === "dynamo" ? "出力 " + dynV : "セル×" + cells;
    const a = anodeId(), c = cathodeId();
    return `<div class="still elec"><div class="stt">⚡ 電気回路</div>` +
      `<div class="row"><span class="lbl">電源</span><button class="seal on" data-esrc="1">${s.name}${list.length > 1 ? " ⟳" : ""}</button></div>` +
      `<div class="row"><span class="lbl">${id === "dynamo" ? "出力" : "直列"}</span><div class="dial"><button data-evolt="-5">−5</button><button data-evolt="-1">−1</button><b>${vtxt}</b><button data-evolt="1">+1</button><button data-evolt="5">+5</button></div></div>` +
      `<div class="row"><span class="lbl">陽極＋</span><button class="seal on" data-eel="a">${elLabel(a)} ⟳</button><span class="lbl" style="margin-left:6px">陰極−</span><button class="seal on" data-eel="c">${elLabel(c)} ⟳</button></div>` +
      `<div class="perf">電流: ${["", "弱い(使うと電圧が落ちる)", "安定", "大電流"][s.level]}${vm ? "" : "　(電圧計がないと、電圧は数値で分からない)"}</div></div>`;
  }

  // ---- 蒸留(沸点の差で成分を順に取り出す) ----
  const DIST = DATA.DIST;
  const sharpness = () => (has("rectification_column") ? 2 : has("fractionating_column") ? 8 : 25);
  const distillMix = () => {
    if (!slots.includes("alembic")) return null;
    const ms = slots.filter((i) => DIST[i]);
    return ms.length === 1 && slots.every((i) => i === ms[0] || i === "alembic" || i === "fire") ? ms[0] : null;
  };
  const stillOf = (mix) => {
    if (!S.still || S.still.mix !== mix) S.still = { mix, left: DIST[mix].comps.map((_, i) => i), got: 0 };
    return S.still;
  };
  const dialRange = (mix) => (DIST[mix].cold ? [-262, 30] : [Math.min(20, DIST[mix].start), 420]);
  const dialText = (mix) => (has("thermometer") ? dialT + "℃" : "火加減 " + Math.round((dialT - DIST[mix].start) / 10));

  function stillPanel() {
    const mix = distillMix(); if (!mix) return "";
    const D0 = DIST[mix];
    if (dialMix !== mix) { dialMix = mix; dialT = D0.start; }
    const st = S.still && S.still.mix === mix ? S.still : null;
    const done = st ? D0.comps.filter((_, i) => !st.left.includes(i)).map((c) => c.name) : [];
    const left = st ? st.left.length : D0.comps.length;
    const fine = has("thermometer");
    return `<div class="still"><div class="stt">⚗️ 蒸留: ${items[mix].name}${D0.cold ? "(極低温)" : ""}</div>` +
      `<div class="row"><span class="lbl">温度</span><div class="dial"><button data-dial="-10">−10</button>${fine ? '<button data-dial="-1">−1</button>' : ""}<b>${dialText(mix)}</b>${fine ? '<button data-dial="1">+1</button>' : ""}<button data-dial="10">+10</button></div></div>` +
      `<div class="perf">分離能: 沸点が${sharpness()}℃以上離れた成分を分けられる${fine ? "" : "(温度計がないと細かな調整はできない)"}</div>` +
      `<div class="perf">取り出し済み: ${done.length ? done.join("・") : "なし"}　/　残り ${left} 成分　<button class="mini" data-still="reset">仕込み直す</button></div></div>`;
  }

  function collectComp(mix, idx, names) {
    const D0 = DIST[mix], st = stillOf(mix), c = D0.comps[idx];
    st.left = st.left.filter((i) => i !== idx); st.got++;
    let gain = 0, isNew = false;
    if (c.out && !has(c.out)) { S.have.push(c.out); S.seen.push(c.out); S.pt += ptOf(c.out); gain += ptOf(c.out); isNew = true; if (window.JOURNAL) JOURNAL.add(S, { t: "distill", ids: [c.out], gain: ptOf(c.out) }); }
    gain += grantConcept("distillation");
    if (st.got >= 2) gain += grantConcept("fractional_distillation");
    if (!st.left.length) S.still = null;
    say(`蒸留: ${c.name}を取り出した${isNew ? "(" + items[c.out].name + "を発見" + (gain ? " +" + gain + "pt" : "") + ")" : gain ? "(+" + gain + "pt)" : ""}`);
    save(); render();
    if (isNew) showCard(`<div class="big">${items[c.out].emoji}</div><div class="kind">蒸留で得た</div><h2>${items[c.out].name}</h2><div class="story">${c.story}</div><div class="desc">${items[c.out].desc}</div>${items[c.out].note ? `<div class="note">${items[c.out].note}</div>` : ""}<div class="note">知識 +${gain}</div>`);
  }

  function runDistill(mix, names) {
    const D0 = DIST[mix], st = stillOf(mix), heated = slots.includes("fire");
    const R = st.left.map((i) => D0.comps[i]), c = R[0], idx = st.left[0], next = R[1];
    if (!D0.cold && !heated && dialT > 25) { say(`${names} … 加熱する火がない。`); renderLab(); return; }
    if (c.res) { collectComp(mix, idx, names); return; } // 底に残った成分
    const sharp = sharpness();
    const amp = Math.max(0.6, drift() * 30); // 火加減の揺らぎ(℃)
    const Te = dialT + (Math.random() * 2 - 1) * amp;
    const shown = has("thermometer") ? "(温度計: " + Math.round(Te * 10) / 10 + "℃)" : "";
    if (Te < c.bp - 30) { say(`${names} … まだ何も出てこない。装置は冷たいままだ。${shown}`); renderLab(); return; }
    if (Te < c.bp) { say(`${names} … 蒸気がうっすら上がるが、液は落ちてこない。あと少し熱が要りそうだ。${shown}`); renderLab(); return; }
    const nextVol = next && !next.res ? next : null;
    if (nextVol && Te >= nextVol.bp - sharp) {
      if (nextVol.bp - sharp <= c.bp) say(`${names} … 沸点が近すぎて、この装置では分けきれない。次の成分が混ざってしまう。蒸気を何度も凝縮・蒸発させる仕掛けが要りそうだ。${shown}`);
      else say(`${names} … 温度が高すぎて、次の成分まで一緒に出てきた。混ざった留分は使えない。もう少し温度を下げて、やり直そう。${shown}`);
      renderLab(); return;
    }
    if (!S.cheat && heated && /F/.test(tagsOf(c.out))) { // 可燃性の蒸気が出るので引火の危険
      const res = rollAccident(new Set(["fire"]), 0.5);
      if (res.worst) { accident(res.worst.kind, res.worst.sev, names); return; }
    }
    collectComp(mix, idx, names);
  }

  // ---- 安全管理 ----
  const HZ = DATA.HAZ_KINDS, TAG = DATA.HAZ_TAGS;
  const TAG_ICON = { G: "☠️", P: "💀", F: "🔥", C: "🧪", R: "💥", X: "🧨", A: "☢️", Y: "🔆" };
  const TAG_NAME = { G: "有毒ガス", P: "毒性", F: "可燃性", C: "腐食性", R: "激しく反応", X: "爆発性", A: "放射性", Y: "自然発火" };
  const tagsOf = (id) => TAG[id] || "";
  const anyTag = (ids, c) => ids.some((i) => tagsOf(i).includes(c));
  const gear = (id) => ppe && has(id);
  const anyPPE = () => has("goggles") || has("gloves") || has("respirator");

  // この実験に潜む危険の種類
  function hazardKinds(inp, out, cond, equip, tEff) {
    const k = new Set(), all = [...inp, ...out], fireIn = inp.includes("fire");
    if (anyTag(all, "G") || out.includes("roasting")) k.add("gas");
    if (anyTag(all, "P")) k.add("poison");
    if (anyTag(inp, "F") && fireIn) k.add("fire");
    const reactive = anyTag(inp, "R") && inp.some((i) => DATA.EXO_PARTNERS.includes(i));
    const neutral = inp.some((i) => DATA.ACIDS.includes(i)) && inp.some((i) => DATA.BASES.includes(i));
    if (reactive || neutral) k.add("exo");
    if (anyTag(all, "X") && (fireIn || (cond && cond.fine))) k.add("expl");
    if (anyTag(all, "C")) k.add("corr");
    if (anyTag(all, "A")) k.add("rad");
    if (anyTag(out, "Y")) k.add("pyro");
    if ((equip || []).includes("vacuum_pump")) k.add("vacuum");
    (DATA.HAZ_EXTRA[keyOf(inp)] || []).forEach((x) => k.add(x));
    if (sealed && out.some((o) => DATA.GAS_OUT.includes(o)) && !vent && !has("pressure_vessel")) k.add("pressure");
    const glassy = inp.some((i) => ["alembic", "glass", "glass_flask", "pottery"].includes(i)) || (equip || []).includes("glass_flask");
    if (fireIn && tEff >= 3 && glassy) k.add("thermal");
    if (inp.includes("electricity") && nominalV() >= 36) k.add("shock");
    return k;
  }

  // 現在の手順・設備で、どれだけ危険を抑えられるか
  function mitigation(kind) {
    let m = 0, down = 0;
    switch (kind) {
      case "gas": m = (vtl === 2 ? 1 : vtl === 1 ? 0.6 : 0) + (gear("respirator") ? 0.3 : 0); break;
      case "poison": m = (gear("gloves") ? 0.5 : 0) + (gear("respirator") ? 0.2 : 0) + (gear("goggles") ? 0.1 : 0) + (vtl ? 0.2 : 0); break;
      case "fire": m = purge ? 0.7 : 0; if (has("fire_bucket")) down = 1; break;
      case "exo": m = slow ? 0.85 : 0; if (gear("goggles")) down = 1; break;
      case "expl": m = (slow ? 0.4 : 0) + (purge ? 0.1 : 0); if (has("blast_shield")) down = 2; break;
      case "corr": m = (gear("goggles") ? 0.4 : 0) + (gear("gloves") ? 0.4 : 0) + (slow ? 0.2 : 0); break;
      case "rad": m = has("lead_shield") ? 1 : 0; break;
      case "pyro": m = cool ? 0.9 : 0; if (has("fire_bucket")) down = 1; break;
      case "pressure": m = vent || has("pressure_vessel") ? 1 : 0; if (has("blast_shield")) down = 1; break;
      case "thermal": m = grad ? 0.85 : 0; break;
      case "shock": m = gear("gloves") ? 0.7 : 0; break;
      case "vacuum": m = gear("goggles") ? 0.5 : 0; if (has("blast_shield")) down = 2; break;
    }
    return { m: Math.min(1, m), down };
  }

  function rollAccident(kinds, scale = 1) {
    let worst = null, ok = kinds.size > 0;
    for (const kd of kinds) {
      const { m, down } = mitigation(kd), H = HZ[kd];
      if (m < 0.5) ok = false;
      if (Math.random() < H.p * (1 - m) * scale * (KNOW() ? KNOW().accMul(kd) : 1)) {
        const sev = Math.max(1, H.sev - down);
        if (!worst || sev > worst.sev) worst = { kind: kd, sev };
      }
    }
    return { worst, ok };
  }

  function accident(kind, sev, names) {
    if (window.FX) FX.accident(sev, kind);
    const H = HZ[kind];
    const lost = sev === 1 ? 2 : sev === 2 ? 5 : 10;
    const before = S.pt;
    S.pt = Math.max(0, S.pt - lost);
    S.acc[kind] = (S.acc[kind] || 0) + 1;
    if (window.JOURNAL) JOURNAL.add(S, { t: "accident", text: (H && (H.name || H.label) ? H.name || H.label : kind) + "(" + names + ")", lost });
    const nBreak = sev === 3 ? 2 : sev === 2 ? 1 : kind === "thermal" || kind === "vacuum" ? 1 : 0;
    const broken = [];
    for (let i = 0; i < nBreak; i++) {
      let pool = DATA.BREAKABLE.filter(has);
      if (kind === "thermal") { const gl = ["glass_flask", "alembic"].filter(has); if (gl.length) pool = gl; }
      if (!pool.length) break;
      const b = pool[Math.floor(Math.random() * pool.length)];
      S.have.splice(S.have.indexOf(b), 1); broken.push(b);
    }
    if (sev >= 2) S.injured = sev === 3 ? 2 : 1;
    const first = !has("lesson_learned");
    if (first) { S.have.push("lesson_learned"); S.seen.push("lesson_learned"); }
    say(`⚠ 事故: ${H.title}(-${before - S.pt}pt${broken.length ? "、" + broken.map((b) => items[b].name).join("・") + "が壊れた" : ""})`);
    save(); render();
    const sevName = ["", "軽微", "中程度", "重大"][sev];
    showCard(
      `<div class="big">${H.icon}</div><div class="kind">事故(${sevName})</div><h2>${H.title}</h2>` +
      `<div class="story">${names}<br>原因: ${H.cause}</div>` +
      `<div class="desc"><b>被害</b>: 知識 -${before - S.pt}${broken.length ? "、" + broken.map((b) => items[b].emoji + items[b].name).join("・") + "が壊れた(作り直せる)" : ""}${S.injured ? "、負傷して" + S.injured + "回休む" : ""}</div>` +
      `<div class="desc"><b>教訓</b>: ${H.lesson}</div><div class="note">${H.hist}</div>` +
      (first ? `<div class="note">📓 「失敗の教訓」を得た</div>` : "")
    );
  }

  // ---- 描画 ----
  function render() {
    syncElectricity();
    checkMolInsights();
    $("pt").textContent = S.pt;
    const era = currentEra();
    $("eraName").textContent = `第${era}期 ${ERAS[era].name}`;
    $("eraSub").textContent = ERAS[era].sub + (S.cheat ? " 🛠" : "") + (S.injured ? " 🩹療養中" : "");
    const total = order.length;
    $("eraBar").style.width = (S.have.length / total * 100).toFixed(1) + "%";
    renderLab(); renderTech(); renderCodex(); renderTable(); renderMol();
    if (window.IND) IND.render();
  }

  function renderCond() {
    $("cond").innerHTML =
      `<div class="row"><span class="lbl">温度</span><div class="temps">` +
      TEMPS.slice(1).map((t, i) => { const l = i + 1, ok = tempUnlocked(l); return `<button data-temp="${l}" class="${temp === l ? "on" : ""} ${ok ? "" : "lock"}">${ok ? t.name : "🔒"}<small>${ok ? t.c : "？"}</small></button>`; }).join("") +
      `</div></div><div class="row"><span class="lbl">容器</span><button class="seal ${sealed ? "on" : ""} ${sealUnlocked() ? "" : "lock"}" data-seal="1">${sealUnlocked() ? (sealed ? "密閉する(空気を断つ)" : "開放(空気あり)") : "🔒 容器が必要"}</button></div><div class="row"><span class="lbl">粒度</span><button class="seal ${ground ? "on" : ""} ${has("mortar") ? "" : "lock"}" data-grind="1">${has("mortar") ? (ground ? "粉末(すり潰す)" : "塊のまま") : "🔒 乳鉢が必要"}</button></div><div class="row"><span class="lbl">圧力</span><div class="chipset">${DATA.PRESS_LEVELS.map((l) => { const ok = !l.need || has(l.need); return `<button class="seal ${press === l.p ? "on" : ""} ${ok ? "" : "lock"}" data-press="${l.p}">${ok ? l.p + "気圧" : "🔒"}</button>`; }).join("")}</div></div><div class="row"><span class="lbl">冷却</span><div class="chipset">${DATA.COOL_NAME.map((n, i) => { const ok = !DATA.COOL_NEED[i] || has(DATA.COOL_NEED[i]); return `<button class="seal ${cooling === i ? "on" : ""} ${ok ? "" : "lock"}" data-cool="${i}">${ok ? n : "🔒"}${ok && i ? ` ${COOL_C[i]}℃` : ""}</button>`; }).join("")}</div></div><div class="perf">熱の安定度 <b>${Math.round((1 - drift()) * 100)}%</b> ・ 分離効率 <b>×${fmt(efficiency())}</b></div>`;
  }

  function renderProc() {
    const ownDev = ["blast_shield", "lead_shield", "fire_bucket"].filter(has).map((d) => items[d].emoji + items[d].name);
    const vtlLabel = ["室内のまま", "窓を開ける", "ドラフト"][vtl];
    const b = (k, on, text, lock) => `<button class="seal ${on ? "on" : ""} ${lock ? "lock" : ""}" data-proc="${k}">${text}</button>`;
    // 危険予知: 選んだ素材のタグ + 事故で学んだ危険
    const letters = new Set();
    slots.forEach((id) => tagsOf(id).split("").forEach((c) => letters.add(c)));
    const rr = slots.length ? recipeByKey[keyOf(slots)] : null;
    const learned = [];
    if (rr) hazardKinds(rr.inp, rr.out, rr.cond, rr.equip, temp).forEach((kd) => { if (S.acc[kd]) learned.push(HZ[kd].icon + HZ[kd].name); });
    const warn = [...letters].map((c) => TAG_ICON[c] + TAG_NAME[c]).concat(learned);
    const hot = slots.includes("fire"), Tc = curTempC(hot);
    const stl = [...new Set(slots)].filter((id) => id !== "fire" && PH[id]).map((id) => {
      const a = ambient(id), b = stateAt(id, Tc);
      return `${items[id].name} ${a === b ? ST_ICON[a] + ST_NAME[a] : ST_ICON[a] + "→" + ST_ICON[b] + ST_NAME[b]}`;
    });
    const where = hot ? TEMPS[temp].name : COOL_NAME_ALL[cooling];
    const stateLine = stl.length ? `<div class="stline">🌡 ${has("thermometer") ? Tc + "℃" : where}: ${stl.join(" / ")}${!hot && cooling ? "" : ""}</div>` : "";
    $("proc").innerHTML = elecPanel() + stillPanel() + stateLine +
      `<div class="row"><span class="lbl">手順</span><div class="chipset">` +
      b("vtl", vtl > 0, "換気: " + vtlLabel, false) +
      b("vent", vent, "排気管: " + (vent ? "つける" : "なし"), !has("pottery")) +
      b("ppe", ppe, anyPPE() ? "保護具: " + (ppe ? "着用" : "なし") : "🔒 保護具", !anyPPE()) +
      b("slow", slow, "投入: " + (slow ? "少しずつ" : "一度に"), false) +
      b("grad", grad, "加熱: " + (grad ? "ゆっくり" : "急に"), false) +
      b("purge", purge, "点火: " + (purge ? "空気を追い出して" : "そのまま"), false) +
      b("cool", cool, "取り出し: " + (cool ? "冷めてから" : "すぐ"), false) +
      `</div></div>` +
      (ownDev.length ? `<div class="perf">設置中: ${ownDev.join("　")}</div>` : "") +
      (warn.length ? `<div class="hzline">⚠ 取り扱い注意: ${warn.join(" / ")}</div>` : "");
  }

  function renderLab() {
    if (window.FX) FX.bench({ fire: slots.includes("fire"), elec: slots.includes("electricity"), cold: !slots.includes("fire") && cooling > 0 });
    renderCond();
    renderProc();
    $("slots").innerHTML = Array.from({ length: MAX_SLOTS }, (_, i) => {
      const id = slots[i];
      const body = id ? `<div data-slot="${i}" class="sbody">${items[id].emoji}<small>${items[id].name}</small></div><div class="stp"><b data-amt="${i}:-1">−</b><span>${amts[i]}${has("mole") ? "mol" : ""}</span><b data-amt="${i}:1">+</b></div>` : `<small>空き</small>`;
      return (i ? '<span class="plus">+</span>' : "") + `<div class="slot ${id ? "filled" : ""}">${body}</div>`;
    }).join("");
    $("btnRun").disabled = busy || slots.length === 0;
    $("btnHint").disabled = busy || S.pt < HINT_COST;
    $("log").innerHTML = S.log.map((l) => `<p>${l}</p>`).join("");

    const f = [["all", "すべて"], ["material", "素材"], ["compound", "化合物"], ["tool", "道具"], ["element", "元素"], ["concept", "概念"]];
    $("chips").innerHTML = f.map(([k, n]) => `<button data-f="${k}" class="${filter === k ? "on" : ""}">${n}</button>`).join("");
    const list = order.filter((i) => has(i) && (filter === "all" || items[i].type === filter));
    $("inv").innerHTML = list.map((id) => {
      const it = items[id];
      return `<div class="item ${it.type}" data-id="${id}">${it.sym ? `<span class="sym">${it.sym}</span>` : ""}${S.seen.includes(id) ? "" : '<span class="new"></span>'}<div class="e">${it.emoji}</div><div class="n">${it.name}</div>${PH[id] && ambient(id) !== "s" ? `<span class="st">${ST_ICON[ambient(id)]}</span>` : ""}${tagsOf(id) ? `<span class="hz">${[...tagsOf(id)].map((c) => TAG_ICON[c]).join("")}</span>` : ""}${DATA.FORMULAS[id] ? `<div class="f">${DATA.FORMULAS[id]}</div>` : ""}</div>`;
    }).join("");
  }

  function techState(t) {
    if (S.techs.includes(t.id)) return "done";
    const ok = t.req.every(has) && (!t.reqEl || elementCount() >= t.reqEl);
    return ok ? "open" : "locked";
  }

  const effTag = (id) => (DATA.EQUIP_STAB[id] ? `<em>安定+${Math.round(DATA.EQUIP_STAB[id] * 100)}%</em>` : DATA.EQUIP_EFF[id] ? `<em>効率+${Math.round(DATA.EQUIP_EFF[id] * 100)}%</em>` : "");

  function renderEquip() {
    const cell = (id) => has(id) ? `<span class="eq on" title="${items[id].note}">${items[id].emoji} ${items[id].name}${effTag(id)}</span>` : S.cheat ? `<span class="eq off">${items[id].emoji} ${items[id].name}</span>` : `<span class="eq off">❔</span>`;
    return "<h3 class='sec'>設備の発展</h3><div class='perf box'>熱の安定度 <b>" + Math.round((1 - drift()) * 100) + "%</b>(火力の揺らぎ " + Math.round(drift() * 100) + "%) ・ 分離効率 <b>×" + fmt(efficiency()) + "</b></div>" + DATA.EQUIP_LINES.map(([name, base, chain]) =>
      `<div class="eqline"><div class="eqname">${name}</div><div class="eqchain">${base ? `<span class="eq on base">${base}</span>` : ""}${chain.map(cell).join('<i>›</i>')}</div></div>`).join("");
  }

  const st_ok = (t) => !S.techs.includes(t.id) && (S.cheat || techState(t) === "open");
  function renderTech() {
    const open = TECHS.filter((t) => S.cheat || techState(t) !== "locked");
    const hidden = TECHS.length - open.length;
    const rows = open.map((t) => {
      const st = S.techs.includes(t.id) ? "done" : S.cheat ? "open" : techState(t);
      const free = S.cheat;
      const gr = t.grants.map((g) => items[g].emoji + items[g].name).join("・");
      return `<div class="tech ${st}"><h3><span>${t.name}</span><span>${free ? "無料" : t.cost + "pt"}</span></h3><p>${t.desc}</p><div class="gr">入手: ${gr}</div>` +
        (st === "done" ? `<button disabled>完了</button>` : (window.IND && st_ok(t) ? `<button data-techg="${t.id}" class="${IND.canPay(IND.techGold(t)) ? "primary" : ""}">資金で調達(${IND.easy() ? "無料" : IND.techGold(t) + "G"}・約${Math.max(7, t.cost * 3)}日)</button> ` : "") + `<button class="${free || S.pt >= t.cost ? "primary" : ""}" data-tech="${t.id}" ${!free && S.pt < t.cost ? "disabled" : ""}>研究する${free && techState(t) === "locked" ? "(前提を無視)" : ""}</button>`) + `</div>`;
    });
    const rpNeed = TECHS.filter((t) => !S.techs.includes(t.id) && t.req.some((r) => !has(r) && DATA.REPLAY_GRANTS && Object.values(DATA.REPLAY_GRANTS).includes(r)) && t.req.every((r) => has(r) || Object.values(DATA.REPLAY_GRANTS || {}).includes(r)));
    const rpHint = rpNeed.length ? `<p class="lead">🔬 化学タブの「追体験」で得る知識が必要な研究: ${rpNeed.map((t) => `「${t.name}」(${t.req.filter((r) => !has(r)).map((r) => items[r].name).join("・")})`).join("、")}</p>` : "";
    $("techList").innerHTML = rpHint + renderEquip() + "<h3 class='sec'>研究</h3>" + rows.join("") + (hidden ? `<p class="lead">🔒 まだ見えていない技術があと ${hidden} 個。新しい発見が道を拓く。</p>` : `<p class="lead">すべての技術を開放した!</p>`);
  }

  // 入手方法(チート用): 実験レシピ or 技術
  function sourceText(id) {
    const r = recipes.find((x) => x.out.includes(id));
    if (r) {
      const c = [condText(r.cond), r.ratio ? "配合 " + ratioText(r.ratio) : "", r.repeat ? "繰り返し ×" + r.repeat : "", r.equip ? "設備: " + r.equip.map((e) => items[e].name).join("・") : "", r.elec ? "電気: " + elecText(r.elec) : ""].filter(Boolean).join("・");
      return "作り方: " + r.inp.map((x) => items[x].name).join(" + ") + (c ? " [" + c + "]" : "");
    }
    for (const [mix, d] of Object.entries(DIST)) {
      const k = d.comps.findIndex((c) => c.out === id);
      if (k >= 0) { const c = d.comps[k]; return "作り方: 蒸留(" + items[mix].name + " + 蒸留器 + 火)" + (c.bp != null ? " 沸点 " + c.bp + "℃" : "") + (d.comps[k + 1] && !d.comps[k + 1].res && d.comps[k + 1].bp - c.bp < 25 ? " ・ 分留管/精留塔が要る" : ""); }
    }
    const t = TECHS.find((x) => x.grants.includes(id));
    return t ? "入手: 技術「" + t.name + "」" : "";
  }

  function usesHtml(id, card) {
    const u = DATA.usesFor && DATA.usesFor(id, S.maxEra || 1);
    if (!u) return "";
    const era = Math.min(4, S.maxEra || 1);
    const past = u.past.length ? `<details class="whyd"><summary>昔の用途</summary>${u.past.map((p) => `<p class="use">第${p.era}期(${ERAS[p.era].name}): ${p.text}</p>`).join("")}</details>` : "";
    return card ? `<div class="why use"><b>🏭 第${era}期の用途</b><p>${u.now}</p>${past}</div>` : `<p class="use">🏭 第${era}期の用途: ${u.now}</p>${past}`;
  }

  function whyHtml(r, open) {
    if (!DATA.explain) return "";
    const x = DATA.explain(r);
    return `<div class="why"><b>🔬 なぜ起こるのか</b><p>${x.why}</p>${x.conds.length ? `<ul>${x.conds.map((c) => `<li>${c}</li>`).join("")}</ul>` : ""}</div>`;
  }

  function renderCodex() {
    $("btnCheat").textContent = "🛠 チートモード: " + (S.cheat ? "ON(図鑑・技術を全開放)" : "OFF");
    $("btnCheat").classList.toggle("on", !!S.cheat);
    $("codexCount").textContent = `発見 ${S.have.length} / ${order.length}`;
    let html = "";
    for (let e = 1; e <= 4; e++) {
      const ids = order.filter((i) => items[i].era === e);
      const got = ids.filter(has).length;
      html += `<div class="eragrp"><span>第${e}期 ${ERAS[e].name}</span><small>${got}/${ids.length}</small></div>`;
      const unk = ids.length - got;
      html += ids.map((id) => {
        const it = items[id];
        if (!has(id) && !S.cheat) return "";
        const rc = S.how[id] && recipeByKey[S.how[id]];
        const ct = rc && [condText(rc.cond), rc.ratio ? "配合 " + ratioText(rc.ratio) : "", rc.repeat ? "繰り返し ×" + rc.repeat : "", rc.equip ? "設備: " + rc.equip.map((e) => items[e].name).join("・") : "", rc.elec ? "電気: " + elecText(rc.elec) : ""].filter(Boolean).join("・");
        const how = S.cheat ? `<p class="how">${sourceText(id)}</p>` : S.how[id] ? `<p class="how">作り方: ${S.how[id].split("+").map((x) => items[x].name).join(" + ")}${ct ? " [" + ct + "]" : ""}</p>` : "";
        return `<div class="cx ${has(id) ? "" : "unk2"}" id="cx-${id}"><div class="e">${it.emoji}</div><div><h4>${it.name}${has(id) ? "" : "(未発見)"} <small style="color:var(--dim)">${TYPE_LABEL[it.type]}${it.sym ? " · " + it.sym : ""}${DATA.FORMULAS[id] ? " · " + DATA.FORMULAS[id] : ""}</small></h4><p>${it.desc}</p>${usesHtml(id)}${it.note ? `<p class="how">${it.note}</p>` : ""}${PH[id] && (has(id) || S.cheat) ? `<p class="how">${phaseText(id)}</p>` : ""}${it.sym && DATA.POTENTIAL[it.sym] !== undefined && (S.cheat || has("activity_series")) && (has(id) || S.cheat) ? `<p class="how">標準電極電位 E° ${DATA.POTENTIAL[it.sym] > 0 ? "+" : ""}${DATA.POTENTIAL[it.sym]} V</p>` : ""}${how}${rc && DATA.explain ? `<details class="whyd"><summary>なぜ起こる?</summary>${whyHtml(rc)}</details>` : ""}</div></div>`;
      }).join("");
      if (unk && !S.cheat) html += `<div class="cx unk"><div class="e">❔</div><div><h4>未発見 ${unk} 件</h4><p>実験と探索で埋めよう</p></div></div>`;
    }
    const accs = Object.keys(HZ).filter((k) => S.acc[k] || S.cheat);
    if (accs.length) {
      html += `<div class="eragrp"><span>⚠ 事故の記録</span><small>${Object.values(S.acc).reduce((a, b) => a + b, 0)}回</small></div>`;
      html += accs.map((k) => { const H = HZ[k]; return `<div class="cx"><div class="e">${H.icon}</div><div><h4>${H.name}${S.acc[k] ? " ×" + S.acc[k] : ""}</h4><p>${H.cause}</p><p class="how">対策: ${H.lesson}</p><p>${H.hist}</p></div></div>`; }).join("");
    }
    const cb = Object.entries(S.cellsBuilt);
    if (cb.length) {
      html += `<div class="eragrp"><span>🔋 自作電池の記録</span><small>${cb.length}種</small></div>`;
      html += cb.sort((x, y) => y[1].V - x[1].V).map(([, d]) => `<div class="cx"><div class="e">🔋</div><div><h4>${d.name}</h4><p class="how">${has("voltmeter") || S.cheat ? "起電力 " + d.V + " V" : "電圧は未測定(電圧計が必要)"}　電流: ${["", "弱い", "安定"][d.level]}</p><p>${(d.notes || []).join(" / ")}</p></div></div>`).join("");
    }
    $("codex").innerHTML = html;
  }

  // ---- 周期表 ----
  const symToItem = {};
  ITEM_ROWS.forEach((r) => { if (r[7]) symToItem[r[7]] = r[0]; });
  const gotSym = (sym) => symToItem[sym] && has(symToItem[sym]);

  function renderTable() {
    const unlocked = has("periodic");
    const found = PERIODIC.filter((e) => gotSym(e[1]));
    if (!unlocked) {
      $("tableLead").textContent = `発見した元素: ${found.length}。元素を整理する方法がまだ分からない…(原子論と元素の体系化が鍵)`;
      $("tableWrap").innerHTML = found.length
        ? `<div class="free-el">${found.map((e) => `<button class="pcell got" data-el="${e[1]}" style="background:var(--panel2)"><span>${items[symToItem[e[1]]].emoji}${e[1]}</span><small>${e[2]}</small></button>`).join("")}</div>`
        : "";
      return;
    }
    $("tableLead").textContent = found.length === 118 ? "全118元素を発見した! 人類の知の到達点だ。" : `周期表 — 発見 ${found.length} / 118。空欄は未発見の元素。点線はメンデレーエフが存在を予言した元素。`;
    const cells = PERIODIC.map((e) => {
      const [r, c] = periodicPos(e[0]);
      const got = gotSym(e[1]);
      return `<button class="pcell ${got ? "got" : ""} ${periodicCat(e[0])} ${PREDICTED[e[0]] ? "pred" : ""}" style="grid-row:${r};grid-column:${c}" data-el="${e[1]}"><i>${e[0]}</i>${e[1]}</button>`;
    }).join("");
    const legend = Object.entries(PERIODIC_CAT_NAME).map(([k, n]) => `<span><b class="got ${k} pcell" style="display:inline-block;width:10px;height:10px;padding:0"></b>${n}</span>`).join("");
    $("tableWrap").innerHTML = `<div class="ptwrap"><div class="pt-grid">${cells}</div></div><div class="legend">${legend}</div>`;
  }

  function showElement(sym) {
    const e = PERIODIC.find((x) => x[1] === sym);
    if (!e) return;
    const it = gotSym(sym) ? items[symToItem[sym]] : null;
    const cat = PERIODIC_CAT_NAME[periodicCat(e[0])];
    if (it) showCard(`<div class="big">${it.emoji}</div><div class="kind">原子番号 ${e[0]} · ${cat}</div><h2>${sym} ${e[2]}</h2><div class="desc">${it.desc}</div><div class="note">${it.note}</div>`);
    else if (has("periodic")) showCard(`<div class="big">❔</div><div class="kind">原子番号 ${e[0]} · ${cat}</div><h2>${sym}</h2><div class="desc">まだ発見されていない元素。${PREDICTED[e[0]] ? "メンデレーエフはこの空欄に「" + PREDICTED[e[0]] + "」があると予言した。" : "この空欄を埋める発見が、いつか訪れる。"}</div>`);
  }

  // ---- 操作 ----
  function addSlot(id) { if (slots.length < MAX_SLOTS && !busy) { slots.push(id); amts.push(1); if (!S.seen.includes(id)) { S.seen.push(id); save(); } renderLab(); } }

  function toast(msg) {
    if (window.FX) FX.onToast(msg); const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2200); }

  function showCard(html, onClose) {
    $("card").innerHTML = html + `<button class="primary" id="cardOk">OK</button>`;
    $("modal").hidden = false;
    $("cardOk").onclick = () => { $("modal").hidden = true; onClose && onClose(); };
  }

  function checkEra() {
    const era = currentEra();
    if (era > S.maxEra) { S.maxEra = era; if (window.JOURNAL) JOURNAL.add(S, { t: "era", eraNo: era, name: ERAS[era].name }); save(); return era; }
    return 0;
  }

  function run() {
    syncElectricity();
    if (busy || !slots.length) return;
    if (S.injured > 0 && !S.cheat) { S.injured--; say(`🩹 負傷の療養中で、実験は見送った。(あと${S.injured}回休む)`); save(); render(); return; }
    const names = slots.map((_, i) => label(i)).join(" + ");
    const key = keyOf(slots);
    const r = recipeByKey[key];
    busy = true; $("bench").classList.add("working"); renderLab();
    setTimeout(() => {
      $("bench").classList.remove("working"); busy = false;
      S.nexp = (S.nexp || 0) + 1;
      if (window.IND) IND.advance(1); // 実験1回で1日が経つ
      const dm = distillMix();
      if (dm) { runDistill(dm, names); return; }
      if (!r) {
        if (cellBuild(names)) return;
        if (phaseExperiment(names)) return;
        if (!S.cheat) { // むやみに混ぜるのも危ない
          const res = rollAccident(new Set([...hazardKinds(slots, [], null, [], temp)].filter((x) => ["exo", "fire", "expl"].includes(x))), 0.5);
          if (res.worst) { accident(res.worst.kind, res.worst.sev, names); return; }
        }
        const near = recipes.some((x) => slots.every((s) => x.inp.includes(s)) && x.inp.length > slots.length);
        const mr = recipes.find((x) => x.miss && x.inp.length === slots.length + 1 && slots.every((s) => x.inp.includes(s)));
        if (mr) { say(`${names} … ${mr.miss}`); renderLab(); return; }
        say(near ? `${names} … 何かが起きそうだ。もう一つ何かが足りない気がする。` : `${names} … 何も起こらなかった。`);
        renderLab(); return;
      }
      const gate = DATA.REPLAY_GATES && DATA.REPLAY_GATES[r.key];
      if (gate && !has(gate) && !S.cheat) { // 追体験で、得る知識が、必要な実験
        const rp_ = DATA.REPLAYS.find((x) => DATA.REPLAY_GRANTS[x.id] === gate);
        say(`${names} … 何かが起きそうだが、まだ理論が足りない。化学タブの「追体験」で、${rp_ ? "「" + rp_.title + "」" : "関連する実験"}のデータを取り、「${items[gate].name}」を、理解しよう。`);
        renderLab(); return;
      }
      const lack = (r.equip || []).find((e) => !has(e));
      // 火力の揺らぎ: 温度条件が厳しい反応でだけ効く
      let tEff = temp, drifted = false;
      if (r.cond && !(r.cond.t[0] === 1 && r.cond.t[1] === 5) && Math.random() < drift()) {
        tEff = Math.min(maxTemp(), Math.max(1, temp + (Math.random() < 0.5 ? -1 : 1)));
        drifted = tEff !== temp;
      }
      let fail = (lack && DATA.EQUIP_WHY[lack]) || condFail(r.cond, tEff) || ratioFail(r) || elecFail(r, r.elec ? effectiveV() : 0);
      if (fail && drifted && !lack && condFail(r.cond) === null) fail = `火力が揺らいで${tEff > temp ? "熱が上がりすぎた" : "熱が足りなくなった"}。安定した熱源と、温度を測る道具があれば防げそうだ。`;
      if (fail) { say(`${names} … ${fail}`); renderLab(); return; }
      // 危険の判定
      let safeOk = false;
      const kinds = hazardKinds(r.inp, r.out, r.cond, r.equip, tEff);
      if (kinds.size && !S.cheat) {
        const res = rollAccident(kinds);
        if (res.worst) { accident(res.worst.kind, res.worst.sev, names); return; }
        safeOk = res.ok;
      }
      { // 反応中に見えた状態変化を覚えておく
        const Tn = curTempC(r.inp.includes("fire"));
        r.inp.forEach((id) => { if (PH[id] && id !== "fire") { const tr = transitions(id, Tn); if (tr.kinds.length) recordPhase(id, tr); } });
        checkPhaseInsights();
      }
      // 収率: 化学平衡と反応速度で、成功・不成功と収量が決まる
      let yNote = "";
      const ym = DATA.yieldOf ? DATA.yieldOf(r.key, (DATA.YIELDS[r.key] && DATA.YIELDS[r.key].ambient) ? COOL_C[cooling] : TEMP_C[tEff], press, sealed) : null; // 火を使わない反応は、実験室の温度(冷却の段階)で決まる
      if (ym && KNOW()) { const mul = KNOW().yieldMul((DATA.YIELDS[r.key] || {}).kind, press); if (mul > 1) { const ny = Math.min(Math.max(ym.y, 0.99), ym.y * mul); if (ny > ym.y) { ym.y = ny; ym.kmul = mul; } } } // 知識の効果で、収率が上がる
      if (ym) {
        if (ym.y < ym.threshold) { say(`${names} … ${ym.what}はほとんど得られなかった(収率 ${(ym.y * 100).toFixed(1)}%)。${ym.why}`); renderLab(); return; }
        yNote = ` 📊収率${(ym.y * 100).toFixed(0)}%${ym.kmul ? `(🧠知識の効果 ×${ym.kmul.toFixed(2)})` : ""}`;
        grantConcept("yield");
        S.bestY = S.bestY || {};
        const prev = S.bestY[r.key] || 0; let bonus = 0;
        if (ym.y > prev) { [0.1, 0.3, 0.6].forEach((m) => { if (prev < m && ym.y >= m) bonus += 2; }); S.bestY[r.key] = ym.y; }
        if (bonus) { S.pt += bonus; yNote += `(自己ベスト +${bonus}pt)`; }
      }
      const eqNote = (window.EODX ? EODX.onRecipe(r) : "") + yNote; // 反応式・熱の観察・収率
      const fresh_ = r.out.filter((o) => !has(o));
      if (!fresh_.length) { say(`${names} … 既に知っている結果だ。${eqNote}`); renderLab(); return; }
      if (r.repeat) {
        const n = (S.prog[r.key] || 0) + efficiency();
        if (n < r.repeat - 1e-9) {
          S.prog[r.key] = n; S.pt += 1;
          say(`${names} … 結晶を取り分けては溶かし、再び析出させる。成分が少しずつ濃縮された。(${fmt(n)}/${r.repeat}) +1pt`);
          save(); render(); return;
        }
        delete S.prog[r.key];
      }
      let gain = 0;
      fresh_.forEach((o) => { const first = !S.how[o]; S.have.push(o); if (first) { S.how[o] = r.key; gain += ptOf(o); } if (!S.seen.includes(o)) S.seen.push(o); });
      if (gain === 0) { // 壊れた器具の作り直し
        say(`作り直した: ${fresh_.map((o) => items[o].name).join("、")}`);
        save(); slots = []; amts = []; render(); toast("作り直した: " + fresh_.map((o) => items[o].name).join("、"));
        return;
      }
      if (safeOk) { // 正しい手順で危険な実験を成功させた
        if (!S.safeDone[r.key]) { S.safeDone[r.key] = 1; gain += 1; }
        if (!has("safety_first")) { S.have.push("safety_first"); S.seen.push("safety_first"); toast("⛑️ 「安全第一」を得た"); }
      }
      S.pt += gain;
      if (window.IND) IND.onDiscover(fresh_);
      if (window.JOURNAL) JOURNAL.add(S, { t: "discover", ids: fresh_.slice(), key: r.key, gain, temp: r.cond ? TEMPS[tEff].name : "", sealed: !!sealed, press });
      say(`発見: ${fresh_.map((o) => items[o].name).join("、")} (+${gain}pt)${eqNote}`);
      if (window.FX) FX.discover(fresh_.map((o) => items[o].type), gain);
      const newEra = checkEra();
      const newEp = window.HIST ? HIST.newEpisodes() : [];
      if (newEp.length) setTimeout(() => toast(`📖 歴史の転換点が読める: ${newEp[0].title}`), 1800);
      save(); slots = []; amts = []; render();
      const body = fresh_.length === 1
        ? `<div class="big">${items[fresh_[0]].emoji}</div><div class="kind">${TYPE_LABEL[items[fresh_[0]].type]}を発見</div><h2>${items[fresh_[0]].name}</h2>`
        : `<div class="kind">新発見</div><div class="multi">${fresh_.map((o) => `<div><div class="big">${items[o].emoji}</div>${items[o].name}</div>`).join("")}</div>`;
      const details = fresh_.map((o) => `<div class="desc"><b>${items[o].name}</b>: ${items[o].desc}</div>${window.HIST ? HIST.cardHtml(o) : ""}${usesHtml(o, true)}${items[o].note ? `<div class="note">${items[o].note}</div>` : ""}`).join("");
      showCard(`${body}<div class="story">${r.text}</div>${whyHtml(r)}${details}<div class="note">知識 +${gain}</div>`, () => {
        if (newEra) toast(`新時代へ: ${ERAS[newEra].name}`);
      });
    }, 900);
  }

  // ---- ヒント: 持っている素材・設備・条件に応じて、出し方を変える ----
  // 実験を実行するために足りないものを調べる(名前は出さず、種類だけを返す)
  function recipeBlocks(r) {
    const blocks = [];
    { const g = DATA.REPLAY_GATES && DATA.REPLAY_GATES[r.key]; if (g && !has(g)) blocks.push("この実験には、まだ理論の理解が足りないようだ。化学タブの「追体験」で、歴史上の実験を、再現してみよう。"); }
    (r.equip || []).forEach((e) => { if (!has(e)) blocks.push(DATA.EQUIP_WHY[e] || "この実験には、まだ持っていない設備が要りそうだ。"); });
    if (r.cond) {
      const [lo, hi] = r.cond.t;
      if (!(lo === 1 && hi === 5)) { let any = false; for (let l = lo; l <= hi; l++) if (tempUnlocked(l)) any = true; if (!any) blocks.push("今の設備では届かない温度が必要そうだ。もっと強い熱源を作ろう。"); }
      if (r.cond.sealed === true && !sealUnlocked()) blocks.push("空気を断てる容器が要りそうだ。");
      if (r.cond.fine && !has("mortar")) blocks.push("固い材料を細かくすり潰す道具が要りそうだ。");
    }
    if (r.elec) {
      const list = ownedSrc();
      if (!list.length) blocks.push("電気を流す必要がありそうだ。電源になる装置を作ろう。");
      else {
        const best = Math.max(...list.map((s) => srcInfo(s).level)), maxV = Math.max(...list.map((s) => srcInfo(s).maxV || srcInfo(s).perCell * srcInfo(s).maxCells));
        if (r.elec.v[0] > maxV) blocks.push("今の電源では、電圧が足りなそうだ。");
        else if ((r.elec.cur || 1) > best) blocks.push("今の電源では、電流の強さや安定さが足りなそうだ。もっと強力な電源を考えよう。");
      }
      const okEl = (spec) => !spec || (spec === "inert" ? DATA.INERT.some(has) : spec.some(has));
      if (!okEl(r.elec.an) || !okEl(r.elec.ca)) blocks.push("電極に使う素材が足りないようだ。");
    }
    const ym = DATA.YIELDS && DATA.YIELDS[r.key];
    if (ym && !ym.ambient && !blocks.length) { // 収率の条件(圧力・温度)をまだ満たせない
      const lo = r.cond ? r.cond.t[0] : 1, hi = r.cond ? r.cond.t[1] : 5;
      const okNow = (allP) => { for (let l = lo; l <= hi; l++) { if (!allP && !tempUnlocked(l)) continue; for (const pl of DATA.PRESS_LEVELS) { if (!allP && pl.need && !has(pl.need)) continue; const y = DATA.yieldOf(r.key, TEMP_C[l], pl.p, r.cond && r.cond.sealed === true); if (y && y.y >= y.threshold) return true; } } return false; };
      if (!okNow(false) && okNow(true)) blocks.push("今の設備では、この反応を進める圧力や温度が足りなそうだ。もっと強力な装置を考えよう。");
    }
    return blocks;
  }
  // 足りない材料の種類(名前は出さない)
  function missingKind(id) {
    const it = items[id];
    if (TECHS.some((t) => t.grants.includes(id))) return "探索で手に入る素材";
    if (it.type === "tool") return "まだ作っていない道具";
    if (it.type === "concept") return "まだ得ていない知識";
    if (it.type === "element") return "まだ見つけていない元素";
    return "別の実験で作る物質";
  }
  function hint() {
    if (S.pt < HINT_COST) return;
    const nm = (i) => items[i].emoji + items[i].name;
    const cands = []; // {tier, text}
    recipes.forEach((r) => {
      if (!r.out.some((o) => !has(o))) return; // すでに全部発見している
      const miss = r.inp.filter((i) => !has(i));
      if (miss.length > 1) return;
      const blocks = recipeBlocks(r);
      if (!miss.length && !blocks.length) { // すぐ実行できる
        const hide = Math.floor(Math.random() * r.inp.length);
        cands.push({ tier: 1, text: "ヒント: " + r.inp.map((i, k) => (k === hide ? "？" : nm(i))).join(" + ") + " で何かが起きる。" + (r.ratio ? "分量にも決まりがありそうだ。" : "") });
      } else if (!miss.length) { // 材料はそろっているが、設備や条件が足りない
        cands.push({ tier: 2, text: "ヒント: " + r.inp.map(nm).join(" + ") + " で何かが起きそうだが、今のままでは足りない。" + blocks[0] });
      } else { // 材料が1つ足りない
        const have_ = r.inp.filter((i) => has(i)).map(nm);
        cands.push({ tier: 3, text: "ヒント: " + (have_.length ? have_.join(" + ") + " に、" : "") + "もう1つ、" + missingKind(miss[0]) + "を加えると、何かが起きそうだ。" + (blocks.length ? "さらに、" + blocks[0] : "") });
      }
    });
    // 蒸留で成分を取り出せる混合物
    Object.keys(DIST).forEach((mix) => {
      if (!has(mix) || !DIST[mix].comps.some((c) => c.out && !has(c.out))) return;
      cands.push(has("alembic") ? { tier: 1, text: "ヒント: " + nm(mix) + " は、蒸留器で温度を上げながら加熱すると、成分が順に分かれて出てくるかもしれない。" }
        : { tier: 3, text: "ヒント: " + nm(mix) + " は、成分に分けられそうだ。液体を蒸気にして冷やす、特別な器具が要りそうだ。" });
    });
    if (!cands.length) { say("今は、思いつく手がかりがない。「技術」から新しい探索を進めたり、手持ちの素材を観察してみよう。"); renderLab(); return; }
    const tier = Math.min(...cands.map((c) => c.tier)), pool = cands.filter((c) => c.tier === tier);
    const c = pool[Math.floor(Math.random() * pool.length)];
    S.pt -= HINT_COST;
    say(c.text);
    save(); render();
  }

  function buyTech(id, byGold) {
    const t = TECHS.find((x) => x.id === id);
    if (!t || S.techs.includes(id)) return;
    if (byGold && window.IND) { // 資金で調達(探検隊・買い付け)
      if (!S.cheat && techState(t) !== "open") return;
      const g = IND.techGold(t);
      if (!S.cheat && !IND.canPay(g)) { toast("資金が足りない"); return; }
      if (!S.cheat) IND.pay(g);
      IND.advance(Math.max(7, t.cost * 3)); // 調達には時間がかかる
    } else {
    if (!S.cheat && (techState(t) !== "open" || S.pt < t.cost)) return;
    if (!S.cheat) S.pt -= t.cost;
    }
    S.techs.push(id);
    if (window.JOURNAL) JOURNAL.add(S, { t: "tech", name: t.name, grants: t.grants });
    t.grants.forEach((g) => { if (!has(g)) S.have.push(g); });
    say(`研究完了: ${t.name} → ${t.grants.map((g) => items[g].name).join("、")} を入手`);
    const newEra = checkEra();
    save(); render();
    toast(`「${t.name}」完了`);
    if (newEra) setTimeout(() => toast(`新時代へ: ${ERAS[newEra].name}`), 2400);
  }

  // ---- イベント ----
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-id],[data-slot],[data-amt],[data-f],[data-tab],[data-tech],[data-techg],[data-temp],[data-seal],[data-grind],[data-proc],[data-cool],[data-press],[data-dial],[data-still],[data-esrc],[data-evolt],[data-eel],[data-msub],[data-mol],[data-molback],[data-el]");
    if (t) {
      if (t.dataset.amt) { if (busy) return; const [i, dlt] = t.dataset.amt.split(":").map(Number); if (dlt < 0 && amts[i] <= 1) { slots.splice(i, 1); amts.splice(i, 1); } else amts[i] = Math.min(MAX_AMT, amts[i] + dlt); renderLab(); }
      else if (t.dataset.id) addSlot(t.dataset.id);
      else if (t.dataset.slot !== undefined) { if (!busy) { slots.splice(+t.dataset.slot, 1); amts.splice(+t.dataset.slot, 1); renderLab(); } }
      else if (t.dataset.f) { filter = t.dataset.f; renderLab(); }
      else if (t.dataset.tech) buyTech(t.dataset.tech);
      else if (t.dataset.techg) buyTech(t.dataset.techg, true);
      else if (t.dataset.temp) { const l = +t.dataset.temp; if (busy) return; if (tempUnlocked(l)) { temp = l; renderCond(); } else toast("今の設備では、この温度は出せない"); }
      else if (t.dataset.seal) { if (busy) return; if (sealUnlocked()) { sealed = !sealed; renderCond(); } else toast("空気を断つには、まず容器が必要だ"); }
      else if (t.dataset.msub !== undefined) { molSub = +t.dataset.msub; molSel = null; renderMol(); }
      else if (t.dataset.mol) { molSel = t.dataset.mol; molSub = 0; renderMol(); window.scrollTo(0, 0); }
      else if (t.dataset.molback) { molSel = null; renderMol(); }
      else if (t.dataset.esrc) { if (busy) return; const l = ownedSrc(); if (l.length > 1) { srcSel = l[(l.indexOf(curSrc()) + 1) % l.length]; renderLab(); } }
      else if (t.dataset.evolt) { if (busy) return; const id = curSrc(); if (!id) return; const d = +t.dataset.evolt; if (id === "dynamo") dynV = Math.min(SRC.dynamo.maxV, Math.max(1, dynV + d)); else cells = Math.min(srcInfo(id).maxCells, Math.max(1, cells + d)); renderLab(); }
      else if (t.dataset.eel) { if (busy) return; const l = eAvail(); if (!l.length) return; if (t.dataset.eel === "a") anode = l[(l.indexOf(anodeId()) + 1) % l.length]; else cathode = l[(l.indexOf(cathodeId()) + 1) % l.length]; renderLab(); }
      else if (t.dataset.dial) { if (busy) return; const mix = distillMix(); if (!mix) return; const [lo, hi] = dialRange(mix); dialT = Math.min(hi, Math.max(lo, dialT + (+t.dataset.dial))); renderLab(); }
      else if (t.dataset.still) { if (busy) return; S.still = null; const mix = distillMix(); if (mix) dialT = DIST[mix].start; save(); renderLab(); toast("仕込み直した"); }
      else if (t.dataset.press) { if (busy) return; const lv = DATA.PRESS_LEVELS.find((l) => l.p === +t.dataset.press); if (!lv.need || has(lv.need)) { press = lv.p; renderLab(); } else toast("まだこの圧力は作れない"); }
      else if (t.dataset.cool) { if (busy) return; const i = +t.dataset.cool; const need = DATA.COOL_NEED[i]; if (!need || has(need)) { cooling = i; renderLab(); } else toast("まだこの温度まで冷やせない"); }
      else if (t.dataset.grind) { if (busy) return; if (has("mortar")) { ground = !ground; renderCond(); } else toast("細かくするには、すり潰す道具が必要だ"); }
      else if (t.dataset.proc) {
        if (busy) return;
        const k = t.dataset.proc;
        if (k === "vtl") { vtl = (vtl + 1) % 3; if (vtl === 2 && !has("fume_hood")) vtl = 0; }
        else if (k === "ppe") { if (anyPPE()) ppe = !ppe; else toast("身につける保護具がまだない"); }
        else if (k === "vent") { if (has("pottery")) vent = !vent; else toast("排気管をつなぐには容器が必要だ"); }
        else if (k === "slow") slow = !slow;
        else if (k === "grad") grad = !grad;
        else if (k === "purge") purge = !purge;
        else if (k === "cool") cool = !cool;
        renderLab();
      }
      else if (t.dataset.el) showElement(t.dataset.el);
      else if (t.dataset.tab) {
        document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b === t));
        ["lab", "tech", "table", "mol", "codex", "ind"].forEach((n) => ($("tab-" + n).hidden = n !== t.dataset.tab));
        window.scrollTo(0, 0);
      }
    }
  });
  document.addEventListener("change", (e) => { if (e.target.classList && e.target.classList.contains("en-sel")) updateEN(); });
  $("btnRun").onclick = run;
  $("btnClear").onclick = () => { if (!busy) { slots = []; amts = []; renderLab(); } };
  $("btnHint").onclick = hint;
  $("btnExport").onclick = () => { const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" }); const el = document.createElement("a"); el.href = URL.createObjectURL(blob); el.download = "eod-save.json"; el.click(); toast("セーブデータを書き出した"); };
  $("btnCheat").onclick = () => { S.cheat = !S.cheat; save(); render(); toast("チートモード " + (S.cheat ? "ON" : "OFF")); };
  $("btnReset").onclick = () => { if (confirm("セーブデータをすべて消去して、最初の状態からやり直しますか?" + String.fromCharCode(10) + "(チートモードもOFFに戻ります。音や演出の設定は残ります)")) { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); } };

  S.maxEra = currentEra(); // 旧セーブの時代表示を、新しい判定に合わせる
  // 画面の移動: タブ、化学タブのサブタブ(名前)、強調する要素の id
  function go(tab, subName, focusId) {
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    ["lab", "tech", "table", "mol", "codex", "ind"].forEach((n) => { const e = $("tab-" + n); if (e) e.hidden = n !== tab; });
    if (tab === "mol" && subName && window.EODX) { const i = EODX.subs.indexOf(subName); if (i >= 0) molSub = i + 3; }
    render();
    setTimeout(() => {
      const e = focusId && document.getElementById(focusId);
      if (e) { e.scrollIntoView({ block: "center" }); e.classList.add("hilite"); setTimeout(() => e.classList.remove("hilite"), 2600); } else window.scrollTo(0, 0);
    }, 60);
  }
  window.EOD = { go, S: () => S, has, items, order, ptOf, grantConcept, save, render, toast, say, DATA, MolViz, showCard };
  if (window.EODX) EODX.init(window.EOD);
  render();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
