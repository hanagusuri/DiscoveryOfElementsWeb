// 管理者ビュー: 反応・生成リスト、作り方ツリー、依存マップ、検証
(function () {
  "use strict";
  const D = DATA;
  const TYPE = { material: "素材", compound: "化合物", tool: "道具", element: "元素", concept: "概念" };
  const COL = { material: "#8d93a8", compound: "#b0803c", tool: "#4b6a9a", element: "#3e8a7a", concept: "#7c5aa8" };
  const ERA = ["", "古代", "錬金術", "近代化学", "現代科学"];
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  // ---------------- データ索引 ----------------
  const IT = {}, ORDER = [];
  D.ITEM_ROWS.forEach((r, i) => { IT[r[0]] = { id: r[0], name: r[1], emoji: r[2], type: r[3], era: r[4], desc: r[5], note: r[6], sym: r[7], idx: i }; ORDER.push(r[0]); });
  const nm = (id) => (IT[id] ? IT[id].name : id);
  const pill = (id) => IT[id] ? `<span class="pill t-${IT[id].type}" data-item="${id}" title="${esc(IT[id].desc || "")}">${IT[id].emoji} ${esc(IT[id].name)}</span>` : `<span class="pill">${esc(id)}</span>`;

  // ---- 入手元(ソース)の収集: レシピ・技術・蒸留・概念の自動付与・初期素材 ----
  const SRC = {}, add = (id, s) => { (SRC[id] = SRC[id] || []).push(s); };
  const uniq = (a) => [...new Set(a)];
  function tempText(c) {
    const T = D.TEMPS, [lo, hi] = c.t; const parts = [];
    if (!(lo === 1 && hi === 5)) parts.push(lo === hi ? T[lo].name : hi === 5 ? T[lo].name + "以上" : lo === 1 ? T[hi].name + "以下" : T[lo].name + "〜" + T[hi].name);
    if (c.sealed === true) parts.push("密閉"); else if (c.sealed === false) parts.push("開放");
    if (c.fine) parts.push("粉末");
    return parts.join("・");
  }
  const elecText = (e) => `電圧${e.v[0]}〜${e.v[1]}V${e.cur === 3 ? "・大電流" : e.cur === 2 ? "・安定電源" : ""}${e.an ? "・陽極:" + (e.an === "inert" ? "不活性" : e.an.map(nm).join("/")) : ""}${e.ca ? "・陰極:" + e.ca.map(nm).join("/") : ""}`;
  function recipeInfo(r) {
    const chips = [];
    if (r[3]) { const t = tempText(r[3]); if (t) chips.push(`<span class="chip">${t}</span>`); }
    if (r[4]) chips.push(`<span class="chip">配合 ${Object.entries(r[4]).map(([k, v]) => nm(k) + v).join(":")}</span>`);
    if (r[6]) chips.push(`<span class="chip warn">繰り返し×${r[6]}</span>`);
    if (r[7]) chips.push(`<span class="chip eqp">設備: ${r[7].map(nm).join("・")}</span>`);
    if (r[8]) chips.push(`<span class="chip eqp">⚡${elecText(r[8])}</span>`);
    const key = [...r[0]].sort().join("+"), y = D.YIELDS && D.YIELDS[key];
    if (y) chips.push(`<span class="chip ok">収率モデル:${y.kind}${y.rx ? "(" + y.rx + ")" : ""} しきい${(y.threshold * 100).toFixed(0)}%</span>`);
    return chips.join("");
  }
  D.START_ITEMS.forEach((id) => add(id, { kind: "start", inputs: [], text: "初期素材" }));
  D.RECIPE_ROWS.forEach((r, i) => {
    const deps = [...r[0], ...(r[7] || [])];
    if (r[3] && r[3].t[0] > 2 && D.TEMPS[r[3].t[0]].need) deps.push(D.TEMPS[r[3].t[0]].need);
    if (r[3] && r[3].sealed === true) deps.push(D.SEAL_NEED);
    if (r[3] && r[3].fine) deps.push("mortar");
    r[1].forEach((o) => add(o, { kind: "recipe", idx: i, inputs: uniq(deps).filter((x) => x !== o), text: r[0].map(nm).join(" + ") + " → " + r[1].map(nm).join("、") }));
  });
  D.TECHS.forEach((t) => t.grants.forEach((g) => add(g, { kind: "tech", inputs: t.req.slice(), text: `技術「${t.name}」(${t.cost}pt${t.reqEl ? "、元素" + t.reqEl + "個" : ""})`, tech: t })));
  Object.entries(D.DIST || {}).forEach(([mix, d]) => d.comps.forEach((c, k) => {
    if (!c.out) return; const nx = d.comps[k + 1]; let need = null;
    if (!c.res && nx && !nx.res) { const gap = nx.bp - c.bp; need = gap > 25 ? null : gap > 8 ? "fractionating_column" : "rectification_column"; }
    add(c.out, { kind: "distill", inputs: [mix, "alembic", ...(need ? [need] : [])], text: `蒸留: ${nm(mix)} から ${c.name}${c.bp != null ? "(沸点" + c.bp + "℃)" : "(残渣)"}${need ? " ・" + nm(need) + "が要る" : ""}` });
  }));
  (D.INSIGHTS || []).forEach((x) => add(x.id, { kind: "insight", inputs: x.need.slice(), text: "自動付与: " + x.need.map(nm).join("・") + " をそろえる" }));
  (D.FAMILIES || []).forEach((f) => (f.grant || []).forEach((g) => add(g, { kind: "family", inputs: f.members.filter((m) => m.item).map((m) => m.item).slice(0, f.min || 2), text: `異性体グループ「${f.title}」の仲間を発見` })));
  ["battery", "daniell_cell", "dynamo", "leclanche_cell", "lead_acid_cell"].forEach((s) => add("electricity", { kind: "auto", inputs: [s], text: `電源(${nm(s)})を持つと使える` }));

  // ---- 深さ(最短の手数) ----
  const depth = {}; D.START_ITEMS.forEach((s) => (depth[s] = 0));
  const via = {}; // id -> 最良ソース
  for (let it = 0; it < 80; it++) {
    let changed = false;
    Object.keys(SRC).forEach((id) => SRC[id].forEach((s) => {
      if (s.inputs.some((i) => depth[i] === undefined)) return;
      const d = 1 + Math.max(0, ...s.inputs.map((i) => depth[i]));
      if (depth[id] === undefined || d < depth[id]) { depth[id] = d; via[id] = s; changed = true; }
    }));
    if (!changed) break;
  }
  const USED = {}; D.RECIPE_ROWS.forEach((r, i) => uniq([...r[0], ...(r[7] || [])]).forEach((x) => { (USED[x] = USED[x] || []).push(i); }));
  Object.values(SRC).flat().forEach((s) => { if (s.kind !== "recipe") s.inputs.forEach((x) => { (USED[x] = USED[x] || []).push("s"); }); });

  // ---------------- 画面 ----------------
  const view = document.getElementById("view"), nav = document.getElementById("nav");
  const TABS = [["recipes", "反応一覧"], ["items", "アイテム"], ["tree", "作り方ツリー"], ["map", "依存マップ"], ["check", "検証・統計"], ["tech", "技術"]];
  let tab = "recipes", sel = null;
  document.getElementById("counts").textContent = `アイテム ${ORDER.length} / レシピ ${D.RECIPE_ROWS.length} / 技術 ${D.TECHS.length}`;
  function drawNav() { nav.innerHTML = TABS.map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? "on" : ""}">${n}</button>`).join(""); }
  function go(t, id) { tab = t; if (id) sel = id; drawNav(); history.replaceState(null, "", "#" + t + (sel ? ":" + sel : "")); render(); window.scrollTo(0, 0); }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (b) return go(b.dataset.tab);
    const p = e.target.closest("[data-item]"); if (p && !p.closest("#map")) return go("tree", p.dataset.item);
    const h = e.target.closest("[data-sort]"); if (h) { sortKey = h.dataset.sort; sortDir = sortKey === lastKey ? -sortDir : 1; lastKey = sortKey; render(); }
    const x = e.target.closest("[data-export]"); if (x) exportData(x.dataset.export);
    const m = e.target.closest("[data-map]"); if (m) { const s = mapState; if (m.dataset.map === "fit") s.vb = [0, 0, s.W, s.H]; else if (m.dataset.map === "home") s.vb = [0, 0, 1400, 700]; else if (sel && s.pos[sel]) s.vb = [s.pos[sel].x - 500, s.pos[sel].y - 300, 1400, 700]; render(); }
  });

  // ---- 反応一覧 ----
  let sortKey = "idx", sortDir = 1, lastKey = "idx", qRec = "", fType = "", onlyCond = false;
  function recipesView() {
    const rows = D.RECIPE_ROWS.map((r, i) => ({ i, r, idx: i, depthv: Math.max(0, ...r[0].map((x) => depth[x] === undefined ? 99 : depth[x])), text: [...r[0], ...r[1]].map(nm).join(" ") }));
    let list = rows.filter((x) => (!qRec || (x.text + " " + x.r[0].join(" ") + " " + x.r[1].join(" ")).toLowerCase().includes(qRec.toLowerCase())) && (!fType || x.r[1].some((o) => IT[o] && IT[o].type === fType)) && (!onlyCond || x.r[3] || x.r[7] || x.r[8] || x.r[6]));
    list.sort((a, b) => (sortKey === "depth" ? a.depthv - b.depthv : a.idx - b.idx) * sortDir);
    let h = `<div class="bar"><input type="search" id="q" placeholder="材料・生成物で検索" value="${esc(qRec)}"><select id="ft"><option value="">生成物の種類:すべて</option>${Object.entries(TYPE).map(([k, v]) => `<option value="${k}" ${fType === k ? "selected" : ""}>${v}</option>`).join("")}</select><label><input type="checkbox" id="oc" ${onlyCond ? "checked" : ""}> 条件・設備つきのみ</label><span class="muted">${list.length} / ${rows.length} 件</span><button data-export="recipes-tsv">TSV出力</button><button data-export="recipes-json">JSON出力</button></div>`;
    h += `<table><tr><th data-sort="idx">#</th><th>材料</th><th>→ 生成物</th><th>条件・設備</th><th data-sort="depth">深さ</th><th>文章</th></tr>` + list.map((x) => `<tr><td class="muted">${x.i + 1}</td><td>${x.r[0].map(pill).join("＋")}</td><td>${x.r[1].map(pill).join(" ")}</td><td>${recipeInfo(x.r)}</td><td><span class="depth">${x.depthv === 99 ? "?" : x.depthv}</span></td><td class="eq">${esc(x.r[2] || "")}${x.r[5] ? `<br>⚠ ${esc(x.r[5])}` : ""}</td></tr>`).join("") + `</table>`;
    return h;
  }

  // ---- アイテム ----
  let qItem = "", fiType = "", fiEra = "";
  function itemsView() {
    let list = ORDER.map((id) => IT[id]).filter((x) => (!qItem || (x.name + x.id).toLowerCase().includes(qItem.toLowerCase())) && (!fiType || x.type === fiType) && (!fiEra || x.era === +fiEra));
    list.sort((a, b) => (sortKey === "depth" ? (depth[a.id] === undefined ? 999 : depth[a.id]) - (depth[b.id] === undefined ? 999 : depth[b.id]) : sortKey === "era" ? a.era - b.era : a.idx - b.idx) * sortDir);
    let h = `<div class="bar"><input type="search" id="qi" placeholder="名前・IDで検索" value="${esc(qItem)}"><select id="fit"><option value="">種類:すべて</option>${Object.entries(TYPE).map(([k, v]) => `<option value="${k}" ${fiType === k ? "selected" : ""}>${v}</option>`).join("")}</select><select id="fie"><option value="">時代:すべて</option>${[1, 2, 3, 4].map((e) => `<option value="${e}" ${fiEra == e ? "selected" : ""}>第${e}期 ${ERA[e]}</option>`).join("")}</select><span class="muted">${list.length} 件</span><button data-export="items-tsv">TSV出力</button></div>`;
    h += `<table><tr><th data-sort="idx">アイテム</th><th>ID</th><th>種類</th><th data-sort="era">時代</th><th data-sort="depth">深さ</th><th>入手元</th><th>使い道</th></tr>` + list.map((x) => {
      const s = SRC[x.id] || [], kinds = uniq(s.map((q) => ({ start: "初期", recipe: "実験", tech: "技術", distill: "蒸留", insight: "自動", family: "自動", auto: "自動" })[q.kind])).join("・") || "—";
      const used = (USED[x.id] || []).length;
      return `<tr><td>${pill(x.id)}</td><td class="muted">${x.id}</td><td>${TYPE[x.type]}</td><td>第${x.era}期</td><td><span class="depth">${depth[x.id] === undefined ? "?" : depth[x.id]}</span></td><td>${kinds} <small>(${s.length}経路)</small></td><td>${used ? used + "件" : '<span class="chip warn">未使用</span>'}</td></tr>`;
    }).join("") + `</table>`;
    return h;
  }

  // ---- 作り方ツリー ----
  function srcLabel(s) { return { start: "初期素材", recipe: "実験", tech: "技術", distill: "蒸留", insight: "自動付与", family: "自動付与", auto: "自動" }[s.kind]; }
  function treeNode(id, path, limit) {
    const it = IT[id], ss = SRC[id] || [];
    const head = `<span class="depth">${depth[id] === undefined ? "?" : depth[id]}</span>${pill(id)} <small>${TYPE[it.type]}・第${it.era}期</small>`;
    if (path.includes(id)) return `<div style="margin-left:16px">${head} <span class="chip warn">循環(祖先に同じ物質)</span></div>`;
    if (!ss.length) return `<div style="margin-left:16px">${head} <span class="chip warn">入手元なし</span></div>`;
    if (limit <= 0) return `<details><summary>${head} …</summary></details>`;
    const body = ss.map((s) => {
      let extra = "";
      if (s.kind === "recipe") extra = recipeInfo(D.RECIPE_ROWS[s.idx]);
      const ins = s.inputs.map((x) => treeNode(x, path.concat(id), limit - 1)).join("");
      return `<div class="src"><b>${srcLabel(s)}</b> ${s.kind === "recipe" ? "" : esc(s.text)} ${extra}${ins}</div>`;
    }).join("");
    return `<details ${path.length < 1 ? "open" : ""}><summary>${head} <small>(${ss.length}経路)</small></summary>${body}</details>`;
  }
  // 最短手順(依存の順に並べた実行リスト)
  function plan(id) {
    const steps = [], seen = new Set(), done = new Set();
    (function rec(x) {
      if (seen.has(x)) return; seen.add(x);
      const s = via[x]; if (!s) return;
      s.inputs.forEach(rec);
      if (s.kind === "start") return;
      const key = s.kind === "recipe" ? "r" + s.idx : s.kind === "tech" ? "t" + s.tech.id : s.kind + x; // 同じ実験・技術は1回だけ
      if (done.has(key)) return; done.add(key);
      steps.push({ id: x, s });
    })(id);
    return steps;
  }
  function usedBy(id) { return (USED[id] || []).filter((x) => x !== "s").map((i) => D.RECIPE_ROWS[i]); }
  function treeView() {
    const opts = ORDER.map((id) => `<option value="${IT[id].name}">${id}</option>`).join("");
    let h = `<div class="bar"><input list="items-dl" id="treeq" placeholder="アイテム名を入力(例: 水素)" value="${sel ? esc(nm(sel)) : ""}" size="30"><datalist id="items-dl">${opts}</datalist><span class="muted">候補から選ぶと、作り方ツリーと最短手順が出ます</span></div>`;
    if (!sel || !IT[sel]) return h + `<p class="muted">アイテムを選んでください。「反応一覧」「アイテム」の表で、アイテム名をクリックしても開けます。</p>`;
    const it = IT[sel], st = plan(sel);
    h += `<div class="card"><h2 style="margin:0 0 4px">${it.emoji} ${esc(it.name)} <small>${sel} / ${TYPE[it.type]} / 第${it.era}期 / 深さ ${depth[sel] === undefined ? "?" : depth[sel]}</small></h2><div class="muted">${esc(it.desc || "")} ${esc(it.note || "")}</div></div>`;
    h += `<div class="grid2"><div class="card"><h3 style="margin:0 0 4px">最短手順 (${st.length}手)</h3><ol class="plan">${st.map((q) => `<li>${q.s.kind === "recipe" ? q.s.text + " " + recipeInfo(D.RECIPE_ROWS[q.s.idx]) : esc(q.s.text) + " → " + (q.s.kind === "tech" ? q.s.tech.grants.map(pill).join(" ") : pill(q.id))}</li>`).join("") || "<li class='muted'>初期素材</li>"}</ol></div>`;
    const ub = usedBy(sel);
    h += `<div class="card"><h3 style="margin:0 0 4px">使い道 (${ub.length}件)</h3>${ub.slice(0, 40).map((r) => `<div>${r[0].map(pill).join("＋")} → ${r[1].map(pill).join(" ")}</div>`).join("") || "<span class='muted'>どの実験にも使われない</span>"}${ub.length > 40 ? "<div class='muted'>…ほか " + (ub.length - 40) + " 件</div>" : ""}</div></div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">作り方ツリー(展開できます)</h3>${treeNode(sel, [], 7)}</div>`;
    return h;
  }

  // ---- 依存マップ ----
  let mapState = { vb: null };
  function mapView() {
    const ids = ORDER.filter((id) => depth[id] !== undefined), maxD = Math.max(...ids.map((i) => depth[i]));
    const cols = Array.from({ length: maxD + 1 }, () => []);
    ids.forEach((id) => cols[depth[id]].push(id));
    cols.forEach((c) => c.sort((a, b) => IT[a].era - IT[b].era || ["element", "tool", "concept", "compound", "material"].indexOf(IT[a].type) - ["element", "tool", "concept", "compound", "material"].indexOf(IT[b].type) || IT[a].idx - IT[b].idx));
    const CW = 176, RH = 21, pos = {};
    cols.forEach((c, x) => c.forEach((id, y) => { pos[id] = { x: 20 + x * CW, y: 40 + y * RH }; }));
    const W = 40 + (maxD + 1) * CW, H = 60 + Math.max(...cols.map((c) => c.length)) * RH;
    // 選択中の祖先・子孫
    const anc = new Set(), desc = new Set();
    if (sel && IT[sel]) {
      (function up(x) { (SRC[x] || []).forEach((s) => s.inputs.forEach((i) => { if (!anc.has(i)) { anc.add(i); up(i); } })); })(sel);
      const down = {}; Object.keys(SRC).forEach((o) => SRC[o].forEach((s) => s.inputs.forEach((i) => { (down[i] = down[i] || new Set()).add(o); })));
      (function dn(x) { (down[x] || []).forEach((o) => { if (!desc.has(o)) { desc.add(o); dn(o); } }); })(sel);
    }
    let edges = "";
    if (sel && IT[sel]) {
      const draw = (from, to, col) => { const a = pos[from], b = pos[to]; if (!a || !b) return; const x1 = a.x + 150, y1 = a.y + 8, x2 = b.x, y2 = b.y + 8, mx = (x1 + x2) / 2; edges += `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" fill="none" stroke="${col}" stroke-width="1.2" opacity=".55"/>`; };
      [sel, ...anc].forEach((o) => (SRC[o] || []).forEach((s) => s.inputs.forEach((i) => { if (anc.has(i) || i === sel) draw(i, o, "#6aa6ff"); })));
      [sel, ...desc].forEach((i) => { Object.keys(SRC).forEach((o) => { if (desc.has(o) && SRC[o].some((s) => s.inputs.includes(i))) draw(i, o, "#ff9a5a"); }); });
    }
    let nodes = cols.map((c, x) => `<text x="${20 + x * CW}" y="24" style="fill:#e8a33d;font-weight:700">深さ ${x}</text>` + c.map((id) => {
      const p = pos[id], st = id === sel ? "#fff" : anc.has(id) ? "#6aa6ff" : desc.has(id) ? "#ff9a5a" : COL[IT[id].type], dim = sel && id !== sel && !anc.has(id) && !desc.has(id);
      return `<g class="node" data-item="${id}" opacity="${dim ? 0.28 : 1}"><rect x="${p.x}" y="${p.y}" width="150" height="17" rx="4" fill="${COL[IT[id].type]}33" stroke="${st}" stroke-width="${id === sel ? 2 : 1}"/><text x="${p.x + 5}" y="${p.y + 12.5}">${IT[id].emoji}${esc(IT[id].name).slice(0, 14)}</text></g>`;
    }).join("")).join("");
    const unreach = ORDER.filter((id) => depth[id] === undefined);
    mapState.W = W; mapState.H = H; mapState.pos = pos;
    const vb = mapState.vb || [0, 0, Math.min(W, 1400), Math.min(H, 700)];
    let h = `<div class="bar legend">${Object.entries(TYPE).map(([k, v]) => `<span><i style="background:${COL[k]}"></i>${v}</span>`).join("")}<span><i style="background:#6aa6ff"></i>選択の材料(祖先)</span><span><i style="background:#ff9a5a"></i>選択から作れるもの(子孫)</span><button data-map="fit">全体表示</button><button data-map="home">左上へ</button>${sel ? '<button data-map="goto">選択へ移動</button>' : ""}<span class="muted">ドラッグで移動・ホイールで拡大縮小・ノードをクリックで選択${sel ? " / 選択中: " + esc(nm(sel)) + " <button data-tab=\"tree\">ツリーで開く</button>" : ""}</span></div>`;
    h += `<svg id="map" viewBox="${vb.join(" ")}" preserveAspectRatio="xMinYMin meet">${edges}${nodes}</svg>`;
    if (unreach.length) h += `<p class="chip warn">深さ未計算(データ上の入手元なし。観察や実験の途中で自動的に得る概念など): ${unreach.map(nm).join("、")}</p>`;
    return h;
  }
  function wireMap() {
    const svg = document.getElementById("map"); if (!svg) return;
    let drag = null, moved = false;
    svg.addEventListener("mousedown", (e) => { moved = false; drag = { x: e.clientX, y: e.clientY, vb: svg.viewBox.baseVal ? [svg.viewBox.baseVal.x, svg.viewBox.baseVal.y, svg.viewBox.baseVal.width, svg.viewBox.baseVal.height] : null }; svg.style.cursor = "grabbing"; });
    window.addEventListener("mouseup", () => { drag = null; if (svg) svg.style.cursor = "grab"; });
    window.addEventListener("mousemove", (e) => { if (!drag || !drag.vb) return; if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) moved = true; const k = drag.vb[2] / svg.clientWidth; const vb = [drag.vb[0] - (e.clientX - drag.x) * k, drag.vb[1] - (e.clientY - drag.y) * k, drag.vb[2], drag.vb[3]]; svg.setAttribute("viewBox", vb.join(" ")); mapState.vb = vb; });
    svg.addEventListener("wheel", (e) => { e.preventDefault(); const b = svg.viewBox.baseVal, f = e.deltaY > 0 ? 1.15 : 0.87, r = svg.getBoundingClientRect(), mx = b.x + (e.clientX - r.left) / r.width * b.width, my = b.y + (e.clientY - r.top) / r.height * b.height; const vb = [mx - (mx - b.x) * f, my - (my - b.y) * f, b.width * f, b.height * f]; svg.setAttribute("viewBox", vb.join(" ")); mapState.vb = vb; }, { passive: false });
    svg.addEventListener("click", (e) => { const n = e.target.closest(".node"); if (n && !moved) { sel = n.dataset.item; render(); } });
  }

  // ---- 検証・統計 ----
  function checkView() {
    const terminal = ORDER.filter((id) => !(USED[id] || []).length && !D.START_ITEMS.includes(id));
    const special = new Set(D.SPECIAL_ITEMS || []);
    const noSrc = ORDER.filter((id) => !(SRC[id] || []).length && !special.has(id));
    const autoOnly = ORDER.filter((id) => !(SRC[id] || []).length && special.has(id));
    const multi = ORDER.filter((id) => (SRC[id] || []).length >= 3).sort((a, b) => SRC[b].length - SRC[a].length);
    const deep = ORDER.filter((id) => depth[id] !== undefined).sort((a, b) => depth[b] - depth[a]).slice(0, 15);
    const keys = {}, dups = []; D.RECIPE_ROWS.forEach((r) => { const k = [...r[0]].sort().join("+"); if (keys[k]) dups.push(k); keys[k] = 1; });
    const byType = {}; ORDER.forEach((id) => { byType[IT[id].type] = (byType[IT[id].type] || 0) + 1; });
    const withEq = D.RECIPE_ROWS.filter((r) => r[7]).length, withCond = D.RECIPE_ROWS.filter((r) => r[3]).length, withElec = D.RECIPE_ROWS.filter((r) => r[8]).length, withRep = D.RECIPE_ROWS.filter((r) => r[6]).length;
    let h = `<div>` + [["アイテム", ORDER.length], ["レシピ", D.RECIPE_ROWS.length], ["技術", D.TECHS.length], ["設備つき", withEq], ["温度等の条件つき", withCond], ["電気条件つき", withElec], ["繰り返し", withRep], ["収率モデル", Object.keys(D.YIELDS || {}).length], ["最大の深さ", Math.max(...Object.values(depth))]].map(([k, v]) => `<div class="stat">${k}<b>${v}</b></div>`).join("") + `</div>`;
    h += `<div class="card"><b>種類別</b> ` + Object.entries(byType).map(([k, v]) => `<span class="chip">${TYPE[k]} ${v}</span>`).join("") + ` <b style="margin-left:12px">時代別</b> ` + [1, 2, 3, 4].map((e) => `<span class="chip">${ERA[e]} ${ORDER.filter((i) => IT[i].era === e).length}</span>`).join("") + `</div>`;
    h += `<div class="grid2">`;
    h += `<div class="card"><h3 style="margin:0 0 6px">入手元のないアイテム <span class="chip ${noSrc.length ? "warn" : "ok"}">${noSrc.length}</span></h3>${noSrc.map(pill).join("") || "<span class='muted'>なし(すべて入手可能)</span>"}</div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">ゲーム内の処理で自動付与される概念 <span class="chip">${autoOnly.length}</span></h3>${autoOnly.map(pill).join("")}</div><div class="card"><h3 style="margin:0 0 6px">レシピのキー重複 <span class="chip ${dups.length ? "warn" : "ok"}">${dups.length}</span></h3>${dups.map(esc).join("<br>") || "<span class='muted'>なし</span>"}</div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">どこにも使われないアイテム(行き止まり) <span class="chip">${terminal.length}</span></h3>${terminal.map(pill).join("")}</div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">入手経路が3つ以上</h3>${multi.slice(0, 40).map((id) => pill(id) + `<small>×${SRC[id].length}</small>`).join(" ")}</div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">最も深いアイテム(手数の多い順)</h3>${deep.map((id) => `<div><span class="depth">${depth[id]}</span>${pill(id)}</div>`).join("")}</div>`;
    h += `</div>`;
    return h;
  }

  // ---- 技術 ----
  function techView() {
    return `<table><tr><th>技術</th><th>時代</th><th>コスト</th><th>前提(発見が必要)</th><th>入手できるもの</th><th>説明</th></tr>` + D.TECHS.map((t) => `<tr><td><b>${esc(t.name)}</b><br><small>${t.id}</small></td><td>第${t.era}期</td><td>${t.cost}pt</td><td>${t.req.map(pill).join("")}${t.reqEl ? `<span class="chip">元素${t.reqEl}個</span>` : ""}</td><td>${t.grants.map(pill).join("")}</td><td class="eq">${esc(t.desc || "")}</td></tr>`).join("") + `</table>`;
  }

  // ---- 出力 ----
  function download(name, text, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type || "text/plain" })); a.download = name; a.click(); }
  function exportData(kind) {
    if (kind === "recipes-tsv") download("recipes.tsv", ["#\t材料\t生成物\t条件\t設備\t文章"].concat(D.RECIPE_ROWS.map((r, i) => [i + 1, r[0].map(nm).join("+"), r[1].map(nm).join("、"), r[3] ? tempText(r[3]) : "", (r[7] || []).map(nm).join("・"), r[2] || ""].join("\t"))).join("\n"), "text/tab-separated-values");
    else if (kind === "recipes-json") download("recipes.json", JSON.stringify(D.RECIPE_ROWS.map((r) => ({ inputs: r[0], outputs: r[1], text: r[2], cond: r[3] || null, ratio: r[4] || null, repeat: r[6] || null, equip: r[7] || null, elec: r[8] || null })), null, 1), "application/json");
    else if (kind === "items-tsv") download("items.tsv", ["id\t名前\t種類\t時代\t深さ\t経路数"].concat(ORDER.map((id) => [id, IT[id].name, TYPE[IT[id].type], IT[id].era, depth[id] === undefined ? "" : depth[id], (SRC[id] || []).length].join("\t"))).join("\n"), "text/tab-separated-values");
  }

  // ---- 描画 ----
  function render() {
    view.innerHTML = { recipes: recipesView, items: itemsView, tree: treeView, map: mapView, check: checkView, tech: techView }[tab]();
    const on = (id, ev, fn) => { const e = document.getElementById(id); if (e) e.addEventListener(ev, fn); };
    on("q", "input", (e) => { qRec = e.target.value; const pos = e.target.selectionStart; render(); const q = document.getElementById("q"); q.focus(); q.setSelectionRange(pos, pos); });
    on("ft", "change", (e) => { fType = e.target.value; render(); }); on("oc", "change", (e) => { onlyCond = e.target.checked; render(); });
    on("qi", "input", (e) => { qItem = e.target.value; const pos = e.target.selectionStart; render(); const q = document.getElementById("qi"); q.focus(); q.setSelectionRange(pos, pos); });
    on("fit", "change", (e) => { fiType = e.target.value; render(); }); on("fie", "change", (e) => { fiEra = e.target.value; render(); });
    on("treeq", "change", (e) => { const hit = ORDER.find((id) => IT[id].name === e.target.value || id === e.target.value); if (hit) go("tree", hit); });
    if (tab === "map") wireMap();
  }
  const hash = location.hash.replace("#", "").split(":");
  if (TABS.some((t) => t[0] === hash[0])) { tab = hash[0]; if (hash[1] && IT[hash[1]]) sel = hash[1]; }
  drawNav(); render();
})();
