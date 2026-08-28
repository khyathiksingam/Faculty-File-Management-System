const bcrypt = require('bcryptjs');
const { initDB, dbHelper } = require('./db');

async function seed() {
  console.log('--- Initializing Clean College Database (Single Department) ---');
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
        1024, 
        'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,gif,svg,mp4,mov,avi,mp3,wav,zip,rar'
      )
    `);
  }

  // 3. Keep ONLY 1 Department: CSE- (CYS, DS) and AI&DS (Code: CSE)
  await dbHelper.run("DELETE FROM departments WHERE id != 1 OR name LIKE '%Electronics%' OR name LIKE '%Information Technology%'");
  const existingDept = await dbHelper.get("SELECT * FROM departments WHERE id = 1");
  if (existingDept) {
    await dbHelper.run("UPDATE departments SET name = 'CSE- (CYS, DS) and AI&DS', code = 'CSE' WHERE id = 1");
  } else {
    await dbHelper.run("INSERT INTO departments (id, name, code) VALUES (1, 'CSE- (CYS, DS) and AI&DS', 'CSE')");
  }

  // 4. Seed Devika Admin User & Link to Department 1
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
      SET full_name = 'Potta Devika', email = 'p.devika@vnrvjiet.in', department_id = 1
      WHERE id = ?
    `, [existingUser.id]);
  }

  // Ensure all users and files are linked to Department 1
  await dbHelper.run("UPDATE users SET department_id = 1");
  await dbHelper.run("UPDATE files SET department_id = 1, folder_id = NULL");
  await dbHelper.run("DELETE FROM folders");

  console.log('Database initialized with only 1 department: CSE- (CYS, DS) and AI&DS');
}

module.exports = seed;
