'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#eaedf2] flex justify-center items-start">
      {/* Mobile Frame Container matching phoneswitchhub */}
      <div className="w-full max-w-[480px] min-h-screen bg-[#f4f6fa] border-x border-[#e2e8f0] shadow-2xl relative pb-20 flex flex-col justify-between">
        
        {/* Top Navbar matching 3rd screenshot */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] px-4 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0d9488] to-[#14b8a6] flex items-center justify-center text-white text-base shadow-sm">
              🌿
            </div>
            <span className="font-black text-slate-800 text-sm uppercase tracking-wider">
              OLIVE <span className="text-[#0d9488]">YOUNG</span> THAI
            </span>
          </Link>

          {/* Flags Language Selector matching 3rd screenshot */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">KR</span>
            <span className="hover:text-slate-600 cursor-pointer">TH</span>
            <span className="hover:text-slate-600 cursor-pointer">MM</span>
            <span className="hover:text-slate-600 cursor-pointer">US</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-grow w-full">
          {children}
        </div>

        {/* Bottom Tab Navigator matching 3rd screenshot */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-[#e2e8f0] h-16 px-6 flex justify-around items-center z-50 shadow-lg">
          <Link 
            href="/" 
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              isActive('/') && !pathname.includes('login') ? 'text-[#0d9488]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-xl">🛍️</span>
            <span className="text-[10px] font-bold">쇼핑 (Store)</span>
          </Link>

          <Link 
            href="/?search=true" 
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600"
          >
            <span className="text-xl">🔍</span>
            <span className="text-[10px] font-bold">검색 (Search)</span>
          </Link>

          <Link 
            href="/?cart=true" 
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600"
          >
            <span className="text-xl">🛒</span>
            <span className="text-[10px] font-bold">장바구니 (Cart)</span>
          </Link>

          <Link 
            href="/login" 
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              isActive('/login') || pathname.startsWith('/admin') ? 'text-[#0d9488]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-bold">내 정보 (My Info)</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
