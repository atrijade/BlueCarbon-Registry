import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { Mail, Lock, User, Waves, ArrowRight, TreePine, Eye, ShieldAlert, Award } from 'lucide-react';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('ngo'); // default role

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { id: 'ngo', name: 'NGO Partner', desc: 'Restores coastlines & submits evidence', icon: TreePine },
    { id: 'community', name: 'Community Node', desc: 'Coastal panchayats & village members', icon: Eye },
    { id: 'auditor', name: 'Auditor Node', desc: 'Verifies carbon metrics & field data', icon: Award },
    { id: 'admin', name: 'System Admin', desc: 'Registry administrator', icon: ShieldAlert }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      return setError('Please fill in all fields');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const result = await signUp(email, password, name, role);
    setLoading(false);

    if (result.success) {
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } else {
      setError(result.error || 'Failed to register account.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070c0e] relative flex items-center justify-center p-4 overflow-y-auto">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-3xl pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-3xl pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-xl relative z-10 flex flex-col gap-6 my-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-teal-500 flex items-center justify-center glow-cyan">
            <Waves className="w-7 h-7 text-darkbg-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wider">TideLedger Registry</h1>
          <p className="text-[10px] uppercase tracking-widest text-brand-400 font-bold">Register a New Node</p>
        </div>

        {/* Register Panel */}
        <Card hoverable={false} className="shadow-2xl">
          <div className="flex flex-col gap-1 mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-100 font-sans">Create Credentials</h2>
            <p className="text-xs text-slate-400">Establish your keys & identity on TideLedger</p>
          </div>

          {error && (
            <div className="p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Input Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="name"
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={User}
                required
              />

              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="Min. 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={Lock}
                required
              />
            </div>

            {/* Visual Role Selector Grid */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">Select Registry Role</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`
                        flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200
                        ${isSelected 
                          ? 'bg-brand-900/35 border-brand-400/60 shadow-[0_0_12px_rgba(92,193,203,0.15)]' 
                          : 'bg-[#070c0e]/50 border-brand-500/10 hover:border-brand-500/20'
                        }
                      `}
                    >
                      <div className={`
                        p-2 rounded-lg mt-0.5
                        ${isSelected ? 'bg-brand-400 text-darkbg-300' : 'bg-[#0c2227] text-brand-400'}
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-100">{r.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">{r.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Create Registry Profile <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </Card>

        {/* Back to Login */}
        <p className="text-center text-xs text-slate-500">
          Already have a node?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4 transition-colors">
            Access Node
          </Link>
        </p>
      </div>
    </div>
  );
}
