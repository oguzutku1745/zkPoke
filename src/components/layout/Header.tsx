import React from 'react';
import { WalletSelector } from '../WalletSelector';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  // Force navigation to landing page
  const goToLandingPage = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use window.location for a hard redirect to ensure we're not caught in any React Router issues
    window.location.href = '/';
  };

  return (
    <header className="border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <a 
          href="/" 
          onClick={goToLandingPage}
          className="flex items-center bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
        >
          <img src="/logo.svg" alt="zkPoke Logo" className="h-8 w-8 text-slate-900" />
          <span className="ml-2 font-semibold text-slate-900">zkPoke</span>
        </a>
        <div className="flex items-center space-x-4">
          <WalletSelector />
          <button className="text-sm text-slate-600 hover:text-slate-900">Help</button>
          <button className="text-sm text-slate-600 hover:text-slate-900">About</button>
        </div>
      </div>
    </header>
  );
} 