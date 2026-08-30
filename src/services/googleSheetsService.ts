/**
 * Google Sheets Database Service for KIRA APPAREL
 * Spreadsheet ID: 1zPrkHaGCO6ftj8OQ3Cndf1wzp8tJF-VE1g156rzP1L8
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { Client, Order, ProductionStageId, User as AppUser } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export const SPREADSHEET_ID = '1zPrkHaGCO6ftj8OQ3Cndf1wzp8tJF-VE1g156rzP1L8';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=sharing`;

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

// Firebase App & Auth Initialization
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

const googleProvider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => googleProvider.addScope(scope));

let cachedAccessToken: string | null = localStorage.getItem('kira_google_access_token');
let tokenExpiresAt: number = parseInt(localStorage.getItem('kira_google_token_exp') || '0', 10);
let authenticatedGoogleUser: FirebaseUser | null = null;

// Track auth changes
onAuthStateChanged(auth, (user) => {
  authenticatedGoogleUser = user;
  if (!user && !cachedAccessToken) {
    cachedAccessToken = null;
  }
});

export const SHEETS_CONFIG = {
  ORDERS_SHEET: 'Pesanan',
  CLIENTS_SHEET: 'Pelanggan',
  PRODUCTION_SHEET: 'Produksi_Workshop',
  USERS_SHEET: 'Users_Manajemen_Akses',
};

export function hasValidGoogleToken(): boolean {
  if (!cachedAccessToken) return false;
  if (tokenExpiresAt && Date.now() > tokenExpiresAt) {
    return false;
  }
  return true;
}

export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

export function getAuthenticatedGoogleUser(): FirebaseUser | null {
  return authenticatedGoogleUser;
}

export function setManualAccessToken(token: string, expiresInSeconds: number = 3600): void {
  cachedAccessToken = token.trim();
  tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem('kira_google_access_token', cachedAccessToken);
  localStorage.setItem('kira_google_token_exp', tokenExpiresAt.toString());
}

/**
 * Request Access Token using Firebase Auth popup or GSI Token Client fallback
 */
export async function requestGoogleAccessToken(): Promise<string> {
  // If we already have a valid unexpired token, return it
  if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  // Method 1: Try Firebase Auth signInWithPopup with Workspace Scopes
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      tokenExpiresAt = Date.now() + 3600 * 1000;
      localStorage.setItem('kira_google_access_token', cachedAccessToken);
      localStorage.setItem('kira_google_token_exp', tokenExpiresAt.toString());
      authenticatedGoogleUser = result.user;
      return cachedAccessToken;
    }
  } catch (firebaseErr: any) {
    console.warn('Firebase signInWithPopup prompt failed or popup was closed, trying GIS tokenClient...', firebaseErr);
  }

  // Method 2: Fallback to Google Identity Services (GSI) Token Client
  return new Promise((resolve, reject) => {
    try {
      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services belum dimuat di browser. Pastikan koneksi internet aktif.');
      }

      const clientId = firebaseConfig.oAuthClientId || '26099607068-4pk6vnamf0fo1uj6940v9gpnjrtjjhpa.apps.googleusercontent.com';

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: WORKSPACE_SCOPES.join(' '),
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }
          cachedAccessToken = tokenResponse.access_token;
          const expiresIn = parseInt(tokenResponse.expires_in || '3599', 10);
          tokenExpiresAt = Date.now() + expiresIn * 1000;
          localStorage.setItem('kira_google_access_token', cachedAccessToken || '');
          localStorage.setItem('kira_google_token_exp', tokenExpiresAt.toString());
          resolve(tokenResponse.access_token);
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

export async function disconnectGoogle(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    // ignore
  }
  cachedAccessToken = null;
  tokenExpiresAt = 0;
  authenticatedGoogleUser = null;
  localStorage.removeItem('kira_google_access_token');
  localStorage.removeItem('kira_google_token_exp');
}

/**
 * Test Connection & Verify Access to the Spreadsheet
 */
