const supabase = require('../config/supabase');
const { logDbError } = require('../utils/logger');

/**
 * Fetch list of users awaiting registration approval (NGOs/Communities)
 */
async function getPendingUsers(req, res) {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', false)
      .in('role', ['ngo', 'community'])
      .order('created_at', { ascending: false });

    if (error) {
      logDbError('authController: getPendingUsers', error);
      return res.status(500).json({ success: false, error: 'Could not fetch pending node registrations' });
    }

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get pending users server error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving pending node registrations' });
  }
}

/**
 * Approve a user profile to grant registry access
 */
async function approveUser(req, res) {
  try {
    const { id } = req.params;

    // 1. Fetch user to verify they exist
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !user) {
      if (fetchErr && fetchErr.code !== 'PGRST116') {
        logDbError(`authController: approveUser fetch ID ${id}`, fetchErr);
      }
      return res.status(404).json({ success: false, error: 'User registration not found' });
    }

    // 2. Set is_approved: true in public.users
    const { data: updatedUser, error: updateErr } = await supabase
      .from('users')
      .update({ is_approved: true })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      logDbError(`authController: approveUser update ID ${id}`, updateErr);
      return res.status(500).json({ success: false, error: 'Could not approve node profile' });
    }

    // 3. Update metadata in auth.users as well to keep them aligned
    const { error: authErr } = await supabase.auth.admin.updateUserById(
      id,
      { user_metadata: { is_approved: true } }
    );

    if (authErr) {
      console.warn(`Warning: Could not update Supabase Auth metadata for user ${id}.`, authErr.message);
      // We don't fail the request since public.users is updated and that is what the login flow checks
    }

    res.status(200).json({
      success: true,
      message: 'Node registration approved successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Approve user server error:', error);
    res.status(500).json({ success: false, error: 'Server error during node registration approval' });
  }
}

module.exports = {
  getPendingUsers,
  approveUser
};
