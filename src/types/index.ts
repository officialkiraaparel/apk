export type Role = 'super_admin' | 'admin' | 'marketing' | 'produksi' | 'client';
export type UserStatus = 'active' | 'pending_approval' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  requestedRole?: Role;
  status?: UserStatus;
  password?: string;
  avatar?: string;
  phone?: string;
  notes?: string;
  clientId?: string; // If role is client, linked to client record
  registeredAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Client {
  id: string;
  clientId: string; // e.g. CLT-001
  name: string;
  company: string; // Perusahaan / Komunitas / Tim
  phone: string; // WhatsApp number
  email: string;
  address: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export type ProductType = 'Kaos Jersey' | 'Kaos Jersey + Celana' | 'Polo Jersey' | 'Jaket Running' | 'Custom Apparel';
export type CollarModel = 'O-Neck' | 'V-Neck' | 'Polo' | 'Custom';
export type SleeveModel = 'Pendek' | 'Panjang';

export interface SizeDetail {
  XS: number;
  S: number;
  M: number;
  L: number;
  XL: number;
  '2XL'?: number;
  XXL?: number;
  '3XL': number;
  '4XL': number;
  '5XL': number;
  '6XL'?: number;
  [key: string]: number | undefined;
}

export interface SleeveBreakdown {
  shortSleeve: { [size: string]: number };
  longSleeve: { [size: string]: number };
  kids: { [size: string]: number };
}

export interface ColorSwatchItem {
  hex: string;
  label?: string;
}

export interface BadgeThumbnailItem {
  url: string;
  label: string;
}

export type DesignStatus = 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Revisi';

export interface DesignVersion {
  version: number;
  image1: string; // Gambar 1 (Identitas / Referensi visual pesanan)
  image2: string; // Gambar 2 (Identitas / Referensi visual pesanan)
  notes?: string;
  status: DesignStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  revisionNotes?: string;
}

export type ProductionStageId =
  | 'ORDER_MASUK'
  | 'MENUNGGU_DESAIN'
  | 'DESAIN_DISETUJUI'
  | 'MENUNGGU_PRODUKSI'
  | 'CUTTING'
  | 'PRINTING'
  | 'JAHIT'
  | 'FINISHING'
  | 'QC'
  | 'PACKING'
  | 'SIAP_DIKIRIM'
  | 'DIKIRIM'
  | 'SELESAI';

export interface ProductionPhoto {
  id: string;
  stageId: ProductionStageId;
  stageName: string;
  photoUrl: string;
  caption: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ProductionStageProgress {
  id: ProductionStageId;
  name: string;
  percentage: number;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  updatedBy?: string;
  notes?: string;
  photos?: ProductionPhoto[];
}

export type InvoiceStatus = 'Draft' | 'Menunggu Pembayaran' | 'DP' | 'Sebagian Dibayar' | 'Lunas' | 'Terlambat';

export interface Invoice {
  invoiceNumber: string; // e.g. INV-KA-2026-0828-001
  orderId: string;
  date: string;
  dueDate: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  downPayment: number;
  remainingBalance: number;
  status: InvoiceStatus;
  notes?: string;
}

export type PaymentMethod = 'Transfer Bank' | 'Cash' | 'QRIS' | 'Lainnya';
export type PaymentStatus = 'Menunggu Verifikasi' | 'Terverifikasi' | 'Ditolak';

export type DriveCategory = 'bukti_transfer' | 'spk' | 'invoice' | 'desain';

export interface DriveSyncedFile {
  id: string;
  orderId?: string;
  orderNumber?: string;
  category: DriveCategory;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
  folderUrl?: string;
  folderId?: string;
  fileId?: string;
  uploadedAt: string;
  uploadedBy?: string;
  sizeBytes?: number;
  mimeType?: string;
  notes?: string;
}

export interface GoogleDriveConfig {
  appsScriptUrl?: string;
  rootFolderId?: string;
  rootFolderName?: string;
  rootFolderUrl?: string;
  autoSyncOrders?: boolean;
  autoUploadProof?: boolean;
  autoUploadSPK?: boolean;
  autoUploadInvoice?: boolean;
  autoUploadDesign?: boolean;
  lastSyncedAt?: string;
}

export interface Payment {
  id: string;
  paymentNumber: string; // e.g. PAY-20260828-001
  invoiceNumber: string;
  orderId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  proofUrl?: string;
  notes?: string;
  status: PaymentStatus;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface Shipment {
  orderId: string;
  courier: string; // e.g. JNE, J&T, SiCepat, Lalamove, Ambil Sendiri
  trackingNumber: string; // Resi
  shippedAt?: string;
  estimatedArrival?: string;
  notes?: string;
  status: 'Siap Dikirim' | 'Dalam Pengiriman' | 'Telah Diterima';
}

export type OrderStatus =
  | 'Draft'
  | 'Menunggu Desain'
  | 'Persetujuan Desain'
  | 'SPK Diterbitkan'
  | 'Sedang Produksi'
  | 'Siap Dikirim'
  | 'Dikirim'
  | 'Selesai'
  | 'Dibatalkan';

export interface Order {
  id: string;
  orderNumber: string; // e.g. KA-20260828-001
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress: string;
  marketingId: string;
  marketingName: string;
  orderDate: string;
  deadline: string;
  
  // Product Details
  productType: ProductType;
  quantity: number;
  sizeDetails: SizeDetail;
  collarModel: CollarModel;
  sleeveModel: SleeveModel;
  fabric: string;
  colorNotes: string;
  notes?: string;
  
  // KIRA Apparel Official Detail Order Specifics
  poNumber?: string;
  orderTitle?: string; // JUDUL, e.g. "KONDA KALTENG"
  fabricDetail?: string; // Bahan, e.g. "MILANO"
  necktape?: string; // e.g. "KIRA"
  sizeLabel?: string; // e.g. "KIRA"
  logoRightChest?: string; // e.g. "PRINTING"
  logoLeftChest?: string; // e.g. "PRINTING"
  backText?: string; // e.g. "PRINTING"
  stitchingNotes?: string; // e.g. "- KAM 3 JARUM\n- KERAH O-NECT"
  fontRef?: string; // e.g. "INTRO RUST"
  colorSwatches?: ColorSwatchItem[];
  badgeThumbnails?: BadgeThumbnailItem[];
  sleeveBreakdown?: SleeveBreakdown;

  // Pricing
  unitPrice: number;
  subtotal: number;
  discount: number;
  shippingCost: number;
  totalAmount: number;
  downPayment: number;
  remainingBalance: number;
  
  // Design Identifiers (Gambar 1 & Gambar 2 are strictly reference visual identities)
  image1: string; // Gambar 1
  image2: string; // Gambar 2
  designStatus: DesignStatus;
  currentDesignVersion: number;
  designVersions: DesignVersion[];
  
  // SPK
  spkNumber: string; // e.g. SPK-KA-2026-0828-001
  spkIssuedAt?: string;
  productionNotes?: string;
  
  // Production
  currentStageId: ProductionStageId;
  progressPercentage: number;
  productionStages: ProductionStageProgress[];
  productionPhotos: ProductionPhoto[];
  
  // Financial & Fulfillment
  invoice: Invoice;
  payments: Payment[];
  shipment?: Shipment;
  status: OrderStatus;
  
  // Google Drive Cloud Sync
  driveFolderUrl?: string;
  driveFiles?: DriveSyncedFile[];
  
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  bankAccounts: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }[];
  qrisImageUrl: string;
  orderPrefix: string;
  spkPrefix: string;
  invoicePrefix: string;
  availableProducts: string[];
  availableFabrics: string[];
  availableCollars: string[];
  availableSleeves: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  orderId?: string;
  type: 'order' | 'design' | 'production' | 'payment' | 'shipment' | 'system';
  read: boolean;
  createdAt: string;
}
