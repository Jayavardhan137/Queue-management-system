'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueue } from '@/context/QueueContext';
import {
  Users,
  UserCheck,
  UserMinus,
  Clock,
  Play,
  Pause,
  RotateCcw,
  QrCode,
  Download,
  Printer,
  BarChart3,
  Settings2,
  ArrowRight,
  LogOut,
  Building,
  Phone,
  MapPin,
  CheckCircle,
  Search
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const {
    currentUser,
    loading,
    logout,
    tokens,
    dashboard,
    settings,
    fetchDashboard,
    fetchOwnOrgProfile,
    fetchTokens,
    nextCustomer,
    skipCustomer,
    recallCustomer,
    toggleQueuePause,
    updateAvgServiceTime,
    updateBusinessProfile
  } = useQueue();
  const [activeTab, setActiveTab] = useState<'Live' | 'QR' | 'Reports' | 'Settings'>('Live');

  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileLogo, setProfileLogo] = useState('🏥');
  const [avgService, setAvgService] = useState(15);
  const [isSaved, setIsSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [siteOrigin, setSiteOrigin] = useState('');

  const printAreaRef = useRef<HTMLDivElement>(null);

  const orgId = currentUser?.organizationId;

  // Auth guard
  useEffect(() => {
    if (!loading && (!currentUser || currentUser.role !== 'Organization Admin' || !currentUser.organizationId)) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // Load org profile (org list isn't fetched for this role by default, so we fetch just this org's data via dashboard/tokens)
  useEffect(() => {
    if (orgId) {
      fetchDashboard(orgId);
      fetchTokens(orgId);
      fetchOwnOrgProfile(orgId).then(org => {
        if (org) {
          setProfileName(org.name);
          setProfilePhone(org.phone);
          setProfileAddress(org.address);
          setProfileLogo(org.logoUrl || '🏥');
        }
      });
      const interval = setInterval(() => {
        fetchDashboard(orgId);
        fetchTokens(orgId);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [orgId]);

  useEffect(() => {
    if (typeof window !== 'undefined') setSiteOrigin(window.location.origin);
  }, []);

  if (loading || !currentUser || currentUser.role !== 'Organization Admin' || !orgId) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <p className="text-sm text-zinc-400">Loading console authentication...</p>
      </div>
    );
  }

  const waitingTokens = tokens.filter(t => t.status === 'Waiting').sort((a, b) => a.sequence - b.sequence);
  const servingToken = tokens.find(t => t.status === 'Serving');

  const totalWaiting = dashboard?.waitingCustomers ?? waitingTokens.length;
  const totalCompleted = dashboard?.completedCustomers ?? 0;
  const totalSkipped = dashboard?.skippedCustomers ?? 0;
  const estimatedWait = dashboard?.avgWaitingTime ?? 0;
  const isPaused = dashboard?.isQueuePaused ?? false;

  const hourlyCounts = Array(24).fill(0);
  tokens.forEach(t => {
    const hour = new Date(t.createdAt).getHours();
    hourlyCounts[hour]++;
  });
  const maxHourVal = Math.max(...hourlyCounts, 0);
  const peakHourStr = maxHourVal > 0
    ? `${hourlyCounts.indexOf(maxHourVal)}:00 - ${hourlyCounts.indexOf(maxHourVal) + 1}:00`
    : 'No data';

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusinessProfile(orgId, profileName, profilePhone, profileAddress, profileLogo);
    await updateAvgServiceTime(orgId, avgService);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const triggerPrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const filteredWaiting = searchQuery.trim()
    ? waitingTokens.filter(t =>
        t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerPhone.includes(searchQuery)
      )
    : waitingTokens;

  const qrTargetUrl = `${siteOrigin}/queue/${orgId}`;

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex">
      <aside className="w-64 border-r border-white/5 bg-black/40 flex flex-col justify-between p-6 shrink-0 print:hidden">
        <div className="space-y-8">
          <div className="flex items-center gap-2.5 px-1">
            <span className="text-2xl p-1 bg-white/5 rounded-xl border border-white/5">{profileLogo}</span>
            <div>
              <h4 className="font-bold text-sm text-white line-clamp-1">{profileName || 'Workspace'}</h4>
              <p className="text-[10px] text-zinc-500 font-mono">Workspace Panel</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] uppercase font-bold text-zinc-500 px-3 tracking-wider mb-2">Controls</p>
            {[
              { id: 'Live', label: 'Live Desk', icon: Users },
              { id: 'QR', label: 'QR Code Portal', icon: QrCode },
              { id: 'Reports', label: 'Reports & Audit', icon: BarChart3 },
              { id: 'Settings', label: 'Settings', icon: Settings2 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left py-2.5 px-3 text-sm rounded-xl transition-all flex items-center gap-2.5 ${activeTab === tab.id ? 'bg-indigo-600 text-white font-semibold shadow-md' : 'text-zinc-400 hover:text-white'}`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2.5 px-3 pt-4 border-t border-white/5">
            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center font-bold text-xs text-white">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-white line-clamp-1">{currentUser.name}</p>
              <p className="text-[9px] text-zinc-500 font-mono">ID: {orgId.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-rose-400 hover:text-rose-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {activeTab === 'Live' ? 'Live Desk' : activeTab === 'QR' ? 'QR Portal' : activeTab === 'Reports' ? 'Reports & Logs' : 'Workspace Settings'}
            </h1>
            <p className="text-sm text-zinc-400">
              {isPaused ? (
                <span className="text-rose-400 flex items-center gap-1 font-semibold"><Pause className="w-3.5 h-3.5" /> Queue flows are currently paused</span>
              ) : (
                <span className="text-zinc-500 flex items-center gap-1"><Play className="w-3.5 h-3.5 text-emerald-500" /> Live and accepting customer tokens</span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => toggleQueuePause(orgId, isPaused)}
              className={`py-2 px-4 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${isPaused ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-600/10 border-rose-500/20 text-rose-400'}`}
            >
              {isPaused ? (<><Play className="w-3.5 h-3.5" /> Resume Queue</>) : (<><Pause className="w-3.5 h-3.5" /> Pause Queue</>)}
            </button>
          </div>
        </div>

        {activeTab === 'Live' && (
          <div className="space-y-8 print:hidden">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
              <div className="p-5 rounded-3xl glass-panel border border-indigo-500/30 bg-indigo-500/5 space-y-2 lg:col-span-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Current Serving</p>
                <h3 className="text-4xl font-extrabold text-white tracking-tight">{servingToken ? servingToken.tokenNumber : 'None'}</h3>
                <p className="text-[10px] text-zinc-500 truncate">{servingToken ? servingToken.customerName : 'Service desk idle'}</p>
              </div>
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Waiting Customers</p>
                <h3 className="text-4xl font-extrabold text-amber-400">{totalWaiting}</h3>
                <p className="text-[10px] text-zinc-500">FIFO Line waiting</p>
              </div>
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Est. Wait Time</p>
                <h3 className="text-4xl font-extrabold text-indigo-400">{estimatedWait}m</h3>
                <p className="text-[10px] text-zinc-500">{settings[orgId]?.avgServiceTime ?? 15}m per customer settings</p>
              </div>
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Completed Today</p>
                <h3 className="text-4xl font-extrabold text-emerald-400">{totalCompleted}</h3>
                <p className="text-[10px] text-zinc-500">Successfully served</p>
              </div>
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Skipped Customers</p>
                <h3 className="text-4xl font-extrabold text-rose-400">{totalSkipped}</h3>
                <p className="text-[10px] text-zinc-500">Bypassed/absent tickets</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-3xl glass-panel border border-white/5 bg-gradient-to-br from-white/5 to-transparent space-y-6">
                  <h4 className="font-extrabold text-lg">Active Session</h4>

                  {servingToken ? (
                    <div className="space-y-4">
                      <div className="text-center py-6 bg-white/5 border border-white/5 rounded-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Serving Customer</span>
                        <h2 className="text-6xl font-extrabold text-white tracking-tight mt-1 animate-pulse">{servingToken.tokenNumber}</h2>
                        <p className="text-sm font-bold text-white mt-2">{servingToken.customerName}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{servingToken.customerPhone} | Purpose: {servingToken.purpose || 'General'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => nextCustomer(orgId)}
                          className="py-3 px-4 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <UserCheck className="w-4 h-4" /> Complete & Call Next
                        </button>
                        <button
                          onClick={() => skipCustomer(orgId)}
                          className="py-3 px-4 font-bold rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          <UserMinus className="w-4 h-4" /> Skip Customer
                        </button>
                      </div>

                      <button
                        onClick={() => recallCustomer(orgId, servingToken.id)}
                        className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" /> Call Customer Again (SMS alert)
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl space-y-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">No customer is currently being served</p>
                        <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">Advance the queue below to bring in the next customer in the FIFO list.</p>
                      </div>
                      <button
                        onClick={() => nextCustomer(orgId)}
                        disabled={totalWaiting === 0}
                        className="py-2.5 px-6 font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer inline-flex items-center gap-1 transition-colors"
                      >
                        Advance Queue <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-lg">Waiting Line ({totalWaiting} customers)</h4>
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search ticket..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full py-1.5 pl-9 pr-3 premium-input text-xs"
                    />
                  </div>
                </div>

                <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
                  <div className="overflow-y-auto max-h-[380px] divide-y divide-white/5">
                    {filteredWaiting.length === 0 ? (
                      <p className="p-8 text-sm text-zinc-500 text-center">No waiting customers found.</p>
                    ) : (
                      filteredWaiting.map((token, index) => (
                        <div key={token.id} className="p-4 flex items-center justify-between hover:bg-white/2 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400 border border-white/5">
                              #{index + 1}
                            </span>
                            <div>
                              <span className="font-bold text-white block text-sm">{token.customerName}</span>
                              <span className="text-[10px] text-zinc-500">{token.customerPhone} | Purpose: {token.purpose || 'General'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-indigo-400 block text-sm">{token.tokenNumber}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">{(index + 1) * (settings[orgId]?.avgServiceTime ?? 15)} min wait</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'QR' && (
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 p-6 rounded-3xl glass-panel border border-white/5 flex flex-col items-center text-center space-y-6">
              <h4 className="font-extrabold text-lg">Unique Organization QR Code</h4>

              <div ref={printAreaRef} className="p-6 bg-white rounded-2xl border border-zinc-200 inline-block shadow-lg relative print:fixed print:inset-0 print:z-[9999] print:bg-white print:flex print:flex-col print:items-center print:justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrTargetUrl)}`}
                  alt="QR Code for queue"
                  className="w-48 h-48 print:w-96 print:h-96"
                />
                <p className="text-[10px] text-zinc-500 font-mono mt-3 uppercase tracking-wider print:text-lg print:text-black print:font-bold print:mt-6">
                  {profileName} Queue Portal
                </p>
              </div>

              <div className="space-y-2 max-w-xs">
                <p className="text-xs font-semibold text-white">Direct URL Link:</p>
                <code className="text-[10px] text-indigo-400 bg-white/5 py-1 px-2.5 rounded font-mono block select-all break-all border border-white/5">
                  {qrTargetUrl}
                </code>
              </div>

              <div className="flex gap-3 w-full">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrTargetUrl)}`}
                  download="QueueFlow_QR.png"
                  className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download QR
                </a>
                <button
                  onClick={triggerPrint}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Flyer
                </button>
              </div>
            </div>

            <div className="md:col-span-7 space-y-6">
              <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-4">
                <h4 className="font-bold text-base">QR Deployment Directions</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Provide your visitors with seamless app-less queue registrations. Print and place this QR code in areas visible immediately upon arrival:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Reception Counter', desc: 'Allows receptionist to guide walk-ins to scan.' },
                    { title: 'Front Entrance Doors', desc: 'Book tickets immediately before even stepping in.' },
                    { title: 'Billing Counters', desc: 'Queue separately for bill payouts and payments.' },
                    { title: 'Waiting Area Seats', desc: 'Lets guests check wait line speeds from chairs.' }
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                      <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> {item.title}
                      </h5>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Reports' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Completed Today</span>
                <span className="text-3xl font-extrabold text-emerald-400">{totalCompleted}</span>
              </div>
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Skipped / Bypassed</span>
                <span className="text-3xl font-extrabold text-rose-400">{totalSkipped}</span>
              </div>
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Peak Traffic Hours</span>
                <span className="text-lg font-bold text-white line-clamp-1 mt-1.5">{peakHourStr}</span>
              </div>
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Avg Waiting Time</span>
                <span className="text-3xl font-extrabold text-indigo-400">{settings[orgId]?.avgServiceTime ?? 15}m</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-4">
              <div>
                <h4 className="font-bold text-base">Peak Hour Metrics</h4>
                <p className="text-xs text-zinc-400">Total registered tokens grouped by booking hours (08:00 to 18:00).</p>
              </div>
              <div className="h-32 flex items-end gap-2 pt-6 border-b border-white/5">
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => {
                  const count = hourlyCounts[hour] || 0;
                  const ratio = maxHourVal > 0 ? count / maxHourVal : 0;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[9px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                      <div className="w-full bg-indigo-500/30 hover:bg-indigo-500 rounded-t transition-all duration-300" style={{ height: `${ratio * 100}%` }}></div>
                      <span className="text-[10px] text-zinc-500 font-bold">{hour}:00</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/5 text-sm text-zinc-400">
              SMS notification logs viewer is coming in a future update — for now, dispatched SMS events are recorded in the database and visible in your Render backend logs.
            </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="max-w-2xl">
            <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
              <h4 className="font-extrabold text-lg">Update Profile Settings</h4>

              {isSaved && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Workspace configurations updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Business Name</label>
                    <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full p-3 premium-input text-sm text-white" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Public Contact Phone</label>
                    <input type="text" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className="w-full p-3 premium-input text-sm text-white" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</label>
                    <input type="text" value={profileAddress} onChange={e => setProfileAddress(e.target.value)} className="w-full p-3 premium-input text-sm text-white" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Avg Service Time (Minutes)</label>
                    <input type="number" value={avgService} onChange={e => setAvgService(parseInt(e.target.value) || 1)} className="w-full p-3 premium-input text-sm text-white" min={1} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">Workspace Icon Emoji</label>
                    <select value={profileLogo} onChange={e => setProfileLogo(e.target.value)} className="w-full p-3 premium-input text-sm text-white bg-[#121212] border-white/10">
                      <option value="🏥">🏥 Hospital</option>
                      <option value="💼">💼 Bank</option>
                      <option value="💊">💊 Pharmacy</option>
                      <option value="✂️">✂️ Salon</option>
                      <option value="🛒">🛒 Supermarket</option>
                      <option value="🏫">🏫 University</option>
                      <option value="🍽️">🍽️ Restaurant</option>
                      <option value="🛠️">🛠️ Service Center</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button type="submit" className="py-3 px-6 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
                    Save Configuration Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
