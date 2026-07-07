'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueue, QueueToken } from '@/context/QueueContext';
import { 
  Building2, 
  Users, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  Mail, 
  Sparkles, 
  CheckCircle,
  Bell,
  ArrowLeft,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';

export default function QueuePortal() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { organizations, tokens, settings, smsLogs, bookToken } = useQueue();

  const orgId = params.orgId as string;
  const ticketIdParam = searchParams.get('ticketId');

  const org = organizations.find(o => o.id === orgId);
  const orgSettings = settings[orgId] || { organizationId: orgId, avgServiceTime: 15, isPaused: false };

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Active Ticket tracking
  const [activeTicket, setActiveTicket] = useState<QueueToken | null>(null);

  // Load ticket from URL query parameter or local storage
  useEffect(() => {
    if (ticketIdParam) {
      const ticket = tokens.find(t => t.id === ticketIdParam);
      if (ticket) {
        setActiveTicket(ticket);
        return;
      }
    }

    // Check local storage for active ticket in this org
    const savedTicketId = localStorage.getItem(`qflow_active_ticket_${orgId}`);
    if (savedTicketId) {
      const ticket = tokens.find(t => t.id === savedTicketId);
      if (ticket) {
        setActiveTicket(ticket);
      }
    }
  }, [ticketIdParam, tokens, orgId]);

  if (!org) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Building2 className="w-12 h-12 text-zinc-500" />
        <h2 className="text-xl font-bold">Organization Not Found</h2>
        <p className="text-sm text-zinc-400 max-w-xs">The queue link you followed appears to be invalid or has expired.</p>
        <Link href="/" className="px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white">Back to Home</Link>
      </div>
    );
  }

  // Calculate live statistics
  const tenantTokens = tokens.filter(t => t.organizationId === orgId);
  const todayTokens = tenantTokens.filter(t => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return new Date(t.createdAt) >= startOfToday;
  });

  const waitingTokens = todayTokens.filter(t => t.status === 'Waiting').sort((a, b) => a.sequence - b.sequence);
  const servingToken = todayTokens.find(t => t.status === 'Serving');

  // Math for specific active ticket
  let peopleAhead = 0;
  let estimatedWait = 0;
  let freshTicketState: QueueToken | null = null;

  if (activeTicket) {
    // Re-grab ticket state from global context to react to admin next/complete changes
    freshTicketState = tokens.find(t => t.id === activeTicket.id) || null;
    if (freshTicketState && freshTicketState.status === 'Waiting') {
      const positionIndex = waitingTokens.findIndex(t => t.id === freshTicketState!.id);
      peopleAhead = positionIndex >= 0 ? positionIndex : 0;
      estimatedWait = (peopleAhead + 1) * orgSettings.avgServiceTime;
    }
  }

  // Filter SMS Logs for this specific customer phone number
  const myNotifications = freshTicketState 
    ? smsLogs.filter(log => log.organizationId === orgId && log.customerPhone === freshTicketState!.customerPhone)
    : [];

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsBooking(true);

    try {
      const ticket = bookToken(orgId, name, phone, email, purpose);
      setActiveTicket(ticket);
      localStorage.setItem(`qflow_active_ticket_${orgId}`, ticket.id);
      
      // Update URL with ticket id for bookmark support
      router.push(`/queue/${orgId}?ticketId=${ticket.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBooking(false);
    }
  };

  const handleClearTicket = () => {
    localStorage.removeItem(`qflow_active_ticket_${orgId}`);
    setActiveTicket(null);
    router.push(`/queue/${orgId}`);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex flex-col justify-between py-6 px-6">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] pointer-events-none rounded-full bg-indigo-500/10 blur-[130px]"></div>

      <div className="max-w-md mx-auto w-full space-y-6">
        
        {/* Top Header */}
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" /> QueueFlow Client
          </div>
        </div>

        {/* Workspace banner card */}
        <div className="p-5 rounded-3xl glass-panel border border-white/5 flex items-center gap-3">
          <span className="text-3xl p-1.5 bg-white/5 rounded-2xl border border-white/5">{org.logoUrl || '🏢'}</span>
          <div>
            <h3 className="font-extrabold text-white">{org.name}</h3>
            <p className="text-xs text-zinc-500">{org.businessType} | {org.address}</p>
          </div>
        </div>

        {/* ==========================================
            FLOW: TICKET BOOKED AND TRACKING
            ========================================== */}
        {freshTicketState ? (
          <div className="space-y-6">
            
            {/* Live Status Tracker Card */}
            <div className="p-6 rounded-3xl glass-panel border border-indigo-500/20 bg-gradient-to-tr from-indigo-500/5 to-transparent relative overflow-hidden space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Live Position Tracker</span>
                {freshTicketState.status === 'Serving' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">Your Turn Now</span>
                ) : freshTicketState.status === 'Waiting' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Waiting In Line</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Session Ended</span>
                )}
              </div>

              {/* Main Ticket Display */}
              <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Your Assigned Token</span>
                <h1 className="text-6xl font-extrabold text-white tracking-tight mt-1 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {freshTicketState.tokenNumber}
                </h1>
                <p className="text-xs text-zinc-400 mt-2">Holder: {freshTicketState.customerName}</p>
              </div>

              {/* Position and Wait Metrics */}
              {freshTicketState.status === 'Waiting' && (
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">People Ahead</p>
                    <p className="text-2xl font-bold mt-1 text-white">{peopleAhead}</p>
                  </div>
                  <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Estimated Wait</p>
                    <p className="text-2xl font-bold mt-1 text-indigo-400">{estimatedWait}m</p>
                  </div>
                </div>
              )}

              {/* Custom serving updates */}
              <div className="flex justify-between items-center text-xs pt-4 border-t border-white/5">
                <span className="text-zinc-500">Current counter serving:</span>
                <span className="font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  {servingToken ? servingToken.tokenNumber : 'None'}
                </span>
              </div>
            </div>

            {/* In-app Notification Logs / SMS Banner feed */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-1.5"><Bell className="w-4 h-4 text-indigo-400" /> Virtual SMS Notifications ({myNotifications.length})</h4>
              
              {myNotifications.length === 0 ? (
                <div className="p-4 rounded-2xl border border-white/5 bg-white/2 flex items-start gap-3">
                  <Info className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    No automated notifications triggered yet. Twilio SMS alerts will log below once your turn gets closer (at 5 ahead, 2 ahead, and active turn).
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myNotifications.map((log) => (
                    <div 
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5 flex gap-3 items-start"
                    >
                      <Bell className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0 animate-bounce" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-indigo-300 block">Twilio SMS Dispatched</span>
                        <p className="text-[11px] leading-relaxed text-indigo-100 font-mono">"{log.message}"</p>
                        <span className="text-[9px] text-zinc-500 block mt-1">{new Date(log.sentAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear details / new ticket */}
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
          /* ==========================================
             FLOW: BOOK TICKET FORM
             ========================================== */
          <div className="space-y-6">
            {/* Live capacity card */}
            <div className="p-5 rounded-3xl glass-panel border border-white/5 grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Serving Token</span>
                <span className="text-xl font-bold text-white">{servingToken ? servingToken.tokenNumber : 'None'}</span>
              </div>
              <div className="border-l border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Waiting Line</span>
                <span className="text-xl font-bold text-amber-400">{waitingTokens.length} ahead</span>
              </div>
            </div>

            {orgSettings.isPaused ? (
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

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Customer Name */}
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

                  {/* Customer Phone */}
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
                    <p className="text-[9px] text-zinc-500">We will text you alerts at 5 ahead, 2 ahead, and active turn.</p>
                  </div>

                  {/* Customer Email */}
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

                  {/* Purpose */}
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
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Book Digital Token <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-zinc-600 mt-8">
        QueueFlow AI Universal Queue Management Portal. Secured Isolation.
      </footer>
    </div>
  );
}
