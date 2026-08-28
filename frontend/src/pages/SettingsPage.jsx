import React, { useState, useEffect } from 'react';
import { Settings, Building2, Shield, Save, CheckCircle2, Sliders, HardDrive, FileType } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { isAdmin, collegeSettings, refreshSettings } = useAuth();
  const [collegeName, setCollegeName] = useState('');
  const [systemName, setSystemName] = useState('');
  const [maxUploadSize, setMaxUploadSize] = useState(50);
  const [allowedTypes, setAllowedTypes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.get('/settings');
      const s = data.settings || {};
      setCollegeName(s.college_name || 'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology');
      setSystemName(s.system_name || 'Faculty File Management System');
      setMaxUploadSize(s.max_upload_size_mb || 50);
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

  return (
    <div className="space-y-5 text-left max-w-3xl">
      <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="h-5 w-5 text-brand-600" />
          College Branding & System Settings
        </h2>
        <p className="text-xs text-slate-400">
          Configure university title, repository constraints, storage limits, and file policies.
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-5">
        {/* Branding Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Building2 className="h-4 w-4 text-brand-600" />
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
              max="500"
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
    </div>
  );
}
