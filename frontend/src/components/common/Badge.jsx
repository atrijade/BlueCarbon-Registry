import React from 'react';

export default function Badge({ status, className = '', ...props }) {
  const normalized = status ? status.toLowerCase() : '';

  const styles = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    under_review: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    active: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    retired: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    default: 'bg-slate-500/10 text-slate-300 border-slate-500/20'
  };

  const labels = {
    pending: 'Pending Review',
    under_review: 'Under Audit',
    verified: 'Verified & Active',
    approved: 'Approved',
    rejected: 'Rejected',
    active: 'Active',
    retired: 'Retired'
  };

  const matchedStyle = styles[normalized] || styles.default;
  const label = labels[normalized] || status;

  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase tracking-wider
        ${matchedStyle} ${className}
      `}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse-slow"></span>
      {label}
    </span>
  );
}
