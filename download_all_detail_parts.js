const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');

const desktopDir = path.join('C:', 'Users', 's8253', 'Desktop', 'oliveyoung-maskpack-images');
const goodsNo = 'A000000248829';

function download(url, dest) {
  return new Promise((resolve) => {
    const cmd = `curl.exe -s -L "${url}" -o "${dest}" -H "User-Agent: Mozilla/5.0" -H "Referer: https://www.oliveyoung.co.kr/"`;
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

function cdpEval(ws, expression, id) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 10000);
    const handler = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === id) {
        clearTimeout(timeout);
        ws.removeEventListener('message', handler);
        resolve(m.result?.result?.value || null);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression } }));
  });
}

async function run() {
  const targets = await new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });

  const pageTarget = targets?.find(t => t.type === 'page') || targets?.[0];
  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 0, method: 'Page.enable' }));

  // 페이지 이동
  ws.send(JSON.stringify({ id: 1, method: 'Page.navigate', params: { url: `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}` } }));
  await new Promise(r => setTimeout(r, 5000));

  // 더보기 클릭
  await cdpEval(ws, `(function(){const btn=document.querySelector('button[class*="btn-more"]');if(btn)btn.click();})()`, 10);
  await new Promise(r => setTimeout(r, 2000));

  // 전체 /html/ data-src 이미지 순서대로 추출
  const result = await cdpEval(ws, `
    JSON.stringify(
      Array.from(document.querySelectorAll('img'))
        .map(i => i.getAttribute('data-src') || '')
        .filter(s => s.includes('/html/') && !s.startsWith('data:') && !s.includes('ranking'))
        .map(s => s.split('?')[0])
    )
  `, 11);

  ws.close();

  const allImgs = JSON.parse(result || '[]');
  console.log(`전체 /html/ 이미지 ${allImgs.length}개 발견`);
  allImgs.forEach((u, i) => console.log(`  [${i+1}] ${u.split('/').slice(-2).join('/')}`));

  // 다운로드
  const tmpDir = path.join(desktopDir, `${goodsNo}_parts`);
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const downloaded = [];
  for (let i = 0; i < allImgs.length; i++) {
    const url = allImgs[i];
    const ext = url.toLowerCase().includes('.gif') ? 'gif' : 'jpg';
    const dest = path.join(tmpDir, `part_${String(i).padStart(3,'0')}.${ext}`);
    const ok = await download(url, dest);
    if (ok) {
      downloaded.push(dest);
      console.log(`  다운로드 [${i+1}/${allImgs.length}]: ${path.basename(dest)} (${fs.statSync(dest).size} bytes)`);
    } else {
      console.log(`  실패 [${i+1}]: ${url.split('/').slice(-1)[0]}`);
    }
  }

  console.log(`\n총 ${downloaded.length}개 다운로드 완료`);
  console.log('저장 위치:', tmpDir);
  console.log('\n다음: Python으로 이어붙이기');
}

run();
