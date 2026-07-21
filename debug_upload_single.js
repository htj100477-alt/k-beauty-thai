const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

const desktopDir = path.join('C:', 'Users', 's8253', 'Desktop', 'oliveyoung-maskpack-images');

async function run() {
  const goodsNo = 'A000000223414';
  const rawImgUrl = `https://image.oliveyoung.co.kr/cfimages/cf-goods/uploads/images/thumbnails/10/0000/A0000002/A00000022341401ko.jpg`;
  const localPath = path.join(desktopDir, `${goodsNo}.jpg`);

  const cmd = `curl.exe -s -L "${rawImgUrl}" -o "${localPath}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"`;

  exec(cmd, async (err) => {
    console.log('Downloaded file exists:', fs.existsSync(localPath));
    console.log('Downloaded file size:', fs.existsSync(localPath) ? fs.statSync(localPath).size : 0);

    const fileBuffer = fs.readFileSync(localPath);

    const { data, error } = await supabase.storage.from('product-images').upload(`${goodsNo}.jpg`, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

    console.log('Upload Result Data:', data);
    console.log('Upload Error:', error);
  });
}

run();
