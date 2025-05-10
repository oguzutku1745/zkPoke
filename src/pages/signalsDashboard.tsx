import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, BottomNavigation, Button, Alert } from '../components';
import { useSignals, PokeNote } from '../hooks/useSignals';
import { useZkPoke } from '../hooks/useZkPoke';
import { readFieldCompressedString } from '../hooks/useZkPoke';
import { userWallets } from '../config';
import { AztecAddress } from '@aztec/aztec.js';

export function SignalsDashboard() {
  const navigate = useNavigate();
  const { contract, wait: contractWait, resetContractData, deploy } = useZkPoke();
  const { 
    sentSignals, 
    receivedSignals, 
    getReceivedSignals, 
    getSentSignals, 
    respondToSignal,
    getSignalIntention,
    pokeNoteToReadable,
    wait: signalsWait,
    selectedUser
  } = useSignals();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger refresh
  
  // Track which signals are expanded
  const [expandedSignals, setExpandedSignals] = useState<{[key: string]: boolean}>({});
  
  // Track the intention status of signals
  const [signalIntentions, setSignalIntentions] = useState<{[key: string]: number}>({});
  
  // Toggle signal expansion
  const toggleExpand = (id: string) => {
    setExpandedSignals(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Get current user information
  const currentUser = userWallets[selectedUser as keyof typeof userWallets];
  
  // Auto-refresh on page render
  useEffect(() => {
    // Refresh on initial mount
    setRefreshKey(prev => prev + 1);
    
    // Set up an interval to refresh every 5 seconds
    const refreshInterval = setInterval(() => {
      if (contract) {
        console.log("Automatic refresh triggered");
        setRefreshKey(prev => prev + 1);
      }
    }, 5000);
    
    return () => clearInterval(refreshInterval);
  }, [contract]);
  
  // Fetch signals on component mount
  useEffect(() => {
    const fetchSignals = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (contract) {
          await getReceivedSignals(contract);
        }
        getSentSignals(); // This just reads from localStorage
      } catch (err) {
        console.error('Error fetching signals:', err);
        setError('Failed to fetch signals. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSignals();
  }, [contract, refreshKey, selectedUser]);
  
  // Check intentions for all signals
  useEffect(() => {
    const checkIntentions = async () => {
      if (!contract) return;
      
      try {
        const newIntentions: {[key: string]: number} = {};
        
        // Check sent signals
        for (const signal of sentSignals) {
          if (signal.randomness) {
            const id = signal.randomness.toString();
            try {
              const intention = await getSignalIntention(signal, contract);
              if (intention !== null) {
                newIntentions[id] = intention;
                console.log(`Sent signal ${id} intention: ${intention}`);
              }
            } catch (err) {
              console.error(`Error checking intention for sent signal ${id}:`, err);
            }
          }
        }
        
        // Check received signals
        for (const signal of receivedSignals) {
          if (signal.randomness) {
            const id = signal.randomness.toString();
            try {
              const intention = await getSignalIntention(signal, contract);
              console.log(`DEBUG: Received signal ${id} has intention: ${intention}`);
              
              if (intention !== null) {
                newIntentions[id] = intention;
                console.log(`Received signal ${id} intention: ${intention}`);
              }
            } catch (err) {
              console.error(`Error checking intention for received signal ${id}:`, err);
            }
          }
        }
        
        console.log("All intentions:", newIntentions);
        
        // Force re-render by creating a new object
        setSignalIntentions({...newIntentions});
        
        // Wait briefly to ensure UI updates
        setTimeout(() => {
          console.log("DEBUG: Current signalIntentions state:", signalIntentions);
        }, 100);
      } catch (err) {
        console.error("Error checking intentions:", err);
      }
    };
    
    checkIntentions();
  }, [contract, refreshKey, sentSignals, receivedSignals]); // Add dependency on signals to ensure refresh
  
  // Handle responding to a signal
  const handleRespondToSignal = async (note: PokeNote, intention: number) => {
    if (!contract) {
      setError('Contract not initialized');
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await respondToSignal(note, intention, contract);
      
      if (result) {
        setSuccess(`Signal ${intention === 1 ? 'accepted' : 'rejected'} successfully!`);
        // Refresh the signals list
        setRefreshKey(prev => prev + 1);
      } else {
        setError('Failed to respond to signal');
      }
    } catch (err) {
      console.error('Error responding to signal:', err);
      setError('Failed to respond to signal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle resetting contract data
  const handleResetContract = () => {
    if (window.confirm('Are you sure you want to reset all contract data? This will clear your registration and require redeploying the contract.')) {
      resetContractData();
      navigate('/'); // Navigate to home page
    }
  };
  
  // Handle deploying the contract
  const handleDeployContract = async () => {
    if (!deploy) {
      setError('Deploy function not available');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const deployedContract = await deploy();
      
      if (deployedContract) {
        setSuccess('Contract deployed successfully!');
        // Refresh the page to show the new contract
        setRefreshKey(prev => prev + 1);
      } else {
        setError('Failed to deploy contract');
      }
    } catch (err: any) {
      console.error('Error deploying contract:', err);
      setError(`Failed to deploy contract: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to shorten address (10 chars from start, 6 chars from end)
  const shortenAddress = (address: string) => {
    if (!address || address.length < 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
  };
  
  // Format displayed signals
  const formattedSentSignals = sentSignals.map(signal => {
    const receiverName = signal.receiverInstagramId || 'Unknown User';
    const timestamp = signal.timestamp ? new Date(signal.timestamp).toLocaleDateString() : 'Unknown';
    const id = signal.randomness?.toString() || Math.random().toString();
    
    // Get the latest intention status from our state
    const intention = signalIntentions[id] || 0;
    const replied = intention > 0;
    
    console.log(`DEBUG: Formatting sent signal ${id} with intention: ${intention}`);
    
    return {
      id,
      name: receiverName,
      read: signal.read || false,
      replied: replied,
      intention: intention,
      timestamp: timestamp,
      message: signal.message || ''
    };
  });
  
  const formattedReceivedSignals = receivedSignals.map(signal => {
    // Try to extract the Instagram ID from the signal
    let senderName = 'Unknown User';
    let fullName = '';
    let partialName = '';
    let nationality = '';
    let senderAddress = '';
    
    // Values for checking which fields are actually disclosed (non-zero)
    let hasInstagramId = false;
    let hasFullName = false;
    let hasPartialName = false;
    let hasNationality = false;
    
    try {
      // Get sender address regardless of other info
      senderAddress = signal.sender ? shortenAddress(AztecAddress.fromBigInt(signal.sender).toString()) : 'Unknown';
      
      const readableNote = pokeNoteToReadable(signal);
      if (readableNote) {
        // Check which fields have non-zero values (disclosed)
        hasInstagramId = signal.instagram_id_sender?.value !== undefined && signal.instagram_id_sender.value !== 0n;
        hasFullName = signal.full_name?.value !== undefined && signal.full_name.value !== 0n;
        hasPartialName = signal.partial_name?.value !== undefined && signal.partial_name.value !== 0n;
        hasNationality = signal.nationality?.value !== undefined && signal.nationality.value !== 0n;
        
        // Get values if they're disclosed
        if (hasInstagramId && readableNote.instagram_id_sender_text) {
          senderName = readableNote.instagram_id_sender_text;
        }
        
        if (hasFullName && readableNote.full_name_text) {
          fullName = readableNote.full_name_text;
        }
        
        if (hasPartialName && readableNote.partial_name_text) {
          partialName = readableNote.partial_name_text;
        }
        
        if (hasNationality && readableNote.nationality_text) {
          nationality = readableNote.nationality_text;
        }
      }
    } catch (err) {
      console.error('Error formatting received signal:', err);
    }
    
    const timestamp = signal.timestamp ? new Date(signal.timestamp).toLocaleDateString() : 'Unknown';
    const id = signal.randomness?.toString() || Math.random().toString();
    
    // Get the latest intention status from our state
    const intention = signalIntentions[id] || 0;
    const replied = intention > 0;
    
    console.log(`DEBUG: Formatting received signal ${id} with intention: ${intention}, replied: ${replied}`);
    
    return {
      id,
      name: senderName !== 'Unknown User' ? senderName : 'Unknown',
      senderAddress,
      fullName,
      partialName,
      nationality,
      read: signal.read || false,
      replied: replied,
      intention: intention,
      timestamp,
      rawNote: signal,
      hasInstagramId,
      hasFullName,
      hasPartialName,
      hasNationality
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* User info banner */}
          <div className="bg-indigo-50 rounded-lg p-4 mb-6 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-indigo-800">Logged in as {currentUser?.name}</h3>
                  <p className="text-sm text-indigo-700 mt-1">Instagram: {currentUser?.instagram}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {!contract ? (
                  <Button
                    onClick={() => navigate('/send-signal?deploy=true')}
                    size="small"
                    variant="primary"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    Deploy Contract
                  </Button>
                ) : (
                  <button
                    onClick={handleResetContract}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Reset Contract
                  </button>
                )}
              </div>
            </div>
            {contract && (
              <div className="mt-2 pt-2 border-t border-indigo-100 text-xs text-indigo-700">
                <p>Contract at: {contract.address.toString()}</p>
              </div>
            )}
          </div>
          
          {!contract && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Contract not initialized</h3>
                  <p className="text-sm text-yellow-700">
                    You need to deploy the ZkPoke contract first. Please go to the Send Signal page to deploy.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Display error and success messages */}
          {error && <Alert type="error" message={error} className="mb-4" />}
          {success && <Alert type="success" message={success} className="mb-4" />}
          
          {/* Refresh button */}
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => setRefreshKey(prev => prev + 1)}
              size="small"
              isLoading={isLoading || contractWait || signalsWait}
              disabled={isLoading || contractWait || signalsWait || !contract}
              variant="outline"
            >
              {isLoading || contractWait || signalsWait ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </div>
              )}
            </Button>
          </div>
          
          {/* Signals Sent Section */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Signals Sent</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {formattedSentSignals.length > 0 ? (
                formattedSentSignals.map((signal) => (
                  <li key={signal.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{signal.name}</span>
                      <span className="ml-2">😊</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Status indicators for sent signals - show only one based on intention */}
                      {signal.intention === 1 ? (
                        <div className="h-3 w-3 rounded-full bg-green-500" title="Accepted"></div>
                      ) : signal.intention === 2 ? (
                        <div className="h-3 w-3 rounded-full bg-red-500" title="Rejected"></div>
                      ) : (
                        <div className="h-3 w-3 rounded-full bg-yellow-500" title="Pending"></div>
                      )}
                      {signal.read && (
                        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {signal.replied && (
                        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-xs text-gray-500">{signal.timestamp}</span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-6 py-8 text-center text-gray-500">
                  No signals sent yet. Go to the Send Signal page to poke someone!
                </li>
              )}
            </ul>
          </div>
          
          {/* Signals Received Section */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Signals Received</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {formattedReceivedSignals.length > 0 ? (
                formattedReceivedSignals.map((signal) => (
                  <li 
                    key={signal.id} 
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer relative"
                    onClick={() => toggleExpand(signal.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {signal.name === 'Unknown' ? 'Unknown User' : signal.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">({signal.senderAddress})</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {signal.read && (
                          <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="text-xs text-gray-500">{signal.timestamp}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <div>
                        {/* Show selective disclosures with emojis (only for non-zero values) */}
                        <div className="mt-2 mb-3 flex items-center space-x-4">
                          {signal.hasInstagramId && (
                            <span className="text-lg" title="Instagram ID">📸</span>
                          )}
                          {signal.hasFullName && (
                            <span className="text-lg" title="Full Name">👤</span>
                          )}
                          {signal.hasPartialName && (
                            <span className="text-lg" title="Partial Name">👥</span>
                          )}
                          {signal.hasNationality && (
                            <span className="text-lg" title="Nationality">🌍</span>
                          )}
                        </div>
                        
                        {/* Show details only when expanded */}
                        {expandedSignals[signal.id] && (
                          <div className="mt-2 mb-3 bg-gray-50 p-2 rounded-md border border-gray-200">
                            {signal.hasInstagramId && (
                              <p className="text-xs text-gray-600 mb-1">
                                <span className="font-medium">Instagram ID:</span> {signal.name}
                              </p>
                            )}
                            {signal.hasFullName && (
                              <p className="text-xs text-gray-600 mb-1">
                                <span className="font-medium">Full Name:</span> {signal.fullName}
                              </p>
                            )}
                            {signal.hasPartialName && (
                              <p className="text-xs text-gray-600 mb-1">
                                <span className="font-medium">Partial Name:</span> {signal.partialName}
                              </p>
                            )}
                            {signal.hasNationality && (
                              <p className="text-xs text-gray-600 mb-1">
                                <span className="font-medium">Nationality:</span> {signal.nationality}
                              </p>
                            )}
                            <p className="text-xs text-gray-600 mb-1">
                              <span className="font-medium">Status:</span> {signal.intention === 1 ? 'Accepted' : signal.intention === 2 ? 'Rejected' : 'Pending'}
                            </p>
                            <p className="text-xs text-gray-600 mb-1">
                              <span className="font-medium">Status ID:</span> {signal.intention}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Response buttons - show only the relevant status indicator based on intention */}
                      <div className="flex flex-row items-center space-x-2" onClick={e => e.stopPropagation()}>
                        {/* Show only the green button when intention is 1 (accepted) */}
                        {signal.intention === 1 ? (
                          <button
                            disabled={true}
                            className="h-6 w-6 rounded-full flex items-center justify-center focus:outline-none border shadow-inner bg-green-500 border-green-600 shadow-green-700/30"
                            title="Accepted"
                          >
                            <svg className="h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        ) : signal.intention === 2 ? (
                          /* Show only the red button when intention is 2 (rejected) */
                          <button
                            disabled={true}
                            className="h-6 w-6 rounded-full flex items-center justify-center focus:outline-none border shadow-inner bg-red-500 border-red-600 shadow-red-700/30"
                            title="Rejected"
                          >
                            <svg className="h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        ) : (
                          /* Show all three buttons when intention is 0 (pending) */
                          <>
                            {/* Green (accept) button - clickable if not already replied */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                !signal.replied && handleRespondToSignal(signal.rawNote, 1);
                              }}
                              disabled={isLoading || signal.replied}
                              className={`h-6 w-6 rounded-full flex items-center justify-center focus:outline-none border shadow-inner ${
                                signal.replied
                                  ? 'bg-green-200 border-green-300 cursor-not-allowed'
                                  : 'bg-green-500 border-green-600 hover:bg-green-600 transition-colors shadow-green-700/30'
                              }`}
                              title="Accept"
                            >
                              {signal.intention === 1 && (
                                <svg className="h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            
                            {/* Yellow (pending) button - not clickable */}
                            <div 
                              className="h-6 w-6 rounded-full flex items-center justify-center border shadow-inner bg-yellow-500 border-yellow-600 shadow-yellow-700/30"
                              title="Pending"
                            >
                              <svg className="h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            
                            {/* Red (reject) button - clickable if not already replied */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                !signal.replied && handleRespondToSignal(signal.rawNote, 2);
                              }}
                              disabled={isLoading || signal.replied}
                              className={`h-6 w-6 rounded-full flex items-center justify-center focus:outline-none border shadow-inner ${
                                signal.replied
                                  ? 'bg-red-200 border-red-300 cursor-not-allowed'
                                  : 'bg-red-500 border-red-600 hover:bg-red-600 transition-colors shadow-red-700/30'
                              }`}
                              title="Reject"
                            >
                              {signal.intention === 2 && (
                                <svg className="h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-6 py-8 text-center text-gray-500">
                  {contract ? 
                    'No signals received yet. When someone pokes you, it will appear here!' : 
                    'Deploy the contract first to receive signals.'}
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
      
      {/* Add bottom padding to prevent content from being hidden behind bottom navigation */}
      <div className="pb-16">
        {/* Spacer for bottom navigation */}
      </div>
      
      <BottomNavigation />
      <Footer />
    </div>
  );
} 