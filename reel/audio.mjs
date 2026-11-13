// Synthesizes the reel's ambient soundtrack (36 s, 48 kHz stereo WAV). Original, no samples.
import { writeFileSync } from "node:fs";

const RATE = 48000, SECONDS = 36, N = RATE * SECONDS;
const L = new Float32Array(N), R = new Float32Array(N);
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// One chord per 9 s scene: Dmaj9, Bm9, Gmaj9, A(add9)
const chords = [[50, 57, 61, 64, 69], [47, 54, 57, 61, 66], [43, 50, 54, 57, 62], [45, 52, 57, 59, 64]];

const env = (t, start, len, attack = 2.5, release = 3) =>
  Math.min(1, Math.max(0, (t - start) / attack)) * Math.min(1, Math.max(0, (start + len - t) / release));

for (let i = 0; i < N; i++) {
  const t = i / RATE;
  let l = 0, r = 0;
  chords.forEach((chord, c) => {
    const start = c * 9 - (c ? 1.5 : 0), len = 9 + (c ? 1.5 : 0) + (c < 3 ? 1.5 : 0);
    const e = env(t, start, len);
    if (!e) return;
    chord.forEach((note, k) => {
      const f = hz(note + 12);
      const wob = 1 + 0.002 * Math.sin(2 * Math.PI * 0.2 * t + k);
      const v = (Math.sin(2 * Math.PI * f * wob * t) + 0.5 * Math.sin(2 * Math.PI * f * 2.003 * t)) * e * 0.035;
      l += v * (1 - k / 8);
      r += v * (0.4 + k / 8);
    });
    // Bass
    const b = Math.sin(2 * Math.PI * hz(chord[0] - 12) * t) * e * 0.08;
    l += b; r += b;
  });
  // Glass chime on each scene change and the end card
  for (const [at, note] of [[0.6, 81], [9, 78], [18, 74], [27, 76], [33.8, 81]]) {
    const d = t - at;
    if (d < 0 || d > 4) continue;
    const decay = Math.exp(-d * 1.6) * 0.09;
    const v = (Math.sin(2 * Math.PI * hz(note) * d) + 0.4 * Math.sin(2 * Math.PI * hz(note) * 2.76 * d)) * decay;
    l += v * 0.8; r += v;
  }
  // Soft pulse during the motion scene
  if (t > 18 && t < 27) {
    const beat = (t - 18) % 0.5;
    const k = Math.exp(-beat * 18) * 0.05 * env(t, 18, 9, 1, 1);
    const p = Math.sin(2 * Math.PI * 55 * beat) * k;
    l += p; r += p;
  }
  const fade = Math.min(1, t / 0.8) * Math.min(1, (SECONDS - t) / 1.6);
  L[i] = Math.tanh(l * fade * 1.4) * 0.8;
  R[i] = Math.tanh(r * fade * 1.4) * 0.8;
}

const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
}
writeFileSync(new URL("../.reel-build/audio.wav", import.meta.url), buf);
console.log("audio.wav written");
