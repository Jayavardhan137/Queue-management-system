'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueue, PublicOrgInfo } from '@/context/QueueContext';
import {
  Building2,
  User,
  Phone,
  FileText,
  Mail,
  Sparkles,
  Bell,
  ArrowLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface TrackData {
  tokenNumber: string;
  status: 'Waiting' | 'Serving' | 'Completed' | 'Skipped';
  currentServingToken: string;
  peopleAhead: number;
  estimatedWaitMinutes: number;
}

export default function QueuePortal() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { bookToken, trackToken, fetchPublicOrgInfo } = useQueue();

  const orgId = params.orgId as string;
  const ticketIdParam = searchParams.get('ticketId');

  const [org, setOrg] = useState<PublicOrgInfo | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgNotFound, setOrgNotFound] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Active ticket tracking
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [trackData, setTrackData] = useState<TrackData | null>(null);

  const refreshOrg = useCallback(async () => {
    const info = await fetchPublicOrgInfo(orgId);
    if (!info) {
      setOrgNotFound(true);
    } else {
      setOrg(info);
    }
    setOrgLoading(false);
  }, [orgId]);

  const refreshTracking = useCallback(async (ticketId: string) => {
    const data = await trackToken(ticketId);
    if (data && !data.error) {
      setTrackData(data);
    }
  }, []);

  // Determine which ticket to track: URL param takes priority, else saved local ticket
  useEffect(() => {
    const idToUse = ticketIdParam || localStorage.getItem(`qflow_active_ticket_${orgId}`);
    if (idToUse) {
      setActiveTicketId(idToUse);
    }
  }, [ticketIdParam, orgId]);

  // Poll org info every 6s
  useEffect(() => {
    refreshOrg();
    const interval = setInterval(refreshOrg, 6000);
    return () => clearInterval(interval);
  }, [refreshOrg]);

  // Poll active ticket tracking every 5s
  useEffect(() => {
    if (activeTicketId) {
      refreshTracking(activeTicketId);
      const interval = setInterval(() => refreshTracking(activeTicketId), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTicketId, refreshTracking]);

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <p className="text-sm text-zinc-400">Loading queue portal...</p>
      </div>
    );
  }

  if (orgNotFound || !org) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Building2 className="w-12 h-12 text-zinc-500" />
        <h2 className="text-xl font-bold">Organization Not Found</h2>
        <p className="text-sm text-zinc-400 max-w-xs">The queue link you followed appears to be invalid or has expired.</p>
        <Link href="/" className="px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white">Back to Home</Link>
      </div>
    );
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10) {
      setBookingError('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    setIsBooking(true);
    setBookingError('');

    const result = await bookToken(orgId, name, phone, email, purpose);
    if (result.ok && result.token) {
      localStorage.setItem(`qflow_active_ticket_${orgId}`, result.token.id);
      setActiveTicketId(result.token.id);
      router.push(`/queue/${orgId}?ticketId=${result.token.id}`);
    } else {
      setBookingError(result.message || 'Failed to book a token. Please try again.');
    }
    setIsBooking(false);
  };

  const handleClearTicket = () => {
    localStorage.removeItem(`qflow_active_ticket_${orgId}`);
    setActiveTicketId(null);
    setTrackData(null);
    router.push(`/queue/${orgId}`);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex flex-col justify-between py-6 px-6">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] pointer-events-none rounded-full bg-indigo-500/10 blur-[130px]"></div>

      <div className="max-w-md mx-auto w-full space-y-6">

        <div className="flex justify-between items-center">
          <Link href="/" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" /> QueueFlow Client
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-white/5 flex items-center gap-3">
          <span className="text-3xl p-1.5 bg-white/5 rounded-2xl border border-white/5">{org.logoUrl || '🏢'}</span>
          <div>
            <h3 className="font-extrabold text-white">{org.name}</h3>
            <p className="text-xs text-zinc-500">{org.businessType} | {org.address}</p>
          </div>
        </div>

        {activeTicketId && trackData ? (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl glass-panel border border-indigo-500/20 bg-gradient-to-tr from-indigo-500/5 to-transparent relative overflow-hidden space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Live Position Tracker</span>
                {trackData.status === 'Serving' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">Your Turn Now</span>
                ) : trackData.status === 'Waiting' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Waiting In Line</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Session Ended</span>
                )}
              </div>

              <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Your Assigned Token</span>
                <h1 className="text-6xl font-extrabold text-white tracking-tight mt-1 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {trackData.tokenNumber}
                </h1>
              </div>

              {trackData.status === 'Waiting' && (
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">People Ahead</p>
                    <p className="text-2xl font-bold mt-1 text-white">{trackData.peopleAhead}</p>
                  </div>
                  <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Estimated Wait</p>
                    <p className="text-2xl font-bold mt-1 text-indigo-400">{trackData.estimatedWaitMinutes}m</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs pt-4 border-t border-white/5">
                <span className="text-zinc-500">Current counter serving:</span>
                <span className="font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  {trackData.currentServingToken}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-white/5 bg-white/2 flex items-start gap-3">
              <Bell className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                SMS alerts are sent to your phone as your turn approaches. This page also auto-refreshes your live position every few seconds.
              </p>
            </div>

            <div className="pt-4 text-center">
              <button
                onClick={handleClearTicket}
                className="text-xs text-zinc-500 hover:text-white underline cursor-pointer"
              >
                Clear this ticket and book a new one
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl glass-panel border border-white/5 grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Serving Token</span>
                <span className="text-xl font-bold text-white">{org.currentToken}</span>
              </div>
              <div className="border-l border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Waiting Line</span>
                <span className="text-xl font-bold text-amber-400">{org.waitingCount} ahead</span>
              </div>
            </div>

            {org.status !== 'Active' ? (
              <div className="p-6 rounded-3xl glass-panel border border-rose-500/20 bg-rose-500/5 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-rose-500/10 text-rose-400">
                  <Info className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-extrabold text-sm text-white">Queue Not Currently Active</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  This organization isn't accepting bookings right now (pending verification or suspended).
                </p>
              </div>
            ) : org.isQueuePaused ? (
              <div className="p-6 rounded-3xl glass-panel border border-rose-500/20 bg-rose-500/5 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-rose-500/10 text-rose-400">
                  <Info className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-extrabold text-sm text-white">Queue Registrations Paused</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  The admin has currently paused ticketing for maintenance or capacity constraints. Please wait or refresh shortly.
                </p>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base">Book Queue Token</h4>
                  <p className="text-xs text-zinc-500">Provide details below to join the digital queue list.</p>
                </div>

                {bookingError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    {bookingError}
                  </div>
                )}

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full p-3 premium-input text-sm text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone Number (For SMS alerts)</label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 555-0100"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full p-3 premium-input text-sm text-white"
                      required
                    />
                    <p className="text-[9px] text-zinc-500">We will text you alerts as your turn approaches.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="yourname@domain.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full p-3 premium-input text-sm text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Purpose of Visit (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Consultation / Deposit / Haircut"
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      className="w-full p-3 premium-input text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isBooking}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {isBooking ? 'Booking...' : 'Book Digital Token'} <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="text-center text-[10px] text-zinc-600 mt-8">
        QueueFlow AI Universal Queue Management Portal. Secured Isolation.
      </footer>
    </div>
  );
}
