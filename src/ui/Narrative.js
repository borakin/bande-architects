// Typography that behaves like part of the shot: lines rise out of masks as a chapter enters,
// drift with the camera while it holds, and sink away as the next form starts to build.
import { CHAPTERS, band } from '../scene/Timeline.js';

const pad = (n) => String(n).padStart(2, '0');
const ease = (t) => 1 - Math.pow(1 - t, 3);

export class Narrative {
  constructor(root) {
    this.root = root;
    this.nodes = [];
  }

  render(c) {
    this.root.querySelectorAll('.ch').forEach((n) => n.remove());
    this.nodes = [];
    c.chapters.forEach((ch, i) => {
      const def = CHAPTERS[i];
      const el = document.createElement('section');
      el.className = `ch ch--${ch.id}`;
      el.setAttribute('aria-label', ch.title.join(' '));
      const tag = i === 0 ? 'h1' : 'h2';
      const lines = ch.title.map((l) => `<span class="ln"><span>${l}</span></span>`).join('');
      let extra = '';
      if (ch.id === 'origin') {
        extra = `<ul class="ch__services">${c.services.map((s) => `<li>${s}</li>`).join('')}</ul>`;
      }
      if (ch.id === 'contact') {
        const k = c.contact;
        extra = `<div class="ch__contact">
          <a class="ch__mail" href="mailto:${k.email}">${k.email}</a>
          <p>${k.address.join('<br>')}</p>
          <p><a href="tel:${k.phone.replace(/\s/g, '')}">${k.phone}</a></p>
          <p class="ch__note">${k.note}</p>
          <p class="ch__social">${k.social.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join('')}</p>
          <p class="ch__credit px">${k.credit.toUpperCase().replace('İ', 'I').normalize('NFD').replace(/[̀-ͯ]/g, '')}</p>
        </div>`;
      }
      el.innerHTML = `
        <p class="ch__label px"><span>${pad(i + 1)}</span> — ${ch.label}</p>
        <${tag} class="ch__title">${lines}</${tag}>
        <p class="ch__body">${ch.body}</p>
        <ul class="ch__meta px">${ch.meta.map((m) => `<li>${m}</li>`).join('')}</ul>
        ${extra}`;
      this.root.appendChild(el);
      this.nodes.push({
        el, def,
        lines: [...el.querySelectorAll('.ln > span')],
        fades: [...el.querySelectorAll('.ch__label, .ch__body, .ch__meta, .ch__services, .ch__contact')],
      });
    });
  }

  update(p, vh, gate = 1) {
    let active = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      let v = band(p, n.def.a, n.def.b, 0.02);
      if (i === 0) v = Math.min(v, gate); // the first title waits for the logo to finish building
      if (p >= n.def.a - 0.03) active = i;
      const on = v > 0.001;
      if (n.on !== on) { n.el.style.visibility = on ? 'visible' : 'hidden'; n.on = on; }
      if (!on) continue;
      n.el.style.pointerEvents = v > 0.6 ? 'auto' : 'none';
      // drift: the type slides slowly against the camera, like a caption written into the scene
      const drift = Math.max(-70, Math.min(70, (n.def.hold - p) * vh * 0.9));
      n.el.style.transform = `translate3d(0, ${drift.toFixed(1)}px, 0)`;
      n.lines.forEach((l, j) => {
        const t = ease(Math.min(1, Math.max(0, v * 1.3 - j * 0.1)));
        l.style.transform = `translate3d(0, ${((1 - t) * 108).toFixed(2)}%, 0)`;
      });
      n.fades.forEach((f, j) => {
        const t = ease(Math.min(1, Math.max(0, v * 1.4 - 0.15 - j * 0.06)));
        f.style.opacity = t.toFixed(3);
        f.style.transform = `translate3d(0, ${((1 - t) * 14).toFixed(1)}px, 0)`;
      });
    }
    return active;
  }
}
