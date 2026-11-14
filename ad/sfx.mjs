// Generates the demo video's sound effects with the ElevenLabs Sound Effects API.
// Usage: ELEVENLABS_API_KEY=... node ad/sfx.mjs <outDir> [name,...]
import { writeFileSync, mkdirSync } from "node:fs";

const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error("Set ELEVENLABS_API_KEY");
const out = process.argv[2] ?? ".ad-build/sfx";
const only = process.argv[3]?.split(",");
mkdirSync(out, { recursive: true });

export const SFX = {
  riser: ["Airy shimmering riser, soft glass harmonics swelling upward, cinematic, clean, no drums", 3.5],
  impact: ["Deep cinematic glass impact, soft sub boom with a long shimmering crystal tail, premium tech ad", 4],
  whoosh: ["Soft airy whoosh transition, smooth and quick, modern UI motion design", 1.2],
  swoosh: ["Gentle glass swoosh, light shimmer, sliding panel", 1],
  click: ["Single soft subtle UI click, muted glass tap, very short, clean", 0.5],
  tick: ["Delicate tiny glass ticks sliding quickly, scrubbing a timeline, subtle", 2.5],
  sparkle: ["Magical soft glass sparkle shimmer, gentle chime twinkle", 1.6],
  key: ["Single soft mechanical keyboard key press, quiet and clean", 0.5],
  rotate: ["Smooth mechanical rotation swish with a soft glass settle at the end", 1.4],
  end: ["Warm cinematic logo reveal, deep soft sub boom with a bright glass chime and airy tail", 5],
};

for (const [name, [text, duration]] of Object.entries(SFX)) {
  if (only && !only.includes(name)) continue;
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text, duration_seconds: duration, prompt_influence: 0.6 }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  writeFileSync(`${out}/${name}.mp3`, Buffer.from(await res.arrayBuffer()));
  console.log(name);
}
