import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, danger, outline, text
  size = 'md', // sm, md, lg
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 border border-transparent',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm border border-transparent',
    outline: 'bg-transparent text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100',
    text: 'bg-transparent text-slate-600 hover:text-red-600 hover:underline px-0 py-0'
  };

  const sizes = {
    sm: 'text-xs py-1.5 px-3 gap-1.5',
    md: 'text-sm py-2.5 px-5 gap-2',
    lg: 'text-base py-3.5 px-7 gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {!isLoading && Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}
