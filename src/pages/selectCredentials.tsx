import { useState, useEffect } from 'react';
import { usePrivateRegister } from '../hooks/usePrivateRegister';
import { useNavigate } from 'react-router-dom';
import { useContractContext } from '../context/ContractContext';

// Define the credential types with their claim type values
const CREDENTIALS = [
  {
    id: 'world-id',
    title: 'World ID',
    description: 'Verify your unique human identity',
    claimType: 3,
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
    icon: (
      <svg className="h-6 w-6 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
];

export function SelectCredentialsPage() {
  const { addCredential, wait } = usePrivateRegister();
  const { contract } = useContractContext();
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // If we don't have a contract, redirect to landing page
  useEffect(() => {
    if (!contract) {
      navigate('/');
    }
  }, [contract, navigate]);

  const toggleCredential = (id: string) => {
    setSelectedCredentials(prev => 
      prev.includes(id) 
        ? prev.filter(credId => credId !== id)
        : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selectedCredentials.length === 0) {
      setError('Please select at least one credential to continue');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Process each selected credential
      for (const credentialId of selectedCredentials) {
        const credential = CREDENTIALS.find(cred => cred.id === credentialId);
        if (credential) {
          // For now, just add a simple claim hash (1234) for each credential
          // In a real app, you would generate or request actual credential data
          await addCredential(credential.claimType, 1234);
        }
      }
      
      setSuccess('Credentials added successfully!');
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err) {
      console.error('Error adding credentials:', err);
      setError('Failed to add credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-slate-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ml-2 font-semibold text-slate-900">zkPoke</span>
          </div>
          <div>
            <button className="text-sm text-slate-600 hover:text-slate-900 mr-4">Help</button>
            <button className="text-sm text-slate-600 hover:text-slate-900">About</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900">Generate your proofs</h1>
          <p className="text-gray-500 mt-2">Select the proofs you want to generate for your account</p>
        </div>

        {/* Credential Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {CREDENTIALS.map(credential => (
            <div 
              key={credential.id}
              onClick={() => toggleCredential(credential.id)}
              className={`
                border rounded-lg p-6 cursor-pointer transition-all duration-200
                ${selectedCredentials.includes(credential.id) 
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }
              `}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {credential.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{credential.title}</h3>
                  <p className="text-sm text-gray-500">{credential.description}</p>
                </div>
                {selectedCredentials.includes(credential.id) && (
                  <div className="ml-auto">
                    <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={isSubmitting || wait || selectedCredentials.length === 0}
            className={`
              py-3 px-6 rounded-md font-medium transition-all duration-200
              ${(isSubmitting || wait || selectedCredentials.length === 0) 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'
              }
            `}
          >
            {isSubmitting || wait ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : "Continue"}
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
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