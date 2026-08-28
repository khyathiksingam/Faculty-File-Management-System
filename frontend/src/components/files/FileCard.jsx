import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Image as ImageIcon, Video, Music, Archive,
  FileSpreadsheet, Presentation, Star, MoreVertical,
  Download, Eye, Share2, History, Trash2, Edit3, FolderInput,
  Info, Sparkles, CheckCircle2, AlertCircle, Clock, ExternalLink
} from 'lucide-react';
import { formatBytes, formatRelativeTime, getFileCategoryColor } from '../../utils/formatters';

export function getFileIcon(type, className = "h-8 w-8") {
  switch (type?.toLowerCase()) {
    case 'pdf':
      return <FileText className={`${className} text-red-500`} />;
    case 'image':
      return <ImageIcon className={`${className} text-purple-500`} />;
    case 'video':
      return <Video className={`${className} text-rose-500`} />;
    case 'audio':
      return <Music className={`${className} text-violet-500`} />;
    case 'spreadsheet':
      return <FileSpreadsheet className={`${className} text-emerald-500`} />;
    case 'presentation':
      return <Presentation className={`${className} text-amber-500`} />;
    case 'archive':
      return <Archive className={`${className} text-orange-500`} />;
    case 'document':
    default:
      return <FileText className={`${className} text-blue-500`} />;
  }
}

export default function FileCard({
  file,
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colors = getFileCategoryColor(file.file_type);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700">
      {/* Top Row: File Icon, Badges, Star & Action Menu */}
      <div className="flex items-start justify-between gap-2">
        <div 
          onClick={() => !isTrash && onPreview(file)}
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border ${colors.bg} transition-transform group-hover:scale-105`}
        >
          {getFileIcon(file.file_type, "h-6 w-6")}
        </div>

        <div className="flex items-center gap-1">
          {/* Google Docs / Drive direct link badge */}
          {file.drive_link && (
            <a
              href={file.drive_link}
              target="_blank"
              rel="noreferrer"
              title="Open directly in Google Docs / Drive"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              <span>Drive</span>
            </a>
          )}

          {/* OCR Status Badge */}
          {file.ocr_status === 'completed' && (
            <span 
              title="OCR Indexed: Text inside document is searchable" 
              className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              <Sparkles className="h-2.5 w-2.5" />
              OCR
            </span>
          )}

          {file.version > 1 && (
            <span 
              onClick={() => onVersionHistory && onVersionHistory(file)}
              title={`Version ${file.version} (Click to view history)`}
              className="cursor-pointer rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 hover:underline dark:bg-indigo-950/60 dark:text-indigo-300"
            >
              v{file.version}
            </span>
          )}

          {/* Star Button */}
          {!isTrash && (
            <button
              onClick={() => onToggleStar && onToggleStar(file)}
              className={`rounded-lg p-1.5 transition ${
                file.is_starred
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-slate-300 hover:text-amber-500 dark:text-slate-600'
              }`}
              title={file.is_starred ? 'Remove Star' : 'Star File'}
            >
              <Star className={`h-4 w-4 ${file.is_starred ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
          )}

          {/* Action Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="File Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 z-20 mt-1 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 text-left">
                {!isTrash ? (
                  <>
                    <button
                      onClick={() => { setShowMenu(false); onPreview(file); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      Preview
                    </button>
                    {file.drive_link && (
                      <a
                        href={file.drive_link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setShowMenu(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                        Open in Google Docs / Drive
                      </a>
                    )}
                    <button
                      onClick={() => { setShowMenu(false); onDownload(file); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-400" />
                      Download
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onShare(file); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Share2 className="h-3.5 w-3.5 text-slate-400" />
                      Share...
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onRename(file); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                      Rename
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onMove(file); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <FolderInput className="h-3.5 w-3.5 text-slate-400" />
                      Move to Folder
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onVersionHistory(file); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <History className="h-3.5 w-3.5 text-slate-400" />
                      Version History
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onViewDetails(file); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                      File Details
                    </button>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      onClick={() => { setShowMenu(false); onDelete(file); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Move to Trash
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setShowMenu(false); onRestore(file); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                    >
                      <History className="h-3.5 w-3.5" />
                      Restore File
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onPermanentDelete(file); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Permanently Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle: File Name */}
      <div 
        onClick={() => !isTrash && onPreview(file)}
        className="my-3 cursor-pointer text-left"
      >
        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400" title={file.name}>
          {file.name}
        </h4>
        <p className="mt-1 text-[11px] text-slate-400">
          {file.department_code ? `${file.department_code} • ` : ''}{file.owner_name || 'Mrs. P. Devika'}
        </p>
      </div>

      {/* Bottom Row: Size and Date */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800">
        <span>{formatBytes(file.size)}</span>
        <span>{formatRelativeTime(file.created_at)}</span>
      </div>
    </div>
  );
}
