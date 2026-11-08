const fs=require("fs");let a=fs.readFileSync("admin.js","utf8");
const x="    h += `<div class=\"card\"><h3 style=\"margin:0 0 6px\">業界ごと</h3>";
if(!a.includes(x))throw new Error("anchor");
const blk = `    // 災害・不況への備え: 研究ありの場合の工場群(建設費の合計)で、年間の期待損失と、保険料を比べる
    const baseSum = Object.entries(simR.built).reduce((s_, [id, lv]) => s_ + EC.baseCost(id, lv), 0), np = Math.max(1, Object.keys(simR.built).length);
    const dis = D.EVENTS.filter((e) => e.type === "disaster" && e.era <= ec.era), lossYear = dis.reduce((s_, e) => s_ + 12 * e.p * e.sev * baseSum * (e.scope === "one" ? 1 / np : e.scope), 0);
    h += \`<div class="card"><h3 style="margin:0 0 6px">災害・不況への備え(\${np}工場・建設費の合計 \${Math.round(baseSum).toLocaleString()}G の場合)</h3><p class="muted">災害による年間の期待損失は、約 <b>\${Math.round(lossYear).toLocaleString()}G</b>(保険なし)。保険は、保険料と、補償される期待額を比べて、割に合うかが、分かります。(保険数理の研究・専門家で、保険料は下がります)</p>\` +
      \`<table><tr><th>保険</th><th>補償</th><th>年間の保険料</th><th>期待される補償額</th><th>差し引き</th></tr>\${D.INSURANCE.slice(1).map((I) => { const prem = 12 * baseSum * I.rate, pay = lossYear * I.cover; return \\`<tr><td>\\${I.name}(第\\${I.era}期〜)</td><td>\\${Math.round(I.cover * 100)}%</td><td>\\${Math.round(prem).toLocaleString()}G</td><td>\\${Math.round(pay).toLocaleString()}G</td><td style="color:\\${pay - prem >= 0 ? "#6ee7a8" : "#ff9a5a"}">\\${pay - prem >= 0 ? "+" : ""}\\${Math.round(pay - prem).toLocaleString()}G</td></tr>\\`; }).join("")}</table>\` +
      \`<table style="margin-top:8px"><tr><th>出来事</th><th>月の確率</th><th>年に1回以上</th><th>内容</th></tr>\${D.EVENTS.filter((e) => e.era <= ec.era).map((e) => \\`<tr><td>\\${e.emoji}\\${e.name}</td><td>\\${(e.p * 100).toFixed(1)}%</td><td>\\${((1 - Math.pow(1 - e.p, 12)) * 100).toFixed(0)}%</td><td class="eq">\\${e.desc}</td></tr>\\`).join("")}</table></div>\`;
`;
a=a.replace(x,blk+x);fs.writeFileSync("admin.js",a);
