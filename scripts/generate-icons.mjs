import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

mkdirSync(iconsDir, { recursive: true });

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Blue rounded rect calendar body
  const r = size * 0.12;
  const padding = size * 0.08;
  const x = padding;
  const y = size * 0.18;
  const w = size - padding * 2;
  const h = size - y - padding;

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  // Header bar (slightly darker blue)
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h * 0.32);
  ctx.lineTo(x, y + h * 0.32);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  // Calendar grid dots (white)
  if (size >= 32) {
    ctx.fillStyle = '#ffffff';
    const dotR = Math.max(1, size * 0.05);
    const gridY = y + h * 0.55;
    const gridX1 = x + w * 0.25;
    const gridX2 = x + w * 0.5;
    const gridX3 = x + w * 0.75;
    for (const gx of [gridX1, gridX2, gridX3]) {
      ctx.beginPath();
      ctx.arc(gx, gridY, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
    if (size >= 48) {
      const gridY2 = y + h * 0.78;
      for (const gx of [gridX1, gridX2, gridX3]) {
        ctx.beginPath();
        ctx.arc(gx, gridY2, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // 16px: just a white square in center
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + w * 0.3, y + h * 0.45, w * 0.4, h * 0.35);
  }

  const buffer = canvas.toBuffer('image/png');
  const outPath = join(iconsDir, `icon-${size}.png`);
  writeFileSync(outPath, buffer);
  console.log(`Created ${outPath} (${buffer.length} bytes)`);
}
