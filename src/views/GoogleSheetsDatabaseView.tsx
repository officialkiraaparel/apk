import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Cloud,
  Code2,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  FolderSync,
  HelpCircle,
  KeyRound,
  Layers,
  Link2,
  Lock,
  LogOut,
  Palette,
  Play,
  Receipt,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Table,
  Terminal,
  Upload,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DriveCategory, DriveSyncedFile } from '../types';
import {
  disconnectGoogle,
  exportClientsToGoogleSheets,
  exportOrdersToGoogleSheets,
  exportUsersToGoogleSheets,
  fetchOrdersFromGoogleSheets,
  getAuthenticatedGoogleUser,
  getGoogleAccessToken,
  hasValidGoogleToken,
  initializeSpreadsheetTabs,
  requestGoogleAccessToken,
  setManualAccessToken,
  SHEETS_CONFIG,
  SPREADSHEET_ID,
  SPREADSHEET_URL,
  testSpreadsheetConnection,
} from '../services/googleSheetsService';
import {
  DEFAULT_DRIVE_CATEGORIES,
  getGoogleDriveConfig,
  getLocalDriveArchiveHistory,
  initDriveFoldersViaAppsScript,
  pingAppsScriptWebApp,
  saveGoogleDriveConfig,
  syncAllSheetsViaAppsScript,
  uploadFileToDriveViaAppsScript,
} from '../services/googleDriveSyncService';
import { APPS_SCRIPT_SOURCE_CODE } from '../utils/appsScriptCode';
import { formatDateTimeID, formatRupiah } from '../utils/formatters';
import { UploadToDriveModal } from '../components/modals/UploadToDriveModal';

