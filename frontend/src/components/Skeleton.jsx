import React from 'react';

const Skeleton = ({ className, circle = false }) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 ${circle ? 'rounded-full' : 'rounded'} ${className}`}
    ></div>
  );
};

export default Skeleton;
