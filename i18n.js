// 多言語対応(日本語 ja / 英語 en)。
// 方針: ソースコード中の文言は「日本語の原文」のまま $t("原文") で包み、英語の辞書(I18N.en)を引く。
//   - 辞書に無い文言は、原文(日本語)のまま表示される(訳が未完でも、ゲームは壊れない)
//   - テンプレートの差し込みは {0} {1} … 。 $t("…{0}…", [値]) / 辞書側も同じ {0} を使う
//   - 言語の切り替えは、保存してページを読み込み直す(多くのデータが、読み込み時に作られるため)
(function (g) {
  const KEY = "eod_lang";
  let lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  if (lang !== "ja" && lang !== "en") lang = /^ja/i.test((g.navigator && navigator.language) || "ja") ? "ja" : "en";

  const I = { lang, en: {}, items: {}, recipes: {}, techs: {}, elNames: {}, rev: new Map(), miss: new Set() }; // miss: 訳が無かった原文(開発用: コンソールで I18N.miss を見る)
  // 辞書を追加する: I18N.add({ "日本語": "English", ... })
  I.add = (d) => { Object.assign(I.en, d); };
  I.set = (l) => { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); };
  const fill = (s, a) => (a ? s.replace(/\{(\d+)\}/g, (m, i) => (a[i] === undefined ? m : a[i])) : s);

  // $t(原文, [差し込み]) → 現在の言語の文言
  g.$t = (ja, args) => {
    if (lang !== "en") return fill(ja, args);
    const e = I.en[ja];
    if (e == null && /[぀-ヿ一-鿿]/.test(ja)) I.miss.add(ja);
    const out = fill(e != null ? e : ja, args);
    if (e != null) { // 効果音などが、日本語の文言を手がかりにしている。訳文から原文を引けるように、直近のものを覚えておく
      I.rev.set(out, fill(ja, args));
      if (I.rev.size > 400) I.rev.delete(I.rev.keys().next().value);
    }
    return out;
  };
  // 訳文 → 日本語の原文(分からなければ、そのまま)
  I.src = (s) => (lang === "en" && I.rev.has(s) ? I.rev.get(s) : s);

  // データの上書き: 日本語の文言を、英語に置き換える(ゲームの索引が作られる前に、1度だけ呼ぶ)
  //   map: { 日本語: English }  /  すべての文言を、辞書で置き換えると、ロジックに使う語が壊れるので、項目を指定して呼ぶ
  I.note = (s) => s; // 由来の訳(i18n_en_notes.js が、上書きする)
  I.tr = (s) => (lang === "en" && typeof s === "string" && I.en[s] != null ? I.en[s] : s);

  // 画面に最初からある文言(index.html)を訳す: テキストと、placeholder/title の属性
  I.dom = (root) => {
    if (lang !== "en" || !root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => { const s = n.nodeValue, t = s.trim(); if (t && I.en[t] != null) n.nodeValue = s.replace(t, I.en[t]); });
    root.querySelectorAll("[placeholder],[title]").forEach((el) => ["placeholder", "title"].forEach((a) => { const v = el.getAttribute(a); if (v && I.en[v] != null) el.setAttribute(a, I.en[v]); }));
  };

  g.I18N = I;
  if (g.document) document.documentElement.lang = lang;
})(typeof window !== "undefined" ? window : globalThis);
