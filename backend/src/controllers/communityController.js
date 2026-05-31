const supabase = require('../config/supabase');
const { logDbError } = require('../utils/logger');

// Helper to handle standard DB inserts
async function handleInsert(table, payload, contextName, res) {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) {
      logDbError(contextName, error);
      return res.status(500).json({ success: false, error: `Could not save data to ${table}` });
    }
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error(`Server error in ${contextName}:`, err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// 1. Site Reports
async function reportSite(req, res) {
  const { location_name, latitude, longitude, issue, suggested_action, photo_url } = req.body;
  if (!location_name || !latitude || !longitude || !issue || !suggested_action) {
    return res.status(400).json({ success: false, error: 'Missing required location or issue description fields' });
  }
  const payload = {
    user_id: req.user.id,
    reporter_name: req.user.name || 'Community Member',
    location_name,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    issue,
    suggested_action,
    photo_url: photo_url || null,
    status: 'submitted'
  };
  return handleInsert('community_sites', payload, 'communityController: reportSite', res);
}

async function getSites(req, res) {
  try {
    const { data, error } = await supabase
      .from('community_sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logDbError('communityController: getSites', error);
      return res.status(500).json({ success: false, error: 'Could not fetch site reports' });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error in getSites:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// 2. Observation Reports
async function submitObservation(req, res) {
  const { project_id, comments, latitude, longitude, photo_url } = req.body;
  if (!comments || !latitude || !longitude) {
    return res.status(400).json({ success: false, error: 'Comments and coordinates are required' });
  }
  const payload = {
    user_id: req.user.id,
    reporter_name: req.user.name || 'Community Member',
    project_id: project_id || null,
    comments,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    photo_url: photo_url || null
  };
  return handleInsert('community_observations', payload, 'communityController: submitObservation', res);
}

async function getObservations(req, res) {
  try {
    const { data, error } = await supabase
      .from('community_observations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logDbError('communityController: getObservations', error);
      return res.status(500).json({ success: false, error: 'Could not fetch observations' });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error in getObservations:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// 3. Project Validations
async function submitValidation(req, res) {
  const { project_id, exists, work_completed, area_accurate, remarks } = req.body;
  if (!project_id || exists === undefined || work_completed === undefined || area_accurate === undefined) {
    return res.status(400).json({ success: false, error: 'Validation checklist responses are required' });
  }
  const payload = {
    user_id: req.user.id,
    project_id,
    reporter_name: req.user.name || 'Community Observer',
    exists: !!exists,
    work_completed: !!work_completed,
    area_accurate: !!area_accurate,
    remarks: remarks || ''
  };
  return handleInsert('community_validations', payload, 'communityController: submitValidation', res);
}

async function getValidationsForProject(req, res) {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabase
      .from('community_validations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      logDbError('communityController: getValidationsForProject', error);
      return res.status(500).json({ success: false, error: 'Could not fetch project validations' });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error in getValidationsForProject:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// 4. Complaints / Issue Reporting
async function submitComplaint(req, res) {
  const { issue_type, description, latitude, longitude, severity, photo_url } = req.body;
  if (!issue_type || !description || !latitude || !longitude) {
    return res.status(400).json({ success: false, error: 'Issue type, description, and coordinates are required' });
  }
  const payload = {
    user_id: req.user.id,
    reporter_name: req.user.name || 'Community Member',
    issue_type,
    description,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    severity: severity || 'medium',
    photo_url: photo_url || null,
    status: 'open'
  };
  return handleInsert('community_complaints', payload, 'communityController: submitComplaint', res);
}

async function getComplaints(req, res) {
  try {
    const { data, error } = await supabase
      .from('community_complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logDbError('communityController: getComplaints', error);
      return res.status(500).json({ success: false, error: 'Could not fetch complaints list' });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error in getComplaints:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// 5. Activity Participation Drives
async function submitActivity(req, res) {
  const { activity_type, title, description, event_date, volunteers_count } = req.body;
  if (!activity_type || !title || !event_date) {
    return res.status(400).json({ success: false, error: 'Activity type, title, and event date are required' });
  }
  const payload = {
    user_id: req.user.id,
    organizer_name: req.user.organization_name || req.user.name || 'Local Panchayat',
    activity_type,
    title,
    description: description || '',
    event_date,
    volunteers_count: parseInt(volunteers_count) || 0
  };
  return handleInsert('community_activities', payload, 'communityController: submitActivity', res);
}

async function getActivities(req, res) {
  try {
    const { data, error } = await supabase
      .from('community_activities')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) {
      logDbError('communityController: getActivities', error);
      return res.status(500).json({ success: false, error: 'Could not fetch volunteering activities' });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Server error in getActivities:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// 6. AI Environmental Assistant (Mock Gemini Response)
async function getAiAssistantResponse(req, res) {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, error: 'Question text is required' });
    }

    const normalized = question.toLowerCase();
    let reply = '';

    if (normalized.includes('mangrove') || normalized.includes('swamp') || normalized.includes('forest')) {
      reply = `### 🌊 Why Mangroves are Coastal Superheroes

Mangrove ecosystems are one of the most efficient **Blue Carbon sinks** on Earth. Here is why they are critical:

1. **Carbon Sequestration**: While they occupy only **0.1% of the Earth's surface**, they bury carbon at rate up to **10 times faster** than terrestrial rainforests. Most of this carbon is locked in their waterlogged, oxygen-poor soils, preventing decay and holding carbon for thousands of years.
2. **Coastal Shielding**: Mangrove dense prop-roots act as a physical buffer, absorbing up to **66% of wave energy**, which protects coastal panchayats from storm surges, cyclones, and rapid erosion.
3. **Biodiversity Guardians**: They act as critical nurseries for local fish, crabs, and shrimp species, supporting the livelihoods of local fishing communities.

*Recommended action: Keep an eye out for any illegal mangrove cutting or logging in your area and report it immediately in the Complaints tab.*`;
    } else if (normalized.includes('credit') || normalized.includes('token') || normalized.includes('finance') || normalized.includes('money')) {
      reply = `### 🪙 Understanding Blue Carbon Credits

A **Blue Carbon Credit** is a financial instrument representing the removal of **one metric ton of carbon dioxide equivalent (tCO2e)** from the atmosphere through coastal restoration.

* **Registry Dynamics**: When an NGO restores a site (e.g., planting mangroves), our platform calculates the carbon absorption yield (averaging **12.5 credits/hectare/year**).
* **Auditor Verification**: Field observations and drone imagery are submitted. Auditors review these metrics to confirm survival rates.
* **Ledger Minting**: Once approved, the carbon credits are minted as ERC-1155 tokens on the Polygon Amoy blockchain. 
* **Retirement**: Corporate buyers purchase and "retire" (burn) these tokens to offset their carbon footprint, channeling funds back to NGOs and local panchayats.`;
    } else if (normalized.includes('protect') || normalized.includes('help') || normalized.includes('conserve') || normalized.includes('community')) {
      reply = `### 🤝 Active Coastal Conservation Actions for Villagers

As a coastal panchayat or community member, you are on the frontlines of marine conservation. Here are active steps you can take today:

* **Site Selection**: Use the **Site Suggestions** tab to report barren coastlines or mudflats that would be ideal for mangrove plantations or seagrass restoration.
* **Continuous Monitoring**: Post periodic logs in the **Observations** tab. Details about water salinity, tidal flooding, and sapling survival rates form a continuous feedback loop for ecologists.
* **Participate & Track**: Organize and record community activities like plastic cleanups, local seed plantation drives, and school awareness campaigns in the **Participation Logs**.
* **Report Violations**: Immediately flag oil spills, illegal cutting, or waste dumping. Auditors and admins review complaints directly and can coordinate enforcement.`;
    } else {
      reply = `### 🌿 BlueCarbon-Registry Environmental Assistant

Hello! I am your local AI environmental guide. I can help answer questions about coastal conservation and registry mechanics:

* Try asking: *"Why are mangroves important for carbon capture?"*
* Try asking: *"How do blue carbon credits work?"*
* Try asking: *"How can local communities participate in carbon forestry?"*

You can also click anywhere on the Map in the **AI Suggestions** panel to obtain localized planting species recommendations based on GPS coordinates!`;
    }

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error('Server error in getAiAssistantResponse:', err);
    return res.status(500).json({ success: false, error: 'AI Assistant service unavailable' });
  }
}

// 7. AI Restoration Species Suggestion (Mock Gemini Species recommendation based on coordinates)
async function getRestorationSuggestions(req, res) {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Latitude and Longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Provide localized species suggestions based on coordinate bounds
    // (e.g. simulate detecting salinity levels or mud conditions based on coordinates)
    let species = 'Rhizophora mucronata (Red Mangrove)';
    let survival = 'High (89%)';
    let type = 'mangrove';
    let notes = 'Ideal for low-to-mid intertidal mudflats. Requires soft silty soils and daily tidal inundation.';
    let plantingAdvice = 'Plant propagules vertically in mud at a depth of 5-10cm. Space seedlings 1.5 meters apart.';

    if (lat > 14.0 && lat < 15.0) {
      // Simulate Aghanashini Estuary / Karnataka coast conditions
      species = 'Avicennia marina (Grey Mangrove)';
      survival = 'Very High (93%)';
      type = 'mangrove';
      notes = 'Highly salt-tolerant species. Excellent for sandy-clay banks and high intertidal zones.';
      plantingAdvice = 'Collect mature yellowing seed pods. Plant in well-drained silt bags before transplanting during the monsoon tide.';
    } else if (lng > 74.0 && lng < 75.0 && lat < 13.5) {
      // Simulate Seagrass meadows indicators
      species = 'Halophila ovalis (Spoon Seagrass)';
      survival = 'Moderate (78%)';
      type = 'seagrass';
      notes = 'Submerged estuarine sandy loam. Prefers clear water columns with low turbidity for optimal light penetration.';
      plantingAdvice = 'Secure seagrass sods using small bamboo stakes or anchors to prevent tidal current uprooting during establishing phases.';
    } else if (lat > 21.0 && lat < 23.0) {
      // Simulate Sundarbans delta conditions
      species = 'Heritiera fomes (Sundari Tree)';
      survival = 'High (86%)';
      type = 'mangrove';
      notes = 'Characteristic freshwater-loving mangrove of the Sundarbans. Ideal for low-salinity clay soils.';
      plantingAdvice = 'Propagate via nursery-grown seedlings. Transplant during low-tide cycles when saplings are 30cm tall.';
    }

    return res.status(200).json({
      success: true,
      data: {
        latitude: lat,
        longitude: lng,
        restoration_type: type,
        recommended_species: species,
        estimated_survival_rate: survival,
        soil_type: type === 'seagrass' ? 'Submerged sandy loam' : 'Clayey-silt mud',
        notes,
        planting_advice: plantingAdvice
      }
    });
  } catch (err) {
    console.error('Server error in getRestorationSuggestions:', err);
    return res.status(500).json({ success: false, error: 'AI Suggestion service unavailable' });
  }
}

module.exports = {
  reportSite,
  getSites,
  submitObservation,
  getObservations,
  submitValidation,
  getValidationsForProject,
  submitComplaint,
  getComplaints,
  submitActivity,
  getActivities,
  getAiAssistantResponse,
  getRestorationSuggestions
};
