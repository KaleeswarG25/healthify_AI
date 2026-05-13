// src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = '#667eea' }) => {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div className="spinner-container">
      <div 
        className="spinner"
        style={{
          width: sizes[size] || sizes.medium,
          height: sizes[size] || sizes.medium,
          border: `3px solid ${color}20`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%'
        }}
      />
      <style>{`
        .spinner-container {
          display: flex;
          justify-content: center;
          padding: 1rem;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;