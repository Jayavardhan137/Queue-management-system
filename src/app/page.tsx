'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { useQueue } from '@/context/QueueContext';
import { 
  QrCode, 
  Clock, 
  Bell, 
  ShieldCheck, 
  BarChart3, 
  Search, 
  Building2, 
  Check, 
  Moon, 
  Sun, 
  ArrowRight,
  ChevronRight,
  Sparkles,
  Users,
  ArrowDown
} from 'lucide-react';

const TOTAL_FRAMES = 300;

export default function Home() {
  const router = useRouter();
  const { searchTokens } = useQueue();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Scroll Canvas States
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Scroll tracker for the entire landing page
  const { scrollYProgress } = useScroll();

  // Preload Image Sequence
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];

    // Load first frame immediately to display the page instantly
    const firstImg = new Image();
    firstImg.src = `/frames/ezgif-frame-001.jpg`;
    firstImg.onload = () => {
      loadedImages[0] = firstImg;
      setImages([firstImg]);
      setIsLoaded(true);

      // Silently preload the remaining 299 frames in the background
      let loadedCount = 1;
      for (let i = 1; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        const frameNum = String(i + 1).padStart(3, '0');
        img.src = `/frames/ezgif-frame-${frameNum}.jpg`;
        img.onload = () => {
          loadedImages[i] = img;
          loadedCount++;
          // Periodically update state to prevent massive re-renders
          if (loadedCount % 15 === 0 || loadedCount === TOTAL_FRAMES) {
            setImages([...loadedImages]);
          }
        };
        img.onerror = () => {
          loadedCount++;
        };
      }
    };
  }, []);

  // Update frame index based on scroll position
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isLoaded) return;
    const index = Math.min(
      TOTAL_FRAMES - 1,
      Math.floor(latest * TOTAL_FRAMES)
    );
    setFrameIndex(index);
  });

  // Render current frame on canvas
  useEffect(() => {
    if (!isLoaded || images.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const currentImage = images[frameIndex];
    if (!currentImage) return;

    // Clear Canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Canvas scaling to match cover style fit
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imageWidth = currentImage.width;
    const imageHeight = currentImage.height;

    // Cover scale logic
    const ratio = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
    const newWidth = imageWidth * ratio;
    const newHeight = imageHeight * ratio;

    const x = (canvasWidth - newWidth) / 2;
    const y = (canvasHeight - newHeight) / 2;

    context.drawImage(currentImage, x, y, newWidth, newHeight);
  }, [frameIndex, isLoaded, images]);

  // Adjust canvas resolution dynamically on window resize to cover the viewport
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [isLoaded]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      if (isDark) {
        html.classList.remove('dark');
      } else {
        html.classList.add('dark');
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const results = searchTokens(searchQuery);
    setSearchResults(results);
    setSearchAttempted(true);
  };

  return (
    <div ref={scrollContainerRef} className={`relative min-h-screen ${isDark ? 'text-[#f5f5f7]' : 'text-[#1a1a1a]'} transition-colors duration-300`}>
      
      {/* Background color layer */}
      <div className={`fixed inset-0 ${isDark ? 'bg-[#030303]' : 'bg-[#f4f5f7]'} -z-20 pointer-events-none transition-colors duration-300`}></div>

      {/* FULLSCREEN FIXED BACKGROUND CANVAS */}
      {isLoaded && (
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
          <canvas 
            ref={canvasRef} 
            className={`w-full h-full object-cover ${isDark ? 'opacity-75' : 'opacity-85'} transition-opacity duration-500`}
          />
          {/* Subtle vignette/overlay grid */}
          <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent ${isDark ? 'to-[#030303]/95' : 'to-[#f4f5f7]/95'} pointer-events-none`}></div>
        </div>
      )}

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 glass-nav border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl text-white">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="bg-gradient-to-r from-indigo-500 to-purple-400 bg-clip-text text-transparent">QueueFlow AI</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link 
              href="/login"
              className="text-sm font-semibold hover:text-indigo-500 transition-all px-4 py-2"
            >
              Log In
            </Link>
            <Link 
              href="/register"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Register Org
            </Link>
          </div>
        </div>
      </header>

      {/* Scroll Content Wrapper (elements scroll over the fixed background canvas) */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20 space-y-36">
        
        {/* Section 1: Hero Section */}
        <section className="min-h-[70vh] flex flex-col justify-center items-center text-center space-y-6 max-w-3xl mx-auto relative pt-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Skip the Queue.<br />Arrive When It's Your Turn.
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
            A Smart QR-based Queue Management Platform for Hospitals, Banks, Supermarkets, Clinics, Restaurants, Colleges, and Every Business.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link 
              href="/register"
              className="px-6 py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl hover:shadow-indigo-500/25 flex items-center gap-1.5 hover:scale-[1.02] transition-all"
            >
            Register Organization <ArrowRight className="w-4 h-4" />
          </Link>
          <a 
            href="#track"
            className="px-6 py-3.5 text-sm font-bold rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            Track Active Ticket
          </a>
        </div>
      </section>

      {/* Section 2: Industry Deployment Sector Grid */}
        <section className="p-6 md:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl space-y-6 bg-black/60 backdrop-blur-md">
          <p className="text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Universal deployment across any industry queue system
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
            {['Hospitals & Clinics', 'Banks & FinTech', 'Salons & Spas', 'Supermarkets', 'Colleges & Uni', 'Service Desks'].map((type, i) => (
              <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/5 text-xs font-semibold flex flex-col items-center gap-2 hover:scale-105 transition-transform">
                <span className="text-xl">{['🏥', '💼', '✂️', '🛒', '🎓', '🛠️'][i]}</span>
                <span>{type}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Features */}
        <section className="p-6 md:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl space-y-6 bg-black/60 backdrop-blur-md">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Full-Stack Core Features</h2>
            <p className="text-xs text-zinc-400">Everything required to orchestrate waiting lists and automatic notifications.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: 'QR Code Entry Points', desc: 'Unique QR scanning nodes pointing directly to queue portals.', icon: QrCode },
              { title: 'Live Progress Tracking', desc: 'Real-time estimation wait calculations updated dynamically.', icon: Clock },
              { title: 'Twilio SMS Triggers', desc: 'Dispatches automatic alerts when customer has 5 or 2 ahead.', icon: Bell },
              { title: 'Multi-Tenant Security', desc: 'Strict database tenant isolation keeps business profiles separate.', icon: ShieldCheck },
              { title: 'Peak Analytics', desc: 'Aggregates statistics on average waiting time and peak traffic.', icon: BarChart3 },
              { title: 'FIFO Core Lists', desc: 'Clean First-In-First-Out list buffers with Recall and Skip capabilities.', icon: Users }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2 hover:bg-white/10 transition-colors">
                  <span className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 inline-block">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h4 className="font-bold text-sm text-white">{f.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: How It Works */}
        <section className="p-6 md:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl space-y-6 bg-black/60 backdrop-blur-md">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">How It Works</h2>
            <p className="text-xs text-zinc-400">Deploy digital waitlists in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Register & Verify', desc: 'Organizations fill details, upload documents, and get approved by Super Admin.' },
              { step: '02', title: 'Onboard QR Code', desc: 'Download unique flyer QR code from dashboard and place at reception desks.' },
              { step: '03', title: 'Wait Elsewhere', desc: 'Customers scan QR to book tokens. SMS notifies them when their turn approaches.' }
            ].map((s, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 relative space-y-2">
                <span className="text-4xl font-extrabold text-indigo-500/20 absolute top-4 right-4">{s.step}</span>
                <h4 className="font-bold text-sm text-white">{s.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Ticket Tracker Search Widget */}
        <section id="track" className="p-6 md:p-8 rounded-3xl glass-panel border border-indigo-500/20 bg-indigo-500/5 shadow-2xl space-y-6 bg-black/60 backdrop-blur-md max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">Track Active Ticket</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Scan your ticket code or input phone number / token code below to check your live position.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Phone number / Token (e.g. H004)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-10 pr-3 premium-input text-xs"
              />
            </div>
            <button 
              type="submit"
              className="py-3 px-5 font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs transition-colors cursor-pointer"
            >
              Search Ticket
            </button>
          </form>

          {searchAttempted && (
            <div className="border-t border-white/10 pt-4 space-y-2 max-w-md mx-auto">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Search Results</h4>
              {searchResults.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-2">No active ticket matching query found.</p>
              ) : (
                searchResults.map(ticket => (
                  <div key={ticket.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{ticket.tokenNumber}</p>
                      <p className="text-[9px] text-zinc-500">{ticket.organizationName} | {ticket.customerName}</p>
                    </div>
                    <Link 
                      href={`/queue/${ticket.organizationId}?ticketId=${ticket.id}`}
                      className="py-1 px-2.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 hover:scale-105 transition-transform"
                    >
                      Track Live <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Section 6: Licensing & Plans */}
        <section className="p-6 md:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl space-y-6 bg-black/60 backdrop-blur-md">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">SaaS Licensing Plans</h2>
            <p className="text-xs text-zinc-400">Scale queue desks and alert counts dynamically.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
              <div>
                <h4 className="font-bold text-sm text-white">Starter Plan</h4>
                <p className="text-[9px] text-zinc-500 mt-0.5">For small clinics or service counters</p>
              </div>
              <p className="text-2xl font-extrabold text-white">$29<span className="text-xs text-zinc-500">/mo</span></p>
              <ul className="text-xs text-zinc-400 space-y-2 flex-1 border-t border-white/5 pt-3">
                <li>• 1 Location QR Node</li>
                <li>• Standard wait lists</li>
                <li>• 1 Admin Seat</li>
              </ul>
              <Link href="/register?plan=Starter" className="w-full text-center py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-xs font-bold mt-2">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex flex-col gap-4 relative">
              <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded bg-indigo-600 text-[8px] font-bold text-white uppercase tracking-wider">Recommended</span>
              <div>
                <h4 className="font-bold text-sm text-white">Professional</h4>
                <p className="text-[9px] text-zinc-500 mt-0.5">For busy operators & clinics</p>
              </div>
              <p className="text-2xl font-extrabold text-indigo-400">$79<span className="text-xs text-zinc-500">/mo</span></p>
              <ul className="text-xs text-zinc-400 space-y-2 flex-1 border-t border-white/5 pt-3">
                <li>• Unlimited Location QR Nodes</li>
                <li>• Automatic SMS alerts</li>
                <li>• Advanced Peak Reports</li>
                <li>• 5 Admin Seats</li>
              </ul>
              <Link href="/register?plan=Professional" className="w-full text-center py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-xs font-bold mt-2">
                Start Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
              <div>
                <h4 className="font-bold text-sm text-white">Enterprise Plan</h4>
                <p className="text-[9px] text-zinc-500 mt-0.5">For large chains or universities</p>
              </div>
              <p className="text-2xl font-extrabold text-white">Custom</p>
              <ul className="text-xs text-zinc-400 space-y-2 flex-1 border-t border-white/5 pt-3">
                <li>• Consolidated multi-branch desk</li>
                <li>• Custom SMS Sender IDs</li>
                <li>• Dedicated SLA & Account manager</li>
              </ul>
              <Link href="/register?plan=Enterprise" className="w-full text-center py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-xs font-bold mt-2">
                Start Trial
              </Link>
            </div>
          </div>
        </section>

        {/* Section 7: Testimonial & Footer */}
        <section className="p-6 md:p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl space-y-8 bg-black/60 backdrop-blur-md">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <h4 className="font-bold text-lg text-white">"Lobby congestion decreased by 78%"</h4>
              <p className="text-xs italic text-zinc-400 leading-relaxed">
                "Patients scan the QR flyer, book, and wait outside in open areas. They receive the SMS alert right when their turn is near. Absolute game changer!"
              </p>
              <span className="text-[10px] text-zinc-500 font-bold block">- Dr. Arthur Pendelton, Clinic Chief</span>
            </div>
            <div className="space-y-3 md:border-l md:border-white/5 md:pl-6 text-xs text-zinc-400 leading-relaxed">
              <h5 className="font-bold text-sm text-white">Platform Summary</h5>
              <p>
                QueueFlow AI orchestrates digital waitlists, live queues, SMS alerts, and business reports securely across isolated multi-tenant databases.
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex justify-between items-center text-[10px] text-zinc-500">
            <span>&copy; {new Date().getFullYear()} QueueFlow AI. All rights reserved.</span>
            <Link href="/admin/login" className="hover:text-white transition-colors">Super Admin Login</Link>
          </div>
        </section>

      </div>

    </div>
  );
}
