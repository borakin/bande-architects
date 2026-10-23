// Every scene of the film is a "state": a list of block slots (centre, size, colour, material).
// All states share the same N physical blocks; assign() decides which block travels where,
// so the logo literally becomes the city, the building, the han and the archive.
import { Color } from 'three';
import { BANDE, ARCHITECTS } from '../data/logoGrid.js';

export const N = 1200;
export const FLOOR = 0.72;

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(2015);
const lin = (hex) => { const c = new Color(hex); return [c.r, c.g, c.b]; };
const vary = (rgb, amt) => { const k = 1 + (rng() - 0.5) * 2 * amt; return [rgb[0] * k, rgb[1] * k, rgb[2] * k]; };

export const PAL = {
  stone: lin('#5E5D59'),
  stoneWarm: lin('#62605B'),
  plaster: lin('#66655F'),
  oldStone: lin('#5C574E'),
  newStone: lin('#9A968D'),
  bronze: lin('#8A6A4A'),
  glass: lin('#26292B'),
  shop: lin('#4A3A2C'),
  pave: lin('#3A3936'),
};

// slot: p centre, s size, c colour, m = [roughness, metalness, glass, group], k = build order 0..1
const S = (x, y, z, sx, sy, sz, c, rough = 0.86, metal = 0, glass = 0, group = -1, k = 0) =>
  ({ p: [x, y, z], s: [sx, sy, sz], c, m: [rough, metal, glass, group], k });

function normaliseKeys(slots) {
  let lo = Infinity, hi = -Infinity;
  for (const s of slots) { lo = Math.min(lo, s.k); hi = Math.max(hi, s.k); }
  const d = hi - lo || 1;
  for (const s of slots) s.k = (s.k - lo) / d;
  return slots;
}

/* ───────── 1 · LOGO ───────── */
function logo() {
  const out = [];
  const cz = 1.1, D1 = 5 * cz, gap = 1.7, D2 = 5 * cz * 0.5, z0 = -(D1 + gap + D2) / 2;
  BANDE.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== '#') return;
    out.push(S(c - 14, 0.6, z0 + (r + 0.5) * cz, 0.985, 1.2, cz - 0.015, vary(PAL.stone, 0.02), 0.8, 0, 0, -1,
      c / 28 * 0.8 + rng() * 0.2));
  }));
  ARCHITECTS.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== '#') return;
    out.push(S((c - 28) * 0.5, 0.2, z0 + D1 + gap + (r + 0.5) * cz * 0.5, 0.49, 0.4, cz * 0.5 - 0.012,
      vary(PAL.stone, 0.02), 0.8, 0, 0, -1, 0.3 + c / 56 * 0.7));
  }));
  return { slots: normaliseKeys(out) };
}

