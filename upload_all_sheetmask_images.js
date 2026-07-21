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

function downloadWithCurl(url, dest) {
  return new Promise((resolve) => {
    const cmd = `curl.exe -s -L "${url}" -o "${dest}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"`;
    exec(cmd, (err) => {
      if (err || !fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
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
  console.log(` Downloading & Uploading ${prods.length} Images to Supabase Storage`);
  console.log(`====================================================\n`);

  let count = 0;
  const batchSize = 10;

  for (let i = 0; i < prods.length; i += batchSize) {
    const batch = prods.slice(i, i + batchSize);

    await Promise.all(batch.map(async (p) => {
      const rawImgUrl = `https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/${p.goods_no.substring(0, 8)}/${p.goods_no}01ko.jpg`;
      const localPath = path.join(desktopDir, `${p.goods_no}.jpg`);

      const downloaded = await downloadWithCurl(rawImgUrl, localPath);

      if (downloaded) {
        const fileBuffer = fs.readFileSync(localPath);
        const { error: uploadErr } = await supabase.storage.from('product-images').upload(`${p.goods_no}.jpg`, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

        if (!uploadErr) {
          const supabaseUrl = `https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/${p.goods_no}.jpg`;
          await supabase.from('products').update({ thumbnail_url: supabaseUrl }).eq('id', p.id);
          count++;
        }
      }
    }));

    if ((i + batchSize) % 50 === 0 || i + batchSize >= prods.length) {
      console.log(` Uploaded ${Math.min(i + batchSize, prods.length)} / ${prods.length} images to Supabase Storage...`);
    }
  }

  console.log('\n====================================================');
  console.log(` Finished Uploading ${count} Images to Supabase Storage & Updating DB!`);
  console.log('====================================================');
}

run();
