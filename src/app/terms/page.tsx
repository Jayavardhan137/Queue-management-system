'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <span className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>QueueFlow AI</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-xs text-zinc-500">Last updated: July 2026</p>
        </div>

        <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By registering an organization, creating an account, or using QueueFlow AI (&quot;the Service&quot;) in any capacity, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Description of Service</h2>
            <p>
              QueueFlow AI provides digital queue and token management tools for businesses, including QR-code based customer check-in, live queue tracking, SMS notifications, and administrative dashboards. The Service is provided on a subscription basis as described at the time of registration.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Account Registration &amp; Verification</h2>
            <p>
              Organizations must provide accurate business information and valid verification documents (business registration proof and owner identity proof) during signup. QueueFlow AI reserves the right to approve, reject, or suspend any organization account at its sole discretion, including after initial approval, if information is found to be false, fraudulent, or in violation of these Terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Subscription, Billing &amp; Cancellation</h2>
            <p>
              Paid plans are billed on a recurring monthly basis via our third-party payment processor (Razorpay). By subscribing, you authorize recurring charges to your chosen payment method. Subscriptions may be cancelled at any time; cancellation stops future billing but does not entitle you to a refund for the current billing period unless required by applicable law. Fees, once paid, are non-refundable except where required by law or expressly stated otherwise.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Customer Data You Collect</h2>
            <p>
              As an organization using the Service, you will collect personal information from your own customers (such as name and phone number) in order to operate your queue. You are solely responsible for ensuring you have a lawful basis to collect this information and for how you use it. QueueFlow AI acts as a data processor on your behalf for this customer data and does not use it for any purpose other than operating the Service (e.g., sending queue-related SMS notifications).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">6. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Send spam, unsolicited, or misleading SMS messages to any individual</li>
              <li>Upload fraudulent, forged, or misleading verification documents</li>
              <li>Attempt to gain unauthorized access to another organization&apos;s data or dashboard</li>
              <li>Interfere with, overload, or attempt to circumvent rate limits or security measures of the Service</li>
              <li>Use the Service for any unlawful purpose</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">7. Third-Party Services</h2>
            <p>
              The Service relies on third-party providers to function, including payment processing (Razorpay), SMS delivery (Twilio), transactional email (Resend), file storage (Cloudinary), and database/hosting infrastructure (Supabase, Render, Vercel). We are not responsible for outages, delays, or failures caused by these third-party providers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">8. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied. To the maximum extent permitted by law, QueueFlow AI shall not be liable for any indirect, incidental, special, or consequential damages, including loss of revenue, data, or business opportunity, arising from your use of or inability to use the Service, including delayed or undelivered SMS notifications.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">9. Account Suspension &amp; Termination</h2>
            <p>
              We may suspend or terminate any account that violates these Terms, engages in fraudulent activity, or fails to pay applicable fees, with or without prior notice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">10. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">12. Contact</h2>
            <p>
              For questions about these Terms, please contact us through the support details provided on our website.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-white/5">
          <Link href="/register" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}
