const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU'
);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// 테스트 3개
const TEST_GOODS = ['A000000248829', 'A000000223414', 'A000000259232'];

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

async function getDetailImageUrl(ws, goodsNo) {
  // 1. 페이지 이동
  ws.send(JSON.stringify({ id: 1, method: 'Page.navigate', params: { url: `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}` } }));
  await new Promise(r => setTimeout(r, 5000));

  // 2. 상품설명 더보기 클릭
  await cdpEval(ws, `(function(){const btn=document.querySelector('button[class*="btn-more"]');if(btn){btn.click();return 'ok';}return 'none';})()`, 10);
  await new Promise(r => setTimeout(r, 2000));

  // 3. data-src에서 /html/ 이미지 첫번째 추출 (ranking 제외, crop0 우선)
  const result = await cdpEval(ws, `
    JSON.stringify(
      Array.from(document.querySelectorAll('img'))
        .map(i => i.getAttribute('data-src') || '')
        .filter(s => s.includes('/html/') && !s.includes('ranking') && !s.startsWith('data:'))
        .find(s => s.includes('crop0')) ||
      Array.from(document.querySelectorAll('img'))
        .map(i => i.getAttribute('data-src') || '')
        .filter(s => s.includes('/html/') && !s.includes('ranking') && !s.startsWith('data:'))[0] ||
      null
    )
  `, 11);

  if (!result || result === 'null') return null;
  try {
    const url = JSON.parse(result);
    // ?created=... 쿼리스트링 제거
    return url ? url.split('?')[0] : null;
  } catch { return null; }
}

async function run() {
  console.log(`\n✅ 올리브영 원본 URL 직접 DB 저장 테스트 (Supabase 업로드 없음)\n`);

  const targets = await new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });

  const pageTarget = targets?.find(t => t.type === 'page') || targets?.[0];
  if (!pageTarget) { console.log('❌ Chrome CDP 없음'); return; }

  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 0, method: 'Page.enable' }));
  await new Promise(r => setTimeout(r, 300));

  for (const goodsNo of TEST_GOODS) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 ${goodsNo}`);

    const imgUrl = await getDetailImageUrl(ws, goodsNo);

    if (imgUrl) {
      console.log(`   → URL: ${imgUrl.substring(0, 90)}...`);
      const { error } = await supabase.from('products')
        .update({ detail_description_image: imgUrl })
        .eq('goods_no', goodsNo);
      console.log(`   → DB 저장: ${error ? '❌ ' + error.message : '✅ 완료'}`);
    } else {
      console.log(`   → ❌ 이미지 URL 없음`);
    }
  }

  ws.close();
  console.log(`\n✅ 완료! 이제 상세페이지에서 올리브영 원본 이미지가 바로 표시됩니다.\n`);
}

run();
