'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueue } from '@/context/QueueContext';
import {
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { login } = useQueue();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.ok) {
      // If subscription/trial expired, redirect to payment page instead of dashboard
      if ((result as any).subscriptionExpired) {
        router.push(`/payment?orgId=${(result as any).organizationId}&plan=Starter`);
        return;
      }

      // Re-read the saved user to decide where to route (role is set by the server)
      const saved = localStorage.getItem('qflow_user');
      const user = saved ? JSON.parse(saved) : null;

      if (user?.role === 'Super Admin') {
        router.push('/super-admin');
      } else {
        router.push('/admin');
      }
    } else {
      setError(result.message || 'Invalid email or password.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex flex-col justify-center py-12 px-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] pointer-events-none rounded-full bg-indigo-500/10 blur-[120px]"></div>

      <div className="max-w-md mx-auto w-full space-y-8 z-10">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight text-white mb-2">
            <span className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </span>
            <span>QueueFlow AI</span>
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight">Access Your Console</h2>
          <p className="text-sm text-zinc-400">Manage queues, generate QR cards, and inspect daily analytics.</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</label>
              <input
                type="email"
                placeholder="yourname@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 premium-input text-sm text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Password</label>
                <Link href="/forgot-password" className="text-[10px] text-indigo-400 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 premium-input text-sm text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-xs text-zinc-500 text-center">
            New business partner? <Link href="/register" className="text-indigo-400 hover:underline font-semibold">Register your organization</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
