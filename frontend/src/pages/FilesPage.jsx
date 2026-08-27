import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, List, Filter, ArrowUpDown, Plus, Upload, 
  Search, FolderPlus, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';
import { api, getToken } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import FileCard from '../components/files/FileCard';
import FileTable from '../components/files/FileTable';
import FolderCard from '../components/files/FolderCard';
import Breadcrumbs from '../components/files/Breadcrumbs';
import EmptyState from '../components/common/EmptyState';
import FileUploadModal from '../components/files/FileUploadModal';
import NewFolderModal from '../components/files/NewFolderModal';
import FilePreviewModal from '../components/files/FilePreviewModal';
import FileShareModal from '../components/files/FileShareModal';
import VersionHistoryModal from '../components/files/VersionHistoryModal';
import FileDetailsDrawer from '../components/files/FileDetailsDrawer';
import MoveFileModal from '../components/files/MoveFileModal';
import RenameModal from '../components/files/RenameModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function FilesPage({ scope = 'all', title = 'Files', onUploadTrigger }) {
  const { user, isAdmin, isHOD } = useAuth();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFilesCount, setTotalFilesCount] = useState(0);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState(null);
  const [selectedFileForShare, setSelectedFileForShare] = useState(null);
  const [selectedFileForVersions, setSelectedFileForVersions] = useState(null);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState(null);
  const [itemToMove, setItemToMove] = useState(null);
  const [itemToRename, setItemToRename] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [folderToDelete, setFolderToDelete] = useState(null);

  useEffect(() => {
    loadFolders();
    loadFiles();
  }, [currentFolder, filterType, sortBy, currentPage, scope]);

  useEffect(() => {
    if (currentFolder) {
      loadBreadcrumbs(currentFolder.id);
    } else {
      setBreadcrumbs([]);
    }
  }, [currentFolder]);

  const loadFolders = async () => {
    try {
      const params = {
        parent_folder_id: currentFolder ? currentFolder.id : 'null'
      };
      if (scope === 'my') params.scope = 'my';
      const data = await api.get('/folders', params);
      setFolders(data.folders || []);
    } catch (err) {
      console.warn('Failed to load folders:', err);
    }
  };

  const loadBreadcrumbs = async (folderId) => {
    try {
      const data = await api.get(`/folders/${folderId}/breadcrumbs`);
      setBreadcrumbs(data.breadcrumbs || []);
    } catch (err) {
      console.warn('Breadcrumb load error:', err);
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const params = {
        scope: scope,
        folder_id: currentFolder ? currentFolder.id : (scope === 'my' || scope === 'all' ? 'all' : 'null'),
        file_type: filterType,
        sort: sortBy,
        search: searchFilter,
        page: currentPage,
        limit: 24
      };

      const data = await api.get('/files', params);
      setFiles(data.files || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalFilesCount(data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (file) => {
    const token = getToken();
    window.open(`/api/files/${file.id}/download?token=${token || ''}`, '_blank');
  };

  const handleToggleStar = async (file) => {
    try {
      const res = await api.post(`/files/${file.id}/star`);
      setFiles(prev =>
        prev.map(f => (f.id === file.id ? { ...f, is_starred: res.is_starred ? 1 : 0 } : f))
      );
    } catch (err) {
      console.error('Star toggle failed:', err);
    }
  };

  const handleDeleteFileConfirm = async () => {
    if (!fileToDelete) return;
    try {
      await api.delete(`/files/${fileToDelete.id}`);
      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      setFileToDelete(null);
      loadFolders();
    } catch (err) {
      alert('Failed to delete file: ' + err.message);
    }
  };

  const handleDeleteFolderConfirm = async () => {
    if (!folderToDelete) return;
    try {
      await api.delete(`/folders/${folderToDelete.id}`);
      setFolders(prev => prev.filter(f => f.id !== folderToDelete.id));
      setFolderToDelete(null);
      loadFiles();
    } catch (err) {
      alert('Failed to delete folder: ' + err.message);
    }
  };

  return (
    <div className="space-y-5 text-left">
      {/* Top Toolbar: Breadcrumbs, Views, Filters, Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {currentFolder ? currentFolder.name : title}
          </h2>
          <Breadcrumbs
            rootLabel={title}
            breadcrumbs={breadcrumbs}
            onNavigateRoot={() => setCurrentFolder(null)}
            onNavigateFolder={(f) => setCurrentFolder(f)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Types Dropdown */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All File Types</option>
            <option value="pdf">PDF Documents</option>
            <option value="document">Word / Text Documents</option>
            <option value="spreadsheet">Spreadsheets / CSV</option>
            <option value="presentation">Presentations</option>
            <option value="image">Images (OCR)</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="archive">ZIP / RAR</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A–Z)</option>
            <option value="name_desc">Name (Z–A)</option>
            <option value="largest">Largest Size</option>
            <option value="smallest">Smallest Size</option>
            <option value="type">File Type</option>
          </select>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-slate-100 text-brand-600 dark:bg-slate-700 dark:text-brand-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'table'
                  ? 'bg-slate-100 text-brand-600 dark:bg-slate-700 dark:text-brand-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-blue-800 hover:to-indigo-700 transition active:scale-95 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Folders Section (if any folders in current level) */}
      {folders.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Folders ({folders.length})
            </h3>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="text-xs text-brand-600 hover:underline dark:text-brand-400 font-medium"
            >
              + New Folder
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((f) => (
              <FolderCard
                key={f.id}
                folder={f}
                onOpen={(folder) => setCurrentFolder(folder)}
                onRename={(folder) => setItemToRename({ ...folder, isFolder: true })}
                onMove={(folder) => setItemToMove({ ...folder, isFolder: true })}
                onDelete={(folder) => setFolderToDelete(folder)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Files ({totalFilesCount})
          </h3>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
            Loading repository files...
          </div>
        ) : files.length === 0 ? (
          <EmptyState
            type="files"
            title={currentFolder ? `No files in "${currentFolder.name}"` : 'No files found'}
            description="Upload your academic documents, scanned papers, or lecture materials."
            actionText="Upload File"
            onAction={() => setShowUploadModal(true)}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onPreview={(f) => setSelectedFileForPreview(f)}
                onDownload={handleDownload}
                onShare={(f) => setSelectedFileForShare(f)}
                onToggleStar={handleToggleStar}
                onRename={(f) => setItemToRename(f)}
                onMove={(f) => setItemToMove(f)}
                onDelete={(f) => setFileToDelete(f)}
                onViewDetails={(f) => setSelectedFileForDetails(f)}
                onVersionHistory={(f) => setSelectedFileForVersions(f)}
              />
            ))}
          </div>
        ) : (
          <FileTable
            files={files}
            onPreview={(f) => setSelectedFileForPreview(f)}
            onDownload={handleDownload}
            onShare={(f) => setSelectedFileForShare(f)}
            onToggleStar={handleToggleStar}
            onRename={(f) => setItemToRename(f)}
            onMove={(f) => setItemToMove(f)}
            onDelete={(f) => setFileToDelete(f)}
            onViewDetails={(f) => setSelectedFileForDetails(f)}
            onVersionHistory={(f) => setSelectedFileForVersions(f)}
          />
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
            <span className="text-slate-400">
              Showing page {currentPage} of {totalPages} ({totalFilesCount} total files)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        currentFolderId={currentFolder ? currentFolder.id : null}
        onUploadComplete={() => {
          loadFiles();
          loadFolders();
        }}
      />

      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        parentFolderId={currentFolder ? currentFolder.id : null}
        onFolderCreated={() => {
          loadFolders();
        }}
      />

      <FilePreviewModal
        isOpen={Boolean(selectedFileForPreview)}
        file={selectedFileForPreview}
        onClose={() => setSelectedFileForPreview(null)}
        onShare={(f) => { setSelectedFileForPreview(null); setSelectedFileForShare(f); }}
        onDownload={handleDownload}
      />

      <FileShareModal
        isOpen={Boolean(selectedFileForShare)}
        file={selectedFileForShare}
        onClose={() => setSelectedFileForShare(null)}
        onShareUpdated={() => loadFiles()}
      />

      <VersionHistoryModal
        isOpen={Boolean(selectedFileForVersions)}
        file={selectedFileForVersions}
        onClose={() => setSelectedFileForVersions(null)}
        onVersionUpdated={() => loadFiles()}
      />

      <FileDetailsDrawer
        isOpen={Boolean(selectedFileForDetails)}
        file={selectedFileForDetails}
        onClose={() => setSelectedFileForDetails(null)}
      />

      <MoveFileModal
        isOpen={Boolean(itemToMove)}
        item={itemToMove}
        isFolder={itemToMove?.isFolder}
        onClose={() => setItemToMove(null)}
        onMoved={() => {
          loadFiles();
          loadFolders();
        }}
      />

      <RenameModal
        isOpen={Boolean(itemToRename)}
        item={itemToRename}
        isFolder={itemToRename?.isFolder}
        onClose={() => setItemToRename(null)}
        onRenamed={() => {
          loadFiles();
          loadFolders();
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(fileToDelete)}
        title="Move to Trash"
        message={`Are you sure you want to move "${fileToDelete?.name}" to the Trash?`}
        confirmText="Move to Trash"
        isDanger={true}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDeleteFileConfirm}
      />

      <ConfirmDialog
        isOpen={Boolean(folderToDelete)}
        title="Delete Folder"
        message={`Are you sure you want to delete folder "${folderToDelete?.name}"? All files inside will be moved to Trash.`}
        confirmText="Delete Folder"
        isDanger={true}
        onClose={() => setFolderToDelete(null)}
        onConfirm={handleDeleteFolderConfirm}
      />
    </div>
  );
}
