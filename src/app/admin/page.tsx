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
  name_th?: string | null;
  parent_id?: string | null;
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

  // Search & Filter States for Products Tab
  const [prodSearchQuery, setProdSearchQuery] = useState('');
  const [prodFilterCategory, setProdFilterCategory] = useState('');

  // Modals for Products
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New Product Form States
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

  // Category Form States
  const [newCatKo, setNewCatKo] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatTh, setNewCatTh] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');

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
        weight_grams: newWeight,
        is_active: true
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
      setIsAddModalOpen(false);
      
      loadAllData();
    } catch (err: any) {
      alert('상품 등록 에러: ' + err.message);
    }
  };

  // Edit Product Action
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const calculatedThb = calculateThb(editingProduct.price_krw, editingProduct.weight_grams || 200);
    const catObj = categories.find(c => c.id === editingProduct.category_id);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          goods_no: editingProduct.goods_no,
          brand: editingProduct.brand,
          name: editingProduct.name,
          price_krw: editingProduct.price_krw,
          price_thb: calculatedThb,
          weight_grams: editingProduct.weight_grams,
          category_id: editingProduct.category_id || null,
          category_name: catObj ? catObj.name_ko : '',
          thumbnail_url: editingProduct.thumbnail_url,
          detail_description_image: editingProduct.detail_description_image,
          ingredients: editingProduct.ingredients,
          precautions: editingProduct.precautions,
          is_active: editingProduct.is_active
        })
        .eq('id', editingProduct.id);

      if (error) throw error;
      alert('상품 정보가 성공적으로 수정되었습니다!');
      setIsEditModalOpen(false);
      setEditingProduct(null);
      loadAllData();
    } catch (err: any) {
      alert('상품 수정 에러: ' + err.message);
    }
  };

  // Delete Product Action
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`'${name}' 상품을 정말 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('상품이 삭제되었습니다.');
      loadAllData();
    } catch (err: any) {
      alert('상품 삭제 에러: ' + err.message);
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
        name_en: newCatEn,
        name_th: newCatTh || null,
        parent_id: newCatParentId || null
      });

      if (error) throw error;
      alert('카테고리가 추가되었습니다!');
      setNewCatKo('');
      setNewCatEn('');
      setNewCatTh('');
      setNewCatParentId('');
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

  // Filtered Products for Product Tab
  const filteredProducts = products.filter(p => {
    const matchesCategory = !prodFilterCategory || p.category_id === prodFilterCategory;
    const q = prodSearchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.goods_no?.toLowerCase().includes(q)
    );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      
      {/* Responsive Metrics Cards Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[90px] min-w-0">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase truncate">👥 전체 직원</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1 truncate">
            {profiles.filter(p => p.role === 'admin' || p.role === 'staff').length}명
          </span>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[90px] min-w-0">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase truncate">📁 활성 카테고리</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1 truncate">{categories.length}개</span>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[90px] min-w-0">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase truncate">💄 등록 상품</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1 truncate">{products.length}개</span>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[90px] min-w-0">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase truncate">📦 전체 주문</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1 truncate">{orders.length}건</span>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[90px] min-w-0">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase truncate">💰 총 매출 (THB)</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 truncate">
            {totalRevenue.toLocaleString()} <span className="text-xs">฿</span>
          </span>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[90px] min-w-0">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase truncate">⏳ 승인 대기</span>
          <span className="text-xl sm:text-2xl font-black text-rose-500 mt-1 truncate">{pendingCount}건</span>
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
          <div className="flex flex-col gap-6">
            
            {/* Top Action Bar: Search, Category Filter, Add Button */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow max-w-2xl">
                {/* Search Bar */}
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={prodSearchQuery}
                    onChange={(e) => setProdSearchQuery(e.target.value)}
                    placeholder="상품명, 브랜드, 고유번호 검색..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400">🔍</span>
                  {prodSearchQuery && (
                    <button
                      onClick={() => setProdSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={prodFilterCategory}
                  onChange={(e) => setProdFilterCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#7c3aed] font-medium"
                >
                  <option value="">📁 전체 카테고리 ({categories.length}개)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? '└ ' : ''}{c.name_ko} ({c.name_en})
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Product Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] hover:opacity-90 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>➕</span> 신규 상품 등록
              </button>
            </div>

            {/* Product Table Container */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span>💄</span> 등록된 상품 목록
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  총 <strong className="text-[#7c3aed]">{products.length}</strong>개 중 <strong className="text-emerald-600">{filteredProducts.length}</strong>개 표시
                </span>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-wider border-b border-[#e2e8f0]">
                        <th className="py-3 px-3">이미지</th>
                        <th className="py-3 px-3">상품 고유번호</th>
                        <th className="py-3 px-3">브랜드 / 상품명</th>
                        <th className="py-3 px-3">카테고리</th>
                        <th className="py-3 px-3">원화가 (KRW)</th>
                        <th className="py-3 px-3">태국 바트가 (THB)</th>
                        <th className="py-3 px-3">노출 상태</th>
                        <th className="py-3 px-3 text-center">관리 (Action)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3">
                            <img src={p.thumbnail_url} alt={p.name} className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-sm" />
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-500 text-[11px]">
                            {p.goods_no}
                          </td>
                          <td className="py-3 px-3 max-w-[280px]">
                            <span className="text-[10px] font-extrabold text-purple-600 uppercase block tracking-wider">{p.brand}</span>
                            <span className="text-slate-800 font-bold block mt-0.5 leading-tight">{p.name}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-semibold text-[11px]">
                            {p.category_name || '-'}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">
                            {p.price_krw.toLocaleString()}원
                          </td>
                          <td className="py-3 px-3 font-mono text-emerald-600 font-black text-sm">
                            {parseFloat(p.price_thb as any).toLocaleString()} ฿
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleToggleActive(p.id, p.is_active)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                p.is_active 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {p.is_active ? '● 공개 중' : '○ 비공개'}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingProduct({ ...p });
                                  setIsEditModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-[#7c3aed] border border-purple-200 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                              >
                                ✏️ 수정
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                              >
                                🗑️ 삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-xs">
                  검색 조건에 맞는 상품이 존재하지 않습니다.
                </div>
              )}
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
                <div>
                  <label className="text-slate-500 font-bold block mb-1">카테고리 태국어명 (선택)</label>
                  <input
                    type="text"
                    value={newCatTh}
                    onChange={(e) => setNewCatTh(e.target.value)}
                    placeholder="예: ดูแลผิวหน้า"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">상위 카테고리 (대분류)</label>
                  <select
                    value={newCatParentId}
                    onChange={(e) => setNewCatParentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="">없음 (대분류로 생성)</option>
                    {categories.filter(c => !c.parent_id).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name_ko} ({cat.name_en})</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-bold rounded-lg uppercase tracking-wider text-xs cursor-pointer hover:opacity-90 transition-opacity"
                >
                  카테고리 생성
                </button>
              </form>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 lg:col-span-2 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 mb-4 pb-2 border-b border-slate-100">구성된 카테고리 목록</h3>
              <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                {categories.filter(c => !c.parent_id).map((main) => {
                  const subs = categories.filter(c => c.parent_id === main.id);
                  return (
                    <div key={main.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex justify-between items-center mb-3 pb-1.5 border-b border-slate-100">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{main.name_ko}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{main.name_en}</span>
                          {main.name_th && (
                            <span className="text-[9px] text-teal-600 font-bold">{main.name_th}</span>
                          )}
                        </div>
                        <span className="text-[9px] bg-slate-200/80 text-slate-600 font-black px-2 py-0.5 rounded-full">
                          소분류 {subs.length}개
                        </span>
                      </div>
                      {subs.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {subs.map((sub) => (
                            <div key={sub.id} className="p-2.5 bg-white border border-slate-200 rounded-lg hover:border-[#7c3aed]/30 hover:shadow-sm transition-all flex flex-col justify-center">
                              <span className="font-bold text-slate-700 text-[11px]">{sub.name_ko}</span>
                              <div className="flex flex-col mt-0.5">
                                <span className="text-[8px] text-slate-400 uppercase font-semibold">{sub.name_en}</span>
                                {sub.name_th && (
                                  <span className="text-[8px] text-teal-600 font-bold">{sub.name_th}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">등록된 하위 소분류가 없습니다.</p>
                      )}
                    </div>
                  );
                })}
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
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 rounded text-[9px] font-bold cursor-pointer"
                            >
                              스탭 부여
                            </button>
                            <button
                              onClick={() => handleUpdateRole(user.id, 'user')}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded text-[9px] font-bold cursor-pointer"
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
                className="w-full py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-bold rounded-lg uppercase tracking-wider text-xs shadow-md cursor-pointer hover:opacity-90"
              >
                정산 설정 저장
              </button>
            </form>
          </div>
        )}
      </div>

      {/* --- ADD PRODUCT MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">➕ 신규 상품 등록</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>
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
                    onChange={(e) => setNewPriceKrw(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">무게(g)</label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(parseInt(e.target.value) || 200)}
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
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? '└ ' : ''}{c.name_ko} ({c.name_en})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">썸네일 이미지 URL (선택)</label>
                <input
                  type="text"
                  value={newThumbnail}
                  onChange={(e) => setNewThumbnail(e.target.value)}
                  placeholder="미입력 시 올리브영 기본 이미지 자동 생성"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                />
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
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-bold rounded-lg text-xs"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL --- */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">✏️ 상품 정보 수정</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>
            <form onSubmit={handleUpdateProduct} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">올리브영 상품 고유번호 (Goods No) *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.goods_no}
                  onChange={(e) => setEditingProduct({ ...editingProduct, goods_no: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">브랜드명 (Brand) *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.brand}
                  onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">상품명 (Product Name) *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 font-bold block mb-1">원화가(KRW) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price_krw}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price_krw: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-bold block mb-1">무게(g)</label>
                  <input
                    type="number"
                    value={editingProduct.weight_grams || 200}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weight_grams: parseInt(e.target.value) || 200 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">카테고리</label>
                <select
                  value={editingProduct.category_id || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="">카테고리 선택...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? '└ ' : ''}{c.name_ko} ({c.name_en})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">썸네일 이미지 URL</label>
                <input
                  type="text"
                  value={editingProduct.thumbnail_url || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, thumbnail_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">전성분 정보 (Ingredients)</label>
                <textarea
                  value={editingProduct.ingredients || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, ingredients: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-[#7c3aed] resize-none"
                />
              </div>
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingProduct.is_active}
                  onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#7c3aed] border-slate-300 rounded"
                />
                <label htmlFor="editIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  쇼핑몰에 공개 (공개 중)
                </label>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-bold rounded-lg text-xs"
                >
                  수정 저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-xs text-slate-400 font-semibold">
        관리자 대시보드 불러오는 중...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
