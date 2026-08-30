import { Role } from '../types';

export interface RolePermissionMeta {
  role: Role;
  name: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: string;
  description: string;
  level: number; // 1 (lowest) - 5 (highest)
  permissions: {
    canCreateOrder: boolean;
    canEditOrder: boolean;
    canDeleteOrder: boolean;
    canRegisterClient: boolean;
    canDeleteClient: boolean;
    canUploadDesign: boolean;
    canApproveDesign: boolean;
    canManualEditInvoice: boolean;
    canManualEditSPK: boolean;
    canSubmitPayment: boolean;
    canVerifyPayment: boolean;
    canAdvanceProduction: boolean;
    canUploadProductionPhoto: boolean;
    canUpdateShipment: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
    canEditSettings: boolean;
    canSyncSpreadsheet: boolean;
  };
  securityRestrictions: string[];
}

export const ROLE_SECURITY_CONFIG: Record<Role, RolePermissionMeta> = {
  super_admin: {
    role: 'super_admin',
    name: 'Super Admin / Direksi',
    badgeLabel: '👑 Super Admin',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300',
    icon: '👑',
    description: 'Akses penuh tanpa batas ke seluruh modul, manajemen user, reset database, dan audit pembukuan.',
    level: 5,
    permissions: {
      canCreateOrder: true,
      canEditOrder: true,
      canDeleteOrder: true,
      canRegisterClient: true,
      canDeleteClient: true,
      canUploadDesign: true,
      canApproveDesign: true,
      canManualEditInvoice: true,
      canManualEditSPK: true,
      canSubmitPayment: true,
      canVerifyPayment: true,
      canAdvanceProduction: true,
      canUploadProductionPhoto: true,
      canUpdateShipment: true,
      canViewReports: true,
      canManageUsers: true,
      canEditSettings: true,
      canSyncSpreadsheet: true,
    },
    securityRestrictions: [
      'Tidak ada batasan sistem (Root / Full Clearance)',
    ],
  },
  admin: {
    role: 'admin',
    name: 'Head Administrator',
    badgeLabel: '🛡️ Admin Operasional',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
    icon: '🛡️',
    description: 'Otoritas operasional penuh: verifikasi pembayaran, penerbitan & perbaikan manual SPK/Invoice, dan manajemen data.',
    level: 4,
    permissions: {
      canCreateOrder: true,
      canEditOrder: true,
      canDeleteOrder: true,
      canRegisterClient: true,
      canDeleteClient: true,
      canUploadDesign: true,
      canApproveDesign: true,
      canManualEditInvoice: true,
      canManualEditSPK: true,
      canSubmitPayment: true,
      canVerifyPayment: true,
      canAdvanceProduction: true,
      canUploadProductionPhoto: true,
      canUpdateShipment: true,
      canViewReports: true,
      canManageUsers: false, // Dibatasi: Hanya Super Admin yang berwenang mendaftarkan akun Admin, Produksi, dan Marketing
      canEditSettings: true,
      canSyncSpreadsheet: true,
    },
    securityRestrictions: [
      'Dilarang mendaftarkan / mengedit akun user Admin, Produksi, Marketing (Hak Eksklusif Super Admin)',
      'Dibatasi dari menghapus akun level Super Admin',
    ],
  },
  marketing: {
    role: 'marketing',
    name: 'Marketing & Sales Officer',
    badgeLabel: '💼 Marketing',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    badgeBorder: 'border-blue-300',
    icon: '💼',
    description: 'Fokus penjualan, pendaftaran klien, pembuatan pesanan, upload mock-up desain, dan pengajuan bukti transfer.',
    level: 3,
    permissions: {
      canCreateOrder: true,
      canEditOrder: true,
      canDeleteOrder: false,
      canRegisterClient: true,
      canDeleteClient: false,
      canUploadDesign: true,
      canApproveDesign: true,
      canManualEditInvoice: false, // Dibatasi: verifikasi admin diperlukan untuk ubah invoice resmi
      canManualEditSPK: true,
      canSubmitPayment: true,
      canVerifyPayment: false, // Dibatasi ketat: Mencegah fraud approval pembayaran sendiri
      canAdvanceProduction: false,
      canUploadProductionPhoto: false,
      canUpdateShipment: true,
      canViewReports: false,
      canManageUsers: false,
      canEditSettings: false,
      canSyncSpreadsheet: false,
    },
    securityRestrictions: [
      'Dilarang memverifikasi pembayaran sendiri (Wajib diverifikasi Admin/Super Admin)',
      'Dilarang menghapus data pesanan atau master client',
      'Dilarang mengubah nominal tagihan invoice yang telah terverifikasi',
      'Dilarang mengakses menu Kelola Pengguna & Laporan Keuangan Eksekutif',
    ],
  },
  produksi: {
    role: 'produksi',
    name: 'Kepala Workshop & Produksi',
    badgeLabel: '🏭 Produksi Workshop',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    icon: '🏭',
    description: 'Pengerjaan fisik workshop: melihat SPK, rincian potong ukuran, update tahapan produksi, dan upload foto bukti kerja.',
    level: 2,
    permissions: {
      canCreateOrder: false,
      canEditOrder: false,
      canDeleteOrder: false,
      canRegisterClient: false,
      canDeleteClient: false,
      canUploadDesign: false,
      canApproveDesign: false,
      canManualEditInvoice: false,
      canManualEditSPK: false,
      canSubmitPayment: false,
      canVerifyPayment: false,
      canAdvanceProduction: true,
      canUploadProductionPhoto: true,
      canUpdateShipment: true,
      canViewReports: false,
      canManageUsers: false,
      canEditSettings: false,
      canSyncSpreadsheet: false,
    },
    securityRestrictions: [
      'Dibatasi dari melihat & mengubah invoice atau nominal keuangan',
      'Dibatasi dari mengedit formulir pesanan & data sensitif client',
    ],
  },
  client: {
    role: 'client',
    name: 'Pelanggan / Client Portal',
    badgeLabel: '👤 Pelanggan',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    icon: '👤',
    description: 'Portal mandiri pelanggan untuk melacak tahapan jahit, menyetujui desain mock-up, dan mengunggah bukti bayar.',
    level: 1,
    permissions: {
      canCreateOrder: true,
      canEditOrder: false,
      canDeleteOrder: false,
      canRegisterClient: false,
      canDeleteClient: false,
      canUploadDesign: false,
      canApproveDesign: true,
      canManualEditInvoice: false,
      canManualEditSPK: false,
      canSubmitPayment: true,
      canVerifyPayment: false,
      canAdvanceProduction: false,
      canUploadProductionPhoto: false,
      canUpdateShipment: false,
      canViewReports: false,
      canManageUsers: false,
      canEditSettings: false,
      canSyncSpreadsheet: false,
    },
    securityRestrictions: [
      'Hanya dapat melihat dan mengakses data pesanan milik akun sendiri',
      'Tidak dapat mengakses modul manajemen internal',
    ],
  },
};

