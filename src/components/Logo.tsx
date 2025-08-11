import React from 'react';

const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`font-bold text-2xl text-primary ${className}`}>
      LYNQ
    </div>
  );
};

export default Logo;