import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Cloud,
  Download,
  FileCheck2,
  FileEdit,
  Image as ImageIcon,
  Layers,
  MapPin,
  Package,
  Phone,
  Printer,
  Sparkles,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateID, formatRupiah } from '../utils/formatters';
import { canManualEditSPK } from '../utils/security';
import { DetailOrderSheet } from '../components/orders/DetailOrderSheet';
import { ManualEditSPKModal } from '../components/modals/ManualEditSPKModal';
import { UploadToDriveModal } from '../components/modals/UploadToDriveModal';
import { KIRA_LOGO_URL } from '../utils/constants';

interface SPKViewProps {
  orderId: string;
  onNavigate: (tab: string) => void;
}

export const SPKView: React.FC<SPKViewProps> = ({ orderId, onNavigate }) => {
  const { orders, settings, currentUser } = useApp();
  const order = orders.find(o => o.id === orderId);
  const [viewMode, setViewMode] = useState<'detail-order' | 'standard-spk'>('detail-order');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

  if (!order) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-bold text-slate-800">SPK tidak ditemukan.</p>
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

  const canEdit = canManualEditSPK(currentUser.role);

  return (
    <div id="spk-printable-view" className="space-y-6 pb-12">
      {/* Action Bar (Hidden on Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => onNavigate(`order-detail-${order.id}`)}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Detail Order ({order.orderNumber})</span>
        </button>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('detail-order')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'detail-order'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Format Resmi Detail Order KIRA</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('standard-spk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'standard-spk'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Format Standar SPK</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <FileEdit className="w-4 h-4 text-blue-600" />
              <span>Perbaiki Manual SPK</span>
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

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Manual Edit SPK Modal */}
      {showEditModal && (
        <ManualEditSPKModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          order={order}
        />
      )}

      {/* Upload SPK to Drive Modal */}
      {showDriveModal && (
        <UploadToDriveModal
          isOpen={showDriveModal}
          onClose={() => setShowDriveModal(false)}
          defaultCategory="spk"
          defaultOrder={order}
        />
      )}

      {/* RENDER VIEW MODE */}
      {viewMode === 'detail-order' ? (
        <DetailOrderSheet order={order} onPrint={handlePrint} showActions={false} />
      ) : (
        /* Official SPK Document Canvas */
        <div className="print-document-canvas bg-white p-8 sm:p-12 rounded-2xl border-2 border-slate-300 shadow-lg max-w-4xl mx-auto text-slate-900 print:border-0 print:shadow-none print:p-0 print:max-w-none print:overflow-visible">
        {/* SPK Header */}
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
                SURAT PERINTAH KERJA (SPK)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{settings.address} • WA: {settings.phone}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="font-mono text-sm font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 inline-block">
              {order.spkNumber}
            </span>
            <p className="text-xs text-slate-600 font-semibold mt-1">Order Ref: {order.orderNumber}</p>
            <p className="text-[11px] text-slate-500">Tgl Diterbitkan: {formatDateID(order.orderDate)}</p>
          </div>
        </div>

        {/* Client & Schedule Information */}
        <div className="print-avoid-break grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 text-xs bg-slate-50/60 p-4 rounded-xl mt-4">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Client Pemesan:</span>
            <span className="font-bold text-slate-900 text-sm">{order.clientName}</span>
            <p className="text-[11px] text-slate-600">{order.clientCompany}</p>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Kontak WhatsApp:</span>
            <span className="font-mono font-semibold text-slate-900">{order.clientPhone}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Marketing PIC:</span>
            <span className="font-semibold text-slate-900">{order.marketingName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Deadline Workshop:</span>
            <span className="font-extrabold text-rose-700 text-sm">{formatDateID(order.deadline)}</span>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="print-avoid-break mt-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              1. Spesifikasi Teknis Pesanan
            </h3>
            <span className="text-xs font-bold text-slate-700">Total Qty: {order.quantity} pcs</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Jenis Produk:</span>
              <span className="font-bold text-slate-900">{order.productType}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Bahan Kain:</span>
              <span className="font-bold text-slate-900">{order.fabric}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Model Kerah:</span>
              <span className="font-bold text-slate-900">{order.collarModel}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Model Lengan:</span>
              <span className="font-bold text-slate-900">{order.sleeveModel}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 block text-[10px] font-bold">Keterangan Warna / Sublim:</span>
            <p className="font-medium text-slate-800 mt-0.5">{order.colorNotes || '-'}</p>
          </div>
        </div>

        {/* Size Breakdown */}
        <div className="print-avoid-break mt-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              2. Rincian Ukuran & Jumlah Potong
            </h3>
            <span className="text-xs font-semibold text-slate-500">Standar Pola Jersey Dewasa</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-300">
            <table className="w-full text-center text-xs">
              <thead className="bg-slate-100 font-black text-slate-800 border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">XS</th>
                  <th className="py-2.5 px-3">S</th>
                  <th className="py-2.5 px-3">M</th>
                  <th className="py-2.5 px-3">L</th>
                  <th className="py-2.5 px-3">XL</th>
                  <th className="py-2.5 px-3">XXL</th>
                  <th className="py-2.5 px-3">3XL</th>
                  <th className="py-2.5 px-3">4XL</th>
                  <th className="py-2.5 px-3">5XL</th>
                  <th className="py-2.5 px-3 bg-slate-200 font-black">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr className="font-bold text-slate-900">
                  <td className="py-2.5 px-3">{order.sizeDetails?.XS || 0}</td>
                  <td className="py-2.5 px-3">{order.sizeDetails?.S || 0}</td>
                  <td className="py-2.5 px-3">{order.sizeDetails?.M || 0}</td>
                  <td className="py-2.5 px-3">{order.sizeDetails?.L || 0}</td>
                  <td className="py-2.5 px-3">{order.sizeDetails?.XL || 0}</td>
                  <td className="py-2.5 px-3">{order.sizeDetails?.XXL || 0}</td>
                  <td className="py-2.5 px-3">{order.sizeDetails?.['3XL'] || 0}</td>
                  <td className="py-2.5 px-3">{order.sizeDetails?.['4XL'] || 0}</td>
                  <td className="py-2.5 px-3">{order.sizeDetails?.['5XL'] || 0}</td>
                  <td className="py-2.5 px-3 bg-slate-100 text-indigo-700 font-black text-sm">
                    {order.quantity} pcs
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* REFERENSI GAMBAR PESANAN: GAMBAR 1 & GAMBAR 2 */}
        <div className="image-reference-box print-avoid-break mt-6 space-y-3">
          <div className="border-b border-slate-200 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              3. REFERENSI GAMBAR PESANAN
            </h3>
            <p className="text-[10px] text-slate-500">
              Panduan acuan visual untuk operator mesin cetak, sublim, cutting, dan jahit.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* GAMBAR 1 */}
            <div className="p-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-center">
              <span className="block text-xs font-black text-slate-900 mb-2">GAMBAR 1</span>
              <div className="aspect-4/3 max-h-56 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                <img
                  src={order.image1}
                  alt="GAMBAR 1"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            </div>

            {/* GAMBAR 2 */}
            <div className="p-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-center">
              <span className="block text-xs font-black text-slate-900 mb-2">GAMBAR 2</span>
              <div className="aspect-4/3 max-h-56 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                <img
                  src={order.image2}
                  alt="GAMBAR 2"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Production Workshop Notes */}
        <div className="print-avoid-break mt-6 p-4 bg-amber-50/70 border border-amber-300 rounded-xl text-xs">
          <span className="font-bold text-amber-900 block mb-1">Catatan Khusus Workshop & QC:</span>
          <p className="text-amber-800">{order.productionNotes || 'Jahit rapi, pastikan warna sublim tajam dan akurat.'}</p>
          {order.notes && <p className="text-amber-700 mt-1 italic">Catatan Order: {order.notes}</p>}
        </div>

        {/* Official Signatures */}
        <div className="signature-block print-avoid-break grid grid-cols-3 gap-6 pt-10 text-center text-xs border-t border-slate-200 mt-8">
          <div>
            <p className="text-slate-500 font-semibold">Marketing PIC</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-900 underline">{order.marketingName}</p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold">Kepala Workshop / Produksi</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-900 underline">Pak Joko Santoso</p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold">Quality Control (QC)</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-900 underline">Agus Setiawan</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
