import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Table,
  UploadCloud,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  disconnectGoogle,
  exportClientsToGoogleSheets,
  exportOrdersToGoogleSheets,
  fetchOrdersFromGoogleSheets,
  getAuthenticatedGoogleUser,
  hasValidGoogleToken,
  initializeSpreadsheetTabs,
  requestGoogleAccessToken,
  SPREADSHEET_ID,
  SPREADSHEET_URL,
  testSpreadsheetConnection,
} from '../../services/googleSheetsService';

export const GoogleSheetsSyncModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { orders, clients, updateOrder } = useApp();
  const [isConnected, setIsConnected] = useState<boolean>(hasValidGoogleToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [connectedUserEmail, setConnectedUserEmail] = useState<string | null>(getAuthenticatedGoogleUser()?.email || null);

  useEffect(() => {
    if (isOpen) {
      setIsConnected(hasValidGoogleToken());
      setConnectedUserEmail(getAuthenticatedGoogleUser()?.email || null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setStatusMessage({ type: 'info', text: 'Menghubungkan ke Google Identity & Spreadsheet...' });
      await requestGoogleAccessToken();
      setIsConnected(true);
      setConnectedUserEmail(getAuthenticatedGoogleUser()?.email || 'Akun Google Terhubung');
      
      const test = await testSpreadsheetConnection();
      if (test.success) {
        setStatusMessage({
          type: 'success',
          text: `Google Account & Spreadsheet "${test.spreadsheetTitle || 'KIRA APPAREL'}" berhasil terhubung!`,
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Google Account berhasil terhubung! Anda sekarang dapat melakukan sinkronisasi dua arah.',
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Gagal otentikasi Google: ${err.message || 'Izin akses ditolak'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPing = async () => {
    try {
      setIsLoading(true);
      setStatusMessage({ type: 'info', text: 'Menguji koneksi ke Google Spreadsheet...' });
      const test = await testSpreadsheetConnection();
      if (test.success) {
        setIsConnected(true);
        setStatusMessage({
          type: 'success',
          text: `Koneksi Google Sheets Aktif! Berhasil mengakses Spreadsheet "${test.spreadsheetTitle}".`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Uji koneksi gagal: ${test.error}`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGoogle();
    setIsConnected(false);
    setConnectedUserEmail(null);
    setStatusMessage({ type: 'info', text: 'Koneksi akun Google telah diputus.' });
  };

  const handleInitSheets = async () => {
    try {
      setIsLoading(true);
      setStatusMessage({ type: 'info', text: 'Menyiapkan Sheet Pesanan, Pelanggan, dan Produksi...' });
      await initializeSpreadsheetTabs();
      setStatusMessage({ type: 'success', text: 'Struktur Google Sheet KIRA APPAREL (Pesanan, Pelanggan, Produksi_Workshop) siap digunakan!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal inisialisasi sheet: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAll = async () => {
    try {
      setIsLoading(true);
      setStatusMessage({ type: 'info', text: `Mengirim ${orders.length} pesanan dan ${clients.length} pelanggan ke Google Spreadsheet...` });
      
      const orderCount = await exportOrdersToGoogleSheets(orders);
      const clientCount = await exportClientsToGoogleSheets(clients);
      
      setStatusMessage({
        type: 'success',
        text: `Berhasil mengekspor ${orderCount} pesanan dan ${clientCount} pelanggan ke Google Spreadsheet resmi KIRA!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal ekspor data: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportOrders = async () => {
    try {
      setIsLoading(true);
      setStatusMessage({ type: 'info', text: 'Mengambil data terbaru dari Google Spreadsheet...' });
      const imported = await fetchOrdersFromGoogleSheets();
      
      if (imported.length === 0) {
        setStatusMessage({ type: 'info', text: 'Sheet Pesanan masih kosong. Silakan ekspor data terlebih dahulu.' });
      } else {
        // Update or add locally
        imported.forEach(imp => {
          if (imp.id) {
            updateOrder(imp.id, imp);
          }
        });
        setStatusMessage({
          type: 'success',
          text: `Berhasil mengimpor & mensinkronkan ${imported.length} baris data pesanan dari Google Spreadsheet!`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Gagal impor dari Spreadsheet: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold font-['Outfit',sans-serif]">
                  Google Spreadsheet Database Sync
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#c8b320] text-black">
                  Official DB
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Koneksi langsung ke Google Spreadsheet Manajemen KIRA APPAREL
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Target Spreadsheet Info Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Spreadsheet Database Terkoneksi:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-800 break-all">
                  ID: {SPREADSHEET_ID}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sheet: <strong className="text-slate-700">Pesanan</strong>, <strong className="text-slate-700">Pelanggan</strong>, <strong className="text-slate-700">Produksi_Workshop</strong>
              </p>
            </div>

            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-emerald-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs whitespace-nowrap transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Google Sheets</span>
            </a>
          </div>

          {/* Connection Status & Auth */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {isConnected ? 'Akun Google & OAuth2 Terhubung' : 'Belum Terhubung ke Google OAuth'}
                </h4>
                <p className="text-[11px] text-slate-600">
                  {isConnected
                    ? `Izin baca/tulis aktif ${connectedUserEmail ? `(${connectedUserEmail})` : ''}.`
                    : 'Klik tombol di samping untuk mengaktifkan izin sinkronisasi Spreadsheet.'}
                </p>
              </div>
            </div>

            {!isConnected ? (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Hubungkan Google</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-bold"
                  title="Uji Akses Spreadsheet"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Uji Ping</span>
                </button>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-[11px] font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-Auth</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="font-semibold">{statusMessage.text}</div>
            </div>
          )}

          {/* Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sync to Sheet */}
            <button
              type="button"
              onClick={handleExportAll}
              disabled={isLoading}
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-between group transition-all text-left shadow-sm disabled:opacity-50"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#c8b320]">
                  <ArrowUpFromLine className="w-4 h-4" />
                  <span>Kirim Data ke Spreadsheet</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Ekspor seluruh {orders.length} pesanan, SPK, dan {clients.length} pelanggan ke Google Sheets.
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-[#c8b320] group-hover:scale-110 transition-transform" />
            </button>

            {/* Fetch from Sheet */}
            <button
              type="button"
              onClick={handleImportOrders}
              disabled={isLoading}
              className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-slate-900 border border-emerald-300 flex items-center justify-between group transition-all text-left disabled:opacity-50"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Tarik Data dari Spreadsheet</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Sinkronkan pesanan terbaru yang diinputkan langsung di Google Sheets ke dalam aplikasi.
                </p>
              </div>
              <Database className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Otomatis menyinkronkan saat ada pesanan baru.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
