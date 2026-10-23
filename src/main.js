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
import { buildStates, PLATES, FLOOR } from './scene/states.js';
import { Voxels } from './scene/Voxels.js';
import { World } from './scene/World.js';
import { Plates } from './scene/Plates.js';
import { ScanCloud } from './scene/ScanCloud.js';
import {
  CHAPTERS, MORPHS, SCAN, ARCHIVE, CITY_HOLD, cameraAt, sunAt, morphAt, band,
} from './scene/Timeline.js';
import { Narrative } from './ui/Narrative.js';
import { Sound } from './ui/Sound.js';

const $ = (s) => document.querySelector(s);
const mobile = window.matchMedia('(max-width: 768px)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang = 'tr';
try { lang = localStorage.getItem('bande-lang') === 'en' ? 'en' : 'tr'; } catch (_) {}
let C = content[lang];

/* ───────── scroll spacer ───────── */
const film = $('#film');
const spacer = document.createElement('div');
spacer.className = 'spacer';
film.appendChild(spacer);
const narrative = new Narrative(film);

/* ───────── WebGL or graceful fallback ───────── */
let world;
try {
  world = new World($('#gl'), { mobile });
} catch (e) {
  document.body.classList.add('no-webgl');
  narrative.render(C);
  $('#loader').remove();
  throw e;
}

const states = buildStates();
const voxels = new Voxels(states);
world.scene.add(voxels.mesh, voxels.lines);
const scan = new ScanCloud(mobile ? 26000 : 70000);
world.scene.add(scan.points);

let loadedTex = 0;
const plates = new Plates(C.projects, () => { loadedTex++; });
plates.bindFog(world.scene.fog);
world.scene.add(plates.group);

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
const view = { menu: 0, project: 0, intro: 0 };
const projCam = { pos: new Vector3(), tgt: new Vector3() };
let ps = 0, lastMix = 0, lastK = -1, hoverGroup = -1, hoverPlate = -1, openIndex = -1;
const dyn = { v: 0 };
let firstFrame = true;

/* ───────── labels projected from 3D ───────── */
const labelsRoot = $('#labels');
const mkLabel = (cls) => { const el = document.createElement('div'); el.className = `lbl ${cls}`; labelsRoot.appendChild(el); return el; };
const parcelLabel = mkLabel('lbl--parcel');
const scanLabel = mkLabel('lbl--scan');
const bimLabels = (states[3].labels || []).map((l) => ({ ...l, el: mkLabel('lbl--bim') }));
const captions = PLATES.map((P, i) => {
  const el = mkLabel('lbl--cap');
  el.addEventListener('click', () => openProject(i));
  return { el, P, i };
});

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
  captions.forEach((c, i) => {
    const p = C.projects[i];
    c.el.innerHTML = `<span class="px">${pad(i + 1)}</span><b>${p.title}</b><em>${p.place} · ${p.year}</em>`;
  });
  $('#menuList').innerHTML = C.chapters.map((ch, i) =>
    `<li><button type="button" data-i="${i}"><span class="px">${pad(i + 1)}</span>${ch.title.join(' ')}</button></li>`).join('');
  $('#menuFoot').innerHTML = `<a href="mailto:${C.contact.email}">${C.contact.email}</a><span>${C.contact.address.join(', ')}</span>`
    + C.contact.social.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join('');
  bindMenu();
  if (openIndex >= 0) fillProject(openIndex);
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
const holdScroll = (i) => Math.max(0, Math.min(1, CHAPTERS[i].hold)) * lenis.limit;
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

/* ───────── project view: the camera walks up to a print and it becomes the page ───────── */
const proj = $('#project');
function fillProject(i) {
  const p = C.projects[i];
  $('#projectIdx').textContent = `${pad(i + 1)} / ${pad(C.projects.length)}`;
  $('#projectTitle').textContent = p.title;
  const L = lang === 'tr'
    ? [['Yer', p.place], ['Yıl', p.year], ['Tür', p.type], ['Alan', p.area], ['Rol', p.role]]
    : [['Place', p.place], ['Year', p.year], ['Type', p.type], ['Area', p.area], ['Role', p.role]];
  if (p.award) L.push([lang === 'tr' ? 'Ödül' : 'Award', p.award]);
  if (p.photo) L.push([lang === 'tr' ? 'Fotoğraf' : 'Photo', p.photo]);
  $('#projectMeta').innerHTML = L.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('#projectSummary').textContent = p.summary;
  $('#projectGallery').innerHTML = p.gallery.map((g, j) =>
    `<button type="button" data-g="${g}" class="${j === 0 ? 'is-on' : ''}" aria-label="${pad(j + 1)}">${pad(j + 1)}</button>`).join('');
  $('#projectGallery').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    $('#projectGallery').querySelectorAll('button').forEach((x) => x.classList.toggle('is-on', x === b));
    swapImage(i, b.dataset.g);
  }));
}
function swapImage(i, key) {
  const it = plates.items[i];
  const u = it.mat.uniforms;
  u.uTex2.value = plates.tex(key);
  gsap.killTweensOf(u.uSwap);
  u.uSwap.value = 0;
  gsap.to(u.uSwap, { value: 1, duration: reduced ? 0.01 : 1.1, ease: 'power2.inOut', onComplete: () => { u.uTex.value = u.uTex2.value; u.uSwap.value = 0; } });
}
function projectPose(i) {
  const P = PLATES[i];
  const n = tmpV.set(Math.sin(P.yaw), 0, Math.cos(P.yaw));
  const right = tmpV2.set(Math.cos(P.yaw), 0, -Math.sin(P.yaw));
  const cam = world.camera, fov = cam.fov * Math.PI / 180, a = cam.aspect;
  const portrait = a < 1;
  const fill = portrait ? 0.9 : 0.74;
  const dH = (P.h / 2) / Math.tan(fov / 2) / fill;
  const dW = (P.w / 2) / (Math.tan(fov / 2) * a) / fill;
  // landscape: the print takes the right ~56% so the case text keeps its column
  const dW56 = (P.w / 2) / (Math.tan(fov / 2) * a * 0.52);
  const d = portrait ? dW : Math.max(dH, dW56);
  const visW = 2 * d * Math.tan(fov / 2) * a, visH = 2 * d * Math.tan(fov / 2);
  const c = new Vector3(P.x, P.y, P.z);
  const shift = new Vector3();
  if (portrait) shift.set(0, -visH * 0.2, 0); else shift.copy(right).multiplyScalar(-visW * 0.225);
  projCam.tgt.copy(c).add(shift);
  projCam.pos.copy(c).addScaledVector(n, d).add(shift);
}
function openProject(i, instant = false) {
  if (i < 0 || i >= PLATES.length) return;
  setMenu(false);
  const wasOpen = openIndex >= 0;
  openIndex = i;
  fillProject(i);
  if (location.hash !== `#/${C.projects[i].slug}`) history.pushState(null, '', `#/${C.projects[i].slug}`);
  lenis.stop();
  document.body.classList.add('project-open');
  proj.setAttribute('aria-hidden', 'false');
  const from = { pos: projCam.pos.clone(), tgt: projCam.tgt.clone() };
  projectPose(i);
  if (wasOpen) {
    const to = { pos: projCam.pos.clone(), tgt: projCam.tgt.clone() };
    const o = { t: 0 };
    gsap.to(o, {
      t: 1, duration: 1.4, ease: 'power3.inOut',
      onUpdate: () => { projCam.pos.lerpVectors(from.pos, to.pos, o.t); projCam.tgt.lerpVectors(from.tgt, to.tgt, o.t); },
    });
  }
  gsap.to(view, { project: 1, duration: instant || reduced ? 0.01 : 1.6, ease: 'power3.inOut' });
  plates.items[i].reveal = Math.max(plates.items[i].reveal, 0.6);
  setTimeout(() => $('#projectBack').focus({ preventScroll: true, focusVisible: false }), 700);
}
function closeProject() {
  if (openIndex < 0) return;
  const i = openIndex;
  openIndex = -1;
  document.body.classList.remove('project-open');
  proj.setAttribute('aria-hidden', 'true');
  if (location.hash.startsWith('#/')) history.pushState(null, '', location.pathname);
  gsap.to(view, { project: 0, duration: reduced ? 0.01 : 1.5, ease: 'power3.inOut', onComplete: () => lenis.start() });
  const it = plates.items[i];
  if (it.mat.uniforms.uTex.value !== plates.tex(C.projects[i].img)) swapImage(i, C.projects[i].img);
}
$('#projectBack').addEventListener('click', closeProject);
$('#projectNext').addEventListener('click', () => openProject((openIndex + 1) % PLATES.length));
function routeFromHash() {
  const slug = location.hash.replace('#/', '');
  const i = C.projects.findIndex((p) => p.slug === slug);
  if (i >= 0) {
    // move the film to the archive first so closing lands beside the print
    lenis.scrollTo(((ARCHIVE.a + ARCHIVE.b) / 2) * lenis.limit, { immediate: true, force: true });
    openProject(i, true);
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
const cursor = $('#cursor'), cursorText = $('#cursorText');
// the scroll spacer sits above the canvas, so picks are resolved from the window
window.addEventListener('click', (e) => {
  if (e.target.closest('a, button, .lbl--cap, .project__col, .menu, .hud')) return;
  if (hoverPlate >= 0 && openIndex < 0) openProject(hoverPlate);
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (openIndex >= 0) closeProject(); else setMenu(false); return; }
  if (openIndex >= 0 || menu.classList.contains('is-open')) return;
  const cur = CHAPTERS.findIndex((c) => ps <= Math.max(c.hold, 0) + 0.02);
  if (e.key === 'PageDown' || (e.key === 'ArrowDown' && e.altKey)) { e.preventDefault(); lenis.scrollTo(holdScroll(Math.min(6, Math.max(0, cur) + 1)), { duration: 2 }); }
  if (e.key === 'PageUp' || (e.key === 'ArrowUp' && e.altKey)) { e.preventDefault(); lenis.scrollTo(holdScroll(Math.max(0, cur - 1)), { duration: 2 }); }
});
let rt;
window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { world.resize(); if (openIndex >= 0) projectPose(openIndex); }, 120); });

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
let lastChapter = -1, time = 0;
function frame(dt, raw = dt) {
  time += dt;
  lenis.raf(time * 1000);
  const p = lenis.limit > 0 ? lenis.scroll / lenis.limit : 0;
  ps = firstFrame || reduced ? p : ps + (p - ps) * (1 - Math.exp(-dt * 14));
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
    const calm = 1 - view.project;
    const off = tmpV.subVectors(basePos, baseTgt);
    off.applyAxisAngle(Y_AXIS, (dyn.v * 0.0024 + Math.sin(time * 0.17) * 0.035) * calm);
    off.multiplyScalar(1 + Math.abs(dyn.v) * 0.0016 * calm);
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
    basePos.addScaledVector(side, pointer.x * len * 0.018 * (1 - view.project));
    basePos.y += pointer.y * len * 0.012 * (1 - view.project);
  }
  if (view.project > 0) {
    basePos.lerp(projCam.pos, view.project);
    baseTgt.lerp(projCam.tgt, view.project);
  }
  const k = 1 - Math.exp(-dt * (view.project > 0 && view.project < 1 ? 60 : 9));
  camPos.lerp(basePos, k); camTgt.lerp(baseTgt, k);
  if (view.intro < 1 && camPos.lengthSq() === 0) { camPos.copy(basePos); camTgt.copy(baseTgt); }
  world.camera.position.copy(camPos);
  world.camera.lookAt(camTgt);
  // lens shift keeps the model clear of the type; portrait screens stack type above/below instead
  const keep = (1 - view.project) * (1 - view.menu * 0.6);
  baseShift.multiplyScalar(keep);
  baseShift.x += view.menu * 0.2;
  if (aspect < 1) baseShift.set(0.3 * band(ps, 0.69, 0.885, 0.02), -0.03 * keep);
  shift.lerp(baseShift, k);
  const W = innerWidth, H = innerHeight;
  world.camera.fov = world.baseFov + Math.min(4, Math.abs(dyn.v) * 0.05) * (1 - view.project);
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
  voxels.uniforms.uSink.value = view.project;
  world.groundUniforms.uGrid.value = 0.3 + 0.7 * Math.max(band(ps, 0.1, 0.225, 0.04), band(ps, 0.355, 0.47, 0.03));

  // survey
  const sweep = Math.min(1, Math.max(0, (ps - SCAN.a) / (SCAN.b - SCAN.a)));
  scan.update(sweep, band(ps, SCAN.a - 0.005, 0.605, 0.03), world.renderer.getPixelRatio());

  // archive
  const archV = band(ps, 0.672, 0.895, 0.025);
  plates.update(camPos.x, archV, openIndex, dt);

  // pointer in the world: lift blocks on the logo, read parcels in the city, pick prints in the archive
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

  hoverPlate = -1;
  if (archV > 0.5 && openIndex < 0 && hasPointer && !menu.classList.contains('is-open')) {
    const hit = ray.intersectObjects(plates.faces, false)[0];
    if (hit) hoverPlate = hit.object.userData.index;
  }
  plates.items.forEach((it, i) => { it.hovered = i === hoverPlate; });
  document.body.classList.toggle('over-plate', hoverPlate >= 0);
  if (hoverPlate >= 0) {
    cursorText.textContent = C.ui.view;
    cursor.style.transform = `translate3d(${pointerPx.x + 18}px, ${pointerPx.y + 18}px, 0)`;
  }

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
  captions.forEach((c) => {
    const s = project(tmpV.set(c.P.x - c.P.w / 2 * Math.cos(c.P.yaw), c.P.y - c.P.h / 2 - 0.5, c.P.z + c.P.w / 2 * Math.sin(c.P.yaw)));
    const r = plates.items[c.i].reveal;
    const o = archV * (s.front ? 1 : 0) * Math.max(0, r * 1.4 - 0.4) * (1 - view.project);
    place(c.el, s.x, s.y, o);
    c.el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
  });

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
  // first compile happens behind the loader
  cameraAt(0, camPos, camTgt);
  world.camera.position.copy(camPos); world.camera.lookAt(camTgt);
  voxels.setTransition(0, MORPHS[0].spread);
  const steps = [
    document.fonts.ready,
    new Promise((r) => { const chk = () => (loadedTex >= PLATES.length ? r() : setTimeout(chk, 60)); chk(); }),
    new Promise((r) => setTimeout(r, reduced ? 200 : 1600)),
  ];
  let done = 0;
  steps.forEach((s) => s.then(() => { done++; }));
  const tickLoader = () => {
    const target = Math.round(((done / steps.length) * 0.8 + Math.min(loadedTex / PLATES.length, 1) * 0.2) * cells.length);
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
    world, voxels, states, plates, scan, lenis, view, get ps() { return ps; },
    // jump the film to progress p and settle it (for inspection while the pane is in the background)
    async at(p, frames = 40) {
      view.intro = 1; lenis.start();
      lenis.scrollTo(p * lenis.limit, { immediate: true, force: true });
      for (let i = 0; i < frames; i++) frame(1 / 30);
      await new Promise((r) => setTimeout(r, 350));
      frame(1 / 30);
      await new Promise((r) => setTimeout(r, 120));
      return { ps: +ps.toFixed(4), k: voxels.current, mix: +voxels.uniforms.uMix.value.toFixed(3) };
    },
  };
}
