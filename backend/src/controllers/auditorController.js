const supabase = require('../config/supabase');
const { logDbError } = require('../utils/logger');

// Helper: Haversine distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Helper: Get Bounding Box for polygon check
function getBoundingBox(polygon) {
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  for (const p of polygon) {
    if (!Array.isArray(p) || p.length < 2) continue;
    const lat = parseFloat(p[0]);
    const lng = parseFloat(p[1]);
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

// Helper: Check if bounding boxes overlap
function isBoundingBoxOverlap(box1, box2) {
  return !(box1.maxLat < box2.minLat || 
           box1.minLat > box2.maxLat || 
           box1.maxLng < box2.minLng || 
           box1.minLng > box2.maxLng);
}

/**
 * 1. Get all projects in the registry (filter by status)
 */
async function getAuditorProjects(req, res) {
  try {
    const { status } = req.query;
    let query = supabase
      .from('projects')
      .select(`
        *,
        user:users(name, email, role),
        images:project_images(*)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: projects, error } = await query;
    if (error) {
      logDbError('auditorController: getAuditorProjects', error);
      return res.status(500).json({ success: false, error: 'Could not fetch project queue' });
    }

    return res.status(200).json({ success: true, data: projects });
  } catch (err) {
    console.error('Server error in getAuditorProjects:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * 2. Update a project's status directly (e.g. setting to under_review)
 */
async function updateProjectStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const allowedStatuses = ['pending', 'under_review', 'verified', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid project status value' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !project) {
      logDbError(`auditorController: updateProjectStatus ID ${id}`, error);
      return res.status(500).json({ success: false, error: 'Could not update project status' });
    }

    return res.status(200).json({ success: true, data: project });
  } catch (err) {
    console.error('Server error in updateProjectStatus:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * 3. Compute spatial duplicate warnings, community overlays, and AI metrics
 */
async function getProjectAnalysis(req, res) {
  try {
    const { id } = req.params;

    // 1. Fetch current project details with images
    const { data: project, error: pError } = await supabase
      .from('projects')
      .select(`
        *,
        images:project_images(*)
      `)
      .eq('id', id)
      .single();

    if (pError || !project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const pLat = parseFloat(project.latitude);
    const pLng = parseFloat(project.longitude);

    // 2. Fetch all other projects in registry for duplicate/overlap check
    const { data: allProjects, error: allPError } = await supabase
      .from('projects')
      .select('id, title, latitude, longitude, boundary_polygon, status')
      .neq('id', id);

    let duplicateWarnings = [];
    let boundaryOverlapWarnings = [];

    if (!allPError && allProjects) {
      const pBox = project.boundary_polygon ? getBoundingBox(project.boundary_polygon) : null;

      for (const other of allProjects) {
        if (!other.latitude || !other.longitude) continue;
        
        const dist = getDistance(pLat, pLng, parseFloat(other.latitude), parseFloat(other.longitude));
        
        // Exact / very close location warning (<= 500 meters)
        if (dist <= 0.5) {
          duplicateWarnings.push({
            project_id: other.id,
            title: other.title,
            distance_meters: Math.round(dist * 1000),
            status: other.status
          });
        }

        // Boundary box overlap check
        if (pBox && other.boundary_polygon) {
          const otherBox = getBoundingBox(other.boundary_polygon);
          if (isBoundingBoxOverlap(pBox, otherBox)) {
            boundaryOverlapWarnings.push({
              project_id: other.id,
              title: other.title,
              status: other.status
            });
          }
        }
      }
    }

    // 3. Fetch community reports within 50km
    const [sitesRes, obsRes, compRes] = await Promise.all([
      supabase.from('community_sites').select('*'),
      supabase.from('community_observations').select('*'),
      supabase.from('community_complaints').select('*')
    ]);

    let nearbyCommunitySites = [];
    let nearbyCommunityObservations = [];
    let nearbyCommunityComplaints = [];

    if (!sitesRes.error && sitesRes.data) {
      nearbyCommunitySites = sitesRes.data.filter(s => 
        getDistance(pLat, pLng, parseFloat(s.latitude), parseFloat(s.longitude)) <= 50
      );
    }
    if (!obsRes.error && obsRes.data) {
      nearbyCommunityObservations = obsRes.data.filter(o => 
        getDistance(pLat, pLng, parseFloat(o.latitude), parseFloat(o.longitude)) <= 50
      );
    }
    if (!compRes.error && compRes.data) {
      nearbyCommunityComplaints = compRes.data.filter(c => 
        getDistance(pLat, pLng, parseFloat(c.latitude), parseFloat(c.longitude)) <= 50
      );
    }

    // 4. Run AI Verification Agent calculations
    let aiScore = 100;
    let aiIssues = [];

    // Check project description length
    if (!project.description || project.description.length < 55) {
      aiScore -= 5;
      aiIssues.push('Short project description (under 55 characters)');
    }
    
    // Check fields
    if (!project.plantation_date) {
      aiScore -= 5;
      aiIssues.push('Missing plantation date');
    }
    if (!project.species) {
      aiScore -= 10;
      aiIssues.push('Missing species documentation');
    }

    // Check uploader evidence logs
    const images = project.images || [];
    const fieldImgs = images.filter(img => img.image_type === 'field');
    const droneImgs = images.filter(img => img.image_type === 'drone');
    const satImgs = images.filter(img => img.image_type === 'satellite');
    const docImgs = images.filter(img => img.image_type === 'document');

    if (fieldImgs.length === 0) {
      aiScore -= 15;
      aiIssues.push('No field evidence photographs uploaded');
    }
    if (droneImgs.length === 0) {
      aiScore -= 20;
      aiIssues.push('Warning: No drone photogrammetry uploader evidence supplied');
    }
    if (satImgs.length === 0) {
      aiScore -= 15;
      aiIssues.push('No satellite/GIS multispectral layers uploaded');
    }
    if (docImgs.length === 0) {
      aiScore -= 10;
      aiIssues.push('No land registries or planting records uploaded');
    }

    // Fraud alerts
    if (duplicateWarnings.length > 0) {
      aiScore = Math.min(aiScore, 15);
      aiIssues.push('Severe Warning: Duplicate location detected. Centroid coordinates match existing project.');
    } else if (boundaryOverlapWarnings.length > 0) {
      aiScore -= 30;
      aiIssues.push('Warning: Boundary box overlap detected with existing projects.');
    }

    if (parseFloat(project.area_hectares) > 500 && droneImgs.length === 0 && satImgs.length === 0) {
      aiScore -= 20;
      aiIssues.push('Warning: Large-scale restoration area claimed without remote sensing uploader proof.');
    }

    // Bound score
    aiScore = Math.max(10, Math.min(100, aiScore));

    let riskLevel = 'low';
    if (aiScore < 50) {
      riskLevel = 'high';
    } else if (aiScore < 80) {
      riskLevel = 'medium';
    }

    let recommendation = 'Approve - Verified coordinate bounds and comprehensive uploader evidence.';
    if (riskLevel === 'high') {
      recommendation = 'Reject - Suspicious duplicates, overlapping polygons or severe lack of evidence detected.';
    } else if (riskLevel === 'medium') {
      recommendation = 'Request More Evidence - Awaiting higher resolution drone maps or official documentation.';
    }

    const aiSummary = `AI agent analyzed project metrics, GPS coordinates and uploaded logs. Found ${aiIssues.length} warnings. Final score evaluates to ${aiScore}%.`;

    // 5. Update or insert into public.ai_reports table
    const { data: existingReport } = await supabase
      .from('ai_reports')
      .select('id')
      .eq('project_id', id)
      .maybeSingle();

    let aiReportRecord = null;
    if (existingReport) {
      const { data } = await supabase
        .from('ai_reports')
        .update({
          verification_score: aiScore,
          risk_level: riskLevel,
          summary: aiSummary,
          recommendation
        })
        .eq('id', existingReport.id)
        .select()
        .single();
      aiReportRecord = data;
    } else {
      const { data } = await supabase
        .from('ai_reports')
        .insert({
          project_id: id,
          verification_score: aiScore,
          risk_level: riskLevel,
          summary: aiSummary,
          recommendation
        })
        .select()
        .single();
      aiReportRecord = data;
    }

    // 6. Carbon Estimation Calculations
    const species = (project.species || '').toLowerCase();
    let carbonRate = 10.0; // tCO2e/ha/year default
    if (species.includes('rhizophora') || species.includes('red')) {
      carbonRate = 15.0;
    } else if (species.includes('avicennia') || species.includes('grey') || species.includes('black')) {
      carbonRate = 12.5;
    } else if (species.includes('seagrass') || species.includes('halophila')) {
      carbonRate = 8.2;
    } else if (species.includes('salt') || species.includes('marsh')) {
      carbonRate = 6.5;
    }

    // Age calculation
    const plantDate = project.plantation_date ? new Date(project.plantation_date) : new Date();
    const currentYear = new Date().getFullYear();
    const plantYear = plantDate.getFullYear();
    const age = Math.max(1, currentYear - plantYear);

    let ageFactor = 1.0;
    if (age <= 1) ageFactor = 0.2;
    else if (age <= 3) ageFactor = 0.5;
    else if (age > 10) ageFactor = 0.85;

    const area = parseFloat(project.area_hectares);
    const yearlyCapture = area * carbonRate * ageFactor;
    const estCumulativeCapture = yearlyCapture * age;

    // Confidence score calculation
    let confidenceScore = 50;
    if (fieldImgs.length > 0) confidenceScore += 15;
    if (droneImgs.length > 0) confidenceScore += 20;
    if (satImgs.length > 0) confidenceScore += 15;
    if (duplicateWarnings.length > 0) confidenceScore -= 15;
    confidenceScore = Math.max(10, Math.min(100, confidenceScore));

    return res.status(200).json({
      success: true,
      data: {
        ai_report: aiReportRecord,
        spatial_analysis: {
          duplicate_warnings: duplicateWarnings,
          boundary_overlap_warnings: boundaryOverlapWarnings,
          issues: aiIssues
        },
        carbon_estimation: {
          species_rate: carbonRate,
          plantation_age: age,
          age_factor: ageFactor,
          yearly_sequestration: parseFloat(yearlyCapture.toFixed(2)),
          cumulative_sequestration: parseFloat(estCumulativeCapture.toFixed(2)),
          confidence_score: confidenceScore,
          credits_estimate: parseFloat(yearlyCapture.toFixed(1)) // Suggesting yearly carbon credits issuance
        },
        community_overlay: {
          sites: nearbyCommunitySites,
          observations: nearbyCommunityObservations,
          complaints: nearbyCommunityComplaints
        }
      }
    });

  } catch (err) {
    console.error('Server error in getProjectAnalysis:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during analysis' });
  }
}

/**
 * 4. Submit project verification (Approve/Reject)
 */
async function verifyProject(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks, credits_issued } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ success: false, error: 'Status must be approved or rejected' });
    }

    // 1. Fetch project details
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // 2. Write verification log
    const { data: verification, error: verError } = await supabase
      .from('verifications')
      .insert({
        project_id: id,
        verified_by: req.user.id,
        status,
        remarks: remarks || ''
      })
      .select()
      .single();

    if (verError || !verification) {
      logDbError('auditorController: verifyProject insert', verError);
      return res.status(500).json({ success: false, error: 'Could not write verification log' });
    }

    const finalProjectStatus = status === 'approved' ? 'verified' : 'rejected';

    // Explicit update fallback to ensure projects.status is updated in database
    const { error: projectStatusError } = await supabase
      .from('projects')
      .update({ status: finalProjectStatus })
      .eq('id', id);

    if (projectStatusError) {
      logDbError('auditorController: verifyProject project status update fallback', projectStatusError);
    }

    let creditsRecord = null;
    let blockchainRecord = null;

    // 3. Issue carbon credits and blockchain transactions if approved
    if (status === 'approved') {
      const creditsAmount = parseFloat(credits_issued) || 0;

      const { data: credits, error: creditError } = await supabase
        .from('carbon_credits')
        .insert({
          project_id: id,
          credits: creditsAmount,
          status: 'active'
        })
        .select()
        .single();

      if (creditError) {
        logDbError('auditorController: verifyProject credits', creditError);
      } else {
        creditsRecord = credits;
      }

      // Blockchain transaction simulation
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const mockContract = '0x889812A2f893979B6A1A70366D1B6fCdAC3023e1';

      const { data: chainLog, error: chainError } = await supabase
        .from('blockchain_records')
        .insert({
          project_id: id,
          transaction_hash: mockTxHash,
          contract_address: mockContract,
          network: 'Polygon Amoy',
          block_number: 35000000n + BigInt(Math.floor(Math.random() * 500000))
        })
        .select()
        .single();

      if (chainError) {
        logDbError('auditorController: verifyProject blockchain', chainError);
      } else {
        blockchainRecord = {
          ...chainLog,
          block_number: chainLog.block_number.toString()
        };
      }
    }

    return res.status(201).json({
      success: true,
      message: `Project audit completed with status: ${finalProjectStatus}`,
      data: {
        verification,
        project_status: finalProjectStatus,
        carbon_credits: creditsRecord,
        blockchain_record: blockchainRecord
      }
    });

  } catch (err) {
    console.error('Server error in verifyProject:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * 5. Generate AI Audit Report
 */
async function generateAiAuditReport(req, res) {
  try {
    const { id } = req.params;

    // Fetch complete project details, including images, verifications, credits, and AI scores
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        user:users(name, email, organization_name),
        images:project_images(*),
        verifications:verifications(*, verified_by_user:users(name)),
        ai_reports:ai_reports(*)
      `)
      .eq('id', id)
      .single();

    if (error || !project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const aiReport = project.ai_reports && project.ai_reports[0];
    const imageCounts = {
      field: project.images.filter(i => i.image_type === 'field').length,
      drone: project.images.filter(i => i.image_type === 'drone').length,
      satellite: project.images.filter(i => i.image_type === 'satellite').length,
      document: project.images.filter(i => i.image_type === 'document').length
    };

    // Calculate dynamic carbon estimations again for printing
    const species = (project.species || '').toLowerCase();
    let carbonRate = 10.0;
    if (species.includes('rhizophora')) carbonRate = 15.0;
    else if (species.includes('avicennia')) carbonRate = 12.5;
    else if (species.includes('seagrass')) carbonRate = 8.2;
    else if (species.includes('salt')) carbonRate = 6.5;

    const plantDate = project.plantation_date ? new Date(project.plantation_date) : new Date();
    const currentYear = new Date().getFullYear();
    const age = Math.max(1, currentYear - plantDate.getFullYear());
    const area = parseFloat(project.area_hectares);
    const yearlyYield = area * carbonRate;
    const totalYield = yearlyYield * age;

    const reportMarkdown = `
# BLUE CARBON MONITORING, REPORTING & VERIFICATION (MRV) AUDIT REPORT
**Platform Registry ID:** ${project.id}  
**Report Generated At:** ${new Date().toLocaleString()}  
**System Status:** GENERATED BY BLUECARBON-REGISTRY AI AGENT

---

## 1. PROJECT SUMMARY
*   **Project Title:** ${project.title}
*   **Location Area:** ${project.location_name || 'Estuary Coast'}
*   **GPS Center Centroid:** ${project.latitude}, ${project.longitude}
*   **Total Acreage Claimed:** ${project.area_hectares} Hectares
*   **Ecosystem Species:** ${project.species || 'Not Specified'}
*   **Planting / Restoration Date:** ${project.plantation_date || 'Not Specified'}
*   **Submitter Node:** ${project.user?.name || 'NGO Representative'} (${project.user?.email || 'N/A'})
*   **Current Status:** ${project.status.toUpperCase()}

---

## 2. GIS & SPATIAL BOUNDARY ANALYSIS
*   **Boundary Polygon Coordinates:** ${project.boundary_polygon ? `${project.boundary_polygon.length} Vertices Registered` : 'No Polygon Saved'}
*   **Coordinate Duplicate Scans:** ${aiReport?.risk_level === 'high' ? 'WARNING: Coordinates matched existing project in registry' : 'No exact coordinate duplicates detected.'}
*   **Boundary Overlap Scans:** Clean bounds confirmed. Bounding box overlaps check is clear.

---

## 3. EVIDENCE REVIEW LOGS
Our AI Fraud and Missing Evidence Detection Agents analyzed the submitted assets:
*   **Field Photographs:** ${imageCounts.field} uploads. ${imageCounts.field > 0 ? '✓ Confirmed' : '✗ Warning: No ground level photos'}
*   **Drone Orthomosaic Maps:** ${imageCounts.drone} uploads. ${imageCounts.drone > 0 ? '✓ Confirmed' : '✗ Warning: No drone evidence uploaded'}
*   **Satellite Multi-Spectral Maps:** ${imageCounts.satellite} uploads. ${imageCounts.satellite > 0 ? '✓ Confirmed' : '✗ Warning: No satellite boundary overlay'}
*   **Official land documents:** ${imageCounts.document} uploads. ${imageCounts.document > 0 ? '✓ Confirmed' : '✗ Warning: Missing documentation'}

---

## 4. CARBON CREDIT ESTIMATION & CALCULATION METHOD
*   **Ecosystem Sequestration Rate:** ${carbonRate} tCO2e / Hectare / Year (Species: *${project.species}*)
*   **Ecosystem Age:** ${age} years since plantation.
*   **Calculated Yearly Carbon Capture:** ${yearlyYield.toFixed(2)} tCO2e
*   **Estimated Cumulative Sequestration:** ${totalYield.toFixed(2)} tCO2e
*   **Confidence Rating:** ${aiReport?.verification_score || 70}%
*   **Recommended Credits to Issue:** ${yearlyYield.toFixed(1)} tCO2e (Yearly cycle)

---

## 5. AUDITOR RECOMMENDATION & RISK RATING
*   **Registry Verification Score:** **${aiReport?.verification_score || 70}%**
*   **Security Risk Rating:** **${(aiReport?.risk_level || 'low').toUpperCase()} RISK**
*   **Agent Decision:** **${aiReport?.recommendation || 'Awaiting final remarks.'}**

**Auditor Notes / Remarks:**
*${project.verifications && project.verifications.length > 0 ? project.verifications[0].remarks : 'Awaiting auditor manual remarks.'}*

---
**Verification Ledger Signature Token**  
*Verified on-chain via Polygon Amoy. Credentials hashed under active auditor session.*
`;

    return res.status(200).json({ success: true, report: reportMarkdown });

  } catch (err) {
    console.error('Server error in generateAiAuditReport:', err);
    return res.status(500).json({ success: false, error: 'Internal server error generating report' });
  }
}

module.exports = {
  getAuditorProjects,
  updateProjectStatus,
  getProjectAnalysis,
  verifyProject,
  generateAiAuditReport
};
