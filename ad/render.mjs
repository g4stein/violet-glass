// Renders the compositor to JPEG frames: node ad/render.mjs [from] [to] [step]   (seconds)
// With a step (e.g. 0.5) it writes preview stills instead of every frame.
import { mkdirSync } from "node:fs";
import { launch, serve, ROOT } from "./lib.mjs";

const FPS = 30, DURATION = 61;
const from = Number(process.argv[2] ?? 0), to = Number(process.argv[3] ?? DURATION), step = process.argv[4] ? Number(process.argv[4]) : null;
const out = `${ROOT}${step ? "stills" : "comp"}`;
mkdirSync(out, { recursive: true });
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
await serve(ctx, "..");
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("page error:", e.message));
page.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
await page.goto("https://vg.test/violet-glass/ad/compose.html");
await page.evaluate(() => window.ready);
const frames = step ? Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => Math.round((from + i * step) * FPS))
  : Array.from({ length: Math.round((to - from) * FPS) }, (_, i) => Math.round(from * FPS) + i);
for (const f of frames) {
  await page.evaluate((t) => window.render(t), f / FPS);
  await page.screenshot({ path: `${out}/f${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 95 });
}
console.log(frames.length, "frames ->", out);
await browser.close();
