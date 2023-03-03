// irregular shapes

// references:
// https://art-from-code.netlify.app/day-1/session-3/#slightly-misshapen-objects
// https://github.com/Tezumie/p5js-Generative-Art-Custom-Functions

// increasing noiseScale increases the noisiness of the form
// setting rMin and rMax close to 1 has the effect of globally flattening the pattern of variation

export function irrCircle(
  _x,
  _y,
  _r,
  n = 100,
  noiseScale = 1,
  rMin = 0.75,
  rMax = 1.25
) {
  const out = [];

  for (let i = 0; i <= n; i++) {
    const theta = (Math.PI * 2 * i) / n;
    const c = Math.cos(theta);
    const s = Math.sin(theta);

    const nx = map(c, -1, 1, 0, noiseScale);
    const ny = map(s, -1, 1, 0, noiseScale);
    const r = map(noise(nx, ny), 0, 1, rMin, rMax) * _r;

    const x = _x + r * c;
    const y = _y + r * s;
    out.push({ x, y });
  }

  return out;
}
