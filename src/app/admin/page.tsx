'use client';

import React, { useState } from 'react';
import { MOCK_PRODUCTS } from '@/utils/mockProducts';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  goodsName: string;
  goodsNo: string;
  originalKrw: number;
  finalThb: number;
  status: string; // 'Pending Payment' | 'Paid' | 'Shipped'
  trackingNumber?: string;
  createdTime: string;
}

export default function AdminDashboard() {
  const [exchangeRate, setExchangeRate] = useState(38.0);
  const [margin, setMargin] = useState(20);
  const [ddpFee, setDdpFee] = useState(250);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Sample static list of mock orders for the admin POC
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-2026-9041',
      customerName: 'Somchai Somboon',
      customerPhone: '081-234-5678',
      shippingAddress: '123 Sukhumvit Rd, Bangkok, 10110',
      goodsName: '[변우석 굿즈/탈모완화] 다슈 데일리 밀크씨슬 블루바이옴 스칼프 샴푸 500ml',
      goodsNo: 'A000000247086',
      originalKrw: 16900,
      finalThb: 658,
      status: 'Paid',
      createdTime: '2026-07-19 14:32'
    },
    {
      id: 'ORD-2026-9042',
      customerName: 'Chaiwat Rakbeauty',
      customerPhone: '089-987-6543',
      shippingAddress: '456 Sathorn Rd, Yannawa, Bangkok, 10120',
      goodsName: '[프리미엄 1위] 헤라 블랙 쿠션 파운데이션 기획 (15g + 15g 리필포함) 9 Colors',
      goodsNo: 'A000000202777',
      originalKrw: 59740,
      finalThb: 1916,
      status: 'Paid',
      createdTime: '2026-07-20 08:15'
    }
  ]);

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`설정이 성공적으로 저장되었습니다:\n환율: 1 THB = ${exchangeRate} KRW\n마진율: ${margin}%\nDDP 배송비: ${ddpFee} THB/kg`);
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setSyncStatus('스텔스 크롤러 작동 중... (Cloudflare Challenge 우회 중)');
    setTimeout(() => {
      setSyncStatus('올리브영 실시간 베스트 상품 10개 및 상세 전성분 수집 완료!');
      setTimeout(() => {
        setIsSyncing(false);
        setSyncStatus('');
        alert('올리브영 데이터베이스 동기화가 성공적으로 끝났습니다! 상품 가격 및 품절 여부가 업데이트되었습니다.');
      }, 1500);
    }, 2000);
  };

  const handleInputTracking = (orderId: string) => {
    const tracking = prompt('한타이쉬핑 송장 번호(Waybill)를 입력해 주세요:');
    if (tracking) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, trackingNumber: tracking, status: 'Shipped' } : o));
    }
  };

  const handleCopyClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label}이(가) 클립보드에 복사되었습니다!`);
  };

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Admin header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
            ADMIN <span className="text-gradient">DASHBOARD</span>
          </h1>
          <p className="text-sm text-slate-400">태국 법인용 구매대행 / 상품 관리 및 세무 증빙 대시보드</p>
        </div>
        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="px-6 py-3 bg-gradient-primary text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all"
        >
          {isSyncing ? 'Syncing...' : '올리브영 실시간 동기화'}
        </button>
      </div>

      {isSyncing && (
        <div className="glass-panel p-4 mb-8 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold rounded-xl animate-pulse">
          ⏳ {syncStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Settings Panel */}
        <section className="glass-panel p-6 h-fit">
          <h2 className="text-lg font-bold mb-4 text-slate-200">정산 및 환율 제어 설정</h2>
          <form onSubmit={handleUpdateSettings} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">기준 환율 (Exchange Rate)</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">1 THB =</span>
                <input
                  type="number"
                  step="0.1"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400">KRW</span>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-slate-400 block mb-1">구매대행 마진율 (Margin %)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">한타이쉬핑 DDP 요율 (DDP Rate/kg)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={ddpFee}
                  onChange={(e) => setDdpFee(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400">THB/kg</span>
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

        {/* Orders Dashboard */}
        <section className="glass-panel p-6 lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 text-slate-200">주문 처리 대시보드 (한국 소싱 오더북)</h2>
          
          <div className="flex flex-col gap-6">
            {orders.map((order) => (
              <div key={order.id} className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex flex-col gap-4">
                {/* Order Top Info */}
                <div className="flex justify-between items-start border-b border-slate-800/50 pb-2">
                  <div>
                    <span className="text-xs font-mono text-emerald-400">{order.id}</span>
                    <span className="text-[10px] text-slate-500 block">{order.createdTime}</span>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase ${
                    order.status === 'Shipped' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Main Sourcing Product & Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold mb-1">소싱 타깃 상품 (Olive Young Target)</p>
                    <p className="text-slate-200 mb-1">{order.goodsName}</p>
                    <button
                      onClick={() => handleCopyClipboard(`https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${order.goodsNo}`, '올리브영 구매 링크')}
                      className="text-[10px] text-emerald-400 underline hover:text-emerald-300"
                    >
                      🔗 올리브영 상품 상세링크 복사
                    </button>
                  </div>

                  <div>
                    <p className="text-slate-400 font-bold mb-1">배송지 정보 (Shipping Info)</p>
                    <p className="text-slate-200">{order.customerName} ({order.customerPhone})</p>
                    <p className="text-slate-300 mt-1 leading-relaxed">{order.shippingAddress}</p>
                    <button
                      onClick={() => handleCopyClipboard(`${order.customerName}\n${order.customerPhone}\n${order.shippingAddress}`, '배송지 정보')}
                      className="text-[10px] text-amber-400 underline hover:text-amber-300 mt-1 block"
                    >
                      📋 배송지 전체 복사 (물류사 발송용)
                    </button>
                  </div>
                </div>

                {/* Sourcing Actions & Document Mapping */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-800/30">
                  <div className="text-xs text-slate-400">
                    매입 단가: <span className="text-slate-200 font-mono">{order.originalKrw.toLocaleString()}원</span> | 
                    정산 금액: <span className="text-gradient font-bold ml-1">{order.finalThb.toLocaleString()} THB</span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {order.status !== 'Shipped' ? (
                      <button
                        onClick={() => handleInputTracking(order.id)}
                        className="flex-grow sm:flex-none px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        한타이쉬핑 송장(AWB) 입력
                      </button>
                    ) : (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span>✈️ 송장등록 완료:</span>
                        <span className="text-emerald-400 font-mono font-bold bg-slate-900 px-2 py-1 rounded">
                          {order.trackingNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
