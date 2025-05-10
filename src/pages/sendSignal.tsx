import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, Input, Button, Alert, BottomNavigation } from '../components';
import { useSignals } from '../hooks/useSignals';
import { useZkPoke } from '../hooks/useZkPoke';
import { AztecAddress } from '@aztec/aztec.js';
import { userWallets } from '../config';

// Exposure options
interface ExposureOption {
  id: string;
  label: string;
  selected: boolean;
}

// Predefined test users
const PREDEFINED_USERS = {
  alice: {
    instagram: 'alice.eth',
    fullName: 'Alice Wonderland',
    partialName: 'Alice W.',
    nationality: 'TR',
  },
  akin: {
    instagram: '@akinspur',
    fullName: 'Akin Semih Pur',
    partialName: 'Akin S.',
    nationality: 'TR',
  },
};

export function SendSignalPage() {
  const navigate = useNavigate();
  const { contract, wait: contractWait, deploy, register, registerInfo, getAddressByInstagram, selectedUser, resetContractData, isUserRegistered } = useZkPoke();
  const { sendSignal, wait: signalWait } = useSignals();
  
  // Form state
  const [username, setUsername] = useState('');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [userAddress, setUserAddress] = useState<AztecAddress | null>(null);
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userRegistered, setUserRegistered] = useState<string | null>(null);
  
  // Get current user information
  const currentUser = userWallets[selectedUser as keyof typeof userWallets];
  
  // List of exposure options
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
      
      // Check if we should auto-deploy the contract
      // This can happen when navigating from another page with intent to deploy
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('deploy') === 'true') {
        handleDeployContract();
      }
    } else {
      console.log('Contract initialized:', contract.address.toString());
      setError(''); // Clear any contract initialization errors
    }
  }, [contract]);

  // Effect to check user registration status when component mounts
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!contract) return;
      
      try {
        const user = selectedUser as 'alice' | 'akin';
        const userInfo = PREDEFINED_USERS[user];
        
        // First check localStorage for registration status to minimize contract interactions
        if (userRegistered) {
          return;
        }
        
        console.log(`Checking if ${user} (${userInfo.instagram}) is registered...`);
        const alreadyRegistered = await isUserRegistered(userInfo.instagram, contract);
        console.log(`Registration check result for ${user}: ${alreadyRegistered}`);
        
        if (alreadyRegistered) {
          console.log(`User ${user} is already registered according to contract check`);
          setUserRegistered(user);
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
        // Even if there's an error, we don't want to show it to the user
        // Just silently fail and let them try to register manually
      }
    };
    
    checkRegistrationStatus();
  }, [contract, selectedUser, isUserRegistered, userRegistered]);

  // Handle contract deployment
  const handleDeployContract = async () => {
    setIsDeploying(true);
    setError('');
    setSuccess('');
    
    try {
      const deployedContract = await deploy();
      
      if (deployedContract) {
        setSuccess(`Contract deployed successfully at ${contract.address.toString()}`);
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

  // Handle resetting contract data
  const handleResetContract = () => {
    if (window.confirm('Are you sure you want to reset all contract data? This will clear your registration and require redeploying the contract.')) {
      resetContractData();
      setUserRegistered(null);
      navigate('/'); // Navigate to home page
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
      
      // First, check if the user is already registered
      console.log(`Checking if ${user} (${userInfo.instagram}) is registered...`);
      const alreadyRegistered = await isUserRegistered(userInfo.instagram, contract);
      console.log(`Registration check result for ${user}: ${alreadyRegistered}`);
      
      if (alreadyRegistered) {
        console.log(`User ${user} is already registered according to contract check`);
        setSuccess(`User ${user} is already registered`);
        setUserRegistered(user);
        return;
      }
      
      // First, register the public Instagram ID
      setSuccess(`Registering ${user}...`);
      try {
        await register(userInfo.instagram, contract);
      } catch (registerError: any) {
        if (registerError.message && (
          registerError.message.includes('already initialized') || 
          registerError.message.includes('PublicImmutable already initialized')
        )) {
          // The user is already registered, continue to register user info
          console.log(`User ${user} is already registered, continuing to register info...`);
          setUserRegistered(user);
        } else {
          // There was an actual error during registration
          throw registerError;
        }
      }
      
      // Then register the private user information
      setSuccess(`Registering ${user}'s information...`);
      await registerInfo(
        userInfo.instagram,
        userInfo.fullName,
        userInfo.partialName,
        userInfo.nationality,
        contract
      );
      
      setSuccess(`Successfully registered as ${user === 'alice' ? 'Alice' : 'Akın'}!`);
      setUserRegistered(user);
    } catch (err: any) {
      console.error(`Error registering as ${user}:`, err);
      
      // Handle specific error messages
      if (err.message) {
        if (err.message.includes('already initialized') || 
            err.message.includes('PublicImmutable already initialized')) {
          setSuccess(`User ${user} is already registered`);
          setUserRegistered(user);
        } else if (err.message.includes('Cannot satisfy constraint')) {
          setError(`Failed to register as ${user}: Permission denied. Please check wallet permissions.`);
        } else {
          setError(`Failed to register as ${user}: ${err.message.slice(0, 100)}`);
        }
      } else {
        setError(`Failed to register as ${user}. Please try again.`);
      }
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
      setSuccess(`Found user ${username} address`);
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
              {contract && (
                <button
                  onClick={handleResetContract}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Reset Contract
                </button>
              )}
            </div>
            {contract && (
              <div className="mt-2 pt-2 border-t border-indigo-100 text-xs text-indigo-700">
                <p>Contract at: {contract.address.toString()}</p>
              </div>
            )}
          </div>
          
          {/* Contract status banner - show only one deploy button */}
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
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Registration required</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>You need to register your {selectedUser === 'alice' ? 'Alice' : 'Akın'} profile first.</p>
                    </div>
                    <div className="mt-3">
                      <Button 
                        onClick={() => handleRegisterUser(selectedUser as 'alice' | 'akin')}
                        size="small"
                        isLoading={isRegistering}
                        disabled={isRegistering}
                      >
                        Register as {selectedUser === 'alice' ? 'Alice' : 'Akın'}
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
                <div className="flex">
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. @username"
                    className="flex-grow"
                    disabled={!contract || !userRegistered}
                  />
                  <Button
                    onClick={handleSearchUsername}
                    className="ml-2"
                    size="medium"
                    disabled={!contract || !userRegistered || !username.trim() || isLoading}
                    isLoading={isLoading}
                  >
                    Find
                  </Button>
                </div>
                {selectedUsername && userAddress && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700">
                    Selected user: <span className="font-medium">{selectedUsername}</span>
                  </div>
                )}
              </div>
              
              {/* Exposure options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose what to reveal about yourself
                </label>
                <div className="space-y-2">
                  {exposureOptions.map((option) => (
                    <div key={option.id} className="flex items-center">
                      <input
                        id={option.id}
                        type="checkbox"
                        checked={option.selected}
                        onChange={() => toggleExposureOption(option.id)}
                        disabled={!contract || !userRegistered || !selectedUsername}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={option.id} className="ml-2 block text-sm text-gray-900">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Submit button */}
              <div className="pt-2">
                <Button
                  onClick={handleSubmitSignal}
                  size="large"
                  disabled={!contract || !userRegistered || !selectedUsername || !userAddress || isLoading}
                  isLoading={isSubmitting}
                  className="w-full"
                >
                  Send Signal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
      <Footer />
    </div>
  );
} 