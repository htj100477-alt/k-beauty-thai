import React from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { createClient } from '@/utils/supabase/server';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const selectedCategory = resolvedParams.category || '';

  let products: any[] = [];
  let categories: any[] = [];

  try {
    const supabase = await createClient();

    // Fetch categories
    const { data: catData } = await supabase.from('categories').select('*');
    categories = catData || [];

    // Fetch products
    let dbQuery = supabase.from('products').select('*');
    if (selectedCategory) {
      dbQuery = dbQuery.eq('category_id', selectedCategory);
    }
    const { data: prodData } = await dbQuery;

    if (prodData) {
      products = prodData.filter((item: any) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          item.name?.toLowerCase().includes(q) ||
          item.brand?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        );
      });
    }
  } catch (e) {
    console.error('Failed to fetch search data from Supabase:', e);
  }

  return (
    <main className="flex flex-col bg-[#eef2f6] min-h-full" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '24px', paddingBottom: '24px', gap: '20px', boxSizing: 'border-box' }}>
      {/* Title & Back Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <span>🔍</span> 상품 검색 (Search)
        </h1>
        <Link href="/" className="text-xs font-bold text-slate-400 hover:text-[#0d9488]">
          ✕ 닫기
        </Link>
      </div>

      {/* Search Bar Form */}
      <form action="/search" method="GET" className="relative w-full flex items-center">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="상품명, 브랜드(다슈, 헤라, 메디힐 등) 검색..."
          className="w-full py-3 pl-11 pr-4 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d9488] shadow-sm transition-all"
        />
        <span className="absolute left-3.5 text-base text-slate-400">🔍</span>
        {query && (
          <Link href="/search" className="absolute right-3 text-xs font-extrabold text-slate-400 hover:text-slate-600">
            초기화
          </Link>
        )}
      </form>

      {/* Category Pills Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        <Link
          href={`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
            !selectedCategory
              ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-sm'
              : 'bg-white border-[#e2e8f0] text-slate-500 hover:text-slate-800'
          }`}
        >
          전체
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/search?category=${cat.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              selectedCategory === cat.id
                ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-sm'
                : 'bg-white border-[#e2e8f0] text-slate-500 hover:text-slate-800'
            }`}
          >
            {cat.name_ko || cat.name}
          </Link>
        ))}
      </div>

      {/* Results Count & Section Header */}
      <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-1">
        <span>검색 결과 {products.length}건</span>
        {query && <span className="text-[#0d9488]">키워드: &quot;{query}&quot;</span>}
      </div>

      {/* Product Grid Results */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
            >
              <div className="relative w-full aspect-square bg-[#f8fafc] overflow-hidden">
                <SafeImage
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-black rounded bg-amber-500 text-white shadow-sm uppercase z-10">
                  DDP 면세
                </span>
              </div>
              <div className="flex-grow flex flex-col justify-between p-3 gap-2">
                <div>
                  <span className="text-[9px] font-extrabold text-[#0d9488] uppercase tracking-wider block">
                    {product.brand}
                  </span>
                  <h3 className="text-[11px] font-bold text-slate-800 line-clamp-2 h-8 leading-tight mt-0.5 overflow-hidden">
                    {product.name}
                  </h3>
                </div>
                <div className="pt-2 border-t border-[#f1f5f9] flex flex-col gap-1">
                  <span className="text-sm font-black text-slate-800">
                    {parseFloat(product.price_thb || '0').toLocaleString()} <span className="text-[10px] text-[#0d9488]">THB</span>
                  </span>
                  <Link
                    href={`/products/${product.goods_no || product.id}`}
                    className="w-full py-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-lg text-[10px] font-extrabold text-center transition-all block"
                  >
                    상세보기
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-[#e2e8f0] text-center flex flex-col items-center gap-2">
          <span className="text-3xl">🔍</span>
          <p className="text-xs font-bold text-slate-600">검색 조건에 맞는 상품이 없습니다.</p>
          <p className="text-[11px] text-slate-400">다른 키워드나 카테고리를 선택해 보세요.</p>
        </div>
      )}
    </main>
  );
}
