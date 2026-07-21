const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanEverything() {
  console.log('🧹 [1/3] Supabase Storage 버킷 모든 이미지 삭제 시작...');
  
  let hasMore = true;
  let deletedCount = 0;
  
  while (hasMore) {
    const { data: files, error: listError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } });
      
    if (listError) {
      console.error('❌ 파일 목록 조회 실패:', listError.message);
      break;
    }
    
    // 플레이스홀더를 제외한 진짜 파일들만 필터링
    const realFiles = files.filter(f => f.name !== '.emptyFolderPlaceholder');
    
    if (realFiles.length === 0) {
      hasMore = false;
      break;
    }
    
    const fileNames = realFiles.map(f => f.name);
    const { error: removeError } = await supabase.storage
      .from('product-images')
      .remove(fileNames);
      
    if (removeError) {
      console.error('❌ 파일 삭제 실패:', removeError.message);
      break;
    }
    
    deletedCount += fileNames.length;
    console.log(`  -> ${fileNames.length}개 파일 삭제 완료 (누적: ${deletedCount}개)`);
    
    // 계속 지울 파일이 있는지 확인 위해 대기
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`✅ Storage 이미지 총 ${deletedCount}개 삭제 완료!`);

  console.log('\n🧹 [2/3] DB products 테이블 모든 데이터(Row) 삭제 시작...');
  // products 테이블 전체 행 삭제 (TRUNCATE 효과)
  const { error: deleteDbError } = await supabase
    .from('products')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // 전체 삭제를 위한 무조건 참 조건

  if (deleteDbError) {
    console.error('❌ DB 상품 목록 삭제 실패:', deleteDbError.message);
  } else {
    console.log('✅ DB products 테이블 모든 상품 삭제 완료! (0건)');
  }
  
  console.log('\n🧹 모든 초기화 작업이 완벽하게 완료되었습니다! 수파베이스 페이지를 새로고침해보세요.');
}

cleanEverything();
