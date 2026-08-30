import React, { useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  CreditCard,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Layers,
  MessageSquare,
  Package,
  PlusCircle,
  Search,
  SlidersHorizontal,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { InvoiceStatusBadge, OrderStatusBadge } from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import { formatDateID, formatRupiah, generateWhatsAppUrl } from '../utils/formatters';

export const OrderListView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { orders, currentUser, deleteOrder, getClientOrders } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const visibleOrders = currentUser.role === 'client' ? getClientOrders() : orders;

  const filteredOrders = visibleOrders.filter(order => {
    // Search Query
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(q) ||
      order.clientName.toLowerCase().includes(q) ||
      order.clientCompany.toLowerCase().includes(q) ||
      order.clientPhone.includes(q) ||
      order.productType.toLowerCase().includes(q) ||
      order.marketingName.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Status Produksi Filter
    if (selectedStatus !== 'all' && order.status !== selectedStatus) {
      return false;
    }

    // Payment Status Filter
    if (selectedPaymentStatus !== 'all' && order.invoice.status !== selectedPaymentStatus) {
      return false;
    }

    // Date Presets Filter
    if (selectedDateFilter !== 'all') {
      const orderDate = new Date(order.orderDate).getTime();
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      if (selectedDateFilter === 'today') {
        const diff = (now - orderDate) / oneDay;
        if (diff > 1) return false;
      } else if (selectedDateFilter === 'week') {
        const diff = (now - orderDate) / oneDay;
        if (diff > 7) return false;
      } else if (selectedDateFilter === 'month') {
        const diff = (now - orderDate) / oneDay;
        if (diff > 30) return false;
      }
    }

    return true;
  });

  const handleDeleteOrder = (orderId: string, orderNo: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus order ${orderNo}?`)) {
      deleteOrder(orderId);
    }
  };

  return (
    <div id="order-list-view" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
              Master Data Pesanan
            </span>
            <span className="text-xs text-slate-500">Order Management</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit',sans-serif] mt-1">
            Daftar Seluruh Pesanan Konveksi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola status produksi, tracking SPK, tagihan invoice, dan persetujuan visual desain.
          </p>
        </div>

        {(currentUser.role === 'admin' || currentUser.role === 'marketing') && (
          <button
            id="order-list-create-btn"
            onClick={() => onNavigate('create-order')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Order Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari ID, Client, WhatsApp, Produk, Marketing..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Status Produksi Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
            >
              <option value="all">Semua Status Produksi</option>
              <option value="Draft">Draft</option>
              <option value="Menunggu Desain">Menunggu Desain</option>
              <option value="Persetujuan Desain">Persetujuan Desain</option>
              <option value="SPK Diterbitkan">SPK Diterbitkan</option>
              <option value="Sedang Produksi">Sedang Produksi</option>
              <option value="Siap Dikirim">Siap Dikirim</option>
              <option value="Dikirim">Dikirim</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedPaymentStatus}
              onChange={e => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
            >
              <option value="all">Semua Status Pembayaran</option>
              <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
              <option value="DP">DP (Uang Muka)</option>
              <option value="Sebagian Dibayar">Sebagian Dibayar</option>
              <option value="Lunas">Lunas (100%)</option>
            </select>
          </div>

          {/* Date Presets */}
          <div className="sm:col-span-2 flex items-center justify-end">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 w-full justify-between text-center">
              <button
                type="button"
                onClick={() => setSelectedDateFilter('all')}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  selectedDateFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedDateFilter('week')}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  selectedDateFilter === 'week' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Minggu Ini
              </button>
              <button
                type="button"
                onClick={() => setSelectedDateFilter('month')}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  selectedDateFilter === 'month' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Bulan Ini
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Menampilkan <strong className="text-slate-800 font-bold">{filteredOrders.length}</strong> dari{' '}
            {visibleOrders.length} pesanan
          </span>
          {(searchQuery || selectedStatus !== 'all' || selectedPaymentStatus !== 'all' || selectedDateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedPaymentStatus('all');
                setSelectedDateFilter('all');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Orders Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Order ID & SPK</th>
                <th className="py-3.5 px-4">Client & Kontak</th>
                <th className="py-3.5 px-4">Produk & Spesifikasi</th>
                <th className="py-3.5 px-4 text-center">Qty</th>
                <th className="py-3.5 px-4">Jadwal & Deadline</th>
                <th className="py-3.5 px-4">Progress Produksi</th>
                <th className="py-3.5 px-4">Status & Invoice</th>
                <th className="py-3.5 px-4 text-right">Total & Sisa</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada pesanan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order ID */}
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-extrabold text-indigo-600">{order.orderNumber}</p>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">{order.spkNumber}</p>
                    </td>

                    {/* Client */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{order.clientName}</p>
                      <p className="text-[11px] text-slate-500">{order.clientCompany}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{order.clientPhone}</p>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{order.productType}</p>
                      <p className="text-[10px] text-slate-500">
                        {order.collarModel} • Lengan {order.sleeveModel}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{order.fabric}</p>
                    </td>

                    {/* Qty */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                        {order.quantity} pcs
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700">
                        <span className="text-[10px] text-slate-400 block">Deadline:</span>
                        <span className="font-semibold">{formatDateID(order.deadline)}</span>
                      </div>
                    </td>

                    {/* Production Progress */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                        <span className="text-slate-600 truncate max-w-[90px]">
                          {order.productionStages.find(s => s.id === order.currentStageId)?.name || order.status}
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

                    {/* Badges */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div>
                        <InvoiceStatusBadge status={order.invoice.status} />
                      </div>
                    </td>

                    {/* Financial */}
                    <td className="py-3.5 px-4 text-right">
                      <p className="font-bold text-slate-900">{formatRupiah(order.totalAmount)}</p>
                      {order.remainingBalance > 0 ? (
                        <p className="text-[10px] font-semibold text-rose-600">
                          Sisa: {formatRupiah(order.remainingBalance)}
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold text-emerald-600">Lunas 100%</p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onNavigate(`order-detail-${order.id}`)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Buka Detail Order Lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate(`spk-detail-${order.id}`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat SPK Workshop"
                        >
                          <FileCheck2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate(`invoice-detail-${order.id}`)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Lihat Invoice Tagihan"
                        >
                          <FileText className="w-4 h-4" />
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
                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
  );
};
