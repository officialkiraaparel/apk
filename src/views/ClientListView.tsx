import React, { useState } from 'react';
import {
  Building2,
  Edit2,
  Eye,
  History,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { cleanPhoneNumber, formatDateID, formatRupiah } from '../utils/formatters';

export const ClientListView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { clients, orders, addClient, updateClient, deleteClient, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientHistory, setSelectedClientHistory] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setEditingClient(null);
    setShowAddModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompany(client.company);
    setPhone(client.phone);
    setEmail(client.email || '');
    setAddress(client.address || '');
    setNotes(client.notes || '');
    setShowAddModal(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    if (editingClient) {
      updateClient(editingClient.id, {
        name,
        company: company || '-',
        phone,
        email,
        address,
        notes,
      });
    } else {
      addClient({
        name,
        company: company || '-',
        phone,
        email,
        address,
        notes,
      });
    }
    setShowAddModal(false);
  };

  const handleDeleteClient = (client: Client) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data client "${client.name}"?`)) {
      deleteClient(client.id);
    }
  };

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.clientId.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const getOrdersForClient = (clientId: string) => {
    return orders.filter(o => o.clientId === clientId);
  };

  return (
    <div id="clients-view" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit',sans-serif]">
              Data Client & Komunitas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pelanggan tetap, komunitas olahraga, instansi, dan riwayat pemesanan.
          </p>
        </div>

        <button
          id="add-client-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Client Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama, komunitas, nomor WA, atau ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong className="text-slate-800">{filteredClients.length}</strong> client
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Client ID</th>
                <th className="py-3 px-4">Nama Client</th>
                <th className="py-3 px-4">Perusahaan / Komunitas</th>
                <th className="py-3 px-4">Kontak WhatsApp & Email</th>
                <th className="py-3 px-4">Alamat</th>
                <th className="py-3 px-4 text-center">Total Order</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{client.clientId}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{client.name}</p>
                    {client.notes && <p className="text-[11px] text-slate-400 line-clamp-1">{client.notes}</p>}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-700">{client.company}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-800 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {client.phone}
                    </p>
                    {client.email && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {client.email}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-600">
                    {client.address || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedClientHistory(client)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      title="Klik untuk melihat riwayat order"
                    >
                      <History className="w-3 h-3" />
                      <span>{client.totalOrders} order</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatRupiah(client.totalSpent)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`https://wa.me/${cleanPhoneNumber(client.phone)}?text=Halo%20${encodeURIComponent(
                          client.name
                        )},%20kami%20dari%20KIRA%20APAREL.`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Chat WhatsApp Client"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Data Client"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteClient(client)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit',sans-serif]">
                {editingClient ? 'Edit Data Client' : 'Tambah Client Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Client *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Budi Darmawan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perusahaan / Komunitas / Tim</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Contoh: Garuda Muda FC / PT Digital Solusi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Pengiriman</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Alamat lengkap tujuan pengiriman..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Khusus</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: Suka jersey pas badan, repeat order setiap turnamen."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {editingClient ? 'Simpan Perubahan' : 'Tambah Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Order History Drawer */}
      {selectedClientHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Riwayat Transaksi Client
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedClientHistory.name} — {selectedClientHistory.company}
                </h3>
              </div>
              <button onClick={() => setSelectedClientHistory(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {getOrdersForClient(selectedClientHistory.id).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada order untuk client ini.</p>
              ) : (
                getOrdersForClient(selectedClientHistory.id).map(ord => (
                  <div
                    key={ord.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 text-xs">{ord.orderNumber}</span>
                        <span className="text-xs font-semibold text-slate-800">{ord.productType}</span>
                        <span className="text-[11px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {ord.quantity} pcs
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Order: {formatDateID(ord.orderDate)} • Deadline: {formatDateID(ord.deadline)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">{formatRupiah(ord.totalAmount)}</p>
                      <button
                        onClick={() => {
                          setSelectedClientHistory(null);
                          onNavigate(`order-detail-${ord.id}`);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline mt-1"
                      >
                        Buka Order &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedClientHistory(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
