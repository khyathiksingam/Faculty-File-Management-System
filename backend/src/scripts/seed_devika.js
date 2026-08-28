const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { initDB, dbHelper, saveDB } = require('../config/db');
const { saveBuffer } = require('../services/storageService');

function createMinimalPdfBuffer(title, content) {
  const text = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 120 >>\nstream\nBT /F1 16 Tf 50 720 Td (${title}) Tj ET\nBT /F1 12 Tf 50 690 Td (${content}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000228 00000 n \n0000000307 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n478\n%%EOF`;
  return Buffer.from(text, 'utf-8');
}

function createMinimalDocxBuffer(title, content) {
  const text = `VNR VJIET Faculty Document\n\nTitle: ${title}\n\n${content}\n\nFaculty File Management System - Academic Record 2026`;
  return Buffer.from(text, 'utf-8');
}

async function addDevikaFiles() {
  await initDB();

  // 1. Ensure external_url column exists in files & folders tables
  try {
    await dbHelper.run("ALTER TABLE files ADD COLUMN external_url TEXT;");
  } catch (e) {
    // column already exists
  }

  try {
    await dbHelper.run("ALTER TABLE folders ADD COLUMN external_url TEXT;");
  } catch (e) {
    // column already exists
  }

  // 2. Find or Create User Devika
  let devika = await dbHelper.get("SELECT * FROM users WHERE username = 'dr.devika' OR full_name LIKE '%Devika%'");
  const passHash = await bcrypt.hash('Faculty@123', 10);

  if (!devika) {
    const res = await dbHelper.run(`
      INSERT INTO users (full_name, username, password_hash, email, role_id, department_id, status)
      VALUES ('Dr. Devika', 'dr.devika', ?, 'devika@vnrvjiet.in', 3, 1, 'active')
    `, [passHash]);
    devika = await dbHelper.get("SELECT * FROM users WHERE username = 'dr.devika'");
  }

  const devikaId = devika.id;
  const deptId = devika.department_id || 1;

  console.log(`Configuring files and folders for user ID ${devikaId} (${devika.full_name})...`);

  // 3. Create Root / Category Folders for Devika
  const foldersConfig = [
    {
      name: 'Academic Course Files',
      color: 'blue',
      url: 'https://drive.google.com/drive/folders/1GeVXDBPqIXEOfavWI13PWBbfBs4CVZaX'
    },
    {
      name: 'Lecture Notes & Syllabus',
      color: 'cyan',
      url: 'https://drive.google.com/drive/folders/1Vjk59_zfmxFqH9k1wErGtYJSTP9qefn6'
    },
    {
      name: 'Lab Manuals & Practical Records',
      color: 'emerald',
      url: 'https://drive.google.com/drive/folders/1wqPFbJk5HrKRnDBwHvZFQxd6I63CPt1e'
    },
    {
      name: 'Question Papers & Mid Exam Records',
      color: 'red',
      url: 'https://drive.google.com/drive/folders/1plZBs19PpZ0fCq3KOJMmm06iyHK9vHsd'
    },
    {
      name: 'Assignments & Student Submissions',
      color: 'orange',
      url: 'https://drive.google.com/drive/folders/1PGlQlDAf1UAlIC2rMejcVOtPT5bIqd5m'
    },
    {
      name: 'Research Publications & Patents',
      color: 'purple',
      url: 'https://drive.google.com/drive/folders/18o9S-U8KYC3otrJvaEBqh-raYaGVZntS'
    },
    {
      name: 'Curriculum & Lesson Plans',
      color: 'blue',
      url: 'https://drive.google.com/drive/folders/1Fezq_aeEnPcz1vWYTQ3upj9hkd0PHeaH'
    },
    {
      name: 'Workshops & FDP Certificates',
      color: 'amber',
      url: 'https://drive.google.com/drive/folders/1RMkynGDrkoD5t_aTUnbPuOtyr05E94B4'
    },
    {
      name: 'Department Committee Records',
      color: 'indigo',
      url: 'https://drive.google.com/drive/folders/1xm2erGIeTGGdEwKhLjuwVoXI2lw_6ACu'
    },
    {
      name: 'Accreditation & NAAC/NBA Dossiers',
      color: 'purple',
      url: 'https://drive.google.com/drive/folders/10IkxGvLwKORbBO6fikDvsCi5LVD9wWlG'
    }
  ];

  const folderMap = {};

  for (const f of foldersConfig) {
    let existingFolder = await dbHelper.get(
      "SELECT * FROM folders WHERE name = ? AND created_by = ?",
      [f.name, devikaId]
    );

    if (!existingFolder) {
      await dbHelper.run(
        "INSERT INTO folders (name, parent_folder_id, department_id, created_by, color, external_url) VALUES (?, NULL, ?, ?, ?, ?)",
        [f.name, deptId, devikaId, f.color, f.url]
      );
      existingFolder = await dbHelper.get(
        "SELECT * FROM folders WHERE name = ? AND created_by = ?",
        [f.name, devikaId]
      );
    } else {
      await dbHelper.run(
        "UPDATE folders SET external_url = ? WHERE id = ?",
        [f.url, existingFolder.id]
      );
    }
    folderMap[f.name] = existingFolder.id;
  }

  // 4. Create the 8 Google Docs / Drive Files for Devika
  const filesConfig = [
    {
      name: 'Course_Outcome_Attainment_Report_2026.docx',
      folderName: 'Academic Course Files',
      type: 'document',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://docs.google.com/document/d/1aZrGqu0sOMcQV_1zoa-ef2rvWSuxumHh/edit?usp=drive_link',
      content: 'VALLURUPALLI NAGESWARA RAO VIGNANA JYOTHI INSTITUTE OF ENGINEERING & TECHNOLOGY\nCourse Outcome (CO) and Program Outcome (PO) Attainment Report 2026\nFaculty In-Charge: Dr. Devika\nCourse: Advanced Data Structures & Algorithms\nAssessment Methods: Direct Internal Tests, Assignments, Semester Examination Results.\nTarget Attainment: 85% achieved across all Course Outcomes.',
      note: 'Linked from Google Docs'
    },
    {
      name: 'Faculty_Teaching_Portfolio_Devika.pdf',
      folderName: 'Academic Course Files',
      type: 'pdf',
      mime: 'application/pdf',
      url: 'https://drive.google.com/file/d/1VLOYLXAhuPR3OsO9zFn1nk35dunSX3zr/view?usp=drive_link',
      content: 'Faculty Teaching Portfolio - Dr. Devika\nDepartment of Computer Science & Engineering\nTeaching Philosophy, Course Delivery Methods, Innovative Pedagogy, Student Feedback Ratings 4.8/5.0, Mentorship Logs, and Continuous Quality Improvement Strategies.',
      note: 'Linked from Google Drive'
    },
    {
      name: 'Advanced_Data_Structures_Lecture_Notes.docx',
      folderName: 'Lecture Notes & Syllabus',
      type: 'document',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://docs.google.com/document/d/1DkfuhoDid9472fWKfNBiaI9K1jONn6Tz/edit?usp=drive_link',
      content: 'Lecture Notes: Advanced Data Structures (ADS)\nUnit 1: Red-Black Trees, AVL Trees, Splay Trees\nUnit 2: B-Trees and B+ Trees Indexing\nUnit 3: Priority Queues, Binomial and Fibonacci Heaps\nUnit 4: Disjoint Set Operations and Graph Algorithms\nUnit 5: String Matching Algorithms (KMP, Rabin-Karp, Boyer-Moore).',
      note: 'Linked from Google Docs'
    },
    {
      name: 'Semester_End_Examination_Evaluation_Scheme.pdf',
      folderName: 'Question Papers & Mid Exam Records',
      type: 'pdf',
      mime: 'application/pdf',
      url: 'https://drive.google.com/file/d/12succ16Vf6_5OWyvQz1-QtV0tnEAfLUf/view?usp=drive_link',
      content: 'Semester End Examination (SEE) Evaluation Scheme & Answer Key\nSubject: CS302 - Data Structures & Algorithms\nPrepared by: Dr. Devika\nDetailed step-by-step marking rubrics, algorithm complexity analysis marking criteria, and question-wise grade distribution.',
      note: 'Linked from Google Drive'
    },
    {
      name: 'AI_ML_Laboratory_Manual_VNRVJIET.docx',
      folderName: 'Lab Manuals & Practical Records',
      type: 'document',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://docs.google.com/document/d/1m-2JxiISorTM5Te3pYd1M7H3q8TqCwtP/edit?usp=drive_link',
      content: 'Artificial Intelligence & Machine Learning Laboratory Manual\nDepartment of CSE - VNR VJIET\nExperiment 1: Supervised Learning with Scikit-learn (Linear & Logistic Regression)\nExperiment 2: Decision Trees and Random Forests\nExperiment 3: Deep Neural Networks with PyTorch\nExperiment 4: Convolutional Neural Networks for Image Recognition\nExperiment 5: Model Optimization and Deployment.',
      note: 'Linked from Google Docs'
    },
    {
      name: 'Student_Project_Evaluation_Rubrics.docx',
      folderName: 'Assignments & Student Submissions',
      type: 'document',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://docs.google.com/document/d/1wyxD-UUqi6pwC0qOcJcSEKJ1dPV_qfDq/edit?usp=drive_link',
      content: 'Major Project & Capstone Evaluation Rubrics\nEvaluation Criteria: Problem Identification, Literature Survey, System Architecture, Code Quality & Git Repository, Testing Rigor, Final Presentation and Viva-Voce Performance.',
      note: 'Linked from Google Docs'
    },
    {
      name: 'Faculty_Development_Program_Report.pdf',
      folderName: 'Workshops & FDP Certificates',
      type: 'pdf',
      mime: 'application/pdf',
      url: 'https://drive.google.com/file/d/1aDooxThb-_TwvEy8UQ3fk7B4Potxt9VU/view?usp=drive_link',
      content: 'Five-Day National Level Faculty Development Program (FDP) Report\nTopic: Emerging Trends in Generative AI, Cloud Systems and Academic File Governance\nOrganized by VNR VJIET\nParticipant: Dr. Devika\nKey Outcomes: Hands-on implementation of enterprise document search, OCR indexing, and secure role-based collaboration.',
      note: 'Linked from Google Drive'
    },
    {
      name: 'NBA_Criteria_5_Faculty_Information_Record.docx',
      folderName: 'Accreditation & NAAC/NBA Dossiers',
      type: 'document',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://docs.google.com/document/d/1YcA4hMs4OOWP7kpnmrGEm6JPYfj2itf_/edit?usp=drive_link',
      content: 'National Board of Accreditation (NBA) - Criteria 5: Faculty Information and Contributions\nFaculty Name: Dr. Devika\nDesignation: Associate Professor\nAcademic Credentials: Ph.D. in Computer Science & Engineering\nPublications: 14 International Journals (Scopus / SCI Indexed)\nPatents: 2 Published\nFDPs Attended / Organized: 18 Programs.',
      note: 'Linked from Google Docs'
    }
  ];

  for (const item of filesConfig) {
    const folderId = folderMap[item.folderName] || null;

    let existingFile = await dbHelper.get(
      "SELECT * FROM files WHERE name = ? AND owner_id = ?",
      [item.name, devikaId]
    );

    let buffer = item.type === 'pdf' 
      ? createMinimalPdfBuffer(item.name, item.content) 
      : createMinimalDocxBuffer(item.name, item.content);

    const saved = saveBuffer(buffer, item.name);

    if (!existingFile) {
      const res = await dbHelper.run(`
        INSERT INTO files (
          name, original_name, file_type, mime_type, size,
          storage_path, folder_id, owner_id, department_id,
          version, ocr_status, extracted_text, is_favorite, external_url
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          1, 'completed', ?, 1, ?
        )
      `, [
        item.name, item.name, item.type, item.mime, saved.size,
        saved.storedFilename, folderId, devikaId, deptId,
        item.content, item.url
      ]);

      const inserted = await dbHelper.get("SELECT id FROM files WHERE name = ? AND owner_id = ?", [item.name, devikaId]);
      if (inserted) {
        await dbHelper.run(`
          INSERT INTO file_versions (file_id, version_number, storage_path, size, uploaded_by, note)
          VALUES (?, 1, ?, ?, ?, ?)
        `, [inserted.id, saved.storedFilename, saved.size, devikaId, item.note]);
      }
    } else {
      await dbHelper.run(`
        UPDATE files SET external_url = ?, extracted_text = ?, folder_id = ? WHERE id = ?
      `, [item.url, item.content, folderId, existingFile.id]);
    }
  }

  console.log('✅ Successfully added all Devika files, folders, and Google Drive integrations!');
}

addDevikaFiles().catch(console.error);
