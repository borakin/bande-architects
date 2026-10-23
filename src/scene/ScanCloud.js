// Laser-scan of the han facade, drawn as matte graphite dots on paper: no glow, just measurement.
// It records the facade as it once stood, so the missing stones show up as dotted ghosts.
import { BufferGeometry, BufferAttribute, Points, ShaderMaterial, Color } from 'three';
import { HAN } from './states.js';

function inOpening(x, y) {
  const bay = HAN.W / 7, bi = Math.floor((x + HAN.W / 2) / bay);
  if (bi < 0 || bi > 6) return false;
  const dx = x - (-HAN.W / 2 + (bi + 0.5) * bay);
  if (y < 2.3 && Math.abs(dx) < 1.4) return true;
  if (y >= 2.3 && Math.hypot(dx, y - 2.3) < 1.4) return true;
  if (y > 4.75 && y < 5.7 && Math.abs(dx) < 1.05) return true;
  if (y >= 5.7 && Math.hypot(dx, y - 5.7) < 1.05) return true;
  return false;
}

export class ScanCloud {
  constructor(count = 70000) {
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    let n = 0;
    const push = (x, y, z) => { if (n >= count) return; pos.set([x, y, z], n * 3); rnd[n] = Math.random(); n++; };
    const front = HAN.depth / 2 + 0.03;
    while (n < count * 0.66) {
      const x = (Math.random() - 0.5) * HAN.W, y = Math.random() * (HAN.H + 0.35);
      if (inOpening(x, y)) continue;
      push(x, y, front + (Math.random() - 0.5) * 0.015);
    }
    while (n < count * 0.86) {
      const s = Math.random() < 0.5 ? -1 : 1;
      const z = -HAN.ret + Math.random() * (HAN.ret - HAN.depth / 2), y = Math.random() * HAN.H;
      const win = Math.abs(z + 3.6) < 0.7 && ((y > 1.2 && y < 2.6) || (y > 5.4 && y < 6.8));
      if (win) continue;
      push(s * (HAN.W / 2 + 0.03), y, z);
    }
    // arch soffits and a sparse floor return, like a real scan
    while (n < count) {
      if (Math.random() < 0.5) {
        const x = (Math.random() - 0.5) * HAN.W, z = 0.4 + Math.random() * 8.5;
        push(x, 0.02, z);
      } else {
        const bay = HAN.W / 7, bi = Math.floor(Math.random() * 7);
        const a = Math.random() * Math.PI, upper = Math.random() < 0.4;
        const r = upper ? 1.05 : 1.4, s = upper ? 5.7 : 2.3;
        push(-HAN.W / 2 + (bi + 0.5) * bay + Math.cos(a) * r, s + Math.sin(a) * r, (Math.random() - 0.5) * HAN.depth);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aRnd', new BufferAttribute(rnd, 1));
    this.uniforms = {
      uScan: { value: -20 }, uOpacity: { value: 0 }, uPR: { value: 1 }, uInk: { value: new Color('#DAD7D0') },
    };
    const m = new ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false,
      vertexShader: /* glsl */ `
        attribute float aRnd; uniform float uScan; uniform float uPR; varying float vA;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float seen = step(position.x, uScan);
          float edge = smoothstep(0.9, 0.0, abs(position.x - uScan));
          vA = seen * (0.35 + aRnd * 0.3) + edge * 0.25;
          gl_PointSize = (1.9 + edge * 0.9) * uPR * clamp(30.0 / -mv.z, 0.7, 1.5);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity; uniform vec3 uInk; varying float vA;
        void main(){
          vec2 d = gl_PointCoord - 0.5; if (dot(d, d) > 0.25) discard;
          float a = vA * uOpacity; if (a < 0.01) discard;
          gl_FragColor = vec4(uInk, a);
        }`,
    });
    this.points = new Points(g, m);
    this.points.frustumCulled = false;
    this.points.renderOrder = 3;
  }

  update(sweep, opacity, pr) {
    this.uniforms.uScan.value = -HAN.W / 2 - 1 + sweep * (HAN.W + 2);
    this.uniforms.uOpacity.value = opacity;
    this.uniforms.uPR.value = pr;
    this.points.visible = opacity > 0.002;
  }
}
