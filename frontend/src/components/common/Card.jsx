import React from 'react';

export default function Card({ 
  children, 
  title, 
  subtitle, 
  headerAction,
  hoverable = true, 
  className = '', 
  ...props 
}) {
  return (
    <div 
      className={`
        rounded-2xl p-6 glass-panel 
        ${hoverable ? 'glass-panel-hover' : ''} 
        ${className}
      `}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between border-b border-brand-500/10 pb-4 mb-5">
          <div className="flex flex-col">
            {title && <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-brand-400 font-medium mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
