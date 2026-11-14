// Shared helpers for the demo-video renders: a headless Chrome page that serves the built
// ad pages from disk, with a fake clock and frame-exact CSS animations.
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const require = createRequire(import.meta.url);
const PW = process.env.PLAYWRIGHT_PATH ??
  "/inner_container/opt/toolchains/.nvm/versions/node/v22.23.4/lib/node_modules/@playwright/mcp/node_modules/playwright";
export const { chromium } = require(PW);

export const ROOT = new URL("../../.adwork/", import.meta.url).pathname;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".mp4": "video/mp4", ".vtt": "text/vtt",
  ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".webp": "image/webp" };

export async function launch() {
  return chromium.launch({
    executablePath: "/usr/local/bin/chrome",
    env: { ...process.env, HOME: "/tmp" },
    args: ["--disable-crash-reporter", "--no-zygote", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required", "--disable-gpu-vsync", "--force-color-profile=srgb", "--hide-scrollbars"],
  });
}

/** Serves https://vg.test/<path> from .adwork/<dir>/<path>, with Range support for video. */
export async function serve(ctx, dir) {
  await ctx.route("https://vg.test/**", async (route) => {
    const path = decodeURIComponent(route.request().url().replace("https://vg.test/", "").split("?")[0]);
    const file = join(ROOT, dir, path);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "nf" });
    const body = readFileSync(file);
    const type = TYPES[extname(file)] ?? "application/octet-stream";
    const range = route.request().headers()["range"];
    if (range) {
      const [a, b] = range.replace("bytes=", "").split("-");
      const start = Number(a), end = b ? Number(b) : body.length - 1;
      return route.fulfill({ status: 206, body: body.subarray(start, end + 1), headers: {
        "content-type": type, "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${body.length}`, "access-control-allow-origin": "*" } });
    }
    return route.fulfill({ status: 200, body, headers: { "content-type": type, "accept-ranges": "bytes", "access-control-allow-origin": "*" } });
  });
}

/** Installed in the page: pins every running CSS animation/transition to the fake timeline. */
export const FREEZE = `
window.__anim = new Map();
window.__simT = 0;
window.__pin = () => {
  for (const a of document.getAnimations()) {
    if (!window.__anim.has(a)) window.__anim.set(a, window.__simT);
    a.pause();
    a.currentTime = (window.__simT - window.__anim.get(a)) * 1000;
  }
};
`;

/** Advances the page by one frame of `dt` seconds: timers, then CSS animations. */
export async function tick(page, dt) {
  await page.clock.runFor(Math.round(dt * 1000));
  await page.evaluate((dt) => { window.__simT += dt; window.__pin(); }, dt);
  await page.evaluate(() => { window.__simT += 0; window.__pin(); });
}

/** Shows video time `vt` and waits for that frame to be painted. */
export async function seek(page, vt) {
  // The page clock is fake, so the timeout lives on the Node side.
  const done = page.evaluate(async (vt) => {
    const v = document.querySelector("mux-video, video");
    if (Math.abs(v.currentTime - vt) < 0.001) return;
    await new Promise((res) => {
      v.addEventListener("seeked", res, { once: true });
      v.currentTime = vt;
    });
  }, vt);
  await Promise.race([done, new Promise((r) => setTimeout(r, 3000))]);
}
