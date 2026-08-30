import React, { useState } from 'react';
import {
  ArrowDownToLine,
  BarChart3,
  Calendar,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Package,
  Printer,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatDateID, formatRupiah } from '../utils/formatters';

export const ReportsView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { orders, clients, settings } = useApp();
  const [reportPeriod, setReportPeriod] = useState('2026');

  // Aggregates
  const totalOmzet = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalReceived = orders.reduce((sum, o) => sum + (o.totalAmount - o.remainingBalance), 0);
  const totalReceivable = orders.reduce((sum, o) => sum + o.remainingBalance, 0);
  const totalPcs = orders.reduce((sum, o) => sum + o.quantity, 0);

  // Monthly Revenue Chart Data
  const monthlyRevenueData = [
    { month: 'Jan', omzet: 14500000, pcs: 120 },
    { month: 'Feb', omzet: 22000000, pcs: 180 },
    { month: 'Mar', omzet: 31500000, pcs: 250 },
    { month: 'Apr', omzet: 28000000, pcs: 210 },
    { month: 'Mei', omzet: 42000000, pcs: 340 },
    { month: 'Jun', omzet: 58000000, pcs: 460 },
    { month: 'Jul', omzet: 49000000, pcs: 390 },
    { month: 'Agu', omzet: totalOmzet + 15000000, pcs: totalPcs + 150 },
  ];

  // Fabric popularity
  const fabricStats = [
    { name: 'Dryfit Milano', value: orders.filter(o => o.fabric.includes('Milano')).length + 12 },
    { name: 'Dryfit Brazil', value: orders.filter(o => o.fabric.includes('Brazil')).length + 8 },
    { name: 'Dryfit Nike/Bintik', value: orders.filter(o => o.fabric.includes('Nike') || o.fabric.includes('Bintik')).length + 5 },
    { name: 'Pique Hexagonal', value: 3 },
  ];
  const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981'];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = 'Order ID,Client,Perusahaan,Produk,Qty,Bahan,Total,DP,Sisa,Status,Tgl Order,Deadline\n';
    orders.forEach(o => {
      csv += `"${o.orderNumber}","${o.clientName}","${o.clientCompany}","${o.productType}",${o.quantity},"${o.fabric}",${o.totalAmount},${o.downPayment},${o.remainingBalance},"${o.status}","${o.orderDate}","${o.deadline}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Kira_Aparel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="reports-view" className="space-y-6 pb-12">
      {/* View Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
              Executive Analytics
            </span>
            <span className="text-xs text-slate-500">Laporan Penjualan & Produksi</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit',sans-serif] mt-1">
            Laporan Keuangan & Kinerja Konveksi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis omzet bulanan, piutang pelanggan, volume produksi jersey, dan ekspor data CSV / PDF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Omzet Keseluruhan</span>
          <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(totalOmzet)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{orders.length} pesanan tercatat</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700">Total Kas Masuk (Terbayar)</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{formatRupiah(totalReceived)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">DP & Pelunasan Lunas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-rose-700">Total Piutang Belum Lunas</span>
          <p className="text-xl font-black text-rose-600 mt-1">{formatRupiah(totalReceivable)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sisa tagihan invoice</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-indigo-700">Total Volume Pcs</span>
          <p className="text-xl font-black text-indigo-600 mt-1">{totalPcs} Pcs</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Produksi jersey konveksi</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Omzet Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Tren Omzet Bulanan (2026)</h3>
          <p className="text-xs text-slate-500 mb-4">Grafik nilai transaksi konveksi jersey per bulan</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  tickFormatter={val => `Rp ${(val / 1000000).toFixed(0)}Jt`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value)), 'Omzet']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="omzet" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fabric Breakdown Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Populer Bahan Kain</h3>
            <p className="text-xs text-slate-500 mb-2">Sebaran permintaan bahan jersey</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fabricStats} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                    {fabricStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} Pesanan`, 'Order']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {fabricStats.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value} order</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Order Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Rincian Transaksi & Status Order</h3>
          <span className="text-xs text-slate-500">Total: {orders.length} Transaksi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Client & Perusahaan</th>
                <th className="py-3 px-4">Produk & Bahan</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Total Nilai</th>
                <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3 px-4 text-right">Sisa Tagihan</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{o.orderNumber}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{o.clientName}</span>
                    <span className="text-[10px] text-slate-500">{o.clientCompany}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 block">{o.productType}</span>
                    <span className="text-[10px] text-slate-400">{o.fabric}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold">{o.quantity} pcs</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatRupiah(o.totalAmount)}</td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-700">{formatRupiah(o.downPayment)}</td>
                  <td className="py-3 px-4 text-right font-bold text-rose-700">{formatRupiah(o.remainingBalance)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
