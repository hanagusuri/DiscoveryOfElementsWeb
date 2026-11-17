// 分子ラボ 3D(プロトタイプ): 依存ライブラリなしの、Canvas 製 3D 描画。
//  - 反応ビュー: 反応の定義(分子・原子の対応・実測の反応熱)から、結合の切断・形成とエネルギーの出入りを自動で組み立てる
//  - 原子ビュー: 陽子・中性子・電子殻(ボーア模型)
// 結合エネルギーは MolViz.BOND_DATA(kJ/mol)を再利用する。
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const prog = (t, w) => sm((t - w[0]) / (w[1] - w[0]));
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const rodrigues = (v, ax, ang) => {
    const c = Math.cos(ang), s = Math.sin(ang), d = dot(ax, v) * (1 - c), cr = cross(ax, v);
    return [v[0] * c + cr[0] * s + ax[0] * d, v[1] * c + cr[1] * s + ax[1] * d, v[2] * c + cr[2] * s + ax[2] * d];
  };
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---- 色・半径(CPK 配色) ----
  const COL = { H: [244, 244, 244], He: [217, 255, 255], C: [96, 96, 104], N: [60, 90, 250], O: [227, 66, 52], Na: [171, 92, 242], Cl: [40, 220, 60] };
  const RAD = { H: 0.34, He: 0.3, C: 0.5, N: 0.5, O: 0.52, Na: 0.6, Cl: 0.6 };
  const COLD = [92, 200, 255], WARM = [255, 138, 61], YEL = [255, 216, 74];
  const rgb = (c, k = 1, a = 1) => "rgba(" + Math.min(255, c[0] * k) + "," + Math.min(255, c[1] * k) + "," + Math.min(255, c[2] * k) + "," + a + ")";
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

  // ---- カメラ(透視投影) ----
  const newCam = (yaw, pitch) => ({ yaw, pitch, zoom: 1, drag: false });
  function makeProj(cam, W, H, unit) {
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), F = 18;
    return (p) => {
      const x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy;
      const y2 = p[1] * cp - z * sp, z2 = p[1] * sp + z * cp;
      const k = unit * cam.zoom * F / (F + z2);
      return { x: W / 2 + x * k, y: H / 2 - y2 * k, s: k, d: z2 };
    };
  }

  // ---- 描画部品 ----
  function halo(g, x, y, r, c, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgb(c, 1, a)); gr.addColorStop(1, rgb(c, 1, 0));
    g.globalCompositeOperation = "lighter"; g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.globalCompositeOperation = "source-over";
  }
  function sphere(g, x, y, r, col, hc, hw) {
    if (hc > 0.02) halo(g, x, y, r * 2.8, COLD, hc * 0.55);
    if (hw > 0.02) halo(g, x, y, r * 2.8, WARM, hw * 0.6);
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r);
    gr.addColorStop(0, rgb(col, 1.55)); gr.addColorStop(0.5, rgb(col, 1)); gr.addColorStop(1, rgb(col, 0.38));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  function bondHalf(g, a, b, wpx, col, order) {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const offs = order === 1 ? [0] : order === 2 ? [-0.95, 0.95] : [-1.8, 0, 1.8];
    const w = wpx * (order === 1 ? 1 : order === 2 ? 0.7 : 0.55);
    g.lineCap = "round";
    offs.forEach((o) => {
      const ox = nx * o * wpx, oy = ny * o * wpx;
      const line = (lw, c, sx, sy) => { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(a.x + ox + sx, a.y + oy + sy); g.lineTo(b.x + ox + sx, b.y + oy + sy); g.stroke(); };
      line(w * 2, rgb(col, 0.42), 0, 0);
      line(w * 1.5, rgb(col, 0.95), 0, 0);
      line(w * 0.55, rgb(col, 1.7), -w * 0.28, -w * 0.28);
    });
  }
  function electronDot(g, x, y, r, col) {
    halo(g, x, y, r * 3.4, col, 0.55);
    g.fillStyle = rgb(col, 1.1); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }

  // ---- 入力(回転・拡大・タップ) ----
  function controls(cv, cam, onTap) {
    let sx = 0, sy = 0, moved = 0, down = false;
    cv.addEventListener("pointerdown", (e) => { down = true; cam.drag = true; sx = e.clientX; sy = e.clientY; moved = 0; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy; sx = e.clientX; sy = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      cam.yaw += dx * 0.009; cam.pitch = clamp(cam.pitch + dy * 0.009, -1.4, 1.4);
    });
    const up = (e) => {
      if (!down) return; down = false; cam.drag = false;
      if (moved < 6 && onTap) { const r = cv.getBoundingClientRect(); onTap(e.clientX - r.left, e.clientY - r.top); }
    };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("wheel", (e) => { e.preventDefault(); cam.zoom = clamp(cam.zoom * (e.deltaY < 0 ? 1.1 : 0.91), 0.5, 2.6); }, { passive: false });
  }
  function fit(cv, aspect, fixedH) {
    const w = cv.clientWidth || cv.parentElement.clientWidth || 600, h = fixedH || Math.round(w * aspect), dpr = window.devicePixelRatio || 1;
    cv.style.height = h + "px"; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, W: w, H: h };
  }
  // =====================================================================
  //  反応ビュー: 反応の定義(分子・原子の対応・実測の反応熱)から、3D の配置とエネルギーの階段を自動で組み立てる
  // =====================================================================
  const BD = window.MolViz.BOND_DATA;
  const SYM = { 1: "-", 2: "=", 3: "#" };
  function bondInfo(e1, e2, o) {
    const k1 = e1 + SYM[o] + e2, k2 = e2 + SYM[o] + e1, k = BD[k1] ? k1 : BD[k2] ? k2 : null;
    if (!k) { console.warn("結合エネルギーのデータがありません: " + k1); return { name: k1, e: 0 }; }
    return { name: k.replace("-", "–").replace("#", "≡"), e: BD[k][1] };
  }
  const fmt = (v) => (v < 0 ? "−" : v > 0 ? "+" : "") + Math.abs(Math.round(v));
  const VE = { H: 1, C: 4, N: 5, O: 6, Cl: 7 };

  // 分子の雛形: 原子 [元素, 局所座標(Å)] と結合 [原子A, 原子B, 結合次数]
  const tet = (s) => [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => mul(v, s / Math.sqrt(3)));
  const MOLT = {
    H2: { name: "H₂", atoms: [["H", [-0.37, 0, 0]], ["H", [0.37, 0, 0]]], bonds: [[0, 1, 1]] },
    O2: { name: "O₂", atoms: [["O", [-0.605, 0, 0]], ["O", [0.605, 0, 0]]], bonds: [[0, 1, 2]] },
    N2: { name: "N₂", atoms: [["N", [-0.55, 0, 0]], ["N", [0.55, 0, 0]]], bonds: [[0, 1, 3]] },
    Cl2: { name: "Cl₂", atoms: [["Cl", [-0.995, 0, 0]], ["Cl", [0.995, 0, 0]]], bonds: [[0, 1, 1]] },
    HCl: { name: "HCl", atoms: [["H", [-0.8, 0, 0]], ["Cl", [0.47, 0, 0]]], bonds: [[0, 1, 1]] },
    CO: { name: "CO", atoms: [["C", [-0.48, 0, 0]], ["O", [0.65, 0, 0]]], bonds: [[0, 1, 3]] },
    H2O2: { name: "H₂O₂", atoms: [["O", [-0.74, 0, 0]], ["O", [0.74, 0, 0]], ["H", [-0.907, 0.946, 0]], ["H", [0.907, -0.339, 0.883]]], bonds: [[0, 1, 1], [0, 2, 1], [1, 3, 1]] },
    C2H4: { name: "C₂H₄", atoms: [["C", [-0.67, 0, 0]], ["C", [0.67, 0, 0]], ["H", [-1.24, 0.93, 0]], ["H", [-1.24, -0.93, 0]], ["H", [1.24, 0.93, 0]], ["H", [1.24, -0.93, 0]]], bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]] },
    C2H6: { name: "C₂H₆", atoms: [["C", [-0.77, 0, 0]], ["C", [0.77, 0, 0]]].concat([0, 1, 2].map((k) => ["H", [-1.133, 1.027 * Math.cos(k * TAU / 3), 1.027 * Math.sin(k * TAU / 3)]]), [0, 1, 2].map((k) => ["H", [1.133, 1.027 * Math.cos(k * TAU / 3 + Math.PI / 3), 1.027 * Math.sin(k * TAU / 3 + Math.PI / 3)]])), bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]] },
    NO: { name: "NO", atoms: [["N", [-0.58, 0, 0]], ["O", [0.58, 0, 0]]], bonds: [[0, 1, 2]] },
    H2O: { name: "H₂O", atoms: [["O", [0, -0.07, 0]], ["H", [0.757, 0.517, 0]], ["H", [-0.757, 0.517, 0]]], bonds: [[0, 1, 1], [0, 2, 1]] },
    CO2: { name: "CO₂", atoms: [["C", [0, 0, 0]], ["O", [1.16, 0, 0]], ["O", [-1.16, 0, 0]]], bonds: [[0, 1, 2], [0, 2, 2]] },
    NH3: { name: "NH₃", atoms: [["N", [0, 0.1, 0]]].concat([0, 1, 2].map((k) => ["H", [0.94 * Math.cos(k * TAU / 3), -0.27, 0.94 * Math.sin(k * TAU / 3)]])), bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
    CH4: { name: "CH₄", atoms: [["C", [0, 0, 0]]].concat(tet(1.09).map((v) => ["H", v])), bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  };
  // 反応の定義。map: 生成物の各原子(生成物の並び順)が、反応物のどの原子(反応物の並び順の通し番号)だったか
  const RXNS = [
    { id: "h2o", gid: "water_syn", name: "水素の燃焼", react: ["H2", "H2", "O2"], prod: ["H2O", "H2O"], map: [4, 0, 2, 5, 1, 3], actual: -484 },
    { id: "ch4", gid: "methane_burn", name: "メタンの燃焼", react: ["CH4", "O2", "O2"], prod: ["CO2", "H2O", "H2O"], map: [0, 5, 7, 6, 1, 2, 8, 3, 4], actual: -802 },
    { id: "nh3", gid: "haber", name: "アンモニア合成", react: ["N2", "H2", "H2", "H2"], prod: ["NH3", "NH3"], map: [0, 2, 4, 6, 1, 3, 5, 7], actual: -92 },
    { id: "hcl", name: "塩化水素の合成", react: ["H2", "Cl2"], prod: ["HCl", "HCl"], map: [0, 2, 1, 3], actual: -184 },
    { id: "no", name: "一酸化窒素(吸熱)", react: ["N2", "O2"], prod: ["NO", "NO"], map: [0, 2, 1, 3], actual: 180 },
    { id: "h2o_elec", gid: "water_elec", name: "水の分解(吸熱)", react: ["H2O", "H2O"], prod: ["H2", "H2", "O2"], map: [1, 4, 2, 5, 0, 3], actual: 484 },
    { id: "h2o2", gid: "h2o2_dec", name: "過酸化水素の分解", react: ["H2O2", "H2O2"], prod: ["H2O", "H2O", "O2"], map: [0, 2, 3, 4, 6, 7, 1, 5], actual: -212 },
    { id: "sabatier", gid: "sabatier", name: "メタンの合成", react: ["CO", "H2", "H2", "H2"], prod: ["CH4", "H2O"], map: [0, 2, 3, 4, 5, 1, 6, 7], actual: -206 },
    { id: "hydro", gid: "hydrogenation", name: "エチレンの水素付加", react: ["C2H4", "H2"], prod: ["C2H6"], map: [0, 1, 2, 3, 6, 4, 5, 7], actual: -137 },
  ];

  const eqText = (d) => molList(d.react) + " → " + molList(d.prod);
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const randAxis = (r) => norm([r() * 2 - 1, r() * 2 - 1, r() * 2 - 1]);
  const centroid = (ps) => mul(ps.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / ps.length);
  const fib = (i, n) => { const y = n === 1 ? 0 : 1 - 2 * (i + 0.5) / n, r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.399963; return [r * Math.cos(th), y, r * Math.sin(th)]; };
  function relaxMols(ms, minD, rng) { // 分子どうしが重ならないよう、中心を押し広げる
    for (let it = 0; it < 150; it++) {
      let moved = false;
      for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
        let d = 1e9;
        ms[i].rel.forEach((ra) => ms[j].rel.forEach((rb) => { d = Math.min(d, Math.hypot(...sub(add(ms[i].c, ra), add(ms[j].c, rb)))); }));
        if (d < minD) {
          let dir = sub(ms[i].c, ms[j].c); if (Math.hypot(...dir) < 1e-6) dir = [rng() - 0.5, rng() - 0.5, rng() - 0.5];
          dir = norm(dir); const s = (minD - d) * 0.5 + 0.02;
          ms[i].c = add(ms[i].c, mul(dir, s)); ms[j].c = sub(ms[j].c, mul(dir, s)); moved = true;
        }
      }
      if (!moved) break;
    }
  }
  function windows(n, a, b) { // n 個のイベントを、[a,b] の中に少し重ねて順に並べる
    if (n === 0) return [];
    if (n === 1) return [[a, b]];
    const wl = Math.min(b - a, (b - a) / n * 1.6), step = (b - a - wl) / (n - 1);
    return Array.from({ length: n }, (_, i) => [a + i * step, a + i * step + wl]);
  }

  // ---- 現在の反応(loadReaction が詰める) ----
  let CUR, EL, RA, FA, PA, MOLS, MOL_OF, DRIFT, BW, FW, BREAKS, FORMS, STAYS, TOTAL_IN, TOTAL_OUT, NET, STEPS, EVENTS, GROUPS, DURATION, EXT, YR;

  function buildReaction(def) {
    const rng = seeded(def.id), atoms = [], mols = [], pm = [];
    // 反応物の配置
    def.react.forEach((k, mi) => {
      const t = MOLT[k], base = atoms.length, lc = centroid(t.atoms.map((a) => a[1])), ax = randAxis(rng), ang = rng() * TAU;
      t.atoms.forEach((a) => atoms.push({ el: a[0], mol: mi }));
      mols.push({ t, base, c: [0, 0, 0], rel: t.atoms.map((a) => rodrigues(sub(a[1], lc), ax, ang)) });
    });
    const N = atoms.length, rho = Math.max(2.3, 1.15 * mols.length);
    mols.forEach((m, i) => { m.c = mols.length === 1 ? [0, 0, 0] : mul(fib(i, mols.length), rho); });
    relaxMols(mols, 2.6, rng);
    const R = new Array(N);
    mols.forEach((m) => m.rel.forEach((r, k) => { R[m.base + k] = add(m.c, r); }));
    // 結合
    const rb = [], pb = [];
    mols.forEach((m) => m.t.bonds.forEach((b) => rb.push({ a: m.base + b[0], b: m.base + b[1], o: b[2] })));
    // 生成物の配置: 反応物のどの原子から来たかに合わせて、向きと位置を決める
    let base = 0; const P = new Array(N), pOf = new Array(N);
    def.prod.forEach((k, pi) => {
      const t = MOLT[k], idx = t.atoms.map((_, q) => def.map[base + q]), lc = centroid(t.atoms.map((a) => a[1])), loc = t.atoms.map((a) => sub(a[1], lc));
      const tg = idx.map((j) => R[j]), cen = centroid(tg); let best = null;
      for (let it = 0; it < 600; it++) {
        const ax = randAxis(rng), ang = it === 0 ? 0 : rng() * TAU, rel = loc.map((v) => rodrigues(v, ax, ang));
        let cost = 0; rel.forEach((r, q) => { const d = sub(r, sub(tg[q], cen)); cost += dot(d, d); });
        if (!best || cost < best.cost) best = { cost, rel };
      }
      pm.push({ idx, c: cen, rel: best.rel });
      t.bonds.forEach((b) => pb.push({ a: idx[b[0]], b: idx[b[1]], o: b[2] }));
      base += t.atoms.length;
    });
    if (base !== N) throw new Error("反応の定義: 原子の数が合いません " + def.id);
    relaxMols(pm, 2.9, rng);
    const gcen = centroid(pm.map((m) => m.c)), DR = new Array(N);
    pm.forEach((m, pi) => {
      let dir = sub(m.c, gcen); if (Math.hypot(...dir) < 1e-6) dir = [rng() - 0.5, 0.2, rng() - 0.5];
      const dv = add(mul(norm(dir), 3.4), [0, 0.2, 0]);
      m.idx.forEach((j, q) => { P[j] = add(m.c, m.rel[q]); pOf[j] = pi; DR[j] = dv; });
    });
    // ばらばらの原子の位置(反応物と生成物のあいだ。原子どうしは離す)
    const F = R.map((r, j) => mul(add(r, P[j]), 0.8));
    for (let it = 0; it < 80; it++) {
      let moved = false;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const d = Math.hypot(...sub(F[i], F[j]));
        if (d < 1.8) { const dir = d < 1e-6 ? norm([rng() - 0.5, rng() - 0.5, rng() - 0.5]) : norm(sub(F[i], F[j])), s = (1.8 - d) * 0.5 + 0.01; F[i] = add(F[i], mul(dir, s)); F[j] = sub(F[j], mul(dir, s)); moved = true; }
      }
      if (!moved) break;
    }
    // 切れる結合 / できる結合 / そのままの結合
    const key = (a, b) => (a < b ? a + "_" + b : b + "_" + a);
    const rMap = new Map(rb.map((b) => [key(b.a, b.b), b])), pMap = new Map(pb.map((b) => [key(b.a, b.b), b]));
    const breaks = [], forms = [], stays = [];
    rb.forEach((b) => { // 結合の次数だけが変わるもの(C=C → C–C など)は「一部だけ切れる」として扱う
      const p = pMap.get(key(b.a, b.b));
      if (p && p.o === b.o) stays.push(b); else if (p && p.o < b.o) breaks.push({ a: b.a, b: b.b, o: b.o, oFrom: b.o, oTo: p.o, partial: true }); else if (!p) breaks.push(b);
    });
    pb.forEach((b) => {
      const r = rMap.get(key(b.a, b.b));
      if (!r) forms.push(b); else if (r.o < b.o) forms.push({ a: b.a, b: b.b, o: b.o, oFrom: r.o, oTo: b.o, partial: true });
    });
    const decorate = (list, kind, a, b) => {
      const ws = windows(list.length, a, b);
      list.forEach((x, i) => {
        const el1 = atoms[x.a].el, el2 = atoms[x.b].el;
        let info = bondInfo(el1, el2, x.o);
        if (x.partial) { const f = bondInfo(el1, el2, x.oFrom), t = bondInfo(el1, el2, x.oTo); info = { name: f.name + "→" + t.name, e: Math.abs(f.e - t.e) }; }
        Object.assign(x, info, { w: ws[i], kind });
      });
    };
    decorate(breaks, "break", 0.27, 0.51); decorate(forms, "form", 0.62, 0.92);
    const span = (list, j) => { const ws = list.filter((x) => !x.partial && (x.a === j || x.b === j)).map((x) => x.w); return ws.length ? [Math.min(...ws.map((w) => w[0])), Math.max(...ws.map((w) => w[1]))] : null; };
    return {
      def, atoms, mols, R, F, P, DR, breaks, forms, stays, pm,
      BW: R.map((_, j) => span(breaks, j)), FW: R.map((_, j) => span(forms, j) || [0.62, 0.92]),
    };
  }

  const summary = (list) => { // 「H–H 436 × 2 + O=O 498」
    const order = [], cnt = {};
    list.forEach((b) => { if (!cnt[b.name]) { cnt[b.name] = { n: 0, e: b.e }; order.push(b.name); } cnt[b.name].n++; });
    return order.map((k) => k + " " + cnt[k].e + (cnt[k].n > 1 ? " × " + cnt[k].n : "")).join(" + ");
  };
  const groupsOf = (list) => { // 同じ種類の連続する結合を、グラフの注釈では1つにまとめる
    const gs = [];
    list.forEach((b) => { const g = gs[gs.length - 1]; if (g && g.name === b.name) { g.n++; g.e += b.e; g.w1 = b.w[1]; } else gs.push({ name: b.name, n: 1, e: b.e, w0: b.w[0], w1: b.w[1], kind: b.kind }); });
    return gs;
  };

  const rx = { cv: $("cv"), cam: newCam(0.7, -0.3), t: 0, playing: true, speed: 1, parts: [], flashes: [], heat: 0, cold: 0, hits: [], style: "bs" };
  try { const s = localStorage.getItem("lab3d.style"); if (s === "bs" || s === "sf" || s === "st") rx.style = s; } catch (e) { /* 保存できなくても動く */ }
  Object.assign(rx, fit(rx.cv, 0.72));
  const ch = { cv: $("chart") };
  Object.assign(ch, fit(ch.cv, 0, 170));
  let lastStep = -1;
  const stepsEl = $("steps");
  ["① 近づく", "② 切る", "③ ばらばら", "④ つくる", "⑤ 完成"].forEach((n, i) => { const e = document.createElement("span"); e.textContent = n; if (i === 1) e.className = "cold"; if (i === 3) e.className = "hot"; stepsEl.appendChild(e); });

  const SUBN = "₀₁₂₃₄₅₆₇₈₉";
  function molList(keys) { // ["NH3","NH3"] -> "2NH₃"
    const order = [], cnt = {};
    keys.forEach((k) => { if (!cnt[k]) { cnt[k] = 0; order.push(k); } cnt[k]++; });
    return order.map((k) => (cnt[k] > 1 ? cnt[k] : "") + MOLT[k].name).join(" + ");
  }
  function loadReaction(idx) {
    const def = RXNS[idx], B = buildReaction(def);
    CUR = def; EL = B.atoms.map((a) => a.el); RA = B.R; FA = B.F; PA = B.P; DRIFT = B.DR; BW = B.BW; FW = B.FW;
    BREAKS = B.breaks; FORMS = B.forms; STAYS = B.stays;
    const rng = seeded(def.id + "far"), rc = centroid(B.mols.map((m) => m.c));
    MOLS = B.mols.map((m) => {
      let dir = sub(m.c, rc); if (Math.hypot(...dir) < 1e-6) dir = [1, 0.3, 0.2];
      return { c: m.c, off: add(mul(norm(dir), 7), [0, rng() * 2 - 1, rng() * 2 - 1]), ax: randAxis(rng), spin: (rng() < 0.5 ? -1 : 1) * (2 + rng() * 1.4) };
    });
    MOL_OF = B.atoms.map((a) => a.mol);
    TOTAL_IN = BREAKS.reduce((s, b) => s + b.e, 0); TOTAL_OUT = FORMS.reduce((s, f) => s + f.e, 0); NET = TOTAL_IN - TOTAL_OUT;
    DURATION = 12 + 1.6 * (BREAKS.length + FORMS.length);
    EXT = Math.max(...[].concat(RA, FA, PA).map((p) => Math.hypot(...p)));
    const lo = Math.min(0, NET), hi = TOTAL_IN, pad = (hi - lo) * 0.14; YR = [lo - pad, hi + pad * 0.8];
    EVENTS = [];
    BREAKS.forEach((b) => { EVENTS.push({ t: b.w[0] + 0.01, kind: "abs", a: b.a, b: b.b }); EVENTS.push({ t: (b.w[0] + b.w[1]) / 2, kind: "snap", a: b.a, b: b.b }); });
    FORMS.forEach((f) => EVENTS.push({ t: f.w[1] - 0.004, kind: "rel", a: f.a, b: f.b }));
    GROUPS = groupsOf(BREAKS).concat(groupsOf(FORMS));
    const heat = NET < 0, names = molList(def.react), outs = molList(def.prod);
    STEPS = [
      { r: [0, 0.27], t: "分子が近づく", s: names },
      { r: [0.27, 0.51], t: "結合を切る(エネルギーを吸収)", s: "結合を切るには、外からエネルギーが必要。" + summary(BREAKS) },
      { r: [0.51, 0.62], t: "ばらばらの原子", s: "切る結合をすべて切った状態。エネルギーは最も高い(+" + TOTAL_IN + " kJ)" },
      { r: [0.62, 0.9], t: "新しい結合ができる(熱を放出)", s: "結合ができるたびに、エネルギーが熱や光として出ていく。" + summary(FORMS) },
      { r: [0.9, 1.01], t: outs + " ができた", s: heat ? "吸収 " + TOTAL_IN + " kJ より放出 " + TOTAL_OUT + " kJ が大きい。差の " + Math.abs(NET) + " kJ が熱として出る(発熱)" : "吸収 " + TOTAL_IN + " kJ より放出 " + TOTAL_OUT + " kJ が小さい。足りない " + Math.abs(NET) + " kJ は、外から加え続ける必要がある(吸熱)" },
    ];
    $("rxNote").textContent = "切る: " + summary(BREAKS) + " = " + TOTAL_IN + " kJ ／ つくる: " + summary(FORMS) + " = " + TOTAL_OUT + " kJ ／ 差 " + fmt(NET) + " kJ(" + (heat ? "発熱" : "吸熱") + ")。平均結合エネルギーによる近似値。実測は " + fmt(def.actual) + " kJ(すべて気体として)。化学タブの値と違うのは、水などが液体になるときの熱(凝縮熱)を含むかどうかの違い。";
    rx.t = 0; rx.parts = []; rx.flashes = []; rx.heat = 0; rx.cold = 0; rx.fireFrom = undefined; lastStep = -1;
    [...$("rxChips").children].forEach((c, i) => c.classList.toggle("on", i === idx));
  }

  const energyAt = (t) => BREAKS.reduce((s, b) => s + b.e * prog(t, b.w), 0) - FORMS.reduce((s, f) => s + f.e * prog(t, f.w), 0);
  function atomPos(i, t) {
    const m = MOLS[MOL_OF[i]], pA = prog(t, [0, 0.25]);
    let p = add(add(m.c, mul(m.off, 1 - pA)), rodrigues(sub(RA[i], m.c), m.ax, (1 - pA) * m.spin));
    if (BW[i]) p = lerp3(p, FA[i], prog(t, BW[i]));
    p = lerp3(p, PA[i], prog(t, FW[i]));
    return add(p, mul(DRIFT[i], prog(t, [0.88, 1])));
  }
  // その時刻に存在する結合: {a,b,o,rf(太さ), shared(共有電子の有無), hot}
  function bondsAt(t) {
    const out = STAYS.map((b) => ({ a: b.a, b: b.b, o: b.o, rf: 1, shared: true, hot: 0 }));
    BREAKS.forEach((b) => { const s = prog(t, b.w); if (b.partial) { out.push({ a: b.a, b: b.b, o: s < 0.5 ? b.oFrom : b.oTo, rf: 1, shared: true, hot: Math.sin(s * Math.PI) }); return; } if (s < 0.85) out.push({ a: b.a, b: b.b, o: b.o, rf: 1 - 0.8 * s, shared: s < 0.5, hot: s }); });
    FORMS.forEach((f) => { const p = prog(t, f.w); if (f.partial) { out.push({ a: f.a, b: f.b, o: p < 0.5 ? f.oFrom : f.oTo, rf: 1, shared: true, hot: 0 }); return; } if (p > 0.45) out.push({ a: f.a, b: f.b, o: f.o, rf: sm((p - 0.45) / 0.4), shared: p > 0.8, hot: 0 }); });
    return out;
  }

  function fire(ev, pos) {
    const mid = mul(add(pos[ev.a], pos[ev.b]), 0.5);
    if (ev.kind === "abs") {
      for (let i = 0; i < 18; i++) {
        const d = norm([rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)]), r = rnd(2.4, 3.6), life = rnd(0.55, 0.85);
        rx.parts.push({ p: add(mid, mul(d, r)), v: mul(d, -r / life), life, max: life, col: COLD, size: 0.07, drag: 0 });
      }
      rx.cold = Math.min(1.4, rx.cold + 0.5);
    } else if (ev.kind === "snap") {
      rx.flashes.push({ p: mid, age: 0, col: COLD, big: 1.2 });
    } else {
      for (let i = 0; i < 26; i++) {
        const d = norm([rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)]), sp = rnd(1.5, 4.2), life = rnd(0.9, 1.8);
        rx.parts.push({ p: mid.slice(), v: mul(d, sp), life, max: life, col: Math.random() < 0.5 ? WARM : YEL, size: rnd(0.05, 0.1), drag: 1.3 });
      }
      rx.flashes.push({ p: mid, age: 0, col: WARM, big: 2.2 });
      rx.heat = Math.min(1.6, rx.heat + 0.55);
    }
  }

  function stepIndex(t) { for (let i = 0; i < STEPS.length; i++) if (t < STEPS[i].r[1]) return i; return STEPS.length - 1; }
  const STYLE = { bs: { a: 1, b: 1 }, sf: { a: 2.4, b: 0.55 }, st: { a: 0, b: 1.15 } };

  function renderRx(now, dt) {
    const { g, W, H, cam } = rx, t = rx.t, sk = STYLE[rx.style];
    g.clearRect(0, 0, W, H);
    const unit = H * 0.55 / (EXT + 1.0) * (rx.style === "sf" ? 0.8 : 1), P = makeProj(cam, W, H, unit);
    const E = energyAt(t), outNow = FORMS.reduce((s, f) => s + f.e * prog(t, f.w), 0), inNow = BREAKS.reduce((s, b) => s + b.e * prog(t, b.w), 0);
    const cold = clamp(E / TOTAL_IN), warm = clamp(outNow / TOTAL_OUT) * (1 - 0.6 * prog(t, [0.9, 1])) * (NET < 0 ? 1 : 0.5);
    // 周囲の光(吸収=青、放出=橙)
    if (rx.heat > 0.02) halo(g, W / 2, H / 2, H * 0.9, WARM, 0.26 * Math.min(1, rx.heat));
    if (rx.cold > 0.02) halo(g, W / 2, H / 2, H * 0.9, COLD, 0.22 * Math.min(1, rx.cold));
    rx.heat *= Math.exp(-dt * 0.9); rx.cold *= Math.exp(-dt * 1.1);

    // 原子位置(熱運動つき)
    const jam = 0.02 + 0.11 * cold + 0.07 * warm;
    const pos = EL.map((_, i) => {
      const p = atomPos(i, t), ph = i * 1.7;
      return [p[0] + jam * Math.sin(now * 9 + ph), p[1] + jam * Math.sin(now * 11 + ph * 1.3), p[2] + jam * Math.sin(now * 7.5 + ph * 0.7)];
    });
    if (rx.fireFrom !== undefined) { // イベント発火(再生中のみ)
      EVENTS.forEach((ev) => { if (ev.t > rx.fireFrom && ev.t <= t) fire(ev, pos); });
      rx.fireFrom = undefined;
    }

    const bonds = bondsAt(t), showE = $("optE").checked;
    const shared = EL.map(() => 0);
    bonds.forEach((b) => { if (b.shared) { shared[b.a] += b.o; shared[b.b] += b.o; } });
    const items = []; rx.hits = [];

    pos.forEach((p, i) => {
      const el = EL[i], ra = rx.style === "st" ? 0.17 : RAD[el] * sk.a, q = P(p), r = ra * q.s;
      items.push({ d: q.d, f: () => sphere(g, q.x, q.y, r, COL[el], cold * 0.9, warm * 0.9) });
      rx.hits.push({ x: q.x, y: q.y, r: Math.max(r * 1.2, 12), el, d: q.d });
      if (showE) { // 共有されていない電子(原子のまわりを回る)
        const n = Math.max(0, VE[el] - shared[i]), orb = (rx.style === "st" ? RAD[el] : ra) * 1.45;
        for (let k = 0; k < n; k++) {
          const ang = now * 3 + Math.floor(k / 2) * TAU / Math.ceil(n / 2) + (k % 2) * 0.55 + i, tilt = i * 1.1;
          const loc = [Math.cos(ang) * orb, Math.sin(ang) * orb * Math.cos(tilt), Math.sin(ang) * orb * Math.sin(tilt)];
          const e = P(add(p, loc));
          items.push({ d: e.d, f: () => electronDot(g, e.x, e.y, 0.075 * e.s, YEL) });
        }
      }
    });
    bonds.forEach((b) => {
      const A = pos[b.a], B = pos[b.b], M = mul(add(A, B), 0.5), pa = P(A), pb = P(B), pm = P(M);
      const rad = (b.o === 1 ? 0.1 : b.o === 2 ? 0.13 : 0.15) * b.rf * sk.b, wpx = rad * pm.s;
      const ca = mix(COL[EL[b.a]], WARM, b.hot * 0.8), cb = mix(COL[EL[b.b]], WARM, b.hot * 0.8);
      const qa = P(mul(add(A, M), 0.5)), qb = P(mul(add(B, M), 0.5));
      items.push({ d: qa.d, f: () => bondHalf(g, pa, pm, wpx, ca, b.o) });
      items.push({ d: qb.d, f: () => bondHalf(g, pb, pm, wpx, cb, b.o) });
      if (showE && b.shared && rx.style !== "sf") { // 共有電子: 結合軸のまわりを回る
        const u = norm(sub(B, A)), p1 = norm(cross(u, [0.3, 1, 0.2])), p2 = cross(u, p1), n = b.o * 2;
        for (let k = 0; k < n; k++) {
          const th = now * 4.5 + k * TAU / n, al = 0.22 * Math.sin(th * 0.5 + k * 1.3), rr = 0.17 + 0.05 * b.o;
          const p = add(add(M, mul(u, al)), add(mul(p1, Math.cos(th) * rr), mul(p2, Math.sin(th) * rr)));
          const e = P(p);
          items.push({ d: e.d, f: () => electronDot(g, e.x, e.y, 0.07 * e.s, YEL) });
        }
      }
    });
    rx.parts = rx.parts.filter((q) => { // 粒子(エネルギーの粒)
      q.life -= dt; if (q.life <= 0) return false;
      q.p = add(q.p, mul(q.v, dt)); if (q.drag) q.v = mul(q.v, Math.max(0, 1 - q.drag * dt));
      const e = P(q.p), a = clamp(q.life / q.max);
      items.push({ d: e.d, f: () => halo(g, e.x, e.y, q.size * e.s * (2.5 + 2 * a), q.col, 0.9 * a) });
      return true;
    });
    items.sort((a, b) => b.d - a.d).forEach((it) => it.f());
    rx.flashes = rx.flashes.filter((fl) => { // 閃光
      fl.age += dt; if (fl.age > 0.5) return false;
      const e = P(fl.p), k = fl.age / 0.5;
      halo(g, e.x, e.y, (0.5 + k * fl.big * 1.6) * e.s, fl.col, 0.95 * (1 - k));
      return true;
    });

    // UI 更新
    const si = stepIndex(t);
    if (si !== lastStep) {
      lastStep = si;
      [...stepsEl.children].forEach((e, i) => e.classList.toggle("on", i === si));
      $("capT").textContent = STEPS[si].t; $("capS").textContent = si === 0 ? CUR.name + ": " + eqText(CUR) : STEPS[si].s;
    }
    $("lgIn").textContent = Math.round(inNow) + " kJ"; $("lgOut").textContent = Math.round(outNow) + " kJ";
    const net = Math.round(inNow - outNow), ne = $("lgNet");
    ne.textContent = fmt(net) + " kJ" + (t > 0.93 ? (net < 0 ? "(発熱)" : "(吸熱)") : "");
    ne.className = "v " + (net < 0 ? "hotc" : net > 0 ? "cold" : "");
    $("seek").value = Math.round(t * 1000);
    renderChart(t, E);
  }

  // ---- エネルギー階段グラフ ----
  function renderChart(t, Ecur) {
    const { g, W, H } = ch, L = 54, R = W - 10, T = 16, B = H - 20, YMIN = YR[0], YMAX = YR[1];
    const X = (tt) => L + tt * (R - L), Y = (e) => B - (e - YMIN) / (YMAX - YMIN) * (B - T);
    g.clearRect(0, 0, W, H);
    g.font = "11px -apple-system, 'Yu Gothic UI', sans-serif"; g.textBaseline = "middle";
    const level = (e, label, col) => {
      g.strokeStyle = "rgba(140,148,176,.35)"; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(L, Y(e)); g.lineTo(R, Y(e)); g.stroke(); g.setLineDash([]);
      g.fillStyle = col; g.textAlign = "right"; g.fillText(label, L - 6, Y(e));
    };
    level(0, "0", "#8d93a8"); level(TOTAL_IN, "+" + TOTAL_IN, "#5cc8ff"); level(NET, fmt(NET), NET < 0 ? "#ff8a3d" : "#5cc8ff");
    g.fillStyle = "#8d93a8"; g.textAlign = "left";
    g.fillText("反応物", L + 4, Y(0) + (NET < 0 ? -8 : 10)); g.fillText("ばらばらの原子", L + 4, Y(TOTAL_IN) - 8); g.fillText("生成物", L + 4, Y(NET) + (NET < 0 ? 10 : -8));
    g.textAlign = "center"; g.fillText("時間 →", (L + R) / 2, H - 6);
    const N = 260, pts = []; for (let i = 0; i <= N; i++) pts.push([i / N, energyAt(i / N)]);
    g.lineWidth = 2; g.lineJoin = "round"; g.strokeStyle = "rgba(140,148,176,.28)"; g.beginPath(); pts.forEach((p, i) => { i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])); }); g.stroke();
    g.lineWidth = 3;
    for (let i = 1; i <= N; i++) {
      if (pts[i][0] > t) break;
      const d = pts[i][1] - pts[i - 1][1];
      g.strokeStyle = d > 0.05 ? "#5cc8ff" : d < -0.05 ? "#ff8a3d" : "#c9cde0";
      g.beginPath(); g.moveTo(X(pts[i - 1][0]), Y(pts[i - 1][1])); g.lineTo(X(pts[i][0]), Y(pts[i][1])); g.stroke();
    }
    g.font = "10.5px -apple-system, 'Yu Gothic UI', sans-serif";
    GROUPS.forEach((gr) => { // 結合の種類ごとの注釈(上り坂は左、下り坂は右の空きに置く)
      const mid = (gr.w0 + gr.w1) / 2; if (t <= mid) return;
      const cold = gr.kind === "break", label = gr.name + (gr.n > 1 ? " ×" + gr.n : "") + " " + (cold ? "+" : "−") + gr.e;
      g.fillStyle = cold ? "#5cc8ff" : "#ff8a3d"; g.textAlign = cold ? "right" : "left";
      g.fillText(label, X(mid) + (cold ? -9 : 9), Y(energyAt(mid)) + (cold ? -3 : -3));
    });
    if (t > 0.93) { // 反応熱の矢印
      const x = R - 14, up = NET > 0, col = up ? "#5cc8ff" : "#ff8a3d", tip = Y(NET), s = up ? 1 : -1;
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(x, Y(0)); g.lineTo(x, tip + 5 * s); g.stroke();
      g.beginPath(); g.moveTo(x - 5, tip + 10 * s); g.lineTo(x, tip); g.lineTo(x + 5, tip + 10 * s); g.fill();
      g.textAlign = "center"; g.fillText("反応熱 " + fmt(NET) + " kJ(" + (up ? "吸熱" : "発熱") + ")", X(0.5), Math.abs(Y(0) - Y(NET)) < 34 ? Math.max(Y(0), Y(NET)) + 14 : (Y(0) + Y(NET)) / 2);
    }
    const mx = X(t), my = Y(Ecur); halo(g, mx, my, 16, Ecur > TOTAL_IN * 0.5 ? COLD : WARM, 0.8);
    g.fillStyle = "#fff"; g.beginPath(); g.arc(mx, my, 3.5, 0, TAU); g.fill();
  }

  // ---- 反応・表示スタイルの選択 ----
  RXNS.forEach((d, i) => { const b = document.createElement("button"); b.className = "btn"; b.textContent = d.name; b.onclick = () => { loadReaction(i); setPlay(true); }; $("rxChips").appendChild(b); });
  [["stBS", "bs"], ["stSF", "sf"], ["stST", "st"]].forEach(([id, k]) => {
    $(id).onclick = () => { rx.style = k; try { localStorage.setItem("lab3d.style", k); } catch (e) { /* 保存できなくても動く */ } syncStyle(); };
  });
  function syncStyle() { [["stBS", "bs"], ["stSF", "sf"], ["stST", "st"]].forEach(([id, k]) => $(id).classList.toggle("on", rx.style === k)); }
  syncStyle();

  // ---- 反応ビューの操作 ----
  const playBtn = $("play");
  function setPlay(on) { rx.playing = on; playBtn.textContent = on ? "⏸" : "▶"; }
  function clearFx() { rx.parts = []; rx.flashes = []; rx.heat = 0; rx.cold = 0; }
  playBtn.onclick = () => { if (!rx.playing && rx.t >= 1) { rx.t = 0; clearFx(); } setPlay(!rx.playing); };
  $("replay").onclick = () => { rx.t = 0; clearFx(); setPlay(true); };
  $("seek").oninput = (e) => { rx.t = e.target.value / 1000; clearFx(); rx.fireFrom = undefined; };
  [["sp05", 0.5], ["sp1", 1], ["sp2", 2]].forEach(([id, v]) => { $(id).onclick = () => { rx.speed = v; ["sp05", "sp1", "sp2"].forEach((x) => $(x).classList.toggle("on", x === id)); }; });
  loadReaction(0);
  controls(rx.cv, rx.cam, (x, y) => {
    let best = null;
    rx.hits.forEach((h) => { if (Math.hypot(x - h.x, y - h.y) <= h.r && (!best || h.d < best.d)) best = h; });
    if (best) { atom.el = best.el; atom.ion = 0; setTab("at"); }
  });

  // =====================================================================
  //  原子ビュー
  // =====================================================================
  const ELS = {
    H: { z: 1, a: 1, name: "水素 (H)", note: "電子は 1 個。あと 1 個で最外殻が満員(ヘリウムと同じ)になるので、結合して電子を共有したがる。" },
    He: { z: 2, a: 4, name: "ヘリウム (He)", note: "最外殻がすでに満員。電子を受け渡す必要がないので、ほとんど他の原子と結合しない(貴ガス)。" },
    C: { z: 6, a: 12, name: "炭素 (C)", note: "最外殻の電子が 4 個。4 本の結合の手を持ち、鎖や環をつくれる。生命の骨格になる元素。" },
    N: { z: 7, a: 14, name: "窒素 (N)", note: "最外殻の電子が 5 個。3 本の結合の手を持つ。N₂ は三重結合で、とても切れにくい。" },
    O: { z: 8, a: 16, name: "酸素 (O)", note: "最外殻の電子が 6 個。あと 2 個ほしいので、水素などと 2 本の結合をつくる。電気陰性度が大きい。" },
    Na: { z: 11, a: 23, name: "ナトリウム (Na)", note: "最外殻の電子が 1 個だけ。手放しやすく、Na⁺ になって、ネオンと同じ電子配置になる。", ion: -1 },
    Cl: { z: 17, a: 35, name: "塩素 (Cl)", note: "最外殻の電子が 7 個。あと 1 個で満員になるので、電子を受け取りやすく、Cl⁻ になる。", ion: 1 },
  };
  const atom = { cv: $("cvAt"), cam: newCam(0.5, -0.45), el: "O", ion: 0, nuc: null, mode: "bohr", cloud: [] };
  Object.assign(atom, fit(atom.cv, 0.8));
  controls(atom.cv, atom.cam, null);
  const shellsOf = (n) => { const out = []; let left = n; for (const c of [2, 8, 8, 18]) { if (left <= 0) break; const k = Math.min(c, left); out.push(k); left -= k; } return out; };

  function buildNucleus(d) {
    const n = d.a, rb = 0.17, items = [];
    const rmax = n === 1 ? 0 : Math.max(rb * 1.0, rb * (1.25 * Math.cbrt(n) - 0.9));
    const order = [...Array(n).keys()].sort((i, j) => ((i * 0.618) % 1) - ((j * 0.618) % 1));
    const isP = new Set(order.slice(0, d.z));
    for (let i = 0; i < n; i++) {
      const rr = rmax * Math.cbrt((i + 0.5) / n), phi = Math.acos(1 - 2 * (i + 0.5) / n), th = i * 2.399963;
      items.push({ p: [rr * Math.sin(phi) * Math.cos(th), rr * Math.cos(phi), rr * Math.sin(phi) * Math.sin(th)], proton: isP.has(i), r: rb });
    }
    return { items, rb };
  }
  // 電子雲: 軌道(1s,2s,2p,3s,3p)ごとの確率分布から、点を抽出する。点が濃いところ = 電子が見つかりやすい場所
  const SUBS = [{ n: 1, l: 0, cap: 2 }, { n: 2, l: 0, cap: 2 }, { n: 2, l: 1, cap: 6 }, { n: 3, l: 0, cap: 2 }, { n: 3, l: 1, cap: 6 }];
  function buildCloud(e) {
    const pts = [], per = 320, nmax = shellsOf(e).length;
    let left = e;
    const gamma = (k, th) => { let x = 0; for (let i = 0; i < k; i++) x -= Math.log(1 - Math.random()); return x * th; };
    const dir = () => norm([rnd(-1, 1) + 1e-6, rnd(-1, 1), rnd(-1, 1)]);
    SUBS.forEach((sb) => {
      const k = Math.min(sb.cap, left); if (k <= 0) return; left -= k;
      const R = [0.45, 1.45, 2.5][sb.n - 1], th = R / (2 * sb.n + 1), shape = 2 * sb.n + 1, col = sb.n === nmax ? YEL : sb.n === 1 ? [120, 160, 255] : COLD;
      const counts = sb.l === 0 ? [k] : [0, 1, 2].map((i) => (k > i ? 1 : 0) + (k > 3 + i ? 1 : 0));
      counts.forEach((c, oi) => {
        const axis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]][oi];
        for (let q = 0; q < c * per; q++) {
          let d = dir(); if (sb.l === 1) { let guard = 0; while (Math.pow(dot(d, axis), 2) < Math.random() && guard++ < 50) d = dir(); }
          const rr = sb.n === 1 ? gamma(3, R / 3) : R * clamp(1 + 0.3 * (gamma(4, 0.25) - 1) * 2, 0.35, 1.9);
          pts.push({ p: mul(d, rr), col, ph: Math.random() * TAU });
        }
      });
    });
    return pts;
  }
  const shellBasis = (k) => {
    const a = k * 0.9 + 0.4, b = k * 1.3;
    const rot = (v) => { // x軸まわり a、y軸まわり b
      const y = v[1] * Math.cos(a) - v[2] * Math.sin(a), z = v[1] * Math.sin(a) + v[2] * Math.cos(a);
      return [v[0] * Math.cos(b) + z * Math.sin(b), y, -v[0] * Math.sin(b) + z * Math.cos(b)];
    };
    return [rot([1, 0, 0]), rot([0, 0, 1])];
  };
  function updateAtomInfo() {
    const d = ELS[atom.el], e = d.z + atom.ion, sh = shellsOf(e), chg = d.z - e;
    atom.nuc = buildNucleus(d); atom.cloud = buildCloud(e);
    $("atT").textContent = d.name; $("atS").textContent = "原子番号 " + d.z + " / 質量数 " + d.a;
    $("nP").textContent = d.z; $("nN").textContent = d.a - d.z; $("nE").textContent = e; $("nV").textContent = sh.length ? sh[sh.length - 1] : 0;
    $("cfg").textContent = sh.join("-"); $("chg").textContent = chg === 0 ? "0(中性)" : (chg > 0 ? "+" : "−") + Math.abs(chg);
    $("atNote").textContent = d.note + (atom.mode === "cloud" ? "\n電子雲: 点が濃いところほど、電子が見つかりやすい。電子は『1つの点が軌道を回る』のではなく、確率として空間に広がっている。球形が s 軌道、ダンベル形が p 軌道。" : "");
    $("atNote").style.whiteSpace = "pre-line";
    $("mdBohr").classList.toggle("on", atom.mode === "bohr"); $("mdCloud").classList.toggle("on", atom.mode === "cloud");
    const b = $("ionBtn");
    if (d.ion) { b.classList.remove("hidden"); b.textContent = atom.ion ? "もとの原子にもどす" : d.ion < 0 ? "電子を 1 個手放す → " + atom.el + "⁺" : "電子を 1 個受け取る → " + atom.el + "⁻"; b.classList.toggle("on", !!atom.ion); }
    else b.classList.add("hidden");
    [...$("elChips").children].forEach((c) => c.classList.toggle("on", c.dataset.el === atom.el));
  }
  Object.keys(ELS).forEach((k) => {
    const b = document.createElement("button"); b.className = "btn"; b.textContent = k; b.dataset.el = k;
    b.onclick = () => { atom.el = k; atom.ion = 0; updateAtomInfo(); }; $("elChips").appendChild(b);
  });
  $("mdBohr").onclick = () => { atom.mode = "bohr"; updateAtomInfo(); }; $("mdCloud").onclick = () => { atom.mode = "cloud"; updateAtomInfo(); };
  $("ionBtn").onclick = () => { const d = ELS[atom.el]; atom.ion = atom.ion ? 0 : d.ion; updateAtomInfo(); };

  function renderAt(now, dt) {
    const { g, W, H, cam } = atom, d = ELS[atom.el], e = d.z + atom.ion, sh = shellsOf(e);
    g.clearRect(0, 0, W, H);
    if (!cam.drag) cam.yaw += dt * 0.25;
    const rOf = (k) => 1.15 + 0.95 * k, rmax = rOf(Math.max(2, sh.length - 1));
    const unit = H * 0.5 / ((atom.mode === "cloud" ? 3.2 : rmax) + 0.9), P = makeProj(cam, W, H, unit), items = [];
    halo(g, W / 2, H / 2, H * 0.28, [255, 150, 120], 0.25);
    // 原子核
    atom.nuc.items.forEach((n) => {
      const q = P(n.p), r = n.r * q.s, col = n.proton ? [255, 90, 90] : [150, 160, 190];
      items.push({ d: q.d, f: () => sphere(g, q.x, q.y, r, col, 0, 0) });
    });
    if (atom.mode === "cloud") {
      items.sort((a, b) => b.d - a.d).forEach((it) => it.f());
      g.globalCompositeOperation = "lighter";
      atom.cloud.forEach((c, i) => {
        const q = P(c.p), a = 0.3 + 0.25 * Math.sin(now * 2.5 + c.ph), sz = Math.max(2, 0.07 * q.s);
        g.fillStyle = rgb(c.col, 1, a); g.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
      });
      g.globalCompositeOperation = "source-over";
      return;
    }
    sh.forEach((cnt, k) => {
      const [u, v] = shellBasis(k), R = rOf(k), last = k === sh.length - 1, base = last ? YEL : COLD;
      // 軌道の輪
      const SEG = 56;
      for (let i = 0; i < SEG; i++) {
        const a0 = i / SEG * TAU, a1 = (i + 1) / SEG * TAU;
        const p0 = add(mul(u, Math.cos(a0) * R), mul(v, Math.sin(a0) * R)), p1 = add(mul(u, Math.cos(a1) * R), mul(v, Math.sin(a1) * R));
        const q0 = P(p0), q1 = P(p1);
        items.push({ d: (q0.d + q1.d) / 2, f: () => { g.strokeStyle = rgb(base, 1, last ? 0.4 : 0.22); g.lineWidth = 1.2; g.beginPath(); g.moveTo(q0.x, q0.y); g.lineTo(q1.x, q1.y); g.stroke(); } });
      }
      // 電子
      const w = 1.5 / (1 + 0.5 * k) * (k % 2 ? -1 : 1);
      for (let j = 0; j < cnt; j++) {
        const a = j * TAU / cnt + k * 0.7 + now * w, p = add(mul(u, Math.cos(a) * R), mul(v, Math.sin(a) * R)), q = P(p);
        items.push({ d: q.d, f: () => electronDot(g, q.x, q.y, 0.11 * q.s * (last ? 1.1 : 1), base) });
      }
    });
    items.sort((a, b) => b.d - a.d).forEach((it) => it.f());
  }

  // =====================================================================
  //  タブ・ループ
  // =====================================================================
  let tab = "rx";
  function resizeAll() {
    Object.assign(rx, fit(rx.cv, 0.72)); Object.assign(ch, fit(ch.cv, 0, 170)); Object.assign(atom, fit(atom.cv, 0.8));
  }
  function setTab(k) {
    tab = k;
    $("viewRx").classList.toggle("hidden", k !== "rx"); $("viewAt").classList.toggle("hidden", k !== "at");
    $("tabRx").classList.toggle("on", k === "rx"); $("tabAt").classList.toggle("on", k === "at");
    resizeAll(); if (k === "at") updateAtomInfo();
  }
  $("tabRx").onclick = () => setTab("rx"); $("tabAt").onclick = () => setTab("at");
  window.addEventListener("resize", resizeAll);

  let last = performance.now();
  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000), now = ts / 1000; last = ts;
    if (tab === "rx") {
      if (rx.playing) {
        const prev = rx.t; rx.t = Math.min(1, rx.t + dt * rx.speed / DURATION);
        rx.fireFrom = prev;
        if (rx.t >= 1) setPlay(false);
      }
      if (!rx.cam.drag && $("optSpin").checked) rx.cam.yaw += dt * 0.12;
      renderRx(now, dt * (rx.playing ? rx.speed : 1));
    } else renderAt(now, dt);
    requestAnimationFrame(loop);
  }
  // デバッグ用: ?t=0.7(その時刻で停止) ?tab=at&el=Cl
  const qs = new URLSearchParams(location.search);
  if (qs.get("el") && ELS[qs.get("el")]) atom.el = qs.get("el");
  if (qs.get("embed")) document.body.classList.add("embed");
  if (qs.get("eq")) { const i = RXNS.findIndex((d) => d.gid === qs.get("eq")); if (i >= 0) { loadReaction(i); $("rxChips").classList.add("hidden"); } }
  if (qs.has("r") && RXNS[+qs.get("r")]) loadReaction(+qs.get("r"));
  if (qs.has("t")) { rx.t = clamp(+qs.get("t")); setPlay(false); }
  if (qs.has("style")) { rx.style = qs.get("style"); syncStyle(); }
  if (qs.get("mode") === "cloud") atom.mode = "cloud";
  if (qs.get("tab") === "at") setTab("at");
  requestAnimationFrame(loop);
})();
