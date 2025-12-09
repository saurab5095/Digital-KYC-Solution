import React from 'react';

export default function Hero({ subtitle = "Follow the on-screen guidance for a successful scan." }) {
  return (
    <section className="relative -mt-6 mb-6">
      {}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-[#083C66] to-[#005AA7] opacity-6 rounded-b-full blur-xl" />

      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow p-6 relative" style={{ zIndex: 10 }}>
          <h1 className="text-3xl font-extrabold text-slate-800">Digital KYC Solution</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}
