const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 64, 128, 256, 512];

async function convertIcon() {
  const svgPath = path.join(__dirname, '../assets/MyIcon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../assets/MyIcon-${size}.png`));
  }

  // Create the main icon
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(__dirname, '../assets/MyIcon.png'));
}

convertIcon().catch(console.error); 