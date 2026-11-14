// Violet Glass demo video compositor (1600 x 1200, 30 fps).
// render(t) draws the frame at time t: motion-graphics layers around frame-exact recordings of the
// real player (see shoot.mjs). Every time below is tied to the narration in timeline.json.
"use strict";

const W = 1600, H = 1200, FPS = 30;
const SHOT_DIR = "../../.adwork/shots/";
const $ = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; };
const scene = document.getElementById("scene");
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (x) => 1 - (1 - clamp(x)) ** 3;
const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2; };
const easeBack = (x) => { x = clamp(x); const c = 1.4; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const prog = (t, a, b) => clamp((t - a) / (b - a));
/** 0 → 1 over [a, a+fi], 1 → 0 over [b-fo, b]. */
const win = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(easeOut(prog(t, a, a + fi)), 1 - easeInOut(prog(t, b - fo, b)));

// ---------- Timeline (seconds). Shot `at` = global time of the shot's first frame. ----------
const SHOTS = {
  float: { at: 4.3 }, scrub: { at: 14.6 }, settings: { at: 20.4 }, bar: { at: 28.1 },
  tablet: { at: 33.2 }, phone: { at: 34.0 }, landscape: { at: 40.2 }, keys: { at: 44.2 },
};
const DESK = [ // desktop shots in order, with the time each one takes over
  ["float", 4.3], ["scrub", 14.6], ["settings", 20.4], ["bar", 28.1], ["keys", 44.0],
];
const STREAKS = [4.25, 14.5, 20.3, 28.0, 32.85, 40.0, 43.95, 50.75, 55.55];
const TITLES = [
  { a: 4.75, b: 9.45, eyebrow: "Video.js 10 skin", head: "<span class=grad>Violet Glass</span>", sub: "Frosted violet glass, soft rim light, a neon timeline." },
  { a: 9.8, b: 14.45, eyebrow: "Floating controls", head: "Glass over the picture.", sub: "Controls step aside while you watch." },
  { a: 15.35, b: 20.2, eyebrow: "Timeline", head: "Scrub with a live preview.", sub: "Storyboard thumbnails and chapter titles, streamed from Mux." },
  { a: 20.95, b: 27.85, eyebrow: "Settings", head: "One quiet menu.", sub: "Speed · Quality · Subtitles in English, Azerbaijani, Japanese" },
  { a: 28.15, b: 32.55, eyebrow: "Desktop", head: "Centered where you look.", sub: "Full-width timeline on top. Back, play and forward in the middle." },
  { a: 32.95, b: 38.75, eyebrow: "Tablet & phone", head: "Glass orbs, thumb-sized.", sub: "Big targets over the picture. A slim dock below." },
  { a: 39.05, b: 43.75, eyebrow: "Android", head: "Fullscreen turns landscape.", sub: "The screen locks to landscape when fullscreen starts." },
  { a: 44.55, b: 47.35, eyebrow: "Accessibility", head: "Keyboard ready.", sub: "Every control, with a visible focus ring." },
  { a: 47.45, b: 50.75, eyebrow: "Accessibility", head: "Motion that calms down.", sub: "Follows your system's reduced-motion setting." },
  { a: 51.75, b: 55.45, eyebrow: "Under the glass", head: "Streamed by Mux.<br>Built on Video.js.", sub: "" },
];
const OPEN_WORDS = [["Every", 1.3], ["film", 1.74], ["deserves", 2.01], ["better", 2.41], ["glass.", 2.66]];

// ---------- Background: drifting aurora that can calm down ----------
const bg = document.getElementById("bg").getContext("2d");
// Drift speed: normal, then eases to nearly still when "reduced motion" turns on (49.3 s).
const speed = (t) => lerp(1, 0.07, easeInOut(prog(t, 49.2, 50.4)));
const phaseTable = []; { let p = 0; for (let f = 0; f <= 62 * FPS; f++) { phaseTable.push(p); p += speed(f / FPS) / FPS; } }
const phase = (t) => phaseTable[clamp(Math.round(t * FPS), 0, phaseTable.length - 1)];
const BLOBS = [
  ["124,58,237", 520, 0.21, 0.13, 0.0], ["219,39,119", 440, 0.17, 0.19, 1.7],
  ["79,70,229", 600, 0.11, 0.23, 3.1], ["168,85,247", 380, 0.27, 0.09, 4.4],
];
function drawBg(t, glow) {
  const p = phase(t);
  bg.globalCompositeOperation = "source-over";
  bg.fillStyle = "#070416"; bg.fillRect(0, 0, W, H);
  bg.globalCompositeOperation = "lighter";
  for (const [rgb, r, fx, fy, o] of BLOBS) {
    const x = W / 2 + Math.sin(p * fx * 6 + o) * 520, y = H / 2 + Math.cos(p * fy * 6 + o * 1.3) * 380;
    const g = bg.createRadialGradient(x, y, 0, x, y, r * 1.6);
    g.addColorStop(0, `rgba(${rgb},${0.30 * glow})`); g.addColorStop(1, `rgba(${rgb},0)`);
    bg.fillStyle = g; bg.fillRect(0, 0, W, H);
  }
  bg.globalCompositeOperation = "source-over";
  // Fine star dust drifting slowly to the left.
  for (let i = 0; i < 90; i++) {
    const sx = ((i * 397.3 + 1600 - p * (8 + (i % 5) * 6)) % 1600 + 1600) % 1600, sy = (i * 211.7) % 1200;
    bg.fillStyle = `rgba(230,220,255,${(0.15 + (i % 7) / 18) * glow})`;
    bg.fillRect(sx, sy, i % 3 ? 1.5 : 2.5, i % 3 ? 1.5 : 2.5);
  }
  const v = bg.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1000);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(2,0,10,0.75)");
  bg.fillStyle = v; bg.fillRect(0, 0, W, H);
}
const grain = document.getElementById("grain").getContext("2d");
const grainImg = grain.createImageData(400, 300);
function drawGrain(f) {
  let s = (f * 9301 + 49297) % 233280;
  for (let i = 0; i < grainImg.data.length; i += 4) {
    s = (s * 9301 + 49297) % 233280; const v = (s / 233280) * 255;
    grainImg.data[i] = grainImg.data[i + 1] = grainImg.data[i + 2] = v; grainImg.data[i + 3] = 255;
  }
  grain.putImageData(grainImg, 0, 0);
}
document.getElementById("grain").style.cssText += "width:1600px;height:1200px;image-rendering:pixelated";

