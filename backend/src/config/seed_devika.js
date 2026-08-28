const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { initDB, dbHelper } = require('./db');
const { saveBuffer } = require('../services/storageService');

function createSamplePdf(title, desc) {
  const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 180 >>\nstream\nBT /F1 16 Tf 50 720 Td (${title}) Tj ET\nBT /F1 12 Tf 50 690 Td (VNR VJIET - Department of Computer Science & Engineering) Tj ET\nBT /F1 10 Tf 50 660 Td (Faculty: Mrs. P. Devika) Tj ET\nBT /F1 10 Tf 50 630 Td (${desc}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000228 00000 n \n0000000307 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n478\n%%EOF`;
  return Buffer.from(content, 'utf-8');
}

function createSampleDoc(title, desc) {
  return Buffer.from(`VALLURUPALLI NAGESWARA RAO VIGNANA JYOTHI INSTITUTE OF ENGINEERING & TECHNOLOGY\nDepartment of Computer Science and Engineering\n\nTitle: ${title}\nFaculty In-Charge: Mrs. P. Devika\nDescription: ${desc}\nAcademic Year: 2025-2026\n\n1. Overview and Objectives\n2. Detailed Course Outcomes & Mapping\n3. Syllabus & Laboratory Exercise Outline\n4. Assessment Rubrics & Evaluation Summary\n`, 'utf-8');
}

async function seedDevikaFiles() {
  console.log('--- Seeding Mrs. P. Devika Academic Files & Google Drive Links ---');
  await initDB();

  const devikaPass = await bcrypt.hash('Faculty@123', 10);
  const adminPass = await bcrypt.hash('Admin@123', 10);

  // 1. Ensure Mrs. P. Devika user exists
  let devikaUser = await dbHelper.get("SELECT * FROM users WHERE username = 'devika' OR full_name LIKE '%Devika%'");
  if (!devikaUser) {
    const res = await dbHelper.run(`
      INSERT INTO users (full_name, username, password_hash, email, role_id, department_id, status)
      VALUES ('Mrs. P. Devika', 'devika', ?, 'p.devika@vnrvjiet.in', 3, 1, 'active')
    `, [devikaPass]);
    devikaUser = await dbHelper.get("SELECT * FROM users WHERE id = ?", [res.lastID]);
  } else {
    await dbHelper.run(`
      UPDATE users 
      SET full_name = 'Mrs. P. Devika', email = 'p.devika@vnrvjiet.in', password_hash = ?
      WHERE id = ?
    `, [devikaPass, devikaUser.id]);
  }

  const userId = devikaUser.id;
  const deptId = 1; // CSE

  // 2. Define the 10 Folders with Drive Links
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

  // 3. Define the 8 Academic Files with Drive Links
  const filesData = [
    {
      id: 1,
      name: 'Course_Outcome_Attainment_Report_2026.docx',
      file_type: 'document',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      folder_name: 'Academic Course Files',
      drive_link: 'https://docs.google.com/document/d/1aZrGqu0sOMcQV_1zoa-ef2rvWSuxumHh/edit?usp=drive_link&ouid=104390348659827826471&rtpof=true&sd=true',
      is_favorite: 1,
      ocr_text: 'VNR VJIET Department of CSE. Course Outcome Attainment Report 2026. Faculty In-Charge: Mrs. P. Devika. Course: Data Structures & Algorithms, AI & Machine Learning. Direct and Indirect CO Assessment Calculation Matrix.'
    },
    {
      id: 2,
      name: 'Faculty_Teaching_Portfolio_Devika.pdf',
      file_type: 'pdf',
      mime_type: 'application/pdf',
      folder_name: 'Academic Course Files',
      drive_link: 'https://drive.google.com/file/d/1VLOYLXAhuPR3OsO9zFn1nk35dunSX3zr/view?usp=drive_link',
      is_favorite: 1,
      ocr_text: 'Faculty Teaching Portfolio - Mrs. P. Devika, Assistant Professor, Department of Computer Science & Engineering, VNR Vignana Jyothi Institute of Engineering & Technology. Academic Qualifications, Pedagogical Innovations, Student Feedback, Course Delivery Summaries.'
    },
    {
      id: 3,
      name: 'Advanced_Data_Structures_Lecture_Notes.docx',
      file_type: 'document',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      folder_name: 'Lecture Notes & Syllabus',
      drive_link: 'https://docs.google.com/document/d/1DkfuhoDid9472fWKfNBiaI9K1jONn6Tz/edit?usp=drive_link&ouid=104390348659827826471&rtpof=true&sd=true',
      is_favorite: 1,
      ocr_text: 'Advanced Data Structures & Algorithms Comprehensive Lecture Notes. Unit 1: AVL Trees, Red-Black Trees, B-Trees. Unit 2: Graph Algorithms, Disjoint Sets, Fibonacci Heaps. Unit 3: Dynamic Programming and Divide-and-Conquer Optimization. Prepared by Mrs. P. Devika.'
    },
    {
      id: 4,
      name: 'Semester_End_Examination_Evaluation_Scheme.pdf',
      file_type: 'pdf',
      mime_type: 'application/pdf',
      folder_name: 'Question Papers & Mid Exam Records',
      drive_link: 'https://drive.google.com/file/d/12succ16Vf6_5OWyvQz1-QtV0tnEAfLUf/view?usp=drive_link',
      is_favorite: 0,
      ocr_text: 'VNR VJIET Autonomous Examination Cell. Semester End Examination Question Paper & Detailed Marking Scheme. Evaluation Guidelines, Step-by-Step Marking Scheme, Key Solutions. Evaluator: Mrs. P. Devika.'
    },
    {
      id: 5,
      name: 'AI_ML_Laboratory_Manual_VNRVJIET.docx',
      file_type: 'document',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      folder_name: 'Lab Manuals & Practical Records',
      drive_link: 'https://docs.google.com/document/d/1m-2JxiISorTM5Te3pYd1M7H3q8TqCwtP/edit?usp=drive_link&ouid=104390348659827826471&rtpof=true&sd=true',
      is_favorite: 1,
      ocr_text: 'Artificial Intelligence & Machine Learning Laboratory Manual. VNR VJIET B.Tech CSE. Experiment 1: A* Algorithm & Best First Search. Experiment 2: Decision Tree Classifier. Experiment 3: Convolutional Neural Networks. Faculty Coordinator: Mrs. P. Devika.'
    },
    {
      id: 6,
      name: 'Student_Project_Evaluation_Rubrics.docx',
      file_type: 'document',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      folder_name: 'Assignments & Student Submissions',
      drive_link: 'https://docs.google.com/document/d/1wyxD-UUqi6pwC0qOcJcSEKJ1dPV_qfDq/edit?usp=drive_link&ouid=104390348659827826471&rtpof=true&sd=true',
      is_favorite: 0,
      ocr_text: 'Major Project Evaluation Rubrics and Assessment Criteria. Problem Definition, Literature Review, Methodology, Implementation, Viva-Voce Performance. Project Review Committee: Mrs. P. Devika.'
    },
    {
      id: 7,
      name: 'Faculty_Development_Program_Report.pdf',
      file_type: 'pdf',
      mime_type: 'application/pdf',
      folder_name: 'Workshops & FDP Certificates',
      drive_link: 'https://drive.google.com/file/d/1aDooxThb-_TwvEy8UQ3fk7B4Potxt9VU/view?usp=drive_link',
      is_favorite: 1,
      ocr_text: 'National Level Faculty Development Program Report on Generative AI & Cloud Computing in Higher Education. Attended by Mrs. P. Devika, VNR VJIET. Key takeaways, certificate of completion, and implementation strategy.'
    },
    {
      id: 8,
      name: 'NBA_Criteria_5_Faculty_Information_Record.docx',
      file_type: 'document',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      folder_name: 'Accreditation & NAAC/NBA Dossiers',
      drive_link: 'https://docs.google.com/document/d/1YcA4hMs4OOWP7kpnmrGEm6JPYfj2itf_/edit?usp=drive_link&ouid=104390348659827826471&rtpof=true&sd=true',
      is_favorite: 1,
      ocr_text: 'National Board of Accreditation (NBA) Tier-1 Criteria 5 Faculty Information and Contributions. Faculty Cadre Ratio, Faculty Retention, FDP Participations, Publications, Research Grants. Faculty: Mrs. P. Devika.'
    }
  ];

  for (const item of filesData) {
    const targetFolder = await dbHelper.get("SELECT id FROM folders WHERE name = ?", [item.folder_name]);
    const folderId = targetFolder ? targetFolder.id : null;

    let buf;
    if (item.file_type === 'pdf') {
      buf = createSamplePdf(item.name, item.ocr_text);
    } else {
      buf = createSampleDoc(item.name, item.ocr_text);
    }

    const saved = saveBuffer(buf, item.name);

    const existingFile = await dbHelper.get("SELECT id FROM files WHERE name = ?", [item.name]);
    if (existingFile) {
      await dbHelper.run(`
        UPDATE files 
        SET folder_id = ?, owner_id = ?, department_id = ?, size = ?,
            storage_path = ?, drive_link = ?, extracted_text = ?, is_favorite = ?,
            ocr_status = 'completed'
        WHERE id = ?
      `, [folderId, userId, deptId, saved.size, saved.storedFilename, item.drive_link, item.ocr_text, item.is_favorite, existingFile.id]);
    } else {
      await dbHelper.run(`
        INSERT INTO files (
          id, name, original_name, file_type, mime_type, size,
          storage_path, folder_id, owner_id, department_id,
          version, ocr_status, extracted_text, is_favorite, drive_link
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          1, 'completed', ?, ?, ?
        )
      `, [
        item.id, item.name, item.name, item.file_type, item.mime_type, saved.size,
        saved.storedFilename, folderId, userId, deptId,
        item.ocr_text, item.is_favorite, item.drive_link
      ]);

      await dbHelper.run(`
        INSERT INTO file_versions (file_id, version_number, storage_path, size, uploaded_by, note)
        VALUES (?, 1, ?, ?, ?, 'Initial official document upload')
      `, [item.id, saved.storedFilename, saved.size, userId]);
    }
  }

  console.log('Mrs. P. Devika files and folders successfully seeded!');
}

if (require.main === module) {
  seedDevikaFiles().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seedDevikaFiles;
