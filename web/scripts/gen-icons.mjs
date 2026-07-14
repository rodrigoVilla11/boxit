// Genera los íconos PWA de BOX iT sin dependencias externas (solo Node/zlib).
// Diseño: tile ink con glow verde + marco "box" + monograma "iT" (verde) con el
// punto de la i en lima. Regenerar: `pnpm --filter @box-it/web icons`
import zlib from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/icons');
const FAVICON = resolve(__dirname, '../src/app/icon.png');

// Paleta BOX iT
const INK = [11, 15, 14];
const GREEN = [34, 197, 94];
const LIME = [163, 230, 53];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;

// ¿(x,y) dentro de un rect redondeado [x0,y0]-[x1,y1] con radio r?
function insideRR(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const rx0 = x0 + r, rx1 = x1 - r, ry0 = y0 + r, ry1 = y1 - r;
  const ddx = x < rx0 ? rx0 - x : x > rx1 ? x - rx1 : 0;
  const ddy = y < ry0 ? ry0 - y : y > ry1 ? y - ry1 : 0;
  if (ddx === 0 || ddy === 0) return true;
  return ddx * ddx + ddy * ddy <= r * r;
}

// Geometría normalizada [0..1] del monograma "iT" y del marco.
const FRAME = { m: 0.1, t: 0.045, r: 0.14 };
const IT = {
  iStem: [0.3105, 0.4512, 0.3848, 0.7051, 0.016],
  iDot: [0.3066, 0.334, 0.3887, 0.416, 0.021],
  tBar: [0.4395, 0.2949, 0.6934, 0.3652, 0.016],
  tStem: [0.5312, 0.2949, 0.6016, 0.7051, 0.016],
};

function pixel(x, y, S, cfg) {
  const nx = x + 0.5;
  const ny = y + 0.5;

  // Forma del tile (redondeado para "any", cuadrado full-bleed para maskable)
  if (cfg.rounded && !insideRR(nx, ny, 0, 0, S, S, 0.185 * S)) {
    return [0, 0, 0, 0]; // esquina transparente
  }

  // Base ink + glow verde (esquina superior izquierda)
  let R = INK[0], G = INK[1], B = INK[2];
  const gx = 0.3 * S, gy = 0.24 * S, gr = 0.62 * S, gA = 0.42;
  const d = Math.hypot(nx - gx, ny - gy);
  const a = gA * Math.pow(clamp(1 - d / gr, 0, 1), 1.5);
  R = mix(R, GREEN[0], a);
  G = mix(G, GREEN[1], a);
  B = mix(B, GREEN[2], a);

  // Escala de contenido (marco + iT) hacia el centro (safe zone en maskable)
  const s = cfg.scale;
  const sc = (f) => (0.5 + (f - 0.5) * s) * S;

  // Marco "box" (anillo redondeado verde)
  const fm = FRAME.m, ft = FRAME.t, fr = FRAME.r;
  const onFrame =
    insideRR(nx, ny, sc(fm), sc(fm), sc(1 - fm), sc(1 - fm), fr * s * S) &&
    !insideRR(nx, ny, sc(fm + ft), sc(fm + ft), sc(1 - fm - ft), sc(1 - fm - ft), (fr - ft) * s * S);

  // Monograma iT
  const rr = (g) => insideRR(nx, ny, sc(g[0]), sc(g[1]), sc(g[2]), sc(g[3]), g[4] * s * S);
  const inDot = rr(IT.iDot);
  const inGreen = rr(IT.iStem) || rr(IT.tBar) || rr(IT.tStem) || onFrame;

  if (inDot) return [...LIME, 255];
  if (inGreen) return [...GREEN, 255];
  return [Math.round(R), Math.round(G), Math.round(B), 255];
}

// ---- Codificación PNG (RGBA) ----
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])) >>> 0, 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePng(size, cfg) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, al] = pixel(x, y, size, cfg);
      raw[p++] = r; raw[p++] = g; raw[p++] = b; raw[p++] = al;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync(OUT_DIR, { recursive: true });
const targets = [
  { path: resolve(OUT_DIR, 'icon-192.png'), size: 192, cfg: { rounded: true, scale: 1 } },
  { path: resolve(OUT_DIR, 'icon-512.png'), size: 512, cfg: { rounded: true, scale: 1 } },
  { path: resolve(OUT_DIR, 'maskable-512.png'), size: 512, cfg: { rounded: false, scale: 0.82 } },
  { path: resolve(OUT_DIR, 'apple-touch-icon.png'), size: 180, cfg: { rounded: false, scale: 1 } },
  { path: FAVICON, size: 256, cfg: { rounded: true, scale: 1 } },
];
for (const t of targets) {
  writeFileSync(t.path, encodePng(t.size, t.cfg));
  console.log(`✅ ${t.path.split(/[\\/]/).slice(-2).join('/')} (${t.size}px)`);
}
console.log('Íconos BOX iT generados.');
