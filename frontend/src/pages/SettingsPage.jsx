import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Building2, Shield, Save, CheckCircle2, Sliders, 
  HardDrive, FileType, Database, Download, Upload, AlertTriangle, RefreshCw
} from 'lucide-react';
import { api, getToken } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function SettingsPage() {
  const { isAdmin, collegeSettings, refreshSettings } = useAuth();
  const [collegeName, setCollegeName] = useState('');
  const [systemName, setSystemName] = useState('');
  const [maxUploadSize, setMaxUploadSize] = useState(1024);
  const [allowedTypes, setAllowedTypes] = useState('');
  const [saving, setSaving] = useState(false);
  const [restoringDb, setRestoringDb] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedBackupFile, setSelectedBackupFile] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.get('/settings');
      const s = data.settings || {};
      setCollegeName(s.college_name || 'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology');
      setSystemName(s.system_name || 'Faculty File Management System');
      setMaxUploadSize(s.max_upload_size_mb || 1024);
      setAllowedTypes(s.allowed_file_types || 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,gif,svg,mp4,mov,avi,mp3,wav,zip,rar');
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.put('/settings', {
        college_name: collegeName.trim(),
        system_name: systemName.trim(),
        max_upload_size_mb: Number(maxUploadSize),
        allowed_file_types: allowedTypes.trim()
      });

      setMessage('College branding & system settings updated successfully.');
      refreshSettings();
    } catch (err) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const token = getToken();
    const link = document.createElement('a');
    link.href = `/api/settings/backup?token=${token || ''}`;
    link.download = `ffms_backup_${new Date().toISOString().slice(0, 10)}.sqlite`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedBackupFile(e.target.files[0]);
      setShowRestoreConfirm(true);
    }
  };

  const handleRestoreDatabaseConfirm = async () => {
    if (!selectedBackupFile) return;
    setRestoringDb(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('backup', selectedBackupFile);

      const token = getToken();
      const res = await fetch('/api/settings/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore database');

      setMessage('Database successfully restored from backup! Refreshing system...');
      setShowRestoreConfirm(false);
      setSelectedBackupFile(null);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Restore failed.');
    } finally {
      setRestoringDb(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-3xl pb-12">
      <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-600" />
          College Branding, Policy & Database Backup
        </h2>
        <p className="text-xs text-slate-400">
          Configure university title, repository constraints, storage limits, and download database backups.
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 p-3.5 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      {/* Cloud Database Backup & Disaster Recovery Section */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-100/60 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                1-Click Cloud Database Backup & Disaster Recovery
              </h3>
              <p className="text-[11px] text-slate-400">
                All uploaded documents, faculty data, departments, and logs are preserved in SQLite.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Download Backup */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-750 transition active:scale-95 cursor-pointer"
          >
            <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Download Full SQLite Backup</span>
          </button>

          {/* Restore Backup */}
          {isAdmin && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept=".sqlite,.db"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-white px-4 py-3 text-xs font-bold text-purple-700 shadow-sm hover:bg-purple-50 dark:border-slate-700 dark:bg-slate-800 dark:text-purple-300 dark:hover:bg-slate-750 transition active:scale-95 cursor-pointer"
              >
                <Upload className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Restore Database From Backup</span>
              </button>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-5">
        {/* Branding Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Institution Branding
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              College / University Name
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              System Title
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Upload Policy & Size Limits */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Sliders className="h-4 w-4 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Storage Policies & Validation Rules
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Max Upload Size Per File (MB)
            </label>
            <input
              type="number"
              min="5"
              max="1024"
              required
              disabled={!isAdmin}
              value={maxUploadSize}
              onChange={(e) => setMaxUploadSize(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Allowed Document File Extensions (Comma-separated)
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={allowedTypes}
              onChange={(e) => setAllowedTypes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Files with executable formats (.exe, .bat, .sh) are permanently blocked by server security.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:from-blue-800 hover:to-indigo-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving Settings...' : 'Save Configuration'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Confirm Restore Dialog */}
      <ConfirmDialog
        isOpen={showRestoreConfirm}
        title="Restore Database from Backup"
        message={`Are you sure you want to restore database from "${selectedBackupFile?.name}"? Current data will be replaced by the backup snapshot.`}
        confirmText={restoringDb ? "Restoring..." : "Restore Database"}
        isDanger={true}
        onClose={() => {
          setShowRestoreConfirm(false);
          setSelectedBackupFile(null);
        }}
        onConfirm={handleRestoreDatabaseConfirm}
      />
    </div>
  );
}
