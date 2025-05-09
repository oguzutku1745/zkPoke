import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, Input, Button, Alert, BottomNavigation } from '../components';

// Exposure options
interface ExposureOption {
  id: string;
  label: string;
  selected: boolean;
}

export function SendSignalPage() {
  const navigate = useNavigate();
  
  // State for username input
  const [username, setUsername] = useState('');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Exposure options
  const [exposureOptions, setExposureOptions] = useState<ExposureOption[]>([
    { id: 'country', label: 'Country', selected: false },
    { id: 'age', label: 'Age', selected: false },
    { id: 'fullName', label: 'Full Name', selected: false },
    { id: 'partialName', label: 'Partial Name', selected: false },
  ]);

  // Handle username search
  const handleSearchUsername = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    // Here we would normally search for the user in the contract
    // For now, just use the entered username
    setSelectedUsername(username);
    setError('');
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
      if (!selectedUsername) {
        setError('Please select a username first');
        setIsSubmitting(false);
        return;
      }
      
      if (!messageContent.trim()) {
        setError('Please enter a message');
        setIsSubmitting(false);
        return;
      }
      
      // Get selected exposure options
      const selectedOptions = exposureOptions
        .filter(option => option.selected)
        .map(option => option.id);
      
      // Here we would send the signal to the contract
      // For now, just show success message and redirect
      
      console.log('Sending signal to:', selectedUsername);
      console.log('Message:', messageContent);
      console.log('Exposure options:', selectedOptions);
      
      // Simulate contract interaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Signal sent successfully!');
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/signals-dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error sending signal:', error);
      setError('Failed to send signal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-lg mx-auto px-4 py-8 sm:px-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Poke someone with an intention</h2>
            </div>
            
            <div className="px-6 py-5">
              {/* Username selection */}
              <div className="mb-6">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                
                {!selectedUsername ? (
                  <div className="flex space-x-2">
                    <Input
                      id="username"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      fullWidth
                    />
                    <Button 
                      onClick={handleSearchUsername}
                      size="medium"
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
                      onClick={() => setSelectedUsername('')}
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
                ></textarea>
              </div>
              
              {/* Exposure options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Exposure Options
                </label>
                
                <div className="space-y-2">
                  {exposureOptions.map((option) => (
                    <div key={option.id} className="flex items-center">
                      <input
                        id={option.id}
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={option.selected}
                        onChange={() => toggleExposureOption(option.id)}
                      />
                      <label htmlFor={option.id} className="ml-2 block text-sm text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Error and success messages */}
              {error && (
                <div className="mb-4">
                  <Alert type="error" message={error} />
                </div>
              )}
              
              {success && (
                <div className="mb-4">
                  <Alert type="success" message={success} />
                </div>
              )}
              
              {/* Submit button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitSignal}
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
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