const supabase = require('../config/supabase');

/**
 * Middleware to verify Supabase JWT and attach user and role to the request
 */
async function protect(req, res, next) {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Not authorized, token missing' });
    }

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Session expired or invalid token' });
    }

    // Fetch user details and role from public.users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError || !dbUser) {
      // Fallback: If not present in public.users yet (e.g., sync trigger lag or manual insert needed)
      // We will assume community role temporarily or throw an error. Let's return error or log it.
      console.warn(`User ${user.id} not found in public.users table yet.`, dbError);
      
      // Let's create an ephemeral user profile object
      req.user = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'New User',
        role: user.user_metadata?.role || 'community'
      };
      return next();
    }

    // Attach user profile (with database-verified role) to req
    req.user = dbUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Authentication server error' });
  }
}

/**
 * Middleware to restrict access to specific roles
 * @param {Array<string>} roles - Array of authorized roles (e.g., ['admin', 'auditor'])
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Access Denied: Role '${req.user.role}' is not authorized for this resource` 
      });
    }
    
    next();
  };
}

module.exports = {
  protect,
  requireRole
};
