'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQueue } from '@/context/QueueContext';
import { Mail, Sparkles, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const { forgotPassword } = useQueue();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await forgotPassword(email);
    setIsLoading(false);
    if (result.ok) {
      setSubmitted(true);
    } else {
      setError(result.message || 'Something went wrong. Please try again.');
    }
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
          <h2 className="text-3xl font-extrabold tracking-tight">Reset Your Password</h2>
          <p className="text-sm text-zinc-400">Enter your account email and we'll send you a reset link.</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-white">Check your inbox</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                If an account exists for <span className="text-white font-semibold">{email}</span>, a password reset link has been sent. It expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          <p className="text-xs text-zinc-500 text-center pt-2 border-t border-white/5">
            <Link href="/login" className="text-indigo-400 hover:underline font-semibold inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
