import "./styles/video/base.css";
import "./styles/themes/violet.css";
import "./skin.css";

import "@videojs/html/i18n";
import "@videojs/html/ui/container";
import "@videojs/html/ui/poster";
import "@videojs/html/ui/error-dialog";
import "@videojs/html/ui/dialog-backdrop";
import "@videojs/html/ui/dialog-popup";
import "@videojs/html/ui/dialog-title";
import "@videojs/html/ui/dialog-description";
import "@videojs/html/ui/dialog-close";
import "@videojs/html/ui/controls";
import "@videojs/html/ui/controls-backdrop";
import "@videojs/html/ui/controls-group";
import "@videojs/html/ui/controls-content";
import "@videojs/html/ui/buffering-indicator";
import "@videojs/html/ui/tooltip-group";
import "@videojs/html/ui/tooltip";
import "@videojs/html/ui/tooltip-label";
import "@videojs/html/ui/tooltip-shortcut";
import "@videojs/html/ui/play-button";
import "@videojs/html/ui/seek-button";
import "@videojs/html/ui/mute-button";
import "@videojs/html/ui/volume-slider";
import "@videojs/html/ui/captions-button";
import "@videojs/html/ui/pip-button";
import "@videojs/html/ui/fullscreen-button";
import "@videojs/html/ui/time-slider";
import "@videojs/html/ui/slider-track";
import "@videojs/html/ui/slider-buffer";
import "@videojs/html/ui/slider-fill";
import "@videojs/html/ui/slider-thumb";
import "@videojs/html/ui/slider-preview";
import "@videojs/html/ui/slider-thumbnail";
import "@videojs/html/ui/slider-value";
import "@videojs/html/ui/time-slider-chapter-title";
import "@videojs/html/ui/time-group";
import "@videojs/html/ui/time";
import "@videojs/html/ui/time-separator";
import "@videojs/html/ui/menu";
import "@videojs/html/ui/menu-content";
import "@videojs/html/ui/menu-item";
import "@videojs/html/ui/menu-checkbox-item";
import "@videojs/html/ui/menu-radio-group";
import "@videojs/html/ui/menu-radio-item";
import "@videojs/html/ui/menu-item-indicator";
import "@videojs/html/ui/quality-radio-group";
import "@videojs/html/ui/playback-rate-radio-group";
import "@videojs/html/ui/hotkey";
import "@videojs/html/ui/gesture";
import "@videojs/html/ui/status-announcer";
import "@videojs/html/ui/status-indicator";
import "@videojs/html/ui/volume-indicator";
import "@videojs/html/ui/volume-indicator-fill";
import "@videojs/html/ui/volume-indicator-value";
import "@videojs/html/ui/seek-indicator";
import "@videojs/html/ui/seek-indicator-value";
import { registerIcons } from "@videojs/html/icons";
import { violetIcons } from "./icons";
import template from "./skin.html?raw";

registerIcons("violet", violetIcons);

/** Languages offered in Settings. Each has a Video.js locale pack. */
export const LANGUAGES = ["en", "az", "tr", "ru", "uk", "de", "fr", "es", "it", "pt-BR", "ar", "hi", "ja", "ko", "zh"];
const RTL = new Set(["ar", "he", "fa", "ur"]);
const STORAGE_KEY = "violet-glass:lang";

const nativeName = (code: string) => {
  const name = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
  return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
};
const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const languageItems = LANGUAGES.map(
  (code) =>
    `<media-menu-radio-item value="${code}" class="ew-menu-item" lang="${code}">` +
    `<span>${escapeHtml(nativeName(code))}</span>` +
    `<media-menu-item-indicator class="ew-check"><media-icon family="violet" name="check" class="ew-icon"></media-icon></media-menu-item-indicator>` +
    `</media-menu-radio-item>`,
).join("");

let counter = 0;

/**
 * Returns the skin markup with `mediaHtml` inside. Every call gets its own element IDs,
 * so several players can share a page.
 */
export function renderSkin(mediaHtml: string): string {
  const id = `ew${++counter}`;
  return template
    .replaceAll("{id}", id)
    .replace("<!-- Add a compatible media component here. -->", mediaHtml)
    .replace('value="en"></media-menu-radio-group>', `value="en">${languageItems}</media-menu-radio-group>`);
}

export function savedLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.includes(saved)) return saved;
  } catch {
    /* Storage can be blocked; fall back to the browser language. */
  }
  const browser = navigator.language;
  return LANGUAGES.find((code) => code === browser) ?? LANGUAGES.find((code) => code === browser.split("-")[0]) ?? "en";
}

type Checkable = HTMLElement & { checked: boolean };
type ValueGroup = HTMLElement & { value: string };

