const bcrypt = require('bcryptjs');
const { initDB, dbHelper } = require('./db');

async function seedDevikaFiles() {
  console.log('--- Setting up Mrs. P. Devika Clean State (No Folders) ---');
  await initDB();

  const devikaPass = await bcrypt.hash('Faculty@123', 10);

  // 1. Ensure Mrs. P. Devika user exists
  let devikaUser = await dbHelper.get("SELECT * FROM users WHERE username = 'devika' OR full_name LIKE '%Devika%'");
  if (!devikaUser) {
    const res = await dbHelper.run(`
      INSERT INTO users (full_name, username, password_hash, email, role_id, department_id, status)
      VALUES ('Potta Devika', 'devika', ?, 'p.devika@vnrvjiet.in', 1, 1, 'active')
    `, [devikaPass]);
  } else {
    await dbHelper.run(`
      UPDATE users 
      SET full_name = 'Potta Devika', email = 'p.devika@vnrvjiet.in', password_hash = ?
      WHERE id = ?
    `, [devikaPass, devikaUser.id]);
  }

  // 2. Clear all folders and unlink files
  await dbHelper.run('UPDATE files SET folder_id = NULL');
  await dbHelper.run('DELETE FROM folders');

  console.log('All folders deleted. Clean root state established.');
}

if (require.main === module) {
  seedDevikaFiles().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seedDevikaFiles;
