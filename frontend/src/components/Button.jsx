import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) => {
  const baseStyle = "flex items-center justify-center gap-2";
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "bg-green-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:bg-green-600 hover:-translate-y-1 transition-all duration-300 active:scale-95 border-none",
    outline: "btn-outline",
    danger: "bg-[#fff0ee] text-[#bd4338] font-bold py-3 px-8 rounded-2xl border border-[#efb8b1] shadow-sm hover:bg-[#ffe4e0] hover:border-[#e39b92] hover:-translate-y-1 transition-all duration-300 active:scale-95",
    success: "bg-[#ecfaf2] text-[#198754] font-bold py-3 px-8 rounded-2xl border border-[#bfe8cf] shadow-sm hover:bg-[#def5e9] hover:border-[#92d6af] hover:-translate-y-1 transition-all duration-300 active:scale-95"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed transform-none shadow-none' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
