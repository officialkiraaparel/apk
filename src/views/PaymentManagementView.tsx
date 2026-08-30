import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Filter,
  Plus,
  QrCode,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Wallet,
  XCircle,
} from 'lucide-react';
import { ImageModal } from '../components/common/ImageModal';
import { PaymentStatusBadge } from '../components/common/StatusBadge';
import { UploadToDriveModal } from '../components/modals/UploadToDriveModal';
import { useApp } from '../context/AppContext';
import { Payment, PaymentMethod } from '../types';
import { formatDateID, formatDateTimeID, formatRupiah } from '../utils/formatters';
import { canVerifyPayment } from '../utils/security';

export const PaymentManagementView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { orders, verifyPayment, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalImage, setModalImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Flatten all payments with their order metadata
  const allPayments = orders.flatMap(order =>
    order.payments.map(payment => ({
      ...payment,
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientName: order.clientName,
      clientCompany: order.clientCompany,
      totalOrderAmount: order.totalAmount,
      remainingBalance: order.remainingBalance,
    }))
  );

  const filteredPayments = allPayments.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(q) ||
      p.orderNumber.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.clientCompany.toLowerCase().includes(q) ||
      p.method.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const totalVerified = allPayments
    .filter(p => p.status === 'Terverifikasi')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = allPayments
    .filter(p => p.status === 'Menunggu Verifikasi')
    .reduce((sum, p) => sum + p.amount, 0);

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  return (
    <div id="payment-management-view" className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
              Finance & Kas
            </span>
            <span className="text-xs text-slate-500">Verifikasi Pembayaran</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit',sans-serif] mt-1">
            Manajemen Pembayaran & Kas Masuk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh uang muka (DP), pelunasan transfer bank, dan verifikasi slip pembayaran client.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDriveModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Upload Bukti Transfer ke Drive</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Pembayaran Terverifikasi</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatRupiah(totalVerified)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Uang kas masuk valid</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Menunggu Verifikasi Admin</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{formatRupiah(totalPending)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {allPayments.filter(p => p.status === 'Menunggu Verifikasi').length} transaksi perlu dicek
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Sisa Piutang Order</span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {formatRupiah(orders.reduce((sum, o) => sum + o.remainingBalance, 0))}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Belum lunas dari seluruh order aktif</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari no pembayaran, Order ID, client..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Terverifikasi">Terverifikasi</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Payments Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">No. Transaksi</th>
                <th className="py-3.5 px-4">Order ID & Client</th>
                <th className="py-3.5 px-4">Tanggal Masuk</th>
                <th className="py-3.5 px-4">Metode</th>
                <th className="py-3.5 px-4">Nominal</th>
                <th className="py-3.5 px-4">Bukti Transfer</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada catatan pembayaran yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onNavigate(`order-detail-${p.orderId}`)}
                        className="font-mono font-bold text-indigo-600 hover:underline block"
                      >
                        {p.orderNumber}
                      </button>
                      <span className="font-semibold text-slate-800">{p.clientName}</span>
                      <span className="text-[10px] text-slate-400 block">{p.clientCompany}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDateTimeID(p.date)}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{p.method}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">{formatRupiah(p.amount)}</td>
                    <td className="py-3.5 px-4">
                      {p.proofUrl ? (
                        <button
                          onClick={() =>
                            setModalImage({
                              url: p.proofUrl!,
                              title: `Bukti Pembayaran ${p.paymentNumber}`,
                              subtitle: `${p.orderNumber} • ${formatRupiah(p.amount)}`,
                            })
                          }
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Slip</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'Menunggu Verifikasi' ? (
                        canVerifyPayment(currentUser.role) ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => verifyPayment(p.orderId, p.id, true)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px]"
                            >
                              ACC
                            </button>
                            <button
                              onClick={() => verifyPayment(p.orderId, p.id, false)}
                              className="px-2.5 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold rounded-lg text-[11px]"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg" title="Pembatasan Keamanan: Verifikasi pembayaran hanya dapat dilakukan oleh Super Admin / Admin.">
                            🔒 Butuh ACC Admin
                          </span>
                        )
                      ) : (
                        <button
                          onClick={() => onNavigate(`invoice-detail-${p.orderId}`)}
                          className="text-xs font-semibold text-slate-500 hover:text-indigo-600"
                        >
                          Invoice &rarr;
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalImage && (
        <ImageModal
          isOpen={true}
          onClose={() => setModalImage(null)}
          imageUrl={modalImage.url}
          title={modalImage.title}
          subtitle={modalImage.subtitle}
        />
      )}

      <UploadToDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        defaultCategory="bukti_transfer"
      />
    </div>
  );
};
