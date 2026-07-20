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
      query = query.eq('category_id', activeCategoryId);
    }
    const { data: productsData } = await query.order('created_at', { ascending: false });
    if (productsData) products = productsData;
  } catch (err) {
    console.warn('Failed to load products:', err);
  }

  return (
    <main className="py-6 px-4 w-full flex flex-col gap-6">
      {/* Premium Glassmorphic Hero Banner (Mobile Scaled) */}
      <header className="glass-panel p-6 relative overflow-hidden flex flex-col gap-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Direct Sourcing from Seoul
          </div>
          
          <h1 className="text-2xl font-black tracking-tight leading-none mb-2">
            OLIVE <span className="text-gradient">YOUNG</span> THAI
          </h1>
          
          <p className="text-xs text-slate-400 font-light leading-relaxed">
            สกินแคร์ยอดนิยมส่งตรงจากเกาหลี ช้อปของแท้จาก올리브영 ได้ง่ายๆ พร้อมเคลียร์ภาษีนำเข้าเรียบร้อย
          </p>
        </div>

        {/* Settings Panel Mockup */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-900/60 pt-4 text-[11px]">
          <div>
            <span className="text-slate-500 block">환율 (THB ➔ KRW)</span>
            <span className="font-bold text-slate-300">1 THB = {exchangeRate} KRW</span>
          </div>
          <div>
            <span className="text-slate-500 block">수수료 (Margin)</span>
            <span className="font-bold text-emerald-400">+{marginPercentage}% Included</span>
          </div>
          <div>
            <span className="text-slate-500 block">통관 (Customs)</span>
            <span className="font-bold text-amber-400">DDP 면세 완료</span>
          </div>
          <div>
            <span className="text-slate-500 block">배송비 (DDP Rate)</span>
            <span className="font-bold text-slate-300">{ddpFee} THB/kg</span>
          </div>
        </div>
      </header>

      {/* Categories Horizontal Scroll */}
      <section className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline px-1">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">K-Beauty 랭킹</h2>
          <span className="text-[10px] text-slate-500">실시간 순위 반영</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href="/"
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeCategoryId === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All (전체)
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.id}`}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategoryId === cat.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.name_ko}
            </Link>
          ))}
        </div>
      </section>

      {/* Product Grid (2-Column Mobile Layout) */}
      <section className="grid grid-cols-2 gap-3">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="glass-panel p-3 flex flex-col justify-between group">
              <div className="relative w-full aspect-square bg-[#0f0e15] rounded-xl overflow-hidden mb-3 border border-slate-900">
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded-md bg-amber-500 text-slate-950 shadow-md">
                  DDP 면세
                </span>
              </div>

              <div className="flex-grow flex flex-col justify-between gap-1.5">
                <div>
                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block">
                    {product.brand}
                  </span>
                  <h3 className="text-xs font-medium text-slate-100 line-clamp-2 min-h-[32px] leading-tight">
                    {product.name}
                  </h3>
                </div>

                <div className="pt-2.5 border-t border-slate-900 flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 line-through">
                    {product.price_krw.toLocaleString()}원
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-200">
                      {parseFloat(product.price_thb).toLocaleString()} <span className="text-[10px] text-emerald-400">THB</span>
                    </span>
                    
                    <Link
                      href={`/products/${product.goods_no}`}
                      className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-slate-200 border border-slate-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all duration-300"
                    >
                      Buy
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
            등록된 상품이 없습니다. 관리자 대시보드에서 동기화 하거나 상품을 추가해 주세요.
          </div>
        )}
      </section>

      {/* Footer info */}
      <footer className="mt-8 border-t border-slate-900 pt-6 text-center text-[10px] text-slate-600 flex flex-col gap-1">
        <p>© 2026 OLIVE YOUNG THAI Gateway. Operated under legal Sourcing Agent framework.</p>
        <p>All prices calculated automatically with +{marginPercentage}% sourcing margin & DDP air freight rates.</p>
      </footer>
    </main>
  );
}
