import { Order, SizeDetail } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDateID(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTimeID(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function calculateTotalSizes(sizes: SizeDetail): number {
  return Object.values(sizes).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
}

export function generateOrderNumber(sequence: number, prefix: string = 'KA'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seqStr = String(sequence).padStart(3, '0');
  return `${prefix}-${year}${month}${day}-${seqStr}`;
}

export function generateSpkNumber(sequence: number, prefix: string = 'SPK-KA'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seqStr = String(sequence).padStart(3, '0');
  return `${prefix}-${year}-${month}${day}-${seqStr}`;
}

export function generateInvoiceNumber(sequence: number, prefix: string = 'INV-KA'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seqStr = String(sequence).padStart(3, '0');
  return `${prefix}-${year}-${month}${day}-${seqStr}`;
}

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function generateWhatsAppUrl(order: Order, customType?: 'progress' | 'design' | 'payment' | 'invoice' | 'shipping' | 'spk'): string {
  const phone = cleanPhoneNumber(order.clientPhone);
  let message = '';

  const clientName = order.clientName;
  const orderNo = order.orderNumber;
  const currentStage = order.productionStages.find(s => s.id === order.currentStageId)?.name || order.status;

  if (customType === 'progress' || !customType) {
    message = `Halo *${clientName}*, update pesanan Anda di *KIRA APAREL* dengan nomor *${orderNo}* saat ini sudah masuk tahap: *${currentStage}* (${order.progressPercentage}%).\n\nEstimasi Selesai: *${formatDateID(order.deadline)}*.\n\nAnda dapat memantau detail dan foto progress terkini di link tracking pesanan Anda. Terima kasih!`;
  } else if (customType === 'design') {
    message = `Halo *${clientName}*, desain untuk pesanan *${orderNo}* telah diunggah dan siap untuk dicek. Silakan periksa referensi *Gambar 1* dan *Gambar 2* pada sistem kami untuk persetujuan.`;
  } else if (customType === 'payment' || customType === 'invoice') {
    message = `Halo *${clientName}*, tagihan invoice untuk pesanan *${orderNo}* sebesar *${formatRupiah(order.remainingBalance > 0 ? order.remainingBalance : order.totalAmount)}* telah diterbitkan. Silakan melakukan konfirmasi pembayaran. Terima kasih.`;
  } else if (customType === 'shipping') {
    const courier = order.shipment?.courier || 'Ekspedisi';
    const resi = order.shipment?.trackingNumber || '-';
    message = `Halo *${clientName}*, pesanan Anda *${orderNo}* telah dikirimkan melalui *${courier}* dengan nomor resi: *${resi}*. Paket sedang dalam perjalanan ke alamat Anda.`;
  } else if (customType === 'spk') {
    message = `Halo *${clientName}*, Surat Perintah Kerja (SPK) untuk pesanan *${orderNo}* telah diterbitkan dengan nomor *${order.spkNumber}*. Pesanan Anda resmi masuk antrian workshop produksi KIRA APAREL.`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function getOrderTrackingUrl(orderNumber: string): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}#track-${encodeURIComponent(orderNumber)}`;
  }
  return `https://kiraapparel.com/#track-${encodeURIComponent(orderNumber)}`;
}
