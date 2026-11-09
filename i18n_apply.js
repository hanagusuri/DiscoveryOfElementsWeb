// 英語のとき、ゲームのデータ(アイテム名・説明・レシピの文・技術・時代・元素名)を、英語に置き換える。
// 全てのデータファイルの後、UI のファイルの前に読み込む。日本語のときは、何もしない。
//   - アイテム: I18N.items[id] = [名前, 説明]  /  レシピ: I18N.recipes[キー] = 文  /  技術: I18N.techs[id] = [名前, 説明]
//   - 由来(note)は、年代の判定(historyui)が日本語の原文を使うので、ここでは置き換えず、表示のときに I18N.tr で訳す
//   - 訳が無い項目は、日本語のまま(未訳でも動く)
(function () {
  const I = window.I18N;
  if (!I || I.lang !== "en" || typeof DATA === "undefined") return;
  const D = DATA;
  const keyOf = (ids) => [...ids].sort().join("+");
  const set = (row, i, v) => { if (v != null && v !== "") row[i] = v; };

  // 元素: 記号で、英語名を当てる(アイテム名・周期表)
  const EL = I.elNames || {};
  D.ITEM_ROWS.forEach((r) => { if (r[3] === "element" && r[7] && EL[r[7]]) r[1] = EL[r[7]]; });
  if (typeof PERIODIC !== "undefined") PERIODIC.forEach((e) => { if (EL[e[1]]) e[2] = EL[e[1]]; });
  if (typeof PERIODIC_CAT_NAME !== "undefined") Object.keys(PERIODIC_CAT_NAME).forEach((k) => { PERIODIC_CAT_NAME[k] = I.tr(PERIODIC_CAT_NAME[k]); });
  if (typeof PREDICTED !== "undefined") Object.keys(PREDICTED).forEach((k) => { PREDICTED[k] = I.tr(PREDICTED[k]); });

  // アイテムの名前・説明
  const IT = I.items || {};
  D.ITEM_ROWS.forEach((r) => { const t = IT[r[0]]; if (t) { set(r, 1, t[0]); set(r, 5, t[1]); } });

  // レシピの文(発見したときの物語)
  const RC = I.recipes || {};
  D.RECIPE_ROWS.forEach((r) => { const t = RC[keyOf(r[0])]; if (t) r[2] = t; if (typeof r[5] === "string") r[5] = I.tr(r[5]); });

  // 技術
  const TC = I.techs || {};
  D.TECHS.forEach((t) => { const x = TC[t.id]; if (x) { if (x[0]) t.name = x[0]; if (x[1]) t.desc = x[1]; } });

  // 時代・温度の段階
  D.ERAS.forEach((e) => { if (e) { e.name = I.tr(e.name); e.sub = I.tr(e.sub); } });
  D.TEMPS.forEach((t) => { if (t) { t.name = I.tr(t.name); t.c = I.tr(t.c); } });

  // データの表: 値の文字列を、辞書で置き換える(キー名・数値・記号は、そのまま)。ロジックに使う語を含む表は、ここに入れない
  const TABLES = ["HAZ_KINDS", "COOL_NAME", "EQUIP_LINES", "EQUIP_WHY", "BONDS", "SOURCES", "ELECTRODE_LABEL", "SPECIES", "LAB_LV", "PLANT_LV", "INSURANCE", "STOCK", "PATENT", "STAFF", "SECTORS", "EVENTS", "MEMBERS", "IND_TECHS", "KNOW_FX", "DIST"];
  const seen = new Set();
  const walkT = (v) => {
    if (!v || typeof v !== "object" || seen.has(v)) return; seen.add(v);
    Object.keys(v).forEach((k) => { const x = v[k]; if (typeof x === "string") v[k] = I.tr(x); else walkT(x); });
  };
  TABLES.forEach((k) => { if (D[k]) walkT(D[k]); });

  // 由来(note)の訳は、表示のときに I18N.note() で引く(i18n_en_notes.js)
})();
