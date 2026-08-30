import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Folder,
  Image as ImageIcon,
  Loader2,
  Palette,
  Receipt,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DriveCategory, DriveSyncedFile, Order } from '../../types';
import {
  DEFAULT_DRIVE_CATEGORIES,
  fileToBase64,
  getGoogleDriveConfig,
  uploadFileToDriveViaAppsScript,
} from '../../services/googleDriveSyncService';

interface UploadToDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: DriveCategory;
  defaultOrder?: Order | null;
  onSuccess?: (syncedFile: DriveSyncedFile) => void;
}

export const UploadToDriveModal: React.FC<UploadToDriveModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'bukti_transfer',
  defaultOrder,
  onSuccess,
}) => {
  const { orders, currentUser, updateOrder } = useApp();
  const [category, setCategory] = useState<DriveCategory>(defaultCategory);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(defaultOrder?.id || (orders[0]?.id || ''));
  const [customClientName, setCustomClientName] = useState<string>(defaultOrder?.clientCompany || defaultOrder?.clientName || '');
  const [customOrderNumber, setCustomOrderNumber] = useState<string>(defaultOrder?.orderNumber || '');
  const [notes, setNotes] = useState<string>('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    fileUrl: string;
    downloadUrl: string;
    folderUrl?: string;
    fileName: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (defaultCategory) setCategory(defaultCategory);
    if (defaultOrder) {
      setSelectedOrderId(defaultOrder.id);
      setCustomOrderNumber(defaultOrder.orderNumber);
      setCustomClientName(defaultOrder.clientCompany || defaultOrder.clientName);
    }
  }, [defaultCategory, defaultOrder, isOpen]);

  // When selected order changes, auto-populate order number & client name
  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      setCustomOrderNumber(ord.orderNumber);
      setCustomClientName(ord.clientCompany || ord.clientName);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);

    if (file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
    } else {
      setFilePreview(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Silakan pilih file yang ingin diunggah ke Google Drive.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadProgress('Membaca & mengonversi file...');

      const base64Data = await fileToBase64(selectedFile);
      setUploadProgress('Menghubungi Google Drive & membuat struktur folder...');

      const ord = orders.find(o => o.id === selectedOrderId);
      const res = await uploadFileToDriveViaAppsScript({
        category,
        orderNumber: customOrderNumber || ord?.orderNumber || 'GENERAL',
        clientName: customClientName || ord?.clientCompany || ord?.clientName || 'Umum',
        fileName: fileName || selectedFile.name,
        fileBase64: base64Data,
        mimeType: selectedFile.type || 'application/octet-stream',
        uploaderName: currentUser?.name || 'Staff KIRA',
        notes,
        orderId: ord?.id,
      });

      if (res.success && res.fileUrl) {
        const syncedRecord: DriveSyncedFile = {
          id: res.fileId || `file_${Date.now()}`,
          orderId: ord?.id,
          orderNumber: customOrderNumber || ord?.orderNumber,
          category,
          fileName: res.fileName || fileName,
          fileUrl: res.fileUrl,
          downloadUrl: res.downloadUrl,
          folderUrl: res.folderUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.name,
          mimeType: selectedFile.type,
          notes,
        };

        // If linked to an order, update order's driveFiles and folderUrl
        if (ord) {
          const currentFiles = ord.driveFiles || [];
          const updatedFiles = [syncedRecord, ...currentFiles.filter(f => f.fileUrl !== res.fileUrl)];
          updateOrder(ord.id, {
            driveFolderUrl: res.folderUrl || ord.driveFolderUrl,
            driveFiles: updatedFiles,
          });
        }

        setSuccessResult({
          fileUrl: res.fileUrl,
          downloadUrl: res.downloadUrl || res.fileUrl,
          folderUrl: res.folderUrl,
          fileName: res.fileName || fileName,
        });

        if (onSuccess) {
          onSuccess(syncedRecord);
        }
      } else {
        setErrorMessage(res.error || 'Gagal mengunggah file ke Google Drive.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengunggah file.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  const currentCatInfo = DEFAULT_DRIVE_CATEGORIES.find(c => c.key === category) || DEFAULT_DRIVE_CATEGORIES[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl text-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Simpan & Sinkronisasi File ke Google Drive
              </h3>
              <p className="text-xs text-slate-400">
                Otomatis masuk ke folder <span className="font-mono text-cyan-400">KIRA_APPAREL_DATABASE / {currentCatInfo.folderName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Category Tabs Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Pilih Kategori Folder Arsip
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEFAULT_DRIVE_CATEGORIES.map(cat => {
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setCategory(cat.key);
                      setSuccessResult(null);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {cat.key === 'bukti_transfer' && <Receipt className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : ''}`} />}
                      {cat.key === 'spk' && <FileCheck2 className={`w-4 h-4 ${isSelected ? 'text-blue-400' : ''}`} />}
                      {cat.key === 'invoice' && <FileText className={`w-4 h-4 ${isSelected ? 'text-amber-400' : ''}`} />}
                      {cat.key === 'desain' && <Palette className={`w-4 h-4 ${isSelected ? 'text-purple-400' : ''}`} />}
                      {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                    </div>
                    <span className="text-xs font-bold leading-tight">{cat.label}</span>
                    <span className="text-[10px] font-mono text-slate-500 truncate">{cat.folderName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Success Box if uploaded */}
          {successResult && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>File Berhasil Tersimpan di Google Drive!</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-lg text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Nama File:</span>
                  <span className="text-white font-bold truncate max-w-[220px]">{successResult.fileName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="text-indigo-400 font-bold">{currentCatInfo.label}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={successResult.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Buka File di Drive
                </a>
                {successResult.folderUrl && (
                  <a
                    href={successResult.folderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Folder className="w-4 h-4 text-amber-400" /> Buka Folder
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleCopy(successResult.fileUrl)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Copy className="w-4 h-4" /> {copiedLink ? 'Tersalin!' : 'Salin Link'}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Gagal Unggah ke Google Drive</p>
                <p className="text-rose-400/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Order & Client Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kaitkan dengan Pesanan (Opsional)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={e => handleOrderChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Arsip Bebas / Tanpa Pesanan --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.clientCompany || o.clientName} ({o.quantity} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Subfolder Pesanan / Klien
                </label>
                <input
                  type="text"
                  value={customClientName}
                  onChange={e => setCustomClientName(e.target.value)}
                  placeholder="Contoh: Konda Kalteng / Tim Garuda"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>
            </div>

            {/* File Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                2. Pilih File Dokumen / Gambar
              </label>
              <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/30 hover:bg-slate-800/60 rounded-2xl p-6 text-center transition-all cursor-pointer group">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {filePreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-h-32 max-w-full rounded-lg object-contain border border-slate-700 shadow-md"
                    />
                    <div className="text-xs text-slate-300">
                      <span className="font-bold text-white">{fileName}</span>
                      <span className="text-slate-500 block mt-0.5">Klik untuk ganti file</span>
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-white text-sm">{fileName}</span>
                    <span className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB • Klik untuk ganti file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-200">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-600/20 flex items-center justify-center transition-all">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold">Tarik file ke sini atau klik untuk memilih</span>
                    <span className="text-[11px] text-slate-500">Mendukung Foto (JPG, PNG), PDF, Struk Transfer, Desain</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rename File & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama File di Drive
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  placeholder="nama_file.jpg"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Catatan Dokumen (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: DP 50% via BCA / Revisi kerah"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:from-indigo-700 active:to-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uploadProgress || 'Mengunggah ke Google Drive...'}</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Unggah & Sinkronkan ke Google Drive</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
