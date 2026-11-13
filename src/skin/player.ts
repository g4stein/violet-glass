import { createPlayer } from "@videojs/html";
import { orientationLockFeature, videoFeatures } from "@videojs/core/dom";

/**
 * `<violet-player>`: the standard video player plus orientation lock, so Android phones
 * rotate to landscape when fullscreen starts and unlock when it ends. iOS has no
 * orientation lock API and uses its native fullscreen player instead.
 */
const { PlayerElement } = createPlayer({ features: [...videoFeatures, orientationLockFeature] });

export class VioletPlayerElement extends PlayerElement {}

if (!customElements.get("violet-player")) customElements.define("violet-player", VioletPlayerElement);
