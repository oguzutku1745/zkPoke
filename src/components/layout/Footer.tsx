import React from 'react';

export function Footer() {
  return (
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
  );
} 