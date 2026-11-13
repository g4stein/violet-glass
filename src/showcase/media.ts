/**
 * Reels the showcase can load. To earn the Mux bonus, set `MUX_PLAYBACK_ID` to your own asset's public playback ID;
 * it becomes the first reel and plays by default. A `?playbackId=` URL parameter overrides it for quick tests.
 */
export const MUX_PLAYBACK_ID = '';

export interface Reel {
  id: string;
  label: string;
  note: string;
  playbackId: string;
  posterTime: number;
  chapters?: string;
}

const DEMO_REELS: Reel[] = [
  {
    id: 'dark',
    label: 'Dark reel',
    note: 'NASA Cosmic Dawn: night skies, clean rooms, chapters and captions.',
    playbackId: '83EzHOvVzVN01AsrD01BCpiH02Pj3S8mfzBOu101w2nHC5s',
    posterTime: 32,
    chapters: './cosmic-dawn-chapters.vtt',
  },
  {
    id: 'bright',
    label: 'Bright reel',
    note: 'Big Buck Bunny: saturated daylight and white skies behind the strip.',
    playbackId: 'VcmKA6aqzIzlg3MayLJDnbF55kX00mds028Z65QxvBYaA',
    posterTime: 75,
  },
];

const PLAYBACK_ID_PATTERN = /^[A-Za-z0-9]{10,80}$/;

/** The reels to offer, with the user's own Mux asset first when one is configured. */
export function reels(): Reel[] {
  const fromUrl = new URLSearchParams(location.search).get('playbackId') ?? '';
  const own = PLAYBACK_ID_PATTERN.test(fromUrl) ? fromUrl : MUX_PLAYBACK_ID;

  if (!PLAYBACK_ID_PATTERN.test(own)) return DEMO_REELS;

  return [
    { id: 'mine', label: 'My reel', note: 'Hosted on Mux.', playbackId: own, posterTime: 5 },
    ...DEMO_REELS,
  ];
}

export const streamUrl = (reel: Reel) => `https://stream.mux.com/${reel.playbackId}.m3u8`;
export const posterUrl = (reel: Reel) =>
  `https://image.mux.com/${reel.playbackId}/thumbnail.webp?time=${reel.posterTime}&width=1600`;
