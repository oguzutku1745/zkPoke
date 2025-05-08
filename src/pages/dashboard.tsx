import { useState, useEffect } from 'react';
import { usePrivateRegister } from '../hooks/usePrivateRegister';
import { useNavigate } from 'react-router-dom';
import { useContractContext } from '../context/ContractContext';

// Define the credential types with their claim type values - keep in sync with selectCredentials
const CREDENTIALS = [
  {
    id: 'world-id',
    title: 'World ID',
    description: 'Verify your unique human identity',
    claimType: 3,
    required: false,
    icon: (
      <svg className="h-6 w-6 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'zk-passport',
    title: 'ZK Passport',
    description: 'Prove your identity privately',
    claimType: 1,
    required: true,
    icon: (
      <svg className="h-6 w-6 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    title: 'Proof your Instagram',
    description: 'Connect your social presence',
    claimType: 4,
    required: true,
    icon: (
      <svg className="h-6 w-6 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'university',
    title: 'Proof your University',
    description: 'Verify your academic credentials',
    claimType: 2,
    required: false,
    icon: (
      <svg className="h-6 w-6 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
];

export function DashboardPage() {
  const { getAllCredentials, verifyCredential, wait } = usePrivateRegister();
  const { contract, root } = useContractContext();
  const [userCredentials, setUserCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verificationStatus, setVerificationStatus] = useState<{[key: number]: 'verified' | 'failed' | null}>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!contract || !root) {
      // If there's no contract or root, redirect to landing page
      navigate('/');
      return;
    }

    const fetchCredentials = async () => {
      setLoading(true);
      try {
        const creds = await getAllCredentials();
        if (creds) {
          setUserCredentials(creds);
          console.log("User credentials", creds);
        }
      } catch (error) {
        console.error('Error fetching credentials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [contract, root, navigate]);

  const handleVerifyCredential = async (claimType: number) => {
    try {
      setVerificationStatus(prev => ({ ...prev, [claimType]: null }));
      const success = await verifyCredential(claimType);
      setVerificationStatus(prev => ({ 
        ...prev, 
        [claimType]: success ? 'verified' : 'failed' 
      }));
    } catch (error) {
      console.error('Error verifying credential:', error);
      setVerificationStatus(prev => ({ ...prev, [claimType]: 'failed' }));
    }
  };

  const getCredentialInfo = (claimType: bigint) => {
    const credential = CREDENTIALS.find(cred => cred.claimType === Number(claimType));
    return credential || {
      title: `Credential Type ${claimType}`,
      description: 'Custom credential',
      required: false,
      icon: (
        <svg className="h-6 w-6 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    };
  };

  const handleAddMoreCredentials = () => {
    navigate('/select-credentials');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-slate-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ml-2 font-semibold text-slate-900 cursor-pointer" onClick={() => navigate('/')}>zkPoke</span>
          </div>
          <nav className="flex space-x-4">
            <button 
              onClick={handleAddMoreCredentials}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Add More Credentials
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Credentials</h1>
          <p className="text-gray-500 mt-1">Manage and verify your private credentials</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : userCredentials.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No credentials found</h3>
            <p className="mt-1 text-sm text-gray-500">Add some credentials to get started.</p>
            <div className="mt-6">
              <button
                onClick={handleAddMoreCredentials}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Credentials
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {userCredentials.map((credential, index) => {
              const credInfo = getCredentialInfo(credential.claim_type);
              const status = verificationStatus[Number(credential.claim_type)];
              
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {credInfo.icon}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">{credInfo.title}</h3>
                            {credInfo.required && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Required for zkPoke
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{credInfo.description}</p>
                        </div>
                        <div>
                          {status === 'verified' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                          {status === 'failed' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Failed
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="font-medium text-gray-700 mr-2">Claim Hash:</span>
                          <span>{credential.claim_hash.toString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="font-medium text-gray-700 mr-2">Claim Type:</span>
                          <span>{credential.claim_type.toString()}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <button
                          onClick={() => handleVerifyCredential(Number(credential.claim_type))}
                          disabled={wait || status === 'verified'}
                          className={`
                            px-4 py-2 rounded-md text-sm font-medium
                            ${wait 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : status === 'verified'
                                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            }
                          `}
                        >
                          {wait ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Verifying...
                            </div>
                          ) : status === 'verified' ? "Verified" : "Verify Credential"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between">
          <div className="text-sm text-gray-500">
            © 2023 zkPoke. All rights reserved.
          </div>
          <div className="flex gap-4 text-sm">
            <a href="#" className="text-gray-500 hover:text-gray-900">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-gray-900">Terms</a>
            <a href="#" className="text-gray-500 hover:text-gray-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
} 