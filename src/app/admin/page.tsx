'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  goodsName: string;
  goodsNo: string;
  originalKrw: number;
  finalThb: number;
  status: string;
  trackingNumber?: string;
  createdTime: string;
}

interface Product {
  id: string;
  goods_no: string;
  brand: string;
  name: string;
  price_krw: number;
  price_thb: number;
  thumbnail_url: string;
  detail_description_image?: string;
  ingredients?: string;
  precautions?: string;
  category_id?: string;
  category_name?: string;
  weight_grams: number;
  is_active: boolean;
}

interface Category {
  id: string;
  name_ko: string;
  name_en: string;
}

interface UserProfile {
  id: string;
  phone_number: string;
  role: string;
  created_at: string;
}

function DashboardContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active Tab determined from Search Params or local fallback
  const tabParam = searchParams.get('tab') || 'orders';
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'users' | 'settings'>('orders');

  useEffect(() => {
    if (tabParam === 'orders' || tabParam === 'products' || tabParam === 'categories' || tabParam === 'users' || tabParam === 'settings') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Database States
  const [exchangeRate, setExchangeRate] = useState(38.0);
  const [margin, setMargin] = useState(20);
  const [ddpFee, setDdpFee] = useState(250);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Form States
  const [newGoodsNo, setNewGoodsNo] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newName, setNewName] = useState('');
  const [newPriceKrw, setNewPriceKrw] = useState(0);
  const [newWeight, setNewWeight] = useState(200);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newThumbnail, setNewThumbnail] = useState('');
  const [newDetailImg, setNewDetailImg] = useState('');
  const [newIngredients, setNewIngredients] = useState('');
  const [newPrecautions, setNewPrecautions] = useState('');

  const [newCatKo, setNewCatKo] = useState('');
  const [newCatEn, setNewCatEn] = useState('');

  // Initial Data Loading
  const loadAllData = async () => {
    try {
      // 1. Settings
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (settingsData && settingsData.length > 0) {
        settingsData.forEach(item => {
          if (item.key === 'exchange_rate_krw_thb') setExchangeRate(parseFloat(item.value));
          if (item.key === 'margin_percentage') setMargin(parseInt(item.value));
          if (item.key === 'ddp_shipping_fee_per_kg') setDdpFee(parseInt(item.value));
        });
      }

      // 2. Categories
      const { data: catData } = await supabase.from('categories').select('*').order('name_ko', { ascending: true });
      if (catData) setCategories(catData);

      // 3. Products
      const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (prodData) setProducts(prodData);

      // 4. Profiles
      const { data: profileData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profileData) setProfiles(profileData);

      // 5. Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .order('created_at', { ascending: false });

      if (ordersData) {
        let revSum = 0;
        let pendCount = 0;
        const formatted: Order[] = ordersData.map(o => {
          const firstItem = o.order_items?.[0];
          const amount = parseFloat(o.total_amount_thb);
          revSum += amount;
          if (o.status !== 'shipped' && o.status !== 'completed') {
            pendCount++;
          }
          return {
            id: o.id.substring(0, 8).toUpperCase(),
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            shippingAddress: `${o.shipping_province}, ${o.shipping_district}, ${o.shipping_address_detail}`,
            goodsName: firstItem?.products?.name || 'K-Beauty Sourced Items',
            goodsNo: firstItem?.products?.goods_no || '',
            originalKrw: firstItem?.products?.price_krw || 0,
            finalThb: amount,
            status: o.status,
            trackingNumber: o.tracking_number,
            createdTime: new Date(o.created_at).toLocaleString()
          };
        });
        setOrders(formatted);
        setTotalRevenue(revSum);
        setPendingCount(pendCount);
      }
    } catch (err) {
      console.error('Failed to load DB data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [supabase]);

  // Pricing Engine calculations
  const calculateThb = (krw: number, weightGrams: number) => {
    const weightKg = weightGrams / 1000;
    const baseThb = krw / exchangeRate;
    const priceWithMargin = baseThb * (1 + margin / 100);
    const shippingFee = weightKg * ddpFee;
    return Math.round(priceWithMargin + shippingFee);
  };

  // Add Product Action
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoodsNo || !newBrand || !newName || newPriceKrw <= 0) {
      alert('필수 상품 정보들을 입력해 주세요.');
      return;
    }

    const calculatedThb = calculateThb(newPriceKrw, newWeight);
    const catObj = categories.find(c => c.id === newCategoryId);

    const defaultThumbnail = newThumbnail || `https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/${newGoodsNo}.jpg`;
    const defaultDetail = newDetailImg || `https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/${newGoodsNo}_detail.jpg`;

    try {
      const { error } = await supabase.from('products').insert({
        goods_no: newGoodsNo,
        brand: newBrand,
        name: newName,
        price_krw: newPriceKrw,
        price_thb: calculatedThb,
        thumbnail_url: defaultThumbnail,
        detail_description_image: defaultDetail,
        ingredients: newIngredients,
        precautions: newPrecautions,
        category_id: newCategoryId || null,
        category_name: catObj ? catObj.name_ko : '',
        weight_grams: newWeight
      });

      if (error) throw error;
      alert('상품이 성공적으로 추가되었습니다!');
      
      setNewGoodsNo('');
      setNewBrand('');
      setNewName('');
      setNewPriceKrw(0);
      setNewWeight(200);
      setNewCategoryId('');
      setNewThumbnail('');
      setNewDetailImg('');
      setNewIngredients('');
      setNewPrecautions('');
      
      loadAllData();
    } catch (err: any) {
      alert('상품 등록 에러: ' + err.message);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadAllData();
    } catch (err: any) {
      alert('상태 변경 에러: ' + err.message);
    }
  };

  // Add Category Action
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatKo || !newCatEn) {
      alert('한글명과 영문명을 모두 입력해 주세요.');
      return;
    }

    try {
      const { error } = await supabase.from('categories').insert({
        name_ko: newCatKo,
        name_en: newCatEn
      });

      if (error) throw error;
      alert('카테고리가 추가되었습니다!');
      setNewCatKo('');
      setNewCatEn('');
      loadAllData();
    } catch (err: any) {
      alert('카테고리 등록 에러: ' + err.message);
    }
  };

  // Update Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates = [
        { key: 'exchange_rate_krw_thb', value: exchangeRate.toString() },
        { key: 'margin_percentage', value: margin.toString() },
        { key: 'ddp_shipping_fee_per_kg', value: ddpFee.toString() }
      ];

      for (const item of updates) {
        await supabase.from('settings').upsert(item);
      }
      alert('설정이 실시간 반영되었습니다!');
      loadAllData();
    } catch (err: any) {
      alert('설정 저장 에러: ' + err.message);
    }
  };

  // Manage Roles
  const handleUpdateRole = async (profileId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;
      alert(`권한이 ${newRole}(으)로 성공적으로 변경되었습니다.`);
      loadAllData();
    } catch (err: any) {
      alert('권한 변경 에러: ' + err.message);
    }
  };

  // Input Tracking number
  const handleInputTracking = async (orderId: string) => {
    const tracking = prompt('송장 번호(AWB)를 입력해 주세요:');
    if (tracking) {
      try {
        await supabase
          .from('orders')
          .update({ tracking_number: tracking, status: 'shipped' })
          .filter('id', 'ilike', `${orderId}%`);
        alert('송장번호가 등록되었습니다!');
        loadAllData();
      } catch (err: any) {
        alert('송장 저장 에러: ' + err.message);
      }
    }
  };

  const handleCopyClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label}이(가) 클립보드에 복사되었습니다!`);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Metrics Cards Grid matching 2nd screenshot */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">👥 전체 직원</span>
          <span className="text-2xl font-black text-slate-800 mt-2">
            {profiles.filter(p => p.role === 'admin' || p.role === 'staff').length}명
          </span>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">📁 활성 카테고리</span>
          <span className="text-2xl font-black text-slate-800 mt-2">{categories.length}개</span>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">💄 등록 상품</span>
          <span className="text-2xl font-black text-slate-800 mt-2">{products.length}개</span>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">📦 전체 주문</span>
          <span className="text-2xl font-black text-slate-800 mt-2">{orders.length}건</span>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">💰 총 매출 (THB)</span>
          <span className="text-2xl font-black text-emerald-600 mt-2">
            {totalRevenue.toLocaleString()} <span className="text-xs">฿</span>
          </span>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[100px]">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">⏳ 승인 대기</span>
          <span className="text-2xl font-black text-rose-500 mt-2">{pendingCount}건</span>
        </div>
      </section>

      {/* Main Tab Area */}
      <div className="mt-2">
        
        {/* Tab 1: Orders (최근 주문 현황) */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800">최근 주문 현황 (Recent Orders)</h3>
              <span className="text-[10px] text-slate-400">최신 주문건부터 나열됩니다.</span>
            </div>

            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-wider border-b border-[#e2e8f0]">
                      <th className="py-3 px-4">구매자 (Buyer)</th>
                      <th className="py-3 px-4">전화번호</th>
                      <th className="py-3 px-4">상품명 / 올리브영 링크</th>
                      <th className="py-3 px-4">TOTAL (THB)</th>
                      <th className="py-3 px-4">송장/상태</th>
                      <th className="py-3 px-4">작성일 (Created)</th>
                      <th className="py-3 px-4 text-center">상태 변경</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-800">{order.customerName}</td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-500">{order.customerPhone}</td>
                        <td className="py-4 px-4 max-w-[200px]">
                          <span className="block text-slate-800 font-bold truncate">{order.goodsName}</span>
                          <button
                            onClick={() => handleCopyClipboard(`https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${order.goodsNo}`, '상품 링크')}
                            className="text-[9px] text-[#7c3aed] font-extrabold hover:underline mt-0.5 block"
                          >
                            🔗 올리브영 원본 소싱 링크 복사
                          </button>
                        </td>
                        <td className="py-4 px-4 font-mono font-extrabold text-slate-800">
                          {order.finalThb.toLocaleString()} ฿
                        </td>
                        <td className="py-4 px-4">
                          {order.trackingNumber ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-mono text-[10px] font-bold">
                              AWB: {order.trackingNumber}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold">
                              {order.status}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[10px]">{order.createdTime}</td>
                        <td className="py-4 px-4 text-center">
                          {order.status !== 'shipped' ? (
                            <button
                              onClick={() => handleInputTracking(order.id)}
                              className="px-3 py-1 bg-white border border-[#e2e8f0] text-slate-700 hover:bg-[#7c3aed] hover:text-white hover:border-[#7c3aed] rounded-lg text-[10px] font-bold shadow-sm transition-all"
                            >
                              송장 등록
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">발송완료</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                접수된 주문 내역이 없습니다.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Products (전체 상품 관리) */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add product */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="text-sm font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">신규 상품 등록</h3>
              <form onSubmit={handleAddProduct} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="text-slate-500 font-bold block mb-1">올리브영 상품 고유번호 (Goods No) *</label>
                  <input
                    type="text"
                    required
                    value={newGoodsNo}
                    onChange={(e) => setNewGoodsNo(e.target.value)}
                    placeholder="A000000XXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">브랜드명 (Brand) *</label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="다슈 (DASHU)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">상품명 (Product Name) *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="공식 명칭 기입"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">원화가(KRW) *</label>
                    <input
                      type="number"
                      required
                      value={newPriceKrw}
                      onChange={(e) => setNewPriceKrw(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">무게(g)</label>
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">카테고리</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="">카테고리 선택...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name_ko} ({cat.name_en})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">전성분 정보 (Ingredients)</label>
                  <textarea
                    value={newIngredients}
                    onChange={(e) => setNewIngredients(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-bold rounded-lg uppercase tracking-wider text-xs"
                >
                  상품 등록하기
                </button>
              </form>
            </div>

            {/* List products */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 lg:col-span-2 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">등록된 상품 목록</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-wider border-b border-[#e2e8f0]">
                      <th className="py-3 px-2">이미지</th>
                      <th className="py-3 px-2">상품명</th>
                      <th className="py-3 px-2">원화가(KRW)</th>
                      <th className="py-3 px-2">바트가(THB)</th>
                      <th className="py-3 px-2">노출 여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-2">
                          <img src={p.thumbnail_url} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                        </td>
                        <td className="py-3 px-2 max-w-[240px]">
                          <span className="text-[9px] text-purple-600 font-extrabold uppercase block">{p.brand}</span>
                          <span className="text-slate-800 font-bold truncate block mt-0.5">{p.name}</span>
                        </td>
                        <td className="py-3 px-2 font-mono font-bold">{p.price_krw.toLocaleString()}원</td>
                        <td className="py-3 px-2 font-mono text-emerald-600 font-black">{parseFloat(p.price_thb as any).toLocaleString()} THB</td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => handleToggleActive(p.id, p.is_active)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                              p.is_active 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {p.is_active ? '공개 중' : '비공개'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Categories (카테고리 구성) */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="text-sm font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">새 카테고리 추가</h3>
              <form onSubmit={handleAddCategory} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="text-slate-500 font-bold block mb-1">카테고리 한글명 *</label>
                  <input
                    type="text"
                    required
                    value={newCatKo}
                    onChange={(e) => setNewCatKo(e.target.value)}
                    placeholder="예: 스킨케어"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">카테고리 영문명 *</label>
                  <input
                    type="text"
                    required
                    value={newCatEn}
                    onChange={(e) => setNewCatEn(e.target.value)}
                    placeholder="예: Skincare"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-bold rounded-lg uppercase tracking-wider text-xs"
                >
                  카테고리 생성
                </button>
              </form>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 lg:col-span-2 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">구성된 카테고리 목록</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {categories.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-extrabold text-slate-800 block text-xs">{c.name_ko}</span>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase mt-0.5">{c.name_en}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Users (스탭 & 회원 관리) */}
        {activeTab === 'users' && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">회원 등급 및 권한 설정 (B2C)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-wider border-b border-[#e2e8f0]">
                    <th className="py-3 px-3">가입 전화번호 ID</th>
                    <th className="py-3 px-3">가입 일자</th>
                    <th className="py-3 px-3">현재 등급 (Role)</th>
                    <th className="py-3 px-3 text-right">등급 변경 권한</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">{user.phone_number}</td>
                      <td className="py-3.5 px-3 text-slate-400 text-[10px]">{new Date(user.created_at).toLocaleString()}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          user.role === 'admin' 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : user.role === 'staff'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {user.role === 'admin' ? 'Super Admin' : user.role === 'staff' ? 'Staff' : 'Customer (손님)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right flex gap-1.5 justify-end">
                        {user.role !== 'admin' ? (
                          <>
                            <button
                              onClick={() => handleUpdateRole(user.id, 'staff')}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 rounded text-[9px] font-bold"
                            >
                              스탭 부여
                            </button>
                            <button
                              onClick={() => handleUpdateRole(user.id, 'user')}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded text-[9px] font-bold"
                            >
                              손님 강등
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">변경 불가 (최고 어드민)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Settings (정산 설정) */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm max-w-md mx-auto">
            <h3 className="text-sm font-black text-slate-800 mb-6 pb-2 border-b border-slate-100">정산 설정 (Pricing Engine Config)</h3>
            <form onSubmit={handleUpdateSettings} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">기준 환율 (Exchange Rate)</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">1 THB =</span>
                  <input
                    type="number"
                    step="0.1"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                  <span className="text-slate-400">KRW</span>
                </div>
              </div>
              
              <div>
                <label className="text-slate-500 font-bold block mb-1">구매대행 마진율 (Margin %)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={margin}
                    onChange={(e) => setMargin(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">한타이쉬핑 DDP 요율 (DDP Rate/kg)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ddpFee}
                    onChange={(e) => setDdpFee(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                  <span className="text-slate-400">THB/kg</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-bold rounded-lg uppercase tracking-wider text-xs shadow-md"
              >
                정산 설정 저장
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-slate-400 text-xs">
        대시보드 불러오는 중...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
