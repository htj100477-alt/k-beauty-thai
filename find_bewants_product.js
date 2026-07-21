const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

function fetchWithCurl(url) {
  return new Promise((resolve, reject) => {
    const cmd = `curl.exe -s -L "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"`;
    exec(cmd, { maxBuffer: 15 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

async function run() {
  // 1. Search in Supabase DB
  const { data: dbProds } = await supabase.from('products').select('*').ilike('name', '%비원츠%');
  console.log('DB Search for 비원츠:', dbProds ? dbProds.map(p => ({ goods_no: p.goods_no, name: p.name })) : []);

  // 2. Search on Olive Young
  const searchUrl = 'https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=%EB%B9%84%EC%9B%90%EC%B8%A0%20%ED%94%BC%ED%86%A0%EC%BD%9C%EB%9D%BC%EA%B2%8C';
  const html = await fetchWithCurl(searchUrl);
  
  const goodsMatches = html.match(/data-ref-goodsNo="([^"]+)"/g) || [];
  const goodsNos = Array.from(new Set(goodsMatches.map(m => m.replace('data-ref-goodsNo="', '').replace('"', ''))));
  console.log('Olive Young GoodsNos found:', goodsNos);

  for (const gNo of goodsNos.slice(0, 5)) {
    const detailUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${gNo}`;
    const dHtml = await fetchWithCurl(detailUrl);
    const titleMatch = dHtml.match(/<title>([^<]+)<\/title>/);
    console.log(`- ${gNo}: ${titleMatch ? titleMatch[1].replace('- 올리브영', '').trim() : ''}`);
  }
}

run();
