const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

function fetchWithCurl(url) {
  return new Promise((resolve) => {
    const cmd = `curl.exe -s -L "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"`;
    exec(cmd, { maxBuffer: 15 * 1024 * 1024 }, (err, stdout) => {
      resolve(stdout || '');
    });
  });
}

async function run() {
  const { data: prods } = await supabase.from('products').select('*').limit(10);
  for (const p of prods) {
    const detailUrl = `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${p.goods_no}`;
    const html = await fetchWithCurl(detailUrl);
    const matches = html.match(/https:\/\/image\.oliveyoung\.co\.kr\/cfimages\/cf-goods\/uploads\/images\/[^\s"'>]*\.(jpg|png)/gi) || [];
    console.log(`GoodsNo: ${p.goods_no} | Name: ${p.name.substring(0, 25)}...`);
    console.log(` -> Found ${matches.length} image matches:`, matches.slice(0, 3));
  }
}

run();
