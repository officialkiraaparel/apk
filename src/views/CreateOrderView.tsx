import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  FileImage,
  FileText,
  Image as ImageIcon,
  Info,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CollarModel, ProductType, SizeDetail, SleeveBreakdown, SleeveModel } from '../types';
import {
  COLLAR_OPTIONS,
  DEFAULT_SIZES,
  FABRIC_OPTIONS,
  PRODUCT_OPTIONS,
  SLEEVE_OPTIONS,
} from '../utils/constants';
import {
  calculateTotalSizes,
  formatRupiah,
  generateOrderNumber,
} from '../utils/formatters';

const DEFAULT_SAMPLE_IMG_1 = 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80';
const DEFAULT_SAMPLE_IMG_2 = 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80';

const MATRIX_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'] as const;

export const CreateOrderView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { clients, createOrder, currentUser, settings, orders } = useApp();

  // Client Selection
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const [clientName, setClientName] = useState(selectedClient?.name || '');
  const [clientCompany, setClientCompany] = useState(selectedClient?.company || '');
  const [clientPhone, setClientPhone] = useState(selectedClient?.phone || '');
  const [clientAddress, setClientAddress] = useState(selectedClient?.address || '');

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDeadline = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const [orderDate, setOrderDate] = useState(todayStr);
  const [deadline, setDeadline] = useState(defaultDeadline);

  // Detail Order Specific Fields (KIRA Official Format)
  const [poNumber, setPoNumber] = useState('');
  const [orderTitle, setOrderTitle] = useState(selectedClient?.company || 'KONDA KALTENG');
  const [fabricDetail, setFabricDetail] = useState('MILANO');
  const [necktape, setNecktape] = useState('KIRA');
  const [sizeLabel, setSizeLabel] = useState('KIRA');
  const [logoRightChest, setLogoRightChest] = useState('PRINTING');
  const [logoLeftChest, setLogoLeftChest] = useState('PRINTING');
  const [backText, setBackText] = useState('PRINTING');
  const [fontRef, setFontRef] = useState('INTRO RUST');
  const [stitchingNotes, setStitchingNotes] = useState('- KAM 3 JARUM\n- KERAH O-NECT');

  // Product Spec
  const [productType, setProductType] = useState<ProductType>('Kaos Jersey');
  const [quantity, setQuantity] = useState<number>(24);
  const [collarModel, setCollarModel] = useState<CollarModel>('O-Neck');
  const [sleeveModel, setSleeveModel] = useState<SleeveModel>('Panjang');
  const [fabric, setFabric] = useState<string>('Dryfit Milano Premium (160 gsm)');
  const [colorNotes, setColorNotes] = useState('Warna dasar Biru Muda (#a9d5f7) & Putih (#ffffff)');
  const [notes, setNotes] = useState('PINKONDA JAMNAS XII 2026 KALIMANTAN TENGAH');
  const [productionNotes, setProductionNotes] = useState('- KAM 3 JARUM\n- KERAH O-NECT');

  // Size Details Matrix by Sleeve Type (matching KIRA Detail Order Sheet)
  const [sleeveBreakdown, setSleeveBreakdown] = useState<SleeveBreakdown>({
    shortSleeve: {},
    longSleeve: { S: 4, M: 4, L: 9, XL: 7 },
    kids: {},
  });

  // Images strictly labeled GAMBAR 1 and GAMBAR 2
  const [image1, setImage1] = useState<string>(DEFAULT_SAMPLE_IMG_1);
  const [image2, setImage2] = useState<string>(DEFAULT_SAMPLE_IMG_2);

  // Pricing
  const [unitPrice, setUnitPrice] = useState<number>(150000);
  const [discount, setDiscount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(1800000);

  // Matrix calculation helpers
  const sumSleeveRow = (rowObj: { [size: string]: number } = {}) => {
    return MATRIX_SIZES.reduce((sum, sz) => sum + (rowObj[sz] || 0), 0);
  };

  const shortTotal = sumSleeveRow(sleeveBreakdown.shortSleeve);
  const longTotal = sumSleeveRow(sleeveBreakdown.longSleeve);
  const kidsTotal = sumSleeveRow(sleeveBreakdown.kids);
  const totalMatrixSizes = shortTotal + longTotal + kidsTotal;

  // Derive consolidated SizeDetail
  const consolidatedSizes: SizeDetail = {
    XS: (sleeveBreakdown.shortSleeve?.XS || 0) + (sleeveBreakdown.longSleeve?.XS || 0) + (sleeveBreakdown.kids?.XS || 0),
    S: (sleeveBreakdown.shortSleeve?.S || 0) + (sleeveBreakdown.longSleeve?.S || 0) + (sleeveBreakdown.kids?.S || 0),
    M: (sleeveBreakdown.shortSleeve?.M || 0) + (sleeveBreakdown.longSleeve?.M || 0) + (sleeveBreakdown.kids?.M || 0),
    L: (sleeveBreakdown.shortSleeve?.L || 0) + (sleeveBreakdown.longSleeve?.L || 0) + (sleeveBreakdown.kids?.L || 0),
    XL: (sleeveBreakdown.shortSleeve?.XL || 0) + (sleeveBreakdown.longSleeve?.XL || 0) + (sleeveBreakdown.kids?.XL || 0),
    '2XL': (sleeveBreakdown.shortSleeve?.['2XL'] || 0) + (sleeveBreakdown.longSleeve?.['2XL'] || 0) + (sleeveBreakdown.kids?.['2XL'] || 0),
    XXL: (sleeveBreakdown.shortSleeve?.['2XL'] || 0) + (sleeveBreakdown.longSleeve?.['2XL'] || 0) + (sleeveBreakdown.kids?.['2XL'] || 0),
    '3XL': (sleeveBreakdown.shortSleeve?.['3XL'] || 0) + (sleeveBreakdown.longSleeve?.['3XL'] || 0) + (sleeveBreakdown.kids?.['3XL'] || 0),
    '4XL': (sleeveBreakdown.shortSleeve?.['4XL'] || 0) + (sleeveBreakdown.longSleeve?.['4XL'] || 0) + (sleeveBreakdown.kids?.['4XL'] || 0),
    '5XL': (sleeveBreakdown.shortSleeve?.['5XL'] || 0) + (sleeveBreakdown.longSleeve?.['5XL'] || 0) + (sleeveBreakdown.kids?.['5XL'] || 0),
    '6XL': (sleeveBreakdown.shortSleeve?.['6XL'] || 0) + (sleeveBreakdown.longSleeve?.['6XL'] || 0) + (sleeveBreakdown.kids?.['6XL'] || 0),
  };

  // Auto Calculations
  const subtotal = quantity * unitPrice;
  const totalAmount = Math.max(0, subtotal - discount + shippingCost);
  const remainingBalance = Math.max(0, totalAmount - downPayment);
  const isSizeMatching = totalMatrixSizes === quantity;

  // Handle client picker change
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const cl = clients.find(c => c.id === clientId);
    if (cl) {
      setClientName(cl.name);
      setClientCompany(cl.company);
      setClientPhone(cl.phone);
      setClientAddress(cl.address);
      if (cl.company) setOrderTitle(cl.company);
    }
  };

  const handleMatrixChange = (
    row: 'shortSleeve' | 'longSleeve' | 'kids',
    size: string,
    val: string
  ) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setSleeveBreakdown(prev => ({
      ...prev,
      [row]: {
        ...prev[row],
        [size]: num,
      },
    }));
  };

  const syncQuantityFromMatrix = () => {
    setQuantity(totalMatrixSizes);
  };

  // Image Upload helper using FileReader for local images
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'image1' | 'image2') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          if (target === 'image1') setImage1(event.target.result as string);
          if (target === 'image2') setImage2(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSizeMatching && totalMatrixSizes > 0) {
      if (
        !window.confirm(
          `Peringatan: Total rincian ukuran (${totalMatrixSizes} pcs) belum sama dengan jumlah pesanan (${quantity} pcs). Apakah Anda ingin menyesuaikan jumlah pesanan menjadi ${totalMatrixSizes} pcs?`
        )
      ) {
        return;
      }
      setQuantity(totalMatrixSizes);
    }

    const effectiveQty = totalMatrixSizes > 0 ? totalMatrixSizes : quantity;
    const effectiveSubtotal = effectiveQty * unitPrice;
    const effectiveTotal = Math.max(0, effectiveSubtotal - discount + shippingCost);
    const effectiveRemaining = Math.max(0, effectiveTotal - downPayment);

    const newOrder = createOrder({
      clientId: selectedClientId,
      clientName,
      clientCompany,
      clientPhone,
      clientAddress,
      orderDate,
      deadline,
      productType,
      quantity: effectiveQty,
      sizeDetails: consolidatedSizes,
      sleeveBreakdown,
      collarModel,
      sleeveModel,
      fabric,
      colorNotes,
      notes,
      productionNotes,
      poNumber,
      orderTitle,
      fabricDetail,
      necktape,
      sizeLabel,
      logoRightChest,
      logoLeftChest,
      backText,
      fontRef,
      stitchingNotes,
      unitPrice,
      subtotal: effectiveSubtotal,
      discount,
      shippingCost,
      totalAmount: effectiveTotal,
      downPayment,
      remainingBalance: effectiveRemaining,
      image1,
      image2,
    });

    onNavigate(`order-detail-${newOrder.id}`);
  };

  return (
    <div id="create-order-view" className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#c8b320] text-black shadow-xs">
              Format Pemesanan Kaos KIRA
            </span>
            <span className="text-xs text-slate-500">Detail Order & SPK Workshop</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit',sans-serif] mt-1">
            Buat Pesanan & Terbitkan Detail Order
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuai format resmi: Spesifikasi Lengkap, Matriks Rincian Ukuran (Lengan Pendek/Panjang/Anak), Gambar 1 & 2, serta Catatan Jahit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan & Buat Detail Order</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: INFORMASI CLIENT & JADWAL */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">Informasi Client & Jadwal Produksi</h3>
            </div>
            <span className="text-xs text-slate-500">Marketing: <strong className="text-slate-800">{currentUser.name}</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Client Picker */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Client Terdaftar</label>
              <select
                value={selectedClientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-medium"
              >
                {clients.map(cl => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} ({cl.company})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Client *</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Perusahaan / Komunitas (Customer) *</label>
              <input
                type="text"
                value={clientCompany}
                onChange={e => {
                  setClientCompany(e.target.value);
                  setOrderTitle(e.target.value);
                }}
                placeholder="Contoh: KWARDA KALTENG"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp *</label>
              <input
                type="text"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Order</label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline Selesai (Target Workshop) *</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2.5 bg-amber-50/70 border border-amber-300 rounded-xl text-xs text-rose-700 font-black focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Pengiriman</label>
              <input
                type="text"
                value={clientAddress}
                onChange={e => setClientAddress(e.target.value)}
                placeholder="Contoh: CIBUBUR - JKT"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: FORMAT DETAIL ORDER RESMI (KIRA APPAREL) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-slate-300 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#c8b320] text-black flex items-center justify-center font-black text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">Spesifikasi Detail Order (KIRA APPAREL)</h3>
                <p className="text-xs text-slate-500">Header & parameter resmi untuk Detail Order Sheet</p>
              </div>
            </div>
            <span className="text-xs font-black text-black bg-[#c8b320] px-3 py-1 rounded-full shadow-2xs">
              FORMAT RESMI KIRA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">JUDUL ORDER *</label>
              <input
                type="text"
                value={orderTitle}
                onChange={e => setOrderTitle(e.target.value)}
                placeholder="Contoh: KONDA KALTENG"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-black uppercase focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NOMOR PO (Jika Ada)</label>
              <input
                type="text"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                placeholder="Nomor PO..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono uppercase focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">BAHAN KAIN (Utama) *</label>
              <input
                type="text"
                value={fabricDetail}
                onChange={e => {
                  setFabricDetail(e.target.value);
                  setFabric(e.target.value);
                }}
                placeholder="Contoh: MILANO"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-black uppercase focus:outline-hidden focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NECKTAPE</label>
              <input
                type="text"
                value={necktape}
                onChange={e => setNecktape(e.target.value)}
                placeholder="KIRA"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 uppercase font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SIZE LABEL</label>
              <input
                type="text"
                value={sizeLabel}
                onChange={e => setSizeLabel(e.target.value)}
                placeholder="KIRA"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 uppercase font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">FONT REFERENSI</label>
              <input
                type="text"
                value={fontRef}
                onChange={e => setFontRef(e.target.value)}
                placeholder="INTRO RUST"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-rose-800 uppercase font-black focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LOGO DADA KANAN</label>
              <input
                type="text"
                value={logoRightChest}
                onChange={e => setLogoRightChest(e.target.value)}
                placeholder="PRINTING"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 uppercase font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LOGO DADA KIRI</label>
              <input
                type="text"
                value={logoLeftChest}
                onChange={e => setLogoLeftChest(e.target.value)}
                placeholder="PRINTING"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 uppercase font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">TULISAN PUNGGUNG</label>
              <input
                type="text"
                value={backText}
                onChange={e => setBackText(e.target.value)}
                placeholder="PRINTING"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 uppercase font-semibold focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">CATATAN KHUSUS JAHIT / WORKSHOP</label>
              <textarea
                rows={2}
                value={stitchingNotes}
                onChange={e => {
                  setStitchingNotes(e.target.value);
                  setProductionNotes(e.target.value);
                }}
                placeholder="- KAM 3 JARUM&#10;- KERAH O-NECT"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: TABEL MATRIKS RINCIAN UKURAN (LENGAN PENDEK, PANJANG, ANAK) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tabel Rincian Ukuran & Jenis Lengan</h3>
                <p className="text-xs text-slate-500">
                  Matriks breakdown ukuran Lengan Pendek, Lengan Panjang, dan Anak (XS s/d 6XL).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  isSizeMatching
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <span>Total Matriks: {totalMatrixSizes} pcs</span>
                <span>/</span>
                <span>Target: {quantity} pcs</span>
              </div>
              <button
                type="button"
                onClick={syncQuantityFromMatrix}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors"
                title="Sesuaikan jumlah total dengan hasil hitung tabel"
              >
                Samakan Total ({totalMatrixSizes} pcs)
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-300">
            <table className="w-full text-center text-xs font-sans">
              <thead>
                <tr className="bg-[#c8b320] text-black font-black uppercase text-[11px]">
                  <th className="py-2.5 px-3 text-left w-[160px] border-r border-slate-300">NAMA UKURAN</th>
                  {MATRIX_SIZES.map(sz => (
                    <th key={sz} className="py-2.5 px-1 min-w-[42px] border-r border-slate-300">
                      {sz}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 bg-[#bca31a]">JUMLAH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-bold text-slate-900">
                {/* Row 1: LENGAN PENDEK */}
                <tr>
                  <td className="py-2 px-3 text-left font-black border-r border-slate-200 bg-slate-50">
                    LENGAN PENDEK
                  </td>
                  {MATRIX_SIZES.map(sz => (
                    <td key={sz} className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        min="0"
                        value={sleeveBreakdown.shortSleeve?.[sz] || ''}
                        onChange={e => handleMatrixChange('shortSleeve', sz, e.target.value)}
                        placeholder="-"
                        className="w-full text-center py-1 bg-white border border-slate-200 rounded text-xs font-bold focus:bg-amber-50 focus:border-amber-400"
                      />
                    </td>
                  ))}
                  <td className="py-2 px-3 font-black bg-slate-100 text-slate-800">
                    {shortTotal > 0 ? shortTotal : '-'}
                  </td>
                </tr>

                {/* Row 2: LENGAN PANJANG */}
                <tr>
                  <td className="py-2 px-3 text-left font-black border-r border-slate-200 bg-slate-50">
                    LENGAN PANJANG
                  </td>
                  {MATRIX_SIZES.map(sz => (
                    <td key={sz} className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        min="0"
                        value={sleeveBreakdown.longSleeve?.[sz] || ''}
                        onChange={e => handleMatrixChange('longSleeve', sz, e.target.value)}
                        placeholder="-"
                        className="w-full text-center py-1 bg-white border border-slate-200 rounded text-xs font-bold focus:bg-amber-50 focus:border-amber-400"
                      />
                    </td>
                  ))}
                  <td className="py-2 px-3 font-black bg-slate-100 text-slate-800">
                    {longTotal > 0 ? longTotal : '-'}
                  </td>
                </tr>

                {/* Row 3: ANAK */}
                <tr>
                  <td className="py-2 px-3 text-left font-black border-r border-slate-200 bg-slate-50">
                    ANAK
                  </td>
                  {MATRIX_SIZES.map(sz => (
                    <td key={sz} className="p-1 border-r border-slate-200">
                      <input
                        type="number"
                        min="0"
                        value={sleeveBreakdown.kids?.[sz] || ''}
                        onChange={e => handleMatrixChange('kids', sz, e.target.value)}
                        placeholder="-"
                        className="w-full text-center py-1 bg-white border border-slate-200 rounded text-xs font-bold focus:bg-amber-50 focus:border-amber-400"
                      />
                    </td>
                  ))}
                  <td className="py-2 px-3 font-black bg-slate-100 text-slate-800">
                    {kidsTotal > 0 ? kidsTotal : '-'}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-black text-[#c8b320] font-black uppercase text-xs">
                  <td colSpan={11} className="py-2 px-4 text-right tracking-wider">
                    TOTAL
                  </td>
                  <td className="py-2 px-3 text-center text-[#ffe500] text-sm font-black border-l border-slate-800">
                    {totalMatrixSizes}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION 4: GAMBAR REFERENSI PESANAN (GAMBAR 1 & GAMBAR 2) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Referensi Gambar Pesanan (GAMBAR 1 & GAMBAR 2)</h3>
                <p className="text-xs text-slate-500">
                  Unggah visual <strong>GAMBAR 1 (Tampak Depan)</strong> dan <strong>GAMBAR 2 (Tampak Belakang)</strong> untuk lembar detail order.
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-500">Mendukung format JPG, PNG, WebP</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* GAMBAR 1 */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3 transition-colors">
              <div className="w-full flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase">GAMBAR 1 (Tampak Depan)</span>
                <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                  Visual Depan
                </span>
              </div>

              <div className="aspect-4/3 w-full max-h-56 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2 shadow-xs">
                <img
                  src={image1}
                  alt="GAMBAR 1"
                  className="max-h-full w-auto object-contain rounded-md"
                />
              </div>

              <div className="w-full space-y-2">
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Pilih File Dari Komputer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'image1')}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  value={image1}
                  onChange={e => setImage1(e.target.value)}
                  placeholder="Atau tempel URL gambar..."
                  className="w-full px-3 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
                />
              </div>
            </div>

            {/* GAMBAR 2 */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3 transition-colors">
              <div className="w-full flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase">GAMBAR 2 (Tampak Belakang)</span>
                <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                  Visual Belakang
                </span>
              </div>

              <div className="aspect-4/3 w-full max-h-56 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2 shadow-xs">
                <img
                  src={image2}
                  alt="GAMBAR 2"
                  className="max-h-full w-auto object-contain rounded-md"
                />
              </div>

              <div className="w-full space-y-2">
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Pilih File Dari Komputer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'image2')}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  value={image2}
                  onChange={e => setImage2(e.target.value)}
                  placeholder="Atau tempel URL gambar..."
                  className="w-full px-3 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: KALKULASI HARGA & PEMBAYARAN */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                5
              </div>
              <h3 className="text-sm font-bold text-slate-900">Kalkulasi Biaya & DP</h3>
            </div>
            <span className="text-xs text-slate-500">Otomatis Terbit Invoice & Kuitansi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Satuan (Rp/pcs) *</label>
              <input
                type="number"
                min="0"
                step="500"
                value={unitPrice}
                onChange={e => setUnitPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Potongan / Diskon (Rp)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={discount}
                onChange={e => setDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ongkos Kirim (Rp)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={shippingCost}
                onChange={e => setShippingCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1">Uang Muka / DP Dibayar (Rp)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={downPayment}
                onChange={e => setDownPayment(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-black focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Pricing Summary Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs flex-wrap">
              <div>
                <span className="text-slate-400 block text-[10px]">Subtotal:</span>
                <span className="font-bold">{formatRupiah(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Diskon:</span>
                  <span className="font-bold text-amber-400">-{formatRupiah(discount)}</span>
                </div>
              )}
              {shippingCost > 0 && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Ongkir:</span>
                  <span className="font-bold">+{formatRupiah(shippingCost)}</span>
                </div>
              )}
              <div className="pl-4 border-l border-slate-700">
                <span className="text-slate-400 block text-[10px]">TOTAL TAGIHAN:</span>
                <span className="text-base font-extrabold text-indigo-300">{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">SISA PELUNASAN:</span>
              <span className="text-lg font-black text-emerald-400">{formatRupiah(remainingBalance)}</span>
            </div>
          </div>
        </div>

        {/* Submit Bottom Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan Order & Terbitkan Detail Order</span>
          </button>
        </div>
      </form>
    </div>
  );
};
