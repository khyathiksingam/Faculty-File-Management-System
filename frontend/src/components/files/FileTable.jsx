import { 
  Eye, Download, Share2, Star, MoreVertical, Edit3, 
  Trash2, History, Info, Sparkles, FolderInput, ExternalLink
} from 'lucide-react';
import { formatBytes, formatDate, formatRelativeTime } from '../../utils/formatters';
import { getFileIcon } from './FileCard';

export default function FileTable({
  files,
  onPreview,
  onDownload,
  onShare,
  onToggleStar,
  onRename,
  onMove,
  onDelete,
  onRestore,
  onPermanentDelete,
  onViewDetails,
  onVersionHistory,
  isTrash = false
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
          <tr>
            <th className="py-3.5 pl-4 pr-2">Name</th>
            <th className="px-3 py-3.5">Owner</th>
            <th className="px-3 py-3.5">Department</th>
            <th className="px-3 py-3.5">Size</th>
            <th className="px-3 py-3.5">Modified</th>
            <th className="px-3 py-3.5">OCR Status</th>
            <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {files.map((file) => (
            <tr
              key={file.id}
              className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
            >
              {/* Name & Star */}
              <td className="py-3 pl-4 pr-2">
                <div className="flex items-center gap-3">
                  {!isTrash && (
                    <button
                      onClick={() => onToggleStar && onToggleStar(file)}
                      className={`p-1 transition ${
                        file.is_starred
                          ? 'text-amber-500'
                          : 'text-slate-300 hover:text-amber-500 dark:text-slate-600'
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${file.is_starred ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  )}
                  <div 
                    onClick={() => !isTrash && onPreview(file)}
                    className="flex cursor-pointer items-center gap-2.5"
                  >
                    {getFileIcon(file.file_type, "h-5 w-5")}
                    <span className="font-semibold text-slate-800 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-400 max-w-xs truncate">
                      {file.name}
                    </span>
                    {file.version > 1 && (
                      <span 
                        onClick={(e) => { e.stopPropagation(); onVersionHistory && onVersionHistory(file); }}
                        className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 hover:underline dark:bg-indigo-950/60 dark:text-indigo-300"
                      >
                        v{file.version}
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Owner */}
              <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                {file.owner_name || 'You'}
              </td>

              {/* Department */}
              <td className="px-3 py-3">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {file.department_code || file.department_name || '—'}
                </span>
              </td>

              {/* Size */}
              <td className="px-3 py-3 text-slate-500">
                {formatBytes(file.size)}
              </td>

              {/* Modified / Created */}
              <td className="px-3 py-3 text-slate-500" title={formatDate(file.created_at)}>
                {formatRelativeTime(file.created_at)}
              </td>

              {/* OCR Status */}
              <td className="px-3 py-3">
                {file.ocr_status === 'completed' ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Sparkles className="h-2.5 w-2.5" />
                    Indexed
                  </span>
                ) : file.ocr_status === 'processing' ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse">
                    Processing...
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    {file.ocr_status === 'unsupported' ? 'N/A' : 'Pending'}
                  </span>
                )}
              </td>

              {/* Actions */}
              <td className="py-3 pl-3 pr-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  {!isTrash ? (
                    <>
                      {file.external_url && (
                        <a
                          href={file.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
                          title="Open in Google Docs / Drive"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => onPreview(file)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDownload(file)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onShare(file)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onViewDetails(file)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="Details"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(file)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onRestore(file)}
                        className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        title="Restore"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onPermanentDelete(file)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Delete Permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
