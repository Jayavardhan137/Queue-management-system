'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueue } from '@/context/QueueContext';
import { 
  Lock, 
  Mail, 
  Sparkles, 
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SuperAdminLogin() {
  const router = useRouter();
  const { login } = useQueue();

  const [email, setEmail] = useState('superadmin@queueflow.ai');
  const [password, setPassword] = useState('superpassword');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Direct Super Admin validation logic
      if (email.toLowerCase() === 'superadmin@queueflow.ai' && password === 'superpassword') {
        await login(email, 'Super Admin');
        router.push('/super-admin');
      } else {
        setError('Unauthorized credentials. Please check your Super Admin authority tokens.');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] text-[#f5f5f7] flex flex-col justify-center py-12 px-6 relative">
      {/* Premium radial glowing sphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl h-[450px] pointer-events-none rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-600/10 blur-[130px] opacity-70"></div>

      <div className="max-w-md mx-auto w-full space-y-8 z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Platform Operator Console
          </h2>
          <p className="text-xs text-zinc-500 font-mono tracking-wider">SECURE SUITE • SUPER ADMIN LOCK</p>
        </div>

        {/* Console login box */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6 bg-black/40">
          
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-300 leading-relaxed">
            <span className="font-bold text-white block mb-1">Developer Notice:</span>
            This is the secure login interface for Platform Admins. Credentials have been pre-seeded for testing purposes.
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Admin Email
              </label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 premium-input text-sm text-white"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> Security Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Authenticate & Enter
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors">
              Return to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
