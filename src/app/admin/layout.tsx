'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAdminOrStaff, setIsAdminOrStaff] = useState(false);
  const [userRole, setUserRole] = useState('');

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
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          // Fallback to metadata role if profile fetch fails
          const fallbackRole = user.user_metadata?.role;
          if (fallbackRole === 'admin' || fallbackRole === 'staff') {
            setIsAdminOrStaff(true);
            setUserRole(fallbackRole);
          } else {
            console.log('No profile role and fallback role not admin/staff.');
          }
        } else {
          if (profile.role === 'admin' || profile.role === 'staff') {
            setIsAdminOrStaff(true);
            setUserRole(profile.role);
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
      <div className="min-h-screen bg-[#08070d] flex flex-col items-center justify-center text-slate-100">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-400">관리자 권한 확인 중 (Verifying Authorization)...</p>
      </div>
    );
  }

  if (!isAdminOrStaff) {
    return (
      <div className="min-h-screen bg-[#08070d] flex flex-col items-center justify-center text-slate-100 px-4 text-center">
        <span className="text-6xl mb-6">🔒</span>
        <h1 className="text-2xl font-bold mb-2">Access Denied (접근 거부)</h1>
        <p className="text-sm text-slate-400 max-w-md mb-8">
          이 페이지는 관리자(Admin) 또는 스탭(Staff) 계정만 접근할 수 있습니다.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-700"
          >
            홈으로 이동
          </button>
          <button
            onClick={() => router.push('/login?redirect=/admin')}
            className="px-6 py-2.5 bg-gradient-primary text-slate-950 rounded-lg text-xs font-bold"
          >
            어드민으로 로그인
          </button>
        </div>
      </div>
    );
  }

  // Render children in full-width container for desktop view
  return (
    <div className="min-h-screen bg-[#08070d] text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-900 bg-[#0e0d16]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍀</span>
            <span className="font-extrabold text-sm tracking-wider">
              OLIVE YOUNG THAI <span className="text-gradient">ADMIN ({userRole.toUpperCase()})</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="text-xs text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-all"
            >
              Sign Out (로그아웃)
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
