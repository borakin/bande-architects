import '@fontsource/inter-tight/400.css';
import '@fontsource/inter-tight/500.css';
import '@fontsource/inter-tight/400-italic.css';
import '@fontsource/silkscreen/400.css';
import './styles.css';

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { Vector3, Vector2, Raycaster, Plane, Box3 } from 'three';
import { content } from './data/content.js';
import { BANDE } from './data/logoGrid.js';
import { buildStates, FLOOR } from './scene/states.js';
import { Voxels } from './scene/Voxels.js';
import { World } from './scene/World.js';
import { ScanCloud } from './scene/ScanCloud.js';
import {
  CHAPTERS, MORPHS, SCAN, ARCHIVE_HOLD, CITY_HOLD, cameraAt, sunAt, morphAt, band,
} from './scene/Timeline.js';
import { Narrative } from './ui/Narrative.js';
import { Works } from './ui/Works.js';
import { Sound } from './ui/Sound.js';

const $ = (s) => document.querySelector(s);
const mobile = window.matchMedia('(max-width: 768px)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang = 'tr';
try { lang = localStorage.getItem('bande-lang') === 'en' ? 'en' : 'tr'; } catch (_) {}
let C = content[lang];

/* ───────── scroll: film spacer, the works section, film spacer ─────────
   The film holds at ARCHIVE_HOLD while the works grid scrolls past in the normal page flow, so the grid
   scrolls and swipes like any page. pFromY / yFromP translate between scroll position and film progress. */
const film = $('#film');
const mkSpacer = () => { const d = document.createElement('div'); d.className = 'spacer'; return d; };
const spacerA = mkSpacer(), spacerB = mkSpacer();
const works = new Works({ reduced, onPick: (i, from) => openProject(i, { from }) });
film.append(spacerA, works.el, spacerB);
const narrative = new Narrative(film);
const S = { Lf: 0, Y1: 0, Wh: 0, A: 0, B: 0, top: 0 };
function layout() {
  const vh = innerHeight;
  if (!(vh > 0)) return; // hidden or zero-size window: keep the last good layout
  S.Lf = 10.5 * vh;
  S.Y1 = ARCHIVE_HOLD * S.Lf;
  S.A = 0.07 * S.Lf; S.B = 0.115 * S.Lf;
  S.Wh = works.el.offsetHeight;
  S.top = S.Y1 + vh;
  spacerA.style.height = `${S.top}px`;
  spacerB.style.height = `${S.A + S.B}px`;
  lenis && lenis.resize();
}
function pFromY(y) {
  const { Lf, Y1, Wh, A, B } = S, e = Y1 + Wh;
  if (!(Lf > 0 && A > 0 && B > 0)) return 0;
  if (y <= Y1) return y / Lf;
  if (y <= e) return ARCHIVE_HOLD;
  if (y <= e + A) return ARCHIVE_HOLD + ((y - e) / A) * (0.885 - ARCHIVE_HOLD);
  return 0.885 + ((y - e - A) / B) * 0.115;
}
function yFromP(p) {
  const { Lf, Y1, Wh, A, B } = S, e = Y1 + Wh;
  if (p <= ARCHIVE_HOLD) return p * Lf;
  if (p <= 0.885) return e + ((p - ARCHIVE_HOLD) / (0.885 - ARCHIVE_HOLD)) * A;
  return e + A + ((p - 0.885) / 0.115) * B;
}

/* ───────── WebGL or graceful fallback ───────── */
let world;
try {
  world = new World($('#gl'), { mobile });
} catch (e) {
  document.body.classList.add('no-webgl');
  narrative.render(C);
  works.render(C);
  $('#loader').remove();
  // the rest of the script needs WebGL, so the case view gets its own small wiring here
  const shut = () => { works.close(); document.body.classList.remove('project-open'); };
  works.onPick = (i, from) => { document.body.classList.add('project-open'); works.open(i, { from }); };
  $('#caseBack').addEventListener('click', shut);
  $('#caseNext').addEventListener('click', () => works.open((works.index + 1) % C.projects.length));
  window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && works.isOpen) shut(); });
  throw e;
}

const states = buildStates();
const voxels = new Voxels(states);
world.scene.add(voxels.mesh, voxels.lines);
const scan = new ScanCloud(mobile ? 26000 : 70000);
world.scene.add(scan.points);

