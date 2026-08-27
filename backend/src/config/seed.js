const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { initDB, dbHelper } = require('./db');
const { STORAGE_DIR, saveBuffer } = require('../services/storageService');

// Minimal valid single-page PDF binary buffer generator
function createMinimalPdfBuffer(title, content) {
  const text = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 120 >>\nstream\nBT /F1 16 Tf 50 720 Td (${title}) Tj ET\nBT /F1 12 Tf 50 690 Td (${content}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000228 00000 n \n0000000307 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n478\n%%EOF`;
  return Buffer.from(text, 'utf-8');
}

// Minimal valid PNG 1x1 buffer generator
function createMinimalPngBuffer() {
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x60, 0x60, 0x60, 0x00,
    0x00, 0x00, 0x04, 0x00, 0x01, 0x27, 0x34, 0x27,
    0x0A, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
}

async function seed() {
  console.log('--- Initializing and Seeding Database ---');
  await initDB();

  // Check if roles already seeded
  const existingRoles = await dbHelper.get("SELECT COUNT(*) as count FROM roles");
  if (existingRoles && existingRoles.count > 0) {
    console.log('Database already seeded. Skipping initial seeding.');
    return;
  }

  // 1. Seed Roles
  await dbHelper.run("INSERT INTO roles (id, name) VALUES (1, 'admin'), (2, 'hod'), (3, 'faculty')");

  // 2. Seed System Settings
  await dbHelper.run(`
    INSERT INTO system_settings (
      college_name, system_name, college_logo, system_logo, max_upload_size_mb, allowed_file_types
    ) VALUES (
      'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology', 
      'Faculty File Management System', 
      '/college_logo.png', 
      '/system_logo.png', 
      100, 
      'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,gif,svg,mp4,mov,avi,mp3,wav,zip,rar'
    )
  `);

  // 3. Seed Departments
  await dbHelper.run("INSERT INTO departments (id, name, code) VALUES (1, 'Computer Science & Engineering', 'CSE')");
  await dbHelper.run("INSERT INTO departments (id, name, code) VALUES (2, 'Electronics & Communication', 'ECE')");
  await dbHelper.run("INSERT INTO departments (id, name, code) VALUES (3, 'Electrical & Electronics', 'EEE')");
  await dbHelper.run("INSERT INTO departments (id, name, code) VALUES (4, 'Mechanical Engineering', 'MECH')");
  await dbHelper.run("INSERT INTO departments (id, name, code) VALUES (5, 'Civil Engineering', 'CIVIL')");
  await dbHelper.run("INSERT INTO departments (id, name, code) VALUES (6, 'Information Technology', 'IT')");

  // 4. Seed Users
  const adminPass = await bcrypt.hash('Admin@123', 10);
  const facultyPass = await bcrypt.hash('Faculty@123', 10);

  // Admin
  await dbHelper.run(`
    INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
    VALUES (1, 'System Administrator', 'admin', ?, 'admin@abc.edu', 1, NULL, 'active')
  `, [adminPass]);

  // HODs
  await dbHelper.run(`
    INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
    VALUES (2, 'Dr. Ravi Kumar', 'dr.ravi', ?, 'dr.ravi@abc.edu', 2, 1, 'active')
  `, [facultyPass]);
  await dbHelper.run("UPDATE departments SET hod_id = 2 WHERE id = 1");

  await dbHelper.run(`
    INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
    VALUES (3, 'Dr. Anita Desai', 'dr.anita', ?, 'dr.anita@abc.edu', 2, 2, 'active')
  `, [facultyPass]);
  await dbHelper.run("UPDATE departments SET hod_id = 3 WHERE id = 2");

  // Faculty Members
  await dbHelper.run(`
    INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
    VALUES (4, 'Prof. Vikram Mehta', 'prof.vikram', ?, 'vikram.mehta@abc.edu', 3, 1, 'active')
  `, [facultyPass]);

  await dbHelper.run(`
    INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
    VALUES (5, 'Dr. Sneha Reddy', 'dr.sneha', ?, 'sneha.reddy@abc.edu', 3, 1, 'active')
  `, [facultyPass]);

  await dbHelper.run(`
    INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
    VALUES (6, 'Prof. Rajesh Sharma', 'prof.rajesh', ?, 'rajesh.sharma@abc.edu', 3, 2, 'active')
  `, [facultyPass]);

  await dbHelper.run(`
    INSERT INTO users (id, full_name, username, password_hash, email, role_id, department_id, status)
    VALUES (7, 'Prof. Meera Nair', 'prof.meera', ?, 'meera.nair@abc.edu', 3, 6, 'active')
  `, [facultyPass]);

  // 5. Seed Folder Structure
  // CSE Root Folders
  const resAcad = await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (1, 'Academic', NULL, 1, 2, 'blue')");
  const resRes = await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (2, 'Research', NULL, 1, 2, 'purple')");
  const resAdmin = await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (3, 'Administration', NULL, 1, 2, 'amber')");

  // CSE Academic Subfolders
  await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (4, 'Lesson Plans', 1, 1, 2, 'blue')");
  await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (5, 'Question Papers', 1, 1, 2, 'red')");
  await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (6, 'Lab Manuals', 1, 1, 4, 'emerald')");
  await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (7, 'Course Material', 1, 1, 5, 'cyan')");
  await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (8, 'Assignments', 1, 1, 4, 'orange')");

  // CSE Research Subfolders
  await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (9, 'Papers', 2, 1, 5, 'purple')");
  await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (10, 'Projects', 2, 1, 2, 'purple')");
  await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (11, 'Publications', 2, 1, 5, 'purple')");

  // ECE Root Folders
  await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (12, 'ECE Academic', NULL, 2, 3, 'blue')");
  await dbHelper.run("INSERT INTO folders (id, name, parent_folder_id, department_id, created_by, color) VALUES (13, 'VLSI Design Labs', 12, 2, 6, 'indigo')");

  // 6. Seed Sample Physical Files and DB Records
  console.log('Seeding storage files...');

  // Sample 1: Scanned Question Paper with OCR
  const img1Saved = saveBuffer(createMinimalPngBuffer(), 'IMG_2026_001.jpg');
  await dbHelper.run(`
    INSERT INTO files (
      id, name, original_name, file_type, mime_type, size,
      storage_path, folder_id, owner_id, department_id,
      version, ocr_status, extracted_text, is_favorite
    ) VALUES (
      1, 'IMG_2026_001.jpg', 'IMG_2026_001.jpg', 'image', 'image/jpeg', ?,
      ?, 5, 2, 1,
      1, 'completed', 'ABC ENGINEERING COLLEGE\nDepartment of Computer Science and Engineering\nInternal Assessment Examination - March 2026\nCourse Code: CS304 - Computer Networks\nDuration: 2 Hours | Maximum Marks: 50\n\nQuestion 1: Explain the OSI 7-layer reference model with suitable diagrams and functions of each layer.\nQuestion 2: Differentiate between TCP and UDP protocols. Explain TCP three-way handshake.\nQuestion 3: Calculate subnet masks and broadcast addresses for Class C network 192.168.1.0/26.\nQuestion 4: Describe Dijkstra Link State Routing algorithm and Distance Vector Routing.\nQuestion 5: What is Congestion Control? Discuss Leaky Bucket and Token Bucket traffic shaping algorithms.', 1
    )
  `, [img1Saved.size, img1Saved.storedFilename]);

  await dbHelper.run(`
    INSERT INTO file_versions (file_id, version_number, storage_path, size, uploaded_by, note)
    VALUES (1, 1, ?, ?, 2, 'Scanned Midterm Exam Paper')
  `, [img1Saved.storedFilename, img1Saved.size]);

  // Sample 2: Computer Networks Syllabus PDF
  const pdf1Saved = saveBuffer(
    createMinimalPdfBuffer('CS304 Computer Networks Syllabus 2026', 'Comprehensive course syllabus covering OSI model, TCP/IP, IP addressing, Subnetting, Routing Protocols, and Network Security.'),
    'Computer_Networks_Syllabus_2026.pdf'
  );
  await dbHelper.run(`
    INSERT INTO files (
      id, name, original_name, file_type, mime_type, size,
      storage_path, folder_id, owner_id, department_id,
      version, ocr_status, extracted_text, is_favorite
    ) VALUES (
      2, 'Computer_Networks_Syllabus_2026.pdf', 'Computer_Networks_Syllabus_2026.pdf', 'pdf', 'application/pdf', ?,
      ?, 4, 2, 1,
      2, 'completed', 'Course Syllabus: CS304 Computer Networks 2026. Unit 1: Introduction to Data Communication and Physical Layer. Unit 2: Data Link Layer & MAC protocols. Unit 3: Network Layer and Routing Algorithms. Unit 4: Transport Layer TCP/UDP congestion control. Unit 5: Application Layer HTTP, DNS, SMTP.', 1
    )
  `, [pdf1Saved.size, pdf1Saved.storedFilename]);

  // Older version 1 and current version 2
  await dbHelper.run(`
    INSERT INTO file_versions (file_id, version_number, storage_path, size, uploaded_by, note)
    VALUES (2, 1, ?, ?, 2, 'Initial draft of Syllabus')
  `, [pdf1Saved.storedFilename, pdf1Saved.size]);
  await dbHelper.run(`
    INSERT INTO file_versions (file_id, version_number, storage_path, size, uploaded_by, note)
    VALUES (2, 2, ?, ?, 2, 'Revised syllabus approved by Academic Council')
  `, [pdf1Saved.storedFilename, pdf1Saved.size]);

  // Sample 3: DBMS Lab Manual PDF
  const pdf2Saved = saveBuffer(
    createMinimalPdfBuffer('CS308 DBMS Lab Manual', 'Relational Database Management Systems Laboratory manual with SQL queries, normalization, indexing, and triggers.'),
    'DBMS_Lab_Manual_v2.pdf'
  );
  await dbHelper.run(`
    INSERT INTO files (
      id, name, original_name, file_type, mime_type, size,
      storage_path, folder_id, owner_id, department_id,
      version, ocr_status, extracted_text, is_favorite
    ) VALUES (
      3, 'DBMS_Lab_Manual_v2.pdf', 'DBMS_Lab_Manual_v2.pdf', 'pdf', 'application/pdf', ?,
      ?, 6, 4, 1,
      1, 'completed', 'Database Management Systems Lab Manual CS308. Experiment 1: DDL and DML commands in SQL. Experiment 2: Nested queries and Joins. Experiment 3: Views, Sequences, and Indexes. Experiment 4: PL/SQL procedures, functions and triggers. Experiment 5: Mini project implementation with SQLite/PostgreSQL.', 0
    )
  `, [pdf2Saved.size, pdf2Saved.storedFilename]);
  await dbHelper.run(`
    INSERT INTO file_versions (file_id, version_number, storage_path, size, uploaded_by, note)
    VALUES (3, 1, ?, ?, 4, 'Lab Manual 2026 edition')
  `, [pdf2Saved.storedFilename, pdf2Saved.size]);

  // Sample 4: Machine Learning Research Paper
  const pdf3Saved = saveBuffer(
    createMinimalPdfBuffer('Machine Learning Research Paper', 'Deep Learning Architectures for Academic Performance Prediction in Higher Education Institutions.'),
    'ML_Academic_Performance_Paper.pdf'
  );
  await dbHelper.run(`
    INSERT INTO files (
      id, name, original_name, file_type, mime_type, size,
      storage_path, folder_id, owner_id, department_id,
      version, ocr_status, extracted_text, is_favorite
    ) VALUES (
      4, 'ML_Academic_Performance_Paper.pdf', 'ML_Academic_Performance_Paper.pdf', 'pdf', 'application/pdf', ?,
      ?, 9, 5, 1,
      1, 'completed', 'Research Paper: Deep Learning Architectures for Academic Performance Prediction. Dr. Sneha Reddy. Abstract: This paper presents an empirical analysis of recurrent neural networks and transformers in predicting student academic outcomes and automated document categorization in university file management.', 1
    )
  `, [pdf3Saved.size, pdf3Saved.storedFilename]);
  await dbHelper.run(`
    INSERT INTO file_versions (file_id, version_number, storage_path, size, uploaded_by, note)
    VALUES (4, 1, ?, ?, 5, 'Final camera-ready manuscript')
  `, [pdf3Saved.storedFilename, pdf3Saved.size]);

  // Sample 5: Student Attendance CSV
  const csvBuffer = Buffer.from(
    "RollNo,Student_Name,Subject,Attendance_Percentage,Internal_Marks\n101,Aarav Sharma,Computer Networks,92,23\n102,Diya Patel,Computer Networks,88,21\n103,Rohan Gupta,Computer Networks,95,25\n104,Ananya Iyer,Computer Networks,78,19\n105,Kabir Singh,Computer Networks,85,22",
    'utf-8'
  );
  const csvSaved = saveBuffer(csvBuffer, 'CSE_Semester_5_Attendance.csv');
  await dbHelper.run(`
    INSERT INTO files (
      id, name, original_name, file_type, mime_type, size,
      storage_path, folder_id, owner_id, department_id,
      version, ocr_status, extracted_text, is_favorite
    ) VALUES (
      5, 'CSE_Semester_5_Attendance.csv', 'CSE_Semester_5_Attendance.csv', 'spreadsheet', 'text/csv', ?,
      ?, 7, 4, 1,
      1, 'completed', 'RollNo, Student_Name, Subject, Attendance_Percentage, Internal_Marks. Aarav Sharma, Diya Patel, Rohan Gupta, Ananya Iyer, Kabir Singh. Subject: Computer Networks CS304.', 0
    )
  `, [csvSaved.size, csvSaved.storedFilename]);
  await dbHelper.run(`
    INSERT INTO file_versions (file_id, version_number, storage_path, size, uploaded_by, note)
    VALUES (5, 1, ?, ?, 4, 'Monthly attendance update')
  `, [csvSaved.storedFilename, csvSaved.size]);

  // Sample 6: Department Meeting Minutes
  const txtBuffer = Buffer.from(
    "ABC ENGINEERING COLLEGE\nDEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\nMinutes of Departmental Meeting - August 2026\n\nAttendees:\n- Dr. Ravi Kumar (HOD)\n- Prof. Vikram Mehta\n- Dr. Sneha Reddy\n\nAgenda:\n1. Implementation of Faculty File Management System (FFMS)\n2. Accreditation documentation review and NAAC file preparations\n3. Finalization of Semester examination question papers\n\nDecisions Taken:\n- All faculty must organize lesson plans and lab manuals in FFMS\n- Question paper repository must be verified by HOD",
    'utf-8'
  );
  const txtSaved = saveBuffer(txtBuffer, 'CSE_Meeting_Minutes_Aug2026.txt');
  await dbHelper.run(`
    INSERT INTO files (
      id, name, original_name, file_type, mime_type, size,
      storage_path, folder_id, owner_id, department_id,
      version, ocr_status, extracted_text, is_favorite
    ) VALUES (
      6, 'CSE_Meeting_Minutes_Aug2026.txt', 'CSE_Meeting_Minutes_Aug2026.txt', 'document', 'text/plain', ?,
      ?, 3, 2, 1,
      1, 'completed', 'Minutes of Departmental Meeting August 2026. Dr. Ravi Kumar, Prof. Vikram Mehta, Dr. Sneha Reddy. Agenda: Implementation of Faculty File Management System (FFMS), NAAC file preparations, Semester examination question papers.', 0
    )
  `, [txtSaved.size, txtSaved.storedFilename]);
  await dbHelper.run(`
    INSERT INTO file_versions (file_id, version_number, storage_path, size, uploaded_by, note)
    VALUES (6, 1, ?, ?, 2, 'Signed minutes record')
  `, [txtSaved.storedFilename, txtSaved.size]);

  // 7. Seed Sharing Records
  // Dr. Ravi shared Question Paper (file 1) with CSE Department
  await dbHelper.run(`
    INSERT INTO shared_files (file_id, shared_by, shared_with_department, permission)
    VALUES (1, 2, 1, 'view_download')
  `);

  // Dr. Ravi shared Syllabus (file 2) with Prof. Vikram
  await dbHelper.run(`
    INSERT INTO shared_files (file_id, shared_by, shared_with_user, permission)
    VALUES (2, 2, 4, 'edit')
  `);

  // 8. Seed Favorites
  await dbHelper.run("INSERT INTO favorites (user_id, file_id) VALUES (2, 1), (2, 2), (4, 1), (5, 4)");

  // 9. Seed Initial Notifications
  await dbHelper.run(`
    INSERT INTO notifications (user_id, title, message, link)
    VALUES 
    (2, 'System Welcome', 'Welcome to Faculty File Management System (FFMS), Dr. Ravi Kumar!', '/dashboard'),
    (2, 'Department Overview', 'CSE Department has 4 active faculty members and 11 organized folders.', '/departments/1'),
    (4, 'New File Shared', 'Dr. Ravi shared "Computer_Networks_Syllabus_2026.pdf" with you (Can Edit).', '/files?file_id=2'),
    (5, 'Upload Success', 'Your research paper "ML_Academic_Performance_Paper.pdf" has been indexed and is searchable.', '/files?file_id=4')
  `);

  // 10. Seed Initial Activity Logs
  await dbHelper.run(`
    INSERT INTO activity_logs (user_id, action, file_id, department_id, metadata, created_at)
    VALUES 
    (1, 'System Initialized', NULL, NULL, '{"version":"1.0"}', datetime('now', '-2 days')),
    (2, 'User Login', NULL, 1, '{"ip":"192.168.1.10"}', datetime('now', '-1 day')),
    (2, 'File Uploaded', 1, 1, '{"name":"IMG_2026_001.jpg","size":124500,"ocr":"completed"}', datetime('now', '-20 hours')),
    (2, 'File Shared', 1, 1, '{"permission":"view_download","shared_with_dept":1}', datetime('now', '-18 hours')),
    (4, 'File Uploaded', 3, 1, '{"name":"DBMS_Lab_Manual_v2.pdf","size":450200}', datetime('now', '-12 hours')),
    (5, 'File Uploaded', 4, 1, '{"name":"ML_Academic_Performance_Paper.pdf","size":890100}', datetime('now', '-6 hours')),
    (2, 'New File Version Uploaded', 2, 1, '{"version":2,"note":"Revised syllabus"}', datetime('now', '-2 hours'))
  `);

  console.log('Seeding completed successfully!');
}

module.exports = seed;
