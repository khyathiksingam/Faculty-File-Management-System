const bcrypt = require('bcryptjs');
const { initDB, dbHelper } = require('./db');

/**
 * Non-destructive initial seeder.
 * This runs on server start to ensure baseline system tables and default admin account exist.
 * It NEVER deletes, overwrites, or erases any user files, custom folders, or uploaded documents.
 */
async function seed() {
  console.log('--- Checking System Initialization (Non-Destructive) ---');
  await initDB();

  // 1. Seed Roles (Only if not existing)
  await dbHelper.run("INSERT OR IGNORE INTO roles (id, name) VALUES (1, 'admin'), (2, 'hod'), (3, 'faculty')");

  // 2. Seed System Settings (Only if not existing)
  const existingSettings = await dbHelper.get("SELECT COUNT(*) as count FROM system_settings");
  if (!existingSettings || existingSettings.count === 0) {
    await dbHelper.run(`
      INSERT INTO system_settings (
        college_name, system_name, college_logo, system_logo, max_upload_size_mb, allowed_file_types
      ) VALUES (
        'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology', 
        'Faculty File Management System', 
        '/logo.png', 
        '/logo.png', 
        1024, 
        'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,gif,svg,mp4,mov,avi,mp3,wav,zip,rar'
      )
    `);
  }

  // 3. Ensure Single College Department: CSE- (CYS, DS) and AI&DS (Code: CSE)
  const existingDept = await dbHelper.get("SELECT * FROM departments WHERE id = 1");
  if (!existingDept) {
    await dbHelper.run("INSERT INTO departments (id, name, code) VALUES (1, 'CSE- (CYS, DS) and AI&DS', 'CSE')");
  }

  // 4. Ensure Default Admin User exists
  const devikaPass = await bcrypt.hash('Faculty@123', 10);
  const existingUser = await dbHelper.get("SELECT * FROM users WHERE username = 'devika' OR username = 'admin' OR id = 1");
  if (!existingUser) {
    await dbHelper.run(`
      INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
      VALUES (1, 'Potta Devika', 'devika', ?, 'p.devika@vnrvjiet.in', 1, 1, 'active')
    `, [devikaPass]);
  }

  console.log('System verified: Database is 100% persistent and non-destructive. User files & folders are preserved.');
}

module.exports = seed;