export async function testSpreadsheetConnection(): Promise<{ success: boolean; spreadsheetTitle?: string; sheets?: string[]; error?: string }> {
  try {
    const data = await fetchSheetsApi('');
    return {
      success: true,
      spreadsheetTitle: data.properties?.title || 'Spreadsheet KIRA',
      sheets: data.sheets?.map((s: any) => s.properties?.title) || [],
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal membaca spreadsheet',
    };
  }
}

// Low-level fetch wrapper for Google Sheets API v4
async function fetchSheetsApi(endpoint: string, options: RequestInit = {}) {
  let token = cachedAccessToken;
  if (!token || (tokenExpiresAt && Date.now() > tokenExpiresAt)) {
    token = await requestGoogleAccessToken();
  }

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      parsedMsg = errJson.error?.message || errText;
    } catch (e) {
      // ignore
    }
    throw new Error(`Google Sheets API Error (${res.status}): ${parsedMsg}`);
  }

  return res.json();
}

/**
 * Initialize Sheets Tabs & Headers if they don't exist yet
 */
export async function initializeSpreadsheetTabs(): Promise<{ success: boolean; message: string }> {
  try {
    const spreadsheet = await fetchSheetsApi('');
    const existingSheets: string[] = spreadsheet.sheets?.map((s: any) => s.properties?.title) || [];

    const sheetsToCreate: string[] = [];
    if (!existingSheets.includes(SHEETS_CONFIG.ORDERS_SHEET)) sheetsToCreate.push(SHEETS_CONFIG.ORDERS_SHEET);
    if (!existingSheets.includes(SHEETS_CONFIG.CLIENTS_SHEET)) sheetsToCreate.push(SHEETS_CONFIG.CLIENTS_SHEET);
    if (!existingSheets.includes(SHEETS_CONFIG.PRODUCTION_SHEET)) sheetsToCreate.push(SHEETS_CONFIG.PRODUCTION_SHEET);
    if (!existingSheets.includes(SHEETS_CONFIG.USERS_SHEET)) sheetsToCreate.push(SHEETS_CONFIG.USERS_SHEET);

    if (sheetsToCreate.length > 0) {
      const addSheetRequests意识 = sheetsToCreate.map(title => ({
        addSheet: {
          properties: {
            title,
            gridProperties: { rowCount: 1000, columnCount: 26 },
          },
        },
      }));

      await fetchSheetsApi(':batchUpdate', {
        method: 'POST',
        body: JSON.stringify({ requests: addSheetRequests意识 }),
      });
    }

    // Set Column Headers for each sheet
    const ordersHeader = [
      'ID',
      'No. Order',
      'No. SPK',
      'No. Invoice',
      'Nama Klien / PIC',
      'Instansi / Tim',
      'No. WhatsApp',
      'Tipe Produk',
      'Bahan Kain',
      'Model Kerah',
      'Model Lengan',
      'Jumlah (Pcs)',
      'Harga Satuan (Rp)',
      'Total Biaya (Rp)',
      'Status Desain',
      'Tahap Produksi',
      'Status Bayar',
      'Sudah Dibayar (Rp)',
      'Sisa Tagihan (Rp)',
      'Tanggal Masuk',
      'Deadline',
      'No. Resi Pengiriman',
      'Kurir / Ekspedisi',
      'Catatan Desain',
      'Link Gambar 1',
      'Link Gambar 2',
    ];

    const clientsHeader = [
      'ID Pelanggan',
      'Nama Klien / PIC',
      'Nama Tim / Instansi',
      'No. WhatsApp',
      'Email',
      'Alamat Pengiriman',
      'Total Pesanan',
      'Total Belanja (Rp)',
      'Tanggal Bergabung',
      'Catatan',
    ];

    const productionHeader = [
      'No. Order',
      'No. SPK',
      'Nama Tim',
      'Tahap Saat Ini',
      'Bahan & Spek',
      'Qty Detail',
      'Total Qty',
      'Status Cutting',
      'Status Printing Sublim',
      'Status Jahit Kam 3 Jarum',
      'Status Quality Control',
      'Status Packing & Resi',
      'Deadline Produksi',
      'Catatan Workshop',
    ];

    const usersHeader = [
      'ID Pengguna',
      'Nama Lengkap',
      'Email / Username Akun',
      'Password (Plain Text)',
      'Role / Tingkat Akses',
      'Status Akun',
      'No. WhatsApp',
      'Tingkat Otorisasi',
      'Wewenang & Hak Akses Detail',
      'Tanggal Registrasi',
      'Disetujui Oleh',
      'Catatan Divisi',
    ];

    await Promise.all([
      fetchSheetsApi(`/values/${SHEETS_CONFIG.ORDERS_SHEET}!A1:Z1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ values: [ordersHeader] }),
      }),
      fetchSheetsApi(`/values/${SHEETS_CONFIG.CLIENTS_SHEET}!A1:J1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ values: [clientsHeader] }),
      }),
      fetchSheetsApi(`/values/${SHEETS_CONFIG.PRODUCTION_SHEET}!A1:N1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ values: [productionHeader] }),
      }),
      fetchSheetsApi(`/values/${SHEETS_CONFIG.USERS_SHEET}!A1:L1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ values: [usersHeader] }),
      }),
    ]);

    return { success: true, message: 'Google Sheets berhasil diinisialisasi dengan struktur tabel KIRA APPAREL.' };
  } catch (err: any) {
    console.error('Failed to init sheets:', err);
    throw err;
  }
}

