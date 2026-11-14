// Generates one narration clip per script line with ElevenLabs (with word timings).
// Usage: ELEVENLABS_API_KEY=... node ad/voice.mjs <outDir>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error("Set ELEVENLABS_API_KEY");
const out = process.argv[2] ?? ".ad-build/voice";
mkdirSync(out, { recursive: true });
const { voice, model, lines } = JSON.parse(readFileSync(new URL("./script.json", import.meta.url)));
const only = process.argv[3] ? process.argv[3].split(",").map(Number) : null;

for (const [i, text] of lines.entries()) {
  if (only && !only.includes(i)) continue;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: model,
      previous_text: lines.slice(0, i).join(" ") || undefined,
      next_text: lines.slice(i + 1).join(" ") || undefined,
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true, speed: 0.95 },
    }),
  });
  if (!res.ok) throw new Error(`line ${i}: ${res.status} ${await res.text()}`);
  const j = await res.json();
  writeFileSync(`${out}/line${String(i).padStart(2, "0")}.mp3`, Buffer.from(j.audio_base64, "base64"));
  writeFileSync(`${out}/line${String(i).padStart(2, "0")}.json`, JSON.stringify(j.alignment));
  console.log(i, text);
}
