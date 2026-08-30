import React from 'react';
import { DesignStatus, InvoiceStatus, OrderStatus, PaymentStatus } from '../../types';

export const OrderStatusBadge: React.FC<{ status: OrderStatus; className?: string }> = ({ status, className = '' }) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Draft':
      color = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'Menunggu Desain':
      color = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'Persetujuan Desain':
      color = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'SPK Diterbitkan':
      color = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Sedang Produksi':
      color = 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse-subtle';
      break;
    case 'Siap Dikirim':
      color = 'bg-teal-50 text-teal-700 border-teal-200';
      break;
    case 'Dikirim':
      color = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      break;
    case 'Selesai':
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Dibatalkan':
      color = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
  }

  return (
    <span
      id={`order-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export const DesignStatusBadge: React.FC<{ status: DesignStatus; className?: string }> = ({ status, className = '' }) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Draft':
      color = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'Menunggu Persetujuan':
      color = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'Disetujui':
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Revisi':
      color = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
  }

  return (
    <span
      id={`design-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export const InvoiceStatusBadge: React.FC<{ status: InvoiceStatus; className?: string }> = ({ status, className = '' }) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Draft':
      color = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'Menunggu Pembayaran':
      color = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'DP':
      color = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Sebagian Dibayar':
      color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'Lunas':
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Terlambat':
      color = 'bg-red-50 text-red-800 border-red-300';
      break;
  }

  return (
    <span
      id={`invoice-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus; className?: string }> = ({ status, className = '' }) => {
  let color = 'bg-amber-50 text-amber-700 border-amber-200';

  if (status === 'Terverifikasi') {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (status === 'Ditolak') {
    color = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span
      id={`payment-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};