/* ───────── 2 · CITY (urban design / planning) ───────── */
function city() {
  const out = [], groups = [];
  const BX = 5, BZ = 4, bw = 8.4, st = 2.8, pitch = bw + st, fh = 0.56;
  let ada = 112;
  const building = (x, z, w, d, floors, k0) => {
    const id = groups.length;
    floors = Math.max(1, Math.round(floors));
    const parcel = 3 + groups.length % 17;
    const taks = Math.min(0.6, (w * d) / ((w + 1.2) * (d + 1.2)));
    groups.push({ id, x, z, w, d, h: floors * fh, floors, ada, parcel, taks, kaks: taks * floors });
    const col = vary(PAL.plaster, 0.025);
    for (let f = 0; f < floors; f++) {
      out.push(S(x, f * fh + 0.25, z, w, 0.5, d, col, 0.88, 0, 0, id, k0 * 0.55 + (f / 16) * 0.45));
    }
  };
  for (let bi = 0; bi < BX; bi++) for (let bj = 0; bj < BZ; bj++) {
    ada++;
    const cx = (bi - (BX - 1) / 2) * pitch, cz = (bj - (BZ - 1) / 2) * pitch;
    const dc = Math.min(1, Math.hypot(cx, cz * 1.15) / 30);
    const hb = 9 - dc * 6;
    const k0 = dc;
    const r = rng();
    if (bi === 3 && bj === 2) {
      // park: a pavilion and a grid of model trees
      building(cx - 1.5, cz + 2, 4, 1.6, 1, k0);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        if (rng() < 0.25) continue;
        const sz = 0.45 + rng() * 0.25;
        out.push(S(cx - 3 + i * 2 + (rng() - 0.5) * 0.5, sz / 2, cz - 3.2 + j * 1.6, sz, sz, sz, vary(PAL.stoneWarm, 0.03), 0.9, 0, 0, -1, k0 + 0.1));
      }
      continue;
    }
    if (r < 0.48) {
      // perimeter block with courtyard (Bursa's typical urban block)
      const d = 1.9, half = bw / 2;
      const segs = 3;
      for (const side of [-1, 1]) {
        for (let s = 0; s < segs; s++) {
          const w = bw / segs - 0.12;
          building(cx - half + (s + 0.5) * (bw / segs), cz + side * (half - d / 2), w, d, hb + (rng() - 0.5) * 3, k0);
        }
        const L = bw - 2 * d - 0.24;
        for (let s = 0; s < 2; s++) {
          building(cx + side * (half - d / 2), cz - L / 2 + (s + 0.5) * (L / 2), d, L / 2 - 0.12, hb - 1 + (rng() - 0.5) * 2, k0);
        }
      }
    } else if (r < 0.7) {
      // point towers
      const n = 2;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (rng() < 0.2) continue;
        building(cx - 2.1 + i * 4.2, cz - 2.1 + j * 4.2, 2.6, 2.6, hb + 2 + rng() * 6, k0);
      }
    } else {
      // parallel bars
      const alongX = rng() < 0.5;
      for (let i = 0; i < 3; i++) {
        const o = -3 + i * 3;
        if (alongX) building(cx, cz + o, bw - 0.6, 1.5, hb * 0.8 + rng() * 2, k0);
        else building(cx + o, cz, 1.5, bw - 0.6, hb * 0.8 + rng() * 2, k0);
      }
    }
  }
  return { slots: normaliseKeys(out), groups };
}

/* ───────── 3 · BUILDING (stepped mixed use) + 4 · BIM (exploded) ───────── */
const BLD = { M: 1.6, cols: 11, rows: 7, court: [3, 7, 2, 4] };
function buildingSlots(explode) {
  const out = [], labels = [];
  const { M, cols, rows, court } = BLD;
  const ox = -(cols - 1) / 2 * M, oz = -(rows - 1) / 2 * M;
  const groundH = 0.95, slabH = 0.14, glassH = FLOOR - slabH;
  const ex = explode ? 0.62 : 0; // extra gap per floor
  let maxFloors = 0;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    if (i >= court[0] && i <= court[1] && j >= court[2] && j <= court[3]) continue;
    const xn = (i / (cols - 1)) * 2 - 1, zn = (j / (rows - 1)) * 2 - 1;
    const f = Math.min(1, Math.max(0, ((-xn) * 0.58 + (-zn) * 0.42 + 1) / 2));
    const floors = 2 + Math.floor(Math.pow(f, 1.15) * 11.6);
    maxFloors = Math.max(maxFloors, floors);
    const x = ox + i * M, z = oz + j * M;
    const kb = (1 - f) * 0.15;
    // ground floor: shop front in dark bronze glass
    out.push(S(x, groundH / 2, z, M - 0.02, groundH, M - 0.02, vary(PAL.shop, 0.04), 0.3, 0.2, 1, -1, kb));
    let y = groundH;
    for (let fl = 1; fl < floors; fl++) {
      const yy = y + fl * ex;
      out.push(S(x, yy + slabH / 2, z, M + 0.02, slabH, M + 0.02, vary(PAL.plaster, 0.015), 0.8, 0, 0, -1, kb + fl / 14));
      out.push(S(x, yy + slabH + glassH / 2, z, M - 0.2, glassH - 0.02, M - 0.2, vary(PAL.glass, 0.04), 0.18, 0.0, 1, -1, kb + fl / 14 + 0.02));
      y += FLOOR;
    }
    // roof slab / terrace
    const yy = y + floors * ex;
    out.push(S(x, yy + slabH / 2, z, M + 0.02, slabH, M + 0.02, vary(PAL.plaster, 0.015), 0.8, 0, 0, -1, kb + floors / 14));
  }
  if (explode) {
    for (let fl = 0; fl <= maxFloors; fl += 3) {
      const y = fl === 0 ? 0.2 : groundH + (fl - 1) * FLOOR + fl * ex + 0.3;
      labels.push({ fl, y });
    }
  }
  // a quiet context of low neighbours keeps the building in its street
  const ctx = [[-15, -2, 3, 5, 3], [-15, 6, 3, 4, 2], [14.5, -5, 3.4, 4, 4], [14.5, 3, 3.4, 5, 3], [-4, -12, 8, 2.6, 3], [6, -12, 6, 2.6, 4], [-6, 11.5, 6, 2.4, 2], [7, 11.5, 7, 2.4, 2]];
  for (const [cx, cz, w, d, fl] of ctx) {
    const col = vary(PAL.plaster, 0.02);
    for (let f = 0; f < fl; f++) out.push(S(cx, f * 0.56 + 0.25, cz, w, 0.5, d, col, 0.9, 0, 0, -1, 0.9 + f * 0.02));
  }
  return { slots: normaliseKeys(out), labels };
}

