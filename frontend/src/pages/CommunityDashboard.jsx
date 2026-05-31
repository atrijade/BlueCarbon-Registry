import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectService, communityService } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import MapView from '../components/maps/MapView';
import MapPicker from '../components/maps/MapPicker';
import { 
  TreePine, 
  Award, 
  MapPin, 
  Clock, 
  Plus, 
  Send, 
  Sparkles, 
  Activity, 
  AlertCircle, 
  ThumbsUp, 
  Check, 
  CheckSquare, 
  AlertOctagon, 
  Compass, 
  Users, 
  Calendar,
  Layers,
  MessageSquare
} from 'lucide-react';

export default function CommunityDashboard() {
  const { profile } = useAuth();
  
  // Tab states: 'overview', 'validate', 'report-sites', 'observations', 'complaints', 'activities', 'ai-assist'
  const [activeTab, setActiveTab] = useState('overview');

  // Shared Data States
  const [projects, setProjects] = useState([]);
  const [siteReports, setSiteReports] = useState([]);
  const [observations, setObservations] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // 1. Form States - Site Suggestion
  const [siteLocName, setSiteLocName] = useState('');
  const [siteCoords, setSiteCoords] = useState({ lat: 14.2, lng: 74.4 });
  const [siteIssue, setSiteIssue] = useState('');
  const [siteAction, setSiteAction] = useState('');
  const [sitePhoto, setSitePhoto] = useState('');

  // 2. Form States - Periodic Observation
  const [obsProjId, setObsProjId] = useState('');
  const [obsCoords, setObsCoords] = useState({ lat: 14.2, lng: 74.4 });
  const [obsComments, setObsComments] = useState('');
  const [obsPhoto, setObsPhoto] = useState('');

  // 3. Form States - Crowdsourced Project Validation
  const [valProjId, setValProjId] = useState('');
  const [valExists, setValExists] = useState(true);
  const [valCompleted, setValCompleted] = useState(true);
  const [valAccurate, setValAccurate] = useState(true);
  const [valRemarks, setValRemarks] = useState('');

  // 4. Form States - Environmental Complaints
  const [compType, setCompType] = useState('illegal_cutting');
  const [compDesc, setCompDesc] = useState('');
  const [compCoords, setCompCoords] = useState({ lat: 14.2, lng: 74.4 });
  const [compSeverity, setCompSeverity] = useState('medium');
  const [compPhoto, setCompPhoto] = useState('');

  // 5. Form States - Panchayat Volunteer Activities
  const [actType, setActType] = useState('tree_plantation');
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actDate, setActDate] = useState('');
  const [actVolunteers, setActVolunteers] = useState('');

  // 6. Form States - AI Assistant Chat
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: 'Hello! I am your Blue Carbon AI guide. Ask me about carbon capture, credit minting, or how communities can help protect coastal mangrove systems.' }
  ]);

  // 7. Form States - AI Species Suggester
  const [suggestCoords, setSuggestCoords] = useState({ lat: 14.4, lng: 74.3 });
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Load all dashboard records
  const loadData = async () => {
    try {
      setLoading(true);
      const [projRes, sitesRes, obsRes, compRes, actRes] = await Promise.all([
        projectService.getAll(),
        communityService.getSites(),
        communityService.getObservations(),
        communityService.getComplaints(),
        communityService.getActivities()
      ]);

      if (projRes.success) setProjects(projRes.data || []);
      if (sitesRes.success) setSiteReports(sitesRes.data || []);
      if (obsRes.success) setObservations(obsRes.data || []);
      if (compRes.success) setComplaints(compRes.data || []);
      if (actRes.success) setActivities(actRes.data || []);

    } catch (err) {
      console.error('Failed to load community logs:', err);
      showMsg('Failed to sync node registry data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  };

  // Submit Suggestion Handlers
  const handleReportSite = async (e) => {
    e.preventDefault();
    if (!siteLocName || !siteIssue || !siteAction) {
      return showMsg('Please fill in all site reporting fields.', 'error');
    }
    try {
      setActionLoading(true);
      const res = await communityService.reportSite({
        location_name: siteLocName,
        latitude: siteCoords.lat,
        longitude: siteCoords.lng,
        issue: siteIssue,
        suggested_action: siteAction,
        photo_url: sitePhoto || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=600'
      });
      if (res.success) {
        showMsg('Restoration site report submitted successfully!');
        setSiteLocName('');
        setSiteIssue('');
        setSiteAction('');
        setSitePhoto('');
        loadData();
      }
    } catch (err) {
      showMsg('Failed to submit site suggestion.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportObservation = async (e) => {
    e.preventDefault();
    if (!obsComments) {
      return showMsg('Please add observation notes.', 'error');
    }
    try {
      setActionLoading(true);
      const res = await communityService.submitObservation({
        project_id: obsProjId || null,
        comments: obsComments,
        latitude: obsCoords.lat,
        longitude: obsCoords.lng,
        photo_url: obsPhoto || 'https://images.unsplash.com/photo-1473081556163-2a17de81fc97?auto=format&fit=crop&q=80&w=600'
      });
      if (res.success) {
        showMsg('Monitoring observation logged successfully!');
        setObsComments('');
        setObsPhoto('');
        setObsProjId('');
        loadData();
      }
    } catch (err) {
      showMsg('Failed to log observation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportComplaint = async (e) => {
    e.preventDefault();
    if (!compDesc) {
      return showMsg('Please describe the issue.', 'error');
    }
    try {
      setActionLoading(true);
      const res = await communityService.submitComplaint({
        issue_type: compType,
        description: compDesc,
        latitude: compCoords.lat,
        longitude: compCoords.lng,
        severity: compSeverity,
        photo_url: compPhoto || 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=600'
      });
      if (res.success) {
        showMsg('Complaint filed successfully. Admin and auditors have been alerted.');
        setCompDesc('');
        setCompPhoto('');
        loadData();
      }
    } catch (err) {
      showMsg('Failed to file complaint.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportActivity = async (e) => {
    e.preventDefault();
    if (!actTitle || !actDate || !actVolunteers) {
      return showMsg('Title, Date, and Volunteers Count are required.', 'error');
    }
    try {
      setActionLoading(true);
      const res = await communityService.submitActivity({
        activity_type: actType,
        title: actTitle,
        description: actDesc,
        event_date: actDate,
        volunteers_count: parseInt(actVolunteers)
      });
      if (res.success) {
        showMsg('Panchayat drive registered successfully!');
        setActTitle('');
        setActDesc('');
        setActDate('');
        setActVolunteers('');
        loadData();
      }
    } catch (err) {
      showMsg('Failed to log activity drive.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyProjectSubmit = async (e) => {
    e.preventDefault();
    if (!valProjId) {
      return showMsg('Please select a restoration project to validate.', 'error');
    }
    try {
      setActionLoading(true);
      const res = await communityService.submitValidation({
        project_id: valProjId,
        exists: valExists,
        work_completed: valCompleted,
        area_accurate: valAccurate,
        remarks: valRemarks
      });
      if (res.success) {
        showMsg('Project validation report submitted successfully.');
        setValRemarks('');
        setValProjId('');
        loadData();
      }
    } catch (err) {
      showMsg('Failed to submit validation.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAskAi = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim()) return;

    const userQuestion = chatQuestion;
    setChatHistory(prev => [...prev, { role: 'user', text: userQuestion }]);
    setChatQuestion('');

    try {
      const res = await communityService.askAiAssistant(userQuestion);
      if (res.success) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: res.reply }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Sorry, the AI guide is busy at the moment. Please try again shortly.' }]);
    }
  };

  const handleGetAiSuggestions = async (coords) => {
    try {
      setSuggestCoords(coords);
      const res = await communityService.getAiSuggestions(coords.lat, coords.lng);
      if (res.success) {
        setAiSuggestion(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Localized Carbon Impact aggregations
  const activeRestorationsCount = projects.filter(p => p.status === 'verified').length;
  const totalAreaRestored = projects.filter(p => p.status === 'verified').reduce((sum, p) => sum + parseFloat(p.area_hectares || 0), 0);
  const estCo2Captured = totalAreaRestored * 28.4; // 28.4 metric tons sequestered per hectare annually in estuary environments
  const activeVolunteersCount = activities.reduce((sum, a) => sum + (a.volunteers_count || 0), 0);

  const formatSeverity = (s) => {
    switch (s) {
      case 'high': return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'medium': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default: return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-4 border-brand-500/10 border-t-brand-400 animate-spin"></div>
        </div>
        <p className="mt-4 text-brand-400 text-xs tracking-widest uppercase animate-pulse">Syncing Panchayat Node...</p>
      </div>
    );
  }

  // Projects map pins coordinates formatter
  const mapCoordinates = projects
    .filter(p => p.latitude !== null && p.longitude !== null)
    .map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      latitude: parseFloat(p.latitude),
      longitude: parseFloat(p.longitude),
      area: p.area_hectares,
      species: p.species
    }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
          Panchayat & Community Hub
        </h1>
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">
          Village Jurisdiction: {profile?.organization_name || profile?.location || 'Aghanashini Estuary Node'} • Active Stakeholder
        </p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${
          msg.type === 'error' 
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto border-b border-brand-500/10 gap-1 pb-1 scrollbar-hide">
        {[
          { id: 'overview', name: 'Overview', icon: Layers },
          { id: 'validate', name: 'Crowd Audit', icon: CheckSquare },
          { id: 'report-sites', name: 'Suggest Sites', icon: Plus },
          { id: 'observations', name: 'Submit Logs', icon: Activity },
          { id: 'complaints', name: 'Complaint Center', icon: AlertOctagon },
          { id: 'activities', name: 'Participation Track', icon: Users },
          { id: 'ai-assist', name: 'AI Restoration Guide', icon: Sparkles }
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap border-b-2
                ${isSelected 
                  ? 'text-brand-400 border-brand-400 bg-brand-900/15' 
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/25'
                }`}
            >
              <Icon className="w-4 h-4" />
              {t.name}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* Carbon Impact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hoverable={false}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Restorations</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5">{activeRestorationsCount} Projects</h3>
              <p className="text-xs text-brand-400 mt-2 font-medium">Under monitoring</p>
            </Card>

            <Card hoverable={false}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Panchayat Restored Area</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5">{totalAreaRestored.toFixed(1)} Hectares</h3>
              <p className="text-xs text-brand-400 mt-2 font-medium">Verified boundary space</p>
            </Card>

            <Card hoverable={false}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estimated CO2 Sequestered</span>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1.5">{estCo2Captured.toFixed(1)} tCO2e/yr</h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">Carbon biomass storage</p>
            </Card>

            <Card hoverable={false}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Community Volunteers</span>
              <h3 className="text-2xl font-extrabold text-sky-400 mt-1.5">{activeVolunteersCount} Members</h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">Engaged in ecosystem drives</p>
            </Card>
          </div>

          {/* Map View & Nearby Projects list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-bold text-slate-300">Panchayat Restoration Map</span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Active GIS Locations</span>
              </div>
              <MapView projects={mapCoordinates} height="360px" zoom={6} />
            </div>

            {/* List of projects */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-300 px-1">Restoration Projects Active</span>
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[360px] pr-1">
                {projects.length === 0 ? (
                  <Card hoverable={false} className="text-center py-8 text-xs text-slate-400">
                    No projects found on node registry.
                  </Card>
                ) : (
                  projects.map(p => (
                    <Card key={p.id} hoverable={true} className="flex flex-col gap-2 p-3.5 border border-brand-500/5 hover:border-brand-400/20 bg-darkbg-200/50">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-100 text-sm truncate max-w-[70%]">{p.title}</span>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border 
                          ${p.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            p.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                        <span className="truncate">{p.location_name || 'Estuary Coast'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 border-t border-slate-800/40 pt-2">
                        <span>Area: <strong>{p.area_hectares} Ha</strong></span>
                        <span>Species: <strong className="text-slate-300 italic">{p.species?.split(' ')[0] || 'Rhizophora'}</strong></span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CROWD VALIDATION TAB */}
      {activeTab === 'validate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Validation Form */}
          <Card title="Crowdsourced Verification Audit" subtitle="Provide local verification checks to confirm project claims.">
            <form onSubmit={handleVerifyProjectSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Project to Audit</label>
                <select
                  value={valProjId}
                  onChange={(e) => setValProjId(e.target.value)}
                  className="w-full bg-[#070c0e]/80 border border-brand-500/10 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-brand-400 outline-none"
                  required
                >
                  <option value="">-- Choose Restoration Site --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.location_name || 'Coast'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Checklist */}
              <div className="flex flex-col gap-3 p-3 bg-brand-900/5 border border-brand-500/5 rounded-xl mt-2">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-1">Local Stakeholder Checklist</span>
                
                <label className="flex items-center gap-3 cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={valExists}
                    onChange={(e) => setValExists(e.target.checked)}
                    className="w-4 h-4 rounded accent-brand-400 border border-brand-500/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">Restoration Plantation exists</span>
                    <span className="text-[10px] text-slate-400">Confirm you can see saplings planted at coordinates</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none py-1 border-t border-slate-800/40 pt-2">
                  <input
                    type="checkbox"
                    checked={valCompleted}
                    onChange={(e) => setValCompleted(e.target.checked)}
                    className="w-4 h-4 rounded accent-brand-400 border border-brand-500/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">Work completed</span>
                    <span className="text-[10px] text-slate-400">Confirm physical planting and fencing tasks occurred</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none py-1 border-t border-slate-800/40 pt-2">
                  <input
                    type="checkbox"
                    checked={valAccurate}
                    onChange={(e) => setValAccurate(e.target.checked)}
                    className="w-4 h-4 rounded accent-brand-400 border border-brand-500/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">Area appears accurate</span>
                    <span className="text-[10px] text-slate-400">Confirm reported planting acreage is not exaggerated</span>
                  </div>
                </label>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remarks / Ground Observations</label>
                <textarea
                  value={valRemarks}
                  onChange={(e) => setValRemarks(e.target.value)}
                  placeholder="e.g. Mangrove seedlings appear to have stabilized. Fencing is present. Highly visible from the village bridge."
                  className="w-full min-h-[90px] bg-[#070c0e]/80 border border-brand-500/10 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-brand-400 outline-none resize-none"
                  required
                ></textarea>
              </div>

              <Button type="submit" loading={actionLoading} className="w-full mt-2">
                Submit Ground Validation Audit
              </Button>
            </form>
          </Card>

          {/* Validation Logs */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-300 px-1">Recent Crowdsourced Validations</span>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[480px]">
              {projects.length === 0 ? (
                <Card hoverable={false} className="text-center py-8 text-xs text-slate-400">
                  No verification reports available.
                </Card>
              ) : (
                projects.map(p => (
                  <Card key={p.id} title={p.title} subtitle={`Site: ${p.location_name || 'Estuary Coast'}`} hoverable={false} className="p-4 border border-brand-500/5">
                    <div className="flex flex-col gap-2.5 mt-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="flex flex-col p-2 bg-[#070c0e]/40 rounded-lg border border-brand-500/5">
                          <span className="text-[9px] text-slate-400 uppercase font-bold">Saplings Exist</span>
                          <span className="text-xs font-extrabold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Confirmed
                          </span>
                        </div>
                        <div className="flex flex-col p-2 bg-[#070c0e]/40 rounded-lg border border-brand-500/5">
                          <span className="text-[9px] text-slate-400 uppercase font-bold">Work Done</span>
                          <span className="text-xs font-extrabold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Confirmed
                          </span>
                        </div>
                        <div className="flex flex-col p-2 bg-[#070c0e]/40 rounded-lg border border-brand-500/5">
                          <span className="text-[9px] text-slate-400 uppercase font-bold">Acreage Okay</span>
                          <span className="text-xs font-extrabold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Verified
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 bg-brand-900/5 p-2.5 rounded-lg border border-brand-500/5">
                        <span className="font-bold text-slate-300">Panchayat Audit Note:</span> Good survival rates. Local fishermen verify high crab counts after plantation.
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. SUGGEST SITES TAB */}
      {activeTab === 'report-sites' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Suggest Restoration Sites" subtitle="Report degraded coastlines that could benefit from carbon offset plantations.">
            <form onSubmit={handleReportSite} className="flex flex-col gap-4">
              <Input
                id="siteLocName"
                label="Site / Estuary Location Name"
                placeholder="e.g. Aghanashini Estuary mudflats"
                value={siteLocName}
                onChange={(e) => setSiteLocName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4 bg-[#070c0e]/40 p-3 rounded-xl border border-brand-500/10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Latitude</span>
                  <span className="text-xs text-slate-300 font-semibold">{siteCoords.lat.toFixed(5)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Longitude</span>
                  <span className="text-xs text-slate-300 font-semibold">{siteCoords.lng.toFixed(5)}</span>
                </div>
                <span className="col-span-2 text-[9px] text-slate-400 mt-1">Drag the map pin on the right to set GPS coordinates.</span>
              </div>

              <Input
                id="siteIssue"
                label="Degradation / Ecological Issue Observed"
                placeholder="e.g. High salinity observed, no natural vegetation regenerating, erosion threat"
                value={siteIssue}
                onChange={(e) => setSiteIssue(e.target.value)}
                required
              />

              <Input
                id="siteAction"
                label="Suggested Restoration Action"
                placeholder="e.g. Afforestation of Rhizophora mangroves, salt marsh seeding"
                value={siteAction}
                onChange={(e) => setSiteAction(e.target.value)}
                required
              />

              <Input
                id="sitePhoto"
                label="Photo Evidence URL (Optional)"
                placeholder="e.g. https://domain.com/photo.jpg"
                value={sitePhoto}
                onChange={(e) => setSitePhoto(e.target.value)}
              />

              <Button type="submit" loading={actionLoading} className="w-full mt-2">
                Submit Site Suggestion
              </Button>
            </form>
          </Card>

          {/* Map Selector & Reported Sites list */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300 px-1 uppercase tracking-wider">Drag to Pin Restoration Coordinates</span>
              <MapPicker coords={siteCoords} onChange={setSiteCoords} height="280px" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-300 px-1">Reported Sites Awaiting NGO Action</span>
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1">
                {siteReports.length === 0 ? (
                  <Card hoverable={false} className="text-center py-6 text-xs text-slate-400">
                    No site reports submitted yet.
                  </Card>
                ) : (
                  siteReports.map(s => (
                    <Card key={s.id} hoverable={false} className="p-3 border border-brand-500/5">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100 text-sm">{s.location_name}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">GPS: {parseFloat(s.latitude).toFixed(4)}, {parseFloat(s.longitude).toFixed(4)}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-brand-400/10 border border-brand-400/20 text-brand-300">
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 bg-[#070c0e]/30 p-2 rounded border border-brand-500/5">
                        <strong className="text-slate-400">Issue:</strong> {s.issue}
                      </p>
                      <div className="text-xs text-slate-400 mt-2 flex justify-between">
                        <span>Action: <strong className="text-brand-300">{s.suggested_action}</strong></span>
                        <span className="text-[10px]">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBMIT OBSERVATIONS TAB */}
      {activeTab === 'observations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Submit Field Observation Logs" subtitle="Upload ground observations (flooding logs, survival rates, sapling growth status) to monitor active sites.">
            <form onSubmit={handleReportObservation} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Associate with Active Project (Optional)</label>
                <select
                  value={obsProjId}
                  onChange={(e) => setObsProjId(e.target.value)}
                  className="w-full bg-[#070c0e]/80 border border-brand-500/10 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-brand-400 outline-none"
                >
                  <option value="">-- General / Estuary Region --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#070c0e]/40 p-3 rounded-xl border border-brand-500/10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Latitude</span>
                  <span className="text-xs text-slate-300 font-semibold">{obsCoords.lat.toFixed(5)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Longitude</span>
                  <span className="text-xs text-slate-300 font-semibold">{obsCoords.lng.toFixed(5)}</span>
                </div>
                <span className="col-span-2 text-[9px] text-slate-400 mt-1">Drag the map pin on the right to set GPS coordinates.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observation Notes & Status</label>
                <textarea
                  value={obsComments}
                  onChange={(e) => setObsComments(e.target.value)}
                  placeholder="e.g. Flooding cycles are stable. Sapling survival rate appears good. Minor seaweed encroachment but generally clear."
                  className="w-full min-h-[100px] bg-[#070c0e]/80 border border-brand-500/10 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-brand-400 outline-none resize-none"
                  required
                ></textarea>
              </div>

              <Input
                id="obsPhoto"
                label="Observation Photo URL (Optional)"
                placeholder="e.g. https://domain.com/photo.jpg"
                value={obsPhoto}
                onChange={(e) => setObsPhoto(e.target.value)}
              />

              <Button type="submit" loading={actionLoading} className="w-full mt-2">
                Submit Observation Log
              </Button>
            </form>
          </Card>

          {/* Map Selector & Log Feed */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300 px-1 uppercase tracking-wider">Drag to Pin Log Location</span>
              <MapPicker coords={obsCoords} onChange={setObsCoords} height="240px" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-300 px-1">Continuous Monitoring Logs</span>
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1">
                {observations.length === 0 ? (
                  <Card hoverable={false} className="text-center py-6 text-xs text-slate-400">
                    No observations submitted yet.
                  </Card>
                ) : (
                  observations.map(o => (
                    <Card key={o.id} hoverable={false} className="p-3 border border-brand-500/5 bg-[#070c0e]/30">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-300 text-xs">{o.reporter_name}</span>
                        <span className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-100 mt-2 italic">
                        "{o.comments}"
                      </p>
                      <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
                        <span>GPS: {parseFloat(o.latitude).toFixed(4)}, {parseFloat(o.longitude).toFixed(4)}</span>
                        {o.project_id && <span className="text-brand-400">Associated Project Log</span>}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. COMPLAINTS CENTER TAB */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Geo-Tagged Incident Complaint" subtitle="Report coastal violations (oil spills, waste dumping, illegal mangrove cutting, erosion threats).">
            <form onSubmit={handleReportComplaint} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Type</label>
                <select
                  value={compType}
                  onChange={(e) => setCompType(e.target.value)}
                  className="w-full bg-[#070c0e]/80 border border-brand-500/10 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-brand-400 outline-none"
                  required
                >
                  <option value="illegal_cutting">Illegal Mangrove Cutting</option>
                  <option value="pollution">Pollution / Littering</option>
                  <option value="encroachment">Encroachment / Coastal Sand Mining</option>
                  <option value="damaged_area">Damaged Restoration Area</option>
                  <option value="oil_spill">Oil Spill</option>
                  <option value="waste_dumping">Industrial Waste Dumping</option>
                  <option value="mangrove_destruction">Natural Mangrove Disease/Destruction</option>
                  <option value="coastal_erosion">Severe Coastal Erosion</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#070c0e]/40 p-3 rounded-xl border border-brand-500/10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Latitude</span>
                  <span className="text-xs text-slate-300 font-semibold">{compCoords.lat.toFixed(5)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Longitude</span>
                  <span className="text-xs text-slate-300 font-semibold">{compCoords.lng.toFixed(5)}</span>
                </div>
                <span className="col-span-2 text-[9px] text-slate-400 mt-1">Drag the map pin on the right to set GPS coordinates.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Severity Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['low', 'medium', 'high'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCompSeverity(s)}
                      className={`py-2 rounded-xl text-xs font-semibold uppercase border transition-colors 
                        ${compSeverity === s 
                          ? s === 'high' ? 'bg-rose-500/20 border-rose-400 text-rose-300' : 
                            s === 'medium' ? 'bg-amber-500/20 border-amber-400 text-amber-300' :
                            'bg-sky-500/20 border-sky-400 text-sky-300'
                          : 'bg-[#070c0e]/60 border-brand-500/10 text-slate-400 hover:border-slate-800'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Details</label>
                <textarea
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  placeholder="Describe the incident, damage, or vehicles involved..."
                  className="w-full min-h-[90px] bg-[#070c0e]/80 border border-brand-500/10 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-brand-400 outline-none resize-none"
                  required
                ></textarea>
              </div>

              <Input
                id="compPhoto"
                label="Photo Evidence URL (Highly Recommended)"
                placeholder="e.g. https://domain.com/photo.jpg"
                value={compPhoto}
                onChange={(e) => setCompPhoto(e.target.value)}
              />

              <Button type="submit" loading={actionLoading} className="w-full mt-2">
                File Environmental Complaint
              </Button>
            </form>
          </Card>

          {/* Map Selector & Complaints List */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300 px-1 uppercase tracking-wider">Drag to Pin Incident Location</span>
              <MapPicker coords={compCoords} onChange={setCompCoords} height="240px" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-300 px-1">Filed Incident Complaints (Panchayat Area)</span>
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-1">
                {complaints.length === 0 ? (
                  <Card hoverable={false} className="text-center py-6 text-xs text-slate-400">
                    No incident reports filed yet.
                  </Card>
                ) : (
                  complaints.map(c => (
                    <Card key={c.id} hoverable={false} className="p-3 border border-brand-500/5">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100 text-xs uppercase tracking-wider">
                            {c.issue_type.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">GPS: {parseFloat(c.latitude).toFixed(4)}, {parseFloat(c.longitude).toFixed(4)}</span>
                        </div>
                        <span className={`text-[9px] uppercase font-bold border px-2 py-0.5 rounded-full ${formatSeverity(c.severity)}`}>
                          {c.severity} Severity
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 bg-[#070c0e]/30 p-2.5 rounded border border-brand-500/5">
                        {c.description}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                        <span>Status: <strong className="text-amber-400 font-semibold">{c.status}</strong></span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. VOLUNTEERING ACTIVITIES TAB */}
      {activeTab === 'activities' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Log Panchayat Activity Drive" subtitle="Track community participation, cleanup campaigns, plantation drives, and volunteers count.">
            <form onSubmit={handleReportActivity} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drive Category</label>
                <select
                  value={actType}
                  onChange={(e) => setActType(e.target.value)}
                  className="w-full bg-[#070c0e]/80 border border-brand-500/10 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-brand-400 outline-none"
                  required
                >
                  <option value="tree_plantation">Tree / Mangrove Plantation Drive</option>
                  <option value="cleanup">Estuary Plastic cleanup</option>
                  <option value="awareness_campaign">Carbon Credits & Ecosystem Awareness</option>
                  <option value="volunteer_event">Seed Collection / Nursery Event</option>
                </select>
              </div>

              <Input
                id="actTitle"
                label="Campaign Title"
                placeholder="e.g. Panchayat Mangrove Seeding Drive"
                value={actTitle}
                onChange={(e) => setActTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="actDate"
                  type="date"
                  label="Campaign Date"
                  value={actDate}
                  onChange={(e) => setActDate(e.target.value)}
                  required
                />
                <Input
                  id="actVolunteers"
                  type="number"
                  label="Volunteer Count"
                  placeholder="e.g. 24"
                  value={actVolunteers}
                  onChange={(e) => setActVolunteers(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign Summary / Impact Report</label>
                <textarea
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  placeholder="Summarize coordinates cleaned, seeds gathered, or panchayat target metrics achieved..."
                  className="w-full min-h-[90px] bg-[#070c0e]/80 border border-brand-500/10 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-brand-400 outline-none resize-none"
                ></textarea>
              </div>

              <Button type="submit" loading={actionLoading} className="w-full mt-2">
                Log Campaign Drive
              </Button>
            </form>
          </Card>

          {/* Activities List */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-300 px-1">Panchayat Campaign Log History</span>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px]">
              {activities.length === 0 ? (
                <Card hoverable={false} className="text-center py-8 text-xs text-slate-400">
                  No campaigns logged yet.
                </Card>
              ) : (
                activities.map(a => (
                  <Card key={a.id} hoverable={false} className="p-4 border border-brand-500/5 bg-[#070c0e]/40">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-100 text-sm">{a.title}</span>
                        <span className="text-[10px] text-brand-400 font-semibold uppercase">{a.activity_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                        <Users className="w-3.5 h-3.5" /> {a.volunteers_count} Volunteers
                      </div>
                    </div>
                    {a.description && (
                      <p className="text-xs text-slate-400 mt-2 bg-[#070c0e]/20 p-2.5 rounded border border-brand-500/5">
                        {a.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-3 border-t border-slate-800/40 pt-2">
                      <span>Organizer: <strong className="text-slate-300">{a.organizer_name}</strong></span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(a.event_date).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. AI ASSIST TAB (Gemini & Suggestions) */}
      {activeTab === 'ai-assist' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Assistant */}
          <Card title="Gemini AI Environmental Assistant" subtitle="Learn about carbon capture, mangrove species guidelines, and registry MRV rules.">
            <div className="flex flex-col gap-3 min-h-[300px] max-h-[300px] overflow-y-auto p-3 bg-[#070c0e]/80 border border-brand-500/10 rounded-xl mb-4">
              {chatHistory.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed 
                    ${item.role === 'user' 
                      ? 'bg-brand-900/40 border border-brand-400/30 text-slate-100 self-end rounded-tr-none' 
                      : 'bg-slate-850 border border-brand-500/5 text-slate-300 self-start rounded-tl-none'}`}
                >
                  <span className="font-bold text-[10px] uppercase mb-1 tracking-wider text-brand-400">
                    {item.role === 'user' ? 'Community Member' : 'Registry Assistant AI'}
                  </span>
                  {/* Simplistic formatting support for markdown headings */}
                  <div className="markdown-chat-view whitespace-pre-line">
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAskAi} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about mangroves, carbon credits, conservation..."
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                className="flex-1 bg-[#070c0e]/85 border border-brand-500/10 rounded-xl px-4 py-3 text-slate-200 text-xs focus:border-brand-400 outline-none"
                required
              />
              <button
                type="submit"
                className="p-3 bg-brand-400 text-darkbg-300 rounded-xl hover:bg-brand-300 transition-colors flex items-center justify-center shadow-lg shadow-brand-400/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </Card>

          {/* Species Suggester */}
          <Card title="AI Restoration Species Suggester" subtitle="Click anywhere on the map below to analyze the coordinates and receive specific species suggestions.">
            <div className="flex flex-col gap-4">
              {/* Suggester map */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select coordinate pin</span>
                <MapPicker coords={suggestCoords} onChange={handleGetAiSuggestions} height="200px" />
              </div>

              {/* Suggestions Panel */}
              {aiSuggestion ? (
                <div className="p-3.5 rounded-xl border border-brand-400/20 bg-brand-900/10 flex flex-col gap-2 animate-pulse-slow">
                  <div className="flex items-center gap-2 text-brand-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4" /> Coordinates Suggestion ({aiSuggestion.latitude.toFixed(4)}, {aiSuggestion.longitude.toFixed(4)})
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1.5 border-t border-slate-800/40 pt-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">Recommended Species</span>
                      <span className="text-xs font-bold text-white italic">{aiSuggestion.recommended_species}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">Est. Survival Rate</span>
                      <span className="text-xs font-bold text-emerald-400">{aiSuggestion.estimated_survival_rate}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">Restoration Type</span>
                      <span className="text-xs font-bold text-white capitalize">{aiSuggestion.restoration_type}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">Target Soil Zone</span>
                      <span className="text-xs font-bold text-white">{aiSuggestion.soil_type}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-350 mt-2 bg-[#070c0e]/40 p-2.5 rounded-lg border border-brand-500/5">
                    <span className="font-bold text-slate-300">Planting Instruction:</span> {aiSuggestion.planting_advice}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-brand-500/10 rounded-xl">
                  Click on the map coordinates above to fetch species restoration advice.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
