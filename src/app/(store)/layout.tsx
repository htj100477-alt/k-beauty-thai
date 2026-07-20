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
    <div className="h-screen w-screen bg-[#eaedf2] flex justify-center items-center p-0 sm:p-4 md:p-6 overflow-hidden">
      {/* Mobile Frame Container matching phoneswitchhub */}
      <div className="w-full max-w-[480px] h-full sm:h-[92vh] sm:max-h-[880px] bg-[#f4f6fa] sm:rounded-[2rem] sm:border sm:border-slate-300/80 sm:shadow-2xl relative flex flex-col justify-between overflow-hidden">
        
        {/* Top Navbar matching 3rd screenshot */}
        <header className="bg-white border-b border-[#e2e8f0] px-5 py-4 flex justify-between items-center z-40 flex-shrink-0 w-full">
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

        {/* Contained Scrollable Content Area */}
        <div className="flex-grow w-full overflow-y-auto pb-24 scrollbar-none">
          {children}
        </div>

        {/* Bottom Tab Navigator matching 3rd screenshot */}
        <nav className="absolute bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-[#e2e8f0] h-16 px-6 flex justify-around items-center z-50 shadow-lg">
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
