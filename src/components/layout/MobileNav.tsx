import React from 'react';
import { FileCheck2, FileText, Home, PlusCircle, Search, ShoppingBag, Wrench } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onNavigate }) => {
  const { currentUser } = useApp();

  if (currentUser.role === 'client') {
    return (
      <nav
        id="mobile-bottom-nav-client"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-2 flex justify-around items-center shadow-lg no-print"
      >
        <button
          onClick={() => onNavigate('client-tracking')}
          className={`flex flex-col items-center gap-1 py-1 text-[11px] font-medium ${
            currentTab === 'client-tracking' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Tracking</span>
        </button>
        <button
          onClick={() => onNavigate('orders')}
          className={`flex flex-col items-center gap-1 py-1 text-[11px] font-medium ${
            currentTab === 'orders' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Pesanan</span>
        </button>
        <button
          onClick={() => onNavigate('designs')}
          className={`flex flex-col items-center gap-1 py-1 text-[11px] font-medium ${
            currentTab === 'designs' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <FileCheck2 className="w-5 h-5" />
          <span>Desain</span>
        </button>
        <button
          onClick={() => onNavigate('invoices')}
          className={`flex flex-col items-center gap-1 py-1 text-[11px] font-medium ${
            currentTab === 'invoices' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Invoice</span>
        </button>
      </nav>
    );
  }

  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-2 flex justify-around items-center shadow-lg no-print"
    >
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium ${
          currentTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Beranda</span>
      </button>

      <button
        onClick={() => onNavigate('orders')}
        className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium ${
          currentTab === 'orders' ? 'text-indigo-600 font-bold' : 'text-slate-500'
        }`}
      >
        <ShoppingBag className="w-5 h-5" />
        <span>Pesanan</span>
      </button>

      {(currentUser.role === 'admin' || currentUser.role === 'marketing') && (
        <button
          onClick={() => onNavigate('create-order')}
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg ring-4 ring-white">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-indigo-700 mt-1">Buat Order</span>
        </button>
      )}

      <button
        onClick={() => onNavigate('production')}
        className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium ${
          currentTab === 'production' ? 'text-indigo-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Wrench className="w-5 h-5" />
        <span>Produksi</span>
      </button>

      <button
        onClick={() => onNavigate('invoices')}
        className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium ${
          currentTab === 'invoices' ? 'text-indigo-600 font-bold' : 'text-slate-500'
        }`}
      >
        <FileText className="w-5 h-5" />
        <span>Invoice</span>
      </button>
    </nav>
  );
};
