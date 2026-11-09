// 実験ノート(自分の発見の日記)と、誤概念の訂正カード(化学タブのサブタブ)。replayui.js の後、game.js の前に読み込む。
(function () {
  "use strict";
  const base = window.EODX; if (!base) return;
  let api = null;
  const D = () => api.DATA, S = () => api.S(), has = (id) => api.has(id) || S().cheat, items = () => api.items;
  const n0 = base.subs.length;
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const nm = (id) => (items()[id] ? items()[id].name : id);
  const emo = (id) => (items()[id] ? items()[id].emoji : "");
  const H = () => { const s = S(); if (!s.hh) s.hh = { read: {}, solved: {}, ok: 0, tot: 0 }; if (!s.hh.myth) s.hh.myth = {}; if (!s.hh.mj) s.hh.mj = {}; if (!s.hh.mj2) s.hh.mj2 = {}; return s.hh; };

  // ---- 日記の記録(ゲーム側から呼ぶ) ----
  const dateOf = (d) => (d == null ? "" : $t(`{0}年目 {1}月 {2}日`, [Math.floor(d / 360) + 1, Math.floor((d % 360) / 30) + 1, (d % 30) + 1]));
  window.JOURNAL = {
    add(Sv, e) {
      try {
        const j = (Sv.jr = Sv.jr || []);
        e.d = window.IND && window.IND.day ? window.IND.day() : null; e.n = Sv.nexp || 0; e.era = Sv.maxEra || 1; e.pt = Sv.pt;
        j.push(e); if (j.length > 1500) j.splice(0, j.length - 1500);
      } catch (err) { /* 記録に失敗しても、ゲームは続ける */ }
    },
  };
  // 以前のセーブデータから、発見の記録を復元する(1回だけ)
  function restore() {
    const s = S(); if (s.jrDone) return; s.jrDone = true;
    const j = (s.jr = s.jr || []), have = new Set(); j.forEach((e) => { (e.ids || [e.id]).forEach((x) => have.add(x)); });
    const old = [];
    (s.have || []).forEach((id) => {
      if (D().START_ITEMS.includes(id) || have.has(id) || !items()[id]) return;
      if (items()[id].type === "concept") old.push({ t: "concept", id, old: true });
      else old.push({ t: "discover", ids: [id], key: s.how && s.how[id], old: true });
    });
    s.jr = [...old, ...j];
  }
  // 歴史の年(アイテムの由来から)
  const histOf = (id) => { const r = D().ITEM_ROWS.find((x) => x[0] === id); return r && r[6] && /(約\d+年前|\d{3,4}年)/.test(r[6]) ? r[6] : ""; };
  function how(e) {
    const r = e.key && D().RECIPE_ROWS.find((x) => [...x[0]].sort().join("+") === e.key);
    const inp = r ? r[0] : e.key ? e.key.split("+") : [];
    const cond = [e.temp ? e.temp : "", e.sealed ? $t("密閉") : "", e.press > 1 ? e.press + $t("気圧") : ""].filter(Boolean).join($t("・"));
    return (inp.length ? $t("材料: ") + inp.map(nm).join(" + ") : "") + (cond ? `(${cond})` : "");
  }
  const ICON = { discover: "🧪", concept: "💡", tech: "🏛️", accident: "⚠️", era: "🌅", replay: "🔬", industry: "🏭", read: "📖", myth: "🧹", distill: "🍶" };
  function text(e) {
    const names = (e.ids || [e.id]).filter(Boolean).map((x) => emo(x) + nm(x)).join($t("、"));
    switch (e.t) {
      case "discover": return $t(`{0} を{1}。{2}{3}`, [names, D().EXTRACTS && D().EXTRACTS[e.key] ? $t("取り出した") : $t("作った"), how(e), e.gain ? $t(` 知識+{0}`, [e.gain]) : ""]);
      case "distill": return $t(`蒸留で、{0} を、取り出した。{1}`, [names, e.gain ? $t(` 知識+{0}`, [e.gain]) : ""]);
      case "concept": return $t(`「{0}」を、理解した。`, [nm(e.id)]);
      case "tech": return $t(`技術「{0}」の研究を、終えた。{1}`, [esc(e.name), e.grants ? "(" + e.grants.map(nm).join($t("・")) + $t(" を入手)") : ""]);
      case "accident": return $t(`事故が起きた。{0}{1}`, [esc(e.text || ""), e.lost ? $t(` 知識−{0}`, [e.lost]) : ""]);
      case "era": return $t(`第{0}期「{1}」に、入った。`, [e.eraNo, esc(e.name)]);
      case "replay": return $t(`追体験「{0}」を、達成した。({1})`, [esc(e.title), "★".repeat(e.stars)]);
      case "industry": return esc(e.text);
      case "read": return $t(`「{0}」を、読んだ。`, [esc(e.title)]);
      case "myth": return $t(`誤概念カード「{0}」を、訂正した。`, [esc(e.title)]);
      default: return esc(e.text || "");
    }
  }
  const FILTERS = [["all", $t("すべて")], ["discover", $t("発見")], ["concept", $t("知識")], ["tech", $t("技術")], ["accident", $t("事故")], ["replay", $t("追体験")], ["industry", $t("産業")], ["era", $t("時代")], ["read", $t("読書・訂正")]];
  const nb = { f: "all", edit: null, limit: 40, order: "new" };
  const inFilter = (e) => nb.f === "all" || e.t === nb.f || (nb.f === "discover" && e.t === "distill") || (nb.f === "read" && (e.t === "read" || e.t === "myth"));

  function notebook() {
    restore();
    const s = S(), j = s.jr || [], list = j.map((e, i) => ({ e, i })).filter((x) => inFilter(x.e));
    if (nb.order === "new") list.reverse();
    const cnt = (t) => j.filter((e) => e.t === t).length;
    const days = window.IND && window.IND.day ? window.IND.day() : 0;
    let h = $t(`<p class="lead">あなたの研究の、日記です。発見や事故、研究の記録が、自動で、書き込まれます。メモを、書き足すこともできます。</p>`);
    h += $t(`<div class="ind-top"><div class="stat"><small>記録</small><b>{0}</b></div><div class="stat"><small>発見</small><b>{1}</b></div><div class="stat"><small>知識</small><b>{2}</b></div><div class="stat"><small>事故</small><b>{3}</b></div><div class="stat"><small>経過</small><b>{4}日</b></div></div>`, [j.length, cnt("discover") + cnt("distill"), cnt("concept"), cnt("accident"), days]);
    h += `<div class="chips msub">` + FILTERS.map(([k, n]) => `<button data-nb="f" data-v="${k}" class="${nb.f === k ? "on" : ""}">${n}</button>`).join("") + `</div>`;
    h += $t(`<div class="ind-row"><button data-nb="order">{0}</button><button data-nb="export">ノートを、書き出す(テキスト)</button></div>`, [nb.order === "new" ? $t("新しい順 ⇅ 古い順へ") : $t("古い順 ⇅ 新しい順へ")]);
    if (!list.length) return h + $t('<p class="lead">まだ、記録がありません。実験をして、発見を、重ねよう。</p>');
    let last = null;
    h += `<div class="hl">` + list.slice(0, nb.limit).map(({ e, i }) => {
      const dt = e.old ? $t("これまでの記録(復元)") : e.d == null ? "" : dateOf(e.d), head = dt !== last ? `<div class="nbday">${esc(dt || "—")}</div>` : ""; last = dt;
      const hid = e.t === "discover" || e.t === "distill" ? (e.ids || []).map(histOf).filter(Boolean)[0] : "";
      const editing = nb.edit === i;
      return head + `<div class="nbrow nb-${e.t}"><div class="nbi">${ICON[e.t] || "•"}</div><div class="nbb"><div>${text(e)}</div>` +
        (hid ? $t(`<div class="nbh">🕰️ 歴史では: {0}</div>`, [esc(hid)]) : "") + links(e) +
        (editing ? $t(`<textarea id="nbmemo" rows="3" class="nbta" placeholder="気づいたこと、疑問、次にやりたいこと…">{0}</textarea><div class="ind-row"><button class="primary" data-nb="save" data-i="{1}">保存</button><button data-nb="cancel">やめる</button></div>`, [esc(e.memo || ""), i]) :
          `${e.memo ? `<div class="nbm">📝 ${esc(e.memo)}</div>` : ""}<button class="nbe" data-nb="edit" data-i="${i}">${e.memo ? $t("✎ 書き直す") : $t("✎ メモ")}</button>`) + `</div></div>`;
    }).join("") + `</div>`;
    if (list.length > nb.limit) h += $t(`<div class="ind-row"><button data-nb="more">さらに、{0}件 表示する</button></div>`, [Math.min(40, list.length - nb.limit)]);
    return h;
  }
  // 年表・図鑑・各タブへ戻るリンク
  function links(e) {
    const b = [], ids = (e.ids || [e.id]).filter((x) => x && items()[x]);
    ids.slice(0, 3).forEach((id) => {
      b.push($t(`<button data-go="codex" data-v="{0}">📖 {1}を図鑑で</button>`, [id, esc(nm(id))]));
      if (window.HIST && HIST.hasYear(id)) b.push($t(`<button data-go="hist" data-v="{0}">🕰️ 年表で</button>`, [id]));
    });
    if (e.t === "tech") b.push($t('<button data-go="tab" data-v="tech">🏛️ 技術タブへ</button>'));
    if (e.t === "replay") b.push($t('<button data-go="sub" data-v="追体験">🔬 追体験へ</button>'));
    if (e.t === "myth") b.push($t('<button data-go="sub" data-v="誤概念カード">🧹 誤概念カードへ</button>'));
    if (e.t === "read") b.push($t('<button data-go="sub" data-v="歴史の転換点">📖 歴史の転換点へ</button>'));
    if (e.t === "industry") b.push($t('<button data-go="tab" data-v="ind">🏭 産業タブへ</button>'));
    if (e.t === "era") b.push($t('<button data-go="sub" data-v="化学史年表">🕰️ 年表へ</button>'));
    return b.length ? `<div class="nblinks">${b.join("")}</div>` : "";
  }
  function exportText() {
    const s = S(), j = s.jr || [], lines = [$t("Elements of Discovery 実験ノート"), $t(`記録 {0}件`, [j.length]), ""];
    j.forEach((e) => { const dt = e.old ? $t("(復元)") : dateOf(e.d); lines.push(`${dt ? "[" + dt + "] " : ""}${text(e).replace(/<[^>]*>/g, "")}`); if (e.memo) lines.push($t("  メモ: ") + e.memo); });
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" })); a.download = "lab_notebook.txt"; a.click();
  }

  // ---- 誤概念の訂正カード ----
  const mc = { open: null, tried: {}, jt: {}, rand: null, randAns: null };
  const myths = () => D().MYTHS || [];
  const unlocked = (m) => m.need.some((id) => has(id));
  function mythView() {
    const M = myths(), got = M.filter(unlocked), fixed = M.filter((m) => H().myth[m.id]).length;
    let h = $t(`<p class="lead">昔の人々が、信じていた説は、なぜ、もっともらしく見え、何が決め手で、覆ったのでしょう。関連する発見をすると、読めるようになります。確認の問いに、答えると、知識+2。(訂正済み {0} / {1})</p>`, [fixed, M.length]);
    { // ランダム判定
      const pool = []; M.filter(unlocked).forEach((m) => (m.obs || []).forEach((o, i) => { if (!(H().mj[m.id] || {})[i]) pool.push({ m, i, o }); }));
      if (!mc.rand && pool.length) mc.rand = pool[Math.floor(Math.random() * pool.length)];
      if (mc.rand && (mc.randAns !== null || pool.some((x) => x.m.id === mc.rand.m.id && x.i === mc.rand.i))) {
        const r = mc.rand, a = mc.randAns;
        h += $t(`<div class="why"><b>🎲 ランダム判定: 『{0}』</b><p>{1}</p><div class="ind-row"><button class="{2}" data-mc="rans" data-a="1" {3}>昔の説で、説明できる</button><button class="{4}" data-mc="rans" data-a="0" {5}>昔の説では、苦しい</button></div>{6}</div>`, [esc(r.m.title), esc(r.o.text), a !== null && r.o.old ? "primary" : a === true && !r.o.old ? "warnb" : "", a !== null ? "disabled" : "", a !== null && !r.o.old ? "primary" : a === false && r.o.old ? "warnb" : "", a !== null ? "disabled" : "", a !== null ? $t(`<p class="{0}">{1} {2}</p><button class="primary" data-mc="rnext">次の判定</button>`, [a === r.o.old ? "use" : "warn", a === r.o.old ? $t("✅ 正解!") : $t("❌ 残念"), esc(r.o.why)]) : ""]);
      } else if (!pool.length && M.some((m) => m.obs)) h += $t('<p class="use">🏅 読めるカードの判定は、すべて、達成しました。</p>');
    }
    h += M.map((m) => {
      if (!unlocked(m)) return $t(`<div class="cx unk2"><div class="e">❔</div><div><h4>まだ、読めません</h4><p>関連する発見が、必要です。</p></div></div>`);
      const open = mc.open === m.id, done = H().myth[m.id];
      let b = `<div class="cx"><div class="e">${m.emoji}</div><div><h4>${esc(m.title)} <small>${esc(m.period)}${done ? $t("・訂正済み ✅") : ""}</small></h4>`;
      if (!open) return b + $t(`<button data-mc="open" data-v="{0}">読む</button></div></div>`, [m.id]);
      const sec = (t, x, cls) => `<div class="mcs ${cls || ""}"><b>${t}</b><p>${esc(x)}</p></div>`;
      b += sec($t("📜 その説"), m.theory) + sec($t("🤔 なぜ、そう考えたか"), m.why) + sec($t("✅ うまく説明できたこと"), m.strong, "ok") + sec($t("🔍 ほころび"), m.cracks, "warn") + sec($t("⚡ 何が決め手で、覆ったか"), m.turning, "key") + sec($t("🔬 現代の理解"), m.modern, "now");
      b += $t(`<p><small>関連する発見: {0}</small></p>`, [m.links.filter((id) => items()[id]).map((id) => `<span class="chip ${has(id) ? "ok" : ""}">${items()[id].emoji}${esc(items()[id].name)}</span>`).join("")]);
      const t = mc.tried[m.id] || [], q = m.q;
      b += `<div class="why"><b>❓ ${esc(q.text)}</b></div><div class="ind-row">` + q.opts.map((o, i) => `<button class="${done && i === q.ans ? "primary" : t.includes(i) ? "warnb" : ""}" data-mc="ans" data-v="${m.id}" data-i="${i}" ${done ? "disabled" : ""}>${esc(o)}</button>`).join("") + `</div>`;
      if (done) b += `<p class="use">✅ ${esc(q.why)}</p>`; else if (t.length) b += $t(`<p class="warn">❌ もう一度、「決め手」を、読み直してみよう。</p>`);
      if (m.obs && m.obs.length) {
        const solved = H().mj[m.id] || {}, nOk = m.obs.filter((o, i) => solved[i]).length;
        b += $t(`<div class="why"><b>🧭 判定チャレンジ({0}/{1})</b><p>次の観察は、『{2}』で、うまく説明できるか? 判定しよう。</p></div>`, [nOk, m.obs.length, esc(m.title)]);
        b += m.obs.map((o, i) => {
          const ok = solved[i], tr = (mc.jt[m.id] || {})[i];
          return $t(`<div class="jq"><div>{0}. {1}</div><div class="ind-row"><button class="{2}" data-mc="j" data-v="{3}" data-i="{4}" data-a="1" {5}>昔の説で、説明できる</button><button class="{6}" data-mc="j" data-v="{7}" data-i="{8}" data-a="0" {9}>昔の説では、苦しい</button></div>{10}</div>`, [i + 1, esc(o.text), ok && o.old ? "primary" : tr === 1 ? "warnb" : "", m.id, i, ok ? "disabled" : "", ok && !o.old ? "primary" : tr === 0 ? "warnb" : "", m.id, i, ok ? "disabled" : "", ok ? `<p class="use">✅ ${esc(o.why)}</p>` : tr !== undefined ? $t('<p class="warn">❌ もう一度、考えてみよう。</p>') : ""]);
        }).join("");
        if (H().mj2[m.id]) b += $t('<p class="use">🏅 判定チャレンジを、すべて達成!</p>');
      }
      return b + $t(`<button data-mc="close">閉じる</button></div></div>`);
    }).join("");
    return h;
  }

  function attach() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-nb],[data-mc],[data-go]"); if (!b) return;
      if (b.dataset.go) {
        const g = b.dataset.go, v = b.dataset.v;
        if (g === "codex") { api.go("codex", null, "cx-" + v); return; }
        if (g === "hist") { if (window.HIST) HIST.focus(v); api.go("mol", $t("化学史年表"), "hy-" + v); return; }
        if (g === "tab") { api.go(v); return; }
        if (g === "sub") { api.go("mol", v); return; }
        return;
      }
      if (b.dataset.nb) {
        const a = b.dataset.nb;
        if (a === "f") { nb.f = b.dataset.v; nb.limit = 40; nb.edit = null; }
        else if (a === "order") nb.order = nb.order === "new" ? "old" : "new";
        else if (a === "more") nb.limit += 40;
        else if (a === "edit") nb.edit = +b.dataset.i;
        else if (a === "cancel") nb.edit = null;
        else if (a === "save") { const ta = document.getElementById("nbmemo"), ent = (S().jr || [])[+b.dataset.i]; if (ent && ta) { ent.memo = ta.value.trim().slice(0, 500); api.save(); } nb.edit = null; }
        else if (a === "export") { exportText(); return; }
      } else {
        const a = b.dataset.mc, v = b.dataset.v;
        const solveObs = (mid, i, ans) => { // 判定の採点。初めての正解で、知識+1。すべて正解で、+2
          const m = myths().find((x) => x.id === mid), o = m && m.obs && m.obs[i]; if (!o) return null;
          const hh = H(), sv = (hh.mj[mid] = hh.mj[mid] || {}); if (sv[i]) return true;
          if (ans === o.old) { sv[i] = 1; S().pt += 1; if (m.obs.every((x, k) => sv[k]) && !hh.mj2[mid]) { hh.mj2[mid] = 1; S().pt += 2; api.toast($t("🏅 判定チャレンジ達成! 知識 +3")); } else api.toast($t("✅ 正解! 知識 +1")); api.save(); return true; }
          return false;
        };
        if (a === "j") { const ok = solveObs(v, +b.dataset.i, b.dataset.a === "1"); if (ok === false) { (mc.jt[v] = mc.jt[v] || {})[+b.dataset.i] = b.dataset.a === "1" ? 1 : 0; } }
        else if (a === "rans") { if (mc.rand && mc.randAns === null) { const ans = b.dataset.a === "1"; mc.randAns = ans; solveObs(mc.rand.m.id, mc.rand.i, ans); } }
        else if (a === "rnext") { mc.rand = null; mc.randAns = null; }
        else if (a === "open") mc.open = v; else if (a === "close") mc.open = null;
        else if (a === "ans") {
          const m = myths().find((x) => x.id === v), i = +b.dataset.i; if (!m || H().myth[v]) return;
          if (i === m.q.ans) { H().myth[v] = 1; S().pt += 2; api.say($t(`🧹 誤概念「{0}」を訂正した(知識+2)`, [m.title])); api.toast($t("🧹 知識 +2")); if (window.JOURNAL) JOURNAL.add(S(), { t: "myth", title: m.title }); api.save(); }
          else { (mc.tried[v] = mc.tried[v] || []).push(i); }
        }
      }
      api.render();
    });
  }
  window.EODX = {
    subs: base.subs.concat([$t("誤概念カード"), $t("実験ノート")]),
    init(a) { base.init(a); api = a; attach(); },
    render(i) { return i < n0 ? base.render(i) : [mythView, notebook][i - n0](); },
    after(i) { if (i < n0 && base.after) base.after(i); },
    onRecipe: base.onRecipe,
  };
})();
