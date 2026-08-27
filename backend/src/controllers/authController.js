const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbHelper } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const authController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const user = await dbHelper.get(`
        SELECT u.*, r.name as role_name, d.name as department_name, d.code as department_code
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE LOWER(u.username) = LOWER(?) OR LOWER(u.email) = LOWER(?)
      `, [username.trim(), username.trim()]);

      if (!user) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
      }

      if (user.status === 'disabled') {
        return res.status(403).json({ error: 'Your account is disabled. Please contact the college administrator.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
      }

      // Generate JWT Token (valid for 7 days)
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role_name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Record session in DB
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await dbHelper.run(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)",
        [user.id, token, expiresAt]
      );

      // Log activity
      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [user.id, 'User Login', user.department_id, JSON.stringify({ ip: req.ip, userAgent: req.headers['user-agent'] })]
      );

      const { password_hash, ...userProfile } = user;
      res.json({
        message: 'Login successful',
        token,
        user: userProfile
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  },

  async me(req, res) {
    try {
      const user = await dbHelper.get(`
        SELECT u.id, u.full_name, u.username, u.email, u.status, u.avatar_url,
               u.role_id, r.name as role_name,
               u.department_id, d.name as department_name, d.code as department_code,
               u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
      `, [req.user.id]);

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { full_name, email, avatar_url } = req.body;
      const userId = req.user.id;

      if (!full_name || !email) {
        return res.status(400).json({ error: 'Full name and email are required.' });
      }

      // Check email collision
      const existing = await dbHelper.get(
        "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?",
        [email.trim(), userId]
      );
      if (existing) {
        return res.status(400).json({ error: 'Email is already in use by another account.' });
      }

      await dbHelper.run(
        "UPDATE users SET full_name = ?, email = ?, avatar_url = COALESCE(?, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [full_name.trim(), email.trim(), avatar_url || null, userId]
      );

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [userId, 'Profile Updated', req.user.department_id, JSON.stringify({ full_name, email })]
      );

      res.json({ message: 'Profile updated successfully.' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      const user = await dbHelper.get("SELECT password_hash FROM users WHERE id = ?", [userId]);
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password does not match.' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await dbHelper.run(
        "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newHash, userId]
      );

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [userId, 'Password Changed', req.user.department_id, JSON.stringify({})]
      );

      res.json({ message: 'Password changed successfully.' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password.' });
    }
  },

  async logout(req, res) {
    try {
      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, 'User Logout', req.user.department_id, JSON.stringify({})]
      );
      res.json({ message: 'Logged out successfully.' });
    } catch (error) {
      res.json({ message: 'Logged out successfully.' });
    }
  }
};

module.exports = authController;
