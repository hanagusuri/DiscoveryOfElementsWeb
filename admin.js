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
  let SAVE = null, HAVE = new Set();
  const pill = (id) => IT[id] ? `<span class="pill t-${IT[id].type}${SAVE ? (HAVE.has(id) ? " hv" : " un") : ""}" data-item="${id}" title="${esc(IT[id].desc || "")}">${IT[id].emoji} ${esc(IT[id].name)}</span>` : `<span class="pill">${esc(id)}</span>`;

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
  const TABS = [["recipes", "反応一覧"], ["items", "アイテム"], ["tree", "作り方ツリー"], ["map", "依存マップ"], ["progress", "進捗(セーブ)"], ["balance", "ポイント収支"], ["econ", "産業・収支"], ["check", "検証・統計"], ["tech", "技術"], ["equip", "設備・開放条件"]];
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
  let sortKey = "idx", sortDir = 1, lastKey = "idx", qRec = "", fType = "", onlyCond = false, fState = "";
  function recipesView() {
    const rows = D.RECIPE_ROWS.map((r, i) => ({ i, r, idx: i, depthv: Math.max(0, ...r[0].map((x) => depth[x] === undefined ? 99 : depth[x])), text: [...r[0], ...r[1]].map(nm).join(" ") }));
    let list = rows.filter((x) => (!qRec || (x.text + " " + x.r[0].join(" ") + " " + x.r[1].join(" ")).toLowerCase().includes(qRec.toLowerCase())) && (!fType || x.r[1].some((o) => IT[o] && IT[o].type === fType)) && (!onlyCond || x.r[3] || x.r[7] || x.r[8] || x.r[6]) && (!fState || recStatus(x.r) === fState));
    list.sort((a, b) => (sortKey === "depth" ? a.depthv - b.depthv : a.idx - b.idx) * sortDir);
    let h = `<div class="bar"><input type="search" id="q" placeholder="材料・生成物で検索" value="${esc(qRec)}"><select id="ft"><option value="">生成物の種類:すべて</option>${Object.entries(TYPE).map(([k, v]) => `<option value="${k}" ${fType === k ? "selected" : ""}>${v}</option>`).join("")}</select><label><input type="checkbox" id="oc" ${onlyCond ? "checked" : ""}> 条件・設備つきのみ</label>${SAVE ? `<select id="fs"><option value="">進行状況:すべて</option><option value="done" ${fState === "done" ? "selected" : ""}>発見済み</option><option value="ready" ${fState === "ready" ? "selected" : ""}>実行可(未発見)</option><option value="lack" ${fState === "lack" ? "selected" : ""}>材料不足</option></select>` : ""}<span class="muted">${list.length} / ${rows.length} 件</span><button data-export="recipes-tsv">TSV出力</button><button data-export="recipes-json">JSON出力</button></div>`;
    h += `<table><tr><th data-sort="idx">#</th><th>材料</th><th>→ 生成物</th><th>条件・設備</th><th data-sort="depth">深さ</th><th>文章</th></tr>` + list.map((x) => `<tr><td class="muted">${x.i + 1}</td><td>${x.r[0].map(pill).join("＋")}</td><td>${x.r[1].map(pill).join(" ")}</td><td>${statChip(recStatus(x.r))}${recipeInfo(x.r)}</td><td><span class="depth">${x.depthv === 99 ? "?" : x.depthv}</span></td><td class="eq">${esc(x.r[2] || "")}${x.r[5] ? `<br>⚠ ${esc(x.r[5])}` : ""}</td></tr>`).join("") + `</table>`;
    return h;
  }

  // ---- アイテム ----
  let qItem = "", fiType = "", fiEra = "", fiState = "";
  function itemsView() {
    let list = ORDER.map((id) => IT[id]).filter((x) => (!qItem || (x.name + x.id).toLowerCase().includes(qItem.toLowerCase())) && (!fiType || x.type === fiType) && (!fiEra || x.era === +fiEra) && (!fiState || (fiState === "have") === HAVE.has(x.id)));
    list.sort((a, b) => (sortKey === "depth" ? (depth[a.id] === undefined ? 999 : depth[a.id]) - (depth[b.id] === undefined ? 999 : depth[b.id]) : sortKey === "era" ? a.era - b.era : a.idx - b.idx) * sortDir);
    let h = `<div class="bar"><input type="search" id="qi" placeholder="名前・IDで検索" value="${esc(qItem)}"><select id="fit"><option value="">種類:すべて</option>${Object.entries(TYPE).map(([k, v]) => `<option value="${k}" ${fiType === k ? "selected" : ""}>${v}</option>`).join("")}</select><select id="fie"><option value="">時代:すべて</option>${[1, 2, 3, 4].map((e) => `<option value="${e}" ${fiEra == e ? "selected" : ""}>第${e}期 ${ERA[e]}</option>`).join("")}</select>${SAVE ? `<select id="fis"><option value="">進行状況:すべて</option><option value="have" ${fiState === "have" ? "selected" : ""}>発見済み</option><option value="no" ${fiState === "no" ? "selected" : ""}>未発見</option></select>` : ""}<span class="muted">${list.length} 件</span><button data-export="items-tsv">TSV出力</button></div>`;
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
      return `<g class="node" data-item="${id}" opacity="${dim ? 0.28 : (SAVE && !HAVE.has(id) ? 0.55 : 1)}"><rect x="${p.x}" y="${p.y}" width="150" height="17" rx="4" fill="${SAVE && !HAVE.has(id) ? "none" : COL[IT[id].type] + "55"}" stroke="${st}" stroke-width="${id === sel ? 2 : 1}"${SAVE && !HAVE.has(id) ? ' stroke-dasharray="3 2"' : ""}/><text x="${p.x + 5}" y="${p.y + 12.5}">${IT[id].emoji}${esc(IT[id].name).slice(0, 14)}</text></g>`;
    }).join("")).join("");
    const unreach = ORDER.filter((id) => depth[id] === undefined);
    mapState.W = W; mapState.H = H; mapState.pos = pos;
    const vb = mapState.vb || [0, 0, Math.min(W, 1400), Math.min(H, 700)];
    let h = `<div class="bar legend">${Object.entries(TYPE).map(([k, v]) => `<span><i style="background:${COL[k]}"></i>${v}</span>`).join("")}<span><i style="background:#6aa6ff"></i>選択の材料(祖先)</span>${SAVE ? "<span class=\"muted\">(点線=未発見)</span>" : ""}<span><i style="background:#ff9a5a"></i>選択から作れるもの(子孫)</span><button data-map="fit">全体表示</button><button data-map="home">左上へ</button>${sel ? '<button data-map="goto">選択へ移動</button>' : ""}<span class="muted">ドラッグで移動・ホイールで拡大縮小・ノードをクリックで選択${sel ? " / 選択中: " + esc(nm(sel)) + " <button data-tab=\"tree\">ツリーで開く</button>" : ""}</span></div>`;
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

  // ---- セーブデータ(プレイ状況)の読み込み ----
  function loadSave(obj, from) {
    if (!obj || !Array.isArray(obj.have)) { alert("セーブデータの形式が違います(have が必要)"); return; }
    SAVE = obj; HAVE = new Set(obj.have); saveFrom = from; drawSaveBar(); render();
  }
  let saveFrom = "";
  function drawSaveBar() {
    const el = document.getElementById("saveBar"); if (!el) return;
    if (!SAVE) { el.innerHTML = `<span class="bar2"><button data-save="ls">ブラウザ内のセーブを読込</button><button data-save="file">ファイルから</button><button data-save="paste">JSON貼り付け</button></span>`; return; }
    const total = ORDER.length, n = ORDER.filter((id) => HAVE.has(id)).length;
    el.innerHTML = `<span class="bar2"><span class="chip ok">セーブ読込済(${esc(saveFrom)})</span> 発見 <b>${n}</b>/${total} ・知識 <b>${SAVE.pt || 0}</b>pt${SAVE.cheat ? ' <span class="chip warn">チートON</span>' : ""} <button data-save="clear">解除</button></span>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-save]"); if (!b) return;
    const k = b.dataset.save;
    if (k === "clear") { SAVE = null; HAVE = new Set(); drawSaveBar(); render(); }
    else if (k === "file") document.getElementById("saveFile").click();
    else if (k === "paste") { const t = prompt("ゲームの「セーブデータを書き出す」で得たJSONを貼り付けてください"); if (t) { try { loadSave(JSON.parse(t), "貼り付け"); } catch (x) { alert("JSONを読めません: " + x.message); } } }
    else if (k === "ls") { try { const raw = localStorage.getItem("eod_save_v1"); if (!raw) return alert("このブラウザには、ゲームのセーブがありません。ゲームと同じ場所(同じオリジン)で開くか、「ファイルから」を使ってください。"); loadSave(JSON.parse(raw), "ブラウザ内"); } catch (x) { alert("読み込めません: " + x.message); } }
  });
  document.getElementById("saveFile").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { try { loadSave(JSON.parse(r.result), f.name); } catch (x) { alert("JSONを読めません: " + x.message); } e.target.value = ""; };
    r.readAsText(f);
  });
  function recStatus(r) {
    if (!SAVE) return "";
    if (r[1].every((o) => HAVE.has(o))) return "done";
    return [...r[0], ...(r[7] || [])].every((x) => HAVE.has(x)) ? "ready" : "lack";
  }
  const statChip = (st) => ({ done: '<span class="chip ok">発見済み</span>', ready: '<span class="chip warn">実行可(未発見)</span>', lack: '<span class="chip">材料不足</span>', "": "" })[st];

  // ---- 進捗(セーブ) ----
  function bar(n, total) { return `<div class="prog"><i style="width:${total ? (n / total * 100).toFixed(1) : 0}%"></i></div>`; }
  function progressView() {
    if (!SAVE) return `<div class="card"><h3 style="margin:0 0 6px">セーブデータを読み込んでください</h3><p class="muted">右上の「ブラウザ内のセーブを読込」(ゲームと同じ場所で開いているとき)、または、ゲームの「図鑑」タブの「セーブデータを書き出す」で得た JSON を、「ファイルから」「JSON貼り付け」で読み込みます。読み込むと、各表やマップで、未発見のものが点線・薄い色になります。</p></div>`;
    const total = ORDER.length, have = ORDER.filter((id) => HAVE.has(id));
    let h = `<div>` + [["発見", have.length + " / " + total], ["技術", (SAVE.techs || []).length + " / " + D.TECHS.length], ["知識ポイント", SAVE.pt || 0], ["事故の回数", Object.values(SAVE.acc || {}).reduce((a, b) => a + b, 0)], ["反応式の記録", Object.keys(SAVE.eqSeen || {}).length], ["自作電池", Object.keys(SAVE.cellsBuilt || {}).length]].map(([k, v]) => `<div class="stat">${k}<b>${v}</b></div>`).join("") + `</div>`;
    h += `<div class="grid2"><div class="card"><h3 style="margin:0 0 6px">種類別の発見率</h3>${Object.entries(TYPE).map(([k, v]) => { const all = ORDER.filter((i) => IT[i].type === k), n = all.filter((i) => HAVE.has(i)).length; return `<div class="bar2" style="margin:4px 0"><span style="width:60px">${v}</span>${bar(n, all.length)}<span>${n}/${all.length}</span></div>`; }).join("")}</div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">時代別の発見率</h3>${[1, 2, 3, 4].map((e) => { const all = ORDER.filter((i) => IT[i].era === e), n = all.filter((i) => HAVE.has(i)).length; return `<div class="bar2" style="margin:4px 0"><span style="width:80px">${ERA[e]}</span>${bar(n, all.length)}<span>${n}/${all.length}</span></div>`; }).join("")}</div></div>`;
    // 次に狙える
    const ready = D.RECIPE_ROWS.map((r, i) => ({ r, i })).filter((x) => recStatus(x.r) === "ready").sort((a, b) => Math.max(...a.r[0].map((q) => depth[q] || 0)) - Math.max(...b.r[0].map((q) => depth[q] || 0)));
    h += `<div class="card"><h3 style="margin:0 0 6px">今すぐ試せる未発見の実験 <span class="chip warn">${ready.length}</span></h3><small>材料と設備はそろっていて、まだ全部は発見していない実験(温度・圧力などの条件は未確認)</small>${ready.slice(0, 40).map((x) => `<div>${x.r[0].map(pill).join("＋")} → ${x.r[1].map(pill).join(" ")} ${recipeInfo(x.r)}</div>`).join("") || "<div class='muted'>なし</div>"}${ready.length > 40 ? `<div class="muted">…ほか ${ready.length - 40} 件</div>` : ""}</div>`;
    // 買える技術
    const bought = new Set(SAVE.techs || []);
    const els = have.filter((i) => IT[i].type === "element").length;
    const techs = D.TECHS.filter((t) => !bought.has(t.id));
    h += `<div class="card"><h3 style="margin:0 0 6px">未研究の技術 <span class="chip">${techs.length}</span></h3><table><tr><th>技術</th><th>コスト</th><th>前提</th><th>状態</th></tr>${techs.map((t) => { const okReq = t.req.every((i) => HAVE.has(i)) && (!t.reqEl || els >= t.reqEl), afford = (SAVE.pt || 0) >= t.cost; return `<tr><td>${esc(t.name)}</td><td>${t.cost}pt</td><td>${t.req.map(pill).join("")}${t.reqEl ? `<span class="chip">元素${t.reqEl}個(${els})</span>` : ""}</td><td>${okReq ? (afford ? '<span class="chip ok">今すぐ研究できる</span>' : '<span class="chip warn">前提OK・ポイント不足(' + (t.cost - (SAVE.pt || 0)) + ')</span>') : '<span class="chip">前提未達</span>'}</td></tr>`; }).join("")}</table></div>`;
    // 事故・収率
    const acc = Object.entries(SAVE.acc || {}), by = Object.entries(SAVE.bestY || {});
    if (acc.length || by.length) h += `<div class="grid2">${acc.length ? `<div class="card"><h3 style="margin:0 0 6px">事故の種類別</h3>${acc.map(([k, v]) => `<span class="chip warn">${k} ×${v}</span>`).join("")}</div>` : ""}${by.length ? `<div class="card"><h3 style="margin:0 0 6px">収率の自己ベスト</h3>${by.map(([k, v]) => `<div>${k.split("+").map(nm).join("+")} <span class="chip ok">${(v * 100).toFixed(0)}%</span></div>`).join("")}</div>` : ""}</div>`;
    return h;
  }

  // ---- ポイント収支 ----
  const ptOf = (id) => (D.PT_BY_TYPE[IT[id].type] || 0);
  function simulate() {
    const have = new Set(D.START_ITEMS), bought = new Set(); let pt = 0, income = 0, spent = 0; const steps = [];
    const nonTech = []; Object.keys(SRC).forEach((id) => SRC[id].forEach((s) => { if (s.kind !== "tech" && s.kind !== "start") nonTech.push({ id, s }); }));
    const elCount = () => [...have].filter((i) => IT[i] && IT[i].type === "element").length;
    for (let g = 0; g < 600; g++) {
      let progress = false;
      for (const { id, s } of nonTech) { if (have.has(id) || !s.inputs.every((i) => have.has(i))) continue; have.add(id); const p = id === "electricity" ? 0 : ptOf(id); pt += p; income += p; progress = true; }
      const avail = D.TECHS.filter((t) => !bought.has(t.id) && t.req.every((i) => have.has(i)) && (!t.reqEl || elCount() >= t.reqEl) && pt >= t.cost).sort((a, b) => a.cost - b.cost);
      if (avail.length) { const t = avail[0]; steps.push({ t, before: pt, after: pt - t.cost, income, spent: spent + t.cost, have: have.size }); pt -= t.cost; spent += t.cost; bought.add(t.id); t.grants.forEach((x) => have.add(x)); progress = true; }
      if (!progress) break;
    }
    return { steps, pt, income, spent, have, stuck: D.TECHS.filter((t) => !bought.has(t.id)) };
  }
  function balanceView() {
    const PT = D.PT_BY_TYPE, special = new Set(D.SPECIAL_ITEMS || []);
    const earn = ORDER.filter((id) => !D.START_ITEMS.includes(id) && id !== "electricity" && (SRC[id] || []).some((s) => s.kind !== "tech" && s.kind !== "start"));
    const autoOnly = ORDER.filter((id) => !(SRC[id] || []).length && special.has(id));
    const techOnly = ORDER.filter((id) => (SRC[id] || []).length && (SRC[id] || []).every((s) => s.kind === "tech"));
    const base = earn.reduce((a, id) => a + ptOf(id), 0), auto = autoOnly.reduce((a, id) => a + ptOf(id), 0);
    const bonus = [["収率の自己ベスト(10%/30%/60%)", Object.keys(D.YIELDS || {}).length * 6], ["繰り返し実験の途中経過(1回+1)", D.RECIPE_ROWS.reduce((a, r) => a + (r[6] ? r[6] - 1 : 0), 0)], ["反応式づくり(3+2+2)", (D.EQUATIONS || []).length * 7], ["計算ドリル(最大20回)", 20], ["滴定(最大8回×4)", 32], ["状態変化の観察(物質×種類, 目安)", 40]];
    const bonusTotal = bonus.reduce((a, b) => a + b[1], 0), cost = D.TECHS.reduce((a, t) => a + t.cost, 0);
    const sim = simulate();
    let h = `<div>` + [["アイテム収入", base], ["観察で得る概念", auto], ["ボーナス上限(目安)", bonusTotal], ["収入の合計", base + auto + bonusTotal], ["技術コスト合計", cost], ["余剰", base + auto + bonusTotal - cost], ["ヒント換算", Math.floor((base + auto + bonusTotal - cost) / 3) + "回"]].map(([k, v]) => `<div class="stat">${k}<b>${v}</b></div>`).join("") + `</div>`;
    h += `<p class="muted">※ 収入は「新しい物質・概念を初めて発見したときの知識ポイント(素材2・化合物/道具3・元素4・概念6)」の理論上の合計です。技術で直接手に入る素材には、ポイントが入りません(${techOnly.length}個)。事故による損失や、ヒントの消費は含みません。</p>`;
    h += `<div class="grid2"><div class="card"><h3 style="margin:0 0 6px">時代別の収支</h3><table><tr><th>時代</th><th>収入(アイテム)</th><th>技術コスト</th><th>差し引き</th></tr>${[1, 2, 3, 4].map((e) => { const inc = earn.concat(autoOnly).filter((id) => IT[id].era === e).reduce((a, id) => a + ptOf(id), 0), c = D.TECHS.filter((t) => t.era === e).reduce((a, t) => a + t.cost, 0); return `<tr><td>${ERA[e]}</td><td>${inc}</td><td>${c}</td><td>${inc - c >= 0 ? "+" : ""}${inc - c}</td></tr>`; }).join("")}</table></div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">種類別の収入</h3><table><tr><th>種類</th><th>個数</th><th>1個</th><th>合計</th></tr>${Object.entries(TYPE).map(([k, v]) => { const n = earn.concat(autoOnly).filter((id) => IT[id].type === k).length; return `<tr><td>${v}</td><td>${n}</td><td>${PT[k] || 0}</td><td>${n * (PT[k] || 0)}</td></tr>`; }).join("")}</table></div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">ボーナス(上限の目安)</h3><table>${bonus.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table></div></div>`;
    // 進行シミュレーション
    h += `<div class="card"><h3 style="margin:0 0 6px">進行シミュレーション(最も安い技術から順に研究)</h3><small>すべての実験・蒸留・自動付与を、可能になるたびに実行し、買える中で最安の技術を研究する、という進め方での、ポイントの推移。残高が小さい箇所が、ボトルネックです。</small>`;
    const steps = sim.steps, maxV = Math.max(1, ...steps.map((s) => Math.max(s.income, s.spent)));
    const W = 760, Hh = 170, L = 44, B = 22, sx = (i) => L + (steps.length > 1 ? i / (steps.length - 1) : 0) * (W - L - 10), sy = (v) => 8 + (Hh - B - 8) * (1 - v / maxV);
    const line = (k, c) => `<polyline fill="none" stroke="${c}" stroke-width="1.8" points="${steps.map((s, i) => sx(i).toFixed(1) + "," + sy(s[k]).toFixed(1)).join(" ")}"/>`;
    h += `<svg viewBox="0 0 ${W} ${Hh}" style="width:100%;max-width:${W}px;background:#0e1016;border-radius:8px;margin:8px 0"><g font-size="10" fill="#8d93a8">${[0, 0.5, 1].map((q) => `<text x="4" y="${sy(maxV * q) + 3}">${Math.round(maxV * q)}</text><line x1="${L}" x2="${W - 10}" y1="${sy(maxV * q)}" y2="${sy(maxV * q)}" stroke="#2d3348"/>`).join("")}<text x="${L}" y="${Hh - 6}">技術の研究順 →</text></g>${line("income", "#6ec1b0")}${line("spent", "#e8a33d")}<g font-size="10"><text x="${W - 150}" y="14" fill="#6ec1b0">━ 累計収入</text><text x="${W - 80}" y="14" fill="#e8a33d">━ 累計支出</text></g></svg>`;
    const minAfter = Math.min(...steps.map((s) => s.after));
    h += `<div class="bar"><span class="chip ${sim.stuck.length ? "warn" : "ok"}">研究できなかった技術 ${sim.stuck.length}</span><span class="chip">最小残高 ${minAfter}pt</span><span class="chip">最終残高 ${sim.pt}pt</span><span class="chip">到達アイテム ${[...sim.have].filter((i) => IT[i]).length} / ${ORDER.length}</span></div>`;
    h += `<table><tr><th>#</th><th>技術</th><th>コスト</th><th>購入前</th><th>購入後</th><th>累計収入</th><th>累計支出</th><th>入手済み</th></tr>${steps.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.t.name)}</td><td>${s.t.cost}</td><td>${s.before}</td><td>${s.after < 3 ? `<span class="chip warn">${s.after}</span>` : s.after}</td><td>${s.income}</td><td>${s.spent}</td><td>${s.have}</td></tr>`).join("")}</table>`;
    if (sim.stuck.length) h += `<p class="chip warn">研究できなかった: ${sim.stuck.map((t) => esc(t.name)).join("、")}</p>`;
    h += `</div>`;
    if (SAVE) {
      const spentNow = (SAVE.techs || []).reduce((a, id) => a + ((D.TECHS.find((t) => t.id === id) || { cost: 0 }).cost), 0), mine = (SAVE.pt || 0) + spentNow;
      const modelNow = ORDER.filter((id) => HAVE.has(id) && !D.START_ITEMS.includes(id) && (SRC[id] || []).some((s) => s.kind !== "tech" && s.kind !== "start")).reduce((a, id) => a + ptOf(id), 0);
      h += `<div class="card"><h3 style="margin:0 0 6px">いまのセーブとの比較</h3>現在 ${SAVE.pt || 0}pt + 研究済み技術のコスト ${spentNow}pt = <b>推定獲得 ${mine}pt</b>。発見済みアイテムからの理論収入は ${modelNow}pt。<br><small>差(${mine - modelNow}pt)は、ボーナス・ヒント・事故の損失などによるものです。</small></div>`;
    }
    return h;
  }

  // ---- 設備と開放条件 ----
  const EQUIP_NOTE = {
    thermometer: "実験室の温度が℃の数値で表示される。蒸留ダイヤルが1℃刻みになる。融点・沸点などを数値で測れる。",
    balance: "質量を正確に量る。質量保存・ファラデーの法則の実験に使う。",
    voltmeter: "電気回路の電圧を数値(V)で表示する。自作電池の起電力が数値で分かる。",
    calorimeter: "実験のたびに反応熱 ΔH を数値で表示する。「反応熱」の概念の前提。",
    ph_meter: "分析で、pHを数値で読める。",
    burette: "滴定のミニゲームに必要。",
    bunsen: "分析の炎色反応に使う。熱の安定度も上がる。",
    alembic: "蒸留パネルが使える(分離能25℃)。揮発する金属(亜鉛・水銀・リン・ヒ素)の製錬に必須。",
    fractionating_column: "蒸留の分離能が8℃になる。エタノールと水、イソブタンなどを分けられる。",
    rectification_column: "蒸留の分離能が2℃になる。液体空気のアルゴンと酸素を分けられる。",
    mortar: "粒度「粉末」が選べる。粉にしないと反応しない鉱石や、焙焼に必要。",
    pottery: "密閉・排気管が使える。加熱容器になる。窯・蒸留器など多くの設備の材料。",
    pressure_vessel: "圧力 10気圧が選べる。容器の破裂(密閉でガスが出る反応)を防ぐ。",
    compressor: "圧力 100気圧が選べる。ハーバー法などの高圧反応に必須。",
    high_pressure_reactor: "圧力 300気圧が選べる。",
    goggles: "保護具(着用で効く): 薬傷・中毒・真空管の内破・激しい発熱の被害を軽減する。",
    gloves: "保護具(着用で効く): 薬傷・中毒・感電(36V以上)を軽減する。",
    respirator: "保護具(着用で効く): 有毒ガス・粉じんを軽減する。",
    fume_hood: "換気「ドラフト」が選べる。有毒ガス・中毒を完全に防ぐ。",
    blast_shield: "(持っていれば自動)爆発・容器破裂・真空管の内破の重さを軽減する。",
    lead_shield: "(持っていれば自動)被曝(放射性物質)を完全に防ぐ。",
    fire_bucket: "(持っていれば自動)火災・自然発火の被害の重さを軽減する。",
    ice: "冷却「氷水(0℃)」が選べる。",
    freezing_mixture: "冷却「寒剤(−20℃)」が選べる。",
    liquid_air: "冷却「液体空気(−190℃)」が選べる。蒸留で成分を取り出せる。",
    refrigerator: "空気の液化に必要。極低温技術の設備。",
    cyclotron: "人工元素(テクネチウム〜オガネソン)の合成に必須。",
    spectroscope: "希土類・タリウムなどの発見に必須。分離効率+25%。",
    microscope: "細胞・微生物の観察、光学分割に必須。分離効率+25%。",
    centrifuge: "分離効率+50%(分別結晶の繰り返し回数が減る)。",
    filter: "沈殿をろ過して分け取る(白金族・放射性元素の分離に必須)。",
    pneumatic_trough: "気体が発生する実験(水素・CO₂・酸素・アンモニアなど)に必須。",
    glass_flask: "強酸(硫酸・塩酸・硝酸・王水)の調合に必須。ガラス器具の基本。",
    eudiometer: "水素と酸素の化合による水の合成に必須。",
    vacuum_pump: "真空管の製作に必須。",
    arc_furnace: "温度段階「電気アーク(3000℃〜)」が使える。",
  };
  function equipView() {
    const T = D.TEMPS, P = D.PRESS_LEVELS;
    const set = new Set();
    ORDER.forEach((id) => { if (IT[id].type === "tool") set.add(id); });
    [1, 2, 3, 4, 5].forEach((i) => { if (T[i].need) set.add(T[i].need); });
    set.add(D.SEAL_NEED); set.add("mortar");
    P.forEach((l) => { if (l.need) set.add(l.need); });
    (D.COOL_NEED || []).forEach((n) => { if (n) set.add(n); });
    Object.keys(D.SOURCES || {}).forEach((k) => set.add(k));
    Object.keys(D.EQUIP_STAB || {}).forEach((k) => set.add(k)); Object.keys(D.EQUIP_EFF || {}).forEach((k) => set.add(k));
    ["goggles", "gloves", "respirator", "fume_hood", "blast_shield", "lead_shield", "fire_bucket", "ice", "freezing_mixture", "liquid_air"].forEach((k) => IT[k] && set.add(k));
    // その設備を必須とするレシピ
    const gate = {}, addG = (id, i, why) => { (gate[id] = gate[id] || []).push({ i, why }); };
    D.RECIPE_ROWS.forEach((r, i) => {
      (r[7] || []).forEach((e) => addG(e, i, "設備"));
      r[0].forEach((x) => { if (set.has(x) && IT[x].type === "tool") addG(x, i, "材料"); });
      const c = r[3];
      if (c) { if (c.t && c.t[0] >= 3 && T[c.t[0]].need) addG(T[c.t[0]].need, i, "温度"); if (c.sealed === true) addG(D.SEAL_NEED, i, "密閉"); if (c.fine) addG("mortar", i, "粉末"); }
    });
    const eff = (id) => {
      const out = [];
      [1, 2, 3, 4, 5].forEach((i) => { if (T[i].need === id) out.push(`温度段階「${T[i].name}」(${T[i].c})`); });
      if (id === D.SEAL_NEED) out.push("容器: 密閉・排気管");
      P.forEach((l) => { if (l.need === id) out.push(`圧力 ${l.p}気圧`); });
      (D.COOL_NEED || []).forEach((n, i) => { if (n === id) out.push(`冷却「${D.COOL_NAME[i]}」(${D.COOL_C[i]}℃)`); });
      const s = (D.SOURCES || {})[id]; if (s) out.push(`電源: ${s.perCell ? s.perCell + "V×最大" + s.maxCells + "セル" : "1〜" + s.maxV + "V可変"} / 電流${["", "弱", "安定", "大"][s.level]} / 電圧の揺らぎ${(s.drift * 100).toFixed(0)}%`);
      if ((D.EQUIP_STAB || {})[id]) out.push(`熱の安定度 +${Math.round(D.EQUIP_STAB[id] * 100)}%`);
      if ((D.EQUIP_EFF || {})[id]) out.push(`分離効率 +${Math.round(D.EQUIP_EFF[id] * 100)}%`);
      if ((D.BREAKABLE || []).includes(id)) out.push("事故で壊れる(作り直せる)");
      return out;
    };
    const rows = [...set].filter((id) => IT[id]).sort((a, b) => (depth[a] === undefined ? 99 : depth[a]) - (depth[b] === undefined ? 99 : depth[b]) || IT[a].idx - IT[b].idx);
    // ---- 段階ごとの開放表 ----
    const needPill = (n) => (n ? pill(n) : '<span class="chip ok">初期から</span>');
    let h = `<p class="muted">設備(道具・装置)の、作り方(開放条件)と、持つと何ができるようになるか(効果)、どのレシピに必須か、の一覧です。</p>`;
    h += `<div class="grid2">`;
    h += `<div class="card"><h3 style="margin:0 0 6px">温度段階の開放</h3><table><tr><th>段階</th><th>温度</th><th>開放条件</th><th>下限として必須のレシピ</th></tr>${[1, 2, 3, 4, 5].map((i) => `<tr><td>${T[i].name}</td><td>${T[i].c}</td><td>${needPill(T[i].need)}</td><td>${D.RECIPE_ROWS.filter((r) => r[3] && r[3].t && r[3].t[0] === i).length}件</td></tr>`).join("")}</table></div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">圧力段階の開放</h3><table><tr><th>圧力</th><th>開放条件</th></tr>${P.map((l) => `<tr><td>${l.p}気圧</td><td>${needPill(l.need)}</td></tr>`).join("")}</table></div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">冷却段階の開放</h3><table><tr><th>冷却</th><th>温度</th><th>開放条件</th></tr>${D.COOL_NAME.map((n, i) => `<tr><td>${n}</td><td>${D.COOL_C[i]}℃</td><td>${needPill(D.COOL_NEED[i])}</td></tr>`).join("")}</table></div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">電源の種類</h3><table><tr><th>電源</th><th>電圧</th><th>電流</th><th>揺らぎ</th><th>入手</th></tr>${Object.entries(D.SOURCES).map(([id, s]) => `<tr><td>${pill(id)}</td><td>${s.perCell ? s.perCell + "V×" + s.maxCells : "〜" + s.maxV + "V"}</td><td>${["", "弱", "安定", "大"][s.level]}</td><td>${(s.drift * 100).toFixed(0)}%</td><td class="eq">${((SRC[id] || []).filter((q) => q.kind !== "start")[0] || { text: "—" }).text}</td></tr>`).join("")}</table></div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">蒸留の分離能</h3><table><tr><th>装置</th><th>分けられる沸点差</th><th>開放条件</th></tr><tr><td>${pill("alembic")}</td><td>25℃以上</td><td class="eq">${((SRC.alembic || [])[0] || { text: "" }).text}</td></tr><tr><td>${pill("fractionating_column")}</td><td>8℃以上</td><td class="eq">${((SRC.fractionating_column || [])[0] || { text: "" }).text}</td></tr><tr><td>${pill("rectification_column")}</td><td>2℃以上</td><td class="eq">${((SRC.rectification_column || [])[0] || { text: "" }).text}</td></tr></table></div>`;
    h += `</div>`;
    // ---- 設備の一覧 ----
    h += `<div class="card"><h3 style="margin:0 0 6px">設備一覧 <span class="chip">${rows.length}</span></h3><table><tr><th>設備</th><th>深さ</th><th>開放条件(作り方・入手)</th><th>効果・開放するもの</th><th>必須とするレシピ</th></tr>` + rows.map((id) => {
      const src = (SRC[id] || []).filter((q) => q.kind !== "start");
      const cond = id && D.START_ITEMS.includes(id) ? '<span class="chip ok">初期から</span>' : src.map((q) => {
        if (q.kind === "recipe") { const r = D.RECIPE_ROWS[q.idx]; return `<div>${r[0].map(pill).join("＋")} ${recipeInfo(r)}</div>`; }
        return `<div class="eq">${esc(q.text)}</div>`;
      }).join("") || '<span class="chip warn">入手元なし</span>';
      const tools = uniq(src.flatMap((q) => q.inputs)).filter((x) => set.has(x) && x !== id);
      const e = eff(id), note = EQUIP_NOTE[id];
      const g = gate[id] || [], gi = uniq(g.map((x) => x.i));
      const why = {}; g.forEach((x) => { why[x.why] = (why[x.why] || 0) + 1; });
      return `<tr><td>${pill(id)}<br><small>${TYPE[IT[id].type]}・第${IT[id].era}期</small></td><td><span class="depth">${depth[id] === undefined ? "?" : depth[id]}</span></td><td>${cond}${tools.length ? `<div class="eq">前提設備: ${tools.map(pill).join("")}</div>` : ""}</td><td>${e.map((x) => `<span class="chip ok">${esc(x)}</span>`).join("")}${note ? `<div class="eq">${esc(note)}</div>` : ""}${!e.length && !note ? '<span class="muted">—</span>' : ""}</td><td>${gi.length ? `<details style="margin:0"><summary>${gi.length}件 <small>(${Object.entries(why).map(([k, v]) => k + v).join("・")})</small></summary>${gi.slice(0, 30).map((i) => `<div class="eq">${D.RECIPE_ROWS[i][0].map(nm).join("+")} → ${D.RECIPE_ROWS[i][1].map(nm).join("、")}</div>`).join("")}${gi.length > 30 ? `<div class="muted">…ほか${gi.length - 30}件</div>` : ""}</details>` : '<span class="muted">—</span>'}</td></tr>`;
    }).join("") + `</table></div>`;
    return h;
  }

  // ---- 産業・収支 ----
  const ec = { era: 3, eng: 0, sales: 0, sec: "", onlyProfit: true, sort: "profit", months: 36 };
  function econView() {
    const EC = D.ECON; if (!EC) return "<p>elements_econ.js が読み込まれていません。</p>";
    const press = D.PRESS_LEVELS.filter((l) => !l.need || (IT[l.need] && IT[l.need].era <= ec.era)).map((l) => l.p);
    const ctx = { era: ec.era, eng: ec.eng, sales: ec.sales, idx: () => 1, press };
    const ids = EC.available(ec.era);
    let rows = ids.map((id) => { const m = D.marketOf(id), p1 = EC.plan(id, 1, ctx), p3 = EC.plan(id, 3, ctx); return { id, m, p1, p3, c1: EC.buildCost(id, 1), c3: EC.buildCost(id, 3), pb: p1.profit > 0 ? EC.buildCost(id, 1) / p1.profit : Infinity, uc: EC.unitCost(id), pr: EC.price(id, ctx), dem: EC.demand(id, ec.era), yi: p1.yi }; });
    const all = rows.length;
    if (ec.sec) rows = rows.filter((r) => r.m.sec === ec.sec);
    if (ec.onlyProfit) rows = rows.filter((r) => r.p1.profit > 0);
    rows.sort((a, b) => (ec.sort === "pb" ? a.pb - b.pb : ec.sort === "cost" ? a.c1 - b.c1 : b.p1.profit - a.p1.profit));
    const sim = EC.simulate(ec.era, ec.months, { eng: ec.eng, sales: ec.sales }), hs = sim.hist;
    const prof = ids.filter((id) => EC.plan(id, 1, ctx).profit > 0).length;
    const secSum = Object.entries(D.SECTORS).map(([k, v]) => { const L = ids.filter((id) => D.marketOf(id).sec === k); const pf = L.filter((id) => EC.plan(id, 1, ctx).profit > 0); return `<tr><td>${v.emoji}${v.name}</td><td>${L.length}</td><td>${pf.length}</td><td>${_D_mul(k)}</td></tr>`; }).join("");
    function _D_mul(k) { return "×" + D.SECTOR_ERA[k][ec.era - 1]; }
    const opt = (v, cur, label) => `<option value="${v}" ${String(cur) === String(v) ? "selected" : ""}>${label}</option>`;
    let h = `<p class="muted">産業(工場・市場)のバランス確認用です。時代・人員を変えて、各品目の、収益性と、投資の回収期間を見られます。ノーマルモードの調整に使います。(景気の変動は、平均値の1.0で計算)</p>`;
    h += `<div class="bar"><label>時代 <select data-econ="era">${[1, 2, 3, 4].map((e) => opt(e, ec.era, "第" + e + "期 " + D.ERAS[e].name)).join("")}</select></label>` +
      `<label>技師 <select data-econ="eng">${[0, 1, 2, 3, 5].map((n) => opt(n, ec.eng, n + "人")).join("")}</select></label><label>営業 <select data-econ="sales">${[0, 1, 2, 3, 5].map((n) => opt(n, ec.sales, n + "人")).join("")}</select></label>` +
      `<label>業界 <select data-econ="sec"><option value="">すべて</option>${Object.entries(D.SECTORS).map(([k, v]) => opt(k, ec.sec, v.name)).join("")}</select></label>` +
      `<label>並び <select data-econ="sort">${opt("profit", ec.sort, "月益(大きい順)")}${opt("pb", ec.sort, "回収月数(短い順)")}${opt("cost", ec.sort, "建設費(安い順)")}</select></label>` +
      `<label><input type="checkbox" data-econ="onlyProfit" ${ec.onlyProfit ? "checked" : ""}> 黒字のみ</label></div>`;
    h += `<div><span class="stat"><b>${all}</b>建てられる品目</span><span class="stat"><b>${prof}</b>黒字(工房)</span><span class="stat"><b>${hs[hs.length - 1].plants}</b>${ec.months}か月後の工場数</span><span class="stat"><b>${hs[hs.length - 1].net.toLocaleString()}G</b>${ec.months}か月後の月収</span></div>`;
    h += `<div class="grid2"><div class="card"><h3 style="margin:0 0 6px">投資シミュレーション(初期資金 ${D.GOLD_START}G・毎月4品目を発見・最良の投資を繰り返す)</h3><table><tr><th>月</th><th>資金</th><th>月収</th><th>工場</th></tr>${[3, 6, 12, 18, 24, 36].filter((m) => m <= hs.length).map((m) => { const x = hs[m - 1]; return `<tr><td>${m}</td><td>${x.gold.toLocaleString()}G</td><td>${x.net.toLocaleString()}G</td><td>${x.plants}</td></tr>`; }).join("")}</table></div>` +
      `<div class="card"><h3 style="margin:0 0 6px">業界ごと</h3><table><tr><th>業界</th><th>品目</th><th>黒字</th><th>この時代の需要倍率</th></tr>${secSum}</table></div></div>`;
    h += `<div class="card"><h3 style="margin:0 0 6px">品目別の収支(月) <span class="chip">${rows.length}</span></h3><table><tr><th>品目</th><th>業界</th><th>単価</th><th>原価</th><th>月の需要</th><th>収率</th><th>工房 建設費</th><th>工房 月益</th><th>回収(月)</th><th>大工場 月益</th><th>必要設備</th></tr>` +
      rows.slice(0, 400).map((r) => `<tr><td>${pill(r.id)}</td><td>${D.SECTORS[r.m.sec].name}</td><td>${r.pr.toFixed(1)}</td><td>${r.uc.toFixed(1)}</td><td>${r.dem}</td><td>${r.yi ? (r.yi.yf * 100).toFixed(0) + "%" + (r.yi.low ? ' <span class="chip warn">低</span>' : "") : "—"}</td><td>${r.c1.toLocaleString()}</td><td>${Math.round(r.p1.profit).toLocaleString()}</td><td>${isFinite(r.pb) ? r.pb.toFixed(1) : "—"}</td><td>${Math.round(r.p3.profit).toLocaleString()}</td><td class="eq">${EC.needs(r.id).map(nm).join("・") || "—"}</td></tr>`).join("") + `</table>${rows.length > 400 ? `<p class="muted">…ほか${rows.length - 400}件</p>` : ""}</div>`;
    return h;
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
    view.innerHTML = { recipes: recipesView, items: itemsView, tree: treeView, map: mapView, progress: progressView, balance: balanceView, econ: econView, check: checkView, tech: techView, equip: equipView }[tab]();
    const on = (id, ev, fn) => { const e = document.getElementById(id); if (e) e.addEventListener(ev, fn); };
    on("q", "input", (e) => { qRec = e.target.value; const pos = e.target.selectionStart; render(); const q = document.getElementById("q"); q.focus(); q.setSelectionRange(pos, pos); });
    on("ft", "change", (e) => { fType = e.target.value; render(); }); on("fs", "change", (e) => { fState = e.target.value; render(); }); on("fis", "change", (e) => { fiState = e.target.value; render(); }); on("oc", "change", (e) => { onlyCond = e.target.checked; render(); });
    on("qi", "input", (e) => { qItem = e.target.value; const pos = e.target.selectionStart; render(); const q = document.getElementById("qi"); q.focus(); q.setSelectionRange(pos, pos); });
    on("fit", "change", (e) => { fiType = e.target.value; render(); }); on("fie", "change", (e) => { fiEra = e.target.value; render(); });
    on("treeq", "change", (e) => { const hit = ORDER.find((id) => IT[id].name === e.target.value || id === e.target.value); if (hit) go("tree", hit); });
    document.querySelectorAll("[data-econ]").forEach((e) => e.addEventListener("change", () => { const k = e.dataset.econ; ec[k] = e.type === "checkbox" ? e.checked : (isNaN(+e.value) || e.value === "" ? e.value : +e.value); if (k === "sort" || k === "sec") ec[k] = e.value; render(); }));
    if (tab === "map") wireMap();
  }
  const hash = location.hash.replace("#", "").split(":");
  if (TABS.some((t) => t[0] === hash[0])) { tab = hash[0]; if (hash[1] && IT[hash[1]]) sel = hash[1]; }
  drawNav(); drawSaveBar();
  try { const raw = localStorage.getItem("eod_save_v1"); if (raw) { const o = JSON.parse(raw); if (o && Array.isArray(o.have)) loadSave(o, "ブラウザ内(自動)"); else render(); } else render(); } catch (e) { render(); }
})();
