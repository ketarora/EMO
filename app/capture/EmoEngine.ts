// Ported from the working EMO demo (shiny-torte Netlify build):
// Three.js fibonacci-sphere particle engine + V/A -> visuals mapping.
// Shaders, color presets and mappings are verbatim; particle count lowered
// from 171000 to 60000 for laptop GPUs (same look, less heat).
import * as THREE from "three";

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

const VERT = `
precision highp float;
uniform float uTime,uSize,uRadius,uNoiseScale,uNoiseSpeed,uSwirl,uBreathing;
uniform vec3 uMouse;
uniform float uMouseRadius, uMouseStrength;
uniform bool uAtten;
uniform int   uPatternType;
uniform float uPatternScale, uPatternStrength, uPatternThreshold, uPatternSpin;
uniform float uCurlStrength;
uniform float uWarpStrength;
uniform int   uFbmOctaves;
uniform float uShockAmp, uShockFreq, uShockSpeed, uShockWidth, uShockDecay;
uniform float uLayerBiasR;
uniform float uLayerSizeMul;
uniform float uLayerAlphaMul;
attribute float aSeed,aPhase;
varying float vHue,vAlpha,vMask,vLayerAlphaMul;
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx, x2=x0-i2+C.yyy, x3=x0-D.yyy; i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  vec4 j=p-49.0*floor(p/49.0); vec4 x_=floor(j/7.0); vec4 y_=floor(j-7.0*x_);
  vec4 x=(x_*2.0+0.5)/7.0-1.0; vec4 y=(y_*2.0+0.5)/7.0-1.0; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy), b1=vec4(x.zw,y.zw); vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 g0=vec3(a0.xy,h.x), g1=vec3(a0.zw,h.y), g2=vec3(a1.xy,h.z), g3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(g0,g0),dot(g1,g1),dot(g2,g2),dot(g3,g3)));
  g0*=norm.x; g1*=norm.y; g2*=norm.z; g3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(g0,x0),dot(g1,x1),dot(g2,x2),dot(g3,x3)));
}
float fbm(vec3 p){
  float a=0.5; float f=1.0; float sum=0.0;
  for(int i=0;i<8;i++){
    if(i>=uFbmOctaves) break;
    sum += a * snoise(p*f);
    f *= 2.0; a *= 0.5;
  }
  return sum;
}
vec3 curl(vec3 p){
  float e = 0.1;
  float nx1 = snoise(p + vec3(e,0,0));
  float nx2 = snoise(p - vec3(e,0,0));
  float ny1 = snoise(p + vec3(0,e,0));
  float ny2 = snoise(p - vec3(0,e,0));
  float nz1 = snoise(p + vec3(0,0,e));
  float nz2 = snoise(p - vec3(0,0,e));
  vec3 g = vec3((nx1-nx2),(ny1-ny2),(nz1-nz2))/(2.0*e);
  return vec3(g.y - g.z, g.z - g.x, g.x - g.y);
}
vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
float patternField(vec3 n, float t){
  vec3 ns = rotY(n, t*uPatternSpin);
  if(uPatternType==0){
    vec3 d1 = normalize(vec3( 1.0, 0.2, 0.0));
    vec3 d2 = normalize(vec3(-0.6, 0.8, 0.3));
    vec3 d3 = normalize(vec3( 0.2,-0.5, 0.9));
    d1 = rotY(d1, t*0.4); d2 = rotY(d2, t*0.2); d3 = rotY(d3, -t*0.3);
    float s = uPatternScale;
    float m1 = exp( s*4.0*(dot(ns,d1)-1.0) );
    float m2 = exp( s*4.0*(dot(ns,d2)-1.0) );
    float m3 = exp( s*4.0*(dot(ns,d3)-1.0) );
    return clamp(m1+m2+m3, 0.0, 1.0);
  } else if(uPatternType==1){
    float k = uPatternScale*3.14159;
    float v = 0.5+0.5*sin(k*ns.y + 1.5*snoise(ns*1.3 + vec3(0.0,0.0,t*0.5)));
    return v;
  } else {
    float ang = atan(ns.z, ns.x);
    float waves = sin(uPatternScale*4.0*ang + 2.0*snoise(ns*0.8 + vec3(0.0,0.0,t*0.4)));
    return 0.5+0.5*waves;
  }
}
void main(){
  vec3 p=position;
  float theta=atan(p.z,p.x)+uSwirl*0.35*(uTime*0.15+aSeed*6.2831);
  float rad=length(p.xz);
  p.x=cos(theta)*rad; p.z=sin(theta)*rad;
  float t=uTime*uNoiseSpeed;
  vec3 base = p*uNoiseScale + vec3(0.0,0.0,t) + aSeed*10.0;
  vec3 warp = vec3(fbm(base*1.1), fbm(base*1.7), fbm(base*2.3));
  vec3 warped = base + uWarpStrength * warp;
  vec3 v = curl(warped) * uCurlStrength;
  p += v;
  vec3 nrm = normalize(p);
  float mask = patternField(nrm, uTime);
  mask = smoothstep(uPatternThreshold, 1.0, mask);
  float n = snoise(warped);
  float breathe=1.0+uBreathing*sin(t*2.0+aPhase);
  float radius = uRadius + uLayerBiasR;
  float rNow   = radius * (breathe + 0.18*n + 0.10*uPatternStrength*(mask-0.5));
  p = nrm * rNow;
  // Mouse interaction: push particles away from cursor
  if(uMouseStrength > 0.001){
    vec3 toMouse = p - uMouse;
    float d = length(toMouse);
    float influence = smoothstep(uMouseRadius, 0.0, d);
    p += normalize(toMouse + vec3(0.001)) * influence * uMouseStrength;
  }
  float wave = sin(uShockFreq*(radius - uShockSpeed*uTime));
  float env  = exp(-uShockDecay * max(0.0, (radius - uShockSpeed*uTime)));
  float shock = smoothstep(1.0-uShockWidth, 1.0, 0.5+0.5*wave) * env;
  float ps = uSize * uLayerSizeMul * (1.0 + 1.8*uPatternStrength*mask);
  if(uAtten){
    float dist=length((modelViewMatrix*vec4(p,1.0)).xyz);
    ps *= 1.0 / dist;
  }
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
  gl_PointSize=ps;
  vHue   = 0.5+0.5*nrm.y;
  vAlpha = (0.6+0.4*abs(n)) * (1.0 + uShockAmp*shock);
  vMask  = mask;
  vLayerAlphaMul = uLayerAlphaMul;
}
`;

