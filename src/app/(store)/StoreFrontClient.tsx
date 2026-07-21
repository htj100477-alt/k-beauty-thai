'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';

interface StoreFrontClientProps {
  categories: any[];
  allProducts: any[];
  initialCategoryId: string;
  exchangeRate: number;
  marginPercentage: number;
  ddpFee: number;
}

export default function StoreFrontClient({
  categories,
  allProducts,
  initialCategoryId,
  exchangeRate,
  marginPercentage,
  ddpFee,
}: StoreFrontClientProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(initialCategoryId);

  // Instant client-side product filtering (0ms latency)
  const filteredProducts = useMemo(() => {
    if (activeCategoryId === 'all') return allProducts;
    const subCategoryIds = categories.filter(c => c.parent_id === activeCategoryId).map(c => c.id);
    if (subCategoryIds.length > 0) {
      return allProducts.filter(p => p.category_id === activeCategoryId || subCategoryIds.includes(p.category_id));
    }
    return allProducts.filter(p => p.category_id === activeCategoryId);
  }, [allProducts, activeCategoryId, categories]);

  // Filter active categories that actually have at least 1 registered product
  const activeCategoriesWithProducts = useMemo(() => {
    const directCatIds = new Set(allProducts.map(p => p.category_id));
    const activeSubIds = new Set<string>();
    const activeMainIds = new Set<string>();

    categories.forEach(c => {
      if (directCatIds.has(c.id)) {
        if (c.parent_id) {
          activeSubIds.add(c.id);
          activeMainIds.add(c.parent_id);
        } else {
          activeMainIds.add(c.id);
        }
      }
    });

    return categories.filter(c => {
      if (c.parent_id) {
        return activeSubIds.has(c.id);
      } else {
        return activeMainIds.has(c.id);
      }
    });
  }, [categories, allProducts]);

  // Determine active parent category for subcategory row
  const activeCategory = useMemo(() => {
    return activeCategoriesWithProducts.find(c => c.id === activeCategoryId);
  }, [activeCategoriesWithProducts, activeCategoryId]);

  const activeParentId = useMemo(() => {
    if (!activeCategory) return null;
    return activeCategory.parent_id || activeCategory.id;
  }, [activeCategory]);

  const handleCategoryClick = (catId: string) => {
    setActiveCategoryId(catId);
    const newUrl = catId === 'all' ? '/' : `/?category=${catId}`;
    window.history.pushState(null, '', newUrl);
  };

  const productsCount = filteredProducts.length;
  const categoriesCount = categories.length;

  return (
    <main className="flex flex-col bg-[#eef2f6]" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '24px', paddingBottom: '24px', gap: '24px', boxSizing: 'border-box' }}>
      
      {/* 1. Gradient Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#ec4899] text-white shadow-md" style={{ padding: '24px', boxSizing: 'border-box' }}>
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
            <span className="text-[20px] font-black">{allProducts.length || 0}</span>
            <span className="text-[10px] font-bold text-white/90">전체 상품</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[20px] font-black">{productsCount}</span>
            <span className="text-[10px] font-bold text-white/90">조회 상품</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[20px] font-black">{categoriesCount || 0}</span>
            <span className="text-[10px] font-bold text-white/90">활성 카테고리</span>
          </div>
        </div>
      </section>

      {/* 2. Order Tracking Box */}
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

      {/* 3. Categories Hierarchical Display (Instant 0ms switching) */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide px-1">K-Beauty 카테고리</h3>
        
        {/* Main Categories Row */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-5 -mx-5 scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategoryClick('all')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              activeCategoryId === 'all'
                ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-sm'
                : 'bg-white border-[#e2e8f0] text-slate-500 hover:text-slate-800'
            }`}
          >
            전체 (All)
          </button>
          {activeCategoriesWithProducts.filter(c => !c.parent_id).map((cat) => {
            const isActiveParent = activeParentId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  isActiveParent
                    ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-sm'
                    : 'bg-white border-[#e2e8f0] text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat.name_ko}
              </button>
            );
          })}
        </div>

        {/* Subcategories Row */}
        {activeParentId && activeCategoriesWithProducts.some(c => c.parent_id === activeParentId) && (
          <div className="flex gap-1.5 overflow-x-auto py-1 px-1 bg-slate-100 rounded-xl border border-[#e2e8f0]/60 scrollbar-none">
            <button
              type="button"
              onClick={() => handleCategoryClick(activeParentId)}
              className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                activeCategoryId === activeParentId
                  ? 'bg-white text-[#0d9488] shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              전체보기
            </button>
            {activeCategoriesWithProducts.filter(c => c.parent_id === activeParentId).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleCategoryClick(sub.id)}
                className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeCategoryId === sub.id
                    ? 'bg-white text-[#0d9488] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {sub.name_ko}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 4. Product Grid */}
      <section className="grid grid-cols-2 gap-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#0d9488]/30 transition-all duration-300 group">
              <Link href={`/products/${product.goods_no}`} className="flex flex-col flex-grow cursor-pointer">
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
                <div className="flex-grow flex flex-col justify-between p-3 pb-0">
                  <div>
                    <span className="text-[9px] font-extrabold text-[#0d9488] uppercase tracking-wider block">
                      {product.brand}
                    </span>
                    <h3 className="text-[11px] font-bold text-slate-800 line-clamp-2 h-8 leading-tight mt-0.5 overflow-hidden">
                      {product.name}
                    </h3>
                  </div>
                </div>
              </Link>

              <div className="p-3 pt-2">

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
            해당 카테고리에 등록된 상품이 없습니다.
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
