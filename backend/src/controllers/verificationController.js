const supabase = require('../config/supabase');
const { logDbError } = require('../utils/logger');
const { verifyProjectOnChain } = require('../utils/blockchainService');

/**
 * Submit a project verification (Approve or Reject)
 */
async function submitVerification(req, res) {
  try {
    const { project_id, status, remarks, credits_issued } = req.body;

    if (!project_id || !status) {
      return res.status(400).json({ success: false, error: 'Project ID and Status are required' });
    }

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ success: false, error: 'Status must be approved or rejected' });
    }

    // 1. Fetch the project to verify it exists and get details
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (fetchError || !project) {
      if (fetchError && fetchError.code !== 'PGRST116') {
        logDbError('verificationController: Fetching project for verification', fetchError);
      }
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // 2. Insert verification record
    const { data: verification, error: verError } = await supabase
      .from('verifications')
      .insert({
        project_id,
        verified_by: req.user.id,
        status,
        remarks: remarks || ''
      })
      .select()
      .single();

    if (verError || !verification) {
      logDbError('verificationController: Inserting verification record', verError);
      return res.status(500).json({ success: false, error: 'Could not write verification record' });
    }

    // Note: Database triggers automatically update projects.status to 'verified' or 'rejected'.
    // However, to ensure local consistency in response, let's reflect that.
    const finalProjectStatus = status === 'approved' ? 'verified' : 'rejected';

    // Explicit update fallback to ensure projects.status is updated in database
    const { error: projectStatusError } = await supabase
      .from('projects')
      .update({ status: finalProjectStatus })
      .eq('id', project_id);

    if (projectStatusError) {
      logDbError('verificationController: submitVerification project status update fallback', projectStatusError);
    }

    let creditsRecord = null;
    let blockchainRecord = null;

    // 3. If approved, issue mock carbon credits & create a mock blockchain log
    if (status === 'approved') {
      // Auto-calculate credits: 12.5 credits per hectare of blue carbon
      const calculatedCredits = credits_issued || (project.area_hectares * 12.5);
      
      const { data: credits, error: creditError } = await supabase
        .from('carbon_credits')
        .insert({
          project_id,
          credits: parseFloat(calculatedCredits),
          status: 'active'
        })
        .select()
        .single();

      if (creditError) {
        logDbError('verificationController: Creating carbon credits', creditError);
      } else {
        creditsRecord = credits;
      }

      // Smart Contract Verification On Chain (Phase 6)
      const txResult = await verifyProjectOnChain(project_id, calculatedCredits, 'approved');
      
      const { data: chainLog, error: chainError } = await supabase
        .from('blockchain_records')
        .insert({
          project_id,
          transaction_hash: txResult.transactionHash,
          contract_address: txResult.contractAddress,
          network: txResult.network,
          block_number: BigInt(txResult.blockNumber)
        })
        .select()
        .single();

      if (chainError) {
        logDbError('verificationController: Creating blockchain record log', chainError);
      } else {
        // BigInt JSON serialization fix
        blockchainRecord = {
          ...chainLog,
          block_number: chainLog.block_number.toString()
        };
      }
    }

    res.status(201).json({
      success: true,
      message: `Project ${status === 'approved' ? 'verified and approved' : 'rejected'} successfully`,
      data: {
        verification,
        project_status: finalProjectStatus,
        carbon_credits: creditsRecord,
        blockchain_record: blockchainRecord
      }
    });

  } catch (error) {
    console.error('Verification submission error:', error);
    res.status(500).json({ success: false, error: 'Server error during verification submission' });
  }
}

/**
 * Get verifications for a specific project
 */
async function getVerificationsForProject(req, res) {
  try {
    const { projectId } = req.params;

    const { data: verifications, error } = await supabase
      .from('verifications')
      .select(`
        *,
        auditor:users(name, email)
      `)
      .eq('project_id', projectId)
      .order('verified_at', { ascending: false });

    if (error) {
      logDbError('verificationController: getVerificationsForProject', error);
      return res.status(500).json({ success: false, error: 'Could not fetch verifications' });
    }

    res.status(200).json({ success: true, data: verifications });
  } catch (error) {
    console.error('Get verifications server error:', error);
    res.status(500).json({ success: false, error: 'Server error fetching verifications' });
  }
}

module.exports = {
  submitVerification,
  getVerificationsForProject
};
