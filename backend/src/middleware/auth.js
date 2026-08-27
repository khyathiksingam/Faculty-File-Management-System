const jwt = require('jsonwebtoken');
const { dbHelper } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ffms_secret_college_key_2026_super_secure';

/**
 * Middleware to authenticate requests via Bearer token
 */
async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token) {
      // Allow token in query param for downloads/previews
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    // Fetch fresh user data including role and department
    const user = await dbHelper.get(`
      SELECT u.id, u.full_name, u.username, u.email, u.status, u.avatar_url,
             u.role_id, r.name as role_name,
             u.department_id, d.name as department_name, d.code as department_code
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [decoded.id]);

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been disabled. Please contact the administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Authentication processing error.' });
  }
}

/**
 * Require one of the specified roles
 * @param  {...string} roles - e.g. 'admin', 'hod', 'faculty'
 */
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({ 
        error: `Access denied. Requires one of: [${roles.join(', ')}]. Your role is ${req.user.role_name}.` 
      });
    }
    next();
  };
}

/**
 * Check if the user is authorized to access/modify a specific file
 * @param {'view' | 'download' | 'edit' | 'delete'} requiredPermission
 */
async function checkFileAccess(fileId, user, requiredPermission = 'view') {
  if (!fileId || !user) return false;

  // Admin has full access to all files
  if (user.role_name === 'admin') return true;

  const file = await dbHelper.get(`
    SELECT f.*, d.name as department_name
    FROM files f
    LEFT JOIN departments d ON f.department_id = d.id
    WHERE f.id = ?
  `, [fileId]);

  if (!file) return false;

  // Owner has full control
  if (file.owner_id === user.id) return true;

  // HOD has access to files in their department
  if (user.role_name === 'hod' && user.department_id && file.department_id === user.department_id) {
    return true;
  }

  // Check explicit direct sharing with user
  const directShare = await dbHelper.get(`
    SELECT permission FROM shared_files
    WHERE file_id = ? AND shared_with_user = ?
  `, [fileId, user.id]);

  if (directShare) {
    if (requiredPermission === 'view') return true;
    if (requiredPermission === 'download' && ['view_download', 'edit'].includes(directShare.permission)) return true;
    if (requiredPermission === 'edit' && directShare.permission === 'edit') return true;
  }

  // Check department-wide sharing
  if (user.department_id) {
    const deptShare = await dbHelper.get(`
      SELECT permission FROM shared_files
      WHERE file_id = ? AND shared_with_department = ?
    `, [fileId, user.department_id]);

    if (deptShare) {
      if (requiredPermission === 'view') return true;
      if (requiredPermission === 'download' && ['view_download', 'edit'].includes(deptShare.permission)) return true;
      if (requiredPermission === 'edit' && deptShare.permission === 'edit') return true;
    }
  }

  // Check custom file_permissions table
  const customPerm = await dbHelper.get(`
    SELECT permission_type FROM file_permissions
    WHERE file_id = ? AND user_id = ?
  `, [fileId, user.id]);

  if (customPerm) {
    if (customPerm.permission_type === 'full') return true;
    if (requiredPermission === 'view') return true;
    if (requiredPermission === 'download' && ['download', 'edit', 'delete'].includes(customPerm.permission_type)) return true;
    if (requiredPermission === 'edit' && customPerm.permission_type === 'edit') return true;
    if (requiredPermission === 'delete' && customPerm.permission_type === 'delete') return true;
  }

  return false;
}

module.exports = {
  JWT_SECRET,
  authenticate,
  requireRoles,
  checkFileAccess
};