/* ───────── 5 · SURVEY (han ruin) + 6 · RESTORED ───────── */
const HAN = { W: 26, H: 8.8, course: 0.42, depth: 0.7, ret: 7 };
function inOpening(x, y) {
  const bay = HAN.W / 7;
  const bi = Math.floor((x + HAN.W / 2) / bay);
  if (bi < 0 || bi > 6) return false;
  const bx = -HAN.W / 2 + (bi + 0.5) * bay;
  const dx = x - bx;
  // ground arcade
  const r1 = 1.4, s1 = 2.3;
  if (y < s1 && Math.abs(dx) < r1) return true;
  if (y >= s1 && Math.hypot(dx, y - s1) < r1) return true;
  // upper gallery
  const r2 = 1.05, sill = 4.75, s2 = 5.7;
  if (y > sill && y < s2 && Math.abs(dx) < r2) return true;
  if (y >= s2 && Math.hypot(dx, y - s2) < r2) return true;
  return false;
}
function damaged(x, y, z, side) {
  // the upper right corner and the right return wall have lost stones; plus scattered losses
  const n = Math.sin(x * 1.7 + y * 2.3) * 0.5 + Math.sin(x * 0.6 - y * 1.1) * 0.5;
  if (side === 'front' && x > 2 && y > 5.2 + n * 1.2 - (x - 2) * 0.12) return true;
  if (side === 'right' && y > 4 + n * 1.5 - (z + 7) * 0.15) return true;
  return rng() < 0.035;
}
function hanSlots() {
  const out = [];
  const { W, H, course, depth, ret } = HAN;
  const sh = course - 0.04;
  const rows = Math.round(H / course);
  const add = (x, y, z, sx, sy, sz, side, k) => {
    const old = vary(PAL.oldStone, 0.06);
    const miss = damaged(x, y, z, side);
    out.push({ ...S(x, y, z, sx, sy, sz, old, 0.92, 0, 0, -1, k), missing: miss });
  };
  // front wall
  for (let r = 0; r < rows; r++) {
    const y = r * course + sh / 2 + 0.02;
    const off = r % 2 ? 0.5 : 0;
    for (let x = -W / 2 + off; x < W / 2 - 0.01; x += 1.0) {
      const a = Math.max(-W / 2, x), b = Math.min(W / 2, x + 1.0);
      const cx = (a + b) / 2, len = b - a - 0.04;
      if (len < 0.3 || inOpening(cx, y)) continue;
      add(cx, y, 0, len, sh, depth, 'front', y / H * 0.7 + (cx + W / 2) / W * 0.3);
    }
  }
  // return walls with small windows
  for (const sx of [-1, 1]) {
    for (let r = 0; r < rows; r++) {
      const y = r * course + sh / 2 + 0.02;
      const off = r % 2 ? 0.5 : 0;
      for (let z = -ret + off; z < 0 - depth / 2 - 0.01; z += 1.0) {
        const a = Math.max(-ret, z), b = Math.min(-depth / 2, z + 1.0);
        const cz = (a + b) / 2, len = b - a - 0.04;
        if (len < 0.3) continue;
        const win = Math.abs(cz + 3.6) < 0.7 && ((y > 1.2 && y < 2.6) || (y > 5.4 && y < 6.8));
        if (win) continue;
        add(sx * (W / 2 - depth / 2), y, cz, depth, sh, len, sx > 0 ? 'right' : 'left', y / H * 0.7 + 0.3);
      }
    }
  }
  // cornice
  for (let x = -W / 2; x < W / 2 - 0.01; x += 1.6) {
    const len = Math.min(1.6, W / 2 - x) - 0.04;
    add(x + len / 2 + 0.02, H + 0.17, 0.12, len, 0.3, depth + 0.35, 'front', 1);
  }
  // courtyard paving
  for (let i = 0; i < 20; i++) for (let j = 0; j < 6; j++) {
    const x = -W / 2 + 0.65 + i * 1.3, z = 1.3 + j * 1.3;
    out.push({ ...S(x, 0.05, z, 1.24, 0.1, 1.24, vary(PAL.pave, 0.04), 0.95, 0, 0, -1, 0.05 * rng()), missing: false });
  }
  return out;
}