/* ───────── loader ───────── */
const loaderGrid = $('#loaderGrid');
const cells = [];
BANDE.forEach((row) => [...row].forEach((ch) => {
  const s = document.createElement('i');
  if (ch === '#') { s.className = 'on'; cells.push(s); }
  loaderGrid.appendChild(s);
}));
cells.sort(() => Math.random() - 0.5);
const loaderPct = $('#loaderPct');
let shown = 0;

/* ───────── lenis ───────── */
const lenis = new Lenis({ lerp: reduced ? 1 : 0.1, wheelMultiplier: 1, touchMultiplier: 1.5, autoRaf: false });
lenis.stop();
gsap.ticker.lagSmoothing(0);
new ResizeObserver(layout).observe(works.el);

/* ───────── state ───────── */
const pointer = new Vector2(0, 0), pointerPx = new Vector2(-999, -999);
let hasPointer = false;
const ray = new Raycaster();
const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
const mouseWorld = new Vector3(999, 0, 999);
const box = new Box3();
const Y_AXIS = new Vector3(0, 1, 0);
const camPos = new Vector3(), camTgt = new Vector3(), basePos = new Vector3(), baseTgt = new Vector3();
const shift = new Vector2(), baseShift = new Vector2();
const tmpV = new Vector3(), tmpV2 = new Vector3();
const sun = { az: 0, el: 0, i: 0, amb: 0, color: new (world.sun.color.constructor)(), bg: new (world.sun.color.constructor)(), dusk: 0 };
const view = { menu: 0, intro: 0 };
let ps = 0, lastMix = 0, lastK = -1, hoverGroup = -1, openIndex = -1;
const dyn = { v: 0 };
let firstFrame = true;

/* ───────── labels projected from 3D ───────── */
const labelsRoot = $('#labels');
const mkLabel = (cls) => { const el = document.createElement('div'); el.className = `lbl ${cls}`; labelsRoot.appendChild(el); return el; };
const parcelLabel = mkLabel('lbl--parcel');
const scanLabel = mkLabel('lbl--scan');
const bimLabels = (states[3].labels || []).map((l) => ({ ...l, el: mkLabel('lbl--bim') }));
function project(v) {
  v.project(world.camera);
  return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, front: v.z < 1 };
}
function place(el, x, y, o) {
  el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  el.style.opacity = o.toFixed(3);
  el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
}

/* ───────── content / language ───────── */
const pad = (n) => String(n).padStart(2, '0');
const ascii = (s) => s.toUpperCase().replace(/İ/g, 'I').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'I');
function applyLang() {
  C = content[lang];
  document.documentElement.lang = lang;
  document.title = C.meta.title;
  document.querySelector('meta[name="description"]').setAttribute('content', C.meta.description);
  document.querySelectorAll('[data-t]').forEach((el) => {
    const [a, b] = el.dataset.t.split('.');
    el.textContent = C[a][b];
  });
  const lb = $('#langBtn').children;
  lb[0].classList.toggle('is-on', lang === 'tr'); lb[1].classList.toggle('is-on', lang === 'en');
  narrative.render(C);
  works.render(C);
  $('#menuList').innerHTML = C.chapters.map((ch, i) =>
    `<li><button type="button" data-i="${i}"><span class="px">${pad(i + 1)}</span>${ch.title.join(' ')}</button></li>`).join('');
  $('#menuFoot').innerHTML = `<a href="mailto:${C.contact.email}">${C.contact.email}</a><span>${C.contact.address.join(', ')}</span>`
    + C.contact.social.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join('');
  bindMenu();
  sound && ($('#soundBtn').textContent = sound.on ? C.ui.soundOn : C.ui.sound);
}
$('#langBtn').addEventListener('click', () => {
  lang = lang === 'tr' ? 'en' : 'tr';
  try { localStorage.setItem('bande-lang', lang); } catch (_) {}
  applyLang();
});

/* ───────── sound ───────── */
const sound = new Sound();
$('#soundBtn').addEventListener('click', (e) => {
  const on = sound.toggle();
  e.currentTarget.setAttribute('aria-pressed', on);
  e.currentTarget.textContent = on ? C.ui.soundOn : C.ui.sound;
});