export const GoogleSheetsDatabaseView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { orders, clients, users, currentUser } = useApp();

  // Navigation tabs in this view
  const [mainViewTab, setMainViewTab] = useState<'sheets_database' | 'drive_sync' | 'apps_script'>('drive_sync');

  // Google Sheets state
  const [isConnectedOAuth, setIsConnectedOAuth] = useState<boolean>(hasValidGoogleToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [activeSheetPreviewTab, setActiveSheetPreviewTab] = useState<'orders' | 'clients' | 'production' | 'users'>('orders');
  const [showManualTokenInput, setShowManualTokenInput] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');
  const [connectedUserEmail, setConnectedUserEmail] = useState<string | null>(getAuthenticatedGoogleUser()?.email || null);
  const [showPlainPasswords, setShowPlainPasswords] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Google Apps Script & Drive config state
  const [driveConfig, setDriveConfig] = useState(getGoogleDriveConfig());
  const [appsScriptInputUrl, setAppsScriptInputUrl] = useState<string>(driveConfig.appsScriptUrl || '');
  const [isPingTesting, setIsPingTesting] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message?: string; user?: string; rootFolderUrl?: string } | null>(null);

  // Drive Upload Modal & History state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadCategory, setUploadCategory] = useState<DriveCategory>('bukti_transfer');
  const [driveArchiveFiles, setDriveArchiveFiles] = useState<DriveSyncedFile[]>([]);
  const [driveCategoryFilter, setDriveCategoryFilter] = useState<string>('all');
  const [copiedCodeSuccess, setCopiedCodeSuccess] = useState<boolean>(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState<boolean>(false);

  useEffect(() => {
    setIsConnectedOAuth(hasValidGoogleToken());
    setConnectedUserEmail(getAuthenticatedGoogleUser()?.email || null);
    setDriveArchiveFiles(getLocalDriveArchiveHistory());
    setDriveConfig(getGoogleDriveConfig());
  }, []);

  // Quick Copy Script
  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE_CODE);
    setCopiedCodeSuccess(true);
    setTimeout(() => setCopiedCodeSuccess(false), 3000);
  };

  // Test Apps Script Connection
  const handlePingAppsScript = async () => {
    try {
      setIsPingTesting(true);
      setPingResult(null);
      const res = await pingAppsScriptWebApp(appsScriptInputUrl);
      if (res.success) {
        setPingResult({
          success: true,
          message: res.message || 'Koneksi ke Google Apps Script Web App Berhasil!',
          user: res.user,
          rootFolderUrl: res.rootFolderUrl,
        });
        const updated = {
          ...driveConfig,
          appsScriptUrl: appsScriptInputUrl.trim(),
          rootFolderId: res.rootFolderId,
          rootFolderUrl: res.rootFolderUrl,
          lastSyncedAt: new Date().toISOString(),
        };
        setDriveConfig(updated);
        saveGoogleDriveConfig(updated);
        setStatusMessage({
          type: 'success',
          text: `Koneksi Google Apps Script Web App Aktif! Terhubung ke akun: ${res.user || 'Google Owner'}`,
        });
      } else {
        setPingResult({
          success: false,
          message: res.error || 'Gagal menghubungi Web App.',
        });
        setStatusMessage({
          type: 'error',
          text: res.error || 'Gagal menguji koneksi Apps Script.',
        });
      }
    } catch (err: any) {
      setPingResult({ success: false, message: err.message });
    } finally {
      setIsPingTesting(false);
    }
  };

  // Auto Create Standard Drive Folders
  const handleInitDriveFolders = async () => {
    try {
      setIsLoading(true);
      setStatusMessage({ type: 'info', text: 'Membuat struktur folder resmi KIRA_APPAREL_DATABASE di Google Drive...' });
      const res = await initDriveFoldersViaAppsScript();
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Struktur folder Google Drive berhasil dibuat! (01_Bukti_Transfer, 02_SPK_Produksi, 03_Invoice_Kwitansi, 04_Desain_Mockup)',
        });
        if (res.rootFolderUrl) {
          setDriveConfig(prev => ({ ...prev, rootFolderUrl: res.rootFolderUrl }));
        }
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Gagal membuat folder di Google Drive.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal inisialisasi folder: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Batch Sync All Data via Apps Script or Sheets API
  const handleSyncAllData = async () => {
    try {
      setIsBatchSyncing(true);
      setStatusMessage({ type: 'info', text: 'Melakukan sinkronisasi database lengkap ke Google Sheets & Drive...' });

      if (driveConfig.appsScriptUrl) {
        const res = await syncAllSheetsViaAppsScript({ orders, clients, users });
        if (res.success) {
          setStatusMessage({
            type: 'success',
            text: res.message || 'Semua tabel database berhasil disinkronkan ke Google Spreadsheet!',
          });
          return;
        }
      }

      // Fallback using direct Sheets API OAuth
      await exportOrdersToGoogleSheets(orders);
      await exportClientsToGoogleSheets(clients);
      await exportUsersToGoogleSheets(users);

      setStatusMessage({
        type: 'success',
        text: `Berhasil mengekspor ${orders.length} Pesanan, ${clients.length} Pelanggan, dan ${users.length} User ke Google Spreadsheet!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal sinkronisasi data: ${err.message}` });
    } finally {
      setIsBatchSyncing(false);
    }
  };

  // Connect Google OAuth
  const handleConnectOAuth = async () => {
    try {
      setIsLoading(true);
      setStatusMessage({ type: 'info', text: 'Membuka Google OAuth Popup...' });
      await requestGoogleAccessToken();
      setIsConnectedOAuth(true);
      setConnectedUserEmail(getAuthenticatedGoogleUser()?.email || 'Akun Google Terhubung');
      setStatusMessage({
        type: 'success',
        text: 'Akun Google berhasil diotentikasi dan terhubung ke Spreadsheet & Drive!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Otentikasi Google: ${err.message || 'Izin akses ditolak atau popup diblokir.'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGoogle();
    setIsConnectedOAuth(false);
    setConnectedUserEmail(null);
    setStatusMessage({ type: 'info', text: 'Koneksi Google Account telah diputuskan.' });
  };

  const handleSaveManualToken = () => {
    if (!manualToken.trim()) {
      alert('Masukkan Google Access Token yang valid.');
      return;
    }
    setManualAccessToken(manualToken.trim());
    setIsConnectedOAuth(true);
    setShowManualTokenInput(false);
    setStatusMessage({ type: 'success', text: 'Access Token manual berhasil disimpan!' });
  };

  const openUploadModal = (cat: DriveCategory) => {
    setUploadCategory(cat);
    setIsUploadModalOpen(true);
  };

  const handleDriveUploadSuccess = (synced: DriveSyncedFile) => {
    setDriveArchiveFiles(getLocalDriveArchiveHistory());
    setStatusMessage({
      type: 'success',
      text: `File "${synced.fileName}" berhasil diunggah ke folder Google Drive: ${synced.category}!`,
    });
  };

  // Filtered drive files
  const filteredDriveFiles = driveArchiveFiles.filter(f => {
    if (driveCategoryFilter !== 'all' && f.category !== driveCategoryFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        f.fileName.toLowerCase().includes(q) ||
        (f.orderNumber && f.orderNumber.toLowerCase().includes(q)) ||
        (f.notes && f.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold tracking-wide">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>KIRA CLOUD SYNC & DATABASE ENGINE v2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Google Drive & Spreadsheet Database
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Sinkronisasi folder Google Drive otomatis untuk <strong className="text-slate-200">Bukti Transfer, SPK, Invoice, dan Desain Kaos</strong> serta database multi-tabel Spreadsheet secara real-time.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openUploadModal('bukti_transfer')}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Unggah File ke Drive
            </button>

            <button
              type="button"
              onClick={handleSyncAllData}
              disabled={isBatchSyncing}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isBatchSyncing ? 'animate-spin' : ''}`} />
              <span>{isBatchSyncing ? 'Menyinkronkan...' : 'Sinkronkan Semua Data'}</span>
            </button>

            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Buka Spreadsheet
            </a>

            {driveConfig.rootFolderUrl && (
              <a
                href={driveConfig.rootFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
              >
                <Folder className="w-4 h-4 text-amber-400" /> Buka Folder Drive
              </a>
            )}
          </div>
        </div>

        {/* Status Indicators Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Apps Script Status */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${driveConfig.appsScriptUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-400">Apps Script Web App:</span>
              <span className="font-semibold text-white font-mono">
                {driveConfig.appsScriptUrl ? 'Terpasang & Siap' : 'Belum Dikonfigurasi'}
              </span>
            </div>

            {/* Google OAuth Status */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnectedOAuth ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="text-slate-400">OAuth Access:</span>
              <span className="font-semibold text-white">
                {isConnectedOAuth ? connectedUserEmail || 'Terhubung' : 'Offline / Standalone'}
              </span>
            </div>

            {/* Target Spreadsheet */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-slate-500">ID Sheet:</span>
              <span className="font-mono text-slate-400 truncate max-w-[140px]">{SPREADSHEET_ID}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isConnectedOAuth ? (
              <button
                type="button"
                onClick={handleConnectOAuth}
                className="text-xs text-indigo-300 hover:text-white font-semibold underline underline-offset-2 flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" /> Hubungkan OAuth Google
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect OAuth
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 text-xs sm:text-sm animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5 animate-spin" />}
            <div>
              <p className="font-semibold">{statusMessage.text}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setMainViewTab('drive_sync')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              mainViewTab === 'drive_sync'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-400" />
            <span>📁 Sinkronisasi Folder Google Drive</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">4 Kategori</span>
          </button>

          <button
            type="button"
            onClick={() => setMainViewTab('sheets_database')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              mainViewTab === 'sheets_database'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Table className="w-4 h-4 text-emerald-400" />
            <span>📊 Database Spreadsheet</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{orders.length} Data</span>
          </button>

          <button
            type="button"
            onClick={() => setMainViewTab('apps_script')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              mainViewTab === 'apps_script'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>⚡ Kode Google Apps Script (Code.gs)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">Backend API</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SINKRONISASI GOOGLE DRIVE FOLDER & ARSIP */}
      {/* ========================================================================= */}
      {mainViewTab === 'drive_sync' && (
        <div className="space-y-6">
          {/* 4 Categorized Drive Folders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEFAULT_DRIVE_CATEGORIES.map(cat => {
              const fileCount = driveArchiveFiles.filter(f => f.category === cat.key).length;
              return (
                <div
                  key={cat.key}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          cat.key === 'bukti_transfer'
                            ? 'bg-emerald-50 text-emerald-600'
                            : cat.key === 'spk'
                            ? 'bg-blue-50 text-blue-600'
                            : cat.key === 'invoice'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                      >
                        {cat.key === 'bukti_transfer' && <Receipt className="w-5 h-5" />}
                        {cat.key === 'spk' && <FileCheck2 className="w-5 h-5" />}
                        {cat.key === 'invoice' && <FileText className="w-5 h-5" />}
                        {cat.key === 'desain' && <Palette className="w-5 h-5" />}
                      </div>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-lg">
                        {fileCount} File Tersinkron
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">Folder: {cat.folderName}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{cat.description}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openUploadModal(cat.key)}
                      className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload File
                    </button>
                    {driveConfig.rootFolderUrl && (
                      <a
                        href={driveConfig.rootFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Buka Folder di Google Drive"
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drive Folders Control & Sync Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <FolderSync className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Struktur Otomatis Google Drive KIRA APPAREL</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Root Folder: <code className="text-amber-300 font-mono">KIRA_APPAREL_DATABASE</code> / [Tahun] / [01_Bukti_Transfer, 02_SPK, 03_Invoice, 04_Desain] / [No_Order - Nama_Klien]
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={handleInitDriveFolders}
                disabled={isLoading}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{isLoading ? 'Membuat Struktur...' : 'Inisialisasi Seluruh Folder di Drive'}</span>
              </button>
            </div>
          </div>

          {/* Arsip File Google Drive Log Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  Daftar Arsip & Log Sinkronisasi Google Drive
                </h3>
                <p className="text-xs text-slate-500">
                  Total {filteredDriveFiles.length} berkas tercatat dan terhubung langsung ke Google Drive
                </p>
              </div>

              {/* Filter and Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Cari file / order..."
                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 w-48"
                  />
                </div>

                <select
                  value={driveCategoryFilter}
                  onChange={e => setDriveCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="bukti_transfer">Bukti Transfer</option>
                  <option value="spk">SPK Produksi</option>
                  <option value="invoice">Invoice & Kwitansi</option>
                  <option value="desain">Desain Kaos</option>
                </select>

                <button
                  type="button"
                  onClick={() => openUploadModal('bukti_transfer')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Unggah Baru
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Waktu Sync</th>
                    <th className="px-4 py-3">No. Order</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Nama Berkas</th>
                    <th className="px-4 py-3">Diunggah Oleh</th>
                    <th className="px-4 py-3">Aksi & Link Drive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDriveFiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        <Folder className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold">Belum ada file yang diunggah ke Google Drive</p>
                        <p className="text-[11px] mt-1 text-slate-400">
                          Klik tombol "Unggah Baru" untuk mulai menyimpan Bukti Transfer, SPK, Invoice, atau Desain.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDriveFiles.map(file => (
                      <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
                          {formatDateTimeID(file.uploadedAt)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {file.orderNumber || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              file.category === 'bukti_transfer'
                                ? 'bg-emerald-100 text-emerald-800'
                                : file.category === 'spk'
                                ? 'bg-blue-100 text-blue-800'
                                : file.category === 'invoice'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {file.category === 'bukti_transfer' && 'Bukti Transfer'}
                            {file.category === 'spk' && 'SPK Produksi'}
                            {file.category === 'invoice' && 'Invoice'}
                            {file.category === 'desain' && 'Desain Jersey'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-medium max-w-xs truncate">
                          {file.fileName}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{file.uploadedBy || 'Staff KIRA'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Buka di Drive
                            </a>
                            {file.downloadUrl && (
                              <a
                                href={file.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                                title="Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DATABASE GOOGLE SPREADSHEET */}
      {/* ========================================================================= */}
      {mainViewTab === 'sheets_database' && (
        <div className="space-y-6">
          {/* Sub-tabs for Sheet Tables */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveSheetPreviewTab('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSheetPreviewTab === 'orders'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Tab Pesanan ({orders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSheetPreviewTab('clients')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSheetPreviewTab === 'clients'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Tab Pelanggan ({clients.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSheetPreviewTab('production')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    activeSheetPreviewTab === 'production'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Tab Produksi Workshop</span>
                </button>

                {currentUser.role === 'super_admin' && (
                  <button
                    type="button"
                    onClick={() => setActiveSheetPreviewTab('users')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      activeSheetPreviewTab === 'users'
                        ? 'bg-indigo-900 text-indigo-200 ring-2 ring-indigo-500/50'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    <span>Tab Users & Password ({users.length})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentUser.role === 'super_admin' && activeSheetPreviewTab === 'users' && (
                  <button
                    type="button"
                    onClick={() => setShowPlainPasswords(!showPlainPasswords)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {showPlainPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPlainPasswords ? 'Sembunyikan Password' : 'Lihat Plain Password'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSyncAllData}
                  disabled={isBatchSyncing}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  <span>Push ke Google Sheets</span>
                </button>
              </div>
            </div>

            {/* Orders Table Preview */}
            {activeSheetPreviewTab === 'orders' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5">No. Order</th>
                      <th className="px-3 py-2.5">Nama Klien / Tim</th>
                      <th className="px-3 py-2.5">Produk & Bahan</th>
                      <th className="px-3 py-2.5 text-center">Qty (Pcs)</th>
                      <th className="px-3 py-2.5 text-right">Total Biaya</th>
                      <th className="px-3 py-2.5 text-right">Status Bayar</th>
                      <th className="px-3 py-2.5">Tahap Produksi</th>
                      <th className="px-3 py-2.5">Drive Folder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-slate-900">{o.orderNumber}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-800">{o.clientCompany || o.clientName}</p>
                          <p className="text-[11px] text-slate-500">{o.clientPhone}</p>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {o.productType} • {o.fabric}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-800">{o.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-700">{formatRupiah(o.totalAmount)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.invoice.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.invoice.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">{o.currentStageId}</td>
                        <td className="px-3 py-2.5">
                          {o.driveFolderUrl ? (
                            <a
                              href={o.driveFolderUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-1"
                            >
                              <Folder className="w-3.5 h-3.5" /> Buka Folder
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Clients Table Preview */}
            {activeSheetPreviewTab === 'clients' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5">ID Pelanggan</th>
                      <th className="px-3 py-2.5">Nama PIC / Instansi</th>
                      <th className="px-3 py-2.5">WhatsApp</th>
                      <th className="px-3 py-2.5">Email</th>
                      <th className="px-3 py-2.5">Alamat Pengiriman</th>
                      <th className="px-3 py-2.5 text-center">Pesanan</th>
                      <th className="px-3 py-2.5 text-right">Total Belanja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-slate-900 font-mono">{c.clientId || c.id}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{c.name} ({c.company})</td>
                        <td className="px-3 py-2.5 text-slate-600 font-mono">{c.phone}</td>
                        <td className="px-3 py-2.5 text-slate-600">{c.email || '-'}</td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate">{c.address || '-'}</td>
                        <td className="px-3 py-2.5 text-center font-bold">{c.totalOrders}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-700">{formatRupiah(c.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Users & Passwords Table Preview */}
            {currentUser.role === 'super_admin' && activeSheetPreviewTab === 'users' && (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>
                      Tabel ini mengekspor daftar pengguna resmi dan kata sandi (Plain Text) ke Google Sheets tab <strong>"{SHEETS_CONFIG.USERS_SHEET}"</strong> untuk kemudahan manajemen Super Admin.
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[500px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-indigo-950 text-indigo-100 font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5">Nama Lengkap</th>
                        <th className="px-3 py-2.5">Email / Akun</th>
                        <th className="px-3 py-2.5">Role / Otorisasi</th>
                        <th className="px-3 py-2.5">Password (Plain Text)</th>
                        <th className="px-3 py-2.5">WhatsApp</th>
                        <th className="px-3 py-2.5">Status Akun</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="px-3 py-2.5 font-bold text-slate-900">{u.name}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-700">{u.email}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-indigo-700">
                            {showPlainPasswords ? u.password || 'superadmin123' : '••••••••••••'}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-600">{u.phone || '-'}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {u.status || 'Aktif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GOOGLE APPS SCRIPT (CODE.GS) GENERATOR & SETUP GUIDE */}
      {/* ========================================================================= */}
      {mainViewTab === 'apps_script' && (
        <div className="space-y-6">
          {/* Step by step guide card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-cyan-800 text-xs font-bold mb-2">
                <Code2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>PANDUAN PEMASANGAN GOOGLE APPS SCRIPT</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Pemasangan Kode Google Apps Script (Code.gs)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Google Apps Script bertindak sebagai backend cloud serverless yang mengeksekusi pembuatan folder otomatis, pengunggahan berkas bukti transfer, SPK, invoice, serta sinkronisasi data ke Google Spreadsheet Anda.
              </p>
            </div>

            {/* 5 Steps Visual Guide */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Buka Spreadsheet</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Buka Google Spreadsheet database resmi KIRA APPAREL milik Anda di browser.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Menu Apps Script</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Paste Code.gs</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hapus kode lama di file <code>Code.gs</code>, lalu salin dan paste seluruh kode di bawah.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  4
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Deploy Web App</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Klik <strong>Deploy &gt; New deployment &gt; Web app</strong>. Pilih Access: <strong>Anyone</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  5
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Paste URL & Ping</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Salin Web App URL (berakhiran <code>/exec</code>) lalu simpan pada formulir di bawah.
                </p>
              </div>
            </div>

            {/* Web App URL Input Form */}
            <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-cyan-400" />
                    Web App URL Endpoint (Google Apps Script)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Masukkan URL deployment Web App untuk mengaktifkan upload Drive & sinkronisasi tanpa batas.
                  </p>
                </div>
                {driveConfig.lastSyncedAt && (
                  <span className="text-[11px] text-slate-400">
                    Terakhir Sync: {formatDateTimeID(driveConfig.lastSyncedAt)}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={appsScriptInputUrl}
                  onChange={e => setAppsScriptInputUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handlePingAppsScript}
                  disabled={isPingTesting || !appsScriptInputUrl.trim()}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Play className={`w-4 h-4 ${isPingTesting ? 'animate-spin' : ''}`} />
                  <span>{isPingTesting ? 'Menguji...' : 'Uji Koneksi (Ping)'}</span>
                </button>
              </div>

              {pingResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                    pingResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {pingResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-semibold">{pingResult.message}</p>
                    {pingResult.user && <p className="text-[11px] text-slate-400">Akun Google: {pingResult.user}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Code.gs Source Code Box */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm">File: Code.gs (Versi 2.0)</span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    ~380 baris kode
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAppsScript}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedCodeSuccess ? '✓ Seluruh Kode Berhasil Disalin!' : 'Salin Seluruh Kode Apps Script (Code.gs)'}</span>
                </button>
              </div>

              {/* Code Pre container */}
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Google Apps Script - Code.gs</span>
                  <span>JavaScript / Apps Script v8 Engine</span>
                </div>
                <pre className="p-4 sm:p-6 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed select-all">
                  {APPS_SCRIPT_SOURCE_CODE}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload to Drive Modal */}
      <UploadToDriveModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultCategory={uploadCategory}
        onSuccess={handleDriveUploadSuccess}
      />
    </div>
  );
};
