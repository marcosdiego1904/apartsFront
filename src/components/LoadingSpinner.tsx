import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="spinner-overlay">
      <div className="spinner-container"></div>
      <p className="spinner-text">Loading...</p>
    </div>
  );
};

export default LoadingSpinner; 