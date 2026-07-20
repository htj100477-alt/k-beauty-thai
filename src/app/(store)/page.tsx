import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import SafeImage from '@/components/SafeImage';

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const activeCategoryId = resolvedSearchParams.category || 'all';

  const isPlaceholderUrl = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') || 
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');

  let exchangeRate = 38.0;
  let marginPercentage = 20;
  let ddpFee = 250;
  let categories: any[] = [];
  let products: any[] = [];

  if (isPlaceholderUrl) {
    // Immediate fallback for local development without DB configured to prevent 20s network timeouts
    categories = [
      { id: 'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d', name_ko: '스킨케어', name_en: 'Skincare', parent_id: null },
      { id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', name_ko: '메이크업', name_en: 'Makeup', parent_id: null },
      { id: 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f', name_ko: '마스크팩', name_en: 'Mask Pack', parent_id: null },
      { id: 'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a', name_ko: '바디케어', name_en: 'Body Care', parent_id: null },
      { id: 'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b', name_ko: '헤어케어', name_en: 'Hair Care', parent_id: null }
    ];

    const allProducts = [
      {
        id: '1',
        goods_no: 'A000000247086',
        brand: '다슈 (DASHU)',
        name: '[변우석 굿즈/탈모완화] 다슈 데일리 밀크씨슬 블루바이옴 스칼프 샴푸 500ml',
        price_krw: 16900,
        price_thb: 658.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000247086.jpg',
        category_id: 'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b',
        category_name: '헤어케어'
      },
      {
        id: '2',
        goods_no: 'A000000202777',
        brand: '헤라 (HERA)',
        name: '[프리미엄 1위] 헤라 블랙 쿠션 파운데이션 기획 (15g + 15g 리필포함) 9 Colors',
        price_krw: 59740,
        price_thb: 1916.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000202777.jpg',
        category_id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
        category_name: '메이크업'
      },
      {
        id: '3',
        goods_no: 'A000000223414',
        brand: '메디힐 (MEDIHEAL)',
        name: '[15년 연속 1위] 메디힐 에센셜 마스크팩 10+1매 기획 세트 (티트리/콜라겐/마데카소사이드)',
        price_krw: 10000,
        price_thb: 391.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000223414.jpg',
        category_id: 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f',
        category_name: '마스크팩'
      },
      {
        id: '4',
        goods_no: 'A000000259560',
        brand: '맥 (MAC)',
        name: '[NEW] MAC 러스터글래스 쉬어-샤인 립스틱 기획 단품 (촉촉한 립스틱)',
        price_krw: 37050,
        price_thb: 1183.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000259560.jpg',
        category_id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
        category_name: '메이크업'
      },
      {
        id: '5',
        goods_no: 'A000000240910',
        brand: '오아드 (Oiad)',
        name: '[단독기획] 오아드 립티크 13종 단품/기획 (초밀착 립틴트)',
        price_krw: 17500,
        price_thb: 568.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000240910.jpg',
        category_id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
        category_name: '메이크업'
      },
      {
        id: '6',
        goods_no: 'A000000259209',
        brand: '바세린 (Vaseline)',
        name: '[NEW] 바세린 글루타히야 세럼 바디로션 300ml 3종 택1 (듀이/플로리스/프로에이지)',
        price_krw: 10200,
        price_thb: 410.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000259209.jpg',
        category_id: 'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a',
        category_name: '바디케어'
      }
    ];

    products = activeCategoryId === 'all'
      ? allProducts
      : allProducts.filter(p => p.category_id === activeCategoryId);
  } else {
    const supabase = await createClient();

    // 1. Fetch settings
    try {
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (settingsData) {
        const rate = settingsData.find(s => s.key === 'exchange_rate_krw_thb');
        const marg = settingsData.find(s => s.key === 'margin_percentage');
        const ddp = settingsData.find(s => s.key === 'ddp_shipping_fee_per_kg');
        if (rate) exchangeRate = parseFloat(rate.value);
        if (marg) marginPercentage = parseInt(marg.value);
        if (ddp) ddpFee = parseInt(ddp.value);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }

    // 2. Fetch categories
    try {
      const { data: catData } = await supabase.from('categories').select('*');
      if (catData) categories = catData;
    } catch (err) {
      console.warn('Failed to load categories:', err);
    }

    // 3. Fetch products
    try {
      let query = supabase.from('products').select('*').eq('is_active', true);
      if (activeCategoryId !== 'all') {
        const subCategoryIds = categories.filter(c => c.parent_id === activeCategoryId).map(c => c.id);
        if (subCategoryIds.length > 0) {
          query = query.in('category_id', [activeCategoryId, ...subCategoryIds]);
        } else {
          query = query.eq('category_id', activeCategoryId);
        }
      }
      const { data: productsData } = await query.order('created_at', { ascending: false });
      if (productsData) products = productsData;
    } catch (err) {
      console.warn('Failed to load products:', err);
    }
  }

  // Find currently active category details
  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const activeParentId = activeCategory ? (activeCategory.parent_id || activeCategory.id) : null;

  // Calculate some simple counts for stats
  const productsCount = products.length;
  const categoriesCount = categories.length;

  return (
    <main className="w-full flex flex-col bg-[#f4f6fa] px-5 py-6 gap-6">
      
      {/* 1. Gradient Hero Banner matching 3rd screenshot */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#ec4899] p-6 text-white shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wide mb-3 backdrop-blur-sm">
          ✨ 태국 1위 K-뷰티 실시간 직구/소싱 대행
        </div>
        
        <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug mb-1.5">
          Buy K-Beauty Directly<br />from Seoul to Thailand
        </h2>
        
        <p className="text-[11px] text-white/90 leading-relaxed font-light mb-4">
          본사 직배송을 통해 가장 안전하고 정품이 보장된 올리브영 화장품을 직수입하세요. DDP 면세 통관 완료 및 한타이쉬핑 5~7일 신속 항공배송 지원!
        </p>

        {/* Dynamic Metric overview in Banner */}
        <div className="flex gap-6 border-t border-white/20 pt-3">
          <div className="flex flex-col">
            <span className="text-[20px] font-black">{productsCount || 6}</span>
            <span className="text-[9px] text-white/70 uppercase">등록 상품</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[20px] font-black">{categoriesCount || 5}</span>
            <span className="text-[9px] text-white/70 uppercase">활성 카테고리</span>
          </div>
        </div>
      </section>

      {/* 2. Order Tracking Box matching 3rd screenshot */}
      <section className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          📦 내 주문 진행 상태 (Order Status)
        </h3>
        
        <div className="grid grid-cols-5 gap-1 text-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mb-1 border border-slate-200">0</div>
            <span className="text-[9px] text-slate-500 font-semibold">미결제</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold mb-1 border border-emerald-100">0</div>
            <span className="text-[9px] text-emerald-600 font-bold">입금완료</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center text-xs font-bold mb-1 border border-sky-100">0</div>
            <span className="text-[9px] text-sky-600 font-bold">배송중</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-[#7c3aed] flex items-center justify-center text-xs font-bold mb-1 border border-purple-100">0</div>
            <span className="text-[9px] text-[#7c3aed] font-bold">배송완료</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold mb-1 border border-rose-100">0</div>
            <span className="text-[9px] text-rose-600 font-bold">반품</span>
          </div>
        </div>
      </section>

      {/* Pricing Settings Banner */}
      <section className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-400 text-[10px] block">실시간 기준 환율</span>
          <span className="font-bold text-slate-700">1 THB = {exchangeRate} KRW</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">구매대행 마진율</span>
          <span className="font-bold text-[#0d9488]">+{marginPercentage}% Included</span>
        </div>
        <div className="border-t border-[#f1f5f9] pt-2">
          <span className="text-slate-400 text-[10px] block">통관 조건</span>
          <span className="font-bold text-amber-600">DDP 면세 완료</span>
        </div>
        <div className="border-t border-[#f1f5f9] pt-2">
          <span className="text-slate-400 text-[10px] block">DDP 항공 배송요율</span>
          <span className="font-bold text-slate-700">{ddpFee} THB/kg</span>
        </div>
      </section>

      {/* 3. Categories Hierarchical Display */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide px-1">K-Beauty 카테고리</h3>
        
        {/* Main Categories Row */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-5 -mx-5 scrollbar-none">
          <Link
            href="/"
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              activeCategoryId === 'all'
                ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-sm'
                : 'bg-white border-[#e2e8f0] text-slate-500 hover:text-slate-800'
            }`}
          >
            전체 (All)
          </Link>
          {categories.filter(c => !c.parent_id).map((cat) => {
            const isActiveParent = activeParentId === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/?category=${cat.id}`}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  isActiveParent
                    ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-sm'
                    : 'bg-white border-[#e2e8f0] text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat.name_ko}
              </Link>
            );
          })}
        </div>

        {/* Subcategories Row */}
        {activeParentId && categories.some(c => c.parent_id === activeParentId) && (
          <div className="flex gap-1.5 overflow-x-auto py-1 px-1 bg-slate-100 rounded-xl border border-[#e2e8f0]/60 scrollbar-none">
            <Link
              href={`/?category=${activeParentId}`}
              className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                activeCategoryId === activeParentId
                  ? 'bg-white text-[#0d9488] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              전체보기
            </Link>
            {categories.filter(c => c.parent_id === activeParentId).map((sub) => (
              <Link
                key={sub.id}
                href={`/?category=${sub.id}`}
                className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  activeCategoryId === sub.id
                    ? 'bg-white text-[#0d9488] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {sub.name_ko}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. Product Grid (2-Column Premium Mobile Layout matching Phone Switch Hub style) */}
      <section className="grid grid-cols-2 gap-3">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#0d9488]/30 transition-all duration-300 group">
              {/* Full-bleed image at the top of the card */}
              <div className="relative w-full aspect-square bg-[#f8fafc] overflow-hidden z-0">
                <SafeImage
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-black rounded bg-amber-500 text-white shadow-sm uppercase z-10">
                  DDP 면세
                </span>
              </div>

              {/* Padded details block below the image */}
              <div className="flex-grow flex flex-col justify-between p-3 gap-3">
                <div>
                  <span className="text-[9px] font-extrabold text-[#0d9488] uppercase tracking-wider block">
                    {product.brand}
                  </span>
                  <h3 className="text-[11px] font-bold text-slate-800 line-clamp-2 h-8 leading-tight mt-0.5 overflow-hidden">
                    {product.name}
                  </h3>
                </div>

                <div className="border-t border-[#f1f5f9] flex flex-col" style={{ paddingTop: '8px', gap: '8px' }}>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 line-through leading-none mb-0.5">
                      {product.price_krw.toLocaleString()}원
                    </span>
                    <span className="text-sm font-black text-slate-800 leading-none">
                      {parseFloat(product.price_thb).toLocaleString()} <span className="text-[10px] text-[#0d9488] font-bold">THB</span>
                    </span>
                  </div>
                  
                  {/* Full-width primary ordering button */}
                  <Link
                    href={`/products/${product.goods_no}`}
                    className="w-full py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-lg text-[10px] font-extrabold text-center transition-all duration-300 block shadow-sm"
                  >
                    구매하기
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-[#e2e8f0]">
            등록된 상품이 없습니다. 관리자 대시보드에서 동기화 하거나 상품을 추가해 주세요.
          </div>
        )}
      </section>

      {/* Footer Info */}
      <footer className="mt-4 border-t border-[#e2e8f0] pt-4 text-center text-[9px] text-slate-400 flex flex-col gap-0.5 pb-6">
        <p>© 2026 OLIVE YOUNG THAI Gateway. Operated under legal Sourcing Agent framework.</p>
        <p>All prices calculated automatically with +{marginPercentage}% sourcing margin & DDP air freight rates.</p>
      </footer>
    </main>
  );
}
