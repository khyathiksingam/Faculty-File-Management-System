import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { api } from './utils/api';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FilesPage from './pages/FilesPage';
import FoldersPage from './pages/FoldersPage';
import SharedFilesPage from './pages/SharedFilesPage';
import FavoritesPage from './pages/FavoritesPage';
import RecentFilesPage from './pages/RecentFilesPage';
import TrashPage from './pages/TrashPage';
import SearchResultsPage from './pages/SearchResultsPage';
import UsersPage from './pages/UsersPage';
import DepartmentsPage from './pages/DepartmentsPage';
import StoragePage from './pages/StoragePage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import FileUploadModal from './components/files/FileUploadModal';
import NewFolderModal from './components/files/NewFolderModal';
import FilePreviewModal from './components/files/FilePreviewModal';

function MainApp() {
  const { user, loading, isAdmin, isHOD } = useAuth();
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [storageStats, setStorageStats] = useState(null);

  // Global modals
  const [globalUploadOpen, setGlobalUploadOpen] = useState(false);
  const [globalNewFolderOpen, setGlobalNewFolderOpen] = useState(false);
  const [globalPreviewFile, setGlobalPreviewFile] = useState(null);

  useEffect(() => {
    if (user) {
      loadStorageStats();
    }
  }, [user, currentPath]);

  const loadStorageStats = async () => {
    try {
      const data = await api.get('/analytics/dashboard');
      if (data && data.stats) {
        setStorageStats(data.stats);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSearch = (q) => {
    if (q && q.trim()) {
      setSearchQuery(q.trim());
      setCurrentPath(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const handleNavigate = (path) => {
    if (path.startsWith('/search')) {
      const parts = path.split('q=');
      if (parts[1]) setSearchQuery(decodeURIComponent(parts[1]));
    } else {
      setSearchQuery('');
    }
    setCurrentPath(path);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading Faculty File Management System...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderCurrentView = () => {
    if (currentPath.startsWith('/search')) {
      return (
        <SearchResultsPage
          query={searchQuery}
          onPreviewFile={(f) => setGlobalPreviewFile(f)}
        />
      );
    }

    switch (currentPath) {
      case '/dashboard':
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onUploadClick={() => setGlobalUploadOpen(true)}
            onPreviewFile={(f) => setGlobalPreviewFile(f)}
          />
        );
      case '/files':
        return (
          <FilesPage
            scope={isAdmin ? 'all' : isHOD ? 'department' : 'my'}
            title={isAdmin ? 'All College Files' : isHOD ? `${user.department_code || 'Dept'} Files` : 'My Files'}
          />
        );
      case '/folders':
        return (
          <FoldersPage
            onOpenFolder={() => handleNavigate('/files')}
          />
        );
      case '/shared':
        return <SharedFilesPage />;
      case '/favorites':
        return <FavoritesPage />;
      case '/recent':
        return <RecentFilesPage />;
      case '/trash':
        return <TrashPage />;
      case '/users':
      case '/faculty':
        return <UsersPage />;
      case '/departments':
        return <DepartmentsPage />;
      case '/storage':
        return <StoragePage />;
      case '/activity':
        return <ActivityLogsPage />;
      case '/settings':
        return <SettingsPage />;
      case '/profile':
        return <ProfilePage />;
      default:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onUploadClick={() => setGlobalUploadOpen(true)}
            onPreviewFile={(f) => setGlobalPreviewFile(f)}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentSearchQuery={searchQuery}
        onSearch={handleSearch}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onUploadClick={() => setGlobalUploadOpen(true)}
          onNewFolderClick={() => setGlobalNewFolderOpen(true)}
          storageStats={storageStats}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <FileUploadModal
        isOpen={globalUploadOpen}
        onClose={() => setGlobalUploadOpen(false)}
        onUploadComplete={() => {
          loadStorageStats();
        }}
      />

      <NewFolderModal
        isOpen={globalNewFolderOpen}
        onClose={() => setGlobalNewFolderOpen(false)}
        onFolderCreated={() => {
          handleNavigate('/folders');
        }}
      />

      <FilePreviewModal
        isOpen={Boolean(globalPreviewFile)}
        file={globalPreviewFile}
        onClose={() => setGlobalPreviewFile(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
