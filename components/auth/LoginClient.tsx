'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginClient() {
  const [loading, setLoading] = useState(false);

  function handleGoogleSignIn() {
    setLoading(true);
    signIn('google', { callbackUrl: '/' });
  }

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A3E635] text-black text-2xl font-black shadow-lg shadow-[#A3E635]/20">
            A
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Agency OS</h1>
            <p className="text-sm text-zinc-500 mt-1">
              AI-powered marketing operations platform
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#2E2E2E] bg-[#1E1E1E] p-8 space-y-6">

          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-zinc-200">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-500">
              Sign in to your agency dashboard
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#3A3A3A] bg-[#252525] px-4 py-3 text-sm font-medium text-zinc-200 hover:border-[#525252] hover:bg-[#2A2A2A] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              <GoogleIcon />
            )}

            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="text-xs text-center text-zinc-600">
            By signing in, you agree to our{' '}
            <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
              Terms
            </span>{' '}
            and{' '}
            <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
              Privacy Policy
            </span>
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '⚡', label: '11 AI Agents' },
            { icon: '◈', label: 'Project OS' },
            { icon: '◇', label: 'Deliverables' },
          ].map((f) => (
            <div
              key={f.label}
              className="text-center rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] py-3 px-2"
            >
              <span className="text-lg block mb-1">{f.icon}</span>
              <span className="text-[10px] text-zinc-500">{f.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}