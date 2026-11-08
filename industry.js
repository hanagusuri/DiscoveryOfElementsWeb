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
    const I = s.ind; I.lab = I.lab || 1; I.patents = I.patents || {}; I.itech = I.itech || {}; I.improve = I.improve || {}; I.members = I.members || {}; I.effects = I.effects || []; I.insure = I.insure || 0; I.stock = I.stock || 0; I.rsv = I.rsv || { bal: 0, lv: 0 }; I.log = I.log || [];
    return I;
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
  const EC = D.ECON;
  const pressList = () => D.PRESS_LEVELS.filter((l) => !l.need || E.has(l.need)).map((l) => l.p);
  const fx = (k) => D.IND_TECHS.reduce((a, t) => a + (st().itech[t.id] && t.fx[k] ? t.fx[k] : 0), 0);
  const mem = () => Object.keys(st().members).map((id) => D.MEMBERS.find((m) => m.id === id)).filter(Boolean);
  const mfx = (k) => mem().reduce((a, m) => a + (typeof m.fx[k] === "number" ? m.fx[k] : 0), 0);
  const msec = (k, sec) => mem().reduce((a, m) => a + ((m.fx[k] || {})[sec] || 0), 0);
  const effSum = (k) => st().effects.reduce((a, e) => a + (typeof e.fx[k] === "number" ? e.fx[k] : 0), 0);
  const effSec = (k, sec) => st().effects.reduce((a, e) => a + ((e.fx[k] || {})[sec] || 0), 0);
  const stockMit = () => Math.min(0.95, D.STOCK[st().stock].mit + fx("stock"));
  const ctx = () => ({ era: era(), eng: staffN("engineer"), sales: staffN("salesman"), idx: secIdx, press: pressList(),
    cap: fx("cap") + mfx("cap") + effSum("cap"), cost: fx("cost") - Math.max(0, effSum("cost")) * (1 - stockMit()), yadd: fx("yadd") + mfx("yadd"), price: fx("price") + effSum("price"),
    ovh: Math.min(0.8, fx("ovh") + mfx("ovh")), dem: fx("dem") + effSum("dem"), imp: (id) => st().improve[id] || 0, patent: (id) => !!st().patents[id],
    sp: (sec) => msec("sp", sec) + effSec("sp", sec), sc: (sec) => msec("sc", sec) + effSec("sc", sec), sdem: () => 0, pdisc: Math.min(0.8, mfx("pdisc")) });
  const lab = () => D.LAB_LV[st().lab];
  const staffMax = (r) => D.STAFF[r].max + lab().staff;
  const patentLimit = () => lab().patents;
  const demand = (id) => EC.demand(id, era());
  const price = (id) => EC.price(id, ctx());
  const unitCost = (id) => EC.unitCost(id);
  const needs = (id) => EC.needs(id);
  const lack = (id) => needs(id).filter((n) => !E.has(n));
  const buildCost = (id, lv) => EC.buildCost(id, lv);
  const upkeep = (id, lv) => EC.upkeep(id, lv);
  const capOf = (lv) => EC.cap(lv, ctx());
  const plan = (id, lv) => EC.plan(id, lv, ctx());

  // ---- 月次決算 ----
  function rollEvents(rep, down) {
    const s = st();
    D.EVENTS.filter((e) => e.era <= era()).forEach((e) => {
      if (Math.random() >= e.p) return;
      if (e.type === "effect") {
        const old = s.effects.find((x) => x.id === e.id);
        if (old) old.left = Math.max(old.left, e.months); else s.effects.push({ id: e.id, name: e.name, emoji: e.emoji, left: e.months, fx: e.fx, desc: e.desc });
        rep.events.push(`${e.emoji}${e.name}: ${e.desc}(${e.months}か月)`);
        return;
      }
      // 災害: 工場に被害
      const ids = Object.keys(s.plants); if (!ids.length) { rep.events.push(`${e.emoji}${e.name}があったが、工場がなく、被害はなかった。`); return; }
      const hit = e.scope === "one" ? [ids[Math.floor(Math.random() * ids.length)]] : ids.filter(() => Math.random() < e.scope);
      if (!hit.length) { rep.events.push(`${e.emoji}${e.name}があったが、工場は、無事だった。`); return; }
      const red = Math.min(0.9, fx("disaster") + mfx("disaster"));
      let loss = 0; hit.forEach((id) => { loss += Math.round(D.ECON.baseCost(id, s.plants[id]) * e.sev * (1 - red)); down[id] = e.name; });
      const cover = D.INSURANCE[s.insure].cover, paid = Math.round(loss * cover);
      rep.dis += loss - paid; rep.insPaid += paid;
      rep.events.push(`${e.emoji}${e.name}: ${hit.map(nm).join("・")}が被災。被害 ${fmt(loss)}G${paid ? `のうち、保険が ${fmt(paid)}G を補償` : ""}。`);
    });
  }
  function settle() {
    const s = st(), rep = { month: month(), lines: [], rev: 0, cost: 0, up: 0, sal: 0, event: "", events: [], pt: 0, dis: 0, insPaid: 0, prem: 0, stk: 0, rsvUse: 0, rsvDep: 0 };
    // 相場の揺れ(ショックは徐々に収まる)
    Object.keys(s.shock).forEach((k) => { s.shock[k] *= 0.6; if (Math.abs(s.shock[k]) < 0.02) delete s.shock[k]; });
    const secs = Object.keys(D.SECTORS);
    if (Math.random() < 0.3) {
      const sec = secs[Math.floor(Math.random() * secs.length)], up = Math.random() < 0.5;
      s.shock[sec] = (up ? 1 : -1) * (0.15 + Math.random() * 0.25);
      rep.event = `${D.SECTORS[sec].emoji}${D.SECTORS[sec].name}の需要が${up ? "急増" : "冷え込み"}している(${up ? "+" : "−"}${Math.round(Math.abs(s.shock[sec]) * 100)}%)`;
    }
    const down = {};
    rollEvents(rep, down);
    const c = ctx();
    const sf = Math.min(0.9, fx("safety") + mfx("safety"));
    const safety = 0.03 / (1 + 0.5 * staffN("safety")) * (1 - sf);
    Object.entries(s.plants).forEach(([id, lv]) => {
      if (down[id]) { rep.lines.push({ id, note: `${down[id]}で停止`, profit: 0 }); return; }
      if (Math.random() < safety) {
        const loss = Math.round(buildCost(id, lv) * 0.3), paid = Math.round(loss * D.INSURANCE[s.insure].cover);
        rep.dis += loss - paid; rep.insPaid += paid; rep.lines.push({ id, note: `事故で停止、修理費 ${loss}G${paid ? `(保険が ${paid}G を補償)` : ""}`, profit: -(loss - paid) }); return;
      }
      const p = D.ECON.plan(id, lv, c);
      rep.rev += p.rev; rep.cost += p.cost; rep.up += p.up;
      rep.lines.push({ id, note: `${p.units}単位生産、${p.sold}単位販売${p.sold < p.out ? "(需要不足)" : ""}`, profit: p.profit });
    });
    Object.entries(s.staff).forEach(([r, n]) => { rep.sal += n * D.STAFF[r].salary; rep.pt += n * (r === "assistant" ? 1 : r === "scientist" ? 3 : 0); });
    mem().forEach((m) => { rep.sal += m.salary; });
    rep.pt += mfx("ptm");
    rep.ovh = D.ECON.overhead(Object.keys(s.plants).length, c);
    // 保険料・備蓄の保管費
    const base = Object.entries(s.plants).reduce((a, [id, lv]) => a + D.ECON.baseCost(id, lv), 0);
    rep.prem = Math.round(base * D.INSURANCE[s.insure].rate * (1 - Math.min(0.9, fx("premium") + mfx("premium"))));
    rep.stk = D.STOCK[s.stock].up;
    rep.roy = 0; Object.keys(s.patents).forEach((id) => { const r_ = D.ECON.royalty(id, c); rep.roy += r_; rep.lines.push({ id, note: "特許のライセンス収入", profit: r_ }); });
    rep.rev += rep.roy; rep.pt += lab().ptm;
    const net = rep.rev - rep.cost - rep.up - rep.sal - rep.ovh - rep.dis - rep.prem - rep.stk;
    rep.net = net;
    if (!easy()) {
      let g = net;
      if (net > 0 && D.RESERVE[s.rsv.lv]) { rep.rsvDep = Math.round(net * D.RESERVE[s.rsv.lv]); g -= rep.rsvDep; s.rsv.bal += rep.rsvDep; }
      s.gold += g;
      if (s.gold < 0 && s.rsv.bal > 0) { rep.rsvUse = Math.min(s.rsv.bal, -s.gold); s.gold += rep.rsvUse; s.rsv.bal -= rep.rsvUse; rep.events.push(`🛟 予備費 ${fmt(rep.rsvUse)}G で、赤字を補った。`); }
      if (s.gold < 0) { // 資金が尽きたら、人員を1人解雇
        const r = Object.keys(s.staff).find((k) => s.staff[k] > 0), mm = Object.keys(s.members)[0];
        s.gold = Math.max(s.gold, 0);
        if (r) { s.staff[r]--; rep.event += ` 資金不足で${D.STAFF[r].name}を1人解雇した。`; }
        else if (mm) { delete s.members[mm]; rep.event += ` 資金不足で、${D.MEMBERS.find((x) => x.id === mm).name}が去った。`; }
      }
    }
    // 継続中のイベントの残り月数を、減らす
    s.effects.forEach((e) => { e.left--; }); s.effects = s.effects.filter((e) => e.left > 0);
    s.log = [...rep.events.map((t) => ({ m: rep.month, t })), ...s.log].slice(0, 12);
    s.earned += Math.max(0, rep.rev);
    if (rep.pt) S().pt += rep.pt;
    s.report = rep; s.hist = [net, ...s.hist].slice(0, 12);
    E.say(`📅 月次決算: 収入 ${fmt(rep.rev)}G / 支出 ${fmt(rep.cost + rep.up + rep.sal + rep.ovh + rep.dis + rep.prem + rep.stk)}G → ${net >= 0 ? "+" : ""}${fmt(net)}G${rep.pt ? ` / 研究 +${rep.pt}pt` : ""}${rep.event ? " / " + rep.event : ""}${rep.events.length ? " / " + rep.events.join(" / ") : ""}`);
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
    ids.forEach((id) => { if (s.paid[id] || !D.sellable(id)) return; s.paid[id] = 1; g += Math.round(D.marketOf(id).price * (1 + mfx("disc"))); });
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
    if ((s.staff[role] || 0) >= staffMax(role)) return;
    if (!canPay(R.hire)) { E.toast("資金が足りない"); return; }
    pay(R.hire); s.staff[role] = (s.staff[role] || 0) + 1;
    E.say(`${R.emoji} ${R.name}を雇った`); E.save(); E.render();
  }
  function fire(role) { const s = st(); if (s.staff[role] > 0) { s.staff[role]--; E.save(); E.render(); } }
  function labUp() {
    const s = st(), n = s.lab + 1, L = D.LAB_LV[n]; if (!L || (S().maxEra || 1) < L.era) return;
    if (!canPay(L.gold) || S().pt < L.pt) { E.toast("資金か知識が足りない"); return; }
    pay(L.gold); S().pt -= L.pt; s.lab = n; E.say("🔬 研究所を「" + L.name + "」に拡張した"); E.save(); E.render();
  }
  const techOk = (t) => !st().itech[t.id] && (S().maxEra || 1) >= t.era && (t.req || []).every((q) => st().itech[q]);
  function itechBuy(id) {
    const t = D.IND_TECHS.find((x) => x.id === id); if (!t || !techOk(t)) return;
    if (!canPay(t.gold) || S().pt < t.pt) { E.toast("資金か知識が足りない"); return; }
    pay(t.gold); S().pt -= t.pt; st().itech[id] = 1; E.say("🏭 産業技術を確立した: " + t.name); E.save(); E.render();
  }
  function patentBuy(id) {
    const s = st(); if (s.patents[id] || !E.has(id) || !D.sellable(id) || Object.keys(s.patents).length >= patentLimit()) return;
    const c = D.ECON.patentCost(id, ctx());
    if (!canPay(c)) { E.toast("資金が足りない"); return; }
    pay(c); s.patents[id] = 1; E.say("📜 " + nm(id) + "の製法特許を取得した"); E.save(); E.render();
  }
  const impCost = (id) => { const lv = st().improve[id] || 0; return { gold: Math.round(D.ECON.baseCost(id, 1) * D.IMPROVE.goldMul * (lv + 1) * (1 - Math.min(0.8, mfx("imp")))), pt: D.IMPROVE.ptMul * (lv + 1) * (items[id].era || 1) }; };
  function improve(id) {
    const s = st(), lv = s.improve[id] || 0; if (!s.plants[id] || lv >= D.IMPROVE.max) return;
    const c = impCost(id);
    if (!canPay(c.gold) || S().pt < c.pt) { E.toast("資金か知識が足りない"); return; }
    pay(c.gold); S().pt -= c.pt; s.improve[id] = lv + 1; E.say("⚙️ " + nm(id) + "の工程を改良した(Lv" + (lv + 1) + ")"); E.save(); E.render();
  }
  function wait(days) { advance(days); E.save(); E.render(); }

  // ---- 画面 ----
  const goldText = () => (easy() ? "∞" : fmt(st().gold));
  function pill(id) { return `<span class="pill">${items[id].emoji} ${items[id].name}</span>`; }
  function overview() {
    const s = st(), era = s.__era, rep = s.report;
    let h = `<div class="ind-top"><div class="stat"><small>資金</small><b>${goldText()} G</b></div><div class="stat"><small>日付</small><b>${dateText()}</b></div>` +
      `<div class="stat"><small>稼働工場</small><b>${Object.keys(s.plants).length}</b></div>${s.effects.length ? `<div class="stat"><small>続いている出来事</small><b>${s.effects.map((e) => e.emoji).join("")}</b></div>` : ""}</div>`;
    h += `<div class="ind-row"><button data-ind="mode">${easy() ? "🟢 イージー(資金は無尽蔵)" : "🔴 ノーマル(資金に限りあり)"}</button>` +
      `<button data-ind="wait" data-d="7">1週間待つ</button><button data-ind="wait" data-d="30">1か月待つ</button><button data-ind="wait" data-d="360">1年待つ</button></div>`;
    h += `<p class="lead">実験は1回ごとに1日かかります。月が変わるたびに、工場の生産と販売、人件費の支払いなどが決算されます。新しい物質を初めて発見すると、試料の売却や特許で謝礼が入ります。</p>`;
    if (rep) {
      h += `<div class="why"><b>📅 前月の決算</b><p>収入 ${fmt(rep.rev)}G${rep.roy ? `(うち特許 ${fmt(rep.roy)}G)` : ""} ／ 原料費 ${fmt(rep.cost)}G ／ 維持費 ${fmt(rep.up)}G ／ 人件費 ${fmt(rep.sal)}G ／ 管理費 ${fmt(rep.ovh || 0)}G${rep.dis ? ` ／ 災害・事故 ${fmt(rep.dis)}G` : ""}${rep.prem ? ` ／ 保険料 ${fmt(rep.prem)}G` : ""}${rep.stk ? ` ／ 保管費 ${fmt(rep.stk)}G` : ""} ⇒ <b>${rep.net >= 0 ? "+" : ""}${fmt(rep.net)}G</b>${rep.pt ? ` ／ 研究 +${rep.pt}pt` : ""}</p>` +
        (rep.event ? `<p>📰 ${rep.event}</p>` : "") + ((rep.events || []).map((t) => `<p>📰 ${t}</p>`).join("")) +
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
      const margin = price(id) - unitCost(id), yi = EC.yieldInfo(id, ctx());
      let b = "";
      if (demand(id) <= 0) b = `<small class="warn">この時代には、需要がありません</small>`;
      else if (lv < 3) {
        const nx = lv + 1, c = buildCost(id, nx) - (lv ? buildCost(id, lv) : 0), p = plan(id, nx);
        b = lk.length ? `<small class="warn">必要な設備: ${lk.map(nm).join("・")}</small>` :
          `<button class="${canPay(c) ? "primary" : ""}" data-ind="build" data-id="${id}" data-lv="${nx}">${lv ? "拡張" : "建設"}: ${D.PLANT_LV[nx].name} (${easy() ? "無料" : fmt(c) + "G"}) 月益 見込 ${p.profit >= 0 ? "+" : ""}${fmt(p.profit)}G</button>`;
      }
      return `<div class="cx"><div class="e">${items[id].emoji}</div><div><h4>${nm(id)} <small>${D.SECTORS[m.sec].name}${m.auto ? "(標準価格)" : ""}</small></h4>` +
        `<p>単価 <b>${fmt(price(id))}G</b> ／ 製造原価 ${fmt(unitCost(id))}G ／ 月の需要 ${demand(id)}単位${D.demandMul(id, m.sec, era()) > 1.4 ? " 📈" : D.demandMul(id, m.sec, era()) < 0.6 ? " 📉" : ""} ／ ${margin > 0 ? "利益あり" : '<span class="warn">赤字</span>'}</p>` +
        `${(() => { const u = D.usesFor(id, era()); return u ? `<p class="use">🏭 第${era()}期の用途: ${u.now}</p>` : ""; })()}${yi ? `<p class="how">⚗️ 工業収率(平衡・反応速度): 1回あたり ${(yi.y * 100).toFixed(0)}% → 未反応分を循環して、実効 ${(yi.yf * 100).toFixed(0)}%(最適: ${yi.temp}℃・${yi.press}気圧)${yi.low ? " <span class=\"warn\">圧力・温度の装置が足りず、収率が低い</span>" : ""}</p>` : ""}<p class="how">${r ? "工業的製法: 実験室の配合(" + r[0].map(nm).join("+") + ")を大規模化" : "採掘・採取・蒸留などで調達"}${lv ? ` ／ <b>現在: ${D.PLANT_LV[lv].name}</b>` : ""}</p>${b}</div></div>`;
    }).join("") || '<p class="lead">売れる品目がまだありません。</p>';
    return h;
  }
  function invest() {
    const s = st(), era_ = era(), nx = D.LAB_LV[s.lab + 1], L = lab();
    let h = `<div class="ind-top"><div class="stat"><small>研究所</small><b>${L.name}</b></div><div class="stat"><small>特許</small><b>${Object.keys(s.patents).length}/${patentLimit()}</b></div><div class="stat"><small>産業技術</small><b>${Object.keys(s.itech).length}/${D.IND_TECHS.length}</b></div></div>`;
    h += `<h3 class="sec">🔬 研究所</h3><div class="cx"><div class="e">🏛️</div><div><h4>${L.name} <small>毎月の知識 +${L.ptm}・人員の上限 +${L.staff}・特許 ${L.patents}件まで</small></h4><p>${L.desc}</p>` +
      (nx ? (era_ < nx.era ? `<small class="warn">第${nx.era}期から拡張できます</small>` : `<button class="${canPay(nx.gold) && S().pt >= nx.pt ? "primary" : ""}" data-ind="lab">「${nx.name}」に拡張 (${easy() ? "無料" : fmt(nx.gold) + "G"}・知識${nx.pt}pt)</button><p class="how">${nx.desc}</p>`) : "<small>最大の規模です</small>") + `</div></div>`;
    h += `<h3 class="sec">🏭 産業技術(工程の改良の研究)</h3><p class="lead">工場全体の効率を上げる研究です。資金と知識ポイントを使います。</p>`;
    h += D.IND_TECHS.map((t) => {
      const done = s.itech[t.id], locked = era_ < t.era, reqNg = (t.req || []).filter((q) => !s.itech[q]);
      return `<div class="cx ${locked ? "unk2" : ""}"><div class="e">${done ? "✅" : "⚙️"}</div><div><h4>${t.name} <small>第${t.era}期</small></h4><p>${t.desc}</p>` +
        (done ? "<small>確立済み</small>" : locked ? `<small class="warn">第${t.era}期から研究できます</small>` : reqNg.length ? `<small class="warn">先に必要: ${reqNg.map((q) => D.IND_TECHS.find((x) => x.id === q).name).join("・")}</small>` : `<button class="${canPay(t.gold) && S().pt >= t.pt ? "primary" : ""}" data-ind="itech" data-id="${t.id}">研究する (${easy() ? "無料" : fmt(t.gold) + "G"}・知識${t.pt}pt)</button>`) + `</div></div>`;
    }).join("");
    const cand = S().have.filter((id) => D.sellable(id) && D.demandMul(id, D.marketOf(id).sec, era_) > 0 && !s.patents[id]).sort((a, b) => D.ECON.royalty(b, ctx()) - D.ECON.royalty(a, ctx())).slice(0, 30);
    h += `<h3 class="sec">📜 特許</h3><p class="lead">${D.PATENT.desc}</p>`;
    h += Object.keys(s.patents).map((id) => `<div class="cx"><div class="e">${items[id].emoji}</div><div><h4>${nm(id)} <small>取得済み</small></h4><p>ライセンス収入 月 <b>${fmt(D.ECON.royalty(id, ctx()))}G</b></p></div></div>`).join("");
    h += cand.map((id) => {
      const c = D.ECON.patentCost(id, ctx()), full = Object.keys(s.patents).length >= patentLimit();
      return `<div class="cx"><div class="e">${items[id].emoji}</div><div><h4>${nm(id)} <small>${D.SECTORS[D.marketOf(id).sec].name}</small></h4><p>ライセンス収入 見込 月 ${fmt(D.ECON.royalty(id, Object.assign(ctx(), { patent: () => true })))}G</p>${full ? '<small class="warn">特許の枠がいっぱい(研究所を拡張)</small>' : `<button class="${canPay(c) ? "primary" : ""}" data-ind="patent" data-id="${id}">特許を取得 (${easy() ? "無料" : fmt(c) + "G"})</button>`}</div></div>`;
    }).join("");
    return h;
  }
  // ---- 研究員(専門分野)と、備え ----
  function memberHire(id) {
    const s = st(), m = D.MEMBERS.find((x) => x.id === id); if (!m || s.members[id]) return;
    if (Object.keys(s.members).length >= D.MEMBER_SLOTS[s.lab]) { E.toast("研究所の枠がいっぱい"); return; }
    if ((S().maxEra || 1) < m.era || (m.need && !E.has(m.need))) return;
    if (!canPay(m.gold) || S().pt < m.pt) { E.toast("資金か知識が足りない"); return; }
    pay(m.gold); S().pt -= m.pt; s.members[id] = 1; E.say(`${m.emoji} ${m.name}を、研究所に迎えた`); E.save(); E.render();
  }
  function memberFire(id) { const s = st(); if (s.members[id]) { delete s.members[id]; E.save(); E.render(); } }
  function setInsure(lv) { const s = st(), I = D.INSURANCE[lv]; if (!I || (I.era && (S().maxEra || 1) < I.era)) return; s.insure = lv; E.say("🛡️ 保険を「" + I.name + "」にした"); E.save(); E.render(); }
  function setStock(lv) {
    const s = st(), T = D.STOCK[lv]; if (!T || (T.era && (S().maxEra || 1) < T.era)) return;
    if (lv > s.stock) { const c = T.gold - D.STOCK[s.stock].gold; if (!canPay(c)) { E.toast("資金が足りない"); return; } pay(c); }
    s.stock = lv; E.say("📦 備蓄を「" + T.name + "」にした"); E.save(); E.render();
  }
  function setReserve(lv) { st().rsv.lv = lv; E.save(); E.render(); }
  function members() {
    const s = st(), slots = D.MEMBER_SLOTS[s.lab], n = Object.keys(s.members).length, era_ = era();
    let h = `<p class="lead">研究所に迎える、専門家です。それぞれ、専門分野に応じた、固有の能力をもちます(枠: ${n}/${slots}・研究所を拡張すると、枠が増えます)。</p>`;
    h += D.MEMBERS.map((m) => {
      const have = s.members[m.id], locked = era_ < m.era || (m.need && !E.has(m.need));
      return `<div class="cx ${locked ? "unk2" : ""}"><div class="e">${m.emoji}</div><div><h4>${m.name} <small>${m.field}・第${m.era}期${m.need ? "・" + nm(m.need) + "が必要" : ""} ／ 給料 ${m.salary}G/月</small></h4><p>${m.desc}</p>` +
        (have ? `<small>在籍中</small> <button data-ind="mfire" data-id="${m.id}">去ってもらう</button>` : locked ? `<small class="warn">${era_ < m.era ? "第" + m.era + "期から" : nm(m.need) + "を発見すると"}迎えられます</small>` : `<button class="${canPay(m.gold) && S().pt >= m.pt && n < slots ? "primary" : ""}" data-ind="mhire" data-id="${m.id}" ${n >= slots ? "disabled" : ""}>迎える (${easy() ? "無料" : fmt(m.gold) + "G"}・知識${m.pt}pt)</button>`) + `</div></div>`;
    }).join("");
    return h;
  }
  function risk() {
    const s = st(), era_ = era(), base = Object.entries(s.plants).reduce((a, [id, lv]) => a + D.ECON.baseCost(id, lv), 0);
    const premMul = 1 - Math.min(0.9, fx("premium") + mfx("premium"));
    let h = `<p class="lead">災害や不況は、突然、やってきます。保険・備蓄・予備費で備えましょう(イージーでは、お金は減りませんが、停止や、需要の変化は起こります)。</p>`;
    if (s.effects.length) h += `<div class="why"><b>⚠️ いま、続いている出来事</b><ul>${s.effects.map((e) => `<li>${e.emoji}${e.name}(あと${e.left}か月): ${e.desc}</li>`).join("")}</ul></div>`;
    h += `<h3 class="sec">🛡️ 保険</h3><div class="ind-row">` + D.INSURANCE.map((I, i) => { const lk = I.era && era_ < I.era; return `<button class="${s.insure === i ? "on" : ""}" data-ind="insure" data-lv="${i}" ${lk ? "disabled" : ""}>${I.name}${i ? ` (補償${Math.round(I.cover * 100)}%・月 ${fmt(base * I.rate * premMul)}G)` : ""}${lk ? " 🔒第" + I.era + "期" : ""}</button>`; }).join("") + `</div>`;
    h += `<h3 class="sec">📦 原料の備蓄</h3><div class="ind-row">` + D.STOCK.map((T, i) => { const lk = T.era && era_ < T.era; return `<button class="${s.stock === i ? "on" : ""}" data-ind="stock" data-lv="${i}" ${lk ? "disabled" : ""}>${T.name}${i ? ` (高騰を${Math.round(T.mit * 100)}%抑える・${easy() ? "無料" : fmt(T.gold) + "G"}・保管費 月${T.up}G)` : ""}${lk ? " 🔒第" + T.era + "期" : ""}</button>`; }).join("") + `</div>`;
    h += `<h3 class="sec">🛟 予備費</h3><p class="lead">黒字の月に、利益の一部を、積み立てます。赤字で資金が尽きたときに、使います。(積立額: <b>${fmt(s.rsv.bal)}G</b>)</p><div class="ind-row">` + D.RESERVE.map((r, i) => `<button class="${s.rsv.lv === i ? "on" : ""}" data-ind="reserve" data-lv="${i}">${i ? "利益の" + Math.round(r * 100) + "%を積み立てる" : "積み立てない"}</button>`).join("") + `</div>`;
    h += `<h3 class="sec">📰 起こりうる出来事(この時代)</h3><table><tr><th>出来事</th><th>確率(月)</th><th>内容</th></tr>${D.EVENTS.filter((e) => e.era <= era_).map((e) => `<tr><td>${e.emoji}${e.name}</td><td>${(e.p * 100).toFixed(1)}%</td><td class="eq">${e.desc}</td></tr>`).join("")}</table>`;
    if (s.log.length) h += `<h3 class="sec">📜 最近の出来事</h3><ul>${s.log.map((l) => `<li>${l.t}</li>`).join("")}</ul>`;
    return h;
  }
  function plants() {
    const s = st(), ids = Object.keys(s.plants);
    if (!ids.length) return '<p class="lead">まだ工場がありません。「市場」から、発見した物質の工場を建てましょう。</p>';
    return ids.map((id) => {
      const lv = s.plants[id], p = plan(id, lv);
      return `<div class="cx"><div class="e">${items[id].emoji}</div><div><h4>${nm(id)} <small>${D.PLANT_LV[lv].name}</small></h4><p>月産 ${p.units}単位 / 販売 ${p.sold}単位 / 収入 ${fmt(p.rev)}G / 原料 ${fmt(p.cost)}G / 維持 ${fmt(p.up)}G ⇒ <b>${p.profit >= 0 ? "+" : ""}${fmt(p.profit)}G</b></p>${(() => { const il = s.improve[id] || 0, c = impCost(id); return il >= D.IMPROVE.max ? `<small>工程の改良 Lv${il}(最大)</small>` : `<small>工程の改良 Lv${il}/${D.IMPROVE.max}</small> <button class="${canPay(c.gold) && S().pt >= c.pt ? "primary" : ""}" data-ind="improve" data-id="${id}">改良する (${easy() ? "無料" : fmt(c.gold) + "G"}・知識${c.pt}pt) 原料費−8%・歩留まり+3%</button>`; })()}</div></div>`;
    }).join("");
  }
  function staff() {
    const era = S().maxEra || 1;
    return `<p class="lead">人を雇うと、毎月、給料がかかります(イージーでは無料)。</p>` + Object.entries(D.STAFF).map(([k, R]) => {
      const n = staffN(k), locked = era < R.era;
      return `<div class="cx ${locked ? "unk2" : ""}"><div class="e">${R.emoji}</div><div><h4>${R.name} <small>${n}/${staffMax(k)}人 ／ 給料 ${R.salary}G/月 ／ 雇用 ${R.hire}G</small></h4><p>${R.desc}</p>` +
        (locked ? `<small class="warn">第${R.era}期から雇えます</small>` : `<button class="${canPay(R.hire) && n < staffMax(k) ? "primary" : ""}" data-ind="hire" data-r="${k}" ${n >= staffMax(k) ? "disabled" : ""}>雇う</button> <button data-ind="fire" data-r="${k}" ${n ? "" : "disabled"}>解雇</button>`) + `</div></div>`;
    }).join("");
  }
  function render() {
    const el = $("indBody"); if (!el) return;
    const s = st();
    const chip = $("goldChip"); if (chip) chip.textContent = goldText();
    const tabs = [["overview", "概要"], ["market", "市場・工場建設"], ["plants", "稼働中の工場"], ["staff", "人員"], ["invest", "研究・投資"], ["members", "研究員"], ["risk", "備え"]];
    el.innerHTML = `<div class="chips msub">${tabs.map(([k, n]) => `<button data-ind="tab" data-k="${k}" class="${tab === k ? "on" : ""}">${n}</button>`).join("")}</div>` + { overview, market, plants, staff, invest, members, risk }[tab]();
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
    else if (a === "lab") labUp();
    else if (a === "itech") itechBuy(t.dataset.id);
    else if (a === "patent") patentBuy(t.dataset.id);
    else if (a === "improve") improve(t.dataset.id);
    else if (a === "mhire") memberHire(t.dataset.id);
    else if (a === "mfire") memberFire(t.dataset.id);
    else if (a === "insure") setInsure(+t.dataset.lv);
    else if (a === "stock") setStock(+t.dataset.lv);
    else if (a === "reserve") setReserve(+t.dataset.lv);
  });

  // ---- 資金で技術(調達)を実行 ----
  const techGold = (t) => t.cost * 25;
  window.IND = { plan, unitCost, buildCost, price, lack, advance, onDiscover, render, easy, canPay, pay, techGold, goldText, date: dateText };
  render();
})();
