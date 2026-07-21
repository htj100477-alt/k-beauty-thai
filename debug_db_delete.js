const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU'
);

async function main() {
  console.log('🔍 products 테이블 삭제 테스트 및 오류 확인...');

  // 1. 혹시 order_items나 다른 테이블에 연결된 데이터가 있는지 먼저 삭제 시도
  const { error: orderItemsErr } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (orderItemsErr) {
    console.log('⚠️ order_items 삭제 오류 (없으면 패스):', orderItemsErr.message);
  } else {
    console.log('✅ order_items 관련 항목 삭제 완료');
  }

  // 2. products 테이블의 실제 총 개수 확인
  const { count, error: countErr } = await supabase.from('products').select('*', { count: 'exact', head: True = false });
  console.log(`현재 DB 내 상품 수: ${count}개`);

  // 3. 삭제 쿼리 실행하고 에러 받아오기
  const { data, error } = await supabase
    .from('products')
    .delete()
    .gte('price_krw', 0); // 가격이 0 이상인 모든 상품 강제 삭제 조건

  if (error) {
    console.error('❌ DB 삭제 실패 원인:', error.message);
    console.error('오류 상세:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ DB products 테이블 강제 삭제 쿼리 성공!');
    const { count: countAfter } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`삭제 후 DB 내 상품 수: ${countAfter}개`);
  }
}

main();
