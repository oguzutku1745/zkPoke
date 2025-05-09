import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useContractContext } from '../context/ContractContext';
import { Alert } from './Alert';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requiresContract?: boolean;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/', 
  requiresContract = true 
}: ProtectedRouteProps) {
  const { contract } = useContractContext();
  
  // Check if contract is required and available
  if (requiresContract && !contract) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Alert 
          type="error" 
          message="You need to connect to a contract first to access this page." 
        />
        <div className="mt-4">
          <Navigate to={redirectTo} replace />
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
} 