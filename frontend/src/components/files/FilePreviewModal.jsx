import React, { useState, useEffect } from 'react';
import { 
  X, Download, Share2, ZoomIn, ZoomOut, RotateCw, 
  FileText, Sparkles, FileSpreadsheet, Eye, Info, Check, ExternalLink
} from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/formatters';
import { getToken } from '../../utils/api';

export default function FilePreviewModal({ isOpen, onClose, file, onShare, onDownload }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'ocr' | 'csv'
  const [csvRows, setCsvRows] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    setZoom(100);
    setRotation(0);
    setActiveTab('preview');
    setCsvRows([]);

    if (file && (file.file_type === 'spreadsheet' || file.name.endsWith('.csv'))) {
      loadCsvData();
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const token = getToken();
  const previewUrl = `/api/files/${file.id}/preview?token=${token || ''}`;

  const loadCsvData = async () => {
    setCsvLoading(true);
    try {
      const res = await fetch(previewUrl);
      const text = await res.text();
      const rows = text
        .split('\n')
        .filter(r => r.trim().length > 0)
        .map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      setCsvRows(rows);
    } catch (e) {
      console.warn('CSV parse error:', e);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(250, prev + 25));
  const handleZoomOut = () => setZoom(prev => Math.max(50, prev - 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const isImage = file.file_type === 'image' || file.mime_type?.startsWith('image/');
  const isPdf = file.file_type === 'pdf' || file.mime_type === 'application/pdf';
  const isVideo = file.file_type === 'video' || file.mime_type?.startsWith('video/');
  const isAudio = file.file_type === 'audio' || file.mime_type?.startsWith('audio/');
  const isCsv = file.file_type === 'spreadsheet' || file.name.endsWith('.csv');
  const isText = file.file_type === 'document' && (file.mime_type?.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md">
      <div className="relative flex h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        
        {/* Top Preview Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3 dark:border-slate-800 dark:bg-slate-850">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="truncate text-left">
              <h3 className="truncate font-bold text-sm text-slate-900 dark:text-slate-100" title={file.name}>
                {file.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                {formatBytes(file.size)} • Uploaded by {file.owner_name || 'Mrs. P. Devika'} • {formatDate(file.created_at)}
              </p>
            </div>
          </div>

          {/* Tab buttons (Preview vs OCR Content) */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>

            {isCsv && csvRows.length > 0 && (
              <button
                onClick={() => setActiveTab('csv')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
                  activeTab === 'csv'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Data Table
              </button>
            )}

            {file.extracted_text && (
              <button
                onClick={() => setActiveTab('ocr')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
                  activeTab === 'ocr'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                OCR Text
              </button>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {isImage && activeTab === 'preview' && (
              <div className="hidden sm:flex items-center gap-1 border-r border-slate-200 pr-2 dark:border-slate-700">
                <button
                  onClick={handleZoomOut}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-500 min-w-[36px] text-center">{zoom}%</span>
                <button
                  onClick={handleZoomIn}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Direct Google Docs / Drive link */}
            {file.drive_link && (
              <a
                href={file.drive_link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Google Doc</span>
              </a>
            )}

            <button
              onClick={() => onShare && onShare(file)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>

            <button
              onClick={() => onDownload && onDownload(file)}
              className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-blue-800 hover:to-indigo-700"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="relative flex-1 overflow-auto bg-slate-100/70 p-4 dark:bg-slate-950 flex items-center justify-center">
          {/* TAB 1: OCR Extracted Text Inspector */}
          {activeTab === 'ocr' ? (
            <div className="h-full w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-left overflow-y-auto">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <Sparkles className="h-5 w-5 text-brand-600" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    OCR Extracted & Search-Indexed Content
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    This text was recognized by OCR inside the document and is searchable in the global search bar.
                  </p>
                </div>
              </div>
              <pre className="mt-4 whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {file.extracted_text || 'No text could be extracted from this document.'}
              </pre>
            </div>
          ) : activeTab === 'csv' ? (
            /* TAB 2: Spreadsheet / CSV Grid Viewer */
            <div className="h-full w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                {csvRows.length > 0 && (
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-850">
                      {csvRows[0].map((header, idx) => (
                        <th key={idx} className="border-r border-slate-200 px-3 py-2.5 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {csvRows.slice(1).map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-850">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="border-r border-slate-100 px-3 py-2 text-slate-600 dark:border-slate-800/60 dark:text-slate-400">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* TAB 3: Native Format Previews */
            <div className="flex h-full w-full items-center justify-center">
              {isImage ? (
                <div className="overflow-auto max-h-full max-w-full flex items-center justify-center p-4">
                  <img
                    src={previewUrl}
                    alt={file.name}
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-in-out'
                    }}
                    className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-md"
                  />
                </div>
              ) : isPdf ? (
                <iframe
                  src={`${previewUrl}#toolbar=1&navpanes=1`}
                  title={file.name}
                  className="h-full w-full rounded-2xl border-0 bg-white shadow-sm"
                />
              ) : isVideo ? (
                <div className="flex h-full w-full items-center justify-center p-4">
                  <video
                    controls
                    autoPlay
                    src={previewUrl}
                    className="max-h-[75vh] max-w-full rounded-2xl shadow-xl"
                  >
                    Your browser does not support HTML5 video preview.
                  </video>
                </div>
              ) : isAudio ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                    <FileText className="h-10 w-10" />
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
                    {file.name}
                  </h4>
                  <audio controls src={previewUrl} className="w-72 mt-2" />
                </div>
              ) : isText ? (
                <iframe
                  src={previewUrl}
                  title={file.name}
                  className="h-full w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-xs dark:border-slate-800 dark:bg-slate-900 shadow-sm"
                />
              ) : (
                /* Fallback preview unsupported */
                <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900 max-w-md">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h4 className="mt-4 font-bold text-base text-slate-800 dark:text-slate-200">
                    {file.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Official academic document for Mrs. P. Devika.
                  </p>

                  <div className="mt-5 flex flex-col sm:flex-row items-center gap-2.5">
                    {file.drive_link && (
                      <a
                        href={file.drive_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition active:scale-95"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open in Google Docs</span>
                      </a>
                    )}
                    <button
                      onClick={() => onDownload && onDownload(file)}
                      className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-700 transition active:scale-95"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
