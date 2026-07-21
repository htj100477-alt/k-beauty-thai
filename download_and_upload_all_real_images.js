const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

const desktopDir = path.join('C:', 'Users', 's8253', 'Desktop', 'oliveyoung-maskpack-images');
if (!fs.existsSync(desktopDir)) {
  fs.mkdirSync(desktopDir, { recursive: true });
}

function fetchWithCurl(url) {
  return new Promise((resolve, reject) => {
    const cmd = `curl.exe -s -L "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"`;
    exec(cmd, { maxBuffer: 15 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

function downloadWithCurl(url, dest) {
  return new Promise((resolve) => {
    const cmd = `curl.exe -s -L "${url}" -o "${dest}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"`;
    exec(cmd, (err) => {
      if (err || !fs.existsSync(dest) || fs.statSync(dest).size < 2000) {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function run() {
  const { data: prods } = await supabase.from('products').select('*');
  console.log(`====================================================`);
  console.log(` Extracting, Downloading & Uploading ${prods.length} Real Images to Supabase Storage`);
  console.log(`====================================================\n`);

  let count = 0;
  const batchSize = 8;

  for (let i = 0; i < prods.length; i += batchSize) {
    const batch = prods.slice(i, i + batchSize);

    await Promise.all(batch.map(async (p) => {
      const detailUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${p.goods_no}`;
      try {
        const html = await fetchWithCurl(detailUrl);
        const matches = html.match(/https:\/\/image\.oliveyoung\.co\.kr\/cfimages\/cf-goods\/uploads\/images\/[^\s"'>]*\.(jpg|png)/gi) || [];
        const uniqueUrls = Array.from(new Set(matches.map(m => m.replace('&amp;', '&'))));
        const realImgUrl = uniqueUrls.find(u => u.includes('/thumbnails/')) || uniqueUrls[0];

        if (realImgUrl) {
          const localPath = path.join(desktopDir, `${p.goods_no}.jpg`);
          const ok = await downloadWithCurl(realImgUrl, localPath);

          if (ok) {
            const fileBuffer = fs.readFileSync(localPath);
            const { error: uploadErr } = await supabase.storage.from('product-images').upload(`${p.goods_no}.jpg`, fileBuffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

            if (!uploadErr) {
              const supabaseImageUrl = `https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/${p.goods_no}.jpg`;
              await supabase.from('products').update({ thumbnail_url: supabaseImageUrl }).eq('id', p.id);
              count++;
            }
          }
        }
      } catch (e) {
        console.error(`Error processing ${p.goods_no}:`, e.message);
      }
    }));

    if ((i + batchSize) % 40 === 0 || i + batchSize >= prods.length) {
      console.log(` Processed ${Math.min(i + batchSize, prods.length)} / ${prods.length} products (Uploaded: ${count})...`);
    }
  }

  console.log('\n====================================================');
  console.log(` Successfully Downloaded to Desktop & Uploaded ${count} Images to Supabase Storage!`);
  console.log('====================================================');
}

run();
