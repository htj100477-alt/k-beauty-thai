'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { MOCK_PRODUCTS } from '@/utils/mockProducts';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const product = MOCK_PRODUCTS.find(p => p.goods_no === id);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [proofUploaded, setProofUploaded] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-100 p-4">
        <h2 className="text-lg font-bold mb-4">Product Not Found</h2>
        <Link href="/" className="px-4 py-2 bg-emerald-600 rounded-lg text-xs font-bold">
          Go Back Home
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !shippingAddress || !proofUploaded) {
      alert('Please fill out all fields and upload the transfer receipt screenshot.');
      return;
    }
    setOrderSuccess(true);
  };

  return (
    <main className="py-6 px-4 w-full flex flex-col gap-6">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors">
        ← Back to Storefront
      </Link>

      {/* Image Block */}
      <div className="glass-panel p-3 aspect-square bg-[#0f0e15] rounded-xl overflow-hidden border border-slate-900 flex items-center justify-center">
        <img
          src={product.thumbnail_url}
          alt={product.name}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {/* Product Info Block */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
            {product.brand}
          </span>
          <h1 className="text-lg font-bold text-slate-100 leading-snug">
            {product.name}
          </h1>
        </div>

        {/* Pricing Panel */}
        <div className="glass-panel p-4 border-l-4 border-l-emerald-500 bg-slate-900/10">
          <span className="text-[10px] text-slate-500 block line-through mb-0.5">
            {product.price_krw.toLocaleString()}원 (올리브영 정가)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-100 tracking-tight">
              {product.price_thb.toLocaleString()}
            </span>
            <span className="text-lg font-bold text-gradient">THB</span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-1">
            * 관부가세(DDP) 및 한-태 국제배송료가 포함된 최종 금액입니다.
          </span>
        </div>

        {/* Custom Warning: Order Limits */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2.5 items-start">
          <span className="text-amber-400 text-sm">⚠️</span>
          <div className="text-[10px] text-slate-300">
            <p className="font-bold text-amber-400 mb-0.5">태국 개인 직구 한도 준수</p>
            <p>자가사용 통관을 위해 **동일 품목 최대 3개**, **총 화장품 15개**까지만 합배송이 가능합니다.</p>
          </div>
        </div>

        <button
          onClick={() => setOrderModalOpen(true)}
          className="w-full py-3.5 bg-gradient-primary rounded-xl font-bold text-slate-950 uppercase tracking-wider text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 transition-all duration-300"
        >
          PromptPay Order (주문하기)
        </button>
      </div>

      {/* Specifications & Ingredients Table */}
      <section className="glass-panel p-4 text-xs">
        <h2 className="text-sm font-bold mb-4 text-slate-200 pb-1.5 border-b border-slate-900">
          제품 상세 고시 (Specifications)
        </h2>
        
        <table className="w-full text-slate-300">
          <tbody>
            <tr className="border-b border-slate-900/50">
              <th className="py-2.5 w-1/3 text-slate-400 font-medium">제조국</th>
              <td className="py-2.5 text-slate-200">대한민국 (ROK)</td>
            </tr>
            {product.ingredients && (
              <tr className="border-b border-slate-900/50">
                <th className="py-2.5 text-slate-400 font-medium valign-top">전성분</th>
                <td className="py-2.5 text-slate-300 text-[10px] leading-relaxed max-h-24 overflow-y-auto block">
                  {product.ingredients}
                </td>
              </tr>
            )}
            {product.precautions && (
              <tr className="border-b border-slate-900/50">
                <th className="py-2.5 text-slate-400 font-medium valign-top">주의사항</th>
                <td className="py-2.5 text-slate-300 text-[10px] leading-relaxed">
                  {product.precautions}
                </td>
              </tr>
            )}
            <tr className="border-b border-slate-900/50">
              <th className="py-2.5 text-slate-400 font-medium">배송무게</th>
              <td className="py-2.5 text-slate-200">{product.weight_grams} g</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Product Description Image */}
      {product.detail_description_image && (
        <section className="glass-panel p-3">
          <h2 className="text-xs font-bold mb-3 text-slate-200 pb-1 border-b border-slate-900">
            상세 이미지 (K-Beauty Info)
          </h2>
          <div className="w-full bg-[#0f0e15] rounded-lg overflow-hidden border border-slate-900">
            <img
              src={product.detail_description_image}
              alt="Detail Description"
              className="w-full object-contain"
            />
          </div>
        </section>
      )}

      {/* PromptPay Order Drawer Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-[420px] w-full p-6 relative flex flex-col max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => {
                setOrderModalOpen(false);
                setOrderSuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base"
            >
              ✕
            </button>

            {!orderSuccess ? (
              <>
                <h3 className="text-base font-bold mb-1 text-slate-100">Checkout (주문하기)</h3>
                <p className="text-[10px] text-slate-500 mb-5">
                  กรุณาโอนเงินผ่าน PromptPay และอัปโหลดภาพหลักฐานการโอนเงิน
                </p>

                {/* PromptPay QR Code Mockup */}
                <div className="flex flex-col items-center p-4 bg-white rounded-xl mb-5 shadow-inner">
                  <span className="text-[10px] text-slate-950 font-bold tracking-widest uppercase mb-1.5">PromptPay (พร้อมเพย์)</span>
                  <div className="w-32 h-32 bg-slate-100 flex flex-col items-center justify-center border border-slate-300 relative rounded-lg">
                    <span className="text-2xl">📱</span>
                    <span className="text-[9px] text-slate-500 font-bold mt-1">Scan QR Code</span>
                    <div className="absolute inset-1.5 border border-dashed border-emerald-500 pointer-events-none"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-950 mt-3">
                    Amount: {product.price_thb.toLocaleString()} THB
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">Tax ID: 01055XXXXXXXX</span>
                </div>

                {/* Delivery Form */}
                <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3 text-xs">
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">ชื่อผู้รับ (Name)</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Somchai Somboon"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">เบอร์โทร (Phone)</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="081-234-5678"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">ที่อยู่ (Address)</label>
                    <textarea
                      required
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="123 Sukhumvit Rd, Bangkok, 10110"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">영수증 업로드 (Transfer Receipt)</label>
                    <button
                      type="button"
                      onClick={() => setProofUploaded(true)}
                      className={`w-full py-2 rounded-lg border text-[10px] font-bold transition-colors ${
                        proofUploaded
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {proofUploaded ? '✓ Slip Uploaded (영수증 완료)' : '📷 Click to Upload Slip (영수증 등록)'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-2.5 bg-gradient-primary rounded-lg font-bold text-slate-950 text-xs tracking-wider uppercase"
                  >
                    Confirm Order (주문서 제출)
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 text-center text-xs">
                <span className="text-4xl mb-3">🎉</span>
                <h3 className="text-base font-bold text-slate-100 mb-1.5">Order Confirmed!</h3>
                <p className="text-[10px] text-slate-400 mb-5 max-w-[240px]">
                  ได้รับสลิปเรียบร้อย ระบบ에 주문이 정상 접수되었습니다. (배송 5~7일 소요)
                </p>
                <button
                  onClick={() => {
                    setOrderModalOpen(false);
                    setOrderSuccess(false);
                    setCustomerName('');
                    setCustomerPhone('');
                    setShippingAddress('');
                    setProofUploaded(false);
                  }}
                  className="px-5 py-1.5 bg-emerald-600 rounded-lg font-bold"
                >
                  OK (확인)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