/**
 * Export all users, roles, plain text passwords, and permissions to Google Sheets
 */
export async function exportUsersToGoogleSheets(users: AppUser[]): Promise<number> {
  await initializeSpreadsheetTabs();

  const getRoleAuthority = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Level 5 (Tertinggi / Direksi)';
      case 'admin': return 'Level 4 (Operasional & Keuangan)';
      case 'marketing': return 'Level 3 (Sales & Order Entry)';
      case 'produksi': return 'Level 3 (Workshop & Monitoring)';
      case 'client': return 'Level 1 (Pelanggan / Portal Mandiri)';
      default: return 'Level 1';
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Full Access: Manajemen User & Approval Pendaftar, Hapus Data Dummy Go-Live, Finansial & Kas, Override SPK/Invoice, Sinkronisasi Google Sheets';
      case 'admin':
        return 'Operasional: Buat Order/SPK, Verifikasi Slip Pembayaran Kas, Update Status Produksi, Kelola Klien, Cetak Invoice & Export Laporan';
      case 'marketing':
        return 'Sales: Input Order Baru, Input Detail Jersey, Upload Desain & Mockup, Catat Pembayaran DP (Tidak bisa hapus order & tidak bisa verifikasi pembayaran kas sendiri)';
      case 'produksi':
        return 'Workshop: Lihat SPK Produksi, Update 13 Tahap Progres Produksi (Cutting, Printing, Jahit, QC, Packing), Upload Dokumentasi Produksi';
      case 'client':
        return 'Client Portal: Tracking Pesanan Real-time via Resi/No. Order, Download Invoice & Kuitansi, Upload Bukti Transfer DP';
      default:
        return 'Akses Terbatas';
    }
  };

  const rows = users.map(u => [
    u.id,
    u.name,
    u.email,
    u.password || 'kira2026',
    u.role,
    u.status === 'active' ? 'Aktif (Disetujui)' : u.status === 'pending_approval' ? 'Menunggu Approval' : 'Ditolak / Nonaktif',
    u.phone || '-',
    getRoleAuthority(u.role),
    getRolePermissions(u.role),
    u.registeredAt || '2026-08-01',
    u.approvedBy || (u.role === 'super_admin' ? 'System Master' : 'Super Admin'),
    u.notes || '-',
  ]);

  await fetchSheetsApi(`/values/${SHEETS_CONFIG.USERS_SHEET}!A2:L1000:clear`, {
    method: 'POST',
  }).catch(() => {});

  if (rows.length > 0) {
    await fetchSheetsApi(`/values/${SHEETS_CONFIG.USERS_SHEET}!A2:L${rows.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values: rows }),
    });
  }

  return rows.length;
}

/**
 * Export all local orders to Google Sheets
 */
export async function exportOrdersToGoogleSheets(orders: Order[]): Promise<number> {
  await initializeSpreadsheetTabs();

  const rows = orders.map(order => [
    order.id,
    order.orderNumber,
    order.spkNumber || '-',
    order.invoice?.invoiceNumber || '-',
    order.clientName,
    order.clientCompany,
    order.clientPhone,
    order.productType,
    order.fabric,
    order.collarModel || 'O-Neck',
    order.sleeveModel || 'Pendek',
    order.quantity,
    order.unitPrice,
    order.totalAmount,
    order.designStatus,
    order.currentStageId,
    order.invoice?.status || 'Menunggu Pembayaran',
    order.invoice?.downPayment || 0,
    order.invoice?.remainingBalance || order.totalAmount,
    order.orderDate,
    order.deadline,
    order.shipment?.trackingNumber || '-',
    order.shipment?.courier || '-',
    order.notes || '-',
    order.image1 || '',
    order.image2 || '',
  ]);

  await fetchSheetsApi(`/values/${SHEETS_CONFIG.ORDERS_SHEET}!A2:Z1000:clear`, {
    method: 'POST',
  }).catch(() => {});

  if (rows.length > 0) {
    await fetchSheetsApi(`/values/${SHEETS_CONFIG.ORDERS_SHEET}!A2:Z${rows.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values: rows }),
    });
  }

  // Also sync production sheet
  const prodRows = orders.map(order => {
    const sizeDetails = order.sizeDetails
      ? `S:${order.sizeDetails.S || 0}, M:${order.sizeDetails.M || 0}, L:${order.sizeDetails.L || 0}, XL:${order.sizeDetails.XL || 0}, 3XL:${order.sizeDetails['3XL'] || 0}`
      : `Total ${order.quantity} pcs`;

    return [
      order.orderNumber,
      order.spkNumber || '-',
      order.clientCompany,
      order.currentStageId,
      `${order.fabric} (${order.collarModel}, ${order.sleeveModel})`,
      sizeDetails,
      order.quantity,
      order.productionStages?.find(s => s.id === 'CUTTING')?.status === 'completed' ? 'Selesai' : 'Pending',
      order.productionStages?.find(s => s.id === 'PRINTING')?.status === 'completed' ? 'Selesai' : 'Pending',
      order.productionStages?.find(s => s.id === 'JAHIT')?.status === 'completed' ? 'Selesai' : 'Pending',
      order.productionStages?.find(s => s.id === 'QC')?.status === 'completed' ? 'Selesai' : 'Pending',
      order.productionStages?.find(s => s.id === 'PACKING')?.status === 'completed' ? 'Selesai' : 'Pending',
      order.deadline,
      order.productionNotes || 'Tim Workshop KIRA',
    ];
  });

  await fetchSheetsApi(`/values/${SHEETS_CONFIG.PRODUCTION_SHEET}!A2:N1000:clear`, {
    method: 'POST',
  }).catch(() => {});

  if (prodRows.length > 0) {
    await fetchSheetsApi(`/values/${SHEETS_CONFIG.PRODUCTION_SHEET}!A2:N${prodRows.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values: prodRows }),
    });
  }

  return rows.length;
}

/**
 * Export all clients to Google Sheets
 */
export async function exportClientsToGoogleSheets(clients: Client[]): Promise<number> {
  await initializeSpreadsheetTabs();

  const rows = clients.map(c => [
    c.clientId || c.id,
    c.name,
    c.company,
    c.phone,
    c.email || '-',
    c.address || '-',
    c.totalOrders || 0,
    c.totalSpent || 0,
    c.createdAt || new Date().toISOString().split('T')[0],
    c.notes || '-',
  ]);

  await fetchSheetsApi(`/values/${SHEETS_CONFIG.CLIENTS_SHEET}!A2:J1000:clear`, {
    method: 'POST',
  }).catch(() => {});

  if (rows.length > 0) {
    await fetchSheetsApi(`/values/${SHEETS_CONFIG.CLIENTS_SHEET}!A2:J${rows.length + 1}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values: rows }),
    });
  }

  return rows.length;
}

