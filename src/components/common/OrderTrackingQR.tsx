import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, ExternalLink, QrCode, Sparkles, Smartphone, Download } from 'lucide-react';
import { Order } from '../../types';
import { getOrderTrackingUrl } from '../../utils/formatters';

interface OrderTrackingQRProps {
  order: Order;
  size?: number;
  variant?: 'compact' | 'standard' | 'stamp' | 'badge';
  showActions?: boolean;
  className?: string;
}

export const OrderTrackingQR: React.FC<OrderTrackingQRProps> = ({
  order,
  size = 110,
  variant = 'standard',
  showActions = true,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const trackingUrl = getOrderTrackingUrl(order.orderNumber);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(
      trackingUrl,
      {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: size * 2, // 2x for retina / high-DPI print sharpness
        color: {
          dark: '#0f172a', // Deep slate / black for maximum scanner readability
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url && isMounted) {
          setQrDataUrl(url);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, [trackingUrl, size]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-Tracking-${order.orderNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compact Stamp variant (suitable for tight headers or document corners)
  if (variant === 'stamp' || variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 p-2 bg-white border border-slate-300 rounded-xl shadow-2xs ${className}`}>
        <div
          className="bg-white p-1 rounded-lg border border-slate-200 shrink-0 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Tracking ${order.orderNumber}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
          )}
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-700 tracking-wider">
            <QrCode className="w-3 h-3 shrink-0" />
            <span>Scan QR Tracking</span>
          </div>
          <p className="text-[10px] font-bold text-slate-900 truncate font-mono mt-0.5">
            {order.orderNumber}
          </p>
          <p className="text-[8px] text-slate-500 leading-tight">
            Kamera HP / Google Lens
          </p>
          {showActions && (
            <div className="no-print mt-1.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[9px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded flex items-center gap-1 transition-colors"
                title="Salin link tracking"
              >
                {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded flex items-center gap-1 transition-colors"
                title="Buka link tracking"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                <span>Buka</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Official Document Badge (for Detail Order Sheet)
  if (variant === 'badge') {
    return (
      <div className={`p-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl flex items-center justify-between gap-3 ${className}`}>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse no-print" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
              QR CODE TRACKING PESANAN
            </span>
          </div>
          <p className="text-[9px] text-slate-600 font-medium">
            Scan via Smartphone untuk memantau progres jahitan, foto workshop, resi ekspedisi, dan status penerimaan barang.
          </p>
          <p className="text-[9px] font-mono text-indigo-700 font-bold">
            Order Ref: {order.orderNumber}
          </p>
        </div>

        <div className="text-center shrink-0">
          <div
            className="bg-white p-1 rounded-lg border-2 border-slate-900 shadow-2xs flex items-center justify-center mx-auto"
            style={{ width: size, height: size }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Tracking ${order.orderNumber}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
            )}
          </div>
          <span className="text-[8px] font-black uppercase text-slate-800 tracking-tighter mt-0.5 block">
            Scan To Track
          </span>
        </div>
      </div>
    );
  }

  // Standard SPK Card Variant (with action buttons & scanner guides)
  return (
    <div className={`p-4 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border-2 border-indigo-200/80 rounded-2xl shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* QR Code Container */}
        <div className="text-center shrink-0">
          <div
            className="bg-white p-1.5 rounded-xl border-2 border-indigo-600/60 shadow-md flex items-center justify-center mx-auto"
            style={{ width: size, height: size }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Tracking ${order.orderNumber}`}
                className="w-full h-full object-contain rounded-md"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 animate-pulse rounded-md" />
            )}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-black uppercase text-indigo-800">
            <Smartphone className="w-3 h-3" />
            <span>Scan Kamera HP</span>
          </div>
        </div>

        {/* Information & Actions */}
        <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
              LIVE TRACKING KLIEN
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">
              {order.orderNumber}
            </span>
          </div>

          <h4 className="text-sm font-extrabold text-slate-900">
            QR Code Verifikasi & Pelacakan Pesanan
          </h4>

          <p className="text-xs text-slate-600 leading-relaxed">
            QR Code ini otomatis terhubung langsung ke portal pelacakan pesanan <strong>{order.clientCompany || order.clientName}</strong>. Klien atau kurir dapat memindai QR code ini kapan saja untuk memverifikasi detail SPK, memantau tahapan produksi, hingga mengonfirmasi penerimaan barang.
          </p>

          {/* Action buttons (Hidden during Print) */}
          {showActions && (
            <div className="no-print pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copied ? 'Link Tersalin!' : 'Salin Link Tracking'}</span>
              </button>

              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Tracking Live</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-indigo-300" />
                <span>Download Gambar QR</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
