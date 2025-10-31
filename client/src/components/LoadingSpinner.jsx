import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 dark:border-gray-600 dark:border-t-primary-400"></div>
    </div>
  );
};

export default LoadingSpinner;