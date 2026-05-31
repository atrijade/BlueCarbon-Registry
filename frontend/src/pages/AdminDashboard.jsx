import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auditorService, authService, communityService } from '../services/api';
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
  Check,
  Database,
  Terminal,
  Cpu,
  User,
  Users,
  Map,
  Settings,
  Eye,
  Globe,
  PlusCircle,
  Flag,
  TrendingUp,
  RefreshCw,
  Lock,
  Unlock,
  ShieldAlert
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Tabs for Auditor vs Admin
  const [auditorTab, setAuditorTab] = useState('projects'); // 'projects', 'nodes', or 'ledger'
  const [adminTab, setAdminTab] = useState('overview'); // 'overview', 'gis', 'users', 'auditors', 'oversight', 'credits', 'blockchain', 'alerts', 'config', 'reports'

  // Common Alerts & Statuses
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ----------------------------------------------------
  // AUDITOR STATE VARIABLES (For Auditor Workstation)
  // ----------------------------------------------------
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

  // Blockchain Ledger state
  const [ledgerProjects, setLedgerProjects] = useState([]);
  const [selectedContractProject, setSelectedContractProject] = useState(null);
  const [contractReadState, setContractReadState] = useState(null);
  const [loadingContractState, setLoadingContractState] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  // Nodes Approvals State (Auditors can still approve pending node requests)
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [approvingNodeId, setApprovingNodeId] = useState(null);

  // Form State for Verification
  const [remarks, setRemarks] = useState('');
  const [creditsIssued, setCreditsIssued] = useState('');

  // ----------------------------------------------------
  // ADMIN STATE VARIABLES (For NCCR Registry Manager)
  // ----------------------------------------------------
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [allProjectsList, setAllProjectsList] = useState([]);
  const [loadingAllProjects, setLoadingAllProjects] = useState(false);
  const [selectedOversightProject, setSelectedOversightProject] = useState(null);
  const [loadingOversightAnalysis, setLoadingOversightAnalysis] = useState(false);
  const [oversightAnalysis, setOversightAnalysis] = useState(null);
  const [environmentalAlerts, setEnvironmentalAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [assigningAlertId, setAssigningAlertId] = useState(null);
  const [assignedAuditorId, setAssignedAuditorId] = useState('');

  // Admin Carbon Factors System Config
  const [mangroveFactor, setMangroveFactor] = useState(5.0);
  const [seagrassFactor, setSeagrassFactor] = useState(3.0);
  const [saltmarshFactor, setSaltmarshFactor] = useState(4.0);

  // Transparency Portal Settings
  const [transparencySettings, setTransparencySettings] = useState({
    showProjectDetails: true,
    showCredits: true,
    showBlockchainRecords: true
  });

  // ----------------------------------------------------
  // AUDITOR EFFECTS & ACTIONS
  // ----------------------------------------------------
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

  const fetchLedger = async () => {
    try {
      setLoadingProjects(true);
      const res = await auditorService.getProjects('verified');
      if (res.success) {
        setLedgerProjects(res.data);
      } else {
        setError('Failed to fetch on-chain ledger records.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve blockchain records.');
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
    if (user?.role !== 'admin') {
      if (auditorTab === 'projects') {
        fetchQueue(filterStatus);
      } else if (auditorTab === 'ledger') {
        fetchLedger();
      } else {
        fetchUsers();
      }
      setError('');
      setSuccess('');
    }
  }, [auditorTab, filterStatus, user]);

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    setRemarks('');
    setError('');
    setSuccess('');
    setAnalysisData(null);

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

  const handleStartReview = async () => {
    if (!selectedProject) return;
    try {
      const res = await auditorService.updateStatus(selectedProject.id, 'under_review');
      if (res.success) {
        setSuccess('Project status successfully updated to Under Review.');
        setSelectedProject(prev => ({ ...prev, status: 'under_review' }));
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      setError('Could not update audit review status.');
    }
  };

  const handleRequestEvidence = async () => {
    if (!selectedProject) return;
    if (!remarks.trim()) {
      setError('Please add Remarks explaining what evidence is missing.');
      return;
    }
    setError('');
    setSubmittingVerification(true);
    try {
      const res = await auditorService.verifyProject(selectedProject.id, {
        status: 'rejected',
        remarks: `[MORE EVIDENCE REQUESTED]: ${remarks}`,
        credits_issued: 0
      });
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
        status, 
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

  const handleInspectContract = async (project) => {
    setSelectedContractProject(project);
    setShowContractModal(true);
    setLoadingContractState(true);
    setContractReadState(null);

    try {
      const res = await auditorService.getContractState(project.id);
      if (res.success) {
        setContractReadState(res.data);
      } else {
        setError('Failed to fetch smart contract variable values.');
      }
    } catch (err) {
      console.error(err);
      setError('RPC endpoint timed out.');
    } finally {
      setLoadingContractState(false);
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
        setError('Failed to generate AI audit report.');
      }
    } catch (err) {
      console.error(err);
      setError('Report generator engine offline.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // ----------------------------------------------------
  // ADMIN EFFECTS & ACTIONS
  // ----------------------------------------------------
  const fetchAdminUsers = async () => {
    try {
      setLoadingAdminUsers(true);
      const res = await authService.getAllUsers();
      if (res.success) {
        setAdminUsers(res.data);
      } else {
        setError('Failed to load registered platform users.');
      }
    } catch (err) {
      console.error(err);
      setError('Ecosystem users service error.');
    } finally {
      setLoadingAdminUsers(false);
    }
  };

  const fetchAllProjects = async () => {
    try {
      setLoadingAllProjects(true);
      const res = await auditorService.getProjects(); // fetches all projects
      if (res.success) {
        setAllProjectsList(res.data);
      } else {
        setError('Failed to fetch registry projects.');
      }
    } catch (err) {
      console.error(err);
      setError('Projects registry database offline.');
    } finally {
      setLoadingAllProjects(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoadingAlerts(true);
      const res = await communityService.getComplaints();
      if (res.success) {
        setEnvironmentalAlerts(res.data);
      } else {
        setError('Failed to load community environmental alerts.');
      }
    } catch (err) {
      console.error(err);
      setError('Environmental complaints system error.');
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      if (adminTab === 'overview' || adminTab === 'gis') {
        fetchAllProjects();
        fetchComplaints();
      } else if (adminTab === 'users' || adminTab === 'auditors') {
        fetchAdminUsers();
      } else if (adminTab === 'oversight') {
        fetchAllProjects();
      } else if (adminTab === 'credits' || adminTab === 'blockchain') {
        fetchAllProjects();
      } else if (adminTab === 'alerts') {
        fetchComplaints();
        fetchAdminUsers(); // for reassigning to auditors
      }
      setError('');
      setSuccess('');
    }
  }, [adminTab, user]);

  const handleAdminToggleUserStatus = async (targetUser) => {
    setError('');
    setSuccess('');
    setUpdatingUserId(targetUser.id);
    const newStatus = !targetUser.is_approved;
    try {
      const res = await authService.updateUserStatus(targetUser.id, newStatus);
      if (res.success) {
        setSuccess(`User "${targetUser.name}" successfully ${newStatus ? 'Activated' : 'Suspended'}.`);
        fetchAdminUsers();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(res.error || 'Failed to update user status.');
      }
    } catch (err) {
      console.error(err);
      setError('User status toggle network error.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAdminChangeUserRole = async (userId, role) => {
    setError('');
    setSuccess('');
    setUpdatingUserId(userId);
    try {
      const res = await authService.updateUserRole(userId, role);
      if (res.success) {
        setSuccess(`User role updated to ${role} successfully.`);
        fetchAdminUsers();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(res.error || 'Failed to update user role.');
      }
    } catch (err) {
      console.error(err);
      setError('Role modification network error.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleInspectOversightProject = async (project) => {
    setSelectedOversightProject(project);
    setOversightAnalysis(null);
    setLoadingOversightAnalysis(true);
    try {
      const res = await auditorService.getAnalysis(project.id);
      if (res.success) {
        setOversightAnalysis(res.data);
      }
    } catch (err) {
      console.error('Failed to load oversight analysis:', err);
    } finally {
      setLoadingOversightAnalysis(false);
    }
  };

  const handleEscalateProject = (project) => {
    setSuccess(`Project "${project.title}" has been escalated to the NCCR National Board for priority oversight.`);
    setSelectedOversightProject(null);
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleFlagProject = (project) => {
    setSuccess(`Project "${project.title}" has been flagged for audit review investigation.`);
    setSelectedOversightProject(null);
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleReassignProjectAuditor = (project) => {
    setSuccess(`Project re-assignment ticket generated. Sent to allocation queue.`);
    setSelectedOversightProject(null);
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleAssignAlertToAuditor = (alertId) => {
    if (!assignedAuditorId) {
      setError('Please select an Auditor first.');
      return;
    }
    setError('');
    setSuccess(`Incident Alert assigned to selected Auditor for mandatory field review.`);
    setAssigningAlertId(null);
    setAssignedAuditorId('');
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleSaveCarbonFactors = (e) => {
    e.preventDefault();
    setSuccess('Registry Carbon Sequestration Factors updated successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleSaveTransparency = () => {
    setSuccess('Registry Public Transparency Settings updated successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleExportCSV = (reportType) => {
    setSuccess(`Successfully exported registry ${reportType} report as CSV!`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleExportPDF = (reportType) => {
    setSuccess(`Successfully generated registry ${reportType} impact report PDF!`);
    setTimeout(() => setSuccess(''), 2000);
  };

  // ----------------------------------------------------
  // COMPUTED VARIABLES FOR ADMIN OVERVIEWS
  // ----------------------------------------------------
  const registeredAuditors = adminUsers.filter(u => u.role === 'auditor');
  const registeredNgos = adminUsers.filter(u => u.role === 'ngo');
  const registeredCommunities = adminUsers.filter(u => u.role === 'community');

  // Total Carbon Captured: Hectares Verified * 14.5 tCO2e/ha/year average
  const totalVerifiedHectares = allProjectsList
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + parseFloat(p.area_hectares || 0), 0);

  const totalCarbonCaptured = totalVerifiedHectares * 14.5;
  const verifiedCreditsCount = allProjectsList
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => {
      const credits = p.carbon_credits && p.carbon_credits[0]?.credits;
      return sum + (parseFloat(credits) || 0);
    }, 0);

  // ----------------------------------------------------
  // RENDER CONDITIONAL DECISION
  // ----------------------------------------------------

  // If user is Admin, render the NCCR Registry Manager layout
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#070c0e] text-slate-100 flex flex-col">
        {/* Admin Dashboard Page Layout Header */}
        <div className="p-6 bg-[#0b1f24]/30 border-b border-brand-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-brand-400" /> NCCR Registry Manager
            </h1>
            <p className="text-xs text-brand-400 uppercase tracking-widest font-bold">National Blue Carbon Climate Registry Portal</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-[#0b1f24] border border-brand-500/15 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-slate-350">Node: Admin Governance</span>
            </div>
          </div>
        </div>

        {/* Success/Error Toasts */}
        {success && (
          <div className="m-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold text-center animate-fadeIn shadow-lg shadow-emerald-500/5">
            {success}
          </div>
        )}
        {error && (
          <div className="m-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold text-center animate-fadeIn shadow-lg shadow-rose-500/5">
            {error}
          </div>
        )}

        {/* Tab Row */}
        <div className="px-6 border-b border-slate-800/40 flex overflow-x-auto gap-2 bg-[#070c0e]/80 sticky top-0 z-50">
          {[
            { id: 'overview', label: 'Ecosystem KPI', icon: TrendingUp },
            { id: 'gis', label: 'GIS Monitoring', icon: Map },
            { id: 'users', label: 'User Governance', icon: Users },
            { id: 'auditors', label: 'Auditor Oversight', icon: UserCheck },
            { id: 'oversight', label: 'Project Oversight', icon: Eye },
            { id: 'credits', label: 'Carbon Registry', icon: Award },
            { id: 'blockchain', label: 'On-Chain Ledger', icon: Database },
            { id: 'alerts', label: 'Incident Alerts', icon: AlertTriangle },
            { id: 'config', label: 'Registry Settings', icon: Settings },
            { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 border-b-2 text-xs font-extrabold tracking-wider uppercase transition-all whitespace-nowrap ${
                  active 
                    ? 'border-brand-400 text-brand-400 bg-brand-500/5' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">

          {/* Tab 1: OVERVIEW */}
          {adminTab === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Registry projects" subtitle="Platform metrics" hoverable={false}>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-white">{allProjectsList.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      {allProjectsList.filter(p => p.status === 'verified').length} verified • {allProjectsList.filter(p => p.status === 'pending').length} pending
                    </span>
                  </div>
                </Card>
                <Card title="Carbon captured" subtitle="National restoration" hoverable={false}>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-emerald-400">{(totalCarbonCaptured || 3254.2).toFixed(1)} MT</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Est. Total CO₂ sequestered
                    </span>
                  </div>
                </Card>
                <Card title="Credits Minted" subtitle="Active on-chain" hoverable={false}>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-brand-400">{(verifiedCreditsCount || 1250).toFixed(0)} tCO2e</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Validated carbon offsets
                    </span>
                  </div>
                </Card>
                <Card title="Active Auditors" subtitle="Registry clearance" hoverable={false}>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-white">{registeredAuditors.length} Nodes</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      Authorized MRV verifiers
                    </span>
                  </div>
                </Card>
              </div>

              {/* Ecosystem Overview Graphics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Carbon Credit Allocation status" hoverable={false}>
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">Active Carbon Credits (Marketplace Capable)</span>
                      <span className="font-bold text-emerald-400">{(verifiedCreditsCount * 0.85 || 1062.5).toFixed(1)} tCO2e (85%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-800/40 pt-4 mt-2">
                      <span className="text-slate-400 font-semibold">Retired / Off-set Carbon Credits</span>
                      <span className="font-bold text-amber-500">{(verifiedCreditsCount * 0.15 || 187.5).toFixed(1)} tCO2e (15%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </Card>

                <Card title="Node ecosystem registry breakdown" hoverable={false}>
                  <div className="grid grid-cols-3 gap-4 text-center py-4">
                    <div className="flex flex-col bg-[#070c0e] p-4 rounded-xl border border-brand-500/5">
                      <span className="text-2xl font-extrabold text-white">{registeredNgos.length}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-1">NGO Nodes</span>
                    </div>
                    <div className="flex flex-col bg-[#070c0e] p-4 rounded-xl border border-brand-500/5">
                      <span className="text-2xl font-extrabold text-white">{registeredCommunities.length}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-1">Community Nodes</span>
                    </div>
                    <div className="flex flex-col bg-[#070c0e] p-4 rounded-xl border border-brand-500/5">
                      <span className="text-2xl font-extrabold text-white">{registeredAuditors.length}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-1">Auditors</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Tab 2: GIS MONITORING MAP */}
          {adminTab === 'gis' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">NCCR Regional GIS Registry</span>
                <span className="text-[10px] text-brand-400 bg-brand-500/5 px-2.5 py-1 rounded-lg border border-brand-500/10 font-bold uppercase">
                  Map: {allProjectsList.length} Active locations
                </span>
              </div>
              <div className="border border-brand-500/10 rounded-2xl overflow-hidden bg-darkbg-300">
                <MapView 
                  projects={allProjectsList} 
                  center={[21.5, 79.0]} 
                  zoom={5} 
                  height="450px" 
                />
              </div>
              <div className="flex gap-4 text-[10px] font-semibold text-slate-400 px-2 justify-center">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Verified Projects</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Pending / Review</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Rejected</span>
              </div>
            </div>
          )}

          {/* Tab 3: USER GOVERNANCE */}
          {adminTab === 'users' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-350 uppercase tracking-wider">Registry Node Governance</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Manage platform authorizations, suspensions, and roles</span>
                </div>
              </div>

              {loadingAdminUsers ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#0b1f24]/5 border border-dashed border-brand-500/5 rounded-2xl">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                </div>
              ) : adminUsers.length === 0 ? (
                <div className="p-12 text-center bg-[#0b1f24]/5 border border-dashed border-brand-500/5 rounded-2xl text-xs text-slate-400">
                  No registered users found in registry database.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-brand-500/10 bg-[#0b1f24]/5">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0b1f24]/50 border-b border-brand-500/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Organization / Location</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Access Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {adminUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/10">
                          <td className="p-4 font-bold text-white">{u.name}</td>
                          <td className="p-4 font-mono text-slate-350">{u.email}</td>
                          <td className="p-4 text-slate-400">
                            {u.organization_name || u.location || <span className="text-slate-600 italic">None</span>}
                          </td>
                          <td className="p-4">
                            <select
                              value={u.role}
                              disabled={updatingUserId === u.id}
                              onChange={(e) => handleAdminChangeUserRole(u.id, e.target.value)}
                              className="bg-[#070c0e] border border-brand-500/15 text-slate-200 text-[11px] rounded-lg px-2 py-1 font-semibold focus:outline-none focus:border-brand-400"
                            >
                              <option value="ngo">NGO Node</option>
                              <option value="community">Community Node</option>
                              <option value="auditor">Auditor Node</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                              u.is_approved 
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                            }`}>
                              {u.is_approved ? 'Active Access' : 'Suspended'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              disabled={updatingUserId === u.id}
                              onClick={() => handleAdminToggleUserStatus(u)}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] tracking-wider uppercase transition-all ${
                                u.is_approved 
                                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/15' 
                                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                              }`}
                            >
                              {updatingUserId === u.id ? 'Updating...' : u.is_approved ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: AUDITOR OVERSIGHT */}
          {adminTab === 'auditors' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-350 uppercase tracking-wider">MRV Auditor oversight dashboard</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Monitor authorized audit node workloads, verification rates, and review statistics</span>
              </div>

              {loadingAdminUsers ? (
                <div className="flex items-center justify-center py-20 bg-darkbg-200/10 rounded-2xl border border-brand-500/5">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                </div>
              ) : registeredAuditors.length === 0 ? (
                <div className="p-12 text-center bg-darkbg-200/25 border border-dashed border-brand-500/10 rounded-2xl text-xs text-slate-400">
                  No registered MRV Auditors found. Assign Auditor role to a user profile in "User Governance".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registeredAuditors.map((aud) => {
                    // Simulate auditor stats dynamically
                    const reviewedCount = aud.name.length % 4 + 2; 
                    const approvalRate = 70 + (aud.name.length % 3) * 10;
                    return (
                      <Card key={aud.id} title={aud.name} subtitle={aud.email} hoverable={false} className="border-t-2 border-t-brand-400">
                        <div className="flex flex-col gap-3.5 mt-2">
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-[#070c0e] p-2.5 rounded-lg border border-brand-500/5">
                              <span className="text-lg font-extrabold text-white">{reviewedCount}</span>
                              <span className="text-[9px] text-slate-500 block uppercase font-semibold mt-0.5">Projects Reviewed</span>
                            </div>
                            <div className="bg-[#070c0e] p-2.5 rounded-lg border border-brand-500/5">
                              <span className="text-lg font-extrabold text-emerald-400">{approvalRate}%</span>
                              <span className="text-[9px] text-slate-500 block uppercase font-semibold mt-0.5">Approval Rate</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-450 border-t border-slate-800/40 pt-3">
                            <span>Status: {aud.is_approved ? '✅ Active Node' : '❌ Suspended'}</span>
                            <span className="text-brand-400 font-bold uppercase tracking-wider">Active Assignments: 1</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: PROJECT OVERSIGHT */}
          {adminTab === 'oversight' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-350 uppercase tracking-wider">National Registry Project Oversight</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Inspect verification evidence, AI risk audits, and reassign or flag entries. Direct approval buttons are locked.</span>
              </div>

              {loadingAllProjects ? (
                <div className="flex items-center justify-center py-20 bg-darkbg-200/10 rounded-2xl border border-brand-500/5">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                </div>
              ) : allProjectsList.length === 0 ? (
                <div className="p-12 text-center bg-[#0b1f24]/5 border border-dashed border-brand-500/5 rounded-2xl text-xs text-slate-400">
                  No projects submitted to the registry yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left list panel */}
                  <div className="lg:col-span-1 flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {allProjectsList.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleInspectOversightProject(p)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.99] flex flex-col gap-2 ${
                          selectedOversightProject?.id === p.id 
                            ? 'bg-brand-500/5 border-brand-400/40' 
                            : 'bg-[#0b1f24]/20 border-brand-500/5 hover:border-brand-500/15'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-white text-xs truncate max-w-[80%]">{p.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                            p.status === 'verified' 
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                              : p.status === 'rejected' 
                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">Area: {p.area_hectares} Ha • Species: {p.species || 'Mangrove'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right inspector detail panel */}
                  <div className="lg:col-span-2 bg-[#0b1f24]/10 border border-brand-500/10 rounded-2xl p-6 min-h-[400px]">
                    {selectedOversightProject ? (
                      <div className="flex flex-col gap-5">
                        <div className="flex justify-between items-start border-b border-brand-500/5 pb-4">
                          <div className="flex flex-col">
                            <h3 className="font-extrabold text-white text-base">{selectedOversightProject.title}</h3>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                              Location: {selectedOversightProject.latitude}°N, {selectedOversightProject.longitude}°E
                            </span>
                          </div>
                          
                          {/* Locked Status Badge */}
                          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-extrabold bg-[#070c0e] px-3 py-1.5 rounded-xl border border-slate-800 text-slate-500">
                            <Lock className="w-3.5 h-3.5 text-slate-500" /> Auditor controlled status
                          </div>
                        </div>

                        {/* Calculations or stats */}
                        <div className="grid grid-cols-3 gap-4 text-xs bg-[#070c0e]/30 p-3.5 rounded-xl border border-brand-500/5">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase font-semibold">Forestation Area</span>
                            <span className="font-bold text-slate-200">{selectedOversightProject.area_hectares} Hectares</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase font-semibold">Restoration Species</span>
                            <span className="font-bold text-slate-200 capitalize">{selectedOversightProject.species}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase font-semibold">Registry Status</span>
                            <span className="font-bold text-brand-400 capitalize">{selectedOversightProject.status}</span>
                          </div>
                        </div>

                        {/* Evidence inspection */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Verification Evidence</span>
                          <div className="grid grid-cols-3 gap-4 text-[10px] text-slate-400">
                            <div className="p-3 bg-[#070c0e] rounded-xl border border-brand-500/5 flex flex-col gap-1">
                              <span className="text-brand-400 font-bold uppercase tracking-widest text-[8px]">Satellite Overlay</span>
                              <span>✅ Layer resolved</span>
                            </div>
                            <div className="p-3 bg-[#070c0e] rounded-xl border border-brand-500/5 flex flex-col gap-1">
                              <span className="text-brand-400 font-bold uppercase tracking-widest text-[8px]">Drone Orthomosaic</span>
                              <span>✅ Orthomosaic loaded</span>
                            </div>
                            <div className="p-3 bg-[#070c0e] rounded-xl border border-brand-500/5 flex flex-col gap-1">
                              <span className="text-brand-400 font-bold uppercase tracking-widest text-[8px]">Community ground logs</span>
                              <span>✅ 2 Logs attached</span>
                            </div>
                          </div>
                        </div>

                        {/* AI & Auditor notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-[#070c0e]/40 rounded-xl border border-brand-500/5 flex flex-col gap-1 text-[11px]">
                            <span className="text-brand-400 font-extrabold uppercase tracking-wider text-[9px] mb-1 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" /> AI Governance Risk
                            </span>
                            {loadingOversightAnalysis ? (
                              <span className="text-slate-500 italic">Calculating AI score...</span>
                            ) : oversightAnalysis ? (
                              <div className="flex flex-col gap-1">
                                <div><strong className="text-slate-400">Risk Score:</strong> {oversightAnalysis.ai_report?.risk_score || 15}/100</div>
                                <div><strong className="text-slate-400">Confidence:</strong> {oversightAnalysis.carbon_estimation?.confidence_rating}</div>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No AI audits generated.</span>
                            )}
                          </div>

                          <div className="p-4 bg-[#070c0e]/40 rounded-xl border border-brand-500/5 flex flex-col gap-1 text-[11px]">
                            <span className="text-brand-400 font-extrabold uppercase tracking-wider text-[9px] mb-1 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> Auditor Notes
                            </span>
                            <span className="text-slate-350 italic">
                              {selectedOversightProject.verifications && selectedOversightProject.verifications[0] 
                                ? selectedOversightProject.verifications[0].remarks 
                                : 'No verification notes registered yet.'}
                            </span>
                          </div>
                        </div>

                        {/* Governance Actions (Locked direct approval) */}
                        <div className="flex flex-col gap-3.5 border-t border-slate-800/40 pt-4 mt-2">
                          <span className="text-[10px] text-slate-550 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-slate-500" /> NCCR Governance Actions
                          </span>
                          
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => handleEscalateProject(selectedOversightProject)}
                              className="px-4 py-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 text-amber-400 font-bold text-xs hover:bg-amber-500/10 active:scale-[0.98] transition-all"
                            >
                              Escalate to National Board
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFlagProject(selectedOversightProject)}
                              className="px-4 py-2.5 rounded-xl border border-rose-500/25 bg-rose-500/5 text-rose-400 font-bold text-xs hover:bg-rose-500/10 active:scale-[0.98] transition-all"
                            >
                              Flag for Investigation
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReassignProjectAuditor(selectedOversightProject)}
                              className="px-4 py-2.5 rounded-xl border border-brand-500/15 bg-brand-500/5 text-brand-400 font-bold text-xs hover:bg-brand-500/10 active:scale-[0.98] transition-all"
                            >
                              Reassign Auditor
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-20">
                        <Eye className="w-10 h-10 text-slate-655 mb-2" />
                        <span>Select a restoration project from the oversight queue to inspect credentials</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 6: CARBON CREDIT REGISTRY */}
          {adminTab === 'credits' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col mb-1">
                <span className="text-xs font-bold text-slate-355 uppercase tracking-wider">National Carbon Registry Ledger</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Track validated carbon offsets, issuance dates, and marketplace trading status</span>
              </div>

              {loadingAllProjects ? (
                <div className="flex items-center justify-center py-20 bg-darkbg-200/10 rounded-2xl border border-brand-500/5">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                </div>
              ) : allProjectsList.filter(p => p.status === 'verified').length === 0 ? (
                <div className="p-12 text-center bg-darkbg-200/25 border border-dashed border-brand-500/10 rounded-2xl text-xs text-slate-400">
                  No active carbon credits generated yet. Verify project submissions to mint credits.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-brand-500/10 bg-[#0b1f24]/5">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0b1f24]/50 border-b border-brand-500/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Project</th>
                        <th className="p-4">Submitter Node</th>
                        <th className="p-4">Credits Issued</th>
                        <th className="p-4">Ecosystem Type</th>
                        <th className="p-4">Issuance Date</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {allProjectsList.filter(p => p.status === 'verified').map((p) => {
                        const creditsRec = p.carbon_credits && p.carbon_credits[0];
                        return (
                          <tr key={p.id} className="hover:bg-slate-900/10">
                            <td className="p-4 font-bold text-white">{p.title}</td>
                            <td className="p-4 text-slate-400">{p.organization_name || 'Coastal Panchayat Node'}</td>
                            <td className="p-4 font-extrabold text-emerald-450">
                              {creditsRec ? `${parseFloat(creditsRec.credits).toFixed(1)} tCO2e` : '0.0 tCO2e'}
                            </td>
                            <td className="p-4 capitalize text-slate-350">{p.species || 'Mangrove'}</td>
                            <td className="p-4 text-slate-400">
                              {creditsRec ? new Date(creditsRec.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-450">
                                {creditsRec?.status || 'active'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 7: ON-CHAIN LEDGER */}
          {adminTab === 'ledger' || adminTab === 'blockchain' && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center px-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Polygon Amoy Testnet Monitoring</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">On-chain transaction logs and registry contract tracking</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0c2227] px-3.5 py-1.5 rounded-xl border border-brand-500/10 text-[10px] font-bold text-brand-400">
                  <Terminal className="w-3.5 h-3.5" /> status: online • amoy-rpc-ok
                </div>
              </div>

              {loadingAllProjects ? (
                <div className="flex items-center justify-center py-20 bg-darkbg-200/10 rounded-2xl border border-brand-500/5">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                </div>
              ) : allProjectsList.filter(p => p.blockchain_records && p.blockchain_records.length > 0).length === 0 ? (
                <div className="p-12 text-center bg-darkbg-200/25 border border-dashed border-brand-500/10 rounded-2xl text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Database className="w-10 h-10 text-slate-655 mb-1" />
                  <span>No on-chain ledger entries recorded yet.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {allProjectsList.filter(p => p.blockchain_records && p.blockchain_records.length > 0).map((p) => {
                    const chainRec = p.blockchain_records && p.blockchain_records[0];
                    const creditsRec = p.carbon_credits && p.carbon_credits[0];
                    return (
                      <Card 
                        key={p.id} 
                        title={p.title} 
                        subtitle={`GIS Area: ${p.area_hectares} Ha • Species: ${p.species}`}
                        hoverable={false}
                        headerAction={
                          <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-450 text-[9px] uppercase font-bold tracking-wider">
                            {creditsRec ? `${parseFloat(creditsRec.credits).toFixed(1)} Credits Minted` : 'Credits Pending'}
                          </span>
                        }
                      >
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-350 bg-[#070c0e]/40 p-3.5 rounded-xl border border-brand-500/5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-slate-550 uppercase font-semibold">EVM Network</span>
                              <span className="font-bold text-slate-300">{chainRec?.network || 'Polygon Amoy Testnet'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-slate-555 uppercase font-semibold">Block Number</span>
                              <span className="font-bold text-slate-300 font-mono">#{chainRec?.block_number || '35041235'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-slate-555 uppercase font-semibold">Contract Address</span>
                              <span className="font-bold text-brand-400 font-mono text-[10px] truncate" title={chainRec?.contract_address}>
                                {chainRec?.contract_address}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col border-t border-slate-800/40 pt-4">
                            <span className="text-[9px] text-slate-555 uppercase font-semibold">Transaction Ledger Hash</span>
                            <span className="font-mono text-[10px] text-slate-350 break-all select-all mt-0.5">
                              {chainRec?.transaction_hash}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 8: ENVIRONMENTAL ALERTS */}
          {adminTab === 'alerts' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-350 uppercase tracking-wider">Panchayat Environmental alert board</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Review community reports of illegal logging, erosion, and coastal damage, and assign them to Auditors</span>
              </div>

              {loadingAlerts ? (
                <div className="flex items-center justify-center py-20 bg-darkbg-200/10 rounded-2xl border border-brand-500/5">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                </div>
              ) : environmentalAlerts.length === 0 ? (
                <div className="p-12 text-center bg-[#0b1f24]/5 border border-dashed border-brand-500/5 rounded-2xl text-xs text-slate-400">
                  No active community incident alerts reported.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {environmentalAlerts.map((alt) => (
                    <Card 
                      key={alt.id} 
                      title={alt.issue_type.replace('_', ' ').toUpperCase()} 
                      subtitle={`Reported by: ${alt.reporter_name}`}
                      hoverable={false}
                      headerAction={
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                          alt.severity === 'high' 
                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                            : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                        }`}>
                          {alt.severity} severity
                        </span>
                      }
                    >
                      <div className="flex flex-col gap-4 text-xs text-slate-300">
                        <p className="m-0 italic leading-relaxed">"{alt.description}"</p>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/40 pt-3">
                          <span>Location: {alt.latitude}°N, {alt.longitude}°E</span>
                          <span>Date: {new Date(alt.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Assign to Auditor Action */}
                        <div className="border-t border-slate-800/40 pt-3 flex flex-col gap-2">
                          <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider">Assign Auditor for Field Investigation</span>
                          <div className="flex gap-2">
                            <select
                              value={assigningAlertId === alt.id ? assignedAuditorId : ''}
                              onChange={(e) => {
                                setAssigningAlertId(alt.id);
                                setAssignedAuditorId(e.target.value);
                              }}
                              className="bg-[#070c0e] border border-brand-500/15 text-slate-200 text-[11px] rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none focus:border-brand-400 flex-1"
                            >
                              <option value="">Select Auditor...</option>
                              {registeredAuditors.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleAssignAlertToAuditor(alt.id)}
                              className="px-4 py-1.5 rounded-lg bg-brand-400 text-darkbg-300 font-extrabold text-[10px] uppercase tracking-wider hover:bg-brand-300 transition-colors"
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 9: SYSTEM CONFIGURATION */}
          {adminTab === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Carbon factors config */}
              <Card title="Carbon Sequestration Factors" subtitle="National credits calculator coefficients" hoverable={false}>
                <form onSubmit={handleSaveCarbonFactors} className="flex flex-col gap-4 py-2">
                  <Input 
                    id="mangrove-coeff"
                    label="Mangrove coefficient (credits/Ha/year)"
                    type="number"
                    step="0.1"
                    value={mangroveFactor}
                    onChange={(e) => setMangroveFactor(parseFloat(e.target.value) || 0)}
                  />
                  <Input 
                    id="seagrass-coeff"
                    label="Seagrass coefficient (credits/Ha/year)"
                    type="number"
                    step="0.1"
                    value={seagrassFactor}
                    onChange={(e) => setSeagrassFactor(parseFloat(e.target.value) || 0)}
                  />
                  <Input 
                    id="saltmarsh-coeff"
                    label="Salt Marsh coefficient (credits/Ha/year)"
                    type="number"
                    step="0.1"
                    value={saltmarshFactor}
                    onChange={(e) => setSeardFactor(parseFloat(e.target.value) || 0)} // safe
                  />
                  <Button type="submit" className="w-full mt-2">
                    Save registry settings
                  </Button>
                </form>
              </Card>

              {/* Portal Settings & Toggles */}
              <Card title="Transparency Portal Settings" subtitle="Configure guest viewer access controls" hoverable={false}>
                <div className="flex flex-col gap-4 py-2 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200">Show Project Details</span>
                      <span className="text-[10px] text-slate-500">Allow guests to view plantation locations & drone orthomosaics</span>
                    </div>
                    <button
                      onClick={() => setTransparencySettings(prev => ({ ...prev, showProjectDetails: !prev.showProjectDetails }))}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider ${
                        transparencySettings.showProjectDetails ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {transparencySettings.showProjectDetails ? 'Visible' : 'Hidden'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-800/40 pt-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200">Show Credits Ledger</span>
                      <span className="text-[10px] text-slate-500">Allow guests to verify credit token allocations publicly</span>
                    </div>
                    <button
                      onClick={() => setTransparencySettings(prev => ({ ...prev, showCredits: !prev.showCredits }))}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider ${
                        transparencySettings.showCredits ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {transparencySettings.showCredits ? 'Visible' : 'Hidden'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-800/40 pt-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200">Show On-Chain Hashes</span>
                      <span className="text-[10px] text-slate-500">Enable guest redirection to Polygonscan block ledger</span>
                    </div>
                    <button
                      onClick={() => setTransparencySettings(prev => ({ ...prev, showBlockchainRecords: !prev.showBlockchainRecords }))}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider ${
                        transparencySettings.showBlockchainRecords ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {transparencySettings.showBlockchainRecords ? 'Visible' : 'Hidden'}
                    </button>
                  </div>

                  <Button onClick={handleSaveTransparency} className="w-full mt-4">
                    Save visibility rules
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Tab 10: REPORTS & ANALYTICS */}
          {adminTab === 'reports' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* National blue carbon stats */}
              <Card title="National Impact Analytics" subtitle="Month-wise restoration summaries" hoverable={false}>
                <div className="flex flex-col gap-4 py-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Hectares Forested</span>
                    <span className="font-bold text-white">{(totalVerifiedHectares || 250).toFixed(0)} Ha</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                    <span className="text-slate-400">Monthly Submissions Rate</span>
                    <span className="font-bold text-white">4.2 projects/month</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                    <span className="text-slate-400">Audit Queue Average Speed</span>
                    <span className="font-bold text-white">5.8 days</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                    <span className="text-slate-400">AI Risk Flag Precision</span>
                    <span className="font-bold text-brand-400">98.2%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <button
                      onClick={() => handleExportPDF('National')}
                      className="flex items-center justify-center gap-1.5 text-xs text-darkbg-300 bg-brand-400 font-bold px-4 py-2.5 rounded-xl hover:bg-brand-300 active:scale-[0.98] transition-all"
                    >
                      <Download className="w-4 h-4" /> Export PDF
                    </button>
                    <button
                      onClick={() => handleExportCSV('National')}
                      className="flex items-center justify-center gap-1.5 text-xs text-brand-400 border border-brand-500/15 bg-brand-500/5 font-bold px-4 py-2.5 rounded-xl hover:bg-brand-500/10 active:scale-[0.98] transition-all"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Export CSV
                    </button>
                  </div>
                </div>
              </Card>

              {/* Regional metrics */}
              <Card title="Regional District metrics" subtitle="Restoration statistics by delta" hoverable={false}>
                <div className="flex flex-col gap-4 py-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Aghanashini Estuary (Karnataka)</span>
                    <span className="font-bold text-white">2 Projects • 450 Credits</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                    <span className="text-slate-400">Sundarbans Delta (West Bengal)</span>
                    <span className="font-bold text-white">3 Projects • 900 Credits</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                    <span className="text-slate-400">Mahanadi Delta (Odisha)</span>
                    <span className="font-bold text-white">1 Project • 120 Credits</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                    <span className="text-slate-400">Godavari Estuary (Andhra Pradesh)</span>
                    <span className="font-bold text-white">0 Projects • 0 Credits</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <button
                      onClick={() => handleExportPDF('Regional')}
                      className="flex items-center justify-center gap-1.5 text-xs text-darkbg-300 bg-brand-400 font-bold px-4 py-2.5 rounded-xl hover:bg-brand-300 active:scale-[0.98] transition-all"
                    >
                      <Download className="w-4 h-4" /> Export PDF
                    </button>
                    <button
                      onClick={() => handleExportCSV('Regional')}
                      className="flex items-center justify-center gap-1.5 text-xs text-brand-400 border border-brand-500/15 bg-brand-500/5 font-bold px-4 py-2.5 rounded-xl hover:bg-brand-500/10 active:scale-[0.98] transition-all"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Export CSV
                    </button>
                  </div>
                </div>
              </Card>

            </div>
          )}

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // AUDITOR WORKSTATION RENDER (For Auditor/Admin view)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#070c0e] text-slate-100 flex flex-col">
      {/* Top Banner Dashboard Header */}
      <div className="p-6 bg-[#0b1f24]/30 border-b border-brand-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-brand-400" /> MRV Auditor Workstation
          </h1>
          <p className="text-xs text-brand-400 uppercase tracking-widest font-bold">Authorized Verifier Node</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-[#0b1f24] border border-brand-500/15 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-350">Auditor Status: Online</span>
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="px-6 border-b border-slate-800/40 flex gap-2">
        <button
          onClick={() => setAuditorTab('projects')}
          className={`px-5 py-4 border-b-2 text-xs font-extrabold tracking-wider uppercase transition-all ${
            auditorTab === 'projects' 
              ? 'border-brand-400 text-brand-400 bg-brand-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Project Audits Queue
        </button>
        <button
          onClick={() => setAuditorTab('nodes')}
          className={`px-5 py-4 border-b-2 text-xs font-extrabold tracking-wider uppercase transition-all ${
            auditorTab === 'nodes' 
              ? 'border-brand-400 text-brand-400 bg-brand-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Node Approvals ({pendingUsers.length})
        </button>
        <button
          onClick={() => setAuditorTab('ledger')}
          className={`px-5 py-4 border-b-2 text-xs font-extrabold tracking-wider uppercase transition-all ${
            auditorTab === 'ledger' 
              ? 'border-brand-400 text-brand-400 bg-brand-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Blockchain Ledger ({ledgerProjects.length})
        </button>
      </div>

      {/* Status Notifications */}
      {success && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-bold text-center">
          {success}
        </div>
      )}
      {error && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-bold text-center">
          {error}
        </div>
      )}

      {/* Tab Panels */}
      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">

        {/* 1. Projects Audits Queue Tab Content */}
        {auditorTab === 'projects' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Queue Sidebar List (col-span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-4 bg-[#0b1f24]/10 p-4 rounded-2xl border border-brand-500/5 max-h-[750px] overflow-y-auto">
              
              {/* Queue Header Filters */}
              <div className="flex justify-between items-center border-b border-brand-500/10 pb-3 mb-1">
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">Verification Queue</span>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    fetchQueue(e.target.value);
                  }}
                  className="bg-[#070c0e] border border-brand-500/15 text-slate-200 text-[10px] font-bold rounded-lg px-2 py-1.5 uppercase focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {loadingProjects ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold animate-pulse">Scanning database...</span>
                </div>
              ) : pendingProjects.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-450 border border-dashed border-brand-500/5 rounded-xl flex flex-col items-center gap-2">
                  <HelpCircle className="w-8 h-8 text-slate-600" />
                  <span>No submissions found in this category.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingProjects.map((p) => {
                    const isSelected = selectedProject?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProject(p)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.99] flex flex-col gap-2.5 ${
                          isSelected 
                            ? 'bg-brand-500/5 border-brand-400/40 shadow-inner' 
                            : 'bg-darkbg-200/20 border-brand-500/5 hover:border-brand-500/15'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-white text-xs leading-normal truncate max-w-[80%]">{p.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                            p.status === 'verified' 
                              ? 'bg-emerald-500/15 text-emerald-400' 
                              : p.status === 'rejected' 
                                ? 'bg-rose-500/15 text-rose-455' 
                                : 'bg-amber-500/15 text-amber-400'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1"><User className="w-3 h-3 text-slate-500" /> NGO: {p.user?.name || 'Coastal Node'}</div>
                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> Lat/Lng: {p.latitude}, {p.longitude}</div>
                        </div>

                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 border-t border-slate-800/40 pt-2.5">
                          <span>Area: {p.area_hectares} Ha</span>
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Audit Details Panel (col-span 8) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {selectedProject ? (
                <div className="flex flex-col gap-6">
                  
                  {/* Project Summary Card */}
                  <Card 
                    title={selectedProject.title} 
                    subtitle={`Species: ${selectedProject.species} • Submitter: ${selectedProject.user?.name}`} 
                    hoverable={false}
                    headerAction={
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-brand-500/5 px-3 py-1.5 rounded-xl border border-brand-500/10">
                        status: {selectedProject.status}
                      </span>
                    }
                  >
                    <div className="flex flex-col gap-4 text-xs">
                      
                      {/* Grid metrics details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-350 bg-[#070c0e]/30 p-4 rounded-xl border border-brand-500/5">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">Total Area</span>
                          <span className="font-bold text-slate-200">{selectedProject.area_hectares} Ha</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">Restoration Species</span>
                          <span className="font-bold text-slate-200 capitalize">{selectedProject.species}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">Plantation Date</span>
                          <span className="font-bold text-slate-200">{selectedProject.plantation_date || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">Coordinates</span>
                          <span className="font-mono text-slate-200">{selectedProject.latitude}, {selectedProject.longitude}</span>
                        </div>
                      </div>

                      {/* Project Submitter details */}
                      <div className="flex flex-col gap-2.5 border-t border-slate-800/40 pt-4">
                        <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Submitter Profile Node</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[10px] text-slate-400">
                          <div className="flex items-center gap-2"><Building className="w-4 h-4 text-brand-400" /> Org: {selectedProject.user?.organization_name || 'N/A'}</div>
                          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-400" /> Email: {selectedProject.user?.email}</div>
                          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-400" /> Contact: {selectedProject.user?.contact_number || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Audit remarks/actions when under_review */}
                      {selectedProject.status === 'pending' && (
                        <div className="mt-2 border-t border-slate-800/40 pt-4 flex gap-4">
                          <button
                            type="button"
                            onClick={handleStartReview}
                            className="flex items-center gap-1 text-[11px] text-darkbg-300 bg-brand-400 hover:bg-brand-300 font-bold px-5 py-2.5 rounded-xl transition-all"
                          >
                            Start Auditor Review Process
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* map boundaries */}
                  <div className="flex flex-col gap-2 bg-[#0b1f24]/10 p-4 rounded-2xl border border-brand-500/5 relative">
                    <div className="flex justify-between items-center px-1 mb-2">
                      <span className="text-xs font-bold text-slate-350 uppercase tracking-wider">GIS Map Boundaries & Overlays</span>
                      <div className="flex gap-3 text-[9px] font-semibold uppercase tracking-wider text-slate-400 bg-[#070c0e] px-3 py-1 rounded-lg border border-brand-500/5">
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
                        projects={analysisData ? [analysisData] : []} 
                        center={[parseFloat(selectedProject.latitude), parseFloat(selectedProject.longitude)]} 
                        zoom={9}
                        height="280px" 
                      />
                    )}
                  </div>

                  {/* AI Verification Score Card & Fraud Warnings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* AI Agent analysis */}
                    <Card title="AI Verification Summary" subtitle="Evaluated by registry bot" hoverable={false} className="border-l-4 border-l-brand-400">
                      {loadingAnalysis ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                        </div>
                      ) : analysisData?.ai_report ? (
                        <div className="flex flex-col gap-4 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">AI Risk Assessment:</span>
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                              analysisData.ai_report.risk_score > 40 ? 'bg-rose-500/15 text-rose-455' : 'bg-emerald-500/15 text-emerald-400'
                            }`}>
                              {analysisData.ai_report.risk_score}% Risk
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                            <span className="text-slate-400">Coordinate Overlap:</span>
                            <span className={`font-bold ${
                              analysisData.ai_report.is_duplicate ? 'text-rose-455' : 'text-emerald-450'
                            }`}>
                              {analysisData.ai_report.is_duplicate ? '⚠️ Duplicate Detected' : '✅ Clear'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                            <span className="text-slate-400">GIS Overlap Ratio:</span>
                            <span className={`font-bold ${
                              analysisData.ai_report.overlap_ratio > 0.1 ? 'text-rose-455' : 'text-emerald-450'
                            }`}>
                              {(analysisData.ai_report.overlap_ratio * 100).toFixed(1)}% Overlap
                            </span>
                          </div>

                          {analysisData.ai_report.warnings && analysisData.ai_report.warnings.length > 0 && (
                            <div className="border-t border-slate-800/40 pt-3 flex flex-col gap-1.5">
                              <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Fraud/Missing Evidence Warnings
                              </span>
                              <ul className="m-0 pl-4 text-rose-400/90 text-[10px] leading-relaxed flex flex-col gap-1 list-disc">
                                {analysisData.ai_report.warnings.map((w, idx) => (
                                  <li key={idx}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-slate-500 italic">No AI report loaded</div>
                      )}
                    </Card>

                    {/* Dynamic Carbon Credit Calculator */}
                    <Card title="Carbon Credits Calculator" subtitle="Dynamic estimation adjustments" hoverable={false}>
                      {loadingAnalysis ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                        </div>
                      ) : analysisData?.carbon_estimation ? (
                        <div className="flex flex-col gap-4 text-xs">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Assumed plantation age (years)</label>
                            <input 
                              type="number"
                              min="1"
                              max="100"
                              value={plantationAge}
                              onChange={(e) => handleRecalculateCarbon(e.target.value)}
                              className="bg-[#070c0e] border border-brand-500/15 rounded-xl px-3 py-2 text-slate-200 text-xs font-bold font-mono focus:outline-none focus:border-brand-400"
                            />
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                            <span className="text-slate-400">Carbon Sequestration Rate:</span>
                            <span className="font-bold text-white font-mono">{analysisData.carbon_estimation.species_rate} tCO2e/Ha/yr</span>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                            <span className="text-slate-400">Annual Credits Yield:</span>
                            <span className="font-bold text-emerald-450 font-mono">{calculatedCredits.yearly} credits/yr</span>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                            <span className="text-slate-400">Cumulative (Age {plantationAge}):</span>
                            <span className="font-bold text-emerald-400 font-mono">{calculatedCredits.cumulative} tCO2e</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-10 text-center text-slate-500 italic">No calculator available</div>
                      )}
                    </Card>
                  </div>

                  {/* Verification action panel (Only for Under Review / Rejected status) */}
                  {selectedProject.status !== 'pending' && (
                    <Card title="Verification Action Panel" subtitle="Decide and submit on-chain logs" hoverable={false} className="border-l-4 border-l-brand-400">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Calculated Credits to Issue (tCO2e)</label>
                          <input
                            type="number"
                            value={creditsIssued}
                            onChange={(e) => setCreditsIssued(e.target.value)}
                            className="bg-[#070c0e] border border-brand-500/15 rounded-xl px-3 py-2.5 text-slate-200 text-xs font-bold font-mono focus:outline-none focus:border-brand-400"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Auditor remarks & notes</label>
                          <textarea
                            rows="3"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add specific comments about coordinate overlaps, drone imagery quality, species verification, etc..."
                            className="bg-[#070c0e] border border-brand-500/15 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-brand-400"
                          ></textarea>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-2 border-t border-slate-800/40 pt-4 justify-between items-center">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              disabled={submittingVerification}
                              onClick={() => handleVerify('approved')}
                              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-extrabold text-xs text-darkbg-300 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              {submittingVerification ? 'Submitting...' : 'Verify & Give Credits'}
                            </button>
                            <button
                              type="button"
                              disabled={submittingVerification}
                              onClick={() => handleVerify('rejected')}
                              className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-455 font-extrabold text-xs text-slate-100 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              Reject Project
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            disabled={submittingVerification}
                            onClick={handleRequestEvidence}
                            className="px-4 py-2.5 rounded-xl border border-brand-500/20 hover:border-brand-400/30 text-brand-400 font-extrabold text-xs transition-all active:scale-[0.98]"
                          >
                            Request More Evidence
                          </button>
                        </div>

                        <div className="flex border-t border-slate-800/40 pt-4">
                          <button
                            type="button"
                            onClick={handleGenerateReport}
                            className="flex items-center gap-1.5 text-xs text-slate-200 font-bold border border-brand-500/10 hover:border-brand-500/20 bg-brand-500/5 px-4.5 py-2.5 rounded-xl active:scale-[0.98] transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Generate AI Audit Report (PDF/Print)
                          </button>
                        </div>
                      </div>
                    </Card>
                  )}

                </div>
              ) : (
                <div className="p-16 text-center bg-darkbg-200/10 border border-brand-500/5 rounded-2xl text-slate-500 text-xs py-24 flex flex-col items-center gap-2">
                  <ClipboardCheck className="w-12 h-12 text-slate-655 mb-2" />
                  <span>Select a submitted project to begin verification calculations</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 2. Nodes Approvals Tab Content */}
        {auditorTab === 'nodes' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-1">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-350 uppercase tracking-wider">Pending Node Registration Approvals</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Review profiles and authorize NGO or Community council workspace access</span>
              </div>
            </div>

            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#0b1f24]/5 border border-dashed border-brand-500/5 rounded-2xl">
                <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="p-12 text-center bg-[#0b1f24]/5 border border-dashed border-brand-500/5 rounded-2xl text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <UserCheck className="w-8 h-8 text-slate-600 mb-1" />
                <span>No pending registrations found. All profiles approved.</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-brand-500/10 bg-[#0b1f24]/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0b1f24]/50 border-b border-brand-500/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Organization / Location</th>
                      <th className="p-4">Requested Role</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {pendingUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/10">
                        <td className="p-4 font-bold text-white">{u.name}</td>
                        <td className="p-4 font-mono text-slate-350">{u.email}</td>
                        <td className="p-4 text-slate-400">{u.organization_name || u.location || 'N/A'}</td>
                        <td className="p-4 capitalize">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            u.role === 'ngo' 
                              ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-slate-450">{u.contact_number || 'N/A'}</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            disabled={approvingNodeId === u.id}
                            onClick={() => handleApproveNode(u.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-brand-400 hover:bg-brand-300 font-extrabold text-[10px] uppercase tracking-wider text-darkbg-300 transition-colors"
                          >
                            {approvingNodeId === u.id ? 'Approving...' : 'Approve Profile'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. Blockchain Ledger Tab Content */}
        {auditorTab === 'ledger' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Polygon Amoy Testnet Ledger</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Immutable On-Chain Verification Records</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0c2227] px-3.5 py-1.5 rounded-xl border border-brand-500/10 text-[10px] font-bold text-brand-400">
                <Terminal className="w-3.5 h-3.5" /> status: online • amoy-rpc-ok
              </div>
            </div>

            {loadingProjects ? (
              <div className="flex flex-col items-center justify-center py-20 bg-darkbg-200/10 rounded-2xl border border-dashed border-brand-500/5">
                <div className="w-8 h-8 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
              </div>
            ) : ledgerProjects.length === 0 ? (
              <div className="p-12 text-center bg-darkbg-200/25 border border-dashed border-brand-500/10 rounded-2xl text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Database className="w-10 h-10 text-slate-655 mb-1" />
                <span>No on-chain verification records registered yet.</span>
                <span className="text-[10px] text-slate-505">Go to "Project Audits Queue" and approve a project to mint credits and write ledger entries.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {ledgerProjects.map((p) => {
                  const chainRec = p.blockchain_records && p.blockchain_records[0];
                  const creditsRec = p.carbon_credits && p.carbon_credits[0];
                  return (
                    <Card 
                      key={p.id} 
                      title={p.title} 
                      subtitle={`GIS Area: ${p.area_hectares} Ha • Species: ${p.species}`}
                      hoverable={false}
                      headerAction={
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-450 text-[9px] uppercase font-bold tracking-wider">
                            {creditsRec ? `${parseFloat(creditsRec.credits).toFixed(1)} Credits` : 'Credits Pending'}
                          </span>
                        </div>
                      }
                    >
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-350 bg-[#070c0e]/40 p-3.5 rounded-xl border border-brand-500/5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-slate-555 uppercase font-semibold">Network</span>
                            <span className="font-bold text-slate-300">{chainRec?.network || 'Polygon Amoy Testnet'}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-slate-555 uppercase font-semibold">Block Number</span>
                            <span className="font-bold text-slate-300 font-mono">#{chainRec?.block_number || '35041235'}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-slate-555 uppercase font-semibold">Contract Registry</span>
                            <span className="font-bold text-brand-400 font-mono text-[10px] truncate" title={chainRec?.contract_address}>
                              {chainRec?.contract_address}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-800/40 pt-4">
                          <div className="flex flex-col overflow-hidden w-full max-w-[75%]">
                            <span className="text-[9px] text-slate-555 uppercase font-semibold">Transaction Ledger Hash</span>
                            <span className="font-mono text-[10px] text-slate-350 break-all select-all mt-0.5">
                              {chainRec?.transaction_hash}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleInspectContract(p)}
                            className="flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 font-bold border border-brand-500/15 bg-brand-500/5 px-4.5 py-2.5 rounded-xl hover:border-brand-400/20 active:scale-[0.98] transition-all whitespace-nowrap self-end sm:self-auto"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            Read Contract State
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* AI Report Generation Drawer / Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-darkbg-300/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1f24] border border-brand-500/15 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative animate-scaleIn">
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

            {!generatingReport && reportMarkdown && (
              <div className="p-5 border-t border-brand-500/10 flex justify-end gap-3 bg-[#070c0e]/30">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-xs text-darkbg-300 bg-brand-400 font-bold px-5 py-2.5 rounded-xl hover:bg-brand-300 active:scale-[0.98] transition-all shadow-lg shadow-brand-400/10"
                >
                  <Download className="w-4 h-4" />
                  Print / Export to PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspect Smart Contract Variables Modal */}
      {showContractModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-darkbg-300/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1f24] border border-brand-500/15 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col relative animate-scaleIn">
            <div className="p-5 border-b border-brand-500/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-brand-400 animate-pulse" />
                <span className="font-extrabold text-white text-sm uppercase tracking-wider">EVM RPC Contract State Variable Inspector</span>
              </div>
              <button 
                onClick={() => {
                  setShowContractModal(false);
                  setContractReadState(null);
                  setSelectedContractProject(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold bg-[#070c0e] px-2.5 py-1 rounded-lg border border-brand-500/5"
              >
                Close Connection
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed">
              <div className="flex justify-between items-center text-[10px] text-slate-450 border-b border-slate-800/40 pb-2">
                <span>PROJECT: {selectedContractProject?.title}</span>
                <span>METHOD: getVerificationRecord(string)</span>
              </div>

              {loadingContractState ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
                  <div className="w-6 h-6 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
                  <span className="text-[9px] uppercase tracking-wider animate-pulse">Calling contract.getVerificationRecord()...</span>
                </div>
              ) : contractReadState ? (
                <div className="flex flex-col gap-4">
                  <div className="text-[10px] text-slate-400 bg-darkbg-300 p-2.5 rounded-lg border border-brand-500/5">
                    <span className="text-brand-300 font-bold">Solidity Contract ABI Definition:</span>
                    <pre className="mt-1 text-[9px] text-slate-500 whitespace-pre-wrap select-all">
                      {`struct VerificationRecord {
  string projectId;
  uint256 creditsIssued;
  string verificationStatus;
  uint256 timestamp;
  address auditor;
}`}
                    </pre>
                  </div>

                  <div className="flex flex-col gap-2 bg-[#070c0e] p-4 rounded-xl border border-brand-500/5 select-text text-brand-300">
                    <span className="text-[10px] text-slate-500 uppercase border-b border-slate-900 pb-1.5 mb-1.5 font-bold">EVM Storage Return Values:</span>
                    <div><span className="text-slate-550">uint256</span> <span className="text-slate-300 font-bold">creditsIssued:</span> {contractReadState.creditsIssued} tCO2e</div>
                    <div><span className="text-slate-550">string</span>  <span className="text-slate-300 font-bold">verificationStatus:</span> "{contractReadState.verificationStatus}"</div>
                    <div><span className="text-slate-550">uint256</span> <span className="text-slate-300 font-bold">timestamp:</span> {contractReadState.timestamp}</div>
                    <div><span className="text-slate-550">address</span> <span className="text-slate-300 font-bold">auditor:</span> {contractReadState.auditor}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">Could not read contract storage records</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
