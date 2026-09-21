import fs from 'fs';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPng(width, height, drawFn) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      raw[pixelOffset] = r;
      raw[pixelOffset + 1] = g;
      raw[pixelOffset + 2] = b;
      raw[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = Buffer.alloc(4 + 4 + 13 + 4);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4);
  ihdrData.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData])), 21);

  // IDAT chunk
  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatChunk.write('IDAT', 4);
  compressed.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(crc32(Buffer.concat([Buffer.from('IDAT'), compressed])), 8 + compressed.length);

  // IEND chunk
  const iendChunk = Buffer.alloc(12);
  iendChunk.writeUInt32BE(0, 0);
  iendChunk.write('IEND', 4);
  iendChunk.writeUInt32BE(crc32(Buffer.from('IEND')), 8);

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing function for brand icon
function drawBrandIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = w / 100;

  // Background
  const bgR = 15, bgG = 23, bgB = 42; // Slate-900 (#0f172a)
  if (isMaskable) {
    // Solid background all the way to edges
  } else {
    // Rounded rect boundary
    const cornerRadius = 20 * scale;
    const dx = Math.abs(x - cx) - (cx - cornerRadius);
    const dy = Math.abs(y - cy) - (cy - cornerRadius);
    if (dx > 0 && dy > 0 && Math.sqrt(dx * dx + dy * dy) > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }
  }

  // Draw stylish wallet / chart symbol in center
  const nx = (x - cx) / scale; // normalized -50 to 50
  const ny = (y - cy) / scale;

  // Wallet rectangle: x from -24 to +20, y from -14 to +18
  const inWallet = nx >= -24 && nx <= 22 && ny >= -14 && ny <= 18;
  const inClasp = nx >= 20 && nx <= 32 && ny >= -4 && ny <= 8;
  const inClaspDot = Math.hypot(nx - 27, ny - 2) <= 3;

  // Bar chart bars inside wallet
  // Bar 1: -16 to -10, y from 4 to 14
  const inBar1 = nx >= -16 && nx <= -10 && ny >= 4 && ny <= 14;
  // Bar 2: -7 to -1, y from -2 to 14
  const inBar2 = nx >= -7 && nx <= -1 && ny >= -2 && ny <= 14;
  // Bar 3: 2 to 8, y from -8 to 14
  const inBar3 = nx >= 2 && nx <= 8 && ny >= -8 && ny <= 14;

  // Orbit arcs / accents:
  // Emerald arc top-left:
  const rEmerald = Math.hypot(nx + 10, ny + 10);
  const inArcEmerald = rEmerald >= 28 && rEmerald <= 33 && nx <= 0 && ny <= -8;

  // Blue arc bottom-right:
  const rBlue = Math.hypot(nx - 10, ny - 10);
  const inArcBlue = rBlue >= 28 && rBlue <= 33 && nx >= 0 && ny >= 8;

  if (inClaspDot) {
    return [255, 255, 255, 255];
  }
  if (inBar1 || inBar2 || inBar3) {
    return [255, 255, 255, 255];
  }
  if (inClasp || inWallet) {
    return [30, 41, 59, 255]; // Slate-800 (#1e293b)
  }
  if (inArcEmerald) {
    return [34, 197, 94, 255]; // Emerald-500 (#22c55e)
  }
  if (inArcBlue) {
    return [37, 99, 235, 255]; // Blue-600 (#2563eb)
  }

  return [bgR, bgG, bgB, 255];
}

// Generate files in public directory
const icons = [
  { file: 'public/pwa-192x192.png', size: 192, maskable: false },
  { file: 'public/pwa-512x512.png', size: 512, maskable: false },
  { file: 'public/pwa-maskable-512x512.png', size: 512, maskable: true },
  { file: 'public/apple-touch-icon.png', size: 180, maskable: false },
];

for (const icon of icons) {
  const buf = createPng(icon.size, icon.size, (x, y, w, h) => drawBrandIcon(x, y, w, h, icon.maskable));
  fs.writeFileSync(icon.file, buf);
  console.log(`Created ${icon.file} (${icon.size}x${icon.size})`);
}
