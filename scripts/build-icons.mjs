import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('public/icon.svg');

for (const size of [192, 512]) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .flatten({ background: '#0a0e14' })
    .png()
    .toFile(`public/icon-${size}.png`);
}

console.log('icones generees');
