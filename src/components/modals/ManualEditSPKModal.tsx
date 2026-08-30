import React, { useState } from 'react';
import {
  AlertCircle,
  FileCheck2,
  FileEdit,
  Image as ImageIcon,
  Info,
  Layers,
  Save,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { CollarModel, Order, ProductType, SizeDetail, SleeveBreakdown, SleeveModel } from '../../types';
import { useApp } from '../../context/AppContext';
import { COLLAR_OPTIONS, DEFAULT_SIZES, FABRIC_OPTIONS, PRODUCT_OPTIONS, SLEEVE_OPTIONS } from '../../utils/constants';

interface ManualEditSPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const ManualEditSPKModal: React.FC<ManualEditSPKModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const { updateOrder, currentUser } = useApp();

  const [spkNumber, setSpkNumber] = useState(order.spkNumber || `SPK-${order.orderNumber}`);
  const [poNumber, setPoNumber] = useState(order.poNumber || '');
  const [orderTitle, setOrderTitle] = useState(order.orderTitle || order.clientCompany || '');
  const [deadline, setDeadline] = useState(order.deadline || '');
  const [productType, setProductType] = useState<ProductType>(order.productType || 'Kaos Jersey');
  const [fabric, setFabric] = useState<string>(order.fabric || 'Dryfit Milano Premium (160 gsm)');
  const [fabricDetail, setFabricDetail] = useState<string>(order.fabricDetail || order.fabric || 'MILANO');
  const [collarModel, setCollarModel] = useState<CollarModel>(order.collarModel || 'O-Neck');
  const [sleeveModel, setSleeveModel] = useState<SleeveModel>(order.sleeveModel || 'Pendek');
  const [colorNotes, setColorNotes] = useState<string>(order.colorNotes || '');
  const [stitchingNotes, setStitchingNotes] = useState<string>(order.stitchingNotes || '- KAM 3 JARUM\n- KERAH O-NECT');
  const [necktape, setNecktape] = useState<string>(order.necktape || 'KIRA');
  const [sizeLabel, setSizeLabel] = useState<string>(order.sizeLabel || 'KIRA');
  const [logoRightChest, setLogoRightChest] = useState<string>(order.logoRightChest || 'PRINTING');
  const [logoLeftChest, setLogoLeftChest] = useState<string>(order.logoLeftChest || 'PRINTING');
  const [backText, setBackText] = useState<string>(order.backText || 'PRINTING');
  const [fontRef, setFontRef] = useState<string>(order.fontRef || 'INTRO RUST');
  const [productionNotes, setProductionNotes] = useState<string>(order.productionNotes || '');
  const [image1, setImage1] = useState<string>(order.image1 || '');
  const [image2, setImage2] = useState<string>(order.image2 || '');
  const [correctionReason, setCorrectionReason] = useState<string>('Perbaikan manual spesifikasi SPK workshop.');

  // Size matrix
  const [sizeDetails, setSizeDetails] = useState<SizeDetail>(() => {
    return {
      XS: order.sizeDetails?.XS || 0,
      S: order.sizeDetails?.S || 0,
      M: order.sizeDetails?.M || 0,
      L: order.sizeDetails?.L || 0,
      XL: order.sizeDetails?.XL || 0,
      XXL: order.sizeDetails?.XXL || order.sizeDetails?.['2XL'] || 0,
      '3XL': order.sizeDetails?.['3XL'] || 0,
      '4XL': order.sizeDetails?.['4XL'] || 0,
      '5XL': order.sizeDetails?.['5XL'] || 0,
    };
  });

  if (!isOpen) return null;

  const totalQuantity: number = Object.values(sizeDetails).reduce<number>((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);

  const handleSizeChange = (sizeKey: string, val: number) => {
    setSizeDetails(prev => ({
      ...prev,
      [sizeKey]: Math.max(0, val),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSleeveBreakdown: SleeveBreakdown = {
      shortSleeve: sleeveModel === 'Pendek' ? sizeDetails : {},
      longSleeve: sleeveModel === 'Panjang' ? sizeDetails : {},
      kids: order.sleeveBreakdown?.kids || {},
    };

    updateOrder(order.id, {
      spkNumber,
      poNumber,
      orderTitle,
      deadline,
      productType,
      fabric,
      fabricDetail,
      collarModel,
      sleeveModel,
      colorNotes,
      stitchingNotes,
      necktape,
      sizeLabel,
      logoRightChest,
      logoLeftChest,
      backText,
      fontRef,
      productionNotes,
      sizeDetails,
      sleeveBreakdown: updatedSleeveBreakdown,
      quantity: Number(totalQuantity) > 0 ? Number(totalQuantity) : order.quantity,
      image1: image1 || order.image1,
      image2: image2 || order.image2,
      notes: order.notes
        ? `${order.notes}\n[Koreksi SPK oleh ${currentUser.name}: ${correctionReason}]`
        : `[Koreksi SPK oleh ${currentUser.name}: ${correctionReason}]`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative max-w-3xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Perbaikan Manual SPK
                </span>
                <span className="text-xs text-slate-400">Order Ref: {order.orderNumber}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Koreksi & Modifikasi Surat Perintah Kerja (SPK)
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
          <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold block">Otoritas Perbaikan Manual SPK (Workshop & Produksi):</span>
              Gunakan formulir ini untuk menyesuaikan instruksi pengerjaan workshop, nomor PO, bahan baku kain, model kerah, matriks rincian potong ukuran, catatan jahit, serta posisi logo sebelum atau saat produksi berjalan.
            </div>
          </div>

          {/* SPK Header & Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor SPK Resmi *</label>
              <input
                type="text"
                value={spkNumber}
                onChange={(e) => setSpkNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">No. PO Pelanggan (Jika ada)</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Contoh: PO-KLT-2026/08"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Deadline Workshop *</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-700"
                required
              />
            </div>
          </div>

          {/* Order Title & Fabric Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Judul SPK / Nama Komunitas / Event *</label>
              <input
                type="text"
                value={orderTitle}
                onChange={(e) => setOrderTitle(e.target.value)}
                placeholder="Contoh: KONDA KALTENG"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Produk</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                {PRODUCT_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fabric & Model */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Bahan Kain & Konstruksi Model</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Bahan Kain Utama</label>
                <select
                  value={fabric}
                  onChange={(e) => {
                    setFabric(e.target.value);
                    setFabricDetail(e.target.value.split(' ')[1] || e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold"
                >
                  {FABRIC_OPTIONS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Label Bahan (Detail SPK)</label>
                <input
                  type="text"
                  value={fabricDetail}
                  onChange={(e) => setFabricDetail(e.target.value)}
                  placeholder="Contoh: MILANO"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Model Kerah</label>
                <select
                  value={collarModel}
                  onChange={(e) => setCollarModel(e.target.value as CollarModel)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                >
                  {COLLAR_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Model Lengan</label>
                <select
                  value={sleeveModel}
                  onChange={(e) => setSleeveModel(e.target.value as SleeveModel)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                >
                  {SLEEVE_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Catatan Warna & Sublim</label>
                <input
                  type="text"
                  value={colorNotes}
                  onChange={(e) => setColorNotes(e.target.value)}
                  placeholder="Contoh: Biru Muda Gradasi Cyan"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Size Breakdown Matrix */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                Matriks Rincian Potong Ukuran (Total: {totalQuantity} pcs)
              </h4>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
              {DEFAULT_SIZES.map(sz => (
                <div key={sz} className="text-center">
                  <span className="block font-bold text-slate-600 text-[10px] mb-1">{sz}</span>
                  <input
                    type="number"
                    min="0"
                    value={sizeDetails[sz] || 0}
                    onChange={(e) => handleSizeChange(sz, Number(e.target.value))}
                    className="w-full py-1 px-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Technical Specs: Logo, Necktape, Font */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Detail Logo, Label, dan Jahitan Konveksi</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Logo Dada Kanan</label>
                <input
                  type="text"
                  value={logoRightChest}
                  onChange={(e) => setLogoRightChest(e.target.value)}
                  placeholder="PRINTING / BORDIR"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl uppercase font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Logo Dada Kiri</label>
                <input
                  type="text"
                  value={logoLeftChest}
                  onChange={(e) => setLogoLeftChest(e.target.value)}
                  placeholder="PRINTING / BORDIR"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl uppercase font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Tulisan / Logo Punggung</label>
                <input
                  type="text"
                  value={backText}
                  onChange={(e) => setBackText(e.target.value)}
                  placeholder="PRINTING"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl uppercase font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Necktape</label>
                <input
                  type="text"
                  value={necktape}
                  onChange={(e) => setNecktape(e.target.value)}
                  placeholder="KIRA"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Size Label</label>
                <input
                  type="text"
                  value={sizeLabel}
                  onChange={(e) => setSizeLabel(e.target.value)}
                  placeholder="KIRA"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Referensi Font</label>
                <input
                  type="text"
                  value={fontRef}
                  onChange={(e) => setFontRef(e.target.value)}
                  placeholder="INTRO RUST"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Instruksi Jahitan Kerah & Mesin</label>
              <textarea
                rows={2}
                value={stitchingNotes}
                onChange={(e) => setStitchingNotes(e.target.value)}
                placeholder="- KAM 3 JARUM&#10;- KERAH O-NECT"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Visual References (Gambar 1 & Gambar 2) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>URL Referensi Visual Desain</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">URL GAMBAR 1 (Tampak Depan/Utama)</label>
                <input
                  type="text"
                  value={image1}
                  onChange={(e) => setImage1(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">URL GAMBAR 2 (Tampak Belakang/Detail)</label>
                <input
                  type="text"
                  value={image2}
                  onChange={(e) => setImage2(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Workshop Guidelines & Reason */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Catatan Khusus Workshop & QC</label>
              <textarea
                rows={2}
                value={productionNotes}
                onChange={(e) => setProductionNotes(e.target.value)}
                placeholder="Pastikan warna sablon tidak bleed, trimming benang bersih, perhatikan akurasi ukuran."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alasan Perbaikan Manual SPK (Audit Log) *</label>
              <input
                type="text"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Contoh: Perubahan ukuran atas permintaan client / Koreksi jenis bahan Milano"
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
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan SPK</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
