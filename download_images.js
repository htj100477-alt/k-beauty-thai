const fs = require('fs');
const path = require('path');
const https = require('https');

const desktopDir = path.join('C:', 'Users', 'ASUS', 'Desktop', 'k-beauty-images');

// Ensure Desktop folder exists
if (!fs.existsSync(desktopDir)) {
  fs.mkdirSync(desktopDir, { recursive: true });
}

const imagesToDownload = [
  {
    name: 'A000000247086.jpg',
    url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0024/A00000024708618ko.jpg?l=ko'
  },
  {
    name: 'A000000247086_detail.jpg',
    url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/html/crop/A000000247086/202607200755/crop0/image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/html/attached/2026/07/16/8be_16164446.jpg?created=202607200755'
  },
  {
    name: 'A000000202777.jpg',
    url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0020/A00000020277792ko.jpg?l=ko'
  },
  {
    name: 'A000000223414.jpg',
    url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0022/A000000223414117ko.jpg?l=ko'
  },
  {
    name: 'A000000259560.jpg',
    url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0025/A00000025956006ko.jpg?l=ko'
  },
  {
    name: 'A000000240910.jpg',
    url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0024/A00000024091057ko.jpg?l=ko'
  },
  {
    name: 'A000000259209.jpg',
    url: 'https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/400/10/0000/0025/A00000025920903ko.jpg?l=ko'
  }
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

async function run() {
  console.log(`Starting download of ${imagesToDownload.length} product images to Desktop: ${desktopDir}...`);
  for (const img of imagesToDownload) {
    const dest = path.join(desktopDir, img.name);
    console.log(`Downloading: ${img.name}...`);
    try {
      await downloadFile(img.url, dest);
      console.log(`Saved: ${img.name}`);
    } catch (err) {
      console.error(`Failed to download ${img.name}:`, err.message);
    }
  }
  console.log('All image downloads completed!');
}

run();
