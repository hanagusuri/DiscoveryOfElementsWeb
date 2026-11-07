// 効果音(Web Audio による合成)と演出(粒子・画面の揺れ・バナー・振動)
(function () {
  "use strict";
  const KEY = "eod_fx";
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S = { sound: true, vol: 0.6, haptic: true, visual: !reduce };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  // ---------------- 音 ----------------
  const A = { ctx: null, master: null, noise: null, echo: null };
  function ensure() {
    if (!S.sound) return false;
    try {
      if (!A.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
        A.ctx = new AC(); A.master = A.ctx.createGain(); A.master.gain.value = S.vol;
        const comp = A.ctx.createDynamicsCompressor(); A.master.connect(comp); comp.connect(A.ctx.destination);
        const len = A.ctx.sampleRate * 1.5, b = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        A.noise = b;
        // 余韻(エコー)
        const dl = A.ctx.createDelay(1); dl.delayTime.value = 0.17; const fb = A.ctx.createGain(); fb.gain.value = 0.33; const wet = A.ctx.createGain(); wet.gain.value = 0.5;
        A.echo = A.ctx.createGain(); A.echo.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(A.master);
      }
      if (A.ctx.state === "suspended") A.ctx.resume();
      A.master.gain.value = S.vol;
      return true;
    } catch (e) { return false; }
  }
  function tone(f, dur, o) {
    o = o || {}; const c = A.ctx, t0 = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || "sine"; osc.frequency.setValueAtTime(f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.gain || 0.15, t0 + (o.attack || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(A.master); if (o.echo) g.connect(A.echo);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  function noise(dur, o) {
    o = o || {}; const c = A.ctx, t0 = c.currentTime + (o.delay || 0);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = A.noise; src.loop = true; f.type = o.type || "lowpass"; f.frequency.setValueAtTime(o.f0 || 1000, t0); f.Q.value = o.q || 0.7;
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.gain || 0.15, t0 + (o.attack || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(A.master); src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
  }
  const SCALE = { material: [523, 659, 784], compound: [587, 740, 880], tool: [392, 523, 659], element: [784, 988, 1175, 1568], concept: [523, 587, 659, 784, 880, 1047] };
  const SND = {
    tap() { tone(720, 0.05, { type: "triangle", gain: 0.06 }); },
    add() { tone(520, 0.08, { type: "triangle", gain: 0.11, to: 780 }); },
    remove() { tone(430, 0.09, { type: "triangle", gain: 0.09, to: 250 }); },
    tick() { tone(900, 0.03, { type: "square", gain: 0.035 }); },
    tab() { noise(0.18, { type: "bandpass", f0: 400, f1: 2600, gain: 0.07 }); },
    run(o) { // ぶくぶく泡
      for (let i = 0; i < 9; i++) tone(260 + Math.random() * 520, 0.09, { gain: 0.06, delay: i * 0.095 + Math.random() * 0.04, to: 500 + Math.random() * 600 });
      noise(0.85, { type: "lowpass", f0: 500, f1: 200, gain: 0.05 });
      if (o && o.fire) for (let i = 0; i < 14; i++) noise(0.04, { type: "highpass", f0: 3000, gain: 0.07, delay: Math.random() * 0.85 });
      if (o && o.elec) for (let i = 0; i < 6; i++) tone(90 + Math.random() * 60, 0.06, { type: "sawtooth", gain: 0.05, delay: Math.random() * 0.8, to: 400 });
    },
    discover(types, n) {
      const order = ["concept", "element", "tool", "compound", "material"], top = order.find((t) => types.includes(t)) || "material", notes = SCALE[top];
      const total = Math.min(notes.length + Math.max(0, types.length - 1), 8);
      for (let i = 0; i < total; i++) tone(notes[i % notes.length] * (i >= notes.length ? 2 : 1), 0.38, { type: top === "tool" ? "square" : top === "concept" ? "sine" : "triangle", gain: top === "tool" ? 0.07 : 0.15, delay: i * 0.085, echo: top === "concept" || top === "element" });
      if (top === "tool") { noise(0.15, { type: "bandpass", f0: 2200, gain: 0.1 }); tone(330, 0.4, { type: "square", gain: 0.05 }); }
      if (top === "element") for (let i = 0; i < 4; i++) tone(2100 + Math.random() * 1500, 0.12, { gain: 0.05, delay: 0.3 + i * 0.07 });
    },
    known() { tone(520, 0.1, { gain: 0.08 }); tone(520, 0.1, { gain: 0.06, delay: 0.12 }); },
    near() { tone(330, 0.25, { type: "triangle", gain: 0.09, to: 520 }); tone(520, 0.18, { type: "triangle", gain: 0.07, delay: 0.22, to: 600 }); },
    fail() { tone(300, 0.18, { type: "triangle", gain: 0.1, to: 200 }); tone(210, 0.28, { type: "triangle", gain: 0.1, delay: 0.16, to: 130 }); },
    accident(sev) {
      const s = sev || 2;
      noise(0.35 + s * 0.3, { type: "lowpass", f0: 2400, f1: 70, gain: 0.32 + s * 0.08 });
      tone(70, 0.5 + s * 0.2, { gain: 0.35, to: 28 });
      if (s >= 2) tone(900, 0.2, { type: "sawtooth", gain: 0.06, to: 150, delay: 0.05 });
      if (s >= 3) { noise(0.5, { type: "highpass", f0: 1500, gain: 0.12, delay: 0.25 }); tone(45, 0.9, { gain: 0.3, to: 22, delay: 0.15 }); }
    },
    ding() { tone(988, 0.3, { gain: 0.13, echo: true }); tone(1319, 0.45, { gain: 0.13, delay: 0.12, echo: true }); },
    sparkle() { [1568, 1976, 2349, 2637].forEach((f, i) => tone(f, 0.2, { gain: 0.06, delay: i * 0.06, echo: true })); },
    era() { [[262, 330, 392], [294, 370, 440], [330, 415, 494], [392, 494, 587]].forEach((ch, k) => ch.forEach((f) => tone(f, 0.55, { type: "sawtooth", gain: 0.045, delay: k * 0.22, attack: 0.04, echo: true }))); },
    tech() { noise(0.12, { type: "bandpass", f0: 1800, gain: 0.14 }); tone(220, 0.3, { type: "square", gain: 0.06 }); tone(440, 0.5, { gain: 0.1, delay: 0.14, to: 660, echo: true }); },
    collect() { tone(660, 0.12, { type: "triangle", gain: 0.1 }); tone(880, 0.25, { type: "triangle", gain: 0.1, delay: 0.1, echo: true }); },
    build() { tone(392, 0.15, { gain: 0.1 }); tone(587, 0.2, { gain: 0.1, delay: 0.1 }); noise(0.12, { type: "highpass", f0: 4000, gain: 0.06, delay: 0.25 }); },
    repair() { for (let i = 0; i < 3; i++) { noise(0.05, { type: "bandpass", f0: 1500, gain: 0.1, delay: i * 0.11 }); tone(260, 0.06, { type: "square", gain: 0.05, delay: i * 0.11 }); } },
    phase() { for (let i = 0; i < 7; i++) tone(1400 + Math.random() * 1400, 0.06, { gain: 0.04, delay: i * 0.05 }); noise(0.4, { type: "bandpass", f0: 1200, gain: 0.05 }); },
    coin() { tone(1319, 0.08, { type: "square", gain: 0.05 }); tone(1760, 0.18, { type: "square", gain: 0.05, delay: 0.07 }); },
    down() { tone(330, 0.2, { type: "triangle", gain: 0.08, to: 180 }); },
  };
  function play(name, a, b) { if (!S.sound || !ensure()) return; try { SND[name] && SND[name](a, b); } catch (e) {} }
  const vib = (p) => { if (S.haptic && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } };

  // ---------------- 演出(粒子) ----------------
  let cv = null, g2 = null, parts = [], raf = null;
  function canvas() {
    if (cv) return true;
    cv = document.createElement("canvas"); cv.id = "fxCanvas"; document.body.appendChild(cv); g2 = cv.getContext("2d");
    const rs = () => { cv.width = innerWidth; cv.height = innerHeight; }; rs(); addEventListener("resize", rs);
    return true;
  }
  function emit(n, x, y, o) {
    if (!S.visual) return; canvas();
    for (let i = 0; i < n; i++) {
      const a = (o.angle !== undefined ? o.angle : Math.random() * Math.PI * 2) + (Math.random() - 0.5) * (o.spread || 6.28), sp = (o.speed || 4) * (0.4 + Math.random() * 0.9);
      parts.push({ x: x + (Math.random() - 0.5) * (o.jx || 0), y: y + (Math.random() - 0.5) * (o.jy || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: (o.life || 60) * (0.6 + Math.random() * 0.7), size: (o.size || 5) * (0.5 + Math.random()), g: o.g === undefined ? 0.12 : o.g, color: o.colors[Math.floor(Math.random() * o.colors.length)], shape: o.shape || "rect", rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 });
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function loop() {
    g2.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => p.life < p.max && p.y < cv.height + 40);
    parts.forEach((p) => {
      p.life++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr;
      const a = Math.max(0, 1 - p.life / p.max); g2.globalAlpha = a; g2.fillStyle = p.color; g2.strokeStyle = p.color;
      if (p.shape === "circle") { g2.beginPath(); g2.arc(p.x, p.y, p.size / 2, 0, 6.28); g2.stroke(); }
      else if (p.shape === "dot") { g2.beginPath(); g2.arc(p.x, p.y, p.size / 2, 0, 6.28); g2.fill(); }
      else if (p.shape === "line") { g2.lineWidth = 2; g2.beginPath(); g2.moveTo(p.x, p.y); g2.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5); g2.stroke(); }
      else { g2.save(); g2.translate(p.x, p.y); g2.rotate(p.rot); g2.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66); g2.restore(); }
    });
    g2.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(loop) : null;
    if (!raf) g2.clearRect(0, 0, cv.width, cv.height);
  }
  const TYPE_COL = { concept: ["#c9a0f0", "#ffd86b", "#8bd3ff", "#fff"], element: ["#6ec1b0", "#9fe8d6", "#ffd86b", "#fff"], tool: ["#7db8e8", "#cfe3ff", "#e8a33d"], compound: ["#e8a33d", "#ffcf7a", "#ff9a5a"], material: ["#ece6d8", "#e8a33d", "#cfd3dc"] };
  function flash(color, ms) {
    if (!S.visual) return; let f = document.getElementById("fxFlash");
    if (!f) { f = document.createElement("div"); f.id = "fxFlash"; document.body.appendChild(f); }
    f.style.transition = "none"; f.style.background = color; f.style.opacity = "0.55"; void f.offsetWidth; f.style.transition = `opacity ${ms || 500}ms`; f.style.opacity = "0";
  }
  function shake(power) {
    if (!S.visual) return; const b = document.body; b.style.setProperty("--shk", (power || 1) * 6 + "px"); b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
    setTimeout(() => b.classList.remove("shake"), 520);
  }
  function banner(text, sub) {
    if (!S.visual) return; let b = document.getElementById("fxBanner");
    if (!b) { b = document.createElement("div"); b.id = "fxBanner"; document.body.appendChild(b); }
    b.innerHTML = `<div class="bt">${text}</div><div class="bs">${sub || ""}</div>`; b.classList.remove("on"); void b.offsetWidth; b.classList.add("on");
    setTimeout(() => b.classList.remove("on"), 3000);
  }
  const rectOf = (sel) => { const e = document.querySelector(sel); if (!e) return { x: innerWidth / 2, y: innerHeight / 3 }; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, b: r.bottom }; };

  // ---------------- ゲームからのイベント ----------------
  const FAIL = /何も起こらなかった|ほとんど得られなかった|足りない|まだ何も出てこない|揺らいで|逃げてしまう|混ざってしまう|分けきれない|分けられない|反応が進まない|邪魔|溶け出して|台無し|消えてしまう/;
  const api = {
    onSay(t) {
      if (/^発見:|⚠ 事故/.test(t)) return;
      if (/何かが起きそうだ|もう一つ何かが足りない/.test(t)) return play("near");
      if (/既に知っている/.test(t)) return play("known");
      if (/滴定成功|反応式を完成/.test(t)) return play("ding");
      if (/蒸留: .*を取り出した/.test(t)) { play("collect"); const r = rectOf("#bench"); emit(18, r.x, r.y, { colors: TYPE_COL.compound, speed: 3, spread: 6.28, g: 0.08, shape: "dot", size: 4, life: 45 }); return; }
      if (/濃縮された/.test(t)) return play("tick");
      if (/電池を組んだ/.test(t)) return play("build");
      if (/作り直した/.test(t)) return play("repair");
      if (/研究完了/.test(t)) return play("tech");
      if (/融けて|沸騰|凝固|昇華|凝華|凝縮/.test(t) && /^[^…]+: /.test(t)) { play("phase"); const r = rectOf("#bench"); emit(14, r.x, r.y, { colors: ["#cfe8ff", "#fff", "#8bd3ff"], speed: 2.5, shape: "circle", size: 7, g: -0.03, life: 50 }); return; }
      if (FAIL.test(t)) { play("fail"); vib(25); }
    },
    onToast(m) {
      if (/新時代へ/.test(m)) { play("era"); banner("新時代へ", m.replace(/^新時代へ:\s*/, "")); const c = TYPE_COL.concept; emit(60, innerWidth / 2, innerHeight * 0.3, { colors: c, speed: 6, spread: 6.28, g: 0.1, life: 90 }); vib([30, 40, 60]); return; }
      if (/新しい知識|得た|安全第一/.test(m)) { play("sparkle"); const r = rectOf("#pt"); emit(12, r.x, r.y, { colors: TYPE_COL.concept, speed: 2.5, shape: "dot", size: 4, g: 0.02, life: 50 }); return; }
      if (/^正解|成功/.test(m)) { play("ding"); emit(30, innerWidth / 2, innerHeight * 0.45, { colors: TYPE_COL.material.concat(["#ffd86b"]), speed: 5, life: 70 }); vib(20); }
    },
    discover(types, gain) {
      const top = ["concept", "element", "tool", "compound", "material"].find((t) => types.includes(t)) || "material";
      play("discover", types, gain);
      vib(top === "concept" || top === "element" ? [20, 30, 40] : 20);
      const card = document.getElementById("card");
      if (card) { card.classList.remove("fx-concept", "fx-element", "fx-tool", "fx-compound", "fx-material"); card.classList.add("fx-" + top); setTimeout(() => card.classList.remove("fx-" + top), 3500); }
      const n = Math.min(90, 28 + types.length * 14 + (top === "concept" || top === "element" ? 24 : 0));
      emit(n, innerWidth / 2, innerHeight * 0.38, { colors: TYPE_COL[top], speed: 7, spread: 6.28, g: 0.14, life: 90, size: 7, jx: 20 });
      flash(top === "concept" ? "#c9a0f0" : top === "element" ? "#6ec1b0" : "#e8a33d", 600);
    },
    accident(sev) {
      const s = sev || 2; play("accident", s); vib(s >= 3 ? [80, 40, 160, 40, 200] : s === 2 ? [60, 40, 120] : [50]);
      shake(s); flash("#d84040", 700);
      const r = rectOf("#bench"); emit(30 + s * 20, r.x, r.y, { colors: ["#ffcf3a", "#ff8a30", "#ff4a30", "#fff3b0"], speed: 7 + s * 2, spread: 6.28, g: 0.22, life: 55, shape: "line", size: 6 });
      emit(10 + s * 8, r.x, r.y, { colors: ["#5a5a64", "#8a8a96"], speed: 2.5, g: -0.02, shape: "dot", size: 22, life: 70 });
    },
    bench(o) { const b = document.getElementById("bench"); if (!b) return; b.classList.toggle("heat", !!o.fire); b.classList.toggle("elec", !!o.elec); b.classList.toggle("cold", !!o.cold); },
  };

  // ---------------- 入力・クリック音 / ポイント演出 ----------------
  function wire() {
    document.addEventListener("pointerdown", () => ensure(), { once: true });
    document.addEventListener("click", (e) => {
      const t = e.target; if (!t || !t.closest) return;
      if (t.closest("#btnRun")) {
        const filled = document.querySelectorAll(".slot.filled").length; if (!filled) { play("fail"); return; }
        const slots = [...document.querySelectorAll(".slot.filled .sbody small")].map((s) => s.textContent);
        const fire = slots.includes("火"), elec = slots.includes("電気");
        play("run", { fire, elec }); vib(15);
        const r = rectOf("#bench"); const o = { colors: fire ? ["#ffcf3a", "#ff8a30", "#ff6a20"] : elec ? ["#7fe7ff", "#d8f8ff"] : ["#cfe8ff", "#8bd3ff", "#fff"], speed: 1.8, angle: -1.57, spread: 1.2, g: fire ? -0.05 : -0.025, shape: fire || elec ? "dot" : "circle", size: fire || elec ? 4 : 9, life: 70, jx: (r.w || 200) * 0.6 };
        for (let k = 0; k < 6; k++) setTimeout(() => emit(5, r.x, r.b ? r.b - 10 : r.y, o), k * 140);
        return;
      }
      if (t.closest("[data-id]") && t.closest(".item")) return play("add");
      if (t.closest("[data-slot]")) return play("remove");
      if (t.closest("[data-amt]")) return play("tick");
      if (t.closest("[data-tech]")) { const b = t.closest("[data-tech]"); if (!b.disabled) play("tech"); return; }
      if (t.closest("#tabs button")) return play("tab");
      if (t.closest("button")) return play("tap");
    });
    // ポイントの増減を浮かび上がらせる
    const pt = document.getElementById("pt");
    if (pt && window.MutationObserver) {
      let prev = +pt.textContent || 0;
      new MutationObserver(() => {
        const cur = +pt.textContent || 0, d = cur - prev; prev = cur; if (!d) return;
        if (d > 0) setTimeout(() => play("coin"), 120);
        if (!S.visual) return;
        const r = pt.getBoundingClientRect(), f = document.createElement("div");
        f.className = "ptfloat " + (d > 0 ? "up" : "down"); f.textContent = (d > 0 ? "+" : "") + d; f.style.left = r.left + r.width / 2 + "px"; f.style.top = r.top + "px";
        document.body.appendChild(f); setTimeout(() => f.remove(), 1400);
      }).observe(pt, { childList: true, characterData: true, subtree: true });
    }
    renderSettings();
  }

  // ---------------- 設定(図鑑タブ) ----------------
  function renderSettings() {
    const host = document.getElementById("fxSettings"); if (!host) return;
    host.innerHTML = `<div class="fxbox"><div class="stt">🔊 音と演出</div>` +
      `<label class="fxrow"><input type="checkbox" id="fxSnd" ${S.sound ? "checked" : ""}> 効果音</label>` +
      `<label class="fxrow"><span>音量</span><input type="range" id="fxVol" min="0" max="1" step="0.05" value="${S.vol}"></label>` +
      `<label class="fxrow"><input type="checkbox" id="fxVib" ${S.haptic ? "checked" : ""}> 振動(対応する端末)</label>` +
      `<label class="fxrow"><input type="checkbox" id="fxVis" ${S.visual ? "checked" : ""}> 演出(紙吹雪・揺れ・フラッシュ)</label>` +
      `<button id="fxTest" class="mini">テスト音</button></div>`;
    const $ = (id) => document.getElementById(id);
    $("fxSnd").onchange = (e) => { S.sound = e.target.checked; save(); if (S.sound) play("ding"); };
    $("fxVol").oninput = (e) => { S.vol = +e.target.value; save(); if (A.master) A.master.gain.value = S.vol; };
    $("fxVol").onchange = () => play("tap");
    $("fxVib").onchange = (e) => { S.haptic = e.target.checked; save(); vib(30); };
    $("fxVis").onchange = (e) => { S.visual = e.target.checked; save(); if (S.visual) api.discover(["element"], 1); };
    $("fxTest").onclick = () => { play("discover", ["concept"], 1); };
  }

  window.FX = Object.assign(api, { play, settings: S, emit, flash, shake, banner, renderSettings });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
