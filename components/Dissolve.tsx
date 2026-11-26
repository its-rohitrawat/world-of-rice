'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';

const VERT = `#version 300 es
in vec2 q; out vec2 v;
void main(){ v = q * .5 + .5; gl_Position = vec4(q, 0., 1.); }`;

// Two images, one breaking into grain-shaped flecks while the next gathers from below.
const FRAG = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D a, b;
uniform float t, sa, sb, time;
uniform vec2 res;
vec2 hash(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
vec3 flecks(vec2 uv){
  vec2 p = uv * vec2(34., 34.); vec2 ip = floor(p), fp = fract(p);
  float best = 9.; vec2 id = vec2(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 c = vec2(x, y), h = hash(ip + c);
    vec2 d = c + .2 + h * .6 - fp;
    float an = h.x * 3.14; d = mat2(cos(an), -sin(an), sin(an), cos(an)) * d; d.y *= 2.1;
    float m = dot(d, d);
    if (m < best) { best = m; id = h; }
  }
  return vec3(id, best);
}
vec4 pick(sampler2D s, vec2 uv, float ratio){
  float box = res.x / res.y;
  vec2 k = ratio > box ? vec2(1., box / ratio) : vec2(ratio / box, 1.);
  vec2 w = (uv - .5) / k + .5;
  w.y = 1. - w.y;
  if (w.x < 0. || w.x > 1. || w.y < 0. || w.y > 1.) return vec4(0.);
  return texture(s, w);
}
void main(){
  vec3 f = flecks(v);
  float arc = sin(t * 3.14159);
  float outT = clamp(t * 1.9 - f.x * .55 - (1. - v.y) * .18, 0., 1.);
  float inT = clamp(t * 1.9 - .72 - f.y * .45 - v.y * .2 + .2, 0., 1.);
  outT = smoothstep(0., 1., outT); inT = smoothstep(0., 1., inT);
  vec2 dir = (f.xy - .5);
  vec4 A = pick(a, v + vec2(dir.x * .12, .16 + dir.y * .1) * outT * outT, sa);
  vec4 B = pick(b, v + vec2(dir.x * .12, -.14 + dir.y * .08) * (1. - inT) * (1. - inT), sb);
  A *= 1. - smoothstep(.35, 1., outT);
  B *= smoothstep(0., .65, inT);
  o = B + A * (1. - B.a);
}`;

export type DissolveState = { pos: number };

/** Plays through a list of cut-out images. `state.pos` 0..n-1, fractions are the transitions. */
export default function Dissolve({ images, state }: { images: string[]; state: RefObject<DissolveState> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) { setFailed(true); return; }
    const make = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? ''); return s; };
    const prog = gl.createProgram()!;
    try {
      gl.attachShader(prog, make(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, make(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? '');
    } catch (err) { console.error('Dissolve could not start', err); setFailed(true); return; }
    gl.useProgram(prog);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'q'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (k: string) => gl.getUniformLocation(prog, k);
    const U = { a: u('a'), b: u('b'), t: u('t'), sa: u('sa'), sb: u('sb'), res: u('res') };
    gl.uniform1i(U.a, 0); gl.uniform1i(U.b, 1);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    let dead = false, raf = 0, on = false, last = '';
    const tex: { t: WebGLTexture; r: number; ok: boolean }[] = images.map(() => ({ t: gl.createTexture()!, r: 1, ok: false }));
    tex.forEach(x => { gl.bindTexture(gl.TEXTURE_2D, x.t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); });
    const load = () => images.forEach((src, i) => {
      const im = new Image(); im.decoding = 'async';
      im.onload = () => {
        if (dead) return;
        gl.bindTexture(gl.TEXTURE_2D, tex[i].t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        tex[i].r = im.naturalWidth / im.naturalHeight; tex[i].ok = true; last = '';
      };
      im.src = src;
    });
    const resize = () => { const d = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(canvas.clientWidth * d); canvas.height = Math.round(canvas.clientHeight * d); gl.viewport(0, 0, canvas.width, canvas.height); last = ''; };
    const draw = () => {
      if (dead) return;
      raf = requestAnimationFrame(draw);
      if (!on) return;
      const pos = Math.max(0, Math.min(images.length - 1, state.current.pos)), i = Math.min(images.length - 2, Math.floor(pos)), t = pos - i;
      const key = `${i}:${t.toFixed(4)}:${canvas.width}`;
      if (key === last) return;
      last = key;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[i].t);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[i + 1].t);
      gl.uniform1f(U.t, t); gl.uniform1f(U.sa, tex[i].r); gl.uniform1f(U.sb, tex[i + 1].r); gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    let loaded = false;
    const io = new IntersectionObserver(es => { on = es[0].isIntersecting; if (on && !loaded) { loaded = true; load(); } }, { rootMargin: '60% 0px' });
    io.observe(canvas);
    resize(); addEventListener('resize', resize); draw();
    return () => { dead = true; cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', resize); tex.forEach(x => gl.deleteTexture(x.t)); gl.deleteBuffer(b); gl.deleteProgram(prog); };
  }, [images, state]);

  if (failed) return <img className="dissolve" src={images[0]} alt="" />;
  return <canvas ref={ref} className="dissolve" aria-hidden="true" />;
}
