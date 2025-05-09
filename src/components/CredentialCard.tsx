import React from 'react';

interface CredentialCardProps {
  credential: {
    id: string;
    title: string;
    description: string;
    required: boolean;
    icon: React.ReactNode;
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function CredentialCard({ credential, isSelected, onSelect }: CredentialCardProps) {
  return (
    <div 
      onClick={() => onSelect(credential.id)}
      className={`
        border rounded-lg p-6 cursor-pointer transition-all duration-200
        ${isSelected 
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
  );
} 