// Generate sparkle emoji-style icons for the Chrome extension
// Run with: node generate-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a sparkle emoji-style icon (4-pointed star)
function createSparklePNG(size) {
  const r = 255, g = 105, b = 180; // #ff69b4 pink

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = createIHDRChunk(size, size);

  // IDAT chunk (image data)
  const idat = createIDATChunk(size, size, r, g, b);

  // IEND chunk
  const iend = createIENDChunk();

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createIHDRChunk(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data.writeUInt8(8, 8);
  data.writeUInt8(6, 9);
  data.writeUInt8(0, 10);
  data.writeUInt8(0, 11);
  data.writeUInt8(0, 12);
  return createChunk('IHDR', data);
}

function createIDATChunk(width, height, r, g, b) {
  const raw = [];
  const cx = width / 2;
  const cy = height / 2;
  const padding = width * 0.1;

  for (let y = 0; y < height; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // Normalize to -1 to 1
      const nx = (x - cx) / (cx - padding);
      const ny = (y - cy) / (cy - padding);

      // 4-pointed sparkle formula
      // The shape is defined by: |x|^p + |y|^p = 1 where p < 1 makes it pointy
      const p = 0.5;
      const dist = Math.pow(Math.abs(nx), p) + Math.pow(Math.abs(ny), p);

      // Add a slight glow/gradient
      if (dist <= 1) {
        // Inside the sparkle
        const intensity = 1 - dist * 0.3;
        const alpha = Math.min(255, Math.round(255 * intensity));
        raw.push(r, g, b, alpha);
      } else if (dist <= 1.2) {
        // Soft glow edge
        const glow = 1 - (dist - 1) / 0.2;
        const alpha = Math.round(100 * glow);
        raw.push(r, g, b, alpha);
      } else {
        raw.push(0, 0, 0, 0);
      }
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(raw));
  return createChunk('IDAT', compressed);
}

function createIENDChunk() {
  return createChunk('IEND', Buffer.alloc(0));
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  const table = makeCRCTable();
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCRCTable() {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

// Generate icons
const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

sizes.forEach(size => {
  const png = createSparklePNG(size);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created ${filename}`);
});

console.log('Done! Sparkle icons created.');
