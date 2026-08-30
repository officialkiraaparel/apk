import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpFromLine,
  Building,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Download,
  Edit2,
  Eye,
  EyeOff,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Info,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role, User } from '../types';
import { ROLE_SECURITY_CONFIG } from '../utils/security';
import { OFFICIAL_SUPERADMIN_USER } from '../utils/constants';

export const UserManagementView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const {
    users,
    currentUser,
    approveUser,
    rejectUser,
    addUserByAdmin,
    updateUser,
    deleteUser,
    clearDummyData,
    loadDemoData,
    orders,
    clients,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'pending' | 'matrix' | 'cleanup' | 'spreadsheet'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [showPlainPasswords, setShowPlainPasswords] = useState<boolean>(true);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupActionType, setCleanupActionType] = useState<'purge' | 'restore'>('purge');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<Role>('marketing');
  const [formPhone, setFormPhone] = useState('');

  // Pending Approval temporary role selections state (maps userId to chosen Role)
  const [selectedApprovalRoles, setSelectedApprovalRoles] = useState<Record<string, Role>>({});

  const isSuperAdmin = currentUser.role === 'super_admin';

  // Derived lists
  const pendingUsers = users.filter(u => u.status === 'pending_approval');
  const activeUsers = users.filter(u => u.status !== 'pending_approval');

  const filteredUsers = activeUsers.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const copyUsersTableToClipboard = () => {
    const header = ['ID Pengguna', 'Nama Lengkap', 'Email/Username', 'Password', 'Role', 'Status', 'WhatsApp', 'Hak Akses & Otorisasi'];
    const rows = users.map(u => [
      u.id,
      u.name,
      u.email,
      u.password || 'kira2026',
      u.role,
      u.status || 'active',
      u.phone || '-',
      u.notes || '-',
    ]);
    const tsv = [header.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopiedNotification('Tabel Data Pengguna & Kredensial berhasil disalin ke Clipboard! Anda dapat langsung paste (Ctrl+V) ke Excel atau Google Sheets.');
    setTimeout(() => setCopiedNotification(null), 4000);
  };

  const downloadUsersCsv = () => {
    const header = ['ID Pengguna', 'Nama Lengkap', 'Email / Username', 'Password (Plain Text)', 'Role / Tingkat Akses', 'Status Akun', 'WhatsApp', 'Catatan / Wewenang'];
    const rows = users.map(u => [
      `"${u.id}"`,
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.password || 'kira2026'}"`,
      `"${u.role}"`,
      `"${u.status || 'active'}"`,
      `"${u.phone || '-'}"`,
      `"${u.notes || '-'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kira_Apparel_Users_Spreadsheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openAddModal = () => {
    if (!isSuperAdmin) {
      showNotification('Akses Dibatasi: Hanya Super Admin yang dapat menambahkan akun pengguna secara langsung.', 'error');
      return;
    }
    setFormName('');
    setFormEmail('');
    setFormRole('marketing');
    setFormPhone('');
    setEditingUser(null);
    setShowAddModal(true);
  };

  const openEditModal = (u: User) => {
    if (!isSuperAdmin) {
      showNotification('Akses Dibatasi: Hanya Super Admin yang dapat mengubah role dan akun pengguna.', 'error');
      return;
    }
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormPhone(u.phone || '');
    setShowAddModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showNotification('Akses Ditolak: Anda tidak memiliki wewenang Super Admin.', 'error');
      return;
    }
    if (!formName.trim() || !formEmail.trim()) {
      showNotification('Nama dan Email wajib diisi.', 'error');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        phone: formPhone.trim(),
      });
      showNotification(`Data akun "${formName}" berhasil diperbarui.`);
    } else {
      addUserByAdmin({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        phone: formPhone.trim(),
      });
      showNotification(`Akun baru "${formName}" (${formRole}) berhasil ditambahkan dan aktif.`);
    }
    setShowAddModal(false);
  };

  const handleDeleteUser = (u: User) => {
    if (!isSuperAdmin) {
      showNotification('Hanya Super Admin yang berwenang menghapus akun pengguna!', 'error');
      return;
    }
    if (u.id === currentUser.id) {
      showNotification('Anda tidak dapat menghapus akun Anda yang sedang login!', 'error');
      return;
    }
    if (u.email.toLowerCase() === OFFICIAL_SUPERADMIN_USER.email.toLowerCase()) {
      showNotification('Akun Super Admin Resmi Utama tidak dapat dihapus demi keamanan sistem.', 'error');
      return;
    }
    if (window.confirm(`Hapus akun pengguna "${u.name}" (${u.role}) secara permanen?`)) {
      deleteUser(u.id);
      showNotification(`Akun "${u.name}" telah dihapus dari sistem.`);
    }
  };

  const handleApprove = (user: User) => {
    if (!isSuperAdmin) {
      showNotification('Hanya Super Admin yang dapat menyetujui akun baru.', 'error');
      return;
    }
    const finalRole = selectedApprovalRoles[user.id] || user.requestedRole || 'marketing';
    approveUser(user.id, finalRole);
    showNotification(`Akun "${user.name}" berhasil disetujui sebagai ${ROLE_SECURITY_CONFIG[finalRole]?.badgeLabel || finalRole}!`);
  };

  const handleReject = (user: User) => {
    if (!isSuperAdmin) {
      showNotification('Hanya Super Admin yang dapat menolak pendaftaran akun.', 'error');
      return;
    }
    if (window.confirm(`Tolak pendaftaran akun "${user.name}" (${user.email})? Data permohonan akan dihapus.`)) {
      rejectUser(user.id);
      showNotification(`Permohonan akun "${user.name}" telah ditolak dan dihapus.`, 'error');
    }
  };

  const handleExecuteCleanup = () => {
    if (!isSuperAdmin) {
      showNotification('Hanya Super Admin yang dapat membersihkan data sistem.', 'error');
      setShowCleanupModal(false);
      return;
    }

    if (cleanupActionType === 'purge') {
      clearDummyData();
      showNotification('Data dummy berhasil dibersihkan! Sistem kini bersih dan siap digunakan untuk operasional resmi (Go-Live).');
    } else {
      loadDemoData();
      showNotification('Data sampel demo berhasil dimuat kembali untuk pengujian fitur.');
    }
    setShowCleanupModal(false);
  };

  const getRoleBadge = (r: Role) => {
    const config = ROLE_SECURITY_CONFIG[r];
    if (!config) {
      return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700">{r}</span>;
    }
    return (
      <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder}`}>
        {config.badgeLabel}
      </span>
    );
  };

  return (
    <div id="user-management-view" className="space-y-6">
      {/* Action Notification Toast */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 hover:text-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
              Hak Akses & Otorisasi Keamanan (RBAC)
            </span>
            <span className="text-xs text-slate-500">Security & Roles</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit',sans-serif] mt-1">
            Manajemen Pengguna & Otorisasi Staf
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kontrol keamanan Super Admin, persetujuan pendaftaran akun Marketing, Admin, Produksi, dan pembersihan data dummy.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <button
              id="btn-open-clean-dummy"
              onClick={() => {
                setCleanupActionType('purge');
                setShowCleanupModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
              title="Bersihkan Data Dummy untuk Kesiapan Deploy Produksi"
            >
              <Database className="w-4 h-4 text-amber-700" />
              <span>Hapus Data Dummy (Siap Deploy)</span>
            </button>
          )}

          {isSuperAdmin ? (
            <button
              id="btn-add-user-super-admin"
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Mode Baca Saja (Bukan Super Admin)</span>
            </div>
          )}
        </div>
      </div>

      {/* Super Admin Registration Security Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
          isSuperAdmin
            ? 'bg-purple-50/70 border-purple-200 text-purple-950'
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-start gap-3">
          {isSuperAdmin ? (
            <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <p className="font-bold">
              {isSuperAdmin
                ? '👑 Otorisasi Level 5 (Super Admin): Anda berwenang menyetujui akun Marketing, Admin, Produksi, dan Client'
                : '🔒 Pembatasan Keamanan: Hanya akun Super Admin resmi yang berwenang memberikan izin role staf konveksi'}
            </p>
            <p className="leading-relaxed text-slate-600">
              {isSuperAdmin
                ? 'Staf baru yang mendaftar melalui form login akan masuk ke daftar "Menunggu Persetujuan". Anda dapat memilih dan mengizinkan role mereka sebelum mereka dapat masuk ke sistem.'
                : 'Akun Anda berstatus staf aktif. Hubungi Super Admin (officialkiraaparel@gmail.com) untuk penyesuaian hak akses.'}
            </p>
          </div>
        </div>

        {pendingUsers.length > 0 && isSuperAdmin && (
          <button
            onClick={() => setActiveTab('pending')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs animate-pulse"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingUsers.length} Permohonan Menunggu</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            id="tab-all-users"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pengguna Aktif ({activeUsers.length})</span>
          </button>

          <button
            type="button"
            id="tab-pending-approvals"
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'pending'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Menunggu Persetujuan</span>
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white leading-none">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-security-matrix"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Matriks Hak Akses (RBAC)</span>
          </button>

          <button
            type="button"
            id="tab-cleanup-tools"
            onClick={() => setActiveTab('cleanup')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cleanup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kesiapan Deploy & Data Bersih</span>
          </button>

          <button
            type="button"
            id="tab-spreadsheet-credentials"
            onClick={() => setActiveTab('spreadsheet')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'spreadsheet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Spreadsheet Kredensial & Hak Akses ({users.length})</span>
          </button>
        </div>

        {/* Quick Filter in Active Users tab */}
        {activeTab === 'users' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, hp..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <select
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="all">Semua Role</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="marketing">Marketing</option>
              <option value="produksi">Produksi</option>
              <option value="client">Client</option>
            </select>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DAFTAR PENGGUNA AKTIF                             */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Nama Lengkap & Status</th>
                  <th className="py-3.5 px-4">Email Akun</th>
                  <th className="py-3.5 px-4">Role & Hak Akses</th>
                  <th className="py-3.5 px-4">No. WhatsApp</th>
                  <th className="py-3.5 px-4">Info Persetujuan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada pengguna yang cocok dengan pencarian atau filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{u.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <Check className="w-2.5 h-2.5" />
                                <span>Aktif</span>
                              </span>
                              {u.id === currentUser.id && (
                                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                  Sedang Login
                                </span>
                              )}
                              {u.email.toLowerCase() === 'officialkiraaparel@gmail.com' && (
                                <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                  Akun Resmi Utama
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{u.email}</td>
                      <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{u.phone || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {u.approvedBy ? (
                          <span>Disetujui oleh <strong className="text-slate-700">{u.approvedBy}</strong></span>
                        ) : (
                          <span className="text-slate-400">Akun Terverifikasi</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isSuperAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit User & Hak Akses"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {u.id !== currentUser.id && u.email.toLowerCase() !== 'officialkiraaparel@gmail.com' && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Akun Pengguna"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Hanya Baca</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PERMOHONAN MENUNGGU PERSETUJUAN (PENDING APPROVAL) */}
      {/* ======================================================== */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 space-y-1">
              <h4 className="font-bold">Antrean Pendaftaran Pengguna Baru:</h4>
              <p className="leading-relaxed text-amber-900">
                Calon staf yang mendaftar melalui halaman Login tidak dapat masuk ke sistem sampai Anda (Super Admin) mengizinkan hak akses mereka. 
                Anda dapat menyetujui calon staf sesuai permohonan role mereka (Marketing, Admin, Produksi, atau Client), atau menggantinya sesuai penugasan divisi.
              </p>
            </div>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Tidak Ada Permohonan Pending</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Semua pendaftar akun telah disetujui atau diproses. Pendaftaran baru dari form login akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map(user => {
                const requested = user.requestedRole || 'marketing';
                const currentChosenRole = selectedApprovalRoles[user.id] || requested;

                return (
                  <div
                    key={user.id}
                    className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-xs space-y-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-bl-xl">
                      Menunggu Approval
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{user.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Request Details */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Mengajukan Role:</span>
                        {getRoleBadge(requested)}
                      </div>
                      {user.registeredAt && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Waktu Pendaftaran:</span>
                          <span className="font-mono text-slate-700">
                            {new Date(user.registeredAt).toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      {user.notes && (
                        <div className="pt-1 border-t border-slate-200 text-[11px]">
                          <span className="text-slate-500 font-semibold block">Catatan Pendaftar:</span>
                          <p className="text-slate-700 italic mt-0.5">{user.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Super Admin Approval Controls */}
                    {isSuperAdmin ? (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Tetapkan & Izinkan Sebagai:
                          </label>
                          <select
                            value={currentChosenRole}
                            onChange={e =>
                              setSelectedApprovalRoles(prev => ({
                                ...prev,
                                [user.id]: e.target.value as Role,
                              }))
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                          >
                            <option value="marketing">💼 Marketing Officer (Akses Penjualan & Order)</option>
                            <option value="admin">🛡️ Admin Operasional (Verifikasi Kas & Dokumen)</option>
                            <option value="produksi">🏭 Produksi Workshop (SPK & Progress Jahit)</option>
                            <option value="client">👤 Client / Pelanggan (Portal Mandiri)</option>
                            <option value="super_admin">👑 Super Admin (Direksi / Full Access)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(user)}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Setujui & Aktifkan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(user)}
                            className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all"
                          >
                            <UserX className="w-4 h-4" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Hanya Super Admin yang dapat menyetujui akun</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MATRIKS HAK AKSES & PEMBATASAN KEAMANAN (RBAC)    */}
      {/* ======================================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950">
              <h4 className="font-bold text-indigo-900 mb-1">Prinsip Keamanan Role-Based Access Control (RBAC):</h4>
              <p className="leading-relaxed">
                Setiap role memiliki batasan wewenang ketat untuk melindungi integritas kas keuangan, data invoice, dan kepatuhan workshop. 
                Role Marketing secara khusus <strong>dilarang memverifikasi pembayaran kas sendiri</strong> dan <strong>dilarang menghapus pesanan</strong> guna mencegah penyalahgunaan dan dispute tagihan.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Matriks Hak Akses Antar Divisi
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Fitur / Modul Operasional</th>
                    <th className="py-3 px-3 text-center bg-purple-50 text-purple-900">👑 Super Admin</th>
                    <th className="py-3 px-3 text-center bg-rose-50 text-rose-900">🛡️ Admin</th>
                    <th className="py-3 px-3 text-center bg-blue-50 text-blue-900">💼 Marketing</th>
                    <th className="py-3 px-3 text-center bg-amber-50 text-amber-900">🏭 Produksi</th>
                    <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-900">👤 Client</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-800">Registrasi Pengguna Baru</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh (Approve/Reject)</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-bold">-</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-bold">-</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-bold">-</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Mandiri</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-800">Buat Pesanan & SPK Baru</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-bold">-</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Mandiri</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-800">Hapus Pesanan / Pelanggan</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                    <td className="py-3 px-3 text-center text-rose-600 font-bold">🔒 Dibatasi</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-bold">-</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-bold">-</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-800">Verifikasi Slip Pembayaran Kas</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                    <td className="py-3 px-3 text-center text-rose-600 font-bold">🔒 Dilarang (Cegah Fraud)</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-bold">-</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-bold">-</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-800">Update Alur Produksi & Upload Bukti Workshop</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-bold">-</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                    <td className="py-3 px-3 text-center text-slate-300 font-bold">-</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-800">Pembersihan Data Dummy (Deploy Ready)</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">✓ Eksklusif Super Admin</td>
                    <td className="py-3 px-3 text-center text-rose-600 font-bold">🔒 Dilarang</td>
                    <td className="py-3 px-3 text-center text-rose-600 font-bold">🔒 Dilarang</td>
                    <td className="py-3 px-3 text-center text-rose-600 font-bold">🔒 Dilarang</td>
                    <td className="py-3 px-3 text-center text-rose-600 font-bold">🔒 Dilarang</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: KESIAPAN DEPLOY & DATA BERSIH                     */}
      {/* ======================================================== */}
      {activeTab === 'cleanup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pembersihan Data Dummy & Kesiapan Deploy Produksi
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bersihkan seluruh pesanan sampel, invoice contoh, dan akun pengujian sebelum aplikasi di-deploy untuk operasional riil.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Production Ready</span>
                </span>
              </div>
            </div>

            {/* Current State Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[11px] font-semibold block">Total Pesanan Saat Ini:</span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {orders.length} Pesanan
                </span>
                <span className="text-[10px] text-slate-400">Termasuk invoice & SPK sampel</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[11px] font-semibold block">Total Pelanggan Terdaftar:</span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {clients.length} Pelanggan
                </span>
                <span className="text-[10px] text-slate-400">Data profil klien</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[11px] font-semibold block">Akun Pengguna Sistem:</span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {users.length} Akun
                </span>
                <span className="text-[10px] text-slate-400">Termasuk Super Admin resmi</span>
              </div>
            </div>

            {/* What gets cleaned checklist */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-950">
              <h4 className="font-bold flex items-center gap-2 text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Rincian Tindakan Pembersihan Data:</span>
              </h4>
              <ul className="space-y-1.5 pl-6 list-disc text-slate-700">
                <li>
                  <strong>Menghapus:</strong> Seluruh pesanan sampel konveksi, nomor invoice dummy, dan riwayat workshop demo.
                </li>
                <li>
                  <strong>Menghapus:</strong> Seluruh data klien contoh (dummy clients).
                </li>
                <li>
                  <strong>Menghapus:</strong> Akun pengujian default yang bukan buatan Anda.
                </li>
                <li>
                  <strong>Mempertahankan:</strong> Akun Super Admin resmi (<strong>officialkiraaparel@gmail.com</strong>) dan akun kustom yang telah Anda buat.
                </li>
                <li>
                  <strong>Mempertahankan:</strong> Pengaturan brand, logo resmi Kira Apparel, format nomor dokumen (Prefix), dan rekening bank resmi.
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            {isSuperAdmin ? (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  id="btn-confirm-purge-dummy"
                  onClick={() => {
                    setCleanupActionType('purge');
                    setShowCleanupModal(true);
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Semua Data Dummy Sekarang</span>
                </button>

                <button
                  type="button"
                  id="btn-restore-demo-data"
                  onClick={() => {
                    setCleanupActionType('restore');
                    setShowCleanupModal(true);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Muat Ulang Data Sampel / Demo</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Hanya akun dengan hak akses Super Admin yang dapat mengeksekusi pembersihan data</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: SPREADSHEET KREDENSIAL & HAK AKSES                */}
      {/* ======================================================== */}
      {activeTab === 'spreadsheet' && (
        <div className="space-y-6">
          {/* Official Super Admin Credentials Card */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-[#c8b320] text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0 text-2xl">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#c8b320] text-black">
                      AKUN UTAMA SUPER ADMIN
                    </span>
                    <span className="text-xs text-purple-300 font-bold">Otorisasi Tertinggi (Level 5)</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold font-['Outfit',sans-serif] tracking-tight mt-1">
                    {OFFICIAL_SUPERADMIN_USER.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
                    Akun pemilik utama dengan wewenang absolut: menyetujui staf baru (Marketing, Admin, Produksi), mengelola data finansial kas, membersihkan data dummy, dan sinkronisasi Google Sheets.
                  </p>
                </div>
              </div>

              {/* Super Admin Credential Box */}
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 space-y-2 text-xs shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-purple-200">Username / Email:</span>
                  <span className="font-mono font-bold text-[#c8b320]">{OFFICIAL_SUPERADMIN_USER.email}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-purple-200">Password Asli:</span>
                  <span className="font-mono font-black px-2 py-0.5 bg-amber-400 text-slate-950 rounded-md">
                    {showPlainPasswords ? OFFICIAL_SUPERADMIN_USER.password : '••••••••••••'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-purple-200">WhatsApp:</span>
                  <span className="font-mono text-white">{OFFICIAL_SUPERADMIN_USER.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spreadsheet Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-['Outfit',sans-serif]">
                  Daftar Kredensial Pengguna & Hak Akses (Format Spreadsheet)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seluruh akun terdaftar beserta username, password asli (tidak dalam MD5), status, dan rincian hak akses.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlainPasswords(!showPlainPasswords)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
                >
                  {showPlainPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPlainPasswords ? 'Sembunyikan Password' : 'Lihat Password Asli'}</span>
                </button>

                <button
                  type="button"
                  onClick={copyUsersTableToClipboard}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                  title="Salin tabel ke clipboard (TSV) agar siap di-paste di Microsoft Excel atau Google Sheets"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Salin ke Clipboard (Excel)</span>
                </button>

                <button
                  type="button"
                  onClick={downloadUsersCsv}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                  title="Download daftar user ke file .csv"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download File CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('google_sheets')}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Buka Google Sheets Database</span>
                </button>
              </div>
            </div>

            {copiedNotification && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{copiedNotification}</span>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">ID Pengguna</th>
                    <th className="py-3.5 px-4">Nama Lengkap</th>
                    <th className="py-3.5 px-4">Email / Username</th>
                    <th className="py-3.5 px-4">Password (Plain Text)</th>
                    <th className="py-3.5 px-4">Role & Akses</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">No. WhatsApp</th>
                    <th className="py-3.5 px-4">Wewenang & Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => {
                    const isSuper = u.role === 'super_admin';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {u.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {isSuper && <span className="text-amber-500 text-xs">👑</span>}
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-800">{u.email}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-black text-xs px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md">
                            {showPlainPasswords ? (u.password || 'kira2026') : '••••••••••••'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            u.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : u.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              : u.role === 'marketing'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : u.role === 'produksi'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {u.status === 'active' ? 'Aktif' : 'Menunggu Approval'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {u.phone || '-'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs text-[11px] text-slate-600 leading-relaxed">
                          {u.notes || (
                            u.role === 'super_admin'
                              ? 'Otorisasi Level 5: Full Access, User Management & Approval Staf, Hapus Data Dummy, Finansial & Kas, SPK & Invoice, Google Sheets Sync'
                              : u.role === 'admin'
                              ? 'Otorisasi Level 4: Operasional konveksi, Verifikasi Pembayaran Kas, SPK Produksi, Database Pelanggan, Export Laporan'
                              : u.role === 'marketing'
                              ? 'Otorisasi Level 3: Input Order Baru, Input Detail Jersey, Upload Desain, Catat Pembayaran DP'
                              : u.role === 'produksi'
                              ? 'Otorisasi Level 3: Workshop, Update 13 Tahap Jahit/Printing/Cutting, QC & Packing'
                              : 'Otorisasi Level 1: Client Portal, Cek Status Resi/Tracking Real-time'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TAMBAH / EDIT PENGGUNA (SUPER ADMIN)             */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'Edit Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Contoh: Rian Marketing Kira"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Akun *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="contoh: staf@kiraaparel.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tingkat Hak Akses (Role) *</label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="marketing">💼 Marketing (Penjualan, Dibatasi dari Verifikasi Kas)</option>
                  <option value="admin">🛡️ Admin (Operasional & Verifikasi Pembayaran)</option>
                  <option value="produksi">🏭 Produksi (SPK Workshop & Update Jahit)</option>
                  <option value="client">👤 Client (Portal Mandiri Pelanggan)</option>
                  <option value="super_admin">👑 Super Admin (Direksi / Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="0812..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: KONFIRMASI PEMBERSIHAN DATA DUMMY                 */}
      {/* ======================================================== */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base text-slate-900">
                  {cleanupActionType === 'purge'
                    ? 'Konfirmasi Hapus Data Dummy'
                    : 'Konfirmasi Muat Data Demo'}
                </h3>
              </div>
              <button onClick={() => setShowCleanupModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              {cleanupActionType === 'purge' ? (
                <>
                  <p>
                    Apakah Anda yakin ingin <strong>membersihkan seluruh data dummy</strong>?
                  </p>
                  <p className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                    Tindakan ini akan mengosongkan seluruh pesanan sampel dan klien demo sehingga aplikasi bersih 100% dan siap untuk go-live produksi. Akun Super Admin resmi (officialkiraaparel@gmail.com) tetap aman.
                  </p>
                </>
              ) : (
                <p>
                  Apakah Anda ingin memuat kembali data sampel demo pesanan dan klien untuk keperluan uji coba fitur?
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
                onClick={handleExecuteCleanup}
                className={`px-4 py-2 font-bold text-xs rounded-xl text-white ${
                  cleanupActionType === 'purge'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/20'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {cleanupActionType === 'purge' ? 'Ya, Bersihkan Data Dummy' : 'Ya, Muat Data Demo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