/* ───────── 7 · ARCHIVE ───────── */
export const PLATES = (() => {
  const list = [];
  for (let k = 0; k < 8; k++) {
    list.push({ x: -30 + k * 8.6, y: 3.65, z: k % 2 ? -1.6 : 0.8, yaw: (k % 2 ? 1 : -1) * 0.1, w: 5.2, h: 3.9 });
  }
  return list;
})();
function archive() {
  const out = [];
  // walkway
  for (let x = -40; x <= 40; x += 1.7) for (const z of [-2.55, -0.85, 0.85, 2.55]) {
    out.push(S(x, 0.09, z, 1.64, 0.18, 1.64, vary(PAL.stone, 0.03), 0.9, 0, 0, -1, (x + 40) / 80));
  }
  // pedestals under each print
  for (const p of PLATES) {
    for (const dx of [-1.6, 1.6]) for (let f = 0; f < 3; f++) {
      out.push(S(p.x + dx * Math.cos(p.yaw), 0.18 + f * 0.48 + 0.24, p.z - 0.25 - dx * Math.sin(p.yaw), 0.42, 0.45, 0.42, vary(PAL.stoneWarm, 0.02), 0.85, 0, 0, -1, (p.x + 40) / 80));
    }
  }
  // stone garden fading into the haze
  for (let x = -44; x <= 44; x += 1.7) for (const z of [-13.6, -11.9, -10.2, -8.5, -6.8, -5.1, 5.1, 6.8, 8.5]) {
    if (rng() < 0.45) continue;
    const h = 0.06 + Math.pow(rng(), 2.2) * 0.9;
    out.push(S(x + (rng() - 0.5) * 0.2, h / 2, z, 1.6, h, 1.6, vary(PAL.stone, 0.04), 0.9, 0, 0, -1, (x + 44) / 88 * 0.8 + rng() * 0.2));
  }
  return { slots: normaliseKeys(out) };
}

