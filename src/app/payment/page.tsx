'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
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

declare global {
  interface Window {
    Razorpay: any;
  }
}

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId') || '';
  const plan = searchParams.get('plan') || 'Starter';
  const planDetails = PLAN_INFO[plan] || PLAN_INFO.Starter;

  const { fetchOwnOrgProfile, createPaymentOrder, verifyPayment } = useQueue();
  const [orgName, setOrgName] = useState('Your Business');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (orgId) {
      fetchOwnOrgProfile(orgId).then(org => {
        if (org) {
          setOrgName(org.name);
          setOwnerName(org.ownerName);
          setOwnerEmail(org.email);
          setOwnerPhone(org.phone);
        }
      });
    }
  }, [orgId]);

  const handlePayNow = async () => {
    setError('');
    setIsLoading(true);

    if (!scriptReady || !window.Razorpay) {
      setError('Payment gateway is still loading. Please wait a moment and try again.');
      setIsLoading(false);
      return;
    }

    const orderResult = await createPaymentOrder(plan);
    if (!orderResult.ok || !orderResult.orderId) {
      setError(orderResult.message || 'Could not start checkout. Please try again.');
      setIsLoading(false);
      return;
    }

    const options = {
      key: orderResult.keyId,
      amount: orderResult.amount,
      currency: orderResult.currency,
      name: 'QueueFlow AI',
      description: `${planDetails.name} Subscription — ${orgName}`,
      order_id: orderResult.orderId,
      prefill: {
        name: ownerName,
        email: ownerEmail,
        contact: ownerPhone,
      },
      theme: { color: '#6366f1' },
      handler: async function (response: any) {
        const verifyResult = await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          plan
        );
        if (verifyResult.ok) {
          setPaymentSuccess(true);
          setTimeout(() => {
            router.push(`/register/success?orgId=${orgId}`);
          }, 1500);
        } else {
          setError(verifyResult.message || 'Payment verification failed. Please contact support.');
        }
        setIsLoading(false);
      },
      modal: {
        ondismiss: function () {
          setIsLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      setError(`Payment failed: ${response.error.description || 'Please try again.'}`);
      setIsLoading(false);
    });
    rzp.open();
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
            Your payment was verified successfully. Activating organization waitlist workspace now...
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
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
        strategy="afterInteractive"
      />

      <div className="absolute top-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto w-full grid md:grid-cols-12 gap-8 items-start relative z-10">

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

        <div className="md:col-span-7 glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" /> Secure Payment
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Payments are processed securely via Razorpay. Click below to open the secure checkout window.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Billed to</span>
              <span className="text-white font-semibold">{ownerName || orgName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Email</span>
              <span className="text-white font-semibold">{ownerEmail || '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Phone</span>
              <span className="text-white font-semibold">{ownerPhone || '—'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" /> Test Mode Checkout
            </p>
            <p>
              This gateway is currently in test mode. Use Razorpay&apos;s test card number
              <code className="mx-1 px-1.5 py-0.5 bg-black/30 rounded font-mono">4111 1111 1111 1111</code>
              with any future expiry date and any CVV to simulate a successful payment.
            </p>
          </div>

          <button
            onClick={handlePayNow}
            disabled={isLoading}
            className="w-full py-3.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                Pay ${planDetails.price}.00 Securely <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 pt-2">
            <Lock className="w-3 h-3" /> Secured by Razorpay — SSL Encrypted
          </div>
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
