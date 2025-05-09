import React from 'react';

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
          <svg className="h-8 w-8 text-slate-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16V16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 12L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="ml-2 font-semibold text-slate-900">zkPoke</span>
        </a>
        <div>
          <button className="text-sm text-slate-600 hover:text-slate-900 mr-4">Help</button>
          <button className="text-sm text-slate-600 hover:text-slate-900">About</button>
        </div>
      </div>
    </header>
  );
} 