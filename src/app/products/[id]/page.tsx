'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { MOCK_PRODUCTS } from '@/utils/mockProducts';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetail({ params }: PageProps) {
  // Unwrap params using React.use() as required in Next.js 15
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
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-100">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link href="/" className="px-6 py-2 bg-emerald-600 rounded-lg text-sm font-bold">
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
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 mb-8 transition-colors">
        ← Back to Storefront
      </Link>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Left Column: Image and details */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-4 aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <img
              src={product.thumbnail_url}
              alt={product.name}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          {product.category && (
            <span className="text-xs text-slate-500 text-center">
              Category: {product.category}
            </span>
          )}
        </div>

        {/* Right Column: Pricing & Purchase options */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest block mb-2">
              {product.brand}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-6 leading-snug">
              {product.name}
            </h1>

            <div className="glass-panel p-6 mb-8 border-l-4 border-l-emerald-500">
              <span className="text-sm text-slate-400 block line-through mb-1">
                {product.price_krw.toLocaleString()} KRW (올리브영 정가)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-100 tracking-tight">
                  {product.price_thb.toLocaleString()}
                </span>
                <span className="text-2xl font-bold text-gradient">THB</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-2">
                * DDP 통관대행비 및 배송비가 모두 포함된 최종 금액입니다. 추가 세금 없음.
              </span>
            </div>

            {/* Custom Warning: Order Limits for personal import compliance */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-8 flex gap-3 items-start">
              <span className="text-amber-400 text-lg">⚠️</span>
              <div className="text-xs text-slate-300">
                <p className="font-bold text-amber-400 mb-1">태국 직구 수량 규정 준수</p>
                <p>개인 통관 한도 준수를 위해 **동일 제품은 최대 3개**, **전체 화장품은 최대 15개**까지만 구매 가능하도록 수량을 제한하고 있습니다.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setOrderModalOpen(true)}
            className="w-full py-4 bg-gradient-primary rounded-xl font-bold text-slate-950 uppercase tracking-wider text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-95 transition-all duration-300"
          >
            Order Now with PromptPay (간편 주문하기)
          </button>
        </div>
      </section>

      {/* Specifications & Ingredients Table */}
      <section className="glass-panel p-8 mb-16">
        <h2 className="text-xl font-bold mb-6 text-slate-200 pb-2 border-b border-slate-800">
          제품상세 정보 (Specifications)
        </h2>
        
        <table className="w-full text-sm text-left text-slate-300">
          <tbody>
            <tr className="border-b border-slate-800/50">
              <th className="py-4 px-2 w-1/4 text-slate-400 font-medium">제조국 (Origin)</th>
              <td className="py-4 px-2 text-slate-200">대한민국 (Republic of Korea)</td>
            </tr>
            {product.ingredients && (
              <tr className="border-b border-slate-800/50">
                <th className="py-4 px-2 text-slate-400 font-medium valign-top">전성분 (Ingredients)</th>
                <td className="py-4 px-2 text-slate-300 text-xs leading-relaxed max-h-40 overflow-y-auto block">
                  {product.ingredients}
                </td>
              </tr>
            )}
            {product.precautions && (
              <tr className="border-b border-slate-800/50">
                <th className="py-4 px-2 text-slate-400 font-medium valign-top">주의사항 (Precautions)</th>
                <td className="py-4 px-2 text-slate-300 text-xs">
                  {product.precautions}
                </td>
              </tr>
            )}
            <tr className="border-b border-slate-800/50">
              <th className="py-4 px-2 text-slate-400 font-medium">배송 무게 (Weight)</th>
              <td className="py-4 px-2 text-slate-200">{product.weight_grams} g</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Product Description Image */}
      {product.detail_description_image && (
        <section className="glass-panel p-8 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-6 text-slate-200 text-center w-full pb-2 border-b border-slate-800">
            상세 이미지 (Product Detail)
          </h2>
          <div className="w-full max-w-4xl bg-slate-900 rounded-xl overflow-hidden p-2 border border-slate-800">
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
          <div className="glass-panel max-w-md w-full p-8 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setOrderModalOpen(false);
                setOrderSuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>

            {!orderSuccess ? (
              <>
                <h3 className="text-xl font-bold mb-2 text-slate-100">Checkout (주문하기)</h3>
                <p className="text-xs text-slate-400 mb-6">
                  กรุณาโอนเงินผ่าน PromptPay และอัปโหลดภาพหลักฐานการโอนเงิน
                </p>

                {/* PromptPay QR Code Mockup */}
                <div className="flex flex-col items-center p-6 bg-white rounded-2xl mb-6 shadow-inner">
                  <span className="text-xs text-slate-950 font-bold tracking-widest uppercase mb-2">PromptPay (พร้อมเพย์)</span>
                  {/* Visual representation of PromptPay QR */}
                  <div className="w-40 h-40 bg-slate-100 flex flex-col items-center justify-center border border-slate-300 relative rounded-lg">
                    <span className="text-3xl">📱</span>
                    <span className="text-[10px] text-slate-500 font-bold mt-2">Scan QR Code</span>
                    <div className="absolute inset-2 border-2 border-dashed border-emerald-500 pointer-events-none"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-950 mt-4">
                    Amount: {product.price_thb.toLocaleString()} THB
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">Tax ID: 01055XXXXXXXX (Phone Switch Hub Co., Ltd)</span>
                </div>

                {/* Delivery Form */}
                <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">ชื่อผู้รับ (Customer Name)</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Somchai Somboon"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">เบอร์โทรศัพท์ (Phone Number)</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="081-234-5678"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">ที่อยู่จัดส่ง (Shipping Address)</label>
                    <textarea
                      required
                      rows={3}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="123 Sukhumvit Rd, Bangkok, 10110"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">อัปโหลดสลิป (Transfer Receipt)</label>
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => setProofUploaded(true)}
                        className={`flex-grow py-2.5 rounded-lg border text-xs font-bold transition-colors ${
                          proofUploaded
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {proofUploaded ? '✓ Slip Uploaded (슬립 업로드 완료)' : '📷 Click to Upload Slip (이체 스크린샷 업로드)'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3 bg-gradient-primary rounded-lg font-bold text-slate-950 text-xs tracking-wider uppercase"
                  >
                    Confirm Order (주문서 제출)
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="text-6xl mb-4">🎉</span>
                <h3 className="text-xl font-bold text-slate-100 mb-2">Order Confirmed!</h3>
                <p className="text-xs text-slate-400 mb-6 max-w-[280px]">
                  ขอบคุณที่สั่งซื้อ! ได้รับสลิปเรียบร้อย ระบบจะนำข้อมูลไป 소싱하여 5-7일 내 발송해 드립니다.
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
                  className="px-6 py-2 bg-emerald-600 rounded-lg text-xs font-bold"
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
