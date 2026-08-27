const { dbHelper } = require('../config/db');

const activityController = {
  async getActivityLogs(req, res) {
    try {
      const user = req.user;
      const {
        action,
        user_id,
        department_id,
        start_date,
        end_date,
        search,
        page = 1,
        limit = 50
      } = req.query;

      let sql = `
        SELECT a.id, a.user_id, a.action, a.file_id, a.folder_id, a.department_id,
               a.metadata, a.created_at,
               u.full_name as user_name, u.username, u.email as user_email,
               d.name as department_name, d.code as department_code,
               f.name as file_name,
               fold.name as folder_name
        FROM activity_logs a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN departments d ON a.department_id = d.id
        LEFT JOIN files f ON a.file_id = f.id
        LEFT JOIN folders fold ON a.folder_id = fold.id
        WHERE 1=1
      `;
      const params = [];

      // RBAC
      if (user.role_name === 'faculty') {
        sql += " AND a.user_id = ?";
        params.push(user.id);
      } else if (user.role_name === 'hod') {
        sql += " AND (a.department_id = ? OR a.user_id = ?)";
        params.push(user.department_id || -1, user.id);
      }

      if (action) {
        sql += " AND a.action = ?";
        params.push(action);
      }

      if (user_id) {
        sql += " AND a.user_id = ?";
        params.push(user_id);
      }

      if (department_id) {
        sql += " AND a.department_id = ?";
        params.push(department_id);
      }

      if (start_date) {
        sql += " AND a.created_at >= ?";
        params.push(start_date);
      }

      if (end_date) {
        sql += " AND a.created_at <= ?";
        params.push(end_date + ' 23:59:59');
      }

      if (search) {
        sql += " AND (LOWER(a.action) LIKE ? OR LOWER(u.full_name) LIKE ? OR LOWER(f.name) LIKE ?)";
        const term = `%${search.toLowerCase()}%`;
        params.push(term, term, term);
      }

      sql += " ORDER BY a.created_at DESC";

      // Pagination
      const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
      const countRes = await dbHelper.get(countSql, params);
      const total = countRes ? countRes.total : 0;

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
      const offset = (pageNum - 1) * limitNum;

      sql += ` LIMIT ${limitNum} OFFSET ${offset}`;

      const logs = await dbHelper.all(sql, params);

      // Parse metadata json
      const formattedLogs = logs.map(l => {
        let meta = {};
        try {
          meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata || '{}') : l.metadata;
        } catch (e) {
          meta = {};
        }
        return {
          ...l,
          metadata: meta
        };
      });

      res.json({
        logs: formattedLogs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({ error: 'Failed to retrieve activity logs.' });
    }
  }
};

module.exports = activityController;
