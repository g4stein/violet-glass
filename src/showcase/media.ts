/**
 * Films the showcase can load.
 *
 * MUX_PLAYBACK_ID is the public playback ID of the Violet Glass reel hosted on our own Mux account
 * (the challenge's Mux bonus). The reel's source file is public/reel/violet-glass-reel-v2.mp4.
 * A `?playbackId=` URL parameter overrides it for quick tests.
 */
export const MUX_PLAYBACK_ID = "";

export interface Track {
  kind: "subtitles" | "chapters";
  label: string;
  srclang: string;
  src: string;
}

export interface Reel {
  id: string;
  playbackId: string;
  posterTime: number;
  tracks?: Track[];
}

const REEL_TRACKS: Track[] = [
  { kind: "chapters", label: "Chapters", srclang: "en", src: "./reel/chapters.vtt" },
  { kind: "subtitles", label: "English", srclang: "en", src: "./reel/subtitles-en.vtt" },
  { kind: "subtitles", label: "Azərbaycanca", srclang: "az", src: "./reel/subtitles-az.vtt" },
  { kind: "subtitles", label: "日本語", srclang: "ja", src: "./reel/subtitles-ja.vtt" },
];

const DEMO_REELS: Reel[] = [
  {
    id: "dark",
    playbackId: "83EzHOvVzVN01AsrD01BCpiH02Pj3S8mfzBOu101w2nHC5s",
    posterTime: 32,
    tracks: [{ kind: "chapters", label: "Chapters", srclang: "en", src: "./cosmic-dawn-chapters.vtt" }],
  },
  {
    id: "bright",
    playbackId: "VcmKA6aqzIzlg3MayLJDnbF55kX00mds028Z65QxvBYaA",
    posterTime: 75,
  },
];

const PLAYBACK_ID_PATTERN = /^[A-Za-z0-9]{10,80}$/;

/** The films to offer, with our own Mux reel first when its playback ID is set. */
export function reels(): Reel[] {
  const fromUrl = new URLSearchParams(location.search).get("playbackId") ?? "";
  const own = PLAYBACK_ID_PATTERN.test(fromUrl) ? fromUrl : MUX_PLAYBACK_ID;
  if (!PLAYBACK_ID_PATTERN.test(own)) return DEMO_REELS;
  return [{ id: "reel", playbackId: own, posterTime: 4, tracks: REEL_TRACKS }, ...DEMO_REELS];
}

export const streamUrl = (reel: Reel) => `https://stream.mux.com/${reel.playbackId}.m3u8`;
export const posterUrl = (reel: Reel) =>
  `https://image.mux.com/${reel.playbackId}/thumbnail.webp?time=${reel.posterTime}&width=1600`;
