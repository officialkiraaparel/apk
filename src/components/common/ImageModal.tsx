import React from 'react';
import { Download, ExternalLink, X, ZoomIn } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string; // e.g. "GAMBAR 1" or "GAMBAR 2"
  subtitle?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, title, subtitle }) => {
  if (!isOpen) return null;

  return (
    <div
      id="image-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="image-preview-modal-content"
        className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Referensi Desain
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Buka gambar di tab baru"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/5">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200"
          />
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
          <p>
            Label: <strong className="text-slate-800 font-semibold">{title}</strong> — Identitas / Referensi visual pesanan
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
