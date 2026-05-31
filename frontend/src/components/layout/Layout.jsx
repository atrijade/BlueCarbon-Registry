import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Waves, 
  LayoutDashboard, 
  PlusCircle, 
  FolderGit, 
  ClipboardCheck, 
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';

export default function Layout({ children }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const roleLabels = {
    ngo: 'NGO Representative',
    admin: 'System Admin',
    auditor: 'MRV Auditor',
    community: 'Community Member'
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ngo', 'admin', 'auditor', 'community']
    },
    {
      name: 'My Projects',
      path: '/projects/my',
      icon: FolderGit,
      roles: ['ngo', 'community']
    },
    {
      name: 'Submit Project',
      path: '/projects/create',
      icon: PlusCircle,
      roles: ['ngo', 'community', 'admin']
    },
    {
      name: 'Verification Queue',
      path: '/admin/dashboard',
      icon: ClipboardCheck,
      roles: ['admin', 'auditor']
    }
  ];

  // Filter routes based on user role
  const visibleNavItems = navItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="min-h-screen bg-[#070c0e] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#0c2227]/90 backdrop-blur-md border-b border-brand-500/10 z-50 sticky top-0">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Waves className="w-7 h-7 text-brand-400" />
          <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-brand-300 via-brand-400 to-teal-400 bg-clip-text text-transparent">
            BlueCarbon-Registry
          </span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-brand-300 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-[#0c2227]/70 backdrop-blur-xl border-r border-brand-500/10 flex flex-col justify-between
        z-40 p-5 pt-8 md:pt-8 md:h-screen sticky top-0
      `}>
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="hidden md:flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-teal-500 flex items-center justify-center glow-cyan">
              <Waves className="w-6 h-6 text-darkbg-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-wider text-white">BlueCarbon-Registry</span>
              <span className="text-[10px] tracking-widest text-brand-400 uppercase font-semibold">MRV REGISTRY</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <p className="text-[10px] uppercase tracking-widest text-brand-500 font-bold px-2 mb-2">Navigation</p>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-brand-400/15 to-teal-500/5 text-brand-300 border-l-2 border-brand-400 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.05)]' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#070c0e]/50'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="flex flex-col gap-4 border-t border-brand-500/10 pt-5 mt-auto">
          {profile && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-brand-900/60 border border-brand-400/20 flex items-center justify-center text-brand-300">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-white truncate">{profile.name}</span>
                <span className="text-[10px] text-brand-400 font-medium">
                  {roleLabels[profile.role] || profile.role}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto min-h-0">
        {/* Top Header Panel (desktop) */}
        <header className="hidden md:flex items-center justify-end px-8 py-4 border-b border-brand-500/10 bg-[#070c0e]/30">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">Network Node:</span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Polygon Amoy Testnet
            </span>
          </div>
        </header>

        {/* Screen Children Container */}
        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
