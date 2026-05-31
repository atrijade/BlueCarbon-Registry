import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import Card from '../components/common/Card';
import MapView from '../components/maps/MapView';
import CommunityDashboard from './CommunityDashboard';
import { 
  TreePine, 
  Award, 
  MapPin, 
  ClipboardCopy, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile } = useAuth();
  
  if (profile?.role === 'community') {
    return <CommunityDashboard />;
  }
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStats();
      if (res.success) {
        setStats(res.data);
      } else {
        setError('Failed to fetch dashboard metrics');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to node server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-4 border-brand-500/10 border-t-brand-400 animate-spin"></div>
        </div>
        <p className="mt-4 text-brand-400 text-xs tracking-widest uppercase animate-pulse">Syncing Registry Nodes...</p>
      </div>
    );
  }

  const global = stats?.global;
  const userMetrics = stats?.userMetrics;

  const metricCards = [
    {
      title: 'Verified Restorations',
      value: global ? `${global.verifiedProjects} Projects` : '0 Projects',
      desc: global ? `${global.totalHectaresVerified.toFixed(1)} Hectares total` : '0 Hectares',
      icon: TreePine,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10'
    },
    {
      title: 'Carbon Credits Minted',
      value: global ? `${global.totalCreditsIssued.toFixed(1)} tCO2e` : '0.0 tCO2e',
      desc: global ? `${global.activeCredits.toFixed(1)} tCO2e active` : '0.0 active',
      icon: Award,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Pending Verification',
      value: global ? `${global.pendingProjects} Projects` : '0 Projects',
      desc: 'Awaiting field audits',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
    {
      title: 'Total Registry Area',
      value: global ? `${global.totalHectaresRegistry.toFixed(1)} Ha` : '0.0 Ha',
      desc: 'Mangroves & salt marshes',
      icon: MapPin,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
          Registry Dashboard
        </h1>
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">
          Node Status: Connected • Role: {profile?.role}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* 1. Global Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} hoverable={true} className="flex flex-col gap-1 justify-between relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                  <span className="text-2xl font-extrabold text-white mt-2 tracking-tight">{card.value}</span>
                </div>
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color} glow-cyan`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-3 border-t border-slate-800/40 pt-2">
                {card.desc}
              </p>
            </Card>
          );
        })}
      </div>

      {/* 2. Role-specific Actions Panel */}
      {profile && (profile.role === 'ngo' || profile.role === 'community') && userMetrics && (
        <Card title="My Node Summary" subtitle="Submissions & performance on BlueCarbon-Registry" hoverable={false} className="shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col p-4 rounded-xl bg-[#070c0e]/50 border border-brand-500/5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Restoration Area</span>
              <span className="text-3xl font-extrabold text-brand-400 mt-2">{userMetrics.totalHectares.toFixed(1)} Ha</span>
              <span className="text-[11px] text-slate-400 mt-1">({userMetrics.verifiedHectares.toFixed(1)} Ha verified)</span>
            </div>

            <div className="flex flex-col p-4 rounded-xl bg-[#070c0e]/50 border border-brand-500/5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Active Credits</span>
              <span className="text-3xl font-extrabold text-emerald-400 mt-2">{userMetrics.creditsIssued.toFixed(1)} tCO2e</span>
              <span className="text-[11px] text-slate-400 mt-1">Tokenized carbon assets</span>
            </div>

            <div className="flex flex-col justify-center gap-3 p-4">
              <Link 
                to="/projects/create" 
                className="flex items-center justify-center gap-2 bg-brand-400 text-darkbg-300 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-brand-300 transition-colors shadow-lg shadow-brand-400/10"
              >
                Submit New Project
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/projects/my" 
                className="text-center text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors py-1"
              >
                View My Submissions
              </Link>
            </div>
          </div>
        </Card>
      )}

      {profile && (profile.role === 'admin' || profile.role === 'auditor') && userMetrics && (
        <Card title="Auditor Verification Portal" subtitle="Outstanding verification actions" hoverable={false} className="shadow-lg border-l-4 border-l-brand-400">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-slate-200 text-sm font-semibold">
                There are <span className="text-brand-400 font-bold underline underline-offset-4">{userMetrics.pendingQueueCount} projects</span> waiting for audit.
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Verify locations, coordinate species estimates, and issue credit tokens.
              </span>
            </div>
            <Link 
              to="/admin/dashboard" 
              className="flex items-center justify-center gap-2 bg-brand-400 text-darkbg-300 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-300 transition-colors self-start sm:self-auto shadow-lg shadow-brand-400/10"
            >
              Verify Projects Queue
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      )}

      {/* 3. Geographical Mapping & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-slate-300">Geographical Restoration Map</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Real-Time GIS Coordinates</span>
          </div>
          <MapView projects={stats?.mapCoordinates || []} height="400px" zoom={4} />
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Ecosystem Breakdown" subtitle="Species distributions on registry" hoverable={false} className="h-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-slate-300 font-semibold">
                  <span>Rhizophora (Red Mangroves)</span>
                  <span className="text-brand-400">55%</span>
                </div>
                <div className="w-full bg-[#070c0e]/80 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-400 h-full rounded-full" style={{ width: '55%' }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-slate-300 font-semibold">
                  <span>Avicennia (Black Mangroves)</span>
                  <span className="text-brand-400">25%</span>
                </div>
                <div className="w-full bg-[#070c0e]/80 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-slate-300 font-semibold">
                  <span>Seagrass Meadows</span>
                  <span className="text-brand-400">15%</span>
                </div>
                <div className="w-full bg-[#070c0e]/80 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-slate-300 font-semibold">
                  <span>Salt Marshes</span>
                  <span className="text-brand-400">5%</span>
                </div>
                <div className="w-full bg-[#070c0e]/80 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: '5%' }}></div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-brand-500/10 flex items-center gap-3 text-xs text-slate-400 bg-brand-900/10 p-3 rounded-xl border border-brand-500/5">
                <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <p>
                  Blue Carbon sinks hold up to <strong className="text-white">10x more carbon</strong> per area than tropical rain forests.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
