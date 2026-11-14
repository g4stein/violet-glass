// Records the real Violet Glass player, frame by frame, for each shot of the demo video.
// Each frame: run scheduled input, advance the fake clock 1/30 s, pin CSS animations, seek the
// film, screenshot. Pointer positions are saved so the compositor can draw a cursor or tap.
// Usage: node ad/shoot.mjs [shotName,...]
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { launch, serve, FREEZE, tick, seek, ROOT } from "./lib.mjs";

const FPS = 30;
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const lerp = (a, b, k) => a + (b - a) * k;
/** Pointer path helper: glide from p to q between t0 and t1. */
const glide = (t, t0, t1, p, q) => {
  const k = ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
  return [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
};
const box = async (page, sel) => {
  const b = await page.locator(sel).filter({ visible: true }).first().boundingBox();
  return [b.x + b.width / 2, b.y + b.height / 2];
};

const SHOTS = {
  // Desktop playing over space footage: pointer wakes the controls, then leaves; controls fade out.
  float: {
    w: 1280, h: 720, dpr: 1.25, film: "cosmic", start: 4, dur: 11.4,
    pointer: (t) => (t < 7.6 ? glide(t, 0.6, 2.2, [1180, 300], [760, 430]) : null),
  },
  // Desktop transport close-up material: pointer rests near play, tooltips appear.
  bar: {
    w: 1280, h: 720, dpr: 1.25, film: "cosmic", start: 33, dur: 4.6,
    async init(page, s) { s.play = await box(page, "media-play-button"); s.fwd = await box(page, "media-seek-button[seconds=\"10\"], media-seek-button:not([seconds^=\"-\"])"); },
    pointer: (t, s) => (t < 2.2 ? glide(t, 0, 1.2, [800, 520], s.play) : glide(t, 2.2, 3.0, s.play, [s.play[0] + 58, s.play[1]])),
  },
  // Scrubbing: press on the timeline and drag, preview thumbnail + chapter title follow.
  scrub: {
    w: 1280, h: 720, dpr: 1.25, film: "cosmic", start: 12, dur: 6.4,
    async init(page, s) { const b = await page.locator("media-time-slider").filter({ visible: true }).first().boundingBox(); s.y = b.y + b.height / 2; s.x0 = b.x; s.wd = b.width; },
    pointer(t, s) {
      if (t < 1.0) return glide(t, 0, 1.0, [700, 470], [s.x0 + s.wd * 0.12, s.y]);
      if (t < 4.2) return [s.x0 + s.wd * lerp(0.12, 0.72, ease((t - 1.0) / 3.2)), s.y];
      return [s.x0 + s.wd * 0.72, s.y];
    },
    down: [1.1, 4.4],
    film: "cosmic",
  },
  // Settings: open, Speed submenu, pick 1.5x, back, Subtitles, pick Azerbaijani, close. Reel film for subtitles.
  settings: {
    w: 1280, h: 720, dpr: 1.25, film: "reelmux", start: 1.2, dur: 8.0,
    pointerFrom: [760, 460],
    // Timed to the narration: "Speed, quality, and subtitles in three languages, all in one quiet menu."
    steps: [
      [0.45, ".ew-gear"],
      [0.85, "hover:.ew-menu-root media-menu-item[commandfor$='-speed']"],
      [1.25, "hover:.ew-menu-root media-menu-item[commandfor$='-quality']"],
      [1.95, ".ew-menu-root media-menu-item[commandfor$='-subs']"],
      [3.2, "media-menu-radio-item:has-text('Azərbaycanca')"],
      [5.6, "press:Escape"],
    ],
  },
  // Tablet: orbs over the picture.
  tablet: {
    w: 720, h: 405, dpr: 2, film: "cosmic", start: 58, dur: 5.6, touch: true,
    pointer: (t) => [720 * 0.5 + 8 * Math.sin(t * 4), 405 * 0.18], hidePointer: true,
  },
  // Phone portrait (POCO-like 393 px wide): tap to wake, orbs and slim dock.
  phone: {
    w: 393, h: 221, dpr: 3, film: "cosmic", start: 75, dur: 7.4, touch: true,
    pointer: (t) => [393 * 0.5 + 8 * Math.sin(t * 4), 221 * 0.18], hidePointer: true,
  },
  // Phone in landscape fullscreen (Android rotates): full-bleed 852 x 393.
  landscape: {
    w: 852, h: 393, dpr: 2, film: "cosmic", start: 88, dur: 4.4, touch: true, radius: 0,
    pointer: (t) => [852 * 0.5 + 8 * Math.sin(t * 4), 393 * 0.18], hidePointer: true,
  },
  // Keyboard: Tab walks through every control with the focus ring.
  keys: {
    w: 1280, h: 720, dpr: 1.25, film: "cosmic", start: 20, dur: 6.4,
    keys: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5].map((t) => [t, "Tab"]),
  },
};

