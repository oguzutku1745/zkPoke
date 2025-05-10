import React, { useState, useEffect } from 'react';
import { userWallets, getSelectedUser, setSelectedUser } from '../config';

export function WalletSelector() {
  const [selectedUser, setSelectedUserState] = useState(getSelectedUser());
  const [isOpen, setIsOpen] = useState(false);

  // Handle user selection
  const handleSelectUser = (user: string) => {
    setSelectedUserState(user);
    setSelectedUser(user);
    setIsOpen(false);
    // Reload the page to apply the new wallet selection
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-sm text-slate-800 transition-colors"
      >
        <span>{userWallets[selectedUser as keyof typeof userWallets]?.name || 'Select Wallet'}</span>
        <svg 
          className="h-4 w-4 text-slate-600" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-200">
          <ul className="py-1">
            {Object.entries(userWallets).map(([key, wallet]) => (
              <li key={key}>
                <button
                  onClick={() => handleSelectUser(key)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 ${
                    selectedUser === key ? 'bg-slate-50 text-indigo-600 font-medium' : 'text-slate-700'
                  }`}
                >
                  {wallet.name} ({wallet.instagram})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 