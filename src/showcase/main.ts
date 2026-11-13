import "@videojs/html/media/mux-video";
import { renderSkin } from "../skin/skin";
import { reels, posterUrl, streamUrl, type Reel } from "./media";
import "./showcase.css";

const stage = document.getElementById("stage")!;
const collection = reels();

const details: Record<string, { title: string; tag: string; note: string }> = {
  dark: { title: "Cosmic Dawn", tag: "Documentary", note: "Cosmic Dawn trailer · NASA" },
  bright: { title: "Big Buck Bunny", tag: "Animation", note: "Big Buck Bunny · © Blender Foundation · CC BY 3.0" },
  reel: {
    title: "Violet Glass reel",
    tag: "Original · Mux",
    note: "Original motion piece made for this skin, hosted on Mux. Subtitles in English, Azerbaijani and Japanese.",
  },
};

function mount(reel: Reel, index: number) {
  const tracks = (reel.tracks ?? [])
    .map((t) => `<track kind="${t.kind}" label="${t.label}" srclang="${t.srclang}" src="${t.src}"${t.kind === "chapters" ? " default" : ""}>`)
    .join("");
  const media = `<mux-video src="${streamUrl(reel)}" playsinline crossorigin preload="metadata">${tracks}</mux-video>`;
  const player = document.createElement("violet-player");
  player.setAttribute("poster", posterUrl(reel));
  player.innerHTML = renderSkin(media);
  const provider = document.createElement("media-i18n");
  provider.append(player);
  stage.replaceChildren(provider);

  const info = details[reel.id] ?? details.dark!;
  document.getElementById("film-title")!.textContent = info.title;
  document.getElementById("film-tag")!.textContent = info.tag;
  document.getElementById("film-note")!.textContent = info.note;
  document.getElementById("film-index")!.textContent = String(index + 1).padStart(2, "0");
}

/** Builds an accessible radio group of pill buttons with arrow-key navigation. */
function radioGroup(host: HTMLElement, labels: string[], onSelect: (index: number) => void) {
  const buttons = labels.map((label, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "radio");
    button.textContent = label;
    button.addEventListener("click", () => select(index));
    button.addEventListener("keydown", (event) => {
      const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[event.key];
      if (!step) return;
      event.preventDefault();
      const next = (index + step + buttons.length) % buttons.length;
      select(next);
      buttons[next]!.focus();
    });
    return button;
  });
  function select(index: number) {
    buttons.forEach((button, i) => {
      button.setAttribute("aria-checked", String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    onSelect(index);
  }
  host.append(...buttons);
  return select;
}

const chooseFilm = radioGroup(
  document.getElementById("films")!,
  collection.map((reel) => (details[reel.id] ?? details.dark!).title),
  (index) => mount(collection[index]!, index),
);
chooseFilm(0);

// Preview sizes. The page picks the one that matches the real screen first.
const sizes = [
  { label: "Desktop", width: "100%" },
  { label: "Tablet", width: "720px" },
  { label: "Mobile", width: "375px" },
];
const chooseSize = radioGroup(
  document.getElementById("size-switch")!,
  sizes.map((size) => size.label),
  (index) => stage.style.setProperty("--stage-width", sizes[index]!.width),
);
const sizeFor = (width: number) => (width < 640 ? 2 : width < 1100 ? 1 : 0);
let autoSize = sizeFor(window.innerWidth);
chooseSize(autoSize);

// Re-pick when the screen changes size class, e.g. a phone rotating to landscape.
window.addEventListener("resize", () => {
  const next = sizeFor(window.innerWidth);
  if (next === autoSize) return;
  autoSize = next;
  chooseSize(next);
});
