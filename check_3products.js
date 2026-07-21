const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU'
);

async function main() {
  const goods = ['A000000248829', 'A000000223414', 'A000000259232'];
  const { data } = await supabase.from('products').select('goods_no, name_ko, name_th, price_thb').in('goods_no', goods);
  data.forEach((p, i) => {
    console.log(`[${i+1}] ${p.goods_no}`);
    console.log(`     한국명: ${p.name_ko}`);
    console.log(`     태국명: ${p.name_th}`);
    console.log(`     가격: ${p.price_thb} THB`);
    console.log('');
  });
}
main();
