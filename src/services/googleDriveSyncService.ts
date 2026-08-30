/**
 * Google Drive Cloud Synchronization & Google Apps Script Service
 * Handles categorized folder management, file uploading (Bukti Transfer, SPK, Invoice, Desain),
 * and bidirectional sync between Kira Apparel Web App and Google Drive / Google Sheets.
 */

import { Client, DriveCategory, DriveSyncedFile, GoogleDriveConfig, Order, User } from '../types';
import { getGoogleAccessToken, requestGoogleAccessToken } from './googleSheetsService';

const APPS_SCRIPT_STORAGE_KEY = 'kira_apps_script_url';
const DRIVE_CONFIG_STORAGE_KEY = 'kira_drive_config';
const DRIVE_ARCHIVE_STORAGE_KEY = 'kira_drive_synced_files';

export const DEFAULT_DRIVE_CATEGORIES: {
  key: DriveCategory;
  folderName: string;
  label: string;
  description: string;
  iconName: string;
  color: string;
}[] = [
  {
    key: 'bukti_transfer',
    folderName: '01_Bukti_Transfer',
    label: 'Bukti Transfer Pembeli',
    description: 'Arsip struk pembayaran bank, mutasi transfer, dan QRIS pelunasan klien',
    iconName: 'Receipt',
    color: 'emerald',
  },
  {
    key: 'spk',
    folderName: '02_SPK_Produksi',
    label: 'SPK (Surat Perintah Kerja)',
    description: 'Dokumen instruksi kerja cutting, pola, printing sublim, jahit, & QC workshop',
    iconName: 'FileCheck2',
    color: 'blue',
  },
  {
    key: 'invoice',
    folderName: '03_Invoice_Kwitansi',
    label: 'Invoice & Kwitansi Tagihan',
    description: 'Faktur penagihan DP, pelunasan pesanan, dan kwitansi resmi KIRA APPAREL',
    iconName: 'FileText',
    color: 'amber',
  },
  {
    key: 'desain',
    folderName: '04_Desain_Mockup',
    label: 'Desain Jersey & Mockup',
    description: 'File visual desain depan/belakang, mockup persetujuan, dan aset logo tim',
    iconName: 'Palette',
    color: 'purple',
  },
];

