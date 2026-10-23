// Optional, off by default: only soft stone clicks as blocks land. No background bed: silence is the room tone.
export class Sound {
  constructor() {
    this.on = false;
    this.ctx = null;
    this.lastTick = 0;
  }

  init() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.noise = (() => {
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const x = b.getChannelData(0);
      for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 6);
      return b;
    })();
  }

  toggle() {
    if (!this.ctx) this.init();
    this.on = !this.on;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.on ? 0.5 : 0, t, 0.4);
    return this.on;
  }

  // rate: blocks landing per second (estimated from morph speed)
  update(rate, dt) {
    if (!this.on || !this.ctx) return;
    const chance = Math.min(0.9, rate * dt * 0.08);
    if (Math.random() < chance) this.tick();
  }

  tick() {
    const ctx = this.ctx, t = ctx.currentTime;
    if (t - this.lastTick < 0.035) return;
    this.lastTick = t;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 1400 + Math.random() * 1800; bp.Q.value = 6;
    const g = ctx.createGain(); g.gain.value = 0.05 + Math.random() * 0.07;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = Math.random() * 1.4 - 0.7; s.connect(bp).connect(g).connect(pan).connect(this.master); }
    else s.connect(bp).connect(g).connect(this.master);
    s.start(t);
  }
}
