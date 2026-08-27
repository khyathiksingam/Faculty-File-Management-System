import React, { useState, useEffect } from 'react';
import { 
  Files, Folder, Users, Building2, HardDrive, Star, Clock, 
  Upload, ArrowRight, Shield, Activity, FileText, CheckCircle2, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getToken } from '../utils/api';
import { formatBytes, formatDate, formatRelativeTime } from '../utils/formatters';
import { getFileIcon } from '../components/files/FileCard';

export default function DashboardPage({ onNavigate, onUploadClick, onPreviewFile }) {
  const { user, isAdmin, isHOD, isFaculty } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {};
  const recentFiles = data?.recentFiles || data?.recentUploads || [];
  const recentActivity = data?.recentActivity || data?.deptActivity || [];

  return (
    <div className="space-y-6 text-left">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 dark:from-slate-900 dark:via-indigo-950/70 dark:to-slate-900/95 dark:border dark:border-indigo-500/30 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20 dark:shadow-2xl dark:shadow-black/50 transition-colors">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 dark:bg-indigo-950/80 px-3.5 py-1 text-xs font-bold backdrop-blur-md text-white dark:text-indigo-300 border border-white/20 dark:border-indigo-500/40">
            <Shield className="h-3.5 w-3.5 text-indigo-200 dark:text-indigo-400" />
            <span className="uppercase tracking-wider">{user?.role_name || 'FACULTY'} PORTAL</span>
            {user?.department_name && <span>• {user.department_name}</span>}
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            Welcome, {user?.full_name}
          </h2>
          <p className="mt-1 max-w-xl text-xs sm:text-sm text-blue-100 dark:text-slate-300 leading-relaxed font-normal">
            {isAdmin 
              ? 'Complete administrative authority over college documents, departments, faculty accounts, and storage analytics.'
              : isHOD 
              ? `Manage academic files, folders, and faculty repository for the ${user?.department_name || 'department'}.`
              : 'Upload, organize, search inside scanned papers with OCR, and manage academic documents.'}
          </p>

          {/* Action Buttons with High Contrast */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onUploadClick}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 px-5 py-2.5 text-xs font-extrabold text-indigo-900 dark:text-white shadow-lg hover:bg-blue-50 dark:hover:from-blue-500 dark:hover:to-indigo-500 transition active:scale-95 border border-white dark:border-indigo-400/30 cursor-pointer"
            >
              <Upload className="h-4 w-4 text-indigo-700 dark:text-white stroke-[2.5]" />
              <span className="font-bold">+ Upload File</span>
            </button>
            <button
              onClick={() => onNavigate('/files')}
              className="flex items-center gap-2 rounded-xl bg-white/20 dark:bg-slate-800/90 border border-white/30 dark:border-slate-700/80 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-200 backdrop-blur-md transition hover:bg-white/30 dark:hover:bg-slate-700 cursor-pointer"
            >
              <span>Browse Files</span>
              <ArrowRight className="h-3.5 w-3.5 text-white dark:text-slate-200" />
            </button>
          </div>
        </div>

        {/* Decorative background accents */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 h-48 w-48 rounded-full bg-indigo-400/20 dark:bg-blue-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Statistic Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Faculty</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalFaculty || 0}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Active teaching staff</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Departments</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalDepartments || 0}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">With assigned HODs</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">College Files</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Files className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalFiles || 0}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Total documents stored</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Storage Used</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <HardDrive className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {formatBytes(stats.totalStorageBytes || 0)}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">of 20 GB allocated</p>
            </div>
          </>
        ) : isHOD ? (
          <>
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dept Faculty</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {stats.departmentFaculty || 0}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Members in {user?.department_code}</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dept Documents</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Files className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {stats.departmentFiles || 0}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Academic & exam files</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dept Storage</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <HardDrive className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {formatBytes(stats.departmentStorageBytes || 0)}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Quota usage</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shared Files</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <Star className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {stats.sharedFilesCount || 0}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Accessible files</p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">My Files</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Files className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {stats.myFilesCount || 0}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Uploaded documents</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">My Storage</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <HardDrive className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {formatBytes(stats.storageUsedBytes || 0)}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Total used</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Folders</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Folder className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {stats.myFoldersCount || 0}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Organized categories</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Starred</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-950/60 dark:text-yellow-400">
                  <Star className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {stats.starredCount || 0}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">Priority documents</p>
            </div>
          </>
        )}
      </div>

      {/* Two Column Layout: Recent Files & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Files (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Recent Documents
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/files')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition cursor-pointer"
            >
              View all →
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {recentFiles.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No recent files found. Upload a file to get started.
              </div>
            ) : (
              recentFiles.slice(0, 5).map((file) => (
                <div
                  key={file.id}
                  onClick={() => onPreviewFile && onPreviewFile(file)}
                  className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getFileIcon(file.file_type, "h-5 w-5")}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                        <span>{file.owner_name || user?.full_name}</span>
                        <span>•</span>
                        <span>{formatBytes(file.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {formatRelativeTime(file.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Activity Stream (1 col) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Activity Stream
              </h3>
            </div>
            {isAdmin && (
              <button
                onClick={() => onNavigate('/activity')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition cursor-pointer"
              >
                Full Audit →
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {recentActivity.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No recent activity logged.
              </div>
            ) : (
              recentActivity.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-xs text-left">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white">{log.user_name || 'User'}</span> {log.action.toLowerCase()}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatRelativeTime(log.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
