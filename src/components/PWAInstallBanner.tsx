'use client';

import React, { useState, useEffect } from 'react';

export default function PWAInstallBanner() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect platform
    const ua = navigator.userAgent.toLowerCase();
    const isIphone = /iphone|ipad|ipod/.test(ua);
    const isAnd = /android/.test(ua);

    // 2. Check if already installed / running in standalone mode
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    let isPwaQuery = false;
    if (window.location.search.includes('pwa=true')) {
      isPwaQuery = true;
      sessionStorage.setItem('is_pwa_session', 'true');
    } else if (sessionStorage.getItem('is_pwa_session') === 'true') {
      isPwaQuery = true;
    }

    const isAlreadyInstalled = isIOSStandalone || isDisplayStandalone || isPwaQuery;

    if (isAlreadyInstalled) return;

    if (isIphone) {
      setIsIOS(true);
      // Show iOS banner after a short delay (e.g. 2 seconds)
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('pwa_ios_banner_dismissed');
        if (!dismissed) {
          setShowBanner(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (isAnd) {
      setIsAndroid(true);
      
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        const dismissed = localStorage.getItem('pwa_android_banner_dismissed');
        if (!dismissed) {
          setShowBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (isIOS) {
      localStorage.setItem('pwa_ios_banner_dismissed', 'true');
    } else if (isAndroid) {
      localStorage.setItem('pwa_android_banner_dismissed', 'true');
    }
  };

  if (!showBanner) return null;

  return (
    <div 
      className="pwa-install-banner animate-slide-up"
      style={{
        position: 'fixed',
        bottom: '84px', // Float above bottom navigation tabs
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: '400px',
        background: 'rgba(24, 24, 27, 0.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.3)', // Emerald-themed border
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        color: '#fff',
        textAlign: 'left',
        fontFamily: 'sans-serif'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📱 OLIVE YOUNG THAI 추가
        </h4>
        <button 
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '15px',
            padding: '2px',
            lineHeight: 1
          }}
        >
          ✕
        </button>
      </div>

      {isIOS && (
        <div style={{ fontSize: '11.5px', lineHeight: 1.5, color: '#e2e8f0' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            바탕화면에 앱을 설치하고 보다 빠르고 편하게 이용해 보세요! / ติดตั้งแอปบนหน้าจอหลักเพื่อการใช้งานที่รวดเร็วยิ่งขึ้น!
          </p>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <strong style={{ color: '#10b981' }}>💡 아이폰 설치 방법 / วิธีการติดตั้ง iPhone:</strong>
            <ol style={{ margin: '4px 0 0 0', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>사파리(Safari) 하단의 [공유 📤] 버튼을 누릅니다. / กดปุ่ม [แชร์ 📤] ด้านล่างของ Safari</li>
              <li>메뉴를 스크롤해 [홈 화면에 추가 ➕]를 누릅니다. / เลื่อนลงแล้วเลือก [เพิ่มไปยังหน้าจอโฮม ➕]</li>
              <li>우측 상단의 [추가] 버튼을 누릅니다. / กดปุ่ม [เพิ่ม] ที่มุมขวาบน</li>
            </ol>
          </div>
        </div>
      )}

      {isAndroid && (
        <div style={{ fontSize: '11.5px', lineHeight: 1.5, color: '#e2e8f0' }}>
          <p style={{ margin: '0 0 10px 0' }}>
            바탕화면에 안전하고 쾌적한 공식 앱을 설치해 보세요! / ติดตั้งแอปอย่างเป็นทางการที่ปลอดภัยและรวดเร็วบนหน้าจอหลักของคุณ!
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button 
              onClick={handleAndroidInstall}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: '#fff',
                border: 'none',
                padding: '9px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              🚀 안심 설치하기 / ติดตั้งแอป
            </button>
            <button 
              onClick={handleDismiss}
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '9px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              나중에 / ไว้ทีหลัง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
