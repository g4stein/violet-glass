# Violet Glass reel

An original 36-second, 1080p30 motion piece made for the skin. Everything is generated in code: no stock footage, samples or third-party assets.

- `scene.html` is a deterministic animation. Decorative glass spheres stay near the edges and carry no icons, so nothing in the film looks like a real player button. Titles sit in the upper half, clear of the controls and subtitles. `render(t)` draws the frame at time `t` using canvas, CSS 3D and SVG. It has four 9-second scenes (Night Glass, Daylight, Made for Film, Every Screen) that alternate dark and very bright backgrounds, to show the controls stay readable over both.
- `audio.mjs` synthesizes the ambient soundtrack (chords, glass chimes, soft pulse) to `.reel-build/audio.wav`.
- Frames were captured with headless Chromium (Playwright screenshots of `render(frame / 30)`), then encoded with `ffmpeg-static`:

```sh
ffmpeg -framerate 30 -i .reel-build/frames/f%04d.jpg -i .reel-build/audio.wav \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 160k -shortest public/reel/violet-glass-reel-v2.mp4
```

Subtitles (`public/reel/subtitles-{en,az,ja}.vtt`) and chapters (`public/reel/chapters.vtt`) are attached by the showcase as text tracks.
