const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { initDB, dbHelper } = require('../config/db');
const { saveBuffer } = require('../services/storageService');

function createMinimalPdfBuffer(title, content) {
  const text = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 120 >>\nstream\nBT /F1 16 Tf 50 720 Td (${title}) Tj ET\nBT /F1 12 Tf 50 690 Td (${content}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000228 00000 n \n0000000307 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n478\n%%EOF`;
  return Buffer.from(text, 'utf-8');
}

function createMinimalDocxBuffer(title, content) {
  const text = `VNR VJIET - DEPARTMENT OF CSE- (CYS, DS) and AI&DS\n\nDocument: ${title}\nAdministrator & Faculty In-Charge: Mrs. P. Devika\n\n${content}\n\nFaculty File Management System 2026`;
  return Buffer.from(text, 'utf-8');
}

async function setupDevikaAdmin() {
  await initDB();

  console.log('--- Setting up Mrs. P. Devika as Sole Admin & Cleaning Database ---');

  // 1. Ensure external_url columns exist
  try { await dbHelper.run("ALTER TABLE files ADD COLUMN external_url TEXT;"); } catch (e) {}
  try { await dbHelper.run("ALTER TABLE folders ADD COLUMN external_url TEXT;"); } catch (e) {}

  // 2. Set Up Roles
  await dbHelper.run("DELETE FROM roles;");
  await dbHelper.run("INSERT INTO roles (id, name) VALUES (1, 'admin'), (2, 'hod'), (3, 'faculty');");

  // 3. Department: DEPARTMENT OF CSE- (CYS, DS) and AI&DS
  await dbHelper.run("DELETE FROM departments;");
  await dbHelper.run(`
    INSERT INTO departments (id, name, code, created_at)
    VALUES (1, 'DEPARTMENT OF CSE- (CYS, DS) and AI&DS', 'CSE (CYS, DS) & AI&DS', CURRENT_TIMESTAMP)
  `);

  // 4. Admin User: Mrs. P. Devika
  const devikaPasswordHash = await bcrypt.hash('Devika@23', 10);
  
  // Clean all existing users, notifications, favorites, activity logs
  await dbHelper.run("DELETE FROM notifications;");
  await dbHelper.run("DELETE FROM favorites;");
  await dbHelper.run("DELETE FROM activity_logs;");
  await dbHelper.run("DELETE FROM shared_files;");
  await dbHelper.run("DELETE FROM file_versions;");
  await dbHelper.run("DELETE FROM files;");
  await dbHelper.run("DELETE FROM folders;");
  await dbHelper.run("DELETE FROM users;");

  // Insert Mrs. P. Devika as ID 1 (Admin)
  await dbHelper.run(`
    INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
    VALUES (1, 'Mrs. P. Devika', 'devika', ?, 'devika@vnrvjiet.in', 1, 1, 'active')
  `, [devikaPasswordHash]);

  await dbHelper.run("UPDATE departments SET hod_id = 1 WHERE id = 1;");

  // Update System Settings
  await dbHelper.run(`
    UPDATE system_settings SET 
      college_name = 'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology',
      system_name = 'Faculty File Management System',
      max_upload_size_mb = 100
  `);

  // 5. Create 10 Google Drive Folders for Mrs. P. Devika
  const folders = [
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
  for (let i = 0; i < folders.length; i++) {
    const f = folders[i];
    const folderId = i + 1;
    await dbHelper.run(`
      INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color, external_url)
      VALUES (?, ?, NULL, 1, 1, ?, ?)
    `, [folderId, f.name, f.color, f.url]);
    folderMap[f.name] = folderId;
  }

  // 6. Create 8 Core Google Docs & Files for Mrs. P. Devika
  const files = [
    {
      id: 1,
      name: 'Course_Outcome_Attainment_Report_2026.docx',
      folderName: 'Academic Course Files',
      type: 'document',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://docs.google.com/document/d/1aZrGqu0sOMcQV_1zoa-ef2rvWSuxumHh/edit?usp=drive_link',
      content: 'VALLURUPALLI NAGESWARA RAO VIGNANA JYOTHI INSTITUTE OF ENGINEERING & TECHNOLOGY\nDEPARTMENT OF CSE- (CYS, DS) and AI&DS\nCourse Outcome (CO) and Program Outcome (PO) Attainment Report 2026\nFaculty Administrator: Mrs. P. Devika\nCourse: Advanced Data Structures, Cyber Security, Data Science & AI Systems\nAssessment Methods: Direct Internal Continuous Assessment, Laboratory Practical Experiments, Semester End Exams.\nTarget Attainment Level: 90% Target Achieved.',
      note: 'Linked directly from Google Docs'
    },
    {
      id: 2,
      name: 'Faculty_Teaching_Portfolio_Devika.pdf',
      folderName: 'Academic Course Files',
      type: 'pdf',
      mime: 'application/pdf',
      url: 'https://drive.google.com/file/d/1VLOYLXAhuPR3OsO9zFn1nk35dunSX3zr/view?usp=drive_link',
      content: 'Faculty Academic Portfolio - Mrs. P. Devika (Admin)\nDEPARTMENT OF CSE- (CYS, DS) and AI&DS - VNR VJIET\nTeaching Pedagogy, Blended Classroom Learning, Student Mentoring, NBA Criteria Documentation, and Faculty Contributions.',
      note: 'Linked directly from Google Drive'
    },
    {
      id: 3,
      name: 'Advanced_Data_Structures_Lecture_Notes.docx',
      folderName: 'Lecture Notes & Syllabus',
      type: 'document',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://docs.google.com/document/d/1DkfuhoDid9472fWKfNBiaI9K1jONn6Tz/edit?usp=drive_link',
      content: 'Lecture Notes: Data Structures & Algorithms with AI & DS Applications\nUnit 1: Balanced Binary Search Trees (AVL, Red-Black Trees)\nUnit 2: B-Trees, B+ Trees & Disk Storage Indexing\nUnit 3: Priority Queues, Binomial and Fibonacci Heaps\nUnit 4: Graph Algorithms & Minimum Spanning Trees\nUnit 5: String Matching & Cryptographic Hashing.',
      note: 'Linked directly from Google Docs'
    },
    {
      id: 4,
      name: 'Semester_End_Examination_Evaluation_Scheme.pdf',
      folderName: 'Question Papers & Mid Exam Records',
      type: 'pdf',
      mime: 'application/pdf',
      url: 'https://drive.google.com/file/d/12succ16Vf6_5OWyvQz1-QtV0tnEAfLUf/view?usp=drive_link',
      content: 'Semester End Examination (SEE) Evaluation Scheme & Answer Key\nSubject: CS302 - Data Structures, Cyber Security & AI Fundamentals\nPrepared by: Mrs. P. Devika\nDetailed step-by-step marking rubrics and model solutions.',
      note: 'Linked directly from Google Drive'
    },
    {
      id: 5,
      name: 'AI_ML_Laboratory_Manual_VNRVJIET.docx',
      folderName: 'Lab Manuals & Practical Records',
      type: 'document',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://docs.google.com/document/d/1m-2JxiISorTM5Te3pYd1M7H3q8TqCwtP/edit?usp=drive_link',
      content: 'Artificial Intelligence & Machine Learning Laboratory Manual\nDEPARTMENT OF CSE- (CYS, DS) and AI&DS - VNR VJIET\nExperiment 1: Supervised Regression and Classification Models\nExperiment 2: Deep Convolutional Neural Networks for Computer Vision\nExperiment 3: Natural Language Processing and Transformer Embeddings\nExperiment 4: Cybersecurity Threat Anomaly Detection using AI.',
      note: 'Linked directly from Google Docs'
    },
    {
      id: 6,
      name: 'Student_Project_Evaluation_Rubrics.docx',
      folderName: 'Assignments & Student Submissions',
      type: 'document',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://docs.google.com/document/d/1wyxD-UUqi6pwC0qOcJcSEKJ1dPV_qfDq/edit?usp=drive_link',
      content: 'Capstone Project Evaluation Rubrics\nEvaluation Criteria: Problem Statement Originality, System Architecture Design, Cyber Security Compliance, Model Accuracy, Source Code Repository, Viva-Voce Performance.',
      note: 'Linked directly from Google Docs'
    },
    {
      id: 7,
      name: 'Faculty_Development_Program_Report.pdf',
      folderName: 'Workshops & FDP Certificates',
      type: 'pdf',
      mime: 'application/pdf',
      url: 'https://drive.google.com/file/d/1aDooxThb-_TwvEy8UQ3fk7B4Potxt9VU/view?usp=drive_link',
      content: 'Faculty Development Program (FDP) Completion Report\nTitle: Advanced Pedagogies in Cyber Security, Data Science and AI Governance\nParticipant: Mrs. P. Devika (Admin)\nInstitution: VNR Vignana Jyothi Institute of Engineering & Technology.',
      note: 'Linked directly from Google Drive'
    },
    {
      id: 8,
      name: 'NBA_Criteria_5_Faculty_Information_Record.docx',
      folderName: 'Accreditation & NAAC/NBA Dossiers',
      type: 'document',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://docs.google.com/document/d/1YcA4hMs4OOWP7kpnmrGEm6JPYfj2itf_/edit?usp=drive_link',
      content: 'National Board of Accreditation (NBA) - Criteria 5 Faculty Information Dossier\nFaculty Administrator: Mrs. P. Devika\nDepartment: DEPARTMENT OF CSE- (CYS, DS) and AI&DS\nTeaching Experience, Publications, Curriculum Innovations, Labs Established, and Departmental Administration.',
      note: 'Linked directly from Google Docs'
    }
  ];

  for (const item of files) {
    const folderId = folderMap[item.folderName];
    const buffer = item.type === 'pdf' 
      ? createMinimalPdfBuffer(item.name, item.content) 
      : createMinimalDocxBuffer(item.name, item.content);
    const saved = saveBuffer(buffer, item.name);

    await dbHelper.run(`
      INSERT INTO files (
        id, name, original_name, file_type, mime_type, size,
        storage_path, folder_id, owner_id, department_id,
        version, ocr_status, extracted_text, is_favorite, external_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, 1, 1,
        1, 'completed', ?, 1, ?
      )
    `, [
      item.id, item.name, item.name, item.type, item.mime, saved.size,
      saved.storedFilename, folderId,
      item.content, item.url
    ]);

    await dbHelper.run(`
      INSERT INTO file_versions (file_id, version_number, storage_path, size, uploaded_by, note)
      VALUES (?, 1, ?, ?, 1, ?)
    `, [item.id, saved.storedFilename, saved.size, item.note]);

    // Add to favorites
    await dbHelper.run("INSERT INTO favorites (user_id, file_id) VALUES (1, ?)", [item.id]);
  }

  // 7. Initial Welcome Notification
  await dbHelper.run(`
    INSERT INTO notifications (user_id, title, message, link)
    VALUES (1, 'Welcome Administrator', 'Welcome to Faculty File Management System, Mrs. P. Devika! Your 10 Google Drive Folders and 8 Google Docs files are synchronized and ready.', '/dashboard')
  `);

  // 8. Initial Activity Log
  await dbHelper.run(`
    INSERT INTO activity_logs (user_id, action, file_id, department_id, metadata, created_at)
    VALUES (1, 'System Initialized', NULL, 1, '{"admin":"Mrs. P. Devika","department":"DEPARTMENT OF CSE- (CYS, DS) and AI&DS"}', CURRENT_TIMESTAMP)
  `);

  console.log('✅ Mrs. P. Devika is now the sole Admin with username "devika" & password "Devika@23"!');
}

setupDevikaAdmin().catch(console.error);
