# Violet Glass demo video

The 61-second, 1600×1200 (4:3) demo video for the challenge submission: `submission/violet-glass-demo.mp4`.

Everything on screen is the real Violet Glass player, recorded frame by frame in headless Chrome, then composited with motion graphics. Build output goes to `../.adwork/`, outside the repo.

1. `script.json` holds the narration. `voice.mjs` generates one ElevenLabs clip per line, with word timings.
2. `sfx.mjs` generates the sound effects with ElevenLabs.
3. `capture.html` and `capture.ts` mount the skin around the reel or the Cosmic Dawn trailer from Mux. Build them with `npx vite build --config ad/vite.config.ts`.
4. `shoot.mjs` records each shot. Each frame it runs scripted mouse, touch and keyboard input, advances a fake clock by 1/30 s, pins CSS animations to that clock, seeks the film and takes a screenshot. It also saves pointer and focus positions.
5. `compose.html` and `compose.js` draw the final frames. `render.mjs` renders them.
6. `mix.mjs` synthesizes the music, places the voice and effects from `timeline.json`, ducks the music under the voice and normalizes loudness.
7. Encode:

```sh
ffmpeg -framerate 30 -i ../.adwork/comp/f%04d.jpg -i ../.adwork/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 21 -tune film -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k -shortest submission/violet-glass-demo.mp4
```

The ElevenLabs scripts read the key from `ELEVENLABS_API_KEY`. Never commit it.

Credits: footage is from NASA's Cosmic Dawn trailer and our own reel. Voice (Lily) and sound effects are by ElevenLabs (elevenlabs.io). The music is original and synthesized in `mix.mjs`.
