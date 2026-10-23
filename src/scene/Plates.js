// Project photographs mounted as prints on thin boards. They resolve from coarse pixels to the full image:
// the 8-bit logo's idea applied to photography. The same pixel transition swaps images in the project view.
import {
  Group, Mesh, PlaneGeometry, BoxGeometry, ShaderMaterial, MeshStandardMaterial, TextureLoader, SRGBColorSpace,
  Vector3,
} from 'three';
import { PLATES } from './states.js';

const VERT = /* glsl */ `
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main(){
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const FRAG = /* glsl */ `
  uniform sampler2D uTex; uniform sampler2D uTex2;
  uniform float uReveal; uniform float uSwap; uniform float uOpacity; uniform float uLight;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  vec2 mosaic(vec2 uv, float level){ float c = exp2(level); vec2 g = vec2(c, c * 0.75); return (floor(uv * g) + 0.5) / g; }
  void main(){
    float r = clamp(uReveal, 0.0, 1.0);
    // coarse cells appear first, then the grid doubles until it reaches the photograph
    float level = floor(mix(2.0, 10.5, r));
    vec2 uv = r > 0.985 ? vUv : mosaic(vUv, level);
    float cell = h12(floor(vUv * vec2(12.0, 9.0)));
    if (cell > r * 1.6) discard;
    float sw = sin(3.14159 * clamp(uSwap, 0.0, 1.0));
    if (sw > 0.01) uv = mosaic(uv, floor(mix(10.5, 3.0, sw)));
    vec3 c = mix(texture2D(uTex, uv).rgb, texture2D(uTex2, uv).rgb, step(0.5, uSwap));
    if (h12(gl_FragCoord.xy) > uOpacity) discard;
    gl_FragColor = vec4(c * uLight, 1.0);
    #include <fog_fragment>
  }`;

export class Plates {
  constructor(projects, onLoad) {
    this.group = new Group();
    this.items = [];
    this.loader = new TextureLoader();
    this.cache = new Map();
    const board = new MeshStandardMaterial({ color: '#1B1B1A', roughness: 0.7 });
    projects.forEach((proj, i) => {
      const P = PLATES[i];
      const g = new Group();
      g.position.set(P.x, P.y, P.z);
      g.rotation.y = P.yaw;
      const back = new Mesh(new BoxGeometry(P.w + 0.14, P.h + 0.14, 0.08), board);
      back.castShadow = true; back.receiveShadow = true;
      const tex = this.tex(proj.img);
      const mat = new ShaderMaterial({
        uniforms: {
          uTex: { value: tex }, uTex2: { value: tex }, uReveal: { value: 0 }, uSwap: { value: 0 },
          uOpacity: { value: 1 }, uLight: { value: 1 },
          fogColor: { value: null }, fogNear: { value: 55 }, fogFar: { value: 140 },
        },
        vertexShader: VERT, fragmentShader: FRAG, fog: true,
      });
      const face = new Mesh(new PlaneGeometry(P.w, P.h), mat);
      face.position.z = 0.045;
      face.userData.index = i;
      g.add(back, face);
      this.group.add(g);
      this.items.push({ group: g, face, mat, proj, P, hover: 0, reveal: 0 });
    });
    this.faces = this.items.map((it) => it.face);
    this._v = new Vector3();
    this.onLoad = onLoad;
  }

  tex(key) {
    if (this.cache.has(key)) return this.cache.get(key);
    const t = this.loader.load(`/projects/${key}.webp`, () => this.onLoad && this.onLoad(key));
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    this.cache.set(key, t);
    return t;
  }

  bindFog(fog) {
    this.fog = fog;
    for (const it of this.items) {
      it.mat.uniforms.fogColor.value = fog.color;
    }
  }

  // reveal each print as the camera approaches it
  update(camX, visible, focusIndex, dt) {
    for (const it of this.items) { it.mat.uniforms.fogNear.value = this.fog.near; it.mat.uniforms.fogFar.value = this.fog.far; }
    this.group.visible = visible > 0.001;
    for (const it of this.items) {
      const near = 1 - Math.min(1, Math.max(0, (Math.abs(it.P.x - camX - 4) - 6) / 10));
      const target = visible * near;
      it.reveal += (target - it.reveal) * Math.min(1, dt * 3.2);
      it.mat.uniforms.uReveal.value = it.reveal;
      const dim = focusIndex >= 0 && focusIndex !== it.face.userData.index ? 0 : 1;
      const u = it.mat.uniforms.uOpacity;
      u.value += (dim - u.value) * Math.min(1, dt * 5);
      it.group.children[0].visible = u.value > 0.5 && it.reveal > 0.2;
      it.hover += ((it.hovered ? 1 : 0) - it.hover) * Math.min(1, dt * 6);
      it.face.position.z = 0.045 + it.hover * 0.12;
      it.group.children[0].position.z = it.hover * 0.12;
    }
  }
}
