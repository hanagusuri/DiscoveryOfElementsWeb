// 分子構造エンジン: SMILES を解析 → 2D配置(距離制約による最適化) → SVG描画 / 結合の解析
(function (root) {
  "use strict";
  // ---- 基礎データ ----
  const ORG = { B: [3], C: [4], N: [3, 5], O: [2], P: [3, 5], S: [2, 4, 6], F: [1], Cl: [1], Br: [1], I: [1] };
  const MASS = { H: 1.008, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974, S: 32.06, Cl: 35.45, K: 39.098, Ca: 40.078, Ti: 47.867, Fe: 55.845, Cu: 63.546, Zn: 65.38, Br: 79.904, Ag: 107.87, I: 126.904, Hg: 200.59, Pb: 207.2, Au: 196.967, Pt: 195.084, Li: 6.94, Be: 9.012, Sn: 118.71, Ba: 137.327, Mn: 54.938, Cr: 51.996, Ni: 58.693, Co: 58.933, W: 183.84, U: 238.029, He: 4.003, Ne: 20.18, Ar: 39.948, Kr: 83.798, Xe: 131.293, Sr: 87.62, Rb: 85.468, Cs: 132.905, Cd: 112.414, Sb: 121.76, As: 74.922, Bi: 208.98, Se: 78.971, Ra: 226 };
  const EN = { H: 2.2, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.9, P: 2.19, S: 2.58, Cl: 3.16, K: 0.82, Ca: 1.0, Ti: 1.54, Cr: 1.66, Mn: 1.55, Fe: 1.83, Co: 1.88, Ni: 1.91, Cu: 1.9, Zn: 1.65, Br: 2.96, Ag: 1.93, I: 2.66, Pt: 2.28, Au: 2.54, Hg: 2.0, Pb: 2.33, Sn: 1.96, Ba: 0.89, Sr: 0.95, Rb: 0.82, Cs: 0.79, Xe: 2.6 };
  const METALS = new Set(["Li", "Be", "Na", "Mg", "Al", "K", "Ca", "Ti", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ag", "Au", "Pt", "Hg", "Pb", "Sn", "Ba", "Sr", "Rb", "Cs", "Cd"]);
  const VE = { H: 1, C: 4, N: 5, O: 6, F: 7, Cl: 7, Br: 7, I: 7, S: 6, P: 5, B: 3, Si: 4 };
  // 結合の長さ(Å)とエネルギー(kJ/mol)の目安: キー "A-B" "A=B" "A#B"
  const BOND_DATA = {
    "H-H": [0.74, 436], "C-H": [1.09, 413], "C-C": [1.54, 347], "C=C": [1.34, 614], "C#C": [1.2, 839], "C-O": [1.43, 358], "C=O": [1.21, 799],
    "O-H": [0.96, 463], "N-H": [1.01, 391], "C-N": [1.47, 305], "C=N": [1.28, 615], "N#N": [1.1, 945], "O=O": [1.21, 498], "C-Cl": [1.77, 339],
    "H-Cl": [1.27, 431], "S-H": [1.34, 347], "C-S": [1.82, 259], "S=O": [1.43, 523], "N-N": [1.45, 160], "O-O": [1.48, 146], "C-F": [1.35, 485],
    "Cl-Cl": [1.99, 243], "N-O": [1.4, 201], "N=O": [1.2, 607], "C#N": [1.16, 891], "H-F": [0.92, 567], "H-Br": [1.41, 366], "H-I": [1.61, 299],
    "C-Br": [1.94, 285], "C-I": [2.14, 213], "S-S": [2.05, 266], "O-S": [1.58, 265], "P-O": [1.63, 335], "P=O": [1.48, 544], "P-H": [1.42, 322], "P-P": [2.21, 201],
  };

  // ---- SMILES 解析 ----
  function parse(s) {
    const atoms = [], bonds = [], stack = [], ring = {};
    let prev = null, pend = null, mark = null, i = 0, comp = 0;
    const bondChar = { "-": 1, "=": 2, "#": 3, "~": "d" };
    function addAtom(a) {
      a.order = []; a.comp = comp; a.hasPrev = prev !== null; atoms.push(a);
      const idx = atoms.length - 1;
      if (prev !== null) {
        bonds.push({ a: prev, b: idx, o: pend === null ? 1 : pend, mark: mark });
        atoms[prev].order.push(idx); a.order.push(prev);
      }
      for (let k = 0; k < (a.hs || 0) && a.bracket; k++) a.order.push("H");
      pend = null; mark = null; prev = idx;
    }
    while (i < s.length) {
      const c = s[i];
      if (c === "(") { stack.push(prev); i++; }
      else if (c === ")") { prev = stack.pop(); pend = null; i++; }
      else if (c === ".") { prev = null; comp++; i++; }
      else if (bondChar[c] !== undefined) { pend = bondChar[c]; i++; }
      else if (c === "/" || c === "\\") { mark = c; i++; }
      else if (/[0-9%]/.test(c)) {
        let key = c; i++;
        if (c === "%") { key = s.substr(i, 2); i += 2; }
        const cur = prev;
        if (ring[key] !== undefined) {
          const op = ring[key]; delete ring[key];
          bonds.push({ a: op.atom, b: cur, o: pend === null ? (op.o === null ? 1 : op.o) : pend, mark: null });
          const oa = atoms[op.atom].order, ix = oa.findIndex((x) => x && x.r === key);
          if (ix >= 0) oa[ix] = cur;
          atoms[cur].order.push(op.atom);
        } else {
          ring[key] = { atom: cur, o: pend };
          atoms[cur].order.push({ r: key });
        }
        pend = null;
      } else if (c === "[") {
        const j = s.indexOf("]", i);
        const body = s.slice(i + 1, j); i = j + 1;
        const m = body.match(/^(\d*)([A-Z][a-z]?)(@@?)?(?:H(\d*))?([+-]+\d*|[+-]\d*)?$/);
        if (!m) throw new Error("SMILES bracket: " + body);
        let charge = 0;
        if (m[5]) { const sign = m[5][0] === "+" ? 1 : -1; const num = m[5].replace(/[+-]/g, ""); charge = sign * (num ? +num : m[5].length); }
        addAtom({ el: m[2], charge, hs: m[4] === undefined ? (/H/.test(body.replace(m[2], "")) ? 1 : 0) : m[4] === "" ? 1 : +m[4], chir: m[3] || null, bracket: true });
      } else if (/[A-Z]/.test(c)) {
        let el = c;
        if ((c === "C" && s[i + 1] === "l") || (c === "B" && s[i + 1] === "r")) el = c + s[i + 1];
        i += el.length;
        if (!ORG[el]) throw new Error("SMILES element: " + el);
        addAtom({ el, charge: 0, hs: null, chir: null, bracket: false });
      } else throw new Error("SMILES char: " + c + " in " + s);
    }
    // 暗黙の水素 (先行原子の直後に置く)
    atoms.forEach((a, idx) => {
      if (a.bracket) return;
      let sum = 0; bonds.forEach((b) => { if (b.a === idx || b.b === idx) sum += b.o === "d" ? 0 : b.o; });
      const v = ORG[a.el].find((x) => x >= sum); a.hs = v === undefined ? 0 : v - sum;
      const at = a.hasPrev ? 1 : 0;
      a.order.splice(at, 0, ...Array(a.hs).fill("H"));
    });
    // 二重結合の cis/trans (X/A=B/Y 形式)
    bonds.forEach((b) => {
      if (b.o !== 2) return;
      const inM = bonds.find((x) => x.b === b.a && x.mark && x.o === 1);
      const outM = bonds.find((x) => x.a === b.b && x.mark && x.o === 1);
      if (inM && outM) b.geo = { x: inM.a, y: outM.b, cis: inM.mark !== outM.mark };
    });
    return { atoms, bonds };
  }

  // ---- 解析(式・質量・結合) ----
  function formulaOf(m) {
    const cnt = {};
    m.atoms.forEach((a) => { cnt[a.el] = (cnt[a.el] || 0) + 1; cnt.H = (cnt.H || 0) + (a.hs || 0); });
    const keys = Object.keys(cnt).filter((k) => cnt[k]);
    const hill = cnt.C ? ["C", "H", ...keys.filter((k) => k !== "C" && k !== "H").sort()] : keys.sort();
    const sub = "₀₁₂₃₄₅₆₇₈₉";
    return hill.filter((k) => cnt[k]).map((k) => k + (cnt[k] > 1 ? String(cnt[k]).split("").map((d) => sub[+d]).join("") : "")).join("");
  }
  function massOf(m) {
    let t = 0; m.atoms.forEach((a) => { t += (MASS[a.el] || 0) + (a.hs || 0) * MASS.H; });
    return +t.toFixed(2);
  }
  function classify(e1, e2, ionic) {
    if (ionic) return "ionic";
    if (METALS.has(e1) && METALS.has(e2)) return "metallic";
    const d = Math.abs((EN[e1] || 2) - (EN[e2] || 2));
    return d >= 1.7 ? "ionic" : d >= 0.4 ? "polar" : "covalent";
  }
  const symB = { 1: "-", 2: "=", 3: "#" };
  function bondList(m) { // 結合の種類別集計
    const map = {};
    const add = (e1, e2, o, ionic) => {
      const [x, y] = [e1, e2].sort((p, q) => (p === "C" ? -1 : q === "C" ? 1 : p < q ? -1 : 1));
      const key = x + (o === "d" ? "→" : symB[o] || "-") + y;
      const d = Math.abs((EN[e1] || 2) - (EN[e2] || 2));
      if (!map[key]) map[key] = { key, n: 0, d: +d.toFixed(2), type: o === "d" ? "coordinate" : classify(e1, e2, ionic), data: BOND_DATA[x + (symB[o] || "-") + y] || BOND_DATA[y + (symB[o] || "-") + x] || null };
      map[key].n++;
    };
    m.bonds.forEach((b) => add(m.atoms[b.a].el, m.atoms[b.b].el, b.o, m.atoms[b.a].comp !== m.atoms[b.b].comp));
    m.atoms.forEach((a) => { for (let k = 0; k < (a.hs || 0); k++) add(a.el, "H", 1, false); });
    return Object.values(map);
  }
  // VSEPR: 各中心原子の立体形
  function shapes(m) {
    const out = [];
    m.atoms.forEach((a, idx) => {
      const nb = []; let order = 0;
      m.bonds.forEach((b) => { if (b.a === idx) { nb.push(b.b); order += b.o === "d" ? 0 : b.o; } else if (b.b === idx) { nb.push(b.a); order += b.o === "d" ? 0 : b.o; } });
      const n = nb.length + (a.hs || 0);
      if (n < 2 || !VE[a.el]) return;
      const dative = m.bonds.filter((b) => (b.a === idx || b.b === idx) && b.o === "d").length;
      const lp = Math.max(0, Math.floor((VE[a.el] - order - (a.hs || 0) - a.charge) / 2));
      const sn = n + lp;
      let name = "", ang = 0;
      if (sn === 2) { name = "直線形"; ang = 180; } else if (sn === 3) { name = lp ? "折れ線形" : "平面三角形"; ang = lp ? 117 : 120; }
      else if (sn === 4) { name = lp === 0 ? "正四面体形" : lp === 1 ? "三角錐形" : "折れ線形"; ang = lp === 0 ? 109.5 : lp === 1 ? 107 : 104.5; }
      else if (sn === 5) { name = "三方両錐形"; ang = 90; } else if (sn === 6) { name = "正八面体形"; ang = 90; }
      if (name && !dative) out.push({ atom: idx, el: a.el, name, angle: ang, lp });
    });
    return out;
  }

  // ---- 2D配置 ----
  function rng(seed) { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  function build(m, opts) { // 描画用グラフ(必要なら水素を明示)
    const nodes = m.atoms.map((a, i) => ({ el: a.el, charge: a.charge, hs: a.hs, src: i }));
    const edges = m.bonds.map((b) => ({ a: b.a, b: b.b, o: b.o, geo: b.geo || null }));
    const hOf = {};
    if (opts.full) {
      m.atoms.forEach((a, i) => { hOf[i] = []; for (let k = 0; k < (a.hs || 0); k++) { nodes.push({ el: "H", charge: 0, hs: 0, src: -1, of: i }); edges.push({ a: i, b: nodes.length - 1, o: 1 }); hOf[i].push(nodes.length - 1); } nodes[i].hs = 0; });
    }
    return { nodes, edges, hOf };
  }

  function findRings(n, adj) { // 最小環(SSSR近似)
    const rings = [], seen = new Set();
    const sp = (s, t, ban) => { // s→t の最短経路(辺 ban を使わない)
      const prev = new Array(n).fill(-1), q = [s]; prev[s] = s;
      while (q.length) { const u = q.shift(); if (u === t) break; for (const v of adj[u]) { if ((u === ban[0] && v === ban[1]) || (u === ban[1] && v === ban[0])) continue; if (prev[v] < 0) { prev[v] = u; q.push(v); } } }
      if (prev[t] < 0) return null; const p = [t]; let x = t; while (x !== s) { x = prev[x]; p.push(x); } return p.reverse();
    };
    for (let u = 0; u < n; u++) for (const v of adj[u]) if (u < v) {
      const p = sp(u, v, [u, v]); if (!p || p.length < 3 || p.length > 8) continue;
      const key = [...p].sort((a, b) => a - b).join(","); if (seen.has(key)) continue; seen.add(key); rings.push(p);
    }
    return rings;
  }

  function layout(m, opts) {
    const g = build(m, opts), n = g.nodes.length;
    const adj = Array.from({ length: n }, () => []);
    g.edges.forEach((e) => { adj[e.a].push(e.b); adj[e.b].push(e.a); });
    const target = new Map(); // i*n+j (i<j) → [d, w]
    const setT = (i, j, d, w) => { if (i === j) return; const k = i < j ? i * n + j : j * n + i; const old = target.get(k); if (!old || w >= old[1]) target.set(k, [d, w]); };
    g.edges.forEach((e) => setT(e.a, e.b, 1, 1));
    const rings = findRings(n, adj);
    const inRing = (a, b) => rings.some((r) => r.includes(a) && r.includes(b));
    rings.forEach((r) => { const L = r.length; for (let x = 0; x < L; x++) for (let y = x + 1; y < L; y++) { const k = Math.min(y - x, L - (y - x)); setT(r[x], r[y], Math.sin(k * Math.PI / L) / Math.sin(Math.PI / L), 1); } });
    const order = (i) => g.edges.filter((e) => e.a === i || e.b === i).map((e) => e.o);
    // 1-3 (結合角)
    for (let b = 0; b < n; b++) {
      const nb = adj[b], os = order(b);
      const nd = g.nodes[b], bsum = os.reduce((p, o) => p + (o === "d" ? 0 : o), 0), lp = VE[nd.el] !== undefined ? Math.max(0, Math.floor((VE[nd.el] - bsum - (nd.hs || 0) - (nd.charge || 0)) / 2)) : 0;
      const linear = nb.length === 2 && lp === 0 && (os.some((o) => o === 3) || os.filter((o) => o === 2).length === 2);
      for (let x = 0; x < nb.length; x++) for (let y = x + 1; y < nb.length; y++) {
        if (rings.some((r) => r.includes(nb[x]) && r.includes(b) && r.includes(nb[y]))) continue;
        const d = linear ? 2 : nb.length >= 4 ? 1.5 : 1.732;
        setT(nb[x], nb[y], d, 0.9);
      }
    }
    // 1-4 (ジグザグ/幾何異性)
    g.edges.forEach((e) => {
      const b = e.a, c = e.b; if (inRing(b, c)) return;
      const A = adj[b].filter((x) => x !== c), D = adj[c].filter((x) => x !== b);
      if (e.o === 3 && A.length === 1 && D.length === 1) setT(A[0], D[0], 3, 1);
      else if (e.o === 2 && e.geo) {
        const { x, y, cis } = e.geo;
        A.forEach((p) => D.forEach((q) => { const same = (p === x) === (q === y); const isCis = same ? cis : !cis; setT(p, q, isCis ? 2 : 2.646, 1); }));
      } else if (A.length === 1 && D.length === 1) setT(A[0], D[0], 2.646, 0.6);
      else if (e.o === 2 && A.length && D.length) A.forEach((p) => D.forEach((q) => setT(p, q, 2.3, 0.4)));
    });
    // 別の成分(イオンなど)どうしを、ゆるく引き寄せる
    const reps = {}; m.atoms.forEach((at, i) => { if (reps[at.comp] === undefined) reps[at.comp] = i; });
    const rk = Object.keys(reps);
    for (let x = 0; x < rk.length; x++) for (let y = x + 1; y < rk.length; y++) setT(reps[rk[x]], reps[rk[y]], 2.6, 0.12);
    // 水素結合などの追加の引力
    (opts.hb || []).forEach(([i, j]) => setT(i, j, 1.7, 0.7));
    // 反復最適化(複数の初期配置から最良を選ぶ)
    const seedBase = hash((opts.seedKey || "") + n);
    let best = null, bestS = Infinity;
    for (let tr = 0; tr < 8; tr++) {
      const R = rng(seedBase + tr * 7919);
      const P = Array.from({ length: n }, (_, i) => ({ x: (R() - 0.5) * Math.sqrt(n) * 1.5 + (m.atoms[i] ? m.atoms[i].comp : 0) * 3, y: (R() - 0.5) * Math.sqrt(n) * 1.5 }));
      for (let it = 0; it < 500; it++) {
        const step = 0.5 * (1 - it / 520);
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          const t = target.get(i * n + j);
          let dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, d = Math.hypot(dx, dy) || 1e-6;
          let want, w;
          if (t) { want = t[0]; w = t[1]; } else { if (d >= 1.7) continue; want = 1.7; w = 0.25; }
          const f = (d - want) * w * step * 0.5; dx /= d; dy /= d;
          P[i].x += dx * f; P[i].y += dy * f; P[j].x -= dx * f; P[j].y -= dy * f;
        }
      }
      let S = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const t = target.get(i * n + j); const d = Math.hypot(P[j].x - P[i].x, P[j].y - P[i].y);
        if (t) S += t[1] * (d - t[0]) ** 2; else if (d < 1.4) S += 0.6 * (1.4 - d) ** 2;
      }
      if (S < bestS) { bestS = S; best = P; }
    }
    // 向きをそろえる(単一成分のとき主軸を水平に)
    const comps = new Set(m.atoms.map((a) => a.comp));
    if (comps.size === 1 && n > 2) {
      const cx = best.reduce((s, p) => s + p.x, 0) / n, cy = best.reduce((s, p) => s + p.y, 0) / n;
      let sxx = 0, syy = 0, sxy = 0; best.forEach((p) => { sxx += (p.x - cx) ** 2; syy += (p.y - cy) ** 2; sxy += (p.x - cx) * (p.y - cy); });
      const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(-th), s = Math.sin(-th);
      best = best.map((p) => ({ x: (p.x - cx) * c - (p.y - cy) * s, y: (p.x - cx) * s + (p.y - cy) * c }));
      // 重い原子(ヘテロ原子)を右側に寄せる向きに統一
      const hx = best.reduce((s, p, i) => s + p.x * (g.nodes[i].el === "C" || g.nodes[i].el === "H" ? 0 : 1), 0);
      if (hx < 0) best = best.map((p) => ({ x: -p.x, y: p.y }));
    }
    return { g, P: best, rings, adj };
  }

  // ---- 立体配置(くさび/破線) ----
  function wedges(m, L) {
    const { g, P, adj } = L, out = [];
    const det = (v0, v1, v2, v3) => {
      const a = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]], b = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]], c = [v3[0] - v0[0], v3[1] - v0[1], v3[2] - v0[2]];
      return a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
    };
    const s0 = Math.sign(det([0, 0, 1], [1, 0, -0.33], [Math.cos(2.094), Math.sin(2.094), -0.33], [Math.cos(4.189), Math.sin(4.189), -0.33]));
    m.atoms.forEach((a, c) => {
      if (!a.chir) return;
      const ord = a.order.filter((x) => x !== undefined);
      if (ord.length !== 4) return;
      const cp = P[c];
      // 各近傍の2D位置(暗黙のHは他3つの反対側)
      const heavy = ord.filter((x) => typeof x === "number");
      const sumx = heavy.reduce((s, j) => { const d = Math.hypot(P[j].x - cp.x, P[j].y - cp.y) || 1; return [s[0] + (P[j].x - cp.x) / d, s[1] + (P[j].y - cp.y) / d]; }, [0, 0]);
      const pos = ord.map((x) => {
        if (typeof x === "number") return [P[x].x - cp.x, P[x].y - cp.y];
        const d = Math.hypot(sumx[0], sumx[1]) || 1; return [-sumx[0] / d * 0.8, -sumx[1] / d * 0.8];
      });
      const need = a.chir === "@" ? s0 : -s0;
      for (let tryIdx = 0; tryIdx < ord.length; tryIdx++) {
        const j = ord.findIndex((x, k) => typeof x === "number" && k === tryIdx);
        if (j < 0) continue;
        for (const z of [1, -1]) {
          const v = pos.map((p, k) => [p[0], p[1], k === j ? z : 0]);
          if (Math.sign(det(v[0], v[1], v[2], v[3])) === need) { out.push({ from: c, to: ord[j], type: z > 0 ? "w" : "d" }); return; }
        }
      }
    });
    return out;
  }

  // ---- SVG 描画 ----
  const COL = { C: "#cfd3dc", H: "#eceff4", N: "#6fa3ff", O: "#ff7a7a", S: "#e8d34a", P: "#ffa94d", F: "#7fe3a0", Cl: "#5fd17a", Br: "#d9695a", I: "#b583e8", Na: "#b48cf0", K: "#c07ae0", Ca: "#8fd18f", Cu: "#e8923d", Fe: "#d98a5f", Ag: "#c8ccd6", Zn: "#9fb0c8", Mg: "#8fd18f", Al: "#c8ccd6", Hg: "#b8b8c8", Pb: "#8a8fa0", Au: "#e8c23d", Pt: "#d0d0e0", Li: "#c9a0f0", Si: "#e0b890" };
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const subs = (n) => (n > 1 ? `<tspan dy="3.5" font-size="10">${n}</tspan><tspan dy="-3.5">&#8203;</tspan>` : "");

  function toSVG(smiles, opts) {
    opts = opts || {};
    const m = parse(smiles);
    const full = opts.full !== undefined ? opts.full : false;
    const L = layout(m, { full, hb: opts.hb, seedKey: smiles.replace(/@/g, "") });
    const { g, P, rings, adj } = L;
    const W = wedges(m, L);
    const n = g.nodes.length, B = opts.bond || 40;
    // 外接枠
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    P.forEach((p) => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, -p.y); y1 = Math.max(y1, -p.y); });
    const pad = 34, w = Math.max(150, (x1 - x0) * B + pad * 2), h = Math.max(100, (y1 - y0) * B + pad * 2);
    const ox = (w - (x1 - x0) * B) / 2 - x0 * B, oy = (h - (y1 - y0) * B) / 2 - y0 * B;
    const X = (i) => P[i].x * B + ox, Y = (i) => -P[i].y * B + oy;
    const heavyCount = m.atoms.length;
    const showC = (i) => full || g.nodes[i].charge !== 0 || adj[i].length === 0 || (heavyCount <= 2 && g.nodes[i].el === "C");
    const labeled = (i) => g.nodes[i].el !== "C" || showC(i);
    const gap = (i) => (labeled(i) ? (g.nodes[i].el === "H" ? 8 : 11) : 0);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" class="molsvg" role="img" aria-label="${esc(opts.label || smiles)}"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">`;
    const cen = (r) => { let sx = 0, sy = 0; r.forEach((i) => { sx += X(i); sy += Y(i); }); return [sx / r.length, sy / r.length]; };
    const wedgeSet = new Set(W.map((q) => q.from + ">" + q.to));
    const line = (x1_, y1_, x2_, y2_, extra) => `<line x1="${x1_.toFixed(1)}" y1="${y1_.toFixed(1)}" x2="${x2_.toFixed(1)}" y2="${y2_.toFixed(1)}"${extra || ""}/>`;
    g.edges.forEach((e) => {
      let ax = X(e.a), ay = Y(e.a), bx = X(e.b), by = Y(e.b);
      const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      const ga = gap(e.a), gb = gap(e.b);
      const sx = ax + ux * ga, sy = ay + uy * ga, ex = bx - ux * gb, ey = by - uy * gb;
      if (wedgeSet.has(e.a + ">" + e.b) || wedgeSet.has(e.b + ">" + e.a)) {
        const q = W.find((z) => (z.from === e.a && z.to === e.b) || (z.from === e.b && z.to === e.a));
        const fromA = q.from === e.a, nx = -uy * 4.5, ny = ux * 4.5;
        const [px, py, qx, qy] = fromA ? [sx, sy, ex, ey] : [ex, ey, sx, sy];
        if (q.type === "w") svg += `<polygon points="${px.toFixed(1)},${py.toFixed(1)} ${(qx + nx).toFixed(1)},${(qy + ny).toFixed(1)} ${(qx - nx).toFixed(1)},${(qy - ny).toFixed(1)}" fill="currentColor" stroke="none"/>`;
        else for (let k = 1; k <= 6; k++) { const t = k / 7, cx = px + (qx - px) * t, cy = py + (qy - py) * t, wd = 4.5 * t; svg += line(cx + uy * wd, cy - ux * wd, cx - uy * wd, cy + ux * wd, ' stroke-width="1.4"'); }
        return;
      }
      if (e.o === "d") { // 配位結合: 供与側から受容側への矢印
        svg += line(ex, ey, sx, sy, ' stroke-dasharray="0"');
        const hx = sx, hy = sy, a1 = Math.atan2(sy - ey, sx - ex);
        svg += `<polygon points="${hx.toFixed(1)},${hy.toFixed(1)} ${(hx - 8 * Math.cos(a1 - 0.4)).toFixed(1)},${(hy - 8 * Math.sin(a1 - 0.4)).toFixed(1)} ${(hx - 8 * Math.cos(a1 + 0.4)).toFixed(1)},${(hy - 8 * Math.sin(a1 + 0.4)).toFixed(1)}" fill="currentColor" stroke="none"/>`;
        return;
      }
      const nx = -uy, ny = ux;
      if (e.o === 1) svg += line(sx, sy, ex, ey);
      else if (e.o === 3) { svg += line(sx, sy, ex, ey) + line(sx + nx * 3.6, sy + ny * 3.6, ex + nx * 3.6, ey + ny * 3.6) + line(sx - nx * 3.6, sy - ny * 3.6, ex - nx * 3.6, ey - ny * 3.6); }
      else {
        const rg = rings.find((r) => r.includes(e.a) && r.includes(e.b));
        if (rg) { // 環の内側へずらした副線
          const [cx, cy] = cen(rg), side = ((cx - ax) * nx + (cy - ay) * ny) >= 0 ? 1 : -1, off = 5.5 * side;
          svg += line(sx, sy, ex, ey) + line(sx + nx * off + ux * 5, sy + ny * off + uy * 5, ex + nx * off - ux * 5, ey + ny * off - uy * 5);
        } else if (adj[e.a].length === 1 || adj[e.b].length === 1) {
          svg += line(sx + nx * 2.8, sy + ny * 2.8, ex + nx * 2.8, ey + ny * 2.8) + line(sx - nx * 2.8, sy - ny * 2.8, ex - nx * 2.8, ey - ny * 2.8);
        } else {
          // 置換基の多い側に副線
          const cnt = (i) => adj[i].filter((k) => k !== e.a && k !== e.b);
          let vx = 0, vy = 0; [...cnt(e.a), ...cnt(e.b)].forEach((k) => { vx += X(k) - (ax + bx) / 2; vy += Y(k) - (ay + by) / 2; });
          const side = (vx * nx + vy * ny) >= 0 ? 1 : -1, off = 5 * side;
          svg += line(sx, sy, ex, ey) + line(sx + nx * off + ux * 4, sy + ny * off + uy * 4, ex + nx * off - ux * 4, ey + ny * off - uy * 4);
        }
      }
    });
    svg += "</g>";
    // 水素結合 (点線)
    (opts.hb || []).forEach(([i, j]) => { svg += line(X(i), Y(i), X(j), Y(j), ' stroke="#6ec1b0" stroke-width="1.8" stroke-dasharray="3 4"'); });
    // 原子ラベル
    svg += `<g font-family="-apple-system,Hiragino Sans,sans-serif" font-size="15" font-weight="600" text-anchor="middle">`;
    for (let i = 0; i < n; i++) {
      const nd = g.nodes[i]; if (!labeled(i)) continue;
      const hs = nd.hs || 0, col = COL[nd.el] || "#cfd3dc";
      const nbx = adj[i].reduce((s, k) => s + (X(k) - X(i)), 0);
      const hLeft = hs > 0 && nbx > 2 && adj[i].length >= 1; // 結合が右側にあるとき H は左へ
      const hTxt = hs > 0 ? `H${subs(hs)}` : "";
      const sup = nd.charge ? `<tspan dy="-6" font-size="10">${Math.abs(nd.charge) > 1 ? Math.abs(nd.charge) : ""}${nd.charge > 0 ? "+" : "−"}</tspan>` : "";
      const body = hLeft ? `${hTxt}${nd.el}${sup}` : `${nd.el}${hTxt}${sup}`;
      const shift = hLeft && hs > 0 ? -(hs > 1 ? 11 : 8) : !hLeft && hs > 0 ? (hs > 1 ? 11 : 8) : 0;
      svg += `<text x="${(X(i) + shift).toFixed(1)}" y="${(Y(i) + 5).toFixed(1)}" fill="${col}">${body}</text>`;
    }
    svg += "</g></svg>";
    return { svg, mol: m, info: { formula: formulaOf(m), mass: massOf(m), bonds: bondList(m), shapes: shapes(m) } };
  }

  // ---- 格子図(イオン結晶・金属) ----
  function ionicLattice(cat, an, cq, aq) {
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 150" class="molsvg"><g font-family="-apple-system,sans-serif" font-size="11" font-weight="700" text-anchor="middle">`;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
      const isC = (r + c) % 2 === 0, x = 25 + c * 35, y = 22 + r * 35, rad = isC ? 11 : 15;
      s += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${isC ? "#b48cf0" : "#5fd17a"}" fill-opacity=".55" stroke="${isC ? "#b48cf0" : "#5fd17a"}"/><text x="${x}" y="${y + 4}" fill="currentColor">${isC ? cat + (cq > 1 ? cq : "") + "+" : an + (aq > 1 ? aq : "") + "−"}</text>`;
    }
    return s + `</g></svg>`;
  }
  function metalLattice(sym) {
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 150" class="molsvg"><g font-family="-apple-system,sans-serif" font-size="10" font-weight="700" text-anchor="middle">`;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const x = 25 + c * 35 + (r % 2 ? 17 : 0), y = 22 + r * 33; s += `<circle cx="${x}" cy="${y}" r="13" fill="#e8923d" fill-opacity=".45" stroke="#e8923d"/><text x="${x}" y="${y + 3}" fill="currentColor">${sym}⁺</text>`; }
    for (let k = 0; k < 26; k++) { const x = 10 + ((k * 53) % 175), y = 8 + ((k * 37) % 135); s += `<circle cx="${x}" cy="${y}" r="2.2" fill="#6ec1b0"/>`; }
    return s + `</g></svg>`;
  }

  // ---- 酸化数: 結合の電子を電気陰性度の大きい原子に割り当てる ----
  function oxNumbers(m) {
    const ox = m.atoms.map((a) => a.charge || 0);
    m.bonds.forEach((b) => {
      if (b.o === "d") return;
      const ea = EN[m.atoms[b.a].el] || 2, eb = EN[m.atoms[b.b].el] || 2;
      if (ea < eb) { ox[b.a] += b.o; ox[b.b] -= b.o; } else if (ea > eb) { ox[b.a] -= b.o; ox[b.b] += b.o; }
    });
    m.atoms.forEach((a, i) => { if (a.hs) ox[i] += (EN[a.el] || 2) < EN.H ? a.hs : -a.hs; });
    return ox;
  }
  // 元素ごとの原子数と酸化数の合計 { C: {n, sum}, H: {...} }
  function oxProfile(m) {
    const ox = oxNumbers(m), prof = {};
    m.atoms.forEach((a, i) => { const p = (prof[a.el] = prof[a.el] || { n: 0, sum: 0 }); p.n++; p.sum += ox[i]; });
    m.atoms.forEach((a) => { if (a.hs) { const p = (prof.H = prof.H || { n: 0, sum: 0 }); p.n += a.hs; p.sum += ((EN[a.el] || 2) < EN.H ? -1 : 1) * a.hs; } });
    return prof;
  }
  // 成分(イオンなど)ごとの式と電荷。同じものはまとめる
  function components(m) {
    const map = new Map(), sup = "⁰¹²³⁴⁵⁶⁷⁸⁹", sub = "₀₁₂₃₄₅₆₇₈₉";
    const comps = {};
    m.atoms.forEach((a) => { (comps[a.comp] = comps[a.comp] || { atoms: [], charge: 0 }).atoms.push(a); comps[a.comp].charge += a.charge || 0; });
    Object.values(comps).forEach((c) => {
      const cnt = {}; c.atoms.forEach((a) => { cnt[a.el] = (cnt[a.el] || 0) + 1; cnt.H = (cnt.H || 0) + (a.hs || 0); });
      let keys = Object.keys(cnt).filter((k) => cnt[k]);
      const order = keys.includes("C") ? ["C", ...(keys.includes("H") ? ["H"] : []), ...keys.filter((k) => k !== "C" && k !== "H").sort()] : keys.sort((x, y) => (x === "H" ? -1 : y === "H" ? 1 : 0) || (EN[x] || 0) - (EN[y] || 0));
      let f = order.map((k) => k + (cnt[k] > 1 ? String(cnt[k]).split("").map((d) => sub[+d]).join("") : "")).join("");
      f = ({ "HO": "OH", "H₄N": "NH₄", "CHO₃": "HCO₃", "C₂H₃O₂": "CH₃COO", "H₃O": "H₃O" })[f] || f;
      const ch = c.charge ? (Math.abs(c.charge) > 1 ? String(Math.abs(c.charge)).split("").map((d) => sup[+d]).join("") : "") + (c.charge > 0 ? "⁺" : "⁻") : "";
      const key = f + ch;
      if (!map.has(key)) map.set(key, { formula: f, charge: c.charge, label: f + ch, n: 0 });
      map.get(key).n++;
    });
    return [...map.values()];
  }

  const api = { oxNumbers, oxProfile, components, parse, formulaOf, massOf, bondList, shapes, classify, toSVG, ionicLattice, metalLattice, EN, MASS, METALS, BOND_DATA, layout };
  if (typeof module !== "undefined") module.exports = api; else root.MolViz = api;
})(typeof window !== "undefined" ? window : globalThis);
