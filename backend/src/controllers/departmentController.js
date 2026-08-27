const { dbHelper } = require('../config/db');

const departmentController = {
  async getAllDepartments(req, res) {
    try {
      const departments = await dbHelper.all(`
        SELECT d.id, d.name, d.code, d.hod_id, d.created_at,
               u.full_name as hod_name, u.email as hod_email, u.username as hod_username,
               (SELECT COUNT(*) FROM users fu WHERE fu.department_id = d.id AND fu.status = 'active') as faculty_count,
               (SELECT COUNT(*) FROM files f WHERE f.department_id = d.id AND f.deleted_at IS NULL) as file_count,
               (SELECT COALESCE(SUM(f.size), 0) FROM files f WHERE f.department_id = d.id AND f.deleted_at IS NULL) as storage_used
        FROM departments d
        LEFT JOIN users u ON d.hod_id = u.id
        ORDER BY d.name ASC
      `);

      res.json({ departments });
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({ error: 'Failed to retrieve departments.' });
    }
  },

  async getDepartmentById(req, res) {
    try {
      const { id } = req.params;
      const department = await dbHelper.get(`
        SELECT d.id, d.name, d.code, d.hod_id, d.created_at,
               u.full_name as hod_name, u.email as hod_email,
               (SELECT COUNT(*) FROM users fu WHERE fu.department_id = d.id AND fu.status = 'active') as faculty_count,
               (SELECT COUNT(*) FROM files f WHERE f.department_id = d.id AND f.deleted_at IS NULL) as file_count,
               (SELECT COALESCE(SUM(f.size), 0) FROM files f WHERE f.department_id = d.id AND f.deleted_at IS NULL) as storage_used
        FROM departments d
        LEFT JOIN users u ON d.hod_id = u.id
        WHERE d.id = ?
      `, [id]);

      if (!department) {
        return res.status(404).json({ error: 'Department not found.' });
      }

      // Fetch faculty in this department
      const faculty = await dbHelper.all(`
        SELECT u.id, u.full_name, u.username, u.email, u.status, u.avatar_url, r.name as role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.department_id = ?
        ORDER BY u.full_name ASC
      `, [id]);

      res.json({ department, faculty });
    } catch (error) {
      console.error('Get department by id error:', error);
      res.status(500).json({ error: 'Failed to retrieve department.' });
    }
  },

  async createDepartment(req, res) {
    try {
      const { name, code, hod_id } = req.body;

      if (!name || !code) {
        return res.status(400).json({ error: 'Department name and department code are required.' });
      }

      // Check uniqueness
      const existing = await dbHelper.get(
        "SELECT id FROM departments WHERE LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?)",
        [name.trim(), code.trim()]
      );
      if (existing) {
        return res.status(400).json({ error: 'Department name or code already exists.' });
      }

      const result = await dbHelper.run(
        "INSERT INTO departments (name, code, hod_id) VALUES (?, ?, ?)",
        [name.trim(), code.trim().toUpperCase(), hod_id || null]
      );

      const newDeptId = result.lastID;

      // If HOD was specified, make sure that user has hod role and department_id
      if (hod_id) {
        const hodRole = await dbHelper.get("SELECT id FROM roles WHERE name = 'hod'");
        await dbHelper.run(
          "UPDATE users SET department_id = ?, role_id = COALESCE(?, role_id) WHERE id = ?",
          [newDeptId, hodRole ? hodRole.id : null, hod_id]
        );
      }

      // Automatically create root standard folders for this department
      const standardFolders = ['Academic', 'Question Papers', 'Lesson Plans', 'Lab Manuals', 'Research', 'Administration'];
      for (const folderName of standardFolders) {
        await dbHelper.run(
          "INSERT INTO folders (name, parent_folder_id, department_id, created_by) VALUES (?, NULL, ?, ?)",
          [folderName, newDeptId, req.user.id]
        );
      }

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, 'Department Created', newDeptId, JSON.stringify({ name, code })]
      );

      res.status(201).json({ message: 'Department created successfully.', departmentId: newDeptId });
    } catch (error) {
      console.error('Create department error:', error);
      res.status(500).json({ error: 'Failed to create department.' });
    }
  },

  async updateDepartment(req, res) {
    try {
      const { id } = req.params;
      const { name, code, hod_id } = req.body;

      const dept = await dbHelper.get("SELECT * FROM departments WHERE id = ?", [id]);
      if (!dept) {
        return res.status(404).json({ error: 'Department not found.' });
      }

      if (name || code) {
        const collision = await dbHelper.get(
          "SELECT id FROM departments WHERE (LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?)) AND id != ?",
          [name || '', code || '', id]
        );
        if (collision) {
          return res.status(400).json({ error: 'Department name or code is already in use.' });
        }
      }

      await dbHelper.run(`
        UPDATE departments 
        SET name = COALESCE(?, name),
            code = COALESCE(?, code),
            hod_id = COALESCE(?, hod_id)
        WHERE id = ?
      `, [name ? name.trim() : null, code ? code.trim().toUpperCase() : null, hod_id, id]);

      // If HOD was changed
      if (hod_id && hod_id !== dept.hod_id) {
        const hodRole = await dbHelper.get("SELECT id FROM roles WHERE name = 'hod'");
        await dbHelper.run(
          "UPDATE users SET department_id = ?, role_id = COALESCE(?, role_id) WHERE id = ?",
          [id, hodRole ? hodRole.id : null, hod_id]
        );
      }

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, 'Department Modified', id, JSON.stringify({ name, code, hod_id })]
      );

      res.json({ message: 'Department updated successfully.' });
    } catch (error) {
      console.error('Update department error:', error);
      res.status(500).json({ error: 'Failed to update department.' });
    }
  },

  async assignHOD(req, res) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: 'User ID is required to assign as HOD.' });
      }

      const hodRole = await dbHelper.get("SELECT id FROM roles WHERE name = 'hod'");
      await dbHelper.run("UPDATE users SET department_id = ?, role_id = ? WHERE id = ?", [id, hodRole.id, user_id]);
      await dbHelper.run("UPDATE departments SET hod_id = ? WHERE id = ?", [user_id, id]);

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, 'HOD Assigned', id, JSON.stringify({ assigned_user_id: user_id })]
      );

      res.json({ message: 'HOD assigned successfully.' });
    } catch (error) {
      console.error('Assign HOD error:', error);
      res.status(500).json({ error: 'Failed to assign HOD.' });
    }
  },

  async deleteDepartment(req, res) {
    try {
      const { id } = req.params;
      const dept = await dbHelper.get("SELECT * FROM departments WHERE id = ?", [id]);
      if (!dept) {
        return res.status(404).json({ error: 'Department not found.' });
      }

      // Reassign users
      await dbHelper.run("UPDATE users SET department_id = NULL WHERE department_id = ?", [id]);
      await dbHelper.run("DELETE FROM departments WHERE id = ?", [id]);

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, 'Department Deleted', null, JSON.stringify({ name: dept.name, code: dept.code })]
      );

      res.json({ message: 'Department deleted successfully.' });
    } catch (error) {
      console.error('Delete department error:', error);
      res.status(500).json({ error: 'Failed to delete department.' });
    }
  }
};

module.exports = departmentController;
