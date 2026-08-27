const bcrypt = require('bcryptjs');
const { dbHelper } = require('../config/db');

const userController = {
  async getAllUsers(req, res) {
    try {
      const { role, department_id, status, search } = req.query;

      let sql = `
        SELECT u.id, u.full_name, u.username, u.email, u.status, u.avatar_url,
               u.role_id, r.name as role_name,
               u.department_id, d.name as department_name, d.code as department_code,
               u.created_at, u.updated_at,
               (SELECT COUNT(*) FROM files f WHERE f.owner_id = u.id AND f.deleted_at IS NULL) as file_count,
               (SELECT COALESCE(SUM(f.size), 0) FROM files f WHERE f.owner_id = u.id AND f.deleted_at IS NULL) as storage_used
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE 1=1
      `;
      const params = [];

      // If user is HOD, restrict to their department (unless they're looking at list of users to share with)
      if (req.user.role_name === 'hod' && !req.query.allow_all) {
        sql += " AND u.department_id = ?";
        params.push(req.user.department_id);
      }

      if (role) {
        sql += " AND r.name = ?";
        params.push(role);
      }

      if (department_id) {
        sql += " AND u.department_id = ?";
        params.push(department_id);
      }

      if (status) {
        sql += " AND u.status = ?";
        params.push(status);
      }

      if (search) {
        sql += " AND (LOWER(u.full_name) LIKE ? OR LOWER(u.username) LIKE ? OR LOWER(u.email) LIKE ?)";
        const term = `%${search.toLowerCase()}%`;
        params.push(term, term, term);
      }

      sql += " ORDER BY u.created_at DESC";

      const users = await dbHelper.all(sql, params);
      res.json({ users });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to retrieve users.' });
    }
  },

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await dbHelper.get(`
        SELECT u.id, u.full_name, u.username, u.email, u.status, u.avatar_url,
               u.role_id, r.name as role_name,
               u.department_id, d.name as department_name, d.code as department_code,
               u.created_at, u.updated_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
      `, [id]);

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get user by id error:', error);
      res.status(500).json({ error: 'Failed to retrieve user.' });
    }
  },

  async createUser(req, res) {
    try {
      const { full_name, username, password, email, role_id, department_id, status } = req.body;

      if (!full_name || !username || !password || !email || !role_id) {
        return res.status(400).json({ error: 'Full name, username, password, email, and role are required.' });
      }

      // Check username / email uniqueness
      const existingUser = await dbHelper.get(
        "SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)",
        [username.trim(), email.trim()]
      );

      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists in the system.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userStatus = status || 'active';

      const result = await dbHelper.run(`
        INSERT INTO users (full_name, username, password_hash, email, role_id, department_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [full_name.trim(), username.trim(), passwordHash, email.trim(), role_id, department_id || null, userStatus]);

      const newUserId = result.lastID;

      // If user is HOD, update department hod_id
      const role = await dbHelper.get("SELECT name FROM roles WHERE id = ?", [role_id]);
      if (role && role.name === 'hod' && department_id) {
        await dbHelper.run("UPDATE departments SET hod_id = ? WHERE id = ?", [newUserId, department_id]);
      }

      // Create a welcome notification
      await dbHelper.run(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `, [newUserId, 'Welcome to FFMS', `Welcome ${full_name}! Your account has been set up successfully.`]);

      // Log activity
      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, 'User Created', department_id || req.user.department_id, JSON.stringify({ created_user_id: newUserId, username, role: role ? role.name : role_id })]
      );

      res.status(201).json({
        message: 'User created successfully.',
        userId: newUserId
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user.' });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { full_name, username, email, role_id, department_id, status } = req.body;

      const existing = await dbHelper.get("SELECT * FROM users WHERE id = ?", [id]);
      if (!existing) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Check collision
      if (username || email) {
        const collision = await dbHelper.get(
          "SELECT id FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND id != ?",
          [username || '', email || '', id]
        );
        if (collision) {
          return res.status(400).json({ error: 'Username or email already taken by another account.' });
        }
      }

      await dbHelper.run(`
        UPDATE users 
        SET full_name = ?,
            username = ?,
            email = ?,
            role_id = ?,
            department_id = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        full_name ? full_name.trim() : existing.full_name,
        username ? username.trim() : existing.username,
        email ? email.trim() : existing.email,
        role_id ? Number(role_id) : existing.role_id,
        department_id ? Number(department_id) : null,
        status || existing.status,
        id
      ]);

      // If user was assigned HOD, update department
      if (role_id && department_id) {
        const role = await dbHelper.get("SELECT name FROM roles WHERE id = ?", [role_id]);
        if (role && role.name === 'hod') {
          await dbHelper.run("UPDATE departments SET hod_id = ? WHERE id = ?", [id, department_id]);
        }
      }

      // Log activity
      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, 'User Modified', department_id || existing.department_id, JSON.stringify({ target_user_id: id, updated_fields: { full_name, username, email, role_id, department_id, status } })]
      );

      res.json({ message: 'User updated successfully.' });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user.' });
    }
  },

  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const user = await dbHelper.get("SELECT * FROM users WHERE id = ?", [id]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      await dbHelper.run(
        "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newStatus, id]
      );

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, `User ${newStatus === 'active' ? 'Enabled' : 'Disabled'}`, user.department_id, JSON.stringify({ target_user_id: id, username: user.username })]
      );

      res.json({ message: `User status changed to ${newStatus}.`, status: newStatus });
    } catch (error) {
      console.error('Toggle status error:', error);
      res.status(500).json({ error: 'Failed to update user status.' });
    }
  },

  async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      if (!new_password || new_password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      const user = await dbHelper.get("SELECT * FROM users WHERE id = ?", [id]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const passwordHash = await bcrypt.hash(new_password, 10);
      await dbHelper.run(
        "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [passwordHash, id]
      );

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, 'User Password Reset', user.department_id, JSON.stringify({ target_user_id: id, username: user.username })]
      );

      res.json({ message: `Password for ${user.full_name} has been reset successfully.` });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password.' });
    }
  },

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await dbHelper.get("SELECT * FROM users WHERE id = ?", [id]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'You cannot delete your own active account.' });
      }

      // Check if user is HOD
      await dbHelper.run("UPDATE departments SET hod_id = NULL WHERE hod_id = ?", [id]);

      // Delete user
      await dbHelper.run("DELETE FROM users WHERE id = ?", [id]);

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, 'User Deleted', user.department_id, JSON.stringify({ deleted_user_id: id, username: user.username })]
      );

      res.json({ message: 'User deleted successfully.' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user.' });
    }
  },

  async getRoles(req, res) {
    try {
      const roles = await dbHelper.all("SELECT * FROM roles ORDER BY id ASC");
      res.json({ roles });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch roles.' });
    }
  }
};

module.exports = userController;
