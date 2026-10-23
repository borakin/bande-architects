// The film's script: one progress value (0 → 1) decides everything.
import { CatmullRomCurve3, Vector3, Color } from 'three';

// state k morphs into state k+1 inside [s, e]
export const MORPHS = [
  { s: 0.045, e: 0.135, spread: 0.62 }, // logo → city
  { s: 0.200, e: 0.282, spread: 0.6 },  // city → building
  { s: 0.335, e: 0.392, spread: 0.5 },  // building → bim (explode)
  { s: 0.445, e: 0.512, spread: 0.6 },  // bim → han ruin
  { s: 0.565, e: 0.615, spread: 0.7 },  // ruin → restored
  { s: 0.650, e: 0.700, spread: 0.6 },  // restored → archive
  { s: 0.885, e: 0.955, spread: 0.62 }, // archive → logo
];

// text windows: [in, out]; first and last stay open at the edges
export const CHAPTERS = [
  { id: 'origin', a: -1, b: 0.058, hold: 0.0 },
  { id: 'urban', a: 0.118, b: 0.212, hold: 0.168 },
  { id: 'building', a: 0.268, b: 0.345, hold: 0.31 },
  { id: 'bim', a: 0.378, b: 0.455, hold: 0.42 },
  { id: 'survey', a: 0.5, b: 0.648, hold: 0.54 },
  { id: 'archive', a: 0.685, b: 0.74, hold: 0.705 },
  { id: 'contact', a: 0.935, b: 2, hold: 1.0 },
];

export const SCAN = { a: 0.47, b: 0.56 };           // point cloud sweep
// the selected works sit in the page flow while the film holds at ARCHIVE_HOLD
export const ARCHIVE_HOLD = 0.715;
export const CITY_HOLD = { a: 0.135, b: 0.2 };
export const LOGO_HOLD = { a: -1, b: 0.04 };

// sh = lens shift [x, y] as a fraction of the frame: the model slides away from the type instead of hiding under it
const K = (p, pos, tgt, sh = [0, 0]) => ({ p, pos: new Vector3(...pos), tgt: new Vector3(...tgt), sh });
const CAM = [
  K(0.0, [4, 33, 38], [0, 0, 1.2], [0, -0.03]),
  K(0.045, [-3, 29, 35], [0, 0.5, 0.8], [0, -0.03]),
  K(0.095, [16, 26, 42], [0, 1.5, 0], [0.08, 0]),
  K(0.15, [36, 31, 44], [0, 2, 0], [0.17, 0.04]),
  K(0.2, [42, 25, 34], [0, 2.5, 0], [0.17, 0.04]),
  K(0.245, [34, 18, 36], [0, 4, 0], [-0.04, 0.04]),
  K(0.29, [30, 12, 37], [0, 5, 0], [-0.13, 0.06]),
  K(0.335, [17, 9.5, 40], [-1, 6, 0], [-0.13, 0.06]),
  K(0.39, [36, 21, 39], [0, 8.5, 0], [-0.15, 0.02]),
  K(0.445, [41, 28, 25], [0, 9, 0], [-0.14, 0.02]),
  K(0.48, [22, 15, 44], [0, 5, 0], [0.04, 0.06]),
  K(0.515, [8, 8.5, 47], [0, 4.4, 0], [0.1, 0.16]),
  K(0.56, [2, 7.6, 44], [1, 4.4, 0], [0.1, 0.16]),
  K(0.615, [-9, 7.2, 42], [0, 4.4, 0], [0.1, 0.16]),
  K(0.65, [-20, 6, 32], [-8, 3.6, 0], [0.03, 0.06]),
  K(0.7, [-9, 10, 40], [-1, 1.5, 0], [0, 0.04]),
  K(0.79, [0, 8.5, 34], [0, 1.2, 0], [0, 0.03]),
  K(0.875, [9, 10, 40], [1, 1.5, 0], [0, 0.02]),
  K(0.92, [18, 28, 44], [3, 0.5, 0], [0.06, 0.02]),
  K(0.955, [4, 45, 49], [0, 0, 0.8], [0.15, -0.11]),
  K(1.0, [-2, 48, 45], [0, 0, 1], [0.16, -0.12]),
];
const posCurve = new CatmullRomCurve3(CAM.map((k) => k.pos), false, 'centripetal');
const tgtCurve = new CatmullRomCurve3(CAM.map((k) => k.tgt), false, 'centripetal');

export function cameraAt(p, outPos, outTgt, outShift) {
  p = Math.min(1, Math.max(0, p));
  let i = 0;
  while (i < CAM.length - 2 && p > CAM[i + 1].p) i++;
  const a = CAM[i], b = CAM[i + 1];
  const local = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p)));
  const u = (i + local) / (CAM.length - 1);
  posCurve.getPoint(u, outPos);
  tgtCurve.getPoint(u, outTgt);
  if (outShift) {
    const s = local * local * (3 - 2 * local);
    outShift.x = a.sh[0] + (b.sh[0] - a.sh[0]) * s;
    outShift.y = a.sh[1] + (b.sh[1] - a.sh[1]) * s;
  }
}

// a single day: morning on the logo, noon over the city, golden hour in the archive, dusk at contact
const SUN = [
  { p: 0.0, az: 128, el: 38, color: '#f2f4f7', i: 3.0, bg: '#0B0B0A', amb: 0.3 },
  { p: 0.3, az: 165, el: 56, color: '#ffffff', i: 3.2, bg: '#0B0B0A', amb: 0.32 },
  { p: 0.55, az: 205, el: 44, color: '#f7f5f2', i: 3.1, bg: '#0B0B0A', amb: 0.3 },
  { p: 0.8, az: 238, el: 27, color: '#fbeee0', i: 3.0, bg: '#0B0B0A', amb: 0.28 },
  { p: 1.0, az: 250, el: 24, color: '#f6dcc4', i: 2.8, bg: '#0C0B0A', amb: 0.26 },
];
const _c1 = new Color(), _c2 = new Color();
export function sunAt(p, out) {
  let i = 0;
  while (i < SUN.length - 2 && p > SUN[i + 1].p) i++;
  const a = SUN[i], b = SUN[i + 1];
  const t = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p)));
  const s = t * t * (3 - 2 * t);
  const lerp = (x, y) => x + (y - x) * s;
  out.az = lerp(a.az, b.az); out.el = lerp(a.el, b.el); out.i = lerp(a.i, b.i); out.amb = lerp(a.amb, b.amb);
  out.color.copy(_c1.set(a.color)).lerp(_c2.set(b.color), s);
  out.bg.copy(_c1.set(a.bg)).lerp(_c2.set(b.bg), s);
  out.dusk = Math.max(0, (p - 0.86) / 0.14);
  return out;
}

export function morphAt(p) {
  let k = 0;
  for (let i = 0; i < MORPHS.length; i++) if (p >= MORPHS[i].s) k = i;
  const m = MORPHS[k];
  const mix = Math.min(1, Math.max(0, (p - m.s) / (m.e - m.s)));
  return { k, mix, spread: m.spread };
}

export const band = (p, a, b, fade = 0.02) =>
  Math.min(1, Math.max(0, Math.min((p - a) / fade, (b - p) / fade)));
