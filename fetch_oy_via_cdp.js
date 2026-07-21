const http = require('http');
const fs = require('fs');

async function getDevToolsTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const targets = await getDevToolsTargets();
    const pageTarget = targets.find(t => t.type === 'page');

    if (!pageTarget) {
      console.log('No page target found');
      return;
    }

    const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);

    ws.onopen = () => {
      console.log('Navigating page via CDP...');
      ws.send(JSON.stringify({
        id: 1,
        method: 'Page.navigate',
        params: {
          url: 'https://www.oliveyoung.co.kr/store/display/getMCategoryList.do?dispCatNo=100000100090001&fltDispCatNo=&prdSort=SW&pageIdx=1&rowsPerPage=48'
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1) {
        console.log('Navigation started. Waiting 6 seconds for page render...');
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              expression: 'document.documentElement.outerHTML'
            }
          }));
        }, 6000);
      } else if (msg.id === 2 && msg.result && msg.result.result) {
        const html = msg.result.result.value || '';
        console.log('\n====================================');
        console.log('Full Rendered DOM Length:', html.length);
        console.log('Contains tx_name:', html.includes('tx_name'));
        console.log('Contains goodsNo:', html.includes('goodsNo='));

        fs.writeFileSync('oy_cdp_dom.html', html, 'utf8');

        const matches = html.match(/goodsNo=([A-Z0-9]+)[\s\S]*?class="tx_brand">([^<]+)<[\s\S]*?class="tx_name">([^<]+)<[\s\S]*?class="tx_cur"[\s\S]*?<span class="tx_num">([^<]+)</g) || [];
        console.log('Found product matches count:', matches.length);
        console.log('====================================\n');

        ws.close();
      }
    };
  } catch (e) {
    console.error(e.message);
  }
}

run();