const want = process.argv[2]?.split(",");
const browser = await launch();

for (const [name, shot] of Object.entries(SHOTS)) {
  if (want && !want.includes(name)) continue;
  const ctx = await browser.newContext({
    viewport: { width: shot.w, height: shot.h }, deviceScaleFactor: shot.dpr,
    hasTouch: !!shot.touch, isMobile: !!shot.touch,
  });
  await serve(ctx, "dist");
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(name, "page error:", e.message));
  await page.clock.install();
  await page.addInitScript(FREEZE);
  await page.goto(`https://vg.test/ad/capture.html?w=${shot.w}&h=${shot.h}&film=${shot.film}`);
  if (shot.radius === 0) await page.addStyleTag({ content: ".media-skin{--media-border-radius:0px}" });
  await page.waitForFunction(() => document.querySelector("mux-video, video")?.readyState >= 3, null, { timeout: 30000 });
  await page.evaluate(async () => {
    const v = document.querySelector("mux-video, video");
    await v.play();
  });
  await seek(page, shot.start);
  // Let thumbnails, fonts and the first frame settle in real time.
  await page.waitForTimeout(1500);
  for (let i = 0; i < 4; i++) await tick(page, 1 / FPS);
  const state = {};
  if (shot.init) {
    await page.mouse.move(shot.w / 2, shot.h * 0.6);
    for (let i = 0; i < 8; i++) await tick(page, 1 / FPS);
    await shot.init(page, state);
  }

  const dir = `${ROOT}shots/${name}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const track = [];
  let vt = shot.start, rate = 1, pointer = shot.pointerFrom ?? null, isDown = false;
  const n = Math.round(shot.dur * FPS);
  const steps = [...(shot.steps ?? [])], keys = [...(shot.keys ?? [])], taps = [...(shot.taps ?? [])];
  let glideTo = null;

  for (let f = 0; f < n; f++) {
    const t = f / FPS;
    const ev = { t };
    if (shot.pointer) {
      const p = shot.pointer(t, state);
      if (p) { await page.mouse.move(p[0], p[1]); pointer = p; }
      else if (pointer) { await page.mouse.move(shot.w + 40, shot.h / 2); pointer = null; }
    }
    if (shot.down) {
      if (!isDown && t >= shot.down[0] && t < shot.down[1]) { await page.mouse.down(); isDown = true; ev.press = true; }
      if (isDown && t >= shot.down[1]) { await page.mouse.up(); isDown = false; ev.release = true; }
    }
    // Menu steps: glide the pointer for 0.5 s, then click (or press a key).
    while (steps.length && t >= steps[0][0] - 0.5 && !glideTo) {
      const [at, sel] = steps[0];
      if (sel.startsWith("press:")) { glideTo = { at, key: sel.slice(6) }; break; }
      const hover = sel.startsWith("hover:");
      const target = await box(page, hover ? sel.slice(6) : sel);
      glideTo = { at, from: pointer ?? [shot.w / 2, shot.h / 2], to: target, sel: hover ? sel.slice(6) : sel, hover };
    }
    if (glideTo && glideTo.to) {
      const p = glide(t, glideTo.at - 0.5, glideTo.at - 0.08, glideTo.from, glideTo.to);
      await page.mouse.move(p[0], p[1]); pointer = p;
    }
    if (glideTo && t >= glideTo.at) {
      if (glideTo.key) await page.keyboard.press(glideTo.key);
      else if (glideTo.hover) { const to = await box(page, glideTo.sel); await page.mouse.move(to[0], to[1]); pointer = to; }
      else {
        // Re-aim in case the panel moved while it animated in.
        const to = await box(page, glideTo.sel);
        await page.mouse.move(to[0], to[1]); pointer = to;
        await page.mouse.click(to[0], to[1]); ev.click = true;
      }
      steps.shift(); glideTo = null;
    }
    while (keys.length && t >= keys[0][0]) { await page.keyboard.press(keys[0][1]); ev.key = keys.shift()[1]; }
    while (taps.length && t >= taps[0][0]) { const [, p] = taps.shift(); await page.touchscreen.tap(p[0], p[1]); ev.tap = p; }

    await tick(page, 1 / FPS);
    rate = await page.evaluate(() => document.querySelector("mux-video, video").playbackRate);
    // While the user drags the timeline, the player seeks itself; follow it afterwards.
    if (isDown) vt = await page.evaluate(() => document.querySelector("mux-video, video").currentTime);
    else { await seek(page, vt); vt += rate / FPS; }
    await page.screenshot({ path: `${dir}/f${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 93 });
    ev.pointer = shot.hidePointer ? null : pointer;
    ev.focus = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const r = a.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height];
    });
    track.push(ev);
  }
  writeFileSync(`${dir}/track.json`, JSON.stringify({ w: shot.w, h: shot.h, dpr: shot.dpr, frames: track }));
  console.log(name, n, "frames");
  await ctx.close();
}
await browser.close();
