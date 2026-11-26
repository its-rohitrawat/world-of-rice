'use client';
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { CREST_GLSL } from '@/lib/crest';

export type BurstHandle = { draw: (t: number, dir: number, rgb: [number, number, number]) => void; clear: () => void };

const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 q;
layout(location=1) in vec4 r;
layout(location=2) in vec4 s;
uniform float uT, uDir, uAspect;
out vec2 vP; out float vA; out float vS;
${CREST_GLSL}
void main(){
  float x0 = clamp(.5 + (r.x + r.y - 1.) * .62, .01, .99);
  float born = .12 + r.z * .58;
  float yc = crest(x0, born);
  float age = (uT - born) * 1.35;
  float alive = step(0., age) * step(.0, yc) * step(yc, 1.0) * (1. - smoothstep(.45, .8, age));
  float v = .25 + s.x * .75;
  vec2 p = vec2(x0 + (x0 - .5) * age * (.5 + s.y * .9) + (s.z - .5) * age * .5, yc - v * age + 1.55 * age * age);
  if (uDir < 0.) p.y = 1. - p.y;
  float an = s.w * 6.28 + age * (s.z - .5) * 14.;
  float len = (.011 + .010 * s.y) * (1. - age * .25);
  vec2 k = q * vec2(len, len / 3.1) * 1.12;
  float c = cos(an), n = sin(an);
  k = mat2(c, n, -n, c) * k;
  gl_Position = vec4((p.x * 2. - 1.) + k.x * 2. / uAspect, 1. - p.y * 2. + k.y * 2., 0., 1.);
  vP = q * 1.12; vA = alive; vS = r.w;
}`;
const FRAG = `#version 300 es
precision highp float;
in vec2 vP; in float vA; in float vS;
uniform vec3 uRgb;
out vec4 o;
void main(){
  if (vA < .01) discard;
  float x = clamp(abs(vP.x), 0., 1.);
  float edge = pow(max(1. - x * x, 0.), .62) - abs(vP.y);
  float a = smoothstep(0., fwidth(edge) * 1.5, edge) * vA;
  if (a < .01) discard;
  vec3 col = uRgb * (.74 + .3 * smoothstep(0., .55, edge) + .12 * (vS - .5));
  o = vec4(min(col, 1.) * a, a);
}`;

/** Loose grains thrown up from the rising edge. Drawn only while a change is playing. */
export default function Burst({ ref }: { ref: Ref<BurstHandle> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<BurstHandle>({ draw: () => {}, clear: () => {} });
  useImperativeHandle(ref, () => ({ draw: (t, d, c) => api.current.draw(t, d, c), clear: () => api.current.clear() }), []);

  useEffect(() => {
    const el = canvas.current!;
    const gl = el.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;
    const make = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? ''); return s; };
    const prog = gl.createProgram()!;
    try {
      gl.attachShader(prog, make(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, make(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? '');
    } catch (err) { console.error('Burst could not start', err); return; }
    const N = 900, R = new Float32Array(N * 4), S = new Float32Array(N * 4);
    for (let i = 0; i < N * 4; i++) { R[i] = Math.random(); S[i] = Math.random(); }
    const attr = (loc: number, size: number, data: Float32Array, div: number) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(loc, div); };
    gl.useProgram(prog);
    attr(0, 2, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), 0); attr(1, 4, R, 1); attr(2, 4, S, 1);
    const u = Object.fromEntries(['uT', 'uDir', 'uAspect', 'uRgb'].map(k => [k, gl.getUniformLocation(prog, k)]));
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const resize = () => { const d = Math.min(devicePixelRatio || 1, 1.5); el.width = Math.round(el.clientWidth * d); el.height = Math.round(el.clientHeight * d); gl.viewport(0, 0, el.width, el.height); };
    resize(); addEventListener('resize', resize);
    api.current = {
      draw(t, dir, rgb) {
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(u.uT, t); gl.uniform1f(u.uDir, dir); gl.uniform1f(u.uAspect, el.width / el.height); gl.uniform3f(u.uRgb, ...rgb);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, N);
      },
      clear() { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); },
    };
    return () => { removeEventListener('resize', resize); api.current = { draw: () => {}, clear: () => {} }; gl.deleteProgram(prog); };
  }, []);

  return <canvas ref={canvas} className="burst" aria-hidden="true" />;
}
