const bcrypt = require('bcryptjs');
const { initDB, dbHelper } = require('./db');

async function seedDevikaFiles() {
  console.log('--- Setting up Mrs. P. Devika Clean Folders & User Account ---');
  await initDB();

  const devikaPass = await bcrypt.hash('Faculty@123', 10);

  // 1. Ensure Mrs. P. Devika user exists
  let devikaUser = await dbHelper.get("SELECT * FROM users WHERE username = 'devika' OR full_name LIKE '%Devika%'");
  if (!devikaUser) {
    const res = await dbHelper.run(`
      INSERT INTO users (full_name, username, password_hash, email, role_id, department_id, status)
      VALUES ('Potta Devika', 'devika', ?, 'p.devika@vnrvjiet.in', 1, 1, 'active')
    `, [devikaPass]);
    devikaUser = await dbHelper.get("SELECT * FROM users WHERE id = ?", [res.lastID]);
  } else {
    await dbHelper.run(`
      UPDATE users 
      SET full_name = 'Potta Devika', email = 'p.devika@vnrvjiet.in', password_hash = ?
      WHERE id = ?
    `, [devikaPass, devikaUser.id]);
  }

  const userId = devikaUser.id;
  const deptId = 1; // CSE

  // 2. Define the 10 Folders with Google Drive Cloud Links
  const foldersData = [
    {
      id: 1,
      name: 'Academic Course Files',
      color: 'blue',
      drive_link: 'https://drive.google.com/drive/folders/1GeVXDBPqIXEOfavWI13PWBbfBs4CVZaX?usp=drive_link'
    },
    {
      id: 2,
      name: 'Lecture Notes & Syllabus',
      color: 'cyan',
      drive_link: 'https://drive.google.com/drive/folders/1Vjk59_zfmxFqH9k1wErGtYJSTP9qefn6?usp=drive_link'
    },
    {
      id: 3,
      name: 'Lab Manuals & Practical Records',
      color: 'emerald',
      drive_link: 'https://drive.google.com/drive/folders/1wqPFbJk5HrKRnDBwHvZFQxd6I63CPt1e?usp=drive_link'
    },
    {
      id: 4,
      name: 'Question Papers & Mid Exam Records',
      color: 'red',
      drive_link: 'https://drive.google.com/drive/folders/1plZBs19PpZ0fCq3KOJMmm06iyHK9vHsd?usp=drive_link'
    },
    {
      id: 5,
      name: 'Assignments & Student Submissions',
      color: 'orange',
      drive_link: 'https://drive.google.com/drive/folders/1PGlQlDAf1UAlIC2rMejcVOtPT5bIqd5m?usp=drive_link'
    },
    {
      id: 6,
      name: 'Research Publications & Patents',
      color: 'purple',
      drive_link: 'https://drive.google.com/drive/folders/18o9S-U8KYC3otrJvaEBqh-raYaGVZntS?usp=drive_link'
    },
    {
      id: 7,
      name: 'Curriculum & Lesson Plans',
      color: 'blue',
      drive_link: 'https://drive.google.com/drive/folders/1Fezq_aeEnPcz1vWYTQ3upj9hkd0PHeaH?usp=drive_link'
    },
    {
      id: 8,
      name: 'Workshops & FDP Certificates',
      color: 'amber',
      drive_link: 'https://drive.google.com/drive/folders/1RMkynGDrkoD5t_aTUnbPuOtyr05E94B4?usp=drive_link'
    },
    {
      id: 9,
      name: 'Department Committee Records',
      color: 'indigo',
      drive_link: 'https://drive.google.com/drive/folders/1xm2erGIeTGGdEwKhLjuwVoXI2lw_6ACu?usp=drive_link'
    },
    {
      id: 10,
      name: 'Accreditation & NAAC/NBA Dossiers',
      color: 'purple',
      drive_link: 'https://drive.google.com/drive/folders/10IkxGvLwKORbBO6fikDvsCi5LVD9wWlG?usp=drive_link'
    }
  ];

  for (const f of foldersData) {
    const existing = await dbHelper.get("SELECT * FROM folders WHERE name = ?", [f.name]);
    if (existing) {
      await dbHelper.run(`
        UPDATE folders 
        SET drive_link = ?, color = ?, department_id = ?, created_by = ?
        WHERE id = ?
      `, [f.drive_link, f.color, deptId, userId, existing.id]);
    } else {
      await dbHelper.run(`
        INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color, drive_link)
        VALUES (?, ?, NULL, ?, ?, ?, ?)
      `, [f.id, f.name, deptId, userId, f.color, f.drive_link]);
    }
  }

  // Clear dummy files to maintain clean zero state
  await dbHelper.run('DELETE FROM file_versions');
  await dbHelper.run('DELETE FROM shared_files');
  await dbHelper.run('DELETE FROM favorites');
  await dbHelper.run('DELETE FROM files');

  console.log('Clean zero-file state established with 10 Drive Folders ready.');
}

if (require.main === module) {
  seedDevikaFiles().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seedDevikaFiles;
