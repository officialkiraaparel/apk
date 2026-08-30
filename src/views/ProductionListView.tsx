import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Package,
  Plus,
  Search,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import { ImageModal } from '../components/common/ImageModal';
import { OrderStatusBadge } from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import { Order, ProductionStageId } from '../types';
import { INITIAL_PRODUCTION_STAGES } from '../utils/constants';
import { formatDateID, formatDateTimeID, generateWhatsAppUrl } from '../utils/formatters';

export const ProductionListView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { orders, advanceProductionStage, addProductionPhoto, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');

  // Photo Upload Modal
  const [selectedOrderForPhoto, setSelectedOrderForPhoto] = useState<Order | null>(null);
  const [photoStageId, setPhotoStageId] = useState<ProductionStageId>('JAHIT');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80');
  const [photoCaption, setPhotoCaption] = useState('');

  // Zoom Image
  const [modalImage, setModalImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Filter orders that are ready or currently in production
  const productionOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(q) ||
      order.clientName.toLowerCase().includes(q) ||
      order.clientCompany.toLowerCase().includes(q) ||
      order.spkNumber.toLowerCase().includes(q) ||
      order.productType.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (selectedStageFilter !== 'all' && order.currentStageId !== selectedStageFilter) return false;

    return true;
  });

  const handlePhotoUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPhoto || !photoCaption) return;

    addProductionPhoto(selectedOrderForPhoto.id, photoStageId, photoUrl, photoCaption);
    setSelectedOrderForPhoto(null);
    setPhotoCaption('');
  };

  return (
    <div id="production-list-view" className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
              Divisi Produksi & Workshop
            </span>
            <span className="text-xs text-slate-500">Antrian SPK Real-Time</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit',sans-serif] mt-1">
            Monitoring Pengerjaan Produksi Konveksi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola tahapan pola, sublim, cutting, jahit, QC, dan dokumentasi foto progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('orders')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            Semua Master Order
          </button>
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
            placeholder="Cari No SPK, Order ID, Client, Produk..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="w-full sm:w-72">
          <select
            value={selectedStageFilter}
            onChange={e => setSelectedStageFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
          >
            <option value="all">Semua Tahapan Produksi (13 Tahap)</option>
            {INITIAL_PRODUCTION_STAGES.map(st => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.percentage}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workshop Production Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {productionOrders.map(order => {
          const currentStage = order.productionStages.find(s => s.id === order.currentStageId);

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {order.spkNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{order.clientName}</h3>
                    <p className="text-[11px] text-slate-500">{order.clientCompany}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-700 block">
                      Deadline: {formatDateID(order.deadline)}
                    </span>
                    <span className="text-[10px] text-slate-400">Order: {order.orderNumber}</span>
                  </div>
                </div>

                {/* Spec details */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Produk & Qty:</span>
                    <span className="font-bold text-slate-900">
                      {order.productType} ({order.quantity} pcs)
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Bahan:</span>
                    <span className="font-bold text-slate-900 truncate block">{order.fabric}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Kerah & Lengan:</span>
                    <span className="font-semibold text-slate-800">
                      {order.collarModel} • {order.sleeveModel}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Warna/Sublim:</span>
                    <span className="font-semibold text-slate-800 truncate block">{order.colorNotes || '-'}</span>
                  </div>
                </div>

                {/* Side-by-side Visual Reference: Gambar 1 & Gambar 2 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-700">
                      REFERENSI GAMBAR PESANAN
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold">Klik untuk zoom</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Gambar 1 */}
                    <div
                      onClick={() =>
                        setModalImage({
                          url: order.image1,
                          title: 'GAMBAR 1',
                          subtitle: `${order.spkNumber} • ${order.clientName}`,
                        })
                      }
                      className="cursor-pointer aspect-4/3 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-1.5 hover:border-indigo-500 transition-all text-center"
                    >
                      <img src={order.image1} alt="GAMBAR 1" className="max-h-full w-auto object-contain" />
                    </div>

                    {/* Gambar 2 */}
                    <div
                      onClick={() =>
                        setModalImage({
                          url: order.image2,
                          title: 'GAMBAR 2',
                          subtitle: `${order.spkNumber} • ${order.clientName}`,
                        })
                      }
                      className="cursor-pointer aspect-4/3 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-1.5 hover:border-indigo-500 transition-all text-center"
                    >
                      <img src={order.image2} alt="GAMBAR 2" className="max-h-full w-auto object-contain" />
                    </div>
                  </div>
                </div>

                {/* Live Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Tahap Saat Ini: <strong className="text-indigo-600">{currentStage?.name}</strong>
                    </span>
                    <span className="font-black text-indigo-600">{order.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${order.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedOrderForPhoto(order);
                      setPhotoStageId(order.currentStageId as ProductionStageId);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Foto ({order.productionPhotos.length})</span>
                  </button>

                  <button
                    onClick={() => onNavigate(`spk-detail-${order.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>SPK</span>
                  </button>
                </div>

                <button
                  onClick={() => onNavigate(`order-detail-${order.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <span>Update Tahap &rarr;</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Zoom Gambar */}
      {modalImage && (
        <ImageModal
          isOpen={true}
          onClose={() => setModalImage(null)}
          imageUrl={modalImage.url}
          title={modalImage.title}
          subtitle={modalImage.subtitle}
        />
      )}

      {/* Modal Upload Foto Progress */}
      {selectedOrderForPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Upload Foto Progress ({selectedOrderForPhoto.spkNumber})
              </h3>
              <button onClick={() => setSelectedOrderForPhoto(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePhotoUploadSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Tahap Workshop *</label>
                <select
                  value={photoStageId}
                  onChange={e => setPhotoStageId(e.target.value as ProductionStageId)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {INITIAL_PRODUCTION_STAGES.slice(4).map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Foto Progress URL *</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Caption Foto *</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  placeholder="Contoh: Proses jahit rib kerah V-Neck selesai 48 pcs"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPhoto(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  Simpan Foto Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
