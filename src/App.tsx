import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MobileNav } from './components/layout/MobileNav';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AppProvider, useApp } from './context/AppContext';
import { ClientListView } from './views/ClientListView';
import { ClientTrackingView } from './views/ClientTrackingView';
import { CreateOrderView } from './views/CreateOrderView';
import { DashboardAdminView } from './views/DashboardAdminView';
import { InvoiceDetailView } from './views/InvoiceDetailView';
import { LandingPageView } from './views/LandingPageView';
import { LoginView } from './views/LoginView';
import { OrderDetailView } from './views/OrderDetailView';
import { OrderListView } from './views/OrderListView';
import { PaymentManagementView } from './views/PaymentManagementView';
import { ProductionListView } from './views/ProductionListView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { ShipmentManagementView } from './views/ShipmentManagementView';
import { SPKView } from './views/SPKView';
import { UserManagementView } from './views/UserManagementView';
import { GoogleSheetsDatabaseView } from './views/GoogleSheetsDatabaseView';

const MainLayout: React.FC = () => {
  const { currentUser, isAuth, orders } = useApp();
  // Default tab: for client or unauth, default is 'landing'; for staff, 'dashboard'
  const [activeTab, setActiveTab] = useState<string>(() => {
    return currentUser?.role === 'client' ? 'landing' : 'dashboard';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Sync role change with default landing/dashboard view
  useEffect(() => {
    if (currentUser.role === 'client' && activeTab === 'dashboard') {
      setActiveTab('landing');
    }
  }, [currentUser.role]);

  // Handle Hash routing or direct navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('track-')) {
        setActiveTab('tracking');
      } else if (hash === 'landing') {
        setActiveTab('landing');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // If user is not authenticated or viewing the dedicated landing page (or client role on landing/dashboard)
  if (!isAuth) {
    return (
      <LandingPageView
        onNavigateToApp={(tab = 'dashboard') => setActiveTab(tab)}
      />
    );
  }

  // Full-bleed Landing Page for Client or explicit Landing Tab
  if (activeTab === 'landing' || (currentUser.role === 'client' && activeTab === 'dashboard')) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Floating Quick Return Bar for Staff logged in */}
        {currentUser.role !== 'client' && (
          <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800 sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">Mode Pratinjau Landing Page Klien</span>
              <span className="text-slate-400">(Login sebagai {currentUser.name} - {currentUser.role})</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Kembali ke Dashboard Staff →
            </button>
          </div>
        )}

        <LandingPageView
          onNavigateToApp={(tab = 'dashboard') => setActiveTab(tab)}
        />
      </div>
    );
  }

  const renderActiveView = () => {
    // Dynamic Order Detail Route
    if (activeTab.startsWith('order-detail-')) {
      const orderId = activeTab.replace('order-detail-', '');
      return <OrderDetailView orderId={orderId} onNavigate={setActiveTab} />;
    }

    // Dynamic SPK Detail Route
    if (activeTab.startsWith('spk-detail-')) {
      const orderId = activeTab.replace('spk-detail-', '');
      return <SPKView orderId={orderId} onNavigate={setActiveTab} />;
    }

    // Dynamic Invoice Detail Route
    if (activeTab.startsWith('invoice-detail-')) {
      const orderId = activeTab.replace('invoice-detail-', '');
      return <InvoiceDetailView orderId={orderId} onNavigate={setActiveTab} />;
    }

    switch (activeTab) {
      case 'landing':
        return <LandingPageView onNavigateToApp={setActiveTab} />;
      case 'dashboard':
        return <DashboardAdminView onNavigate={setActiveTab} />;
      case 'clients':
        return <ClientListView onNavigate={setActiveTab} />;
      case 'create-order':
        return <CreateOrderView onNavigate={setActiveTab} />;
      case 'orders':
        return <OrderListView onNavigate={setActiveTab} />;
      case 'production':
        return <ProductionListView onNavigate={setActiveTab} />;
      case 'payments':
      case 'invoices':
        return <PaymentManagementView onNavigate={setActiveTab} />;
      case 'shipments':
        return <ShipmentManagementView onNavigate={setActiveTab} />;
      case 'tracking':
      case 'client-tracking':
        return <ClientTrackingView onNavigate={setActiveTab} />;
      case 'designs':
        return <OrderListView onNavigate={setActiveTab} />;
      case 'spk':
        if (orders.length > 0) {
          return <SPKView orderId={orders[0].id} onNavigate={setActiveTab} />;
        }
        return <OrderListView onNavigate={setActiveTab} />;
      case 'reports':
        return <ReportsView onNavigate={setActiveTab} />;
      case 'users':
        return <UserManagementView onNavigate={setActiveTab} />;
      case 'settings':
        return <SettingsView onNavigate={setActiveTab} />;
      case 'sheets-sync':
        return <GoogleSheetsDatabaseView onNavigate={setActiveTab} />;
      default:
        return <DashboardAdminView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col antialiased text-slate-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentTab={activeTab}
        onNavigate={setActiveTab}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={activeTab}
          onNavigate={setActiveTab}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8F9FA] p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
