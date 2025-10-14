// Replaced the monolithic manifest with an aggregator that combines smaller alphabetic manifests.
import { ASSET_MANIFEST as MAN_B } from './manifests/manifest_b.js';
import { ASSET_MANIFEST as MAN_BANNER } from './manifests/manifest_banner.js';
import { ASSET_MANIFEST as MAN_C } from './manifests/manifest_c.js';
import { ASSET_MANIFEST as MAN_F } from './manifests/manifest_f.js';
import { ASSET_MANIFEST as MAN_K } from './manifests/manifest_k.js';
import { ASSET_MANIFEST as MAN_P } from './manifests/manifest_p.js';
import { ASSET_MANIFEST as MAN_R } from './manifests/manifest_r.js';
import { ASSET_MANIFEST as MAN_S } from './manifests/manifest_s.js';
import { ASSET_MANIFEST as MAN_T } from './manifests/manifest_t.js';
import { ASSET_MANIFEST as MAN_W } from './manifests/manifest_w.js';

export const ASSET_MANIFEST = [
  ...MAN_B,
  ...MAN_BANNER,
  ...MAN_C,
  ...MAN_F,
  ...MAN_K,
  ...MAN_P,
  ...MAN_R,
  ...MAN_S,
  ...MAN_T,
  ...MAN_W
];