import React from 'react';
import { Header, Footer, BottomNavigation } from '../components';

interface Signal {
  id: string;
  name: string;
  read?: boolean;
  replied?: boolean;
  timestamp: string;
}

export function SignalsDashboard() {
  // Sample data (will be replaced with actual contract data later)
  const sentSignals: Signal[] = [
    { id: '1', name: 'Hisam', timestamp: '2 days ago' },
    { id: '2', name: 'Oğuz', timestamp: '3 days ago' },
    { id: '3', name: 'Akın', timestamp: 'Just now' },
  ];

  const receivedSignals: Signal[] = [
    { id: '1', name: 'Signaler 1', read: true, replied: false, timestamp: '1 day ago' },
    { id: '2', name: 'Signaler 2', read: true, replied: true, timestamp: '5 hours ago' },
    { id: '3', name: 'Signaler 3', read: true, replied: false, timestamp: '2 weeks ago' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Signals Sent</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {sentSignals.map((signal) => (
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
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Signals Received</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {receivedSignals.map((signal) => (
                <li key={signal.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
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
                    {signal.replied && (
                      <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </li>
              ))}
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