// ---------- Layers ----------
const open = $(`<div id="open">${OPEN_WORDS.map(([w]) => `<span class="w">${w} </span>`).join("")}</div>`);
const line = $(`<div id="line"></div>`), lineHead = $(`<div id="lineHead"></div>`);
const titles = TITLES.map((d) => {
  const el = $(`<div class="title"><div class="eyebrow">${d.eyebrow}</div><div class="head">${d.head}</div>${d.sub ? `<div class="sub">${d.sub}</div>` : ""}</div>`);
  return { ...d, el, parts: [...el.children] };
});

// Desktop frame: base 1440 x 810 at (80, 300). Two image slots for slide transitions.
const desk = $(`<div class="frame" style="left:80px;top:300px;width:1440px;height:810px">
  <div class="zoom abs" style="inset:0">
    <img class="a"><img class="b">
    <svg id="cursor" viewBox="0 0 24 24"><path d="M3 2l17 9.5-7.4 1.8L9.2 21z" fill="#fff" stroke="#2a0f5a" stroke-width="1.4" stroke-linejoin="round"/></svg>
  </div><div class="glare"></div></div>`);
const deskZoom = desk.querySelector(".zoom"), deskA = desk.querySelector("img.a"), deskB = desk.querySelector("img.b");
const cursor = desk.querySelector("#cursor");
const ripples = [0, 1].map(() => $(`<div class="ripple"></div>`));
ripples.forEach((r) => deskZoom.append(r));

