import React from 'react';
import { Link } from 'react-router-dom';

const AuthButton = ({
  children,
  to,
  type = 'button',
  variant = 'primary',
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseClass =
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-extrabold transition-all duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60';

  const variants = {
    primary:
      'bg-[linear-gradient(135deg,#1584C3,#20B7B5)] text-white shadow-[0_12px_28px_rgba(21,132,195,0.28)] hover:bg-[linear-gradient(135deg,#0F6FA6,#168D8B)] focus:ring-[#1584C3]/20',
    secondary:
      'border border-[#D9EAF2] bg-white text-[#0F172A] hover:border-[#1584C3] hover:text-[#0F6FA6] focus:ring-[#1584C3]/15',
    soft:
      'border border-[#D9EAF2] bg-[#EAF7FD] text-[#0F6FA6] hover:bg-white focus:ring-[#1584C3]/15',
  };

  const content = (
    <>
      {Icon && <Icon size={19} strokeWidth={2.4} />}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${baseClass} ${variants[variant]} ${className}`} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={`${baseClass} ${variants[variant]} ${className}`} {...props}>
      {content}
    </button>
  );
};

export default AuthButton;
