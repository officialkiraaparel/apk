import { CollarModel, CompanySettings, ProductionStageId, ProductionStageProgress, SleeveModel, User } from '../types';

export const INITIAL_PRODUCTION_STAGES: { id: ProductionStageId; name: string; percentage: number }[] = [
  { id: 'ORDER_MASUK', name: '1. Order Masuk', percentage: 5 },
  { id: 'MENUNGGU_DESAIN', name: '2. Menunggu Desain', percentage: 15 },
  { id: 'DESAIN_DISETUJUI', name: '3. Desain Disetujui', percentage: 25 },
  { id: 'MENUNGGU_PRODUKSI', name: '4. Menunggu Produksi', percentage: 30 },
  { id: 'CUTTING', name: '5. Cutting / Pola', percentage: 40 },
  { id: 'PRINTING', name: '6. Printing / Sublim', percentage: 50 },
  { id: 'JAHIT', name: '7. Jahit', percentage: 65 },
  { id: 'FINISHING', name: '8. Finishing & Steam', percentage: 75 },
  { id: 'QC', name: '9. Quality Control (QC)', percentage: 85 },
  { id: 'PACKING', name: '10. Packing & Tagging', percentage: 90 },
  { id: 'SIAP_DIKIRIM', name: '11. Siap Dikirim', percentage: 95 },
  { id: 'DIKIRIM', name: '12. Dikirim (Kurir / Ekspedisi)', percentage: 98 },
  { id: 'SELESAI', name: '13. Selesai', percentage: 100 },
];

export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'] as const;

export const COLLAR_OPTIONS: CollarModel[] = ['O-Neck', 'V-Neck', 'Polo', 'Custom'];
export const SLEEVE_OPTIONS: SleeveModel[] = ['Pendek', 'Panjang'];

export const FABRIC_OPTIONS = [
  'Dryfit Milano Premium (160 gsm)',
  'Dryfit Brazil / Benzema (150 gsm)',
  'Dryfit Bintik / Nike (160 gsm)',
  'Dryfit Pique Hexagonal (170 gsm)',
  'Dryfit Waffle / Jarum (155 gsm)',
  'Cotton Combed 24s Premium',
  'Cotton Combed 30s Soft',
  'Polyester PE Double Knit',
];

export const PRODUCT_OPTIONS = [
  'Kaos Jersey',
  'Kaos Jersey + Celana',
  'Polo Jersey',
  'Jaket Running',
  'Custom Apparel',
];

export const KIRA_LOGO_URL = 'https://lh3.googleusercontent.com/d/1QyJbn3hmD6HqgEY_kW_k0kRiAwXuDly2';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'KIRA APPAREL',
  tagline: 'Production & Order Management System',
  logoUrl: KIRA_LOGO_URL,
  address: 'Jl. Industri Konveksi No. 88, Cibaduyut, Bandung, Jawa Barat 40235',
  phone: '6281234567890',
  email: 'officialkiraaparel@gmail.com',
  website: 'www.kiraaparel.com',
  bankAccounts: [
    {
      bankName: 'BCA (Bank Central Asia)',
      accountNumber: '8735091234',
      accountHolder: 'KIRA APAREL INDONESIA PT',
    },
    {
      bankName: 'Bank Mandiri',
      accountNumber: '1300098765432',
      accountHolder: 'KIRA APAREL INDONESIA PT',
    },
  ],
  qrisImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021126580016ID.CO.KIRAAPAREL.WWW01189360091800000000005204581253033605802ID5913KIRA%20APAREL6007BANDUNG6304A1B2',
  orderPrefix: 'KA',
  spkPrefix: 'SPK-KA',
  invoicePrefix: 'INV-KA',
  availableProducts: PRODUCT_OPTIONS,
  availableFabrics: FABRIC_OPTIONS,
  availableCollars: COLLAR_OPTIONS,
  availableSleeves: SLEEVE_OPTIONS,
};

export const OFFICIAL_SUPERADMIN_USER: User = {
  id: 'usr_superadmin',
  name: 'Super Admin Kira Apparel (Direksi)',
  email: 'officialkiraaparel@gmail.com',
  role: 'super_admin',
  status: 'active',
  password: 'superadmin123',
  phone: '6281234567890',
  notes: 'Akun Resmi Utama Super Admin (Akses Penuh Seluruh Sistem)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const GUEST_CLIENT_USER: User = {
  id: 'usr_guest',
  name: 'Tamu Pengunjung (Klien)',
  email: 'tamu@kiraaparel.com',
  role: 'client',
  status: 'active',
  phone: '',
  notes: 'Pengunjung Publik Website KIRA APPAREL',
};

export const MOCK_USERS: User[] = [
  OFFICIAL_SUPERADMIN_USER,
];
