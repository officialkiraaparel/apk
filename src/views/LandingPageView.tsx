import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Flame,
  Globe,
  HeartHandshake,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
  Play,
  Printer,
  QrCode,
  RotateCw,
  Scissors,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
  Upload,
  User,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { ImageModal } from '../components/common/ImageModal';
import { useApp } from '../context/AppContext';
import { GALLERY_ITEMS, GalleryJerseyItem } from '../data/galleryData';
import { CollarModel, ProductType, Role, SleeveModel } from '../types';
import { COLLAR_OPTIONS, FABRIC_OPTIONS, KIRA_LOGO_URL, PRODUCT_OPTIONS, SLEEVE_OPTIONS } from '../utils/constants';
import { formatDateID, formatRupiah, generateWhatsAppUrl } from '../utils/formatters';
import { LoginView } from './LoginView';

interface LandingPageViewProps {
  onNavigateToApp: (tab?: string) => void;
  onOpenLoginModal?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onNavigateToApp,
  onOpenLoginModal,
}) => {
  const {
    settings,
    orders,
    createOrder,
    currentUser,
    isAuth,
  } = useApp();

  // Gallery Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryJerseyItem | null>(null);

  // Active View Tab in Order Section
  const [orderMethodTab, setOrderMethodTab] = useState<'form' | 'calculator' | 'whatsapp' | 'tracking'>('form');

  // Online Order Form State
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCategoryType, setFormCategoryType] = useState<'Kaos Tangan Pendek' | 'Kaos Tangan Panjang' | 'Hanya Kaos' | 'Hanya Celana' | 'Kaos dan Celana'>('Kaos dan Celana');
  const [formFabric, setFormFabric] = useState<string>('Dryfit Milano Premium (160 gsm)');
  const [formCollar, setFormCollar] = useState<CollarModel>('O-Neck');
  const [formNotes, setFormNotes] = useState('');
  
  // Size Breakdown State (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL)
  const [formSizes, setFormSizes] = useState<{ [size: string]: number }>({
    S: 4,
    M: 8,
    L: 8,
    XL: 4,
  });

  // Dual Image Uploads (Gambar 1 & Gambar 2)
  const [formImage1, setFormImage1] = useState<string>('https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80');
  const [formImage2, setFormImage2] = useState<string>('https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80');

  // Down Payment & Transfer Proof
  const [formDpPercentage, setFormDpPercentage] = useState<number>(50); // 50% default
  const [formCustomDp, setFormCustomDp] = useState<number>(0);
  const [formUseCustomDp, setFormUseCustomDp] = useState<boolean>(false);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Transfer Bank BCA' | 'Transfer Bank Mandiri' | 'QRIS'>('Transfer Bank BCA');
  const [formTransferProof, setFormTransferProof] = useState<string>('');

  // Preview Modal & Submission States
  const [showOrderPreviewModal, setShowOrderPreviewModal] = useState<boolean>(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<{ orderNumber: string; orderId: string } | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Price Calculator State
  const [calcQty, setCalcQty] = useState<number>(24);
  const [calcFabric, setCalcFabric] = useState<string>('Dryfit Milano Premium (160 gsm)');
  const [calcProductType, setCalcProductType] = useState<string>('Kaos Jersey');
  const [calcWithPants, setCalcWithPants] = useState<boolean>(false);
  const [calcLongSleeveQty, setCalcLongSleeveQty] = useState<number>(0);

  // Tracking Search State
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Filtered Gallery Items
  const filteredGallery = selectedCategory === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(item => item.category === selectedCategory);

  // Available Sizes for ordering
  const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'] as const;

  // Calculate Total Quantity from Size Matrix
  const formTotalQuantity: number = (Object.values(formSizes) as number[]).reduce((acc, curr) => acc + (curr || 0), 0);

  // Handle Form Size Input Change
  const handleSizeChange = (size: string, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setFormSizes(prev => ({
      ...prev,
      [size]: num,
    }));
  };

  // Unit Price Calculation based on Type / Category:
  // - Kaos Tangan Pendek: Rp 110.000 / Rp 115.000 (standard milano)
  // - Kaos Tangan Panjang: Rp 125.000
  // - Hanya Kaos: Rp 110.000
  // - Hanya Celana: Rp 65.000
  // - Kaos dan Celana (Setelan): Rp 160.000
  const calculateFormUnitPrice = () => {
    let price = 110000;
    
    // Base by Category
    if (formCategoryType === 'Hanya Celana') {
      price = 65000;
    } else if (formCategoryType === 'Kaos dan Celana') {
      price = 160000;
    } else if (formCategoryType === 'Kaos Tangan Panjang') {
      price = 125000;
    } else if (formCategoryType === 'Kaos Tangan Pendek' || formCategoryType === 'Hanya Kaos') {
      price = 115000;
    }

    // Fabric surcharge if applicable
    if (formCategoryType !== 'Hanya Celana') {
      if (formFabric.includes('Brazil') || formFabric.includes('Benzema')) price += 5000;
      else if (formFabric.includes('Bintik') || formFabric.includes('Nike')) price += 10000;
      else if (formFabric.includes('Pique') || formFabric.includes('Waffle')) price += 15000;
    }

    return price;
  };

  const formUnitPrice = calculateFormUnitPrice();
  const formTotalPrice = formUnitPrice * Math.max(1, formTotalQuantity);
  
  // Down Payment Amount
  const formCalculatedDp = formUseCustomDp 
    ? Math.max(0, Math.min(formTotalPrice, formCustomDp)) 
    : Math.round((formTotalPrice * formDpPercentage) / 100);
  
  const formRemainingBalance = Math.max(0, formTotalPrice - formCalculatedDp);

  // Handle Dual Image File Uploads
  const handleFormImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'image1' | 'image2' | 'proof') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'image1') setFormImage1(reader.result as string);
        else if (target === 'image2') setFormImage2(reader.result as string);
        else if (target === 'proof') setFormTransferProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Price Calculator Logic
  const calculateEstimate = () => {
    let basePrice = 110000;
    if (calcFabric.includes('Milano')) basePrice = 115000;
    else if (calcFabric.includes('Brazil') || calcFabric.includes('Benzema')) basePrice = 120000;
    else if (calcFabric.includes('Bintik') || calcFabric.includes('Nike')) basePrice = 125000;
    else if (calcFabric.includes('Pique') || calcFabric.includes('Waffle')) basePrice = 130000;

    if (calcProductType === 'Polo Jersey') basePrice += 20000;
    if (calcProductType === 'Jaket Running') basePrice += 65000;
    if (calcWithPants) basePrice += 45000;

    // Quantity Discount Tier
    if (calcQty >= 100) basePrice -= 15000;
    else if (calcQty >= 50) basePrice -= 10000;
    else if (calcQty >= 24) basePrice -= 5000;

    const longSleeveExtra = calcLongSleeveQty * 10000;
    const totalEstimate = (basePrice * calcQty) + longSleeveExtra;

    return {
      pricePerPcs: basePrice,
      totalEstimate,
      longSleeveExtra,
    };
  };

  const calcResult = calculateEstimate();

  // Validate form before opening preview
  const handleOpenPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formCompany) {
      alert('Silakan lengkapi Nama Pemesan, Perusahaan / Komunitas, dan Nomor WhatsApp Anda.');
      return;
    }

    if (formTotalQuantity <= 0) {
      alert('Silakan masukkan jumlah pesanan minimal 1 pcs pada rincian ukuran (S, M, L, dll).');
      return;
    }

    setShowOrderPreviewModal(true);
  };

  // Handle Online Order Final Submission from Preview
  const handleFinalOrderSubmit = () => {
    setIsSubmittingOrder(true);

    const deadlineDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    // Determine Product Type & Sleeve Model for AppContext
    let appProductType: ProductType = 'Kaos Jersey';
    let appSleeveModel: SleeveModel = 'Pendek';

    if (formCategoryType === 'Kaos dan Celana') {
      appProductType = 'Kaos Jersey + Celana';
      appSleeveModel = 'Pendek';
    } else if (formCategoryType === 'Kaos Tangan Panjang') {
      appProductType = 'Kaos Jersey';
      appSleeveModel = 'Panjang';
    } else if (formCategoryType === 'Hanya Celana') {
      appProductType = 'Custom Apparel';
      appSleeveModel = 'Pendek';
    } else if (formCategoryType === 'Hanya Kaos' || formCategoryType === 'Kaos Tangan Pendek') {
      appProductType = 'Kaos Jersey';
      appSleeveModel = 'Pendek';
    }

    const newOrder = createOrder({
      clientName: formName,
      clientCompany: formCompany,
      clientPhone: formPhone,
      productType: appProductType,
      quantity: formTotalQuantity,
      sizeDetails: {
        XS: formSizes['XS'] || 0,
        S: formSizes['S'] || 0,
        M: formSizes['M'] || 0,
        L: formSizes['L'] || 0,
        XL: formSizes['XL'] || 0,
        '2XL': formSizes['2XL'] || 0,
        '3XL': formSizes['3XL'] || 0,
        '4XL': formSizes['4XL'] || 0,
        '5XL': formSizes['5XL'] || 0,
        '6XL': formSizes['6XL'] || 0,
      },
      sleeveBreakdown: {
        shortSleeve: appSleeveModel === 'Pendek' ? formSizes : {},
        longSleeve: appSleeveModel === 'Panjang' ? formSizes : {},
        kids: {},
      },
      fabric: formCategoryType === 'Hanya Celana' ? 'Lotto / Despo Premium' : formFabric,
      fabricDetail: formFabric.split(' ')[1] || 'MILANO',
      collarModel: formCollar,
      sleeveModel: appSleeveModel,
      notes: `${formCategoryType} | ${formNotes} ${formTransferProof ? `| [Bukti Transfer Terlampir via ${formPaymentMethod}]` : ''}`,
      orderTitle: formCompany,
      orderDate: todayStr,
      deadline: deadlineDate,
      unitPrice: formUnitPrice,
      subtotal: formTotalPrice,
      totalAmount: formTotalPrice,
      downPayment: formCalculatedDp,
      remainingBalance: formRemainingBalance,
      image1: formImage1 || 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
      image2: formImage2 || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
    });

    setIsSubmittingOrder(false);
    setShowOrderPreviewModal(false);
    setOrderSuccessModal({ orderNumber: newOrder.orderNumber, orderId: newOrder.id });
  };

  // Handle Live Tracking Search
  const handleTrackingSearch = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || trackingInput).trim().toLowerCase();
    if (!query) return;
    const found = orders.find(
      o =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.id.toLowerCase() === query ||
        o.clientPhone.includes(query) ||
        o.clientName.toLowerCase().includes(query) ||
        o.clientCompany.toLowerCase().includes(query)
    );
    setTrackingResult(found || null);
  };

  // Auto-track if URL contains hash (#track-KA-XXXX) or query param (?track=KA-XXXX)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      let targetOrderNo = '';
      if (hash.startsWith('track-')) {
        targetOrderNo = decodeURIComponent(hash.replace('track-', ''));
      } else {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('track');
        if (t) targetOrderNo = decodeURIComponent(t);
      }

      if (targetOrderNo) {
        setTrackingInput(targetOrderNo);
        handleTrackingSearch(undefined, targetOrderNo);
        setTimeout(() => {
          const trackElem = document.getElementById('tracking-section') || document.getElementById('lacak-pesanan');
          if (trackElem) {
            trackElem.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    }
  }, [orders]);

  // WhatsApp Direct Order Action
  const handleDirectWhatsApp = (customText?: string) => {
    const defaultMsg = customText || `Halo Tim Marketing KIRA APPAREL, saya ingin berkonsultasi dan melakukan pemesanan jersey sublimasi custom.`;
    const cleanPhone = settings.phone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(defaultMsg)}`, '_blank');
  };

  return (
    <div id="kira-landing-page" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#c8b320] selection:text-black">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER NAVIGATION */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#c8b320] p-1 flex items-center justify-center shadow-md shrink-0">
              <img
                src={settings.logoUrl || KIRA_LOGO_URL}
                alt="Kira Apparel Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = KIRA_LOGO_URL;
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl text-slate-950 tracking-tight font-['Outfit',sans-serif]">
                  {settings.companyName || 'KIRA APPAREL'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#c8b320] text-black">
                  <Sparkles className="w-3 h-3" /> OFFICIAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
                {settings.tagline || 'Konveksi & Sublimasi Jersey Printing Custom'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-slate-700">
            <a href="#company-profile" className="hover:text-indigo-600 transition-colors">
              Profil Perusahaan
            </a>
            <a href="#jersey-gallery" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <span>Galeri Kaos Jersey</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </a>
            <a href="#keunggulan" className="hover:text-indigo-600 transition-colors">
              Keunggulan & Bahan
            </a>
            <a href="#order-options" className="hover:text-indigo-600 transition-colors">
              Pilihan Pemesanan
            </a>
            <a href="#tracking-section" className="hover:text-indigo-600 transition-colors">
              Lacak Pesanan
            </a>
            <a href="#kontak" className="hover:text-indigo-600 transition-colors">
              Kontak
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Direct Order Button */}
            <a
              href="#order-options"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#c8b320] hover:bg-[#b5a11c] text-black text-xs font-black rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Pesan Jersey</span>
            </a>

            {/* Login Staff (Marketing / Admin) */}
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-800 shadow-xs transition-all active:scale-[0.98]"
            >
              <Lock className="w-3.5 h-3.5 text-[#c8b320]" />
              <span className="hidden sm:inline">Login Marketing / Admin</span>
              <span className="sm:hidden">Login Staff</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white pt-12 pb-20 sm:pt-16 sm:pb-24 border-b border-indigo-900/30">
        {/* Background Gradients & Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(200,179,32,0.12),transparent_50%)] pointer-events-none" />
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left: Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-[#c8b320]/40 text-[#c8b320] text-xs font-extrabold shadow-sm">
                <Flame className="w-3.5 h-3.5 text-[#c8b320]" />
                <span>KONVEKSI & SUBLIMASI JERSEY PRINTING NO. 1 DI INDONESIA</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black font-['Outfit',sans-serif] tracking-tight leading-tight">
                Wujudkan Jersey Impian Tim Anda Bersama <span className="text-[#c8b320] underline decoration-[#c8b320]/40 underline-offset-8">KIRA APPAREL</span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Spesialis pembuatan jersey olahraga custom, event akbar, komunitas, futsal, sepeda, e-sport, dan seragam instansi. Dikerjakan dengan teknologi digital sublimasi beresolusi tinggi, kain Dryfit grade A+, dan jahitan Kam 3 jarum standar ekspor.
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur text-left">
                  <CheckCircle2 className="w-4 h-4 text-[#c8b320] mb-1" />
                  <p className="text-xs font-bold text-white">Warna Anti-Luntur</p>
                  <p className="text-[10px] text-slate-400">Tinta Sublimasi Asli</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur text-left">
                  <Scissors className="w-4 h-4 text-[#c8b320] mb-1" />
                  <p className="text-xs font-bold text-white">Kam 3 Jarum</p>
                  <p className="text-[10px] text-slate-400">Standar Jahit Ekspor</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur text-left">
                  <Sparkles className="w-4 h-4 text-[#c8b320] mb-1" />
                  <p className="text-xs font-bold text-white">Free Mockup 3D</p>
                  <p className="text-[10px] text-slate-400">Desain Profesional</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur text-left">
                  <ShieldCheck className="w-4 h-4 text-[#c8b320] mb-1" />
                  <p className="text-xs font-bold text-white">Garansi 100%</p>
                  <p className="text-[10px] text-slate-400">Ganti Baru Jika Cacat</p>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-4">
                <a
                  href="#order-options"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-[#c8b320] hover:bg-[#b5a11c] text-black font-black text-sm rounded-xl shadow-lg transition-all active:scale-[0.98]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Pesan Jersey Sekarang</span>
                </a>
                <a
                  href="#jersey-gallery"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 transition-all"
                >
                  <Eye className="w-4 h-4 text-[#c8b320]" />
                  <span>Lihat Portofolio Galeri</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleDirectWhatsApp()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp PIC</span>
                </button>
              </div>
            </div>

            {/* Right: Interactive Hero Card Showcasing Flagship Jersey */}
            <div className="lg:col-span-5 relative">
              <div className="bg-slate-900/90 border-2 border-[#c8b320]/60 rounded-3xl p-5 shadow-2xl backdrop-blur relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black uppercase text-[#c8b320] tracking-wider">
                      PRODUKSI UNGGULAN TERBARU
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-slate-300">
                    Jamnas XII 2026
                  </span>
                </div>

                {/* Flagship Visual Preview */}
                <div className="relative aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center group">
                  <img
                    src="https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80"
                    alt="Jersey Konda Kalteng KIRA"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 text-left">
                    <span className="text-[10px] font-black uppercase bg-[#c8b320] text-black px-2 py-0.5 rounded w-max mb-1">
                      KWARDA KALTENG
                    </span>
                    <h4 className="text-base font-extrabold text-white">
                      Pinkonda Jamnas XII 2026 (Kalimantan Tengah)
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Bahan Dryfit Milano Premium • Jahit Kam 3 Jarum • Kerah O-Neck
                    </p>
                  </div>
                </div>

                {/* Specs Summary */}
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Kain Utama</span>
                    <span className="text-xs font-bold text-[#c8b320]">Milano 160g</span>
                  </div>
                  <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Teknik Jahit</span>
                    <span className="text-xs font-bold text-white">Kam 3 Jarum</span>
                  </div>
                  <div className="p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Kualitas Cetak</span>
                    <span className="text-xs font-bold text-emerald-400">Ultra HD Sublim</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. COMPANY PROFILE SECTION (TENTANG KIRA APPAREL) */}
      {/* ========================================================================= */}
      <section id="company-profile" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-slate-100 text-slate-800 border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>COMPANY PROFILE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 font-['Outfit',sans-serif]">
              Tentang KIRA APPAREL
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              KIRA APPAREL adalah konveksi manufaktur dan spesialis sublimasi printing modern terkemuka di Indonesia. Kami berdedikasi menciptakan jersey dan apparel olahraga berkualitas tinggi dengan mengintegrasikan teknologi digital printing presisi dan keahlian penjahit berpengalaman.
            </p>
          </div>

          {/* 3 Pillars of Excellence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all shadow-xs group">
              <div className="w-12 h-12 rounded-2xl bg-[#c8b320] text-black flex items-center justify-center font-black text-xl mb-4 group-hover:scale-110 transition-transform">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Mesin Sublimasi Digital Modern</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Didukung mesin cetak sublimasi industri berkecepatan tinggi dengan tinta bersertifikasi internasional. Menghasilkan spektrum warna tak terbatas, gradasi mulus, dan ketahanan warna permanen tanpa batas waktu cuci.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all shadow-xs group">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-[#c8b320] flex items-center justify-center font-black text-xl mb-4 group-hover:scale-110 transition-transform">
                <Shirt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pilihan Bahan Dryfit Grade A+</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kami menyediakan varian kain Dryfit terlengkap seperti Milano, Benzema, Bintik Nike, Pique Hexagonal, dan Waffle. Karakter bahan sejuk, menyerap keringat seketika, dan tidak panas saat dipakai berolahraga.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all shadow-xs group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl mb-4 group-hover:scale-110 transition-transform">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Standar Jahit Kam 3 Jarum</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seluruh produk dijahit oleh tenaga penjahit workshop ahli dengan standar ekspor. Jahitan kam 3 jarum memberikan kekuatan maksimal, elastisitas sempurna saat bergerak bebas, dan bebas risiko jahitan sobek.
              </p>
            </div>
          </div>

          {/* Workshop Key Milestones */}
          <div className="mt-12 bg-slate-900 text-white rounded-3xl p-8 sm:p-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center border border-slate-800">
            <div>
              <span className="text-3xl sm:text-4xl font-black text-[#c8b320] font-['Outfit',sans-serif]">150K+</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Jersey Diproduksi</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black text-white font-['Outfit',sans-serif]">2,500+</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Tim & Komunitas Puas</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-['Outfit',sans-serif]">99.8%</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Tingkat Kepuasan</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-black text-cyan-400 font-['Outfit',sans-serif]">100%</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold">Garansi Kualitas Resmi</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. GALERI KAOS JERSEY YANG PERNAH DIPRODUKSI */}
      {/* ========================================================================= */}
      <section id="jersey-gallery" className="py-16 sm:py-20 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-[#c8b320] text-black mb-2 shadow-2xs">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>PORTOFOLIO PRODUKSI KIRA</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 font-['Outfit',sans-serif]">
                Galeri Kaos & Jersey Hasil Produksi
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Koleksi pesanan nyata dari berbagai event akbar, klub olahraga, instansi pemerintah, dan komunitas se-Indonesia.
              </p>
            </div>

            {/* Quick stats on gallery */}
            <div className="text-xs font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 self-start md:self-auto shadow-2xs">
              Menampilkan <span className="text-indigo-600 font-black">{filteredGallery.length}</span> Desain Pilihan
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
            {[
              { id: 'all', label: 'Semua Kategori' },
              { id: 'event', label: 'Event & Jamnas' },
              { id: 'football', label: 'Sepakbola & Futsal' },
              { id: 'esport', label: 'E-Sport & Gaming' },
              { id: 'cycling', label: 'Sepeda & Running' },
              { id: 'polo', label: 'Polo & Komunitas' },
              { id: 'basketball', label: 'Basket & Atletik' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === tab.id
                    ? 'bg-slate-900 text-[#c8b320] shadow-sm font-black'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gallery Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredGallery.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedGalleryItem(item)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-[#c8b320] hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer group"
              >
                {/* Image Showcase Container */}
                <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
                  <img
                    src={item.imageFront}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category Chip */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-black/80 text-[#c8b320] backdrop-blur border border-white/10">
                      {item.categoryLabel}
                    </span>
                  </div>

                  {/* Highlight tag if any */}
                  {item.highlight && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-[#c8b320] text-black">
                        {item.highlight}
                      </span>
                    </div>
                  )}

                  {/* View Details Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                    <Eye className="w-5 h-5 text-[#c8b320]" />
                    <span className="text-xs font-bold">Lihat Rincian & Spek</span>
                  </div>
                </div>

                {/* Card Info Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      {item.clientName}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors mt-0.5 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Specs & Tags Pills */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Bahan:</span>
                      <span className="font-bold text-slate-800">{item.fabric.split('(')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Jahit:</span>
                      <span className="font-bold text-slate-800">{item.stitching}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {item.tags.slice(0, 2).map((tg, idx) => (
                        <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          #{tg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PILIHAN UNTUK MELAKUKAN PEMESANAN */}
      {/* ========================================================================= */}
      <section id="order-options" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-[#c8b320] text-black shadow-2xs">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>CARA & PILIHAN PEMESANAN</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 font-['Outfit',sans-serif]">
              Pilihan Untuk Melakukan Pemesanan
            </h2>
            <p className="text-sm text-slate-600">
              Pilih metode pemesanan yang paling nyaman untuk Anda: formulir online instan, simulasi kalkulator harga transparan, atau konsultasi langsung via WhatsApp.
            </p>
          </div>

          {/* Method Navigation Switcher Tabs */}
          <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setOrderMethodTab('form')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all ${
                orderMethodTab === 'form'
                  ? 'bg-slate-900 text-[#c8b320] shadow-md scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Formulir Order Online Cepat</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderMethodTab('calculator')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all ${
                orderMethodTab === 'calculator'
                  ? 'bg-slate-900 text-[#c8b320] shadow-md scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>2. Simulasi & Kalkulator Biaya</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderMethodTab('whatsapp')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all ${
                orderMethodTab === 'whatsapp'
                  ? 'bg-slate-900 text-[#c8b320] shadow-md scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>3. Konsultasi WhatsApp Marketing</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderMethodTab('tracking')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all ${
                orderMethodTab === 'tracking'
                  ? 'bg-slate-900 text-[#c8b320] shadow-md scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>4. Lacak Status Pesanan</span>
            </button>
          </div>

          {/* ===================================================================== */}
          {/* TAB 1: FORMULIR PEMESANAN ONLINE CEPAT & LENGKAP */}
          {/* ===================================================================== */}
          {orderMethodTab === 'form' && (
            <div className="max-w-4xl mx-auto bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 font-['Outfit',sans-serif]">
                    Formulir Pemesanan Jersey Custom KIRA APPAREL
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lengkapi spesifikasi ukuran, jenis jersey, unggah file desain, serta nominal Down Payment (DP).
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-black bg-[#c8b320] text-black shadow-2xs">
                  Respon Cepat & Transparan
                </span>
              </div>

              <form onSubmit={handleOpenPreview} className="space-y-6">
                {/* 1. INFORMASI PEMESAN */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-[#c8b320] text-xs font-black flex items-center justify-center">1</span>
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Identitas Pemesan & Instansi</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemesan / PIC *</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Tim / Komunitas / Instansi *</label>
                      <input
                        type="text"
                        value={formCompany}
                        onChange={e => setFormCompany(e.target.value)}
                        placeholder="Contoh: KWARDA KALTENG / GARUDA FC"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp Aktif *</label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                        placeholder="08123456789"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. JENIS PRODUK & HARGA SATUAN */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-[#c8b320] text-xs font-black flex items-center justify-center">2</span>
                      <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Jenis Pesanan & Bahan (Harga Satuan Otomatis)</h4>
                    </div>
                    <div className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                      Harga Satuan: {formatRupiah(formUnitPrice)} / pcs
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Apparel / Item *</label>
                      <select
                        value={formCategoryType}
                        onChange={e => setFormCategoryType(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                      >
                        <option value="Kaos dan Celana">Kaos dan Celana (Setelan Komplit) - Rp 160.000/pcs</option>
                        <option value="Kaos Tangan Pendek">Kaos Tangan Pendek - Rp 115.000/pcs</option>
                        <option value="Kaos Tangan Panjang">Kaos Tangan Panjang - Rp 125.000/pcs</option>
                        <option value="Hanya Kaos">Hanya Kaos Saja - Rp 115.000/pcs</option>
                        <option value="Hanya Celana">Hanya Celana Saja - Rp 65.000/pcs</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pilihan Bahan Kain</label>
                      <select
                        value={formFabric}
                        onChange={e => setFormFabric(e.target.value)}
                        disabled={formCategoryType === 'Hanya Celana'}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 disabled:opacity-60"
                      >
                        {FABRIC_OPTIONS.map(fb => (
                          <option key={fb} value={fb}>
                            {fb}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Model Kerah</label>
                      <select
                        value={formCollar}
                        onChange={e => setFormCollar(e.target.value as CollarModel)}
                        disabled={formCategoryType === 'Hanya Celana'}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden disabled:opacity-60"
                      >
                        {COLLAR_OPTIONS.map(cl => (
                          <option key={cl} value={cl}>
                            {cl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. JUMLAH KAOS BERDASARKAN UKURAN (XS, S, M, L, XL, dst) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-[#c8b320] text-xs font-black flex items-center justify-center">3</span>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Jumlah Kaos / Item Berdasarkan Ukuran (S, M, L, XL, dst) *</h4>
                        <p className="text-[11px] text-slate-500">Masukkan jumlah per ukuran sesuai kebutuhan tim Anda.</p>
                      </div>
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2">
                      <span className="text-slate-400">Total Pesanan:</span>
                      <span className="text-[#c8b320] text-sm font-black">{formTotalQuantity} Pcs</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {AVAILABLE_SIZES.map(sz => (
                      <div key={sz} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-amber-50/40 transition-colors">
                        <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">{sz}</label>
                        <input
                          type="number"
                          min="0"
                          value={formSizes[sz] !== undefined && formSizes[sz] > 0 ? formSizes[sz] : ''}
                          onChange={e => handleSizeChange(sz, e.target.value)}
                          placeholder="0"
                          className="w-full text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. UPLOAD FILE GAMBAR 1 & GAMBAR 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-[#c8b320] text-xs font-black flex items-center justify-center">4</span>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Upload File Gambar Desain (Gambar 1 & Gambar 2)</h4>
                        <p className="text-[11px] text-slate-500">Unggah tampak depan & belakang (atau referensi konsep/logo Anda).</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* GAMBAR 1 */}
                    <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#c8b320] bg-slate-50 flex flex-col items-center justify-center text-center space-y-2.5 transition-colors">
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 uppercase">GAMBAR 1 (Tampak Depan / Mockup)</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">Depan</span>
                      </div>
                      
                      <div className="h-40 w-full bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                        {formImage1 ? (
                          <img src={formImage1} alt="Gambar 1" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>

                      <label className="flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer shadow-2xs transition-all">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload File Gambar 1</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleFormImageUpload(e, 'image1')}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* GAMBAR 2 */}
                    <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#c8b320] bg-slate-50 flex flex-col items-center justify-center text-center space-y-2.5 transition-colors">
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 uppercase">GAMBAR 2 (Tampak Belakang / Detail)</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">Belakang</span>
                      </div>
                      
                      <div className="h-40 w-full bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                        {formImage2 ? (
                          <img src={formImage2} alt="Gambar 2" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>

                      <label className="flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer shadow-2xs transition-all">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload File Gambar 2</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleFormImageUpload(e, 'image2')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan Konsep / Warna / Sponsor</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      placeholder="Contoh: Warna dasar Biru Tosca & Hitam, logo dada kiri KWARDA, tulisan punggung KALTENG..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* 5. RINCIAN HARGA, DOWNPAYMENT (DP) & UPLOAD BUKTI TRANSFER */}
                <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#c8b320] text-black text-xs font-black flex items-center justify-center">5</span>
                      <div>
                        <h4 className="text-xs font-black uppercase text-[#c8b320] tracking-wider">Kalkulasi Pembayaran, Uang Downpayment & Bukti Transfer</h4>
                        <p className="text-[11px] text-slate-400">Pilih opsi uang muka (DP) dan unggah bukti transfer pembayaran.</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Harga Satuan</span>
                      <span className="text-xs font-bold text-slate-200">{formatRupiah(formUnitPrice)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Jumlah</span>
                      <span className="text-xs font-bold text-[#c8b320]">{formTotalQuantity} Pcs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Harga Total Dibayar</span>
                      <span className="text-sm font-black text-white">{formatRupiah(formTotalPrice)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Uang DP Yang Dibayar</span>
                      <span className="text-sm font-black text-emerald-400">{formatRupiah(formCalculatedDp)}</span>
                    </div>
                  </div>

                  {/* DP Selector Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">Pilihan Uang Downpayment (DP):</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormUseCustomDp(false);
                            setFormDpPercentage(30);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                            !formUseCustomDp && formDpPercentage === 30
                              ? 'bg-[#c8b320] text-black border-[#c8b320]'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          DP 30%
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormUseCustomDp(false);
                            setFormDpPercentage(50);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                            !formUseCustomDp && formDpPercentage === 50
                              ? 'bg-[#c8b320] text-black border-[#c8b320]'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          DP 50%
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormUseCustomDp(false);
                            setFormDpPercentage(100);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                            !formUseCustomDp && formDpPercentage === 100
                              ? 'bg-[#c8b320] text-black border-[#c8b320]'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          Lunas 100%
                        </button>
                      </div>

                      <div className="mt-2.5">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formUseCustomDp}
                            onChange={e => {
                              setFormUseCustomDp(e.target.checked);
                              if (e.target.checked && formCustomDp === 0) setFormCustomDp(Math.round(formTotalPrice * 0.5));
                            }}
                            className="rounded accent-[#c8b320]"
                          />
                          <span>Atur Nominal DP Kustom Manual (Rp)</span>
                        </label>
                        {formUseCustomDp && (
                          <input
                            type="number"
                            step="10000"
                            min="0"
                            max={formTotalPrice}
                            value={formCustomDp}
                            onChange={e => setFormCustomDp(parseInt(e.target.value, 10) || 0)}
                            className="mt-1.5 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 focus:outline-hidden"
                            placeholder="Nominal DP Rupiah"
                          />
                        )}
                      </div>
                    </div>

                    {/* Rekening & Upload Bukti Transfer */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">Rekening Resmi & Upload Bukti Transfer:</label>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                        <p>🏦 BCA: <strong className="text-white font-mono">8735-091-234</strong> (a.n. PT KIRA APAREL INDONESIA)</p>
                        <p>🏦 Mandiri: <strong className="text-white font-mono">130-00-9876543-2</strong></p>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 cursor-pointer transition-all">
                          <Upload className="w-4 h-4 text-[#c8b320]" />
                          <span>{formTransferProof ? 'Ganti Bukti Transfer' : 'Upload Bukti Transfer'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleFormImageUpload(e, 'proof')}
                            className="hidden"
                          />
                        </label>
                        {formTransferProof && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#c8b320] flex-shrink-0 bg-slate-800">
                            <img src={formTransferProof} alt="Bukti" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON: TOMBOL PREVIEW PESANAN */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    * Periksa seluruh rincian ukuran & harga sebelum mengirimkan pesanan.
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-950 hover:bg-slate-900 text-[#c8b320] font-black text-xs rounded-xl shadow-lg border border-[#c8b320] transition-all active:scale-[0.98]"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview & Periksa Pesanan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: KALKULATOR BIAYA JERSEY CEPAT */}
          {/* ===================================================================== */}
          {orderMethodTab === 'calculator' && (
            <div className="max-w-4xl mx-auto bg-slate-900 text-white border-2 border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-black font-['Outfit',sans-serif] text-[#c8b320]">
                    Kalkulator Simulasi Biaya Jersey
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hitung estimasi anggaran pesanan Anda secara instan dan transparan.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full">
                  Harga Konveksi Langsung
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Jumlah Pesanan: <span className="text-[#c8b320] font-black text-sm">{calcQty} Pcs</span>
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="300"
                      step="6"
                      value={calcQty}
                      onChange={e => setCalcQty(parseInt(e.target.value, 10))}
                      className="w-full accent-[#c8b320]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>12 Pcs (Min)</span>
                      <span>50 Pcs (Diskon 5K)</span>
                      <span>100+ Pcs (Diskon 15K)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Pilihan Bahan</label>
                    <select
                      value={calcFabric}
                      onChange={e => setCalcFabric(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
                    >
                      {FABRIC_OPTIONS.slice(0, 5).map(f => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Tipe Produk</label>
                    <select
                      value={calcProductType}
                      onChange={e => setCalcProductType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden"
                    >
                      {PRODUCT_OPTIONS.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={calcWithPants}
                        onChange={e => setCalcWithPants(e.target.checked)}
                        className="rounded accent-[#c8b320]"
                      />
                      <span>Tambahkan Celana Printing (+Rp 45.000/stel)</span>
                    </label>
                  </div>
                </div>

                {/* Calculation Result Summary */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 block uppercase font-bold">Estimasi Harga Satuan</span>
                    <div className="text-2xl sm:text-3xl font-black text-[#c8b320] font-['Outfit',sans-serif] mt-1">
                      {formatRupiah(calcResult.pricePerPcs)}
                      <span className="text-xs text-slate-400 font-normal ml-1">/ Pcs</span>
                    </div>
                  </div>

                  <div className="space-y-2 py-3 border-y border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Jumlah:</span>
                      <span className="font-bold text-white">{calcQty} pcs</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Bahan:</span>
                      <span className="font-bold text-white">{calcFabric.split('(')[0]}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Celana:</span>
                      <span className="font-bold text-white">{calcWithPants ? 'Ya (+ Celana)' : 'Hanya Atasan'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">TOTAL ESTIMASI BIAYA</span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400">
                      {formatRupiah(calcResult.totalEstimate)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleDirectWhatsApp(
                        `Halo KIRA APPAREL, saya ingin memesan jersey berdasarkan kalkulator:\n- Produk: ${calcProductType}\n- Bahan: ${calcFabric}\n- Jumlah: ${calcQty} pcs\n- Celana: ${calcWithPants ? 'Ya' : 'Tidak'}\n- Estimasi: ${formatRupiah(calcResult.totalEstimate)}`
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#c8b320] hover:bg-[#b5a11c] text-black font-black text-xs rounded-xl transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Pesan Sesuai Simulasi Ini</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: KONSULTASI WHATSAPP MARKETING LANGSUNG */}
          {/* ===================================================================== */}
          {orderMethodTab === 'whatsapp' && (
            <div className="max-w-3xl mx-auto bg-slate-50 border-2 border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-md">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <MessageCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 font-['Outfit',sans-serif]">
                  Konsultasi Langsung dengan Tim Marketing KIRA
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2">
                  Belum punya desain siap cetak? Butuh bantuan mockup 3D atau penawaran resmi untuk instansi/komunitas? Tim marketing kami siap melayani Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto text-left">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-indigo-600 block">MARKETING PIC 1</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">Rian Kurniawan</p>
                  <p className="text-xs text-slate-500 font-mono">0812-3456-7890</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-indigo-600 block">MARKETING PIC 2</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">Siti Nurhaliza</p>
                  <p className="text-xs text-slate-500 font-mono">0813-9876-5432</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDirectWhatsApp()}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Buka Chat WhatsApp Resmi</span>
              </button>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: TRACKING ORDER SECTION */}
          {/* ===================================================================== */}
          {orderMethodTab === 'tracking' && (
            <div id="tracking-section" className="max-w-4xl mx-auto bg-slate-900 text-white border-2 border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
              <div className="text-center max-w-lg mx-auto space-y-2 mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Search className="w-3.5 h-3.5" />
                  <span>LIVE PRODUCTION TRACKER</span>
                </div>
                <h3 className="text-xl font-black font-['Outfit',sans-serif]">
                  Lacak Pesanan KIRA APPAREL
                </h3>
                <p className="text-xs text-slate-400">
                  Masukkan Nomor Order (Contoh: <strong>KA-20260828-001</strong>) atau No. WhatsApp untuk cek live progress workshop.
                </p>
              </div>

              <form onSubmit={handleTrackingSearch} className="max-w-md mx-auto flex gap-2 mb-8">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={e => setTrackingInput(e.target.value)}
                  placeholder="Nomor Order / No WA..."
                  className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-[#c8b320]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#c8b320] hover:bg-[#b5a11c] text-black font-black text-xs rounded-xl"
                >
                  Lacak
                </button>
              </form>

              {/* Tracking Result Card */}
              {trackingResult ? (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#c8b320] block">
                        ORDER {trackingResult.orderNumber}
                      </span>
                      <h4 className="text-base font-bold text-white">
                        {trackingResult.clientCompany} ({trackingResult.clientName})
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold px-3 py-1 bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-full">
                        Tahap: {trackingResult.currentStageName}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Produk:</span>
                      <span className="font-bold text-white">{trackingResult.productType}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Jumlah:</span>
                      <span className="font-bold text-[#c8b320]">{trackingResult.quantity} Pcs</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Bahan:</span>
                      <span className="font-bold text-white">{trackingResult.fabricDetail || trackingResult.fabric}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Target Deadline:</span>
                      <span className="font-bold text-rose-400">{formatDateID(trackingResult.deadline)}</span>
                    </div>
                  </div>
                </div>
              ) : trackingInput.trim() ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                  Data pesanan tidak ditemukan dengan kata kunci &quot;{trackingInput}&quot;. Pastikan Nomor Order atau No. WhatsApp Anda sudah benar.
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                  Ketik nomor Order ID atau No. WhatsApp pemesan pada kolom di atas, lalu klik <strong>Lacak</strong>.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. MODAL DETAIL ITEM GALERI (TAMPAK DEPAN & BELAKANG) */}
      {/* ========================================================================= */}
      {selectedGalleryItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div>
                <span className="text-[10px] font-black uppercase text-[#c8b320] bg-black px-2 py-0.5 rounded">
                  {selectedGalleryItem.categoryLabel}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedGalleryItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGalleryItem(null)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Dual Visual (Front & Back) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-center">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">GAMBAR 1 (Tampak Depan)</span>
                  <div className="aspect-4/3 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 p-2 flex items-center justify-center">
                    <img
                      src={selectedGalleryItem.imageFront}
                      alt="Tampak Depan"
                      className="max-h-full w-auto object-contain rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-center">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">GAMBAR 2 (Tampak Belakang)</span>
                  <div className="aspect-4/3 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 p-2 flex items-center justify-center">
                    <img
                      src={selectedGalleryItem.imageBack}
                      alt="Tampak Belakang"
                      className="max-h-full w-auto object-contain rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Specs Table */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Client / Pemesan:</span>
                    <span className="font-bold text-slate-900">{selectedGalleryItem.clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bahan Kain:</span>
                    <span className="font-bold text-slate-900">{selectedGalleryItem.fabric}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kerah:</span>
                    <span className="font-bold text-slate-900">{selectedGalleryItem.collar}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Teknik Jahit:</span>
                    <span className="font-bold text-slate-900">{selectedGalleryItem.stitching}</span>
                  </div>
                </div>

                <p className="text-slate-600 pt-2 border-t border-slate-200 leading-relaxed">
                  {selectedGalleryItem.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGalleryItem(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGalleryItem(null);
                    handleDirectWhatsApp(
                      `Halo KIRA APPAREL, saya tertarik untuk memesan jersey dengan desain dan spesifikasi seperti: ${selectedGalleryItem.title} (${selectedGalleryItem.clientName}). Mohon info penawaran harga.`
                    );
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#c8b320] hover:bg-[#b5a11c] text-black text-xs font-black rounded-xl shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Pesan Model Seperti Ini</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL LOGIN PORTAL MARKETING / ADMIN */}
      {/* ========================================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute -top-12 right-0 p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <LoginView
              onLoginSuccess={() => {
                setShowLoginModal(false);
                onNavigateToApp('dashboard');
              }}
              onCancel={() => setShowLoginModal(false)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. ORDER PREVIEW MODAL (PEMERIKSAAN PESANAN SEBELUM KLIK KIRIM) */}
      {/* ========================================================================= */}
      {showOrderPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 text-white flex items-center justify-between border-b-2 border-[#c8b320]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#c8b320] text-black font-black flex items-center justify-center text-xs">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black font-['Outfit',sans-serif]">
                    Pemeriksaan & Preview Pesanan Klien
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Mohon periksa kembali detail pesanan Anda sebelum mengonfirmasi pengiriman pesanan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderPreviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* 1. Client Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                  1. Informasi Pemesan
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nama Pemesan:</span>
                    <strong className="text-slate-900">{formName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tim / Perusahaan:</span>
                    <strong className="text-slate-900 uppercase">{formCompany}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">No. WhatsApp:</span>
                    <strong className="text-slate-900 font-mono">{formPhone}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Specs & Category */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                  2. Spesifikasi Produk & Bahan
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Jenis Produk:</span>
                    <strong className="text-slate-900">{formCategoryType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bahan Kain:</span>
                    <strong className="text-slate-900">{formFabric}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Model Kerah:</span>
                    <strong className="text-slate-900">{formCollar}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Kuantitas:</span>
                    <strong className="text-emerald-700 font-black">{formTotalQuantity} Pcs</strong>
                  </div>
                </div>
              </div>

              {/* 3. Size Matrix Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                  3. Rincian Ukuran Pesanan (S, M, L, XL, dst)
                </span>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map(sz => {
                    const qty = formSizes[sz] || 0;
                    if (qty <= 0) return null;
                    return (
                      <div key={sz} className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                        <span className="text-slate-500 uppercase">{sz}:</span>
                        <span className="text-indigo-600 font-black">{qty} pcs</span>
                      </div>
                    );
                  })}
                  {formTotalQuantity === 0 && (
                    <span className="text-xs text-rose-500 italic">Belum ada rincian ukuran yang diisi.</span>
                  )}
                </div>
              </div>

              {/* 4. Uploaded Images */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                  4. File Desain & Lampiran
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 block uppercase">Gambar 1 (Depan)</span>
                    <div className="h-28 flex items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {formImage1 ? (
                        <img src={formImage1} alt="Gambar 1" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Mockup Default</span>
                      )}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 block uppercase">Gambar 2 (Belakang)</span>
                    <div className="h-28 flex items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {formImage2 ? (
                        <img src={formImage2} alt="Gambar 2" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Mockup Default</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Financial Summary & DP */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-black uppercase text-[#c8b320]">
                    5. Kalkulasi Pembayaran & Uang Muka (DP)
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Metode: Transfer Bank
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Harga Satuan:</span>
                    <strong className="text-slate-200">{formatRupiah(formUnitPrice)}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Total Jumlah:</span>
                    <strong className="text-[#c8b320]">{formTotalQuantity} Pcs</strong>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Total Tagihan:</span>
                    <strong className="text-white">{formatRupiah(formTotalPrice)}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Down Payment (DP):</span>
                    <strong className="text-emerald-400">{formatRupiah(formCalculatedDp)}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div className="text-slate-400 text-[11px]">
                    Sisa Pelunasan Setelah Selesai Produksi:
                  </div>
                  <div className="font-black text-rose-400 text-sm">
                    {formatRupiah(formRemainingBalance)}
                  </div>
                </div>

                {formTransferProof && (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Bukti Transfer Pembayaran / DP Terlampir Siap Diverifikasi.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowOrderPreviewModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300"
              >
                Ubah Detail Pesanan
              </button>

              <button
                type="button"
                disabled={isSubmittingOrder}
                onClick={handleFinalOrderSubmit}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#c8b320] hover:bg-[#b5a11c] text-black font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingOrder ? 'Mengirimkan...' : 'Konfirmasi & Kirim Pesanan Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. ORDER SUCCESS MODAL */}
      {/* ========================================================================= */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 font-['Outfit',sans-serif]">
                Pesanan Berhasil Dikirim!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Nomor Referensi Order Anda:
              </p>
              <div className="inline-block mt-2 px-4 py-1.5 bg-slate-900 text-[#c8b320] font-mono font-black text-sm rounded-xl">
                {orderSuccessModal.orderNumber}
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Tim marketing KIRA APPAREL akan segera menghubungi nomor WhatsApp Anda untuk konfirmasi desain dan kalkulasi akhir.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOrderSuccessModal(null);
                  handleDirectWhatsApp(
                    `Halo KIRA APPAREL, saya telah mengirim formulir pesanan dengan No. Order: ${orderSuccessModal.orderNumber}. Mohon bantuannya untuk proses selanjutnya.`
                  );
                }}
                className="w-full py-3 bg-[#c8b320] hover:bg-[#b5a11c] text-black font-black text-xs rounded-xl shadow-md"
              >
                Hubungkan ke WhatsApp Marketing
              </button>
              <button
                type="button"
                onClick={() => setOrderSuccessModal(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9B. STAFF & ADMIN LOGIN MODAL */}
      {/* ========================================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-[400px]">
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute -top-3 -right-3 z-10 p-2 bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white rounded-full border border-[#30363d] shadow-lg transition-all"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
            <LoginView
              onLoginSuccess={() => {
                setShowLoginModal(false);
                onNavigateToApp('dashboard');
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. FOOTER SECTION */}
      {/* ========================================================================= */}
      <footer id="kontak" className="bg-slate-950 text-white border-t border-slate-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
            {/* Col 1: Brand Info */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs border border-slate-700">
                  <img
                    src={settings.logoUrl || KIRA_LOGO_URL}
                    alt="Kira Apparel Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = KIRA_LOGO_URL;
                    }}
                  />
                </div>
                <span className="text-xl font-black font-['Outfit',sans-serif]">
                  {settings.companyName || 'KIRA APPAREL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Spesialis pembuatan jersey sublimasi printing dan apparel olahraga custom terdepan di Indonesia. Kualitas terbaik, jahitan rapi, dan pelayanan terpercaya.
              </p>
            </div>

            {/* Col 2: Layanan & Produk */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-[#c8b320] tracking-wider">PRODUK KAMI</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>• Jersey Futsal & Sepakbola</li>
                <li>• Jersey Event Akbar & Jamnas</li>
                <li>• Jersey E-Sport & Gaming Team</li>
                <li>• Jersey Sepeda & Running</li>
                <li>• Polo Jersey Wangki Komunitas</li>
                <li>• Setelan Jersey Basket & Atletik</li>
              </ul>
            </div>

            {/* Col 3: Workshop & Alamat */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-[#c8b320] tracking-wider">WORKSHOP & KONVEKSI</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {settings.address}
              </p>
              <div className="text-xs text-slate-400 space-y-1 pt-1">
                <p>📞 WhatsApp: <strong className="text-white">{settings.phone}</strong></p>
                <p>✉️ Email: <strong className="text-white">{settings.email}</strong></p>
                <p>⏰ Operasional: <strong className="text-white">Senin - Sabtu (08.00 - 17.00 WIB)</strong></p>
              </div>
            </div>

            {/* Col 4: Akses Cepat & Login Staff */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-[#c8b320] tracking-wider">PORTAL INTERNAL</h4>
              <p className="text-xs text-slate-400">
                Akses manajemen pesanan, pembuatan detail order, SPK workshop, dan pelacakan invoice.
              </p>
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="w-full py-2.5 bg-white/10 hover:bg-[#c8b320] hover:text-black text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login Marketing / Admin</span>
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} KIRA APPAREL Indonesia. Seluruh hak cipta dilindungi.</p>
            <div className="flex items-center gap-4">
              <span className="text-[#c8b320]">Official Konveksi & Sublimasi Jersey</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
