import React, { useState } from 'react';
import {
  Download,
  FileEdit,
  FileText,
  Printer,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Order } from '../../types';
import { formatDateID } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { canManualEditSPK } from '../../utils/security';
import { ManualEditSPKModal } from '../modals/ManualEditSPKModal';
import { KIRA_LOGO_URL } from '../../utils/constants';

interface DetailOrderSheetProps {
  order: Order;
  onPrint?: () => void;
  showActions?: boolean;
}

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'] as const;

export const DetailOrderSheet: React.FC<DetailOrderSheetProps> = ({
  order,
  onPrint,
  showActions = true,
}) => {
  const { currentUser, settings } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const canEdit = canManualEditSPK(currentUser?.role || 'client');

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // Derive sleeve breakdown or build from general size details
  const breakdown = order.sleeveBreakdown || {
    shortSleeve: order.sleeveModel === 'Pendek' ? { ...order.sizeDetails } : {},
    longSleeve: order.sleeveModel === 'Panjang' ? { ...order.sizeDetails } : {},
    kids: {},
  };

  // Calculate row subtotals
  const sumRow = (rowObj?: { [key: string]: number | undefined }) => {
    if (!rowObj) return 0;
    return ALL_SIZES.reduce((acc, sz) => {
      const val = rowObj[sz] || (sz === '2XL' ? rowObj['XXL'] : 0) || 0;
      return acc + val;
    }, 0);
  };

  const shortTotal = sumRow(breakdown.shortSleeve);
  const longTotal = sumRow(breakdown.longSleeve);
  const kidsTotal = sumRow(breakdown.kids);
  const grandTotal = shortTotal + longTotal + kidsTotal || order.quantity;

  const displayDeadline = order.deadline
    ? new Date(order.deadline).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).toUpperCase()
    : '11 AGUST 2026';

  const displayOrderDate = order.orderDate
    ? new Date(order.orderDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).toUpperCase()
    : '8 AGUST 2026';

  // Swatches & thumbnails defaults
  const swatches = order.colorSwatches && order.colorSwatches.length > 0
    ? order.colorSwatches
    : [
        { hex: '#a9d5f7', label: '#a9d5f7' },
        { hex: '#ffffff', label: '#ffffff' },
      ];

  const badges = order.badgeThumbnails && order.badgeThumbnails.length > 0
    ? order.badgeThumbnails
    : [
        {
          url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=100&auto=format&fit=crop&q=80',
          label: 'logo kwarda',
        },
        {
          url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100&auto=format&fit=crop&q=80',
          label: 'logo konda',
        },
      ];

  const fontRef = order.fontRef || 'INTRO RUST';
  const orderTitle = order.orderTitle || order.clientCompany || 'KONDA KALTENG';
  const fabricName = order.fabricDetail || (order.fabric.toLowerCase().includes('milano') ? 'MILANO' : order.fabric);
  const necktape = order.necktape || 'KIRA';
  const sizeLabel = order.sizeLabel || 'KIRA';
  const logoRight = order.logoRightChest || 'PRINTING';
  const logoLeft = order.logoLeftChest || 'PRINTING';
  const backText = order.backText || 'PRINTING';

  return (
    <div className="space-y-4">
      {/* Action Bar (Hidden when printing) */}
      {showActions && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c8b320] text-black font-black flex items-center justify-center text-xs">
              KA
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>Format Resmi Detail Order KIRA APPAREL</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8b320]/20 text-[#e6d03b] border border-[#c8b320]/30 font-semibold">
                  Standard Template
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Sesuai format resmi dokumen konveksi KIRA APPAREL (Siap cetak & produksi)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-400/30 text-xs font-bold rounded-xl transition-all"
              >
                <FileEdit className="w-4 h-4 text-blue-400" />
                <span>Perbaiki Manual SPK</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#c8b320] hover:bg-[#b8a018] text-black text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Unduh Format Ini</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Edit SPK Modal */}
      {showEditModal && (
        <ManualEditSPKModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          order={order}
        />
      )}

      {/* ======================================================================= */}
      {/* THE OFFICIAL "DETAIL ORDER" SHEET CANVAS */}
      {/* ======================================================================= */}
      <div
        id="detail-order-canvas"
        className="print-document-canvas bg-white text-black p-4 sm:p-8 rounded-2xl border-2 border-slate-300 shadow-xl max-w-4xl mx-auto font-sans print:border-0 print:shadow-none print:p-0 print:max-w-none print:w-full print:m-0"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        {/* 1. TOP HEADER BANNER (BLACK BACKGROUND + KIRA LOGO + GOLD DETAIL ORDER) */}
        <div className="bg-black text-white px-6 py-3 flex items-center justify-between border-b-2 border-black">
          {/* KIRA APPAREL Brand Block */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src={settings?.logoUrl || KIRA_LOGO_URL}
                alt="Kira Apparel Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = KIRA_LOGO_URL;
                }}
              />
            </div>
            <div className="text-left leading-tight">
              <span className="text-sm font-black tracking-wider text-[#c8b320] block font-['Outfit',sans-serif]">
                {settings?.companyName || 'KIRA APPAREL'}
              </span>
              <span className="text-[9px] font-bold tracking-widest text-slate-300 block uppercase">
                PRODUCTION & WORKSHOP
              </span>
            </div>
          </div>

          {/* DETAIL ORDER Big Title */}
          <div className="text-right">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#c8b320]"
              style={{
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                letterSpacing: '1px',
              }}
            >
              DETAIL ORDER
            </h1>
          </div>
        </div>

        {/* 2. UPPER TWO-COLUMN SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-x-2 border-b-2 border-slate-900 divide-y md:divide-y-0 md:divide-x-2 divide-slate-900">
          {/* ------------------------------------------------------------- */}
          {/* LEFT COLUMN: VISUAL MOCKUP & COLOR SWATCHES & BADGES */}
          {/* ------------------------------------------------------------- */}
          <div className="md:col-span-6 p-4 flex flex-col justify-between space-y-4 bg-white">
            {/* Visual Front & Back Mockup */}
            <div className="flex items-center justify-center min-h-[260px] bg-slate-50/50 p-2 rounded-lg">
              <div className="grid grid-cols-2 gap-2 w-full max-w-[340px] items-center">
                {/* Front View */}
                <div className="text-center">
                  <div className="aspect-3/4 bg-white border border-slate-200 rounded-md overflow-hidden flex items-center justify-center p-1 shadow-xs">
                    <img
                      src={order.image1}
                      alt="Tampak Depan"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase mt-1 block">
                    Tampak Depan
                  </span>
                </div>

                {/* Back View */}
                <div className="text-center">
                  <div className="aspect-3/4 bg-white border border-slate-200 rounded-md overflow-hidden flex items-center justify-center p-1 shadow-xs">
                    <img
                      src={order.image2 || order.image1}
                      alt="Tampak Belakang"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase mt-1 block">
                    Tampak Belakang
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Accessories / Swatches / Badges bar */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Color Swatches */}
                <div className="flex items-center gap-2">
                  {swatches.map((swatch, idx) => (
                    <div
                      key={idx}
                      className="w-9 h-9 rounded-md border-2 border-slate-400 flex items-center justify-center text-[7px] font-mono font-bold text-slate-700 shadow-2xs"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      <span className="bg-white/90 px-0.5 rounded text-[7px] text-slate-900 border border-slate-300">
                        {swatch.label || swatch.hex}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Logos / Badges Thumbnails */}
                <div className="flex items-center gap-2">
                  {badges.map((badge, idx) => (
                    <div key={idx} className="text-center flex flex-col items-center">
                      <div className="w-8 h-8 rounded bg-white border border-slate-300 p-0.5 overflow-hidden flex items-center justify-center">
                        <img
                          src={badge.url}
                          alt={badge.label}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[8px] text-slate-600 font-semibold mt-0.5">
                        {badge.label}
                      </span>
                    </div>
                  ))}

                  {/* Font reference indicator */}
                  <div className="text-center pl-1 border-l border-slate-200">
                    <span className="text-[7px] text-slate-500 block uppercase">font</span>
                    <span className="text-[9px] font-extrabold text-rose-800 tracking-wider">
                      {fontRef}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* RIGHT COLUMN: ORDER DETAILS, SPECS & METADATA */}
          {/* ------------------------------------------------------------- */}
          <div className="md:col-span-6 p-4 flex flex-col justify-between space-y-4 bg-white text-xs">
            {/* Header Metadata with Colon Alignment */}
            <div className="space-y-1.5 font-bold uppercase text-[12px] sm:text-[13px] tracking-wide">
              <div className="grid grid-cols-12 items-center">
                <span className="col-span-5 text-slate-800">NOMOR PO</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-6 text-slate-900 font-extrabold">{order.poNumber || '-'}</span>
              </div>

              <div className="grid grid-cols-12 items-center">
                <span className="col-span-5 text-slate-800">TANGGAL ORDER</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-6 text-slate-900 font-extrabold">{displayOrderDate}</span>
              </div>

              {/* DEADLINE HIGHLIGHTED IN BRIGHT YELLOW BOX */}
              <div className="grid grid-cols-12 items-center bg-[#ffe600] px-2 py-0.5 rounded-xs border border-yellow-400">
                <span className="col-span-5 text-black font-black">DEADLINE</span>
                <span className="col-span-1 text-center text-black font-black">:</span>
                <span className="col-span-6 text-rose-700 font-black text-[13px] sm:text-[14px]">
                  {displayDeadline}
                </span>
              </div>

              <div className="grid grid-cols-12 items-center">
                <span className="col-span-5 text-slate-800">CUSTOMER</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-6 text-slate-900 font-extrabold">
                  {order.clientCompany || order.clientName}
                </span>
              </div>

              <div className="grid grid-cols-12 items-center">
                <span className="col-span-5 text-slate-800">ALAMAT PENGIRIMAN</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-6 text-slate-900 font-extrabold">
                  {order.clientAddress || 'CIBUBUR - JKT'}
                </span>
              </div>
            </div>

            {/* JUDUL BOX */}
            <div className="border-t-2 border-b-2 border-slate-900 py-1.5">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">JUDUL :</span>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-tight">
                {orderTitle}
              </h2>
            </div>

            {/* BAHAN BOX */}
            <div className="border-b-2 border-slate-900 pb-2">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Bahan :</span>
              <h3 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 tracking-tight">
                {fabricName}
              </h3>
            </div>

            {/* TECHNICAL DETAILS SPECIFICATIONS */}
            <div className="space-y-1.5 font-bold uppercase text-[11px] sm:text-[12px]">
              <div className="grid grid-cols-12 items-center">
                <span className="col-span-6 text-slate-800">NECKTAPE</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-5 text-slate-900 font-black">{necktape}</span>
              </div>

              <div className="grid grid-cols-12 items-center">
                <span className="col-span-6 text-slate-800">SIZE</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-5 text-slate-900 font-black">{sizeLabel}</span>
              </div>

              <div className="grid grid-cols-12 items-center">
                <span className="col-span-6 text-slate-800">LOGO DADA KANAN</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-5 text-slate-900 font-black">{logoRight}</span>
              </div>

              <div className="grid grid-cols-12 items-center">
                <span className="col-span-6 text-slate-800">LOGO DADA KIRI</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-5 text-slate-900 font-black">{logoLeft}</span>
              </div>

              <div className="grid grid-cols-12 items-center">
                <span className="col-span-6 text-slate-800">TULISAN PUNGGUNG</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-5 text-slate-900 font-black">{backText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SIZE BREAKDOWN MATRIX TABLE */}
        <div className="border-x-2 border-b-2 border-slate-900 overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs sm:text-sm font-sans">
            <thead>
              {/* OLIVE/GOLD HEADER ROW */}
              <tr className="bg-[#c8b320] text-black font-black uppercase text-[11px] sm:text-xs">
                <th className="border-r border-slate-900 py-2 px-3 text-left w-[180px]">
                  NAMA UKURAN
                </th>
                {ALL_SIZES.map(sz => (
                  <th key={sz} className="border-r border-slate-900 py-2 px-2 min-w-[32px]">
                    {sz}
                  </th>
                ))}
                <th className="py-2 px-3 bg-[#bca31a] text-black font-black">JUMLAH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-bold text-slate-900">
              {/* Row 1: LENGAN PENDEK */}
              <tr className="hover:bg-slate-50">
                <td className="border-r border-slate-900 py-1.5 px-3 text-left font-black">
                  LENGAN PENDEK
                </td>
                {ALL_SIZES.map(sz => {
                  const val = breakdown.shortSleeve?.[sz] || (sz === '2XL' ? breakdown.shortSleeve?.['XXL'] : 0);
                  return (
                    <td key={sz} className="border-r border-slate-900 py-1.5 px-1 font-extrabold">
                      {val && val > 0 ? val : ''}
                    </td>
                  );
                })}
                <td className="py-1.5 px-3 font-black bg-slate-50">
                  {shortTotal > 0 ? shortTotal : ''}
                </td>
              </tr>

              {/* Row 2: LENGAN PANJANG */}
              <tr className="hover:bg-slate-50">
                <td className="border-r border-slate-900 py-1.5 px-3 text-left font-black">
                  LENGAN PANJANG
                </td>
                {ALL_SIZES.map(sz => {
                  const val = breakdown.longSleeve?.[sz] || (sz === '2XL' ? breakdown.longSleeve?.['XXL'] : 0);
                  return (
                    <td key={sz} className="border-r border-slate-900 py-1.5 px-1 font-extrabold">
                      {val && val > 0 ? val : ''}
                    </td>
                  );
                })}
                <td className="py-1.5 px-3 font-black bg-slate-50">
                  {longTotal > 0 ? longTotal : ''}
                </td>
              </tr>

              {/* Row 3: ANAK */}
              <tr className="hover:bg-slate-50">
                <td className="border-r border-slate-900 py-1.5 px-3 text-left font-black">
                  ANAK
                </td>
                {ALL_SIZES.map(sz => {
                  const val = breakdown.kids?.[sz] || (sz === '2XL' ? breakdown.kids?.['XXL'] : 0);
                  return (
                    <td key={sz} className="border-r border-slate-900 py-1.5 px-1 font-extrabold">
                      {val && val > 0 ? val : ''}
                    </td>
                  );
                })}
                <td className="py-1.5 px-3 font-black bg-slate-50">
                  {kidsTotal > 0 ? kidsTotal : ''}
                </td>
              </tr>
            </tbody>
            <tfoot>
              {/* TOTAL ROW (DARK BLACK BAR) */}
              <tr className="bg-black text-[#c8b320] font-black uppercase text-xs sm:text-sm">
                <td colSpan={11} className="py-1.5 px-4 text-right tracking-wider">
                  TOTAL
                </td>
                <td className="py-1.5 px-3 text-center bg-black text-[#e8d23b] text-base font-black border-l border-slate-800">
                  {grandTotal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 4. WORKSHOP NOTES BOX (CATATAN) */}
        <div className="border-x-2 border-b-2 border-slate-900 p-4 min-h-[90px] bg-white">
          <span className="text-xs font-bold text-slate-800 block mb-1">Catatan :</span>
          <div className="text-sm font-bold text-slate-900 leading-relaxed font-sans space-y-0.5">
            {order.stitchingNotes ? (
              order.stitchingNotes.split('\n').map((line, idx) => (
                <p key={idx}>{line.startsWith('-') ? line : `- ${line}`}</p>
              ))
            ) : (
              <>
                <p>- KAM 3 JARUM</p>
                <p>- KERAH {order.collarModel.toUpperCase().replace('-', ' ')}</p>
                {order.notes && <p>- {order.notes}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
