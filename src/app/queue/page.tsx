'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueue } from '@/context/QueueContext';
import { Search, Sparkles, ArrowLeft, ArrowRight, Building2, HelpCircle } from 'lucide-react';

export default function QueueSearchGateway() {
  const router = useRouter();
  const { searchTokens } = useQueue();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const tokens = searchTokens(query);
    setResults(tokens);
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex flex-col justify-between py-12 px-6">
      
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md h-[300px] pointer-events-none rounded-full bg-indigo-500/10 blur-[120px]"></div>

      <div className="max-w-md mx-auto w-full space-y-8 z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg tracking-tight text-white mb-2">
            <span className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>QueueFlow AI</span>
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight">Search Active Waitlist</h2>
          <p className="text-xs text-zinc-400">Search for your ticket across organizations using phone or token number.</p>
        </div>

        {/* Search Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Phone number or Token number..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full py-3.5 pl-11 pr-4 premium-input text-sm"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 px-5 font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Search Ticket <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {searched && (
            <div className="border-t border-white/5 pt-4 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Match Results</h4>
              {results.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No active tickets found matching that query.</p>
              ) : (
                <div className="space-y-2">
                  {results.map(tk => (
                    <div 
                      key={tk.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">{tk.tokenNumber}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{tk.organizationName} | {tk.customerName}</p>
                      </div>
                      <Link 
                        href={`/queue/${tk.organizationId}?ticketId=${tk.id}`}
                        className="py-1.5 px-3 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        Track Position <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tip Box */}
        <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex gap-2.5 items-start text-xs text-zinc-500">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Usually, a QR code scan directly redirects you to a specific merchant's portal, where you can book a fresh ticket. Go to the <Link href="/" className="text-indigo-400 hover:underline">Landing Page</Link> to view demo listings.
          </p>
        </div>

        {/* Home Redirect */}
        <div className="text-center">
          <Link href="/" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 justify-center">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Landing Page
          </Link>
        </div>
      </div>

      <footer className="text-center text-[10px] text-zinc-600">
        &copy; {new Date().getFullYear()} QueueFlow AI. Universal Waitlists.
      </footer>
    </div>
  );
}
