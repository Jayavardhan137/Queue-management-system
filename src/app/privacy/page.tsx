'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-zinc-500">Last updated: July 2026</p>
        </div>

        <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Overview</h2>
            <p>
              This Privacy Policy explains what information QueueFlow AI (&quot;we&quot;, &quot;us&quot;) collects, how we use it, and the choices you have. It applies to organizations that register on our platform (&quot;Organizations&quot;) and the individuals who use an Organization&apos;s queue (&quot;Customers&quot;).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
            <p className="font-semibold text-white">From Organizations (business owners):</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Business name, type, address, and contact phone/email</li>
              <li>Owner name and login credentials (passwords are stored as secure one-way hashes, never in plain text)</li>
              <li>Verification documents: business registration certificate and owner identity proof</li>
              <li>Payment and subscription information (processed by Razorpay; we do not store your card details)</li>
            </ul>
            <p className="font-semibold text-white pt-2">From Customers (people joining a queue):</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Name and phone number (required, used to identify your position in queue and send SMS updates)</li>
              <li>Email and purpose of visit (optional, if provided)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. How We Use Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>To operate and provide the queue management service</li>
              <li>To send SMS notifications about queue status and turn updates (via Twilio)</li>
              <li>To send account-related emails, such as password reset links (via Resend)</li>
              <li>To process subscription payments (via Razorpay)</li>
              <li>To verify Organization identity and legitimacy before approving accounts</li>
              <li>To maintain security, detect fraud, and enforce our Terms of Service</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Third-Party Service Providers</h2>
            <p>We share data with the following processors solely to operate the Service:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="font-semibold text-white">Supabase</span> — database hosting</li>
              <li><span className="font-semibold text-white">Render</span> — backend server hosting</li>
              <li><span className="font-semibold text-white">Vercel</span> — frontend hosting</li>
              <li><span className="font-semibold text-white">Cloudinary</span> — storage of uploaded verification documents</li>
              <li><span className="font-semibold text-white">Twilio</span> — SMS delivery</li>
              <li><span className="font-semibold text-white">Resend</span> — transactional email delivery</li>
              <li><span className="font-semibold text-white">Razorpay</span> — payment processing</li>
            </ul>
            <p>We do not sell personal information to third parties for advertising purposes.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Data Retention</h2>
            <p>
              We retain Organization and Customer data for as long as the associated account is active, or as needed to comply with legal obligations, resolve disputes, and enforce our agreements. Verification documents are retained for the duration of the account&apos;s active status plus any legally required retention period.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">6. Data Security</h2>
            <p>
              We use industry-standard measures to protect data, including encrypted password storage (bcrypt hashing), encrypted database connections, rate limiting on sensitive endpoints, and access controls that restrict each Organization to viewing only its own data. No system is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">7. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct, or request deletion of your personal information. To exercise these rights, please contact us through the support details on our website. Organizations are responsible for handling similar requests from their own Customers regarding queue booking data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">8. Children&apos;s Privacy</h2>
            <p>
              The Service is intended for business use and is not directed at children. We do not knowingly collect personal information from children under 18.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be reflected by updating the &quot;Last updated&quot; date above.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">10. Contact</h2>
            <p>
              For privacy-related questions or requests, please contact us through the support details provided on our website.
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
