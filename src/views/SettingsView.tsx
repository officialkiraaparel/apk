import React, { useState } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  Coins,
  Database,
  FileText,
  Layers,
  Lock,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Save,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompanySettings } from '../types';
import { KIRA_LOGO_URL, OFFICIAL_SUPERADMIN_USER } from '../utils/constants';

export const SettingsView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const {
    settings,
    updateSettings,
    currentUser,
    clearDummyData,
    loadDemoData,
    orders,
    clients,
    users,
  } = useApp();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupType, setCleanupType] = useState<'purge' | 'restore'>('purge');

  const isSuperAdmin = currentUser.role === 'super_admin';

  // Form State
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || KIRA_LOGO_URL);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);

  const [orderPrefix, setOrderPrefix] = useState(settings.orderPrefix);
  const [spkPrefix, setSpkPrefix] = useState(settings.spkPrefix);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);

  const [bankName, setBankName] = useState(settings.bankAccounts[0]?.bankName || 'BCA');
  const [accountNumber, setAccountNumber] = useState(settings.bankAccounts[0]?.accountNumber || '882-019-4481');
  const [accountHolder, setAccountHolder] = useState(
    settings.bankAccounts[0]?.accountHolder || 'PT KIRA APAREL INDONESIA'
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const newSettings: CompanySettings = {
      ...settings,
      companyName,
      tagline,
      logoUrl,
      address,
      phone,
      email,
      orderPrefix,
      spkPrefix,
      invoicePrefix,
      bankAccounts: [
        {
          bankName,
          accountNumber,
          accountHolder,
        },
      ],
    };

    updateSettings(newSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleCleanupConfirm = () => {
    if (!isSuperAdmin) return;
    if (cleanupType === 'purge') {
      clearDummyData();
      setCleanupMessage('Data dummy berhasil dibersihkan! Seluruh sampel pesanan dan klien dihapus. Sistem bersih dan siap digunakan (Go-Live).');
    } else {
      loadDemoData();
      setCleanupMessage('Data sampel demo berhasil dimuat kembali.');
    }
    setShowCleanupModal(false);
    setTimeout(() => setCleanupMessage(null), 5000);
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
              Konfigurasi Sistem
            </span>
            <span className="text-xs text-slate-500">KIRA APAREL Core</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit',sans-serif] mt-1">
            Pengaturan Profil & Format Penomoran
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan identitas perusahaan di header SPK, Invoice resmi, rekening bank, dan nomor awalan dokumen.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Pengaturan perusahaan dan format dokumen berhasil disimpan ke sistem!</span>
        </div>
      )}

      {cleanupMessage && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>{cleanupMessage}</span>
          </div>
          <button
            onClick={() => setCleanupMessage(null)}
            className="p-1 text-indigo-600 hover:text-indigo-900 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Identitas Usaha Konveksi</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img
                  src={logoUrl || KIRA_LOGO_URL}
                  alt="Preview Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = KIRA_LOGO_URL;
                  }}
                />
              </div>
              <div className="flex-1 w-full space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">URL Logo Resmi Kira Apparel</label>
                  <button
                    type="button"
                    onClick={() => setLogoUrl(KIRA_LOGO_URL)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Reset ke Logo Resmi
                  </button>
                </div>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://drive.google.com/... atau URL gambar langsung"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500">
                  Logo ini ditampilkan secara otomatis pada Website Navbar, Sidebar, Landing Page, Dokumen Invoice Resmi, dan SPK Workshop.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Brand / Usaha *</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Resmi *</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Workshop / Kantor</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Document Numbering Prefixes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Format Awalan Dokumen (Prefix)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prefix Order ID</label>
              <input
                type="text"
                value={orderPrefix}
                onChange={e => setOrderPrefix(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh hasil: KA-20260828-001</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prefix SPK Workshop</label>
              <input
                type="text"
                value={spkPrefix}
                onChange={e => setSpkPrefix(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh: SPK-KA-2026-0828-001</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prefix Invoice Tagihan</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={e => setInvoicePrefix(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Contoh: INV-KA-2026-0828-001</span>
            </div>
          </div>
        </div>

        {/* Bank & Payment Accounts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Coins className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Rekening Transfer Resmi (Di Invoice)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Atas Nama Rekening</label>
              <input
                type="text"
                value={accountHolder}
                onChange={e => setAccountHolder(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Data Cleanup & Deployment Ready Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Pembersihan Data Dummy (Deployment Ready)</h3>
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Khusus Super Admin
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Gunakan fitur ini ketika aplikasi siap di-deploy ke server produksi untuk mengosongkan pesanan uji coba, invoice sampel, dan akun demo. Akun Super Admin resmi (<strong>officialkiraaparel@gmail.com</strong>) dan akun kustom Anda akan tetap aman.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Pesanan Saat Ini:</span>
              <strong className="text-slate-900 font-mono text-sm">{orders.length} order</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Klien Saat Ini:</span>
              <strong className="text-slate-900 font-mono text-sm">{clients.length} klien</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Pengguna Sistem:</span>
              <strong className="text-slate-900 font-mono text-sm">{users.length} akun</strong>
            </div>
          </div>

          {isSuperAdmin ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                id="btn-settings-purge-dummy"
                onClick={() => {
                  setCleanupType('purge');
                  setShowCleanupModal(true);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua Data Dummy (Bersihkan Sistem)</span>
              </button>

              <button
                type="button"
                id="btn-settings-load-demo"
                onClick={() => {
                  setCleanupType('restore');
                  setShowCleanupModal(true);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Data Demo / Sampel</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('users')}
                className="px-4 py-2.5 text-indigo-600 hover:text-indigo-800 font-bold text-xs hover:underline flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>Buka Manajemen Pengguna & Approval</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Hanya Super Admin yang berwenang membersihkan data dummy sistem.</span>
            </div>
          )}
        </div>
      </form>

      {/* Confirmation Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base text-slate-900">
                  {cleanupType === 'purge' ? 'Bersihkan Seluruh Data Dummy?' : 'Muat Kembali Data Demo?'}
                </h3>
              </div>
              <button onClick={() => setShowCleanupModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              {cleanupType === 'purge' ? (
                <>
                  <p>
                    Apakah Anda yakin ingin <strong>menghapus seluruh data dummy</strong> (pesanan contoh, invoice simulasi, dan klien demo)?
                  </p>
                  <p className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                    Aplikasi akan 100% bersih dan siap untuk go-live produksi. Akun Super Admin resmi (officialkiraaparel@gmail.com) tetap aman dipertahankan.
                  </p>
                </>
              ) : (
                <p>
                  Tindakan ini akan memuat kembali data sampel pesanan dan invoice untuk keperluan simulasi / pengujian fitur.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCleanupModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCleanupConfirm}
                className={`px-4 py-2 font-bold text-xs rounded-xl text-white ${
                  cleanupType === 'purge'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/20'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {cleanupType === 'purge' ? 'Ya, Bersihkan Data Dummy' : 'Ya, Muat Data Demo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
