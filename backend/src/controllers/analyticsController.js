const { dbHelper } = require('../config/db');

const analyticsController = {
  async getDashboardStats(req, res) {
    try {
      const user = req.user;

      if (user.role_name === 'admin') {
        // Admin Dashboard Metrics
        const totalFaculty = await dbHelper.get("SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'faculty' AND u.status = 'active'");
        const totalHods = await dbHelper.get("SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'hod' AND u.status = 'active'");
        const totalDepts = await dbHelper.get("SELECT COUNT(*) as count FROM departments");
        const totalFiles = await dbHelper.get("SELECT COUNT(*) as count FROM files WHERE deleted_at IS NULL");
        const totalStorage = await dbHelper.get("SELECT COALESCE(SUM(size), 0) as bytes FROM files WHERE deleted_at IS NULL");
        
        // Files uploaded today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const uploadedToday = await dbHelper.get(
          "SELECT COUNT(*) as count FROM files WHERE created_at >= ? AND deleted_at IS NULL",
          [todayStart.toISOString()]
        );

        // Recent activity
        const recentActivity = await dbHelper.all(`
          SELECT a.*, u.full_name as user_name, u.username, d.name as department_name
          FROM activity_logs a
          LEFT JOIN users u ON a.user_id = u.id
          LEFT JOIN departments d ON a.department_id = d.id
          ORDER BY a.created_at DESC
          LIMIT 8
        `);

        // Recent uploaded files
        const recentFiles = await dbHelper.all(`
          SELECT f.id, f.name, f.file_type, f.size, f.created_at, u.full_name as owner_name, d.name as department_name
          FROM files f
          JOIN users u ON f.owner_id = u.id
          LEFT JOIN departments d ON f.department_id = d.id
          WHERE f.deleted_at IS NULL
          ORDER BY f.created_at DESC
          LIMIT 6
        `);

        return res.json({
          role: 'admin',
          stats: {
            totalFaculty: totalFaculty.count,
            totalHods: totalHods.count,
            totalDepartments: totalDepts.count,
            totalFiles: totalFiles.count,
            totalStorageBytes: totalStorage.bytes,
            filesUploadedToday: uploadedToday.count,
            storageQuotaBytes: 20 * 1024 * 1024 * 1024 // 20 GB default quota
          },
          recentActivity,
          recentFiles
        });
      } else if (user.role_name === 'hod') {
        // HOD Dashboard Metrics
        const deptId = user.department_id;
        const deptFaculty = await dbHelper.get("SELECT COUNT(*) as count FROM users WHERE department_id = ? AND status = 'active'", [deptId]);
        const deptFiles = await dbHelper.get("SELECT COUNT(*) as count FROM files WHERE department_id = ? AND deleted_at IS NULL", [deptId]);
        const deptStorage = await dbHelper.get("SELECT COALESCE(SUM(size), 0) as bytes FROM files WHERE department_id = ? AND deleted_at IS NULL", [deptId]);
        
        const sharedFiles = await dbHelper.get(`
          SELECT COUNT(DISTINCT file_id) as count 
          FROM shared_files 
          WHERE shared_with_department = ? OR shared_with_user = ?
        `, [deptId, user.id]);

        const recentUploads = await dbHelper.all(`
          SELECT f.id, f.name, f.file_type, f.size, f.created_at, u.full_name as owner_name
          FROM files f
          JOIN users u ON f.owner_id = u.id
          WHERE f.department_id = ? AND f.deleted_at IS NULL
          ORDER BY f.created_at DESC
          LIMIT 6
        `, [deptId]);

        const deptActivity = await dbHelper.all(`
          SELECT a.*, u.full_name as user_name, u.username
          FROM activity_logs a
          JOIN users u ON a.user_id = u.id
          WHERE a.department_id = ?
          ORDER BY a.created_at DESC
          LIMIT 8
        `, [deptId]);

        return res.json({
          role: 'hod',
          stats: {
            departmentFaculty: deptFaculty.count,
            departmentFiles: deptFiles.count,
            departmentStorageBytes: deptStorage.bytes,
            sharedFilesCount: sharedFiles.count,
            departmentName: user.department_name
          },
          recentUploads,
          deptActivity
        });
      } else {
        // Faculty Dashboard Metrics
        const myFiles = await dbHelper.get("SELECT COUNT(*) as count FROM files WHERE owner_id = ? AND deleted_at IS NULL", [user.id]);
        const myStorage = await dbHelper.get("SELECT COALESCE(SUM(size), 0) as bytes FROM files WHERE owner_id = ? AND deleted_at IS NULL", [user.id]);
        const myFolders = await dbHelper.get("SELECT COUNT(*) as count FROM folders WHERE created_by = ?", [user.id]);
        
        const sharedWithMe = await dbHelper.get(`
          SELECT COUNT(DISTINCT sf.file_id) as count
          FROM shared_files sf
          JOIN files f ON sf.file_id = f.id
          WHERE (sf.shared_with_user = ? OR sf.shared_with_department = ?)
            AND f.deleted_at IS NULL AND f.owner_id != ?
        `, [user.id, user.department_id || -1, user.id]);

        const starredCount = await dbHelper.get("SELECT COUNT(*) as count FROM favorites fav JOIN files f ON fav.file_id = f.id WHERE fav.user_id = ? AND f.deleted_at IS NULL", [user.id]);

        const recentFiles = await dbHelper.all(`
          SELECT f.id, f.name, f.file_type, f.size, f.created_at, f.version,
                 EXISTS(SELECT 1 FROM favorites fav WHERE fav.file_id = f.id AND fav.user_id = ?) as is_starred
          FROM files f
          WHERE (f.owner_id = ? OR f.department_id = ?) AND f.deleted_at IS NULL
          ORDER BY f.created_at DESC
          LIMIT 6
        `, [user.id, user.id, user.department_id || -1]);

        return res.json({
          role: 'faculty',
          stats: {
            totalFiles: myFiles.count,
            storageUsedBytes: myStorage.bytes,
            myFolders: myFolders.count,
            sharedWithMe: sharedWithMe.count,
            starredCount: starredCount.count
          },
          recentFiles
        });
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
    }
  },

  async getStorageAnalytics(req, res) {
    try {
      const user = req.user;
      const isAdmin = user.role_name === 'admin';
      const isHOD = user.role_name === 'hod';

      let filterSql = "WHERE deleted_at IS NULL";
      let filterParams = [];

      if (!isAdmin && isHOD) {
        filterSql += " AND department_id = ?";
        filterParams.push(user.department_id);
      } else if (!isAdmin && !isHOD) {
        filterSql += " AND owner_id = ?";
        filterParams.push(user.id);
      }

      // Total Storage
      const totalStorageRes = await dbHelper.get(
        `SELECT COALESCE(SUM(size), 0) as total_bytes, COUNT(*) as file_count FROM files ${filterSql}`,
        filterParams
      );

      // Storage by Department
      const byDepartment = await dbHelper.all(`
        SELECT d.id, d.name, d.code, 
               COALESCE(SUM(f.size), 0) as storage_bytes,
               COUNT(f.id) as file_count
        FROM departments d
        LEFT JOIN files f ON f.department_id = d.id AND f.deleted_at IS NULL
        GROUP BY d.id, d.name, d.code
        ORDER BY storage_bytes DESC
      `);

      // Storage by File Type Category
      const byType = await dbHelper.all(`
        SELECT file_type, 
               COALESCE(SUM(size), 0) as storage_bytes,
               COUNT(*) as count
        FROM files
        ${filterSql}
        GROUP BY file_type
        ORDER BY storage_bytes DESC
      `, filterParams);

      // Top 10 Largest Files
      const largestFiles = await dbHelper.all(`
        SELECT f.id, f.name, f.file_type, f.size, f.created_at,
               u.full_name as owner_name,
               d.name as department_name
        FROM files f
        JOIN users u ON f.owner_id = u.id
        LEFT JOIN departments d ON f.department_id = d.id
        ${filterSql}
        ORDER BY f.size DESC
        LIMIT 10
      `, filterParams);

      const totalQuota = 20 * 1024 * 1024 * 1024; // 20 GB default

      res.json({
        totalStorageBytes: totalStorageRes.total_bytes,
        totalFiles: totalStorageRes.file_count,
        storageQuotaBytes: totalQuota,
        availableStorageBytes: Math.max(0, totalQuota - totalStorageRes.total_bytes),
        usedPercentage: Math.min(100, Math.round((totalStorageRes.total_bytes / totalQuota) * 100 * 10) / 10),
        byDepartment,
        byType,
        largestFiles
      });
    } catch (error) {
      console.error('Storage analytics error:', error);
      res.status(500).json({ error: 'Failed to retrieve storage analytics.' });
    }
  }
};

module.exports = analyticsController;