// Default configuration
export function getGoogleDriveConfig(): GoogleDriveConfig {
  try {
    const raw = localStorage.getItem(DRIVE_CONFIG_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }

  const legacyScriptUrl = localStorage.getItem(APPS_SCRIPT_STORAGE_KEY) || '';
  return {
    appsScriptUrl: legacyScriptUrl,
    rootFolderName: 'KIRA_APPAREL_DATABASE',
    autoSyncOrders: true,
    autoUploadProof: true,
    autoUploadSPK: true,
    autoUploadInvoice: true,
    autoUploadDesign: true,
  };
}

export function saveGoogleDriveConfig(config: GoogleDriveConfig): void {
  localStorage.setItem(DRIVE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  if (config.appsScriptUrl) {
    localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, config.appsScriptUrl);
  }
}

/**
 * Get locally stored history of files synced to Google Drive
 */
export function getLocalDriveArchiveHistory(): DriveSyncedFile[] {
  try {
    const raw = localStorage.getItem(DRIVE_ARCHIVE_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }
  return [];
}

/**
 * Add a record to local synced files cache
 */
export function addLocalDriveArchiveRecord(record: DriveSyncedFile): void {
  const current = getLocalDriveArchiveHistory();
  const filtered = current.filter(item => item.id !== record.id);
  const updated = [record, ...filtered].slice(0, 200); // keep newest 200 records
  localStorage.setItem(DRIVE_ARCHIVE_STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Convert Browser File or Blob to Base64 String
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      // return full or raw base64 string
      resolve(res);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert Image URL to Base64 (Useful for SPK / Design images)
 */
export async function imageUrlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64 = await fileToBase64(blob);
    return { base64, mimeType: blob.type || 'image/jpeg' };
  } catch (err) {
    // If CORS blocks fetch, try fallback canvas rendering
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg', 0.9);
          resolve({ base64: dataURL, mimeType: 'image/jpeg' });
        } else {
          reject(new Error('Canvas context could not be created.'));
        }
      };
      img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`));
      img.src = url;
    });
  }
}

/**
 * Test Connection & Ping Google Apps Script Web App
 */
export async function pingAppsScriptWebApp(customUrl?: string): Promise<{
  success: boolean;
  message?: string;
  user?: string;
  spreadsheetTitle?: string;
  rootFolderUrl?: string;
  rootFolderId?: string;
  error?: string;
}> {
  const config = getGoogleDriveConfig();
  const scriptUrl = (customUrl || config.appsScriptUrl || '').trim();

  if (!scriptUrl) {
    return {
      success: false,
      error: 'URL Google Apps Script belum diatur. Silakan masukkan Web App URL yang berakhiran /exec.',
    };
  }

  try {
    // Try pinging via POST with action: 'ping'
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // using text/plain prevents CORS preflight in Apps Script
      },
      body: JSON.stringify({ action: 'ping' }),
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success) {
      if (data.rootFolderUrl) {
        saveGoogleDriveConfig({
          ...config,
          appsScriptUrl: scriptUrl,
          rootFolderId: data.rootFolderId,
          rootFolderUrl: data.rootFolderUrl,
          lastSyncedAt: new Date().toISOString(),
        });
      }
      return {
        success: true,
        message: data.message || 'Koneksi ke Google Apps Script Web App Berhasil!',
        user: data.user,
        spreadsheetTitle: data.spreadsheetTitle,
        rootFolderUrl: data.rootFolderUrl,
        rootFolderId: data.rootFolderId,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Respons Apps Script menandakan error.',
      };
    }
  } catch (err: any) {
    // Fallback: try GET with parameter action=ping
    try {
      const getUrl = scriptUrl.includes('?') ? `${scriptUrl}&action=ping` : `${scriptUrl}?action=ping`;
      const getRes = await fetch(getUrl);
      if (getRes.ok) {
        const getData = await getRes.json();
        if (getData.success) {
          return {
            success: true,
            message: getData.message || 'Koneksi Google Apps Script Aktif (via GET)!',
            user: getData.user,
            rootFolderUrl: getData.rootFolderUrl,
            rootFolderId: getData.rootFolderId,
          };
        }
      }
    } catch (fallbackErr) {
      // ignore
    }

    return {
      success: false,
      error: `Gagal menghubungi Google Apps Script: ${err.message || 'Pastikan deployment Web App disetel ke "Anyone / Siapa saja".'}`,
    };
  }
}

/**
 * Initialize Standard Folder Structure on Google Drive
 */
export async function initDriveFoldersViaAppsScript(): Promise<{
  success: boolean;
  message?: string;
  rootFolderUrl?: string;
  categories?: Record<string, any>;
  error?: string;
}> {
  const config = getGoogleDriveConfig();
  const scriptUrl = (config.appsScriptUrl || '').trim();

  if (!scriptUrl) {
    return {
      success: false,
      error: 'URL Google Apps Script belum dikonfigurasi. Masukkan Web App URL di tab Setup Code.gs.',
    };
  }

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'init_drive_folders' }),
    });

    const data = await res.json();
    if (data.success) {
      saveGoogleDriveConfig({
        ...config,
        rootFolderId: data.rootFolderId,
        rootFolderUrl: data.rootFolderUrl,
        lastSyncedAt: new Date().toISOString(),
      });
      return {
        success: true,
        message: data.message,
        rootFolderUrl: data.rootFolderUrl,
        categories: data.categories,
      };
    } else {
      return { success: false, error: data.error || 'Gagal membuat folder di Google Drive.' };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal inisialisasi folder Drive: ${err.message}`,
    };
  }
}

export interface UploadToDriveParams {
  category: DriveCategory;
  orderNumber: string;
  clientName: string;
  fileName: string;
  fileBase64: string;
  mimeType: string;
  uploaderName?: string;
  notes?: string;
  orderId?: string;
}

/**
 * Upload File to Google Drive Categorized Folder via Google Apps Script Web App
 */
