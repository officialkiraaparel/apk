import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Cloud,
  CreditCard,
  Download,
  FileEdit,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  QrCode,
  Share2,
} from 'lucide-react';
import { InvoiceStatusBadge } from '../components/common/StatusBadge';
import { ManualEditInvoiceModal } from '../components/modals/ManualEditInvoiceModal';
import { UploadToDriveModal } from '../components/modals/UploadToDriveModal';
import { useApp } from '../context/AppContext';
import { canManualEditInvoice } from '../utils/security';
import { formatDateID, formatDateTimeID, formatRupiah, generateWhatsAppUrl } from '../utils/formatters';
import { KIRA_LOGO_URL } from '../utils/constants';

interface InvoiceDetailViewProps {
  orderId: string;
  onNavigate: (tab: string) => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ orderId, onNavigate }) => {
  const { orders, settings, currentUser } = useApp();
  const order = orders.find(o => o.id === orderId);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

  if (!order) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-bold text-slate-800">Invoice tidak ditemukan.</p>
        <button
          onClick={() => onNavigate('orders')}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Kembali ke Daftar Pesanan
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const isPaidOff = order.remainingBalance <= 0;
  const canEdit = canManualEditInvoice(currentUser.role);

  return (
    <div id="invoice-printable-view" className="space-y-6 pb-12">
      {/* Action Bar (Hidden on Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => onNavigate(`order-detail-${order.id}`)}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Detail Order ({order.orderNumber})</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <FileEdit className="w-4 h-4 text-amber-600" />
              <span>Perbaiki Manual Invoice</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDriveModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
          >
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span>Simpan ke Drive</span>
          </button>

          <a
            href={generateWhatsAppUrl(order, 'invoice')}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Kirim WA</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Manual Edit Invoice Modal */}
      {showEditModal && (
        <ManualEditInvoiceModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          order={order}
        />
      )}

      {/* Upload Invoice to Drive Modal */}
      {showDriveModal && (
        <UploadToDriveModal
          isOpen={showDriveModal}
          onClose={() => setShowDriveModal(false)}
          defaultCategory="invoice"
          defaultOrder={order}
        />
      )}

      {/* Official Invoice Document Canvas */}
      <div className="print-document-canvas bg-white p-8 sm:p-12 rounded-2xl border-2 border-slate-300 shadow-lg max-w-4xl mx-auto text-slate-900 print:border-0 print:shadow-none print:p-0 print:max-w-none relative print:overflow-visible">
        {/* Paid / Unpaid Watermark Stamp */}
        <div className="watermark-stamp absolute right-12 top-28 pointer-events-none opacity-20 rotate-[-15deg]">
          <div
            className={`border-4 rounded-2xl px-6 py-2 text-3xl font-black uppercase tracking-widest ${
              isPaidOff ? 'border-emerald-600 text-emerald-600' : 'border-rose-600 text-rose-600'
            }`}
          >
            {isPaidOff ? 'LUNAS (PAID)' : 'TAGIHAN (UNPAID)'}
          </div>
        </div>

        {/* Invoice Header */}
        <div className="print-avoid-break flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
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
              <h1 className="text-2xl font-black tracking-tight text-slate-900 font-['Outfit',sans-serif]">
                {settings.companyName || 'KIRA APPAREL'}
              </h1>
              <p className="text-xs font-bold tracking-widest text-indigo-700 uppercase">
                INVOICE TAGIHAN RESMI
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{settings.address} • WA: {settings.phone}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="font-mono text-sm font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 inline-block">
              {order.invoice.invoiceNumber}
            </span>
            <p className="text-xs text-slate-600 font-semibold mt-1">Order Ref: {order.orderNumber}</p>
            <p className="text-[11px] text-slate-500">
              Tgl Invoice: {formatDateID(order.invoice.createdAt || order.orderDate)}
            </p>
            <p className="text-[11px] font-bold text-rose-700">Jatuh Tempo: {formatDateID(order.deadline)}</p>
          </div>
        </div>

        {/* Client Billing Info */}
        <div className="print-avoid-break grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
              DITAGIHKAN KEPADA (BILLED TO):
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">{order.clientName}</h3>
            <p className="font-semibold text-slate-700">{order.clientCompany}</p>
            <p className="text-slate-600 mt-1 flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-emerald-600 no-print" /> {order.clientPhone}
            </p>
            <p className="text-slate-500 mt-1 max-w-sm">{order.clientAddress}</p>
          </div>

          <div className="sm:text-right flex flex-col justify-between">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                STATUS PEMBAYARAN:
              </span>
              <div>
                <InvoiceStatusBadge status={order.invoice.status} />
              </div>
            </div>

            <div className="mt-3">
              <span className="text-slate-400 text-[10px] block">Marketing PIC:</span>
              <span className="font-semibold text-slate-800">{order.marketingName}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6 space-y-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No.</th>
                <th className="py-3 px-3">Deskripsi Produk & Spesifikasi</th>
                <th className="py-3 px-3 text-center w-24">Qty</th>
                <th className="py-3 px-3 text-right w-36">Harga Satuan</th>
                <th className="py-3 px-3 text-right w-36">Total (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-4 px-3 font-mono font-bold text-slate-500 text-center">1</td>
                <td className="py-4 px-3">
                  <p className="font-bold text-slate-900">{order.productType}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Bahan: {order.fabric} • Kerah: {order.collarModel} • Lengan: {order.sleeveModel}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Warna/Sublim: {order.colorNotes || '-'}
                  </p>
                </td>
                <td className="py-4 px-3 text-center font-extrabold text-slate-900">
                  {order.quantity} pcs
                </td>
                <td className="py-4 px-3 text-right font-medium text-slate-800">
                  {formatRupiah(order.unitPrice)}
                </td>
                <td className="py-4 px-3 text-right font-bold text-slate-900">
                  {formatRupiah(order.subtotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pricing Totals Box */}
          <div className="pricing-totals-box print-avoid-break flex justify-end pt-4 border-t border-slate-200">
            <div className="w-full sm:w-80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal Pesanan:</span>
                <span className="font-semibold text-slate-900">{formatRupiah(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex items-center justify-between text-rose-600">
                  <span>Potongan Diskon:</span>
                  <span className="font-semibold">-{formatRupiah(order.discount)}</span>
                </div>
              )}

              {order.shippingCost > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Ongkos Kirim:</span>
                  <span className="font-semibold text-slate-900">+{formatRupiah(order.shippingCost)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-black border-t-2 border-slate-900 pt-2 text-slate-900">
                <span>TOTAL AKHIR:</span>
                <span className="text-base text-indigo-700">{formatRupiah(order.totalAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-emerald-700 font-bold pt-1">
                <span>Telah Dibayar (DP/Masuk):</span>
                <span>{formatRupiah(order.downPayment)}</span>
              </div>

              <div className="flex items-center justify-between text-sm font-black bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-800">
                <span>SISA TAGIHAN:</span>
                <span className="text-base">{formatRupiah(order.remainingBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Transfer & QRIS Information */}
        <div className="bank-info-box print-avoid-break mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
            Informasi Pembayaran & Rekening Resmi
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">BANK BCA:</span>
                <p className="text-sm font-mono font-black text-slate-900">882-019-4481</p>
                <p className="text-[11px] text-slate-600 font-semibold">a.n. PT KIRA APAREL INDONESIA</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">BANK MANDIRI:</span>
                <p className="text-sm font-mono font-black text-slate-900">137-00-1928374-1</p>
                <p className="text-[11px] text-slate-600 font-semibold">a.n. PT KIRA APAREL INDONESIA</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
                <QrCode className="w-14 h-14 text-slate-800" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  QRIS STANDAR NASIONAL
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1">Scan QRIS KIRA APAREL</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Mendukung GoPay, OVO, Dana, ShopeePay, BCA Mobile, Livin Mandiri, dll.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="signature-block print-avoid-break flex items-end justify-between pt-10 text-xs border-t border-slate-200 mt-8">
          <div className="max-w-xs text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">Syarat & Ketentuan:</p>
            <p className="mt-0.5">1. Pembayaran DP minimal 50% sebelum proses SPK dan jahit dimulai.</p>
            <p>2. Pelunasan 100% wajib dilakukan sebelum barang diserahkan ke kurir/ekspedisi.</p>
          </div>

          <div className="text-center">
            <p className="text-slate-500 font-semibold">Hormat Kami,</p>
            <p className="text-slate-700 font-bold mt-0.5">{settings.companyName}</p>
            <div className="h-14"></div>
            <p className="font-bold text-slate-900 underline">Finance & Marketing Dept.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
