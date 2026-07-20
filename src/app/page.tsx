import Link from 'next/link';
import Image from 'next/image';
import { MOCK_PRODUCTS } from '@/utils/mockProducts';

export default function Home() {
  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Premium Glassmorphic Hero Banner */}
      <header className="glass-panel p-8 md:p-12 mb-12 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Direct Sourcing from Seoul, Korea
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight leading-tight">
            OLIVE <span className="text-gradient">YOUNG</span> THAI
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-8 font-light leading-relaxed">
            สั่งซื้อส킨케어ยอดนิยมส่งตรงจากเกาหลี ช้อปของแท้จาก올리브영 ได้ง่ายๆ 
            พร้อมบริการ통관대행(DDP) ส่งตรงถึงหน้าบ้าน ไม่มีภาษีบ하트 추가 요금 없음.
          </p>
        </div>

        {/* Real-time Settings Panel Mockup */}
        <div className="z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 border-t border-slate-800 pt-6">
          <div>
            <span className="text-xs text-slate-400 block uppercase tracking-wider mb-1">Exchange Rate (환율)</span>
            <span className="text-lg font-semibold text-slate-200">1 THB = 38.0 KRW</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block uppercase tracking-wider mb-1">Service Fee (마진율)</span>
            <span className="text-lg font-semibold text-emerald-400">+20% Included</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block uppercase tracking-wider mb-1">Customs Clearance (통관)</span>
            <span className="text-lg font-semibold text-amber-400">DDP (Tax Included)</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block uppercase tracking-wider mb-1">Delivery Time (배송기간)</span>
            <span className="text-lg font-semibold text-slate-200">5 - 7 Days (Air)</span>
          </div>
        </div>
      </header>

      {/* Categories & Filter Bar */}
      <section className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Trending K-Beauty</h2>
          <p className="text-sm text-slate-400">실시간 올리브영 인기 랭킹 & 태국 추천 제품</p>
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">전체 (All)</button>
          <button className="px-4 py-2 rounded-full text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">스킨케어</button>
          <button className="px-4 py-2 rounded-full text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">메이크업</button>
          <button className="px-4 py-2 rounded-full text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">마스크팩</button>
          <button className="px-4 py-2 rounded-full text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">바디케어</button>
        </div>
      </section>

      {/* Product Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {MOCK_PRODUCTS.map((product) => (
          <div key={product.id} className="glass-panel p-4 flex flex-col justify-between group h-full">
            <div className="relative w-full aspect-square bg-slate-900 rounded-xl overflow-hidden mb-4 border border-slate-800">
              <img
                src={product.thumbnail_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-md bg-amber-500 text-slate-950 shadow-md">
                DDP 면세
              </span>
            </div>

            <div className="flex-grow flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                  {product.brand}
                </span>
                <h3 className="text-sm font-medium text-slate-100 mb-2 line-clamp-2 min-h-[40px] group-hover:text-emerald-400 transition-colors">
                  {product.name}
                </h3>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-slate-400 block line-through">
                    {product.price_krw.toLocaleString()} KRW
                  </span>
                  <span className="text-xl font-bold text-slate-100">
                    {product.price_thb.toLocaleString()} <span className="text-gradient text-sm font-semibold">THB</span>
                  </span>
                </div>
                
                <Link
                  href={`/products/${product.goods_no}`}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all duration-300"
                >
                  Buy (구매)
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Footer info */}
      <footer className="mt-20 border-t border-slate-900 pt-8 text-center text-xs text-slate-500">
        <p>© 2026 OLIVE YOUNG THAI Gateway. Operated under legal Sourcing Agent framework.</p>
        <p className="mt-2 text-slate-600">All prices calculated automatically with +20% sourcing margin & DDP air freight rates.</p>
      </footer>
    </main>
  );
}
