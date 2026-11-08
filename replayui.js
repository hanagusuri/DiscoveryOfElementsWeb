// 歴史上の実験の追体験(化学タブのサブタブ)。historyui.js の後、game.js の前に読み込む。
(function () {
  "use strict";
  const base = window.EODX; if (!base) return;
  let api = null;
  const D = () => api.DATA, S = () => api.S(), has = (id) => api.has(id) || S().cheat, items = () => api.items;
  const n0 = base.subs.length;
  const H = () => { const s = S(); if (!s.hh) s.hh = { read: {}, solved: {}, ok: 0, tot: 0 }; if (!s.hh.replay) s.hh.replay = {}; return s.hh; };
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const nm = (id) => (items()[id] ? items()[id].name : id);
  const rp = { cur: null, s: {} }; // 実行中の課題の、状態
  const R = () => D().REPLAY;
  const def = (id) => D().REPLAYS.find((x) => x.id === id);
  const state = (id) => (rp.s[id] = rp.s[id] || { m: {}, mis: 0, runs: [], v: {} });

  const LESSON = {
    pauling: "主鎖の N−H と C=O が、4つ先のアミノ酸と、水素結合で結びつく、らせん(αヘリックス、1回転あたり約3.6個)が、最も安定。結合の長さ・角度の、正確なデータから、構造を、予測できる。タンパク質の形(折りたたみ)が、働きを決める。",
    sanger: "タンパク質は、アミノ酸が、決まった順序で、つながった鎖。端を標識し、鎖を切って、断片の重なりを、つなぎ合わせると、順序が決まる。この考えで、インスリンの全配列が決まった(1955年)。配列が、働きを、決める。",
    carothers: "縮合重合で、長い鎖を得るには、原料のモル比を1:1に近づけ、反応を、ほぼ完全に進める(水を取り除く)。平均重合度は、(1+r)÷(1+r−2rp)。反応が、99%以上、進んで、はじめて、糸を引ける、長さになる。",
    avogadro: "ファラデー定数(電子1 molの電気量)を、電気素量(電子1個の電気量)で割ると、1 mol あたりの粒子の数(アボガドロ定数、約6.0×10²³)が求まる。別の方法でも、同じ値になることが、原子・分子の実在を、示した。",
    bragg: "X線を結晶に当てると、原子の面で反射した波が、特定の角度で、強め合う(nλ = 2d sinθ)。角度から、面の間隔(約0.28 nm)が測れ、原子の、並び方が分かる。この方法が、DNAやタンパク質の、構造解析にも、使われた。",
    moseley: "元素の特性X線のエネルギーは、原子番号(核の陽子数)で、決まる。周期表の並びの、本当の基準は、原子量ではなく、原子番号。これで、未発見の元素(43、61、72、75番など)の、探索の、指針が、確かになった。",
    miller: "原始地球を、模した気体に、雷のような放電を続けると、アミノ酸ができた。生命の材料は、生命のない環境で、自然にできうる。生命の起源を、化学で、実験的に調べる(化学進化の研究)道を開いた。",
    watsoncrick: "DNAの塩基は、AとT、GとCが、対になる(シャルガフの規則)。X線写真は、らせん構造を示した。この対とらせんを、組み合わせると、二重らせん。一方の鎖が決まれば、他方が決まるので、遺伝情報が、正確に、複製される。",
    fleming: "カビの周りだけ、細菌が育たない。カビが、抗菌物質を出している。ごく微量で、効き、細菌の種類で、効き方が違う。この観察が、フローリーとチェーンらの、ペニシリンの精製と、抗生物質の時代につながった。",
    brown: "目に見えない水の分子が、絶えず、不規則に動いて、微粒子にぶつかるため、粒がふらふらと動く。平均二乗変位は、時間に比例し、温度が高いほど、大きい。ペランは、これを測って、分子の実在を、確かめた(1908年)。",
    hahn: "ウランに中性子を当てると、バリウムができた。ラジウムなら、分別結晶で、濃縮されるはずなのに、されない。原子核が、割れたのだ(核分裂)。化学分析が、物理学の理論(原子核の分裂)を、裏づけた。",
    bernard: "糖を含まない食事でも、血液に糖があり、洗い流した肝臓にも、糖が再び現れた。動物の体は、糖を、自ら作り、一定に保つ(内部環境の恒常性)。のちに、インスリンなどのホルモンによる、調節が、明らかになった。",
    bunsen: "元素は、固有の位置に、スペクトル線を出す。表にない線は、未知の元素のしるし。ブンゼンとキルヒホフは、この方法で、セシウムとルビジウムを発見し、太陽の成分も、調べられるようにした。",
    boyle: "温度が一定なら、気体の圧力と体積の積は、一定(ボイルの法則)。気体は、圧縮すると、圧力が高くなる。この法則が、ポンプ、圧縮機、真空技術の、基礎になった。",
    gaylussac: "圧力が一定なら、気体の体積は、絶対温度に比例する。気体の種類に、よらない。この性質から、絶対零度の考えが、生まれ、気体を冷やして、液体にする、技術につながった。",
    rutherford: "金箔に当てたα粒子の、ごくまれな、大きな跳ね返りから、原子の正電荷と質量は、ごく小さな中心(原子核)に、集中していると分かった。原子は、ほとんど空っぽ。ぶどうパン模型は、覆された。",
    mendeleev: "周期表の空欄の元素の性質を、予測し、のちに、発見された元素と、比べられた。予測と検証が、理論を、強くする。傾向は、予測できるが、融点のように、単純には、予測できない性質もある。",
    haber: "平衡の有利さ(低温・高圧)と、反応の速さ(高温・触媒)の、折り合いを、探すのが、工業プロセスの、条件探し。ハーバーとボッシュは、この折り合いを、約400〜500℃・200気圧付近に、見つけた。",
    millikan: "油滴の電荷は、基本の値(約1.6×10⁻¹⁹ C)の整数倍にしかならない。電気の量には、最小の単位があり、電子という粒子が、存在することを、示した。",
    lavoisier: "天秤で、反応の前後の質量を量ると、燃焼(酸化)は、物質が、空気中の酸素と結びつく変化で、全体の質量は、変わらないことが分かった。これが、質量保存の法則。定量的な測定が、フロギストン説に、決着をつけた。",
    priestley: "水銀灰を熱すると、金属の水銀と、燃焼を助ける気体(酸素)に分かれる。プリーストリーは、結果を、フロギストン説で解釈したが、同じ実験を、ラヴォアジエが、酸素説で、説明し直した。事実は、同じでも、解釈で、結論が変わる。",
    cavendish: "水素と酸素は、体積比2:1で、過不足なく反応する。気体の体積比が、簡単な整数比になるのは、同じ体積の気体に、同じ数の分子が、含まれるから(アヴォガドロの法則)。水の組成が H₂O であることを、示す。",
    pasteur: "同じ分子式でも、左右が、鏡像の関係にある分子(鏡像異性体)がある。一方は、光を右に、もう一方は、左に、同じ角度だけ、回す。等量を混ぜると、打ち消し合って、光を回さない(ラセミ体)。生体の分子は、片方だけを、使う。",
    faraday: "析出する物質の質量は、流れた電気の量(電流×時間)に、比例する。同じ電気の量なら、物質1 mol あたり、必要な電子の数は、イオンの価数で、決まる(Cu²⁺なら、2個)。電気と物質のつながりが、のちの、電子の発見の、手がかりになった。",
    wohler: "無機物から、有機物の尿素ができた。しかも、シアン酸アンモニウムと尿素は、同じ原子数でも、性質が違う異性体。『有機物は、生命の力でしか作れない』という、生気論に、打撃を与え、異性体の概念も、生んだ。",
  };

  // ---- 部品 ----
  function mcq(id, key, q, opts, ans, why) {
    const s = state(id), got = s.m[key]; // got: {tried:[], ok:bool}
    const tried = (got && got.tried) || [], ok = got && got.ok;
    let h = `<div class="why"><b>${esc(q)}</b></div><div class="ind-row">` + opts.map((o, i) => {
      const cls = ok && i === ans ? "primary" : tried.includes(i) ? "warnb" : "";
      return `<button class="${cls}" data-rp="mcq" data-k="${key}" data-i="${i}" data-ans="${ans}" ${ok ? "disabled" : ""}>${esc(o)}</button>`;
    }).join("") + `</div>`;
    if (ok) h += `<p class="use">✅ ${esc(why)}</p>`; else if (tried.length) h += `<p class="warn">❌ 観察したデータを、もう一度、見直してみよう。</p>`;
    return h;
  }
  const done = (id, key) => !!(state(id).m[key] && state(id).m[key].ok);
  const mcqsDone = (id, keys) => keys.every((k) => done(id, k));
  const slider = (key, label, min, max, step, val, unit) => `<div class="drow"><span class="dl">${label}</span><input type="range" class="dr" data-rpin="${key}" min="${min}" max="${max}" step="${step}" value="${val}"><span class="dv"><b id="rpv_${key}">${val}</b> ${unit}</span></div>`;
  const table = (head, rows) => `<table class="rptb"><tr>${head.map((x) => `<th>${x}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")}</table>`;

  // ---- 課題ごとの画面。戻り値: { html, finished } ----
  const views = {
    lavoisier(id) {
      const s = state(id), L = (sealed) => s.v[sealed ? "sealed" : "open"];
      let h = `<div class="ind-row"><button data-rp="lav" data-sealed="0">開放した坩堝で、加熱する</button><button data-rp="lav" data-sealed="1">密閉したフラスコで、加熱する</button></div>`;
      const o = L(false), c = L(true);
      if (o) h += `<div class="why"><b>🔥 開放(坩堝)</b>` + table(["", "質量"], [["錫(加熱前)", o.metalBefore.toFixed(2) + " g"], ["加熱後(灰になった錫)", o.metalAfter.toFixed(2) + " g"]]) + `</div>`;
      if (c) h += `<div class="why"><b>🔥 密閉(フラスコ全体)</b>` + table(["", "質量"], [["加熱前(フラスコ+錫+空気)", c.before.toFixed(2) + " g"], ["加熱後(密閉したまま)", c.afterClosed.toFixed(2) + " g"], ["栓を開けた(空気が流れ込む音)", c.afterOpen.toFixed(2) + " g"]]) + `<p class="muted">中の錫は、一部が、白い灰に変わっていた。(中の固体の質量: ${c.metalBefore.toFixed(2)} g → ${c.metalAfter.toFixed(2)} g)</p></div>`;
      if (!(o && c)) return { html: h + `<p class="lead">開放と密閉の、両方を、行って、データを集めよう。</p>`, finished: false };
      h += mcq(id, "a", "開放して熱すると、錫の灰は、元の錫より?", ["重くなった", "軽くなった", "変わらない"], 0, "重くなった。フロギストンが『逃げる』なら、軽くなるはず。何かが、加わったことになる。");
      if (done(id, "a")) h += mcq(id, "b", "密閉したまま、フラスコ全体の質量は、加熱の前後で?", ["増えた", "減った", "変わらない(0.01 g の測定誤差の範囲)"], 2, "変わらない。外から、何も入っていないので、全体の質量は、保存される。");
      if (done(id, "b")) h += mcq(id, "c", "栓を開けると、空気が、流れ込んで、質量が増えた。フラスコの中で、何が起こったと考えられる?", ["フロギストンが、フラスコの外に、逃げた", "空気の一部が、錫と結びついて、フラスコの中の気体が、減った", "錫が、別の元素に、変わった"], 1, "空気の一部(のちに、酸素と名づけられた)が、錫と結びついた。だから、灰は重くなり、中の気体が減って、圧力が下がり、栓を開けると、空気が入った。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    priestley(id) {
      const s = state(id), m = s.v.mass || 10;
      let h = `<div class="why"><b>🔆 レンズで、水銀灰を加熱する</b></div>` + slider("mass", "酸化水銀(水銀灰)", 1, 20, 1, m, "g") + `<div class="ind-row"><button data-rp="pri">レンズで、光を集めて、加熱する</button></div>`;
      if (s.v.res) { const r = s.v.res; h += `<div class="why">` + table(["", "量"], [["水銀灰", r.m + " g"], ["できた水銀(銀色の玉)", r.hg + " g"], ["集めた気体の体積(水上置換)", r.o2mL + " mL"]]) + `<p class="muted">気体の体積は、室温・1気圧で、約24 L/mol として、計算している。</p></div>`; }
      if (!s.v.res) return { html: h, finished: false };
      const tests = [["candle", "ろうそくを入れる", "炎が、空気中より、はるかに明るく、激しく燃えた!"], ["splint", "火種(くすぶる線香)を入れる", "再び、炎を上げて、燃え出した。"], ["lime", "石灰水に通す", "白く濁らない。(二酸化炭素ではない)"], ["water", "水に、どれだけ溶けるか", "ほとんど、溶けない。(水上置換で、集められる)"]];
      h += `<div class="why"><b>🧪 この気体の、性質を調べよう(2つ以上)</b></div><div class="ind-row">` + tests.map((t) => `<button class="${s.v["t_" + t[0]] ? "on" : ""}" data-rp="pritest" data-t="${t[0]}">${t[1]}</button>`).join("") + `</div>`;
      h += tests.filter((t) => s.v["t_" + t[0]]).map((t) => `<p>▶ ${t[1]}: <b>${t[2]}</b></p>`).join("");
      if (tests.filter((t) => s.v["t_" + t[0]]).length < 2) return { html: h, finished: false };
      h += mcq(id, "a", "水銀灰 10 g から、得られる酸素は、約何 mL?(2HgO → 2Hg + O₂)", ["約55 mL", "約550 mL", "約5500 mL"], 1, "10 g ÷ 216.6 = 0.046 mol の HgO から、O₂ は、半分の 0.023 mol。24 L/mol をかけると、約550 mL。");
      if (done(id, "a")) h += mcq(id, "b", "ろうそくが、空気中より、明るく燃えた理由は?", ["酸素の割合が、空気(約21%)より、高いから", "気体が、熱かったから", "水銀の蒸気が、燃えたから"], 0, "ほぼ純粋な酸素なので、約5倍の濃度。燃焼は、酸素との結合だから、激しくなる。");
      return { html: h, finished: mcqsDone(id, ["a", "b"]) };
    },
    cavendish(id) {
      const s = state(id), h2 = s.v.h2 || 40, o2 = s.v.o2 || 40, runs = s.runs;
      let h = `<div class="why"><b>⚡ ユーディオメーター</b>: 管に、気体を入れて、電気の火花を飛ばし、反応後の、残りの気体を、測る。</div>` + slider("h2", "水素", 10, 100, 1, h2, "mL") + slider("o2", "酸素", 10, 100, 1, o2, "mL") + `<div class="ind-row"><button data-rp="gas">火花を飛ばす</button></div>`;
      if (runs.length) h += table(["水素", "酸素", "反応した水素", "反応した酸素", "残った気体", "できた水"], runs.slice(-8).map((r) => [r.h2 + " mL", r.o2 + " mL", r.used.h2 + " mL", r.used.o2 + " mL", r.left.h2 > 0 ? `水素 ${r.left.h2} mL` : r.left.o2 > 0 ? `酸素 ${r.left.o2} mL` : '<b style="color:#6ee7a8">なし!</b>', r.waterMg + " mg"]));
      if (!runs.some((r) => r.exact)) return { html: h + `<p class="lead">残る気体が、出ない(ちょうど反応しきる)組み合わせを、探そう。</p>`, finished: false };
      h += `<p class="use">✅ 残る気体がない比を、見つけた!</p>` + mcq(id, "a", "ちょうど、反応しきった、水素と酸素の体積比は?", ["1 : 1", "2 : 1", "1 : 2"], 1, "水素 2 : 酸素 1。同じ温度・圧力では、気体の体積は、分子の数に比例する(アヴォガドロの法則)。");
      if (done(id, "a")) h += mcq(id, "b", "水素2体積と、酸素1体積から、水ができる。水の1分子には、水素原子と酸素原子が、どんな比で、含まれる?", ["水素 : 酸素 = 1 : 1", "水素 : 酸素 = 2 : 1", "水素 : 酸素 = 1 : 2"], 1, "2H₂ + O₂ → 2H₂O。水の分子は、水素原子2個と、酸素原子1個からなる(H₂O)。");
      return { html: h, finished: mcqsDone(id, ["a", "b"]) };
    },
    pasteur(id) {
      const s = state(id), cr = s.v.cr || (s.v.cr = R().crystals(11)), lab = s.v.lab || (s.v.lab = Array(10).fill(null));
      const svg = (c) => { const w = 54, hgt = 54, k = c.size, x0 = 27, y0 = 27, pts = [[-16, -20], [16, -20], [24, 0], [16, 20], [-16, 20], [-24, 0]].map(([x, y]) => [x0 + x * k, y0 + y * k]), p = pts.map((q) => q.join(",")).join(" ");
        const fx = c.side === "R" ? 1 : -1, facet = `${x0 + fx * 24 * k},${y0} ${x0 + fx * 16 * k},${y0 - 20 * k} ${x0 + fx * 16 * k},${y0 + 20 * k}`; // 小さな面が、右か、左に付く
        return `<svg viewBox="0 0 ${w} ${hgt}" width="54" height="54" style="transform:rotate(${c.tilt}deg)"><polygon points="${p}" fill="#7fb0d8" stroke="#cfe6f7" stroke-width="1.2"/><polygon points="${facet}" fill="#e8a33d" stroke="#fff3d0" stroke-width="1"/></svg>`; };
      let h = `<div class="why"><b>🔬 顕微鏡で、結晶を観察する</b><p>どの結晶にも、橙色の小さな面が、付いている。面が、右側(右型)か、左側(左型)かを、1つずつ、ピンセットで、仕分けよう。</p></div><div class="crow">` +
        cr.map((c, i) => `<div class="cry">${svg(c)}<div class="ind-row"><button class="${lab[i] === "L" ? "on" : ""}" data-rp="lab" data-i="${i}" data-v="L">左型</button><button class="${lab[i] === "R" ? "on" : ""}" data-rp="lab" data-i="${i}" data-v="R">右型</button></div></div>`).join("") + `</div>`;
      if (!s.v.sorted) {
        if (lab.every((x) => x)) h += `<div class="ind-row"><button class="primary" data-rp="sortdone">仕分け完了</button></div>`;
        if (s.v.fail) h += `<p class="warn">❌ 仕分けに、まちがいがありました(${s.v.fail}個)。もう一度、面が付いている、側を、よく見よう。</p>`;
        return { html: h, finished: false };
      }
      const rot = R().rotation;
      h += `<div class="why"><b>🌀 旋光計</b>` + table(["溶液", "旋光度"], [["右型の結晶を、溶かした液", `+${rot.R.toFixed(1)}°(右に回す)`], ["左型の結晶を、溶かした液", `${rot.L.toFixed(1)}°(左に回す)`], ["両方を、等量、混ぜた液", `${rot.mix.toFixed(1)}°(回さない)`]]) + `</div>`;
      h += mcq(id, "a", "等量を混ぜると、旋光度が、0になるのは、なぜ?", ["右に回す分と、左に回す分が、同じ大きさで、打ち消し合うから", "溶けて、別の物質に、変わるから", "測定の誤差だから"], 0, "鏡像の関係にある分子は、光を、同じ角度だけ、逆向きに回す。等量では、打ち消し合う(ラセミ体)。");
      if (done(id, "a")) h += mcq(id, "b", "右型と左型の酒石酸は、どんな関係の分子?", ["鏡像異性体(原子のつながりは、同じで、立体配置が、鏡像)", "構造異性体(原子のつながりが、違う)", "同位体(中性子の数が、違う)"], 0, "鏡像異性体。右手と左手のように、重ね合わせられない。化学的性質は、ほぼ同じだが、光の回し方と、生体への作用が、異なる。");
      return { html: h, finished: mcqsDone(id, ["a", "b"]) };
    },
    faraday(id) {
      const s = state(id), I = s.v.I || 2, t = s.v.t || 20, runs = s.runs;
      let h = `<div class="why"><b>⚡ 硫酸銅の水溶液を、電気分解する</b>: 陰極に、銅が析出する。天秤で、析出した銅の質量を、測る。</div>` + slider("I", "電流", 0.5, 5, 0.5, I, "A") + slider("t", "時間", 5, 60, 5, t, "分") + `<div class="ind-row"><button data-rp="far">電気分解する</button></div>`;
      if (runs.length) h += table(["電流", "時間", "電気の量(電流×時間)", "析出した銅"], runs.slice(-8).map((r) => [r.I + " A", r.t + " 分", r.Q + " C", r.cu.toFixed(3) + " g"]));
      if (runs.length < 4 || new Set(runs.map((r) => r.Q)).size < 3) return { html: h + `<p class="lead">電流と時間を、いろいろ変えて、4回以上(電気の量が、3通り以上)、測ろう。</p>`, finished: false };
      h += mcq(id, "a", "電気の量(電流×時間)が、2倍になると、析出する銅の質量は?", ["半分", "変わらない", "2倍"], 2, "質量は、電気の量に、比例する(ファラデーの法則)。");
      if (done(id, "a")) h += mcq(id, "b", "電流を2倍にして、時間を半分にすると、析出する銅の質量は?", ["半分", "同じ", "2倍"], 1, "電気の量が、同じ(電流×時間)なので、析出する量も、同じ。");
      if (done(id, "b")) h += mcq(id, "c", "銅 1 mol(63.55 g)を析出させるのに、約 193000 C(=96500 C × 2)が必要だった。Cu²⁺ が Cu になるのに、必要な電子の数は?", ["1個", "2個", "4個"], 1, "Cu²⁺ + 2e⁻ → Cu。1 mol の電子は 96500 C(ファラデー定数)。銅は 2 mol の電子が、必要。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    wohler(id) {
      const s = state(id), T = R().wohlerTests;
      let h = `<div class="why"><b>🧪 結晶の正体を、調べよう</b><p>A: 原料のシアン酸アンモニウム / B: 加熱して得た、無色の結晶 / C: 尿から取り出した、尿素。試験を選んで、3つの性質を、比べる(3つ以上)。</p></div><div class="ind-row">` + T.map((t) => `<button class="${s.v["t_" + t.id] ? "on" : ""}" data-rp="wt" data-t="${t.id}">${t.name}</button>`).join("") + `</div>`;
      const ran = T.filter((t) => s.v["t_" + t.id]);
      if (ran.length) h += table(["試験", "A シアン酸アンモニウム", "B 加熱後の結晶", "C 尿の尿素"], ran.map((t) => [t.name, t.a, t.b, t.b]));
      if (ran.length < 3 || !ran.some((t) => ["ag", "hno3", "oxalic", "mp"].includes(t.id))) return { html: h + `<p class="lead">性質の違いが、分かる試験を、含めて、3つ以上、選ぼう。</p>`, finished: false };
      h += mcq(id, "a", "結果から、加熱後の結晶(B)は?", ["シアン酸アンモニウムのまま", "尿素と、同じ性質をもつ、別の物質", "何も分からない"], 1, "BはAとは違う性質を示し、Cの尿素と、すべて一致する。加熱で、尿素に変わったと判断できる。");
      if (done(id, "a")) h += mcq(id, "b", "この実験の意義は?", ["無機物から、有機物(尿素)を、人間が、作れた", "尿素が、無機物だと、分かった", "尿素の融点が、分かった"], 0, "生物の体の外で、無機物から、尿素(有機物)を作れた。『有機物は、生命力がないと、作れない』という、生気論への、反証になった。");
      if (done(id, "b")) h += mcq(id, "c", "シアン酸アンモニウム(NH₄OCN)と尿素(CO(NH₂)₂)は、同じ原子数なのに、性質が違う。この関係は?", ["異性体", "同素体", "同位体"], 0, "分子式が同じで、原子のつながりが違う物質を、異性体という。ヴェーラーの発見は、異性体の概念にもつながった。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    boyle(id) {
      const s = state(id), hh = s.v.h === undefined ? 0 : s.v.h, runs = s.runs;
      let h = `<div class="why"><b>🧪 J字管に、水銀を注ぎ足す</b>: 閉じた側の、空気の柱の長さ(cm)を、測る。圧力 = 大気圧(760 mmHg) + 水銀の高さの差。</div>` + slider("h", "水銀の高さの差", 0, 1500, 100, hh, "mmHg") + `<div class="ind-row"><button data-rp="boy">測定する</button></div>`;
      if (runs.length) h += table(["水銀の高さの差", "圧力 P", "空気の柱の長さ L", "P × L"], runs.slice(-8).map((r) => [r.h + " mmHg", r.P + " mmHg", r.L.toFixed(2) + " cm", r.PV.toLocaleString()]));
      if (runs.length < 5 || new Set(runs.map((r) => r.h)).size < 4) return { html: h + `<p class="lead">水銀の高さを変えて、5回以上(4通り以上)、測ろう。</p>`, finished: false };
      h += mcq(id, "a", "圧力が2倍になると、空気の柱の長さ(体積)は?", ["2倍", "半分", "変わらない"], 1, "半分になる。圧力と体積は、反比例する。");
      if (done(id, "a")) h += mcq(id, "b", "圧力と長さをかけた値(P × L)は?", ["圧力が増すと、増える", "ほぼ一定(測定の誤差の範囲)", "圧力が増すと、減る"], 1, "ほぼ一定。温度が、変わらないとき、P × V = 一定(ボイルの法則)。");
      if (done(id, "b")) h += mcq(id, "c", "温度を変えずに、気体を、3分の1の体積に、圧縮すると、圧力は?", ["3分の1", "同じ", "3倍"], 2, "3倍。圧縮機は、この性質を使って、気体を高圧にする。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    gaylussac(id) {
      const s = state(id), T = s.v.T === undefined ? 0 : s.v.T, runs = s.runs;
      let h = `<div class="why"><b>🌡️ 一定の圧力で、気体を温める</b>: 0℃で 1.000 L の気体を、いろいろな温度にして、体積を測る。</div>` + slider("T", "温度", -20, 100, 10, T, "℃") + `<div class="ind-row"><button data-rp="cha">測定する</button></div>`;
      if (runs.length) h += table(["温度(℃)", "温度(0℃を273.15 K として)", "体積 V", "V ÷ 温度(K)"], runs.slice(-8).map((r) => [r.T + " ℃", r.K + " K", r.V.toFixed(3) + " L", r.VT.toFixed(5)]));
      if (runs.length < 5 || new Set(runs.map((r) => r.T)).size < 5) return { html: h + `<p class="lead">温度を変えて、5回以上(5通り)、測ろう。</p>`, finished: false };
      h += mcq(id, "a", "体積は、何に、比例して増える?", ["摂氏温度(℃)", "絶対温度(K、−273.15℃を0とする)", "温度によらず、一定"], 1, "絶対温度に比例する(V ÷ T が、ほぼ一定)。摂氏温度に比例するなら、0℃で体積が0になってしまう。");
      if (done(id, "a")) h += mcq(id, "b", "V ÷ 温度(K)の値は?", ["ほぼ一定", "温度が上がると、増える", "温度が上がると、減る"], 0, "ほぼ一定(約 0.00366 L/K)。気体の種類によらない。");
      if (done(id, "b")) h += mcq(id, "c", "冷やして、グラフを延ばすと、体積が0になる温度は?", ["0 ℃", "約 −273 ℃(絶対零度)", "約 −100 ℃"], 1, "約 −273 ℃。これが、絶対零度。実際には、その前に、気体が液体になる。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    rutherford(id) {
      const s = state(id), tot = s.v.tot || [0, 0, 0, 0], N = tot.reduce((a, b) => a + b, 0);
      let h = `<div class="why"><b>🎯 α粒子を、金箔に当てる</b><p>ぶどうパン模型(トムソン)の、予測: ほとんどの粒子は、まっすぐ進み、わずかに曲がる程度。90°以上、跳ね返る粒子は、ほぼ0。</p></div><div class="ind-row"><button data-rp="rut" data-n="1000">1,000個 当てる</button><button data-rp="rut" data-n="5000">5,000個 当てる</button><button data-rp="rut" data-n="20000">20,000個 当てる</button></div>`;
      const pct = (x) => (N ? (x / N * 100).toFixed(N > 5000 ? 4 : 3) + "%" : "—");
      if (N) h += table(["角度", "粒子の数(累計)", "割合"], [["ほぼ直進(〜5°)", tot[0].toLocaleString(), pct(tot[0])], ["少し曲がる(5〜30°)", tot[1].toLocaleString(), pct(tot[1])], ["大きく曲がる(30〜90°)", tot[2].toLocaleString(), pct(tot[2])], ["跳ね返る(90°以上)", `<b>${tot[3]}</b>`, pct(tot[3])]]) + `<p class="muted">これまでに、${N.toLocaleString()} 個の粒子を、当てた。</p>`;
      if (tot[3] < 1) return { html: h + `<p class="lead">跳ね返る粒子は、ごくまれ。見つかるまで、続けよう。</p>`, finished: false };
      h += `<p class="use">✅ 跳ね返った粒子が、見つかった!(「ティッシュペーパーに、15インチの砲弾を撃って、跳ね返ってきたような、ものだ」— ラザフォード)</p>`;
      h += mcq(id, "a", "ほとんどの粒子が、素通りした。原子の内部は?", ["ほとんど、空っぽ(物質のある部分は、ごく小さい)", "ぎっしりと、詰まっている", "一様な、粘土のよう"], 0, "ほとんど空っぽ。α粒子は、ほとんど、何にも、ぶつからずに通り抜ける。");
      if (done(id, "a")) h += mcq(id, "b", "ごくまれに、大きく跳ね返る粒子があった。何が、考えられる?", ["原子の質量と、正電荷が、小さな中心(原子核)に、集中している", "実験の失敗", "電子が、α粒子を、跳ね返した"], 0, "重い、正に帯電した、小さな核に、α粒子(正電荷)が、正面衝突して、はね返された。電子は、軽すぎて、α粒子を、跳ね返せない。");
      if (done(id, "b")) h += mcq(id, "c", "原子核の大きさは、原子全体の、およそ何分の1?", ["同じくらい", "約1万〜10万分の1", "約半分"], 1, "約1万〜10万分の1。原子を、野球場の大きさにたとえると、原子核は、中心の、ビー玉ほど。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    mendeleev(id) {
      const E = R().eka, s = state(id), w = s.v.w === undefined ? 68 : s.v.w, d = s.v.d === undefined ? 5.5 : s.v.d;
      let h = `<div class="why"><b>🗂️ 周期表の、空欄(アルミニウムの下)の元素の、性質を予測する</b><p>空欄の、上下左右の元素の、データを、参考にしよう。</p></div>` + table(["元素", "原子量", "密度(g/cm³)", "融点(℃)"], E.neighbors.map((n) => [n[0], n[1], n[2], n[3]])) +
        `<p class="muted">上下: アルミニウム ↔ インジウム、左右: 亜鉛 ↔ ヒ素。</p>` + slider("w", "予測する原子量", 50, 100, 0.5, w, "") + slider("d", "予測する密度", 3, 9, 0.1, d, "g/cm³") + `<div class="ind-row"><button data-rp="eka">予測して、発見された元素と、比べる</button></div>`;
      if (!s.v.res) return { html: h, finished: false };
      const r = s.v.res;
      h += `<div class="why"><b>📣 1875年、ガリウムが、発見された</b>` + table(["", "あなたの予測", "実際のガリウム", "ずれ"], [["原子量", r.w, E.actual.w, r.ew], ["密度(g/cm³)", r.d, E.actual.d, r.ed], ["融点(℃)", "(平均:" + Math.round((660 + 157) / 2) + ")", E.actual.mp, "大きい"]]) + `<p class="muted">メンデレーエフの予言: 原子量 約${E.predicted.w}、密度 約${E.predicted.d}。</p></div>`;
      if (!r.ok) return { html: h + `<p class="warn">❌ まだ、ずれが大きい(原子量±4、密度±0.6 に、入れたい)。隣の元素の、値の平均を、参考に、もう一度。</p>`, finished: false };
      h += `<p class="use">✅ 予測が、的中した!</p>` + mcq(id, "a", "融点は、上下の元素の、平均(約410℃)で、予測すると、実際(約30℃)と、大きくずれた。なぜ?", ["性質によっては、傾向が、単純な平均では、ならないから", "ガリウムは、周期表に、合わないから", "測定が、間違っていたから"], 0, "密度や原子量は、平均に近いが、融点などは、結合の仕方に左右される。法則は、傾向を教えるが、細部まで、予測できるわけではない。");
      if (done(id, "a")) h += mcq(id, "b", "ガリウムの発見で、周期表が、広く認められた理由は?", ["未知の元素の性質を予測し、あとで、確かめられたから", "周期表が、美しかったから", "原子量が、正確だったから"], 0, "予測が、あとで、検証された。確かめられる予測ができることが、科学の理論の、強みだ。");
      if (done(id, "b")) h += mcq(id, "c", "周期表の予測があると、新元素を探すとき、有利な点は?", ["どんな性質の物質を、探せばよいか、分かる", "探す必要が、なくなる", "偶然に、頼るしかない"], 0, "性質の見当がつくので、鉱石の、どこに、どのような方法で探せばよいか、方針が立つ。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    haber(id) {
      const s = state(id), T = s.v.T === undefined ? 450 : s.v.T, runs = s.runs;
      const Ps = D().PRESS_LEVELS.filter((l) => !l.need || has(l.need)).map((l) => l.p), P = Ps.includes(s.v.P) ? s.v.P : Ps[0];
      let h = `<div class="why"><b>⚗️ N₂ + 3H₂ ⇌ 2NH₃(発熱反応)</b>: 鉄の触媒を使い、温度と圧力を変えて、1時間反応させたときの、アンモニアの収率を、測る。</div>` + slider("T", "温度", 200, 700, 25, T, "℃") +
        `<div class="ind-row"><span class="muted">圧力:</span>` + Ps.map((p) => `<button class="${P === p ? "on" : ""}" data-rp="hp" data-p="${p}">${p}気圧</button>`).join("") + `</div><div class="ind-row"><button data-rp="hab">反応させる</button></div>`;
      if (runs.length) h += table(["温度", "圧力", "平衡での収率(上限)", "1時間で、平衡に近づいた割合", "実際の収率"], runs.slice(-10).map((r) => [r.T + " ℃", r.P + " 気圧", (r.eq * 100).toFixed(0) + "%", (r.approach * 100).toFixed(0) + "%", `<b>${(r.y * 100).toFixed(1)}%</b>`]));
      if (!runs.some((r) => r.y >= 0.3)) return { html: h + `<p class="lead">実際の収率が、30%以上になる条件を、探そう。(低温は、平衡では有利だが、反応が…?)</p>`, finished: false };
      h += `<p class="use">✅ 収率30%以上の条件を、見つけた!</p>` + mcq(id, "a", "温度を上げると、平衡での収率の上限は?(この反応は、発熱反応)", ["下がる", "上がる", "変わらない"], 0, "下がる。発熱反応は、温度を上げると、平衡が、原料側に傾く(ル・シャトリエの原理)。");
      if (done(id, "a")) h += mcq(id, "b", "圧力を上げると、収率の上限は?(気体の分子数は、4個から、2個に減る)", ["下がる", "上がる", "変わらない"], 1, "上がる。分子数が減る向き(生成物側)に、平衡が、傾く。");
      if (done(id, "b")) h += mcq(id, "c", "低温ほど、平衡は有利なのに、約400〜500℃で、行うのは、なぜ?", ["低温では、反応が、遅すぎて、実際には、ほとんど進まないから", "低温では、装置が壊れるから", "触媒が、低温では、反応を起こさないから"], 0, "平衡の有利さと、反応の速さの、折り合い。触媒で、反応を速め、必要な高圧を、かける。これが、ハーバー・ボッシュ法の、考え方。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    millikan(id) {
      const s = state(id), runs = s.runs;
      let h = `<div class="why"><b>🔋 油滴の電荷を、測る</b>: 電場をかけて、油滴を、浮かべ、1つ1つの、電荷を求める。(単位: 10⁻¹⁹ C)</div><div class="ind-row"><button data-rp="mil">油滴を、1つ測る</button></div>`;
      if (runs.length) h += `<p>測定した電荷: ` + runs.map((r) => `<span class="chip">${r.q.toFixed(2)}</span>`).join("") + `</p><p class="muted">小さい順: ${runs.map((r) => r.q).sort((a, b) => a - b).map((q) => q.toFixed(2)).join(" , ")}</p>`;
      if (runs.length < 8) return { html: h + `<p class="lead">あと ${8 - runs.length} 個以上、測ろう。値の並びに、規則は、ないだろうか。</p>`, finished: false };
      h += mcq(id, "a", "測った電荷の値は?", ["どんな値でも、連続的に、散らばっている", "ある基本の値の、整数倍に、集まっている", "すべて、同じ値"], 1, "基本の値の整数倍(1倍、2倍、3倍…)になっている。");
      if (done(id, "a")) h += mcq(id, "b", "その、基本の値(電気素量)は、約?", ["約 0.16 × 10⁻¹⁹ C", "約 1.6 × 10⁻¹⁹ C", "約 16 × 10⁻¹⁹ C"], 1, "最も小さい値が、約1.6。他の値は、その整数倍。電子1個の電荷の大きさに、あたる。");
      if (done(id, "b")) h += mcq(id, "c", "この結果は、電気について、何を示している?", ["電気の量には、最小の単位があり、とびとびの値になる", "電気は、連続した、液体のようなものだ", "電気は、存在しない"], 0, "電荷は、量子化されている。電子という粒子が、存在することの、決定的な証拠になった。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    brown(id) {
      const s = state(id), t = s.v.t === undefined ? 10 : s.v.t, TT = s.v.TT || 20, runs = s.runs;
      let h = `<div class="why"><b>🔬 顕微鏡で、水に浮かぶ微粒子(直径1 µm)を、観察する</b>: 一定時間の間に、粒が、どれだけ動いたかを、100個の粒で、測り、平均する(平均二乗変位、µm²)。</div>` + slider("t", "観察する時間", 1, 30, 1, t, "秒") +
        `<div class="ind-row"><span class="muted">水の温度:</span>` + [20, 40, 60].map((x) => `<button class="${TT === x ? "on" : ""}" data-rp="bT" data-t="${x}">${x}℃</button>`).join("") + `</div><div class="ind-row"><button data-rp="bro">観察する</button></div>`;
      if (runs.length) {
        const last = runs[runs.length - 1], xs = last.path.map((p) => p[0]), ys = last.path.map((p) => p[1]), ext = Math.max(0.5, ...xs.map(Math.abs), ...ys.map(Math.abs)), sc = 60 / ext;
        h += `<div class="why"><b>直近の、1個の粒の、軌跡</b><svg viewBox="-70 -70 140 140" width="140" height="140" style="display:block"><rect x="-70" y="-70" width="140" height="140" fill="#0e1016"/><polyline fill="none" stroke="#e8a33d" stroke-width="1" points="${last.path.map((p) => (p[0] * sc).toFixed(1) + "," + (p[1] * sc).toFixed(1)).join(" ")}"/><circle cx="0" cy="0" r="2.5" fill="#6ec1b0"/></svg><p class="muted">目盛り: 枠の端は、約 ${ext.toFixed(2)} µm</p></div>`;
        h += table(["観察時間", "水の温度", "平均二乗変位"], runs.slice(-8).map((r) => [r.t + " 秒", r.T + " ℃", r.msd.toFixed(2) + " µm²"]));
      }
      const at20 = new Set(runs.filter((r) => r.T === 20).map((r) => r.t)).size, Ts = new Set(runs.map((r) => r.T)).size;
      if (runs.length < 6 || at20 < 3 || Ts < 2) return { html: h + `<p class="lead">時間を変えて(20℃で3通り以上)、温度も変えて、6回以上、観察しよう。</p>`, finished: false };
      h += mcq(id, "a", "観察する時間が2倍になると、平均二乗変位は?", ["約2倍(時間に比例)", "約4倍", "変わらない"], 0, "時間に比例する。粒は、不規則に、ふらふらと、動くので、距離そのものではなく、二乗の平均が、時間に比例する。");
      if (done(id, "a")) h += mcq(id, "b", "水の温度を上げると、平均二乗変位は?", ["大きくなる", "小さくなる", "変わらない"], 0, "大きくなる。温度が高いほど、水の分子の運動が激しく、(水の粘りも小さくなって)粒が、よく動く。");
      if (done(id, "b")) h += mcq(id, "c", "死んだ花粉や、鉱物の粉でも、同じように動く。動きの原因は?", ["目に見えない水の分子が、粒に、あらゆる方向から、不規則に、ぶつかっているから", "粒が、生きているから", "光が、粒を、押しているから"], 0, "水分子が、絶えず、不規則に運動し、粒に衝突している(分子の熱運動)。ペランは、この動きの大きさから、分子の大きさと数を求め、分子の実在を、確かめた。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    hahn(id) {
      const s = state(id), steps = s.runs;
      let h = `<div class="why"><b>⚗️ ウランに中性子を当てた生成物に、バリウムを、加える</b><p>バリウムと、同じ挙動の、放射性の物質が、見つかった。ラジウム(バリウムの仲間)かもしれない。ラジウムは、塩化物の溶解度が、バリウムより、小さいので、分別結晶で、最初の結晶に、濃縮されるはずだ。</p></div><div class="ind-row"><button data-rp="hah" ${steps.length >= 4 ? "disabled" : ""}>分別結晶を、1回行う(${steps.length}/4)</button></div>`;
      if (steps.length) h += table(["結晶化の回数", "実測の放射能(1分間の計数 / バリウム100 mg)", "ラジウムなら、予想される値"], [["0(最初)", 1000, 1000], ...steps.map((r) => [r.step, `<b>${r.observed}</b>`, r.ifRadium])]);
      if (steps.length < 4) return { html: h + `<p class="lead">4回、分別結晶を、行って、放射能が、どう変わるかを、見よう。</p>`, finished: false };
      h += mcq(id, "a", "放射能は、濃縮されなかった。放射性の物質の正体は?", ["バリウムそのもの(放射性のバリウム)", "ラジウム", "ウラン"], 0, "ラジウムなら、濃縮されるはず。バリウムから、分けられないのは、バリウム自身だから。");
      if (done(id, "a")) h += mcq(id, "b", "ウラン(原子番号92)に、中性子を当てて、バリウム(原子番号56)ができた。これは、何を意味する?", ["原子核が、ほぼ2つに割れた(核分裂)", "原子核が、陽子を1個、失っただけ", "ウランが、金に、変わった"], 0, "92 − 56 = 36 は、クリプトン(原子番号36)。原子核が、2つに割れた。マイトナーとフリッシュが、これを『核分裂』と、解釈した。");
      if (done(id, "b")) h += mcq(id, "c", "割れたあとの質量の合計は、割れる前より、わずかに小さい。減った質量は?", ["エネルギーに変わった(E = mc²)", "消えてなくなった", "熱として、水に溶けた"], 0, "質量が、エネルギーに変わった(E = mc²)。わずかな質量が、莫大なエネルギーになる。これが、原子力の、原理。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    bernard(id) {
      const B = R().bernard, s = state(id), v = s.v, lv = ["青(糖なし)", "緑(わずかな糖)", "黄(糖あり)", "橙(糖が多い)", "赤(糖が非常に多い)"];
      let h = `<div class="why"><b>🧪 糖の試験(銅の塩とアルカリ)</b>: 糖があると、青色が、緑→黄→橙→赤へと、変わる。</div><div class="ind-row">` +
        `<button class="${v.blood ? "on" : ""}" data-rp="bl">糖を含まない食事の、血液を、調べる</button>` +
        `<button data-rp="bw" ${(v.wash || 0) >= 4 ? "disabled" : ""}>摘出した肝臓を、水で洗う(${v.wash || 0}/4)</button>` +
        `<button class="${v.after ? "on" : ""}" data-rp="ba" ${(v.wash || 0) < 4 ? "disabled" : ""}>洗った肝臓を、一日置いて、調べる</button></div>`;
      if (v.blood) h += `<p>▶ 血液: <b>${lv[B.blood]}</b></p>`;
      for (let i = 0; i < (v.wash || 0); i++) h += `<p>▶ 洗い水(${i + 1}回目): <b>${lv[B.washes[i]]}</b></p>`;
      if ((v.wash || 0) >= 4) h += `<p class="muted">洗い水に、糖は出なくなった(肝臓から、糖が、洗い流された)。</p>`;
      if (v.after) h += `<p>▶ 一日置いた肝臓: <b>${lv[B.after]}</b></p>`;
      if (!(v.blood && (v.wash || 0) >= 4 && v.after)) return { html: h + `<p class="lead">血液、洗い水、一日置いた肝臓を、順に調べよう。</p>`, finished: false };
      h += mcq(id, "a", "糖を含まない食事でも、血液に、糖があった。これは?", ["体の中で、糖が作られている", "実験が、失敗した", "食事に、糖が入っていた"], 0, "糖を食べていないのに、血液に糖がある。体内で、作られている。");
      if (done(id, "a")) h += mcq(id, "b", "洗い流して、糖が、なくなった肝臓に、一日後、また糖が現れた。何が、考えられる?", ["肝臓が、(貯蔵していた物質から)糖を、作った", "糖が、洗い流されていなかった", "空気から、糖が、付いた"], 0, "洗い水に、糖が出なくなるまで洗ったのに、糖が、再び現れた。肝臓が、糖を作り、貯蔵している(のちに、グリコーゲンと分かった)。");
      if (done(id, "b")) h += mcq(id, "c", "ベルナールが考えた『内部環境』の、意味は?", ["体内の環境(血糖など)は、体の働きで、一定に保たれている", "体は、外の環境に、そのまま、従う", "体の中は、常に、大きく変動する"], 0, "体は、血糖などを、一定に保つ(恒常性)。この考えは、のちに、ホルモン(インスリンなど)による、調節の、研究につながった。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    bunsen(id) {
      const Sp = R().spectrum, s = state(id), lab = s.v.lab || (s.v.lab = Array(6).fill(null)), opts = ["Na", "K", "Li", "Sr", "Ca", "Ba", "未知"];
      let h = `<div class="why"><b>🌈 既知の元素の、スペクトル線(nm)</b><p class="muted">Na: 589.0・589.6(黄) / K: 766.5・769.9(赤)・404.4(紫) / Li: 670.8(赤) / Sr: 460.7(青) / Ca: 422.7(紫)・622.0(橙) / Ba: 553.6(緑)</p></div>` +
        `<div class="why"><b>デュルクハイムの鉱泉水を、炎に入れて、観察した線</b></div>` +
        Sp.lines.map((nmv, i) => `<div class="ind-row"><span style="min-width:80px"><b>${nmv} nm</b></span>` + opts.map((o) => `<button class="${lab[i] === o ? "on" : ""}" data-rp="bs" data-i="${i}" data-v="${o}">${o}</button>`).join("") + `</div>`).join("");
      if (!s.v.ok) {
        if (lab.every((x) => x)) h += `<div class="ind-row"><button class="primary" data-rp="bsdone">この分類で、確認する</button></div>`;
        if (s.v.fail) h += `<p class="warn">❌ 分類に、まちがいが、あります(${s.v.fail}本)。位置を、表と、見比べよう。表の線と、ぴったり一致しないものは?</p>`;
        return { html: h, finished: false };
      }
      h += `<p class="use">✅ 4本は、既知の元素の線。残りの、青い2本(455.5・459.3 nm)は、表にない!</p>`;
      h += mcq(id, "a", "表のどの元素にも、当てはまらない、青い線は、何を意味する?", ["まだ、知られていない元素が、含まれている(のちの、セシウム)", "器具が、汚れていた", "光が、屈折しただけ"], 0, "未知の元素のしるし。ブンゼンは、鉱泉水を大量に濃縮して、新しい元素を取り出した。ラテン語の『青空(caesius)』にちなんで、セシウムと名づけた。");
      if (done(id, "a")) h += mcq(id, "b", "スペクトル線の位置から、元素が分かるのは、なぜ?", ["元素ごとに、原子が出す光の、波長が、決まっているから", "炎の温度で、決まるから", "色の見え方は、人によって、違うから"], 0, "原子の中の、電子が、特定のエネルギーの間を、移るとき、決まった波長の光を、出す。元素の『光の指紋』になる。");
      if (done(id, "b")) h += mcq(id, "c", "この方法の、優れた点は?", ["ごく微量でも、遠くの星でも、元素を、調べられる", "元素を、大量に、集められる", "金属の、重さが、量れる"], 0, "微量でも、元素が分かる。太陽の光を調べて、太陽の成分も、分かった(ヘリウムは、太陽で、先に見つかった)。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    bragg(id) {
      const s = state(id), th = s.v.th === undefined ? 10 : s.v.th, runs = s.runs, B = R().bragg;
      let h = `<div class="why"><b>💎 岩塩の結晶に、X線(波長 ${B.lambda} nm)を当て、結晶を回して、反射の強さを測る</b><p>角度 θ は、X線と、結晶の面の、なす角。強さが、急に、大きくなる角度を探そう。</p></div>` + slider("th", "角度 θ", 5, 70, 0.5, th, "°") + `<div class="ind-row"><button data-rp="brg">測る</button><button data-rp="brgs">5°ずつ、粗く測る(5〜70°)</button></div>`;
      if (runs.length) { const sorted = [...runs].sort((a, b) => a.th - b.th); h += `<div class="why"><b>測定結果(強さ)</b>` + sorted.map((r) => `<div class="prow"><div class="plabel">${r.th.toFixed(1)}°</div><div class="pbar"><i style="width:${Math.min(100, r.I / 1.2).toFixed(0)}%"></i></div><div class="pnum">${r.I}</div></div>`).join("") + `</div>`; }
      const hi = runs.filter((r) => r.I > 20).map((r) => r.th).sort((a, b) => a - b), peaks = hi.filter((t, i) => i === 0 || t - hi[i - 1] > 4).length;
      if (peaks < 2) return { html: h + `<p class="lead">強さが、20を超える、角度(ピーク)を、2つ以上、見つけよう。(見つけたピーク: ${peaks}個)</p>`, finished: false };
      h += `<p class="use">✅ ピークが、見つかった! 1番目のピークは、約 ${R().braggPeaks()[0].toFixed(1)}°。</p>`;
      h += mcq(id, "a", "1番目のピーク(約15.8°、n=1)から、結晶の面の間隔 d を、求めよう。(nλ = 2d sinθ、λ = 0.154 nm)", ["約 0.14 nm", "約 0.28 nm", "約 0.56 nm"], 1, "d = λ ÷ (2 sin15.8°) = 0.154 ÷ 0.544 ≒ 0.28 nm。原子の間隔の、大きさが、測れた。");
      if (done(id, "a")) h += mcq(id, "b", "反射が、決まった角度でだけ、強くなるのは、なぜ?", ["結晶の規則正しい原子面で反射した、X線が、強め合う角度だけ、だから", "結晶が、X線を、吸収するから", "X線の、波長が、変わるから"], 0, "隣り合う面で反射した波の、行路差が、波長の整数倍のとき、波が強め合う(ブラッグの条件)。");
      if (done(id, "b")) h += mcq(id, "c", "X線で、原子の並びが分かる、理由は?", ["X線の波長が、原子の間隔と、同程度(約0.1 nm)だから", "X線は、目に見えないから", "X線は、光より、速いから"], 0, "波長が、間隔と同程度だと、回折が、はっきり現れる。光(約500 nm)では、原子の間隔(約0.3 nm)を、測れない。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    moseley(id) {
      const s = state(id), runs = s.runs, M = R().moseley;
      let h = `<div class="why"><b>🔢 元素に電子をぶつけて、出る、特性X線(Kα線)の、エネルギーを測る</b></div><div class="ind-row">` + M.map((m) => `<button class="${runs.some((r) => r.Z === m[0]) ? "on" : ""}" data-rp="mos" data-z="${m[0]}">${m[1]}</button>`).join("") + `</div>`;
      if (runs.length) h += table(["元素", "原子量", "Kα線のエネルギー", "√(エネルギー)"], [...runs].sort((a, b) => a.aw - b.aw).map((r) => [r.sym, r.aw, r.E.toFixed(3) + " keV", Math.sqrt(r.E).toFixed(3)]));
      if (runs.length < 6 || !runs.some((r) => r.Z === 27) || !runs.some((r) => r.Z === 28)) return { html: h + `<p class="lead">6元素以上、測ろう。コバルト(Co)と、ニッケル(Ni)を、含めること。表は、原子量の順に、並んでいる。</p>`, finished: false };
      h += `<p class="muted">原子量の順では、ニッケル(58.69)が、コバルト(58.93)より、先に並ぶ。エネルギーでは?</p>`;
      h += mcq(id, "a", "エネルギーの平方根(√E)は、何に、ほぼ比例して、増える?", ["原子番号(ほぼ、Z − 1)", "原子量", "密度"], 0, "原子番号に、ほぼ比例する(Z=20〜30で、1つ増えるごとに、一定の幅で増える)。");
      if (done(id, "a")) h += mcq(id, "b", "コバルトとニッケルは、原子量の順では、逆。X線のエネルギーの順に、並べると?", ["ニッケルの方が、コバルトより、エネルギーが高く、周期表の順と一致する", "コバルトの方が、高い", "どちらも、同じ"], 0, "ニッケルの方が、エネルギーが高い(原子番号28 > 27)。周期表の順は、原子番号の順だった。");
      if (done(id, "b")) h += mcq(id, "c", "周期表の、本当の、並びの基準は?", ["原子番号(原子核の、陽子の数)", "原子量", "融点"], 0, "原子番号。これで、空欄(43、61、72、75番など)も、はっきり決まり、未発見の元素の、探索の指針になった。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    miller(id) {
      const s = state(id), c = s.v.c || { ch4: true, nh3: true, h2: true, spark: true }, days = s.v.days === undefined ? 3 : s.v.days, runs = s.runs;
      const tg = (k, n) => `<button class="${c[k] ? "on" : ""}" data-rp="mil2" data-k="${k}">${c[k] ? "✔ " : ""}${n}</button>`;
      let h = `<div class="why"><b>🌩️ 密閉装置に、気体を入れ、放電を続ける</b>: 水(原始の海)は、いつも入れる。気体と放電を、選ぼう。</div><div class="ind-row">${tg("ch4", "メタン CH₄")}${tg("nh3", "アンモニア NH₃")}${tg("h2", "水素 H₂")}${tg("spark", "放電(雷)")}</div>` + slider("days", "実験の日数", 1, 7, 1, days, "日") + `<div class="ind-row"><button data-rp="mil3">実験する</button></div>`;
      if (runs.length) h += table(["メタン", "アンモニア", "水素", "放電", "日数", "水の色", "グリシン", "アラニン", "アスパラギン酸"], runs.slice(-8).map((r) => [r.c.ch4 ? "○" : "×", r.c.nh3 ? "○" : "×", r.c.h2 ? "○" : "×", r.c.spark ? "○" : "×", r.days, r.color, r.gly + " µmol", r.ala + " µmol", r.asp + " µmol"]));
      if (runs.length < 3 || !runs.some((r) => r.gly > 0) || !runs.some((r) => r.gly === 0)) return { html: h + `<p class="lead">3回以上、条件を変えて、実験しよう。アミノ酸が、できる場合と、できない場合を、両方、見つける。</p>`, finished: false };
      h += mcq(id, "a", "アミノ酸が、できるために、必要だった条件は?", ["メタン・アンモニアと、放電(エネルギー)", "水素だけ", "どの条件も、必要ない"], 0, "メタン、アンモニア(材料)と、放電(エネルギー)が、そろったときだけ。水素は、あると、収量が、増えた。");
      if (done(id, "a")) h += mcq(id, "b", "この実験が、示した可能性は?", ["生命の材料(アミノ酸)は、原始地球の環境で、自然にできうる", "生命は、自然には、生まれない", "アミノ酸は、生物にしか、作れない"], 0, "生命のない、単純な気体と、雷の、エネルギーから、アミノ酸ができた。生命の起源を、化学で、研究する、道を開いた(化学進化)。");
      if (done(id, "b")) h += mcq(id, "c", "実験の『放電』は、原始地球の何を、模している?", ["雷", "海の波", "火山灰"], 0, "雷。強いエネルギーが、気体の分子を壊し、新しい分子ができる、きっかけになった。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    watsoncrick(id) {
      const s = state(id), C = R().chargaff, P = R().pair, pr = s.v.pr || (s.v.pr = { A: null, G: null });
      let h = `<div class="why"><b>📊 シャルガフの、データ: 生物ごとの、DNAの塩基の割合(%)</b></div>` + table(["生物", "A(アデニン)", "T(チミン)", "G(グアニン)", "C(シトシン)"], C.map((r) => r.map((x) => (typeof x === "number" ? x.toFixed(1) : x))));
      h += mcq(id, "a", "各生物で、4つの塩基の量には、どんな規則が、ある?", ["A ≒ T、G ≒ C(それぞれ、ほぼ同量)", "A ≒ G、T ≒ C", "4つとも、ほぼ25%ずつ"], 0, "A と T、G と C が、ほぼ同量。ただし、生物によって、A+T と G+C の割合は、違う。");
      if (!done(id, "a")) return { html: h, finished: false };
      h += `<div class="why"><b>🧩 模型づくり: 塩基の、対を決めよう</b><p>A と G の、相手は、それぞれ、どの塩基?(水素結合で、結びつく)</p></div>` +
        ["A", "G"].map((b) => `<div class="ind-row"><span style="min-width:40px"><b>${b} の相手:</b></span>` + ["A", "T", "G", "C"].map((o) => `<button class="${pr[b] === o ? "on" : ""}" data-rp="wcp" data-b="${b}" data-o="${o}">${o}</button>`).join("") + `</div>`).join("") + `<div class="ind-row"><button class="primary" data-rp="wcc">この対で、確認する</button></div>`;
      if (!s.v.pairOk) return { html: h + (s.v.pairFail ? `<p class="warn">❌ 対が、合っていません。シャルガフのデータ(A ≒ T、G ≒ C)を、思い出そう。</p>` : ""), finished: false };
      h += `<p class="use">✅ A–T(水素結合2本)と、G–C(水素結合3本)。大きさが、同じ長さの、ペアになる!</p>`;
      h += `<div class="why"><b>📷 フランクリンの、X線写真のデータ</b><p>X字形の、模様。層の間隔: 0.34 nm(塩基が積み重なる間隔)と、3.4 nm(らせんの、1周期)。</p></div>`;
      h += mcq(id, "b", "らせんの、1周期(3.4 nm)の中に、塩基は、何段、積み重なる?(0.34 nm ごとに1段)", ["約10段", "約3段", "約34段"], 0, "3.4 ÷ 0.34 = 10。1周期に、約10塩基対。");
      if (done(id, "b")) h += mcq(id, "c", "A と T、G と C が、対になることで、DNAが、複製できる理由は?", ["片方の鎖の並びが決まれば、もう片方の並びが、決まる(相補性)", "鎖が、切れないから", "4つの塩基が、同じだから"], 0, "鎖が、ほどけて、それぞれが、鋳型になり、対になる塩基が、つく。同じDNAが、2本できる。『この構造は、複製の仕組みを、示唆する』とワトソンとクリックは、書いた。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) && s.v.pairOk };
    },
    fleming(id) {
      const s = state(id), runs = s.runs, bact = s.v.bact || "staph", dil = s.v.dil || 1, dils = R().flemingDils;
      let h = `<div class="why"><b>🍄 カビの培養液を、細菌を塗った寒天に、置く</b>: 細菌が育たない範囲(阻止円)の、直径を測る。</div><div class="ind-row"><span class="muted">細菌:</span><button class="${bact === "staph" ? "on" : ""}" data-rp="flb" data-v="staph">ブドウ球菌</button><button class="${bact === "ecoli" ? "on" : ""}" data-rp="flb" data-v="ecoli">大腸菌</button></div>` +
        `<div class="ind-row"><span class="muted">培養液の、薄め方:</span>` + dils.map((d) => `<button class="${dil === d ? "on" : ""}" data-rp="fld" data-v="${d}">${d === 1 ? "原液" : "1/" + d}</button>`).join("") + `</div><div class="ind-row"><button data-rp="flr">培養して、観察する</button></div>`;
      if (runs.length) h += table(["細菌", "薄め方", "阻止円の直径"], runs.slice(-10).map((r) => [r.bact === "staph" ? "ブドウ球菌" : "大腸菌", r.dil === 1 ? "原液" : "1/" + r.dil, r.mm ? `<b>${r.mm} mm</b>` : "なし(育った)"]));
      const st_ = runs.filter((r) => r.bact === "staph"), ec = runs.filter((r) => r.bact === "ecoli");
      if (runs.length < 4 || !st_.length || !ec.length || new Set(st_.map((r) => r.dil)).size < 2) return { html: h + `<p class="lead">4回以上、試そう。ブドウ球菌と大腸菌の、両方で、ブドウ球菌は、2通り以上の薄め方で。</p>`, finished: false };
      h += mcq(id, "a", "カビの周りだけ、ブドウ球菌が、育たなかった。何が、考えられる?", ["カビが、細菌の増殖を、抑える物質を、出している", "カビが、細菌を、食べた", "培地が、乾いた"], 0, "カビが、細菌の増殖を抑える物質(のちに、ペニシリンと名づけられた)を、出している。");
      if (done(id, "a")) h += mcq(id, "b", "培養液を、1万倍に薄めても、阻止円ができた。わかることは?", ["ごく少量でも、効く、強い物質", "効果は、ない", "薄めると、細菌が、増える"], 0, "ごく微量で、効く。薬としての、可能性を示す。");
      if (done(id, "b")) h += mcq(id, "c", "大腸菌には、効かなかった。何を意味する?", ["細菌の種類によって、効き方が、違う", "実験の失敗", "すべての細菌に、効く"], 0, "細菌の細胞壁の、作りの違いなどで、効く菌と、効かない菌がある(のちに、抗生物質の、選択性として、理解された)。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    pauling(id) {
      const s = state(id), n = s.v.n === undefined ? 3.0 : s.v.n, runs = s.runs;
      let h = `<div class="why"><b>🌀 ペプチドの鎖を、らせんに巻く</b>: 主鎖の N−H と、C=O が、水素結合で、結びつく。1回転あたりのアミノ酸の数を変えて、水素結合(N···O)の長さを、見る。理想は、約2.9 Å。</div>` + slider("n", "1回転あたりのアミノ酸の数", 3, 4.5, 0.1, n, "個") + `<div class="ind-row"><button data-rp="pau">模型を組む</button></div>`;
      if (runs.length) h += table(["1回転のアミノ酸の数", "水素結合の長さ", "1回転の高さ", "判定"], runs.slice(-8).map((r) => [r.n.toFixed(1) + " 個", r.d.toFixed(2) + " Å", r.pitch + " Å", r.ok ? '<b style="color:#6ee7a8">理想的!</b>' : r.clash ? "原子が、重なってしまう" : r.loose ? "ゆるんで、水素結合が、届かない" : "もう少し"]));
      if (!runs.some((r) => r.ok)) return { html: h + `<p class="lead">水素結合が、ちょうど良い長さ(約2.9〜3.1 Å)になる、巻き方を探そう。</p>`, finished: false };
      h += `<p class="use">✅ 理想的な、らせんが、組めた!</p>` + mcq(id, "a", "αヘリックスで、水素結合は、何番目のアミノ酸の、間で、つながる?", ["4つ先のアミノ酸(iとi+4)", "隣のアミノ酸", "10個先のアミノ酸"], 0, "主鎖の C=O と、4つ先の N−H が、結びつく。鎖全体が、水素結合の、はしごで、固定される。");
      if (done(id, "a")) h += mcq(id, "b", "1回転あたりの、アミノ酸の数は?", ["約3.6個", "約2個", "約10個"], 0, "約3.6個(1回転の高さは、約5.4 Å)。");
      if (done(id, "b")) h += mcq(id, "c", "ポーリングの、方法の特徴は?", ["結合の長さ・角度の、正確なデータを使い、立体模型で、構造を予測した", "新しい元素を、発見した", "顕微鏡で、分子を直接見た"], 0, "化学結合の、理論とデータで、構造を予測し、のちに、X線で、確かめられた(1951年)。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    sanger(id) {
      const S_ = R().sanger, s = state(id), seq = s.v.seq || null, frags = s.v.frags || (s.v.frags = R().sangerFrags()), used = s.v.used || (s.v.used = []);
      let h = `<div class="why"><b>🔤 インスリンの、鎖の端を、調べる</b><p>FDNB(試薬)は、鎖の端(N末端)のアミノ酸に、結びついて、黄色の目印をつける。</p></div><div class="ind-row"><button data-rp="sgn" ${seq ? "disabled" : ""}>N末端を、標識して、調べる</button></div>`;
      if (!seq) return { html: h, finished: false };
      h += `<p>▶ 標識されたアミノ酸: <b>${S_.names[seq[0]]}(${seq[0]})</b>。これが、鎖の、最初。</p><div class="why"><b>🧪 酸で、鎖を、部分的に、切って、できた断片(2つ組)</b><p>断片の、前の文字が、すでに、決めた、鎖の、最後の文字と、同じものを、探して、つなげていこう。</p></div>`;
      h += `<p>これまでの並び: <b style="font-size:16px;letter-spacing:2px">${seq.map((x) => x).join(" − ")}</b> <span class="muted">(${seq.length}/10)</span></p>`;
      if (seq.length < 10) {
        h += `<div class="ind-row">` + frags.map((f, i) => `<button class="${used.includes(i) ? "on" : ""}" data-rp="sgf" data-i="${i}" ${used.includes(i) ? "disabled" : ""}>${f[0]}${f[1]}</button>`).join("") + `</div>` + (s.v.bad ? `<p class="warn">❌ その断片は、今の鎖の最後(${seq[seq.length - 1]})から、始まっていません。</p>` : "");
        return { html: h, finished: false };
      }
      h += `<p class="use">✅ 10個の並びが、決まった: ${seq.join("")}。</p>` + `<p class="muted">${seq.map((x) => S_.names[x]).join(" → ")}</p>`;
      h += mcq(id, "a", "N末端を、標識する試薬の、役割は?", ["鎖の端のアミノ酸を、見分ける目印になる", "タンパク質を、分解する", "タンパク質を、結晶にする"], 0, "標識すると、酸で、バラバラに切っても、端だった、アミノ酸が、分かる。順序を決める、最初の手がかりになる。");
      if (done(id, "a")) h += mcq(id, "b", "断片の、重なりから、並びの順序が、分かるのは、なぜ?", ["隣り合う断片が、共通のアミノ酸を、持っているから", "断片が、1個ずつ、だから", "断片の長さが、同じだから"], 0, "『FV』と『VN』は、Vを、共有している。共有する部分を、手がかりに、つなげられる。");
      if (done(id, "b")) h += mcq(id, "c", "インスリンの、配列が、決まった(1955年)、意義は?", ["タンパク質は、決まった配列をもつ、化学物質であることを示した", "インスリンが、人工的に、作られた", "DNAの構造が、分かった"], 0, "タンパク質は、決まったアミノ酸の順序をもつ(遺伝子が、その順序を決める)。サンガーは、1958年に、ノーベル化学賞を、受賞した。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    carothers(id) {
      const s = state(id), r = s.v.r === undefined ? 0.95 : s.v.r, hr = s.v.hr === undefined ? 3 : s.v.hr, vac = !!s.v.vac, runs = s.runs;
      let h = `<div class="why"><b>🧵 二塩基酸と、ジアミンを、反応させる(縮合重合)</b>: 水が、できながら、分子が、つながっていく。平均重合度 Xn(1本の鎖に、つながった、単位の数)を、求める。</div>` + slider("r", "原料のモル比(少ない方/多い方)", 0.9, 1, 0.005, r, "") + slider("hr", "反応の時間", 1, 10, 1, hr, "時間") +
        `<div class="ind-row"><button class="${vac ? "on" : ""}" data-rp="car2">${vac ? "✔ " : ""}減圧して、水を取り除く</button><button data-rp="car">反応させる</button></div>`;
      if (runs.length) h += table(["モル比", "時間", "水を取り除く", "反応した割合 p", "平均重合度 Xn", "分子量", "判定"], runs.slice(-8).map((x) => [x.r.toFixed(3), x.hours + " 時間", x.vac ? "○" : "×", (x.p * 100).toFixed(2) + "%", x.Xn, x.mw.toLocaleString(), x.fiber ? '<b style="color:#6ee7a8">糸を引ける!</b>' : "短い(もろい)"]));
      if (!runs.some((x) => x.fiber)) return { html: h + `<p class="lead">平均重合度が、80以上になる条件を探そう。(Xn = (1+r) ÷ (1+r−2rp))</p>`, finished: false };
      h += `<p class="use">✅ 糸を引ける、長さの、ナイロンができた!</p>` + mcq(id, "a", "長い分子を得るために、重要なことは?", ["原料のモル比を、ほぼ1:1にし、反応を、ほぼ完全に進める", "温度を、上げるだけ", "原料を、たくさん、入れるだけ"], 0, "モル比がずれると、片方の末端だけが、残って、鎖が、短く終わる。反応が、99%以上、進まないと、非常に長い鎖は、できない。");
      if (done(id, "a")) h += mcq(id, "b", "水を取り除く(減圧する)のは、なぜ?", ["縮合で出る水を除くと、反応が、さらに進む(平衡が、生成物側に傾く)", "水が、毒だから", "水が、熱いから"], 0, "水を除くと、ル・シャトリエの原理で、反応が、完全に近づき、鎖が、長くなる。");
      if (done(id, "b")) h += mcq(id, "c", "ナイロンを、引き伸ばすと(冷延伸)、強くなる理由は?", ["分子鎖が、引きそろえられ、水素結合で、強く、結びつくから", "分子が、小さくなるから", "分子が、溶けるから"], 0, "鎖がそろい、アミド結合の間の、水素結合が、整然と、つながる。絹のような、強い繊維になる。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
    avogadro(id) {
      const s = state(id), runs = s.runs, I = s.v.I === undefined ? 2 : s.v.I, t = s.v.t === undefined ? 20 : s.v.t;
      let h = `<div class="why"><b>⚡ 硫酸銅の電気分解で、ファラデー定数 F(電子 1 mol の電気量)を測る</b><p>析出した銅の質量 m から、F = Q × 63.55 ÷ (2 × m) を、求める。(Q = 電流 × 時間)</p></div>` + slider("I", "電流", 0.5, 5, 0.5, I, "A") + slider("t", "時間", 10, 60, 10, t, "分") + `<div class="ind-row"><button data-rp="avo">電気分解する</button></div>`;
      if (runs.length) h += table(["電流", "時間", "電気の量 Q", "析出した銅", "ファラデー定数 F"], runs.slice(-8).map((x) => [x.I + " A", x.t + " 分", x.Q + " C", x.m.toFixed(3) + " g", x.F.toLocaleString() + " C/mol"]));
      if (runs.length < 3) return { html: h + `<p class="lead">電流と時間を、変えて、3回以上、測ろう。(${runs.length}/3)</p>`, finished: false };
      const Fm = Math.round(runs.reduce((a, x) => a + x.F, 0) / runs.length), e = 1.602e-19, NA = R().NA(Fm, e);
      h += `<div class="why"><b>📐 あなたの、測定値</b><p>ファラデー定数 F の平均: <b>${Fm.toLocaleString()} C/mol</b>(電子1 mol の電気量)<br>電気素量 e(ミリカンの、追体験): <b>1.602 × 10⁻¹⁹ C</b>(電子1個の電気量)</p></div>`;
      h += mcq(id, "a", `F ÷ e = ${Fm.toLocaleString()} ÷ 1.602×10⁻¹⁹ を、計算すると?(1 mol の電子の、個数)`, ["約 6.0 × 10²³ 個", "約 6.0 × 10¹⁹ 個", "約 6.0 × 10²⁷ 個"], 0, `F ÷ e ≒ ${(NA / 1e23).toFixed(2)} × 10²³。1 mol の中の、粒子の数(アボガドロ定数)が、求まった。`);
      if (done(id, "a")) h += mcq(id, "b", "この数は、何を、表す?", ["1 mol の粒子(原子・分子・電子)の個数", "1 g の原子の個数", "1 L の気体の質量"], 0, "1 mol あたりの、粒子の数。物質量(モル)の、定義の、基礎になる。");
      if (done(id, "b")) h += mcq(id, "c", "ブラウン運動(ペラン)や、X線(結晶)など、別の方法で求めた値と、一致することは、何を示す?", ["原子・分子が、実在すること", "実験が、間違っていること", "数が、時代で、変わること"], 0, "まったく違う、方法で、同じ値が得られる。これが、原子や分子が、実在する、強い証拠になった。");
      return { html: h, finished: mcqsDone(id, ["a", "b", "c"]) };
    },
  };

  // ---- 全体の画面 ----
  // この課題の達成で、できるようになること
  function unlocks(rid) {
    const gc = D().REPLAY_GRANTS && D().REPLAY_GRANTS[rid]; if (!gc) return "";
    const outs = Object.entries(D().REPLAY_GATES || {}).filter(([, c]) => c === gc).map(([k]) => { const row = D().RECIPE_ROWS.find((x) => [...x[0]].sort().join("+") === k); if (!row) return ""; const real = row[1].filter((o) => items()[o] && items()[o].type !== "concept"); return real.length ? real.map(nm).join("・") + "の実験" : row[1].filter((o) => items()[o]).map((o) => nm(o) + "の発見").join("・"); }).filter(Boolean);
    const techs = (D().IND_TECHS || []).filter((t) => (t.need || []).includes(gc)).map((t) => "産業技術「" + t.name + "」");
    const ins = (D().INSIGHTS || []).filter((i) => i.need.includes(gc)).map((i) => nm(i.id) + "の理解");
    const rt = (D().TECHS || []).filter((t) => t.req.includes(gc)).map((t) => "研究「" + t.name + "」");
    const pl = Object.keys(D().PLANT_NEED || {}).filter((id) => D().plantNeeds(id).includes(gc)).map((id) => nm(id)).filter(Boolean);
    const kn = (D().KNOW_FX || []).filter((k) => k.need.includes(gc)).map((k) => k.desc);
    return [...outs, ...techs, ...rt, ...(pl.length ? ["産業: " + pl.slice(0, 4).join("・") + (pl.length > 4 ? "など" : "") + "の工場"] : []), ...ins].join("、") + (outs.length || techs.length || ins.length || rt.length || pl.length ? "が、できるようになる。" : "") + (kn.length ? " 効果: " + kn.join(" ") : "");
  }
  function list() {
    const rep = H().replay;
    let h = `<p class="lead">歴史上の有名な実験を、その時代の器具・材料だけで、追体験する課題です。データを読んで、科学者と同じ結論に、たどり着こう。初めて達成すると、知識ポイントがもらえます(星の数に応じて、増えます)。</p>`;
    h += D().REPLAYS.map((r) => {
      const miss = r.gear.filter((g) => !has(g)), d = rep[r.id];
      return `<div class="cx ${miss.length ? "unk2" : ""}"><div class="e">${r.emoji}</div><div><h4>${esc(r.title)} <small>${esc(r.year)}・${esc(r.who)}${d ? "・" + "★".repeat(d.stars) + "☆".repeat(3 - d.stars) : ""}</small></h4>` +
        (miss.length ? `<p class="warn">必要な器具・材料: ${r.gear.map((g) => `${has(g) ? "✅" : "🔒"}${esc(nm(g))}`).join(" ")}</p>` : `<p>${esc(r.goal)}</p>${unlocks(r.id) ? `<p class="use">🔓 達成すると: ${esc(unlocks(r.id))}</p>` : ""}<button class="primary" data-rp="start" data-rid="${r.id}">${d ? "もう一度、挑戦する" : "挑戦する"}</button>`) + `</div></div>`;
    }).join("");
    return h;
  }
  function challenge() {
    const r = def(rp.cur), v = views[r.id](r.id);
    let h = `<button data-rp="back">← 課題の一覧へ</button><div class="why"><b>${r.emoji} ${esc(r.title)}</b> <small>${esc(r.year)}・${esc(r.who)}</small><p>${esc(r.story)}</p><p><b>課題:</b> ${esc(r.goal)}</p><p class="muted">🔧 ${esc(r.period)}</p></div>`;
    h += v.html;
    if (v.finished) {
      const s = state(r.id), stars = s.mis <= 0 ? 3 : s.mis <= 2 ? 2 : 1, rep = H().replay;
      let gain = 0;
      if (!rep[r.id]) { gain = 4 + stars; rep[r.id] = { stars }; S().pt += gain; api.say(`🔬 追体験「${r.title}」を達成(★${stars}・知識+${gain})`); if (window.JOURNAL) JOURNAL.add(S(), { t: "replay", title: r.title, stars }); api.toast(`🔬 達成! 知識 +${gain}`); api.save(); }
      else if (stars > rep[r.id].stars) { rep[r.id].stars = stars; api.save(); }
      h += `<div class="why use"><b>🎉 達成!(${"★".repeat(stars)}${"☆".repeat(3 - stars)})</b><p>${esc(LESSON[r.id])}</p>${gain ? `<p>知識 +${gain}</p>` : ""}</div>`;
      const gc = D().REPLAY_GRANTS && D().REPLAY_GRANTS[r.id];
      if (gc) { if (!api.has(gc)) { api.grantConcept(gc); api.save(); } h += `<div class="why"><b>🔓 「${esc(nm(gc))}」を得た</b><p>${esc(unlocks(r.id))}</p></div>`; }
    }
    return h;
  }
  function replay() { return rp.cur ? challenge() : list(); }

  function attach() {
    document.addEventListener("input", (e) => {
      const t = e.target; if (!t || t.dataset.rpin === undefined || !rp.cur) return;
      const s = state(rp.cur); s.v[t.dataset.rpin] = parseFloat(t.value);
      const lab = document.getElementById("rpv_" + t.dataset.rpin); if (lab) lab.textContent = t.value;
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-rp]"); if (!b) return;
      const a = b.dataset.rp, ds = b.dataset;
      if (a === "start") { rp.cur = ds.rid; rp.s[ds.rid] = null; state(ds.rid); }
      else if (a === "back") rp.cur = null;
      else if (rp.cur) {
        const s = state(rp.cur), Rl = R();
        if (a === "mcq") { const k = ds.k, i = +ds.i, g = (s.m[k] = s.m[k] || { tried: [], ok: false }); if (i === +ds.ans) g.ok = true; else { if (!g.tried.includes(i)) { g.tried.push(i); s.mis++; } } }
        else if (a === "lav") s.v[ds.sealed === "1" ? "sealed" : "open"] = Rl.lavoisier(ds.sealed === "1");
        else if (a === "pri") { const m = s.v.mass || 10; s.v.res = Object.assign({ m }, Rl.priestley(m)); }
        else if (a === "pritest") s.v["t_" + ds.t] = 1;
        else if (a === "gas") { const h2 = s.v.h2 || 40, o2 = s.v.o2 || 40; s.runs.push(Object.assign({ h2, o2 }, Rl.gasReact(h2, o2))); }
        else if (a === "lab") { s.v.lab = s.v.lab || Array(10).fill(null); s.v.lab[+ds.i] = ds.v; }
        else if (a === "sortdone") { const wrong = s.v.cr.filter((c, i) => c.side !== s.v.lab[i]).length; if (wrong === 0) { s.v.sorted = true; s.v.fail = 0; } else { s.v.fail = wrong; s.mis++; s.v.lab = Array(10).fill(null); } }
        else if (a === "far") { const I = s.v.I || 2, t = s.v.t || 20; s.runs.push(Object.assign({ I, t }, Rl.faraday(I, t))); }
        else if (a === "wt") s.v["t_" + ds.t] = 1;
        else if (a === "boy") { const h = s.v.h === undefined ? 0 : s.v.h; s.runs.push(Rl.boyle(h)); }
        else if (a === "cha") { const T = s.v.T === undefined ? 0 : s.v.T; s.runs.push(Rl.charles(T)); }
        else if (a === "rut") { const tot = s.v.tot || [0, 0, 0, 0], r = Rl.rutherford(+ds.n, Math.floor(Math.random() * 1e9)); r.bins.forEach((x, i) => { tot[i] += x; }); s.v.tot = tot; }
        else if (a === "eka") { const w = s.v.w === undefined ? 68 : s.v.w, d = s.v.d === undefined ? 5.5 : s.v.d; s.v.res = Object.assign({ w, d }, Rl.ekaJudge(w, d)); if (!s.v.res.ok) s.mis++; }
        else if (a === "hp") s.v.P = +ds.p;
        else if (a === "hab") { const T = s.v.T === undefined ? 450 : s.v.T, Ps = D().PRESS_LEVELS.filter((l) => !l.need || has(l.need)).map((l) => l.p), P = Ps.includes(s.v.P) ? s.v.P : Ps[0]; s.runs.push(Rl.haber(T, P)); }
        else if (a === "mil") s.runs.push(Rl.millikan(s.runs.length));
        else if (a === "pau") s.runs.push(Rl.pauling(s.v.n === undefined ? 3.0 : s.v.n));
        else if (a === "sgn") s.v.seq = [Rl.sanger.seq[0]];
        else if (a === "sgf") { const f = (s.v.frags || [])[+ds.i], seq = s.v.seq; if (f && seq) { if (f[0] === seq[seq.length - 1]) { seq.push(f[1]); (s.v.used = s.v.used || []).push(+ds.i); s.v.bad = false; } else { s.v.bad = true; s.mis++; } } }
        else if (a === "car2") s.v.vac = !s.v.vac;
        else if (a === "car") s.runs.push(Rl.carothers(s.v.r === undefined ? 0.95 : s.v.r, s.v.hr === undefined ? 3 : s.v.hr, !!s.v.vac));
        else if (a === "avo") s.runs.push(Rl.faradayConst(s.v.I === undefined ? 2 : s.v.I, s.v.t === undefined ? 20 : s.v.t, Math.floor(Math.random() * 1e6)));
        else if (a === "brg") { const th = s.v.th === undefined ? 10 : s.v.th; s.runs.push({ th, I: Rl.braggI(th) }); }
        else if (a === "brgs") { for (let t = 5; t <= 70; t++) if (!s.runs.some((r) => r.th === t)) s.runs.push({ th: t, I: Rl.braggI(t) }); }
        else if (a === "mos") { const Z = +ds.z, m = Rl.moseley.find((x) => x[0] === Z); if (m && !s.runs.some((r) => r.Z === Z)) s.runs.push({ Z, sym: m[1], aw: m[2], E: Rl.moseleyE(Z) }); }
        else if (a === "mil2") { s.v.c = s.v.c || { ch4: true, nh3: true, h2: true, spark: true }; s.v.c[ds.k] = !s.v.c[ds.k]; }
        else if (a === "mil3") { const c = Object.assign({ ch4: true, nh3: true, h2: true, spark: true }, s.v.c || {}), days = s.v.days === undefined ? 3 : s.v.days; s.runs.push(Rl.miller(c, days)); }
        else if (a === "wcp") { s.v.pr = s.v.pr || { A: null, G: null }; s.v.pr[ds.b] = ds.o; }
        else if (a === "wcc") { const pr = s.v.pr || {}; if (pr.A === Rl.pair.A && pr.G === Rl.pair.G) { s.v.pairOk = true; s.v.pairFail = false; } else { s.v.pairFail = true; s.mis++; } }
        else if (a === "flb") s.v.bact = ds.v;
        else if (a === "fld") s.v.dil = +ds.v;
        else if (a === "flr") s.runs.push(Rl.fleming(s.v.bact || "staph", s.v.dil || 1));
        else if (a === "bT") s.v.TT = +ds.t;
        else if (a === "bro") s.runs.push(Rl.brown(s.v.t === undefined ? 10 : s.v.t, s.v.TT || 20, Math.floor(Math.random() * 1e9)));
        else if (a === "hah") { if (s.runs.length < 4) s.runs.push(Rl.hahnFrac(s.runs.length + 1, 7)); }
        else if (a === "bl") s.v.blood = 1;
        else if (a === "bw") s.v.wash = Math.min(4, (s.v.wash || 0) + 1);
        else if (a === "ba") s.v.after = 1;
        else if (a === "bs") { s.v.lab = s.v.lab || Array(6).fill(null); s.v.lab[+ds.i] = ds.v; }
        else if (a === "bsdone") { const ans = Rl.spectrum.answer.map((x) => (x === "?" ? "未知" : x)), wrong = ans.filter((x, i) => x !== s.v.lab[i]).length; if (wrong === 0) { s.v.ok = true; s.v.fail = 0; } else { s.v.fail = wrong; s.mis++; } }
      }
      api.render();
    });
  }
  window.EODX = {
    subs: base.subs.concat(["追体験"]),
    init(a) { base.init(a); api = a; attach(); },
    render(i) { return i < n0 ? base.render(i) : replay(); },
    after(i) { if (i < n0 && base.after) base.after(i); },
    onRecipe: base.onRecipe,
    get history() { return base.history; },
  };
  window.REPLAYUI = { open(id) { rp.cur = id; } };
})();
