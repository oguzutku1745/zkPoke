import React from 'react';
import './tailwind-test.css'; // Import our custom CSS file

export function TailwindTest() {
  // Adding inline styles to test if styling works in general
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: '1rem',
  };

  const cardStyle = {
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    borderRadius: '0.5rem',
    padding: '2rem',
    maxWidth: '28rem',
    width: '100%',
  };

  const headingStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: '1rem',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={headingStyle}>Styling Test</h1>
        
        <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
          If you can see this text in gray and the heading in blue, inline styles are working!
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ backgroundColor: '#fecaca', padding: '1rem', borderRadius: '0.25rem' }}>
            Red background
          </div>
          <div style={{ backgroundColor: '#bbf7d0', padding: '1rem', borderRadius: '0.25rem' }}>
            Green background
          </div>
          <div style={{ backgroundColor: '#bfdbfe', padding: '1rem', borderRadius: '0.25rem' }}>
            Blue background
          </div>
          <div style={{ backgroundColor: '#fef08a', padding: '1rem', borderRadius: '0.25rem' }}>
            Yellow background
          </div>
        </div>
        
        <button 
          style={{ 
            marginTop: '1rem',
            backgroundColor: '#6366f1', 
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
        >
          Test Button
        </button>
        
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Tailwind Classes (Should work if Tailwind is correctly set up)</h2>
          <div className="p-4 bg-purple-100 text-purple-800 rounded-md mt-2">
            This should have purple background if Tailwind is working
          </div>
        </div>

        {/* Testing our custom CSS file */}
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Custom CSS Classes</h2>
          <div className="tw-bg-purple tw-text-white tw-p-4 tw-rounded tw-mt-4 tw-text-center tw-text-xl">
            This should have purple background if CSS imports are working
          </div>
        </div>
      </div>
    </div>
  );
} 