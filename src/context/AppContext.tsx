import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppNotification,
  Client,
  CompanySettings,
  DesignStatus,
  DesignVersion,
  Invoice,
  Order,
  Payment,
  ProductionPhoto,
  ProductionStageId,
  Role,
  Shipment,
  User,
} from '../types';
import {
  DEFAULT_COMPANY_SETTINGS,
  GUEST_CLIENT_USER,
  INITIAL_PRODUCTION_STAGES,
  KIRA_LOGO_URL,
  MOCK_USERS,
  OFFICIAL_SUPERADMIN_USER,
} from '../utils/constants';
import {
  calculateTotalSizes,
  generateInvoiceNumber,
  generateOrderNumber,
  generateSpkNumber,
} from '../utils/formatters';
import { INITIAL_CLIENTS, INITIAL_ORDERS } from '../utils/mockData';
import { appendOrderToGoogleSheets } from '../services/googleSheetsService';

interface AppContextType {
  isAuth: boolean;
  currentUser: User;
  users: User[];
  clients: Client[];
  orders: Order[];
  notifications: AppNotification[];
  settings: CompanySettings;
  login: (identifier: string, passwordOrRole?: string | Role) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  quickSwitchRole: (role: Role) => void;
  
  // User Registration & Role Approval by Super Admin
  registerUser: (userData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    requestedRole: Role;
    notes?: string;
  }) => { success: boolean; message: string; user?: User };
  approveUser: (userId: string, assignedRole: Role) => void;
  rejectUser: (userId: string) => void;
  addUserByAdmin: (userData: Omit<User, 'id'>) => User;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;

  // Data Clean & Reset (Deploy-Ready)
  clearDummyData: () => void;
  loadDemoData: () => void;
  
  // Clients
  addClient: (clientData: Omit<Client, 'id' | 'clientId' | 'totalOrders' | 'totalSpent' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Orders
  createOrder: (orderData: Partial<Order>) => Order;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  
  // Design & Approval
  uploadDesignVersion: (orderId: string, image1: string, image2: string, notes?: string) => void;
  updateDesignStatus: (orderId: string, status: DesignStatus, revisionNotes?: string) => void;
  
  // Production
  advanceProductionStage: (orderId: string, nextStageId: ProductionStageId, notes?: string) => void;
  addProductionPhoto: (orderId: string, stageId: ProductionStageId, photoUrl: string, caption: string) => void;
  addProductionNote: (orderId: string, stageId: ProductionStageId, notes: string) => void;
  
  // SPK
  issueSPK: (orderId: string, customNotes?: string) => void;
  
  // Payments & Invoice
  addPayment: (orderId: string, paymentData: { amount: number; method: any; proofUrl?: string; notes?: string }) => void;
  verifyPayment: (orderId: string, paymentId: string, isApproved: boolean) => void;
  updateInvoice: (orderId: string, updates: Partial<Invoice>) => void;
  
  // Shipment
  updateShipment: (orderId: string, shipmentData: Partial<Shipment>) => void;
  
  // Settings & Notifications
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Helper to get order for client role
  getClientOrders: () => Order[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTH: 'kira_app_is_auth',
  USER: 'kira_app_user',
  USERS: 'kira_app_users_list',
  CLIENTS: 'kira_app_clients',
  ORDERS: 'kira_app_orders',
  SETTINGS: 'kira_app_settings',
  NOTIFICATIONS: 'kira_app_notifications',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuth, setIsAuth] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        // Filter out old dummy admin/staff/clients to ensure only Super Admin & custom accounts remain
        const filtered = parsed.filter(
          u =>
            u.id === 'usr_superadmin' ||
            u.email.toLowerCase() === 'officialkiraaparel@gmail.com' ||
            (!u.id.startsWith('usr_admin') &&
              !u.id.startsWith('usr_marketing') &&
              !u.id.startsWith('usr_produksi') &&
              !u.id.startsWith('usr_client'))
        );
        const hasSuperAdmin = filtered.some(
          u => u.email.toLowerCase() === 'officialkiraaparel@gmail.com' || u.id === 'usr_superadmin'
        );
        return hasSuperAdmin ? filtered : [OFFICIAL_SUPERADMIN_USER, ...filtered];
      } catch (e) {
        return [OFFICIAL_SUPERADMIN_USER];
      }
    }
    return [OFFICIAL_SUPERADMIN_USER];
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        const parsed: User = JSON.parse(saved);
        if (
          parsed.id.startsWith('usr_admin') ||
          parsed.id.startsWith('usr_marketing') ||
          parsed.id.startsWith('usr_produksi') ||
          parsed.id.startsWith('usr_client')
        ) {
          return GUEST_CLIENT_USER;
        }
        return parsed;
      } catch (e) {
        return GUEST_CLIENT_USER;
      }
    }
    return GUEST_CLIENT_USER;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.logoUrl || parsed.logoUrl.includes('unsplash.com')) {
          parsed.logoUrl = KIRA_LOGO_URL;
        }
        return { ...DEFAULT_COMPANY_SETTINGS, ...parsed };
      } catch (e) {
        return DEFAULT_COMPANY_SETTINGS;
      }
    }
    return DEFAULT_COMPANY_SETTINGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'notif_1',
            title: 'Desain Menunggu Persetujuan',
            message: 'Order KA-20260822-002 (Gowes Bandung) menunggu persetujuan desain dari client.',
            orderId: 'ord_2',
            type: 'design',
            read: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'notif_2',
            title: 'Progress Jahit Berjalan',
            message: 'Order KA-20260828-001 (Garuda FC) mencapai 65% progress di workshop.',
            orderId: 'ord_1',
            type: 'production',
            read: false,
            createdAt: new Date().toISOString(),
          },
        ];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(isAuth));
  }, [isAuth]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (title: string, message: string, orderId?: string, type: AppNotification['type'] = 'system') => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      orderId,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const login = (identifier: string, passwordOrRole?: string | Role): { success: boolean; message?: string } => {
    const rawTarget = (identifier || '').trim().toLowerCase();
    
    // Find user by email, username, or ID
    const found = users.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uId = (u.id || '').toLowerCase();
      const usernameFromEmail = uEmail.split('@')[0];
      return (
        uEmail === rawTarget ||
        uId === rawTarget ||
        usernameFromEmail === rawTarget ||
        (rawTarget === 'superadmin' && u.role === 'super_admin') ||
        (rawTarget === 'admin' && u.role === 'super_admin')
      );
    });

    if (found) {
      if (found.status === 'pending_approval') {
        return {
          success: false,
          message: `Akun "${found.name}" (${found.email}) saat ini masih berstatus Pending Approval. Menunggu persetujuan Super Administrator untuk diizinkan aktif.`,
        };
      }
      if (found.status === 'rejected') {
        return {
          success: false,
          message: 'Pendaftaran akun ini telah ditolak oleh Super Administrator. Hubungi pihak manajemen untuk info lebih lanjut.',
        };
      }

      // If password string is passed (and not a preset Role enum)
      if (typeof passwordOrRole === 'string' && passwordOrRole.length > 0 && !['super_admin', 'admin', 'marketing', 'produksi', 'client'].includes(passwordOrRole)) {
        const inputPass = passwordOrRole;
        const isSuper = found.role === 'super_admin' || found.email.toLowerCase() === 'officialkiraaparel@gmail.com';
        
        const validPass = isSuper 
          ? (inputPass === 'superadmin123' || inputPass === 'kiraapparel2026!' || inputPass === found.password)
          : (inputPass === (found.password || 'kira2026'));

        if (!validPass) {
          return {
            success: false,
            message: 'Password yang Anda masukkan salah. Silakan coba lagi.',
          };
        }
      }

      setCurrentUser(found);
      setIsAuth(true);
      return { success: true };
    }

    // Fallback match by role
    if (typeof passwordOrRole === 'string' && ['super_admin', 'admin', 'marketing', 'produksi', 'client'].includes(passwordOrRole)) {
      const roleUser = users.find(u => u.role === passwordOrRole && u.status !== 'pending_approval' && u.status !== 'rejected');
      if (roleUser) {
        setCurrentUser(roleUser);
        setIsAuth(true);
        return { success: true };
      }
    }

    return { 
      success: false, 
      message: 'Username atau email tidak ditemukan dalam sistem. Silakan periksa kembali atau buat akun baru.' 
    };
  };

  const logout = () => {
    setIsAuth(false);
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setIsAuth(true);
    }
  };

  const quickSwitchRole = (role: Role) => {
    const user = users.find(u => u.role === role && u.status !== 'pending_approval' && u.status !== 'rejected');
    if (user) {
      setCurrentUser(user);
      setIsAuth(true);
    }
  };

  // USER REGISTRATION & APPROVAL (SUPER ADMIN)
  const registerUser = (userData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    requestedRole: Role;
    notes?: string;
  }): { success: boolean; message: string; user?: User } => {
    const targetEmail = userData.email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === targetEmail);
    
    if (existing) {
      if (existing.status === 'pending_approval') {
        return {
          success: false,
          message: 'Email ini sudah terdaftar dan saat ini masih menunggu persetujuan dari Super Admin.',
        };
      }
      return {
        success: false,
        message: 'Alamat email sudah terdaftar dalam sistem. Silakan langsung login atau gunakan fitur Lupa Password.',
      };
    }

    const isClientDirect = userData.requestedRole === 'client';
    const roleLabels: Record<Role, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin Operasional',
      marketing: 'Marketing Officer',
      produksi: 'Produksi Workshop',
      client: 'Client / Pelanggan',
    };

    const newUser: User = {
      id: `usr_reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: userData.name.trim(),
      email: targetEmail,
      password: userData.password,
      role: isClientDirect ? 'client' : 'client', // Default temporary role until Super Admin assigns Marketing/Admin/Produksi
      requestedRole: userData.requestedRole,
      status: isClientDirect ? 'active' : 'pending_approval',
      phone: userData.phone?.trim() || '',
      notes: userData.notes,
      registeredAt: new Date().toISOString(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    };

    setUsers(prev => [newUser, ...prev]);

    // Send system notification to Super Admin
    addNotification(
      'Permohonan Registrasi Pengguna Baru',
      `Pengguna "${newUser.name}" (${newUser.email}) telah mendaftar dan mengajukan akses divisi ${roleLabels[userData.requestedRole] || userData.requestedRole}. Silakan tinjau dan izinkan di menu Manajemen Pengguna.`,
      undefined,
      'system'
    );

    return {
      success: true,
      message: isClientDirect
        ? 'Registrasi berhasil! Akun Client Anda telah aktif dan dapat langsung digunakan.'
        : `Registrasi berhasil! Akun Anda telah terdaftar dan sedang menunggu persetujuan Super Admin untuk diizinkan menjadi ${roleLabels[userData.requestedRole] || userData.requestedRole}.`,
      user: newUser,
    };
  };

  const approveUser = (userId: string, assignedRole: Role) => {
    const roleLabels: Record<Role, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin Operasional',
      marketing: 'Marketing Officer',
      produksi: 'Produksi Workshop',
      client: 'Client / Pelanggan',
    };

    let targetName = 'Pengguna';
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          targetName = u.name;
          return {
            ...u,
            role: assignedRole,
            requestedRole: undefined,
            status: 'active',
            approvedAt: new Date().toISOString(),
            approvedBy: currentUser.name || 'Super Admin',
          };
        }
        return u;
      })
    );

    addNotification(
      'Persetujuan Pengguna Berhasil',
      `Akun "${targetName}" telah disetujui & diizinkan aktif sebagai ${roleLabels[assignedRole] || assignedRole}.`,
      undefined,
      'system'
    );
  };

  const rejectUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (target) {
      addNotification(
        'Permohonan Registrasi Ditolak',
        `Permohonan akun "${target.name}" (${target.email}) telah ditolak/dihapus dari sistem.`,
        undefined,
        'system'
      );
    }
  };

  const addUserByAdmin = (userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'active',
      avatar: userData.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // DUMMY DATA CLEANING & RESET (FOR DEPLOYMENT / PRODUCTION-READY GO-LIVE)
  const clearDummyData = () => {
    // 1. Kosongkan semua order dummy
    setOrders([]);
    // 2. Kosongkan semua client dummy
    setClients([]);
    
    // 3. Pertahankan Super Admin resmi (officialkiraaparel@gmail.com) dan akun kustom yang dibuat pengguna
    const officialAndCustomUsers = users.filter(
      u => u.email.toLowerCase() === 'officialkiraaparel@gmail.com' || u.id === 'usr_superadmin' || (!u.id.startsWith('usr_admin') && !u.id.startsWith('usr_marketing') && !u.id.startsWith('usr_produksi') && !u.id.startsWith('usr_client'))
    );
    
    const finalUsers: User[] = officialAndCustomUsers.length > 0 
      ? officialAndCustomUsers 
      : [OFFICIAL_SUPERADMIN_USER];

    setUsers(finalUsers);
    setCurrentUser(OFFICIAL_SUPERADMIN_USER);
    setIsAuth(true);

    // 4. Notifikasi awal sistem siap pakai
    const cleanNotif: AppNotification = {
      id: `notif_clean_${Date.now()}`,
      title: 'Sistem Siap Digunakan (Clean State)',
      message: 'Data dummy (pesanan sampel, invoice contoh, dan klien demo) telah berhasil dibersihkan. Sistem siap untuk operasional produksi dan pendaftaran staf resmi Kira Apparel.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications([cleanNotif]);

    // 5. Force save ke localStorage
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(finalUsers));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(OFFICIAL_SUPERADMIN_USER));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([cleanNotif]));
  };

  const loadDemoData = () => {
    setOrders(INITIAL_ORDERS);
    setClients(INITIAL_CLIENTS);
    setUsers(MOCK_USERS);
    setCurrentUser(MOCK_USERS[0]);
    setIsAuth(true);
    const demoNotifs: AppNotification[] = [
      {
        id: 'notif_1',
        title: 'Desain Menunggu Persetujuan',
        message: 'Order KA-20260822-002 (Gowes Bandung) menunggu persetujuan desain dari client.',
        orderId: 'ord_2',
        type: 'design',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif_2',
        title: 'Progress Jahit Berjalan',
        message: 'Order KA-20260828-001 (Garuda FC) mencapai 65% progress di workshop.',
        orderId: 'ord_1',
        type: 'production',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];
    setNotifications(demoNotifs);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(MOCK_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(demoNotifs));
  };

  // CLIENT CRUD
  const addClient = (clientData: Omit<Client, 'id' | 'clientId' | 'totalOrders' | 'totalSpent' | 'createdAt'>): Client => {
    const sequence = clients.length + 1;
    const newClient: Client = {
      ...clientData,
      id: `clt_${Date.now()}`,
      clientId: `CLT-${String(sequence).padStart(3, '0')}`,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setClients(prev => [newClient, ...prev]);
    addNotification('Client Baru Ditambahkan', `Client ${newClient.name} (${newClient.company}) berhasil didaftarkan.`, undefined, 'order');
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // ORDER CRUD
  const createOrder = (orderData: Partial<Order>): Order => {
    const sequence = orders.length + 1;
    const orderNumber = generateOrderNumber(sequence, settings.orderPrefix);
    const spkNumber = generateSpkNumber(sequence, settings.spkPrefix);
    const invoiceNumber = generateInvoiceNumber(sequence, settings.invoicePrefix);

    const client = clients.find(c => c.id === orderData.clientId);
    const clientName = orderData.clientName || client?.name || 'Client Tanpa Nama';
    const clientCompany = orderData.clientCompany || client?.company || '-';
    const clientPhone = orderData.clientPhone || client?.phone || '';
    const clientAddress = orderData.clientAddress || client?.address || '';

    const qty = Number(orderData.quantity) || 0;
    const unitPrice = Number(orderData.unitPrice) || 0;
    const subtotal = qty * unitPrice;
    const discount = Number(orderData.discount) || 0;
    const shippingCost = Number(orderData.shippingCost) || 0;
    const totalAmount = Math.max(0, subtotal - discount + shippingCost);
    const downPayment = Number(orderData.downPayment) || 0;
    const remainingBalance = Math.max(0, totalAmount - downPayment);

    // Build production stages
    const stages = INITIAL_PRODUCTION_STAGES.map((st, idx) => ({
      id: st.id,
      name: st.name,
      percentage: st.percentage,
      status: idx === 0 ? ('in_progress' as const) : ('pending' as const),
      startedAt: idx === 0 ? new Date().toISOString() : undefined,
    }));

    const initialVersion: DesignVersion = {
      version: 1,
      image1: orderData.image1 || 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=800&auto=format&fit=crop&q=80',
      image2: orderData.image2 || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      notes: orderData.notes || 'Versi awal referensi desain',
      status: 'Menunggu Persetujuan',
      createdAt: new Date().toISOString(),
    };

    const initialInvoice: Invoice = {
      invoiceNumber,
      orderId: `ord_${Date.now()}`,
      date: orderData.orderDate || new Date().toISOString().split('T')[0],
      dueDate: orderData.deadline || new Date().toISOString().split('T')[0],
      subtotal,
      discount,
      shippingCost,
      total: totalAmount,
      downPayment,
      remainingBalance,
      status: downPayment >= totalAmount ? 'Lunas' : downPayment > 0 ? 'DP' : 'Menunggu Pembayaran',
      notes: 'Terima kasih atas kepercayaan Anda memesan di Kira Aparel.',
    };

    const initialPayments: Payment[] = [];
    if (downPayment > 0) {
      initialPayments.push({
        id: `pay_${Date.now()}`,
        paymentNumber: `PAY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-001`,
        invoiceNumber,
        orderId: `ord_${Date.now()}`,
        date: new Date().toISOString(),
        amount: downPayment,
        method: 'Transfer Bank',
        proofUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
        notes: 'DP Pembayaran Awal',
        status: 'Terverifikasi',
        verifiedAt: new Date().toISOString(),
        verifiedBy: currentUser.name,
      });
    }

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      clientId: orderData.clientId || 'clt_custom',
      clientName,
      clientCompany,
      clientPhone,
      clientEmail: orderData.clientEmail || client?.email,
      clientAddress,
      marketingId: currentUser.id,
      marketingName: currentUser.name,
      orderDate: orderData.orderDate || new Date().toISOString().split('T')[0],
      deadline: orderData.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      productType: orderData.productType || 'Kaos Jersey',
      quantity: qty,
      sizeDetails: orderData.sizeDetails || {
        XS: 0,
        S: 0,
        M: qty,
        L: 0,
        XL: 0,
        XXL: 0,
        '3XL': 0,
        '4XL': 0,
        '5XL': 0,
      },
      collarModel: orderData.collarModel || 'O-Neck',
      sleeveModel: orderData.sleeveModel || 'Pendek',
      fabric: orderData.fabric || 'Dryfit Milano Premium (160 gsm)',
      colorNotes: orderData.colorNotes || 'Standar',
      notes: orderData.notes || '',
      // KIRA Apparel Official Detail Order Specifics
      poNumber: orderData.poNumber || '',
      orderTitle: orderData.orderTitle || clientCompany || 'CUSTOM ORDER',
      fabricDetail: orderData.fabricDetail || orderData.fabric || 'MILANO',
      necktape: orderData.necktape || 'KIRA',
      sizeLabel: orderData.sizeLabel || 'KIRA',
      logoRightChest: orderData.logoRightChest || 'PRINTING',
      logoLeftChest: orderData.logoLeftChest || 'PRINTING',
      backText: orderData.backText || 'PRINTING',
      stitchingNotes: orderData.stitchingNotes || orderData.productionNotes || '- KAM 3 JARUM\n- KERAH O-NECT',
      fontRef: orderData.fontRef || 'INTRO RUST',
      colorSwatches: orderData.colorSwatches || [
        { hex: '#a9d5f7', label: '#a9d5f7' },
        { hex: '#ffffff', label: '#ffffff' },
      ],
      badgeThumbnails: orderData.badgeThumbnails || [
        {
          url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=100&auto=format&fit=crop&q=80',
          label: 'logo dada',
        },
      ],
      sleeveBreakdown: orderData.sleeveBreakdown || {
        shortSleeve: orderData.sleeveModel === 'Pendek' ? (orderData.sizeDetails || {}) : {},
        longSleeve: orderData.sleeveModel === 'Panjang' ? (orderData.sizeDetails || {}) : {},
        kids: {},
      },
      unitPrice,
      subtotal,
      discount,
      shippingCost,
      totalAmount,
      downPayment,
      remainingBalance,
      image1: initialVersion.image1,
      image2: initialVersion.image2,
      designStatus: 'Menunggu Persetujuan',
      currentDesignVersion: 1,
      designVersions: [initialVersion],
      spkNumber,
      spkIssuedAt: undefined,
      productionNotes: orderData.productionNotes || '',
      currentStageId: 'MENUNGGU_DESAIN',
      progressPercentage: 15,
      productionStages: stages,
      productionPhotos: [],
      invoice: initialInvoice,
      payments: initialPayments,
      status: 'Persetujuan Desain',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update Client Stats
    if (orderData.clientId) {
      setClients(prev =>
        prev.map(c =>
          c.id === orderData.clientId
            ? {
                ...c,
                totalOrders: c.totalOrders + 1,
                totalSpent: c.totalSpent + totalAmount,
              }
            : c
        )
      );
    }

    setOrders(prev => [newOrder, ...prev]);
    addNotification('Order Baru Dibuat', `Pesanan ${newOrder.orderNumber} (${newOrder.clientName}) berhasil dibuat oleh ${currentUser.name}.`, newOrder.id, 'order');
    
    // Auto sync to Google Sheets if connected
    appendOrderToGoogleSheets(newOrder).catch(() => {});

    return newOrder;
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== id) return o;
        const updated = { ...o, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      })
    );
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  // DESIGN
  const uploadDesignVersion = (orderId: string, image1: string, image2: string, notes?: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const nextVer = o.currentDesignVersion + 1;
        const newVersion: DesignVersion = {
          version: nextVer,
          image1: image1 || o.image1,
          image2: image2 || o.image2,
          notes: notes || `Versi ${nextVer}`,
          status: 'Menunggu Persetujuan',
          createdAt: new Date().toISOString(),
        };

        const updated: Order = {
          ...o,
          image1: newVersion.image1,
          image2: newVersion.image2,
          currentDesignVersion: nextVer,
          designStatus: 'Menunggu Persetujuan',
          designVersions: [newVersion, ...o.designVersions],
          status: 'Persetujuan Desain',
          updatedAt: new Date().toISOString(),
        };
        return updated;
      })
    );
    addNotification('Versi Desain Baru Diunggah', `Versi desain baru untuk order telah diunggah dan siap disetujui.`, orderId, 'design');
  };

  const updateDesignStatus = (orderId: string, status: DesignStatus, revisionNotes?: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const currentVer = o.currentDesignVersion;
        const updatedVersions = o.designVersions.map(v => {
          if (v.version === currentVer) {
            return {
              ...v,
              status,
              approvedAt: status === 'Disetujui' ? new Date().toISOString() : undefined,
              approvedBy: status === 'Disetujui' ? currentUser.name : undefined,
              revisionNotes: status === 'Revisi' ? revisionNotes : undefined,
            };
          }
          return v;
        });

        let nextStageId = o.currentStageId;
        let progress = o.progressPercentage;
        let orderStatus = o.status;

        if (status === 'Disetujui') {
          nextStageId = 'MENUNGGU_PRODUKSI';
          progress = 30;
          orderStatus = 'SPK Diterbitkan';
        }

        const stages = o.productionStages.map(st => {
          if (status === 'Disetujui' && (st.id === 'ORDER_MASUK' || st.id === 'MENUNGGU_DESAIN' || st.id === 'DESAIN_DISETUJUI')) {
            return { ...st, status: 'completed' as const, completedAt: new Date().toISOString() };
          }
          return st;
        });

        return {
          ...o,
          designStatus: status,
          designVersions: updatedVersions,
          currentStageId: nextStageId,
          progressPercentage: progress,
          productionStages: stages,
          status: orderStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    addNotification(
      status === 'Disetujui' ? 'Desain Disetujui' : 'Permintaan Revisi Desain',
      `Status desain order diubah menjadi ${status} oleh ${currentUser.name}.`,
      orderId,
      'design'
    );
  };

  // PRODUCTION
  const advanceProductionStage = (orderId: string, nextStageId: ProductionStageId, stageNote?: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const stageIndex = INITIAL_PRODUCTION_STAGES.findIndex(s => s.id === nextStageId);
        const stageDef = INITIAL_PRODUCTION_STAGES[stageIndex];
        const newProgress = stageDef ? stageDef.percentage : o.progressPercentage;

        let newOrderStatus = o.status;
        if (nextStageId === 'SELESAI') newOrderStatus = 'Selesai';
        else if (nextStageId === 'DIKIRIM') newOrderStatus = 'Dikirim';
        else if (nextStageId === 'SIAP_DIKIRIM') newOrderStatus = 'Siap Dikirim';
        else if (stageIndex >= 4) newOrderStatus = 'Sedang Produksi';

        const updatedStages = o.productionStages.map((st, idx) => {
          if (idx < stageIndex) {
            return { ...st, status: 'completed' as const, completedAt: st.completedAt || new Date().toISOString() };
          } else if (idx === stageIndex) {
            return {
              ...st,
              status: 'in_progress' as const,
              startedAt: new Date().toISOString(),
              updatedBy: currentUser.name,
              notes: stageNote || st.notes,
            };
          } else {
            return { ...st, status: 'pending' as const };
          }
        });

        return {
          ...o,
          currentStageId: nextStageId,
          progressPercentage: newProgress,
          productionStages: updatedStages,
          status: newOrderStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    addNotification('Tahap Produksi Diperbarui', `Order telah memasuki tahap: ${nextStageId}`, orderId, 'production');
  };

  const addProductionPhoto = (orderId: string, stageId: ProductionStageId, photoUrl: string, caption: string) => {
    const stageDef = INITIAL_PRODUCTION_STAGES.find(s => s.id === stageId);
    const newPhoto: ProductionPhoto = {
      id: `pht_${Date.now()}`,
      stageId,
      stageName: stageDef?.name || stageId,
      photoUrl,
      caption,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
    };

    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          productionPhotos: [newPhoto, ...o.productionPhotos],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    addNotification('Foto Progress Baru', `Foto progress produksi (${stageDef?.name}) berhasil diunggah.`, orderId, 'production');
  };

  const addProductionNote = (orderId: string, stageId: ProductionStageId, noteText: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const updatedStages = o.productionStages.map(st => (st.id === stageId ? { ...st, notes: noteText, updatedBy: currentUser.name } : st));
        return { ...o, productionStages: updatedStages, updatedAt: new Date().toISOString() };
      })
    );
  };

  // SPK
  const issueSPK = (orderId: string, customNotes?: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          spkIssuedAt: new Date().toISOString(),
          productionNotes: customNotes || o.productionNotes,
          status: o.status === 'Draft' || o.status === 'Persetujuan Desain' ? 'SPK Diterbitkan' : o.status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    addNotification('SPK Diterbitkan', `Surat Perintah Kerja (SPK) resmi diterbitkan dan siap dikerjakan produksi.`, orderId, 'production');
  };

  // PAYMENTS & INVOICE
  const addPayment = (orderId: string, paymentData: { amount: number; method: any; proofUrl?: string; notes?: string }) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const paymentNumber = `PAY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(o.payments.length + 1).padStart(3, '0')}`;
        const newPay: Payment = {
          id: `pay_${Date.now()}`,
          paymentNumber,
          invoiceNumber: o.invoice.invoiceNumber,
          orderId,
          date: new Date().toISOString(),
          amount: Number(paymentData.amount) || 0,
          method: paymentData.method,
          proofUrl: paymentData.proofUrl || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
          notes: paymentData.notes || 'Pembayaran oleh client/marketing',
          status: 'Menunggu Verifikasi',
        };
        return {
          ...o,
          payments: [newPay, ...o.payments],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    addNotification('Pembayaran Baru Masuk', `Pembayaran sebesar Rp ${paymentData.amount.toLocaleString('id-ID')} masuk dan menunggu verifikasi Admin.`, orderId, 'payment');
  };

  const verifyPayment = (orderId: string, paymentId: string, isApproved: boolean) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        let verifiedTotal = 0;
        const updatedPayments = o.payments.map(p => {
          if (p.id === paymentId) {
            const nextStatus: Payment['status'] = isApproved ? 'Terverifikasi' : 'Ditolak';
            if (isApproved) verifiedTotal += p.amount;
            return {
              ...p,
              status: nextStatus,
              verifiedAt: new Date().toISOString(),
              verifiedBy: currentUser.name,
            };
          }
          if (p.status === 'Terverifikasi') {
            verifiedTotal += p.amount;
          }
          return p;
        });

        const newRemaining = Math.max(0, o.totalAmount - verifiedTotal);
        let newInvStatus: Invoice['status'] = o.invoice.status;
        if (newRemaining <= 0) newInvStatus = 'Lunas';
        else if (verifiedTotal > 0) newInvStatus = 'DP';
        else newInvStatus = 'Menunggu Pembayaran';

        const updatedInvoice: Invoice = {
          ...o.invoice,
          downPayment: verifiedTotal,
          remainingBalance: newRemaining,
          status: newInvStatus,
        };

        return {
          ...o,
          payments: updatedPayments,
          downPayment: verifiedTotal,
          remainingBalance: newRemaining,
          invoice: updatedInvoice,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    addNotification('Verifikasi Pembayaran', isApproved ? 'Pembayaran berhasil diverifikasi Admin.' : 'Pembayaran ditolak Admin.', orderId, 'payment');
  };

  const updateInvoice = (orderId: string, updates: Partial<Invoice>) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          invoice: { ...o.invoice, ...updates },
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // SHIPMENT
  const updateShipment = (orderId: string, shipmentData: Partial<Shipment>) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const newShipment: Shipment = {
          orderId,
          courier: shipmentData.courier || o.shipment?.courier || 'JNE Express',
          trackingNumber: shipmentData.trackingNumber || o.shipment?.trackingNumber || '',
          shippedAt: shipmentData.shippedAt || new Date().toISOString(),
          estimatedArrival: shipmentData.estimatedArrival || o.deadline,
          notes: shipmentData.notes || o.shipment?.notes,
          status: shipmentData.status || 'Dalam Pengiriman',
        };
        return {
          ...o,
          shipment: newShipment,
          currentStageId: 'DIKIRIM',
          progressPercentage: 98,
          status: 'Dikirim',
          updatedAt: new Date().toISOString(),
        };
      })
    );
    addNotification('Informasi Pengiriman Diperbarui', `Order ${orderId} telah dikirim dengan nomor resi ${shipmentData.trackingNumber}`, orderId, 'shipment');
  };

  // SETTINGS
  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // NOTIFICATIONS
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getClientOrders = (): Order[] => {
    if (currentUser.role === 'client' && currentUser.clientId) {
      return orders.filter(o => o.clientId === currentUser.clientId);
    }
    return orders;
  };

  return (
    <AppContext.Provider
      value={{
        isAuth,
        currentUser,
        users,
        clients,
        orders,
        notifications,
        settings,
        login,
        logout,
        switchUser,
        quickSwitchRole,
        registerUser,
        approveUser,
        rejectUser,
        addUserByAdmin,
        updateUser,
        deleteUser,
        clearDummyData,
        loadDemoData,
        addClient,
        updateClient,
        deleteClient,
        createOrder,
        updateOrder,
        deleteOrder,
        uploadDesignVersion,
        updateDesignStatus,
        advanceProductionStage,
        addProductionPhoto,
        addProductionNote,
        issueSPK,
        addPayment,
        verifyPayment,
        updateInvoice,
        updateShipment,
        updateSettings,
        markNotificationRead,
        clearAllNotifications,
        getClientOrders,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
