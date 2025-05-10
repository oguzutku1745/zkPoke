import { useState, useEffect } from 'react';
import { usePrivateRegister } from '../hooks/usePrivateRegister';
import { useNavigate } from 'react-router-dom';
import { useContractContext } from '../context/ContractContext';
import { CredentialNote } from '../utils/tree-utils';

export function LandingPage() {
  const { deploy, initCredentialNotes, initializeTree, getAllCredentials, wait } = usePrivateRegister();
  const { contract } = useContractContext(); // Get contract from context
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isCheckingProofs, setIsCheckingProofs] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const createAccount = async () => {
    setIsCreatingAccount(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Step 1: Deploy contract
      setStep(1);
      const deployedContract = await deploy();
      
      if (!deployedContract) {
        throw new Error('Contract deployment failed');
      }
      
      // Step 2: Initialize credential notes
      setStep(2);
      const credentials = await initCredentialNotes(deployedContract);
      
      // Step 3: Initialize Merkle tree
      setStep(3);
      await initializeTree(deployedContract, credentials);
      
      // Step 4: Navigate to credential selection
      setStep(4);
      navigate('/select-credentials');
    } catch (err) {
      console.error('Error creating account:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const continueWithProofs = async () => {
    setIsCheckingProofs(true);
    setError(null);
    setSuccess(null);
    
    try {
      // First check if contract exists
      if (!contract) {
        setError('No existing account found. Please create a new account.');
        return;
      }
      
      // Fetch all credentials
      const credentials = await getAllCredentials();
      
      if (!credentials || credentials.length === 0) {
        setError('No credentials found. Please create a new account.');
        return;
      }
      
      // Check for required proofs (zkPassport and Instagram)
      const zkPassportProof = credentials.find((cred: CredentialNote) => cred.claim_type === 1n); // claimType 1 for zkPassport
      const instagramProof = credentials.find((cred: CredentialNote) => cred.claim_type === 4n); // claimType 4 for Instagram
      
      if (!zkPassportProof || zkPassportProof.claim_hash === 0n) {
        setError('ZK Passport proof is required but not found or not valid.');
        return;
      }
      
      //if (!instagramProof || instagramProof.claim_hash === 0n) {
      //  setError('Instagram proof is required but not found or not valid.');
      //  return;
      //}
      
      // If we have both required proofs with non-zero claim_hash values
      setSuccess('Verification successful! You can now continue to the app.');
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/signals-dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error verifying proofs:', err);
      setError('Failed to verify proofs. Please try again.');
    } finally {
      setIsCheckingProofs(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <div className="w-full md:w-1/2 bg-slate-900 p-10 flex flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to zkPoke</h1>
          <p className="text-gray-400 mb-10">The real intention based connection platform</p>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="mr-3 flex-shrink-0">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-white">Secure zero-knowledge proofs</p>
            </div>
            
            <div className="flex items-center">
              <div className="mr-3 flex-shrink-0">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-white">Privacy-focused connections</p>
            </div>
            
            <div className="flex items-center">
              <div className="mr-3 flex-shrink-0">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white">Instagram onboarding with zk-email technology</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="hidden md:flex md:w-1/2 bg-white p-10 flex-col justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-2">
            <svg className="h-12 w-12 mx-auto text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16-6l-8 8-8-8" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9l3 3 3-3" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Login or Create Account</h2>
          <p className="text-gray-500 mb-8">Connect with zk-proofs to be fully private</p>
          
          <button
            onClick={continueWithProofs}
            disabled={isCheckingProofs || isCreatingAccount}
            className={`w-full mb-4 flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm 
              ${isCheckingProofs 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              } transition-all duration-200`}
          >
            {isCheckingProofs ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying proofs...
              </div>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Continue with your proofs
              </>
            )}
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <button
            onClick={createAccount}
            disabled={isCreatingAccount || isCheckingProofs}
            className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 mb-4"
          >
            {isCreatingAccount ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {step === 1 ? "Deploying contract..." : 
                 step === 2 ? "Initializing credentials..." : 
                 step === 3 ? "Building verification tree..." : 
                 "Creating account..."}
              </div>
            ) : "Create Proofs on Magna"}
          </button>
          
          <button
            onClick={() => navigate('/zkpoke-register')}
            className="w-full py-3 px-4 border border-indigo-300 rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
          >
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ZkPoke Registration
            </div>
          </button>
          
          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-4 text-sm text-green-600 bg-green-50 p-2 rounded">
              {success}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-8">
            By continuing, you agree to our <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
} 