import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '../services/api';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Cpu, 
  MapPin, 
  Leaf, 
  Calendar, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowLeft,
  Anchor
} from 'lucide-react';

export default function PublicProjectVerification() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await projectService.getPublicById(id);
        if (res.success) {
          setProject(res.data);
        } else {
          setError(res.error || 'Project verification record not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch public verification record. Verify the project ID.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070c0e] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-brand-500/10 border-t-brand-400 animate-spin"></div>
          <span className="text-xs uppercase tracking-widest text-brand-400 font-bold animate-pulse">Resolving verification records...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#070c0e] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-rose-500/5 blur-3xl pointer-events-none"></div>
        <div className="w-full max-w-md bg-[#0b1f24] border border-rose-500/15 rounded-2xl p-6 text-center shadow-2xl relative z-10 flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <h2 className="text-lg font-bold text-slate-100">Verification Record Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'The requested project verification details could not be found or retrieved from the registry database.'}
          </p>
          <Link 
            to="/login" 
            className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-bold text-darkbg-300 bg-brand-400 hover:bg-brand-300 px-4 py-2.5 rounded-xl transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const chainRec = project.blockchain_records && project.blockchain_records[0];
  const creditsRec = project.carbon_credits && project.carbon_credits[0];
  const isVerified = project.status === 'verified';
  const isRejected = project.status === 'rejected';

  return (
    <div className="min-h-screen bg-[#070c0e] relative py-12 px-4 overflow-x-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-10 left-10 w-[400px] h-[400px] rounded-full bg-brand-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-2xl mx-auto flex flex-col gap-6 relative z-10">
        
        {/* Brand Header */}
        <div className="flex justify-between items-center border-b border-brand-500/10 pb-5">
          <div className="flex items-center gap-2">
            <Anchor className="w-6 h-6 text-brand-400" />
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-sm tracking-wider uppercase">BlueCarbon-Registry</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Public Verification Gateway</span>
            </div>
          </div>
          <Link 
            to="/login" 
            className="text-[10px] uppercase font-bold text-slate-400 hover:text-brand-400 bg-brand-500/5 border border-brand-500/10 px-3 py-1.5 rounded-lg transition-all"
          >
            Portal Login
          </Link>
        </div>

        {/* Verification Status Banner */}
        <div className={`p-6 rounded-2xl border text-center shadow-xl flex flex-col items-center gap-3 relative overflow-hidden ${
          isVerified 
            ? 'bg-emerald-500/5 border-emerald-500/20' 
            : isRejected 
              ? 'bg-rose-500/5 border-rose-500/20' 
              : 'bg-amber-500/5 border-amber-500/20'
        }`}>
          {isVerified ? (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-extrabold text-white uppercase tracking-wider">Verified ✔</h1>
              <p className="text-xs text-slate-350 max-w-md">
                This blue carbon restoration project has been fully audited, spatial overlay tested, and registered on the registry ledger.
              </p>
            </>
          ) : isRejected ? (
            <>
              <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-extrabold text-white uppercase tracking-wider">Audit Rejected ✘</h1>
              <p className="text-xs text-slate-350 max-w-md">
                This project submission did not pass the rigorous verification protocols and has been rejected by the authorized auditors.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-extrabold text-white uppercase tracking-wider">Verification Pending ⌛</h1>
              <p className="text-xs text-slate-350 max-w-md">
                This project is currently under review. The verification queue logs are pending audit calculations and credits issuance.
              </p>
            </>
          )}
        </div>

        {/* Carbon Credits Box */}
        <div className="bg-[#0b1f24] border border-brand-500/10 rounded-2xl p-5 shadow-lg flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Registry Issuance</span>
            <span className="text-white text-base font-extrabold">Credits Issued</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/15 border border-emerald-500/20 text-emerald-400 font-extrabold text-base tracking-wider shadow-inner">
            {isVerified && creditsRec ? `${parseFloat(creditsRec.credits).toFixed(1)} tCO2e` : '0.0 tCO2e (Pending)'}
          </div>
        </div>

        {/* On-Chain Blockchain Records Card */}
        <div className="bg-[#0b1f24] border border-brand-500/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-brand-500/5 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-400" />
              <span className="font-extrabold text-xs text-white uppercase tracking-wider">Blockchain Ledger Logs</span>
            </div>
            {chainRec ? (
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[8px] uppercase tracking-widest font-extrabold">
                Blockchain Verified ✔
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[8px] uppercase tracking-widest font-extrabold">
                Off-Chain Draft
              </span>
            )}
          </div>

          {chainRec ? (
            <div className="flex flex-col gap-4 font-mono text-[10px] leading-relaxed">
              
              {/* Metadata attributes */}
              <div className="grid grid-cols-2 gap-4 bg-[#070c0e] p-3.5 rounded-xl border border-brand-500/5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500 uppercase font-semibold">Ledger Network</span>
                  <span className="font-bold text-slate-300">{chainRec.network || 'Polygon Amoy Testnet'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500 uppercase font-semibold">Block Number</span>
                  <span className="font-bold text-slate-350">#{chainRec.block_number || '35041235'}</span>
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="flex flex-col bg-[#070c0e]/50 p-3.5 rounded-xl border border-brand-500/5 gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-500 uppercase font-semibold">Transaction Ledger Hash</span>
                  <button 
                    type="button"
                    onClick={() => copyToClipboard(chainRec.transaction_hash, 'hash')}
                    className="text-[9px] text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedHash ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <span className="text-brand-300 break-all select-all font-semibold font-mono text-[10px]">
                  {chainRec.transaction_hash}
                </span>
              </div>

              {/* Contract Address */}
              <div className="flex flex-col bg-[#070c0e]/50 p-3.5 rounded-xl border border-brand-500/5 gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-500 uppercase font-semibold">Contract Registry Address</span>
                  <button 
                    type="button"
                    onClick={() => copyToClipboard(chainRec.contract_address, 'contract')}
                    className="text-[9px] text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedContract ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <span className="text-slate-350 break-all select-all font-semibold font-mono text-[10px]">
                  {chainRec.contract_address || '0x889812A2f893979B6A1A70366D1B6fCdAC3023e1'}
                </span>
              </div>

              {/* Explorer link */}
              {chainRec.network?.toLowerCase().includes('amoy') && (
                <a 
                  href={`https://amoy.polygonscan.com/tx/${chainRec.transaction_hash}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] text-brand-400 hover:text-brand-300 font-bold self-end border border-brand-500/10 px-3 py-1.5 rounded-lg bg-brand-500/5 mt-1 transition-all"
                >
                  <ExternalLink className="w-3 h-3" /> Inspect on Polygonscan
                </a>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              This project is currently off-chain. Once approved, the smart contract will issue carbon credits and store block records here.
            </div>
          )}
        </div>

        {/* Project Metadata Card */}
        <div className="bg-[#0b1f24] border border-brand-500/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-brand-500/5 pb-3">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold text-xs text-white uppercase tracking-wider">Project Specification</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Project Name</span>
              <span className="text-slate-200 font-bold">{project.title}</span>
            </div>
            
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Blue Carbon Species</span>
              <span className="text-slate-200 font-bold capitalize">{project.species || 'Mangrove Restoration'}</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Total Forestation Area</span>
              <span className="text-slate-200 font-bold">{project.area_hectares} Hectares</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Registry Submitter</span>
              <span className="text-slate-200 font-bold">{project.user?.name || 'NGO Stakeholder Node'}</span>
            </div>

            <div className="flex flex-col gap-0.5 md:col-span-2 border-t border-slate-800/40 pt-3 flex-row items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-semibold">Registry Coordinates</span>
                <span className="text-slate-300 font-bold font-mono">
                  {project.latitude}° N, {project.longitude}° E
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer footer */}
        <p className="text-center text-[10px] text-slate-600 leading-relaxed px-4">
          Verification records are cryptographically stored on Polygon blockchain. All carbon credit balances are audited through spatial duplicates algorithms, community ground reports, and authorized MRV auditor nodes.
        </p>

      </div>
    </div>
  );
}