const tablet = $(`<div class="device" id="tablet" style="width:792px;height:460px"><div class="screen"><img style="inset:0;width:100%;height:100%"></div></div>`);
const tabletImg = tablet.querySelector("img");
const phone = $(`<div class="device" id="phone" style="width:382px;height:795px"><div class="screen">
  <div class="portrait abs" style="inset:0">
    <div class="notch"></div>
    <div class="page-mock" style="top:74px"><div class="eyebrow" style="font-size:11px;letter-spacing:3px">Video.js v10 skin</div>
      <div style="font-size:30px;font-weight:600;letter-spacing:-1px;margin-top:4px">Violet Glass</div></div>
    <img class="p" style="left:0;top:150px;width:354px;height:199px">
    <div class="page-mock" style="top:376px"><div style="font-size:15px;font-weight:600">The Voyage to Cosmic Dawn</div>
      <div class="bar" style="width:92%"></div><div class="bar" style="width:76%"></div><div class="bar" style="width:84%"></div>
      <div style="display:flex;gap:8px;margin-top:22px">${["Reel", "Cosmic Dawn", "Bunny"].map((x, i) => `<span style="font-size:12px;padding:7px 12px;border-radius:20px;background:${i === 1 ? "#a855f7" : "#ffffff1a"}">${x}</span>`).join("")}</div>
      <div class="bar" style="width:88%;margin-top:30px"></div><div class="bar" style="width:64%"></div></div>
  </div>
  <img class="l" style="left:-206.5px;top:206.5px;width:767px;height:354px;transform:rotate(90deg)">
  <div class="ripple"></div>
</div></div>`);
const phonePortrait = phone.querySelector(".portrait"), phoneP = phone.querySelector("img.p"), phoneL = phone.querySelector("img.l");
const phoneRipple = phone.querySelector(".ripple");

const keycap = $(`<div class="abs" style="right:80px;top:96px;display:flex;gap:14px;align-items:center"><div class="key">Tab</div></div>`);
const keyEl = keycap.querySelector(".key");
const motionPill = $(`<div class="glasspill" style="right:80px;top:110px"><span>Reduce motion</span><div class="switch"><i></i></div></div>`);
const sw = motionPill.querySelector(".switch"), swKnob = motionPill.querySelector(".switch i");
const badgeMux = $(`<div class="badge" style="width:640px"><b>Mux Video</b><span>HLS streaming · storyboard thumbnails · our reel is hosted on our own Mux account</span></div>`);
const badgeVjs = $(`<div class="badge" style="width:640px"><b>Video.js 10</b><span>@videojs/html player · custom skin, icons and layouts · Apache-2.0</span></div>`);
const streak = $(`<div id="streak"></div>`);
const endCard = $(`<div id="end">
  <div class="logo"><span class="w grad">Violet</span> <span class="w grad">Glass</span></div>
  <div class="tag">Made for film.</div>
  <div class="url">violet-glass.vercel.app<br><span style="font-size:24px;color:#bfaef0">github.com/g4stein/violet-glass</span></div>
  <div class="credits">A Video.js 10 skin for the Video.js Skins Design Challenge · Recorded from the real player in Chrome<br>
  Footage: Cosmic Dawn trailer, NASA · Voice and sound effects: ElevenLabs (elevenlabs.io) · Music: original, synthesized in code</div>
</div>`);
const endLine = $(`<div class="abs" style="left:800px;top:700px;height:4px;border-radius:4px;background:linear-gradient(90deg,#9333ea,#ec4899 70%,#f472b6);box-shadow:0 0 20px #ec4899"></div>`);

scene.append(desk, tablet, phone, open, line, lineHead, ...titles.map((x) => x.el), keycap, motionPill, badgeMux, badgeVjs, endCard, endLine, streak);

// ---------- Shot data ----------
const tracks = {};
async function load() {
  await document.fonts.load("600 76px 'DM Sans'"); await document.fonts.load("400 28px 'DM Sans'");
  await document.fonts.load("700 150px 'DM Sans'"); await document.fonts.load("500 26px 'DM Sans'");
  for (const name of Object.keys(SHOTS)) tracks[name] = await (await fetch(`${SHOT_DIR}${name}/track.json`)).json();
}
const frameIndex = (name, t) => clamp(Math.round((t - SHOTS[name].at) * FPS), 0, tracks[name].frames.length - 1);
const frameUrl = (name, t) => `${SHOT_DIR}${name}/f${String(frameIndex(name, t)).padStart(4, "0")}.jpg`;
const pending = [];
function setImg(img, url) {
  if (img.dataset.src === url) return;
  img.dataset.src = url; img.src = url; pending.push(img.decode().catch(() => {}));
}
/** Most recent frame with `key` set, within `span` seconds before t; returns seconds since. */
function since(name, t, key, span) {
  const fr = tracks[name].frames, i = frameIndex(name, t);
  for (let j = i; j >= 0 && (i - j) / FPS <= span; j--) if (fr[j][key]) return { dt: (i - j) / FPS + ((t - SHOTS[name].at) * FPS - i) / FPS, ev: fr[j] };
  return null;
}

// ---------- Frame ----------
const show = (el, o) => { el.style.opacity = o.toFixed(3); el.style.visibility = o > 0.001 ? "visible" : "hidden"; };

function renderTitles(t) {
  for (const ti of titles) {
    const on = t > ti.a - 0.05 && t < ti.b + 0.05;
    show(ti.el, on ? 1 : 0);
    if (!on) continue;
    const out = easeInOut(prog(t, ti.b - 0.4, ti.b));
    ti.parts.forEach((p, i) => {
      const k = easeOut(prog(t, ti.a + i * 0.09, ti.a + i * 0.09 + 0.55));
      const o = k * (1 - out);
      p.style.opacity = o.toFixed(3);
      p.style.transform = `translateY(${((1 - k) * 26 - out * 14).toFixed(2)}px)`;
      p.style.filter = `blur(${((1 - k) * 10 + out * 8).toFixed(2)}px)`;
    });
  }
}

function deskShotAt(t) {
  let cur = null, prev = null;
  for (const [name, at] of DESK) if (t >= at) { prev = cur; cur = [name, at]; }
  return { cur, prev };
}

function renderDesk(t) {
  // Visibility and big moves of the desktop frame.
  let o = 0, sx = 1, tx = 0, ty = 0, rx = 0, clip = 0;
  if (t >= 4.3 && t < 33.7) {
    const k = easeInOut(prog(t, 4.3, 5.3));
    clip = (1 - k) * 402; o = 1;
    rx = (1 - easeOut(prog(t, 4.3, 6.6))) * 16;
    const out = easeInOut(prog(t, 32.9, 33.65));
    sx = lerp(1, 0.42, out); tx = lerp(0, -560, out); ty = lerp(0, 160, out); o = 1 - out;
  } else if (t >= 43.95 && t < 56.5) {
    const k = easeOut(prog(t, 43.95, 44.7));
    o = k; sx = lerp(0.82, 1, k);
    const shrink = easeInOut(prog(t, 50.8, 51.6));
    sx *= lerp(1, 0.62, shrink); ty = lerp(0, -150, shrink);
    const end = easeInOut(prog(t, 55.45, 56.0));
    sx *= lerp(1, 0.86, end); o *= 1 - end;
  }
  show(desk, o);
  if (o <= 0) return;
  desk.style.transform = `perspective(1800px) translate(${tx}px,${ty}px) rotateX(${rx}deg) scale(${sx})`;
  desk.style.clipPath = clip > 0 ? `inset(${clip}px 0 ${clip}px 0 round 22px)` : "none";

  // Which recordings are showing; slide old out and new in over 0.5 s.
  const { cur, prev } = deskShotAt(t);
  const kSlide = easeInOut(prog(t, cur[1], cur[1] + 0.5));
  setImg(deskA, frameUrl(cur[0], t));
  deskA.style.transform = `translateX(${((1 - kSlide) * 7).toFixed(2)}%) scale(${lerp(1.04, 1, kSlide).toFixed(4)})`;
  deskA.style.filter = `blur(${((1 - kSlide) * 12).toFixed(1)}px)`;
  deskA.style.opacity = kSlide.toFixed(3);
  if (prev && kSlide < 1) {
    setImg(deskB, frameUrl(prev[0], t));
    show(deskB, 1 - kSlide);
    deskB.style.transform = `translateX(${(-kSlide * 7).toFixed(2)}%)`;
    deskB.style.filter = `blur(${(kSlide * 12).toFixed(1)}px)`;
    deskB.style.zIndex = 0; deskA.style.zIndex = 1;
  } else show(deskB, 0);
  if (!prev && cur[0] === "float") deskA.style.opacity = 1, deskA.style.transform = "none", deskA.style.filter = "none";

  // Bar close-up (desktop transport): zoom into the bottom bar.
  const z = cur[0] === "bar" ? lerp(1, 1.85, easeInOut(prog(t, 28.7, 30.3))) : 1;
  deskZoom.style.transformOrigin = "50% 93%";
  deskZoom.style.transform = `scale(${z.toFixed(4)})`;

  // Cursor and click ripples, in recorded CSS pixels (1280 wide) scaled to the frame.
  const name = cur[0], tr = tracks[name], ev = tr.frames[frameIndex(name, t)];
  const s = 1440 / tr.w;
  const p = ev.pointer && kSlide > 0.6 ? ev.pointer : null;
  show(cursor, p ? 1 : 0);
  if (p) cursor.style.transform = `translate(${(p[0] * s).toFixed(1)}px,${(p[1] * s).toFixed(1)}px) scale(${since(name, t, "click", 0.15) ? 0.86 : 1})`;
  const hits = [since(name, t, "click", 0.6), since(name, t, "press", 0.6)].filter(Boolean);
  ripples.forEach((r, i) => {
    const h = hits[i];
    if (!h || !h.ev.pointer) return show(r, 0);
    const k = easeOut(h.dt / 0.6), rad = lerp(8, 46, k);
    show(r, 1 - k);
    r.style.left = `${h.ev.pointer[0] * s - rad}px`; r.style.top = `${h.ev.pointer[1] * s - rad}px`;
    r.style.width = r.style.height = `${rad * 2}px`;
  });
}

function renderDevices(t) {
  // Tablet: enters at 33.0, leaves left at 38.8.
  const tIn = easeOut(prog(t, 33.0, 33.8)), tOut = easeInOut(prog(t, 38.75, 39.5));
  const to = tIn * (1 - tOut);
  show(tablet, to);
  if (to > 0) {
    setImg(tabletImg, frameUrl("tablet", t));
    tablet.style.left = `${74 + (1 - tIn) * 80 - tOut * 700}px`; tablet.style.top = "490px";
    tablet.style.transform = `perspective(1600px) rotateY(${((1 - tIn) * -18 + 8).toFixed(2)}deg) scale(${lerp(0.9, 1, tIn).toFixed(3)})`;
  }
  // Phone: enters 33.8, moves to centre 39.0, rotates 40.0-41.0, leaves 44.0.
  const pIn = easeOut(prog(t, 33.8, 34.7)), pOut = easeInOut(prog(t, 43.95, 44.6));
  const po = pIn * (1 - pOut);
  show(phone, po);
  if (po <= 0) return;
  const toCenter = easeInOut(prog(t, 38.9, 39.7));
  const rot = easeInOut(prog(t, 40.0, 41.0));
  const cx = lerp(1180, 800, toCenter), cy = lerp(700, 690, rot);
  const sc = lerp(lerp(0.92, 1, pIn), 1.62, easeInOut(prog(t, 40.0, 41.1))) * lerp(1, 0.9, pOut);
  phone.style.left = `${cx - 191}px`; phone.style.top = `${cy - 397.5 + (1 - pIn) * 60}px`;
  phone.style.transform = `perspective(1600px) rotateY(${(lerp(-10, 0, toCenter) * (1 - rot)).toFixed(2)}deg) rotate(${(-90 * easeBack(prog(t, 40.0, 41.0))).toFixed(2)}deg) scale(${sc.toFixed(4)})`;
  setImg(phoneP, frameUrl("phone", Math.min(t, 41.3)));
  const swap = easeInOut(prog(t, 40.25, 40.75));
  show(phonePortrait, 1 - swap);
  show(phoneL, swap);
  if (swap > 0) setImg(phoneL, frameUrl("landscape", t));
  // Tap on the fullscreen button (366, 196 in the 393 x 221 phone player) at 39.65.
  const k = prog(t, 39.65, 40.25);
  show(phoneRipple, k > 0 && k < 1 ? 1 - easeOut(k) : 0);
  const rad = lerp(6, 34, easeOut(k)), fx = 366 * 0.9, fy = 150 + 196 * 0.9;
  phoneRipple.style.left = `${fx - rad}px`; phoneRipple.style.top = `${fy - rad}px`;
  phoneRipple.style.width = phoneRipple.style.height = `${rad * 2}px`;
}

function renderWidgets(t) {
  // Tab keycap, pressed on every recorded Tab.
  const kv = win(t, 44.6, 47.3, 0.4, 0.3);
  show(keycap, kv);
  if (kv > 0) {
    const hit = since("keys", t, "key", 0.22);
    const d = hit ? 1 - hit.dt / 0.22 : 0;
    keyEl.style.transform = `translateY(${(d * 6).toFixed(2)}px)`;
    keyEl.style.boxShadow = `inset 0 2px 1px #ffffff40, 0 ${(8 - d * 6).toFixed(1)}px 0 #120b2c, 0 18px 40px #05011acc, 0 0 ${(d * 40).toFixed(0)}px #e879f9`;
    keycap.style.transform = `translateY(${((1 - easeOut(prog(t, 44.6, 45.0))) * 20).toFixed(1)}px)`;
  }
  // Reduced-motion switch flips on "ask" (47.7 s).
  const mv = win(t, 47.4, 50.75, 0.4, 0.4);
  show(motionPill, mv);
  if (mv > 0) {
    const on = easeInOut(prog(t, 47.75, 48.05));
    swKnob.style.transform = `translateX(${(on * 28).toFixed(1)}px)`;
    sw.style.background = on > 0.5 ? "linear-gradient(90deg,#9333ea,#ec4899)" : "#ffffff26";
    motionPill.style.transform = `translateY(${((1 - easeOut(prog(t, 47.4, 47.8))) * 20).toFixed(1)}px)`;
  }
  // Badges on "Mux" (52.5) and "Video.js" (53.66).
  [[badgeMux, 52.35, 130], [badgeVjs, 53.5, 830]].forEach(([b, at, x]) => {
    const k = easeOut(prog(t, at, at + 0.6)), o = k * (1 - easeInOut(prog(t, 55.3, 55.8)));
    show(b, o);
    b.style.left = `${x}px`; b.style.top = `${880 + (1 - k) * 40}px`;
    b.style.filter = `blur(${((1 - k) * 8).toFixed(1)}px)`;
  });
}