// Permission check helper functions
export const hasPermission = (role: Role, permissionKey: keyof RolePermissionMeta['permissions']): boolean => {
  const config = ROLE_SECURITY_CONFIG[role] || ROLE_SECURITY_CONFIG.client;
  return !!config.permissions[permissionKey];
};

export const canVerifyPayment = (role: Role): boolean => hasPermission(role, 'canVerifyPayment');
export const canDeleteOrder = (role: Role): boolean => hasPermission(role, 'canDeleteOrder');
export const canDeleteClient = (role: Role): boolean => hasPermission(role, 'canDeleteClient');
export const canManageUsers = (role: Role): boolean => hasPermission(role, 'canManageUsers');
export const canRegisterStaff = (role: Role): boolean => role === 'super_admin';
export const canEditSettings = (role: Role): boolean => hasPermission(role, 'canEditSettings');
export const canManualEditInvoice = (role: Role): boolean => hasPermission(role, 'canManualEditInvoice');
export const canManualEditSPK = (role: Role): boolean => hasPermission(role, 'canManualEditSPK');
export const canAdvanceProduction = (role: Role): boolean => hasPermission(role, 'canAdvanceProduction');
export const canViewReports = (role: Role): boolean => hasPermission(role, 'canViewReports');
export const canSyncSpreadsheet = (role: Role): boolean => hasPermission(role, 'canSyncSpreadsheet');