/* ───────── menu: the camera steps back to an overview while you choose ───────── */
const menu = $('#menu');
let menuOrigin = 0;
function setMenu(open) {
  if (open === menu.classList.contains('is-open')) return;
  if (open && openIndex >= 0) closeProject();
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', !open);
  $('#menuBtn').setAttribute('aria-expanded', open);
  $('#menuBtn').textContent = open ? C.ui.close : C.ui.menu;
  document.body.classList.toggle('menu-open', open);
  gsap.to(view, { menu: open ? 1 : 0, duration: 1.2, ease: 'power3.inOut' });
  if (open) {
    menuOrigin = lenis.scroll; menu.picked = false;
    menu.quiet = true; // focusing the first item must not rewind the film
    menu.querySelector('button')?.focus({ preventScroll: true });
    menu.quiet = false;
  }
  else if (!menu.picked) lenis.scrollTo(menuOrigin, { duration: 1.4 });
}
const holdScroll = (i) => (CHAPTERS[i].id === 'archive' ? S.top : yFromP(Math.max(0, Math.min(1, CHAPTERS[i].hold))));
function bindMenu() {
  menu.querySelectorAll('button[data-i]').forEach((b) => {
    const i = +b.dataset.i;
    b.addEventListener('mouseenter', () => lenis.scrollTo(holdScroll(i), { duration: 1.6 }));
    b.addEventListener('focus', () => { if (!menu.quiet && b.matches(':focus-visible')) lenis.scrollTo(holdScroll(i), { duration: 1.6 }); });
    b.addEventListener('click', () => { menu.picked = true; lenis.scrollTo(holdScroll(i), { duration: 1.2 }); setMenu(false); });
  });
}
$('#menuBtn').addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
document.querySelector('.brand').addEventListener('click', (e) => { e.preventDefault(); closeProject(); setMenu(false); lenis.scrollTo(0, { duration: 2.4 }); });

/* ───────── case view: a card opens into the full project ───────── */
let pushedCase = false; // the open case added its own history entry, so closing steps back over it
function openProject(i, { from, instant } = {}) {
  if (i < 0 || i >= C.projects.length) return;
  setMenu(false);
  const wasOpen = openIndex >= 0;
  openIndex = i;
  const hash = `#/${C.projects[i].slug}`;
  if (location.hash !== hash) {
    if (wasOpen) history.replaceState(null, '', hash);
    else { history.pushState(null, '', hash); pushedCase = true; }
  }
  lenis.stop();
  document.body.classList.add('project-open');
  film.inert = true;
  works.open(i, { from, instant });
  setTimeout(() => $('#caseBack').focus({ preventScroll: true, focusVisible: false }), 700);
}
function closeProject() {
  if (openIndex < 0) return;
  const i = openIndex;
  openIndex = -1;
  document.body.classList.remove('project-open');
  film.inert = false;
  if (location.hash.startsWith('#/')) {
    if (pushedCase) history.back(); else history.replaceState(null, '', location.pathname + location.search);
  }
  pushedCase = false;
  works.close(() => {
    lenis.start();
    works.el.querySelector(`.card[data-i="${i}"]`)?.focus({ preventScroll: true });
  });
}
$('#caseBack').addEventListener('click', closeProject);
$('#caseNext').addEventListener('click', () => openProject((openIndex + 1) % C.projects.length));
function routeFromHash() {
  const slug = location.hash.replace('#/', '');
  const i = C.projects.findIndex((p) => p.slug === slug);
  if (i >= 0) {
    // put the page at the works section first so closing lands beside the card
    lenis.scrollTo(S.top, { immediate: true, force: true });
    openProject(i, { instant: true });
  } else closeProject();
}
window.addEventListener('popstate', routeFromHash);

/* ───────── input ───────── */
window.addEventListener('pointermove', (e) => {
  hasPointer = true;
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  pointerPx.set(e.clientX, e.clientY);
}, { passive: true });
window.addEventListener('pointerleave', () => { hasPointer = false; });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (openIndex >= 0) closeProject(); else setMenu(false); return; }
  if (openIndex >= 0 || menu.classList.contains('is-open')) return;
  const cur = CHAPTERS.findIndex((c) => ps <= Math.max(c.hold, 0) + 0.02);
  if (e.key === 'PageDown' || (e.key === 'ArrowDown' && e.altKey)) { e.preventDefault(); lenis.scrollTo(holdScroll(Math.min(6, Math.max(0, cur) + 1)), { duration: 2 }); }
  if (e.key === 'PageUp' || (e.key === 'ArrowUp' && e.altKey)) { e.preventDefault(); lenis.scrollTo(holdScroll(Math.max(0, cur - 1)), { duration: 2 }); }
});
let rt;
window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { world.resize(); layout(); }, 120); });

