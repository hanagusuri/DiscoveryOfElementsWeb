// 用語集・復習・学習の進み具合(化学タブのサブタブ)。notebookui.js の後、game.js の前に読み込む。
(function () {
  "use strict";
  const base = window.EODX; if (!base) return;
  let api = null;
  const D = () => api.DATA, S = () => api.S(), has = (id) => api.has(id) || S().cheat, real = (id) => api.has(id), items = () => api.items;
  const n0 = base.subs.length;
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const H = () => { const s = S(); if (!s.hh) s.hh = { read: {}, solved: {}, ok: 0, tot: 0 }; if (!s.hh.gl) s.hh.gl = {}; if (!s.hh.glm) s.hh.glm = {}; if (!s.hh.mj) s.hh.mj = {}; if (!s.hh.mj2) s.hh.mj2 = {}; if (!s.hh.myth) s.hh.myth = {}; if (!s.hh.replay) s.hh.replay = {}; return s.hh; };
  const CATS = [["concept", "概念", "💡"], ["element", "元素", "⚛️"], ["compound", "化合物", "🧪"], ["material", "素材", "🪨"], ["tool", "道具", "🔧"]];
  const CAT = Object.fromEntries(CATS.map((c) => [c[0], c]));
  const st = { q: "", era: 0, cat: "all", limit: 60, rv: null, ans: null, sess: null, rcat: "all" };

  // ---- 用語(概念・元素・化合物・素材・道具) ----
  const termsAll = (cat) => D().ITEM_ROWS.filter((r) => CAT[r[3]] && r[5] && (cat === "all" || r[3] === cat) && has(r[0])).map((r) => ({ id: r[0], name: r[1], emoji: r[2], type: r[3], era: r[4], desc: r[5], note: r[6] || "", sym: r[7] || "" }));
  const stat = (id) => H().gl[id] || { box: 0, ok: 0, ng: 0 };
  const isWeak = (id) => { const x = H().gl[id]; return !!(x && x.ng > 0 && x.box < 2); };
  const stars = (id) => { const x = H().gl[id]; return x ? "★".repeat(x.box) + "☆".repeat(3 - x.box) : "☆☆☆"; };
  const firstSentence = (d) => { const s = d.split("。")[0]; return (s.length > 56 ? s.slice(0, 56) + "…" : s) + "。"; };
  const mask = (d, name) => { let t = d; [name, (name || "").replace(/\(.*?\)/g, "")].filter(Boolean).forEach((n) => { t = t.split(n).join("○○"); }); return t; };
  const histOf = (id) => { const r = D().ITEM_ROWS.find((x) => x[0] === id); return r && r[6] && /(約\d+年前|\d{3,4}年)/.test(r[6]) ? r[6] : ""; };
  const formulaOf = (id) => (D().FORMULAS && D().FORMULAS[id]) || "";
  const useOf = (id) => { const u = D().usesFor ? D().usesFor(id, S().maxEra || 1) : null; return u ? u.now : (D().USES && D().USES[id]) || ""; };
  const links = (t) => `<div class="nblinks"><button data-go="codex" data-v="${t.id}">📖 図鑑で</button>${window.HIST && HIST.hasYear(t.id) ? `<button data-go="hist" data-v="${t.id}">🕰️ 年表で</button>` : ""}${t.type === "element" ? '<button data-go="tab" data-v="table">⚛️ 周期表で</button>' : ""}</div>`;

  // ---- 用語集 ----
  function glossary() {
    const all = termsAll("all"), T = termsAll(st.cat), eras = [...new Set(all.map((t) => t.era))].sort();
    const q = st.q.trim().toLowerCase();
    const list = T.filter((t) => (!st.era || t.era === st.era) && (!q || (t.name + t.desc + t.sym + formulaOf(t.id)).toLowerCase().includes(q))).sort((a, b) => a.era - b.era || a.name.localeCompare(b.name, "ja"));
    const weak = all.filter((t) => isWeak(t.id)).length, mast = all.filter((t) => stat(t.id).box >= 3).length;
    let h = `<p class="lead">これまでに出会った、概念・元素・化合物・素材・道具の一覧です。(${all.length}語・習得 ${mast}語・苦手 ${weak}語) 「復習」で、確認問題に挑戦できます。</p>`;
    h += `<div class="chips msub"><button data-sg="cat" data-v="all" class="${st.cat === "all" ? "on" : ""}">すべて ${all.length}</button>` + CATS.map(([k, n, e]) => `<button data-sg="cat" data-v="${k}" class="${st.cat === k ? "on" : ""}">${e}${n} ${all.filter((t) => t.type === k).length}</button>`).join("") + `</div>`;
    h += `<div class="bar"><input type="search" id="glq" placeholder="名前・説明・記号・化学式で検索" value="${esc(st.q)}" style="min-width:200px"> <select id="gle"><option value="0">すべての時代</option>${eras.map((e) => `<option value="${e}" ${st.era === e ? "selected" : ""}>第${e}期 ${esc(D().ERAS[e] ? D().ERAS[e].name : "")}</option>`).join("")}</select> <span class="muted">${list.length}語</span></div>`;
    h += list.slice(0, st.limit).map((t) => {
      const f = t.type === "element" ? t.sym : formulaOf(t.id), u = t.type === "concept" || t.type === "tool" ? "" : useOf(t.id);
      return `<div class="cx" id="gl-${t.id}"><div class="e">${t.emoji}</div><div><h4>${esc(t.name)} <small>${CAT[t.type][1]}${f ? "・" + esc(f) : ""}・第${t.era}期 ${stars(t.id)}${isWeak(t.id) ? " ⚠️苦手" : ""}</small></h4><p>${esc(t.desc)}</p>${u ? `<p class="use">🏭 用途: ${esc(u)}</p>` : ""}${t.note ? `<p class="how">${esc(t.note)}</p>` : ""}${links(t)}</div></div>`;
    }).join("") || '<p class="lead">一致する用語が、ありません。</p>';
    if (list.length > st.limit) h += `<div class="ind-row"><button data-sg="more">さらに、${Math.min(60, list.length - st.limit)}語 表示する</button></div>`;
    return h;
  }

  // ---- 復習(ライトナー式: 間違えた用語は、よく出る) ----
  function pick(T) {
    const w = (t) => { const x = H().gl[t.id]; const b = !x ? 5 : [6, 3, 2, 1][x.box]; return b * (x && x.ng > x.ok ? 2 : 1); };
    const sum = T.reduce((a, t) => a + w(t), 0); let r = Math.random() * sum;
    for (const t of T) { r -= w(t); if (r <= 0) return t; }
    return T[T.length - 1];
  }
  const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
  function makeQ(cat, weakOnly) {
    const T = termsAll(cat); if (T.length < 4) return null;
    const cand = weakOnly ? T.filter((x) => isWeak(x.id)) : T, t = pick(cand.length ? cand : T);
    const same = T.filter((x) => x.id !== t.id && x.type === t.type), pool0 = same.length >= 3 ? same : T.filter((x) => x.id !== t.id);
    const near = shuffle(pool0.filter((x) => Math.abs(x.era - t.era) <= 1)), far = shuffle(pool0);
    const pool = [...near, ...far].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i);
    const types = ["def", "term"];
    if (t.type === "element" && t.sym) types.push("sym", "sym");
    if (t.type === "compound" && formulaOf(t.id) && formulaOf(t.id).length <= 22) types.push("formula", "formula");
    if (["element", "compound", "material"].includes(t.type) && useOf(t.id)) types.push("use");
    const type = types[Math.floor(Math.random() * types.length)], opt = (x) => ({ id: x.id, label: x.emoji + " " + x.name }), nm3 = shuffle([t, ...pool.slice(0, 3)]).map(opt);
    if (type === "sym") return { type, t, prompt: "元素記号が、これになる元素は?", text: t.sym, opts: nm3, ans: t.id };
    if (type === "formula") return { type, t, prompt: "化学式が、これになる物質は?", text: formulaOf(t.id), opts: nm3, ans: t.id };
    if (type === "use") return { type, t, prompt: "次の用途に、使われる物質は?", text: mask(useOf(t.id), t.name), opts: nm3, ans: t.id };
    if (type === "def") return { type, t, prompt: "この説明に、あてはまる用語は?", text: mask(t.desc, t.name), opts: nm3, ans: t.id };
    const ds = pool.filter((x) => firstSentence(x.desc) !== firstSentence(t.desc)).slice(0, 3);
    return { type, t, prompt: "この用語の、意味は?", text: t.emoji + " " + t.name, opts: shuffle([t, ...ds]).map((x) => ({ id: x.id, label: firstSentence(mask(x.desc, x.name === t.name ? "" : x.name)) })), ans: t.id };
  }
  function review() {
    const all = termsAll("all");
    let h = `<p class="lead">用語の復習です。間違えた用語は、よく出てきます。3回、続けて正解すると、習得(★★★)です。習得するたびに、知識+1。</p>`;
    if (all.length < 4) return h + '<p class="lead">🔒 用語が、4つ以上、必要です。</p>';
    const weak = all.filter((t) => isWeak(t.id)).sort((a, b) => stat(b.id).ng - stat(a.id).ng);
    h += `<div class="ind-top"><div class="stat"><small>用語</small><b>${all.length}</b></div><div class="stat"><small>習得(★★★)</small><b>${all.filter((t) => stat(t.id).box >= 3).length}</b></div><div class="stat"><small>苦手</small><b>${weak.length}</b></div></div>`;
    if (!st.sess) {
      h += `<div class="chips msub"><span class="muted" style="align-self:center">出題の範囲:</span><button data-sg="rcat" data-v="all" class="${st.rcat === "all" ? "on" : ""}">すべて</button>` + CATS.map(([k, n, e]) => `<button data-sg="rcat" data-v="${k}" class="${st.rcat === k ? "on" : ""}" ${termsAll(k).length < 4 ? "disabled" : ""}>${e}${n}</button>`).join("") + `</div>`;
      h += `<div class="ind-row"><button class="primary" data-sg="start" data-n="10">10問で、復習する</button>${weak.length ? `<button data-sg="start" data-n="5" data-weak="1">苦手な用語だけ(5問)</button>` : ""}</div>`;
      if (weak.length) h += `<h3 class="sec">⚠️ 苦手な用語</h3>` + weak.slice(0, 8).map((t) => `<div class="cx"><div class="e">${t.emoji}</div><div><h4>${esc(t.name)} <small>${CAT[t.type][1]}・間違い ${stat(t.id).ng}回</small></h4><p>${esc(firstSentence(t.desc))}</p>${links(t)}</div></div>`).join("");
      if (st.last) h += `<div class="why use"><b>前回の結果</b><p>${st.last.ok} / ${st.last.n} 問 正解</p></div>`;
      return h;
    }
    const s = st.sess;
    if (s.n >= s.total) { st.last = { ok: s.ok, n: s.n }; st.sess = null; st.rv = null; st.ans = null; return review(); }
    if (!st.rv) st.rv = makeQ(st.rcat, s.weakOnly);
    const q = st.rv; if (!q) return h;
    h += `<p class="muted">第 ${s.n + 1} 問 / ${s.total}問(正解 ${s.ok})</p><div class="why"><b>${esc(q.prompt)}</b><p>${esc(q.text)}</p></div><div class="ind-col">` +
      q.opts.map((o) => { const cls = st.ans === null ? "" : o.id === q.ans ? "primary" : o.id === st.ans ? "warnb" : ""; return `<button class="${cls} gl-opt" data-sg="ans" data-v="${o.id}" ${st.ans !== null ? "disabled" : ""}>${esc(o.label)}</button>`; }).join("") + `</div>`;
    if (st.ans !== null) {
      const t = q.t, ok = st.ans === q.ans, f = t.type === "element" ? t.sym : formulaOf(t.id);
      h += `<div class="why"><b>${ok ? "✅ 正解!" : "❌ 残念"}</b><p>${t.emoji} <b>${esc(t.name)}</b>${f ? "(" + esc(f) + ")" : ""}: ${esc(t.desc)}</p>${histOf(t.id) ? `<p class="muted">🕰️ ${esc(histOf(t.id))}</p>` : ""}${links(t)}</div><button class="primary" data-sg="next">${s.n + 1 >= s.total ? "結果を見る" : "次の問題"}</button>`;
    }
    return h;
  }
  function record(q, chosen) {
    const hh = H(), x = (hh.gl[q.t.id] = hh.gl[q.t.id] || { box: 0, ok: 0, ng: 0 }), ok = chosen === q.ans;
    if (ok) { x.ok++; x.box = Math.min(3, x.box + 1); if (x.box >= 3 && !hh.glm[q.t.id]) { hh.glm[q.t.id] = 1; S().pt += 1; api.toast(`🎓 「${q.t.name}」を習得! 知識 +1`); } }
    else { x.ng++; x.box = 0; }
    return ok;
  }

  // ---- 学習の進み具合 ----
  const bar = (a, b, label) => `<div class="prow"><div class="plabel">${label}</div><div class="pbar"><i style="width:${b ? Math.min(100, a / b * 100).toFixed(1) : 0}%"></i></div><div class="pnum">${a} / ${b}</div></div>`;
  function progress() {
    const hh = H(), s = S(), R = D().REPLAYS || [], M = D().MYTHS || [], EP = D().EPISODES || [], P = D().PEOPLE || [];
    const byType = (ty) => D().ITEM_ROWS.filter((r) => r[3] === ty && r[5]);
    const got = (ty) => byType(ty).filter((r) => real(r[0])).length;
    const hs = window.HIST && HIST.stats ? HIST.stats() : { events: { got: 0, total: 0 }, people: { got: 0, total: P.length }, episodes: { unlocked: 0, total: EP.length } };
    const allTerms = D().ITEM_ROWS.filter((r) => CAT[r[3]] && r[5] && real(r[0]));
    const mast = allTerms.filter((r) => stat(r[0]).box >= 3), weak = allTerms.filter((r) => isWeak(r[0]));
    const readEp = EP.filter((e) => hh.read[e.id]).length, mythFix = M.filter((m) => hh.myth[m.id]).length, mythJ = M.filter((m) => hh.mj2[m.id]).length;
    const obsTotal = M.reduce((a, m) => a + (m.obs ? m.obs.length : 0), 0), obsOk = M.reduce((a, m) => a + Object.keys(hh.mj[m.id] || {}).length, 0);
    const repDone = R.filter((r) => hh.replay[r.id]).length, repStars = R.reduce((a, r) => a + (hh.replay[r.id] ? hh.replay[r.id].stars : 0), 0);
    const jr = s.jr || [];
    let h = `<p class="lead">学んだことの、進み具合です。${s.cheat ? "(チートモード中も、実際に自分で、発見・達成したものだけを、数えます)" : ""}</p>`;
    // 総合
    const total = allTerms.length + readEp + mythFix + mythJ + repDone, goal = D().ITEM_ROWS.filter((r) => CAT[r[3]] && r[5]).length + EP.length + M.length * 2 + R.length;
    h += `<div class="ind-top"><div class="stat"><small>発見した物質・知識</small><b>${allTerms.length}</b></div><div class="stat"><small>習得した用語</small><b>${mast.length}</b></div><div class="stat"><small>読んだ転換点</small><b>${readEp}/${EP.length}</b></div><div class="stat"><small>達成した追体験</small><b>${repDone}/${R.length}</b></div></div>`;
    h += `<div class="why"><b>🏁 総合の進み具合</b>${bar(total, goal, "全体")}</div>`;
    // 発見
    h += `<h3 class="sec">🔎 発見したもの</h3>` + CATS.map(([k, n, e]) => bar(got(k), byType(k).length, `${e} ${n}`)).join("") + bar(hs.events.got, hs.events.total, "🕰️ 年表の発見");
    // 用語
    const byCat = CATS.map(([k, n, e]) => `${e}${n} ${mast.filter((r) => r[3] === k).length}`).join(" / ");
    h += `<h3 class="sec">🎓 習得した用語</h3>` + bar(mast.length, allTerms.length, "習得(★★★)") + `<p class="muted">内訳: ${byCat}</p>`;
    h += mast.length ? `<p>${mast.slice(-24).map((r) => `<span class="chip ok">${r[2]}${esc(r[1])}</span>`).join("")}${mast.length > 24 ? `<span class="muted"> …ほか${mast.length - 24}語</span>` : ""}</p>` : '<p class="muted">まだ、習得した用語は、ありません。「復習」で、3回続けて正解しよう。</p>';
    if (weak.length) h += `<p><b>⚠️ 苦手な用語 (${weak.length}語)</b>: ${weak.slice(0, 12).map((r) => `<span class="chip warn">${r[2]}${esc(r[1])}</span>`).join("")}<button data-go="sub" data-v="復習">復習する</button></p>`;
    // 読んだカード
    h += `<h3 class="sec">📖 読んだカード</h3>` + bar(readEp, EP.length, "歴史の転換点(読んだ)") + bar(hs.episodes.unlocked, EP.length, "歴史の転換点(読める)") + bar(hs.people.got, hs.people.total, "科学者(読める)") +
      bar(mythFix, M.length, "誤概念カード(訂正した)") + bar(mythJ, M.length, "誤概念カード(判定を達成)") + bar(obsOk, obsTotal, "判定チャレンジ(正解)");
    const unread = EP.filter((e) => e.need.some((id) => real(id)) && !hh.read[e.id]);
    if (unread.length) h += `<p><b>📚 まだ読んでいない転換点</b>: ${unread.slice(0, 6).map((e) => `<span class="chip">${e.emoji}${esc(e.title)}</span>`).join("")}<button data-go="sub" data-v="歴史の転換点">読む</button></p>`;
    // 課題
    h += `<h3 class="sec">🔬 達成した課題</h3>` + bar(repDone, R.length, "追体験") + bar(repStars, R.length * 3, "追体験(★の数)") +
      `<p>${R.map((r) => { const d = hh.replay[r.id]; return `<span class="chip ${d ? "ok" : ""}">${r.emoji}${esc(r.who)} ${d ? "★".repeat(d.stars) : "—"}</span>`; }).join("")}</p>`;
    const ready = R.filter((r) => !hh.replay[r.id] && r.gear.every((g) => real(g)));
    if (ready.length) h += `<p><b>🎯 挑戦できる追体験</b>: ${ready.slice(0, 6).map((r) => `<span class="chip">${r.emoji}${esc(r.title)}</span>`).join("")}<button data-go="sub" data-v="追体験">挑戦する</button></p>`;
    h += bar(hh.ok, hh.tot, "歴史クイズ(正解 / 挑戦)") + bar(jr.length, Math.max(jr.length, 50), "実験ノートの記録");
    // 知識の効果
    { const fx = D().KNOW_FX || []; if (fx.length) {
      const on = fx.filter((k) => k.need.every((x) => real(x)));
      h += `<h3 class="sec">🧠 知識の効果 (${on.length}/${fx.length})</h3><p class="muted">理解した知識は、通常の実験の、収量・事故・火力の安定・分離の効率に、効きます。</p>` + fx.map((k) => { const ok = k.need.every((x) => real(x)); return `<div class="cx ${ok ? "" : "unk2"}"><div class="e">${k.emoji}</div><div><h4>${esc(k.name)} <small>${ok ? "有効" : "未習得(" + k.need.filter((x) => !real(x)).map((x) => (items()[x] ? items()[x].name : x)).join("・") + "が必要)"}</small></h4><p>${esc(k.desc)}</p></div></div>`; }).join("");
    } }
    // バッジ
    const BG = [
      { n: "元素ハンター", e: "⚛️", v: got("element"), t: [10, 30, 60, 118] }, { n: "化合物コレクター", e: "🧪", v: got("compound"), t: [20, 60, 150, 250] },
      { n: "歴史家", e: "📜", v: readEp, t: [3, 7, 11, 15] }, { n: "追体験の達人", e: "🔬", v: repStars, t: [6, 15, 30, 48] },
      { n: "誤概念ハンター", e: "🧹", v: mythFix + mythJ, t: [4, 10, 20, 30] }, { n: "用語マスター", e: "🎓", v: mast.length, t: [15, 40, 90, 160] },
      { n: "クイズ王", e: "👑", v: hh.ok, t: [10, 30, 60, 100] },
    ];
    const TIER = ["", "🥉", "🥈", "🥇", "🏆"];
    h += `<h3 class="sec">🏅 バッジ</h3><div class="grid2">` + BG.map((b) => {
      const k = b.t.filter((x) => b.v >= x).length, next = b.t[k];
      return `<div class="card" style="padding:8px 12px"><b>${b.e} ${b.n}</b> <span style="font-size:18px">${TIER[k] || "—"}</span><div class="muted" style="font-size:11.5px">${b.v}${next ? ` / 次の段階まで あと ${next - b.v}` : "(最高の段階!)"}</div></div>`;
    }).join("") + `</div>`;
    return h;
  }
  const renders = [glossary, review, progress];

  function attach() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sg]"); if (!b) return;
      const a = b.dataset.sg;
      if (a === "start") { st.sess = { n: 0, ok: 0, total: +b.dataset.n, weakOnly: !!b.dataset.weak }; st.rv = null; st.ans = null; }
      else if (a === "ans") { if (st.ans === null && st.rv) { const ok = record(st.rv, b.dataset.v); st.ans = b.dataset.v; if (ok) st.sess.ok++; api.save(); } }
      else if (a === "next") { st.sess.n++; st.rv = null; st.ans = null; }
      else if (a === "cat") { st.cat = b.dataset.v; st.limit = 60; }
      else if (a === "rcat") st.rcat = b.dataset.v;
      else if (a === "more") st.limit += 60;
      api.render();
    });
    document.addEventListener("input", (e) => {
      if (!e.target || e.target.id !== "glq") return;
      st.q = e.target.value; st.limit = 60; const pos = e.target.selectionStart; api.render();
      const el = document.getElementById("glq"); if (el) { el.focus(); el.setSelectionRange(pos, pos); }
    });
    document.addEventListener("change", (e) => { if (e.target && e.target.id === "gle") { st.era = +e.target.value; st.limit = 60; api.render(); } });
  }
  window.EODX = {
    subs: base.subs.concat(["用語集", "復習", "学習の進み具合"]),
    init(a) { base.init(a); api = a; attach(); },
    render(i) { return i < n0 ? base.render(i) : renders[i - n0](); },
    after(i) { if (i < n0 && base.after) base.after(i); },
    onRecipe: base.onRecipe,
  };
})();
