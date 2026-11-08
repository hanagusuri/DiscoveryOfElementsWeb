// 産業経済のバランス検証: node tools/econ.js
const fs = require("fs"), path = require("path");
const v = fs.readFileSync(path.join(__dirname, "validate.js"), "utf8");
let D;
for (const f of [...v.matchAll(/require\("\.\.\/([^"]+)"\)/g)].map((m) => m[1])) { const m = require(path.join(__dirname, "..", f)); if (m && m._D) D = m._D; }
const EC = D.ECON, IT = {}; D.ITEM_ROWS.forEach((r) => { IT[r[0]] = r[1]; });
for (const era of [1, 2, 3, 4]) {
  const ids = EC.available(era), ctx = { era, press: [1, 10, 100, 300] };
  const rows = ids.map((id) => { const p = EC.plan(id, 1, ctx); return { id, p, pb: p.profit > 0 ? EC.buildCost(id, 1) / p.profit : Infinity }; });
  const good = rows.filter((r) => r.pb < 12), pbs = rows.filter((r) => isFinite(r.pb)).map((r) => r.pb).sort((a, b) => a - b);
  console.log(`第${era}期: 建てられる ${ids.length}品目 / 黒字 ${pbs.length} / 12か月以内に回収 ${good.length} / 回収月数の中央値 ${pbs.length ? pbs[pbs.length >> 1].toFixed(1) : "-"}`);
  const top = rows.filter((r) => r.p.profit > 0).sort((a, b) => b.p.profit - a.p.profit).slice(0, 3).map((r) => `${IT[r.id]}(月${Math.round(r.p.profit)}G)`).join(" ");
  console.log("  月益トップ:", top);
  const s = EC.simulate(era, 36), h = s.hist;
  console.log(`  36か月の見込み(100Gから、最良の投資を繰り返す): 6か月 ${h[5].gold}G/${h[5].plants}工場, 12か月 ${h[11].gold}G, 36か月 ${h[35].gold}G/${h[35].plants}工場, 月収 ${h[35].net}G`);
}
// 研究・特許への自動投資あり/なしの比較(120か月)
console.log("--- 研究・特許への投資(120か月) ---");
for (const era of [2, 3, 4]) {
  const a = EC.simulate(era, 120, {}).hist, b = EC.simulate(era, 120, { research: true }).hist;
  const c = EC.simulate(era, 120, { research: true, members: true, improve: true }).hist;
  console.log(`第${era}期: 月収 工場だけ ${a[119].net}G → 研究・特許 ${b[119].net}G → +研究員・工程改良 ${c[119].net}G (産業技術 ${c[119].techs}件・研究所Lv${c[119].lab}・特許 ${c[119].patents}件・研究員 ${c[119].members}人・改良Lv計 ${c[119].imp})`);
}
