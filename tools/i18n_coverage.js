// 英語化の進み具合を調べる: node tools/i18n_coverage.js [--list 表の名前]
//   index.html の読み込み順どおりに、データと辞書を読み込み、英語に置き換えたあとに、日本語のまま残った文字列を、表ごとに数える。
//   --list WHY のように表の名前を付けると、残っている文字列を一覧する(翻訳の作業リスト)。
//   UIの文言($t で包んだもの)の抜けは、ブラウザで I18N.miss を見る(英語で一通り遊んだあと、コンソールで I18N.miss)。
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
// データと辞書だけ(画面のファイルは除く)
const UI = new Set(["molviz.js", "fx.js", "chemui.js", "dynui.js", "historyui.js", "replayui.js", "notebookui.js", "studyui.js", "game.js", "industry.js"]);
const ctx = { navigator: { language: "en" }, document: { documentElement: {} }, localStorage: { getItem() { return null; } }, location: {}, console };
ctx.globalThis = ctx; ctx.window = ctx; vm.createContext(ctx);
for (const f of scripts) {
  if (f === "molviz.js") { try { vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f }); } catch (e) {} continue; }
  if (UI.has(f)) continue;
  try { vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f }); } catch (e) { console.error("load error", f, e.message); }
}
const D = vm.runInContext("DATA", ctx);
const JA = /[ぁ-んァ-ヶ一-龠]/;
const list = process.argv.indexOf("--list") >= 0 ? process.argv[process.argv.indexOf("--list") + 1] : null;
const rows = [];
for (const k of Object.keys(D)) {
  const seen = new Set(); const uniq = new Set(); let chars = 0;
  (function w(v) {
    if (typeof v === "string") { if (JA.test(v) && !uniq.has(v)) { uniq.add(v); chars += v.length; } return; }
    if (!v || typeof v !== "object" || seen.has(v) || typeof v === "function") return; seen.add(v);
    if (v instanceof Map) { v.forEach((x, y) => { w(y); w(x); }); return; }
    if (v instanceof Set) { v.forEach(w); return; }
    for (const x of Object.keys(v)) w(v[x]);
  })(D[k]);
  if (uniq.size) rows.push([k, uniq.size, chars, uniq]);
  if (list === k) console.log([...uniq].join("\n"));
}
if (!list) {
  rows.sort((a, b) => b[2] - a[2]);
  const total = rows.reduce((a, r) => a + r[2], 0);
  console.log("日本語のまま残っているデータ(英語モード)  表 / 文字列の数 / 文字数");
  rows.forEach((r) => console.log(r[0].padEnd(18), String(r[1]).padStart(5), String(r[2]).padStart(7)));
  console.log("合計", total, "文字");
  const IT = D.ITEM_ROWS;
  console.log("\nアイテム:", IT.length, "/ 名前が日本語のまま:", IT.filter((r) => JA.test(r[1])).length, "/ 説明が日本語のまま:", IT.filter((r) => JA.test(r[5] || "")).length);
  console.log("レシピの文が日本語のまま:", D.RECIPE_ROWS.filter((r) => JA.test(r[2] || "")).length, "/", D.RECIPE_ROWS.length);
}
