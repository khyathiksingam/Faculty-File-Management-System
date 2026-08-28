const bcrypt = require('bcryptjs');
const { initDB, dbHelper } = require('./db');

async function seed() {
  console.log('--- Initializing and Seeding Clean College Database ---');
  await initDB();

  // 1. Seed Roles
  await dbHelper.run("INSERT OR IGNORE INTO roles (id, name) VALUES (1, 'admin'), (2, 'hod'), (3, 'faculty')");

  // 2. Seed System Settings
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
        100, 
        'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,gif,svg,mp4,mov,avi,mp3,wav,zip,rar'
      )
    `);
  }

  // 3. Seed Departments
  await dbHelper.run("INSERT OR IGNORE INTO departments (id, name, code) VALUES (1, 'Computer Science & Engineering Cyber Security (CSE-CYS)', 'CSE-CYS')");
  await dbHelper.run("INSERT OR IGNORE INTO departments (id, name, code) VALUES (2, 'Electronics & Communication', 'ECE')");
  await dbHelper.run("INSERT OR IGNORE INTO departments (id, name, code) VALUES (3, 'Information Technology', 'IT')");

  // 4. Seed Devika Admin User
  const devikaPass = await bcrypt.hash('Faculty@123', 10);
  const existingUser = await dbHelper.get("SELECT * FROM users WHERE username = 'devika' OR username = 'admin'");
  if (!existingUser) {
    await dbHelper.run(`
      INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
      VALUES (1, 'Potta Devika', 'devika', ?, 'p.devika@vnrvjiet.in', 1, 1, 'active')
    `, [devikaPass]);
  } else {
    await dbHelper.run(`
      UPDATE users 
      SET full_name = 'Potta Devika', email = 'p.devika@vnrvjiet.in'
      WHERE id = ?
    `, [existingUser.id]);
  }

  // 5. Seed 10 Google Drive Folders
  const seedDevikaFiles = require('./seed_devika');
  await seedDevikaFiles();

  // Ensure files table is completely clean (0 files)
  await dbHelper.run('DELETE FROM file_versions');
  await dbHelper.run('DELETE FROM shared_files');
  await dbHelper.run('DELETE FROM favorites');
  await dbHelper.run('DELETE FROM files');

  console.log('Database initialized with 0 files and 10 Drive Folders ready.');
}

module.exports = seed;
