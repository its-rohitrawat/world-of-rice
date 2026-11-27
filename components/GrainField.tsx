'use client';
import { useEffect, useRef, useState } from 'react';
import { field } from '@/lib/field';
import { calm, gsap } from '@/lib/gsap';

const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 q;
layout(location=1) in vec3 e;   // logo
layout(location=2) in vec3 d;   // drifting
layout(location=3) in vec3 m;   // heap
layout(location=4) in vec4 r;   // random, random, tone, 1 = only used in the heap
layout(location=5) in vec2 h;   // light on the heap, size in the heap
uniform float uS, uT, uAspect, uPush, uLogo, uFaint, uHeap, uBase;
uniform vec2 uMouse;
out vec2 vP;
out vec4 vC;
out float vNat;

float w(float s, float at){ return clamp(1.0 - abs(s - at), 0.0, 1.0); }
vec3 leg(vec3 a, vec3 b, float t, float seed, float swing){
  float k = clamp(t * 1.6 - seed * 0.6, 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  vec3 p = mix(a, b, k);
  float arc = sin(k * 3.14159);
  float an = seed * 6.2831;
  p.xy += vec2(cos(an), sin(an) * .7) * arc * (.07 + .2 * r.y) * swing;
  p.z += arc * (seed - .5) * 5.0;
  return p;
}
void main(){
  float seed = r.x;
  // loose grains float and turn where they are; they no longer rain down from the top
  vec3 drift = d;
  drift.y += sin(uT * .35 + seed * 17.0) * .025;
  drift.x += sin(uT * .3 + seed * 20.0) * .012;
  drift.z += uT * (.12 + .25 * r.y) * (seed > .5 ? 1.0 : -1.0);
  vec3 fall = vec3(e.x * 1.5 + (r.y - .5) * 1.2, 1.35 + seed * 1.1, e.z + seed * 9.0);
  vec3 p;
  if (uS < 1.0) p = leg(fall, e, uS, seed, 1.0);              // the opening pour into the logo
  else if (uS < 2.0) p = leg(e, drift, uS - 1.0, seed, 1.0);  // the logo breaks into floating grains
  else if (r.w > .5) { p = m; p.y = uBase + (m.y - uBase) * smoothstep(2.42, 2.92, uS); }  // the heap's own grains rise from the floor with the mound
  else p = leg(drift, m, uS - 2.0, seed, 1.0);                // the floating grains fly into the heap

  vec2 dm = p.xy - uMouse;
  float f = exp(-dot(dm, dm) * 34.0) * uPush * mix(1.0, .45, clamp(uS - 2.0, 0.0, 1.0));
  p.xy += normalize(dm + 1e-4) * f * .085;
  p.z += f * (seed - .5) * 4.0;

  float hw = clamp(uS - 2.0, 0.0, 1.0), dw = w(uS, 2.0);
  float len = mix(.0086 * uLogo, .0112, dw);
  len = mix(len, .0245 * uHeap * h.y, hw);
  len *= .86 + .28 * r.y;
  if (r.w > .5) len *= smoothstep(0.0, .12, hw);
  vec2 size = vec2(len, len / mix(3.15, 3.5, hw));
  float c = cos(p.z), s = sin(p.z);
  vec2 v = mat2(c, s, -s, c) * (q * size * 1.12);
  gl_Position = vec4((p.x + v.x) / uAspect, p.y + v.y, 0.0, 1.0);
  vP = q * 1.12;

  vec3 gold = mix(vec3(.91, .77, .40), vec3(.98, .88, .58), r.y);
  vec3 rice = r.z < .955 ? mix(vec3(.965, .925, .835), vec3(1.0, .985, .94), r.y)
            : r.z < .985 ? vec3(.93, .78, .47) : vec3(.66, .42, .27);
  vec3 shade = vec3(.40, .31, .235);
  rice = mix(shade * mix(vec3(1.0), rice, .6), rice, smoothstep(0.0, 1.0, clamp(h.x, 0.0, 1.0)));
  vC = vec4(mix(gold, rice, hw), mix(mix(1.0, uFaint, dw), 1.0, hw));
  vNat = hw;
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vP;
in vec4 vC;
in float vNat;
out vec4 o;
void main(){
  float x = clamp(abs(vP.x), 0.0, 1.0);
  float half_ = pow(max(1.0 - x * x, 0.0), mix(.74, .6, vNat));
  float edge = half_ - abs(vP.y);
  float aa = fwidth(edge) + 1e-4;
  float a = smoothstep(-aa * .5, aa, edge);
  if (a < .01) discard;
  float body = clamp(abs(vP.y) / max(half_, .05), 0.0, 1.0);
  float lit = .80 + .30 * (1.0 - body * body) + .10 * vP.y;
  // in the heap each grain gets a soft dark edge, so neighbours read as separate grains
  lit = mix(lit, (.74 + .30 * smoothstep(0.0, .5, edge) + .10 * vP.y), vNat);
  vec3 col = vC.rgb * lit;
  a *= vC.a;
  o = vec4(min(col, 1.0) * a, a);
}`;

const CORE_V = `#version 300 es
precision highp float;
layout(location=0) in vec3 a;   // x, height of the heap at x, 0 base / 1 top
uniform float uGrow, uAspect, uDrop;
out vec2 v;
void main(){ float y = -1.04 - uDrop + a.y * a.z * uGrow * .985; v = vec2(a.x, a.z); gl_Position = vec4(a.x / uAspect, y, 0.0, 1.0); }`;
const CORE_F = `#version 300 es
precision highp float;
in vec2 v;
uniform float uGrow, uWide;
out vec4 o;
void main(){
  float light = .60 + .30 * v.y - .16 * v.x / uWide;
  vec3 c = mix(vec3(.43, .33, .24), vec3(.93, .87, .76), clamp(light, 0.0, 1.0));
  float a = smoothstep(0.0, .25, uGrow);
  o = vec4(c * a, a);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

const rnd = (i: number, k: number) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

/** Rice grains drawn as 2D instances in WebGL: they fall, form the logo, drift apart, then pour into a heap. */
export default function GrainField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl) { setFailed(true); return; }
    let raf = 0, dead = false, n = 0, visible = true, aspect = 1;
    const mouse = { x: 9, y: 9, tx: 9, ty: 9, push: 0 };
    const still = calm();
    let prog: WebGLProgram, core: WebGLProgram;
    try {
      core = gl.createProgram()!;
      gl.attachShader(core, compile(gl, gl.VERTEX_SHADER, CORE_V));
      gl.attachShader(core, compile(gl, gl.FRAGMENT_SHADER, CORE_F));
      gl.linkProgram(core);
      if (!gl.getProgramParameter(core, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(core) ?? 'link');
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
    } catch (err) { console.error('Grain field could not start', err); setFailed(true); return; }
    gl.useProgram(prog);
    const u = Object.fromEntries(['uS', 'uT', 'uAspect', 'uPush', 'uMouse', 'uLogo', 'uFaint', 'uHeap', 'uBase'].map(k => [k, gl.getUniformLocation(prog, k)]));
    const cu = Object.fromEntries(['uGrow', 'uAspect', 'uWide', 'uDrop'].map(k => [k, gl.getUniformLocation(core, k)]));
    const grainVao = gl.createVertexArray(), coreVao = gl.createVertexArray();
    gl.bindVertexArray(coreVao);
    const coreBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coreBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    const COLS = 120;
    let wide = 1, lower = 0, logoK = 1;
    gl.bindVertexArray(grainVao);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const sizes = [3, 3, 3, 4, 2];
    const buf = sizes.map((size, k) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.enableVertexAttribArray(k + 1);
      gl.vertexAttribPointer(k + 1, size, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(k + 1, 1);
      return b;
    });
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let emblem: number[][] = [];

    // Peak sits at (1.337 + drop) / 2 of the screen height, about 7px lower in grains. Keep it under the "Shop all" button.
    function heapDrop() {
      const b = document.querySelector<HTMLElement>('.fam-cta'), hpx = canvas.clientHeight || innerHeight;
      const need = b ? 2 * (b.offsetTop + b.offsetHeight + 12) / hpx - 1.337 : 0;
      return Math.min(.3, Math.max(.118, need));
    }

    function layout() {
      if (!emblem.length) return;
      const small = innerWidth < 820;
      const own = emblem.length, total = own + (small ? 4200 : 9000);
      let logo = small ? Math.min(aspect * 1.5, .92) : .98, cy = small ? .22 : .13;
      if (small) {
        // on a phone the crest sits in the space between the menu bar and the headline, sized to fit it
        const hi = document.querySelector<HTMLElement>('.hero-in'), H = canvas.clientHeight || innerHeight;
        const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--head')) || 76;
        if (hi && hi.offsetTop > head + 60) {
          logo = Math.max(.25, Math.min(logo, 2 * (hi.offsetTop - head - 28) / H));
          cy = 1 - (head + hi.offsetTop) / H;
        }
      }
      logoK = small ? logo / .98 : 1;

      // A poured cone: straight slopes, a rounded tip, loose grains at the foot.
      const W = Math.min(aspect * .84, 1.62), H = small ? .34 : .7, drop = small ? 0 : heapDrop();
      lower = drop;
      wide = W;
      const height = (x: number) => {
        const t = Math.abs(x / W + .012);
        const cone = Math.max(0, 1.1 - Math.sqrt(t * t + .014));
        return H * Math.pow(cone, 1.22) + Math.min(cone, .5) * .022 * (Math.sin(x * 6.1 + 1) + .6 * Math.sin(x * 14.7));
      };
      const peak = height(0);
      const order: { i: number; x: number; y: number; a: number; light: number; size: number }[] = [];
      for (let i = 0; i < total; i++) {
        if (rnd(i, 30) < .011) {
          const side = rnd(i, 31) < .5 ? -1 : 1;
          order.push({ i, x: side * W * (.9 + Math.pow(rnd(i, 32), 2.2) * .5), y: -1.0 - drop + Math.pow(rnd(i, 33), 2) * .07, a: (rnd(i, 34) - .5) * 2.4, light: .84 + rnd(i, 35) * .16, size: .92 });
          continue;
        }
        let x = 0, k = 0;
        do { x = (rnd(i, 40 + k) * 2 - 1) * W * 1.08; k += 2; } while (rnd(i, 41 + k) * peak > height(x) && k < 24);
        const top = height(x), skin = rnd(i, 36) < .34;
        const v = skin ? 1 - Math.pow(rnd(i, 37), 2) * .1 : Math.pow(rnd(i, 38), .82);
        const slope = (height(x + .01) - height(x - .01)) / .02;
        const a = skin ? Math.atan(slope) + (rnd(i, 39) - .5) * 1.5 : Math.atan(slope) * .6 + (rnd(i, 39) - .5) * 2.5;
        const side = -x / W;                                   // light from the upper left
        const light = .62 + .3 * v + .17 * side + (skin ? .1 : 0) + (rnd(i, 29) - .5) * .17;
        order.push({ i, x, y: -1.03 - drop + top * v, a, light: Math.min(1, Math.max(.2, light)), size: .9 + rnd(i, 28) * .25 });
      }
      order.sort((p, q) => q.y - p.y);                          // far grains first, near ones on top

      n = total;
      const E = new Float32Array(n * 3), D = new Float32Array(n * 3), M = new Float32Array(n * 3), R = new Float32Array(n * 4), L = new Float32Array(n * 2);
      order.forEach((o, k) => {
        const i = o.i, extra = i >= own, p = emblem[i % own];
        E.set([p[0] / 10000 * logo * .5, cy + p[1] / 10000 * logo * .5, p[2] / 1000], k * 3);
        const side = rnd(i, 1) < .5 ? -1 : 1, spread = Math.min(1, -Math.log(1 - rnd(i, 2) * .995) * (small ? .1 : .2));
        D.set([side * aspect * (1.07 - spread * .62), rnd(i, 3) * 2.3 - 1.15, rnd(i, 4) * 6.28], k * 3);
        M.set([o.x, o.y, o.a], k * 3);
        R.set([rnd(i, 16), rnd(i, 17), rnd(i, 18), extra ? 1 : 0], k * 4);
        L.set([o.light, o.size], k * 2);
      });
      [E, D, M, R, L].forEach((a, k) => { gl!.bindBuffer(gl!.ARRAY_BUFFER, buf[k]); gl!.bufferData(gl!.ARRAY_BUFFER, a, gl!.STATIC_DRAW); });
      const strip = new Float32Array((COLS + 1) * 6);
      for (let k = 0; k <= COLS; k++) { const x = (k / COLS * 2 - 1) * W * 1.1, h = Math.max(0, height(x)); strip.set([x, h, 0, x, h, 1], k * 6); }
      gl!.bindBuffer(gl!.ARRAY_BUFFER, coreBuf);
      gl!.bufferData(gl!.ARRAY_BUFFER, strip, gl!.STATIC_DRAW);
    }

    let lastW = 0, lastH = 0, lastDpr = 0;
    function resize() {
      // sharp on high-density phone screens; and nothing to redo when the size did not change (a phone's toolbar sliding away)
      const dpr = Math.min(devicePixelRatio || 1, 2.5), w = canvas.clientWidth, h = canvas.clientHeight;
      if (w === lastW && h === lastH && dpr === lastDpr && emblem.length) return;
      lastW = w; lastH = h; lastDpr = dpr;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      gl!.viewport(0, 0, canvas.width, canvas.height);
      aspect = w / h;
      layout();
    }

    const t0 = performance.now();
    function frame() {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const show = field.on && !document.hidden;
      if (!show) { if (visible) { gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT); visible = false; } return; }
      visible = true;
      if (!n) return;
      mouse.x += (mouse.tx - mouse.x) * .16; mouse.y += (mouse.ty - mouse.y) * .16; mouse.push *= .985;
      const small = innerWidth < 820;
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      const stage = field.stage > 1 ? field.stage : field.intro;    // scrolled on: the scroll decides; at the top: the opening pour
      const grow = Math.min(1, Math.max(0, (stage - 2.42) / .5));
      if (grow > 0) {
        gl!.useProgram(core); gl!.bindVertexArray(coreVao);
        gl!.uniform1f(cu.uGrow, grow * grow * (3 - 2 * grow)); gl!.uniform1f(cu.uAspect, aspect); gl!.uniform1f(cu.uWide, wide); gl!.uniform1f(cu.uDrop, lower);
        gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, (COLS + 1) * 2);
      }
      gl!.useProgram(prog); gl!.bindVertexArray(grainVao);
      gl!.uniform1f(u.uS, Math.min(stage, 3));
      gl!.uniform1f(u.uBase, -1.03 - lower);
      gl!.uniform1f(u.uT, still ? 0 : (performance.now() - t0) / 1000);
      gl!.uniform1f(u.uAspect, aspect);
      gl!.uniform1f(u.uPush, still ? 0 : Math.min(mouse.push, 1));
      gl!.uniform1f(u.uLogo, logoK);
      gl!.uniform1f(u.uFaint, small ? .34 : .62);
      gl!.uniform1f(u.uHeap, small ? .8 : 1);
      gl!.uniform2f(u.uMouse, mouse.x, mouse.y);
      gl!.drawArraysInstanced(gl!.TRIANGLE_STRIP, 0, 4, n);
    }
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerType !== 'mouse') return;   // a finger scrolling the page should not push the crest apart
      const x = (ev.clientX / innerWidth * 2 - 1) * aspect, y = 1 - ev.clientY / innerHeight * 2;
      if (mouse.x > 8) { mouse.x = x; mouse.y = y; }
      mouse.tx = x; mouse.ty = y; mouse.push = Math.min(1.2, mouse.push + .22);
    };
    resize();
    addEventListener('resize', resize);
    addEventListener('pointermove', onMove, { passive: true });
    fetch('/emblem.json').then(r => r.json()).then((pts: number[][]) => {
      if (dead) return;
      emblem = pts.map((p, i) => [p, rnd(i, 99)] as const).sort((a, b) => a[1] - b[1]).map(a => a[0]);
      layout();
      if (field.intro < 1) {
        if (still || scrollY > innerHeight * .5) field.intro = 1;
        else gsap.fromTo(field, { intro: 0 }, { intro: 1, duration: innerWidth < 820 ? 2.2 : 3.1, ease: 'power2.out' });
      }
      frame();
      document.fonts?.ready.then(() => { if (!dead) layout(); });   // the headline settles once fonts load
    }).catch(err => { console.error('Grain field data missing', err); setFailed(true); });
    return () => {
      dead = true; cancelAnimationFrame(raf);
      removeEventListener('resize', resize); removeEventListener('pointermove', onMove);
      gsap.killTweensOf(field); field.stage = 0; field.intro = 0; field.on = true;
      buf.forEach(b => gl.deleteBuffer(b)); gl.deleteBuffer(quad); gl.deleteBuffer(coreBuf); gl.deleteVertexArray(grainVao); gl.deleteVertexArray(coreVao); gl.deleteProgram(prog); gl.deleteProgram(core);
    };
  }, []);

  if (failed) return <img className="field-fallback" src="/logo.webp" alt="" />;
  return <canvas ref={ref} className="field" aria-hidden="true" />;
}
