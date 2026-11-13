/** Violet Glass: an original 24px icon family with rounded 1.8px strokes. */
const icon = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
const solid = (d: string) =>
  `<path d="${d}" fill="currentColor" stroke="none"/>`;
const speaker = '<path d="M4 9H7L12 5V19L7 15H4Z"/>';
export const violetIcons = {
  play: icon(
    solid("M9 5.8Q8 5.2 8 6.5V17.5Q8 18.8 9 18.2L19 12.8Q20.5 12 19 11.2Z"),
  ),
  pause: icon('<path d="M8 6V18M16 6V18" stroke-width="4"/>'),
  restart: icon('<path d="M4 10A8 8 0 1 1 5 17M4 4V10H10"/>'),
  seek: icon('<path d="M18 7A8 8 0 1 1 12 4H17M14 1L17 4L14 7"/>'),
  "volume-high": icon(
    speaker + '<path d="M16 8A6 6 0 0 1 16 16M19 5A10 10 0 0 1 19 19"/>',
  ),
  "volume-low": icon(speaker + '<path d="M16 8A6 6 0 0 1 16 16"/>'),
  "volume-off": icon(speaker + '<path d="M17 9L22 15M22 9L17 15"/>'),
  "captions-off": icon(
    '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 10H7V14H10M17 10H14V14H17"/>',
  ),
  "captions-on": icon(
    '<rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="M10 10H7V14H10M17 10H14V14H17" stroke="var(--ew-ink,#141321)"/>',
  ),
  "fullscreen-enter": icon(
    '<path d="M4 9V5Q4 4 5 4H9M15 4H19Q20 4 20 5V9M20 15V19Q20 20 19 20H15M9 20H5Q4 20 4 19V15"/>',
  ),
  "fullscreen-exit": icon(
    '<path d="M9 3V8Q9 9 8 9H3M15 3V8Q15 9 16 9H21M21 15H16Q15 15 15 16V21M3 15H8Q9 15 9 16V21"/>',
  ),
  "pip-enter": icon(
    '<rect x="2" y="4" width="20" height="16" rx="4"/><rect x="12" y="11" width="7" height="6" rx="1"/>',
  ),
  "pip-exit": icon(
    '<rect x="2" y="4" width="20" height="16" rx="4"/><rect x="12" y="11" width="7" height="6" rx="1" fill="currentColor"/>',
  ),
  gear: icon(
    '<path d="M10 3h4l.7 2.3 2 .9 2.2-.6 2 3.4-1.6 1.7v2.6L21 15l-2 3.4-2.2-.6-2 .9L14 21h-4l-.7-2.3-2-.9-2.2.6L3 15l1.6-1.7v-2.6L3 9l2-3.4 2.2.6 2-.9Z"/><circle cx="12" cy="12" r="3.1"/>',
  ),
  chevron: icon('<path d="M9 6L15 12L9 18"/>'),
  check: icon('<path d="M5 12L10 17L20 7"/>'),
  speed: icon('<path d="M4.5 17A8.5 8.5 0 1 1 19.5 17"/><path d="M12 13L16 8.5"/><circle cx="12" cy="13" r="1.2" fill="currentColor"/>'),
  quality: icon('<path d="M4 7H20M4 12H20M4 17H20"/><circle cx="9" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="7" cy="17" r="2" fill="currentColor"/>'),
  language: icon('<circle cx="12" cy="12" r="9"/><path d="M3 12H21M12 3C9.5 6 9.5 18 12 21M12 3C14.5 6 14.5 18 12 21"/>'),
  loop: icon('<path d="M17 3L20 6L17 9M4 12V10A4 4 0 0 1 8 6H20M7 21L4 18L7 15M20 12V14A4 4 0 0 1 16 18H4"/>'),
  close: icon('<path d="M6 6L18 18M18 6L6 18"/>'),
  spinner: icon('<path d="M12 3A9 9 0 1 1 3 12"/>'),
} as const;
