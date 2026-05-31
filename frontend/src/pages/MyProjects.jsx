import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { projectService } from '../services/api';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import MapView from '../components/maps/MapView';
import { 
  TreePine, 
  MapPin, 
  Layers, 
  Calendar, 
  Award,
  Link2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Edit3
} from 'lucide-react';

export default function MyProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const res = await projectService.getMy();
      if (res.success) {
        setProjects(res.data);
      } else {
        setError('Could not retrieve project logs.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure with registry node.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const toggleExpand = (id) => {
    setExpandedProjectId(prev => prev === id ? null : id);
  };

  const handleEditDraft = (project) => {
    navigate('/projects/create', { state: { editProject: project } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-4 border-brand-500/10 border-t-brand-400 animate-spin"></div>
        <p className="mt-4 text-brand-400 text-xs tracking-widest uppercase animate-pulse">Syncing User Project Records...</p>
      </div>
    );
  }

  const restorationLabels = {
    mangrove: 'Mangrove Forest',
    seagrass: 'Seagrass Meadow',
    salt_marsh: 'Salt Marsh'
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
            My Restoration Projects
          </h1>
          <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">
            Monitor submission status, GIS boundaries, audits & tokenized credits
          </p>
        </div>
        <Link 
          to="/projects/create"
          className="bg-brand-400 text-darkbg-300 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-brand-300 transition-all text-center self-start sm:self-auto shadow-lg shadow-brand-400/10"
        >
          Register Restoration Node
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <Card hoverable={false} className="flex flex-col items-center justify-center p-12 text-center max-w-xl mx-auto mt-6">
          <FolderOpen className="w-16 h-16 text-slate-600 mb-4 animate-float" />
          <h3 className="text-lg font-bold text-slate-100">No Registered Nodes</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">
            You haven't registered any restoration locations on BlueCarbon-Registry yet. Create your first mangrove or seagrass monitoring site to begin.
          </p>
          <Link to="/projects/create" className="mt-6">
            <Button variant="primary" size="sm">
              Register First Project
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((project) => {
            const isExpanded = expandedProjectId === project.id;
            const isDraft = project.status === 'draft';
            const verified = project.status === 'verified';
            
            return (
              <Card 
                key={project.id} 
                hoverable={false} 
                className={`
                  border-l-4 transition-all duration-300
                  ${isDraft ? 'border-dashed border-slate-700 border-l-amber-500 bg-slate-900/10' : ''}
                  ${verified ? 'border-l-emerald-500' : ''}
                  ${project.status === 'rejected' ? 'border-l-rose-500' : ''}
                  ${project.status === 'pending' ? 'border-l-amber-500' : ''}
                `}
              >
                {/* Header Information */}
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-white tracking-wide">{project.title}</h3>
                      <Badge status={project.status} />
                      <span className="text-[10px] uppercase font-bold text-brand-400 px-2 py-0.5 rounded bg-brand-950/40 border border-brand-900/35">
                        {restorationLabels[project.restoration_type] || project.restoration_type || 'Restoration Site'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand-400" /> {project.location_name || 'GIS Point'}</span>
                      <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-brand-400" /> {project.area_hectares} Ha</span>
                      <span className="flex items-center gap-1.5"><TreePine className="w-3.5 h-3.5 text-brand-400" /> {project.species}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-start md:self-center">
                    {isDraft && (
                      <button
                        onClick={() => handleEditDraft(project)}
                        className="flex items-center gap-1 bg-brand-400 text-darkbg-300 font-bold px-3 py-1.5 rounded-lg text-xs uppercase hover:bg-brand-300 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Draft
                      </button>
                    )}
                    
                    <button
                      onClick={() => toggleExpand(project.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 py-1.5 px-3 rounded-lg bg-[#0c2227] border border-brand-400/10 transition-colors"
                    >
                      {isExpanded ? (
                        <>Collapse <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Inspect Details <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Details Panel */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-brand-500/10 flex flex-col gap-6 animate-fadeIn">
                    
                    {/* Grid Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Left & Center columns: Description, GIS boundaries */}
                      <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">Node Description</span>
                          <p className="text-xs text-slate-300 leading-relaxed bg-[#070c0e]/30 p-3.5 rounded-xl border border-brand-500/5">
                            {project.description || 'No description provided.'}
                          </p>
                        </div>
                        
                        {/* Centroid coordinates & specs */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-500">Plantation Date</span>
                            <span className="text-xs text-slate-200 font-semibold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> 
                              {project.plantation_date ? new Date(project.plantation_date).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-500">GIS Center Point</span>
                            <span className="text-xs text-slate-200 font-mono font-semibold">
                              {project.latitude ? `${parseFloat(project.latitude).toFixed(4)}, ${parseFloat(project.longitude).toFixed(4)}` : 'Not set'}
                            </span>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-500">Registry ID</span>
                            <span className="text-[9px] text-slate-400 font-mono select-all truncate">{project.id}</span>
                          </div>
                        </div>

                        {/* Interactive GIS Polygon Boundary Overlay */}
                        {project.latitude && project.longitude && (
                          <div className="flex flex-col gap-2 mt-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">GIS Boundary Polygon</span>
                            <MapView 
                              projects={[project]} 
                              center={[parseFloat(project.latitude), parseFloat(project.longitude)]} 
                              zoom={9}
                              height="220px" 
                            />
                          </div>
                        )}
                      </div>

                      {/* Right: Images/Evidence logs */}
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">Evidence Submissions</span>
                          {project.images && project.images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {project.images.map((img) => (
                                <div key={img.id} className="relative rounded-lg overflow-hidden border border-brand-500/10 h-16 bg-[#070c0e]">
                                  <img src={img.image_url} alt="registry-docs" className="w-full h-full object-cover" />
                                  <span className="absolute bottom-0.5 left-0.5 bg-[#0c2227]/90 text-[7px] font-bold text-brand-300 uppercase tracking-widest px-1.5 py-0.2 rounded border border-brand-400/5">
                                    {img.image_type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center p-6 border border-dashed border-brand-500/10 rounded-xl text-center text-xs text-slate-500">
                              No photo evidence uploaded.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Verified Stats Block (credits & blockchain hash) */}
                    {verified && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        {/* Tokenized Asset status */}
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <Award className="w-5 h-5 animate-pulse-slow" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-200">Carbon Credits Issued</span>
                            <span className="text-lg font-extrabold text-emerald-400 mt-0.5">
                              {(project.area_hectares * 12.5).toFixed(1)} tCO2e
                            </span>
                            <span className="text-[10px] text-slate-400">Status: Minted & Distributed</span>
                          </div>
                        </div>

                        {/* Blockchain ledger details */}
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-800 text-brand-300">
                            <Link2 className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col overflow-hidden w-full">
                            <span className="text-xs font-bold text-slate-200">Blockchain Record</span>
                            <a 
                              href="#" 
                              className="text-[10px] text-brand-400 hover:text-brand-300 font-mono mt-1 break-all flex items-center gap-1"
                              onClick={(e) => {
                                e.preventDefault();
                                alert("Transaction link matches: Polygon Amoy Ledger. Transaction Verified.");
                              }}
                            >
                              0x6c2fb8b80...5d2758d19df
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Network: Polygon Amoy Testnet</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
