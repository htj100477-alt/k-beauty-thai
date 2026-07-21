const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

const desktopDir = path.join('C:', 'Users', 's8253', 'Desktop', 'oliveyoung-maskpack-images');
if (!fs.existsSync(desktopDir)) {
  fs.mkdirSync(desktopDir, { recursive: true });
}

const categoryCode = '100000100090001'; // 시트팩
const categoryId = 'f1020100-0000-0000-0000-000000000002'; // 시트팩 category ID
const categoryName = '시트팩';

function fetchWithCurl(url) {
  return new Promise((resolve, reject) => {
    const cmd = `curl.exe -s -L "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"`;
    exec(cmd, { maxBuffer: 15 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        return resolve(false);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      resolve(false);
    });
  });
}

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

async function run() {
  console.log(`====================================================`);
  console.log(` Crawling Olive Young Category: Sheet Masks (${categoryCode})`);
  console.log(`====================================================\n`);

  const productMap = new Map();

  for (let page = 1; page <= 6; page++) {
    const pageUrl = `https://www.oliveyoung.co.kr/store/display/getMCategoryList.do?dispCatNo=${categoryCode}&fltDispCatNo=&prdSort=SW&pageIdx=${page}&rowsPerPage=48`;
    try {
      const html = await fetchWithCurl(pageUrl);
      const regex = /goodsNo=([A-Z0-9]+)[\s\S]*?class="tx_brand">([^<]+)<[\s\S]*?class="tx_name">([^<]+)<[\s\S]*?class="tx_cur"[\s\S]*?<span class="tx_num">([^<]+)</g;

      let match;
      let countOnPage = 0;
      while ((match = regex.exec(html)) !== null) {
        const goodsNo = match[1];
        const brand = match[2].trim();
        const rawName = match[3].trim();
        const priceStr = match[4].replace(/,/g, '').trim();
        const priceKrw = parseInt(priceStr, 10);

        if (goodsNo && brand && rawName && !isNaN(priceKrw)) {
          if (!productMap.has(goodsNo)) {
            productMap.set(goodsNo, { goodsNo, brand, name: rawName, priceKrw });
            countOnPage++;
          }
        }
      }
      console.log(` Page ${page}: Found ${countOnPage} new unique Sheet Mask products.`);
      if (countOnPage === 0) break;
    } catch (e) {
      console.error(` Error crawling page ${page}:`, e.message);
    }
  }

  const productsList = Array.from(productMap.values());
  console.log(`\nTotal unique Sheet Mask products collected: ${productsList.length}\n`);

  let sqlContent = `-- SQL INSERT Script for Olive Young Sheet Masks (시트팩)\n`;
  sqlContent += `-- Total Products: ${productsList.length}\n\n`;

  const dbInsertPayloads = [];

  for (let i = 0; i < productsList.length; i++) {
    const p = productsList[i];
    const rawImgUrl = `https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/${p.goodsNo.substring(0, 8)}/${p.goodsNo}01ko.jpg`;
    const localImagePath = path.join(desktopDir, `${p.goodsNo}.jpg`);

    // 1. Download image to Desktop
    const ok = await downloadFile(rawImgUrl, localImagePath);

    let supabaseImageUrl = '';
    if (ok) {
      // 2. Upload image directly to Supabase Storage 'product-images' bucket
      const fileBuffer = fs.readFileSync(localImagePath);
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(`${p.goodsNo}.jpg`, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

      if (!uploadErr) {
        supabaseImageUrl = `https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/${p.goodsNo}.jpg`;
      }
    }

    if (!supabaseImageUrl) {
      supabaseImageUrl = rawImgUrl;
    }

    // 3. Price calculation in THB: margin 30%, exchange rate 38 KRW/THB, estimated weight 200g (0.2kg)
    const weightGrams = 200;
    const marginMult = 1.3;
    const exRate = 38;
    const ddpFeeKg = 200;
    const priceThb = Math.ceil((p.priceKrw / exRate) * marginMult + (weightGrams / 1000) * ddpFeeKg);

    // SQL statement
    const sqlStmt = `INSERT INTO products (goods_no, brand, name, price_krw, price_thb, thumbnail_url, detail_description_image, category_id, category_name, weight_grams, is_active) VALUES ('${escapeSql(p.goodsNo)}', '${escapeSql(p.brand)}', '${escapeSql(p.name)}', ${p.priceKrw}, ${priceThb}, '${escapeSql(supabaseImageUrl)}', null, '${categoryId}', '${categoryName}', ${weightGrams}, true) ON CONFLICT (goods_no) DO UPDATE SET price_krw = EXCLUDED.price_krw, price_thb = EXCLUDED.price_thb, thumbnail_url = EXCLUDED.thumbnail_url;`;
    sqlContent += sqlStmt + '\n';

    dbInsertPayloads.push({
      goods_no: p.goodsNo,
      brand: p.brand,
      name: p.name,
      price_krw: p.priceKrw,
      price_thb: priceThb,
      thumbnail_url: supabaseImageUrl,
      detail_description_image: null,
      category_id: categoryId,
      category_name: categoryName,
      weight_grams: weightGrams,
      is_active: true
    });

    if ((i + 1) % 20 === 0 || i + 1 === productsList.length) {
      console.log(` Processed ${i + 1} / ${productsList.length} Sheet Mask images & SQL lines...`);
    }
  }

  // Save SQL file to Desktop and Workspace
  const desktopSqlPath = path.join('C:', 'Users', 's8253', 'Desktop', 'insert_sheetmask_products.sql');
  const workspaceSqlPath = path.join(__dirname, 'insert_sheetmask_products.sql');
  fs.writeFileSync(desktopSqlPath, sqlContent, 'utf8');
  fs.writeFileSync(workspaceSqlPath, sqlContent, 'utf8');

  console.log(`\nSaved SQL file to: ${desktopSqlPath}`);

  // 4. Upsert directly into Supabase DB
  console.log(`\nInserting ${dbInsertPayloads.length} Sheet Mask products into Supabase DB...`);
  const { data: dbResult, error: dbErr } = await supabase.from('products').upsert(dbInsertPayloads, { onConflict: 'goods_no' });

  if (dbErr) {
    console.error('DB Upsert Error:', dbErr.message);
  } else {
    console.log(` Successfully registered ALL ${dbInsertPayloads.length} Sheet Mask products in Supabase DB!`);
  }
}

run();
