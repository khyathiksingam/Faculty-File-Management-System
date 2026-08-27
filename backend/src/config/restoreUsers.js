const bcrypt = require('bcryptjs');
const { initDB, dbHelper } = require('../config/db');

async function restoreUsers() {
  await initDB();
  const facultyPass = await bcrypt.hash('Faculty@123', 10);

  const ravi = await dbHelper.get("SELECT * FROM users WHERE username = 'dr.ravi'");
  if (!ravi) {
    await dbHelper.run(`
      INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
      VALUES (2, 'Dr. Ravi Kumar', 'dr.ravi', ?, 'dr.ravi@vnrvjiet.in', 2, 1, 'active')
    `, [facultyPass]);
    await dbHelper.run("UPDATE departments SET hod_id = 2 WHERE id = 1");
    console.log("Re-seeded Dr. Ravi Kumar as HOD (CSE)");
  } else {
    console.log("Dr. Ravi exists:", ravi);
  }
}

restoreUsers();
