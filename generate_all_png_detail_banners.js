const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

const desktopDir = path.join('C:', 'Users', 's8253', 'Desktop', 'oliveyoung-maskpack-images');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function runCmd(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, () => resolve());
  });
}

function buildHtml(p) {
  const brand = (p.brand || 'K-BEAUTY').toUpperCase();
  const name = p.name.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const category = p.category_name || '마스크팩';
  const imgUrl = p.thumbnail_url;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; width: 800px; }
    .banner { width: 800px; padding: 32px; box-sizing: border-box; background: linear-gradient(140deg, #ffffff 0%, #f8fafc 60%, #f0fdf4 100%); }
    .header { background: linear-gradient(90deg, #7c3aed, #4f46e5); color: #fff; padding: 16px; border-radius: 14px; text-align: center; font-weight: 900; font-size: 19px; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2); }
    .card { margin-top: 24px; background: #ffffff; border-radius: 20px; border: 1.5px solid #e2e8f0; padding: 28px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05); }
    .brand-row { display: flex; align-items: center; gap: 10px; }
    .brand { background: linear-gradient(90deg, #0d9488, #059669); color: white; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 15px; }
    .cat { color: #0d9488; font-weight: 700; font-size: 15px; }
    .title { margin-top: 16px; font-size: 22px; font-weight: 800; color: #1e293b; line-height: 1.4; height: 60px; overflow: hidden; }
    .divider { height: 1px; background: #f1f5f9; margin: 20px 0; }
    .img-box { width: 100%; height: 380px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .img-box img { max-width: 90%; max-height: 90%; object-fit: contain; }
    .grid { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .feat { background: #f8fafc; padding: 12px 16px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 14px; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 8px; }
    .check { color: #059669; font-size: 18px; font-weight: bold; }
    .usage { margin-top: 20px; background: #f0fdf4; border: 1.5px solid #bbf7d0; padding: 18px; border-radius: 14px; color: #047857; }
    .usage-title { font-size: 16px; font-weight: 800; color: #065f46; margin-bottom: 6px; }
    .usage-step { font-size: 14px; font-weight: 600; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="banner">
    <div class="header">✨ K-BEAUTY EXCLUSIVE • ของแท้ 100% OLIVE YOUNG KOREA ✨</div>
    <div class="card">
      <div class="brand-row">
        <span class="brand">${brand}</span>
        <span class="cat">${category} • ส่งตรงจากเกาหลี</span>
      </div>
      <div class="title">${name}</div>
      <div class="divider"></div>
      <div class="img-box">
        <img src="${imgUrl}" />
      </div>
      <div class="grid">
        <div class="feat"><span class="check">✓</span> สารสกัดพรีเมียมจากเกาหลี 100%</div>
        <div class="feat"><span class="check">✓</span> ฟื้นบำรุงล้ำลึก ล็อคความชุ่มชื้น</div>
        <div class="feat"><span class="check">✓</span> ผ่านการทดสอบระคายเคืองผิว</div>
        <div class="feat"><span class="check">✓</span> DDP 면세 항공 직송 สินค้าแท้</div>
      </div>
      <div class="usage">
        <div class="usage-title">วิธีใช้ (How to Use):</div>
        <div class="usage-step">1. ทำความสะอาดใบหน้าและเช็ดให้แห้ง</div>
        <div class="usage-step">2. แปะหรือทาผลิตภัณฑ์ทิ้งไว้ตามเวลาที่กำหนด แล้วซับเบาๆ ให้ซึมซาบ</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function processProduct(p) {
  if (p.goods_no === 'A000000229640' || p.goods_no === 'A000000252256' || p.goods_no === 'A000000128566') return true;

  const tempHtmlPath = path.join(__dirname, `temp_${p.goods_no}.html`);
  const tempPngPath = path.join(__dirname, `temp_${p.goods_no}.png`);

  try {
    const htmlContent = buildHtml(p);
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

    const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
    const cmd = `"${chromePath}" --headless --screenshot="${tempPngPath}" --window-size=820,1050 --hide-scrollbars "${fileUrl}"`;

    await runCmd(cmd);

    if (fs.existsSync(tempPngPath)) {
      const targetFileName = `${p.goods_no}_detail.png`;
      const desktopPath = path.join(desktopDir, targetFileName);
      fs.copyFileSync(tempPngPath, desktopPath);

      const pngBuffer = fs.readFileSync(tempPngPath);
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(targetFileName, pngBuffer, {
        contentType: 'image/png',
        upsert: true
      });

      if (!uploadErr) {
        const publicUrl = `https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/${targetFileName}?v=${Date.now()}`;
        await supabase.from('products').update({ detail_description_image: publicUrl }).eq('id', p.id);
      }
    }
  } catch (e) {
    console.error(`Error processing ${p.goods_no}:`, e.message);
  } finally {
    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
    if (fs.existsSync(tempPngPath)) fs.unlinkSync(tempPngPath);
  }
}

async function run() {
  const { data: prods } = await supabase.from('products').select('*').eq('is_active', true);
  console.log(`====================================================`);
  console.log(` Parallel Generating 1-on-1 Real PNG Banners for ${prods.length} Products`);
  console.log(`====================================================\n`);

  const batchSize = 25;
  for (let i = 0; i < prods.length; i += batchSize) {
    const batch = prods.slice(i, i + batchSize);
    await Promise.all(batch.map(p => processProduct(p)));
    console.log(` Processed ${Math.min(i + batchSize, prods.length)} / ${prods.length} products...`);
  }

  console.log('\n====================================================');
  console.log(` Finished Parallel Generation & DB Update!`);
  console.log('====================================================');
}

run();
