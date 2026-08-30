import React from 'react';
import {
  BarChart3,
  CheckSquare,
  CreditCard,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Home,
  Image as ImageIcon,
  Layers,
  LogOut,
  Package,
  PlusCircle,
  QrCode,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Truck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { KIRA_LOGO_URL } from '../../utils/constants';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate, isOpenMobile, onCloseMobile }) => {
  const { currentUser, orders, getClientOrders, settings, logout } = useApp();

  const clientOrders = getClientOrders();
  const pendingDesignCount = orders.filter(o => o.designStatus === 'Menunggu Persetujuan').length;
  const inProductionCount = orders.filter(o => o.currentStageId !== 'ORDER_MASUK' && o.currentStageId !== 'SELESAI').length;
  const pendingPaymentCount = orders.filter(o => o.invoice.status === 'Menunggu Pembayaran' || o.payments.some(p => p.status === 'Menunggu Verifikasi')).length;

  const handleNav = (tab: string) => {
    onNavigate(tab);
    onCloseMobile();
  };

  interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
    roles: Role[];
    section?: string;
  }

  const navItems: NavItem[] = [
    // Main Section
    {
      id: 'landing',
      label: 'Landing Page Client',
      icon: <Layers className="w-4 h-4 text-[#c8b320]" />,
      roles: ['super_admin', 'client', 'admin', 'marketing', 'produksi'],
      section: 'Halaman Depan',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'marketing', 'produksi'],
      section: 'Utama',
    },
    {
      id: 'client-tracking',
      label: 'Tracking Pesanan',
      icon: <Search className="w-4 h-4" />,
      roles: ['client'],
      section: 'Portal Pelanggan',
    },

    // Order & Client Section
    {
      id: 'create-order',
      label: 'Buat Order Baru',
      icon: <PlusCircle className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'marketing'],
      section: 'Manajemen Pesanan',
    },
    {
      id: 'orders',
      label: 'Daftar Pesanan',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: currentUser.role === 'client' ? clientOrders.length : orders.length,
      roles: ['super_admin', 'admin', 'marketing', 'client'],
      section: 'Manajemen Pesanan',
    },
    {
      id: 'clients',
      label: 'Data Client',
      icon: <Users className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'marketing'],
      section: 'Manajemen Pesanan',
    },
    {
      id: 'designs',
      label: 'Desain & Approval',
      icon: <ImageIcon className="w-4 h-4" />,
      badge: pendingDesignCount > 0 ? pendingDesignCount : undefined,
      badgeColor: 'bg-purple-100 text-purple-800',
      roles: ['super_admin', 'admin', 'marketing', 'client'],
      section: 'Manajemen Pesanan',
    },

    // Production Section
    {
      id: 'spk',
      label: 'SPK (Surat Kerja)',
      icon: <FileCheck2 className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'marketing', 'produksi', 'client'],
      section: 'Workshop & Produksi',
    },
    {
      id: 'production',
      label: 'Progress Produksi',
      icon: <Wrench className="w-4 h-4" />,
      badge: inProductionCount > 0 ? `${inProductionCount} Aktif` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      roles: ['super_admin', 'admin', 'marketing', 'produksi'],
      section: 'Workshop & Produksi',
    },
    {
      id: 'shipments',
      label: 'Pengiriman & Resi',
      icon: <Truck className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'marketing', 'produksi', 'client'],
      section: 'Workshop & Produksi',
    },

    // Finance Section
    {
      id: 'invoices',
      label: 'Invoice & Tagihan',
      icon: <FileText className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'marketing', 'client'],
      section: 'Keuangan',
    },
    {
      id: 'payments',
      label: 'Pembayaran',
      icon: <CreditCard className="w-4 h-4" />,
      badge: pendingPaymentCount > 0 ? pendingPaymentCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
      roles: ['super_admin', 'admin', 'marketing', 'client'],
      section: 'Keuangan',
    },

    // Reports & System Section
    {
      id: 'reports',
      label: 'Laporan & Omzet',
      icon: <BarChart3 className="w-4 h-4" />,
      roles: ['super_admin', 'admin'],
      section: 'Laporan & Konfigurasi',
    },
    {
      id: 'users',
      label: 'Kelola User & Role',
      icon: <ShieldAlert className="w-4 h-4" />,
      roles: ['super_admin'], // Hak Eksklusif Super Admin: hanya Super Admin yang dapat mendaftarkan Admin, Produksi, dan Marketing
      section: 'Laporan & Konfigurasi',
      badge: 'Direksi',
      badgeColor: 'bg-purple-900/60 text-purple-300 border border-purple-500/30',
    },
    {
      id: 'settings',
      label: 'Pengaturan Konveksi',
      icon: <Settings className="w-4 h-4" />,
      roles: ['super_admin', 'admin'],
      section: 'Laporan & Konfigurasi',
    },
    {
      id: 'sheets-sync',
      label: 'Google Drive & Sheets',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
      roles: ['super_admin', 'admin', 'marketing', 'produksi'],
      section: 'Laporan & Konfigurasi',
      badge: 'Drive Sync',
      badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30',
    },
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(currentUser.role));

  // Group items by section
  const sections: { title: string; items: NavItem[] }[] = [];
  allowedItems.forEach(item => {
    const secName = item.section || 'Menu';
    let group = sections.find(s => s.title === secName);
    if (!group) {
      group = { title: secName, items: [] };
      sections.push(group);
    }
    group.items.push(item);
  });

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-main-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#1E293B] text-slate-300 flex flex-col shrink-0 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } no-print border-r border-slate-800`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src={settings.logoUrl || KIRA_LOGO_URL}
                alt="Kira Apparel"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = KIRA_LOGO_URL;
                }}
              />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight font-['Outfit',sans-serif] text-base">
                {settings.companyName || 'KIRA APPAREL'}
              </span>
              <p className="text-[10px] text-indigo-400 font-medium -mt-0.5">Konveksi & Jersey System</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button for Super Admin, Admin & Marketing */}
        {(currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'marketing') && (
          <div className="p-3 border-b border-slate-800/80">
            <button
              id="sidebar-create-order-quick-btn"
              onClick={() => handleNav('create-order')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-950/40 transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Order Baru</span>
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {sections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {sec.title}
              </p>
              {sec.items.map(item => {
                const isActive = currentTab === item.id || currentTab.startsWith(`${item.id}-`);
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.badgeColor || (isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-300')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <span className="text-[10px] text-indigo-400 uppercase font-semibold">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <button
              type="button"
              id="sidebar-logout-btn"
              onClick={logout}
              title="Keluar / Ganti Akun"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