/* ───────── adaptive quality ───────── */
let slow = 0, quality = 2;
function adapt(dt) {
  // only judge real, visible frames: a throttled background tab must not lower quality
  if (document.hidden || dt > 0.1) return;
  if (dt > 0.026) slow += dt; else slow = Math.max(0, slow - dt * 0.5);
  if (slow > 1.5 && quality > 0) {
    slow = 0; quality--;
    if (quality === 1 && world.ao) world.ao.configuration.halfRes = true;
    if (quality === 0) { world.renderer.setPixelRatio(1); world.resize(); }
  }
}

/* ───────── frame ───────── */
const hud = { no: $('#chapterNo'), label: $('#chapterLabel'), bar: $('#progressBar') };
const hudTop = $('.hud--top');
// page content scrolls under the top bar only inside the works section: the bar takes the ground there
function barSolid() {
  const r = works.el.getBoundingClientRect();
  document.body.classList.toggle('bar-solid', r.top < hudTop.offsetHeight && r.bottom > 0);
}
window.addEventListener('scroll', barSolid, { passive: true });
window.addEventListener('resize', barSolid);
let lastChapter = -1, time = 0;
function frame(dt, raw = dt) {
  time += dt;
  lenis.raf(time * 1000);
  let p = lenis.limit > 0 ? pFromY(lenis.scroll) : 0;
  if (!Number.isFinite(p)) p = Number.isFinite(ps) ? ps : 0;
  ps = firstFrame || reduced || !Number.isFinite(ps) ? p : ps + (p - ps) * (1 - Math.exp(-dt * 14));
  firstFrame = false;

  // blocks
  const m = morphAt(ps);
  voxels.setTransition(m.k, m.spread);
  voxels.uniforms.uMix.value = m.mix;
  voxels.uniforms.uIntro.value = view.intro;
  const rate = m.k === lastK ? Math.abs(m.mix - lastMix) / Math.max(dt, 1e-3) : 0;
  lastMix = m.mix; lastK = m.k;
  sound.update(rate * 600, dt);

  // camera along the script, with portrait reframing, pointer parallax, menu pull-back and project close-up
  cameraAt(ps, basePos, baseTgt, baseShift);
  // opening shot: start low and close, swing round and rise as the logo builds itself
  if (view.intro < 1) {
    const ii = Math.pow(1 - view.intro, 2);
    const off = tmpV.subVectors(basePos, baseTgt);
    off.applyAxisAngle(Y_AXIS, ii * 0.75);
    off.multiplyScalar(1 - 0.34 * ii);
    off.y *= 1 - 0.5 * ii;
    basePos.copy(baseTgt).add(off);
  }
  // the camera never stands still: a slow breath, plus a swing that follows the scroll's speed and direction
  const vel = reduced ? 0 : (lenis.velocity || 0);
  dyn.v += (Math.max(-70, Math.min(70, vel)) - dyn.v) * (1 - Math.exp(-dt * 4));
  {
    const off = tmpV.subVectors(basePos, baseTgt);
    off.applyAxisAngle(Y_AXIS, (dyn.v * 0.0024 + Math.sin(time * 0.17) * 0.035));
    off.multiplyScalar(1 + Math.abs(dyn.v) * 0.0016);
    basePos.copy(baseTgt).add(off);
  }
  const aspect = innerWidth / innerHeight;
  const reframe = aspect < 1 ? Math.min(2.2, 0.8 / aspect + 0.1) * (1 - 0.38 * band(ps, 0.69, 0.885, 0.02)) : aspect < 1.3 ? 1.05 : Math.max(1, 1.62 / aspect);
  basePos.sub(baseTgt).multiplyScalar(reframe * (1 + view.menu * 0.45)).add(baseTgt);
  basePos.y += view.menu * 6;
  world.scene.fog.near = 55 * reframe; world.scene.fog.far = 140 * reframe;
  if (hasPointer && !coarse) {
    const off = tmpV.subVectors(basePos, baseTgt);
    const len = off.length();
    const side = tmpV2.set(off.z, 0, -off.x).normalize();
    basePos.addScaledVector(side, pointer.x * len * 0.018);
    basePos.y += pointer.y * len * 0.012;
  }
  const k = 1 - Math.exp(-dt * 9);
  camPos.lerp(basePos, k); camTgt.lerp(baseTgt, k);
  if (view.intro < 1 && camPos.lengthSq() === 0) { camPos.copy(basePos); camTgt.copy(baseTgt); }
  world.camera.position.copy(camPos);
  world.camera.lookAt(camTgt);
  // lens shift keeps the model clear of the type; portrait screens stack type above/below instead
  const keep = 1 - view.menu * 0.6;
  baseShift.multiplyScalar(keep);
  baseShift.x += view.menu * 0.2;
  if (aspect < 1) baseShift.set(0.3 * band(ps, 0.69, 0.885, 0.02), -0.03 * keep);
  shift.lerp(baseShift, k);
  const W = innerWidth, H = innerHeight;
  world.camera.fov = world.baseFov + Math.min(4, Math.abs(dyn.v) * 0.05);
  world.camera.setViewOffset(W, H, -shift.x * W, -shift.y * H, W, H);

  // light and air
  sunAt(ps, sun);
  const dist = camPos.distanceTo(camTgt);
  world.shadowSize = Math.round(Math.min(46, Math.max(16, dist * 0.62)));
  tmpV.set(camTgt.x, 0, camTgt.z);
  world.setSun(sun, tmpV);
  voxels.uniforms.uDusk.value = sun.dusk;
  // CAD drawing: hidden-line edges always; BIM and the scan turn the model into x-ray wireframe
  const xray = Math.max(band(ps, 0.37, 0.46, 0.03), band(ps, SCAN.a, 0.575, 0.03) * 0.8);
  voxels.material.opacity = 1 - 0.92 * xray;
  voxels.material.depthWrite = xray < 0.02;
  voxels.lineUniforms.uLines.value = 0.42 + 0.5 * xray;
  voxels.lineUniforms.uFogNear.value = world.scene.fog.near;
  voxels.lineUniforms.uFogFar.value = world.scene.fog.far;
  world.groundUniforms.uGrid.value = 0.3 + 0.7 * Math.max(band(ps, 0.1, 0.225, 0.04), band(ps, 0.355, 0.47, 0.03));

  // survey
  const sweep = Math.min(1, Math.max(0, (ps - SCAN.a) / (SCAN.b - SCAN.a)));
  scan.update(sweep, band(ps, SCAN.a - 0.005, 0.605, 0.03), world.renderer.getPixelRatio());

  // pointer in the world: lift blocks on the logo, read parcels in the city, 
  ray.setFromCamera(pointer, world.camera);
  hoverGroup = -1;
  const logoAmt = band(ps, -1, 0.042, 0.03) + band(ps, 0.955, 2, 0.03);
  const cityAmt = band(ps, CITY_HOLD.a, CITY_HOLD.b, 0.012);
  if (hasPointer && !coarse && ray.ray.intersectPlane(groundPlane, mouseWorld)) {
    voxels.uniforms.uMouse.value.copy(mouseWorld);
    if (cityAmt > 0.5) {
      // nearest building volume under the pointer (not the ground behind it)
      let best = Infinity;
      for (const g of states[1].groups) {
        box.min.set(g.x - g.w / 2, 0, g.z - g.d / 2); box.max.set(g.x + g.w / 2, g.h, g.z + g.d / 2);
        if (ray.ray.intersectBox(box, tmpV2)) {
          const d = tmpV2.distanceToSquared(ray.ray.origin);
          if (d < best) { best = d; hoverGroup = g.id; }
        }
      }
    }
  }
  voxels.uniforms.uMouseAmt.value += ((hasPointer && !coarse ? logoAmt : 0) - voxels.uniforms.uMouseAmt.value) * Math.min(1, dt * 4);
  voxels.uniforms.uHover.value = hoverGroup;
  if (hoverGroup >= 0) {
    const g = states[1].groups[hoverGroup];
    const s = project(tmpV.set(g.x, g.h + 0.6, g.z));
    const T = lang === 'tr' ? ['ADA', 'PARSEL', 'KAT'] : ['BLOCK', 'PLOT', 'FLOORS'];
    parcelLabel.innerHTML = `${T[0]} ${g.ada} / ${T[1]} ${g.parcel}<br>TAKS ${g.taks.toFixed(2)} · KAKS ${g.kaks.toFixed(2)}<br>${g.floors} ${T[2]} · H ${(g.floors * 3.2).toFixed(1)} M`;
    place(parcelLabel, s.x, s.y, cityAmt);
  } else place(parcelLabel, 0, 0, 0);

  // labels
  const bimV = band(ps, 0.392, 0.448, 0.02);
  bimLabels.forEach((l, j) => {
    const s = project(tmpV.set(-9.6, l.y, 5.2));
    l.el.textContent = `L${pad(l.fl)}  +${(l.fl * 3.2).toFixed(2)}`;
    place(l.el, s.x, s.y, bimV * (s.front ? 1 : 0) * Math.min(1, Math.max(0, bimV * 3 - j * 0.3)));
  });
  const scanX = scan.uniforms.uScan.value;
  const sv = band(ps, SCAN.a + 0.005, SCAN.b + 0.01, 0.01);
  if (sv > 0) {
    const s = project(tmpV.set(Math.min(13, scanX), 9.6, 0.4));
    scanLabel.innerHTML = `X ${scanX.toFixed(2)}<br>${(sweep * 4.2).toFixed(2)}M PTS`;
    place(scanLabel, s.x, s.y, sv);
  } else place(scanLabel, 0, 0, 0);
  // text + hud
  const vh = innerHeight;
  const active = narrative.update(ps, vh, Math.min(1, Math.max(0, (view.intro - 0.55) / 0.45)));
  if (active !== lastChapter) {
    lastChapter = active;
    hud.no.textContent = pad(active + 1);
    hud.label.textContent = `${pad(active + 1)} — ${C.chapters[active].label}`;
  }
  hud.bar.style.transform = `scaleX(${p.toFixed(4)})`;

  adapt(raw);
  world.render(time);
}

