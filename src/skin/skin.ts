import "./styles/video/base.css";
import "./styles/themes/violet.css";
import "./skin.css";
import "./player";

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
import "@videojs/html/ui/menu-radio-item";
import "@videojs/html/ui/menu-item-indicator";
import "@videojs/html/ui/quality-radio-group";
import "@videojs/html/ui/captions-radio-group";
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

/** Video.js locale packs the interface can pick from the browser language. */
const LOCALES = ["en", "az", "tr", "ru", "uk", "de", "fr", "es", "it", "pt-BR", "pt", "ar", "he", "fa", "hi", "ja", "ko", "zh", "nl", "pl"];
const RTL = new Set(["ar", "he", "fa", "ur"]);

/** The interface language that matches the browser, or English. */
export function browserLocale(): string {
  for (const wanted of navigator.languages ?? [navigator.language]) {
    const exact = LOCALES.find((code) => code.toLowerCase() === wanted.toLowerCase());
    if (exact) return exact;
    const base = LOCALES.find((code) => code === wanted.split("-")[0]);
    if (base) return base;
  }
  return "en";
}

/** Labels the Video.js locale packs don't cover. */
const EXTRA_TEXT: Record<string, { loop: string; close: string }> = {
  az: { loop: "Təkrarla", close: "Parametrləri bağla" },
  tr: { loop: "Döngü", close: "Ayarları kapat" },
  ru: { loop: "Повтор", close: "Закрыть настройки" },
  uk: { loop: "Повтор", close: "Закрити налаштування" },
  de: { loop: "Wiederholen", close: "Einstellungen schließen" },
  fr: { loop: "Lecture en boucle", close: "Fermer les paramètres" },
  es: { loop: "Repetir", close: "Cerrar ajustes" },
  it: { loop: "Ripeti", close: "Chiudi impostazioni" },
  pt: { loop: "Repetir", close: "Fechar definições" },
  "pt-BR": { loop: "Repetir", close: "Fechar configurações" },
  nl: { loop: "Herhalen", close: "Instellingen sluiten" },
  pl: { loop: "Zapętl", close: "Zamknij ustawienia" },
  ar: { loop: "تكرار", close: "إغلاق الإعدادات" },
  he: { loop: "הפעלה חוזרת", close: "סגירת ההגדרות" },
  fa: { loop: "تکرار", close: "بستن تنظیمات" },
  hi: { loop: "दोहराएँ", close: "सेटिंग्स बंद करें" },
  ja: { loop: "ループ再生", close: "設定を閉じる" },
  ko: { loop: "반복 재생", close: "설정 닫기" },
  zh: { loop: "循环播放", close: "关闭设置" },
};

let counter = 0;

/**
 * Returns the skin markup with `mediaHtml` inside. Every call gets its own element IDs,
 * so several players can share a page.
 */
export function renderSkin(mediaHtml: string): string {
  const id = `ew${++counter}`;
  return template.replaceAll("{id}", id).replace("<!-- Add a compatible media component here. -->", mediaHtml);
}

type Checkable = HTMLElement & { checked: boolean };

function wire(skin: HTMLElement) {
  const q = (selector: string) => skin.querySelector<HTMLElement>(selector);
  const media = () => skin.querySelector<HTMLMediaElement>("video, mux-video, hls-video, hlsjs-video, native-hls-video");
  const pip = q("media-pip-button");
  const loopToggle = q(".ew-loop-toggle") as Checkable | null;
  const pipItem = q(".ew-pip-toggle");
  const gear = q(".ew-gear");
  const menu = q(".ew-menu");

  // Interface language follows the browser when the page doesn't set one on <media-i18n>.
  const provider = skin.closest("media-i18n");
  if (provider && !provider.hasAttribute("lang")) {
    const locale = browserLocale();
    provider.setAttribute("lang", locale);
    skin.setAttribute("dir", RTL.has(locale) ? "rtl" : "ltr");
  }

  // Video.js has no phrases for these two labels, so translate them here.
  const locale = provider?.getAttribute("lang") ?? "en";
  const own = EXTRA_TEXT[locale] ?? EXTRA_TEXT[locale.split("-")[0]!];
  if (own) {
    const loopLabel = q(".ew-loop-toggle > span:not(.ew-switch)");
    if (loopLabel) loopLabel.textContent = own.loop;
    q(".ew-close")?.setAttribute("aria-label", own.close);
  }

  // Show the player's own focus ring for keyboard use only, even after taps.
  // Keys are watched on the whole document, so tabbing in from the page also counts.
  const onPointer = () => skin.setAttribute("data-pointer", "");
  const onKey = () => skin.removeAttribute("data-pointer");
  skin.addEventListener("pointerdown", onPointer);
  document.addEventListener("keydown", onKey, true);

  // Hide the broken-image icon if a poster fails to load.
  const posterImg = skin.querySelector<HTMLImageElement>(".ew-poster img");
  const onPosterError = () => posterImg?.setAttribute("data-broken", "");
  const onPosterLoad = () => posterImg?.removeAttribute("data-broken");
  posterImg?.addEventListener("error", onPosterError);
  posterImg?.addEventListener("load", onPosterLoad);

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
    // Toggle two translated labels instead of rewriting text, so Video.js keeps translating them.
    const active = pip.hasAttribute("data-pip");
    pipItem.querySelector<HTMLElement>(".ew-pip-enter")?.toggleAttribute("hidden", active);
    pipItem.querySelector<HTMLElement>(".ew-pip-exit")?.toggleAttribute("hidden", !active);
  };

  // Open the menu just above the dock (clearing any timeline row) and keep it inside the picture.
  const dock = q(".ew-dock");
  const fitMenu = () => {
    if (!gear || !menu || !dock) return;
    const frame = skin.getBoundingClientRect();
    const button = gear.getBoundingClientRect();
    const bar = dock.getBoundingClientRect();
    const gap = 6;
    menu.style.setProperty("--media-popover-side-offset", `${Math.max(gap, button.top - bar.top + gap)}px`);
    skin.style.setProperty("--ew-menu-max-height", `${Math.max(80, bar.top - frame.top - gap * 2)}px`);
    skin.style.setProperty("--ew-menu-max-width", `${Math.max(0, frame.width - 16)}px`);
  };
  const onScroll = () => {
    if (menu?.hasAttribute("data-open")) fitMenu();
  };
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });

  const watcher = new MutationObserver(() => {
    syncPip();
    fitMenu();
  });
  if (pip) watcher.observe(pip, { attributes: true, attributeFilter: ["hidden", "data-pip"] });
  if (menu) watcher.observe(menu, { attributes: true, attributeFilter: ["data-open"] });
  const resize = new ResizeObserver(fitMenu);
  resize.observe(skin);
  syncPip();
  fitMenu();

  return () => {
    skin.removeEventListener("pointerdown", onPointer);
    document.removeEventListener("keydown", onKey, true);
    posterImg?.removeEventListener("error", onPosterError);
    posterImg?.removeEventListener("load", onPosterLoad);
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
