// 産業システム: 資金・時間・工場・人員・市場。game.js の後に読み込む。
(function () {
  const E = window.EOD, D = E && E.DATA;
  if (!D || !D.MARKET) return;
  const $ = (id) => document.getElementById(id);
  const S = () => E.S();
  const items = E.items;
  const nm = (id) => (items[id] ? items[id].name : id);
  const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString("ja-JP");
  const keyOf = (a) => [...a].sort().join("+");
  const recipeOf = (id) => D.RECIPE_ROWS.find((r) => r[1].includes(id));
  const BASIC = new Set(["fire", "water", "earth", "wood", "stone", "air", "steam", "ash", "sand", "seawater", "ice"]);
  let tab = "overview", secFilter = "";

  function st() {
    const s = S();
    if (!s.ind) s.ind = { gold: D.GOLD_START, day: 0, easy: true, plants: {}, staff: {}, shock: {}, paid: {}, report: null, hist: [], earned: 0 };
    return s.ind;
  }
  const easy = () => st().easy;
  const canPay = (c) => easy() || st().gold >= c;
  const pay = (c) => { if (!easy()) st().gold -= c; };

  // ---- 暦 ----
  const month = () => Math.floor(st().day / D.DAYS_PER_MONTH);
  function dateText() { const d = st().day; return `${Math.floor(d / 360) + 1}年目 ${Math.floor((d % 360) / 30) + 1}月 ${(d % 30) + 1}日`; }

  // ---- 相場 ----
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h % 628) / 100; };
  function secIdx(sec) {
    const v = D.SECTORS[sec].vol;
    return Math.max(0.4, 1 + v * Math.sin(month() * 0.9 + hash(sec)) + (st().shock[sec] || 0));
  }
  const staffN = (r) => st().staff[r] || 0;
  const era = () => Math.min(4, S().maxEra || 1);
  // 時代による需要(月の需要=基準×時代の倍率)
  function demand(id) { const m = D.marketOf(id); return m ? Math.round(m.dem * D.demandMul(id, m.sec, era())) : 0; }
  function price(id) {
    const m = D.marketOf(id); if (!m) return 0;
    return m.price * D.priceMul(id, era()) * secIdx(m.sec) * (1 + 0.05 * staffN("salesman"));
  }

  // ---- 製造費・建設費 ----
  function unitCost(id) {
    const r = recipeOf(id), m = D.marketOf(id);
    if (!r) return Math.max(0.2, m.price * 0.35);
    const ing = r[0].filter((i) => items[i] && items[i].type !== "tool" && items[i].type !== "concept");
    const c = ing.reduce((a, i) => a + (BASIC.has(i) ? 0.3 : Math.max(0.3, (D.marketOf(i) || { price: 1 }).price * 0.55)), 0);
    return Math.max(0.2, c / Math.max(1, r[1].filter((o) => D.marketOf(o)).length));
  }
  function needs(id) {
    const r = recipeOf(id), L = [];
    if (!r) return L;
    (r[7] || []).forEach((e) => L.push(e));
    const c = r[3];
    if (c) {
      if (c.t && c.t[0] >= 3 && D.TEMPS[c.t[0]].need) L.push(D.TEMPS[c.t[0]].need);
      if (c.sealed === true && D.SEAL_NEED) L.push(D.SEAL_NEED);
      if (c.fine) L.push("mortar");
    }
    if (r[8]) L.push("electricity");
    return [...new Set(L)];
  }
  const lack = (id) => needs(id).filter((n) => !E.has(n));
  function buildCost(id, lv) {
    const era = items[id].era || 1;
    const L = D.PLANT_LV[lv];
    return Math.round((60 + 30 * era + 50 * needs(id).length) * L.mult + L.cap * unitCost(id) * 4);
  }
  const upkeep = (id, lv) => Math.round(buildCost(id, lv) * D.PLANT_LV[lv].up);
  const yieldRate = () => Math.min(0.98, 0.85 + 0.03 * staffN("engineer"));
  const capOf = (lv) => Math.floor(D.PLANT_LV[lv].cap * (1 + 0.1 * staffN("engineer")));
  function plan(id, lv) { // 月次の見込み(需要の上限を考慮)
    const m = D.marketOf(id), sold = Math.min(Math.floor(capOf(lv) * yieldRate()), demand(id)), units = sold; // 売れる分だけ作る
    const rev = sold * price(id), cost = units * unitCost(id), up = upkeep(id, lv);
    return { units, sold, rev, cost, up, profit: rev - cost - up };
  }

  // ---- 月次決算 ----
  function settle() {
    const s = st(), rep = { month: month(), lines: [], rev: 0, cost: 0, up: 0, sal: 0, event: "", pt: 0 };
    // 相場の揺れ(ショックは徐々に収まる)
    Object.keys(s.shock).forEach((k) => { s.shock[k] *= 0.6; if (Math.abs(s.shock[k]) < 0.02) delete s.shock[k]; });
    const secs = Object.keys(D.SECTORS);
    if (Math.random() < 0.3) {
      const sec = secs[Math.floor(Math.random() * secs.length)], up = Math.random() < 0.5;
      s.shock[sec] = (up ? 1 : -1) * (0.15 + Math.random() * 0.25);
      rep.event = `${D.SECTORS[sec].emoji}${D.SECTORS[sec].name}の需要が${up ? "急増" : "冷え込み"}している(${up ? "+" : "−"}${Math.round(Math.abs(s.shock[sec]) * 100)}%)`;
    }
    const safety = 0.03 / (1 + 0.5 * staffN("safety") * 1.0);
    Object.entries(s.plants).forEach(([id, lv]) => {
      if (Math.random() < safety) { const rep_ = Math.round(buildCost(id, lv) * 0.3); rep.up += rep_; rep.lines.push({ id, note: `事故で停止、修理費 ${rep_}G`, profit: -rep_ }); return; }
      const p = plan(id, lv);
      rep.rev += p.rev; rep.cost += p.cost; rep.up += p.up;
      rep.lines.push({ id, note: `${p.units}単位生産、${p.sold}単位販売${p.sold < p.units ? "(需要不足)" : ""}`, profit: p.profit });
    });
    Object.entries(s.staff).forEach(([r, n]) => { rep.sal += n * D.STAFF[r].salary; rep.pt += n * (r === "assistant" ? 1 : r === "scientist" ? 3 : 0); });
    const net = rep.rev - rep.cost - rep.up - rep.sal;
    rep.net = net;
    if (!easy()) {
      s.gold += net;
      if (s.gold < 0) { // 資金が尽きたら、人員を1人解雇
        const r = Object.keys(s.staff).find((k) => s.staff[k] > 0);
        s.gold = Math.max(s.gold, 0);
        if (r) { s.staff[r]--; rep.event += ` 資金不足で${D.STAFF[r].name}を1人解雇した。`; }
      }
    }
    s.earned += Math.max(0, rep.rev);
    if (rep.pt) S().pt += rep.pt;
    s.report = rep; s.hist = [net, ...s.hist].slice(0, 12);
    E.say(`📅 月次決算: 収入 ${fmt(rep.rev)}G / 支出 ${fmt(rep.cost + rep.up + rep.sal)}G → ${net >= 0 ? "+" : ""}${fmt(net)}G${rep.pt ? ` / 研究 +${rep.pt}pt` : ""}${rep.event ? " / " + rep.event : ""}`);
  }
  function advance(days) {
    const s = st(), before = month();
    s.day += days;
    let n = month() - before;
    while (n-- > 0 && n < 24) settle();
  }

  // ---- 発見による収入(試料の売却・特許) ----
  function onDiscover(ids) {
    const s = st(); let g = 0;
    ids.forEach((id) => { if (s.paid[id] || !D.sellable(id)) return; s.paid[id] = 1; g += Math.round(D.marketOf(id).price * 3); });
    if (g > 0) { if (!easy()) s.gold += g; s.earned += g; E.say(`💰 発見の謝礼(試料の売却・特許): +${fmt(g)}G`); }
    return g;
  }

  // ---- 操作 ----
  function build(id, lv) {
    const s = st(), cur = s.plants[id] || 0;
    if (lv <= cur || lack(id).length) return;
    const c = buildCost(id, lv) - (cur ? buildCost(id, cur) : 0);
    if (!canPay(c)) { E.toast("資金が足りない"); return; }
    pay(c); s.plants[id] = lv;
    E.say(`🏭 ${nm(id)}の${D.PLANT_LV[lv].name}を${cur ? "拡張" : "建設"}した(${easy() ? "無料" : fmt(c) + "G"})`);
    E.save(); E.render();
  }
  function hire(role) {
    const s = st(), R = D.STAFF[role];
    if ((s.staff[role] || 0) >= R.max) return;
    if (!canPay(R.hire)) { E.toast("資金が足りない"); return; }
    pay(R.hire); s.staff[role] = (s.staff[role] || 0) + 1;
    E.say(`${R.emoji} ${R.name}を雇った`); E.save(); E.render();
  }
  function fire(role) { const s = st(); if (s.staff[role] > 0) { s.staff[role]--; E.save(); E.render(); } }
  function wait(days) { advance(days); E.save(); E.render(); }

  // ---- 画面 ----
  const goldText = () => (easy() ? "∞" : fmt(st().gold));
  function pill(id) { return `<span class="pill">${items[id].emoji} ${items[id].name}</span>`; }
  function overview() {
    const s = st(), era = s.__era, rep = s.report;
    let h = `<div class="ind-top"><div class="stat"><small>資金</small><b>${goldText()} G</b></div><div class="stat"><small>日付</small><b>${dateText()}</b></div>` +
      `<div class="stat"><small>稼働工場</small><b>${Object.keys(s.plants).length}</b></div></div>`;
    h += `<div class="ind-row"><button data-ind="mode">${easy() ? "🟢 イージー(資金は無尽蔵)" : "🔴 ノーマル(資金に限りあり)"}</button>` +
      `<button data-ind="wait" data-d="7">1週間待つ</button><button data-ind="wait" data-d="30">1か月待つ</button><button data-ind="wait" data-d="360">1年待つ</button></div>`;
    h += `<p class="lead">実験は1回ごとに1日かかります。月が変わるたびに、工場の生産と販売、人件費の支払いなどが決算されます。新しい物質を初めて発見すると、試料の売却や特許で謝礼が入ります。</p>`;
    if (rep) {
      h += `<div class="why"><b>📅 前月の決算</b><p>収入 ${fmt(rep.rev)}G ／ 原料費 ${fmt(rep.cost)}G ／ 維持費 ${fmt(rep.up)}G ／ 人件費 ${fmt(rep.sal)}G ⇒ <b>${rep.net >= 0 ? "+" : ""}${fmt(rep.net)}G</b>${rep.pt ? ` ／ 研究 +${rep.pt}pt` : ""}</p>` +
        (rep.event ? `<p>📰 ${rep.event}</p>` : "") +
        (rep.lines.length ? `<ul>${rep.lines.map((l) => `<li>${items[l.id].emoji}${nm(l.id)}: ${l.note} (${l.profit >= 0 ? "+" : ""}${fmt(l.profit)}G)</li>`).join("")}</ul>` : "") + `</div>`;
    }
    return h;
  }
  function market() {
    const have = S().have.filter((id) => D.sellable(id));
    const secs = Object.entries(D.SECTORS);
    let h = `<div class="ind-row">` + [["", "すべて"]].concat(secs.map(([k, v]) => [k, v.emoji + v.name])).map(([k, n]) => `<button class="${secFilter === k ? "on" : ""}" data-ind="sec" data-k="${k}">${n}</button>`).join("") + `</div>`;
    h += `<div class="idx">` + secs.map(([k, v]) => { const x = secIdx(k); return `<span class="chip ${x >= 1.05 ? "ok" : x <= 0.95 ? "warn" : ""}">${v.emoji}${v.name} ×${x.toFixed(2)}</span>`; }).join("") + `</div>`;
    const list = have.filter((id) => !secFilter || D.marketOf(id).sec === secFilter).sort((a, b) => price(b) - price(a));
    h += `<p class="lead">発見済みの品目の相場です(単価は、業界の景気と営業担当で変わります)。工場を建てると、毎月自動で生産して販売します。</p>`;
    h += list.map((id) => {
      const m = D.marketOf(id), lv = st().plants[id] || 0, lk = lack(id), r = recipeOf(id);
      const margin = price(id) - unitCost(id);
      let b = "";
      if (demand(id) <= 0) b = `<small class="warn">この時代には、需要がありません</small>`;
      else if (lv < 3) {
        const nx = lv + 1, c = buildCost(id, nx) - (lv ? buildCost(id, lv) : 0), p = plan(id, nx);
        b = lk.length ? `<small class="warn">必要な設備: ${lk.map(nm).join("・")}</small>` :
          `<button class="${canPay(c) ? "primary" : ""}" data-ind="build" data-id="${id}" data-lv="${nx}">${lv ? "拡張" : "建設"}: ${D.PLANT_LV[nx].name} (${easy() ? "無料" : fmt(c) + "G"}) 月益 見込 ${p.profit >= 0 ? "+" : ""}${fmt(p.profit)}G</button>`;
      }
      return `<div class="cx"><div class="e">${items[id].emoji}</div><div><h4>${nm(id)} <small>${D.SECTORS[m.sec].name}${m.auto ? "(標準価格)" : ""}</small></h4>` +
        `<p>単価 <b>${fmt(price(id))}G</b> ／ 製造原価 ${fmt(unitCost(id))}G ／ 月の需要 ${demand(id)}単位${D.demandMul(id, m.sec, era()) > 1.4 ? " 📈" : D.demandMul(id, m.sec, era()) < 0.6 ? " 📉" : ""} ／ ${margin > 0 ? "利益あり" : '<span class="warn">赤字</span>'}</p>` +
        `${(() => { const u = D.usesFor(id, era()); return u ? `<p class="use">🏭 第${era()}期の用途: ${u.now}</p>` : ""; })()}<p class="how">${r ? "工業的製法: 実験室の配合(" + r[0].map(nm).join("+") + ")を大規模化" : "採掘・採取・蒸留などで調達"}${lv ? ` ／ <b>現在: ${D.PLANT_LV[lv].name}</b>` : ""}</p>${b}</div></div>`;
    }).join("") || '<p class="lead">売れる品目がまだありません。</p>';
    return h;
  }
  function plants() {
    const s = st(), ids = Object.keys(s.plants);
    if (!ids.length) return '<p class="lead">まだ工場がありません。「市場」から、発見した物質の工場を建てましょう。</p>';
    return ids.map((id) => {
      const lv = s.plants[id], p = plan(id, lv);
      return `<div class="cx"><div class="e">${items[id].emoji}</div><div><h4>${nm(id)} <small>${D.PLANT_LV[lv].name}</small></h4><p>月産 ${p.units}単位 / 販売 ${p.sold}単位 / 収入 ${fmt(p.rev)}G / 原料 ${fmt(p.cost)}G / 維持 ${fmt(p.up)}G ⇒ <b>${p.profit >= 0 ? "+" : ""}${fmt(p.profit)}G</b></p></div></div>`;
    }).join("");
  }
  function staff() {
    const era = S().maxEra || 1;
    return `<p class="lead">人を雇うと、毎月、給料がかかります(イージーでは無料)。</p>` + Object.entries(D.STAFF).map(([k, R]) => {
      const n = staffN(k), locked = era < R.era;
      return `<div class="cx ${locked ? "unk2" : ""}"><div class="e">${R.emoji}</div><div><h4>${R.name} <small>${n}/${R.max}人 ／ 給料 ${R.salary}G/月 ／ 雇用 ${R.hire}G</small></h4><p>${R.desc}</p>` +
        (locked ? `<small class="warn">第${R.era}期から雇えます</small>` : `<button class="${canPay(R.hire) && n < R.max ? "primary" : ""}" data-ind="hire" data-r="${k}" ${n >= R.max ? "disabled" : ""}>雇う</button> <button data-ind="fire" data-r="${k}" ${n ? "" : "disabled"}>解雇</button>`) + `</div></div>`;
    }).join("");
  }
  function render() {
    const el = $("indBody"); if (!el) return;
    const s = st();
    const chip = $("goldChip"); if (chip) chip.textContent = goldText();
    const tabs = [["overview", "概要"], ["market", "市場・工場建設"], ["plants", "稼働中の工場"], ["staff", "人員"]];
    el.innerHTML = `<div class="chips msub">${tabs.map(([k, n]) => `<button data-ind="tab" data-k="${k}" class="${tab === k ? "on" : ""}">${n}</button>`).join("")}</div>` + { overview, market, plants, staff }[tab]();
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-ind]"); if (!t) return;
    const a = t.dataset.ind;
    if (a === "tab") { tab = t.dataset.k; render(); }
    else if (a === "sec") { secFilter = t.dataset.k; render(); }
    else if (a === "mode") { const s = st(); if (!s.easy || confirm("ノーマルにすると、資金が限られます(現在の資金: " + fmt(s.gold) + "G)。切り替えますか?")) { s.easy = !s.easy; E.save(); E.render(); } }
    else if (a === "wait") wait(+t.dataset.d);
    else if (a === "build") build(t.dataset.id, +t.dataset.lv);
    else if (a === "hire") hire(t.dataset.r);
    else if (a === "fire") fire(t.dataset.r);
  });

  // ---- 資金で技術(調達)を実行 ----
  const techGold = (t) => t.cost * 25;
  window.IND = { plan, unitCost, buildCost, price, lack, advance, onDiscover, render, easy, canPay, pay, techGold, goldText, date: dateText };
  render();
})();
