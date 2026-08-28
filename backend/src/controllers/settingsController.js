const { dbHelper } = require('../config/db');

const DEFAULT_COLLEGE = 'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology';
const DEFAULT_SYSTEM = 'Faculty File Management System';
const DEFAULT_TYPES = 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,gif,svg,mp4,mov,avi,mp3,wav,zip,rar';

const settingsController = {
  async getSettings(req, res) {
    try {
      let settings = await dbHelper.get("SELECT * FROM system_settings ORDER BY id ASC LIMIT 1");
      if (!settings) {
        await dbHelper.run(`
          INSERT INTO system_settings (college_name, system_name, max_upload_size_mb, allowed_file_types)
          VALUES (?, ?, 100, ?)
        `, [DEFAULT_COLLEGE, DEFAULT_SYSTEM, DEFAULT_TYPES]);
        settings = await dbHelper.get("SELECT * FROM system_settings ORDER BY id ASC LIMIT 1");
      }
      res.json({ settings });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to retrieve system settings.' });
    }
  },

  async updateSettings(req, res) {
    try {
      const {
        college_name,
        system_name,
        college_logo,
        system_logo,
        max_upload_size_mb,
        allowed_file_types
      } = req.body;

      const finalCollegeName = (college_name && college_name.trim()) ? college_name.trim() : DEFAULT_COLLEGE;
      const finalSystemName = (system_name && system_name.trim()) ? system_name.trim() : DEFAULT_SYSTEM;
      const finalLogo = college_logo || '';
      const finalSysLogo = system_logo || '';
      const finalSize = Number(max_upload_size_mb) || 100;
      const finalTypes = (allowed_file_types && allowed_file_types.trim()) ? allowed_file_types.trim() : DEFAULT_TYPES;

      let settings = await dbHelper.get("SELECT id FROM system_settings ORDER BY id ASC LIMIT 1");
      if (!settings) {
        await dbHelper.run(`
          INSERT INTO system_settings (college_name, system_name, college_logo, system_logo, max_upload_size_mb, allowed_file_types)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          finalCollegeName,
          finalSystemName,
          finalLogo,
          finalSysLogo,
          finalSize,
          finalTypes
        ]);
      } else {
        await dbHelper.run(`
          UPDATE system_settings 
          SET college_name = ?,
              system_name = ?,
              college_logo = ?,
              system_logo = ?,
              max_upload_size_mb = ?,
              allowed_file_types = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          finalCollegeName,
          finalSystemName,
          finalLogo,
          finalSysLogo,
          finalSize,
          finalTypes,
          settings.id
        ]);
      }

      await dbHelper.run(`
        INSERT INTO activity_logs (user_id, action, metadata)
        VALUES (?, 'System Settings Updated', ?)
      `, [req.user.id, JSON.stringify({ college_name: finalCollegeName, system_name: finalSystemName })]);

      const updated = await dbHelper.get("SELECT * FROM system_settings ORDER BY id ASC LIMIT 1");
      res.json({ message: 'Settings updated successfully.', settings: updated });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: error.message || 'Failed to update settings.' });
    }
  },

  async backupDatabase(req, res) {
    try {
      const path = require('path');
      const fs = require('fs');
      const DB_FILE = path.resolve(__dirname, '../../data/ffms.sqlite');
      if (!fs.existsSync(DB_FILE)) {
        return res.status(404).json({ error: 'Database file not found.' });
      }
      res.setHeader('Content-Disposition', 'attachment; filename="ffms_college_backup.sqlite"');
      res.setHeader('Content-Type', 'application/x-sqlite3');
      const fileStream = fs.createReadStream(DB_FILE);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Backup database error:', error);
      res.status(500).json({ error: 'Failed to create database backup.' });
    }
  },

  async restoreDatabase(req, res) {
    try {
      const path = require('path');
      const fs = require('fs');
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload a valid SQLite backup file.' });
      }
      const DB_FILE = path.resolve(__dirname, '../../data/ffms.sqlite');
      fs.copyFileSync(req.file.path, DB_FILE);
      try { fs.unlinkSync(req.file.path); } catch (e) {}

      res.json({ success: true, message: 'Database successfully restored from backup! Please refresh the page.' });
    } catch (error) {
      console.error('Restore database error:', error);
      res.status(500).json({ error: 'Failed to restore database.' });
    }
  }
};

module.exports = settingsController;
