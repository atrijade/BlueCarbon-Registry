import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070c0e] flex items-center justify-center flex-col">
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 rounded-full border-4 border-brand-500/10 border-t-brand-400 animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border border-brand-300/5 animate-ping"></div>
        </div>
        <p className="mt-4 text-brand-300 font-medium tracking-widest text-sm animate-pulse">LOADING BLUECARBON-REGISTRY...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#070c0e] flex items-center justify-center flex-col">
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 rounded-full border-4 border-brand-500/10 border-t-brand-400 animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border border-brand-300/5 animate-ping"></div>
        </div>
        <p className="mt-4 text-brand-300 font-medium tracking-widest text-sm animate-pulse">SYNCING PROFILE...</p>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // If authenticated but unauthorized, redirect to standard dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
