import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)" />
  <polygon points="256,40 460,140 460,372 256,472 52,372 52,140" fill="#1e293b" stroke="url(#gold)" stroke-width="12" />
  <!-- Truck container -->
  <rect x="150" y="200" width="140" height="130" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="8" />
  <line x1="180" y1="215" x2="180" y2="315" stroke="#94a3b8" stroke-width="5" />
  <line x1="210" y1="215" x2="210" y2="315" stroke="#94a3b8" stroke-width="5" />
  <line x1="240" y1="215" x2="240" y2="315" stroke="#94a3b8" stroke-width="5" />
  <line x1="270" y1="215" x2="270" y2="315" stroke="#94a3b8" stroke-width="5" />
  <!-- Truck cabin -->
  <path d="M295 230 L345 230 L375 270 L375 330 L295 330 Z" fill="url(#gold)" stroke="#0f172a" stroke-width="8" />
  <path d="M310 245 L335 245 L355 270 L310 270 Z" fill="#ffffff" />
  <!-- Wheels -->
  <circle cx="190" cy="345" r="24" fill="#0f172a" stroke="#fbbf24" stroke-width="8" />
  <circle cx="190" cy="345" r="8" fill="#ffffff" />
  <circle cx="250" cy="345" r="24" fill="#0f172a" stroke="#fbbf24" stroke-width="8" />
  <circle cx="250" cy="345" r="8" fill="#ffffff" />
  <circle cx="345" cy="345" r="24" fill="#0f172a" stroke="#fbbf24" stroke-width="8" />
  <circle cx="345" cy="345" r="8" fill="#ffffff" />
  <!-- Brand text -->
  <text x="256" y="420" font-family="Arial, sans-serif" font-weight="900" font-size="44" fill="#fbbf24" text-anchor="middle" letter-spacing="4">SMT</text>
  <text x="256" y="450" font-family="Arial, sans-serif" font-weight="bold" font-size="18" fill="#ffffff" text-anchor="middle" letter-spacing="2">SRI MURUGAN TRANSPORT</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');

// Minimal valid PNG generator (pure Node.js)
function createSolidPng(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const scanlineWidth = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineWidth);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineWidth;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Draw a subtle border and inner color
      const isBorder = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
      if (isBorder) {
        rawData[pixelOffset] = 251;     // R (Gold)
        rawData[pixelOffset + 1] = 191; // G
        rawData[pixelOffset + 2] = 36;  // B
        rawData[pixelOffset + 3] = 255; // A
      } else {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = a;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  typeAndData.copy(chunk, 4);
  chunk.writeUInt32BE(crc >>> 0, 4 + typeAndData.length);
  return chunk;
}

// CRC32 implementation
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[i] = c;
}

// Generate PWA required icons: 192x192, 512x512, apple-touch-icon.png
// Theme color Navy: #0f172a (15, 23, 42)
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createSolidPng(192, 192, 15, 23, 42));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createSolidPng(512, 512, 15, 23, 42));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createSolidPng(512, 512, 30, 58, 138));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createSolidPng(180, 180, 15, 23, 42));

console.log('PWA icons created successfully in public directory.');