/**
 * Append a single newly created Order to Google Sheets
 */
export async function appendOrderToGoogleSheets(order: Order): Promise<void> {
  try {
    if (!hasValidGoogleToken()) return;

    const row = [
      order.id,
      order.orderNumber,
      order.spkNumber || '-',
      order.invoice?.invoiceNumber || '-',
      order.clientName,
      order.clientCompany,
      order.clientPhone,
      order.productType,
      order.fabric,
      order.collarModel || 'O-Neck',
      order.sleeveModel || 'Pendek',
      order.quantity,
      order.unitPrice,
      order.totalAmount,
      order.designStatus,
      order.currentStageId,
      order.invoice?.status || 'Menunggu Pembayaran',
      order.invoice?.downPayment || 0,
      order.invoice?.remainingBalance || order.totalAmount,
      order.orderDate,
      order.deadline,
      order.shipment?.trackingNumber || '-',
      order.shipment?.courier || '-',
      order.notes || '-',
      order.image1 || '',
      order.image2 || '',
    ];

    await fetchSheetsApi(`/values/${SHEETS_CONFIG.ORDERS_SHEET}!A:Z:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify({ values: [row] }),
    });
  } catch (e) {
    console.warn('Silent failure appending order to Sheets:', e);
  }
}

/**
 * Import Orders from Google Sheets into Local App Data
 */
export async function fetchOrdersFromGoogleSheets(): Promise<Partial<Order>[]> {
  const data = await fetchSheetsApi(`/values/${SHEETS_CONFIG.ORDERS_SHEET}!A2:Z500`);
  const rows: any[][] = data.values || [];

  return rows.map((r) => {
    const id = r[0] || `ord-${Date.now()}`;
    const orderNumber = r[1] || 'KA-20260828-000';
    const clientName = r[4] || 'Klien';
    const clientCompany = r[5] || 'Komunitas';
    const clientPhone = r[6] || '08123456789';
    const productType = r[7] || 'Kaos Jersey';
    const fabric = r[8] || 'Dryfit Milano';
    const collarModel = r[9] || 'O-Neck';
    const sleeveModel = r[10] || 'Pendek';
    const quantity = parseInt(r[11] || '1', 10);
    const unitPrice = parseFloat(r[12] || '115000');
    const totalAmount = parseFloat(r[13] || (unitPrice * quantity).toString());
    const designStatus = r[14] || 'Disetujui';
    const currentStageId = (r[15] as ProductionStageId) || 'ORDER_MASUK';
    const invoiceStatus = r[16] || 'Menunggu Pembayaran';
    const downPayment = parseFloat(r[17] || '0');
    const remainingBalance = parseFloat(r[18] || totalAmount.toString());
    const orderDate = r[19] || new Date().toISOString().split('T')[0];
    const deadline = r[20] || new Date().toISOString().split('T')[0];
    const notes = r[23] || '';
    const image1 = r[24] || 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80';
    const image2 = r[25] || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80';

    return {
      id,
      orderNumber,
      clientName,
      clientCompany,
      clientPhone,
      productType: productType as any,
      fabric,
      collarModel: collarModel as any,
      sleeveModel: sleeveModel as any,
      quantity,
      unitPrice,
      subtotal: totalAmount,
      totalAmount,
      downPayment,
      remainingBalance,
      designStatus: designStatus as any,
      currentStageId,
      orderDate,
      deadline,
      notes,
      image1,
      image2,
      invoice: {
        invoiceNumber: r[3] || `INV-${orderNumber}`,
        orderId: id,
        date: orderDate,
        dueDate: deadline,
        subtotal: totalAmount,
        discount: 0,
        shippingCost: 0,
        total: totalAmount,
        downPayment,
        remainingBalance,
        status: invoiceStatus as any,
      },
    };
  });
}
