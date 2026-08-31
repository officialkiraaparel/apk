import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Layers,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Search,
  Sparkles,
  Truck,
  User,
} from 'lucide-react';
import { ImageModal } from '../components/common/ImageModal';
import { DesignStatusBadge, InvoiceStatusBadge, OrderStatusBadge } from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import { formatDateID, formatDateTimeID, formatRupiah, generateWhatsAppUrl } from '../utils/formatters';

export const ClientTrackingView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { orders, settings } = useApp();

  const getInitialTrackingQuery = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('track-')) {
        return decodeURIComponent(hash.replace('track-', ''));
      }
      const params = new URLSearchParams(window.location.search);
      const trackParam = params.get('track');
      if (trackParam) return decodeURIComponent(trackParam);
    }
    return '';
  };

  const [searchInput, setSearchInput] = useState(getInitialTrackingQuery);
  const [searchedOrder, setSearchedOrder] = useState<any>(() => {
    const q = getInitialTrackingQuery().trim().toLowerCase();
    if (!q) return null;
    return (
      orders.find(
        o =>
          o.orderNumber.toLowerCase() === q ||
          o.id.toLowerCase() === q ||
          o.clientPhone.includes(q) ||
          o.clientName.toLowerCase().includes(q)
      ) || null
    );
  });
  const [modalImage, setModalImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Listen to hash / URL changes
  React.useEffect(() => {
    const handleUrlChange = () => {
      const q = getInitialTrackingQuery().trim().toLowerCase();
      if (q) {
        setSearchInput(getInitialTrackingQuery());
        const found = orders.find(
          o =>
            o.orderNumber.toLowerCase() === q ||
            o.id.toLowerCase() === q ||
            o.clientPhone.includes(q) ||
            o.clientName.toLowerCase().includes(q)
        );
        if (found) {
          setSearchedOrder(found);
        }
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    return () => window.removeEventListener('hashchange', handleUrlChange);
  }, [orders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim().toLowerCase();
    const found = orders.find(
      o => o.orderNumber.toLowerCase() === q || o.clientPhone.includes(q) || o.clientName.toLowerCase().includes(q)
    );
    setSearchedOrder(found || null);
  };

  return (
    <div id="client-tracking-view" className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Portal Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-8 rounded-3xl text-white shadow-xl text-center relative overflow-hidden border border-indigo-900/40">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>KIRA APAREL Client Tracking Portal</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif]">
          Lacak Status Pesanan Konveksi
        </h2>
        <p className="text-xs text-slate-300 max-w-lg mx-auto mt-2">
          Masukkan Order ID (contoh: <strong>KA-20260828-001</strong>) atau nomor WhatsApp untuk melihat live progress produksi, visual desain, dan tagihan invoice.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-6 max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Ketik Order ID / No WhatsApp..."
            className="flex-1 px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-[0.98]"
          >
            Lacak
          </button>
        </form>

        {/* Quick Demo Chips */}
        {orders.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] text-slate-400">Pilih Pesanan:</span>
            {orders.slice(0, 3).map(o => (
              <button
                key={o.id}
                onClick={() => {
                  setSearchInput(o.orderNumber);
                  setSearchedOrder(o);
                }}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-indigo-900/60 rounded-lg text-[11px] font-mono text-indigo-300 border border-slate-700"
              >
                {o.orderNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tracking Result */}
      {searchedOrder ? (
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Status Terkini Pesanan
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-['Outfit',sans-serif]">
                  {searchedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Pemesan: <strong className="text-slate-800">{searchedOrder.clientName}</strong> ({searchedOrder.clientCompany})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <OrderStatusBadge status={searchedOrder.status} />
                <DesignStatusBadge status={searchedOrder.designStatus} />
              </div>
            </div>

            {/* Production Progress Timeline Bar */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400">Progress Workshop</span>
                  <h4 className="text-base font-bold">
                    {searchedOrder.productionStages.find(s => s.id === searchedOrder.currentStageId)?.name || searchedOrder.status}
                  </h4>
                </div>
                <span className="text-2xl font-black text-indigo-400">{searchedOrder.progressPercentage}%</span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2.5 rounded-full transition-all"
                  style={{ width: `${searchedOrder.progressPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Tgl Order: {formatDateID(searchedOrder.orderDate)}</span>
                <span className="text-indigo-300 font-semibold">Estimasi Selesai: {formatDateID(searchedOrder.deadline)}</span>
              </div>
            </div>

            {/* REFERENSI GAMBAR PESANAN: GAMBAR 1 & GAMBAR 2 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">REFERENSI GAMBAR PESANAN</h4>
                  <p className="text-xs text-slate-500">Visual identitas pesanan jersey Anda</p>
                </div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Versi {searchedOrder.currentDesignVersion}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gambar 1 */}
                <div
                  onClick={() =>
                    setModalImage({
                      url: searchedOrder.image1,
                      title: 'GAMBAR 1',
                      subtitle: `${searchedOrder.orderNumber}`,
                    })
                  }
                  className="cursor-pointer bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-all text-center group"
                >
                  <span className="text-xs font-black text-slate-800 block mb-2">GAMBAR 1</span>
                  <div className="aspect-4/3 bg-white rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-200">
                    <img
                      src={searchedOrder.image1}
                      alt="GAMBAR 1"
                      className="max-h-full w-auto object-contain group-hover:scale-102 transition-transform"
                    />
                  </div>
                </div>

                {/* Gambar 2 */}
                <div
                  onClick={() =>
                    setModalImage({
                      url: searchedOrder.image2,
                      title: 'GAMBAR 2',
                      subtitle: `${searchedOrder.orderNumber}`,
                    })
                  }
                  className="cursor-pointer bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-all text-center group"
                >
                  <span className="text-xs font-black text-slate-800 block mb-2">GAMBAR 2</span>
                  <div className="aspect-4/3 bg-white rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-200">
                    <img
                      src={searchedOrder.image2}
                      alt="GAMBAR 2"
                      className="max-h-full w-auto object-contain group-hover:scale-102 transition-transform"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Spec & Sizes Overview */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold text-slate-900">Spesifikasi & Rincian Pesanan:</h4>
              <p className="text-slate-700">
                <strong>Produk:</strong> {searchedOrder.productType} ({searchedOrder.quantity} pcs) • <strong>Bahan:</strong> {searchedOrder.fabric}
              </p>
              <p className="text-slate-700">
                <strong>Kerah:</strong> {searchedOrder.collarModel} • <strong>Lengan:</strong> {searchedOrder.sleeveModel} • <strong>Warna:</strong> {searchedOrder.colorNotes}
              </p>
            </div>

            {/* Live Progress Photos */}
            {searchedOrder.productionPhotos.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Foto Dokumentasi Pengerjaan di Workshop:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {searchedOrder.productionPhotos.map(photo => (
                    <div
                      key={photo.id}
                      onClick={() =>
                        setModalImage({
                          url: photo.photoUrl,
                          title: photo.stageName,
                          subtitle: photo.caption,
                        })
                      }
                      className="cursor-pointer bg-slate-50 rounded-xl border border-slate-200 overflow-hidden group"
                    >
                      <div className="aspect-4/3 overflow-hidden flex items-center justify-center bg-slate-200">
                        <img
                          src={photo.photoUrl}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2 text-[10px]">
                        <span className="font-bold text-indigo-700">{photo.stageName}</span>
                        <p className="text-slate-600 line-clamp-1">{photo.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logistics Resi if shipped */}
            {searchedOrder.shipment && (
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-700" />
                  <h4 className="font-bold text-cyan-900">Informasi Pengiriman Ekspedisi</h4>
                </div>
                <p className="text-cyan-800">
                  Kurir: <strong>{searchedOrder.shipment.courier}</strong> • No Resi:{' '}
                  <strong className="font-mono">{searchedOrder.shipment.trackingNumber}</strong>
                </p>
              </div>
            )}

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Total Tagihan:</span>
                <span className="text-base font-extrabold text-slate-900">{formatRupiah(searchedOrder.totalAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Pembayaran:</span>
                <InvoiceStatusBadge status={searchedOrder.invoice.status} />
              </div>
              <div>
                <span className="text-slate-500 block">Sisa Pelunasan:</span>
                <span className="text-base font-black text-rose-700">{formatRupiah(searchedOrder.remainingBalance)}</span>
              </div>
            </div>

            {/* Contact WhatsApp Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Ada pertanyaan seputar pesanan Anda?</span>
              <a
                href={generateWhatsAppUrl(searchedOrder, 'progress')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Admin KIRA APAREL</span>
              </a>
            </div>
          </div>
        </div>
      ) : searchInput.trim() ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-2">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Pesanan Tidak Ditemukan</h3>
          <p className="text-xs text-slate-400">
            Tidak ditemukan pesanan dengan kata kunci &quot;{searchInput}&quot;. Periksa kembali nomor Order ID atau nomor WhatsApp Anda.
          </p>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-2">
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Pelacakan Pesanan Real-time</h3>
          <p className="text-xs text-slate-400">
            Ketik nomor Order ID atau nomor WhatsApp Anda pada kotak pencarian di atas untuk melacak progres produksi.
          </p>
        </div>
      )}

      {modalImage && (
        <ImageModal
          isOpen={true}
          onClose={() => setModalImage(null)}
          imageUrl={modalImage.url}
          title={modalImage.title}
          subtitle={modalImage.subtitle}
        />
      )}
    </div>
  );
};
