import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const activeCategoryId = resolvedSearchParams.category || 'all';

  const supabase = await createClient();

  // 1. Fetch settings
  let exchangeRate = 38.0;
  let marginPercentage = 20;
  let ddpFee = 250;
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
  let categories: any[] = [];
  try {
    const { data: catData } = await supabase.from('categories').select('*');
    if (catData) categories = catData;
  } catch (err) {
    console.warn('Failed to load categories:', err);
  }

  // 3. Fetch products
  let products: any[] = [];
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

  // Find currently active category details
  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const activeParentId = activeCategory ? (activeCategory.parent_id || activeCategory.id) : null;

  // Calculate some simple counts for stats
  const productsCount = products.length;
  const categoriesCount = categories.length;

  return (
    <main className="py-5 px-4 w-full flex flex-col gap-5 bg-[#f4f6fa]">
      
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
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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

      {/* 4. Product Grid (2-Column Premium Mobile Layout) */}
      <section className="grid grid-cols-2 gap-3">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#0d9488]/30 transition-all duration-300 group">
              <div className="relative w-full aspect-square bg-[#f8fafc] rounded-xl overflow-hidden mb-2.5 border border-[#f1f5f9]">
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 text-[8px] font-black rounded-md bg-amber-500 text-white shadow-sm uppercase">
                  DDP 면세
                </span>
              </div>

              <div className="flex-grow flex flex-col justify-between gap-2">
                <div>
                  <span className="text-[9px] font-extrabold text-[#0d9488] uppercase tracking-wider block">
                    {product.brand}
                  </span>
                  <h3 className="text-[11px] font-bold text-slate-800 line-clamp-2 min-h-[30px] leading-tight mt-0.5">
                    {product.name}
                  </h3>
                </div>

                <div className="pt-2 border-t border-[#f1f5f9] flex flex-col">
                  <span className="text-[9px] text-slate-400 line-through">
                    {product.price_krw.toLocaleString()}원
                  </span>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-sm font-extrabold text-slate-800">
                      {parseFloat(product.price_thb).toLocaleString()} <span className="text-[10px] text-[#0d9488] font-bold">THB</span>
                    </span>
                    
                    <Link
                      href={`/products/${product.goods_no}`}
                      className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488] transition-all duration-300"
                    >
                      Buy
                    </Link>
                  </div>
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
