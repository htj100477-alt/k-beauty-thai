const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanStorageAndDB() {
  console.log('🧹 Supabase 저장소 이미지 및 DB 경로 초기화 시작...\n');

  // 1. Storage 버킷 내 파일 목록 가져오기
  const { data: files, error: listError } = await supabase.storage
    .from('product-images')
    .list('', { limit: 100 });

  if (listError) {
    console.error('❌ 버킷 파일 목록 조회 실패:', listError.message);
    return;
  }

  // 2. 파일이 있다면 삭제
  if (files && files.length > 0) {
    const fileNames = files.map(f => f.name);
    console.log(`📁 삭제 대상 이미지 파일 (${fileNames.length}개):`, fileNames);

    const { data: deleted, error: deleteError } = await supabase.storage
      .from('product-images')
      .remove(fileNames);

    if (deleteError) {
      console.error('❌ 이미지 파일 삭제 실패:', deleteError.message);
    } else {
      console.log('✅ Storage 이미지 파일 완전 삭제 완료!');
    }
  } else {
    console.log('ℹ️ Storage 버킷이 이미 비어 있습니다.');
  }

  // 3. DB products 테이블의 detail_description_image 컬럼 null로 초기화
  const { data, error: dbError } = await supabase
    .from('products')
    .update({ detail_description_image: null })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 상품 대상

  if (dbError) {
    console.error('❌ DB 상세이미지 경로 초기화 실패:', dbError.message);
  } else {
    console.log('✅ DB products 테이블 상세이미지 링크 초기화 완료!');
  }

  console.log('\n🧹 모든 초기화 작업 완료!');
}

cleanStorageAndDB();
