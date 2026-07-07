'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueue, Organization } from '@/context/QueueContext';
import { 
  Building2, 
  Users, 
  Coins, 
  Check, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  Sparkles, 
  Eye, 
  LogOut,
  Calendar,
  Layers,
  CheckCircle,
  FileCheck,
  Ban,
  Clock
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { 
    currentUser, 
    logout, 
    organizations, 
    tokens, 
    approveOrganization, 
    rejectOrganization, 
    suspendOrganization, 
    activateOrganization 
  } = useQueue();

  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Suspended'>('All');
  const [selectedOrgForDoc, setSelectedOrgForDoc] = useState<Organization | null>(null);

  // Auth Guard: redirects to /admin/login
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Super Admin') {
      router.push('/admin/login');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'Super Admin') {
    return (
      <div className="min-h-screen bg-[#020205] text-white flex items-center justify-center">
        <p className="text-sm text-zinc-400 font-mono">Authenticating secure platform token...</p>
      </div>
    );
  }

  // Dashboard Analytics calculations
  const totalOrgs = organizations.length;
  const pendingApprovals = organizations.filter(o => o.status === 'Pending').length;
  const approvedOrgs = organizations.filter(o => o.status === 'Approved').length;
  const rejectedOrgs = organizations.filter(o => o.status === 'Rejected').length;
  const suspendedOrgs = organizations.filter(o => o.status === 'Suspended').length;

  // Active Organizations: Approved organizations that are not suspended
  const activeOrgsCount = organizations.filter(o => o.status === 'Approved').length;

  // Customers (unique phone numbers)
  const totalCustomers = Array.from(new Set(tokens.map(t => t.customerPhone))).length;
  const totalTokensGenerated = tokens.length;

  // Monthly Recurring Revenue simulation
  const monthlyRecurringRevenue = (approvedOrgs * 79) + (suspendedOrgs * 29);
  const projectedAnnualRevenue = monthlyRecurringRevenue * 12;

  // Pending approval list
  const pendingList = organizations.filter(o => o.status === 'Pending');

  // Tenant directory based on directory filters
  const directoryList = organizations.filter(o => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return o.status === 'Pending';
    if (activeTab === 'Approved') return o.status === 'Approved';
    if (activeTab === 'Rejected') return o.status === 'Rejected';
    if (activeTab === 'Suspended') return o.status === 'Suspended';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>;
      case 'Pending':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">Pending Review</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Rejected</span>;
      case 'Suspended':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Suspended</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex">
      
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-white/5 bg-black/40 flex flex-col justify-between p-6 shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">QueueFlow AI</span>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] uppercase font-bold text-zinc-500 px-3 tracking-wider">Console Operations</p>
            <button className="w-full text-left py-2 px-3 text-sm rounded-xl bg-white/5 text-white font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Control Dashboard
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xs text-white">
              SA
            </div>
            <div>
              <p className="text-xs font-bold text-white">Platform Director</p>
              <p className="text-[9px] text-zinc-500 font-mono">{currentUser.email}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              logout();
              router.push('/admin/login');
            }}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-rose-400 hover:text-rose-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Console Workspace */}
      <main className="flex-1 p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Top Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Super Admin Dashboard</h1>
            <p className="text-sm text-zinc-400">Manage tenant verification workflows and platform health.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold bg-white/5 py-1.5 px-3 rounded-xl border border-white/5 text-zinc-400">
            <Calendar className="w-4 h-4 text-indigo-400" /> System Date: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Total Organizations */}
          <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Total Orgs</span>
            <h3 className="text-2xl font-extrabold text-white">{totalOrgs}</h3>
            <span className="text-[9px] text-zinc-500 font-semibold">Registered entries</span>
          </div>

          {/* Pending Approvals */}
          <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Pending</span>
            <h3 className="text-2xl font-extrabold text-amber-400">{pendingApprovals}</h3>
            <span className="text-[9px] text-amber-500/80 font-semibold animate-pulse">Needs approval</span>
          </div>

          {/* Approved Organizations */}
          <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Approved</span>
            <h3 className="text-2xl font-extrabold text-emerald-400">{approvedOrgs}</h3>
            <span className="text-[9px] text-zinc-500 font-semibold">Active accounts</span>
          </div>

          {/* Rejected Organizations */}
          <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Rejected</span>
            <h3 className="text-2xl font-extrabold text-rose-400">{rejectedOrgs}</h3>
            <span className="text-[9px] text-zinc-500 font-semibold">Access declined</span>
          </div>

          {/* Active Organizations */}
          <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Active Orgs</span>
            <h3 className="text-2xl font-extrabold text-indigo-400">{activeOrgsCount}</h3>
            <span className="text-[9px] text-zinc-500 font-semibold">Operational</span>
          </div>

          {/* Total Customers */}
          <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Customers</span>
            <h3 className="text-2xl font-extrabold text-white">{totalCustomers}</h3>
            <span className="text-[9px] text-zinc-500 font-semibold">Unique visitors</span>
          </div>

          {/* Total Tokens Generated */}
          <div className="p-4 rounded-2xl glass-panel border border-indigo-500/20 bg-indigo-500/5 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 block">Tokens</span>
            <h3 className="text-2xl font-extrabold text-indigo-300">{totalTokensGenerated}</h3>
            <span className="text-[9px] text-indigo-400/80 font-semibold">Total tickets</span>
          </div>
        </div>

        {/* 1. Pending Approvals Queue Table */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-xl flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-400" /> Pending Approvals Queue ({pendingApprovals})
          </h3>

          <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Organization Name</th>
                    <th className="p-4">Business Type</th>
                    <th className="p-4">Billing Plan</th>
                    <th className="p-4">Registration Date</th>
                    <th className="p-4">Verification Status</th>
                    <th className="p-4 text-center">Uploaded Docs</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500 font-semibold">
                        No pending approvals in review.
                      </td>
                    </tr>
                  ) : (
                    pendingList.map((org) => (
                      <tr key={org.id} className="hover:bg-white/2 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl p-1.5 bg-white/5 rounded-xl border border-white/5">{org.logoUrl || '🏢'}</span>
                            <div>
                              <span className="font-bold text-white block">{org.name}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">Temp ID: {org.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-300 font-semibold">{org.businessType}</td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-bold text-white text-xs">{org.subscriptionPlan || 'Starter'}</span>
                            <span className={`block text-[9px] font-bold px-1.5 py-0.5 rounded-full w-max ${
                              org.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {org.paymentStatus || 'Unpaid'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{new Date(org.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="p-4">{getStatusBadge(org.status)}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedOrgForDoc(org)}
                            className="py-1.5 px-3 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Documents
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => approveOrganization(org.id)}
                              className="py-1.5 px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => rejectOrganization(org.id)}
                              className="py-1.5 px-3 text-xs font-bold rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2. Platform Directory Table (All Orgs list) */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-extrabold text-xl flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" /> Platform Tenancy Directory
            </h3>
            
            {/* Filter Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              {['All', 'Approved', 'Rejected', 'Suspended'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-1.5 px-3.5 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Organization Name</th>
                    <th className="p-4">Business Sector</th>
                    <th className="p-4">Owner Name</th>
                    <th className="p-4">Subscription Details</th>
                    <th className="p-4">Verification Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {directoryList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500 font-semibold">
                        No organizations found matching that status.
                      </td>
                    </tr>
                  ) : (
                    directoryList.map((org) => (
                      <tr key={org.id} className="hover:bg-white/2 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl p-1.5 bg-white/5 rounded-xl border border-white/5">{org.logoUrl || '🏢'}</span>
                            <div>
                              <span className="font-bold text-white block">{org.name}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">ID: {org.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-300 font-semibold">{org.businessType}</td>
                        <td className="p-4 text-zinc-300">
                          <div>
                            <span>{org.ownerName}</span>
                            <span className="text-[10px] text-zinc-500 block">{org.email} | {org.phone}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{org.subscriptionPlan || 'Starter'}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                org.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {org.paymentStatus || 'Unpaid'}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 block">
                              Expires: {org.subscriptionExpiry ? new Date(org.subscriptionExpiry).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">{getStatusBadge(org.status)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {org.status === 'Approved' && (
                              <button
                                onClick={() => suspendOrganization(org.id)}
                                className="py-1.5 px-3 text-xs font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Ban className="w-3.5 h-3.5" /> Suspend
                              </button>
                            )}

                            {org.status === 'Suspended' && (
                              <button
                                onClick={() => activateOrganization(org.id)}
                                className="py-1.5 px-3 text-xs font-bold rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Reactivate
                              </button>
                            )}

                            {org.status === 'Rejected' && (
                              <button
                                onClick={() => activateOrganization(org.id)}
                                className="py-1.5 px-3 text-xs font-bold rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve Registration
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Verification Document Modal Viewer */}
        {selectedOrgForDoc && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl p-6 rounded-3xl glass-panel border border-white/10 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-lg">Tenant Documentation Verification</h3>
                  <p className="text-xs text-zinc-400">{selectedOrgForDoc.name} ({selectedOrgForDoc.businessType})</p>
                </div>
                <button 
                  onClick={() => setSelectedOrgForDoc(null)}
                  className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Registration Paper */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Business License Paper</h5>
                  <div className="h-44 rounded-xl border border-white/10 bg-black/60 flex flex-col justify-center items-center gap-2 p-4 text-center">
                    <Building2 className="w-8 h-8 text-indigo-500" />
                    <p className="text-xs font-semibold">Incorporation_Proof.pdf</p>
                    <p className="text-[10px] text-zinc-500">Government Registry Stamp Checked</p>
                  </div>
                </div>

                {/* Identity Proof */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Owner Identity Proof</h5>
                  <div className="h-44 rounded-xl border border-white/10 bg-black/60 flex flex-col justify-center items-center gap-2 p-4 text-center">
                    <Users className="w-8 h-8 text-indigo-500" />
                    <p className="text-xs font-semibold">Owner_Passport_ID.jpg</p>
                    <p className="text-[10px] text-zinc-500">Photo matching registered owner</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                {selectedOrgForDoc.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => {
                        approveOrganization(selectedOrgForDoc.id);
                        setSelectedOrgForDoc(null);
                      }}
                      className="py-2.5 px-5 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Approve & Issue Credentials
                    </button>
                    <button
                      onClick={() => {
                        rejectOrganization(selectedOrgForDoc.id);
                        setSelectedOrgForDoc(null);
                      }}
                      className="py-2.5 px-5 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-4 h-4" /> Reject Application
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedOrgForDoc(null)}
                  className="py-2.5 px-4 text-sm font-semibold rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Close Document Viewer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
