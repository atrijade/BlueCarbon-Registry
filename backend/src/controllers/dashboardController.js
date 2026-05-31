const supabase = require('../config/supabase');
const { logDbError } = require('../utils/logger');

/**
 * Get dashboard metrics based on user role
 */
async function getDashboardStats(req, res) {
  try {
    const { role, id: userId } = req.user;

    // 1. Fetch overall registry metrics (publicly observable but useful)
    // We get all projects to aggregate statistics in JS to reduce database queries in this MVP
    const { data: allProjects, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, status, area_hectares, title, latitude, longitude, species');

    if (projectError) {
      logDbError('dashboardController: Fetching dashboard projects', projectError);
      return res.status(500).json({ success: false, error: 'Could not fetch dashboard metrics' });
    }

    // 2. Fetch all carbon credits
    const { data: allCredits, error: creditError } = await supabase
      .from('carbon_credits')
      .select('credits, status');

    if (creditError) {
      logDbError('dashboardController: Fetching carbon credits', creditError);
    }

    // Calculations
    const totalCredits = (allCredits || []).reduce((sum, item) => sum + parseFloat(item.credits), 0);
    const activeCredits = (allCredits || [])
      .filter(item => item.status === 'active')
      .reduce((sum, item) => sum + parseFloat(item.credits), 0);

    const verifiedProjects = allProjects.filter(p => p.status === 'verified');
    const pendingProjects = allProjects.filter(p => p.status === 'pending');
    
    const totalHectaresVerified = verifiedProjects.reduce((sum, p) => sum + parseFloat(p.area_hectares || 0), 0);
    const totalHectaresRegistry = allProjects.reduce((sum, p) => sum + parseFloat(p.area_hectares || 0), 0);

    // Filter projects that have coordinates for mapping
    const mapCoordinates = allProjects
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

    // 3. User-specific metrics
    let userMetrics = {};
    if (role === 'ngo' || role === 'community') {
      const userProjects = allProjects.filter(p => p.user_id === userId);
      const userVerified = userProjects.filter(p => p.status === 'verified');
      
      const userHectares = userProjects.reduce((sum, p) => sum + parseFloat(p.area_hectares || 0), 0);
      const userVerifiedHectares = userVerified.reduce((sum, p) => sum + parseFloat(p.area_hectares || 0), 0);

      // Fetch credits for user's projects
      const userProjectIds = userProjects.map(p => p.id);
      let userCreditsCount = 0;
      
      if (userProjectIds.length > 0) {
        const { data: userCredits, error: uCredErr } = await supabase
          .from('carbon_credits')
          .select('credits')
          .in('project_id', userProjectIds);
        
        if (uCredErr) {
          logDbError('dashboardController: Fetching user project credits', uCredErr);
        } else if (userCredits) {
          userCreditsCount = userCredits.reduce((sum, c) => sum + parseFloat(c.credits), 0);
        }
      }

      userMetrics = {
        totalProjects: userProjects.length,
        verifiedProjects: userVerified.length,
        pendingProjects: userProjects.filter(p => p.status === 'pending').length,
        rejectedProjects: userProjects.filter(p => p.status === 'rejected').length,
        totalHectares: userHectares,
        verifiedHectares: userVerifiedHectares,
        creditsIssued: userCreditsCount
      };
    } else if (role === 'admin' || role === 'auditor') {
      userMetrics = {
        pendingQueueCount: pendingProjects.length,
        totalRegistryProjects: allProjects.length,
        verifiedRegistryProjects: verifiedProjects.length,
        totalRegistryHectares: totalHectaresRegistry,
        totalRegistryCredits: totalCredits
      };
    }

    res.status(200).json({
      success: true,
      data: {
        global: {
          totalProjects: allProjects.length,
          verifiedProjects: verifiedProjects.length,
          pendingProjects: pendingProjects.length,
          totalHectaresVerified,
          totalHectaresRegistry,
          totalCreditsIssued: totalCredits,
          activeCredits
        },
        mapCoordinates,
        userMetrics
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving dashboard statistics' });
  }
}

module.exports = {
  getDashboardStats
};
