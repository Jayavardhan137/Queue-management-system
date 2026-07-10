'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueue } from '@/context/QueueContext';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  FileText, 
  ShieldCheck, 
  UploadCloud,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';

const BUSINESS_SECTORS = [
  { id: 'Hospital', name: 'Hospital', emoji: '🏥' },
  { id: 'Clinic', name: 'Clinic', emoji: '🩺' },
  { id: 'Bank', name: 'Bank', emoji: '💼' },
  { id: 'Government Office', name: 'Government Office', emoji: '🏛️' },
  { id: 'Supermarket', name: 'Supermarket', emoji: '🛒' },
  { id: 'College', name: 'College', emoji: '🏫' },
  { id: 'University', name: 'University', emoji: '🎓' },
  { id: 'Restaurant', name: 'Restaurant', emoji: '🍔' },
  { id: 'Service Center', name: 'Service Center', emoji: '🛠️' },
  { id: 'Ticket Counter', name: 'Ticket Counter', emoji: '🎟️' },
  { id: 'Salon', name: 'Salon', emoji: '✂️' },
  { id: 'Pharmacy', name: 'Pharmacy', emoji: '💊' },
  { id: 'Post Office', name: 'Post Office', emoji: '📮' }
];

const BUSINESS_TYPES = BUSINESS_SECTORS.map(s => s.name);

