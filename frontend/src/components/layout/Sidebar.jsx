import React from 'react';
import {
  LayoutDashboard, Folder, Files, Clock, Star, Share2, 
  Trash2, Users, Building2, HardDrive, Activity, Settings, 
  Plus, Upload, Database, Layers, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatBytes } from '../../utils/formatters';

export default function Sidebar({ 
  currentPath, 
  onNavigate, 
  onUploadClick, 
  onNewFolderClick, 
  storageStats, 
  mobileOpen = false, 
  onCloseMobile 
}) {
  const { user, isAdmin, isHOD } = useAuth();

  const getNavItems = () => {
    if (isAdmin) {
      return [
        { section: 'Core' },
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'All Documents', path: '/files', icon: Files },
        { label: 'Folder Hierarchy', path: '/folders', icon: Folder },
        { label: 'Shared Repository', path: '/shared', icon: Share2 },
        { section: 'Administration' },
        { label: 'Faculty & HODs', path: '/users', icon: Users },
        { label: 'Departments', path: '/departments', icon: Building2 },
        { label: 'Storage Analytics', path: '/storage', icon: HardDrive },
        { label: 'Audit Trail Logs', path: '/activity', icon: Activity },
        { label: 'Recycle Trash Bin', path: '/trash', icon: Trash2 },
        { label: 'Branding & Policy', path: '/settings', icon: Settings },
      ];
    } else if (isHOD) {
      return [
        { section: 'Department Space' },
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Department Files', path: '/files', icon: Files },
        { label: 'Department Faculty', path: '/faculty', icon: Users },
        { label: 'Folders Tree', path: '/folders', icon: Folder },
        { section: 'Activity & Files' },
        { label: 'Shared Files', path: '/shared', icon: Share2 },
        { label: 'Starred Documents', path: '/favorites', icon: Star },
        { label: 'Recent Activity', path: '/activity', icon: Activity },
        { label: 'Storage Usage', path: '/storage', icon: HardDrive },
        { label: 'Recycle Bin', path: '/trash', icon: Trash2 },
      ];
    } else {
      // Faculty
      return [
        { section: 'Workspace' },
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'My Academic Files', path: '/files', icon: Files },
        { label: 'Folder Directory', path: '/folders', icon: Folder },
        { label: 'Starred Documents', path: '/favorites', icon: Star },
        { label: 'Recent Uploads', path: '/recent', icon: Clock },
        { section: 'Collaboration' },
        { label: 'Shared With Me', path: '/shared', icon: Share2 },
        { label: 'Recycle Bin', path: '/trash', icon: Trash2 },
      ];
    }
  };

  const navItems = getNavItems();

  const usedBytes = storageStats?.totalStorageBytes || storageStats?.departmentStorageBytes || storageStats?.storageUsedBytes || 0;
  const quotaBytes = storageStats?.storageQuotaBytes || (20 * 1024 * 1024 * 1024);
  const percentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100 * 10) / 10);

  const handleNavClick = (path) => {
    onNavigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const handleUpload = () => {
    onUploadClick();
    if (onCloseMobile) onCloseMobile();
  };

  const handleNewFolder = () => {
    onNewFolderClick();
    if (onCloseMobile) onCloseMobile();
  };

  // Reusable Sidebar Inner Content
  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 text-left">
      <div className="space-y-4">
        {/* Action Buttons: Upload File & New Folder */}
        <div className="space-y-2">
          <button
            onClick={handleUpload}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-blue-800 hover:to-indigo-700 active:scale-[0.98] cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            + Upload Document
          </button>

          <button
            onClick={handleNewFolder}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100 hover:border-slate-300 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-600" />
            New Folder
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-0.5 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={idx} className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path === '/files' && currentPath.startsWith('/files'));

            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50/80 text-indigo-700 shadow-xs ring-1 ring-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Storage Gauge */}
      <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-left">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <Database className="h-3.5 w-3.5 text-indigo-600" />
            VNR VJIET Cloud
          </span>
          <span className="font-extrabold text-indigo-900">
            {percentage}%
          </span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentage > 90 ? 'bg-rose-500' : percentage > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>

        <p className="mt-2 text-[11px] font-medium text-slate-500">
          {formatBytes(usedBytes)} of {formatBytes(quotaBytes)} used
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent on lg screens) */}
      <aside className="hidden lg:flex h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-slate-200/90 bg-white shadow-xs overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay on small screens) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-slate-950 shadow-sm ring-1 ring-indigo-500/30">
                  <img src="/logo.png" alt="FFMS" className="h-full w-full object-cover" />
                </div>
                <span className="font-extrabold text-xs text-indigo-900 dark:text-indigo-300">VNR VJIET FFMS</span>
              </div>
              <button 
                onClick={onCloseMobile}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[calc(100%-4rem)] overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