const FRAG = `
precision highp float;
uniform vec3 uColA,uColB;
uniform float uAlpha,uBloomish, uPatternStrength;
varying float vHue,vAlpha,vMask,vLayerAlphaMul;
void main(){
  vec2 uv=gl_PointCoord*2.0-1.0;
  float r2=dot(uv,uv);
  float disk=smoothstep(1.0,0.0,r2);
  vec3 col=mix(uColA,uColB,vHue);
  float boost = 1.0 + uPatternStrength * (0.7 + 0.6*vMask);
  float a = disk * uAlpha * vAlpha * mix(1.0, 1.0 + 1.5*vMask, uPatternStrength) * vLayerAlphaMul;
  col *= (1.0+(1.0-r2)*uBloomish) * boost;
  gl_FragColor=vec4(col, a);
}
`;

function fibonacciSphere(n: number, r: number) {
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const phase = new Float32Array(n);
  const offset = 2 / n;
  const inc = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = i * offset - 1 + offset / 2;
    const rxy = Math.sqrt(1 - y * y);
    const phi = i * inc;
    pos[i * 3 + 0] = Math.cos(phi) * rxy * r;
    pos[i * 3 + 1] = y * r;
    pos[i * 3 + 2] = Math.sin(phi) * rxy * r;
    seed[i] = Math.random();
    phase[i] = Math.random() * Math.PI * 2;
  }
  return { pos, seed, phase };
}

