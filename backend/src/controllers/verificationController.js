const supabase = require('../config/supabase');

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
      console.error('Error inserting verification:', verError);
      return res.status(500).json({ success: false, error: 'Could not write verification record' });
    }

    // Note: Database triggers automatically update projects.status to 'verified' or 'rejected'.
    // However, to ensure local consistency in response, let's reflect that.
    const finalProjectStatus = status === 'approved' ? 'verified' : 'rejected';

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
        console.error('Error creating carbon credits:', creditError);
      } else {
        creditsRecord = credits;
      }

      // Generate a mock Polygon transaction hash for the ledger demo
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const mockContract = '0x889812A2f893979B6A1A70366D1B6fCdAC3023e1';
      
      const { data: chainLog, error: chainError } = await supabase
        .from('blockchain_records')
        .insert({
          project_id,
          transaction_hash: mockTxHash,
          contract_address: mockContract,
          network: 'Polygon Amoy',
          block_number: 35000000n + BigInt(Math.floor(Math.random() * 500000))
        })
        .select()
        .single();

      if (chainError) {
        console.error('Error creating blockchain log:', chainError);
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
      console.error('Error getting verifications:', error);
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
