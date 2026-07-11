'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueue } from '@/context/QueueContext';
import { 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  Building,
  Mail,
  Calendar,
  Lock,
  ArrowLeft
} from 'lucide-react';

function SuccessScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId') || '';

  const { fetchOwnOrgProfile } = useQueue();
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    if (orgId) {
      fetchOwnOrgProfile(orgId).then(found => {
        if (found) setOrg(found);
      });
    }
  }, [orgId]);

  if (!org) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="text-zinc-500 font-mono uppercase tracking-widest text-xs animate-pulse">
          Fetching verification profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex items-center justify-center p-6 relative">
      {/* Background highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] pointer-events-none rounded-full bg-emerald-500/5 blur-[120px]"></div>

      <div className="w-full max-w-xl p-8 rounded-3xl glass-panel border border-emerald-500/20 text-center space-y-6 z-10">
        
        {/* Success Icon */}
        <div className="inline-flex p-4 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/25">
          <CheckCircle className="w-12 h-12" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Registration & Payment Complete!</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Thank you for registering <span className="text-white font-bold">{org.name}</span>. Your billing transaction was approved, and your tenant profile is set up.
          </p>
        </div>

        {/* Status Badge */}
        <div className="py-2.5 px-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold inline-block text-xs uppercase tracking-wider">
          Pending Super Admin Verification
        </div>

        {/* Summary Card */}
        <div className="bg-white/5 rounded-2xl p-5 text-left border border-white/5 space-y-3.5 text-xs">
          <h4 className="font-bold text-[10px] text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" /> Workspace Onboarding Summary
          </h4>
          
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-white/5 pt-3">
            <div>
              <span className="text-zinc-500 block">Registration Ref ID:</span>
              <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded text-[10px]">{org.id}</code>
            </div>
            <div>
              <span className="text-zinc-500 block">Subscription Tier:</span>
              <span className="text-white font-semibold">{org.subscriptionPlan || 'Starter'}</span>
            </div>
            <div className="mt-1">
              <span className="text-zinc-500 block">Admin Email:</span>
              <span className="text-white flex items-center gap-1"><Mail className="w-3 h-3 text-zinc-500" /> {org.email}</span>
            </div>
            <div className="mt-1">
              <span className="text-zinc-500 block">Next Renewal / Expiry:</span>
              <span className="text-white flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-500" /> 
                {org.subscriptionExpiry ? new Date(org.subscriptionExpiry).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Action description */}
        <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-[11px] leading-relaxed text-zinc-400 text-left space-y-2">
          <p className="font-bold text-white flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-400" /> Dashboard Lock Activated
          </p>
          <p>
            For safety, your Organization Admin dashboard logins will remain locked until the platform Super Admin reviews your uploaded files and certificates.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button 
            onClick={() => router.push('/login')}
            className="py-3.5 px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/20"
          >
            Go to Login <ArrowRight className="w-4 h-4" />
          </button>
          <Link 
            href="/"
            className="py-3.5 px-6 text-xs font-bold rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function RegisterSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="text-zinc-500 font-mono uppercase tracking-widest text-xs animate-pulse">Loading Summary...</div>
      </div>
    }>
      <SuccessScreen />
    </Suspense>
  );
}
