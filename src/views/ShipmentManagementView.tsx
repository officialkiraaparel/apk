import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Search,
  Truck,
  User,
} from 'lucide-react';
import { OrderStatusBadge } from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import { formatDateID, formatDateTimeID, generateWhatsAppUrl } from '../utils/formatters';

export const ShipmentManagementView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { orders } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Orders that are either completed, shipped, or ready to ship
  const shippingOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.clientName.toLowerCase().includes(q) ||
      order.clientCompany.toLowerCase().includes(q) ||
      (order.shipment?.courier && order.shipment.courier.toLowerCase().includes(q)) ||
      (order.shipment?.trackingNumber && order.shipment.trackingNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div id="shipment-management-view" className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-50 text-cyan-800 border border-cyan-200">
              Logistik & Ekspedisi
            </span>
            <span className="text-xs text-slate-500">Pelacakan Resi</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit',sans-serif] mt-1">
            Status Pengiriman & Nomor Resi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau status barang jersey yang sedang dikirim melalui ekspedisi (JNE, J&T Cargo, Lalamove, dll).
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nomor resi, ekspedisi, Order ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Shipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shippingOrders.map(order => (
          <div
            key={order.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {order.orderNumber}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{order.clientName}</h3>
                  <p className="text-[11px] text-slate-500">{order.clientCompany}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              {order.shipment ? (
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Kurir / Ekspedisi:</span>
                      <span className="font-bold text-slate-900">{order.shipment.courier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nomor Resi:</span>
                      <span className="font-mono font-black text-indigo-700 text-sm">
                        {order.shipment.trackingNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-cyan-200/60">
                      <span>Waktu Dikirim:</span>
                      <span>{formatDateTimeID(order.shipment.shippedAt)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Tujuan Pengiriman:</span>
                    <p className="text-slate-700 font-medium line-clamp-2">{order.clientAddress}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  <Truck className="w-6 h-6 mx-auto mb-1 text-slate-400 opacity-60" />
                  <span>Belum ada data resi ekspedisi (masih dalam antrian workshop).</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-4">
              <a
                href={generateWhatsAppUrl(order, 'shipping')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Kirim Resi via WA</span>
              </a>

              <button
                onClick={() => onNavigate(`order-detail-${order.id}`)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Buka Detail Order &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
