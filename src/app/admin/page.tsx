'use client';

import React, { useState, useEffect } from 'react';
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

export default function AdminDashboard() {
  const supabase = createClient();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'users' | 'settings'>('orders');

  // Database States
  const [exchangeRate, setExchangeRate] = useState(38.0);
  const [margin, setMargin] = useState(20);
  const [ddpFee, setDdpFee] = useState(250);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  // Form States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  
  // Product Form
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

  // Category Form
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

      // 4. Profiles (Staff & Customers)
      const { data: profileData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profileData) setProfiles(profileData);

      // 5. Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .order('created_at', { ascending: false });

      if (ordersData) {
        const formatted: Order[] = ordersData.map(o => {
          const firstItem = o.order_items?.[0];
          return {
            id: o.id.substring(0, 8).toUpperCase(),
            customerName: o.customer_name,
            customerPhone: o.customer_phone,
            shippingAddress: `${o.shipping_province}, ${o.shipping_district}, ${o.shipping_address_detail}`,
            goodsName: firstItem?.products?.name || 'K-Beauty Sourced Items',
            goodsNo: firstItem?.products?.goods_no || '',
            originalKrw: firstItem?.products?.price_krw || 0,
            finalThb: parseFloat(o.total_amount_thb),
            status: o.status,
            trackingNumber: o.tracking_number,
            createdTime: new Date(o.created_at).toLocaleString()
          };
        });
        setOrders(formatted);
      }
    } catch (err) {
      console.error('Failed to load DB data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [supabase]);

  // Pricing engine helper
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

    // If thumbnail/detail images are empty, automatically format them to reference Supabase Storage
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
      
      // Reset Form
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
      alert('설정이 데이터베이스에 실시간 반영되었습니다!');
      loadAllData();
    } catch (err: any) {
      alert('설정 저장 에러: ' + err.message);
    }
  };

  // Promote/Demote User Role (Staff Management)
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
    <div className="flex flex-col gap-8">
      {/* Dashboard Sub Header */}
      <div className="flex justify-between items-center bg-slate-900/30 p-6 rounded-2xl border border-slate-900">
        <div>
          <h2 className="text-xl font-bold text-slate-100">B2C 직구 플랫폼 총괄 제어</h2>
          <p className="text-xs text-slate-500 mt-1">Super Admin & Staff 권한으로 주문 소싱 및 설정을 조율합니다.</p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="bg-[#12111d] px-4 py-2 rounded-lg border border-slate-900">
            <span className="text-slate-500 block">Total Orders</span>
            <span className="text-base font-bold text-slate-200">{orders.length} 건</span>
          </div>
          <div className="bg-[#12111d] px-4 py-2 rounded-lg border border-slate-900">
            <span className="text-slate-500 block">Sourced Products</span>
            <span className="text-base font-bold text-emerald-400">{products.length} 개</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-900 gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'orders' ? 'border-b-emerald-500 text-emerald-400' : 'border-b-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📦 주문 관리 ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'products' ? 'border-b-emerald-500 text-emerald-400' : 'border-b-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          💄 상품 등록/관리 ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'categories' ? 'border-b-emerald-500 text-emerald-400' : 'border-b-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📁 카테고리 구성 ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'users' ? 'border-b-emerald-500 text-emerald-400' : 'border-b-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          👥 스탭 & 회원 관리 ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'settings' ? 'border-b-emerald-500 text-emerald-400' : 'border-b-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚙️ 정산 설정
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[50vh]">
        
        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <section className="glass-panel p-6 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-900">주문 리스트 대시보드</h3>
            {orders.length > 0 ? (
              <div className="flex flex-col gap-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 bg-slate-900/20 border border-slate-900 rounded-xl flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-slate-900/50 pb-2">
                      <div>
                        <span className="text-xs font-mono text-emerald-400 font-bold">{order.id}</span>
                        <span className="text-[10px] text-slate-500 block">{order.createdTime}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-md uppercase ${
                        order.status === 'shipped' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div>
                        <p className="text-slate-500 font-bold mb-1">소싱 타깃 상품</p>
                        <p className="text-slate-200">{order.goodsName}</p>
                        <button
                          onClick={() => handleCopyClipboard(`https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${order.goodsNo}`, '올리브영 구매 링크')}
                          className="text-[10px] text-emerald-400 underline hover:text-emerald-300 mt-2 block"
                        >
                          🔗 올리브영 상품 상세링크 복사
                        </button>
                      </div>

                      <div>
                        <p className="text-slate-500 font-bold mb-1">태국 배송지 주소 (Shipping Address)</p>
                        <p className="text-slate-200">{order.customerName} ({order.customerPhone})</p>
                        <p className="text-slate-400 mt-1 leading-relaxed">{order.shippingAddress}</p>
                        <button
                          onClick={() => handleCopyClipboard(`${order.customerName}\n${order.customerPhone}\n${order.shippingAddress}`, '배송지 정보')}
                          className="text-[10px] text-amber-400 underline hover:text-amber-300 mt-2 block"
                        >
                          📋 주소 복사 (물류사 발송용)
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-900/40">
                      <div className="text-xs text-slate-400">
                        매입 원가: <span className="text-slate-200 font-mono">{order.originalKrw.toLocaleString()}원</span> | 
                        결제금액: <span className="text-gradient font-bold ml-1">{order.finalThb.toLocaleString()} THB</span>
                      </div>

                      <div className="flex gap-2">
                        {order.status !== 'shipped' ? (
                          <button
                            onClick={() => handleInputTracking(order.id)}
                            className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            송장번호(AWB) 등록
                          </button>
                        ) : (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span>✈️ 송장등록 완료:</span>
                            <span className="text-emerald-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                              {order.trackingNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-slate-500 text-xs">접수된 주문이 없습니다.</p>
            )}
          </section>
        )}

        {/* Tab 2: Products */}
        {activeTab === 'products' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Product Form */}
            <div className="glass-panel p-6 h-fit flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-900">신규 상품 등록</h3>
              <form onSubmit={handleAddProduct} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">상품 고유번호 (Goods No) *</label>
                  <input
                    type="text"
                    required
                    value={newGoodsNo}
                    onChange={(e) => setNewGoodsNo(e.target.value)}
                    placeholder="예: A000000247086"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">브랜드명 (Brand) *</label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="예: 다슈 (DASHU)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">상품명 (Product Name) *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="올리브영 공식 상품명"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">원화가(KRW) *</label>
                    <input
                      type="number"
                      required
                      value={newPriceKrw}
                      onChange={(e) => setNewPriceKrw(parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">무게(g)</label>
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">카테고리</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">선택 안함</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name_ko} ({cat.name_en})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">썸네일 이미지 주소</label>
                  <input
                    type="text"
                    value={newThumbnail}
                    onChange={(e) => setNewThumbnail(e.target.value)}
                    placeholder="공란 시 storage 업로드 파일명 매핑"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">상세 설명 이미지 주소</label>
                  <input
                    type="text"
                    value={newDetailImg}
                    onChange={(e) => setNewDetailImg(e.target.value)}
                    placeholder="공란 시 storage 업로드 파일명 매핑"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">전성분 정보 (Ingredients)</label>
                  <textarea
                    value={newIngredients}
                    onChange={(e) => setNewIngredients(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-primary text-slate-950 font-bold rounded-lg uppercase tracking-wider text-xs"
                >
                  상품 등록하기
                </button>
              </form>
            </div>

            {/* Products List Table */}
            <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-900">등록된 상품 리스트</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-[#0f0e15] text-[10px] text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-2">이미지</th>
                      <th className="py-3 px-2">브랜드/상품명</th>
                      <th className="py-3 px-2">원화가(KRW)</th>
                      <th className="py-3 px-2">바트가(THB)</th>
                      <th className="py-3 px-2">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-slate-900 hover:bg-slate-900/10">
                        <td className="py-3 px-2">
                          <img src={p.thumbnail_url} alt={p.name} className="w-10 h-10 object-cover rounded border border-slate-800" />
                        </td>
                        <td className="py-3 px-2 max-w-[200px]">
                          <span className="text-[10px] text-emerald-400 block font-bold">{p.brand}</span>
                          <span className="text-slate-100 font-medium truncate block">{p.name}</span>
                        </td>
                        <td className="py-3 px-2 font-mono">{p.price_krw.toLocaleString()}원</td>
                        <td className="py-3 px-2 font-mono text-emerald-400 font-bold">{parseFloat(p.price_thb as any).toLocaleString()} THB</td>
                        <td className="py-3 px-2">
                          <button
                            onClick={() => handleToggleActive(p.id, p.is_active)}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              p.is_active 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {p.is_active ? '판매중' : '비공개'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Categories */}
        {activeTab === 'categories' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass-panel p-6 h-fit flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-900">신규 카테고리 구성</h3>
              <form onSubmit={handleAddCategory} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">카테고리 한글명 *</label>
                  <input
                    type="text"
                    required
                    value={newCatKo}
                    onChange={(e) => setNewCatKo(e.target.value)}
                    placeholder="예: 스킨케어"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">카테고리 영문명 (Thai/English 노출용) *</label>
                  <input
                    type="text"
                    required
                    value={newCatEn}
                    onChange={(e) => setNewCatEn(e.target.value)}
                    placeholder="예: Skincare"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-primary text-slate-950 font-bold rounded-lg uppercase tracking-wider text-xs"
                >
                  카테고리 추가
                </button>
              </form>
            </div>

            <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-900">구성된 카테고리 리스트</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-900/30 border border-slate-900 rounded-lg text-xs">
                    <span className="font-bold text-slate-200 block">{c.name_ko}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{c.name_en}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Tab 4: Users (Staff & Customer Management) */}
        {activeTab === 'users' && (
          <section className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-900">회원 권한 등급 제어 (B2C전용)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-[#0f0e15] text-[10px] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">가입 전화번호 ID</th>
                    <th className="py-3 px-3">가입 일자</th>
                    <th className="py-3 px-3">현재 등급 (Role)</th>
                    <th className="py-3 px-3 text-right">등급 관리</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((user) => (
                    <tr key={user.id} className="border-b border-slate-900 hover:bg-slate-900/10">
                      <td className="py-3 px-3 font-mono font-bold text-slate-200">{user.phone_number}</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(user.created_at).toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === 'admin' 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : user.role === 'staff'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {user.role === 'admin' ? 'Super Admin' : user.role === 'staff' ? 'Staff' : 'Customer (손님)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right flex gap-1.5 justify-end">
                        {user.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleUpdateRole(user.id, 'staff')}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded text-[10px] font-bold"
                            >
                              스탭 위임
                            </button>
                            <button
                              onClick={() => handleUpdateRole(user.id, 'user')}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-[10px] font-bold"
                            >
                              손님 강등
                            </button>
                          </>
                        )}
                        {user.role === 'admin' && (
                          <span className="text-[10px] text-slate-500 italic">변경 불가 (최고 소유자)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 5: Settings */}
        {activeTab === 'settings' && (
          <section className="glass-panel p-6 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-900 mb-4">정산 설정 (Pricing Engine Config)</h3>
            <form onSubmit={handleUpdateSettings} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">기준 환율 (Exchange Rate)</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">1 THB =</span>
                  <input
                    type="number"
                    step="0.1"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-500">KRW</span>
                </div>
              </div>
              
              <div>
                <label className="text-slate-400 block mb-1">구매대행 마진율 (Margin %)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={margin}
                    onChange={(e) => setMargin(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-500">%</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">한타이쉬핑 DDP 요율 (DDP Rate/kg)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ddpFee}
                    onChange={(e) => setDdpFee(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-500">THB/kg</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-lg text-xs uppercase tracking-wider hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all duration-300"
              >
                설정 저장 (Save Settings)
              </button>
            </form>
          </section>
        )}

      </div>
    </div>
  );
}
