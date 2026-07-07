'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueue, QueueToken, SMSLog } from '@/context/QueueContext';
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
  ChevronRight, 
  ArrowRight,
  LogOut,
  Building,
  Upload,
  Phone,
  MapPin,
  CheckCircle,
  FileText,
  Search
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { 
    currentUser, 
    logout, 
    organizations, 
    tokens, 
    smsLogs,
    settings,
    nextCustomer,
    completeCustomer,
    skipCustomer,
    recallCustomer,
    toggleQueuePause,
    updateAvgServiceTime,
    updateBusinessProfile
  } = useQueue();

  const [activeTab, setActiveTab] = useState<'Live' | 'QR' | 'Reports' | 'Settings'>('Live');
  
  // Profile Forms state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileLogo, setProfileLogo] = useState('🏥');
  const [avgService, setAvgService] = useState(15);
  const [isSaved, setIsSaved] = useState(false);

  // Search queue tokens state
  const [searchQuery, setSearchQuery] = useState('');

  // Print helper reference
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Auth Guard & Load Profile Data
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Organization Admin' || !currentUser.organizationId) {
      router.push('/login');
      return;
    }

    const org = organizations.find(o => o.id === currentUser.organizationId);
    const setts = settings[currentUser.organizationId];

    if (org) {
      setProfileName(org.name);
      setProfilePhone(org.phone);
      setProfileAddress(org.address);
      setProfileLogo(org.logoUrl || '🏥');
    }
    if (setts) {
      setAvgService(setts.avgServiceTime);
    }
  }, [currentUser, organizations, settings, router]);

  if (!currentUser || currentUser.role !== 'Organization Admin' || !currentUser.organizationId) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <p className="text-sm text-zinc-400">Loading console authentication...</p>
      </div>
    );
  }

  const orgId = currentUser.organizationId;
  const org = organizations.find(o => o.id === orgId);
  const orgSettings = settings[orgId] || { organizationId: orgId, avgServiceTime: 15, isPaused: false };

  if (!org) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <p className="text-sm text-zinc-400">Organization profile not found.</p>
      </div>
    );
  }

  if (org.status === 'Pending' || org.status === 'Rejected') {
    return (
      <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Building className="w-12 h-12 text-zinc-500" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm text-zinc-400 max-w-xs">
          Your organization account is currently in status: <span className="font-bold text-amber-400">"{org.status}"</span>.
          Pending or Rejected organizations cannot access the dashboard workspace.
        </p>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white cursor-pointer"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // Queue Calculations (Tenant-specific)
  const tenantTokens = tokens.filter(t => t.organizationId === orgId);
  const todayTokens = tenantTokens.filter(t => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return new Date(t.createdAt) >= startOfToday;
  });

  const waitingTokens = todayTokens.filter(t => t.status === 'Waiting').sort((a, b) => a.sequence - b.sequence);
  const completedTokens = todayTokens.filter(t => t.status === 'Completed');
  const skippedTokens = todayTokens.filter(t => t.status === 'Skipped');
  const servingToken = todayTokens.find(t => t.status === 'Serving');

  const totalWaiting = waitingTokens.length;
  const totalCompleted = completedTokens.length;
  const totalSkipped = skippedTokens.length;

  const estimatedWait = totalWaiting * orgSettings.avgServiceTime;

  // SMS Logs for this Tenant
  const tenantSMS = smsLogs.filter(log => log.organizationId === orgId);

  // Peak Hours calculation (Group bookings by hour)
  const hourlyCounts = Array(24).fill(0);
  todayTokens.forEach(t => {
    const hour = new Date(t.createdAt).getHours();
    hourlyCounts[hour]++;
  });

  // Get peak hours indices
  const maxHourVal = Math.max(...hourlyCounts);
  const peakHourStr = maxHourVal > 0 
    ? `${hourlyCounts.indexOf(maxHourVal)}:00 - ${hourlyCounts.indexOf(maxHourVal) + 1}:00` 
    : 'No data';

  // Save Settings handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(orgId, profileName, profilePhone, profileAddress, profileLogo);
    updateAvgServiceTime(orgId, avgService);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const triggerPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filter queue tokens for searching
  const filteredTokenList = searchQuery.trim() 
    ? todayTokens.filter(t => 
        t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.customerPhone.includes(searchQuery)
      )
    : todayTokens;

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex">
      
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-white/5 bg-black/40 flex flex-col justify-between p-6 shrink-0 print:hidden">
        <div className="space-y-8">
          <div className="flex items-center gap-2.5 px-1">
            <span className="text-2xl p-1 bg-white/5 rounded-xl border border-white/5">{profileLogo}</span>
            <div>
              <h4 className="font-bold text-sm text-white line-clamp-1">{profileName}</h4>
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
              {currentUser.name.slice(0,2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-white line-clamp-1">{currentUser.name}</p>
              <p className="text-[9px] text-zinc-500 font-mono">ID: {orgId.slice(4,10)}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-rose-400 hover:text-rose-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Console Workspace */}
      <main className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{activeTab === 'Live' ? 'Live Desk' : activeTab === 'QR' ? 'QR Portal' : activeTab === 'Reports' ? 'Reports & Logs' : 'Workspace Settings'}</h1>
            <p className="text-sm text-zinc-400">
              {orgSettings.isPaused ? (
                <span className="text-rose-400 flex items-center gap-1 font-semibold"><Pause className="w-3.5 h-3.5" /> Queue flows are currently paused</span>
              ) : (
                <span className="text-zinc-500 flex items-center gap-1"><Play className="w-3.5 h-3.5 text-emerald-500" /> Live and accepting customer tokens</span>
              )}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => toggleQueuePause(orgId)}
              className={`py-2 px-4 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${orgSettings.isPaused ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-600/10 border-rose-500/20 text-rose-400'}`}
            >
              {orgSettings.isPaused ? (
                <><Play className="w-3.5 h-3.5" /> Resume Queue</>
              ) : (
                <><Pause className="w-3.5 h-3.5" /> Pause Queue</>
              )}
            </button>
          </div>
        </div>

        {/* ==========================================
            TAB: LIVE DESK
            ========================================== */}
        {activeTab === 'Live' && (
          <div className="space-y-8 print:hidden">
            {/* Dashboard Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Card 1: Current Serving */}
              <div className="p-5 rounded-3xl glass-panel border border-indigo-500/30 bg-indigo-500/5 space-y-2 lg:col-span-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Current Serving</p>
                <h3 className="text-4xl font-extrabold text-white tracking-tight">{servingToken ? servingToken.tokenNumber : 'None'}</h3>
                <p className="text-[10px] text-zinc-500 truncate">{servingToken ? servingToken.customerName : 'Service desk idle'}</p>
              </div>

              {/* Card 2: Waiting */}
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Waiting Customers</p>
                <h3 className="text-4xl font-extrabold text-amber-400">{totalWaiting}</h3>
                <p className="text-[10px] text-zinc-500">FIFO Line waiting</p>
              </div>

              {/* Card 3: Est Waiting Time */}
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Est. Wait Time</p>
                <h3 className="text-4xl font-extrabold text-indigo-400">{estimatedWait}m</h3>
                <p className="text-[10px] text-zinc-500">{orgSettings.avgServiceTime}m per customer settings</p>
              </div>

              {/* Card 4: Completed */}
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Completed Today</p>
                <h3 className="text-4xl font-extrabold text-emerald-400">{totalCompleted}</h3>
                <p className="text-[10px] text-zinc-500">Successfully served</p>
              </div>

              {/* Card 5: Skipped */}
              <div className="p-5 rounded-3xl glass-panel border border-white/5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Skipped Customers</p>
                <h3 className="text-4xl font-extrabold text-rose-400">{totalSkipped}</h3>
                <p className="text-[10px] text-zinc-500">Bypassed/absent tickets</p>
              </div>
            </div>

            {/* Queue Control Desk Section */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Queue Controls & Current serving token detail */}
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
                          onClick={() => completeCustomer(orgId, servingToken.id)}
                          className="py-3 px-4 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <UserCheck className="w-4 h-4" /> Mark Completed
                        </button>
                        <button
                          onClick={() => skipCustomer(orgId, servingToken.id)}
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

                  {servingToken && (
                    <div className="border-t border-white/5 pt-4">
                      <button
                        onClick={() => nextCustomer(orgId)}
                        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-lg transition-colors"
                      >
                        Call Next Customer <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Waiting Line Queue List */}
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
                    {filteredTokenList.filter(t => t.status === 'Waiting').length === 0 ? (
                      <p className="p-8 text-sm text-zinc-500 text-center">No waiting customers found.</p>
                    ) : (
                      filteredTokenList
                        .filter(t => t.status === 'Waiting')
                        .sort((a,b) => a.sequence - b.sequence)
                        .map((token, index) => (
                          <div 
                            key={token.id} 
                            className="p-4 flex items-center justify-between hover:bg-white/2 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-400 border border-white/5">
                                #{index + 1}
                              </span>
                              <div>
                                <span className="font-bold text-white block text-sm">{token.customerName}</span>
                                <span className="text-[10px] text-zinc-500">{token.customerPhone} | Purpose: {token.purpose || 'General'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="font-extrabold text-indigo-400 block text-sm">{token.tokenNumber}</span>
                                <span className="text-[9px] text-zinc-500 font-mono">{(index + 1) * orgSettings.avgServiceTime} min wait</span>
                              </div>
                              
                              <button
                                onClick={() => completeCustomer(orgId, token.id)}
                                className="p-1 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
                                title="Instantly complete"
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              </button>
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

        {/* ==========================================
            TAB: QR CODE SYSTEM
            ========================================== */}
        {activeTab === 'QR' && (
          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Visual Display for scanning */}
            <div className="md:col-span-5 p-6 rounded-3xl glass-panel border border-white/5 flex flex-col items-center text-center space-y-6">
              <h4 className="font-extrabold text-lg">Unique Organization QR Code</h4>
              
              <div 
                ref={printAreaRef}
                className="p-6 bg-white rounded-2xl border border-zinc-200 inline-block shadow-lg relative print:fixed print:inset-0 print:z-[9999] print:bg-white print:flex print:flex-col print:items-center print:justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={org.qrCodeUrl} 
                  alt="QR Code for queue"
                  className="w-48 h-48 print:w-96 print:h-96"
                />
                <p className="text-[10px] text-zinc-500 font-mono mt-3 uppercase tracking-wider print:text-lg print:text-black print:font-bold print:mt-6">
                  {org.name} Queue Portal
                </p>
                <p className="hidden print:block text-sm text-zinc-500 mt-2">
                  Scan to book a token. No app download required.
                </p>
              </div>

              <div className="space-y-2 max-w-xs">
                <p className="text-xs font-semibold text-white">Direct URL Link:</p>
                <code className="text-[10px] text-indigo-400 bg-white/5 py-1 px-2.5 rounded font-mono block select-all break-all border border-white/5">
                  http://localhost:3000/queue/{orgId}
                </code>
              </div>

              <div className="flex gap-3 w-full">
                <a 
                  href={org.qrCodeUrl}
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

            {/* Placement Suggestions */}
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

        {/* ==========================================
            TAB: REPORTS & AUDIT
            ========================================== */}
        {activeTab === 'Reports' && (
          <div className="space-y-8">
            {/* Quick Metrics */}
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
                <span className="text-3xl font-extrabold text-indigo-400">{orgSettings.avgServiceTime}m</span>
              </div>
            </div>

            {/* Peak Hours visual SVG bar chart */}
            <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-4">
              <div>
                <h4 className="font-bold text-base">Peak Hour Metrics</h4>
                <p className="text-xs text-zinc-400">Total registered tokens grouped by booking hours (08:00 to 18:00).</p>
              </div>

              {/* Chart Grid */}
              <div className="h-32 flex items-end gap-2 pt-6 border-b border-white/5">
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => {
                  const count = hourlyCounts[hour] || 0;
                  const ratio = maxHourVal > 0 ? count / maxHourVal : 0;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[9px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">${count}</span>
                      <div 
                        className="w-full bg-indigo-500/30 hover:bg-indigo-500 rounded-t transition-all duration-300"
                        style={{ height: `${ratio * 100}%` }}
                      ></div>
                      <span className="text-[10px] text-zinc-500 font-bold">{hour}:00</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SMS Triggers logs */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-lg">Twilio Notification Logs</h4>
              <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">Customer</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Message Content</th>
                        <th className="p-4">Type</th>
                        <th className="p-4 text-right">Time Dispatched</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                      {tenantSMS.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-500 font-semibold">
                            No notifications dispatched in this session.
                          </td>
                        </tr>
                      ) : (
                        tenantSMS.map((log) => (
                          <tr key={log.id} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-bold text-white">{log.customerName} ({log.tokenNumber})</td>
                            <td className="p-4">{log.customerPhone}</td>
                            <td className="p-4 font-mono text-[10px] leading-relaxed max-w-sm truncate" title={log.message}>"{log.message}"</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.type === 'current_turn' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="p-4 text-right text-zinc-500 font-semibold">{new Date(log.sentAt).toLocaleTimeString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: SETTINGS
            ========================================== */}
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
                  {/* Business Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Business Name</label>
                    <input 
                      type="text" 
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      className="w-full p-3 premium-input text-sm text-white"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Public Contact Phone</label>
                    <input 
                      type="text" 
                      value={profilePhone}
                      onChange={e => setProfilePhone(e.target.value)}
                      className="w-full p-3 premium-input text-sm text-white"
                      required
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address Coordinates</label>
                    <input 
                      type="text" 
                      value={profileAddress}
                      onChange={e => setProfileAddress(e.target.value)}
                      className="w-full p-3 premium-input text-sm text-white"
                      required
                    />
                  </div>

                  {/* Avg service time */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Avg Service Time (Minutes)</label>
                    <input 
                      type="number" 
                      value={avgService}
                      onChange={e => setAvgService(parseInt(e.target.value) || 1)}
                      className="w-full p-3 premium-input text-sm text-white"
                      min={1}
                      required
                    />
                  </div>

                  {/* Profile Emoji Logo */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">Workspace Icon Emoji</label>
                    <select
                      value={profileLogo}
                      onChange={e => setProfileLogo(e.target.value)}
                      className="w-full p-3 premium-input text-sm text-white bg-[#121212] border-white/10"
                    >
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
                  <button
                    type="submit"
                    className="py-3 px-6 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
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