export class EmoEngine {
  valence = 0;
  arousal = 0;
  overrideColorA?: string;
  overrideColorB?: string;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private oldTime = 0;
  private ph = { b: 0, s: 0, a: 0, sh: 0 };
  private mat1: THREE.ShaderMaterial | null = null;
  private mat2: THREE.ShaderMaterial | null = null;
  private points1: THREE.Points | null = null;
  private points2: THREE.Points | null = null;
  private geom: THREE.BufferGeometry | null = null;
  private raf = 0;
  private running = false;
  private ro: ResizeObserver | null = null;
  private lastV = 999;
  private lastA = 999;
  private mouseTarget = new THREE.Vector3(0, 0, 0);
  private mouseCurrent = new THREE.Vector3(0, 0, 0);
  private mouseActive = false;
  private cA = new THREE.Color();
  private cB = new THREE.Color();
  private params = {
    radius: 0.9, size: 2.0, noiseScale: 2.15, noiseSpeed: 0.5, swirl: 1.8,
    breathing: 0.2, colorA: "#5b7bff", colorB: "#b991ff", alpha: 0.75,
    bloomish: 0.0, patternScale: 0.5, patternStrength: 0.7, patternThreshold: 0.9,
    patternSpin: 0.45, curlStrength: 0.2, warpStrength: 1.23, fbmOctaves: 4,
    shockAmp: 0.6, shockFreq: 3.7, shockSpeed: 0.5, shockWidth: 0.9, shockDecay: 0.3,
    layerDeltaR: 0.08, layer2SizeMul: 0.9, layer2AlphaMul: 0.6,
  };
  private colA = ["#101952","#2a2873","#4d2a7a","#7a2a73","#C12e5b","#D73250","#F04349"].map((c) => new THREE.Color(c));
  private colB = ["#349689","#4eb49c","#71be92","#9cc782","#E2e57a","#Fcf17c","#Fcf781"].map((c) => new THREE.Color(c));

