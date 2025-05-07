import { useState } from 'react';
import { usePrivateRegister } from '../hooks/usePrivateRegister';
import { Fr } from '@aztec/aztec.js';

export function PrivateRegisterPage() {
  const { 
    deploy, 
    contract, 
    wait, 
    initCredentialNotes, 
    getAllCredentials, 
    initializeTree, 
    verifyCredential, 
    addCredential,
    credentials,
    root 
  } = usePrivateRegister();

  const [claimType, setClaimType] = useState<number>(1);
  const [claimHash, setClaimHash] = useState<number>(1234);
  const [verifyType, setVerifyType] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Step indicators
  const steps = [
    { name: 'Deploy', completed: !!contract },
    { name: 'Initialize', completed: !!credentials && credentials.length > 0 },
    { name: 'Build Tree', completed: !!root },
    { name: 'Add/Verify', completed: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Private Register</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Secure credential management with Merkle tree verification on Aztec Network
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
                    setCurrentStep(index);
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
                    : currentStep === index 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white border-2 border-slate-300 text-slate-500'
                  }
                  transition-all duration-200
                `}>
                  <span className="text-base font-semibold">{index + 1}</span>
                </div>
                <span className={`
                  mt-2 font-medium text-sm
                  ${currentStep === index ? 'text-indigo-600' : 'text-slate-600'}
                `}>
                  {step.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: Deploy Contract */}
        {currentStep === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-800">1. Deploy Contract</h2>
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
                      Deploy the PrivateRegister smart contract to begin. This will create a new instance of the contract on the Aztec Network.
                    </p>
                    <form onSubmit={deploy} className="flex justify-center">
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
                        ) : 'Deploy Contract'}
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
                      <h3 className="font-semibold text-lg">Contract deployed successfully!</h3>
                      <p className="text-sm text-emerald-700">Your contract is now live on the Aztec Network</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white p-3 rounded border border-emerald-200">
                    <p className="text-sm font-medium text-slate-500 mb-1">Contract Address:</p>
                    <p className="font-mono text-sm break-all">{contract.address.toString()}</p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                      transition-all duration-200 font-medium"
                  >
                    Continue to Next Step
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Initialize Credential Notes */}
        {currentStep === 1 && contract && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-800">2. Initialize Credential Notes</h2>
            </div>
            <div className="p-6">
              <div className="text-slate-500 mb-6">
                Create empty credential notes in the contract for claim types 0-7. These will serve as placeholders until you add credential data.
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button 
                  onClick={initCredentialNotes} 
                  disabled={wait}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 font-medium"
                >
                  {wait ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Initializing...
                    </div>
                  ) : 'Initialize Credentials'}
                </button>
                <button 
                  onClick={getAllCredentials} 
                  disabled={wait}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800
                    focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 font-medium"
                >
                  {wait ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  ) : 'Get All Credentials'}
                </button>
              </div>

              {credentials.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-slate-800 mb-3">Credential Notes</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Index
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Claim Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Claim Hash
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {credentials.map((cred, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {idx}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {cred.claim_type.toString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700">
                              {cred.claim_hash.toString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                      transition-all duration-200 font-medium"
                  >
                    Continue to Next Step
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Initialize Tree */}
        {currentStep === 2 && contract && credentials.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-800">3. Initialize Merkle Tree</h2>
            </div>
            <div className="p-6">
              <div className="text-slate-500 mb-6">
                Build a Merkle tree from your credentials and store the verification root in the contract. This allows for efficient and secure credential verification.
              </div>
              <div className="flex justify-center mb-8">
                <button 
                  onClick={initializeTree} 
                  disabled={wait}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
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
                      Initializing...
                    </div>
                  ) : 'Initialize Tree'}
                </button>
              </div>

              {root && (
                <div className="mt-6 bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div className="flex items-center mb-4">
                    <svg className="h-6 w-6 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <h3 className="text-lg font-medium text-slate-800">Tree Root</h3>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 font-mono text-sm break-all text-slate-700">
                    {root.toString()}
                  </div>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                      transition-all duration-200 font-medium"
                  >
                    Continue to Next Step
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Add & Verify Credentials */}
        {currentStep === 3 && contract && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-800">4. Add & Verify Credentials</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Add Credential */}
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div className="flex items-center mb-4">
                    <svg className="h-5 w-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    <h3 className="text-lg font-medium text-slate-800">Add Credential</h3>
                  </div>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      addCredential(claimType, claimHash);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Claim Type (0-7):</label>
                      <input
                        type="number"
                        min="0"
                        max="7"
                        value={claimType}
                        onChange={(e) => setClaimType(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Claim Hash:</label>
                      <input
                        type="number"
                        value={claimHash}
                        onChange={(e) => setClaimHash(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm 
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={wait}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 font-medium"
                    >
                      {wait ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </div>
                      ) : 'Add Credential'}
                    </button>
                  </form>
                </div>

                {/* Verify Credential */}
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div className="flex items-center mb-4">
                    <svg className="h-5 w-5 text-emerald-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h3 className="text-lg font-medium text-slate-800">Verify Credential</h3>
                  </div>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      verifyCredential(verifyType);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Claim Type to Verify (0-7):</label>
                      <input
                        type="number"
                        min="0"
                        max="7"
                        value={verifyType}
                        onChange={(e) => setVerifyType(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm 
                          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={wait}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 
                        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 font-medium"
                    >
                      {wait ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </div>
                      ) : 'Verify Credential'}
                    </button>
                  </form>
                </div>
              </div>
              
              {/* Current Credentials */}
              {credentials.length > 0 && (
                <div className="mt-8 bg-white rounded-lg border border-slate-200">
                  <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-slate-800">Current Credentials</h3>
                    <button 
                      onClick={getAllCredentials} 
                      disabled={wait}
                      className="px-3 py-1 bg-slate-700 text-white rounded-md hover:bg-slate-800 
                        focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                        text-xs font-medium flex items-center
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {wait ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Refreshing...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="-ml-0.5 mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <polyline points="23 20 23 14 17 14"></polyline>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                          </svg>
                          Refresh
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead>
                        <tr className="bg-slate-50">
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Index
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Claim Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Claim Hash
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {credentials.map((cred, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {idx}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {cred.claim_type.toString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700">
                              {cred.claim_hash.toString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>Private Register | Powered by Aztec Network</p>
        </footer>
      </div>
    </div>
  );
} 