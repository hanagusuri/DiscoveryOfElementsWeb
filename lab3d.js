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
  const COL = { H: [244, 244, 244], He: [217, 255, 255], C: [96, 96, 104], N: [60, 90, 250], O: [227, 66, 52], Na: [171, 92, 242], Cl: [40, 220, 60], S: [235, 215, 60], Cu: [205, 120, 70], Fe: [170, 110, 95], Hg: [160, 170, 185], Pb: [110, 115, 140], Al: [190, 195, 205], Ca: [140, 200, 150], Zn: [125, 130, 176], K: [195, 110, 215] };
  const RAD = { H: 0.34, He: 0.3, C: 0.5, N: 0.5, O: 0.52, Na: 0.6, Cl: 0.6, S: 0.58, Cu: 0.55, Fe: 0.55, Hg: 0.6, Pb: 0.6, Al: 0.55, Ca: 0.65, Zn: 0.55, K: 0.7 };
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
  function bondInfo(e1, e2, o, ov) {
    if (ov) return { name: ov.name, e: ov.e };
    const k1 = e1 + SYM[o] + e2, k2 = e2 + SYM[o] + e1, k = BD[k1] ? k1 : BD[k2] ? k2 : null;
    if (!k) { console.warn("結合エネルギーのデータがありません: " + k1); return { name: k1, e: 0 }; }
    return { name: k.replace("-", "–").replace("#", "≡"), e: BD[k][1] };
  }
  const fmt = (v) => (v < 0 ? "−" : v > 0 ? "+" : "") + Math.abs(Math.round(v));
  const VE = { H: 1, C: 4, N: 5, O: 6, Cl: 7, S: 6, Na: 1, Cu: 2, Fe: 2, Hg: 2, Pb: 2, Al: 3, Ca: 2, Zn: 2, K: 1 };

  // 分子の雛形: 原子 [元素, 局所座標(Å)] と結合 [原子A, 原子B, 結合次数]
  const tet = (s) => [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => mul(v, s / Math.sqrt(3)));
  // 大きな分子の座標を、関数で組み立てる
  const hAt = (o, dir, len) => add(o, mul(norm(dir), len));
  const TET = tet(1.45);
  const glucoseAtoms = (() => { // ブドウ糖(ピラノース環): 0-4 C1..C5, 5 環の O, 6 C6, 7-10 O1..O4, 11 O6, 12-16 C1..C5 の H, 17-18 C6 の H, 19-22 HO1..HO4, 23 HO6
    const rad = (k) => [Math.cos(k * TAU / 6), Math.sin(k * TAU / 6), 0], tan = (k) => [-Math.sin(k * TAU / 6), Math.cos(k * TAU / 6), 0], sg = (k) => (k % 2 ? 1 : -1);
    const rp = [0, 1, 2, 3, 4, 5].map((k) => [1.45 * Math.cos(k * TAU / 6), 1.45 * Math.sin(k * TAU / 6), k % 2 ? 0.3 : -0.3]);
    const P = new Array(24), el = ["C", "C", "C", "C", "C", "O", "C", "O", "O", "O", "O", "O"].concat(Array(12).fill("H"));
    for (let k = 0; k < 6; k++) P[k] = rp[k];
    for (let k = 0; k < 4; k++) {
      P[7 + k] = hAt(rp[k], add(mul(rad(k), 0.5), [0, 0, sg(k) * 0.85]), 1.43);
      P[12 + k] = hAt(rp[k], add(mul(rad(k), 0.8), [0, 0, -sg(k) * 0.6]), 1.09);
      P[19 + k] = hAt(P[7 + k], add(add(mul(rad(k), 0.6), mul(tan(k), 0.5)), [0, 0, sg(k) * 0.4]), 0.96);
    }
    P[16] = hAt(rp[4], add(mul(rad(4), 0.5), [0, 0, sg(4) * 0.85]), 1.09);
    P[6] = hAt(rp[4], add(mul(rad(4), 0.9), [0, 0, -sg(4) * 0.35]), 1.52);
    P[11] = hAt(P[6], add(add(mul(rad(4), 0.5), mul(tan(4), 0.6)), [0, 0, 0.5]), 1.43);
    P[17] = hAt(P[6], add(add(mul(rad(4), 0.4), mul(tan(4), -0.6)), [0, 0, 0.7]), 1.09);
    P[18] = hAt(P[6], add(add(mul(rad(4), 0.4), mul(tan(4), -0.6)), [0, 0, -0.7]), 1.09);
    P[23] = hAt(P[11], add(add(mul(rad(4), 0.6), mul(tan(4), 0.5)), [0, 0, 0.3]), 0.96);
    return el.map((e, i) => [e, P[i]]);
  })();
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
    SO2: { name: "SO₂", atoms: [["S", [0, 0.24, 0]], ["O", [1.233, -0.48, 0]], ["O", [-1.233, -0.48, 0]]], bonds: [[0, 1, 2, { e: 538, name: "S=O" }], [0, 2, 2, { e: 538, name: "S=O" }]] },
    // ---- 固体・イオン結晶(static: 動き回らない。solid: 単原子の固体。結晶から切り離す/結晶になるエネルギーを持つ)----
    C_s: { name: "C", static: true, atoms: [["C", [0, 0, 0]]], bonds: [], solid: { e: 717, label: "C(黒鉛)", stubs: 3, ty: "net" } },
    S_s: { name: "S", static: true, atoms: [["S", [0, 0, 0]]], bonds: [], solid: { e: 279, label: "S(結晶)", stubs: 2, ty: "net" } },
    Cu_s: { name: "Cu", static: true, atoms: [["Cu", [0, 0, 0]]], bonds: [], solid: { e: 337, label: "Cu(金属)", stubs: 4, ty: "met" } },
    Fe_s: { name: "Fe", static: true, atoms: [["Fe", [0, 0, 0]]], bonds: [], solid: { e: 416, label: "Fe(金属)", stubs: 4, ty: "met" } },
    Hg_s: { name: "Hg", static: true, atoms: [["Hg", [0, 0, 0]]], bonds: [], solid: { e: 61, label: "Hg(液体)", stubs: 2, ty: "met" } },
    Na_s: { name: "Na", static: true, atoms: [["Na", [0, 0, 0]]], bonds: [], solid: { e: 107, label: "Na(金属)", stubs: 4, ty: "met" } },
    CuO: { name: "CuO", static: true, atoms: [["Cu", [-0.95, 0, 0], 2], ["O", [0.95, 0, 0], -2]], bonds: [[0, 1, 1, { ty: "ion", e: 743, name: "Cu²⁺–O²⁻" }]] },
    HgO: { name: "HgO", static: true, atoms: [["Hg", [-1.05, 0, 0], 2], ["O", [1.05, 0, 0], -2]], bonds: [[0, 1, 1, { ty: "ion", e: 401, name: "Hg²⁺–O²⁻" }]] },
    Fe2O3: { name: "Fe₂O₃", static: true, atoms: [["Fe", [-1.2, 0, 0], 3], ["Fe", [1.2, 0, 0], 3], ["O", [0, 1.4, 0], -2], ["O", [0, -0.7, 1.2], -2], ["O", [0, -0.7, -1.2], -2]], bonds: [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4]].map((b, i) => [b[0], b[1], 1, { ty: "ion", e: i % 2 ? 400 : 401, name: "Fe³⁺–O²⁻" }]) },
    Na2Cl2: { name: "2NaCl", static: true, atoms: [["Na", [-1.3, -1.3, 0], 1], ["Cl", [1.3, -1.3, 0], -1], ["Na", [1.3, 1.3, 0], 1], ["Cl", [-1.3, 1.3, 0], -1]], bonds: [[0, 1], [1, 2], [2, 3], [3, 0]].map((b, i) => [b[0], b[1], 1, { ty: "ion", e: i % 2 ? 393 : 394, name: "Na⁺–Cl⁻" }]) },
    Pb_s: { name: "Pb", static: true, atoms: [["Pb", [0, 0, 0]]], bonds: [], solid: { e: 195, label: "Pb(金属)", stubs: 4, ty: "met" } },
    Al_s: { name: "Al", static: true, atoms: [["Al", [0, 0, 0]]], bonds: [], solid: { e: 326, label: "Al(金属)", stubs: 4, ty: "met" } },
    PbO: { name: "PbO", static: true, atoms: [["Pb", [-1.05, 0, 0], 2], ["O", [1.05, 0, 0], -2]], bonds: [[0, 1, 1, { ty: "ion", e: 661, name: "Pb²⁺–O²⁻" }]] },
    Al2O3: { name: "Al₂O₃", static: true, atoms: [["Al", [-1.2, 0, 0], 3], ["Al", [1.2, 0, 0], 3], ["O", [0, 1.4, 0], -2], ["O", [0, -0.7, 1.2], -2], ["O", [0, -0.7, -1.2], -2]], bonds: [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4]].map((b, i) => [b[0], b[1], 1, { ty: "ion", e: i % 2 ? 512 : 513, name: "Al³⁺–O²⁻" }]) },
    CaO: { name: "CaO", static: true, atoms: [["Ca", [-1.2, 0, 0], 2], ["O", [1.2, 0, 0], -2]], bonds: [[0, 1, 1, { ty: "ion", e: 1062, name: "Ca²⁺–O²⁻" }]] },
    CaOH2: { name: "Ca(OH)₂", static: true, atoms: [["Ca", [0, 0, 0], 2], ["O", [-2.0, 0, 0], -1], ["O", [2.0, 0, 0], -1], ["H", [-2.96, 0, 0]], ["H", [2.96, 0, 0]]], bonds: [[0, 1, 1, { ty: "ion", e: 586, name: "Ca²⁺–OH⁻" }], [0, 2, 1, { ty: "ion", e: 586, name: "Ca²⁺–OH⁻" }], [1, 3, 1], [2, 4, 1]] },
    CaCO3: { name: "CaCO₃", static: true, atoms: [["Ca", [0, -2.6, 0], 2], ["C", [0, 0, 0]], ["O", [1.12, -0.65, 0], -1], ["O", [-1.12, -0.65, 0], -1], ["O", [0, 1.29, 0]]], bonds: [[1, 4, 2], [1, 2, 1], [1, 3, 1], [0, 2, 1, { ty: "ion", e: 662, name: "Ca²⁺–O⁻" }], [0, 3, 1, { ty: "ion", e: 661, name: "Ca²⁺–O⁻" }]] },
    CaCl2: { name: "CaCl₂", static: true, atoms: [["Ca", [0, 0, 0], 2], ["Cl", [-2.0, 0, 0], -1], ["Cl", [2.0, 0, 0], -1]], bonds: [[0, 1, 1, { ty: "ion", e: 609, name: "Ca²⁺–Cl⁻" }], [0, 2, 1, { ty: "ion", e: 608, name: "Ca²⁺–Cl⁻" }]] },
    NaOH: { name: "NaOH", static: true, atoms: [["Na", [-1.6, 0, 0], 1], ["O", [0.2, 0, 0], -1], ["H", [1.16, 0, 0]]], bonds: [[0, 1, 1, { ty: "ion", e: 537, name: "Na⁺–OH⁻" }], [1, 2, 1]] },
    C2H2: { name: "C₂H₂", atoms: [["C", [-0.6, 0, 0]], ["C", [0.6, 0, 0]], ["H", [-1.66, 0, 0]], ["H", [1.66, 0, 0]]], bonds: [[0, 1, 3], [0, 2, 1], [1, 3, 1]] },
    C6H6: { name: "C₆H₆", atoms: [0, 1, 2, 3, 4, 5].map((k) => ["C", [1.4 * Math.cos(k * TAU / 6), 1.4 * Math.sin(k * TAU / 6), 0]]).concat([0, 1, 2, 3, 4, 5].map((k) => ["H", [2.48 * Math.cos(k * TAU / 6), 2.48 * Math.sin(k * TAU / 6), 0]])), bonds: [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1]].concat([0, 1, 2, 3, 4, 5].map((k) => [k, 6 + k, 1])) },
    Zn_s: { name: "Zn", static: true, atoms: [["Zn", [0, 0, 0]]], bonds: [], solid: { e: 130, label: "Zn(金属)", stubs: 4, ty: "met" } },
    // ---- 水溶液のイオン(static。まわりに水分子の殻 = 水和 をまとう)----
    Zn2: { name: "Zn²⁺", static: true, atoms: [["Zn", [0, 0, 0], 2]], bonds: [], hyd: { e: 2046, label: "Zn²⁺の水和", n: 4 } },
    Cu2: { name: "Cu²⁺", static: true, atoms: [["Cu", [0, 0, 0], 2]], bonds: [], hyd: { e: 2100, label: "Cu²⁺の水和", n: 4 } },
    Fe2: { name: "Fe²⁺", static: true, atoms: [["Fe", [0, 0, 0], 2]], bonds: [], hyd: { e: 1950, label: "Fe²⁺の水和", n: 4 } },
    Hp: { name: "H⁺", static: true, atoms: [["H", [0, 0, 0], 1]], bonds: [], hyd: { e: 1090, label: "H⁺の水和", n: 4 } },
    Nap: { name: "Na⁺", static: true, atoms: [["Na", [0, 0, 0], 1]], bonds: [], hyd: { e: 409, label: "Na⁺の水和", n: 4 } },
    Clm: { name: "Cl⁻", static: true, atoms: [["Cl", [0, 0, 0], -1]], bonds: [], hyd: { e: 374, label: "Cl⁻の水和", n: 4 } },
    OHm: { name: "OH⁻", static: true, atoms: [["O", [-0.48, 0, 0], -1], ["H", [0.48, 0, 0]]], bonds: [[0, 1, 1]], hyd: { e: 530, label: "OH⁻の水和", n: 3, atom: 0 } },
    H2Oaq: { name: "H₂O", static: true, atoms: [["O", [0, -0.07, 0]], ["H", [0.757, 0.517, 0]], ["H", [-0.757, 0.517, 0]]], bonds: [[0, 1, 1], [0, 2, 1]] },
    H2S: { name: "H₂S", atoms: [["S", [0, -0.45, 0]], ["H", [0.964, 0.48, 0]], ["H", [-0.964, 0.48, 0]]], bonds: [[0, 1, 1, { e: 363, name: "S–H" }], [0, 2, 1, { e: 363, name: "S–H" }]] },
    H2SO4: { name: "H₂SO₄", atoms: [["S", [0, 0, 0]], ["O", TET[0]], ["O", TET[1]], ["O", TET[2]], ["O", TET[3]], ["H", hAt(TET[2], add(norm(TET[2]), [0, 0.8, 0]), 0.96)], ["H", hAt(TET[3], add(norm(TET[3]), [0, 0.8, 0]), 0.96)]], bonds: [[0, 1, 2], [0, 2, 2], [0, 3, 1], [0, 4, 1], [3, 5, 1], [4, 6, 1]] },
    Na2SO4: { name: "Na₂SO₄", static: true, atoms: [["Na", hAt(TET[2], TET[2], 3.7), 1], ["Na", hAt(TET[3], TET[3], 3.7), 1], ["S", [0, 0, 0]], ["O", TET[0]], ["O", TET[1]], ["O", TET[2], -1], ["O", TET[3], -1]], bonds: [[2, 3, 2], [2, 4, 2], [2, 5, 1], [2, 6, 1], [0, 5, 1, { ty: "ion", e: 787, name: "Na⁺–O⁻" }], [1, 6, 1, { ty: "ion", e: 787, name: "Na⁺–O⁻" }]] },
    KClO3: { name: "KClO₃", static: true, atoms: [["K", [3.2, -0.6, 0], 1], ["Cl", [0, 0, 0]], ["O", [1.3, -0.5, 0], -1], ["O", [-0.65, -0.5, 1.13]], ["O", [-0.65, -0.5, -1.13]]], bonds: [[1, 2, 1, { e: 205, name: "Cl–O" }], [1, 3, 2, { e: 243, name: "Cl=O" }], [1, 4, 2, { e: 243, name: "Cl=O" }], [0, 2, 1, { ty: "ion", e: 665, name: "K⁺–O⁻" }]] },
    KCl: { name: "KCl", static: true, atoms: [["K", [-1.4, 0, 0], 1], ["Cl", [1.4, 0, 0], -1]], bonds: [[0, 1, 1, { ty: "ion", e: 648, name: "K⁺–Cl⁻" }]] },
    CaC2: { name: "CaC₂", static: true, atoms: [["Ca", [0, 0, 0], 2], ["C", [-0.6, 2.3, 0], -1], ["C", [0.6, 2.3, 0], -1]], bonds: [[1, 2, 3], [0, 1, 1, { ty: "ion", e: 428, name: "Ca²⁺–C⁻" }], [0, 2, 1, { ty: "ion", e: 428, name: "Ca²⁺–C⁻" }]] },
    C6H12O6: { name: "C₆H₁₂O₆", atoms: glucoseAtoms, bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [4, 6], [0, 7], [1, 8], [2, 9], [3, 10], [6, 11], [0, 12], [1, 13], [2, 14], [3, 15], [4, 16], [6, 17], [6, 18], [7, 19], [8, 20], [9, 21], [10, 22], [11, 23]].map((b) => [b[0], b[1], 1]) },
    C2H5OH: { name: "C₂H₅OH", atoms: [["C", [0, 0, 0]], ["C", [1.52, 0, 0]], ["O", [2.12, 1.30, 0]], ["H", [-0.36, 1.03, 0]], ["H", [-0.36, -0.51, 0.89]], ["H", [-0.36, -0.51, -0.89]], ["H", hAt([1.52, 0, 0], [0.35, -0.6, 0.75], 1.09)], ["H", hAt([1.52, 0, 0], [0.35, -0.6, -0.75], 1.09)], ["H", [2.12 + 0.5, 1.30 + 0.82, 0]]], bonds: [[0, 1, 1], [1, 2, 1], [2, 8, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [1, 6, 1], [1, 7, 1]] },
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
    // ---- 気体以外: 固体は「結晶から原子を切り離す(原子化)」、イオン結晶は「イオンの結合」で数える ----
    { id: "coal", gid: "coal_burn", name: "炭の燃焼", react: ["C_s", "O2"], prod: ["CO2"], map: [0, 1, 2], actual: -394, basis: "黒鉛から炭素原子を切り離すエネルギー(717)を使う。" },
    { id: "sulfur", gid: "sulfur_burn", name: "硫黄の燃焼", react: ["S_s", "O2"], prod: ["SO2"], map: [0, 1, 2], actual: -297, basis: "硫黄の結晶(S₈ の環)から原子を切り離すエネルギー(279)を使う。" },
    { id: "cu", gid: "cu_ox", name: "銅の酸化", react: ["Cu_s", "Cu_s", "O2"], prod: ["CuO", "CuO"], map: [0, 2, 1, 3], actual: -314, basis: "金属から原子を切り離すエネルギー(337)を使う。酸化物の結晶ができる値(743)は、生成熱から逆算した、電子の移動と結晶化を合わせた値。" },
    { id: "hg", gid: "hg_ox", name: "水銀の酸化", react: ["Hg_s", "Hg_s", "O2"], prod: ["HgO", "HgO"], map: [0, 2, 1, 3], actual: -182, basis: "液体の水銀から原子を切り離すエネルギー(61)を使う。酸化物の結晶ができる値(401)は、生成熱から逆算した値。" },
    { id: "rust", gid: "rust", name: "鉄の錆", react: ["Fe_s", "Fe_s", "Fe_s", "Fe_s", "O2", "O2", "O2"], prod: ["Fe2O3", "Fe2O3"], map: [0, 1, 4, 5, 6, 2, 3, 7, 8, 9], actual: -1648, basis: "金属から原子を切り離すエネルギー(416)を使う。酸化物の結晶ができる値(Fe–O 1 本あたり約 400)は、生成熱から逆算した値。" },
    { id: "nacl", gid: "nacl_elec", name: "塩の電気分解(吸熱)", react: ["Na2Cl2"], prod: ["Na_s", "Na_s", "Cl2"], map: [0, 2, 1, 3], actual: 822, xfer: { "Na:1>0": { e: -496, name: "Na⁺ + e⁻ → Na" }, "Cl:-1>0": { e: 349, name: "Cl⁻ → Cl + e⁻" } }, basis: "ボルン・ハーバー・サイクルの値: 格子エネルギー 787、Na のイオン化エネルギー 496、Cl の電子親和力 349、Na の昇華 107、Cl–Cl 243(NaCl 1 mol あたり)。実際の電気分解では、このエネルギーを電気で与える。" },
    // ---- 残りの反応式(石灰・還元・テルミット・電解など)。水は気体として数える ----
    { id: "hgo_dec", gid: "hgo_dec", name: "酸化水銀の分解", react: ["HgO", "HgO"], prod: ["Hg_s", "Hg_s", "O2"], map: [0, 2, 1, 3], actual: 182, basis: "酸化物の結晶を壊す値(401)は、生成熱から逆算した値。液体の水銀になる熱(61)を含む。" },
    { id: "cuo_h2", gid: "cuo_h2", name: "酸化銅の水素還元", react: ["CuO", "H2"], prod: ["Cu_s", "H2O"], map: [0, 1, 2, 3], actual: -84, basis: "酸化物の結晶を壊す値(743)は、生成熱から逆算した値。水は気体として数える。" },
    { id: "pbo_h2", gid: "pbo_h2", name: "酸化鉛の水素還元", react: ["PbO", "H2"], prod: ["Pb_s", "H2O"], map: [0, 1, 2, 3], actual: -24, basis: "酸化物の結晶を壊す値(661)は、生成熱から逆算した値。水は気体として数える。" },
    { id: "thermite", gid: "thermite", name: "テルミット反応", react: ["Fe2O3", "Al_s", "Al_s"], prod: ["Al2O3", "Fe_s", "Fe_s"], map: [5, 6, 2, 3, 4, 0, 1], actual: -852, basis: "鉄の酸化物を壊す値と、アルミナの結晶ができる値(Al–O 1 本あたり約 512)は、生成熱から逆算した値。アルミナのほうが、はるかに安定なので、大きな熱が出る。" },
    { id: "blast", gid: "blast", name: "高炉での鉄の還元", react: ["Fe2O3", "CO", "CO", "CO"], prod: ["Fe_s", "Fe_s", "CO2", "CO2", "CO2"], map: [0, 1, 5, 6, 2, 7, 8, 3, 9, 10, 4], actual: -25, basis: "鉄の酸化物を壊す値は生成熱から逆算した値。CO の三重結合は、CO₂ の二重結合に変わる(差の分だけ切れる)。" },
    { id: "alumina_elec", gid: "alumina_elec", name: "アルミナの電解(吸熱)", react: ["Al2O3", "Al2O3"], prod: ["Al_s", "Al_s", "Al_s", "Al_s", "O2", "O2", "O2"], map: [0, 1, 5, 6, 2, 7, 3, 8, 4, 9], actual: 3351, basis: "アルミナの結晶を壊す値は、生成熱から逆算した値。とても安定なので、電気分解には大量のエネルギーが要る。" },
    { id: "lime_slake", gid: "lime_slake", name: "生石灰に水", react: ["CaO", "H2O"], prod: ["CaOH2"], map: [0, 1, 2, 3, 4], actual: -109, basis: "結晶の結合の強さは、生成熱から逆算した値(CaO の Ca–O 1062 が、Ca(OH)₂ では 586 に)。同じ結合が強さを変えて残る分は『結合の強さの変化』として数える。水は気体として数える。" },
    { id: "caco3_dec", gid: "caco3_dec", name: "石灰石の熱分解(吸熱)", react: ["CaCO3"], prod: ["CaO", "CO2"], map: [0, 3, 1, 2, 4], actual: 178, basis: "炭酸塩のイオン結合の強さ(約 660)は、生成熱から逆算した値。CaO ができると Ca–O が 1062 に強くなる。" },
    { id: "limestone_acid", gid: "limestone_acid", name: "石灰石と塩酸", react: ["CaCO3", "HCl", "HCl"], prod: ["CaCl2", "H2O", "CO2"], map: [0, 6, 8, 3, 5, 7, 1, 2, 4], actual: -39, basis: "結晶の結合の強さは生成熱から逆算した値。HCl・水・CO₂ は気体として数える(実際は水溶液)。" },
    { id: "na_water", gid: "na_water", name: "ナトリウムと水", react: ["Na_s", "Na_s", "H2O", "H2O"], prod: ["NaOH", "NaOH", "H2"], map: [0, 2, 3, 1, 5, 6, 4, 7], actual: -368, basis: "金属から原子を切り離す値(107)を使う。水酸化ナトリウムの Na–O(537)は、生成熱から逆算した値。水は気体として数える。" },
    { id: "benzene", gid: "benzene_syn", name: "アセチレンからベンゼン", react: ["C2H2", "C2H2", "C2H2"], prod: ["C6H6"], map: [0, 1, 4, 5, 8, 9, 2, 3, 6, 7, 10, 11], actual: -631, basis: "平均結合エネルギーでは −366 kJ。実測との差は、ベンゼンの電子が環全体に広がる安定化(共鳴)など、平均値では表せない分。" },
    // ---- 水溶液: 硫酸イオンのように、反応の前後で変わらないイオンは描かない(ネットイオン式)。イオンの殻 = 水和 を、エネルギーのイベントにする ----
    { id: "zn_acid", gid: "zn_acid", name: "亜鉛と硫酸(水素の発生)", aq: true, react: ["Zn_s", "Hp", "Hp"], prod: ["Zn2", "H2"], map: [0, 1, 2], actual: -154, xfer: { "Zn:0>2": { e: 2639, name: "Zn → Zn²⁺ + 2e⁻" }, "H:1>0": { e: -1312, name: "H⁺ + e⁻ → H" } }, basis: "Zn + 2H⁺ → Zn²⁺ + H₂ という、イオンの反応だけを描く(硫酸イオンは、前後で変わらない見物人)。亜鉛の原子化 130、Zn のイオン化エネルギー 2639、H の電子親和力 1312、H⁺ の水和 1090、Zn²⁺ の水和 2046(いずれも mol あたり)で組み立てた。" },
    { id: "cement", gid: "cement", name: "硫酸銅と鉄(銅がでる)", aq: true, react: ["Cu2", "Fe_s"], prod: ["Cu_s", "Fe2"], map: [0, 1], actual: -154, xfer: { "Cu:2>0": { e: -2703, name: "Cu²⁺ + 2e⁻ → Cu" }, "Fe:0>2": { e: 2321, name: "Fe → Fe²⁺ + 2e⁻" } }, basis: "Cu²⁺ + Fe → Cu + Fe²⁺ という、イオンの反応だけを描く(硫酸イオンは見物人)。イオン化エネルギー・水和エネルギー(Cu²⁺ 2100、Fe²⁺ 1950)・金属の原子化の足し算。水和エネルギーは文献値の幅があるので、ざっくりした値。" },
    { id: "neutral", gid: "neutral", name: "中和(酸と塩基)", aq: true, react: ["Hp", "OHm"], prod: ["H2Oaq"], map: [1, 2, 0], actual: -57, xfer: { "H:1>0": { e: -1172, name: "H⁺と OH⁻ の静電引力" } }, extra: [{ name: "水蒸気 → 水(凝縮)", dE: -44, atom: 1 }], basis: "H⁺ + OH⁻ → H₂O を描く(Na⁺ や Cl⁻ は見物人)。水和をはがす 1090 + 530 のあと、気体中で H⁺ と OH⁻ が結びつく熱は 1635(O–H 結合 463 + 静電引力 1172)、さらに水蒸気が液体の水になる 44。" },
    { id: "nacl_dissolve", name: "食塩が水に溶ける", aq: true, react: ["Na2Cl2"], prod: ["Nap", "Nap", "Clm", "Clm"], map: [0, 2, 1, 3], actual: 8, basis: "結晶のイオン結合を壊す 1574(2 mol 分)と、イオンの水和(Na⁺ 409、Cl⁻ 374)で出る熱がほぼ釣り合う。だから、食塩は、溶けても、ほとんど熱が出入りしない。" },
    // ---- 残り: 大きな分子・硫酸塩・硫化物。結晶の結合の強さは、実測の反応熱に合わせて逆算した値 ----
    { id: "nacl_acid", gid: "nacl_acid", name: "塩と硫酸(塩酸の製法)", react: ["Na2Cl2", "H2SO4"], prod: ["Na2SO4", "HCl", "HCl"], map: [0, 2, 4, 5, 6, 7, 8, 9, 1, 10, 3], actual: 65, basis: "食塩の結晶を壊す 1574(2 mol 分)と、硫酸の O–H(463 × 2)を使う。硫酸ナトリウムの結晶の Na–O(787)は、反応熱に合わせて逆算した値。HCl は気体として逃げていく。吸熱だが、気体が逃げるので反応が進む。" },
    { id: "chlorate_dec", gid: "chlorate_dec", name: "塩素酸カリウムの分解(酸素の製法)", react: ["KClO3", "KClO3"], prod: ["KCl", "KCl", "O2", "O2", "O2"], map: [0, 1, 5, 6, 2, 7, 3, 8, 4, 9], actual: -78, basis: "塩素酸イオンの Cl–O(205・243)は目安の値。K–O(665)と KCl の K–Cl(648)は、生成熱から逆算した値。" },
    { id: "carbide", gid: "carbide_water", name: "カーバイドと水", react: ["CaC2", "H2O", "H2O"], prod: ["C2H2", "CaOH2"], map: [1, 2, 4, 7, 0, 3, 6, 5, 8], actual: -216, basis: "CaC₂ の Ca–C(428)は、反応熱に合わせて逆算した値。水は気体として数える(液体の水なら −128)。アセチレンの三重結合は、そのまま残る。" },
    { id: "claus", gid: "claus", name: "二酸化硫黄と硫化水素", react: ["SO2", "H2S", "H2S"], prod: ["S_s", "S_s", "S_s", "H2O", "H2O"], map: [0, 3, 6, 1, 4, 5, 2, 7, 8], actual: -146, basis: "SO₂ の S=O(538)と H₂S の S–H(363)は、分子ごとの値を使った。水は気体として数える(液体の水なら −234)。" },
    { id: "glucose_burn", gid: "glucose_burn", name: "グルコースの燃焼(呼吸)", react: ["C6H12O6", "O2", "O2", "O2", "O2", "O2", "O2"], prod: ["CO2", "CO2", "CO2", "CO2", "CO2", "CO2", "H2O", "H2O", "H2O", "H2O", "H2O", "H2O"], map: [0, 7, 25, 1, 8, 27, 2, 9, 29, 3, 10, 31, 4, 5, 33, 6, 11, 35, 24, 12, 19, 26, 13, 20, 28, 14, 21, 30, 15, 22, 32, 16, 23, 34, 17, 18], actual: -2538, basis: "分子が大きいので、平均結合エネルギーの誤差が目立つ(約 7%)。水は気体として数える(液体の水なら −2803)。体の中では、この熱を、少しずつ、段階をふんで取り出す。" },
    { id: "ferment", gid: "ferment", name: "アルコール発酵", react: ["C6H12O6"], prod: ["C2H5OH", "C2H5OH", "CO2", "CO2"], map: [0, 1, 8, 12, 19, 14, 13, 21, 20, 6, 4, 5, 17, 18, 23, 16, 22, 15, 2, 9, 7, 3, 10, 11], actual: -69, basis: "実際の発熱は小さい(−69 kJ)。平均結合エネルギーでは −215 kJ と大きくずれる。差が熱の大きさに近いほど、平均値では当てられない、という例。酵母は、この小さな熱と引き換えに、ATP をつくる。" },
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
  let CUR, EL, RA, FA, PA, MOLS, MOL_OF, DRIFT, BW, FW, BREAKS, POST, EVTS, STAYS, TOTAL_IN, TOTAL_OUT, NET, EHOLD, STEPS, EVENTS, GROUPS, DURATION, EXT, YR, Q0, Q1, XW, STUB_R, STUB_P;

  function buildReaction(def) {
    const rng = seeded(def.id), atoms = [], mols = [], pm = [];
    // 反応物の配置
    def.react.forEach((k, mi) => {
      const t = MOLT[k], base = atoms.length, lc = centroid(t.atoms.map((a) => a[1])), ax = randAxis(rng), ang = rng() * TAU;
      t.atoms.forEach((a) => atoms.push({ el: a[0], mol: mi, q: a[2] || 0 }));
      mols.push({ t, base, c: [0, 0, 0], rel: t.atoms.map((a) => rodrigues(sub(a[1], lc), ax, ang)) });
    });
    const N = atoms.length, rho = Math.max(2.3, 1.5 + 0.55 * mols.length);
    mols.forEach((m, i) => { m.c = mols.length === 1 ? [0, 0, 0] : mul(fib(i, mols.length), rho); });
    relaxMols(mols, 2.6, rng);
    const R = new Array(N);
    mols.forEach((m) => m.rel.forEach((r, k) => { R[m.base + k] = add(m.c, r); }));
    // 結合(第4要素は、固体・イオン結晶のための指定: {ty, e, name})
    const rb = [], pb = [], breaks = [], forms = [], xfers = [];
    mols.forEach((m) => {
      m.t.bonds.forEach((b) => rb.push({ a: m.base + b[0], b: m.base + b[1], o: b[2], ty: (b[3] && b[3].ty) || "cov", ov: b[3] || null }));
      if (m.t.hyd) { const k = m.t.hyd.atom || 0; breaks.push({ a: m.base + k, b: m.base + k, o: 1, self: true, ty: "hyd", ov: { e: m.t.hyd.e, name: m.t.hyd.label } }); }
      if (m.t.solid) m.t.atoms.forEach((_, k) => breaks.push({ a: m.base + k, b: m.base + k, o: 1, self: true, ty: m.t.solid.ty, ov: { e: m.t.solid.e, name: m.t.solid.label } }));
    });
    // 生成物の配置: 反応物のどの原子から来たかに合わせて、向きと位置を決める
    let base = 0; const P = new Array(N), pOf = new Array(N), Q1 = new Array(N).fill(0), STUBP = new Array(N).fill(null), STUBR = new Array(N).fill(null);
    mols.forEach((m) => {
      if (m.t.solid) m.t.atoms.forEach((_, k) => { STUBR[m.base + k] = { n: m.t.solid.stubs, ty: m.t.solid.ty }; });
      if (m.t.hyd) STUBR[m.base + (m.t.hyd.atom || 0)] = { n: m.t.hyd.n, ty: "hyd" };
    });
    def.prod.forEach((k, pi) => {
      const t = MOLT[k], idx = t.atoms.map((_, q) => def.map[base + q]), lc = centroid(t.atoms.map((a) => a[1])), loc = t.atoms.map((a) => sub(a[1], lc));
      const tg = idx.map((j) => R[j]), cen = centroid(tg); let best = null;
      for (let it = 0; it < 600; it++) {
        const ax = randAxis(rng), ang = it === 0 ? 0 : rng() * TAU, rel = loc.map((v) => rodrigues(v, ax, ang));
        let cost = 0; rel.forEach((r, q) => { const d = sub(r, sub(tg[q], cen)); cost += dot(d, d); });
        if (!best || cost < best.cost) best = { cost, rel };
      }
      pm.push({ idx, c: cen, rel: best.rel, t });
      t.atoms.forEach((a, q) => { Q1[idx[q]] = a[2] || 0; if (t.solid) STUBP[idx[q]] = { n: t.solid.stubs, ty: t.solid.ty }; });
      t.bonds.forEach((b) => pb.push({ a: idx[b[0]], b: idx[b[1]], o: b[2], ty: (b[3] && b[3].ty) || "cov", ov: b[3] || null }));
      if (t.hyd) { const q = t.hyd.atom || 0; STUBP[idx[q]] = { n: t.hyd.n, ty: "hyd" }; forms.push({ a: idx[q], b: idx[q], o: 1, self: true, ty: "hyd", ov: { e: t.hyd.e, name: t.hyd.label } }); }
      if (t.solid) t.atoms.forEach((_, q) => forms.push({ a: idx[q], b: idx[q], o: 1, self: true, ty: t.solid.ty, ov: { e: t.solid.e, name: t.solid.label } }));
      base += t.atoms.length;
    });
    if (base !== N) throw new Error("反応の定義: 原子の数が合いません " + def.id);
    relaxMols(pm, 2.9, rng);
    const gcen = centroid(pm.map((m) => m.c)), DR = new Array(N);
    pm.forEach((m, pi) => {
      let dir = sub(m.c, gcen); if (Math.hypot(...dir) < 1e-6) dir = [rng() - 0.5, 0.2, rng() - 0.5];
      const dv = m.t.static ? [0, 0, 0] : add(mul(norm(dir), 3.4), [0, 0.2, 0]);
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
    const stays = [], adjusts = [];
    rb.forEach((b) => { // 結合の次数だけが変わるもの(C=C → C–C など)は「一部だけ切れる」として扱う
      const p = pMap.get(key(b.a, b.b));
      if (p && p.o === b.o) { // 同じ結合が、強さを変えて残るもの(石灰の反応など)は、強さの差を、独立したイベントにする
        stays.push(b);
        if (b.ov && p.ov && b.ov.e !== p.ov.e) adjusts.push({ a: b.a, b: b.b, o: b.o, ty: b.ty, self: true, adj: true, dE: b.ov.e - p.ov.e, e: Math.abs(b.ov.e - p.ov.e), name: b.ov.name + "→" + p.ov.name });
      } else if (p && p.o < b.o) breaks.push({ a: b.a, b: b.b, o: b.o, oFrom: b.o, oTo: p.o, partial: true, ty: "cov" }); else if (!p) breaks.push(b);
    });
    pb.forEach((b) => {
      const r = rMap.get(key(b.a, b.b));
      if (!r) forms.push(b); else if (r.o < b.o) forms.push({ a: b.a, b: b.b, o: b.o, oFrom: r.o, oTo: b.o, partial: true, ty: "cov" });
    });
    // 電荷が変わる原子 = 電子の移動
    atoms.forEach((a, j) => {
      if (a.q === Q1[j]) return;
      const x = (def.xfer && def.xfer[a.el + ":" + a.q + ">" + Q1[j]]) || { e: 0, name: "電子の移動" };
      xfers.push({ a: j, b: j, o: 1, self: true, xfer: true, ty: "cov", dE: x.e, name: x.name, e: Math.abs(x.e) });
    });
    const finish = (list, kind, ws) => list.forEach((x, i) => {
      if (!x.xfer && !x.adj) {
        const el1 = atoms[x.a].el, el2 = atoms[x.b].el;
        let info = bondInfo(el1, el2, x.o, x.ov);
        if (x.partial) { const f = bondInfo(el1, el2, x.oFrom), t = bondInfo(el1, el2, x.oTo); info = { name: f.name + "→" + t.name, e: Math.abs(f.e - t.e) }; }
        Object.assign(x, info, { dE: kind === "break" ? info.e : -info.e });
      }
      x.w = ws[i]; x.kind = x.xfer ? "xfer" : x.adj ? (x.dE > 0 ? "break" : "form") : kind;
    });
    finish(breaks, "break", windows(breaks.length, 0.27, 0.51));
    (def.extra || []).forEach((x) => adjusts.push({ a: x.atom, b: x.atom, o: 1, ty: "cov", self: true, adj: true, dE: x.dE, e: Math.abs(x.dE), name: x.name }));
    const post = xfers.concat(adjusts, forms);
    const ws = windows(post.length, 0.62, 0.92);
    post.forEach((x, i) => finish([x], "form", [ws[i]]));
    const span = (list, j) => { const w = list.filter((x) => !x.partial && !x.xfer && !x.adj && (x.a === j || x.b === j)).map((x) => x.w); return w.length ? [Math.min(...w.map((q) => q[0])), Math.max(...w.map((q) => q[1]))] : null; };
    const xw = new Array(N).fill(null); xfers.forEach((x) => { xw[x.a] = x.w; });
    return {
      def, atoms, mols, R, F, P, DR, breaks, post, stays, pm, q0: atoms.map((a) => a.q), q1: Q1, xw, stubR: STUBR, stubP: STUBP,
      BW: R.map((_, j) => span(breaks, j)), FW: R.map((_, j) => span(forms, j) || [0.62, 0.92]),
    };
  }

  const summary = (list) => { // 「H–H 436 × 2 + O=O 498」(エネルギーが 0 のものは、名前だけ)
    const order = [], cnt = {};
    list.forEach((b) => { if (!cnt[b.name]) { cnt[b.name] = { n: 0, e: b.e }; order.push(b.name); } cnt[b.name].n++; });
    return order.map((k) => k + (cnt[k].e ? " " + cnt[k].e : "") + (cnt[k].n > 1 ? " × " + cnt[k].n : "")).join(" + ");
  };
  const groupsOf = (list) => { // 同じ種類の連続するイベントを、グラフの注釈では1つにまとめる
    const gs = [];
    list.forEach((b) => { const g = gs[gs.length - 1]; if (g && g.name === b.name) { g.n++; g.dE += b.dE; g.w1 = b.w[1]; } else gs.push({ name: b.name, n: 1, dE: b.dE, w0: b.w[0], w1: b.w[1] }); });
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
    BREAKS = B.breaks; POST = B.post; STAYS = B.stays; EVTS = BREAKS.concat(POST).sort((x, y) => x.w[0] - y.w[0]);
    Q0 = B.q0; Q1 = B.q1; XW = B.xw; STUB_R = B.stubR; STUB_P = B.stubP;
    const rng = seeded(def.id + "far"), rc = centroid(B.mols.map((m) => m.c));
    MOLS = B.mols.map((m) => {
      let dir = sub(m.c, rc); if (Math.hypot(...dir) < 1e-6) dir = [1, 0.3, 0.2];
      const still = !!m.t.static; // 固体は動き回らない
      return { c: m.c, off: still ? [0, 0, 0] : add(mul(norm(dir), 7), [0, rng() * 2 - 1, rng() * 2 - 1]), ax: randAxis(rng), spin: still ? 0 : (rng() < 0.5 ? -1 : 1) * (2 + rng() * 1.4) };
    });
    MOL_OF = B.atoms.map((a) => a.mol);
    TOTAL_IN = EVTS.reduce((s, x) => s + Math.max(0, x.dE), 0); TOTAL_OUT = EVTS.reduce((s, x) => s + Math.max(0, -x.dE), 0); NET = TOTAL_IN - TOTAL_OUT;
    EHOLD = BREAKS.reduce((s, x) => s + x.dE, 0);
    DURATION = Math.min(44, 12 + 1.6 * EVTS.length);
    EXT = Math.max(...[].concat(RA, FA, PA).map((p) => Math.hypot(...p)));
    let lo = 0, hi = 0; for (let i = 0; i <= 200; i++) { const e = energyAt(i / 200); lo = Math.min(lo, e); hi = Math.max(hi, e); }
    const pad = (hi - lo) * 0.14; YR = [lo - pad, hi + pad * 0.8];
    EVENTS = [];
    EVTS.forEach((x) => {
      if (x.kind === "break") { EVENTS.push({ t: x.w[0] + 0.01, kind: "abs", a: x.a, b: x.b }); EVENTS.push({ t: (x.w[0] + x.w[1]) / 2, kind: "snap", a: x.a, b: x.b }); }
      else if (x.kind === "xfer") EVENTS.push({ t: (x.w[0] + x.w[1]) / 2, kind: "xfer", a: x.a, b: x.b });
      else EVENTS.push({ t: x.w[1] - 0.004, kind: "rel", a: x.a, b: x.b });
    });
    GROUPS = groupsOf(EVTS);
    const heat = NET < 0, names = molList(def.react), outs = molList(def.prod), hasX = POST.some((x) => x.xfer);
    const pos = EVTS.filter((x) => x.dE > 0), neg = EVTS.filter((x) => x.dE < 0), after = POST.filter((x) => x.dE !== 0 || x.xfer);
    STEPS = [
      { r: [0, 0.27], t: "近づく", s: names },
      { r: [0.27, 0.51], t: "結合を切る(エネルギーを吸収)", s: "結晶や分子の結合を切るには、外からエネルギーが必要。" + summary(BREAKS) },
      { r: [0.51, 0.62], t: "ばらばらの原子", s: "切る結合をすべて切った状態。エネルギーは " + fmt(EHOLD) + " kJ" },
      { r: [0.62, 0.9], t: hasX ? "電子が移り、新しい結合ができる" : "新しい結合ができる(熱を放出)", s: (hasX ? "電子の受け渡しで、原子がイオンに(あるいは、イオンが原子に)なる。" : "結合ができるたびに、エネルギーが熱や光として出ていく。") + (after.length <= 4 ? summary(after) : "") },
      { r: [0.9, 1.01], t: outs + " ができた", s: heat ? "吸収 " + TOTAL_IN + " kJ より放出 " + TOTAL_OUT + " kJ が大きい。差の " + Math.abs(NET) + " kJ が熱として出る(発熱)" : "吸収 " + TOTAL_IN + " kJ より放出 " + TOTAL_OUT + " kJ が小さい。足りない " + Math.abs(NET) + " kJ は、外から加え続ける必要がある(吸熱)" },
    ];
    const gasOnly = !def.basis;
    $("rxNote").textContent = "吸収: " + summary(pos) + " = " + TOTAL_IN + " kJ ／ 放出: " + summary(neg) + " = " + TOTAL_OUT + " kJ ／ 差 " + fmt(NET) + " kJ(" + (heat ? "発熱" : "吸熱") + ")。" +
      (gasOnly ? "平均結合エネルギーによる近似値。実測は " + fmt(def.actual) + " kJ(すべて気体として)。化学タブの値と違うのは、水などが液体になるときの熱(凝縮熱)を含むかどうかの違い。" : def.basis + " 実測は " + fmt(def.actual) + " kJ。");
    rx.t = 0; rx.parts = []; rx.flashes = []; rx.heat = 0; rx.cold = 0; rx.fireFrom = undefined; lastStep = -1;
    [...$("rxChips").children].forEach((c, i) => c.classList.toggle("on", i === idx));
  }

  const energyAt = (t) => EVTS.reduce((s, x) => s + x.dE * prog(t, x.w), 0);
  const chargeAt = (i, t) => (Q0[i] === Q1[i] || !XW[i] ? Q0[i] : t < (XW[i][0] + XW[i][1]) / 2 ? Q0[i] : Q1[i]);
  function atomPos(i, t) {
    const m = MOLS[MOL_OF[i]], pA = prog(t, [0, 0.25]);
    let p = add(add(m.c, mul(m.off, 1 - pA)), rodrigues(sub(RA[i], m.c), m.ax, (1 - pA) * m.spin));
    if (BW[i]) p = lerp3(p, FA[i], prog(t, BW[i]));
    p = lerp3(p, PA[i], prog(t, FW[i]));
    return add(p, mul(DRIFT[i], prog(t, [0.88, 1])));
  }
  // その時刻に存在する結合: {a,b,o,rf(太さ), shared(共有電子の有無), hot}
  function bondsAt(t) {
    const cov = (x) => x.ty === "cov";
    const out = STAYS.map((b) => ({ a: b.a, b: b.b, o: b.o, ty: b.ty, rf: 1, shared: cov(b), hot: 0 }));
    EVTS.forEach((x) => {
      if (x.self || x.xfer) return; // 単原子の固体や電子の移動は、結合の線ではない
      const p = prog(t, x.w);
      if (x.kind === "break") {
        if (x.partial) out.push({ a: x.a, b: x.b, o: p < 0.5 ? x.oFrom : x.oTo, ty: "cov", rf: 1, shared: true, hot: Math.sin(p * Math.PI) });
        else if (p < 0.85) out.push({ a: x.a, b: x.b, o: x.o, ty: x.ty, rf: 1 - 0.8 * p, shared: cov(x) && p < 0.5, hot: p });
      } else if (x.partial) out.push({ a: x.a, b: x.b, o: p < 0.5 ? x.oFrom : x.oTo, ty: "cov", rf: 1, shared: true, hot: 0 });
      else if (p > 0.45) out.push({ a: x.a, b: x.b, o: x.o, ty: x.ty, rf: sm((p - 0.45) / 0.4), shared: cov(x) && p > 0.8, hot: 0 });
    });
    return out;
  }

  function fire(ev, pos) {
    const mid = mul(add(pos[ev.a], pos[ev.b]), 0.5);
    if (ev.kind === "xfer") { // 電子が、手放す原子から、受け取る原子へ流れる
      const gain = Q1[ev.a] < Q0[ev.a]; let best = null;
      EL.forEach((_, j) => { if (j === ev.a || (Q1[j] < Q0[j]) === gain || Q1[j] === Q0[j]) return; const d = Math.hypot(...sub(pos[j], pos[ev.a])); if (!best || d < best.d) best = { j, d }; });
      if (best) {
        const src = gain ? pos[best.j] : pos[ev.a], dst = gain ? pos[ev.a] : pos[best.j], life = 0.7;
        for (let i = 0; i < 9; i++) rx.parts.push({ p: add(src, [rnd(-0.15, 0.15), rnd(-0.15, 0.15), rnd(-0.15, 0.15)]), v: mul(sub(dst, src), 1 / (life * rnd(0.85, 1.15))), life: life * rnd(0.8, 1), max: life, col: YEL, size: 0.07, drag: 0 });
      }
      rx.flashes.push({ p: pos[ev.a], age: 0, col: YEL, big: 0.8 });
    } else if (ev.kind === "abs") {
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
    if (CUR.aq) { // 水溶液: うっすら青く、泡がのぼる
      halo(g, W / 2, H / 2, H * 0.9, [60, 130, 210], 0.17);
      g.strokeStyle = "rgba(160,205,255,.22)"; g.lineWidth = 1.2;
      for (let b = 0; b < 26; b++) {
        const f = (b * 0.618) % 1, x = W * (0.08 + 0.84 * ((b * 0.377) % 1)) + 6 * Math.sin(now * 0.8 + b), y = H - ((now * (14 + 22 * f) + b * 57) % (H + 30)) + 10;
        g.beginPath(); g.arc(x, y, 2 + f * 5, 0, TAU); g.stroke();
      }
    }
    const unit = H * (EXT > 4.5 ? 0.4 : 0.55) / (EXT + 1.0) * (rx.style === "sf" ? 0.8 : 1), P = makeProj(cam, W, H, unit);
    const E = energyAt(t), outNow = EVTS.reduce((s, x) => s + Math.max(0, -x.dE) * prog(t, x.w), 0), inNow = EVTS.reduce((s, x) => s + Math.max(0, x.dE) * prog(t, x.w), 0);
    const cold = clamp(E / Math.max(1, EHOLD)), warm = clamp(outNow / Math.max(1, TOTAL_OUT)) * (1 - 0.6 * prog(t, [0.9, 1])) * (NET < 0 ? 1 : 0.5);
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
      const el = EL[i], qc = chargeAt(i, t), ion = rx.style === "st" ? 1 : qc > 0 ? 0.72 : qc < 0 ? 1.18 : 1;
      const ra = rx.style === "st" ? 0.17 : RAD[el] * sk.a * ion, q = P(p), r = ra * q.s;
      items.push({ d: q.d, f: () => sphere(g, q.x, q.y, r, COL[el], cold * 0.9, warm * 0.9) });
      rx.hits.push({ x: q.x, y: q.y, r: Math.max(r * 1.2, 12), el, d: q.d });
      if (qc) { // イオンの電荷
        const txt = (Math.abs(qc) > 1 ? Math.abs(qc) : "") + (qc > 0 ? "+" : "−");
        items.push({ d: q.d - 0.01, f: () => { g.font = "bold " + Math.max(11, Math.round(r * 0.8)) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = qc > 0 ? "#ffb3b3" : "#b3d4ff"; g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 3; g.strokeText(txt, q.x + r * 0.85, q.y - r * 0.85); g.fillText(txt, q.x + r * 0.85, q.y - r * 0.85); } });
      }
      // 結晶につながっている「手」(固体の原子): 切り離されるまで/結晶になるまで、うっすら見える
      const sR = STUB_R[i] ? 1 - (BW[i] ? prog(t, BW[i]) : 0) : 0, sP = STUB_P[i] ? prog(t, FW[i]) : 0, spec = sR >= sP ? STUB_R[i] : STUB_P[i], str = Math.max(sR, sP);
      if (spec && str > 0.03 && spec.ty === "hyd") { // 水和: イオンのまわりに集まる水分子(陽イオンには O、陰イオンには H が向く)
        const cat = qc >= 0, dist = (RAD[el] + 0.95) * (0.65 + 0.35 * str);
        for (let k = 0; k < spec.n; k++) {
          const dv = norm(rodrigues(fib(k, spec.n), [0, 1, 0], now * 0.35 + i)), per = norm(cross(dv, [0.3, 1, 0.2])), cen = add(p, mul(dv, dist)), sg = cat ? 1 : -1;
          const oP = P(cen), h1 = P(add(cen, add(mul(dv, 0.42 * sg), mul(per, 0.52)))), h2 = P(add(cen, add(mul(dv, 0.42 * sg), mul(per, -0.52))));
          const al = 0.9 * str;
          items.push({ d: oP.d, f: () => { g.globalAlpha = al; g.strokeStyle = "rgba(235,235,245,.7)"; g.lineWidth = 2; g.beginPath(); g.moveTo(h1.x, h1.y); g.lineTo(oP.x, oP.y); g.lineTo(h2.x, h2.y); g.stroke(); sphere(g, oP.x, oP.y, 0.2 * oP.s, COL.O, 0, 0); g.globalAlpha = 1; } });
          items.push({ d: h1.d, f: () => { g.globalAlpha = al; sphere(g, h1.x, h1.y, 0.12 * h1.s, COL.H, 0, 0); g.globalAlpha = 1; } });
          items.push({ d: h2.d, f: () => { g.globalAlpha = al; sphere(g, h2.x, h2.y, 0.12 * h2.s, COL.H, 0, 0); g.globalAlpha = 1; } });
        }
      } else if (spec && str > 0.03) {
        const col = spec.ty === "met" ? [255, 190, 110] : [200, 200, 220];
        for (let k = 0; k < spec.n; k++) {
          const an = TAU * k / spec.n + 0.5, dv = norm([Math.cos(an), -0.35, Math.sin(an)]), tip = P(add(p, mul(dv, 1.15 * (0.6 + 0.4 * str))));
          items.push({ d: tip.d, f: () => { g.strokeStyle = rgb(col, 1, 0.55 * str); g.lineWidth = Math.max(2, 0.07 * q.s); g.lineCap = "round"; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(tip.x, tip.y); g.stroke(); g.fillStyle = rgb(col, 1, 0.7 * str); g.beginPath(); g.arc(tip.x, tip.y, Math.max(2, 0.09 * q.s), 0, TAU); g.fill(); } });
        }
      }
      if (showE) { // 共有されていない電子(原子のまわりを回る)
        const sh = shared[i] + (spec && spec.ty === "net" ? spec.n * str : 0);
        const n = Math.max(0, Math.round(VE[el] - qc - sh)), orb = (rx.style === "st" ? RAD[el] : ra) * 1.45;
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
      if (b.ty === "ion") { // イオン結合: 静電気の引力。点線で結ぶ
        items.push({ d: pm.d, f: () => { g.save(); g.setLineDash([5, 4]); g.lineCap = "butt"; g.strokeStyle = "rgba(225,230,255," + (0.65 * b.rf) + ")"; g.lineWidth = Math.max(1.6, 0.05 * pm.s * (1 + b.hot)); g.beginPath(); g.moveTo(pa.x, pa.y); g.lineTo(pb.x, pb.y); g.stroke(); g.restore(); } });
        return;
      }
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
    level(0, "0", "#8d93a8"); level(EHOLD, fmt(EHOLD), "#5cc8ff"); level(NET, fmt(NET), NET < 0 ? "#ff8a3d" : "#5cc8ff");
    g.fillStyle = "#8d93a8"; g.textAlign = "left";
    g.fillText("反応物", L + 4, Y(0) + (NET < 0 ? -8 : 10)); g.fillText("ばらばらの原子", L + 4, Y(EHOLD) - 8); g.fillText("生成物", L + 4, Y(NET) + (NET < 0 ? 10 : -8));
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
    const placed = []; // 注釈どうしが重ならないよう、少しずつ上へずらす
    GROUPS.forEach((gr) => {
      const mid = (gr.w0 + gr.w1) / 2; if (t <= mid) return;
      const cold = gr.dE > 0, label = gr.name + (gr.n > 1 ? " ×" + gr.n : "") + (gr.dE ? " " + fmt(gr.dE) : "");
      const w = g.measureText(label).width; let right = cold, x = X(mid) + (cold ? -9 : 9), y = Y(energyAt(mid)) - 3;
      if (!right && x + w > W - 4) right = true, x = X(mid) - 9;
      for (let guard = 0; guard < 8; guard++) {
        const x0 = right ? x - w : x, hit = placed.some((p) => x0 < p.x1 && x0 + w > p.x0 && Math.abs(y - p.y) < 11);
        if (!hit) break; y -= 11;
      }
      placed.push({ x0: right ? x - w : x, x1: right ? x : x + w, y });
      g.fillStyle = gr.dE === 0 ? "#c9cde0" : cold ? "#5cc8ff" : "#ff8a3d"; g.textAlign = right ? "right" : "left";
      g.fillText(label, x, Math.max(T - 2, y));
    });
    if (t > 0.93) { // 反応熱の矢印
      const x = R - 14, up = NET > 0, col = up ? "#5cc8ff" : "#ff8a3d", tip = Y(NET), s = up ? 1 : -1;
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(x, Y(0)); g.lineTo(x, tip + 5 * s); g.stroke();
      g.beginPath(); g.moveTo(x - 5, tip + 10 * s); g.lineTo(x, tip); g.lineTo(x + 5, tip + 10 * s); g.fill();
      g.textAlign = "center"; g.fillText("反応熱 " + fmt(NET) + " kJ(" + (up ? "吸熱" : "発熱") + ")", X(0.5), Math.abs(Y(0) - Y(NET)) < 34 ? Math.max(Y(0), Y(NET)) + 14 : (Y(0) + Y(NET)) / 2);
    }
    const mx = X(t), my = Y(Ecur); halo(g, mx, my, 16, Ecur > EHOLD * 0.5 ? COLD : WARM, 0.8);
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
    if (best && ELS[best.el]) { atom.el = best.el; atom.ion = 0; setTab("at"); }
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
