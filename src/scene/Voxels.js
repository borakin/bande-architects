// One draw call for every block in the film. Positions live in instanced attributes (state A, state B)
// and the vertex shader morphs between them, keeping bevels constant however a block is stretched.
import {
  InstancedBufferGeometry, InstancedBufferAttribute, Mesh, MeshStandardMaterial, MeshDepthMaterial,
  RGBADepthPacking, LineSegments, ShaderMaterial, EdgesGeometry, BoxGeometry, Color, Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { N, transitionDelays } from './states.js';

const R0 = 0.12; // bevel radius of the unit box

const MORPH_GLSL = /* glsl */ `
  attribute vec3 aPosA; attribute vec3 aPosB;
  attribute vec3 aSizeA; attribute vec3 aSizeB;
  attribute vec3 aColA; attribute vec3 aColB;
  attribute vec4 aMatA; attribute vec4 aMatB;
  attribute vec2 aSeed; // x: delay 0..1, y: random
  uniform float uMix; uniform float uSpread; uniform float uIntro;
  uniform vec3 uMouse; uniform float uMouseAmt; uniform float uHover; uniform float uSink;
  vec3 bP; vec3 bS; float bYaw; vec3 bCol; vec4 bMat; float bT; float bHov;

  float easeIO(float t){ return t < 0.5 ? 4.0*t*t*t : 1.0 - pow(-2.0*t + 2.0, 3.0) * 0.5; }

  void bandeCompute(){
    float t = clamp((uMix - aSeed.x * uSpread) / (1.0 - uSpread), 0.0, 1.0);
    float e = easeIO(t);
    bT = t;
    bool burA = aPosA.y + aSizeA.y * 0.5 < 0.0;
    bool burB = aPosB.y + aSizeB.y * 0.5 < 0.0;
    bYaw = 0.0;
    if (burA && !burB) {
      float th = clamp(e * 2.5, 0.0, 1.0), tv = easeIO(clamp(t * 1.6 - 0.6, 0.0, 1.0));
      bS = aSizeB;
      bP.xz = mix(aPosA.xz, aPosB.xz, th);
      bP.y = mix(-aSizeB.y * 0.5 - 0.08, aPosB.y, tv);
    } else if (!burA && burB) {
      float tv = easeIO(clamp(t * 1.6, 0.0, 1.0)), th = clamp(e * 2.5 - 1.5, 0.0, 1.0);
      bS = mix(aSizeA, aSizeB, th);
      bP.xz = mix(aPosA.xz, aPosB.xz, th);
      bP.y = mix(aPosA.y, -aSizeA.y * 0.5 - 0.08, tv);
    } else {
      bP = mix(aPosA, aPosB, e);
      bS = mix(aSizeA, aSizeB, e);
      float travel = length(aPosB.xz - aPosA.xz);
      float lift = clamp(0.35 + travel * 0.16, 0.0, 4.5) * step(0.05, travel + abs(aPosB.y - aPosA.y));
      bP.y += sin(3.14159 * t) * lift * (burA ? 0.0 : 1.0);
      bYaw = sin(3.14159 * t) * (aSeed.y - 0.5) * 1.3 * step(0.05, travel);
    }
    bCol = mix(aColA, aColB, smoothstep(0.2, 0.8, t));
    bMat = mix(aMatA, aMatB, step(0.5, t));
    // intro: blocks rise out of the ground in a wave
    float it = easeIO(clamp(uIntro * 1.55 - aSeed.x * 0.55, 0.0, 1.0));
    bP.y = mix(-bS.y * 0.5 - 0.08, bP.y, it);
    // a breath of lift under the pointer
    float m = uMouseAmt * smoothstep(3.2, 0.0, length(bP.xz - uMouse.xz));
    bP.y += m * 0.32 * step(0.0, bP.y);
    // hovered urban parcel
    bHov = (abs(bMat.w - uHover) < 0.5 && uHover > -0.5) ? 1.0 : 0.0;
    bP.y += bHov * 0.1;
    // project view: the model sinks away so the print stands alone in the dark
    bP.y -= uSink * (bS.y + 0.4) * (0.6 + 0.4 * aSeed.y);
  }
  vec3 bandeRotY(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }
  vec3 bandeTransform(vec3 p){
    vec3 core = clamp(p, vec3(-0.5 + ${R0.toFixed(3)}), vec3(0.5 - ${R0.toFixed(3)}));
    vec3 off = p - core;
    float rw = min(0.022, min(bS.x, min(bS.y, bS.z)) * 0.2);
    vec3 lp = core / (0.5 - ${R0.toFixed(3)}) * max(bS * 0.5 - rw, vec3(0.0)) + off * (rw / ${R0.toFixed(3)});
    return bandeRotY(lp, bYaw) + bP;
  }
`;

const NOISE_GLSL = /* glsl */ `
  float bHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float bNoise(vec3 x){
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(bHash(i), bHash(i + vec3(1,0,0)), f.x), mix(bHash(i + vec3(0,1,0)), bHash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(bHash(i + vec3(0,0,1)), bHash(i + vec3(1,0,1)), f.x), mix(bHash(i + vec3(0,1,1)), bHash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
`;

export class Voxels {
  constructor(states) {
    this.states = states;
    this.current = -1;
    const base = new RoundedBoxGeometry(1, 1, 1, 2, R0);
    const g = new InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('normal', base.getAttribute('normal'));
    g.instanceCount = N;
    const mk = (n) => new InstancedBufferAttribute(new Float32Array(N * n), n);
    this.attr = {
      aPosA: mk(3), aPosB: mk(3), aSizeA: mk(3), aSizeB: mk(3),
      aColA: mk(3), aColB: mk(3), aMatA: mk(4), aMatB: mk(4), aSeed: mk(2),
    };
    for (const [k, a] of Object.entries(this.attr)) g.setAttribute(k, a);
    for (let i = 0; i < N; i++) this.attr.aSeed.array[i * 2 + 1] = Math.random();
    this.delays = new Float32Array(N);

    this.uniforms = {
      uMix: { value: 0 }, uSpread: { value: 0.6 }, uIntro: { value: 0 },
      uMouse: { value: new Vector3(999, 0, 999) }, uMouseAmt: { value: 0 }, uHover: { value: -1 }, uSink: { value: 0 },
      uDusk: { value: 0 },
    };

    const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, envMapIntensity: 0.6, transparent: true });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\n${MORPH_GLSL}\nvarying vec3 vCol; varying vec4 vMat; varying vec3 vObj; varying float vHov;`)
        .replace('#include <beginnormal_vertex>', `bandeCompute();\nvec3 objectNormal = bandeRotY(normal, bYaw);\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3( tangent.xyz );\n#endif`)
        .replace('#include <begin_vertex>', `vec3 transformed = bandeTransform(position);\nvCol = bCol; vMat = bMat; vObj = transformed; vHov = bHov;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\n${NOISE_GLSL}\nvarying vec3 vCol; varying vec4 vMat; varying vec3 vObj; varying float vHov; uniform float uDusk;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float grain = bNoise(vObj * 7.0) * 0.6 + bNoise(vObj * 23.0) * 0.4;
          float pit = smoothstep(0.78, 0.92, bNoise(vObj * 41.0));
          vec3 base = vCol * (0.965 + grain * 0.07) * (1.0 - pit * 0.06 * (1.0 - vMat.z));
          base = mix(base, base * 1.2 + vec3(0.06, 0.045, 0.03), vHov);
          // at dusk the glazing picks up a warm, matte interior tone (no emission)
          base = mix(base, vec3(0.42, 0.30, 0.19), vMat.z * uDusk * 0.55);
          diffuseColor.rgb = base;`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\nroughnessFactor = clamp(vMat.x + (bNoise(vObj * 13.0) - 0.5) * 0.08, 0.04, 1.0);`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\nmetalnessFactor = vMat.y;`);
    };
    this.material = mat;

    const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
    depth.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\n${MORPH_GLSL}`)
        .replace('#include <begin_vertex>', `bandeCompute();\nvec3 transformed = bandeTransform(position);`);
    };

    this.mesh = new Mesh(g, mat);
    this.mesh.customDepthMaterial = depth;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;

    // ink outlines for the BIM chapter, driven by the same morph
    const eg = new EdgesGeometry(new BoxGeometry(1, 1, 1));
    const lg = new InstancedBufferGeometry();
    lg.setAttribute('position', eg.getAttribute('position'));
    lg.instanceCount = N;
    for (const [k, a] of Object.entries(this.attr)) lg.setAttribute(k, a);
    this.lineUniforms = { uLines: { value: 0.6 }, uInk: { value: new Color('#E7E4DE') }, uAccent: { value: new Color('#B88A5C') }, uFogNear: { value: 55 }, uFogFar: { value: 140 } };
    const lm = new ShaderMaterial({
      uniforms: { ...this.uniforms, ...this.lineUniforms },
      transparent: true, depthWrite: false,
      vertexShader: /* glsl */ `
        ${MORPH_GLSL}
        varying float vVis; varying float vDepth; varying float vAcc; varying float vHovL;
        void main(){
          bandeCompute();
          vec3 p = bandeRotY(position * (bS + 0.012), bYaw) + bP;
          vVis = step(0.0, bP.y + bS.y * 0.5 - 0.02);
          vAcc = step(bMat.w, -1.5);
          vHovL = bHov;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uLines; uniform vec3 uInk; uniform vec3 uAccent; uniform float uFogNear; uniform float uFogFar;
        varying float vVis; varying float vDepth; varying float vAcc; varying float vHovL;
        void main(){
          if (vVis < 0.5 || uLines < 0.01) discard;
          float fog = 1.0 - smoothstep(uFogNear * 0.6, uFogFar, vDepth);
          vec3 c = mix(uInk, uAccent, max(vAcc, vHovL));
          gl_FragColor = vec4(c, uLines * fog * (0.55 + 0.45 * max(vAcc, vHovL)));
        }`,
    });
    this.lines = new LineSegments(lg, lm);
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 2;
  }

  // Load transition k (state k → k+1) into the A/B attributes.
  setTransition(k, spread = 0.6) {
    if (k === this.current) return;
    this.current = k;
    const a = this.states[k], b = this.states[Math.min(k + 1, this.states.length - 1)];
    const { aPosA, aPosB, aSizeA, aSizeB, aColA, aColB, aMatA, aMatB, aSeed } = this.attr;
    aPosA.array.set(a.pos); aPosB.array.set(b.pos);
    aSizeA.array.set(a.size); aSizeB.array.set(b.size);
    aColA.array.set(a.col); aColB.array.set(b.col);
    aMatA.array.set(a.mat); aMatB.array.set(b.mat);
    transitionDelays(a, b, this.delays);
    for (let i = 0; i < N; i++) aSeed.array[i * 2] = this.delays[i];
    for (const at of Object.values(this.attr)) at.needsUpdate = true;
    this.uniforms.uSpread.value = spread;
  }
}
