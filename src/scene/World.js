import {
  WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, HemisphereLight, Mesh, PlaneGeometry,
  MeshStandardMaterial, Color, Fog, PCFShadowMap, PMREMGenerator, HalfFloatType, Vector3, Uniform,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  EffectComposer, RenderPass, EffectPass, SMAAEffect, ToneMappingEffect, ToneMappingMode, Effect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

// Film grain + a soft optical vignette, applied after tone mapping so it reads like a print, not a filter.
class FilmEffect extends Effect {
  constructor() {
    super('FilmEffect', /* glsl */ `
      uniform float uSeed; uniform float uGrain;
      float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
        vec3 c = inputColor.rgb;
        vec2 q = uv - 0.5; q.x *= resolution.x / resolution.y;
        c *= mix(0.72, 1.0, smoothstep(1.1, 0.2, length(q)));
        float n = h12(uv * resolution + uSeed * 91.7) - 0.5;
        c += n * uGrain;
        outputColor = vec4(c, inputColor.a);
      }`, { uniforms: new Map([['uSeed', new Uniform(0)], ['uGrain', new Uniform(0.012)]]) });
  }
}

export class World {
  constructor(canvas, { mobile }) {
    // dev only: ?nogl shows the page a visitor without WebGL gets
    if (import.meta.env.DEV && location.search.includes('nogl')) throw new Error('WebGL disabled for testing');
    this.mobile = mobile;
    const r = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, depth: true });
    this.dprMax = mobile ? 1.5 : 1.75;
    r.setPixelRatio(Math.min(window.devicePixelRatio, this.dprMax));
    r.shadowMap.enabled = true;
    r.shadowMap.type = PCFShadowMap;
    this.renderer = r;

    const scene = new Scene();
    this.bg = new Color('#0B0B0A');
    scene.background = this.bg;
    scene.fog = new Fog(this.bg, 55, 140);
    this.scene = scene;

    const pm = new PMREMGenerator(r);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.22;

    this.camera = new PerspectiveCamera(28, 1, 0.5, 400);

    const sun = new DirectionalLight('#fff1e2', 2.7);
    sun.castShadow = true;
    const ms = mobile ? 2048 : 4096;
    sun.shadow.mapSize.set(ms, ms);
    sun.shadow.bias = -0.00025;
    sun.shadow.normalBias = 0.025;
    sun.shadow.radius = 3;
    const sc = sun.shadow.camera;
    sc.near = 1; sc.far = 220;
    scene.add(sun, sun.target);
    this.sun = sun;
    this.shadowSize = 36;

    this.hemi = new HemisphereLight('#d9dde2', '#1a1916', 0.3);
    scene.add(this.hemi);

    // the "model table": warm paper ground with a faint plan grid that appears in drawing chapters
    this.groundUniforms = { uGrid: { value: 0.3 }, uInk: { value: new Color('#E7E4DE') } };
    const gm = new MeshStandardMaterial({ color: '#141413', roughness: 0.95, metalness: 0, envMapIntensity: 0.35 });
    gm.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.groundUniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vW;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vW; uniform float uGrid; uniform vec3 uInk;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          if (uGrid > 0.001) {
            vec2 g = abs(fract(vW.xz / 2.8 + 0.5) - 0.5) / fwidth(vW.xz / 2.8);
            float l = 1.0 - min(min(g.x, g.y), 1.0);
            vec2 g2 = abs(fract(vW.xz / 11.2 + 0.5) - 0.5) / fwidth(vW.xz / 11.2);
            float l2 = 1.0 - min(min(g2.x, g2.y), 1.0);
            float fade = smoothstep(70.0, 20.0, length(vW.xz));
            diffuseColor.rgb = mix(diffuseColor.rgb, uInk, (l * 0.05 + l2 * 0.1) * uGrid * fade);
          }`);
    };
    const ground = new Mesh(new PlaneGeometry(600, 600), gm);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    this.ground = ground;

    // post: ambient occlusion is what turns boxes into a physical white model
    const composer = new EffectComposer(r, { frameBufferType: HalfFloatType });
    composer.addPass(new RenderPass(scene, this.camera));
    if (!mobile) {
      const ao = new N8AOPostPass(scene, this.camera, 1, 1);
      ao.configuration.aoRadius = 1.6;
      ao.configuration.distanceFalloff = 0.8;
      ao.configuration.intensity = 1.8;
      ao.configuration.color = new Color('#000000');
      ao.configuration.aoSamples = 16;
      ao.configuration.denoiseSamples = 8;
      ao.configuration.denoiseRadius = 12;
      composer.addPass(ao);
      this.ao = ao;
    }
    this.film = new FilmEffect();
    composer.addPass(new EffectPass(this.camera, new SMAAEffect(), new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), this.film));
    this.composer = composer;

    this._v = new Vector3();
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    // portrait screens get a wider lens so the long logo and the city still fit across
    this.baseFov = w / h < 1 ? 46 : w / h < 1.3 ? 34 : 28;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  setSun(s, target) {
    const az = s.az * Math.PI / 180, el = s.el * Math.PI / 180;
    const d = this._v.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    this.sun.position.copy(target).addScaledVector(d, 90);
    this.sun.target.position.copy(target);
    this.sun.color.copy(s.color);
    this.sun.intensity = s.i;
    this.hemi.intensity = s.amb;
    this.bg.copy(s.bg);
    this.scene.fog.color.copy(s.bg);
    const sc = this.sun.shadow.camera, S = this.shadowSize;
    if (sc.right !== S) {
      sc.left = -S; sc.right = S; sc.top = S; sc.bottom = -S;
      sc.updateProjectionMatrix();
    }
  }

  render(t) {
    this.film.uniforms.get('uSeed').value = (t * 24) % 1000;
    this.composer.render();
  }
}
