'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isNewUserMsg, setIsNewUserMsg] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const redirectUrl = searchParams.get('redirect') || '/';

  // Check if user is already logged in
  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    }
    getSession();
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setIsNewUserMsg(false);

    // Clean phone number (leave only digits)
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 8) {
      setErrorMsg('유효한 전화번호를 입력해 주세요 (8자리 이상).');
      setLoading(false);
      return;
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setErrorMsg('비밀번호는 4자리 숫자여야 합니다.');
      setLoading(false);
      return;
    }

    // Synthetic email and password mapping
    const email = `${cleanPhone}@kbeauty-thai.com`;
    const password = `pin-${pin}`;

    try {
      // 1. Try Signing In
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // 2. If user doesn't exist, register them automatically (Frictionless signup)
        if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('Email not confirmed')) {
          console.log('Attempting auto-registration for new user...');
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                phone_number: phone,
                role: 'user', // default role
              }
            }
          });

          if (signUpError) {
            throw new Error('로그인/가입 실패: ' + signUpError.message);
          }

          if (signUpData?.user) {
            setIsNewUserMsg(true);
            // Sign in again with newly created account
            const { error: secondSignInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (secondSignInError) throw secondSignInError;
            
            router.push('/');
            router.refresh();
            return;
          }
        }
        throw signInError;
      }

      if (signInData?.user) {
        // Sign-in successful. Check role
        const userRole = signInData.user.user_metadata?.role;
        if (userRole === 'admin') {
          router.push('/admin');
        } else {
          router.push(redirectUrl);
        }
        router.refresh();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || '인증 과정 중 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setLoading(false);
    router.refresh();
  };

  // If user is already logged in, show active session profile
  if (currentUser) {
    const isAdmin = currentUser.user_metadata?.role === 'admin';
    return (
      <div className="p-8 flex flex-col justify-center min-h-[70vh]">
        <div className="glass-panel p-6 text-center">
          <span className="text-4xl mb-4 block">✨</span>
          <h2 className="text-xl font-bold mb-2">Member Logged In</h2>
          <p className="text-xs text-slate-400 mb-6">
            로그인된 번호: {currentUser.user_metadata?.phone_number || currentUser.email?.split('@')[0]}
          </p>

          <div className="p-4 bg-slate-900/50 rounded-xl mb-8 text-xs flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Account Type:</span>
              <span className={`font-bold ${isAdmin ? 'text-emerald-400' : 'text-slate-200'}`}>
                {isAdmin ? '관리자 (Admin)' : '일반 회원 (Customer)'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="w-full py-3 bg-gradient-primary rounded-xl font-bold text-slate-950 text-xs tracking-wider uppercase"
              >
                Go to Admin Dashboard (어드민 바로가기)
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-slate-200 text-xs tracking-wider uppercase hover:bg-slate-700"
            >
              Sign Out (로그아웃)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col justify-center min-h-[70vh]">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold mb-2 text-slate-100">Sign In (간편 로그인)</h2>
        <p className="text-xs text-slate-400 mb-8">
          태국 전화번호와 4자리 숫자로 간편하게 로그인/가입하실 수 있습니다.
        </p>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg mb-6">
            ⚠️ {errorMsg}
          </div>
        )}

        {isNewUserMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg mb-6">
            🎉 회원 가입이 자동으로 완료되었습니다! 환영합니다.
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1.5">
              전화번호 (Phone Number)
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081-234-5678"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1.5">
              비밀번호 4자리 (4-digit PIN)
            </label>
            <input
              type="password"
              required
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d]/g, '');
                setPin(val);
              }}
              placeholder="••••"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 text-center tracking-widest focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-gradient-primary rounded-xl font-bold text-slate-950 text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Processing...' : 'Login / Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#08070d] flex flex-col items-center justify-center text-slate-100">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-xs text-slate-400">Loading Login Form...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
