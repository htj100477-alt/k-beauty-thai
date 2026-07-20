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

  // Bottom Navigation helper to highlight active tab
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#030206] flex justify-center items-start">
      {/* Centered Mobile Frame container */}
      <div className="w-full max-w-[480px] min-h-screen bg-gradient-to-b from-[#08070d] to-[#0e0d16] border-x border-slate-900/60 shadow-2xl relative pb-24 flex flex-col justify-between">
        
        {/* Mobile Header / Brand Bar */}
        <div className="sticky top-0 z-40 bg-[#08070d]/80 backdrop-blur-md border-b border-slate-900/80 px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-emerald-500 text-lg">🍀</span>
            <span className="font-extrabold text-sm tracking-tight font-display">
              OLIVE <span className="text-gradient">YOUNG</span> THAI
            </span>
          </Link>
          <div className="flex gap-3">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              DDP
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-grow w-full">
          {children}
        </div>

        {/* Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#0a0a0f]/90 backdrop-blur-lg border-t border-slate-900/80 h-16 px-8 flex justify-around items-center z-50">
          <Link 
            href="/" 
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/') ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-semibold">Home (홈)</span>
          </Link>

          <Link 
            href="/login" 
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/login') ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-semibold">Login / Admin</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
