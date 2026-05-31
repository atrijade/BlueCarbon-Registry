import React from 'react';

export default function Input({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  id,
  ...props 
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-brand-400">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        <input
          id={id}
          className={`
            w-full rounded-xl py-2.5 px-4 text-sm text-slate-200 glass-input
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20' : ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-rose-400 font-medium">{error}</span>
      )}
    </div>
  );
}
