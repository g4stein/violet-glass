// Builds the demo video's soundtrack: original music synthesized here, plus the ElevenLabs
// narration and sound effects placed to the frame. Music ducks under the voice.
// Writes .adwork/mix.wav (48 kHz stereo float), then ffmpeg normalizes loudness.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import ffmpeg from "ffmpeg-static";

const ROOT = new URL("../../.adwork/", import.meta.url).pathname;
const RATE = 48000, DUR = 61.5, N = Math.round(RATE * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const music = [new Float32Array(N), new Float32Array(N)];
const voiceBus = new Float32Array(N);
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const timeline = JSON.parse(readFileSync(new URL("./timeline.json", import.meta.url)));

// ---------- Music ----------
const BEAT = 0.6, START = 4.3; // 100 BPM, groove starts on the first impact
const CHORDS = [[50, 57, 61, 64, 69], [47, 54, 57, 62, 66], [43, 50, 54, 59, 62], [45, 52, 57, 59, 64]]; // Dmaj9 Bm9 Gmaj9 A6/9
const chordAt = (t) => CHORDS[Math.floor(Math.max(0, t - START) / (BEAT * 8)) % 4];
// Section levels (0..1) over time.
const env = (t, pts) => { for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return va + (vb - va) * clamp((t - a) / (b - a)); } return pts.at(-1)[1]; };
const drums = (t) => env(t, [[0, 0], [4.25, 0], [4.3, 1], [32.2, 1], [32.3, 0], [32.85, 0], [32.9, 1], [48.1, 1], [49.4, 0], [51.6, 0], [52.0, 0.55], [55.5, 0.55], [55.6, 0]]);
const padLvl = (t) => env(t, [[0, 0], [1.2, 0.8], [4.3, 1], [47.7, 1], [49.4, 0.75], [55.6, 0.9], [57, 1], [59.5, 0.8], [61.3, 0]]);
const bright = (t) => env(t, [[0, 0.25], [4.3, 0.55], [32.9, 0.8], [47.7, 0.8], [49.4, 0.2], [55.6, 0.6], [61, 0.3]]);
const arpLvl = (t) => env(t, [[0, 0], [8.9, 0], [9.6, 0.8], [32.2, 0.8], [32.3, 0], [32.9, 1], [47.7, 1], [49.2, 0], [55.6, 0]]);

let lpL = 0, lpR = 0;
for (let i = 0; i < N; i++) {
  const t = i / RATE;
  const chord = t >= 55.6 ? CHORDS[0] : chordAt(t);
  let l = 0, r = 0;
  // Pad: detuned partials through a moving one-pole low-pass.
  const pl = padLvl(t);
  if (pl > 0) {
    chord.forEach((m, k) => {
      const f = hz(m + 12);
      for (const [d, pan] of [[0.997, 0.8], [1.003, 0.2]]) {
        const ph = 2 * Math.PI * f * d * t + k;
        const v = (Math.sin(ph) + 0.33 * Math.sin(2 * ph) + 0.18 * Math.sin(3 * ph)) * 0.022 * pl;
        l += v * pan; r += v * (1 - pan);
      }
    });
  }
  // Low-pass amount follows `bright`.
  const a = 0.02 + 0.25 * bright(t);
  lpL += a * (l - lpL); lpR += a * (r - lpR);
  l = lpL * 2.2; r = lpR * 2.2;

  const dl = drums(t);
  const sinceStart = t - START;
  const beatPos = sinceStart >= 0 ? sinceStart % BEAT : -1;
  const eighth = sinceStart >= 0 ? sinceStart % (BEAT / 2) : -1;
  // Sidechain pump from the kick.
  const pump = dl > 0 && beatPos >= 0 ? 1 - 0.45 * dl * Math.exp(-beatPos * 9) : 1;
  l *= pump; r *= pump;
  // Sub bass on the chord root, 8th-note pulse.
  if (dl > 0 && eighth >= 0) {
    const b = Math.sin(2 * Math.PI * hz(chord[0] - 12) * t) * Math.exp(-eighth * 5) * 0.12 * dl;
    l += b; r += b;
  }
  // Kick: pitch-dropping sine.
  if (dl > 0 && beatPos >= 0 && beatPos < 0.35) {
    const f = 48 + 90 * Math.exp(-beatPos * 30);
    const k = Math.sin(2 * Math.PI * f * beatPos) * Math.exp(-beatPos * 11) * 0.3 * dl;
    l += k; r += k;
  }
  // Off-beat hat: filtered noise burst.
  if (dl > 0 && eighth >= 0) {
    const off = (sinceStart % BEAT) >= BEAT / 2;
    if (off && eighth < 0.06) {
      const n = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const h = n * Math.exp(-eighth * 70) * 0.05 * dl;
      l += h * 0.7; r += h;
    }
  }
  // Glass pluck arpeggio, 8th notes, alternating sides.
  const al = arpLvl(t);
  if (al > 0 && eighth >= 0) {
    const step = Math.floor(sinceStart / (BEAT / 2));
    const m = chord[[0, 2, 4, 3, 1, 4, 2, 3][step % 8]] + 24;
    const v = (Math.sin(2 * Math.PI * hz(m) * eighth) + 0.3 * Math.sin(2 * Math.PI * hz(m) * 2.01 * eighth)) * Math.exp(-eighth * 9) * 0.04 * al;
    if (step % 2) { l += v; r += v * 0.4; } else { l += v * 0.4; r += v; }
  }
  // Final chord bloom on the end card.
  if (t > 55.6) {
    const e = Math.min(1, (t - 55.6) / 0.3) * Math.exp(-(t - 55.6) * 0.35);
    CHORDS[0].forEach((m, k) => { const v = Math.sin(2 * Math.PI * hz(m) * t + k) * 0.03 * e; l += v; r += v; });
  }
  music[0][i] = l; music[1][i] = r;
}

