const http = require('http');
const { exec } = require('child_process');

// 현재 Chrome에 열려있는 A000000248829 페이지에서
// 상품설명 탭의 텍스트 내용을 추출해보자

async function main() {
  const targets = await new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });

  const t = targets?.find(x => x.type === 'page') || targets?.[0];
  const ws = new globalThis.WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  // 1. 페이지 이동
  ws.send(JSON.stringify({ id: 1, method: 'Page.navigate', params: { url: 'https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000248829' } }));
  await new Promise(r => setTimeout(r, 5000));

  // 2. 더보기 클릭
  await new Promise((resolve) => {
    const handler = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === 2) { ws.removeEventListener('message', handler); resolve(); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: {
        expression: `(function(){
          const btn = document.querySelector('button[class*="btn-more"]');
          if(btn) { btn.click(); return 'clicked'; }
          return 'not found';
        })()`
      }
    }));
  });
  await new Promise(r => setTimeout(r, 2000));

  // 3. 상품설명 탭 텍스트 + 이미지 구조 추출
  const result = await new Promise((resolve) => {
    const handler = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === 3) { ws.removeEventListener('message', handler); resolve(m.result?.result?.value); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id: 3,
      method: 'Runtime.evaluate',
      params: {
        expression: `JSON.stringify({
          // 상품설명 탭 전체 텍스트
          descText: (document.querySelector('.tab-panels') || document.querySelector('[class*="tab-panel"]') || document.querySelector('[class*="detail"]'))?.innerText?.substring(0, 2000),
          // 상품 기본 정보
          brandName: document.querySelector('[class*="brand"]')?.textContent?.trim(),
          productName: document.querySelector('h1, [class*="goods-name"], [class*="product-name"]')?.textContent?.trim()?.substring(0, 100),
          // 상세 설명 div
          detailHtml: document.querySelector('[class*="GoodsDescContainer"], [class*="goods-desc"], .tab-panels')?.innerHTML?.substring(0, 500)
        })`
      }
    }));
  });

  console.log('추출 결과:');
  try {
    const data = JSON.parse(result);
    console.log('브랜드:', data.brandName);
    console.log('상품명:', data.productName);
    console.log('\n상세설명 텍스트 (첫 500자):');
    console.log(data.descText?.substring(0, 500));
    console.log('\nHTML 구조:');
    console.log(data.detailHtml);
  } catch(e) { console.log(result); }

  ws.close();
}

main();
