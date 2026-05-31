import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Mail, Lock, Waves, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields');
    }
    
    setError('');
    setLoading(true);
    
    const result = await signIn(email, password);
    setLoading(false);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070c0e] relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-3xl pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-3xl pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-teal-500 flex items-center justify-center glow-cyan animate-float">
            <Waves className="w-8 h-8 text-darkbg-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wider">TideLedger</h1>
          <p className="text-xs uppercase tracking-widest text-brand-400 font-bold">Blue Carbon MRV Registry</p>
        </div>

        {/* Login Panel */}
        <Card hoverable={false} className="shadow-2xl">
          <div className="flex flex-col gap-1 mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-100">Welcome Back</h2>
            <p className="text-xs text-slate-400">Access your TideLedger nodes & dashboard</p>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="e.g. auditor@tideledger.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />
            
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Access Node <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Registry Role Note */}
          <div className="mt-6 pt-5 border-t border-brand-500/10 flex gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
            <p>
              TideLedger enforces role-based access control. Connect your community, NGO, or authorized Auditor accounts.
            </p>
          </div>
        </Card>

        {/* Footer Navigation */}
        <p className="text-center text-xs text-slate-500">
          New to the registry?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4 transition-colors">
            Register a new node
          </Link>
        </p>
      </div>
    </div>
  );
}
