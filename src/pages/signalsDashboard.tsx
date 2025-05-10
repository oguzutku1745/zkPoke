import React, { useState, useEffect } from 'react';
import { Header, Footer, BottomNavigation, Button, Alert } from '../components';
import { useSignals, PokeNote } from '../hooks/useSignals';
import { useZkPoke } from '../hooks/useZkPoke';
import { readFieldCompressedString } from '../hooks/useZkPoke';

export function SignalsDashboard() {
  const { contract, wait: contractWait } = useZkPoke();
  const { 
    sentSignals, 
    receivedSignals, 
    getReceivedSignals, 
    getSentSignals, 
    respondToSignal,
    pokeNoteToReadable,
    wait: signalsWait 
  } = useSignals();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger refresh
  
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
  }, [contract, refreshKey]);
  
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
  
  // Format displayed signals
  const formattedSentSignals = sentSignals.map(signal => {
    const receiverName = signal.receiverInstagramId || 'Unknown User';
    const timestamp = signal.timestamp ? new Date(signal.timestamp).toLocaleDateString() : 'Unknown';
    
    return {
      id: signal.randomness?.toString() || Math.random().toString(),
      name: receiverName,
      read: signal.read || false,
      replied: signal.replied || false,
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
    
    try {
      const readableNote = pokeNoteToReadable(signal);
      if (readableNote) {
        // Check exposure mask to see what info to display
        const exposureMask = signal.exposureMask || 0;
        
        // bit-0 = ig, bit-1 = full name, bit-2 = partial name, bit-3 = nationality
        if (exposureMask & 0b0001 && readableNote.instagram_id_sender_text) {
          senderName = readableNote.instagram_id_sender_text;
        }
        
        if (exposureMask & 0b0010 && readableNote.full_name_text) {
          fullName = readableNote.full_name_text;
        }
        
        if (exposureMask & 0b0100 && readableNote.partial_name_text) {
          partialName = readableNote.partial_name_text;
        }
        
        if (exposureMask & 0b1000 && readableNote.nationality_text) {
          nationality = readableNote.nationality_text;
        }
      }
    } catch (err) {
      console.error('Error formatting received signal:', err);
    }
    
    const timestamp = signal.timestamp ? new Date(signal.timestamp).toLocaleDateString() : 'Unknown';
    
    return {
      id: signal.randomness?.toString() || Math.random().toString(),
      name: senderName,
      fullName,
      partialName,
      nationality,
      read: signal.read || false,
      replied: signal.replied || false,
      intention: signal.intention || 0,
      timestamp,
      rawNote: signal
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Display error and success messages */}
          {error && <Alert type="error" message={error} className="mb-4" />}
          {success && <Alert type="success" message={success} className="mb-4" />}
          
          {/* Refresh button */}
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => setRefreshKey(prev => prev + 1)}
              size="small"
              isLoading={isLoading || contractWait || signalsWait}
              disabled={isLoading || contractWait || signalsWait}
              variant="outline"
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
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
                  <li key={signal.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{signal.name}</span>
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
                    
                    {/* Show exposed information */}
                    <div className="mt-2 mb-3">
                      {signal.fullName && (
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Full Name:</span> {signal.fullName}
                        </p>
                      )}
                      
                      {signal.partialName && (
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Partial Name:</span> {signal.partialName}
                        </p>
                      )}
                      
                      {signal.nationality && (
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Nationality:</span> {signal.nationality}
                        </p>
                      )}
                    </div>
                    
                    {/* Response buttons if not already replied */}
                    {!signal.replied && (
                      <div className="flex space-x-2 mt-2">
                        <Button
                          size="small"
                          onClick={() => handleRespondToSignal(signal.rawNote, 1)}
                          disabled={isLoading}
                          variant="primary"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleRespondToSignal(signal.rawNote, 2)}
                          disabled={isLoading}
                          variant="secondary"
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {/* Show response status if already replied */}
                    {signal.replied && (
                      <div className="mt-2 text-sm">
                        {signal.intention === 1 ? (
                          <span className="text-green-600 font-medium">✓ Accepted</span>
                        ) : signal.intention === 2 ? (
                          <span className="text-red-600 font-medium">✗ Rejected</span>
                        ) : (
                          <span className="text-gray-500">Responded</span>
                        )}
                      </div>
                    )}
                  </li>
                ))
              ) : (
                <li className="px-6 py-8 text-center text-gray-500">
                  No signals received yet. When someone pokes you, it will appear here!
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