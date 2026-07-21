import React from 'react';
import Link from 'next/link';

export default function CartPage() {
  return (
    <main className="flex flex-col bg-[#eef2f6] min-h-full" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '24px', paddingBottom: '24px', gap: '20px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <span>🛒</span> 장바구니 (Cart)
        </h1>
        <Link href="/" className="text-xs font-bold text-slate-400 hover:text-[#0d9488]">
          ← 쇼핑 계속하기
        </Link>
      </div>

      {/* Cart Empty / Status Card */}
      <div className="bg-white rounded-2xl p-8 border border-[#e2e8f0] shadow-sm text-center flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#0d9488]/10 text-[#0d9488] flex items-center justify-center text-3xl mb-1">
          🛒
        </div>
        <h2 className="text-sm font-black text-slate-800">장바구니가 비어 있습니다.</h2>
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs font-medium">
          원하시는 K-Beauty 상품을 담고 한타이 항공배송으로 5~7일 만에 태국에서 빠르게 받아보세요!
        </p>
        <Link
          href="/"
          className="mt-2 px-6 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
        >
          인기 상품 구경하기 🌿
        </Link>
      </div>

      {/* Order & Freight Notice Card */}
      <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col gap-2 text-xs">
        <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
          ✈️ 직구 & 배송 안내 (Freight Info)
        </h3>
        <ul className="text-[11px] text-slate-500 flex flex-col gap-1 list-disc pl-4 font-normal">
          <li>태국 전지역 DDP 면세 통관 완료 후 집 앞까지 배송됩니다.</li>
          <li>기본 항공 요율: 250 THB/kg (실시간 정산 적용)</li>
          <li>결제 문의 및 단체 대량 소싱은 카카오톡/LINE 고객센터를 이용해 주세요.</li>
        </ul>
      </div>
    </main>
  );
}
