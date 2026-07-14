// Genera íconos PWA placeholder para BOX iT sin dependencias externas.
// Marca: marco verde redondeado (un "box") sobre fondo ink, con núcleo lima.
// Regenerar: `pnpm --filter @box-it/web icons`
import zlib from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/icons');
const FAVICON = resolve(__dirname, '../src/app/icon.png');

// Paleta BOX iT
const INK = [11, 15, 14, 255];
const GREEN = [34, 197, 94, 255];
const LIME = [163, 230, 53, 255];

function insideRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const rx0 = x0 + r;
  const rx1 = x1 - r;
  const ry0 = y0 + r;
  const ry1 = y1 - r;
  const ddx = x < rx0 ? rx0 - x : x > rx1 ? x - rx1 : 0;
  const ddy = y < ry0 ? ry0 - y : y > ry1 ? y - ry1 : 0;
  if (ddx === 0 || ddy === 0) return true;
  return ddx * ddx + ddy * ddy <= r * r;
}

function pixel(x, y, size, marginFrac) {
  const m = Math.round(size * marginFrac);
  const inner = size - 2 * m;
  const stroke = Math.max(2, Math.round(inner * 0.14));
  const rOuter = Math.round(inner * 0.26);
  const rInner = Math.max(0, rOuter - stroke);

  // Marco (box)
  const onFrame =
    insideRoundedRect(x, y, m, m, size - m, size - m, rOuter) &&
    !insideRoundedRect(x, y, m + stroke, m + stroke, size - m - stroke, size - m - stroke, rInner);
  if (onFrame) return GREEN;

  // Núcleo lima al centro
  const dotSize = Math.round(inner * 0.24);
  const cx0 = (size - dotSize) / 2;
  const cy0 = (size - dotSize) / 2;
  const rDot = Math.round(dotSize * 0.28);
  if (insideRoundedRect(x, y, cx0, cy0, cx0 + dotSize, cy0 + dotSize, rDot)) return LIME;

  return INK;
}

function crc32(buf) {
  return zlib.crc32(buf) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, marginFrac) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((size * 4 + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filtro none por scanline
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y, size, marginFrac);
      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
      raw[p++] = a;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { path: resolve(OUT_DIR, 'icon-192.png'), size: 192, margin: 0.18 },
  { path: resolve(OUT_DIR, 'icon-512.png'), size: 512, margin: 0.18 },
  { path: resolve(OUT_DIR, 'maskable-512.png'), size: 512, margin: 0.3 },
  { path: resolve(OUT_DIR, 'apple-touch-icon.png'), size: 180, margin: 0.18 },
  { path: FAVICON, size: 256, margin: 0.16 },
];

for (const t of targets) {
  writeFileSync(t.path, encodePng(t.size, t.margin));
  console.log(`✅ ${t.path.split(/[\\/]/).slice(-2).join('/')} (${t.size}px)`);
}

console.log('Íconos placeholder generados.');
