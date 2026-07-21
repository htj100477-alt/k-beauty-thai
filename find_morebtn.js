const http = require('http');

async function main() {
  const targets = await new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });

  const t = targets?.find(x => x.type === 'page') || targets?.[0];
  if (!t) { console.log('No target'); return; }
  console.log('Current page:', t.url);

  const ws = new globalThis.WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  const result = await new Promise((resolve) => {
    const handler = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === 200) {
        ws.removeEventListener('message', handler);
        resolve(m.result?.result?.value);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id: 200,
      method: 'Runtime.evaluate',
      params: {
        expression: `JSON.stringify(
          Array.from(document.querySelectorAll('button, a, span, div'))
            .filter(el => el.textContent.trim().includes('더보기'))
            .map(el => ({tag: el.tagName, cls: el.className, txt: el.textContent.trim().substring(0, 50)}))
        )`
      }
    }));
  });

  console.log('\n더보기 버튼 목록:');
  try {
    JSON.parse(result).forEach((el, i) => console.log(`[${i+1}] <${el.tag}> class="${el.cls}" text="${el.txt}"`));
  } catch(e) { console.log(result); }

  ws.close();
}

main();
