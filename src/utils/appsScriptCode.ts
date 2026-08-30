/**
 * Master Google Apps Script (Code.gs) Source Code for KIRA APPAREL
 * Provides full automation for:
 * 1. Google Drive Categorized Folder Structure (Bukti Transfer, SPK, Invoice, Desain Kaos)
 * 2. Automatic File Uploading, Base64 Decoding & Public Link Sharing
 * 3. Bidirectional Google Sheets Database Synchronization (Pesanan, Pelanggan, Produksi, User Access & Passwords)
 * 4. Automatic "Arsip_Google_Drive" Logging Sheet
 */

export const APPS_SCRIPT_SOURCE_CODE = `/**
 * =========================================================================
 *  KIRA APPAREL - CLOUD GOOGLE DRIVE & SPREADSHEET SYNC ENGINE (v2.0)
 *  Official Script for Code.gs in Google Apps Script
 * =========================================================================
 * 
 * CARA PEMASANGAN & AKTIVASI:
 * 1. Buka Google Spreadsheet Database Kira Apparel Anda
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script"
 * 3. Hapus semua kode bawaan di file "Code.gs", lalu paste seluruh kode ini
 * 4. Klik tombol "Deploy" (Terapkan) di kanan atas > "Deployment Baru" (New deployment)
 * 5. Pilih tipe: "Aplikasi Web" (Web app)
 * 6. Deskripsi: "Kira Apparel Sync API v2.0"
 * 7. Jalankan sebagai: "Saya" (Me / Akun Google Pemilik Spreadsheet)
 * 8. Yang memiliki akses: "Siapa saja" (Anyone) -> WAJIB agar aplikasi web bisa kirim data
 * 9. Klik "Terapkan" (Deploy) & Berikan Izin Akses Google (Review permissions > Advanced > Go to Untitled project)
 * 10. Salin URL Aplikasi Web (Web App URL yang berakhiran /exec) dan paste ke Pengaturan Aplikasi KIRA
 */

// KONFIGURASI NAMA FOLDER GOOGLE DRIVE RESMI
var CONFIG = {
  ROOT_FOLDER_NAME: "KIRA_APPAREL_DATABASE",
  CATEGORIES: {
    bukti_transfer: {
      folderName: "01_Bukti_Transfer",
      label: "Bukti Transfer Pembeli"
    },
    spk: {
      folderName: "02_SPK_Produksi",
      label: "SPK (Surat Perintah Kerja)"
    },
    invoice: {
      folderName: "03_Invoice_Kwitansi",
      label: "Invoice & Kwitansi Tagihan"
    },
    desain: {
      folderName: "04_Desain_Mockup",
      label: "Desain Jersey & Mockup"
    }
  },
  SHEETS: {
    ORDERS: "Pesanan",
    CLIENTS: "Pelanggan",
    PRODUCTION: "Produksi_Workshop",
    USERS: "Users_Manajemen_Akses",
    ARCHIVE_DRIVE: "Arsip_Google_Drive"
  }
};

/**
 * Handle HTTP GET Requests (Ping / Health Check / Get Folders)
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
  
  try {
    if (action === "ping") {
      var root = getOrCreateRootFolder();
      return jsonResponse({
        success: true,
        message: "Google Apps Script Kira Apparel API Aktif & Siap!",
        user: Session.getActiveUser().getEmail() || "Authenticated Owner",
        spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
        spreadsheetTitle: SpreadsheetApp.getActiveSpreadsheet().getName(),
        rootFolderId: root.getId(),
        rootFolderUrl: root.getUrl(),
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === "get_folders") {
      var structure = getDriveFolderStructure();
      return jsonResponse({
        success: true,
        folders: structure
      });
    }
    
    if (action === "list_archive") {
      var logs = getDriveArchiveLogs();
      return jsonResponse({
        success: true,
        archives: logs
      });
    }
    
    return jsonResponse({
      success: true,
      message: "Kira Apparel Web App Endpoint Ready. Use POST for file uploads and data syncing."
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString(),
      stack: err.stack
    });
  }
}

/**
 * Handle HTTP POST Requests (Upload Files, Sync Sheets, Create Folders)
 */
function doPost(e) {
  try {
    var rawContents = e.postData.contents;
    var data = JSON.parse(rawContents);
    var action = data.action;

    // 1. Upload File & Sync to Categorized Google Drive Folder
    if (action === "upload_file") {
      var uploadResult = handleFileUpload(data);
      return jsonResponse(uploadResult);
    }

    // 2. Initialize Drive Folder Structure in Google Drive
    if (action === "init_drive_folders") {
      var initResult = initStandardFolderStructure();
      return jsonResponse(initResult);
    }

    // 3. Batch Sync All Database Tables to Spreadsheet
    if (action === "sync_sheets" || action === "sync_all") {
      var syncResult = handleSyncAllSheets(data);
      return jsonResponse(syncResult);
    }

    // 4. Ping / Test
    if (action === "ping") {
      var rootFolder = getOrCreateRootFolder();
      return jsonResponse({
        success: true,
        message: "Koneksi Google Apps Script & Drive Berhasil Terhubung!",
        rootFolderId: rootFolder.getId(),
        rootFolderUrl: rootFolder.getUrl(),
        spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId()
      });
    }

    return jsonResponse({
      success: false,
      error: "Aksi tidak dikenal: " + action
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString(),
      stack: err.stack
    });
  }
}

/**
 * Format Standard JSON Response with CORS Headers
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get or Create Root Folder: "KIRA_APPAREL_DATABASE"
 */
function getOrCreateRootFolder() {
  var folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  var newRoot = DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
  newRoot.setDescription("Penyimpanan Database & Arsip Resmi KIRA APPAREL (Bukti Transfer, SPK, Invoice, Desain)");
  return newRoot;
}

/**
 * Get or Create a Subfolder inside a Parent Folder
 */
function getOrCreateSubfolder(parentFolder, subfolderName) {
  var folders = parentFolder.getFoldersByName(subfolderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(subfolderName);
}

/**
 * Initialize Entire Category Folder Structure
 */
function initStandardFolderStructure() {
  var root = getOrCreateRootFolder();
  var currentYear = new Date().getFullYear().toString();
  var results = {};

  for (var key in CONFIG.CATEGORIES) {
    var catConfig = CONFIG.CATEGORIES[key];
    var catFolder = getOrCreateSubfolder(root, catConfig.folderName);
    var yearFolder = getOrCreateSubfolder(catFolder, currentYear);
    results[key] = {
      categoryKey: key,
      folderName: catConfig.folderName,
      folderId: catFolder.getId(),
      folderUrl: catFolder.getUrl(),
      yearFolderUrl: yearFolder.getUrl()
    };
  }

  ensureArchiveSheetHeader();

  return {
    success: true,
    message: "Struktur folder Google Drive KIRA APPAREL berhasil dibuat & siap digunakan!",
    rootFolderId: root.getId(),
    rootFolderUrl: root.getUrl(),
    categories: results
  };
}

/**
 * Handle File Upload to Drive with Categorization & Public View Link
 */
function handleFileUpload(data) {
  var category = data.category || "bukti_transfer";
  var orderNumber = data.orderNumber || "GENERAL";
  var clientName = data.clientName || "Umum";
  var fileName = data.fileName || ("file_" + new Date().getTime());
  var fileBase64 = data.fileBase64;
  var mimeType = data.mimeType || "image/jpeg";
  var uploaderName = data.uploaderName || "Staff Kira";
  var notes = data.notes || "";

  if (!fileBase64) {
    throw new Error("File data (base64) tidak ditemukan dalam request.");
  }

  // Strip base64 prefix if present (e.g. data:image/png;base64,...)
  if (fileBase64.indexOf(",") > -1) {
    fileBase64 = fileBase64.split(",")[1];
  }

  var decodedBytes = Utilities.base64Decode(fileBase64);
  var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

  // 1. Resolve Drive Folders: Root -> Category -> Year -> [OrderNo - Client]
  var root = getOrCreateRootFolder();
  var catInfo = CONFIG.CATEGORIES[category] || { folderName: "01_Bukti_Transfer", label: "Bukti Transfer" };
  var catFolder = getOrCreateSubfolder(root, catInfo.folderName);
  var yearFolder = getOrCreateSubfolder(catFolder, new Date().getFullYear().toString());

  // Order Subfolder e.g. "KA-20260828-001 - Tim Futsal Garuda"
  var cleanClient = clientName.replace(/[\\/:*?"<>|]/g, "_").trim();
  var orderFolderName = orderNumber + (cleanClient ? " - " + cleanClient : "");
  var targetFolder = getOrCreateSubfolder(yearFolder, orderFolderName);

  // 2. Create File in Target Folder
  var file = targetFolder.createFile(blob);
  file.setDescription("Kategori: " + catInfo.label + " | Order: " + orderNumber + " | Klien: " + clientName + " | Upload: " + new Date().toISOString());

  // 3. Set public permission (Anyone with link can view)
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    // If domain restricts public sharing, continue gracefully
  }

  var fileId = file.getId();
  var fileViewUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";
  var directDownloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
  var folderUrl = targetFolder.getUrl();

  // 4. Log to "Arsip_Google_Drive" spreadsheet tab
  logToArchiveSheet({
    timestamp: new Date(),
    orderNumber: orderNumber,
    clientName: clientName,
    categoryKey: category,
    categoryLabel: catInfo.label,
    fileName: fileName,
    fileId: fileId,
    fileViewUrl: fileViewUrl,
    downloadUrl: directDownloadUrl,
    folderUrl: folderUrl,
    uploaderName: uploaderName,
    notes: notes
  });

  return {
    success: true,
    message: "File berhasil disimpan ke Google Drive pada folder: " + catInfo.folderName + "/" + orderFolderName,
    fileId: fileId,
    fileName: fileName,
    fileUrl: fileViewUrl,
    downloadUrl: directDownloadUrl,
    folderId: targetFolder.getId(),
    folderUrl: folderUrl,
    category: category,
    categoryLabel: catInfo.label,
    orderNumber: orderNumber,
    timestamp: new Date().toISOString()
  };
}

/**
 * Ensure "Arsip_Google_Drive" Sheet Tab Exists with Proper Headers
 */
function ensureArchiveSheetHeader() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.ARCHIVE_DRIVE);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEETS.ARCHIVE_DRIVE);
  }
  
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Waktu Upload",
      "No. Order",
      "Nama Klien / Tim",
      "Kategori Folder",
      "Nama File",
      "Link Lihat Google Drive",
      "Link Direct Download",
      "Link Folder Drive",
      "ID File Drive",
      "Diunggah Oleh",
      "Catatan"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Log File Metadata to "Arsip_Google_Drive"
 */
function logToArchiveSheet(log) {
  try {
    var sheet = ensureArchiveSheetHeader();
    var formattedDate = Utilities.formatDate(log.timestamp, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
    
    sheet.appendRow([
      formattedDate,
      log.orderNumber,
      log.clientName,
      log.categoryLabel,
      log.fileName,
      log.fileViewUrl,
      log.downloadUrl,
      log.folderUrl,
      log.fileId,
      log.uploaderName,
      log.notes
    ]);
  } catch (err) {
    console.error("Gagal mencatat log arsip sheet: " + err);
  }
}

/**
 * Batch Sync All Database Tables to Spreadsheet (Pesanan, Pelanggan, Produksi, Users)
 */
function handleSyncAllSheets(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var syncCounts = { orders: 0, clients: 0, users: 0 };

  // 1. Sync Orders
  if (data.orders && Array.isArray(data.orders)) {
    var orderSheet = getOrCreateSheet(ss, CONFIG.SHEETS.ORDERS);
    orderSheet.clearContents();
    
    var orderHeaders = [
      "ID", "No. Order", "No. SPK", "No. Invoice", "Nama Klien / PIC", "Instansi / Tim",
      "No. WhatsApp", "Tipe Produk", "Bahan Kain", "Model Kerah", "Model Lengan",
      "Jumlah (Pcs)", "Harga Satuan (Rp)", "Total Biaya (Rp)", "Status Desain",
      "Tahap Produksi", "Status Bayar", "Sudah Dibayar (Rp)", "Sisa Tagihan (Rp)",
      "Tanggal Masuk", "Deadline", "No. Resi", "Kurir", "Link Folder Drive", "Link Gambar 1", "Link Gambar 2"
    ];
    orderSheet.appendRow(orderHeaders);
    orderSheet.getRange(1, 1, 1, orderHeaders.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    orderSheet.setFrozenRows(1);

    var orderRows = data.orders.map(function(o) {
      return [
        o.id || "",
        o.orderNumber || "",
        o.spkNumber || "",
        (o.invoice && o.invoice.invoiceNumber) || "",
        o.clientName || "",
        o.clientCompany || "",
        o.clientPhone || "",
        o.productType || "",
        o.fabric || "",
        o.collarModel || "",
        o.sleeveModel || "",
        o.quantity || 0,
        o.unitPrice || 0,
        o.totalAmount || 0,
        o.designStatus || "",
        o.currentStageId || "",
        (o.invoice && o.invoice.status) || "",
        o.downPayment || 0,
        o.remainingBalance || 0,
        o.orderDate || "",
        o.deadline || "",
        (o.shipment && o.shipment.trackingNumber) || "",
        (o.shipment && o.shipment.courier) || "",
        o.driveFolderUrl || "",
        o.image1 || "",
        o.image2 || ""
      ];
    });

    if (orderRows.length > 0) {
      orderSheet.getRange(2, 1, orderRows.length, orderHeaders.length).setValues(orderRows);
    }
    syncCounts.orders = orderRows.length;
  }

  // 2. Sync Clients
  if (data.clients && Array.isArray(data.clients)) {
    var clientSheet = getOrCreateSheet(ss, CONFIG.SHEETS.CLIENTS);
    clientSheet.clearContents();

    var clientHeaders = [
      "ID Pelanggan", "Nama Klien / PIC", "Nama Tim / Instansi", "No. WhatsApp",
      "Email", "Alamat Pengiriman", "Total Pesanan", "Total Belanja (Rp)", "Tanggal Bergabung", "Catatan"
    ];
    clientSheet.appendRow(clientHeaders);
    clientSheet.getRange(1, 1, 1, clientHeaders.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    clientSheet.setFrozenRows(1);

    var clientRows = data.clients.map(function(c) {
      return [
        c.clientId || c.id || "",
        c.name || "",
        c.company || "",
        c.phone || "",
        c.email || "",
        c.address || "",
        c.totalOrders || 0,
        c.totalSpent || 0,
        c.createdAt || "",
        c.notes || ""
      ];
    });

    if (clientRows.length > 0) {
      clientSheet.getRange(2, 1, clientRows.length, clientHeaders.length).setValues(clientRows);
    }
    syncCounts.clients = clientRows.length;
  }

  // 3. Sync Users (With Plain Text Passwords for Super Admin)
  if (data.users && Array.isArray(data.users)) {
    var userSheet = getOrCreateSheet(ss, CONFIG.SHEETS.USERS);
    userSheet.clearContents();

    var userHeaders = [
      "ID Pengguna", "Nama Lengkap", "Email / Username Akun", "Password (Plain Text)",
      "Role / Tingkat Akses", "Status Akun", "No. WhatsApp", "Tanggal Registrasi", "Catatan Divisi"
    ];
    userSheet.appendRow(userHeaders);
    userSheet.getRange(1, 1, 1, userHeaders.length).setFontWeight("bold").setBackground("#312e81").setFontColor("#e0e7ff");
    userSheet.setFrozenRows(1);

    var userRows = data.users.map(function(u) {
      return [
        u.id || "",
        u.name || "",
        u.email || "",
        u.password || "superadmin123",
        u.role || "",
        u.status || "active",
        u.phone || "",
        u.registeredAt || "",
        u.notes || ""
      ];
    });

    if (userRows.length > 0) {
      userSheet.getRange(2, 1, userRows.length, userHeaders.length).setValues(userRows);
    }
    syncCounts.users = userRows.length;
  }

  return {
    success: true,
    message: "Sinkronisasi Spreadsheet Berhasil! (" + syncCounts.orders + " Pesanan, " + syncCounts.clients + " Pelanggan, " + syncCounts.users + " User).",
    counts: syncCounts,
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper to Get or Create Sheet by Name
 */
function getOrCreateSheet(spreadsheet, name) {
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  return sheet;
}

/**
 * Get Directory Tree Structure for Web App Preview
 */
function getDriveFolderStructure() {
  var root = getOrCreateRootFolder();
  var structure = {
    rootId: root.getId(),
    rootName: root.getName(),
    rootUrl: root.getUrl(),
    categories: []
  };

  for (var key in CONFIG.CATEGORIES) {
    var cat = CONFIG.CATEGORIES[key];
    var catFolder = getOrCreateSubfolder(root, cat.folderName);
    var subfolders = [];
    var folderIter = catFolder.getFolders();
    while (folderIter.hasNext()) {
      var f = folderIter.next();
      subfolders.push({
        id: f.getId(),
        name: f.getName(),
        url: f.getUrl()
      });
    }

    structure.categories.push({
      key: key,
      label: cat.label,
      folderName: cat.folderName,
      folderId: catFolder.getId(),
      folderUrl: catFolder.getUrl(),
      subfolders: subfolders
    });
  }

  return structure;
}

/**
 * Get Archive Logs from "Arsip_Google_Drive"
 */
function getDriveArchiveLogs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.ARCHIVE_DRIVE);
  if (!sheet || sheet.getLastRow() <= 1) {
    return [];
  }

  var data = sheet.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    rows.push({
      timestamp: row[0],
      orderNumber: row[1],
      clientName: row[2],
      categoryLabel: row[3],
      fileName: row[4],
      fileViewUrl: row[5],
      downloadUrl: row[6],
      folderUrl: row[7],
      fileId: row[8],
      uploaderName: row[9],
      notes: row[10]
    });
  }
  return rows.reverse(); // Newest first
}
`;
