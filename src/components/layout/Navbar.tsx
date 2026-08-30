import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  FileSpreadsheet,
  Layers,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { GoogleSheetsSyncModal } from '../common/GoogleSheetsSyncModal';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { formatDateTimeID } from '../../utils/formatters';
import { KIRA_LOGO_URL } from '../../utils/constants';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenMobileMenu }) => {
  const { currentUser, notifications, markNotificationRead, clearAllNotifications, quickSwitchRole, settings, logout } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<Role, { label: string; bg: string; text: string; icon: string }> = {
    super_admin: { label: 'Super Admin', bg: 'bg-purple-100', text: 'text-purple-800', icon: '👑' },
    admin: { label: 'Admin (Full Access)', bg: 'bg-rose-100', text: 'text-rose-800', icon: '🛡️' },
    marketing: { label: 'Marketing', bg: 'bg-blue-100', text: 'text-blue-800', icon: '💼' },
    produksi: { label: 'Produksi Workshop', bg: 'bg-amber-100', text: 'text-amber-800', icon: '🏭' },
    client: { label: 'Client / Pelanggan', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '👤' },
  };

  const currentRoleMeta = roleLabels[currentUser.role];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs no-print">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-menu-toggle-btn"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:border-indigo-300 transition-all shrink-0">
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
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg font-['Outfit',sans-serif]">
                  {settings.companyName || 'KIRA APPAREL'}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded">
                  v2.0
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 -mt-1 font-medium">
                {settings.tagline || 'Production & Order Management'}
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right: Quick Role Switcher (Crucial for Reviewing RBAC) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Role Tester Pills */}
          <div className="relative">
            <button
              id="role-switcher-dropdown-btn"
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 shadow-xs hover:border-indigo-300 transition-all ${currentRoleMeta.bg} ${currentRoleMeta.text}`}
              title="Ganti role untuk menguji hak akses RBAC"
            >
              <span className="text-sm">{currentRoleMeta.icon}</span>
              <span className="hidden md:inline font-bold">{currentRoleMeta.label}</span>
              <span className="md:hidden font-bold uppercase">{currentUser.role}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {showRoleSwitcher && (
              <div
                id="role-switcher-menu"
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Role (RBAC Demo)
                  </p>
                  <p className="text-xs text-slate-600">Pilih role untuk menguji tampilan & batasan hak akses:</p>
                </div>
                {(['super_admin', 'admin', 'marketing', 'produksi', 'client'] as Role[]).map(role => {
                  const meta = roleLabels[role];
                  const isActive = currentUser.role === role;
                  return (
                    <button
                      key={role}
                      id={`switch-role-${role}`}
                      onClick={() => {
                        quickSwitchRole(role);
                        setShowRoleSwitcher(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isActive ? 'bg-indigo-50/70 font-bold text-indigo-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{meta.icon}</span>
                        <div>
                          <p className="font-semibold">{meta.label}</p>
                          <p className="text-[10px] text-slate-400">
                            {role === 'super_admin'
                              ? 'Direksi: Full Access & Manajemen User'
                              : role === 'admin'
                              ? 'Operasional & verifikasi pembayaran'
                              : role === 'marketing'
                              ? 'Input pesanan & CRM client'
                              : role === 'produksi'
                              ? 'Update SPK & foto progress workshop'
                              : 'Tracking pesanan & invoice'}
                          </p>
                        </div>
                      </div>
                      {isActive && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Google Sheets Database Sync Button */}
          <button
            type="button"
            onClick={() => setShowSheetsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-full transition-all shadow-2xs"
            title="Google Spreadsheet Database Sync (1zPrkHaGCO6ftj8OQ3Cndf1wzp8tJF-VE1g156rzP1L8)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Google Sheets DB</span>
          </button>

          {/* Direct Link to Landing Page */}
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
              currentTab === 'landing'
                ? 'bg-slate-900 text-[#c8b320]'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
            }`}
            title="Buka Halaman Depan / Landing Page Client"
          >
            <span>🌐</span>
            <span className="hidden sm:inline">Landing Page Client</span>
          </button>

          {/* Direct WhatsApp fast shortcut */}
          <a
            href={`https://wa.me/${settings.phone}?text=Halo%20Kira%20Aparel`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors"
            title="Buka WhatsApp Hotline"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>WA Konveksi</span>
          </a>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="notifications-dropdown-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                id="notifications-menu"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Notifikasi</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full">
                      {unreadCount} baru
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Tandai Dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Tidak ada notifikasi saat ini.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.orderId) {
                            onNavigate(`order-detail-${n.orderId}`);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors flex gap-2.5 ${
                          !n.read ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 block"></span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDateTimeID(n.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{currentUser.name.split(' ')[0]}</p>
              <p className="text-[10px] font-medium text-slate-500 capitalize">{currentUser.role}</p>
            </div>
            <button
              type="button"
              id="navbar-logout-btn"
              onClick={logout}
              title="Keluar / Ganti Akun"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={showSheetsModal}
        onClose={() => setShowSheetsModal(false)}
      />
    </header>
  );
};
