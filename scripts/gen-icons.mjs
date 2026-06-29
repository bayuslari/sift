// Generates simple placeholder PNG icons (emerald funnel glyph on zinc-950).
// Real branded icons can replace these later. No external deps — uses zlib.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// Background zinc-950, accent emerald-500.
const BG = [9, 9, 11];
const FG = [16, 185, 129];

function makePng(size) {
  const c = size / 2;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(size * 3 + 1); // +1 filter byte per row
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      // Draw a downward funnel/triangle (sift) shape.
      const t = y / size; // 0 at top, 1 at bottom
      const halfWidth = (0.5 - 0.42 * t) * size;
      const inFunnel = y < size * 0.78 && Math.abs(x - c) < halfWidth;
      const inStem = y >= size * 0.78 && Math.abs(x - c) < size * 0.06;
      const [r, g, b] = inFunnel || inStem ? FG : BG;
      const o = 1 + x * 3;
      row[o] = r;
      row[o + 1] = g;
      row[o + 2] = b;
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public', { recursive: true });
for (const size of [16, 48, 128]) {
  writeFileSync(`public/icon-${size}.png`, makePng(size));
  console.log(`wrote public/icon-${size}.png`);
}
