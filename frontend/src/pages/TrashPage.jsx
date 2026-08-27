import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatBytes, formatDate, formatRelativeTime } from '../utils/formatters';
import { getFileIcon } from '../components/files/FileCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';

export default function TrashPage() {
  const { user, isAdmin } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileToPermanentDelete, setFileToPermanentDelete] = useState(null);
  const [showEmptyTrashDialog, setShowEmptyTrashDialog] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const data = await api.get('/files', { scope: 'trash' });
      setFiles(data.files || []);
    } catch (err) {
      console.warn('Failed to load trash:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (file) => {
    try {
      const res = await api.post(`/files/${file.id}/restore`);
      setMessage(res.message || 'File restored successfully.');
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (err) {
      alert('Failed to restore file: ' + err.message);
    }
  };

  const handlePermanentDeleteConfirm = async () => {
    if (!fileToPermanentDelete) return;
    try {
      await api.delete(`/files/${fileToPermanentDelete.id}/permanent`);
      setFiles(prev => prev.filter(f => f.id !== fileToPermanentDelete.id));
      setFileToPermanentDelete(null);
      setMessage('File permanently deleted.');
    } catch (err) {
      alert('Failed to permanently delete: ' + err.message);
    }
  };

  const handleEmptyTrashConfirm = async () => {
    try {
      const res = await api.delete('/trash/empty');
      setFiles([]);
      setShowEmptyTrashDialog(false);
      setMessage(res.message || 'Trash emptied.');
    } catch (err) {
      alert('Failed to empty trash: ' + err.message);
    }
  };

  return (
    <div className="space-y-5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-500" />
            Trash / Recycle Bin
          </h2>
          <p className="text-xs text-slate-400">
            Deleted files are preserved here. You can restore them or permanently delete them.
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={() => setShowEmptyTrashDialog(true)}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Empty Trash
          </button>
        )}
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
          Loading trash items...
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          type="trash"
          title="Recycle bin is empty"
          description="Deleted documents will appear here with restoration options before permanent deletion."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
              <tr>
                <th className="py-3.5 pl-4 pr-2">File Name</th>
                <th className="px-3 py-3.5">Owner</th>
                <th className="px-3 py-3.5">Original Folder</th>
                <th className="px-3 py-3.5">Size</th>
                <th className="px-3 py-3.5">Deleted Date</th>
                <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {files.map((file) => (
                <tr key={file.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 pl-4 pr-2">
                    <div className="flex items-center gap-2.5 max-w-sm truncate">
                      {getFileIcon(file.file_type, "h-5 w-5")}
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                    {file.owner_name || 'You'}
                  </td>

                  <td className="px-3 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {file.folder_name || 'Root Folder'}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-slate-500">
                    {formatBytes(file.size)}
                  </td>

                  <td className="px-3 py-3 text-slate-500">
                    {formatDate(file.deleted_at)}
                  </td>

                  <td className="py-3 pl-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRestore(file)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                        title="Restore File"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                      <button
                        onClick={() => setFileToPermanentDelete(file)}
                        className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300"
                        title="Permanent Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(fileToPermanentDelete)}
        title="Permanently Delete File"
        message={`Are you sure you want to permanently erase "${fileToPermanentDelete?.name}"? This action cannot be undone and will delete all versions from physical storage.`}
        confirmText="Permanently Delete"
        isDanger={true}
        onClose={() => setFileToPermanentDelete(null)}
        onConfirm={handlePermanentDeleteConfirm}
      />

      <ConfirmDialog
        isOpen={showEmptyTrashDialog}
        title="Empty Trash Bin"
        message="Are you sure you want to permanently delete all items in the Trash? All physical storage binaries will be purged."
        confirmText="Empty All Trash"
        isDanger={true}
        onClose={() => setShowEmptyTrashDialog(false)}
        onConfirm={handleEmptyTrashConfirm}
      />
    </div>
  );
}
