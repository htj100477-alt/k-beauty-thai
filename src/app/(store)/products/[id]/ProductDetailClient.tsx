'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { THAILAND_PROVINCES } from '@/utils/addresses';
import SafeImage from '@/components/SafeImage';

interface ProductDetailClientProps {
  product: {
    id: string;
    goods_no: string;
    brand: string;
    name: string;
    price_krw: number;
    price_thb: number;
    thumbnail_url: string;
    detail_description_image: string;
    ingredients: string;
    precautions: string;
    category_name: string;
    weight_grams: number;
  };
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Thai Address States
  const [selectedProvinceId, setSelectedProvinceId] = useState<number>(-1);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(-1);
  const [addressDetail, setAddressDetail] = useState('');
  
  const [proofUploaded, setProofUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const selectedProvince = THAILAND_PROVINCES.find(p => p.id === selectedProvinceId);
  const districtsList = selectedProvince ? selectedProvince.districts : [];

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || selectedProvinceId === -1 || selectedDistrictId === -1 || !addressDetail || !proofUploaded) {
      alert('Please fill out all fields, select address dropdowns, and upload the transfer slip.');
      return;
    }

    setLoading(true);

    try {
      const provinceName = selectedProvince ? `${selectedProvince.name_th} (${selectedProvince.name_en})` : '';
      const districtName = districtsList.find(d => d.id === selectedDistrictId)?.name_th || '';

      // Get current logged-in user if available to link the order
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Create order in Supabase orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          shipping_province: provinceName,
          shipping_district: districtName,
          shipping_address_detail: addressDetail,
          total_amount_thb: product.price_thb,
          status: 'paid', // since slip is uploaded, marked as paid for admin review
          proof_of_payment_url: 'https://placeholder-slip-url.com/slip.jpg' // In production, upload file to Supabase storage bucket
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          product_id: product.id,
          quantity: 1,
          price_thb: product.price_thb
        });

      if (itemError) throw itemError;

      setOrderSuccess(true);
    } catch (err: any) {
      console.error('Order creation failed:', err);
      alert('주문 생성 중 에러가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col bg-[#eef2f6]" style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '24px', paddingBottom: '24px', gap: '24px', boxSizing: 'border-box' }}>
      {/* Back button */}
      <button 
        type="button" 
        onClick={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
          } else {
            router.push('/');
          }
        }} 
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#0d9488] transition-colors font-bold self-start cursor-pointer border-none bg-transparent p-0"
      >
        ← 뒤로 가기 (Back)
      </button>

      {/* Image Block */}
      <div className="bg-white border border-[#e2e8f0] p-3 aspect-square rounded-2xl overflow-hidden shadow-sm flex items-center justify-center">
        <SafeImage
          src={product.thumbnail_url}
          alt={product.name}
          className="w-full h-full object-cover rounded-xl"
        />
      </div>

      {/* Product Info Block */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#0d9488] uppercase tracking-widest block mb-1">
            {product.brand}
          </span>
          <h1 className="text-lg font-extrabold text-slate-800 leading-snug">
            {product.name}
          </h1>
        </div>

        {/* Pricing Panel */}
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl border-l-4 border-l-[#0d9488] shadow-sm">
          <span className="text-[10px] text-slate-400 block line-through mb-0.5">
            {product.price_krw.toLocaleString()}원 (올리브영 정가)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-800 tracking-tight">
              {parseFloat(product.price_thb as any).toLocaleString()}
            </span>
            <span className="text-lg font-bold text-[#0d9488]">THB</span>
          </div>
          <span className="text-[9px] text-slate-400 block mt-1">
            * 관부가세(DDP) 및 한-태 국제배송료가 포함된 최종 금액입니다.
          </span>
        </div>

        {/* Custom Warning: Order Limits */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5 items-start">
          <span className="text-amber-500 text-sm">⚠️</span>
          <div className="text-[10px] text-slate-600">
            <p className="font-bold text-amber-800 mb-0.5">태국 개인 직구 한도 준수</p>
            <p>자가사용 통관을 위해 **동일 품목 최대 3개**, **총 화장품 15개**까지만 합배송이 가능합니다.</p>
          </div>
        </div>

        <button
          onClick={() => setOrderModalOpen(true)}
          className="w-full py-3.5 bg-[#0d9488] hover:bg-[#0f766e] active:scale-[0.98] rounded-xl font-bold text-white uppercase tracking-wider text-xs shadow-md transition-all duration-300"
        >
          PromptPay Order (주문하기)
        </button>
      </div>

      {/* Specifications & Ingredients Table */}
      <section className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm text-xs">
        <h2 className="text-sm font-bold mb-4 text-slate-800 pb-1.5 border-b border-slate-100">
          제품 상세 고시 (Specifications)
        </h2>
        
        <table className="w-full text-slate-700">
          <tbody>
            <tr className="border-b border-slate-100">
              <th className="py-2.5 w-1/3 text-slate-500 font-semibold text-left">제조국</th>
              <td className="py-2.5 text-slate-700">대한민국 (ROK)</td>
            </tr>
            {product.ingredients && (
              <tr className="border-b border-slate-100">
                <th className="py-2.5 text-slate-500 font-semibold text-left valign-top">전성분</th>
                <td className="py-2.5 text-slate-600 text-[10px] leading-relaxed max-h-24 overflow-y-auto block">
                  {product.ingredients}
                </td>
              </tr>
            )}
            {product.precautions && (
              <tr className="border-b border-slate-100">
                <th className="py-2.5 text-slate-500 font-semibold text-left valign-top">주의사항</th>
                <td className="py-2.5 text-slate-600 text-[10px] leading-relaxed">
                  {product.precautions}
                </td>
              </tr>
            )}
            <tr className="border-b border-slate-100">
              <th className="py-2.5 text-slate-500 font-semibold text-left">배송무게</th>
              <td className="py-2.5 text-slate-700">{product.weight_grams} g</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Dynamic Thai Product Detail Infographic Card */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-teal-50/30 border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <h2 className="text-xs font-extrabold text-slate-800 tracking-wide uppercase">
              รายละเอียดสินค้า (K-Beauty Detail Info)
            </h2>
          </div>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#0d9488]/10 text-[#0d9488] border border-[#0d9488]/20">
            ของแท้ 100% OLIVE YOUNG
          </span>
        </div>

        {/* Feature Highlights Banner */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/60 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#7c3aed] text-white uppercase">
              {product.brand}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {product.category_name} พรีเมียมส่งตรงจากเกาหลี
            </span>
          </div>

          <p className="text-xs font-extrabold text-slate-800 leading-snug">
            {product.name}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold">
              <span className="text-emerald-500 font-bold">✓</span> ผิวสัมผัสอ่อนโยน เหมาะกับทุกสภาพผิว
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold">
              <span className="text-emerald-500 font-bold">✓</span> บำรุงล้ำลึก สารสกัดเกาหลี 100%
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold">
              <span className="text-emerald-500 font-bold">✓</span> ผ่านการทดสอบระคายเคืองผิว
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold">
              <span className="text-emerald-500 font-bold">✓</span> DDP 면세 통관 완료 항공직송
            </div>
          </div>
        </div>

        {/* Thai Detail Infographic Poster Image (Only rendered when distinct from top thumbnail) */}
        {product.detail_description_image && product.detail_description_image !== product.thumbnail_url && (
          <div className="w-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xs mt-1">
            <SafeImage
              src={product.detail_description_image}
              alt="Detail Description"
              className="w-full object-contain"
            />
          </div>
        )}
      </section>

      {/* PromptPay Order Drawer Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-xl max-w-[420px] w-full p-6 relative flex flex-col max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => {
                setOrderModalOpen(false);
                setOrderSuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-base"
            >
              ✕
            </button>

            {!orderSuccess ? (
              <>
                <h3 className="text-base font-bold mb-1 text-slate-800">Checkout (주문하기)</h3>
                <p className="text-[10px] text-slate-500 mb-5">
                  กรุณาโอนเงินผ่าน PromptPay และระบุที่อยู่จัดส่งให้ถูกต้อง
                </p>

                {/* PromptPay QR Code Mockup */}
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl mb-5 border border-slate-200">
                  <span className="text-[10px] text-slate-950 font-bold tracking-widest uppercase mb-1.5">PromptPay (พร้อมเพย์)</span>
                  <div className="w-32 h-32 bg-white flex flex-col items-center justify-center border border-slate-300 relative rounded-lg">
                    <span className="text-2xl">📱</span>
                    <span className="text-[9px] text-slate-500 font-bold mt-1">Scan QR Code</span>
                    <div className="absolute inset-1.5 border border-dashed border-emerald-500 pointer-events-none"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-800 mt-3">
                    Amount: {parseFloat(product.price_thb as any).toLocaleString()} THB
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">Tax ID: 01055XXXXXXXX</span>
                </div>

                {/* Delivery Form */}
                <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3 text-xs text-slate-700">
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">ชื่อผู้รับ (Full Name)</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Somchai Somboon"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0d9488] focus:bg-white transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">เบอร์โทร (Phone Number)</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="081-234-5678"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0d9488] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Thai Address Selector Dropdowns */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">จังหวัด (Province)</label>
                      <select
                        required
                        value={selectedProvinceId}
                        onChange={(e) => {
                          setSelectedProvinceId(parseInt(e.target.value));
                          setSelectedDistrictId(-1); // Reset district
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0d9488] focus:bg-white transition-all"
                      >
                        <option value="-1">선택하세요...</option>
                        {THAILAND_PROVINCES.map((prov) => (
                          <option key={prov.id} value={prov.id}>
                            {prov.name_th} ({prov.name_en})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">อำเภอ/เขต (District)</label>
                      <select
                        required
                        disabled={selectedProvinceId === -1}
                        value={selectedDistrictId}
                        onChange={(e) => setSelectedDistrictId(parseInt(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0d9488] focus:bg-white transition-all disabled:opacity-50"
                      >
                        <option value="-1">선택하세요...</option>
                        {districtsList.map((dist) => (
                          <option key={dist.id} value={dist.id}>
                            {dist.name_th} ({dist.name_en})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">ที่อยู่โดยละเอียด (Address Detail)</label>
                    <textarea
                      required
                      rows={2}
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      placeholder="수쿰빗 21가 12/3번지, 우편번호 포함 입력"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0d9488] focus:bg-white transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 block mb-0.5">슬립 업로드 (Receipt Upload)</label>
                    <button
                      type="button"
                      onClick={() => setProofUploaded(true)}
                      className={`w-full py-2 rounded-lg border text-[10px] font-bold transition-colors ${
                        proofUploaded
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100/50'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
                      }`}
                    >
                      {proofUploaded ? '✓ Slip Uploaded (영수증 완료)' : '📷 Click to Upload Slip (영수증 등록)'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-lg font-bold text-xs tracking-wider uppercase disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Submitting...' : 'Confirm Order (주문서 제출)'}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 text-center text-xs">
                <span className="text-4xl mb-3">🎉</span>
                <h3 className="text-base font-bold text-slate-800 mb-1.5">Order Confirmed!</h3>
                <p className="text-[10px] text-slate-500 mb-5 max-w-[240px]">
                  ได้รับสลิปเรียบร้อย ระบบ에 주문이 정상 접수되었습니다. (배송 5~7일 소요)
                </p>
                <button
                  onClick={() => {
                    setOrderModalOpen(false);
                    setOrderSuccess(false);
                    setCustomerName('');
                    setCustomerPhone('');
                    setSelectedProvinceId(-1);
                    setSelectedDistrictId(-1);
                    setAddressDetail('');
                    setProofUploaded(false);
                  }}
                  className="px-5 py-1.5 bg-[#0d9488] text-white hover:bg-[#0f766e] rounded-lg font-bold transition-colors"
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
