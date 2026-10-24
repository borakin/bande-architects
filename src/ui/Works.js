// "Selected works": a real grid in the page flow (a swipeable rail on phones) and a full-screen case view
// that opens out of the card the visitor picked.
import { gsap } from 'gsap';

const pad = (n) => String(n).padStart(2, '0');
// a small bronze medal marks the works that have been honoured
const MEDAL = (label) => `<svg class="medal" viewBox="0 0 16 20" width="14" height="18" role="img" aria-label="${label}"><path d="M3 0h4l2 6H5zM9 0h4l-4 7z" fill="currentColor" opacity=".55"/><circle cx="8" cy="13" r="6" fill="currentColor"/><circle cx="8" cy="13" r="3.2" fill="none" stroke="#0B0B0A" stroke-width="1.2"/></svg>`;
// keys without an extension are the project's own .webp photographs; "gorsel-yok.svg" is the shared stand-in
const photo = (k) => `${import.meta.env.BASE_URL}projects/${k.includes('.') ? k : `${k}.webp`}`;

export class Works {
  constructor({ reduced, onPick }) {
    this.reduced = reduced;
    this.onPick = onPick;
    this.el = document.createElement('section');
    this.el.className = 'works';
    this.el.id = 'works';
    this.el.setAttribute('aria-labelledby', 'worksTitle');
    this.c = document.getElementById('case');
    this.q = (s) => this.c.querySelector(s);
    this.C = null;
    this.index = -1;
  }

  render(C) {
    this.C = C;
    const ch = C.chapters.find((x) => x.id === 'archive');
    const cards = C.projects.map((p, i) => `
      <li class="works__item" style="--n:${i}">
        <a class="card" href="#/${p.slug}" data-i="${i}">
          <span class="card__img"><img src="${photo(p.img)}" alt="${p.title}" width="1600" height="1200" loading="lazy" decoding="async"></span>
          <span class="card__txt"><b>${p.title}${p.award ? MEDAL(C.ui.award) : ''}</b><em>${[p.place, p.year].filter(Boolean).join(' · ')}</em><span>${p.type}</span></span>
        </a>
      </li>`).join('');
    this.el.innerHTML = `
      <header class="works__head">
        <h2 class="works__title" id="worksTitle">${ch.title.map((l) => `<span>${l}</span>`).join('')}</h2>
        <div class="works__side">
          <p class="works__lede">${ch.body}</p>
          <p class="works__meta">${ch.meta.join(' · ')}</p>
        </div>
      </header>
      <ul class="works__grid" role="list">${cards}</ul>
      <p class="works__count" aria-hidden="true"><span id="railNo">01</span> / ${pad(C.projects.length)}</p>`;
    const grid = this.el.querySelector('.works__grid');
    this.el.querySelectorAll('.card').forEach((a) => a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      this.onPick(+a.dataset.i, a.querySelector('.card__img'));
    }));
    const no = this.el.querySelector('#railNo');
    grid.addEventListener('scroll', () => {
      const first = grid.firstElementChild, step = first.getBoundingClientRect().width + 12;
      no.textContent = pad(Math.min(C.projects.length, Math.round(grid.scrollLeft / step) + 1));
    }, { passive: true });
    if (this.index >= 0) this.fill(this.index);
  }

  // the cards rise in one after another the first time the section comes into view
  watch() {
    if (this.reduced || !('IntersectionObserver' in window)) return;
    this.el.classList.add('js-reveal');
    new IntersectionObserver((es, o) => {
      if (es.some((e) => e.isIntersecting)) { this.el.classList.add('is-in'); o.disconnect(); }
    }, { threshold: 0.12 }).observe(this.el);
  }

  fill(i) {
    const { C } = this;
    const p = C.projects[i];
    const tr = document.documentElement.lang !== 'en';
    this.index = i;
    this.q('#caseIdx').textContent = `${pad(i + 1)} / ${pad(C.projects.length)}`;
    this.q('#caseTitle').textContent = p.title;
    // [label, value, wide]: empty values are left out, long ones take the full row
    const L = (tr
      ? [['Yer', p.place], ['Yıl', p.year], ['Tür', p.type], ['Alan', p.area], ['İşveren', p.client], ['Rol', p.role, true]]
      : [['Place', p.place], ['Year', p.year], ['Type', p.type], ['Area', p.area], ['Client', p.client], ['Role', p.role, true]]
    ).filter(([, v]) => v);
    if (p.award) {
      const items = p.award.split(' · ').map((a) => `<li>${a}</li>`).join('');
      L.push([`${MEDAL(C.ui.award)}${tr ? 'Ödül' : 'Award'}`, `<ul class="case__awards">${items}</ul>`, true]);
    }
    if (p.photo) L.push([tr ? 'Fotoğraf' : 'Photo', p.photo, true]);
    this.q('#caseMeta').innerHTML = L.map(([k, v, wide]) => `<div${wide ? ' class="is-wide"' : ''}><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    this.q('#caseSummary').textContent = p.summary;
    const fig = (k) => `<figure><img src="${photo(k)}" alt="${p.title}" decoding="async"></figure>`;
    this.q('#caseHero').innerHTML = fig(p.gallery[0]);
    // the card's picture is already loaded: show it under the large photograph until that arrives
    this.q('#caseHero').style.backgroundImage = `url("${photo(p.img)}")`;
    this.q('#caseMedia').innerHTML = p.gallery.slice(1).map(fig).join('');
    this.q('#caseNextTitle').textContent = C.projects[(i + 1) % C.projects.length].title;
  }

  get isOpen() { return this.c.classList.contains('is-open'); }

  open(i, { from, instant } = {}) {
    const wasOpen = this.isOpen;
    this.fill(i);
    this.c.scrollTop = 0;
    const wrap = this.q('#caseWrap');
    if (wasOpen) {
      if (!this.reduced) gsap.fromTo(wrap, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'all' });
      return;
    }
    this.c.classList.add('is-open');
    this.c.setAttribute('aria-hidden', 'false');
    if (instant || this.reduced || !from) return;
    const r = from.getBoundingClientRect();
    gsap.fromTo(this.c,
      { clipPath: `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px)` },
      { clipPath: 'inset(0px 0px 0px 0px)', duration: 1.05, ease: 'power3.inOut', clearProps: 'clipPath' });
    gsap.from([...this.q('#caseSide').children, ...this.c.querySelectorAll('.case__media figure, .case__next')],
      { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out', stagger: 0.07, delay: 0.55, clearProps: 'all' });
  }

  close(done) {
    const i = this.index;
    const end = () => {
      this.c.classList.remove('is-open');
      this.c.setAttribute('aria-hidden', 'true');
      gsap.set(this.c, { clearProps: 'clipPath,opacity' });
      done && done();
    };
    if (this.reduced) return end();
    const img = this.el.querySelector(`.card[data-i="${i}"] .card__img`);
    const r = img && img.getBoundingClientRect();
    if (r && r.bottom > 0 && r.top < innerHeight) {
      gsap.to(this.c, {
        clipPath: `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px)`,
        duration: 0.9, ease: 'power3.inOut', onComplete: end,
      });
    } else gsap.to(this.c, { opacity: 0, duration: 0.5, onComplete: end });
  }
}
