import React, { useState, useRef, useEffect } from 'react';
import { Header, Footer, Button, Alert, LoadingSpinner } from '../components';
import { ZKPassport } from '@zkpassport/sdk';

export function TempZkPassportPage() {
  // ZKPassport specific states
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [requestId, setRequestId] = useState('');
  const [proofs, setProofs] = useState<any[]>([]);
  const [proofOutput, setProofOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const zkpassportRef = useRef<ZKPassport | null>(null);
  
  // Initialize ZKPassport SDK
  useEffect(() => {
    if (!zkpassportRef.current) {
      try {
        zkpassportRef.current = new ZKPassport("zk-poke.vercel.app/temp-zkpassport");
        console.log("ZKPassport SDK initialized");
      } catch (err) {
        console.error("Error initializing ZKPassport SDK:", err);
        setError("Failed to initialize ZKPassport SDK. Please check your browser console for details.");
      }
    }
  }, []);

  const initiateZkPassportVerification = async () => {
    setVerificationStatus('initiating');
    setError(null);
    setSuccess(null);
    setProofs([]);
    setProofOutput('');
    
    try {
      if (!zkpassportRef.current) {
        zkpassportRef.current = new ZKPassport("zk-poke.vercel.app/temp-zkpassport");
      }
      
      // Create a verification request
      const query = await zkpassportRef.current.request({
        name: "zkPoke Temp Verification",
        logo: "https://zk-poke.vercel.app/logo.png", // Replace with your actual logo URL
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
      } = query.disclose("fullname").disclose("nationality").gte("age", 18).done();
      
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
      
      onProofGenerated((result: any) => {
        setVerificationStatus('proof_generated');
        setProofs(prev => [...prev, result]);
        
        // Create a JSON string of the proof for copying
        const proofJson = JSON.stringify(result, null, 2);
        setProofOutput(proofJson);
        
        setSuccess("Proof generated successfully! You can now copy this proof to use in the main zkPoke application.");
      });
      
      onResult((result: any) => {
        setVerificationStatus('completed');
        console.log("Verification result:", result);
      });
      
      onReject(() => {
        setVerificationStatus('rejected');
        setError("Verification was rejected by the user.");
      });
      
      onError((err: any) => {
        console.error("Verification error:", err);
        setVerificationStatus('error');
        setError("An error occurred during verification. Please try again.");
      });
    } catch (err) {
      console.error("Error initiating verification:", err);
      setVerificationStatus('error');
      setError("Failed to initiate verification. Please try again.");
    }
  };

  const cancelZkPassportVerification = () => {
    setVerificationStatus('idle');
    setVerificationUrl('');
    setRequestId('');
    setError(null);
    setProofs([]);
    setProofOutput('');
  };

  const copyToClipboard = () => {
    if (proofOutput) {
      navigator.clipboard.writeText(proofOutput)
        .then(() => {
          setSuccess("Proof copied to clipboard!");
          setTimeout(() => setSuccess(null), 3000);
        })
        .catch(err => {
          console.error("Error copying to clipboard:", err);
          setError("Failed to copy proof to clipboard. Please manually select and copy the text.");
          setTimeout(() => setError(null), 3000);
        });
    }
  };

  const renderZkPassportFlow = () => {
    switch (verificationStatus) {
      case 'idle':
        return (
          <div className="flex flex-col items-center p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-center mb-4">ZKPassport Verification</h3>
            <p className="text-gray-600 mb-6 text-center">
              This temporary page allows you to generate a ZKPassport proof that you can use in the main zkPoke application.
            </p>
            <Button 
              onClick={initiateZkPassportVerification}
              size="large"
            >
              Start Verification
            </Button>
          </div>
        );
        
      case 'initiating':
        return (
          <div className="flex flex-col items-center p-6 border border-gray-200 rounded-lg">
            <LoadingSpinner size="large" className="mb-4" />
            <p className="text-gray-600">Initiating verification...</p>
          </div>
        );
        
      case 'awaiting_scan':
        return (
          <div className="flex flex-col items-center p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-center mb-4">Scan QR Code</h3>
            <p className="text-gray-600 mb-4 text-center">
              Scan this QR code with your ZKPassport app to verify your age.
            </p>
            
            <div className="mb-6 p-4 bg-white">
              {verificationUrl && (
                <div className="flex flex-col items-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(verificationUrl)}&size=200x200`}
                    alt="QR Code"
                    className="w-48 h-48 mb-2"
                  />
                  <p className="text-xs text-gray-500 mt-2">Request ID: {requestId}</p>
                </div>
              )}
            </div>
            
            <Button 
              onClick={cancelZkPassportVerification}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        );
        
      case 'request_received':
      case 'generating_proof':
        return (
          <div className="flex flex-col items-center p-6 border border-gray-200 rounded-lg">
            <LoadingSpinner size="large" className="mb-4" />
            <p className="text-gray-600">
              {verificationStatus === 'request_received' 
                ? 'Request received. Waiting for verification...' 
                : 'Generating proof. Please wait...'}
            </p>
          </div>
        );
        
      case 'proof_generated':
      case 'completed':
        return (
          <div className="flex flex-col items-center p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-4">
              <svg className="h-8 w-8 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-lg font-medium">Verification Successful</h3>
            </div>
            
            <div className="w-full mb-6">
              <p className="text-gray-600 mb-2">ZKPassport proof generated:</p>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-60 w-full">
                  {proofOutput}
                </pre>
                <button 
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-1 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
                  title="Copy to clipboard"
                >
                  <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                onClick={copyToClipboard}
                variant="primary"
              >
                Copy Proof
              </Button>
              <Button 
                onClick={initiateZkPassportVerification}
                variant="outline"
              >
                Generate New Proof
              </Button>
            </div>
          </div>
        );
        
      case 'rejected':
      case 'error':
        return (
          <div className="flex flex-col items-center p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-4">
              <svg className="h-8 w-8 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <h3 className="text-lg font-medium">Verification Failed</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {error || "There was an issue with the verification process. Please try again."}
            </p>
            
            <Button 
              onClick={initiateZkPassportVerification}
              variant="primary"
            >
              Try Again
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Temporary ZKPassport Verification</h2>
            </div>
            
            <div className="px-6 py-5">
              <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-700">
                    This page is for generating ZKPassport proofs in the Vercel environment. 
                    Copy the generated proof and paste it in the main zkPoke application.
                  </p>
                </div>
              </div>
              
              {error && <Alert type="error" message={error} className="mb-4" />}
              {success && <Alert type="success" message={success} className="mb-4" />}
              
              {renderZkPassportFlow()}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 