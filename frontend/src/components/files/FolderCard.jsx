import React, { useState, useRef, useEffect } from 'react';
import { Folder, MoreVertical, Edit3, Trash2, FolderInput, ArrowRight, ExternalLink } from 'lucide-react';

export default function FolderCard({ folder, onOpen, onRename, onMove, onDelete }) {
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

  const getColorClasses = (color) => {
    switch (color) {
      case 'purple':
        return 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40';
      case 'emerald':
        return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40';
      case 'red':
        return 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40';
      case 'amber':
      case 'orange':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40';
      case 'cyan':
        return 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/40';
      case 'blue':
      default:
        return 'text-brand-500 bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800/40';
    }
  };

  const colorStyle = getColorClasses(folder.color);

  return (
    <div className="group relative flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700">
      <div 
        onClick={() => onOpen(folder)}
        className="flex flex-1 cursor-pointer items-center gap-3 overflow-hidden text-left"
      >
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${colorStyle}`}>
          <Folder className="h-5 w-5 fill-current/20" />
        </div>
        <div className="overflow-hidden">
          <h4 className="truncate font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
            {folder.name}
          </h4>
          <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <span>{folder.file_count || 0} files</span>
            {folder.drive_link && (
              <span className="inline-flex items-center gap-0.5 font-bold text-blue-600 dark:text-blue-400">
                • Drive Link
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {folder.drive_link && (
          <a
            href={folder.drive_link}
            target="_blank"
            rel="noreferrer"
            title="Open folder in Google Drive"
            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 text-slate-400 opacity-80 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Folder actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900 text-left">
              <button
                onClick={() => { setShowMenu(false); onOpen(folder); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                Open Folder
              </button>
              {folder.drive_link && (
                <a
                  href={folder.drive_link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                  Open in Google Drive
                </a>
              )}
              <button
                onClick={() => { setShowMenu(false); onRename(folder); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                Rename
              </button>
              <button
                onClick={() => { setShowMenu(false); onMove(folder); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <FolderInput className="h-3.5 w-3.5 text-slate-400" />
                Move Folder
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                onClick={() => { setShowMenu(false); onDelete(folder); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Folder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
