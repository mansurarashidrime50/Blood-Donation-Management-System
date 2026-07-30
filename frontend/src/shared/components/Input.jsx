import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 ${Icon ? 'pl-10' : ''} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 font-semibold mt-0.5">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
