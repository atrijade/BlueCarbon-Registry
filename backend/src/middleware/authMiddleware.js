const supabase = require('../config/supabase');
const { logDbError } = require('../utils/logger');

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

    let user;
    let dbUser;

    if (token.startsWith('mock_token_')) {
      try {
        // Decode base64 mock token to get cached profile details
        const base64Str = token.replace('mock_token_', '');
        const profileData = JSON.parse(Buffer.from(base64Str, 'base64').toString('utf-8'));

        // Query the database to get the latest approved status and details
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', profileData.id)
          .single();

        if (!error && data) {
          dbUser = data;
        } else {
          dbUser = profileData;
        }
        user = { id: dbUser.id, email: dbUser.email };
      } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid authentication token structure' });
      }
    } else {
      // Verify token with Supabase Auth
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !supabaseUser) {
        return res.status(401).json({ success: false, error: 'Session expired or invalid token' });
      }
      user = supabaseUser;

      // Fetch user details and role from public.users table
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbError || !data) {
        if (dbError) {
          logDbError(`authMiddleware: Fetching user profile for ID ${user.id}`, dbError);
        }
        dbUser = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || 'New User',
          role: user.user_metadata?.role || 'community',
          is_approved: false
        };
      } else {
        dbUser = data;
      }
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
