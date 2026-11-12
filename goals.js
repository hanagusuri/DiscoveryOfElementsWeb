// 目標・依頼・手がかり・未発見シルエット。game.js の後に読み込む。
// 「次に何を目指すか」を見せて、総当たりを推理に変える。
(function () {
  const E = window.EOD, D = E && E.DATA;
  if (!E || !D) return;
  const $ = (id) => document.getElementById(id);
  const S = () => E.S();
  const items = E.items, has = E.has;
  const nm = (id) => (items[id] ? items[id].emoji + items[id].name : id);

  // 依頼: [id, 依頼人, 文章, ほしいもの, 見えるようになる条件(持っている物)]
  // 文章には、答えの名前も作り方も書かない。「何に困っているか」だけを書く。
  const ORDER_ROWS = [
    ["pottery", "🧓 村の長老", "水を溜められて、火にかけても割れない器がほしい。土と火で、何とかならんか。", "pottery"],
    ["charcoal", "⚒ 鍛冶屋", "薪では火力が足りん。煙が少なくて、もっと熱く燃える燃料はないか。", "charcoal", ["pottery"]],
    ["salt", "🐟 漁師", "獲った魚を長持ちさせたい。海の水を煮詰めると、白い粒が残るそうだ。", "salt", ["seawater"]],
    ["soap", "🧺 洗濯女", "油汚れがどうしても落ちない。泡立って、汚れを落とすものはないかしら。", "soap", ["lye"]],
    ["glass", "🏺 商人", "向こうが透けて見える器を売りたい。砂から作れるという噂だ。", "glass", ["sand"]],
    ["copper", "⛏ 旅の鉱夫", "緑の石を拾ったが、使い道が分からん。炭の火にくべたら、何か起きるだろうか。", "copper", ["copper_ore", "charcoal"]],
    ["bronze", "⚔ 兵士長", "銅は柔らかすぎて、刃がすぐ曲がる。もっと硬い金属がほしい。", "bronze", ["copper", "tin"]],
    ["wine", "🍇 神官", "祭りで使う、酔わせる飲み物がほしい。果実を壺に入れて待てば、とか。", "wine", ["fruit", "pottery"]],
    ["iron", "⚒ 鍛冶屋", "青銅よりさらに強い金属が、赤茶の石の中に眠っているそうだ。", "iron", ["iron_ore", "bronze"]],
    ["alcohol", "🩺 医者", "傷口を清める、強い液体がほしい。酒を、何とか濃くできないか。", "alcohol", ["alembic", "wine"]],
    ["mercury", "🧪 錬金術師", "赤い石を熱すると、流れる銀が出てくると古い書にある。", "mercury", ["cinnabar", "alembic"]],
    ["vitriol_acid", "⚗ 師の錬金術師", "どんな金属も溶かす、強い酸を作りたい。緑の結晶に、火を入れてみよ。", "sulfuric", ["vitriol", "alembic"]],
    ["gunpowder", "🏰 将軍", "雷のように爆ぜる粉があるという。城壁を崩せるほどの。", "gunpowder", ["saltpeter", "sulfur", "charcoal"]],
    ["aqua_regia", "👑 金細工師", "金だけは、どんな酸にも溶けない。王でも溶かす液はないものか。", "aqua_regia", ["nitric", "hcl"]],
    ["phosphorus", "🌙 夜の錬金術師", "暗闇で光る物質があるそうだ。人の尿から取れると聞いた。", "phosphorus", ["urine", "alembic"]],
    ["silver", "💰 造幣の役人", "鉛の中に、銀が隠れているという。取り出す方法を知りたい。", "silver", ["lead"]],
    ["brass", "🎺 楽器職人", "金色に輝いて、加工しやすい金属がほしい。銅に何かを混ぜるのか?", "brass", ["copper", "zinc"]],
    ["paper", "📜 書記", "羊皮紙は高すぎる。もっと安い、書き物の素材はないか。", "paper", ["cellulose"]],
    ["leather", "👞 靴屋", "獣の皮は、すぐに腐ってしまう。長持ちさせる方法はないか。", "leather", ["tannin", "fat"]],
    ["indigo", "🎨 染物屋", "空のように深い青で、布を染めたい。", "indigo", ["indigo_plant", "lye"]],
    ["quinine", "🩺 旅の医者", "熱病を鎮める木の皮がある。その薬効の本体を、取り出したい。", "quinine", ["cinchona_bark", "alcohol"]],
    ["sucrose", "🍬 菓子職人", "サトウキビの汁から、白く固い甘味を取りたい。", "sucrose", ["sugar_cane"]],
    ["combustion", "🔥 学者", "物はなぜ燃える? 燃えて重くなる金属があるのはなぜだ?", "combustion", ["balance"]],
    ["cement", "🏗 建築家", "石より硬く固まる、粉の材料がほしい。石灰石が鍵らしい。", "cement", ["lime"]],
    ["steam_engine", "🚂 鉄道技師", "水蒸気の力で、重い荷を動かせないか。", "steam_engine", ["iron"]],
    ["battery", "🔋 発明家", "雷のような力を、持ち運べる箱に入れたい。金属と酸が関わりそうだ。", "battery", ["zinc", "sulfuric"]],
    ["dynamo", "⚡ 技師", "回し続ければ、電気が生まれる機械はできないか。", "dynamo", ["electromagnet"]],
    ["microscope", "🔬 博物学者", "目に見えない小さな世界を、のぞいてみたい。", "microscope", ["lens"]],
    ["petroleum_kerosene", "🏮 灯火商", "鯨の油は高い。地下の黒い油から、明るい灯りの油は作れないか。", "kerosene", ["petroleum"]],
    ["plastic", "🏭 工場主", "割れず、錆びず、成形できる、新しい素材がほしい。", "plastic", ["petroleum"]],
    ["fertilizer", "🌾 農夫", "畑がやせて、作物が育たない。空気中の窒素を、肥料にできないか。", "fertilizer", ["ammonia"]],
    ["penicillin", "🏥 軍医", "傷が膿んで死ぬ兵が多すぎる。カビが、菌を抑えると聞いたのだが。", "penicillin", ["microbe"]],
    ["semiconductor", "📡 研究者", "電気を通したり、通さなかったりする、不思議な物質があるらしい。", "semiconductor", ["electron"]],
    ["transistor", "📻 技術者", "真空管は大きく熱い。もっと小さな、増幅の素子はないか。", "transistor", ["semiconductor"]],
    ["dna", "🧬 生物学者", "遺伝の正体は、いったい何でできているのだろう。", "dna", ["nucleic"]],
  ];
  const ORDERS = ORDER_ROWS.map(([id, who, text, want, after]) => ({ id, who, text, want, after: after || [] })).filter((o) => items[o.want]);
  D.ORDERS = ORDERS;
  const rewardOf = (o) => { const era = items[o.want].era || 1; return { pt: 2 + era, gold: 20 * era * (1 + era) }; };

  // ---- 未発見の「シルエット」: 今の手持ちで、見通せる範囲の未発見アイテム ----
  const src = {}; // id -> {rec:[recipe]}
  E.recipes.forEach((r) => r.out.forEach((o) => (src[o] = src[o] || []).push(r)));
  const techOf = (id) => D.TECHS.find((t) => t.grants.includes(id));
  const sameName = (id, text) => text.split(items[id].name).join("◯");
  function teaser(id) {
    const u = D.USES && D.USES[id];
    if (!u) return "";
    const t = sameName(id, String(u).split("。")[0]);
    return t.length > 42 ? t.slice(0, 42) + "…" : t;
  }
  function silhouettes(limit) {
    const S_ = S(), orderWants = new Set(visibleOrders().map((o) => o.want));
    const L = [];
    E.order.forEach((id) => {
      if (has(id) || orderWants.has(id) || id === S_.goal) return;
      let lvl = null; // 0=今の手持ちで試せる, 1=あと1つ
      (src[id] || []).forEach((r) => { const m = r.inp.filter((i) => !has(i)).length; if (m <= 1 && (lvl === null || m < lvl)) lvl = m; });
      const t = techOf(id);
      if (t && t.req.every(has)) lvl = lvl === null ? 0 : Math.min(lvl, 0);
      if (lvl === null) return;
      const era = items[id].era;
      if (era > E.currentEra()) return;
      L.push({ id, lvl, era });
    });
    L.sort((a, b) => a.lvl - b.lvl || b.era - a.era);
    return L.slice(0, limit);
  }

  // ---- 依頼 ----
  const orderDone = (o) => !!S().orders[o.id];
  function visibleOrders() {
    const era = E.currentEra();
    return ORDERS.filter((o) => !orderDone(o) && (has(o.want) || (items[o.want].era <= era && o.after.every(has))));
  }
  function claim(id) {
    const o = ORDERS.find((x) => x.id === id);
    if (!o || orderDone(o) || !has(o.want)) return;
    const r = rewardOf(o), s = S();
    s.orders[o.id] = 1; s.pt += r.pt;
    if (window.IND && IND.reward) IND.reward(r.gold);
    E.say($t(`📜 依頼を達成した: {0} (+{1}pt{2})`, [$t(o.who), r.pt, window.IND && !IND.easy() ? ` / +${r.gold}G` : ""]));
    E.toast($t("📜 依頼を達成!") + " +" + r.pt + "pt");
    if (window.JOURNAL) JOURNAL.add(s, { t: "industry", text: $t("依頼を果たした: ") + $t(o.who) + " → " + items[o.want].name });
    E.save(); E.render();
  }

  // ---- 表示 ----
  let open = true;
  const kindName = (id) => E.TYPE_LABEL[items[id].type];
  const kindCount = () => S().clues.length;
  function clueText(c) {
    const ids = c.ids.map(nm).join(" + ");
    const k = { swap: $t("近い(どれか1つが違う?)"), extra: $t("余計なものが入っている?"), short: $t("あと1つ足りない?") }[c.k];
    return `<span>${ids}</span> <small>${k}</small>`;
  }
  function render() {
    const el = $("goalPanel");
    if (!el) return;
    const s = S();
    // 目標を達成したら、外す
    if (s.goal && has(s.goal)) { s.goal = null; E.save(); }
    s.clues = (s.clues || []).filter((c) => { const r = E.recipeByKey[c.rk]; return r && !r.out.every(has); });
    const vo = visibleOrders().slice(0, 4), sil = silhouettes(5);
    const claimable = vo.filter((o) => has(o.want)).length;
    let h = "";
    // 目標
    if (s.goal) {
      const g = s.goal, plan = E.goalPlan(g);
      h += `<div class="gl-goal"><b>${$t("🎯 目標")}</b> <span class="gl-q">❔</span> ${kindName(g)}・${$t("第{0}期", [items[g].era])}${items[g].name.length ? " ・" + "◯".repeat(Math.min(items[g].name.length, 12)) : ""} <button data-goal="">${$t("外す")}</button>` +
        `<p>${teaser(g) ? $t("用途: ") + teaser(g) : ""}</p>` +
        `<p class="how">${$t("「ヒント」ボタンは、この目標への道筋を、示すようになる。")}${plan ? "" : $t("(今は、道筋が見えない)")}</p></div>`;
    }
    // 依頼
    if (vo.length) {
      h += `<h4 class="sec">${$t("📜 依頼")}</h4>` + vo.map((o) => {
        const r = rewardOf(o), done = has(o.want), goal = s.goal === o.want;
        const ind = window.IND && !IND.easy();
        return `<div class="gl-row ${done ? "ok" : ""}"><div class="e">❔</div><div><p><b>${$t(o.who)}</b>: “${$t(o.text)}”</p><p class="how">${$t("報酬: 知識 +{0}", [r.pt])}${ind ? " / " + r.gold + "G" : ""} ・ ${kindName(o.want)}${done ? " ・ " + nm(o.want) : ""}</p></div>` +
          (done ? `<button class="primary" data-claim="${o.id}">${$t("納品")}</button>` : `<button class="${goal ? "on" : ""}" data-goal="${o.want}">${goal ? $t("目標中") : $t("目標にする")}</button>`) + `</div>`;
      }).join("");
    }
    // 手がかり
    if (s.clues.length) {
      h += `<h4 class="sec">${$t("🔍 手がかり(実験で見えた兆し)")}</h4>` + s.clues.slice(0, 6).map((c) => `<div class="gl-clue">${clueText(c)}</div>`).join("");
    }
    // シルエット
    if (sil.length) {
      h += `<h4 class="sec">${$t("❔ 次に狙えそうなもの")}</h4>` + sil.map((x) => {
        const it = items[x.id], goal = s.goal === x.id, tz = teaser(x.id);
        return `<div class="gl-row"><div class="e">❔</div><div><p><b>${kindName(x.id)}</b> <small>${$t("第{0}期", [x.era])} ・ ${"◯".repeat(Math.min(it.name.length, 12))}</small></p>${tz ? `<p class="how">${$t("用途: ")}${tz}</p>` : ""}</div><button class="${goal ? "on" : ""}" data-goal="${x.id}">${goal ? $t("目標中") : $t("目標にする")}</button></div>`;
      }).join("");
    }
    if (!h) h = `<p class="lead">${$t("今は、見通せる目標がない。新しい素材や道具を、見つけよう。")}</p>`;
    const sum = (s.goal ? "🎯 " : "") + $t("目標・依頼") + (vo.length ? ` <small>📜${vo.length}${claimable ? " ✅" + claimable : ""}</small>` : "") + (s.clues.length ? ` <small>🔍${s.clues.length}</small>` : "");
    el.innerHTML = `<details class="gl" ${open ? "open" : ""}><summary>${sum}</summary>${h}</details>`;
    const d = el.querySelector("details");
    d.addEventListener("toggle", () => { open = d.open; });
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("[data-goal],[data-claim]");
    if (!t) return;
    if (t.dataset.claim) { claim(t.dataset.claim); return; }
    if (t.dataset.goal !== undefined) { const g = t.dataset.goal; E.setGoal(g && S().goal !== g ? g : null); }
  });
  window.GOALS = { render, claim, ORDERS, silhouettes, visibleOrders };
  render();
})();