export async function uploadFileToDriveViaAppsScript(params: UploadToDriveParams): Promise<{
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  downloadUrl?: string;
  folderUrl?: string;
  folderId?: string;
  category?: DriveCategory;
  categoryLabel?: string;
  message?: string;
  error?: string;
}> {
  const config = getGoogleDriveConfig();
  const scriptUrl = (config.appsScriptUrl || '').trim();

  if (!scriptUrl) {
    // If no Apps Script URL is set, check if Google OAuth is connected to upload directly via Drive v3 API
    const token = getGoogleAccessToken();
    if (token) {
      return uploadFileToDriveViaOAuth(params, token);
    }

    return {
      success: false,
      error: 'Google Apps Script Web App URL belum diisi. Silakan atur Web App URL di tab "Setup Code.gs" atau hubungkan Akun Google OAuth.',
    };
  }

  try {
    const payload = {
      action: 'upload_file',
      category: params.category,
      orderNumber: params.orderNumber,
      clientName: params.clientName,
      fileName: params.fileName,
      fileBase64: params.fileBase64,
      mimeType: params.mimeType,
      uploaderName: params.uploaderName || 'Staff KIRA',
      notes: params.notes || '',
    };

    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success) {
      // Save to local archive record
      const archiveItem: DriveSyncedFile = {
        id: data.fileId || `file_${Date.now()}`,
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        category: params.category,
        fileName: params.fileName,
        fileUrl: data.fileUrl,
        downloadUrl: data.downloadUrl,
        folderUrl: data.folderUrl,
        folderId: data.folderId,
        fileId: data.fileId,
        uploadedAt: new Date().toISOString(),
        uploadedBy: params.uploaderName,
        mimeType: params.mimeType,
        notes: params.notes,
      };
      addLocalDriveArchiveRecord(archiveItem);

      return {
        success: true,
        fileId: data.fileId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        downloadUrl: data.downloadUrl,
        folderUrl: data.folderUrl,
        folderId: data.folderId,
        category: params.category,
        categoryLabel: data.categoryLabel,
        message: data.message || `File ${params.fileName} berhasil disimpan ke folder Google Drive!`,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Google Apps Script mengembalikan status gagal.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal mengunggah file ke Google Drive: ${err.message}`,
    };
  }
}

/**
 * Fallback: Upload File directly to Google Drive v3 REST API using OAuth Bearer Token
 */
async function uploadFileToDriveViaOAuth(params: UploadToDriveParams, token: string): Promise<{
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  downloadUrl?: string;
  folderUrl?: string;
  error?: string;
}> {
  try {
    // 1. Convert base64 to binary
    let rawBase64 = params.fileBase64;
    if (rawBase64.includes(',')) {
      rawBase64 = rawBase64.split(',')[1];
    }
    const byteCharacters = atob(rawBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: params.mimeType });

    // 2. Upload file via Google Drive Multipart Upload
    const metadata = {
      name: params.fileName,
      mimeType: params.mimeType,
      description: `KIRA APPAREL | Kategori: ${params.category} | Order: ${params.orderNumber} | Klien: ${params.clientName}`,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err.error?.message || 'OAuth Drive upload failed');
    }

    const uploadedData = await uploadRes.json();
    const fileId = uploadedData.id;
    const fileUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const archiveItem: DriveSyncedFile = {
      id: fileId,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      category: params.category,
      fileName: params.fileName,
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      fileId: fileId,
      uploadedAt: new Date().toISOString(),
      uploadedBy: params.uploaderName,
      mimeType: params.mimeType,
      notes: params.notes,
    };
    addLocalDriveArchiveRecord(archiveItem);

    return {
      success: true,
      fileId,
      fileUrl,
      downloadUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Direct OAuth Upload failed: ${err.message}`,
    };
  }
}

/**
 * Batch Sync All Database Tables via Google Apps Script Web App
 */
export async function syncAllSheetsViaAppsScript(params: {
  orders: Order[];
  clients: Client[];
  users: User[];
}): Promise<{
  success: boolean;
  message?: string;
  counts?: { orders: number; clients: number; users: number };
  error?: string;
}> {
  const config = getGoogleDriveConfig();
  const scriptUrl = (config.appsScriptUrl || '').trim();

  if (!scriptUrl) {
    return {
      success: false,
      error: 'URL Google Apps Script belum diisi.',
    };
  }

  try {
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'sync_sheets',
        orders: params.orders,
        clients: params.clients,
        users: params.users,
      }),
    });

    const data = await res.json();
    if (data.success) {
      saveGoogleDriveConfig({
        ...config,
        lastSyncedAt: new Date().toISOString(),
      });
      return {
        success: true,
        message: data.message,
        counts: data.counts,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Gagal sinkronisasi data ke Spreadsheet via Apps Script.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal sinkronisasi: ${err.message}`,
    };
  }
}
