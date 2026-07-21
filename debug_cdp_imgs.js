const { exec } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  // Check if CDP port 9222 is already up
  const targets = await new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });

  if (!targets) {
    console.log('❌ CDP Port 9222 not responding. Chrome is not running in debug mode.');
    console.log('Starting Chrome...');
    exec(`"${chromePath}" --remote-debugging-port=9222 --no-first-run`);
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log('✅ CDP Port 9222 is already open');
    console.log('Targets:', JSON.stringify(targets, null, 2));
  }

  // Second attempt
  const targets2 = await new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });

  if (!targets2) { console.log('❌ Still not responding'); return; }

  const pageTarget = targets2.find(t => t.type === 'page') || targets2[0];
  console.log('\nUsing target:', pageTarget?.url, pageTarget?.webSocketDebuggerUrl);

  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  console.log('✅ WS Connected');

  // Enable Page events
  ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
  await new Promise(r => setTimeout(r, 500));

  // Navigate to goods detail
  const goodsNo = 'A000000248829';
  const url = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`;
  console.log('\nNavigating to:', url);
  ws.send(JSON.stringify({ id: 2, method: 'Page.navigate', params: { url } }));

  // Wait for load then dump ALL img src
  await new Promise(r => setTimeout(r, 8000));

  const result = await new Promise((resolve) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 100 && msg.result?.result) {
        ws.removeEventListener('message', handler);
        resolve(msg.result.result.value);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id: 100,
      method: 'Runtime.evaluate',
      params: {
        expression: `JSON.stringify({
          url: document.location.href,
          title: document.title,
          imgs: Array.from(document.querySelectorAll('img')).slice(0, 20).map(i => ({src: i.src, dataSrc: i.getAttribute('data-src')})),
          allSrcs: Array.from(document.querySelectorAll('img')).map(i => i.src).filter(Boolean)
        })`
      }
    }));
  });

  const data = JSON.parse(result);
  console.log('\n📄 Page URL:', data.url);
  console.log('📄 Page Title:', data.title);
  console.log('\n🖼️ First 20 img tags:');
  data.imgs.forEach((img, i) => {
    console.log(`  [${i+1}] src: ${img.src}`);
    if (img.dataSrc) console.log(`       data-src: ${img.dataSrc}`);
  });
  console.log('\n/html/ images:');
  const htmlImgs = data.allSrcs.filter(s => s.includes('/html/'));
  htmlImgs.forEach((u, i) => console.log(`  [${i+1}] ${u}`));
  if (htmlImgs.length === 0) console.log('  ❌ None found');

  ws.close();
}

main();