/* ───────── boot ───────── */
async function boot() {
  applyLang();
  layout();
  works.watch();
  // first compile happens behind the loader
  cameraAt(0, camPos, camTgt);
  world.camera.position.copy(camPos); world.camera.lookAt(camTgt);
  voxels.setTransition(0, MORPHS[0].spread);
  const steps = [
    document.fonts.ready,
    new Promise((r) => setTimeout(r, reduced ? 200 : 1600)),
  ];
  let done = 0;
  steps.forEach((s) => s.then(() => { done++; }));
  const tickLoader = () => {
    const target = Math.round((done / steps.length) * cells.length);
    while (shown < target) cells[shown++].classList.add('lit');
    loaderPct.textContent = pad(Math.round((shown / cells.length) * 100)).slice(-3);
  };
  const li = setInterval(tickLoader, 50);
  await Promise.all(steps);
  world.renderer.compile(world.scene, world.camera);
  clearInterval(li);
  while (shown < cells.length) cells[shown++].classList.add('lit');
  loaderPct.textContent = '100';
  gsap.ticker.add((t, dms) => frame(Math.min(dms / 1000, 1 / 20), dms / 1000));
  await new Promise((r) => setTimeout(r, 250));
  document.body.classList.add('is-ready');
  gsap.to('#loader', { opacity: 0, duration: 0.9, ease: 'power2.inOut', delay: 0.15, onComplete: () => $('#loader').remove() });
  gsap.to(view, {
    intro: 1, duration: reduced ? 0.01 : 3.6, ease: 'sine.inOut', delay: 0,
    onComplete: () => { lenis.start(); if (location.hash.startsWith('#/')) routeFromHash(); },
  });
}
boot();
if (import.meta.env.DEV) {
  window.__bande = {
    world, voxels, states, works, scan, lenis, view, get ps() { return ps; },
    // jump the film to progress p and settle it (for inspection while the pane is in the background)
    async at(p, frames = 40) {
      view.intro = 1; lenis.start();
      lenis.scrollTo(yFromP(p), { immediate: true, force: true });
      for (let i = 0; i < frames; i++) frame(1 / 30);
      await new Promise((r) => setTimeout(r, 350));
      frame(1 / 30);
      await new Promise((r) => setTimeout(r, 120));
      return { ps: +ps.toFixed(4), k: voxels.current, mix: +voxels.uniforms.uMix.value.toFixed(3) };
    },
  };
}
