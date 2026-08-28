const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DB_DIR, 'ffms.sqlite');

let db = null;
let SQL = null;

async function initDB() {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run("PRAGMA foreign_keys = ON;");

  // Create tables
  createSchema();
  saveDB();

  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      hod_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role_id INTEGER NOT NULL,
      department_id INTEGER,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_folder_id INTEGER,
      department_id INTEGER,
      created_by INTEGER NOT NULL,
      color TEXT DEFAULT 'blue',
      drive_link TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      folder_id INTEGER,
      owner_id INTEGER NOT NULL,
      department_id INTEGER,
      version INTEGER DEFAULT 1,
      ocr_status TEXT DEFAULT 'pending' CHECK(ocr_status IN ('pending', 'processing', 'completed', 'failed', 'unsupported')),
      extracted_text TEXT DEFAULT '',
      is_favorite INTEGER DEFAULT 0,
      drive_link TEXT DEFAULT '',
      visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'private')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS file_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      size INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS file_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      permission_type TEXT NOT NULL CHECK(permission_type IN ('view', 'download', 'edit', 'delete', 'full')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shared_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      shared_by INTEGER NOT NULL,
      shared_with_user INTEGER,
      shared_with_department INTEGER,
      permission TEXT DEFAULT 'view_download' CHECK(permission IN ('view', 'view_download', 'edit')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (shared_by) REFERENCES users(id),
      FOREIGN KEY (shared_with_user) REFERENCES users(id),
      FOREIGN KEY (shared_with_department) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      file_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, file_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      file_id INTEGER,
      folder_id INTEGER,
      department_id INTEGER,
      metadata TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read_status INTEGER DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      college_name TEXT DEFAULT 'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology',
      system_name TEXT DEFAULT 'Faculty File Management System',
      college_logo TEXT DEFAULT '',
      system_logo TEXT DEFAULT '',
      max_upload_size_mb INTEGER DEFAULT 50,
      allowed_file_types TEXT DEFAULT 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,gif,svg,mp4,mov,avi,mp3,wav,zip,rar',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
    CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
    CREATE INDEX IF NOT EXISTS idx_files_dept ON files(department_id);
    CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_shared_user ON shared_files(shared_with_user);
    CREATE INDEX IF NOT EXISTS idx_shared_dept ON shared_files(shared_with_department);
    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_dept ON activity_logs(department_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read_status);
  `);

  try { db.run("ALTER TABLE folders ADD COLUMN drive_link TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE files ADD COLUMN drive_link TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE files ADD COLUMN visibility TEXT DEFAULT 'public'"); } catch (e) {}
}

function sanitizeParams(params = []) {
  if (!Array.isArray(params)) {
    return [params === undefined ? null : params];
  }
  return params.map(p => (p === undefined ? null : p));
}

// Database helper functions providing clean promise-based async interface
const dbHelper = {
  async query(sql, params = []) {
    await initDB();
    const safeParams = sanitizeParams(params);
    const stmt = db.prepare(sql);
    stmt.bind(safeParams);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  async all(sql, params = []) {
    return this.query(sql, params);
  },

  async run(sql, params = []) {
    await initDB();
    const safeParams = sanitizeParams(params);
    db.run(sql, safeParams);
    saveDB();
    const res = db.exec("SELECT last_insert_rowid() as id, changes() as changes");
    const lastId = res && res[0] && res[0].values[0] ? res[0].values[0][0] : null;
    const changes = res && res[0] && res[0].values[0] ? res[0].values[0][1] : 0;
    return { lastID: lastId, changes: changes };
  },

  async exec(sql) {
    await initDB();
    db.exec(sql);
    saveDB();
  },

  save() {
    saveDB();
  }
};

module.exports = {
  initDB,
  dbHelper
};