function wire(skin: HTMLElement) {
  const q = <T extends Element = HTMLElement>(selector: string) => skin.querySelector<T & HTMLElement>(selector);
  const media = () => q<HTMLMediaElement>("video, mux-video, hls-video, hlsjs-video, native-hls-video");
  const captions = q("media-captions-button");
  const pip = q("media-pip-button");
  const captionToggle = q<Checkable>(".ew-caption-toggle") as Checkable | null;
  const loopToggle = q<Checkable>(".ew-loop-toggle") as Checkable | null;
  const pipItem = q(".ew-pip-toggle");
  const langGroup = q<ValueGroup>(".ew-lang-group") as ValueGroup | null;
  const langHint = q(".ew-lang-hint");
  const gear = q(".ew-gear");
  const menu = q(".ew-menu");

  // Captions: the menu switch drives the real captions button so both stay in sync.
  const captionsOn = () => captions?.hasAttribute("data-active") ?? false;
  const syncCaptions = () => {
    if (!captions || !captionToggle) return;
    if (captionToggle.checked !== captionsOn()) captionToggle.checked = captionsOn();
    const unavailable = captions.getAttribute("data-availability") === "unavailable" || captions.hasAttribute("hidden");
    captionToggle.toggleAttribute("data-unavailable", unavailable);
  };
  captionToggle?.addEventListener("checked-change", () =>
    queueMicrotask(() => {
      if (captionToggle.checked !== captionsOn()) captions?.click();
    }),
  );

  // Loop has no stock control, so set it on the media element.
  loopToggle?.addEventListener("checked-change", () =>
    queueMicrotask(() => {
      const el = media();
      if (el) el.loop = loopToggle.checked;
    }),
  );

  // Picture-in-picture: the menu item presses the real PiP button and hides when PiP is unsupported.
  pipItem?.addEventListener("select", () => pip?.click());
  const syncPip = () => {
    if (!pip || !pipItem) return;
    pipItem.hidden = pip.hasAttribute("hidden");
    const label = pipItem.querySelector("media-text");
    const active = pip.hasAttribute("data-pip");
    label?.setAttribute("token", active ? "pip.exit" : "pip.enter");
    if (label) label.textContent = active ? "Exit picture-in-picture" : "Enter picture-in-picture";
  };

  // Language: switch the nearest i18n provider and flip direction for right-to-left locales.
  const applyLanguage = (code: string) => {
    const provider = skin.closest("media-i18n");
    if (provider) provider.setAttribute("lang", code);
    else skin.setAttribute("lang", code);
    skin.setAttribute("dir", RTL.has(code) ? "rtl" : "ltr");
    if (langHint) langHint.textContent = nativeName(code);
    if (langGroup && langGroup.value !== code) langGroup.value = code;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  };
  langGroup?.addEventListener("value-change", () => queueMicrotask(() => applyLanguage(langGroup.value)));
  applyLanguage(savedLanguage());

  // Keep the menu inside the picture above the dock.
  const fitMenu = () => {
    if (!gear || !menu) return;
    const frame = skin.getBoundingClientRect();
    const button = gear.getBoundingClientRect();
    skin.style.setProperty("--ew-menu-max-height", `${Math.max(120, button.top - frame.top - 20)}px`);
    skin.style.setProperty("--ew-menu-max-width", `${Math.max(0, frame.width - 24)}px`);
    // Phone sheet: cover the picture, inset by 6px.
    menu.style.setProperty("--ew-sheet-top", `${frame.top + 6}px`);
    menu.style.setProperty("--ew-sheet-left", `${frame.left + 6}px`);
    menu.style.setProperty("--ew-sheet-width", `${frame.width - 12}px`);
    menu.style.setProperty("--ew-sheet-height", `${frame.height - 12}px`);
  };
  const onScroll = () => {
    if (menu?.hasAttribute("data-open")) fitMenu();
  };
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });

  const watcher = new MutationObserver(() => {
    syncCaptions();
    syncPip();
    fitMenu();
  });
  for (const el of [captions, pip]) {
    if (el) watcher.observe(el, { attributes: true, attributeFilter: ["data-active", "data-availability", "hidden", "data-pip"] });
  }
  if (menu) watcher.observe(menu, { attributes: true, attributeFilter: ["data-open"] });
  const resize = new ResizeObserver(fitMenu);
  resize.observe(skin);
  syncCaptions();
  syncPip();
  fitMenu();

  return () => {
    window.removeEventListener("scroll", onScroll, { capture: true });
    watcher.disconnect();
    resize.disconnect();
  };
}

/** Wires every Violet Glass player as it enters the page and cleans up when it leaves. */
const cleanups = new Map<Element, () => void>();
const scan = () => {
  document.querySelectorAll<HTMLElement>(".media-skin.ew-player").forEach((skin) => {
    if (!cleanups.has(skin)) cleanups.set(skin, wire(skin));
  });
  for (const [skin, cleanup] of cleanups) {
    if (!skin.isConnected) {
      cleanup();
      cleanups.delete(skin);
    }
  }
};
new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
scan();