/* ───────── assignment ───────── */
// Build N-length typed arrays for every state, matching slots to blocks so that travel is short.
export function buildStates() {
  const L = logo();
  const C = city();
  const B = buildingSlots(false);
  const X = buildingSlots(true);
  const han = hanSlots();
  const ruinSlots = [], restSlots = [];
  han.forEach((s, i) => {
    if (!s.missing) ruinSlots.push({ ...s, hi: i });
  });
  han.forEach((s, i) => {
    const r = { ...s, hi: i };
    if (s.missing) { r.c = vary(PAL.newStone, 0.02); r.m = [r.m[0], r.m[1], r.m[2], -2]; }
    restSlots.push(r);
  });
  normaliseKeys(ruinSlots);
  // restoration: the new stones arrive bottom-up
  restSlots.forEach((s) => { s.k = s.missing ? 0.15 + s.p[1] / HAN.H * 0.85 : 0; });
  const A = archive();

  const defs = [
    { name: 'logo', slots: L.slots },
    { name: 'city', slots: C.slots, groups: C.groups },
    { name: 'building', slots: B.slots },
    { name: 'bim', slots: X.slots, sameOrder: true, labels: X.labels },
    { name: 'ruin', slots: ruinSlots },
    { name: 'restored', slots: restSlots, refKey: 'hi' },
    { name: 'archive', slots: A.slots },
    { name: 'contact', slots: logo().slots },
  ];

  const states = [];
  let prev = null;
  for (const def of defs) {
    const slots = def.slots.slice(0, N);
    const st = {
      name: def.name, groups: def.groups, labels: def.labels,
      pos: new Float32Array(N * 3), size: new Float32Array(N * 3), col: new Float32Array(N * 3),
      mat: new Float32Array(N * 4), key: new Float32Array(N), active: new Uint8Array(N), slotOf: new Int32Array(N).fill(-1),
      slots,
    };
    const owner = new Int32Array(slots.length).fill(-1);
    const taken = new Uint8Array(N);
    if (!prev) {
      slots.forEach((_, j) => { owner[j] = j; taken[j] = 1; });
    } else if (def.sameOrder) {
      slots.forEach((_, j) => { const i = prev.ownerOf[j]; if (i >= 0) { owner[j] = i; taken[i] = 1; } });
    } else if (def.refKey) {
      const byRef = new Map();
      prev.slots.forEach((s, j) => byRef.set(s[def.refKey], prev.ownerOf[j]));
      slots.forEach((s, j) => { const i = byRef.get(s[def.refKey]); if (i !== undefined && i >= 0) { owner[j] = i; taken[i] = 1; } });
    }
    // greedy nearest for the rest: prefer blocks that are visible in the previous state (they fly), else rise from the ground
    const order = slots.map((_, j) => j).filter((j) => owner[j] < 0).sort((a, b) => slots[a].k - slots[b].k);
    for (const j of order) {
      const [x, , z] = slots[j].p;
      let best = -1, bd = Infinity;
      for (let i = 0; i < N; i++) {
        if (taken[i]) continue;
        let d;
        if (prev) {
          const dx = prev.pos[i * 3] - x, dz = prev.pos[i * 3 + 2] - z;
          d = dx * dx + dz * dz + (prev.active[i] ? 0 : 60);
        } else d = i;
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) break;
      owner[j] = best; taken[best] = 1;
    }
    st.ownerOf = owner;
    slots.forEach((s, j) => {
      const i = owner[j];
      if (i < 0) return;
      st.pos.set(s.p, i * 3); st.size.set(s.s, i * 3); st.col.set(s.c, i * 3); st.mat.set(s.m, i * 4);
      st.key[i] = s.k; st.active[i] = 1; st.slotOf[i] = j;
    });
    // idle blocks rest underground beneath where they were, so they can rise from there later
    for (let i = 0; i < N; i++) {
      if (st.active[i]) continue;
      let x, z, sx = 1, sy = 0.5, sz = 1, c = PAL.plaster;
      if (prev) {
        x = prev.pos[i * 3]; z = prev.pos[i * 3 + 2];
        sx = prev.size[i * 3]; sy = prev.size[i * 3 + 1]; sz = prev.size[i * 3 + 2];
        c = [prev.col[i * 3], prev.col[i * 3 + 1], prev.col[i * 3 + 2]];
      } else {
        x = (rng() - 0.5) * 56; z = (rng() - 0.5) * 44;
      }
      st.pos.set([x, -sy / 2 - 0.08, z], i * 3); st.size.set([sx, sy, sz], i * 3); st.col.set(c, i * 3);
      st.mat.set([0.9, 0, 0, -1], i * 4);
      st.key[i] = prev ? prev.key[i] : rng();
    }
    states.push(st);
    prev = st;
  }
  return states;
}

// Per-block delay for the transition a → b: blocks being built follow b's build order,
// blocks leaving go first so the ground is cleared before the new form rises.
export function transitionDelays(a, b, out) {
  for (let i = 0; i < N; i++) {
    if (b.active[i]) out[i] = a.active[i] ? 0.15 + b.key[i] * 0.85 : 0.25 + b.key[i] * 0.75;
    else out[i] = a.active[i] ? a.key[i] * 0.35 : 0;
  }
  return out;
}

export { HAN, BLD };
