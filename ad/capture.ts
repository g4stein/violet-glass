// Capture page for the demo video: the real Violet Glass skin around a local copy of the reel,
// with Mux storyboard thumbnails. ?w=&h= set the player size, ?lang= the interface language.
import "@videojs/html/media/mux-video";
import { renderSkin } from "../src/skin/skin";
import { MUX_PLAYBACK_ID } from "../src/showcase/media";

const params = new URLSearchParams(location.search);
const w = Number(params.get("w") ?? 1280);
const h = Number(params.get("h") ?? 720);
const stage = document.getElementById("stage")!;
stage.style.width = `${w}px`;
stage.style.height = `${h}px`;

const tracks = [
  `<track kind="metadata" label="thumbnails" src="https://image.mux.com/${MUX_PLAYBACK_ID}/storyboard.vtt" default>`,
  `<track kind="chapters" label="Chapters" srclang="en" src="../reel/chapters.vtt" default>`,
  `<track kind="subtitles" label="English" srclang="en" src="../reel/subtitles-en.vtt">`,
  `<track kind="subtitles" label="Azərbaycanca" srclang="az" src="../reel/subtitles-az.vtt">`,
  `<track kind="subtitles" label="日本語" srclang="ja" src="../reel/subtitles-ja.vtt">`,
].join("");

// ?film=cosmic plays the NASA Cosmic Dawn trailer from Mux (the showcase's second film).
const COSMIC = "83EzHOvVzVN01AsrD01BCpiH02Pj3S8mfzBOu101w2nHC5s";
// Mux supplies its own storyboard thumbnails, so drop ours.
const subs = tracks.replace(/<track kind="metadata"[^>]*>/, "");
const film = params.get("film");
const media =
  film === "reelmux"
    ? `<mux-video src="https://stream.mux.com/${MUX_PLAYBACK_ID}.m3u8" playsinline crossorigin preload="auto">${subs}</mux-video>`
    : film === "cosmic"
    ? `<mux-video src="https://stream.mux.com/${COSMIC}.m3u8" playsinline crossorigin preload="auto"><track kind="chapters" label="Chapters" srclang="en" src="../cosmic-dawn-chapters.vtt" default></mux-video>`
    : `<video src="../reel/violet-glass-reel-v2.mp4" playsinline crossorigin="anonymous" preload="auto">${tracks}</video>`;
const player = document.createElement("violet-player");
player.innerHTML = renderSkin(media);
const provider = document.createElement("media-i18n");
provider.setAttribute("lang", params.get("lang") ?? "en");
provider.append(player);
stage.append(provider);
