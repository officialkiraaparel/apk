import React, { useState } from 'react';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  FileEdit,
  FileText,
  Info,
  RotateCcw,
  Save,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Invoice, InvoiceStatus, Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/formatters';

interface ManualEditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const ManualEditInvoiceModal: React.FC<ManualEditInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const { updateOrder, updateInvoice, currentUser } = useApp();

  const [invoiceNumber, setInvoiceNumber] = useState(order.invoice?.invoiceNumber || `INV-${order.orderNumber}`);
  const [invoiceDate, setInvoiceDate] = useState(order.invoice?.date || order.orderDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(order.invoice?.dueDate || order.deadline || new Date().toISOString().split('T')[0]);
  const [unitPrice, setUnitPrice] = useState<number>(order.unitPrice || 0);
  const [quantity, setQuantity] = useState<number>(order.quantity || 0);
  const [subtotal, setSubtotal] = useState<number>(order.subtotal || order.unitPrice * order.quantity);
  const [discount, setDiscount] = useState<number>(order.discount || 0);
  const [shippingCost, setShippingCost] = useState<number>(order.shippingCost || 0);
  const [downPayment, setDownPayment] = useState<number>(order.downPayment || 0);
  const [status, setStatus] = useState<InvoiceStatus>(order.invoice?.status || 'Menunggu Pembayaran');
  const [notes, setNotes] = useState<string>(order.invoice?.notes || 'Terima kasih atas kepercayaan Anda memesan di Kira Aparel.');
  const [correctionReason, setCorrectionReason] = useState<string>('Penyesuaian manual data invoice & tagihan.');
  const [autoCalculateSubtotal, setAutoCalculateSubtotal] = useState<boolean>(true);

  if (!isOpen) return null;

  // Recalculate Totals
  const currentSubtotal = autoCalculateSubtotal ? unitPrice * quantity : subtotal;
  const currentTotal = Math.max(0, currentSubtotal - discount + shippingCost);
  const currentRemaining = Math.max(0, currentTotal - downPayment);

  const handleUnitPriceChange = (val: number) => {
    setUnitPrice(val);
    if (autoCalculateSubtotal) {
      setSubtotal(val * quantity);
    }
  };

  const handleQuantityChange = (val: number) => {
    setQuantity(val);
    if (autoCalculateSubtotal) {
      setSubtotal(unitPrice * val);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedInvoice: Invoice = {
      ...order.invoice,
      invoiceNumber,
      date: invoiceDate,
      dueDate,
      subtotal: currentSubtotal,
      discount,
      shippingCost,
      total: currentTotal,
      downPayment,
      remainingBalance: currentRemaining,
      status: currentRemaining <= 0 ? 'Lunas' : downPayment > 0 ? (status === 'Lunas' ? 'Lunas' : 'DP') : status,
      notes,
    };

    updateInvoice(order.id, updatedInvoice);

    // Also sync order financial totals
    updateOrder(order.id, {
      unitPrice,
      quantity,
      subtotal: currentSubtotal,
      discount,
      shippingCost,
      totalAmount: currentTotal,
      downPayment,
      remainingBalance: currentRemaining,
      invoice: updatedInvoice,
      notes: order.notes ? `${order.notes}\n[Koreksi Invoice oleh ${currentUser.name}: ${correctionReason}]` : `[Koreksi Invoice oleh ${currentUser.name}: ${correctionReason}]`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Perbaikan Manual Invoice
                </span>
                <span className="text-xs text-slate-400">Order Ref: {order.orderNumber}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Koreksi & Modifikasi Invoice Tagihan
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Notice Alert */}
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold block">Otoritas Perbaikan Manual (Super Admin & Admin):</span>
              Fitur ini memungkinkan penyesuaian langsung nomor invoice, tanggal jatuh tempo, rincian diskon, penyesuaian ongkos kirim, dan status pembayaran tanpa mengubah alur SPK dasar.
            </div>
          </div>

          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Invoice Tagihan *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Terbit Faktur *</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Jatuh Tempo *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                required
              />
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span>Rincian Nilai & Komponen Finansial</span>
              </h4>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  checked={autoCalculateSubtotal}
                  onChange={(e) => setAutoCalculateSubtotal(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Hitung Subtotal Otomatis (Qty × Harga)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Jumlah Pesanan (Qty Pcs)</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={unitPrice}
                  onChange={(e) => handleUnitPriceChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Subtotal (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={currentSubtotal}
                  disabled={autoCalculateSubtotal}
                  onChange={(e) => setSubtotal(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-xl font-bold ${
                    autoCalculateSubtotal ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-white text-slate-900 border-indigo-300'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Potongan Diskon (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-rose-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Biaya Ongkir / Tambahan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">DP / Pembayaran Masuk Tercatat (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Status Pembayaran Invoice</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                  <option value="DP">DP (Uang Muka)</option>
                  <option value="Sebagian Dibayar">Sebagian Dibayar</option>
                  <option value="Lunas">Lunas (100% Paid)</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Realtime Summary Preview Box */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-700 block">Kalkulasi Tagihan Baru:</span>
                <span className="font-bold text-slate-700">Total Akhir: {formatRupiah(currentTotal)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Sisa Tagihan:</span>
                <span className="text-sm font-black text-rose-800">{formatRupiah(currentRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Audit Reason */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan di Invoice</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal"
                placeholder="Catatan rekening, syarat jatuh tempo, dll."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alasan Perbaikan Manual (Audit Log) *</label>
              <input
                type="text"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Contoh: Diskon khusus disetujui direksi / Penyesuaian ongkir Cargo"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal"
                required
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
