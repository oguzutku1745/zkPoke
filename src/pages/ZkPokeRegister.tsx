import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AztecAddress } from '@aztec/aztec.js';
import { useZkPoke } from '../hooks/useZkPoke';
import { Footer, Header, Button, Alert } from '../components';

export function ZkPokeRegisterPage() {
  const navigate = useNavigate();
  const { 
    deploy,
    register,
    registerInfo,
    getAddressByInstagram,
    contract,
    wait,
  } = useZkPoke();

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<'alice' | 'bob' | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Predefined user information
  const users = {
    alice: {
      instagram: '@alice.eth',
      fullName: 'Alice Wonderland',
      partialName: 'Alice W.',
      nationality: 'TR',
      wallet: '0x154307e2c5e6b146106ad12642a7a1abef01990b0bc68b21c0de67267a705344'
    },
    bob: {
      instagram: '@akinspur',
      fullName: 'Akın Semih Pür',
      partialName: 'Akin Semih P.',
      nationality: 'TR',
      wallet: '0x1b7632af8b3cb6921631a6692c357ac7bac210fff6dce3e173ed8ef38bedeed6'
    }
  };

  // Clear errors and success messages when moving between steps
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [currentStep]);

  const handleDeployContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    try {
      const deployedContract = await deploy(e);
      if (deployedContract) {
        setSuccess('ZkPoke contract deployed successfully!');
        setTimeout(() => {
          setCurrentStep(2);
        }, 1500);
      }
    } catch (err) {
      console.error('Error deploying contract:', err);
      setError('Failed to deploy contract. Please try again.');
    }
  };

  const handleSelectUser = async (user: 'alice' | 'bob') => {
    setSelectedUser(user);
    setError(null);
    
    try {
      // First, register the user's instagram ID
      await register(users[user].instagram);
      
      // Then register the detailed info
      await registerInfo(
        users[user].instagram,
        users[user].fullName,
        users[user].partialName,
        users[user].nationality
      );
      
      setSuccess(`${user === 'alice' ? 'Alice' : 'Akın'} registered successfully!`);
      setRegistrationComplete(true);
    } catch (err) {
      console.error(`Error registering ${user}:`, err);
      setError(`Failed to register ${user}. Please try again.`);
    }
  };

  const handleVerifyRegistration = async () => {
    if (!selectedUser) {
      setError('No user selected. Please register a user first.');
      return;
    }

    try {
      const address = await getAddressByInstagram(users[selectedUser].instagram);
      
      if (address && !address.equals(AztecAddress.ZERO)) {
        setSuccess(`Registration verified! Instagram ID ${users[selectedUser].instagram} is registered to address ${address.toString()}`);
        
        // Navigate to the dashboard after successful verification
        setTimeout(() => {
          navigate('/signals-dashboard');
        }, 2000);
      } else {
        setError('Registration verification failed. The address was not found or is invalid.');
      }
    } catch (err) {
      console.error('Error verifying registration:', err);
      setError('Failed to verify registration. Please try again.');
    }
  };

  // Step indicators
  const steps = [
    { name: 'Deploy ZkPoke', completed: !!contract },
    { name: 'Register User', completed: registrationComplete },
    { name: 'Verification', completed: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-grow py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">ZkPoke Registration</h1>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Register with ZkPoke to start making secure, private connections
            </p>
          </header>
          
          {/* Progress Steps */}
          <div className="relative mb-16">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Only allow navigation to completed steps or the next step
                    if (step.completed || index <= steps.findIndex(s => !s.completed)) {
                      setCurrentStep(index + 1);
                    }
                  }}
                  disabled={!step.completed && index > steps.findIndex(s => !s.completed)}
                  className={`flex flex-col items-center group ${
                    !step.completed && index > steps.findIndex(s => !s.completed)
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                  }`}
                >
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full 
                    ${step.completed 
                      ? 'bg-emerald-500 text-white' 
                      : currentStep === index + 1 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white border-2 border-slate-300 text-slate-500'
                    }
                    transition-all duration-200
                  `}>
                    <span className="text-base font-semibold">{index + 1}</span>
                  </div>
                  <span className={`
                    mt-2 font-medium text-sm
                    ${currentStep === index + 1 ? 'text-indigo-600' : 'text-slate-600'}
                  `}>
                    {step.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Display error and success messages */}
          {error && <Alert type="error" message={error} className="mb-6" />}
          {success && <Alert type="success" message={success} className="mb-6" />}

          {/* Step 1: Deploy Contract */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-slate-800">1. Deploy ZkPoke Contract</h2>
              </div>
              <div className="p-6">
                {!contract ? (
                  <div className="text-center py-8">
                    <div className="mx-auto max-w-md">
                      <svg className="h-20 w-20 text-indigo-300 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                        <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                        <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                      </svg>
                      <p className="text-slate-500 mb-6">
                        Deploy the ZkPoke smart contract to begin. This will create a new instance of the contract on the Aztec Network.
                      </p>
                      <form onSubmit={handleDeployContract} className="flex justify-center">
                        <button 
                          type="submit" 
                          disabled={wait}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200 font-medium"
                        >
                          {wait ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Deploying...
                            </div>
                          ) : 'Deploy ZkPoke Contract'}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-800 p-6 rounded-lg border border-emerald-200">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-emerald-500 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <div>
                        <h3 className="font-semibold text-lg">ZkPoke contract deployed successfully!</h3>
                        <p className="text-sm text-emerald-700">Your contract is now live on the Aztec Network</p>
                      </div>
                    </div>
                    <div className="mt-4 bg-white p-3 rounded border border-emerald-200">
                      <p className="text-sm font-medium text-slate-500 mb-1">Contract Address:</p>
                      <p className="font-mono text-sm break-all">{contract.address.toString()}</p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                        transition-all duration-200 font-medium"
                    >
                      Continue to Registration
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Register User */}
          {currentStep === 2 && contract && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-slate-800">2. Register User</h2>
              </div>
              <div className="p-6">
                <p className="text-slate-500 mb-6">
                  Select a user to register with the ZkPoke contract. This will register the user's Instagram ID and personal information.
                </p>
                
                {!registrationComplete ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Alice Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-medium text-slate-800 mb-2">Alice</h3>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-slate-500">
                          <span className="font-medium">Instagram:</span> {users.alice.instagram}
                        </p>
                        <p className="text-sm text-slate-500">
                          <span className="font-medium">Full Name:</span> {users.alice.fullName}
                        </p>
                        <p className="text-sm text-slate-500">
                          <span className="font-medium">Nationality:</span> {users.alice.nationality}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleSelectUser('alice')}
                        disabled={wait}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200 text-sm font-medium"
                      >
                        {wait && selectedUser === 'alice' ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Registering...
                          </div>
                        ) : 'Register as Alice'}
                      </button>
                    </div>
                    
                    {/* Bob (Akın) Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-medium text-slate-800 mb-2">Akın</h3>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-slate-500">
                          <span className="font-medium">Instagram:</span> {users.bob.instagram}
                        </p>
                        <p className="text-sm text-slate-500">
                          <span className="font-medium">Full Name:</span> {users.bob.fullName}
                        </p>
                        <p className="text-sm text-slate-500">
                          <span className="font-medium">Nationality:</span> {users.bob.nationality}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleSelectUser('bob')}
                        disabled={wait}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200 text-sm font-medium"
                      >
                        {wait && selectedUser === 'bob' ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Registering...
                          </div>
                        ) : 'Register as Akın'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-800 p-6 rounded-lg border border-emerald-200">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-emerald-500 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <div>
                        <h3 className="font-semibold text-lg">User registered successfully!</h3>
                        <p className="text-sm text-emerald-700">
                          {selectedUser === 'alice' ? 'Alice' : 'Akın'} has been registered with ZkPoke
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                        transition-all duration-200 font-medium"
                    >
                      Continue to Verification
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {currentStep === 3 && contract && registrationComplete && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-slate-800">3. Verify Registration</h2>
              </div>
              <div className="p-6">
                <p className="text-slate-500 mb-6">
                  Verify that your registration was successful by checking if your Instagram ID is correctly linked to your address.
                </p>
                
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                  <h3 className="text-lg font-medium text-slate-800 mb-3">Registration Details</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">User:</span> {selectedUser === 'alice' ? 'Alice' : 'Akın'}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Instagram ID:</span> {selectedUser ? users[selectedUser].instagram : ''}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Wallet Address:</span> 
                      <span className="font-mono break-all block mt-1 text-xs">
                        {selectedUser ? users[selectedUser].wallet : ''}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button 
                    onClick={handleVerifyRegistration}
                    disabled={wait}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 font-medium"
                  >
                    {wait ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </div>
                    ) : 'Verify Registration'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 