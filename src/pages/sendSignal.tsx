import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, Input, Button, Alert, BottomNavigation } from '../components';
import { useSignals } from '../hooks/useSignals';
import { useZkPoke } from '../hooks/useZkPoke';
import { AztecAddress } from '@aztec/aztec.js';

// Exposure options
interface ExposureOption {
  id: string;
  label: string;
  selected: boolean;
}

// Predefined user information
const PREDEFINED_USERS = {
  alice: {
    instagram: 'alice.eth',
    fullName: 'Alice Wonderland',
    partialName: 'Alice W.',
    nationality: 'TR'
  },
  akin: {
    instagram: '@akinspur',
    fullName: 'Akın Semih Pür',
    partialName: 'Akin Semih P.',
    nationality: 'TR'
  }
};

export function SendSignalPage() {
  const navigate = useNavigate();
  const { sendSignal, wait: signalWait } = useSignals();
  const { contract, deploy, register, registerInfo, getAddressByInstagram, wait: contractWait } = useZkPoke();
  
  // State for username input
  const [username, setUsername] = useState('');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [userAddress, setUserAddress] = useState<AztecAddress | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userRegistered, setUserRegistered] = useState<'alice' | 'akin' | null>(null);
  
  // Exposure options
  const [exposureOptions, setExposureOptions] = useState<ExposureOption[]>([
    { id: 'instagramId', label: 'Instagram ID', selected: false },
    { id: 'fullName', label: 'Full Name', selected: false },
    { id: 'partialName', label: 'Partial Name', selected: false },
    { id: 'nationality', label: 'Nationality', selected: false },
  ]);

  // Effect to initialize the contract
  useEffect(() => {
    if (!contract) {
      console.log('Contract not initialized');
    } else {
      console.log('Contract initialized:', contract.address.toString());
      setError(''); // Clear any contract initialization errors
    }
  }, [contract]);

  // Handle contract deployment
  const handleDeployContract = async () => {
    setIsDeploying(true);
    setError('');
    setSuccess('');
    
    try {
      const deployedContract = await deploy();
      
      if (deployedContract) {
        setSuccess(`Contract deployed successfully at ${deployedContract.address}`);
      } else {
        setError('Failed to deploy contract');
      }
    } catch (err) {
      console.error('Error deploying contract:', err);
      setError('Failed to deploy contract. Check console for details.');
    } finally {
      setIsDeploying(false);
    }
  };

  // Handle user registration
  const handleRegisterUser = async (user: 'alice' | 'akin') => {
    if (!contract) {
      setError('Contract not initialized. Please deploy the contract first.');
      return;
    }

    setIsRegistering(true);
    setError('');
    setSuccess('');
    
    try {
      const userInfo = PREDEFINED_USERS[user];
      
      // First, register the public Instagram ID
      await register(userInfo.instagram, contract);
      
      // Then register the private user information
      await registerInfo(
        userInfo.instagram,
        userInfo.fullName,
        userInfo.partialName,
        userInfo.nationality,
        contract
      );
      
      setSuccess(`Successfully registered as ${user === 'alice' ? 'Alice' : 'Akın'}!`);
      setUserRegistered(user);
    } catch (err) {
      console.error(`Error registering as ${user}:`, err);
      setError(`Failed to register as ${user}. Please try again.`);
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle username search
  const handleSearchUsername = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!contract) {
      setError('Contract not initialized. Please deploy the contract first.');
      return;
    }
    
    try {
      // Look up the address by Instagram ID
      const address = await getAddressByInstagram(username);
      
      if (!address) {
        setError(`User with Instagram ID "${username}" not found`);
        return;
      }
      
      setUserAddress(address);
      setSelectedUsername(username);
      setError('');
      setSuccess(`Found user ${username} at address ${address.toString()}`);
    } catch (error) {
      console.error('Error searching for username:', error);
      setError('Failed to find user. Please check the username and try again.');
    }
  };
  
  // Toggle exposure option
  const toggleExposureOption = (id: string) => {
    setExposureOptions(prev => 
      prev.map(option => 
        option.id === id 
          ? { ...option, selected: !option.selected } 
          : option
      )
    );
  };
  
  // Handle signal submission
  const handleSubmitSignal = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate inputs
      if (!selectedUsername || !userAddress) {
        setError('Please select a valid username first');
        setIsSubmitting(false);
        return;
      }
      
      if (!messageContent.trim()) {
        setError('Please enter a message');
        setIsSubmitting(false);
        return;
      }
      
      if (!contract) {
        setError('Contract not initialized. Please deploy the contract first.');
        setIsSubmitting(false);
        return;
      }
      
      // Get selected exposure options
      const selectedOptionsMap = exposureOptions.reduce((acc, option) => {
        acc[option.id] = option.selected;
        return acc;
      }, {} as { [key: string]: boolean });
      
      // Send the signal using our hook
      const result = await sendSignal(
        selectedUsername,
        userAddress,
        selectedOptionsMap,
        messageContent,
        contract
      );
      
      if (result) {
        setSuccess('Signal sent successfully!');
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
          navigate('/signals-dashboard');
        }, 1500);
      } else {
        setError('Failed to send signal. Please try again.');
      }
      
    } catch (error) {
      console.error('Error sending signal:', error);
      setError('Failed to send signal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = signalWait || contractWait || isSubmitting || isDeploying || isRegistering;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-lg mx-auto px-4 py-8 sm:px-6">
          {/* Contract status banner */}
          {!contract && (
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Contract not initialized</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>You need to deploy the ZkPoke contract before you can send signals.</p>
                    </div>
                    <div className="mt-3">
                      <Button 
                        onClick={handleDeployContract}
                        size="small"
                        isLoading={isDeploying}
                        disabled={isDeploying}
                      >
                        Deploy Contract
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registration banner */}
          {contract && !userRegistered && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Register a user to continue</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Choose one of the following users to register with:</p>
                    </div>
                    <div className="mt-3 flex space-x-3">
                      <Button 
                        onClick={() => handleRegisterUser('alice')}
                        size="small"
                        isLoading={isRegistering && userRegistered === 'alice'}
                        disabled={isRegistering}
                        variant="primary"
                      >
                        Register as Alice
                      </Button>
                      <Button 
                        onClick={() => handleRegisterUser('akin')}
                        size="small"
                        isLoading={isRegistering && userRegistered === 'akin'}
                        disabled={isRegistering}
                        variant="secondary"
                      >
                        Register as Akın
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Success notification */}
          {success && (
            <div className="mb-6">
              <Alert type="success" message={success} />
            </div>
          )}
          
          {/* Error notification */}
          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} />
            </div>
          )}
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Poke someone with an intention</h2>
            </div>
            
            <div className="px-6 py-5">
              {/* Username selection */}
              <div className="mb-6">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram Username
                </label>
                
                {!selectedUsername ? (
                  <div className="flex space-x-2">
                    <Input
                      id="username"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter Instagram ID"
                      fullWidth
                    />
                    <Button 
                      onClick={handleSearchUsername}
                      size="medium"
                      isLoading={contractWait}
                      disabled={contractWait || !username.trim() || !contract || !userRegistered}
                    >
                      Select
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <span className="text-sm font-medium">{selectedUsername}</span>
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={() => {
                        setSelectedUsername('');
                        setUserAddress(null);
                      }}
                      disabled={isLoading}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Message input */}
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Write your introduction..."
                  disabled={isLoading || !contract || !userRegistered}
                ></textarea>
              </div>
              
              {/* Exposure options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Exposure Options
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select which information you want to reveal to this user
                </p>
                
                <div className="space-y-2">
                  {exposureOptions.map((option) => (
                    <div key={option.id} className="flex items-center">
                      <input
                        id={option.id}
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={option.selected}
                        onChange={() => toggleExposureOption(option.id)}
                        disabled={isLoading || !contract || !userRegistered}
                      />
                      <label htmlFor={option.id} className="ml-2 block text-sm text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Submit button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitSignal}
                  isLoading={isLoading}
                  disabled={isLoading || !selectedUsername || !messageContent.trim() || !contract || !userRegistered}
                >
                  Send Signal
                </Button>
              </div>
            </div>
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