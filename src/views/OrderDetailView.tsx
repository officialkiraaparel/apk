import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileEdit,
  FileText,
  History,
  Image as ImageIcon,
  Layers,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Printer,
  QrCode,
  Send,
  Share2,
  Sparkles,
  Tag,
  Truck,
  Upload,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { ImageModal } from '../components/common/ImageModal';
import { DetailOrderSheet } from '../components/orders/DetailOrderSheet';
import { ManualEditInvoiceModal } from '../components/modals/ManualEditInvoiceModal';
import { ManualEditSPKModal } from '../components/modals/ManualEditSPKModal';
import { UploadToDriveModal } from '../components/modals/UploadToDriveModal';
import { OrderTrackingQR } from '../components/common/OrderTrackingQR';
import {
  canAdvanceProduction,
  canManualEditInvoice,
  canManualEditSPK,
  canVerifyPayment,
} from '../utils/security';
import {
  DesignStatusBadge,
  InvoiceStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import {
  DesignStatus,
  DesignVersion,
  DriveCategory,
  PaymentMethod,
  ProductionStageId,
} from '../types';
import { INITIAL_PRODUCTION_STAGES } from '../utils/constants';
import {
  cleanPhoneNumber,
  formatDateID,
  formatDateTimeID,
  formatRupiah,
  generateWhatsAppUrl,
} from '../utils/formatters';

interface OrderDetailViewProps {
  orderId: string;
  onNavigate: (tab: string) => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ orderId, onNavigate }) => {
  const {
    orders,
    currentUser,
    advanceProductionStage,
    addProductionPhoto,
    addProductionNote,
    updateDesignStatus,
    uploadDesignVersion,
    addPayment,
    verifyPayment,
    updateShipment,
    settings,
  } = useApp();

  const order = orders.find(o => o.id === orderId);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'detail-order' | 'overview' | 'product' | 'design' | 'spk' | 'production' | 'invoice' | 'shipment'
  >('overview');

  // Image Modal state
  const [activeModalImage, setActiveModalImage] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  // New Design Version Modal
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVersionImage1, setNewVersionImage1] = useState('');
  const [newVersionImage2, setNewVersionImage2] = useState('');
  const [newVersionNotes, setNewVersionNotes] = useState('');

  // Revision Modal
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Production Photo Upload State
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoStageId, setPhotoStageId] = useState<ProductionStageId>('JAHIT');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80');
  const [photoCaption, setPhotoCaption] = useState('');

  // Payment State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer Bank');
  const [paymentProofUrl, setPaymentProofUrl] = useState('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Shipment State
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [courierName, setCourierName] = useState('JNE Express (Reguler)');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [shipmentNotes, setShipmentNotes] = useState('');

  // Production stage advance note
  const [stageNote, setStageNote] = useState('');

  // Manual Edit Modals
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
  const [showEditSPKModal, setShowEditSPKModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveCategory, setDriveCategory] = useState<DriveCategory>('bukti_transfer');

  if (!order) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Pesanan Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500 mt-1">Order dengan ID tersebut tidak tersedia.</p>
        <button
          onClick={() => onNavigate('orders')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Kembali ke Daftar Pesanan
        </button>
      </div>
    );
  }

  // Confetti trigger for design approval
  const handleApproveDesign = () => {
    updateDesignStatus(order.id, 'Disetujui');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes) return;
    updateDesignStatus(order.id, 'Revisi', revisionNotes);
    setShowRevisionModal(false);
    setRevisionNotes('');
  };

  const handleUploadNewDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionImage1 && !newVersionImage2) return;
    uploadDesignVersion(order.id, newVersionImage1 || order.image1, newVersionImage2 || order.image2, newVersionNotes);
    setShowNewVersionModal(false);
    setNewVersionImage1('');
    setNewVersionImage2('');
    setNewVersionNotes('');
  };

  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl || !photoCaption) return;
    addProductionPhoto(order.id, photoStageId, photoUrl, photoCaption);
    setShowPhotoModal(false);
    setPhotoCaption('');
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    addPayment(order.id, {
      amount: paymentAmount,
      method: paymentMethod,
      proofUrl: paymentProofUrl,
      notes: paymentNotes,
    });
    setShowAddPaymentModal(false);
    setPaymentAmount(0);
    setPaymentNotes('');
  };

  const handleShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber) return;
    updateShipment(order.id, {
      courier: courierName,
      trackingNumber,
      estimatedArrival: estimatedArrival || order.deadline,
      notes: shipmentNotes,
      status: 'Dalam Pengiriman',
    });
    setShowShipmentModal(false);
  };

  const copyTrackingLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(`${url}#track-${order.orderNumber}`);
    alert(`Link Tracking Pesanan disalin:\n${url}#track-${order.orderNumber}`);
  };

  return (
    <div id="order-detail-view" className="space-y-6 pb-12">
      {/* Top Breadcrumb & Quick Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('orders')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-indigo-600">{order.orderNumber}</span>
              <OrderStatusBadge status={order.status} />
              <DesignStatusBadge status={order.designStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong className="text-slate-800">{order.clientName}</strong> ({order.clientCompany}) • SPK:{' '}
              <span className="font-mono">{order.spkNumber}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Format Detail Order KIRA Button */}
          <button
            onClick={() => setActiveTab('detail-order')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl shadow-xs transition-all active:scale-[0.98]"
            title="Lihat & Cetak Format Detail Order KIRA"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Format Detail Order (KIRA)</span>
          </button>

          {/* WhatsApp Direct */}
          <a
            href={generateWhatsAppUrl(order, 'progress')}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
            title="Kirim Update WhatsApp ke Client"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat WhatsApp Client</span>
          </a>

          {/* SPK View */}
          <button
            onClick={() => onNavigate(`spk-detail-${order.id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            title="Cetak SPK Workshop"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Cetak SPK</span>
          </button>

          {/* Invoice View */}
          <button
            onClick={() => onNavigate(`invoice-detail-${order.id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            title="Cetak Invoice"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Cetak Invoice</span>
          </button>

          {/* Google Drive Upload / Sync */}
          <button
            type="button"
            onClick={() => {
              setDriveCategory('bukti_transfer');
              setShowDriveModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold rounded-xl transition-all"
            title="Simpan File Pesanan ke Google Drive"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Drive Sync</span>
          </button>

          {/* Copy Public Tracking URL */}
          <button
            onClick={copyTrackingLink}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl"
            title="Salin Link Tracking Pelanggan"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-xs flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: <Eye className="w-4 h-4" /> },
          { id: 'detail-order', label: 'Format Detail Order (KIRA)', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
          { id: 'product', label: 'Produk & Ukuran', icon: <Package className="w-4 h-4" /> },
          { id: 'design', label: 'Referensi Desain', icon: <ImageIcon className="w-4 h-4" />, badge: order.designStatus },
          { id: 'spk', label: 'SPK Workshop', icon: <FileCheck2 className="w-4 h-4" /> },
          { id: 'production', label: 'Progress Produksi', icon: <Wrench className="w-4 h-4" />, badge: `${order.progressPercentage}%` },
          { id: 'invoice', label: 'Invoice & Pembayaran', icon: <FileText className="w-4 h-4" /> },
          { id: 'shipment', label: 'Pengiriman', icon: <Truck className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            id={`tab-btn-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT CONTAINER */}
      <div className="bg-white rounded-b-2xl p-6 border border-t-0 border-slate-200 shadow-xs">
        {/* ======================================================== */}
        {/* TAB: DETAIL ORDER (KIRA APPAREL FORMAT RESMI) */}
        {/* ======================================================== */}
        {activeTab === 'detail-order' && (
          <DetailOrderSheet
            order={order}
            onPrint={() => window.print()}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold">Total Nilai Order</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{formatRupiah(order.totalAmount)}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{order.quantity} pcs ({order.productType})</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <span className="text-xs text-emerald-800 font-semibold">Sudah Dibayar</span>
                <p className="text-xl font-extrabold text-emerald-700 mt-1">{formatRupiah(order.downPayment)}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">DP / Pembayaran Terverifikasi</p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200">
                <span className="text-xs text-rose-800 font-semibold">Sisa Tagihan</span>
                <p className="text-xl font-extrabold text-rose-700 mt-1">{formatRupiah(order.remainingBalance)}</p>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  {order.remainingBalance <= 0 ? 'Lunas 100%' : 'Menunggu Pelunasan'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200">
                <span className="text-xs text-indigo-800 font-semibold">Deadline Selesai</span>
                <p className="text-base font-extrabold text-indigo-900 mt-1">{formatDateID(order.deadline)}</p>
                <p className="text-[11px] text-indigo-700 mt-0.5">Tgl Order: {formatDateID(order.orderDate)}</p>
              </div>
            </div>

            {/* Current Production Stage Bar */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                    Live Workshop Status
                  </span>
                  <h4 className="text-lg font-bold">
                    {order.productionStages.find(s => s.id === order.currentStageId)?.name || order.status}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-400">{order.progressPercentage}%</span>
                  <p className="text-[11px] text-slate-300">Tahap dari total 13 proses</p>
                </div>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all"
                  style={{ width: `${order.progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Side-by-side: Client & Product Brief + Gambar 1 & 2 Quick Thumbnails */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Info Specs */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                  Ringkasan Pesanan & Client
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Nama Client:</span>
                    <span className="font-bold text-slate-900">{order.clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Perusahaan / Tim:</span>
                    <span className="font-semibold text-slate-800">{order.clientCompany}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nomor WhatsApp:</span>
                    <span className="font-mono text-slate-800">{order.clientPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Marketing PIC:</span>
                    <span className="font-semibold text-slate-800">{order.marketingName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Bahan Kain:</span>
                    <span className="font-semibold text-slate-800">{order.fabric}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Model Kerah:</span>
                    <span className="font-semibold text-slate-800">{order.collarModel}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Model Lengan:</span>
                    <span className="font-semibold text-slate-800">{order.sleeveModel}</span>
                  </div>
                </div>
              </div>

              {/* Right: Gambar 1 and Gambar 2 Quick Visual Identity Cards */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold text-slate-900">Referensi Gambar Identitas</h4>
                  <button
                    onClick={() => setActiveTab('design')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Buka Tab Desain &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Gambar 1 */}
                  <div
                    onClick={() =>
                      setActiveModalImage({
                        url: order.image1,
                        title: 'GAMBAR 1',
                        subtitle: `${order.orderNumber} • ${order.clientCompany}`,
                      })
                    }
                    className="group cursor-pointer rounded-xl bg-white p-2 border border-slate-200 hover:border-indigo-500 transition-all text-center"
                  >
                    <div className="aspect-4/3 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center mb-1.5">
                      <img
                        src={order.image1}
                        alt="GAMBAR 1"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800">GAMBAR 1</span>
                  </div>

                  {/* Gambar 2 */}
                  <div
                    onClick={() =>
                      setActiveModalImage({
                        url: order.image2,
                        title: 'GAMBAR 2',
                        subtitle: `${order.orderNumber} • ${order.clientCompany}`,
                      })
                    }
                    className="group cursor-pointer rounded-xl bg-white p-2 border border-slate-200 hover:border-indigo-500 transition-all text-center"
                  >
                    <div className="aspect-4/3 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center mb-1.5">
                      <img
                        src={order.image2}
                        alt="GAMBAR 2"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800">GAMBAR 2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PRODUK & DETAIL UKURAN */}
        {/* ======================================================== */}
        {activeTab === 'product' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500">Jenis Produk</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{order.productType}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500">Bahan Kain</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{order.fabric}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500">Model Kerah & Lengan</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {order.collarModel} • {order.sleeveModel}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500">Keterangan Warna & Sablon Sublim:</span>
              <p className="text-xs font-semibold text-slate-800 mt-1">{order.colorNotes || '-'}</p>
              {order.notes && (
                <p className="text-xs text-slate-600 mt-1 italic">Catatan khusus: {order.notes}</p>
              )}
            </div>

            {/* Size Matrix Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900">Rincian Quantity Ukuran (Size Chart)</h4>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Total: {order.quantity} pcs
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
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
                      <th className="py-2.5 px-3 bg-indigo-50 text-indigo-900">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    <tr className="font-extrabold text-slate-800">
                      <td className="py-3 px-3">{order.sizeDetails?.XS || 0}</td>
                      <td className="py-3 px-3">{order.sizeDetails?.S || 0}</td>
                      <td className="py-3 px-3">{order.sizeDetails?.M || 0}</td>
                      <td className="py-3 px-3">{order.sizeDetails?.L || 0}</td>
                      <td className="py-3 px-3">{order.sizeDetails?.XL || 0}</td>
                      <td className="py-3 px-3">{order.sizeDetails?.XXL || 0}</td>
                      <td className="py-3 px-3">{order.sizeDetails?.['3XL'] || 0}</td>
                      <td className="py-3 px-3">{order.sizeDetails?.['4XL'] || 0}</td>
                      <td className="py-3 px-3">{order.sizeDetails?.['5XL'] || 0}</td>
                      <td className="py-3 px-3 bg-indigo-50 text-indigo-700 text-sm">
                        {order.quantity} pcs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: REFERENSI DESAIN (GAMBAR 1 & GAMBAR 2) + APPROVAL & VERSIONING */}
        {/* ======================================================== */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            {/* Design Status & Approval Banner */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 rounded">
                    Desain Versi {order.currentDesignVersion}
                  </span>
                  <DesignStatusBadge status={order.designStatus} />
                </div>
                <h3 className="text-lg font-bold mt-1">
                  Status Desain:{' '}
                  <span className="text-indigo-400 font-extrabold">{order.designStatus}</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {order.designStatus === 'Disetujui'
                    ? 'Desain telah diverifikasi dan disetujui. SPK resmi dibuat untuk produksi.'
                    : order.designStatus === 'Revisi'
                    ? 'Permintaan revisi sedang disesuaikan oleh tim marketing/desainer.'
                    : 'Menunggu pengecekan & persetujuan visual dari Client.'}
                </p>
              </div>

              {/* Approval Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {order.designStatus !== 'Disetujui' && (
                  <>
                    <button
                      id="approve-design-btn"
                      type="button"
                      onClick={handleApproveDesign}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Setujui Desain (ACC)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRevisionModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Minta Revisi</span>
                    </button>
                  </>
                )}

                {(currentUser.role === 'admin' || currentUser.role === 'marketing') && (
                  <button
                    type="button"
                    onClick={() => setShowNewVersionModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Versi Baru</span>
                  </button>
                )}
              </div>
            </div>

            {/* Side-by-side GAMBAR 1 and GAMBAR 2 with STRICT NAMING */}
            <div>
              <div className="mb-3">
                <h4 className="text-base font-bold text-slate-900">
                  REFERENSI GAMBAR PESANAN (VERSI {order.currentDesignVersion})
                </h4>
                <p className="text-xs text-slate-500">
                  Visual identitas referensi pesanan konveksi — Klik gambar untuk melihat resolusi penuh.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GAMBAR 1 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-700 bg-indigo-100/70 px-3 py-1 rounded-lg">
                      GAMBAR 1
                    </span>
                    <button
                      onClick={() =>
                        setActiveModalImage({
                          url: order.image1,
                          title: 'GAMBAR 1',
                          subtitle: `${order.orderNumber} • ${order.clientName}`,
                        })
                      }
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Zoom Detail</span>
                    </button>
                  </div>

                  <div
                    onClick={() =>
                      setActiveModalImage({
                        url: order.image1,
                        title: 'GAMBAR 1',
                        subtitle: `${order.orderNumber} • ${order.clientName}`,
                      })
                    }
                    className="cursor-pointer aspect-4/3 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-2 hover:shadow-md transition-all group"
                  >
                    <img
                      src={order.image1}
                      alt="GAMBAR 1"
                      className="max-h-full w-auto object-contain group-hover:scale-102 transition-transform"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 text-center font-medium">
                    Identitas / Referensi Desain 1
                  </p>
                </div>

                {/* GAMBAR 2 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-700 bg-indigo-100/70 px-3 py-1 rounded-lg">
                      GAMBAR 2
                    </span>
                    <button
                      onClick={() =>
                        setActiveModalImage({
                          url: order.image2,
                          title: 'GAMBAR 2',
                          subtitle: `${order.orderNumber} • ${order.clientName}`,
                        })
                      }
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Zoom Detail</span>
                    </button>
                  </div>

                  <div
                    onClick={() =>
                      setActiveModalImage({
                        url: order.image2,
                        title: 'GAMBAR 2',
                        subtitle: `${order.orderNumber} • ${order.clientName}`,
                      })
                    }
                    className="cursor-pointer aspect-4/3 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-2 hover:shadow-md transition-all group"
                  >
                    <img
                      src={order.image2}
                      alt="GAMBAR 2"
                      className="max-h-full w-auto object-contain group-hover:scale-102 transition-transform"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 text-center font-medium">
                    Identitas / Referensi Desain 2
                  </p>
                </div>
              </div>
            </div>

            {/* Design Version History Logs */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-slate-600" />
                <h4 className="text-sm font-bold text-slate-900">Riwayat Versi Desain (Versioning)</h4>
              </div>

              <div className="space-y-3">
                {order.designVersions.map(ver => (
                  <div
                    key={ver.version}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center">
                        v{ver.version}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">Versi {ver.version}</span>
                          <DesignStatusBadge status={ver.status} />
                          <span className="text-[10px] text-slate-400">
                            {formatDateTimeID(ver.createdAt)}
                          </span>
                        </div>
                        {ver.notes && <p className="text-xs text-slate-600 mt-1">{ver.notes}</p>}
                        {ver.revisionNotes && (
                          <div className="mt-1 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                            <strong>Catatan Revisi:</strong> {ver.revisionNotes}
                          </div>
                        )}
                        {ver.approvedBy && (
                          <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                            Disetujui oleh: {ver.approvedBy} ({formatDateTimeID(ver.approvedAt)})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setActiveModalImage({
                            url: ver.image1,
                            title: `GAMBAR 1 (v${ver.version})`,
                            subtitle: `${order.orderNumber}`,
                          })
                        }
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:border-indigo-500"
                      >
                        Gambar 1
                      </button>
                      <button
                        onClick={() =>
                          setActiveModalImage({
                            url: ver.image2,
                            title: `GAMBAR 2 (v${ver.version})`,
                            subtitle: `${order.orderNumber}`,
                          })
                        }
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:border-indigo-500"
                      >
                        Gambar 2
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: SPK (SURAT PERINTAH KERJA) */}
        {/* ======================================================== */}
        {activeTab === 'spk' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Surat Perintah Kerja (SPK) Workshop</h3>
                <p className="text-xs text-slate-500">
                  Panduan resmi antrian produksi untuk divisi cutting, sublim printing, jahit, dan finishing.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canManualEditSPK(currentUser.role) && (
                  <button
                    onClick={() => setShowEditSPKModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold rounded-xl shadow-xs transition-all"
                  >
                    <FileEdit className="w-4 h-4 text-blue-600" />
                    <span>Perbaiki Manual SPK</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate(`spk-detail-${order.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Buka & Cetak Dokumen SPK</span>
                </button>
              </div>
            </div>

            {/* Official SPK Document Layout */}
            <div className="p-8 bg-white border-2 border-slate-200 rounded-2xl space-y-6 shadow-xs max-w-4xl mx-auto">
              {/* SPK Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900 font-['Outfit',sans-serif]">
                    {settings.companyName}
                  </h2>
                  <p className="text-xs font-bold text-slate-700 tracking-wider">
                    SURAT PERINTAH KERJA (SPK)
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{settings.address}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-black text-indigo-700">{order.spkNumber}</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">Order Ref: {order.orderNumber}</p>
                  <p className="text-[10px] text-slate-500">Tgl: {formatDateID(order.orderDate)}</p>
                </div>
              </div>

              {/* Order & Client Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                <div>
                  <span className="text-slate-500 block">Nama Client:</span>
                  <span className="font-bold text-slate-900">{order.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Perusahaan / Tim:</span>
                  <span className="font-semibold text-slate-900">{order.clientCompany}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Marketing PIC:</span>
                  <span className="font-semibold text-slate-900">{order.marketingName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Deadline Produksi:</span>
                  <span className="font-bold text-rose-700">{formatDateID(order.deadline)}</span>
                </div>
              </div>

              {/* Product Specs */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  1. Spesifikasi Teknis Konveksi
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Produk:</span>
                    <span className="font-bold">{order.productType}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Bahan:</span>
                    <span className="font-bold">{order.fabric}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Kerah:</span>
                    <span className="font-bold">{order.collarModel}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Lengan:</span>
                    <span className="font-bold">{order.sleeveModel}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Keterangan Warna & Desain:</span>
                  <span className="font-medium text-slate-800">{order.colorNotes}</span>
                </div>
              </div>

              {/* Quantity Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  2. Rincian Jumlah Ukuran (Total: {order.quantity} pcs)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-center text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="py-2 px-2">XS</th>
                        <th className="py-2 px-2">S</th>
                        <th className="py-2 px-2">M</th>
                        <th className="py-2 px-2">L</th>
                        <th className="py-2 px-2">XL</th>
                        <th className="py-2 px-2">XXL</th>
                        <th className="py-2 px-2">3XL</th>
                        <th className="py-2 px-2">4XL</th>
                        <th className="py-2 px-2">5XL</th>
                        <th className="py-2 px-2 bg-slate-200 font-black">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-bold text-slate-800">
                        <td className="py-2 px-2">{order.sizeDetails?.XS || 0}</td>
                        <td className="py-2 px-2">{order.sizeDetails?.S || 0}</td>
                        <td className="py-2 px-2">{order.sizeDetails?.M || 0}</td>
                        <td className="py-2 px-2">{order.sizeDetails?.L || 0}</td>
                        <td className="py-2 px-2">{order.sizeDetails?.XL || 0}</td>
                        <td className="py-2 px-2">{order.sizeDetails?.XXL || 0}</td>
                        <td className="py-2 px-2">{order.sizeDetails?.['3XL'] || 0}</td>
                        <td className="py-2 px-2">{order.sizeDetails?.['4XL'] || 0}</td>
                        <td className="py-2 px-2">{order.sizeDetails?.['5XL'] || 0}</td>
                        <td className="py-2 px-2 bg-slate-100 text-indigo-700 font-black">
                          {order.quantity} pcs
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* REFERENSI GAMBAR PESANAN: GAMBAR 1 & GAMBAR 2 */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                  3. REFERENSI GAMBAR PESANAN
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-center">
                    <span className="block text-xs font-black text-slate-800 mb-2">GAMBAR 1</span>
                    <div className="aspect-4/3 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                      <img src={order.image1} alt="GAMBAR 1" className="max-h-full w-auto object-contain" />
                    </div>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-center">
                    <span className="block text-xs font-black text-slate-800 mb-2">GAMBAR 2</span>
                    <div className="aspect-4/3 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                      <img src={order.image2} alt="GAMBAR 2" className="max-h-full w-auto object-contain" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Production Special Notes */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs">
                <span className="font-bold text-amber-900 block mb-0.5">Catatan Produksi / Workshop:</span>
                <p className="text-amber-800">{order.productionNotes || 'Pola dan jahitan sesuai standar Kira Aparel.'}</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs">
                <div>
                  <p className="text-slate-500">Marketing PIC,</p>
                  <div className="h-14"></div>
                  <p className="font-bold text-slate-900 underline">{order.marketingName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Kepala Produksi,</p>
                  <div className="h-14"></div>
                  <p className="font-bold text-slate-900 underline">Pak Joko Santoso</p>
                </div>
                <div>
                  <p className="text-slate-500">Client ACC,</p>
                  <div className="h-14"></div>
                  <p className="font-bold text-slate-900 underline">{order.clientName}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: PROGRESS PRODUKSI & FOTO PROGRESS */}
        {/* ======================================================== */}
        {activeTab === 'production' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Alur & Foto Progress Produksi</h3>
                <p className="text-xs text-slate-500">
                  Pantau 13 tahapan proses pengerjaan workshop dan dokumentasi foto riil.
                </p>
              </div>

              {(currentUser.role === 'admin' || currentUser.role === 'produksi') && (
                <button
                  id="upload-production-photo-btn"
                  onClick={() => setShowPhotoModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Foto Progress</span>
                </button>
              )}
            </div>

            {/* 13 Stage Interactive Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                13 Tahapan Produksi Konveksi
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {order.productionStages.map((st, idx) => {
                  const isCurrent = order.currentStageId === st.id;
                  const isCompleted = st.status === 'completed';

                  return (
                    <div
                      key={st.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                          : isCompleted
                          ? 'bg-slate-50/80 border-slate-200'
                          : 'bg-white border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                              isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-indigo-600 text-white animate-pulse'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isCompleted ? '✓' : idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{st.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{st.percentage}%</span>
                      </div>

                      {st.notes && <p className="text-[11px] text-slate-600 mt-1">{st.notes}</p>}
                      {st.completedAt && (
                        <p className="text-[10px] text-emerald-700 mt-1">Selesai: {formatDateTimeID(st.completedAt)}</p>
                      )}

                      {/* Advance Stage button for Produksi / Admin */}
                      {(currentUser.role === 'admin' || currentUser.role === 'produksi') && !isCompleted && (
                        <button
                          onClick={() => {
                            const note = prompt('Catatan pengerjaan tahap ini:', st.notes || '');
                            advanceProductionStage(order.id, st.id, note || undefined);
                          }}
                          className={`mt-2 w-full py-1 text-[11px] font-bold rounded-lg transition-colors ${
                            isCurrent
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-slate-200 text-slate-700 hover:bg-indigo-100 hover:text-indigo-800'
                          }`}
                        >
                          {isCurrent ? 'Update Catatan Tahap' : `Tandai Aktif`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gallery of Uploaded Progress Photos */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900">Galeri Foto Progress Produksi</h4>
                <span className="text-xs text-slate-500">{order.productionPhotos.length} foto diunggah</span>
              </div>

              {order.productionPhotos.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-500 font-medium">Belum ada foto progress yang diunggah.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {order.productionPhotos.map(photo => (
                    <div
                      key={photo.id}
                      className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden group hover:border-indigo-400 transition-all"
                    >
                      <div
                        onClick={() =>
                          setActiveModalImage({
                            url: photo.photoUrl,
                            title: photo.stageName,
                            subtitle: `${photo.caption} • ${formatDateTimeID(photo.uploadedAt)}`,
                          })
                        }
                        className="cursor-pointer aspect-4/3 bg-slate-200 overflow-hidden flex items-center justify-center"
                      >
                        <img
                          src={photo.photoUrl}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {photo.stageName}
                        </span>
                        <p className="text-xs font-semibold text-slate-800 mt-1">{photo.caption}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDateTimeID(photo.uploadedAt)} • oleh {photo.uploadedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: INVOICE & PEMBAYARAN */}
        {/* ======================================================== */}
        {activeTab === 'invoice' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tagihan Invoice & Riwayat Pembayaran</h3>
                <p className="text-xs text-slate-500">
                  Nomor Invoice: <strong className="font-mono text-indigo-600">{order.invoice.invoiceNumber}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canManualEditInvoice(currentUser.role) && (
                  <button
                    onClick={() => setShowEditInvoiceModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl shadow-xs transition-all"
                  >
                    <FileEdit className="w-4 h-4 text-amber-600" />
                    <span>Perbaiki Manual Invoice</span>
                  </button>
                )}

                <button
                  onClick={() => setShowAddPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Bukti Pembayaran</span>
                </button>

                <button
                  onClick={() => onNavigate(`invoice-detail-${order.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Invoice</span>
                </button>
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Subtotal ({order.quantity} pcs)</span>
                <p className="text-sm font-bold text-slate-900 mt-1">{formatRupiah(order.subtotal)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Diskon & Ongkir</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  -{formatRupiah(order.discount)} / +{formatRupiah(order.shippingCost)}
                </p>
              </div>
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200">
                <span className="text-xs text-indigo-800 font-semibold">Total Tagihan</span>
                <p className="text-base font-extrabold text-indigo-900 mt-1">{formatRupiah(order.totalAmount)}</p>
              </div>
              <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200">
                <span className="text-xs text-rose-800 font-semibold">Sisa Pelunasan</span>
                <p className="text-base font-extrabold text-rose-700 mt-1">{formatRupiah(order.remainingBalance)}</p>
              </div>
            </div>

            {/* Payment Transactions Table */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3">Catatan Transaksi Pembayaran</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">No. Transaksi</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Metode</th>
                      <th className="py-3 px-4">Nominal</th>
                      <th className="py-3 px-4">Bukti Slip</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Verifikasi Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          Belum ada pembayaran yang dicatat.
                        </td>
                      </tr>
                    ) : (
                      order.payments.map(pay => (
                        <tr key={pay.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{pay.paymentNumber}</td>
                          <td className="py-3 px-4">{formatDateTimeID(pay.date)}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{pay.method}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900">{formatRupiah(pay.amount)}</td>
                          <td className="py-3 px-4">
                            {pay.proofUrl ? (
                              <button
                                onClick={() =>
                                  setActiveModalImage({
                                    url: pay.proofUrl!,
                                    title: `Bukti Pembayaran ${pay.paymentNumber}`,
                                    subtitle: `Nominal: ${formatRupiah(pay.amount)}`,
                                  })
                                }
                                className="text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat Slip</span>
                              </button>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <PaymentStatusBadge status={pay.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            {pay.status === 'Menunggu Verifikasi' && (
                              canVerifyPayment(currentUser.role) ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => verifyPayment(order.id, pay.id, true)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px]"
                                  >
                                    Verifikasi ACC
                                  </button>
                                  <button
                                    onClick={() => verifyPayment(order.id, pay.id, false)}
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
                            )}
                            {pay.status === 'Terverifikasi' && (
                              <span className="text-[11px] text-emerald-700 font-semibold">
                                ✓ Diverifikasi ({pay.verifiedBy || 'Admin'})
                              </span>
                            )}
                            {pay.status === 'Ditolak' && (
                              <span className="text-[11px] text-rose-700 font-semibold">
                                ✗ Ditolak
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: PENGIRIMAN (LOGISTIK & RESI) */}
        {/* ======================================================== */}
        {activeTab === 'shipment' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Informasi Ekspedisi & Pengiriman</h3>
                <p className="text-xs text-slate-500">
                  Status penyerahan barang jadi ke kurir / ekspedisi untuk dikirimkan ke alamat client.
                </p>
              </div>

              {(currentUser.role === 'admin' || currentUser.role === 'produksi' || currentUser.role === 'marketing') && (
                <button
                  onClick={() => {
                    setTrackingNumber(order.shipment?.trackingNumber || '');
                    setCourierName(order.shipment?.courier || 'JNE Express (Reguler)');
                    setShowShipmentModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  <Truck className="w-4 h-4" />
                  <span>Update Nomor Resi</span>
                </button>
              )}
            </div>

            {order.shipment ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Kurir / Ekspedisi:</span>
                    <span className="text-sm font-bold text-slate-900">{order.shipment.courier}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nomor Resi:</span>
                    <span className="text-sm font-mono font-black text-indigo-700">
                      {order.shipment.trackingNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tanggal Dikirim:</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatDateTimeID(order.shipment.shippedAt)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-500 block">Alamat Tujuan Client:</span>
                  <span className="font-semibold text-slate-800">{order.clientAddress}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-600">
                    Status: <strong className="text-indigo-600">{order.shipment.status}</strong>
                  </span>
                  <a
                    href={generateWhatsAppUrl(order, 'shipping')}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Kirim Resi via WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <Truck className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-600 font-semibold">Pesanan belum masuk tahap pengiriman.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Informasi kurir dan resi akan diisi setelah workshop menyelesaikan packing (Tahap 11).
                </p>
              </div>
            )}
            {/* QR Code Tracking Card for Shipping / Dispatch */}
            <div className="pt-2">
              <OrderTrackingQR
                order={order}
                size={100}
                variant="standard"
                showActions={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* High-Res Image Modal for Gambar 1 & Gambar 2 */}
      {activeModalImage && (
        <ImageModal
          isOpen={true}
          onClose={() => setActiveModalImage(null)}
          imageUrl={activeModalImage.url}
          title={activeModalImage.title}
          subtitle={activeModalImage.subtitle}
        />
      )}

      {/* Upload New Design Version Modal */}
      {showNewVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Upload Desain Versi {order.currentDesignVersion + 1}
              </h3>
              <button onClick={() => setShowNewVersionModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadNewDesign} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL / File GAMBAR 1</label>
                <input
                  type="text"
                  value={newVersionImage1}
                  onChange={e => setNewVersionImage1(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL / File GAMBAR 2</label>
                <input
                  type="text"
                  value={newVersionImage2}
                  onChange={e => setNewVersionImage2(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Perubahan Versi Baru</label>
                <textarea
                  value={newVersionNotes}
                  onChange={e => setNewVersionNotes(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Perbaikan warna lis kerah dan resolusi logo sponsor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewVersionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  Simpan Versi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Permintaan Revisi Desain</h3>
              <button onClick={() => setShowRevisionModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-4 mt-4 text-xs">
              <p className="text-slate-600">
                Jelaskan bagian mana pada <strong>GAMBAR 1</strong> atau <strong>GAMBAR 2</strong> yang perlu diperbaiki oleh desainer:
              </p>

              <textarea
                value={revisionNotes}
                onChange={e => setRevisionNotes(e.target.value)}
                rows={3}
                placeholder="Contoh: Tolong ganti warna font nomor punggung menjadi putih dan perbesar logo dada kiri..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl"
                >
                  Kirim Catatan Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Production Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Upload Foto Progress Produksi</h3>
              <button onClick={() => setShowPhotoModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhotoSubmit} className="space-y-3 mt-4 text-xs">
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
                <label className="block font-semibold text-slate-700 mb-1">Foto Progress URL / Kamera *</label>
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
                  placeholder="Contoh: 48 pcs sedang dalam proses jahit rib kerah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  Upload Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Catat Pembayaran Masuk</h3>
              <button onClick={() => setShowAddPaymentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Pembayaran (Rp) *</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={paymentAmount || ''}
                  onChange={e => setPaymentAmount(parseInt(e.target.value, 10) || 0)}
                  placeholder={`Sisa tagihan: ${order.remainingBalance}`}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Transfer Bank">Transfer Bank (BCA / Mandiri)</option>
                  <option value="QRIS">QRIS Standar</option>
                  <option value="Cash">Cash / Tunai Workshop</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL Bukti Transfer / Slip</label>
                <input
                  type="text"
                  value={paymentProofUrl}
                  onChange={e => setPaymentProofUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Contoh: Transfer pelunasan 100% via rekening BCA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipment Resi Modal */}
      {showShipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Update Pengiriman & Nomor Resi</h3>
              <button onClick={() => setShowShipmentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleShipmentSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ekspedisi / Kurir *</label>
                <input
                  type="text"
                  value={courierName}
                  onChange={e => setCourierName(e.target.value)}
                  placeholder="Contoh: JNE Trucking / J&T Cargo / Lalamove"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Resi Pelacakan *</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="JNE8899202608..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimasi Tiba di Lokasi</label>
                <input
                  type="date"
                  value={estimatedArrival}
                  onChange={e => setEstimatedArrival(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowShipmentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  Simpan & Kirim Notif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Manual Edit Modals */}
      {showEditInvoiceModal && (
        <ManualEditInvoiceModal
          isOpen={showEditInvoiceModal}
          onClose={() => setShowEditInvoiceModal(false)}
          order={order}
        />
      )}

      {showEditSPKModal && (
        <ManualEditSPKModal
          isOpen={showEditSPKModal}
          onClose={() => setShowEditSPKModal(false)}
          order={order}
        />
      )}

      {/* Upload File to Drive Modal */}
      {showDriveModal && (
        <UploadToDriveModal
          isOpen={showDriveModal}
          onClose={() => setShowDriveModal(false)}
          defaultCategory={driveCategory}
          defaultOrder={order}
        />
      )}
    </div>
  );
};
