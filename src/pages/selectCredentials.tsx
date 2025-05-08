import { useState, useEffect, useRef } from 'react';
import { usePrivateRegister } from '../hooks/usePrivateRegister';
import { useNavigate, Link } from 'react-router-dom';
import { useContractContext } from '../context/ContractContext';
import { ZKPassport } from '@zkpassport/sdk';
import QRCode from 'react-qr-code';

// Define types for ZKPassport SDK responses
interface ZKProof {
  [key: string]: any;
}

interface VerificationResult {
  verified: boolean;
  result: {
    [key: string]: any;
  };
}

// Update credential types to indicate required ones
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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
];

export function SelectCredentialsPage() {
  const { addCredential, wait } = usePrivateRegister();
  const { contract } = useContractContext();
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInstagramForm, setShowInstagramForm] = useState(false);
  const [instagramEmail, setInstagramEmail] = useState('');
  const [instagramUserId, setInstagramUserId] = useState('');
  const [instagramEmailFile, setInstagramEmailFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // ZKPassport specific states
  const [showZkPassportFlow, setShowZkPassportFlow] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [requestId, setRequestId] = useState('');
  const [proofs, setProofs] = useState<any[]>([]);
  
  const zkpassportRef = useRef<ZKPassport | null>(null);
  
  const navigate = useNavigate();

  // If we don't have a contract, redirect to landing page
  useEffect(() => {
    if (!contract) {
      navigate('/');
    }
  }, [contract, navigate]);

  const toggleCredential = (id: string) => {
    // If the same credential is clicked, deselect it
    if (selectedCredential === id) {
      setSelectedCredential(null);
      setShowInstagramForm(false);
      setShowZkPassportFlow(false);
    } else {
      // Otherwise, select the new one
      setSelectedCredential(id);
      // Reset all forms
      setShowInstagramForm(false);
      setShowZkPassportFlow(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedCredential) {
      setError('Please select a credential to continue');
      return;
    }

    const credential = CREDENTIALS.find(cred => cred.id === selectedCredential);
    
    // Special handling for different credential types
    if (credential?.id === 'instagram') {
      setShowInstagramForm(true);
      return;
    } else if (credential?.id === 'zk-passport') {
      setShowZkPassportFlow(true);
      initiateZkPassportVerification();
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (credential) {
        // For other credentials, add a simple claim hash (1234)
        await addCredential(credential.claimType, 1234);
      }
      
      setSuccess('Credential added successfully!');
      
      // Clear the selection after successful addition
      setSelectedCredential(null);
    } catch (err) {
      console.error('Error adding credential:', err);
      setError('Failed to add credential. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateZkPassportVerification = async () => {
    setVerificationStatus('initiating');
    setError(null);
    setProofs([]);
    
    try {
      // Initialize the ZKPassport SDK with devMode enabled
      if (!zkpassportRef.current) {
        zkpassportRef.current = new ZKPassport("https://aztec.network/");
      }
      
      // Create a verification request
      const query = await zkpassportRef.current.request({
        name: "zkPoke",
        logo: "https://aztec.network/logo.png", // Replace with your actual logo URL
        purpose: "Age verification for zkPoke",
        scope: "zkpoke-verification", // Optional scope for unique identifier
        devMode: true, // Enable dev mode for testing
      });
      
      // Build verification query to verify age >= 18
      const {
        url,
        requestId,
        onRequestReceived,
        onGeneratingProof,
        onProofGenerated,
        onResult,
        onReject,
        onError,
      } = query.gte("age", 18).done();
      
      // Save URL and requestId
      setVerificationUrl(url);
      setRequestId(requestId);
      setVerificationStatus('awaiting_scan');
      
      // Register event handlers
      onRequestReceived(() => {
        setVerificationStatus('request_received');
      });
      
      onGeneratingProof(() => {
        setVerificationStatus('generating_proof');
      });
      
      // Store the proofs
      const collectedProofs: any[] = [];
      
      onProofGenerated((proof: ZKProof) => {
        collectedProofs.push(proof);
        setProofs(prevProofs => [...prevProofs, proof]);
      });
      
      onResult(async ({ verified, result }: VerificationResult) => {
        setVerificationStatus('proof_generated');
        
        if (!verified) {
          setError("Age verification failed");
          setVerificationStatus('failed');
          return;
        }
        
        try {
          // For development purposes, we'll hash the first proof as a claim hash
          // In a real app, you would handle these proofs more securely
          const proofHash = collectedProofs.length > 0 ? 
            Math.abs(hashCode(JSON.stringify(collectedProofs[0]))) : 1234;
            
          // Add the credential with the proof hash as claim_hash
          await addCredential(1, proofHash); // 1 is the claimType for zkPassport
          
          setSuccess('ZK Passport verification successful! Proof has been stored.');
          setVerificationStatus('success');
          
          // Reset the flow
          setTimeout(() => {
            setShowZkPassportFlow(false);
            setSelectedCredential(null);
            setVerificationUrl('');
            setRequestId('');
            setVerificationStatus('idle');
          }, 3000);
          
        } catch (err) {
          console.error('Error adding ZK Passport credential:', err);
          setError('Failed to add credential with proof.');
          setVerificationStatus('failed');
        }
      });
      
      onReject(() => {
        setError("Verification request was rejected");
        setVerificationStatus('rejected');
      });
      
      onError((error: string) => {
        setError(`Error during verification: ${error}`);
        setVerificationStatus('error');
      });
      
    } catch (err) {
      console.error('Error initiating ZK Passport verification:', err);
      setError(`Failed to initialize verification: ${err instanceof Error ? err.message : String(err)}`);
      setVerificationStatus('error');
    }
  };
  
  // Simple hash function for development
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };
  
  const cancelZkPassportVerification = () => {
    if (requestId && zkpassportRef.current) {
      zkpassportRef.current.cancelRequest(requestId);
      setVerificationStatus('idle');
      setVerificationUrl('');
      setRequestId('');
      setProofs([]);
      setShowZkPassportFlow(false);
    }
  };

  const handleSimulateInstagram = async () => {
    // Validate email (simple validation)
    if (!instagramEmail || !instagramEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const credential = CREDENTIALS.find(cred => cred.id === 'instagram');
      if (credential) {
        // Add Instagram with claim hash 1234
        await addCredential(credential.claimType, 1234);
      }
      
      setSuccess('Instagram credential added successfully!');
      
      // Clear the form and selection after successful addition
      setShowInstagramForm(false);
      setSelectedCredential(null);
      setInstagramEmail('');
      setInstagramUserId('');
      setInstagramEmailFile(null);
    } catch (err) {
      console.error('Error adding Instagram credential:', err);
      setError('Failed to add Instagram credential. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDashboard = () => {
    navigate('/dashboard');
  };

  // Function to simulate ZK Passport credential
  const handleSimulateZkPassport = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const credential = CREDENTIALS.find(cred => cred.id === 'zk-passport');
      if (credential) {
        // Add ZK Passport with claim hash 1234
        await addCredential(credential.claimType, 1234);
      }
      
      setSuccess('ZK Passport credential simulated successfully!');
      
      // Reset the flow after successful addition
      setTimeout(() => {
        setShowZkPassportFlow(false);
        setSelectedCredential(null);
      }, 2000);
    } catch (err) {
      console.error('Error simulating ZK Passport credential:', err);
      setError('Failed to simulate ZK Passport credential. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // File drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.eml')) {
        setInstagramEmailFile(file);
      } else {
        // Show an error message for incorrect file type
        setError('Please upload a valid .eml file');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  // Render ZK Passport verification flow
  const renderZkPassportFlow = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-10">
        <h2 className="text-xl font-semibold mb-4">Verify with ZK Passport</h2>
        <p className="text-gray-600 mb-6">
          We need to verify you are 18 or older. Your exact age will not be revealed.
        </p>
        
        <div className="mb-4">
          <div className="mb-4">
            <div className="py-2 px-3 bg-gray-100 rounded-md">
              <p className="text-sm font-medium text-gray-700">Verification Status: 
                <span className="ml-2 font-bold text-indigo-700 capitalize">
                  {verificationStatus.replace(/_/g, ' ')}
                </span>
              </p>
            </div>
          </div>
          
          {verificationUrl && verificationStatus === 'awaiting_scan' && (
            <div className="flex flex-col items-center mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Scan this QR code with the ZK Passport app</h3>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                <QRCode value={verificationUrl} size={256} />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <a 
                  href={verificationUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 underline text-center"
                >
                  Open in ZK Passport app
                </a>
                
                <button
                  onClick={cancelZkPassportVerification}
                  className="text-red-600 hover:text-red-800 text-center"
                >
                  Cancel Verification
                </button>
              </div>
            </div>
          )}
          
          {['generating_proof', 'proof_generated', 'sending_to_server'].includes(verificationStatus) && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-indigo-600 font-medium">Processing verification...</span>
              </div>
            </div>
          )}
          
          {verificationStatus === 'success' && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700 font-medium">Verification successful!</p>
              </div>
            </div>
          )}
          
          {/* Success message from simulation */}
          {success && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            </div>
          )}
          
          {['failed', 'error', 'rejected'].includes(verificationStatus) && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-red-700 font-medium">Verification failed</p>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                onClick={() => {
                  setVerificationStatus('idle');
                  setError(null);
                  initiateZkPassportVerification();
                }}
                className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-4">
          <button
            onClick={handleSimulateZkPassport}
            disabled={isSubmitting || wait}
            className={`
              py-2 px-4 rounded-md font-medium transition-all duration-200
              ${(isSubmitting || wait) 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
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
            ) : "Simulate credential"}
          </button>
          
          <button
            onClick={() => setShowZkPassportFlow(false)}
            className="py-2 px-4 rounded-md font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
          >
            Back to Credentials
          </button>
        </div>
      </div>
    );
  };

  // Force navigation to landing page
  const goToLandingPage = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use window.location for a hard redirect to ensure we're not caught in any React Router issues
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900">Generate your proofs</h1>
          <p className="text-gray-500 mt-2">Select one proof to generate at a time</p>
        </div>

        {showZkPassportFlow ? (
          renderZkPassportFlow()
        ) : showInstagramForm ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-10">
            <h2 className="text-xl font-semibold mb-4">Connect Your Instagram</h2>
            <p className="text-gray-600 mb-6">Verify your Instagram account by providing your email and uploading an Instagram email.</p>
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your@email.com"
                value={instagramEmail}
                onChange={(e) => setInstagramEmail(e.target.value)}
              />
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="emailFile" className="block text-sm font-medium text-gray-700">
                  Upload Instagram Email (.eml file)
                  <span className="ml-1 text-xs text-gray-500 font-normal">
                    (An email from Instagram saved as .eml file)
                  </span>
                </label>
                <button 
                  type="button"
                  onClick={() => alert("To get an .eml file:\n1. Open an email from Instagram in your email client\n2. Save it as an .eml file\n3. Upload it here")}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  How to get an .eml file?
                </button>
              </div>
              
              <div 
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                  instagramEmailFile 
                    ? 'border-green-500 bg-green-50' 
                    : isDragging
                      ? 'border-indigo-500 bg-indigo-50 border-solid'
                      : 'border-gray-300 border-dashed'
                } rounded-md transition-all duration-300`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-1 text-center">
                  {instagramEmailFile ? (
                    <>
                      <svg className="mx-auto h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium text-green-600">File uploaded successfully!</p>
                      <p className="text-xs text-green-600">{instagramEmailFile.name} ({Math.round(instagramEmailFile.size / 1024)} KB)</p>
                      <button 
                        type="button" 
                        onClick={() => setInstagramEmailFile(null)}
                        className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <svg className={`mx-auto h-12 w-12 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                          <span>Upload a file</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            accept=".eml" 
                            className="sr-only"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                if (file.name.endsWith('.eml')) {
                                  setInstagramEmailFile(file);
                                } else {
                                  // Show an error message for incorrect file type
                                  setError('Please upload a valid .eml file');
                                  setTimeout(() => setError(null), 3000);
                                }
                              }
                            }}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className={`text-xs ${isDragging ? 'text-indigo-500 font-medium' : 'text-gray-500'}`}>
                        {isDragging ? 'Drop your file here' : 'EML files up to 10MB'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">Instagram User ID</label>
              <input
                type="text"
                id="userId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your_instagram_id"
                value={instagramUserId}
                onChange={(e) => setInstagramUserId(e.target.value)}
              />
            </div>
            
            {/* Verification progress checklist */}
            <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Verification Checklist</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 ${instagramEmail ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                    {instagramEmail ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : '1'}
                  </span>
                  <span className={`text-sm ${instagramEmail ? 'text-blue-800' : 'text-gray-600'}`}>
                    Email address provided
                  </span>
                </li>
                <li className="flex items-center">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 ${instagramEmailFile ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                    {instagramEmailFile ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : '2'}
                  </span>
                  <span className={`text-sm ${instagramEmailFile ? 'text-blue-800' : 'text-gray-600'}`}>
                    Instagram email file uploaded
                  </span>
                </li>
                <li className="flex items-center">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 ${instagramUserId ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                    {instagramUserId ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : '3'}
                  </span>
                  <span className={`text-sm ${instagramUserId ? 'text-blue-800' : 'text-gray-600'}`}>
                    Instagram user ID entered
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={handleSimulateInstagram}
                disabled={isSubmitting || wait}
                className={`
                  py-2 px-4 rounded-md font-medium transition-all duration-200
                  ${(isSubmitting || wait) 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
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
                ) : "Simulate"}
              </button>
              
              <div className="flex space-x-4">
                <button
                  disabled={!instagramEmail || !instagramUserId || !instagramEmailFile || isSubmitting || wait}
                  className={`
                    py-2 px-4 rounded-md font-medium transition-all duration-200
                    ${(!instagramEmail || !instagramUserId || !instagramEmailFile || isSubmitting || wait) 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }
                  `}
                >
                  Verify
                </button>
                
                <button
                  onClick={() => {
                    setShowInstagramForm(false);
                    setInstagramEmail('');
                    setInstagramUserId('');
                    setInstagramEmailFile(null);
                  }}
                  className="py-2 px-4 rounded-md font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Credential Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {CREDENTIALS.map(credential => (
                <div 
                  key={credential.id}
                  onClick={() => toggleCredential(credential.id)}
                  className={`
                    border rounded-lg p-6 cursor-pointer transition-all duration-200
                    ${selectedCredential === credential.id 
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
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{credential.title}</h3>
                        {credential.required && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            Required for zkPoke
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{credential.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleContinue}
                disabled={isSubmitting || wait || !selectedCredential}
                className={`
                  py-3 px-6 rounded-md font-medium transition-all duration-200
                  ${(isSubmitting || wait || !selectedCredential) 
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
              
              <button
                onClick={handleViewDashboard}
                className="py-3 px-6 rounded-md font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
              >
                View Dashboard
              </button>
            </div>
          </>
        )}

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