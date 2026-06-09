import React from 'react';

const Card = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`card ${onClick ? 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
