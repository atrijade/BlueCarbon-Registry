import React, { useState, useEffect } from 'react';
import { projectService, verificationService, authService } from '../services/api';
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
  Building
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'nodes'
  
  // Projects Queue State
  const [pendingProjects, setPendingProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  
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

  const fetchQueue = async () => {
    try {
      setLoadingProjects(true);
      const res = await projectService.getAll('pending');
      if (res.success) {
        setPendingProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProject(res.data[0]);
          setCreditsIssued((res.data[0].area_hectares * 12.5).toFixed(1));
        } else {
          setSelectedProject(null);
        }
      } else {
        setError('Failed to fetch pending verification queue.');
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
      fetchQueue();
    } else {
      fetchUsers();
    }
    setError('');
    setSuccess('');
  }, [activeTab]);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setRemarks('');
    setCreditsIssued((project.area_hectares * 12.5).toFixed(1));
    setError('');
    setSuccess('');
  };

  const handleVerify = async (status) => {
    if (!selectedProject) return;
    
    setError('');
    setSuccess('');
    setSubmittingVerification(true);

    try {
      const payload = {
        project_id: selectedProject.id,
        status, // 'approved' or 'rejected'
        remarks,
        credits_issued: status === 'approved' ? parseFloat(creditsIssued) : 0
      };

      const res = await verificationService.submit(payload);
      setSubmittingVerification(false);

      if (res.success) {
        setSuccess(`Project successfully ${status === 'approved' ? 'approved' : 'rejected'}.`);
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-brand-400" />
          MRV Administration Console
        </h1>
        <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">
          Verify GIS boundaries, issue carbon credits and manage node authorization keys
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
          Project Queue ({pendingProjects.length})
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
        <>
          {loadingProjects ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <div className="w-10 h-10 rounded-full border-4 border-brand-500/10 border-t-brand-400 animate-spin"></div>
              <p className="mt-4 text-brand-400 text-xs tracking-widest uppercase animate-pulse">Syncing verification queue...</p>
            </div>
          ) : pendingProjects.length === 0 ? (
            <Card hoverable={false} className="flex flex-col items-center justify-center p-12 text-center max-w-xl mx-auto mt-6">
              <CheckCircle className="w-16 h-16 text-emerald-400 mb-4 animate-float" />
              <h3 className="text-lg font-bold text-slate-100">Queue is Clear</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                All submitted blue carbon restoration projects have undergone audits. There are no outstanding verification requests.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Queue selection */}
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Pending Submissions ({pendingProjects.length})
                </span>
                <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
                  {pendingProjects.map((p) => {
                    const isSelected = selectedProject && selectedProject.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProject(p)}
                        className={`
                          p-4 rounded-2xl border text-left transition-all duration-200
                          ${isSelected 
                            ? 'bg-brand-900/35 border-brand-400/60 shadow-[0_0_12px_rgba(92,193,203,0.1)]' 
                            : 'bg-[#0c2227]/40 border-brand-500/10 hover:border-brand-500/20'
                          }
                        `}
                      >
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-bold text-slate-100 truncate">{p.title}</span>
                          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                            <span>{p.area_hectares} Hectares</span>
                            <span className="font-semibold text-brand-400">{p.restoration_type || 'Mangrove'}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 border-t border-brand-500/5 pt-2">
                            <span>by: {p.user?.name || 'NGO Node'}</span>
                            <span>{new Date(p.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Panel */}
              {selectedProject && (
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <Card 
                    title="Auditing Node Characteristics" 
                    subtitle={`Registry ID: ${selectedProject.id}`}
                    hoverable={false}
                  >
                    <div className="flex flex-col gap-6">
                      
                      <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-white tracking-wide">{selectedProject.title}</h2>
                        <span className="text-xs text-slate-400">
                          Submitted by: <strong>{selectedProject.user?.name}</strong> • {selectedProject.user?.email}
                        </span>
                      </div>

                      {/* Map display */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">GIS Coordinate Boundary</span>
                        <MapView 
                          projects={[selectedProject]} 
                          center={[parseFloat(selectedProject.latitude), parseFloat(selectedProject.longitude)]} 
                          zoom={8}
                          height="240px" 
                        />
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#070c0e]/50 border border-brand-500/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Area</span>
                          <span className="text-sm font-bold text-slate-200 mt-0.5">{selectedProject.area_hectares} Hectares</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Coordinates</span>
                          <span className="text-xs font-mono text-brand-400 mt-0.5">{parseFloat(selectedProject.latitude).toFixed(4)}, {parseFloat(selectedProject.longitude).toFixed(4)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Species Planted</span>
                          <span className="text-xs font-bold text-slate-200 mt-0.5 truncate">{selectedProject.species}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Plantation Date</span>
                          <span className="text-sm font-bold text-slate-200 mt-0.5">
                            {selectedProject.plantation_date ? new Date(selectedProject.plantation_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">NGO Description</span>
                        <p className="text-xs text-slate-300 leading-relaxed bg-[#070c0e]/30 p-3.5 rounded-xl border border-brand-500/5">
                          {selectedProject.description || 'No description supplied.'}
                        </p>
                      </div>

                      {/* Photo/Document evidence upload list */}
                      <div className="flex flex-col gap-2.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">Submitted Evidence Log</span>
                        {selectedProject.images && selectedProject.images.length > 0 ? (
                          <div className="grid grid-cols-3 gap-3">
                            {selectedProject.images.map((img) => (
                              <div key={img.id} className="relative rounded-xl overflow-hidden border border-brand-500/10 h-28 bg-[#070c0e]">
                                <img src={img.image_url} alt="auditing-evidence" className="w-full h-full object-cover opacity-85" />
                                <span className="absolute bottom-1.5 left-1.5 bg-[#0c2227]/90 text-[8px] font-bold text-brand-300 uppercase tracking-widest px-2 py-0.5 rounded border border-brand-400/5">
                                  {img.image_type}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[11px] text-amber-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p>No evidence logs supplied. Audits are subject to physical coordinate inspection reports.</p>
                          </div>
                        )}
                      </div>

                      {/* Auditor Remarks */}
                      <div className="border-t border-brand-500/10 pt-6 mt-4 flex flex-col gap-4">
                        <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          <FileText className="w-4.5 h-4.5 text-brand-400" />
                          Auditor Evaluation
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            id="creditsIssued"
                            type="number"
                            step="0.1"
                            label="Carbon Credits to Issue (tCO2e)"
                            placeholder="e.g. 187.5"
                            value={creditsIssued}
                            onChange={(e) => setCreditsIssued(e.target.value)}
                            required
                          />

                          <div className="flex items-center gap-2 p-3 bg-brand-900/15 border border-brand-500/5 rounded-xl text-[10px] text-slate-400 mt-4.5">
                            <HelpCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                            <p>Based on a 12.5x multiplier for blue carbon density. Modify as needed per local GIS soil surveys.</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                            Verification Remarks / Audit Notes
                          </label>
                          <textarea
                            className="w-full rounded-xl py-2.5 px-4 text-sm text-slate-200 glass-input min-h-[80px]"
                            placeholder="Enter auditing notes, satellite vegetation indices, or physical verification survey logs..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-3 justify-end mt-2">
                          <button
                            onClick={() => handleVerify('rejected')}
                            disabled={submittingVerification}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-rose-500/20 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all active:scale-[0.98]"
                          >
                            <XCircle className="w-4.5 h-4.5" />
                            Reject Project
                          </button>
                          <Button
                            onClick={() => handleVerify('approved')}
                            loading={submittingVerification}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4.5 h-4.5" />
                            Verify & Issue Credits
                          </Button>
                        </div>

                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </>
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
    </div>
  );
}
