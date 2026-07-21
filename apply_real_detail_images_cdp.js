const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\s8253\\Desktop\\chrome_profile';
const desktopDir = path.join('C:', 'Users', 's8253', 'Desktop', 'oliveyoung-maskpack-images');

if (!fs.existsSync(desktopDir)) fs.mkdirSync(desktopDir, { recursive: true });

function downloadWithCurl(url, dest) {
  return new Promise((resolve) => {
    const cmd = `curl.exe -s -L "${url}" -o "${dest}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Referer: https://www.oliveyoung.co.kr/"`;
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

function fetchDetailImagesViaCdp(ws, goodsNo) {
  return new Promise((resolve) => {
    const url = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`;
    const msgId = Math.floor(Math.random() * 90000) + 10000;

    let done = false;
    const timeout = setTimeout(() => {
      if (!done) { done = true; resolve([]); }
    }, 12000);

    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === msgId && msg.result?.result) {
        clearTimeout(timeout);
        if (!done) {
          done = true;
          ws.removeEventListener('message', handler);
          try {
            const imgs = JSON.parse(msg.result.result.value || '[]');
            resolve(imgs);
          } catch { resolve([]); }
        }
      }
    };

    ws.addEventListener('message', handler);

    // Navigate and wait 4s for page to render, then extract /html/crop/ images
    ws.send(JSON.stringify({
      id: msgId - 1,
      method: 'Page.navigate',
      params: { url }
    }));

    setTimeout(() => {
      ws.send(JSON.stringify({
        id: msgId,
        method: 'Runtime.evaluate',
        params: {
          expression: `JSON.stringify(
            Array.from(document.querySelectorAll('img'))
              .map(i => i.src)
              .filter(s => s.includes('/html/crop/') || s.includes('/html/goods/'))
          )`
        }
      }));
    }, 4000);
  });
}

async function run() {
  const { data: prods } = await supabase.from('products').select('*');
  console.log(`===================================================`);
  console.log(` Extracting REAL Detail Page Images (상품설명 tab)`);
  console.log(` Total Products: ${prods.length}`);
  console.log(`===================================================\n`);

  // Launch Chrome
  const chromeCmd = `"${chromePath}" --user-data-dir="${userDataDir}" --no-first-run --no-default-browser-check --disable-fre --remote-debugging-port=9222`;
  const proc = exec(chromeCmd);
  await new Promise(r => setTimeout(r, 2500));

  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });

  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let count = 0;

  for (let i = 0; i < prods.length; i++) {
    const p = prods[i];

    const imgs = await fetchDetailImagesViaCdp(ws, p.goods_no);

    // Pick the first real detail image from /html/crop/
    const firstDetailImg = imgs.find(u => u.includes('/html/'));

    if (firstDetailImg) {
      const localPath = path.join(desktopDir, `${p.goods_no}_detail.jpg`);
      const ok = await downloadWithCurl(firstDetailImg, localPath);

      if (ok) {
        const fileBuffer = fs.readFileSync(localPath);
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(`${p.goods_no}_detail.jpg`, fileBuffer, { contentType: 'image/jpeg', upsert: true });

        if (!uploadErr) {
          const detailUrl = `https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/${p.goods_no}_detail.jpg`;
          await supabase.from('products').update({ detail_description_image: detailUrl }).eq('id', p.id);
          count++;
        }
      }
    }

    if ((i + 1) % 20 === 0 || i + 1 === prods.length) {
      console.log(` [${i + 1}/${prods.length}] Detail images uploaded: ${count}`);
    }
  }

  ws.close();
  proc.kill();

  console.log(`\n===================================================`);
  console.log(` Done! Real detail images set for ${count} / ${prods.length} products.`);
  console.log(`===================================================`);
}

run();
