const supabase = require('../config/supabase');

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
        status: 'pending' // default
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error('Error creating project:', projectError);
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
        console.error('Error uploading project images:', imgError);
        // We don't fail the whole request, but return a message
      } else {
        insertedImages = imgData;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully for verification',
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
 * Get projects submitted by the logged-in user
 */
async function getMyProjects(req, res) {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        images:project_images(*)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user projects:', error);
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
      console.error('Error fetching all projects:', error);
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
      console.error('Error fetching project detail:', error);
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
  getMyProjects,
  getAllProjects,
  getProjectById
};
