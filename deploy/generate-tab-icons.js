const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const SIZE = 81;
const GRAY = [0x78, 0x76, 0x71, 255];
const PURPLE = [0x56, 0x45, 0xd4, 255];

function setPx(img, x, y, c) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  img.bitmap.data[i] = c[0];
  img.bitmap.data[i + 1] = c[1];
  img.bitmap.data[i + 2] = c[2];
  img.bitmap.data[i + 3] = c[3];
}

function fillRect(img, x0, y0, x1, y1, c) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setPx(img, x, y, c);
}

function fillCircle(img, cx, cy, r, c) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) setPx(img, x, y, c);
    }
  }
}

function fillTriangle(img, apexX, apexY, baseInset, baseY, c) {
  const left = baseInset;
  const right = SIZE - 1 - baseInset;
  const cx = (left + right) / 2;
  for (let y = apexY; y <= baseY; y++) {
    const t = (y - apexY) / (baseY - apexY);
    const half = ((right - left) / 2) * t;
    fillRect(img, Math.round(cx - half), y, Math.round(cx + half), y, c);
  }
}

function draw(img, name, c) {
  if (name === 'home') {
    fillTriangle(img, 40, 10, 15, 40, c);
    fillRect(img, 22, 40, 58, 67, c);
  } else if (name === 'train') {
    fillRect(img, 26, 36, 54, 44, c);
    fillRect(img, 18, 26, 30, 54, c);
    fillRect(img, 50, 26, 62, 54, c);
    fillRect(img, 32, 31, 36, 49, c);
    fillRect(img, 44, 31, 48, 49, c);
  } else if (name === 'history') {
    fillRect(img, 16, 14, 64, 66, c);
    fillRect(img, 16, 38, 64, 39, [0, 0, 0, 0]);
    fillCircle(img, 28, 22, 3, [0, 0, 0, 0]);
    fillCircle(img, 52, 22, 3, [0, 0, 0, 0]);
    fillCircle(img, 28, 50, 3, [0, 0, 0, 0]);
    fillCircle(img, 40, 50, 3, [0, 0, 0, 0]);
    fillCircle(img, 52, 50, 3, [0, 0, 0, 0]);
  } else if (name === 'profile') {
    fillCircle(img, 40, 22, 11, c);
    fillRect(img, 22, 54, 58, 67, c);
    fillCircle(img, 40, 54, 18, c);
  }
}

const outDir = path.join(__dirname, '..', 'miniprogram', 'images');
fs.mkdirSync(outDir, { recursive: true });

const icons = [
  ['home', 'tab-home'],
  ['train', 'tab-train'],
  ['history', 'tab-history'],
  ['profile', 'tab-profile']
];

let pending = icons.length * 2;
icons.forEach(([name, file]) => {
  [[GRAY, file + '.png'], [PURPLE, file + '-active.png']].forEach(([color, fileName]) => {
    new Jimp(SIZE, SIZE, 0x00000000, (err, img) => {
      if (err) throw err;
      draw(img, name, color);
      img.write(path.join(outDir, fileName), (werr) => {
        if (werr) throw werr;
        pending -= 1;
        if (pending === 0) {
          console.log('done: 8 tab icons -> miniprogram/images');
        }
      });
    });
  });
});
