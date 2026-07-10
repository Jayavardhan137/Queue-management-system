'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueue } from '@/context/QueueContext';
import { 
  CreditCard, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Loader2,
  Lock,
  ArrowLeft
} from 'lucide-react';

const PLAN_INFO: Record<string, { name: string; price: number; type: string; details: string[] }> = {
  Starter: {
    name: 'Starter Plan',
    price: 29,
    type: 'Monthly subscription',
    details: ['1 Location QR Code Node', 'Standard waiting queues', '1 Admin Console Access Seat', 'Basic client alerts']
  },
  Professional: {
    name: 'Professional Plan',
    price: 79,
    type: 'Monthly subscription (14-day free trial)',
    details: ['Unlimited Location QR Nodes', 'Automated Twilio SMS Triggers', 'Peak Analytics Dashboard', '5 Admin Console Seats', 'Recall & Skip tools']
  },
  Enterprise: {
    name: 'Enterprise Plan',
    price: 299,
    type: 'Monthly subscription (14-day free trial)',
    details: ['Consolidated Multi-branch desk console', 'Custom SMS Sender IDs & Twilio hooks', 'Dedicated SLA Response Guarantees', 'Unlimited Admin Console Seats', 'Custom logo configurations']
  }
};

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId') || '';
  const plan = searchParams.get('plan') || 'Starter';
  const planDetails = PLAN_INFO[plan] || PLAN_INFO.Starter;

  const { fetchOwnOrgProfile, updateSubscription } = useQueue();
  const [orgName, setOrgName] = useState('Your Business');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Prefilled dummy checkout form values
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('321');

  useEffect(() => {
    if (orgId) {
      fetchOwnOrgProfile(orgId).then(org => {
        if (org) {
          setOrgName(org.name);
          setCardName(org.ownerName);
        }
      });
    }
  }, [orgId]);

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cardName.trim()) {
      setError('Please provide the cardholder name.');
      return;
    }

    setIsLoading(true);

    // Simulate Stripe/Razorpay payment processing latency
    setTimeout(async () => {
      try {
        const trialStatus = plan === 'Starter' ? 'None' : 'Active';
        // Calculate subscription expiry: 30 days + 14 days trial if applicable
        const days = plan === 'Starter' ? 30 : 44; 
        const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        // Update organization payment status via the backend
        await updateSubscription(orgId, plan, 'Paid', trialStatus, expiryDate);
        setPaymentSuccess(true);

        setTimeout(() => {
          router.push(`/register/success?orgId=${orgId}`);
        }, 1500);
      } catch (err) {
        setError('Payment simulator encountered an error.');
        setIsLoading(false);
      }
    }, 2000);
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex p-4 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/20 animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Approved!</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your simulated payment transaction succeeded. Activating organization waitlist workspace now...
          </p>
          <div className="flex justify-center pt-2">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] flex flex-col justify-center py-12 px-6 relative">
      {/* Background decoration */}
      <div className="absolute top-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto w-full grid md:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left column: Invoice Summary */}
        <div className="md:col-span-5 space-y-6 md:sticky md:top-12">
          <div className="space-y-2">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-400 transition-colors mb-4">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </Link>
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-indigo-400 uppercase">
              <Sparkles className="w-4 h-4" /> QueueFlow Billing
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mt-1">Complete Subscription</h2>
            <p className="text-xs text-zinc-400">Secure checkout for {orgName}.</p>
          </div>

          {/* Pricing Details Card */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/2 backdrop-blur-md space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Plan Summary</span>
              <h3 className="text-xl font-bold text-white mt-0.5">{planDetails.name}</h3>
              <p className="text-xs text-zinc-500">{planDetails.type}</p>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Plan Rate (Monthly)</span>
                <span className="text-white font-semibold">${planDetails.price}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Setup Charge</span>
                <span className="text-emerald-400 font-semibold">Free</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5 text-sm font-bold">
                <span className="text-white">Total Amount Due</span>
                <span className="text-indigo-400">${planDetails.price}.00</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2.5">
              <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Included Features:</h4>
              <ul className="text-xs text-zinc-400 space-y-1.5">
                {planDetails.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right column: Simulated Card Checkout Panel */}
        <div className="md:col-span-7 glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" /> Payment Details
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Simulated development gateway. Enter mock credentials below to approve transaction.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSimulatePayment} className="space-y-4">
            
            {/* Cardholder Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Cardholder Name</label>
              <input 
                type="text" 
                placeholder="Name on card"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                className="w-full p-3 premium-input text-xs text-white"
                required
              />
            </div>

            {/* Card Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Card Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  className="w-full p-3 pl-10 premium-input text-xs text-white tracking-widest font-mono"
                  required
                />
                <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Expiration Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Expiration Date</label>
                <input 
                  type="text" 
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full p-3 premium-input text-xs text-white text-center font-mono"
                  required
                />
              </div>

              {/* CVV */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">CVC / CVV</label>
                <input 
                  type="password" 
                  value={cvc}
                  onChange={e => setCvc(e.target.value)}
                  placeholder="•••"
                  maxLength={3}
                  className="w-full p-3 premium-input text-xs text-white text-center font-mono"
                  required
                />
              </div>
            </div>

            {/* Development Mode Notice */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" /> Local Development Mode Simulated Checkout
              </p>
              <p>
                No real transactions are created. This mock form models a Stripe Elements / Razorpay Checkout wrapper. You can click simulate to securely approve.
              </p>
            </div>

            {/* Checkout Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authorizing with Gateway...
                </>
              ) : (
                <>
                  Simulate Payment Approval <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 pt-2">
              <Lock className="w-3 h-3" /> SSL 256-Bit Simulated Encryption Connection
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default function Payment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="text-zinc-500 font-mono uppercase tracking-widest text-xs animate-pulse">Loading Checkout Portal...</div>
      </div>
    }>
      <PaymentForm />
    </Suspense>
  );
}
