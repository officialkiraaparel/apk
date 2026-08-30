import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lock,
  MessageSquare,
  Package,
  PlusCircle,
  Printer,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { OrderStatusBadge } from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import { formatDateID, formatRupiah, generateWhatsAppUrl } from '../utils/formatters';
import { ROLE_SECURITY_CONFIG } from '../utils/security';

export const DashboardAdminView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { orders, clients, currentUser, settings, advanceProductionStage } = useApp();

  const role = currentUser.role;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin';
  const isMarketing = role === 'marketing';
  const isProduksi = role === 'produksi';
  const isClient = role === 'client';

  // Core Aggregates
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status !== 'Selesai' && o.status !== 'Dibatalkan').length;
  const newOrders = orders.filter(o => o.status === 'Draft' || o.status === 'Menunggu Desain' || o.status === 'Persetujuan Desain').length;
  const pendingDesignApproval = orders.filter(o => o.designStatus === 'Menunggu Persetujuan').length;
  const inProduction = orders.filter(o => o.status === 'Sedang Produksi' || o.status === 'SPK Diterbitkan').length;
  const completedOrders = orders.filter(o => o.status === 'Selesai').length;
  const readyToShipOrders = orders.filter(o => o.status === 'Siap Dikirim' || o.status === 'Dikirim').length;
  
  // Financial Aggregates (Visible to Super Admin & Admin)
  const unpaidOrders = orders.filter(o => o.remainingBalance > 0).length;
  const totalReceivables = orders.reduce((acc, o) => acc + o.remainingBalance, 0);
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalPaidRevenue = orders.reduce((acc, o) => acc + (o.totalAmount - o.remainingBalance), 0);
  const pendingPaymentApprovals = orders.filter(o => 
    o.payments.some(p => p.status === 'Menunggu Verifikasi') || o.invoice.status === 'Menunggu Pembayaran'
  ).length;

  // Workshop / Production Aggregates
  const cuttingStageOrders = orders.filter(o => o.currentStageId === 'CUTTING' || o.currentStageId === 'MENUNGGU_PRODUKSI').length;
  const printingStageOrders = orders.filter(o => o.currentStageId === 'PRINTING').length;
  const jahitStageOrders = orders.filter(o => o.currentStageId === 'JAHIT').length;
  const finishingQcOrders = orders.filter(o => o.currentStageId === 'FINISHING' || o.currentStageId === 'QC' || o.currentStageId === 'PACKING').length;
  const totalProducedPcs = orders.reduce((sum, o) => sum + o.quantity, 0);

  // Urgent Orders approaching deadline (within 3 days)
  const urgentOrders = orders.filter(o => {
    if (o.status === 'Selesai' || o.status === 'Dibatalkan') return false;
    const deadlineDate = new Date(o.deadline).getTime();
    const today = new Date().getTime();
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 4;
  });

  // Chart Data: Monthly trends
  const monthlyData = [
    { month: 'Apr', orderCount: 4, omzet: 18500000 },
    { month: 'Mei', orderCount: 7, omzet: 32000000 },
    { month: 'Jun', orderCount: 11, omzet: 54000000 },
    { month: 'Jul', orderCount: 9, omzet: 41500000 },
    { month: 'Agu', orderCount: totalOrders + 4, omzet: totalRevenue + 12000000 },
  ];

  // Stage Distribution
  const stageDistribution = [
    { name: 'Persetujuan Desain', count: orders.filter(o => o.status === 'Persetujuan Desain' || o.status === 'Menunggu Desain').length, color: '#8b5cf6' },
    { name: 'SPK / Antrian', count: orders.filter(o => o.status === 'SPK Diterbitkan').length, color: '#3b82f6' },
    { name: 'Workshop Produksi', count: orders.filter(o => o.status === 'Sedang Produksi').length, color: '#f59e0b' },
    { name: 'Pengiriman', count: readyToShipOrders, color: '#06b6d4' },
    { name: 'Selesai', count: completedOrders, color: '#10b981' },
  ].filter(item => item.count > 0);

  const recentOrders = [...orders].slice(0, 6);

  return (
    <div id="dashboard-role-view" className="space-y-6">
      {/* 1. ROLE-TAILORED HERO HEADER */}
      <div className={`p-6 rounded-2xl text-white shadow-lg border ${
        isSuperAdmin 
          ? 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-purple-800/40'
          : isAdmin
          ? 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border-rose-900/40'
          : isMarketing
          ? 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-blue-800/40'
          : isProduksi
          ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-stone-900 border-amber-800/40'
          : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-emerald-800/40'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                isSuperAdmin
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : isAdmin
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : isMarketing
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : isProduksi
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {ROLE_SECURITY_CONFIG[role]?.badgeLabel || 'KIRA APAREL HQ'}
              </span>
              <span className="text-xs text-slate-400">
                {isSuperAdmin && 'Dashboard Eksekutif & Direksi'}
                {isAdmin && 'Dashboard Operasional Konveksi'}
                {isMarketing && 'Dashboard Penjualan & Pelanggan'}
                {isProduksi && 'Dashboard Antrian Workshop & Jahit'}
                {isClient && 'Portal Mandiri Pelanggan'}
              </span>
            </div>

            <h2 className="text-2xl font-bold font-['Outfit',sans-serif] mt-1.5 flex items-center gap-2">
              <span>Selamat Datang, {currentUser.name}</span>
            </h2>

            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isSuperAdmin && 'Akses penuh eksekutif: pantauan arus kas omzet, piutang konveksi, otorisasi staf, audit SPK/Invoice, dan integrasi cloud.'}
              {isAdmin && 'Kendali operasional penuh: verifikasi pembayaran masuk, penerbitan & koreksi SPK workshop, koordinasi jahit, dan pengiriman.'}
              {isMarketing && 'Fokus pemasaran & kepuasan pelanggan: buat pesanan baru, pantau persetujuan desain mock-up, dan komunikasi klien via WhatsApp.'}
              {isProduksi && 'Fokus bengkel & workshop: monitor antrian cutting, cetak sublim, tahapan jahit/bordir, dan dokumentasi foto pengerjaan.'}
              {isClient && 'Pantau progres pengerjaan pesanan Anda secara real-time, beri persetujuan desain mock-up, dan unduh invoice resmi.'}
            </p>
          </div>

          {/* Quick Action CTAs tailored by Role */}
          <div className="flex items-center gap-2 flex-wrap">
            {(isSuperAdmin || isAdmin || isMarketing) && (
              <button
                id="dashboard-new-order-btn"
                onClick={() => onNavigate('create-order')}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Input Pesanan Baru</span>
              </button>
            )}

            {isSuperAdmin && (
              <button
                onClick={() => onNavigate('users')}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Kelola Staf & Role</span>
              </button>
            )}

            {isProduksi && (
              <button
                onClick={() => onNavigate('production')}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <Wrench className="w-4 h-4" />
                <span>Update Tahap Jahit</span>
              </button>
            )}

            {(isSuperAdmin || isAdmin) && (
              <button
                onClick={() => onNavigate('reports')}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Laporan Omzet</span>
              </button>
            )}

            {isMarketing && (
              <button
                onClick={() => onNavigate('clients')}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                <Users className="w-4 h-4" />
                <span>Data Pelanggan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SPECIALIZED NOTICES / RESTRICTION BANNERS BY ROLE */}
      {isSuperAdmin && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs flex items-center justify-between text-purple-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
            <span>
              <strong>Otorisasi Direksi (Super Admin):</strong> Anda adalah satu-satunya otoritas yang berhak mendaftarkan user baru sebagai Admin Aplikasi, Produksi, dan Marketing.
            </span>
          </div>
          <button
            onClick={() => onNavigate('users')}
            className="text-xs font-extrabold text-purple-800 hover:underline shrink-0 flex items-center gap-1"
          >
            <span>Manajemen User</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isMarketing && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center gap-2.5 text-blue-950">
          <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            <strong>Otorisasi Terbatas Marketing:</strong> Anda berwenang membuat pesanan dan mendampingi approval desain klien. Verifikasi bukti pembayaran kas dan koreksi tagihan resmi dikelola oleh <strong>Admin Keuangan</strong>.
          </span>
        </div>
      )}

      {isProduksi && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-950">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Fokus Workshop:</strong> Pantau antrian potong pola, printing sublim, jahit, dan pastikan pengiriman tepat waktu sesuai tenggat SPK.
            </span>
          </div>
          {urgentOrders.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold border border-rose-200 animate-pulse">
              ⚠️ {urgentOrders.length} SPK Deadline Mendesak
            </span>
          )}
        </div>
      )}

      {/* 3. METRIC CARDS GRIDS - ADAPTED TO ROLE */}
      {/* A. SUPER ADMIN & ADMIN METRICS (Full Operational & Financial) */}
      {(isSuperAdmin || isAdmin) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Pesanan</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalOrders}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{totalProducedPcs} total pcs dipesan</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Order Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-blue-600 mt-2">{activeOrders}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Dalam alur pengerjaan</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Sedang Produksi</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-amber-600 mt-2">{inProduction}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Workshop SPK aktif</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Selesai & Dikirim</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 mt-2">{completedOrders}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pesanan tuntas</p>
          </div>

          {/* Super Admin Financial Cards */}
          {isSuperAdmin && (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Belum Lunas</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-rose-600 mt-2">{unpaidOrders}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tagihan ada sisa saldo</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-red-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Piutang</span>
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-lg font-black text-rose-700 mt-2 truncate">{formatRupiah(totalReceivables)}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Saldo belum tertagih</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all col-span-2 bg-gradient-to-br from-emerald-50/40 to-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Omzet Konveksi</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-700 mt-2 truncate">{formatRupiah(totalRevenue)}</p>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  Dana Masuk (Terbayar): {formatRupiah(totalPaidRevenue)}
                </p>
              </div>
            </>
          )}

          {/* Admin Operational Cards */}
          {isAdmin && (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Validasi Desain</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-purple-600 mt-2">{newOrders}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Mock-up menunggu ACC</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Verifikasi Kas Masuk</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-rose-600 mt-2">{pendingPaymentApprovals}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Slip bayar butuh ACC</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-cyan-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Siap Dikirim</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-cyan-600 mt-2">{readyToShipOrders}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Packing / input resi</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Klien Aktif</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-indigo-700 mt-2">{clients.length}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Mitra & pelanggan</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* B. MARKETING METRICS (Client & Sales Focused) */}
      {isMarketing && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Klien</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{clients.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Mitra terdaftar</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Menunggu ACC Desain</span>
              <FileCheck2 className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-extrabold text-purple-600 mt-2">{pendingDesignApproval}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Butuh konfirmasi klien</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pesanan Baru / Draft</span>
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-600 mt-2">{newOrders}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tahap validasi</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Sedang Jahit</span>
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-600 mt-2">{inProduction}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Di lantai produksi</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pesanan Selesai</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 mt-2">{completedOrders}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Terkirim ke klien</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-cyan-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Volume Terjual</span>
              <Package className="w-4 h-4 text-cyan-600" />
            </div>
            <p className="text-2xl font-extrabold text-cyan-700 mt-2">{totalProducedPcs}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pcs jersey dipesan</p>
          </div>
        </div>
      )}

      {/* C. PRODUKSI WORKSHOP METRICS (Shop Floor Focused) */}
      {isProduksi && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">SPK Workshop Aktif</span>
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{inProduction}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">SPK dalam pengerjaan</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cutting & Pola</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-600 mt-2">{cuttingStageOrders}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Potong kain & pola</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Printing / Sublim</span>
              <Printer className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-blue-600 mt-2">{printingStageOrders}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Mesin sublimasi</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Jahit & Bordir</span>
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-600 mt-2">{jahitStageOrders}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Lantai jahit operator</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">QC & Steam</span>
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-extrabold text-purple-600 mt-2">{finishingQcOrders}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Quality check & pack</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Siap Kirim</span>
              <Truck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 mt-2">{readyToShipOrders}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Selesai produksi</p>
          </div>
        </div>
      )}

      {/* 4. CHARTS & ANALYTICS SECTION (Visible to Super Admin & Admin) */}
      {(isSuperAdmin || isAdmin) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Omzet & Order (Super Admin) or Volume Trend (Admin) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isSuperAdmin ? 'Grafik Omzet & Volume Transaksi Konveksi' : 'Grafik Tren Volume Pesanan Masuk'}
                </h3>
                <p className="text-xs text-slate-500">Performa pengerjaan konveksi tahun 2026</p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Live Data
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                  <YAxis
                    tickFormatter={val => isSuperAdmin ? `Rp ${(val / 1000000).toFixed(0)}Jt` : `${val}`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      name === 'omzet' ? (isSuperAdmin ? formatRupiah(Number(value)) : `${value} Pcs`) : `${value} Pesanan`,
                      name === 'omzet' ? (isSuperAdmin ? 'Total Omzet' : 'Estimasi Pcs') : 'Jumlah Pesanan',
                    ]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey={isSuperAdmin ? 'omzet' : 'orderCount'} stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOmzet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribusi Produksi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">Sebaran Alur Produksi</h3>
                <span className="text-[11px] text-slate-400">Live Stage</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Sebaran status seluruh pesanan berjalan</p>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stageDistribution}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {stageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} Pesanan`, 'Jumlah']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {stageDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.count} order</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. MARKETING SPECIALIZED SECTION: DESIGN APPROVAL QUEUE */}
      {isMarketing && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Antrian Approval Desain Mock-up</h3>
              <p className="text-xs text-slate-500">Pesanan yang memerlukan validasi atau persetujuan desain oleh klien</p>
            </div>
            <button
              onClick={() => onNavigate('designs')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Buka Modul Desain</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orders.slice(0, 3).map(order => (
              <div key={order.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-300 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700">{order.orderNumber}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    order.designStatus === 'Disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {order.designStatus}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={order.image1 || 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=100&auto=format&fit=crop&q=80'}
                    alt="Mockup"
                    className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">{order.clientName}</p>
                    <p className="text-slate-500">{order.clientCompany}</p>
                    <p className="text-[11px] text-indigo-600 font-medium mt-0.5">{order.productType} ({order.quantity} pcs)</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <a
                    href={generateWhatsAppUrl(order, 'design')}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Follow-up WA</span>
                  </a>
                  <button
                    onClick={() => onNavigate(`order-detail-${order.id}`)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Lihat Detail →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PRODUKSI SPECIALIZED SECTION: WORKSHOP FLOOR SPK QUEUE */}
      {isProduksi && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Antrian SPK & Tahapan Pengerjaan Workshop</span>
              </h3>
              <p className="text-xs text-slate-500">Prioritas pengerjaan kain, potong ukuran, printing sublim, dan jahit</p>
            </div>
            <button
              onClick={() => onNavigate('production')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <span>Lihat Semua SPK Workshop</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. SPK / Order</th>
                  <th className="py-3 px-4">Bahan Kain & Kerah</th>
                  <th className="py-3 px-4 text-center">Total Qty</th>
                  <th className="py-3 px-4">Rincian Ukuran</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Tahap Saat Ini</th>
                  <th className="py-3 px-4 text-right">Aksi Produksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => {
                  const sizeString = Object.entries(order.sizeDetails || {})
                    .filter(([_, q]) => Number(q) > 0)
                    .map(([s, q]) => `${s}:${q}`)
                    .join(', ') || `${order.quantity} pcs`;

                  return (
                    <tr key={order.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-indigo-700">{order.spkNumber || order.orderNumber}</p>
                        <p className="text-[11px] text-slate-500">{order.title || order.productType}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{order.fabric}</p>
                        <p className="text-[10px] text-slate-500">Kerah: {order.collar} | Lengan: {order.sleeve}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-1 bg-amber-100 text-amber-900 font-extrabold rounded-md">
                          {order.quantity} pcs
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 block max-w-[180px] truncate">
                          {sizeString}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-900 font-bold">{formatDateID(order.deadline)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                          <Clock className="w-3 h-3" />
                          <span>{order.productionStages.find(s => s.id === order.currentStageId)?.name || order.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigate(`spk-detail-${order.id}`)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors flex items-center gap-1"
                            title="Buka Lembar SPK"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>SPK</span>
                          </button>
                          <button
                            onClick={() => onNavigate('production')}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors shadow-2xs"
                            title="Update Tahap Jahit"
                          >
                            Update Tahap
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. GENERAL RECENT ORDERS TABLE (For Super Admin, Admin, Marketing) */}
      {!isProduksi && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pesanan Konveksi Terbaru</h3>
              <p className="text-xs text-slate-500">Daftar pesanan aktif dan alur pengerjaan saat ini</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Lihat Semua Pesanan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Produk & Kain</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{order.clientName}</p>
                      <p className="text-[11px] text-slate-500">{order.clientCompany}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{order.productType}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{order.fabric}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {order.quantity} pcs
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium">{formatDateID(order.deadline)}</span>
                    </td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                        <span className="text-slate-600 truncate max-w-[90px]">
                          {order.productionStages.find(s => s.id === order.currentStageId)?.name || 'Tahap'}
                        </span>
                        <span className="text-indigo-600 font-bold">{order.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${order.progressPercentage}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate(`order-detail-${order.id}`)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Lihat Detail Order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate(`spk-detail-${order.id}`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat SPK"
                        >
                          <FileCheck2 className="w-4 h-4" />
                        </button>
                        <a
                          href={generateWhatsAppUrl(order, 'progress')}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Hubungi Client via WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
