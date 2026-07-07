'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueue } from '@/context/QueueContext';
import { 
  Lock, 
  Mail, 
  Sparkles, 
  UserSquare2,
  Building,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { login, organizations } = useQueue();

  const [role, setRole] = useState<'Super Admin' | 'Organization Admin'>('Organization Admin');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter organizations based on status for helper login
  const activeOrgs = organizations.filter(o => o.status === 'Approved');
  const pendingOrgs = organizations.filter(o => o.status === 'Pending');
  const rejectedOrgs = organizations.filter(o => o.status === 'Rejected');
  const suspendedOrgs = organizations.filter(o => o.status === 'Suspended');

  // Handle selected org auto fill
  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    setError('');
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setEmail(org.email);
      setPassword('password123'); // seed password
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (role === 'Super Admin') {
        if (email.toLowerCase().includes('admin') && password) {
          await login(email, 'Super Admin');
          router.push('/super-admin');
        } else {
          setError('Invalid Super Admin credentials. Hint: use any email with "admin" and any password.');
        }
      } else {
        if (!selectedOrgId) {
          setError('Please select your organization to log in.');
          setIsLoading(false);
          return;
        }

        const org = organizations.find(o => o.id === selectedOrgId);
        if (!org) {
          setError('Selected organization not found.');
          setIsLoading(false);
          return;
        }

        if (org.status === 'Pending') {
          setError('This organization is currently Pending Verification. Log in as Super Admin first to approve it.');
          setIsLoading(false);
          return;
        }

        if (org.status === 'Rejected') {
          setError('This organization registration has been Rejected. Please contact platform support.');
          setIsLoading(false);
          return;
        }

        if (org.status === 'Suspended') {
          setError('This organization has been suspended. Please contact platform support.');
          setIsLoading(false);
          return;
        }

        // Successfully logged in
        await login(email, 'Organization Admin', selectedOrgId);
        router.push('/admin');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex flex-col justify-center py-12 px-6 relative">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] pointer-events-none rounded-full bg-indigo-500/10 blur-[120px]"></div>

      <div className="max-w-md mx-auto w-full space-y-8 z-10">
        {/* Header */}
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

        {/* Console Box */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          
          {/* Console Role Toggler */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
              type="button"
              onClick={() => {
                setRole('Organization Admin');
                setSelectedOrgId('');
                setEmail('');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${role === 'Organization Admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              <Building className="w-3.5 h-3.5" /> Org Admin
            </button>
            <button 
              type="button"
              onClick={() => {
                setRole('Super Admin');
                setSelectedOrgId('');
                setEmail('superadmin@queueflow.ai');
                setPassword('superpassword');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${role === 'Super Admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            
            {/* Org admin select helper */}
            {role === 'Organization Admin' && (
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <UserSquare2 className="w-3.5 h-3.5" /> Select Organization
                </label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full p-3 premium-input text-sm text-white flex justify-between items-center bg-[#121212] border-white/10 hover:bg-white/5 transition-all text-left cursor-pointer"
                >
                  <span>
                    {organizations.find(o => o.id === selectedOrgId) 
                      ? `${organizations.find(o => o.id === selectedOrgId)?.name} (${organizations.find(o => o.id === selectedOrgId)?.businessType})`
                      : '-- Choose registered company --'}
                  </span>
                  <span className="text-zinc-500 text-xs">&#9662;</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full max-h-64 overflow-y-auto rounded-2xl bg-[#0f0f11] border border-white/10 shadow-2xl divide-y divide-white/5 scrollbar-thin scrollbar-thumb-zinc-800">
                    
                    {activeOrgs.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/5">
                          Approved (Ready for login)
                        </div>
                        {activeOrgs.map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              handleOrgChange(o.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full p-3 text-left text-xs flex items-center justify-between transition-all hover:bg-indigo-600/10 hover:text-indigo-400 cursor-pointer ${
                              selectedOrgId === o.id ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-zinc-300'
                            }`}
                          >
                            <span>{o.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{o.businessType}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {pendingOrgs.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/5">
                          Pending (Log in blocked)
                        </div>
                        {pendingOrgs.map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              handleOrgChange(o.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full p-3 text-left text-xs flex items-center justify-between transition-all hover:bg-indigo-600/10 hover:text-indigo-400 cursor-pointer ${
                              selectedOrgId === o.id ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-zinc-300'
                            }`}
                          >
                            <span>{o.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Pending</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {rejectedOrgs.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/5">
                          Rejected (Log in blocked)
                        </div>
                        {rejectedOrgs.map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              handleOrgChange(o.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full p-3 text-left text-xs flex items-center justify-between transition-all hover:bg-indigo-600/10 hover:text-indigo-400 cursor-pointer ${
                              selectedOrgId === o.id ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-zinc-300'
                            }`}
                          >
                            <span>{o.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">Rejected</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {suspendedOrgs.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-white/5">
                          Suspended (Log in blocked)
                        </div>
                        {suspendedOrgs.map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              handleOrgChange(o.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full p-3 text-left text-xs flex items-center justify-between transition-all hover:bg-indigo-600/10 hover:text-indigo-400 cursor-pointer ${
                              selectedOrgId === o.id ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-zinc-300'
                            }`}
                          >
                            <span>{o.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">Suspended</span>
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
                )}
                
                <p className="text-[10px] text-zinc-500">
                  Select a business above to simulate login. Password will autofill.
                </p>
              </div>
            )}

            {/* Email Address */}
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

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Password</label>
                <a href="#" className="text-[10px] text-indigo-400 hover:underline">Forgot password?</a>
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {role === 'Organization Admin' && (
            <p className="text-xs text-zinc-500 text-center">
              New business partner? <Link href="/register" className="text-indigo-400 hover:underline font-semibold">Register your organization</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
