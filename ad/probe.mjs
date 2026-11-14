// Debug helper: prints control positions for a player size.
import { launch, serve } from "./lib.mjs";
const [w, h] = (process.argv[2] ?? "393x221").split("x").map(Number);
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
await serve(ctx, "dist");
const page = await ctx.newPage();
await page.goto(`https://vg.test/ad/capture.html?w=${w}&h=${h}&film=reel`);
await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2);
await page.waitForTimeout(800);
console.log(await page.evaluate(() => ["media-fullscreen-button", "media-play-button", "media-seek-button"].flatMap((s) =>
  [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return `${s} ${Math.round(r.x + r.width / 2)},${Math.round(r.y + r.height / 2)} ${Math.round(r.width)}`; })).join("\n")));
await browser.close();
