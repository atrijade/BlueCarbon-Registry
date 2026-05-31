import React, { useState, useEffect } from 'react';
import { auditorService, authService } from '../services/api';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import MapView from '../components/maps/MapView';
import { 
  ClipboardCheck, 
  MapPin, 
  Layers, 
  TreePine, 
  Camera, 
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building,
  Sparkles,
  Award,
  AlertTriangle,
  Download,
  Activity,
  FileSpreadsheet,
  Check
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'nodes'
  
  // Projects Queue State
  const [pendingProjects, setPendingProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'under_review', 'verified', 'rejected'
  
  // GIS & AI Analysis State
  const [analysisData, setAnalysisData] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Carbon Calculator adjustments
  const [plantationAge, setPlantationAge] = useState(1);
  const [calculatedCredits, setCalculatedCredits] = useState({ yearly: 0, cumulative: 0 });

  // Report Modal / Drawer
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Nodes Approvals State
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [approvingNodeId, setApprovingNodeId] = useState(null);

  // Status Alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State for Verification
  const [remarks, setRemarks] = useState('');
  const [creditsIssued, setCreditsIssued] = useState('');

  const fetchQueue = async (status = filterStatus) => {
    try {
      setLoadingProjects(true);
      const res = await auditorService.getProjects(status);
      if (res.success) {
        setPendingProjects(res.data);
        if (res.data.length > 0) {
          handleSelectProject(res.data[0]);
        } else {
          setSelectedProject(null);
          setAnalysisData(null);
        }
      } else {
        setError('Failed to fetch project verification queue.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to registry database.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await authService.getPendingUsers();
      if (res.success) {
        setPendingUsers(res.data);
      } else {
        setError('Failed to retrieve pending registrations.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not reach auth server.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'projects') {
      fetchQueue(filterStatus);
    } else {
      fetchUsers();
    }
    setError('');
    setSuccess('');
  }, [activeTab, filterStatus]);

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    setRemarks('');
    setError('');
    setSuccess('');
    setAnalysisData(null);

    // Fetch GIS overlaps and AI audit report metrics
    try {
      setLoadingAnalysis(true);
      const res = await auditorService.getAnalysis(project.id);
      if (res.success) {
        setAnalysisData(res.data);
        setCreditsIssued(res.data.carbon_estimation.credits_estimate.toString());
        setPlantationAge(res.data.carbon_estimation.plantation_age);
        setCalculatedCredits({
          yearly: res.data.carbon_estimation.yearly_sequestration,
          cumulative: res.data.carbon_estimation.cumulative_sequestration
        });
      }
    } catch (err) {
      console.error('Failed to load project analysis:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Recalculate carbon dynamically when age changes on client
  const handleRecalculateCarbon = (newAge) => {
    if (!analysisData || !selectedProject) return;
    const ageVal = Math.max(1, parseInt(newAge) || 1);
    setPlantationAge(ageVal);

    const rate = analysisData.carbon_estimation.species_rate;
    let factor = 1.0;
    if (ageVal <= 1) factor = 0.2;
    else if (ageVal <= 3) factor = 0.5;
    else if (ageVal > 10) factor = 0.85;

    const area = parseFloat(selectedProject.area_hectares);
    const yearly = area * rate * factor;
    const cumulative = yearly * ageVal;

    setCalculatedCredits({
      yearly: parseFloat(yearly.toFixed(2)),
      cumulative: parseFloat(cumulative.toFixed(2))
    });
    setCreditsIssued(yearly.toFixed(1));
  };

  // Start Audit Review status transition
  const handleStartReview = async () => {
    if (!selectedProject) return;
    try {
      const res = await auditorService.updateStatus(selectedProject.id, 'under_review');
      if (res.success) {
        setSuccess('Project status successfully updated to Under Review.');
        // Refresh project local state
        setSelectedProject(prev => ({ ...prev, status: 'under_review' }));
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      setError('Could not update audit review status.');
    }
  };

  // Request More Evidence status transition
  const handleRequestEvidence = async () => {
    if (!selectedProject) return;
    if (!remarks.trim()) {
      setError('Please add Remarks explaining what evidence is missing.');
      return;
    }
    setError('');
    setSubmittingVerification(true);
    try {
      // Transition back to under_review/pending and save remarks to verifications table
      const res = await auditorService.verifyProject(selectedProject.id, {
        status: 'rejected', // Logs as negative outcome to prompt NGO response
        remarks: `[MORE EVIDENCE REQUESTED]: ${remarks}`,
        credits_issued: 0
      });
      // Move status to under_review so they can edit it
      await auditorService.updateStatus(selectedProject.id, 'under_review');
      
      setSubmittingVerification(false);
      if (res.success) {
        setSuccess('Evidence request submitted successfully. Submitter notified.');
        setTimeout(() => {
          fetchQueue();
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      setError('Evidence request submission failed.');
      setSubmittingVerification(false);
    }
  };

  const handleVerify = async (status) => {
    if (!selectedProject) return;
    
    setError('');
    setSuccess('');
    setSubmittingVerification(true);

    try {
      const payload = {
        status, // 'approved' or 'rejected'
        remarks,
        credits_issued: status === 'approved' ? parseFloat(creditsIssued) : 0
      };

      const res = await auditorService.verifyProject(selectedProject.id, payload);
      setSubmittingVerification(false);

      if (res.success) {
        setSuccess(`Project successfully ${status === 'approved' ? 'approved & credits issued' : 'rejected'}.`);
        setTimeout(() => {
          fetchQueue();
          setSuccess('');
        }, 1500);
      } else {
        setError(res.error || 'Failed to submit verification action.');
      }
    } catch (err) {
      console.error(err);
      setError('Verification submission node error.');
      setSubmittingVerification(false);
    }
  };

  const handleApproveNode = async (userId) => {
    setError('');
    setSuccess('');
    setApprovingNodeId(userId);

    try {
      const res = await authService.approveUser(userId);
      setApprovingNodeId(null);
      
      if (res.success) {
        setSuccess('Node registration approved successfully! Access granted.');
        setTimeout(() => {
          fetchUsers();
          setSuccess('');
        }, 1500);
      } else {
        setError(res.error || 'Failed to approve node.');
      }
    } catch (err) {
      console.error(err);
      setError('Node approval request failed.');
      setApprovingNodeId(null);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedProject) return;
    try {
      setGeneratingReport(true);
      setShowReportModal(true);
      const res = await auditorService.generateReport(selectedProject.id);
      if (res.success) {
        setReportMarkdown(res.report);
      } else {
        setError('Could not generate AI report.');
      }
    } catch (err) {
      setError('Report generator service unavailable.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handlePrintPDF = () => {
    const printContent = document.getElementById('ai-report-print-area').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>BlueCarbon Registry - Audit Report ${selectedProject.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
            h1 { font-family: 'Outfit', sans-serif; font-size: 22px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
            h2 { font-size: 15px; color: #0284c7; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
            hr { border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0; }
            ul { padding-left: 20px; margin: 8px 0; }
            li { margin-bottom: 6px; font-size: 13px; }
            p { font-size: 13px; margin: 8px 0; }
            strong { color: #0f172a; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Setup overlays formatting
  const mapOverlayData = selectedProject ? {
    ...selectedProject,
    communityOverlay: analysisData?.community_overlay
  } : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-brand-400" />
          MRV Verification Workstation
        </h1>
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">
          Verify GIS boundaries, review sensor uploader logs, compute carbon yields and issue audit logs
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-brand-500/10">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-5 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all duration-150 ${
            activeTab === 'projects'
              ? 'border-brand-400 text-brand-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Project Audits Queue
        </button>
        <button
          onClick={() => setActiveTab('nodes')}
          className={`px-5 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all duration-150 ${
            activeTab === 'nodes'
              ? 'border-brand-400 text-brand-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Node Approvals ({pendingUsers.length})
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold animate-fadeIn">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold animate-fadeIn">
          {success}
        </div>
      )}

      {/* Projects Queue Tab Content */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Queue List & Status Filters */}
          <div className="flex flex-col gap-4">
            {/* Status Queue Filter Pills */}
            <div className="bg-darkbg-200/40 p-1.5 rounded-xl border border-brand-500/5 flex gap-1">
              {[
                { key: 'pending', label: 'Pending' },
                { key: 'under_review', label: 'Reviewing' },
                { key: 'verified', label: 'Verified' },
                { key: 'rejected', label: 'Rejected' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setFilterStatus(tab.key);
                    setSelectedProject(null);
                    setAnalysisData(null);
                  }}
                  className={`flex-1 text-[10px] uppercase font-bold py-2 rounded-lg transition-all duration-150
                    ${filterStatus === tab.key 
                      ? 'bg-brand-400 text-darkbg-300 shadow' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/10'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Selected Queue Submissions ({pendingProjects.length})
            </span>

            {loadingProjects ? (
              <div className="flex flex-col items-center justify-center py-20 bg-darkbg-200/10 rounded-2xl border border-dashed border-brand-500/5">
                <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
              </div>
            ) : pendingProjects.length === 0 ? (
              <div className="p-8 text-center bg-darkbg-200/25 border border-dashed border-brand-500/10 rounded-2xl text-xs text-slate-500">
                No projects found in this queue.
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
                {pendingProjects.map((p) => {
                  const isSelected = selectedProject && selectedProject.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProject(p)}
                      className={`
                        p-4 rounded-2xl border text-left transition-all duration-200
                        ${isSelected 
                          ? 'bg-brand-900/25 border-brand-400/60 shadow-[0_0_12px_rgba(92,193,203,0.08)]' 
                          : 'bg-[#0c2227]/25 border-brand-500/5 hover:border-brand-500/15'
                        }
                      `}
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-bold text-slate-100 truncate">{p.title}</span>
                        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                          <span>{p.area_hectares} Hectares</span>
                          <span className="font-semibold text-brand-400 capitalize">{p.restoration_type || 'Mangrove'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 border-t border-brand-500/5 pt-2">
                          <span className="truncate max-w-[70%]">NGO: {p.user?.name || 'NGO Node'}</span>
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Columns: Auditing Dashboard Workspace */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {!selectedProject ? (
              <Card hoverable={false} className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
                <CheckCircle className="w-16 h-16 text-brand-400/30 mb-4" />
                <h3 className="text-lg font-bold text-slate-300">Select a project</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm">
                  Select a restoration node from the left queue sidebar to inspect boundaries, uploader sensors, and evaluate AI fraud warnings.
                </p>
              </Card>
            ) : (
              <>
                {/* 1. Main Project Overview */}
                <Card 
                  title="Auditing Node Characteristics" 
                  subtitle={`Registry ID: ${selectedProject.id}`}
                  hoverable={false}
                  headerAction={
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border
                        ${selectedProject.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          selectedProject.status === 'under_review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          selectedProject.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
                      >
                        {selectedProject.status.replace('_', ' ')}
                      </span>
                      {selectedProject.status === 'pending' && (
                        <button
                          onClick={handleStartReview}
                          className="bg-brand-400 hover:bg-brand-300 text-darkbg-300 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 rounded-lg transition-colors border border-brand-400/10"
                        >
                          Start Review
                        </button>
                      )}
                    </div>
                  }
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-xl font-bold text-white tracking-wide">{selectedProject.title}</h2>
                      <span className="text-xs text-slate-400">
                        Submitted by: <strong>{selectedProject.user?.name}</strong> ({selectedProject.user?.email})
                      </span>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#070c0e]/50 border border-brand-500/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Area Size</span>
                        <span className="text-sm font-bold text-slate-200 mt-0.5">{selectedProject.area_hectares} Hectares</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Centroid Coords</span>
                        <span className="text-xs font-mono text-brand-400 mt-0.5">{parseFloat(selectedProject.latitude).toFixed(4)}, {parseFloat(selectedProject.longitude).toFixed(4)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Planted Species</span>
                        <span className="text-xs font-bold text-slate-200 mt-0.5 truncate">{selectedProject.species}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Plantation Date</span>
                        <span className="text-sm font-bold text-slate-200 mt-0.5">
                          {selectedProject.plantation_date ? new Date(selectedProject.plantation_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">NGO Description</span>
                      <p className="text-xs text-slate-350 bg-[#070c0e]/30 p-3 rounded-lg border border-brand-500/5">
                        {selectedProject.description || 'No description supplied.'}
                      </p>
                    </div>

                    {/* Imagesevidence */}
                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">Evidence Logs Submitted</span>
                      {selectedProject.images && selectedProject.images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {selectedProject.images.map((img) => (
                            <a href={img.image_url} target="_blank" rel="noreferrer" key={img.id} className="group relative rounded-xl overflow-hidden border border-brand-500/10 h-24 bg-[#070c0e] hover:border-brand-400 transition-colors">
                              <img src={img.image_url} alt="auditing-evidence" className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-200" />
                              <span className="absolute bottom-1 left-1 bg-[#0c2227]/90 text-[8px] font-bold text-brand-300 uppercase tracking-widest px-2 py-0.5 rounded border border-brand-400/5">
                                {img.image_type}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[11px] text-amber-400">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <p>No evidence logs supplied. Audits are subject to physical coordinate inspections.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* 2. Interactive Map with Community Overlays & Legend */}
                <div className="flex flex-col gap-2 bg-darkbg-200/50 p-4 rounded-2xl border border-brand-500/5 relative">
                  <div className="flex justify-between items-center px-1 mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">GIS Map Boundaries & Overlays</span>
                    
                    {/* Map Legend */}
                    <div className="flex gap-3 text-[9px] font-semibold uppercase tracking-wider text-slate-400 bg-darkbg-300/80 px-3 py-1 rounded-lg border border-brand-500/5">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-brand-400 inline-block"></span> Project</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block"></span> Site Suggestion</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] inline-block"></span> Log</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] inline-block"></span> Complaint</span>
                    </div>
                  </div>

                  {loadingAnalysis ? (
                    <div className="flex items-center justify-center h-[280px] bg-[#070c0e]/30 rounded-xl border border-brand-500/5">
                      <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                    </div>
                  ) : (
                    <MapView 
                      projects={mapOverlayData ? [mapOverlayData] : []} 
                      center={[parseFloat(selectedProject.latitude), parseFloat(selectedProject.longitude)]} 
                      zoom={9}
                      height="280px" 
                    />
                  )}
                </div>

                {/* 3. AI Verification Score Card & Fraud Warnings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* AI Agent analysis */}
                  <Card title="AI Verification Summary" subtitle="Evaluated by registry bot" hoverable={false} className="border-l-4 border-l-brand-400">
                    {loadingAnalysis ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                      </div>
                    ) : analysisData?.ai_report ? (
                      <div className="flex flex-col gap-4">
                        
                        {/* Score and Risk Indicator */}
                        <div className="flex justify-between items-center p-3 rounded-xl bg-brand-900/10 border border-brand-500/5">
                          <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-brand-400/20 bg-brand-900/20 text-brand-300 font-extrabold text-sm shadow-[0_0_12px_rgba(92,193,203,0.1)]">
                              {analysisData.ai_report.verification_score}%
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">Verification Score</span>
                              <span className="text-xs font-bold text-slate-200">Algorithmic Confidence</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Risk Level</span>
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border mt-0.5
                              ${analysisData.ai_report.risk_level === 'high' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' :
                                analysisData.ai_report.risk_level === 'medium' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                                'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'}`}
                            >
                              {analysisData.ai_report.risk_level}
                            </span>
                          </div>
                        </div>

                        {/* Warnings checklist */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Issues checklist</span>
                          {analysisData.spatial_analysis.issues.length === 0 ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                              <Check className="w-4 h-4" /> All checks passed. Coordinates are secure.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              {analysisData.spatial_analysis.issues.map((issue, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-xs text-rose-400 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <span>{issue}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recommendation */}
                        <div className="text-xs text-slate-350 bg-darkbg-200/50 p-3 rounded-xl border border-brand-500/5 leading-relaxed">
                          <strong className="text-brand-400">AI Recommendation: </strong> 
                          {analysisData.ai_report.recommendation}
                        </div>

                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No AI evaluation computed.</span>
                    )}
                  </Card>

                  {/* Fraud Scan warnings */}
                  <Card title="GIS Fraud Scans" subtitle="Spatial duplication alerts" hoverable={false} className="border-l-4 border-l-rose-500/80">
                    {loadingAnalysis ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                      </div>
                    ) : analysisData ? (
                      <div className="flex flex-col gap-4">
                        
                        {/* Centroid Coordinates warning */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Centroid duplicate scans</span>
                          {analysisData.spatial_analysis.duplicate_warnings.length === 0 ? (
                            <span className="text-xs text-emerald-400 font-medium">✓ No coordinate centroid duplicates found.</span>
                          ) : (
                            analysisData.spatial_analysis.duplicate_warnings.map((d, i) => (
                              <div key={i} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                                  <AlertTriangle className="w-4 h-4" /> Potential Centroid Duplicate
                                </div>
                                <span className="text-xs text-slate-300">Coincides with project: <strong>{d.title}</strong></span>
                                <span className="text-[10px] text-slate-400">Distance: {d.distance_meters}m • Status: <strong className="uppercase">{d.status}</strong></span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Bounding box overlap warning */}
                        <div className="flex flex-col gap-2 mt-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Boundary Box Overlap Scans</span>
                          {analysisData.spatial_analysis.boundary_overlap_warnings.length === 0 ? (
                            <span className="text-xs text-emerald-400 font-medium">✓ No boundary box overlaps detected.</span>
                          ) : (
                            analysisData.spatial_analysis.boundary_overlap_warnings.map((overlap, i) => (
                              <div key={i} className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col text-xs text-slate-200">
                                <span className="font-semibold text-amber-400">Boundary Box Overlaps:</span>
                                <span>Project: <strong>{overlap.title}</strong> ({overlap.status})</span>
                              </div>
                            ))
                          )}
                        </div>

                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No GIS duplicate calculations available.</span>
                    )}
                  </Card>
                </div>

                {/* 4. Carbon Estimator Calculations panel */}
                <Card title="Carbon Accumulation & Credits Estimation" subtitle="Formulas calculated according to Hectares, Species biomass yields and Plantation age." hoverable={false}>
                  {loadingAnalysis ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-6 h-6 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                    </div>
                  ) : analysisData?.carbon_estimation ? (
                    <div className="flex flex-col gap-5">
                      
                      {/* Interactive Age selector slider */}
                      <div className="flex flex-col gap-2 p-4 rounded-xl bg-darkbg-200/50 border border-brand-500/5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-300 uppercase">Plantation Growth Age: {plantationAge} Years</label>
                          <span className="text-[10px] text-slate-500">Slide to test age yields</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="25" 
                          value={plantationAge} 
                          onChange={(e) => handleRecalculateCarbon(e.target.value)}
                          className="w-full h-1.5 rounded-lg bg-slate-800 accent-brand-400 cursor-pointer"
                        />
                      </div>

                      {/* Math Estimates Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col p-4 bg-[#070c0e]/50 border border-brand-500/5 rounded-xl justify-between">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Yearly Carbon Capture</span>
                          <span className="text-2xl font-extrabold text-white mt-1">{calculatedCredits.yearly.toFixed(1)} <span className="text-xs font-semibold text-slate-400">tCO2e/yr</span></span>
                          <p className="text-[9px] text-brand-400 mt-2">Current growth yield rate</p>
                        </div>
                        
                        <div className="flex flex-col p-4 bg-[#070c0e]/50 border border-brand-500/5 rounded-xl justify-between">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Estimated Cumulative Carbon</span>
                          <span className="text-2xl font-extrabold text-white mt-1">{calculatedCredits.cumulative.toFixed(1)} <span className="text-xs font-semibold text-slate-400">tCO2e</span></span>
                          <p className="text-[9px] text-slate-450 mt-2">Biomass storage accumulated</p>
                        </div>

                        <div className="flex flex-col p-4 bg-brand-900/10 border border-brand-400/20 rounded-xl justify-between">
                          <span className="text-[10px] text-brand-300 uppercase font-bold">Algorithmic Confidence</span>
                          <span className="text-2xl font-extrabold text-brand-400 mt-1">{analysisData.carbon_estimation.confidence_score}%</span>
                          <p className="text-[9px] text-slate-400 mt-2">Uploader evidence weight score</p>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 leading-relaxed bg-[#070c0e]/30 p-3 rounded-lg border border-brand-500/5 flex flex-col gap-1">
                        <span className="font-bold text-slate-300">Biomass Sequestration Formula Breakdown:</span>
                        <span>Sequestration Rate = {analysisData.carbon_estimation.species_rate} tCO2e/ha/yr (Species: {selectedProject.species || 'Mangrove'})</span>
                        <span>Age Factor Multiplier = {plantationAge <= 1 ? '0.2' : plantationAge <= 3 ? '0.5' : plantationAge > 10 ? '0.85' : '1.0'} (Growth age: {plantationAge} years)</span>
                        <span>Yearly Capture Yield = {selectedProject.area_hectares} Ha * {analysisData.carbon_estimation.species_rate} tCO2e/ha/yr * AgeFactor = {calculatedCredits.yearly.toFixed(2)} tCO2e/year.</span>
                      </div>

                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Estimates unavailable.</span>
                  )}
                </Card>

                {/* 5. Auditor Evaluation Remarks & Verification actions */}
                <Card title="Auditing Decisions Log" subtitle="Log audit notes and verify project to trigger carbon token minting." hoverable={false}>
                  <div className="flex flex-col gap-4">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        id="creditsIssued"
                        type="number"
                        step="0.1"
                        label="Carbon Credits to Mint (tCO2e)"
                        placeholder="e.g. 187.5"
                        value={creditsIssued}
                        onChange={(e) => setCreditsIssued(e.target.value)}
                        required
                      />

                      <div className="flex items-center gap-2 p-3 bg-brand-900/10 border border-brand-500/5 rounded-xl text-[10px] text-slate-400 mt-4">
                        <HelpCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                        <p>Verify this matches your physical verification maps. You can adjust the tokens amount based on GIS checks.</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                        Verification Remarks / Audit Notes
                      </label>
                      <textarea
                        className="w-full rounded-xl py-2.5 px-4 text-sm text-slate-200 bg-[#070c0e]/85 border border-brand-500/10 focus:border-brand-400 outline-none min-h-[90px] resize-none"
                        placeholder="Enter auditing notes, satellite vegetation indices, or physical verification survey logs..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 justify-between items-center mt-3 border-t border-slate-800/40 pt-4">
                      
                      {/* PDF Generator Trigger */}
                      <button
                        type="button"
                        onClick={handleGenerateReport}
                        className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-bold border border-brand-500/10 bg-brand-500/5 px-4.5 py-2.5 rounded-xl hover:border-brand-400/20 active:scale-[0.98] transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        Generate Audit Report
                      </button>

                      <div className="flex gap-2">
                        {/* Request Evidence button */}
                        <button
                          type="button"
                          onClick={handleRequestEvidence}
                          disabled={submittingVerification}
                          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/20 bg-amber-500/5 px-4.5 py-2.5 rounded-xl hover:bg-amber-500/10 hover:border-amber-500/30 active:scale-[0.98] transition-all"
                        >
                          Request Evidence
                        </button>

                        <button
                          onClick={() => handleVerify('rejected')}
                          disabled={submittingVerification}
                          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-350 border border-rose-500/20 bg-rose-500/5 px-4.5 py-2.5 rounded-xl hover:bg-rose-500/10 hover:border-rose-500/30 active:scale-[0.98] transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Project
                        </button>
                        
                        <Button
                          onClick={() => handleVerify('approved')}
                          loading={submittingVerification}
                          className="flex items-center gap-1.5 text-xs py-2.5 px-5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Verify & Issue Credits
                        </Button>
                      </div>
                    </div>

                  </div>
                </Card>
              </>
            )}
          </div>

        </div>
      )}

      {/* Node Approvals Tab Content */}
      {activeTab === 'nodes' && (
        <>
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <div className="w-10 h-10 rounded-full border-4 border-brand-500/10 border-t-brand-400 animate-spin"></div>
              <p className="mt-4 text-brand-400 text-xs tracking-widest uppercase animate-pulse">Syncing node registrations...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <Card hoverable={false} className="flex flex-col items-center justify-center p-12 text-center max-w-xl mx-auto mt-6">
              <UserCheck className="w-16 h-16 text-emerald-400 mb-4 animate-float" />
              <h3 className="text-lg font-bold text-slate-100">All Nodes Cleared</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                There are no pending NGO or Community node registrations awaiting credential authorization.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Awaiting Authorization Key ({pendingUsers.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map((user) => (
                  <Card 
                    key={user.id} 
                    title={user.organization_name || 'Individual Community Member'} 
                    subtitle={`Node ID: ${user.id}`}
                    hoverable={false}
                    headerAction={
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {user.role} profile
                      </span>
                    }
                  >
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-brand-400" />
                          <span>Rep: <strong>{user.name}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-brand-400" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-brand-400" />
                          <span>{user.contact_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-brand-400" />
                          <span>Loc: {user.location || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-brand-500/10 pt-4 flex justify-between items-center mt-2">
                        <span className="text-[10px] text-slate-500">Registered: {new Date(user.created_at).toLocaleDateString()}</span>
                        <Button
                          onClick={() => handleApproveNode(user.id)}
                          loading={approvingNodeId === user.id}
                          className="flex items-center gap-1.5 text-xs py-1.5 px-4"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Approve Node Key
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* AI Report Generation Drawer / Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-darkbg-300/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1f24] border border-brand-500/15 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-brand-500/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" />
                <span className="font-extrabold text-white text-base uppercase tracking-wider">AI Generated Audit Report</span>
              </div>
              <button 
                onClick={() => {
                  setShowReportModal(false);
                  setReportMarkdown('');
                }}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold bg-[#070c0e] px-3 py-1 rounded-lg border border-brand-500/5 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-300 leading-relaxed font-mono">
              {generatingReport ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                  <span className="text-brand-400 uppercase tracking-widest text-[9px] animate-pulse">Running GIS and sensor analysis models...</span>
                </div>
              ) : (
                <div id="ai-report-print-area" className="whitespace-pre-line bg-[#070c0e]/60 p-4 rounded-xl border border-brand-500/5 select-text">
                  {reportMarkdown}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!generatingReport && (
              <div className="p-4 border-t border-brand-500/10 bg-[#070c0e]/40 flex justify-end gap-3">
                <button
                  onClick={handlePrintPDF}
                  className="flex items-center gap-1.5 text-xs text-darkbg-300 bg-brand-400 font-bold px-5 py-2.5 rounded-xl hover:bg-brand-300 active:scale-[0.98] transition-all shadow-lg shadow-brand-400/10"
                >
                  <Download className="w-4 h-4" />
                  Export to PDF
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