const PLAN_DETAILS: Record<string, { name: string; price: string; features: string }> = {
  Starter: { name: 'Starter Plan', price: '$29/mo', features: '1 Location QR Node, Standard wait lists, 1 Admin Seat' },
  Professional: { name: 'Professional Plan', price: '$79/mo', features: 'Unlimited QR Nodes, Automatic SMS triggers, Peak analytics, 14-day trial' },
  Enterprise: { name: 'Enterprise Plan', price: 'Custom Pricing', features: 'Consolidated multi-branch desks, Custom SMS Sender IDs, SLA guarantee' }
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'Starter';
  const selectedPlan = PLAN_DETAILS[plan] || PLAN_DETAILS.Starter;

  const { registerOrganization } = useQueue();

  const [formData, setFormData] = useState({
    name: '',
    businessType: 'Hospital',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const [regDoc, setRegDoc] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [docProgress, setDocProgress] = useState(0);
  const [proofProgress, setProofProgress] = useState(0);
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (type: 'reg' | 'id', file: File) => {
    if (type === 'reg') {
      setRegDoc(file);
      setDocProgress(10);
      const interval = setInterval(() => {
        setDocProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 30;
        });
      }, 200);
    } else {
      setIdProof(file);
      setProofProgress(10);
      const interval = setInterval(() => {
        setProofProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 30;
        });
      }, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.name || !formData.ownerName || !formData.email || !formData.phone || !formData.address) {
      setError('Please fill in all standard details.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!regDoc || !idProof) {
      setError('Please upload both the Business Registration and Identity documents.');
      return;
    }
    if (!acceptedTerms) {
      setError('You must accept the terms of service.');
      return;
    }

    setIsLoading(true);

    try {
      // Create registered organization via the real backend
      const result = await registerOrganization({
        name: formData.name,
        businessType: formData.businessType,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        businessAddress: formData.address,
        password: formData.password,
      });

      if (!result.ok || !result.organization) {
        setError(result.message || 'An error occurred during registration. Please try again.');
        setIsLoading(false);
        return;
      }

      // Redirect immediately to payment checkout flow
      router.push(`/payment?orgId=${result.organization.id}&plan=${plan}`);
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex flex-col justify-center py-12 px-6 relative">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none"></div>

      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tight text-white mb-2">
            <span className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>QueueFlow AI</span>
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight">Register Your Business</h2>
          <p className="text-sm text-zinc-400">Join the universal smart queue ecosystem and unlock digital waitlists.</p>
        </div>

        {/* Selected Plan Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Selected Subscription Plan</span>
            <h4 className="font-bold text-sm text-white">{selectedPlan.name} <span className="text-indigo-400 font-mono">({selectedPlan.price})</span></h4>
            <p className="text-[11px] text-zinc-400">{selectedPlan.features}</p>
          </div>
          <Link href="/" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 shrink-0">
            Change Plan
          </Link>
        </div>

        {/* Card Form */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Organization Name</label>
                <input 
                  type="text" 
                  name="name"
                  placeholder="e.g. City General Hospital"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 premium-input text-sm text-white"
                  required
                />
              </div>

              {/* Business Type */}
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Business Sector</label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full p-3 premium-input text-sm text-white flex justify-between items-center bg-[#121212] border-white/10 hover:bg-white/5 transition-all text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {BUSINESS_SECTORS.find(s => s.id === formData.businessType)?.emoji || '🏢'}{' '}
                    {BUSINESS_SECTORS.find(s => s.id === formData.businessType)?.name || formData.businessType}
                  </span>
                  <span className="text-zinc-500 text-xs">&#9662;</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full max-h-64 overflow-y-auto rounded-2xl bg-[#0f0f11] border border-white/10 shadow-2xl divide-y divide-white/5 scrollbar-thin scrollbar-thumb-zinc-800">
                    {BUSINESS_SECTORS.map((sector) => (
                      <button
                        key={sector.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, businessType: sector.id }));
                          setDropdownOpen(false);
                        }}
                        className={`w-full p-3 text-left text-sm flex items-center gap-2.5 transition-all hover:bg-indigo-600/10 hover:text-indigo-400 cursor-pointer ${
                          formData.businessType === sector.id ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-zinc-300'
                        }`}
                      >
                        <span className="text-lg">{sector.emoji}</span>
                        <span>{sector.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Owner Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Owner / Admin Name</label>
                <input 
                  type="text" 
                  name="ownerName"
                  placeholder="e.g. Dr. Jenkins"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  className="w-full p-3 premium-input text-sm text-white"
                  required
                />
              </div>

              {/* Owner Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="admin@yourbusiness.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 premium-input text-sm text-white"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contact Phone</label>
                <input 
                  type="text" 
                  name="phone"
                  placeholder="+1 555-0100"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 premium-input text-sm text-white"
                  required
                />
              </div>

              {/* Business Address */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Business Address</label>
                <input 
                  type="text" 
                  name="address"
                  placeholder="Street address, City, ZIP code"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-3 premium-input text-sm text-white"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Dashboard Password</label>
                <input 
                  type="password" 
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-3 premium-input text-sm text-white"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full p-3 premium-input text-sm text-white"
                  required
                />
              </div>
            </div>

            {/* Document Upload Details */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Verification Documents
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Registration Document */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400">Business Registration Certificate</label>
                  <div className="border border-dashed border-white/10 hover:border-indigo-500/40 rounded-2xl p-4 bg-white/2 hover:bg-white/5 transition-all text-center relative cursor-pointer">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={e => e.target.files && handleFileUpload('reg', e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud className="w-6 h-6 text-zinc-500 mx-auto mb-1" />
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {regDoc ? regDoc.name : 'Upload PDF/Image Certificate'}
                    </span>
                    {docProgress > 0 && (
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${docProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity Proof */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400">Owner Identity Proof (Passport/License)</label>
                  <div className="border border-dashed border-white/10 hover:border-indigo-500/40 rounded-2xl p-4 bg-white/2 hover:bg-white/5 transition-all text-center relative cursor-pointer">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={e => e.target.files && handleFileUpload('id', e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud className="w-6 h-6 text-zinc-500 mx-auto mb-1" />
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {idProof ? idProof.name : 'Upload PDF/Image Passport ID'}
                    </span>
                    {proofProgress > 0 && (
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${proofProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Terms check */}
            <div className="flex items-center gap-2.5 pt-2">
              <input 
                type="checkbox" 
                id="terms"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-[#121212] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-zinc-400 select-none cursor-pointer">
                I accept the <span className="text-indigo-400 underline font-semibold">Terms of Service</span> and authorize document screening.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  Proceed to Payment Options <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="text-zinc-500 font-mono uppercase tracking-widest text-xs animate-pulse">Initializing Portal...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
