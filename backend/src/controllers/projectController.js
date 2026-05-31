const supabase = require('../config/supabase');
const { logDbError } = require('../utils/logger');

/**
 * Create a new Blue Carbon restoration project
 */
async function createProject(req, res) {
  try {
    const {
      title,
      description,
      location_name,
      latitude,
      longitude,
      area_hectares,
      species,
      plantation_date,
      status, // 'draft' or 'pending'
      restoration_type, // 'mangrove', 'seagrass', 'salt_marsh'
      boundary_polygon, // JSON array of coordinate points
      images // Array of { image_url, image_type }
    } = req.body;

    if (!title || !area_hectares) {
      return res.status(400).json({ success: false, error: 'Title and Area Hectares are required' });
    }

    // Insert project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: req.user.id,
        title,
        description,
        location_name,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        area_hectares: parseFloat(area_hectares),
        species,
        plantation_date: plantation_date || null,
        status: status || 'draft', // default to draft
        restoration_type: restoration_type || null,
        boundary_polygon: boundary_polygon || null
      })
      .select()
      .single();

    if (projectError || !project) {
      logDbError('projectController: createProject', projectError);
      return res.status(500).json({ success: false, error: 'Could not create project record' });
    }

    // If there are images, insert them as well
    let insertedImages = [];
    if (images && Array.isArray(images) && images.length > 0) {
      const imagesToInsert = images.map(img => ({
        project_id: project.id,
        image_url: img.image_url,
        image_type: img.image_type || 'field'
      }));

      const { data: imgData, error: imgError } = await supabase
        .from('project_images')
        .insert(imagesToInsert)
        .select();

      if (imgError) {
        logDbError('projectController: createProject images', imgError);
      } else {
        insertedImages = imgData;
      }
    }

    res.status(201).json({
      success: true,
      message: status === 'draft' ? 'Project saved as draft' : 'Project submitted for audit review',
      data: {
        ...project,
        images: insertedImages
      }
    });
  } catch (error) {
    console.error('Create project server error:', error);
    res.status(500).json({ success: false, error: 'Server error during project creation' });
  }
}

/**
 * Update an existing project (useful for completing drafts)
 */
async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location_name,
      latitude,
      longitude,
      area_hectares,
      species,
      plantation_date,
      status, // update 'draft' to 'pending'
      restoration_type,
      boundary_polygon,
      images // Array of { image_url, image_type }
    } = req.body;

    // Fetch the project to verify ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      if (fetchErr && fetchErr.code !== 'PGRST116') {
        logDbError(`projectController: updateProject fetch ID ${id}`, fetchErr);
      }
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized to update this project' });
    }

    // Update project attributes
    const { data: project, error: updateError } = await supabase
      .from('projects')
      .update({
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        location_name: location_name !== undefined ? location_name : existing.location_name,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : existing.latitude,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : existing.longitude,
        area_hectares: area_hectares !== undefined ? parseFloat(area_hectares) : existing.area_hectares,
        species: species !== undefined ? species : existing.species,
        plantation_date: plantation_date !== undefined ? (plantation_date || null) : existing.plantation_date,
        status: status !== undefined ? status : existing.status,
        restoration_type: restoration_type !== undefined ? restoration_type : existing.restoration_type,
        boundary_polygon: boundary_polygon !== undefined ? boundary_polygon : existing.boundary_polygon
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logDbError(`projectController: updateProject update ID ${id}`, updateError);
      return res.status(500).json({ success: false, error: 'Could not update project record' });
    }

    // If images array is supplied, sync it (delete old, insert new)
    if (images && Array.isArray(images)) {
      await supabase
        .from('project_images')
        .delete()
        .eq('project_id', id);

      if (images.length > 0) {
        const imagesToInsert = images.map(img => ({
          project_id: id,
          image_url: img.image_url,
          image_type: img.image_type || 'field'
        }));
        
        await supabase
          .from('project_images')
          .insert(imagesToInsert);
      }
    }

    // Fetch updated images
    const { data: finalImages } = await supabase
      .from('project_images')
      .select('*')
      .eq('project_id', id);

    res.status(200).json({
      success: true,
      message: status === 'pending' ? 'Project draft submitted successfully' : 'Project draft updated',
      data: {
        ...project,
        images: finalImages || []
      }
    });
  } catch (error) {
    console.error('Update project server error:', error);
    res.status(500).json({ success: false, error: 'Server error updating project' });
  }
}

/**
 * Get projects submitted by the logged-in user
 */
async function getMyProjects(req, res) {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        images:project_images(*),
        carbon_credits:carbon_credits(*),
        blockchain_records:blockchain_records(*)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logDbError('projectController: getMyProjects', error);
      return res.status(500).json({ success: false, error: 'Could not retrieve projects' });
    }

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error('Get my projects server error:', error);
    res.status(500).json({ success: false, error: 'Server error fetching projects' });
  }
}

/**
 * Get all projects in the registry
 */
async function getAllProjects(req, res) {
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

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status);
    }

    const { data: projects, error } = await query;

    if (error) {
      logDbError('projectController: getAllProjects', error);
      return res.status(500).json({ success: false, error: 'Could not retrieve registry projects' });
    }

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error('Get all projects server error:', error);
    res.status(500).json({ success: false, error: 'Server error fetching project registry' });
  }
}

/**
 * Get a single project's details including all related data
 */
async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        user:users(name, email, role),
        images:project_images(*),
        verifications:verifications(*, verified_by_user:users(name)),
        carbon_credits:carbon_credits(*),
        blockchain_records:blockchain_records(*),
        ai_reports:ai_reports(*)
      `)
      .eq('id', id)
      .single();

    if (error || !project) {
      if (error && error.code !== 'PGRST116') {
        logDbError(`projectController: getProjectById ID ${id}`, error);
      }
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error('Get project detail server error:', error);
    res.status(500).json({ success: false, error: 'Server error fetching project detail' });
  }
}

module.exports = {
  createProject,
  updateProject,
  getMyProjects,
  getAllProjects,
  getProjectById
};