function renderOpening(t) {
  // Line draws 0.35-1.35 s across the middle; head glides with it.
  const draw = easeInOut(prog(t, 0.35, 1.35)), fade = easeInOut(prog(t, 4.4, 4.9));
  const lo = (t < 4.9 ? 1 : 0) * (1 - fade) * easeOut(prog(t, 0.2, 0.5));
  show(line, lo); show(lineHead, lo * (1 - easeInOut(prog(t, 4.0, 4.4))));
  line.style.left = "80px"; line.style.top = "702px"; line.style.width = "1440px";
  line.style.transform = `scaleX(${draw.toFixed(4)})`;
  lineHead.style.left = `${80 + 1440 * draw}px`; lineHead.style.top = "705px";
  show(open, t < 4.4 ? 1 : 0);
  if (t < 4.4) {
    const out = easeInOut(prog(t, 3.55, 4.25));
    [...open.children].forEach((w, i) => {
      const k = easeOut(prog(t, OPEN_WORDS[i][1] - 0.05, OPEN_WORDS[i][1] + 0.45));
      w.style.opacity = (k * (1 - out)).toFixed(3);
      w.style.transform = `translateY(${((1 - k) * 30 - out * 40).toFixed(1)}px)`;
      w.style.filter = `blur(${((1 - k) * 14 + out * 12).toFixed(1)}px)`;
    });
    open.lastElementChild.className = "w grad";
  }
}

