const { initDB, dbHelper } = require('../config/db');

async function updateBranding() {
  await initDB();
  const collegeName = 'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology';
  await dbHelper.run("UPDATE system_settings SET college_name = ?", [collegeName]);
  const row = await dbHelper.get("SELECT * FROM system_settings");
  console.log("Database updated branding:", row);
}

updateBranding();