// ---------- Decoding helper ----------
function decode(file) {
  const raw = execFileSync(ffmpeg, ["-v", "error", "-i", file, "-f", "f32le", "-ac", "2", "-ar", String(RATE), "-"], { maxBuffer: 1 << 28 });
  const f = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  return f;
}
function place(buf, at, gain, target = null, fadeOut = 0) {
  const start = Math.round(at * RATE), frames = buf.length / 2;
  for (let j = 0; j < frames; j++) {
    const i = start + j;
    if (i < 0 || i >= N) continue;
    const fo = fadeOut ? clamp((frames - j) / (fadeOut * RATE)) : 1;
    const gl = buf[2 * j] * gain * fo, gr = buf[2 * j + 1] * gain * fo;
    if (target) { target[i] += (Math.abs(gl) + Math.abs(gr)) / 2; }
    L[i] += gl; R[i] += gr;
  }
}

// ---------- Voice ----------
for (const [k, at] of timeline.voice.entries()) {
  const buf = decode(`${ROOT}voice/line${String(k).padStart(2, "0")}.mp3`);
  place(buf, at, 1.0, voiceBus);
}
// Ducking envelope from the voice: fast attack, slow release, -8 dB.
const duck = new Float32Array(N);
{
  let e = 0; const att = 1 - Math.exp(-1 / (0.03 * RATE)), rel = 1 - Math.exp(-1 / (0.45 * RATE));
  // Look ahead 80 ms so the music dips just before each phrase.
  const ahead = Math.round(0.08 * RATE);
  for (let i = 0; i < N; i++) {
    const x = voiceBus[Math.min(N - 1, i + ahead)] > 0.01 ? 1 : 0;
    e += (x > e ? att : rel) * (x - e);
    duck[i] = 1 - 0.5 * e;
  }
}
for (let i = 0; i < N; i++) { L[i] += music[0][i] * duck[i] * 0.28; R[i] += music[1][i] * duck[i] * 0.28; }

// ---------- Sound effects ----------
const sfxCache = {};
const sfx = (name) => (sfxCache[name] ??= decode(`${ROOT}sfx/${name}.mp3`));
for (const [name, at, gain, fade] of timeline.sfx) place(sfx(name), at, gain, null, fade ?? 0);

// Stem levels (RMS dBFS) for a balance check.
{
  const rms = (a, b, from, to) => { let s = 0, n = 0; for (let i = Math.round(from * RATE); i < Math.round(to * RATE); i++) { s += a[i] * a[i]; n++; } return (10 * Math.log10(s / n)).toFixed(1); };
  const m = music[0].map((v, i) => v * duck[i] * 0.28);
  console.log("music RMS under voice 9.8-14.6:", rms(m, null, 9.8, 14.6), "dB; music alone 0.2-1.2:", rms(music[0], null, 0.2, 1.2), "dB; full mix 9.8-14.6:", rms(L, null, 9.8, 14.6), "dB");
}
// ---------- Master: gentle fade and soft clip ----------
for (let i = 0; i < N; i++) {
  const t = i / RATE;
  const f = Math.min(1, t / 0.3) * clamp((DUR - 0.3 - t) / 1.2);
  L[i] = Math.tanh(L[i] * f * 0.9); R[i] = Math.tanh(R[i] * f * 0.9);
}
const out = Buffer.alloc(N * 8);
for (let i = 0; i < N; i++) { out.writeFloatLE(L[i], i * 8); out.writeFloatLE(R[i], i * 8 + 4); }
writeFileSync(`${ROOT}mix.f32`, out);
execFileSync(ffmpeg, ["-y", "-v", "error", "-f", "f32le", "-ar", String(RATE), "-ac", "2", "-i", `${ROOT}mix.f32`,
  "-af", "loudnorm=I=-14:TP=-1.0:LRA=9", "-ar", String(RATE), "-c:a", "pcm_s16le", `${ROOT}mix.wav`]);
console.log("mix.wav written");