function renderEnd(t) {
  const k = easeOut(prog(t, 55.75, 56.6));
  show(endCard, t > 55.7 ? 1 : 0);
  const kids = [...endCard.children];
  const logoWords = [...kids[0].children];
  logoWords.forEach((w, i) => {
    const a = easeOut(prog(t, 55.95 + i * 0.3, 56.6 + i * 0.3));
    w.style.opacity = a.toFixed(3); w.style.filter = `blur(${((1 - a) * 18).toFixed(1)}px)`;
    w.style.transform = `translateY(${((1 - a) * 30).toFixed(1)}px) scale(${lerp(1.08, 1, a).toFixed(3)})`;
  });
  [[kids[1], 57.2], [kids[2], 57.9], [kids[3], 58.3]].forEach(([el, at]) => {
    const a = easeOut(prog(t, at, at + 0.6));
    el.style.opacity = a.toFixed(3); el.style.transform = `translateY(${((1 - a) * 18).toFixed(1)}px)`;
  });
  const lw = easeInOut(prog(t, 57.1, 57.9)) * 560;
  show(endLine, t > 57.1 ? 1 : 0);
  endLine.style.left = `${800 - lw / 2}px`; endLine.style.width = `${lw}px`;
  const fadeOut = easeInOut(prog(t, 60.2, 61.0));
  scene.style.opacity = (1 - fadeOut).toFixed(3);
  return k;
}

function renderStreak(t) {
  let best = null;
  for (const s of STREAKS) if (t >= s && t < s + 0.6) best = s;
  show(streak, best === null ? 0 : 1);
  if (best !== null) streak.style.left = `${lerp(-500, 1700, easeInOut(prog(t, best, best + 0.6)))}px`;
}

window.render = async (t) => {
  pending.length = 0;
  const end = clamp((t - 60.2) / 0.8);
  drawBg(t, lerp(0.55, 1, easeOut(prog(t, 0, 3))) * (1 - end));
  drawGrain(Math.round(t * FPS));
  renderOpening(t); renderTitles(t); renderDesk(t); renderDevices(t); renderWidgets(t); renderEnd(t); renderStreak(t);
  await Promise.all(pending);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
};
window.ready = load();
