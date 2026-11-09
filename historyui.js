// 化学史: 年表・科学者・歴史の転換点・クイズ(化学タブのサブタブ)。dynui.js の後、game.js の前に読み込む。
(function () {
  "use strict";
  const base = window.EODX; if (!base) return;
  let api = null;
  const D = () => api.DATA, S = () => api.S(), has = (id) => api.has(id) || S().cheat, items = () => api.items;
  const n0 = base.subs.length;
  const H = () => { const s = S(); if (!s.hh) s.hh = { read: {}, solved: {}, ok: 0, tot: 0 }; return s.hh; };
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const st = { period: 0, person: null, q: null, ans: null };

  // ---- 年の読み取り ----
  function parseYear(note) {
    if (!note) return null;
    let m = note.match(/約(\d+)年前/); if (m) return 2000 - +m[1];
    m = note.match(/紀元前(\d+)年/); if (m) return -+m[1];
    m = note.match(/(\d{3,4})年代/); if (m) return +m[1] + 50;
    m = note.match(/(\d{3,4})年/); if (m) return +m[1];
    return null;
  }
  const personOf = (note) => (note || "").replace(/^[^年]*年(前|代)?\s*/, "").replace(/\(.*?\)/g, "").trim();
  const yearText = (note) => { const m = (note || "").match(/^(約\d+年前|紀元前\d+年|\d{3,4}年代|\d{3,4}年)/); return m ? m[1] : ""; };
  let cache = null;
  function events() {
    if (cache) return cache;
    cache = D().ITEM_ROWS.filter((r) => r[6] && parseYear(r[6]) !== null && ["element", "compound", "material", "concept", "tool"].includes(r[3]))
      .map((r) => ({ id: r[0], name: r[1], emoji: r[2], type: r[3], note: r[6], y: parseYear(r[6]), yt: yearText(r[6]), who: personOf(r[6]) })).sort((a, b) => a.y - b.y);
    return cache;
  }
  const PERIODS = [[$t("すべて"), -1e9, 1e9], [$t("古代・先史(〜500年)"), -1e9, 500], [$t("中世(500〜1600年)"), 500, 1600], [$t("17〜18世紀(1600〜1800年)"), 1600, 1800], [$t("19世紀"), 1800, 1900], [$t("20世紀前半"), 1900, 1950], [$t("20世紀後半〜"), 1950, 1e9]];
  const peopleOf = (note) => (D().PEOPLE || []).filter((p) => note && note.includes(p.key));
  const personUnlocked = (p) => p.works.some((id) => has(id)) || events().some((e) => e.note.includes(p.key) && has(e.id));
  const epUnlocked = (ep) => ep.need.some((id) => has(id));

  // ---- 年表 ----
  function timeline() {
    const [lab, lo, hi] = PERIODS[st.period], ev = events().filter((e) => e.y >= lo && e.y < hi);
    const mine = events().filter((e) => has(e.id)).length;
    let h = $t(`<p class="lead">元素・化合物・概念の発見や発明を、年代順に並べました。あなたが追体験した発見は、色が付きます。({0} / {1})</p>`, [mine, events().length]);
    h += `<div class="chips msub">` + PERIODS.map((p, i) => `<button data-hq="per" data-i="${i}" class="${st.period === i ? "on" : ""}">${p[0]}</button>`).join("") + `</div>`;
    h += `<div class="hl">` + ev.map((e) => {
      const got = has(e.id);
      return `<div class="hrow ${got ? "got" : "unk"}" id="hy-${e.id}"><div class="hy">${esc(e.yt)}</div><div class="hb">${got ? `<b>${e.emoji} ${esc(e.name)}</b> <small>${esc(e.who)}</small>` : $t(`<span class="muted">❔ まだ、見つけていない発見</span>`)}</div></div>`;
    }).join("") + `</div>`;
    return h || "";
  }
  // ---- 科学者 ----
  function people() {
    const P = D().PEOPLE || [], got = P.filter(personUnlocked);
    let h = $t(`<p class="lead">発見に関わった科学者たちです。関連する発見をすると、読めるようになります。({0} / {1})</p>`, [got.length, P.length]);
    if (st.person !== null && P[st.person] && personUnlocked(P[st.person])) {
      const p = P[st.person];
      h += $t(`<button data-hq="back">← 一覧へ</button><div class="why"><b>{0} {1}</b> <small>{2}・{3}</small><p>{4}</p>`, [p.emoji, esc(p.name), esc(p.life), esc(p.country), esc(p.bio)]) +
        $t(`<p><small>この人の業績に、関係する発見: {0}</small></p></div>`, [p.works.filter((id) => items()[id]).map((id) => `<span class="chip ${has(id) ? "ok" : ""}">${items()[id].emoji}${esc(items()[id].name)}</span>`).join("")]);
      return h;
    }
    h += P.map((p, i) => personUnlocked(p) ? $t(`<div class="cx"><div class="e">{0}</div><div><h4>{1} <small>{2}・{3}</small></h4><p>{4}…</p><button data-hq="pick" data-i="{5}">読む</button></div></div>`, [p.emoji, esc(p.name), esc(p.life), esc(p.country), esc(p.bio.slice(0, 50)), i]) : "").join("") || $t('<p class="lead">まだ、読める人物は、いません。</p>');
    return h;
  }
  // ---- 歴史の転換点 ----
  function episodes() {
    const E = D().EPISODES || [], got = E.filter(epUnlocked);
    let h = $t(`<p class="lead">化学の歴史を、変えた出来事です。あなたの発見と、結びつけて、読みましょう。初めて読むと、知識+3。({0} / {1})</p>`, [got.length, E.length]);
    h += E.map((ep, i) => {
      if (!epUnlocked(ep)) return $t(`<div class="cx unk2"><div class="e">❔</div><div><h4>まだ、読めません</h4><p>関連する発見が、必要です。</p></div></div>`);
      const open = st.ep === i, read = H().read[ep.id];
      return `<div class="cx"><div class="e">${ep.emoji}</div><div><h4>${esc(ep.title)} <small>${esc(ep.years)}${read ? $t("・既読") : ""}</small></h4>` +
        (open ? ep.body.map((t) => `<p>${esc(t)}</p>`).join("") + $t(`<p class="use">💡 {0}</p><p><small>あなたの発見: {1}</small></p><button data-hq="ep" data-i="-1">閉じる</button>`, [esc(ep.lesson), ep.links.filter((id) => items()[id]).map((id) => `<span class="chip ${has(id) ? "ok" : ""}">${items()[id].emoji}${esc(items()[id].name)}</span>`).join("")]) : $t(`<button data-hq="ep" data-i="{0}">読む</button>`, [i])) + `</div></div>`;
    }).join("");
    return h;
  }
  // ---- クイズ ----
  function pool() { return events().filter((e) => has(e.id) && e.y > 0 && e.who && e.who.length <= 14 && !/発見$/.test(e.who) && !/^他/.test(e.who)); }
  function makeQ() {
    const pl = pool(); if (pl.length < 4) return null;
    const pick = pl[Math.floor(Math.random() * pl.length)], type = Math.random() < 0.5 ? "who" : "year";
    const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    if (type === "who") {
      const dist = shuffle([...new Set(pl.map((e) => e.who).filter((w) => w !== pick.who))]).slice(0, 3);
      return { type, e: pick, text: $t(`「{0}」の発見・発明に、関わったのは?`, [pick.name]), opts: shuffle([pick.who, ...dist]), ans: pick.who };
    }
    const years = [...new Set(pl.map((e) => e.yt).filter((y) => y !== pick.yt))].sort((a, b) => Math.abs(parseYear(a) - pick.y) - Math.abs(parseYear(b) - pick.y)).slice(0, 6);
    const dist = shuffle(years).slice(0, 3);
    return { type, e: pick, text: $t(`「{0}」は、いつごろの発見・発明?`, [pick.name]), opts: shuffle([pick.yt, ...dist]), ans: pick.yt };
  }
  function quiz() {
    const h0 = H();
    let h = $t(`<p class="lead">これまでの発見から、化学史のクイズです。初めての正解で、知識+1。(正解 {0} / 挑戦 {1})</p>`, [h0.ok, h0.tot]);
    if (pool().length < 4) return h + $t('<p class="lead">🔒 年代の分かる発見が、4つ以上、必要です。</p>');
    if (!st.q) st.q = makeQ();
    const q = st.q; if (!q) return h;
    h += `<div class="why"><b>${esc(q.text)}</b></div><div class="ind-row">` + q.opts.map((o) => {
      const cls = st.ans === null ? "" : o === q.ans ? "primary" : o === st.ans ? "warnb" : "";
      return `<button class="${cls}" data-hq="ans" data-v="${esc(o)}" ${st.ans !== null ? "disabled" : ""}>${esc(o)}</button>`;
    }).join("") + `</div>`;
    if (st.ans !== null) {
      const ok = st.ans === q.ans, bio = peopleOf(q.e.note)[0];
      h += $t(`<div class="why"><b>{0}</b><p>{1} {2}: {3}</p>{4}</div><button class="primary" data-hq="next">次の問題</button>`, [ok ? $t("✅ 正解!") : $t("❌ 残念"), q.e.emoji, esc(q.e.name), esc(q.e.note), bio ? `<p>${bio.emoji} ${esc(bio.name)}(${esc(bio.life)}): ${esc(bio.bio)}</p>` : ""]);
    }
    return h;
  }
  const renders = [timeline, people, episodes, quiz];

  function attach() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-hq]"); if (!b) return;
      const a = b.dataset.hq, i = +b.dataset.i;
      if (a === "per") st.period = i;
      else if (a === "pick") st.person = i;
      else if (a === "back") st.person = null;
      else if (a === "ep") {
        st.ep = i < 0 ? null : i;
        const ep = (D().EPISODES || [])[i];
        if (ep && !H().read[ep.id]) { H().read[ep.id] = 1; S().pt += 3; api.say($t(`📖 「{0}」を読んだ(知識+3)`, [ep.title])); if (window.JOURNAL) JOURNAL.add(S(), { t: "read", title: ep.title }); api.toast($t("📖 知識 +3")); api.save(); }
      } else if (a === "ans") {
        const q = st.q; if (!q || st.ans !== null) return;
        st.ans = b.dataset.v; const h0 = H(); h0.tot++;
        if (st.ans === q.ans) { h0.ok++; if (!h0.solved[q.e.id]) { h0.solved[q.e.id] = 1; S().pt += 1; api.toast($t("✅ 正解! 知識 +1")); } else api.toast($t("✅ 正解!")); }
        api.save();
      } else if (a === "next") { st.q = null; st.ans = null; }
      api.render();
    });
  }
  // 発見のカード: 科学者の紹介
  window.HIST = {
    focus(id) { const e = events().find((x) => x.id === id); if (!e) return false; const i = PERIODS.findIndex((p, k) => k > 0 && e.y >= p[1] && e.y < p[2]); st.period = i > 0 ? i : 0; return true; },
    hasYear(id) { return events().some((x) => x.id === id); },
    // 学習の進み具合の集計(チートモードを除いた、実際の発見で、数える)
    stats() {
      const rl = (id) => api.has(id), ev = events(), P = D().PEOPLE || [], EP = D().EPISODES || [];
      return { events: { got: ev.filter((e) => rl(e.id)).length, total: ev.length }, people: { got: P.filter((p) => p.works.some(rl) || ev.some((e) => e.note.includes(p.key) && rl(e.id))).length, total: P.length }, episodes: { unlocked: EP.filter((ep) => ep.need.some(rl)).length, total: EP.length } };
    },
    cardHtml(id) {
      if (!api) return "";
      const r = D().ITEM_ROWS.find((x) => x[0] === id); if (!r || !r[6]) return "";
      const ps = peopleOf(r[6]); if (!ps.length) return "";
      return $t(`<div class="why"><b>🕰️ 化学史</b>`) + ps.slice(0, 2).map((p) => `<p>${p.emoji} <b>${esc(p.name)}</b>(${esc(p.life)}・${esc(p.country)}): ${esc(p.bio.length > 90 ? p.bio.slice(0, 90) + "…" : p.bio)}</p>`).join("") + $t(`<p><small>化学タブの「科学者」「歴史の転換点」で、詳しく読めます。</small></p></div>`);
    },
    newEpisodes() { // 新しく読めるようになった転換点
      if (!api) return [];
      const h0 = H(); h0.seen = h0.seen || {};
      const out = (D().EPISODES || []).filter((ep) => epUnlocked(ep) && !h0.seen[ep.id]);
      out.forEach((ep) => { h0.seen[ep.id] = 1; });
      return out;
    },
  };
  window.EODX = {
    subs: base.subs.concat([$t("化学史年表"), $t("科学者"), $t("歴史の転換点"), $t("歴史クイズ")]),
    init(a) { base.init(a); api = a; attach(); },
    render(i) { return i < n0 ? base.render(i) : renders[i - n0](); },
    after(i) { if (i < n0 && base.after) base.after(i); },
    onRecipe: base.onRecipe,
  };
})();