  constructor(private el: HTMLElement, particles = 60000) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(55, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 200);
    this.camera.position.set(0, 0, 3.5);
    this.camera.lookAt(0, 0, 0);
    this.renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(this.renderer.domElement);
    this.rebuild(particles);
    this.ro = new ResizeObserver(() => {
      this.camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(el.clientWidth, el.clientHeight);
    });
    this.ro.observe(el);
  }

  private material(biasR: number, sizeMul: number, alphaMul: number) {
    const p = this.params;
    return new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
      uniforms: {
        uTime: { value: 0 }, uSize: { value: p.size }, uRadius: { value: p.radius },
        uNoiseScale: { value: p.noiseScale }, uNoiseSpeed: { value: p.noiseSpeed },
        uSwirl: { value: p.swirl }, uBreathing: { value: p.breathing },
        uColA: { value: new THREE.Color(p.colorA) }, uColB: { value: new THREE.Color(p.colorB) },
        uAlpha: { value: p.alpha }, uBloomish: { value: p.bloomish },
        uAtten: { value: false }, uPatternType: { value: 2 },
        uPatternScale: { value: p.patternScale }, uPatternStrength: { value: p.patternStrength },
        uPatternThreshold: { value: p.patternThreshold }, uPatternSpin: { value: p.patternSpin },
        uCurlStrength: { value: p.curlStrength }, uWarpStrength: { value: p.warpStrength },
        uFbmOctaves: { value: p.fbmOctaves }, uShockAmp: { value: p.shockAmp },
        uShockFreq: { value: p.shockFreq }, uShockSpeed: { value: p.shockSpeed },
        uShockWidth: { value: p.shockWidth }, uShockDecay: { value: p.shockDecay },
        uLayerBiasR: { value: biasR }, uLayerSizeMul: { value: sizeMul }, uLayerAlphaMul: { value: alphaMul },
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        uMouseRadius: { value: 1.2 },
        uMouseStrength: { value: 0 },
      },
    });
  }

  private rebuild(n: number) {
    const p = this.params;
    const { pos, seed, phase } = fibonacciSphere(n, p.radius);
    this.geom = new THREE.BufferGeometry();
    this.geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.geom.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    this.geom.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    this.mat1 = this.material(0, 1, 1);
    this.points1 = new THREE.Points(this.geom, this.mat1);
    this.scene.add(this.points1);
    this.mat2 = this.material(p.layerDeltaR, p.layer2SizeMul, p.layer2AlphaMul);
    this.points2 = new THREE.Points(this.geom, this.mat2);
    this.scene.add(this.points2);
  }

  private pushVA() {
    const v = this.valence;
    const a = this.arousal;
    const p = this.params;
    p.layerDeltaR = mapRange(v, -3, 3, 0.0, 0.1);
    p.layer2SizeMul = mapRange(v, -3, 3, 0.6, 1.2);
    p.layer2AlphaMul = mapRange(v, -3, 3, 0.3, 0.9);
    p.fbmOctaves = Math.round(mapRange(a, -3, 3, 2, 5));
    const vc = v + 3;
    const i1 = Math.floor(vc);
    const i2 = Math.min(Math.ceil(vc), 6);
    const al = vc - i1;
    this.cA.lerpColors(this.colA[i1], this.colA[i2], al);
    this.cB.lerpColors(this.colB[i1], this.colB[i2], al);
    p.colorA = this.overrideColorA || this.cA.getStyle();
    p.colorB = this.overrideColorB || this.cB.getStyle();
    for (const m of [this.mat1, this.mat2]) {
      if (!m) continue;
      m.uniforms.uFbmOctaves.value = p.fbmOctaves;
      m.uniforms.uColA.value.set(p.colorA);
      m.uniforms.uColB.value.set(p.colorB);
    }
    if (this.mat2) {
      this.mat2.uniforms.uLayerBiasR.value = p.layerDeltaR;
      this.mat2.uniforms.uLayerSizeMul.value = p.layer2SizeMul;
      this.mat2.uniforms.uLayerAlphaMul.value = p.layer2AlphaMul;
    }
  }

  /** Set mouse position in normalized div coords (0-1). Call with null to clear. */
  setMouse(nx: number | null, ny: number | null) {
    if (nx === null || ny === null) {
      this.mouseActive = false;
      return;
    }
    // Map 0..1 to -1..1 NDC, then unproject onto a plane at z=0
    const ndcX = nx * 2 - 1;
    const ndcY = -(ny * 2 - 1);
    // Approximate world position on the sphere surface
    this.mouseTarget.set(ndcX * 1.8, ndcY * 1.8, 0.5);
    this.mouseActive = true;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.getElapsedTime();
    const tick = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(tick);
      if (this.valence !== this.lastV || this.arousal !== this.lastA) {
        this.pushVA();
        this.lastV = this.valence;
        this.lastA = this.arousal;
      }
      const t = this.clock.getElapsedTime();
      const delta = Math.min(0.1, t - this.oldTime);
      this.oldTime = t;
      const ar = mapRange(this.arousal, -3, 3, 0.2, 2.0);
      this.ph.b += delta * ar;
      this.ph.s += delta * 0.7 * ar;
      this.ph.a += delta * 0.85 * 0.2;
      this.ph.sh += delta * 1.2 * 0.2;
      const p = this.params;
      const u = {
        uTime: t,
        uSize: 1.35 + 0.35 * Math.sin(this.ph.s),
        uBreathing: 0.4 + 0.4 * Math.sin(this.ph.b),
        uAlpha: 0.5 + 0.2 * Math.sin(this.ph.a),
        uCurlStrength: mapRange(this.arousal, -3, 3, 0.0, 1.5),
        uShockAmp: 0.6 + 0.6 * Math.sin(this.ph.sh),
      };
      // Smooth mouse interpolation
      this.mouseCurrent.lerp(this.mouseTarget, 0.08);
      const mouseStr = this.mouseActive ? 0.35 : 0;
      for (const m of [this.mat1, this.mat2]) {
        if (!m) continue;
        m.uniforms.uTime.value = u.uTime;
        m.uniforms.uSize.value = u.uSize;
        m.uniforms.uBreathing.value = u.uBreathing;
        m.uniforms.uAlpha.value = u.uAlpha;
        m.uniforms.uCurlStrength.value = u.uCurlStrength;
        m.uniforms.uShockAmp.value = u.uShockAmp;
        m.uniforms.uMouse.value.copy(this.mouseCurrent);
        m.uniforms.uMouseStrength.value += (mouseStr - m.uniforms.uMouseStrength.value) * 0.06;
      }
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  halt() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.renderer.clear();
  }

  dispose() {
    this.halt();
    this.ro?.disconnect();
    this.points1 && this.scene.remove(this.points1);
    this.points2 && this.scene.remove(this.points2);
    this.mat1?.dispose();
    this.mat2?.dispose();
    this.geom?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
