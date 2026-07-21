import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

function AdminLayoutNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'orders';

  return (
    <nav className="mt-8 flex flex-col gap-2 text-xs font-bold text-slate-500">
      <span className="text-[9px] uppercase tracking-wider text-slate-400 px-3.5 mb-1 block">관리자 메뉴</span>
      
      <Link
        href="/admin?tab=orders"
        className={`flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${
          activeTab === 'orders' ? 'bg-[#7c3aed]/10 text-[#7c3aed] font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
        }`}
      >
        <span className="text-base">📊</span>
        개요 (Overview)
      </Link>

      <Link
        href="/admin?tab=products"
        className={`flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${
          activeTab === 'products' ? 'bg-[#7c3aed]/10 text-[#7c3aed] font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
        }`}
      >
        <span className="text-base">💄</span>
        전체 상품 (Products)
      </Link>

      <Link
        href="/admin?tab=categories"
        className={`flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${
          activeTab === 'categories' ? 'bg-[#7c3aed]/10 text-[#7c3aed] font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
        }`}
      >
        <span className="text-base">📁</span>
        카테고리 구성 (Categories)
      </Link>

      <Link
        href="/admin?tab=users"
        className={`flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${
          activeTab === 'users' ? 'bg-[#7c3aed]/10 text-[#7c3aed] font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
        }`}
      >
        <span className="text-base">👥</span>
        구매자 관리 (Customers)
      </Link>

      <Link
        href="/admin?tab=settings"
        className={`flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all ${
          activeTab === 'settings' ? 'bg-[#7c3aed]/10 text-[#7c3aed] font-extrabold' : 'hover:bg-slate-50 hover:text-slate-800'
        }`}
      >
        <span className="text-base">⚙️</span>
        정산 설정 (Settings)
      </Link>
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAdminOrStaff, setIsAdminOrStaff] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('Administrator');

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('No user logged in, redirecting to login.');
          router.push('/login?redirect=/admin');
          return;
        }

        // Fetch dynamic role from public.profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, phone_number')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          const fallbackRole = user.user_metadata?.role;
          if (fallbackRole === 'admin' || fallbackRole === 'staff') {
            setIsAdminOrStaff(true);
            setUserRole(fallbackRole);
            setUserName(user.user_metadata?.phone_number || 'Admin');
          } else {
            console.log('No profile role and fallback role not admin/staff.');
          }
        } else {
          if (profile.role === 'admin' || profile.role === 'staff') {
            setIsAdminOrStaff(true);
            setUserRole(profile.role);
            setUserName(profile.phone_number);
          } else {
            console.log(`User role ${profile.role} is not admin/staff.`);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eaedf2] flex flex-col items-center justify-center text-slate-800">
        <div className="w-10 h-10 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-500 font-semibold">관리자 권한 확인 중 (Verifying Authorization)...</p>
      </div>
    );
  }

  if (!isAdminOrStaff) {
    return (
      <div className="min-h-screen bg-[#eaedf2] flex flex-col items-center justify-center text-slate-800 px-4 text-center">
        <span className="text-6xl mb-6">🔒</span>
        <h1 className="text-2xl font-black mb-2 text-slate-800">Access Denied (접근 거부)</h1>
        <p className="text-sm text-slate-500 max-w-md mb-8">
          이 페이지는 관리자(Admin) 또는 스탭(Staff) 계정만 접근할 수 있습니다.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            홈으로 이동
          </button>
          <button
            onClick={() => router.push('/login?redirect=/admin')}
            className="px-6 py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white rounded-lg text-xs font-bold"
          >
            어드민으로 로그인
          </button>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 flex">
      
      {/* Left Sidebar matching 2nd screenshot */}
      <aside className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col justify-between p-4 shrink-0 min-h-screen">
        <div>
          {/* Logo brand box */}
          <div className="flex flex-col items-center py-6 border-b border-slate-100 gap-1">
            <span className="text-lg">🌿</span>
            <span className="font-extrabold text-base tracking-wider text-[#7c3aed] font-display uppercase">
              OLIVE YOUNG THAI
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Manager System
            </span>
          </div>

          {/* Sidebar Menu matching 2nd screenshot */}
          <Suspense fallback={null}>
            <AdminLayoutNav />
          </Suspense>
        </div>

        {/* User Card at bottom left matching 2nd screenshot */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white text-base shadow-sm font-bold">
              👤
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{userName}</span>
              <span className="text-[9px] font-bold text-purple-600 capitalize">{userRole === 'admin' ? 'Super Admin' : 'Staff'}</span>
            </div>
          </div>

          <Link
            href="/"
            className="w-full py-2 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white text-center rounded-lg text-[10px] font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all block"
          >
            메인 쇼핑몰 바로가기
          </Link>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Top Header Bar matching 2nd screenshot */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] px-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-slate-800">📊 관리자 개요</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span>{currentDate}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              로그아웃 (Sign Out)
            </button>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="p-8 flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
