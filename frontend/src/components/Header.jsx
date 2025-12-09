import React from 'react';
import logo from '../assets/hdfc-original.png'; // add image in src/assets/

export default function Header() {
  return (
    <header className="w-full bg-[#004C8F] text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logo} alt="HDFC Bank" className="h-9 w-auto object-contain" />
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-wide">HDFC Digital KYC</div>
            <div className="text-xs opacity-90">Secure onboarding</div>
          </div>
        </div>

        <nav className="text-sm font-medium flex items-center gap-6" aria-label="top-navigation">
          <button className="hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-2">Help</button>
          <button className="hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-2">Contact</button>
        </nav>
      </div>
    </header>
  );
}
