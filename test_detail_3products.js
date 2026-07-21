const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const desktopDir = path.join('C:', 'Users', 's8253', 'Desktop', 'oliveyoung-maskpack-images');
if (!fs.existsSync(desktopDir)) fs.mkdirSync(desktopDir, { recursive: true });

// ✅ 테스트 3개
const TEST_GOODS = ['A000000248829', 'A000000223414', 'A000000259232'];

function downloadWithCurl(url, dest) {
  return new Promise((resolve) => {
    const cmd = `curl.exe -s -L "${url}" -o "${dest}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Referer: https://www.oliveyoung.co.kr/"`;
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

function cdpEval(ws, expression, id) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 8000);
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

async function fetchDetailImages(ws, goodsNo) {
  const url = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`;

  // 1. 페이지 이동
  ws.send(JSON.stringify({ id: 1, method: 'Page.navigate', params: { url } }));
  await new Promise(r => setTimeout(r, 5000));

  // 2. "상품설명 더보기" 버튼 클릭 (정확한 클래스명)
  const clickResult = await cdpEval(ws, `
    (function() {
      const btn = document.querySelector('button[class*="btn-more"]') ||
                  document.querySelector('.GoodsDetailTabs_btn-more__zrJGJ') ||
                  Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('상품설명 더보기'));
      if (btn) {
        btn.click();
        return 'clicked: ' + btn.className;
      }
      return 'not found';
    })()
  `, 10);
  console.log(`   → 더보기 클릭: ${clickResult}`);

  // 3. 클릭 후 2초 대기 (lazy load)
  await new Promise(r => setTimeout(r, 2000));

  // 4. data-src에서 /html/ 이미지 추출
  const result = await cdpEval(ws, `
    JSON.stringify(
      Array.from(document.querySelectorAll('img'))
        .map(i => i.getAttribute('data-src') || i.src || '')
        .filter(s => s && s.includes('/html/') && !s.startsWith('data:') && !s.includes('ranking'))
    )
  `, 11);

  if (!result) return [];
  try { return JSON.parse(result); } catch { return []; }
}

async function run() {
  console.log(`\n✅ 테스트: 3개 상품 상품설명 더보기 클릭 → 상세이미지 추출\n`);

  const targets = await new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });

  let pageTarget = targets?.find(t => t.type === 'page') || targets?.[0];

  if (!pageTarget) {
    console.log('Chrome 실행 중...');
    exec(`"${chromePath}" --remote-debugging-port=9222 --no-first-run`);
    await new Promise(r => setTimeout(r, 3000));
    const t2 = await new Promise((resolve) => {
      http.get('http://127.0.0.1:9222/json', (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
      }).on('error', () => resolve(null));
    });
    pageTarget = t2?.find(t => t.type === 'page') || t2?.[0];
  }

  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
  await new Promise(r => setTimeout(r, 300));

  console.log(`✅ Chrome 연결 완료\n`);

  for (const goodsNo of TEST_GOODS) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 GoodsNo: ${goodsNo}`);

    const imgs = await fetchDetailImages(ws, goodsNo);
    console.log(`   → /html/ 이미지 ${imgs.length}개 발견`);
    imgs.slice(0, 3).forEach((u, i) => {
      console.log(`   [${i+1}] ${u.split('?')[0].split('/').slice(-2).join('/')}`);
    });

    // topinfo 또는 첫 번째 crop0 이미지 선택
    const firstImg = imgs.find(u => u.includes('crop0')) || imgs[0];

    if (firstImg) {
      const isGif = firstImg.toLowerCase().split('?')[0].endsWith('.gif');
      const ext = isGif ? 'gif' : 'jpg';
      const localPath = path.join(desktopDir, `${goodsNo}_detail.${ext}`);
      const ok = await downloadWithCurl(firstImg, localPath);
      console.log(`   → 다운로드: ${ok ? `✅ (${fs.statSync(localPath).size} bytes)` : '❌ 실패'}`);

      if (ok) {
        const fileBuffer = fs.readFileSync(localPath);
        const fileName = `${goodsNo}_detail.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(fileName, fileBuffer, { contentType: isGif ? 'image/gif' : 'image/jpeg', upsert: true });

        if (!uploadErr) {
          const detailUrl = `https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/${fileName}`;
          await supabase.from('products').update({ detail_description_image: detailUrl }).eq('goods_no', goodsNo);
          console.log(`   → ✅ DB 반영 완료`);
          console.log(`   → 🌐 ${detailUrl}`);
        } else {
          console.log(`   → ❌ 업로드 실패: ${uploadErr.message}`);
        }
      }
    } else {
      console.log(`   → ❌ 이미지 없음`);
    }
  }

  ws.close();
  console.log(`\n✅ 테스트 완료!\n`);
}

run();
