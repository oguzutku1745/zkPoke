import React, { useState } from 'react';
import { Header, Footer, Button, Alert, BottomNavigation } from '../components';
import { useContractContext } from '../context/ContractContext';
import { deployerEnv } from '../config';

async function getWalletAddress() {
  const wallet = await deployerEnv.getWallet();
  return wallet;
}

export function ProfilePage() {
  const { contract } = useContractContext();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const wallet = getWalletAddress();
  console.log(wallet);
  // Mock user data - will be replaced with contract data
  const [profile] = useState({
    username: '@akinspur',
    walletAddress: '0x154307....a705344',
    joinDate: 'May 2025',
    credentialsCount: 2,
    signalsSent: 0,
    signalsReceived: 0,
  });

  const handleDisconnect = () => {
    // TODO: Implement contract disconnection
    alert('This would disconnect the contract in a real implementation');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setSuccess('Address copied to clipboard');
        setTimeout(() => setSuccess(''), 3000);
      })
      .catch(err => {
        setError('Failed to copy');
        setTimeout(() => setError(''), 3000);
      });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-md mx-auto px-4 py-8 sm:px-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your Profile</h2>
            </div>
            
            <div className="px-6 py-5">
              {/* Profile header */}
              <div className="flex items-center mb-6">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="h-12 w-12 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-medium text-gray-900">{profile.username}</h3>
                  <div className="flex items-center mt-1">
                    <p className="text-sm text-gray-500 mr-2">{profile.walletAddress}</p>
                    <button 
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={() => handleCopy(profile.walletAddress)}
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-lg font-medium">{profile.joinDate}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <p className="text-xs text-gray-500">Signals Sent</p>
                  <p className="text-lg font-medium">{profile.signalsSent}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <p className="text-xs text-gray-500">Signals Received</p>
                  <p className="text-lg font-medium">{profile.signalsReceived}</p>
                </div>
              </div>
              
              {/* Credentials */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Your Credentials</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{profile.credentialsCount} Verified Credentials</p>
                      <p className="text-xs text-gray-500 mt-1">Used to establish your identity privately</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="small"
                      onClick={() => window.location.href = '/select-credentials'}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Contract connection */}
              <div className="mb-4">
                <h3 className="text-md font-medium text-gray-900 mb-3">Contract Connection</h3>
                <div className="bg-gray-50 p-4 rounded-md flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Connected to zkPoke</p>
                    <p className="text-xs text-gray-500 mt-1">Contract is active and synced</p>
                  </div>
                  <Button 
                    variant="text" 
                    size="small" 
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
              
              {/* Messages */}
              {error && <Alert type="error" message={error} className="mb-4" />}
              {success && <Alert type="success" message={success} className="mb-4" />}
            </div>
          </div>
        </div>
      </main>
      
      <div className="pb-16">
        {/* Spacer for the bottom navigation */}
      </div>
      <BottomNavigation />
      <Footer />
    </div>
  );
} 