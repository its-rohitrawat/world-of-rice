// The shape of the colour change: a mound that rises, peaks and flattens as it fills the screen.
// Shared by the CSS clip-path and the WebGL grains, so the grains leave exactly from the edge.
export const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Height of the edge at x (0..1 across), as a share of the screen from the top. */
export function crest(x: number, t: number) {
  const lift = Math.sin(Math.PI * t);
  return 1.18 - 1.66 * ease(t) - 0.4 * lift * Math.exp(-Math.pow((x - 0.5) / 0.27, 2)) + 0.012 * lift * Math.sin(x * 15 + t * 8);
}

/** clip-path for the incoming panel. dir 1 rises from the bottom, -1 comes down from the top. */
export function crestClip(t: number, dir: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 36; i++) {
    const x = i / 36, y = crest(x, t);
    pts.push(`${(x * 100).toFixed(2)}% ${((dir > 0 ? y : 1 - y) * 100).toFixed(2)}%`);
  }
  const edge = dir > 0 ? '100%' : '0%';
  return `polygon(${pts.join(',')},100% ${edge},0% ${edge})`;
}

export const CREST_GLSL = `
float ease5(float t){ return t*t*t*(t*(t*6.-15.)+10.); }
float crest(float x, float t){
  float lift = sin(3.14159265 * t);
  float k = (x - .5) / .27;
  return 1.18 - 1.66 * ease5(t) - .4 * lift * exp(-k * k) + .012 * lift * sin(x * 15. + t * 8.);
}`;
