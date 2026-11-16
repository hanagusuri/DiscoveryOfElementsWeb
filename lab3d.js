// 分子ラボ 3D(プロトタイプ): 依存ライブラリなしの、Canvas 製 3D 描画。
//  - 反応ビュー: 水素の燃焼 2H2 + O2 -> 2H2O を、結合の切断・形成とエネルギーの出入りで見せる
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
  //  反応ビュー: 2H2 + O2 -> 2H2O
  // =====================================================================
  const BD = window.MolViz.BOND_DATA;
  const E_HH = BD["H-H"][1], E_OO = BD["O=O"][1], E_OH = BD["O-H"][1]; // 436, 498, 463
  const DURATION = 22; // 秒(1×)
  // 原子: 0 H1, 1 H2, 2 H3, 3 H4, 4 O1, 5 O2
  const EL = ["H", "H", "H", "H", "O", "O"];
  const VE = { H: 1, O: 6 };
  const RA = [[-0.37, 1.7, 0.4], [0.37, 1.7, 0.4], [-0.37, -1.6, -0.5], [0.37, -1.6, -0.5], [-0.605, 0, 0], [0.605, 0, 0]]; // 反応物
  const FA = RA.map((p) => [p[0] * 2.6, p[1] * 1.7, p[2] * 1.7]); // ばらばらの原子
  const PA = [[-1.214, 0.757, 0], [1.214, 0, 0.757], [-1.214, -0.757, 0], [1.214, 0, -0.757], [-1.8, 0, 0], [1.8, 0, 0]]; // 水 (O-H 0.96Å, 104.5°)
  const MOLS = [
    { c: [0, 1.7, 0.4], off: [-7, 4, 3], ax: [0, 0, 1], spin: 2.4 },
    { c: [0, -1.6, -0.5], off: [-6, -5, -2], ax: [1, 0, 0], spin: -2.6 },
    { c: [0, 0, 0], off: [7, 0.5, -3], ax: [0, 1, 0], spin: 3.2 },
  ];
  const MOL_OF = [0, 0, 1, 1, 2, 2];
  const IS_A = [1, 0, 1, 0, 1, 0]; // 水A(O1)に属する原子
  const DRIFT_A = [-3.2, 0.8, 0.6], DRIFT_B = [3.2, -0.5, -0.4];
  const BW = [[0.27, 0.35], [0.27, 0.35], [0.35, 0.43], [0.35, 0.43], [0.43, 0.51], [0.43, 0.51]]; // 原子ごとの「切れる」時間
  const FW = [[0.62, 0.70], [0.76, 0.84], [0.70, 0.78], [0.84, 0.92], [0.62, 0.78], [0.76, 0.92]]; // 原子ごとの「結合する」時間
  const BREAKS = [{ a: 0, b: 1, o: 1, w: BW[0], e: E_HH, name: "H–H" }, { a: 2, b: 3, o: 1, w: BW[2], e: E_HH, name: "H–H" }, { a: 4, b: 5, o: 2, w: BW[4], e: E_OO, name: "O=O" }];
  const FORMS = [{ a: 0, b: 4, w: FW[0] }, { a: 2, b: 4, w: FW[2] }, { a: 1, b: 5, w: FW[1] }, { a: 3, b: 5, w: FW[3] }].map((f) => Object.assign(f, { o: 1, e: E_OH, name: "O–H" }));
  const TOTAL_IN = BREAKS.reduce((s, b) => s + b.e, 0), TOTAL_OUT = FORMS.reduce((s, f) => s + f.e, 0), NET = TOTAL_IN - TOTAL_OUT;
  const STEPS = [
    { n: "① 近づく", r: [0, 0.27], k: "", t: "分子が近づく", s: "H₂ 分子 2 個と O₂ 分子 1 個が出会う" },
    { n: "② 切る", r: [0.27, 0.51], k: "cold", t: "結合を切る(エネルギーを吸収)", s: "結合を切るには、外からエネルギーが必要。H–H 436 kJ ×2、O=O 498 kJ" },
    { n: "③ ばらばら", r: [0.51, 0.62], k: "", t: "ばらばらの原子", s: "全部の結合を切った状態。エネルギーは最も高い(+" + TOTAL_IN + " kJ)" },
    { n: "④ つくる", r: [0.62, 0.9], k: "hot", t: "新しい結合ができる(熱を放出)", s: "O–H 結合ができるたびに、463 kJ が熱や光として出ていく" },
    { n: "⑤ 水", r: [0.9, 1.01], k: "", t: "水(H₂O)ができた", s: "吸収 " + TOTAL_IN + " kJ より放出 " + TOTAL_OUT + " kJ が大きい。差の " + Math.abs(NET) + " kJ が熱として残る" },
  ];

  const energyAt = (t) => BREAKS.reduce((s, b) => s + b.e * prog(t, b.w), 0) - FORMS.reduce((s, f) => s + f.e * prog(t, f.w), 0);

  function atomPos(i, t) {
    const m = MOLS[MOL_OF[i]], pA = prog(t, [0, 0.25]);
    let p = add(add(m.c, mul(m.off, 1 - pA)), rodrigues(sub(RA[i], m.c), m.ax, (1 - pA) * m.spin));
    p = lerp3(p, FA[i], prog(t, BW[i]));
    p = lerp3(p, PA[i], prog(t, FW[i]));
    return add(p, mul(IS_A[i] ? DRIFT_A : DRIFT_B, prog(t, [0.88, 1])));
  }
  // その時刻に存在する結合: {a,b,o,rf(太さ), shared(共有電子の有無), hot}
  function bondsAt(t) {
    const out = [];
    BREAKS.forEach((b) => { const s = prog(t, b.w); if (s < 0.85) out.push({ a: b.a, b: b.b, o: b.o, rf: 1 - 0.8 * s, shared: s < 0.5, hot: s }); });
    FORMS.forEach((f) => { const p = prog(t, f.w); if (p > 0.45) out.push({ a: f.a, b: f.b, o: 1, rf: sm((p - 0.45) / 0.4), shared: p > 0.8, hot: 0 }); });
    return out;
  }

  const rx = { cv: $("cv"), cam: newCam(0.7, -0.3), t: 0, playing: true, speed: 1, parts: [], flashes: [], heat: 0, cold: 0, hits: [], ctx: null };
  Object.assign(rx, fit(rx.cv, 0.72));
  const ch = { cv: $("chart") };
  Object.assign(ch, fit(ch.cv, 0, 170));

  // イベント(粒子の発生): 切断の開始 → 吸収、結合の完成 → 放出
  const EVENTS = [];
  BREAKS.forEach((b) => { EVENTS.push({ t: b.w[0] + 0.01, kind: "abs", a: b.a, b: b.b }); EVENTS.push({ t: (b.w[0] + b.w[1]) / 2, kind: "snap", a: b.a, b: b.b }); });
  FORMS.forEach((f) => EVENTS.push({ t: f.w[1] - 0.004, kind: "rel", a: f.a, b: f.b }));

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

  const stepsEl = $("steps");
  STEPS.forEach((s) => { const e = document.createElement("span"); e.textContent = s.n; if (s.k) e.className = s.k; stepsEl.appendChild(e); });
  let lastStep = -1;

  function renderRx(now, dt) {
    const { g, W, H, cam } = rx, t = rx.t;
    g.clearRect(0, 0, W, H);
    const unit = H / 8.6, P = makeProj(cam, W, H, unit);
    const E = energyAt(t), outNow = FORMS.reduce((s, f) => s + f.e * prog(t, f.w), 0), inNow = BREAKS.reduce((s, b) => s + b.e * prog(t, b.w), 0);
    const cold = clamp(E / TOTAL_IN), warm = clamp(outNow / TOTAL_OUT) * (1 - 0.6 * prog(t, [0.9, 1]));
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
    // イベント発火(再生中のみ)
    if (rx.fireFrom !== undefined) {
      EVENTS.forEach((ev) => { if (ev.t > rx.fireFrom && ev.t <= t) fire(ev, pos); });
      rx.fireFrom = undefined;
    }

    const bonds = bondsAt(t), showE = $("optE").checked;
    const shared = [0, 0, 0, 0, 0, 0];
    bonds.forEach((b) => { if (b.shared) { shared[b.a] += b.o; shared[b.b] += b.o; } });
    const items = []; rx.hits = [];

    pos.forEach((p, i) => {
      const q = P(p), r = RAD[EL[i]] * q.s;
      items.push({ d: q.d, f: () => sphere(g, q.x, q.y, r, COL[EL[i]], cold * 0.9, warm * 0.9) });
      rx.hits.push({ x: q.x, y: q.y, r: r * 1.2, el: EL[i], d: q.d });
      if (showE) { // 共有されていない電子(原子のまわりを回る)
        const n = Math.max(0, VE[EL[i]] - shared[i]);
        for (let k = 0; k < n; k++) {
          const ang = now * 3 + Math.floor(k / 2) * TAU / Math.ceil(n / 2) + (k % 2) * 0.55 + i, tilt = i * 1.1;
          const loc = [Math.cos(ang) * RAD[EL[i]] * 1.5, Math.sin(ang) * RAD[EL[i]] * 1.5 * Math.cos(tilt), Math.sin(ang) * RAD[EL[i]] * 1.5 * Math.sin(tilt)];
          const e = P(add(p, loc));
          items.push({ d: e.d, f: () => electronDot(g, e.x, e.y, 0.075 * e.s, YEL) });
        }
      }
    });
    bonds.forEach((b) => {
      const A = pos[b.a], B = pos[b.b], M = mul(add(A, B), 0.5), pa = P(A), pb = P(B), pm = P(M);
      const rad = (b.o === 1 ? 0.1 : 0.13) * b.rf, wpx = rad * pm.s;
      const ca = mix(COL[EL[b.a]], WARM, b.hot * 0.8), cb = mix(COL[EL[b.b]], WARM, b.hot * 0.8);
      const qa = P(mul(add(A, M), 0.5)), qb = P(mul(add(B, M), 0.5));
      items.push({ d: qa.d, f: () => bondHalf(g, pa, pm, wpx, ca, b.o) });
      items.push({ d: qb.d, f: () => bondHalf(g, pb, pm, wpx, cb, b.o) });
      if (showE && b.shared) { // 共有電子: 結合軸のまわりを回る
        const u = norm(sub(B, A)), p1 = norm(cross(u, [0.3, 1, 0.2])), p2 = cross(u, p1), n = b.o * 2;
        for (let k = 0; k < n; k++) {
          const th = now * 4.5 + k * TAU / n, al = 0.22 * Math.sin(th * 0.5 + k * 1.3), rr = 0.17 + 0.05 * b.o;
          const p = add(add(M, mul(u, al)), add(mul(p1, Math.cos(th) * rr), mul(p2, Math.sin(th) * rr)));
          const e = P(p);
          items.push({ d: e.d, f: () => electronDot(g, e.x, e.y, 0.07 * e.s, YEL) });
        }
      }
    });
    // 粒子(エネルギーの粒)
    rx.parts = rx.parts.filter((q) => {
      q.life -= dt; if (q.life <= 0) return false;
      q.p = add(q.p, mul(q.v, dt)); if (q.drag) q.v = mul(q.v, Math.max(0, 1 - q.drag * dt));
      const e = P(q.p), a = clamp(q.life / q.max);
      items.push({ d: e.d, f: () => halo(g, e.x, e.y, q.size * e.s * (2.5 + 2 * a), q.col, 0.9 * a) });
      return true;
    });
    items.sort((a, b) => b.d - a.d).forEach((it) => it.f());
    // 閃光
    rx.flashes = rx.flashes.filter((fl) => {
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
      $("capT").textContent = STEPS[si].t; $("capS").textContent = STEPS[si].s;
    }
    $("lgIn").textContent = Math.round(inNow) + " kJ"; $("lgOut").textContent = Math.round(outNow) + " kJ";
    const net = Math.round(inNow - outNow), ne = $("lgNet");
    ne.textContent = (net > 0 ? "+" : net < 0 ? "−" : "") + Math.abs(net) + " kJ" + (t > 0.93 ? (net < 0 ? "(発熱)" : "(吸熱)") : "");
    ne.className = "v " + (net < 0 ? "hotc" : net > 0 ? "cold" : "");
    $("seek").value = Math.round(t * 1000);
    renderChart(t, E);
  }

  // ---- エネルギー階段グラフ ----
  function renderChart(t, Ecur) {
    const { g, W, H } = ch, L = 54, R = W - 10, T = 16, B = H - 20, YMIN = -700, YMAX = 1550;
    const X = (tt) => L + tt * (R - L), Y = (e) => B - (e - YMIN) / (YMAX - YMIN) * (B - T);
    g.clearRect(0, 0, W, H);
    g.font = "11px -apple-system, 'Yu Gothic UI', sans-serif"; g.textBaseline = "middle";
    const level = (e, label, col) => {
      g.strokeStyle = "rgba(140,148,176,.35)"; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(L, Y(e)); g.lineTo(R, Y(e)); g.stroke(); g.setLineDash([]);
      g.fillStyle = col; g.textAlign = "right"; g.fillText(label, L - 6, Y(e));
    };
    level(0, "0", "#8d93a8"); level(TOTAL_IN, "+" + TOTAL_IN, "#5cc8ff"); level(NET, "−" + Math.abs(NET), "#ff8a3d");
    g.fillStyle = "#8d93a8"; g.textAlign = "left"; g.fillText("反応物", L + 4, Y(0) - 8); g.fillText("ばらばらの原子", L + 4, Y(TOTAL_IN) - 8); g.fillText("生成物(水)", L + 4, Y(NET) + 10);
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
    // 各ステップの注釈
    g.font = "10.5px -apple-system, 'Yu Gothic UI', sans-serif";
    BREAKS.forEach((b) => { if (t > (b.w[0] + b.w[1]) / 2) { g.fillStyle = "#5cc8ff"; g.textAlign = "center"; g.fillText(b.name + " +" + b.e, X((b.w[0] + b.w[1]) / 2) - 18, Y(energyAt(b.w[1])) - 10); } });
    FORMS.forEach((f) => { if (t > (f.w[0] + f.w[1]) / 2) { g.fillStyle = "#ff8a3d"; g.textAlign = "center"; g.fillText(f.name + " −" + f.e, X((f.w[0] + f.w[1]) / 2) + 40, Y(energyAt(f.w[1])) - 9); } });
    if (t > 0.93) { // 反応熱の矢印
      const x = R - 20; g.strokeStyle = "#ff8a3d"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, Y(0)); g.lineTo(x, Y(NET) - 5); g.stroke();
      g.beginPath(); g.moveTo(x - 5, Y(NET) - 10); g.lineTo(x, Y(NET)); g.lineTo(x + 5, Y(NET) - 10); g.fillStyle = "#ff8a3d"; g.fill();
      g.textAlign = "center"; g.fillText("反応熱 " + NET + " kJ(発熱) →", X(0.5), (Y(0) + Y(NET)) / 2);
    }
    const mx = X(t), my = Y(Ecur); halo(g, mx, my, 16, Ecur > TOTAL_IN * 0.5 ? COLD : WARM, 0.8);
    g.fillStyle = "#fff"; g.beginPath(); g.arc(mx, my, 3.5, 0, TAU); g.fill();
  }

  // ---- 反応ビューの操作 ----
  const playBtn = $("play");
  function setPlay(on) { rx.playing = on; playBtn.textContent = on ? "⏸" : "▶"; }
  function clearFx() { rx.parts = []; rx.flashes = []; rx.heat = 0; rx.cold = 0; }
  playBtn.onclick = () => { if (!rx.playing && rx.t >= 1) { rx.t = 0; clearFx(); } setPlay(!rx.playing); };
  $("replay").onclick = () => { rx.t = 0; clearFx(); setPlay(true); };
  $("seek").oninput = (e) => { rx.t = e.target.value / 1000; clearFx(); rx.fireFrom = undefined; };
  [["sp05", 0.5], ["sp1", 1], ["sp2", 2]].forEach(([id, v]) => { $(id).onclick = () => { rx.speed = v; ["sp05", "sp1", "sp2"].forEach((x) => $(x).classList.toggle("on", x === id)); }; });
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
  const atom = { cv: $("cvAt"), cam: newCam(0.5, -0.45), el: "O", ion: 0, nuc: null };
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
    atom.nuc = buildNucleus(d);
    $("atT").textContent = d.name; $("atS").textContent = "原子番号 " + d.z + " / 質量数 " + d.a;
    $("nP").textContent = d.z; $("nN").textContent = d.a - d.z; $("nE").textContent = e; $("nV").textContent = sh.length ? sh[sh.length - 1] : 0;
    $("cfg").textContent = sh.join("-"); $("chg").textContent = chg === 0 ? "0(中性)" : (chg > 0 ? "+" : "−") + Math.abs(chg);
    $("atNote").textContent = d.note;
    const b = $("ionBtn");
    if (d.ion) { b.classList.remove("hidden"); b.textContent = atom.ion ? "もとの原子にもどす" : d.ion < 0 ? "電子を 1 個手放す → " + atom.el + "⁺" : "電子を 1 個受け取る → " + atom.el + "⁻"; b.classList.toggle("on", !!atom.ion); }
    else b.classList.add("hidden");
    [...$("elChips").children].forEach((c) => c.classList.toggle("on", c.dataset.el === atom.el));
  }
  Object.keys(ELS).forEach((k) => {
    const b = document.createElement("button"); b.className = "btn"; b.textContent = k; b.dataset.el = k;
    b.onclick = () => { atom.el = k; atom.ion = 0; updateAtomInfo(); }; $("elChips").appendChild(b);
  });
  $("ionBtn").onclick = () => { const d = ELS[atom.el]; atom.ion = atom.ion ? 0 : d.ion; updateAtomInfo(); };

  function renderAt(now, dt) {
    const { g, W, H, cam } = atom, d = ELS[atom.el], e = d.z + atom.ion, sh = shellsOf(e);
    g.clearRect(0, 0, W, H);
    if (!cam.drag) cam.yaw += dt * 0.25;
    const rOf = (k) => 1.15 + 0.95 * k, rmax = rOf(Math.max(2, sh.length - 1));
    const unit = H * 0.5 / (rmax + 0.9), P = makeProj(cam, W, H, unit), items = [];
    halo(g, W / 2, H / 2, H * 0.28, [255, 150, 120], 0.25);
    // 原子核
    atom.nuc.items.forEach((n) => {
      const q = P(n.p), r = n.r * q.s, col = n.proton ? [255, 90, 90] : [150, 160, 190];
      items.push({ d: q.d, f: () => sphere(g, q.x, q.y, r, col, 0, 0) });
    });
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
  if (qs.has("t")) { rx.t = clamp(+qs.get("t")); setPlay(false); }
  if (qs.get("el") && ELS[qs.get("el")]) atom.el = qs.get("el");
  if (qs.get("tab") === "at") setTab("at");
  requestAnimationFrame(loop);
})();
