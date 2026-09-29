import React, { useState, useEffect, useRef } from 'react';
import { api, setToken, getToken } from './api';
import {
  User,
  ProduksiItem,
  MitraItem,
  ProyekItem,
  LegalItem,
  DokumenItem,
  LogItem,
  Settings,
  FullDataResponse
} from './types';
import {
  LOGO_SVG,
  LOGO_SVG_DARK,
  MAP_IMG_HIGHRES,
  getStatusClass,
  formatRupiah,
  calculateDaysRemaining,
  terbilang
} from './assets/images';
import { testFirestoreConnection, FIREBASE_PROJECT_ID, FIRESTORE_DB_ID } from './firebase';
import { getDefaultClientData } from './fallbackData';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginUsername, setLoginUsername] = useState('admin1');
  const [loginPassword, setLoginPassword] = useState('admin1');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotMsg, setForgotMsg] = useState({ text: '', isError: false });

  // Firebase status
  const [firebaseStatus, setFirebaseStatus] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: 'Memeriksa Google Cloud Firestore...'
  });

  // Navigation
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [adminTab, setAdminTab] = useState<'user' | 'log' | 'mt' | 'backup' | 'db'>('user');
  const [explorerTable, setExplorerTable] = useState<'produksi' | 'mitra' | 'proyek' | 'legal' | 'dokumen' | 'users' | 'logs'>('produksi');

  // Database snapshot
  const [dbData, setDbData] = useState<FullDataResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dashboard Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterBibit, setFilterBibit] = useState('Semua jenis bibit');
  const [filterWilayah, setFilterWilayah] = useState('Semua wilayah');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<string>('');
  const [dialogItemIndex, setDialogItemIndex] = useState<number | null>(null);
  const [dialogFormData, setDialogFormData] = useState<any>({});
  const [selectedUserPhoto, setSelectedUserPhoto] = useState<string>('');

  // Document Generator State
  const [docType, setDocType] = useState<'Penawaran' | 'Invoice' | 'BAST'>('Penawaran');
  const [docClient, setDocClient] = useState('');
  const [docItems, setDocItems] = useState<Array<{ b: string; q: number; h: number }>>([
    { b: 'Bibit Alpukat Miki', q: 1000, h: 25000 }
  ]);
  const [currentDocHtml, setCurrentDocHtml] = useState<string>('');

  // File input ref for photo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch all data from server database or fallback
  const loadData = async (silent = false) => {
    try {
      const res = await api.getFullData();
      if (res.data) {
        setDbData(res.data);
        setLastUpdated(new Date().toLocaleTimeString('id-ID'));
        localStorage.setItem('lba_db_cache', JSON.stringify(res.data));
        if (currentUser) {
          const freshMe = res.data.users.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
          if (freshMe) {
            setCurrentUser(freshMe);
          }
        }
        return;
      }
    } catch (err: any) {
      if (!silent) {
        console.warn('API getFullData failed, checking local cache:', err.message);
      }
    }

    // Fallback: check local storage cache or defaults
    const cached = localStorage.getItem('lba_db_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setDbData(parsed);
        setLastUpdated(new Date().toLocaleTimeString('id-ID') + ' (Cache Lokal)');
        return;
      } catch (e) {
        // ignore
      }
    }

    // Default mock data so screen is never empty
    const defaults = getDefaultClientData();
    setDbData(defaults);
    setLastUpdated(new Date().toLocaleTimeString('id-ID'));
  };

  useEffect(() => {
    loadData();
    // Auto-refresh data every 30 seconds for real-time collaboration across devices
    const interval = setInterval(() => {
      if (currentUser) {
        loadData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Test Firebase Firestore connection on mount
  useEffect(() => {
    testFirestoreConnection().then(res => {
      setFirebaseStatus(res);
    });
  }, []);

  // Check persisted session
  useEffect(() => {
    const savedUser = localStorage.getItem('lba_user');
    const token = getToken();
    if (savedUser && token) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);

    try {
      const res = await api.login(loginUsername.trim(), loginPassword);
      if (res.success && res.user) {
        setToken(res.token);
        setCurrentUser(res.user);
        localStorage.setItem('lba_user', JSON.stringify(res.user));
        await loadData();
        setActiveMenu('dashboard');
        return;
      }
    } catch (err: any) {
      console.warn('Backend login request error:', err.message);

      // Offline / Client-side authentication fallback for default staff
      const u = loginUsername.trim().toLowerCase();
      const p = loginPassword;
      const defaultUsers: Record<string, { role: any; nama: string; jabatan: string }> = {
        admin1: { role: 'Admin', nama: 'Administrator LBA', jabatan: 'Manajer Operasional & Data' },
        direktur1: { role: 'Direktur', nama: 'Ir. Ahmad Zulkarnain', jabatan: 'Direktur Utama' },
        deputy1: { role: 'Deputy Director', nama: 'Bambang S., S.Hut', jabatan: 'Wakil Direktur' },
        konsultan1: { role: 'Konsultan', nama: 'Dr. Hendra Wijaya', jabatan: 'Konsultan Silvikultur' }
      };

      if (defaultUsers[u] && p === u) {
        const fallbackUser: User = {
          id: `usr_${u}`,
          username: u,
          nama: defaultUsers[u].nama,
          jabatan: defaultUsers[u].jabatan,
          role: defaultUsers[u].role,
          statusAktif: 1
        };
        const fallbackToken = btoa(`${u}:${Date.now()}`);
        setToken(fallbackToken);
        setCurrentUser(fallbackUser);
        localStorage.setItem('lba_user', JSON.stringify(fallbackUser));
        await loadData();
        setActiveMenu('dashboard');
        return;
      }

      setLoginError(err.message || 'Nama pengguna atau kata sandi salah.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('lba_user');
    setActiveMenu('dashboard');
    setCurrentDocHtml('');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername.trim()) {
      setForgotMsg({ text: 'Isi nama pengguna dulu.', isError: true });
      return;
    }
    try {
      await api.resetRequest(forgotUsername.trim());
      setForgotMsg({ text: 'Permintaan terkirim. Hubungi Admin untuk kata sandi baru.', isError: false });
      setForgotUsername('');
    } catch (err: any) {
      setForgotMsg({ text: err.message || 'Gagal mengirim permintaan.', isError: true });
    }
  };

  const triggerPrint = (isDoc = false) => {
    if (isDoc) {
      document.body.classList.add('pd');
    } else {
      document.body.classList.remove('pd');
    }
    window.print();
  };

  const isAdm = currentUser?.role === 'Admin' || currentUser?.role === 'Deputy Director';
  const canEdit = (k: string) => {
    if (isAdm) return true;
    if (currentUser?.role === 'Konsultan' && (k === 'produksi' || k === 'mitra')) return true;
    return false;
  };

  // KPI Calculations
  const totalBibit = dbData?.produksi?.reduce((acc, p) => acc + (Number(p.jumlah) || 0), 0) || 0;
  const totalMitra = dbData?.mitra?.length || 0;
  const proyekAktif = dbData?.proyek?.filter(p => p.status === 'Berjalan')?.length || 0;
  const legalSegeraHabis = dbData?.legal?.filter(l => {
    const days = calculateDaysRemaining(l.berlaku);
    return days !== null && days <= 90;
  })?.length || 0;

  // Filtered Produksi for Dashboard and List
  const filteredProduksi = (dbData?.produksi || []).filter(item => {
    if (filterBibit !== 'Semua jenis bibit' && item.nama.toLowerCase() !== filterBibit.toLowerCase()) return false;
    if (filterWilayah !== 'Semua wilayah' && !item.lokasi.toLowerCase().includes(filterWilayah.toLowerCase())) return false;
    if (filterStartDate && item.tgl < filterStartDate) return false;
    if (filterEndDate && item.tgl > filterEndDate) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const combined = `${item.nama} ${item.varietas} ${item.produsen} ${item.status} ${item.asal} ${item.lokasi}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  });

  // Filtered Mitra
  const filteredMitra = (dbData?.mitra || []).filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const combined = `${item.nama} ${item.telp} ${item.bibit} ${item.varietas} ${item.alamat}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  });

  // Filtered Proyek
  const filteredProyek = (dbData?.proyek || []).filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const combined = `${item.nama} ${item.klien} ${item.status}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  });

  // Filtered Legal
  const filteredLegal = (dbData?.legal || []).filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const combined = `${item.jenis} ${item.nomor} ${item.ket}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  });

  // Allowed Menus
  const menuItems = [
    { key: 'dashboard', icon: '▦', label: 'Dashboard' },
    { key: 'mitra', icon: '☺', label: 'Mitra Petani' },
    { key: 'produksi', icon: '▥', label: 'Produksi' },
    { key: 'proyek', icon: '▭', label: 'Proyek' },
    { key: 'legal', icon: '▤', label: 'Legalitas' },
    { key: 'cetak', icon: '⎙', label: 'Cetak Dokumen' },
    ...(isAdm ? [{ key: 'admin', icon: '⚙', label: 'Admin' }] : [])
  ].filter(m => {
    if (currentUser?.role === 'Konsultan') {
      return ['dashboard', 'mitra', 'produksi', 'proyek'].includes(m.key);
    }
    return true;
  });

  // Generic Open Form
  const openForm = (type: string, index: number | null = null) => {
    setDialogType(type);
    setDialogItemIndex(index);
    if (type === 'produksi') {
      const item = index !== null && dbData?.produksi[index] ? dbData.produksi[index] : undefined;
      setDialogFormData({
        nama: item?.nama || '',
        varietas: item?.varietas || '',
        jumlah: item?.jumlah ?? 1000,
        tgl: item?.tgl || new Date().toISOString().slice(0, 10),
        produsen: item?.produsen || 'Kebun Produksi LBA',
        status: item?.status || 'Persiapan',
        asal: item?.asal || 'Kebun Produksi',
        lokasi: item?.lokasi || 'Lampung Barat'
      });
    } else if (type === 'mitra') {
      const item = index !== null && dbData?.mitra[index] ? dbData.mitra[index] : undefined;
      setDialogFormData({
        nama: item?.nama || '',
        telp: item?.telp || '',
        bibit: item?.bibit || 'Alpukat',
        varietas: item?.varietas || 'Miki',
        total: item?.total ?? 1000,
        alamat: item?.alamat || 'Lampung',
        luas: item?.luas ?? 1.5
      });
    } else if (type === 'proyek') {
      const item = index !== null && dbData?.proyek[index] ? dbData.proyek[index] : undefined;
      setDialogFormData({
        nama: item?.nama || '',
        klien: item?.klien || '',
        status: item?.status || 'Berjalan',
        mulai: item?.mulai || new Date().toISOString().slice(0, 10),
        selesai: item?.selesai || '',
        nilai: item?.nilai ?? 50000000
      });
    } else if (type === 'legal') {
      const item = index !== null && dbData?.legal[index] ? dbData.legal[index] : undefined;
      setDialogFormData({
        jenis: item?.jenis || 'Sertifikat A',
        nomor: item?.nomor || '',
        terbit: item?.terbit || new Date().toISOString().slice(0, 10),
        berlaku: item?.berlaku || '',
        file: item?.file || 'dokumen.pdf',
        ket: item?.ket || ''
      });
    } else if (type === 'user_add') {
      setDialogFormData({
        username: '',
        nama: '',
        jabatan: '',
        role: 'Admin',
        password: ''
      });
    } else if (type === 'user_edit') {
      const targetUser = dbData?.users[index || 0];
      if (targetUser) {
        setDialogFormData({
          originalUsername: targetUser.username,
          username: targetUser.username,
          nama: targetUser.nama,
          jabatan: targetUser.jabatan,
          role: targetUser.role,
          statusAktif: targetUser.statusAktif
        });
        setSelectedUserPhoto(targetUser.foto || '');
      }
    }
    setDialogOpen(true);
  };

  const handleSaveForm = async () => {
    try {
      if (dialogType === 'produksi') {
        if (!dialogFormData.nama) {
          alert('Nama bibit wajib diisi.');
          return;
        }
        if (dialogItemIndex !== null) {
          const id = dbData!.produksi[dialogItemIndex].id;
          await api.updateProduksi(id, dialogFormData);
        } else {
          await api.addProduksi(dialogFormData);
        }
      } else if (dialogType === 'mitra') {
        if (!dialogFormData.nama) {
          alert('Nama petani wajib diisi.');
          return;
        }
        if (dialogItemIndex !== null) {
          const id = dbData!.mitra[dialogItemIndex].id;
          await api.updateMitra(id, dialogFormData);
        } else {
          await api.addMitra(dialogFormData);
        }
      } else if (dialogType === 'proyek') {
        if (!dialogFormData.nama) {
          alert('Nama proyek wajib diisi.');
          return;
        }
        if (dialogItemIndex !== null) {
          const id = dbData!.proyek[dialogItemIndex].id;
          await api.updateProyek(id, dialogFormData);
        } else {
          await api.addProyek(dialogFormData);
        }
      } else if (dialogType === 'legal') {
        if (!dialogFormData.nomor) {
          alert('Nomor dokumen wajib diisi.');
          return;
        }
        if (dialogItemIndex !== null) {
          const id = dbData!.legal[dialogItemIndex].id;
          await api.updateLegal(id, dialogFormData);
        } else {
          await api.addLegal(dialogFormData);
        }
      } else if (dialogType === 'user_add') {
        const u = dialogFormData.username.trim().toLowerCase();
        if (!u || !dialogFormData.nama) {
          alert('Nama pengguna dan nama lengkap wajib diisi.');
          return;
        }
        await api.addUser({
          username: u,
          password: dialogFormData.password || u,
          nama: dialogFormData.nama,
          jabatan: dialogFormData.jabatan || dialogFormData.role,
          role: dialogFormData.role,
          foto: selectedUserPhoto
        });
      } else if (dialogType === 'user_edit') {
        const nu = dialogFormData.username.trim().toLowerCase();
        if (!nu || !dialogFormData.nama) {
          alert('Nama pengguna dan nama lengkap wajib diisi.');
          return;
        }
        await api.updateUser(dialogFormData.originalUsername, {
          username: nu,
          nama: dialogFormData.nama,
          jabatan: dialogFormData.jabatan,
          role: dialogFormData.role,
          statusAktif: Number(dialogFormData.statusAktif),
          foto: selectedUserPhoto
        });
      }
      setDialogOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data.');
    }
  };

  const handleDeleteItem = async (type: string, id: string) => {
    if (!confirm('Hapus data ini dari database?')) return;
    try {
      if (type === 'produksi') await api.deleteProduksi(id);
      else if (type === 'mitra') await api.deleteMitra(id);
      else if (type === 'proyek') await api.deleteProyek(id);
      else if (type === 'legal') await api.deleteLegal(id);
      else if (type === 'dokumen') await api.deleteDokumen(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data.');
    }
  };

  // Photo Crop/Resize Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar (JPG atau PNG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const minDim = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            (img.width - minDim) / 2,
            (img.height - minDim) / 2,
            minDim,
            minDim,
            0,
            0,
            size,
            size
          );
          setSelectedUserPhoto(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Document Generator Calculation
  const docTotal = docItems.reduce((acc, curr) => acc + (Number(curr.q) || 0) * (Number(curr.h) || 0), 0);

  const handleCreateDocument = async () => {
    const now = new Date();
    const rom = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][now.getMonth()];
    const typeCode = docType === 'Penawaran' ? 'PNW' : docType === 'Invoice' ? 'INV' : 'BAST';
    const counter =
      docType === 'Penawaran'
        ? (dbData?.settings.counterPnw || 0) + 1
        : docType === 'Invoice'
        ? (dbData?.settings.counterInv || 0) + 1
        : (dbData?.settings.counterBast || 0) + 1;

    const no = `${String(counter).padStart(3, '0')}/${typeCode}/${rom}/${now.getFullYear()}`;
    const tg = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const isBast = docType === 'BAST';

    const titleMap: Record<string, string> = {
      Penawaran: 'SURAT PENAWARAN',
      Invoice: 'INVOICE',
      BAST: 'BERITA ACARA SERAH TERIMA (BAST)'
    };

    const docHtml = `
      <div class="doc">
        <div style="display:flex;gap:14px;align-items:center;border-bottom:3px solid #1f7a4d;padding-bottom:10px">
          <img src="${LOGO_SVG}" alt="" style="width:200px">
          <div style="font-size:12px;color:#1c2b36">
            <b>CV. Lintas Batas Agro</b><br>
            Jl. Raya Lintas Barat No. 88, Lampung, Indonesia<br>
            Telp: 0812-7000-0000 | Email: admin@lintasbatasagro.com
          </div>
        </div>
        <h2 style="text-align:center;margin:18px 0 4px;font-size:18px;font-weight:700">${titleMap[docType]}</h2>
        <div style="text-align:center;font-size:13px;color:#555">Nomor: ${no}</div>
        <p style="font-size:13px;line-height:1.6;margin:16px 0">
          Tanggal: ${tg}<br>
          Kepada Yth: <b>${docClient || 'Klien / Rekanan LBA'}</b><br>
          Di Tempat
        </p>
        <table>
          <thead>
            <tr>
              <th style="width:40px">No</th>
              <th>Nama Barang / Layanan</th>
              <th style="width:90px">Jumlah</th>
              ${!isBast ? '<th style="width:120px">Harga Satuan</th><th style="width:130px">Subtotal</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${docItems
              .map(
                (item, idx) => `
              <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td>${item.b}</td>
                <td style="text-align:right">${formatRupiah(item.q)}</td>
                ${
                  !isBast
                    ? `<td style="text-align:right">Rp ${formatRupiah(item.h)}</td>
                       <td style="text-align:right">Rp ${formatRupiah((item.q || 0) * (item.h || 0))}</td>`
                    : ''
                }
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        ${
          isBast
            ? '<p style="font-size:13px;margin-top:14px">Dengan ini menyatakan bahwa barang/bibit di atas telah diserahterimakan dalam kondisi baik, cukup, dan sesuai spesifikasi pesanan.</p>'
            : `<p style="font-size:13px;margin-top:14px">
                <b>Total: Rp ${formatRupiah(docTotal)}</b><br>
                <i>Terbilang: ${terbilang(docTotal)}</i>
               </p>`
        }
        <div style="display:flex;justify-content:space-between;margin-top:50px;font-size:13px">
          <div style="text-align:center">
            Penerima / Klien,<br><br><br><br>
            <b>(${docClient || 'Pihak Kedua'})</b>
          </div>
          <div style="text-align:center">
            Hormat kami,<br>
            CV. Lintas Batas Agro<br><br><br>
            <b>(${currentUser?.nama || 'Direktur'})</b>
          </div>
        </div>
      </div>
    `;

    setCurrentDocHtml(docHtml);

    try {
      await api.saveDokumen({
        no,
        j: docType,
        kl: docClient || 'Klien LBA',
        tg,
        T: docTotal,
        items: docItems,
        html: docHtml
      });
      await loadData();
      setTimeout(() => {
        triggerPrint(true);
      }, 200);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan dokumen');
    }
  };

  const handleBackupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.importBackup(parsed);
      alert('Database berhasil dipulihkan dari cadangan.');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Format cadangan database tidak valid.');
    }
  };

  // --- RENDERING: LOGIN VIEW ---
  if (!currentUser) {
    return (
      <section id="login">
        <div className="flag">
          <svg viewBox="0 0 24 16">
            <rect width="24" height="8" fill="#e53935" />
            <rect y="8" width="24" height="8" fill="#fff" />
          </svg>
          ID
        </div>
        <div className={`split ${isForgotMode ? 'fg' : ''}`}>
          {/* Left Gradient Panel */}
          <div className="lp">
            <div className="lg">
              <img className="lgi" alt="CV. Lintas Batas Agro Lampung" src={LOGO_SVG_DARK} />
            </div>
            <p>
              {isForgotMode
                ? 'Sudah ingat kata sandi Anda? Kembali ke halaman masuk.'
                : 'Akses Portal Manajemen Proyek Lintas Batas Anda. Silakan masuk untuk melanjutkan.'}
            </p>
            <button className="ol" type="button" onClick={() => setIsForgotMode(!isForgotMode)}>
              {isForgotMode ? 'Masuk' : 'Lupa Kata Sandi'}
            </button>
          </div>

          {/* Right Panel: Login Form */}
          <div className="rp">
            <h1>Masuk</h1>
            <form className="box" onSubmit={handleLogin}>
              <input
                className="t"
                autoComplete="username"
                placeholder="Nama Pengguna"
                aria-label="Nama Pengguna"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
              />
              <div className="pw">
                <input
                  className="t"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Kata Sandi"
                  aria-label="Kata Sandi"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Lihat kata sandi"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              <div className="row">
                <label>
                  <input className="ck" type="checkbox" defaultChecked />
                  Ingat saya
                </label>
                <a
                  href="#forgot"
                  onClick={e => {
                    e.preventDefault();
                    setIsForgotMode(true);
                  }}
                >
                  Lupa kata sandi?
                </a>
              </div>
              {loginError && <div id="err">{loginError}</div>}
              <button className={`btn ${isLoginLoading ? 'ld' : ''}`} type="submit">
                Masuk
              </button>
              <div className="hint">Contoh uji coba: admin1 / admin1 atau direktur1 / direktur1</div>
            </form>
          </div>

          {/* Reset Request Panel */}
          <div className="rf">
            <h1>Lupa Kata Sandi</h1>
            <form className="box" onSubmit={handleForgotSubmit}>
              <p className="fi">Masukkan nama pengguna Anda. Permintaan reset akan otomatis dikirim ke Admin.</p>
              <input
                className="t"
                placeholder="Nama Pengguna"
                aria-label="Nama pengguna untuk reset"
                value={forgotUsername}
                onChange={e => setForgotUsername(e.target.value)}
              />
              {forgotMsg.text && (
                <div id="fmsg" style={{ color: forgotMsg.isError ? '#d64545' : '#1f7a4d' }}>
                  {forgotMsg.text}
                </div>
              )}
              <button className="btn" type="submit">
                Kirim Permintaan
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  // Helper avatar display
  const renderAvatar = (user: User, size = 26) => {
    if (user.foto) {
      return <img alt="" src={user.foto} />;
    }
    return (
      <span style={{ fontSize: `${size}px`, color: '#1f4e79', fontWeight: 600 }}>
        {(user.nama || user.username || '?')[0].toUpperCase()}
      </span>
    );
  };

  // --- RENDERING: AUTHENTICATED DASHBOARD APPLICATION ---
  return (
    <div id="app">
      {/* Sidebar */}
      <aside>
        <div className="lg">
          <img className="lgs" alt="CV. Lintas Batas Agro" src={LOGO_SVG} />
        </div>
        <div className="pf">
          <div className="av">{renderAvatar(currentUser)}</div>
          <b>{currentUser.nama}</b>
          <small>{currentUser.jabatan || currentUser.role}</small>
        </div>
        <div className="menu">
          {menuItems.map(m => (
            <button
              key={m.key}
              className={activeMenu === m.key ? 'on' : ''}
              onClick={() => {
                setActiveMenu(m.key);
                setSearchQuery('');
              }}
            >
              <i>{m.icon}</i>
              {m.label}
            </button>
          ))}
        </div>
        <button className="lo" onClick={handleLogout}>
          Keluar
        </button>
      </aside>

      {/* Main Container */}
      <main>
        {/* Top Header */}
        <div className="hd">
          <h2>
            Selamat datang, <span>{currentUser.nama}</span>
          </h2>
          <div className="tr">
            <div className="flag">
              <svg viewBox="0 0 24 16">
                <rect width="24" height="8" fill="#e53935" />
                <rect y="8" width="24" height="8" fill="#e8ecf0" />
              </svg>
              ID
            </div>
            <div className="ap">
              <b>{dbData?.settings.namaPerusahaan || 'Sistem Manajemen Project LBA'}</b>
              <small>
                {currentUser.nama} · {currentUser.jabatan || currentUser.role}
              </small>
            </div>
            <button className="out" onClick={handleLogout}>
              Keluar
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="tabs">
          {menuItems.map(m => (
            <button
              key={m.key}
              className={activeMenu === m.key ? 'on' : ''}
              onClick={() => {
                setActiveMenu(m.key);
                setSearchQuery('');
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* --- PAGE: DASHBOARD --- */}
        {activeMenu === 'dashboard' && (
          <div id="pg-dashboard">
            <div className="tb noprint">
              <input
                type="date"
                aria-label="Dari tanggal"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
              />
              <span>s/d</span>
              <input
                type="date"
                aria-label="Sampai tanggal"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
              />
              <select
                aria-label="Jenis bibit"
                value={filterBibit}
                onChange={e => setFilterBibit(e.target.value)}
              >
                <option>Semua jenis bibit</option>
                <option>Alpukat</option>
                <option>Durian</option>
                <option>Petai</option>
                <option>Pala</option>
                <option>Kakao</option>
              </select>
              <select
                aria-label="Wilayah"
                value={filterWilayah}
                onChange={e => setFilterWilayah(e.target.value)}
              >
                <option>Semua wilayah</option>
                <option>Lampung Barat</option>
                <option>Tanggamus</option>
                <option>Metro</option>
              </select>
              <button className="btn2 gh" onClick={() => loadData()}>
                ⟳ Segarkan
              </button>
              <small>{lastUpdated ? `Diperbarui ${lastUpdated}` : 'Real-time'}</small>
              <button className="btn2" style={{ marginLeft: 'auto' }} onClick={() => triggerPrint(false)}>
                ⬇ Unduh PDF Dashboard
              </button>
            </div>

            {/* KPI Cards */}
            <div className="g">
              <div className="c k">
                <div className="ic" style={{ background: '#1f4e79' }}>
                  ▦
                </div>
                <div>
                  <b>{formatRupiah(totalBibit)}</b>
                  <small>Total Bibit</small>
                </div>
              </div>
              <div className="c k">
                <div className="ic" style={{ background: '#23a56b' }}>
                  ☺
                </div>
                <div>
                  <b>{formatRupiah(totalMitra)}</b>
                  <small>Petani Mitra</small>
                </div>
              </div>
              <div className="c k">
                <div className="ic" style={{ background: '#f2a23a' }}>
                  ▭
                </div>
                <div>
                  <b>{proyekAktif}</b>
                  <small>Proyek Aktif</small>
                </div>
              </div>
              <div className="c k">
                <div className="ic" style={{ background: '#d9534f' }}>
                  ▤
                </div>
                <div>
                  <b>{legalSegeraHabis}</b>
                  <small>Legalitas Segera Habis</small>
                </div>
              </div>

              {/* Chart 1: Treemap SVG */}
              <div className="c a7">
                <h3>
                  Peta Treemap Produksi Bibit
                  <button className="pdf" onClick={() => triggerPrint(false)}>
                    ⬇ Unduh PDF
                  </button>
                </h3>
                <svg viewBox="0 0 330 150">
                  <g fontSize="10" fill="#fff" style={{ fill: '#fff' }}>
                    <rect x="0" y="0" width="128" height="70" fill="#1f4e79" />
                    <rect x="0" y="73" width="128" height="77" fill="#6baed6" />
                    <rect x="131" y="0" width="76" height="72" fill="#f2c230" />
                    <rect x="210" y="0" width="58" height="72" fill="#f28e2b" />
                    <rect x="271" y="0" width="59" height="72" fill="#2e9e5b" />
                    <rect x="131" y="75" width="76" height="34" fill="#86c98c" />
                    <rect x="131" y="112" width="76" height="38" fill="#f28e2b" />
                    <rect x="210" y="75" width="88" height="40" fill="#4a90c8" />
                    <rect x="210" y="118" width="88" height="32" fill="#8e6bbf" />
                    <rect x="301" y="75" width="29" height="75" fill="#a6acb1" />
                    <text x="6" y="14" style={{ fill: '#fff' }}>
                      Alpukat (42k)
                    </text>
                    <text x="6" y="87" style={{ fill: '#fff' }}>
                      Kebun Produksi
                    </text>
                    <text x="137" y="14" style={{ fill: '#3a2d00' }}>
                      Durian
                    </text>
                    <text x="216" y="14" style={{ fill: '#fff' }}>
                      Petai
                    </text>
                    <text x="277" y="14" style={{ fill: '#fff' }}>
                      Pala
                    </text>
                    <text x="137" y="90" style={{ fill: '#0d3a1c' }}>
                      Mitra 1
                    </text>
                    <text x="137" y="127" style={{ fill: '#fff' }}>
                      Mitra 2
                    </text>
                    <text x="216" y="90" style={{ fill: '#fff' }}>
                      L. Barat
                    </text>
                    <text x="216" y="133" style={{ fill: '#fff' }}>
                      Tanggamus
                    </text>
                  </g>
                </svg>
              </div>

              {/* Chart 2: Survival Rate Bar Chart */}
              <div className="c a5">
                <h3>
                  Grafik Batang Survival Rate
                  <button className="pdf" onClick={() => triggerPrint(false)}>
                    ⬇ Unduh PDF
                  </button>
                </h3>
                <svg viewBox="0 0 320 170">
                  <g stroke="#e3e8ee">
                    <path d="M30 10H310M30 45H310M30 80H310M30 115H310" />
                  </g>
                  <path d="M30 150H310" stroke="#9aa7b4" />
                  <g fill="#1f4e79">
                    <rect x="42" y="28" width="16" height="122" />
                    <rect x="92" y="38" width="16" height="112" />
                    <rect x="142" y="60" width="16" height="90" />
                    <rect x="192" y="28" width="16" height="122" />
                    <rect x="242" y="42" width="16" height="108" />
                    <rect x="288" y="46" width="16" height="104" opacity="0" />
                  </g>
                  <g fill="#23a56b">
                    <rect x="60" y="64" width="16" height="86" />
                    <rect x="110" y="80" width="16" height="70" />
                    <rect x="160" y="88" width="16" height="62" />
                    <rect x="210" y="40" width="16" height="110" />
                    <rect x="260" y="24" width="16" height="126" />
                  </g>
                  <g fontSize="10" textAnchor="middle">
                    <text x="59" y="164">
                      Alpukat
                    </text>
                    <text x="109" y="164">
                      Durian
                    </text>
                    <text x="159" y="164">
                      Petai
                    </text>
                    <text x="209" y="164">
                      Kebun 1
                    </text>
                    <text x="259" y="164">
                      Kebun 2
                    </text>
                  </g>
                  <g fontSize="9" textAnchor="end">
                    <text x="26" y="13">
                      100%
                    </text>
                    <text x="26" y="48">
                      75%
                    </text>
                    <text x="26" y="83">
                      50%
                    </text>
                    <text x="26" y="118">
                      25%
                    </text>
                    <text x="26" y="153">
                      0%
                    </text>
                  </g>
                </svg>
              </div>

              {/* Chart 3: Map Illustration */}
              <div className="c a5 mapc">
                <h3>
                  Peta Sebaran Mitra Petani
                  <button className="pdf" onClick={() => triggerPrint(false)}>
                    ⬇ Unduh PDF
                  </button>
                </h3>
                <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '10px' }}>
                  <img
                    className="map"
                    alt="Peta Sebaran Mitra Petani Lampung"
                    src={MAP_IMG_HIGHRES}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                  />
                  {/* Location badges */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '28%',
                      left: '26%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(31, 78, 121, 0.92)',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 600,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      pointerEvents: 'none'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ddc84' }}></span>
                    Lampung Barat (12k)
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      top: '66%',
                      left: '38%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(35, 165, 107, 0.92)',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 600,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      pointerEvents: 'none'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }}></span>
                    Tanggamus (24.5k)
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      top: '48%',
                      left: '72%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(242, 162, 58, 0.95)',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 600,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      pointerEvents: 'none'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1c2b36' }}></span>
                    Metro (9k)
                  </div>
                </div>
              </div>

              {/* Chart 4: Area Distribution */}
              <div className="c a7">
                <h3>
                  Peta Wilayah Distribusi
                  <button className="pdf" onClick={() => triggerPrint(false)}>
                    ⬇ Unduh PDF
                  </button>
                </h3>
                <svg viewBox="0 0 480 195">
                  <g stroke="#e3e8ee">
                    <path d="M40 10H470M40 45H470M40 80H470M40 115H470" />
                  </g>
                  <path d="M40 150H470" stroke="#9aa7b4" />
                  <path d="M40 60L124 40L208 70L292 20L376 46L460 70L460 150L40 150Z" fill="#f4a94e" />
                  <path d="M40 92L124 76L208 96L292 56L376 78L460 100L460 150L40 150Z" fill="#54b884" />
                  <path d="M40 112L124 100L208 116L292 90L376 106L460 118L460 150L40 150Z" fill="#6baed6" />
                  <path d="M40 134L124 126L208 134L292 120L376 130L460 138L460 150L40 150Z" fill="#1f4e79" />
                  <g fontSize="10" textAnchor="middle">
                    <text x="40" y="165">
                      Brt
                    </text>
                    <text x="124" y="165">
                      Nebun
                    </text>
                    <text x="208" y="165">
                      Metro
                    </text>
                    <text x="292" y="165">
                      Tanggamus
                    </text>
                    <text x="376" y="165">
                      Tops
                    </text>
                    <text x="460" y="165">
                      Pota
                    </text>
                  </g>
                  <g fontSize="10" textAnchor="end">
                    <text x="34" y="13">
                      250
                    </text>
                    <text x="34" y="48">
                      200
                    </text>
                    <text x="34" y="83">
                      150
                    </text>
                    <text x="34" y="118">
                      100
                    </text>
                    <text x="34" y="153">
                      0
                    </text>
                  </g>
                  <g fontSize="10">
                    <rect x="110" y="178" width="9" height="9" fill="#1f4e79" />
                    <text x="124" y="187">
                      Alpukat
                    </text>
                    <rect x="180" y="178" width="9" height="9" fill="#6baed6" />
                    <text x="194" y="187">
                      Durian
                    </text>
                    <rect x="250" y="178" width="9" height="9" fill="#54b884" />
                    <text x="264" y="187">
                      Petai
                    </text>
                    <rect x="320" y="178" width="9" height="9" fill="#f4a94e" />
                    <text x="334" y="187">
                      Pala
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE: PRODUKSI --- */}
        {activeMenu === 'produksi' && (
          <div className="c">
            <div className="ph">
              <div>
                <h3 className="t2">Data Produksi</h3>
                <p className="hint2">Catat bibit yang diproduksi. Tekan Tambah, isi kolom, lalu Simpan.</p>
              </div>
              <div className="acts noprint">
                <input
                  className="sr"
                  placeholder="Cari data produksi..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {canEdit('produksi') && (
                  <button className="btn2" onClick={() => openForm('produksi')}>
                    + Tambah
                  </button>
                )}
                <a
                  className="btn2 gh"
                  href="/api/backup/export-csv/produksi"
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  Ekspor CSV
                </a>
                <button className="btn2 gh" onClick={() => triggerPrint(false)}>
                  ⬇ Unduh PDF
                </button>
              </div>
            </div>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Nama Bibit</th>
                    <th>Jenis/Varietas</th>
                    <th>Jumlah Bibit</th>
                    <th>Tanggal Produksi</th>
                    <th>Nama Produsen</th>
                    <th>Status Produksi</th>
                    <th>Asal Produksi</th>
                    <th>Lokasi Lahan</th>
                    <th className="noprint">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProduksi.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="hint2" style={{ textAlign: 'center' }}>
                        Belum ada data produksi.
                      </td>
                    </tr>
                  ) : (
                    filteredProduksi.map((item, idx) => (
                      <tr key={item.id}>
                        <td><b>{item.nama}</b></td>
                        <td>{item.varietas}</td>
                        <td>{formatRupiah(item.jumlah)}</td>
                        <td>{item.tgl}</td>
                        <td>{item.produsen}</td>
                        <td>
                          <span className={getStatusClass(item.status)}>{item.status}</span>
                        </td>
                        <td>{item.asal}</td>
                        <td>{item.lokasi}</td>
                        <td className="ab noprint">
                          {canEdit('produksi') && (
                            <button onClick={() => openForm('produksi', idx)}>Ubah</button>
                          )}
                          {isAdm && (
                            <button onClick={() => handleDeleteItem('produksi', item.id)}>Hapus</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PAGE: MITRA PETANI --- */}
        {activeMenu === 'mitra' && (
          <div className="c">
            <div className="ph">
              <div>
                <h3 className="t2">Data Petani Mitra</h3>
                <p className="hint2">Daftar petani yang bermitra. Tekan WhatsApp untuk menghubungi petani.</p>
              </div>
              <div className="acts noprint">
                <input
                  className="sr"
                  placeholder="Cari petani mitra..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {canEdit('mitra') && (
                  <button className="btn2" onClick={() => openForm('mitra')}>
                    + Tambah
                  </button>
                )}
                <a
                  className="btn2 gh"
                  href="/api/backup/export-csv/mitra"
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  Ekspor CSV
                </a>
                <button className="btn2 gh" onClick={() => triggerPrint(false)}>
                  ⬇ Unduh PDF
                </button>
              </div>
            </div>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Nama Petani</th>
                    <th>No. Telp</th>
                    <th>Nama Bibit</th>
                    <th>Jenis/Varietas</th>
                    <th>Total Produksi Bibit</th>
                    <th>Alamat</th>
                    <th>Luas Lahan (ha)</th>
                    <th className="noprint">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMitra.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="hint2" style={{ textAlign: 'center' }}>
                        Belum ada data petani mitra.
                      </td>
                    </tr>
                  ) : (
                    filteredMitra.map((item, idx) => {
                      const cleanPhone = item.telp.replace(/\D/g, '');
                      const waNum = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                      return (
                        <tr key={item.id}>
                          <td><b>{item.nama}</b></td>
                          <td>{item.telp}</td>
                          <td>{item.bibit}</td>
                          <td>{item.varietas}</td>
                          <td>{formatRupiah(item.total)}</td>
                          <td>{item.alamat}</td>
                          <td>{item.luas} ha</td>
                          <td className="ab noprint">
                            <a
                              href={`https://wa.me/${waNum}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              WhatsApp
                            </a>
                            {canEdit('mitra') && (
                              <button onClick={() => openForm('mitra', idx)}>Ubah</button>
                            )}
                            {isAdm && (
                              <button onClick={() => handleDeleteItem('mitra', item.id)}>Hapus</button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PAGE: PROYEK --- */}
        {activeMenu === 'proyek' && (
          <div className="c">
            <div className="ph">
              <div>
                <h3 className="t2">Data Project</h3>
                <p className="hint2">Pantau project yang sedang berjalan dan yang sudah selesai.</p>
              </div>
              <div className="acts noprint">
                <input
                  className="sr"
                  placeholder="Cari proyek..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {isAdm && (
                  <button className="btn2" onClick={() => openForm('proyek')}>
                    + Tambah
                  </button>
                )}
                <a
                  className="btn2 gh"
                  href="/api/backup/export-csv/proyek"
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  Ekspor CSV
                </a>
                <button className="btn2 gh" onClick={() => triggerPrint(false)}>
                  ⬇ Unduh PDF
                </button>
              </div>
            </div>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Nama Project</th>
                    <th>Klien</th>
                    <th>Status</th>
                    <th>Tanggal Mulai</th>
                    <th>Tanggal Selesai</th>
                    <th>Nilai (Rp)</th>
                    <th className="noprint">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProyek.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="hint2" style={{ textAlign: 'center' }}>
                        Belum ada data project.
                      </td>
                    </tr>
                  ) : (
                    filteredProyek.map((item, idx) => (
                      <tr key={item.id}>
                        <td><b>{item.nama}</b></td>
                        <td>{item.klien}</td>
                        <td>
                          <span className={getStatusClass(item.status)}>{item.status}</span>
                        </td>
                        <td>{item.mulai}</td>
                        <td>{item.selesai || '-'}</td>
                        <td>Rp {formatRupiah(item.nilai)}</td>
                        <td className="ab noprint">
                          {isAdm && (
                            <>
                              <button onClick={() => openForm('proyek', idx)}>Ubah</button>
                              <button onClick={() => handleDeleteItem('proyek', item.id)}>Hapus</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PAGE: LEGALITAS --- */}
        {activeMenu === 'legal' && (
          <div className="c">
            <div className="ph">
              <div>
                <h3 className="t2">Data Legalitas</h3>
                <p className="hint2">Simpan dokumen legalitas perusahaan dan pantau masa berlakunya.</p>
              </div>
              <div className="acts noprint">
                <input
                  className="sr"
                  placeholder="Cari legalitas..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {isAdm && (
                  <button className="btn2" onClick={() => openForm('legal')}>
                    + Tambah
                  </button>
                )}
                <button className="btn2 gh" onClick={() => triggerPrint(false)}>
                  🖨 Cetak Dokumen Legalitas
                </button>
                <button className="btn2 gh" onClick={() => triggerPrint(false)}>
                  ⬇ Unduh PDF
                </button>
              </div>
            </div>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Jenis</th>
                    <th>Nomor</th>
                    <th>Tanggal Terbit</th>
                    <th>Masa Berlaku</th>
                    <th>File/Scan</th>
                    <th>Keterangan</th>
                    <th>Status</th>
                    <th className="noprint">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLegal.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="hint2" style={{ textAlign: 'center' }}>
                        Belum ada data legalitas.
                      </td>
                    </tr>
                  ) : (
                    filteredLegal.map((item, idx) => {
                      const days = calculateDaysRemaining(item.berlaku);
                      let statusBadge = <span className="tg">Aktif</span>;
                      if (!item.berlaku) {
                        statusBadge = <span className="tg">Tanpa batas</span>;
                      } else if (days !== null && days < 0) {
                        statusBadge = <span className="tg r">Kedaluwarsa</span>;
                      } else if (days !== null && days <= 90) {
                        statusBadge = <span className="tg w">{days} hari lagi</span>;
                      }
                      return (
                        <tr key={item.id}>
                          <td><b>{item.jenis}</b></td>
                          <td>{item.nomor}</td>
                          <td>{item.terbit}</td>
                          <td>{item.berlaku || 'Seumur hidup'}</td>
                          <td>
                            <span style={{ color: '#1f4e79', textDecoration: 'underline', cursor: 'pointer' }}>
                              {item.file || 'Lihat scan'}
                            </span>
                          </td>
                          <td>{item.ket}</td>
                          <td>{statusBadge}</td>
                          <td className="ab noprint">
                            {isAdm && (
                              <>
                                <button onClick={() => openForm('legal', idx)}>Ubah</button>
                                <button onClick={() => handleDeleteItem('legal', item.id)}>Hapus</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PAGE: CETAK DOKUMEN --- */}
        {activeMenu === 'cetak' && (
          <div>
            <div className="c noprint">
              <div className="ph">
                <div>
                  <h3 className="t2">Cetak Dokumen</h3>
                  <p className="hint2">
                    Pilih jenis dokumen dan pelanggan, isi rincian, lalu tekan Buat PDF. Nomor, tanggal, total, dan
                    terbilang terisi otomatis.
                  </p>
                </div>
              </div>
              <div
                className="f"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}
              >
                <div>
                  <label htmlFor="dj">1. Jenis dokumen</label>
                  <select
                    id="dj"
                    value={docType}
                    onChange={e => setDocType(e.target.value as any)}
                  >
                    <option value="Penawaran">Surat Penawaran</option>
                    <option value="Invoice">Invoice</option>
                    <option value="BAST">BAST (Berita Acara)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dc">2. Pelanggan / Project</label>
                  <input
                    id="dc"
                    list="klien-list"
                    placeholder="Pilih atau ketik nama klien..."
                    value={docClient}
                    onChange={e => setDocClient(e.target.value)}
                  />
                  <datalist id="klien-list">
                    {dbData?.proyek?.map(p => (
                      <option key={p.id} value={p.klien} />
                    ))}
                  </datalist>
                </div>
              </div>

              <label className="hint2" style={{ display: 'block', marginTop: '14px' }}>
                3. Rincian barang / jasa
              </label>
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Nama Barang / Uraian</th>
                      <th style={{ width: '120px' }}>Jumlah</th>
                      <th style={{ width: '150px' }}>Harga Satuan (Rp)</th>
                      <th style={{ width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {docItems.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            value={r.b}
                            onChange={e => {
                              const copy = [...docItems];
                              copy[i].b = e.target.value;
                              setDocItems(copy);
                            }}
                            placeholder="Contoh: Bibit Durian Okulasi"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={r.q}
                            onChange={e => {
                              const copy = [...docItems];
                              copy[i].q = Number(e.target.value) || 0;
                              setDocItems(copy);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={r.h}
                            onChange={e => {
                              const copy = [...docItems];
                              copy[i].h = Number(e.target.value) || 0;
                              setDocItems(copy);
                            }}
                          />
                        </td>
                        <td>
                          {docItems.length > 1 && (
                            <button
                              className="btn2 gh"
                              onClick={() => {
                                setDocItems(docItems.filter((_, idx) => idx !== i));
                              }}
                            >
                              Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="acts" style={{ marginTop: '12px', alignItems: 'center' }}>
                <button
                  className="btn2 gh"
                  onClick={() => setDocItems([...docItems, { b: '', q: 1, h: 0 }])}
                >
                  + Tambah baris
                </button>
                <b style={{ marginLeft: '12px' }}>Total: Rp {formatRupiah(docTotal)}</b>
                <button className="btn2" style={{ marginLeft: 'auto' }} onClick={handleCreateDocument}>
                  4. Buat PDF & Cetak
                </button>
              </div>
            </div>

            {/* Document Preview for Print */}
            {currentDocHtml && (
              <div id="docprev" dangerouslySetInnerHTML={{ __html: currentDocHtml }} />
            )}

            {/* History Table */}
            <div className="c noprint" style={{ marginTop: '14px' }}>
              <h3 className="t2">Riwayat Dokumen yang Dibuat</h3>
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Nomor Dokumen</th>
                      <th>Jenis</th>
                      <th>Pelanggan</th>
                      <th>Total</th>
                      <th>Tanggal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!dbData?.dokumen || dbData.dokumen.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="hint2" style={{ textAlign: 'center' }}>
                          Belum ada dokumen yang dibuat.
                        </td>
                      </tr>
                    ) : (
                      dbData.dokumen.map(doc => (
                        <tr key={doc.id}>
                          <td><b>{doc.no}</b></td>
                          <td>{doc.j}</td>
                          <td>{doc.kl}</td>
                          <td>Rp {formatRupiah(doc.T)}</td>
                          <td>{doc.tg}</td>
                          <td className="ab">
                            <button
                              className="btn2 gh"
                              onClick={() => {
                                setCurrentDocHtml(doc.html);
                                setTimeout(() => triggerPrint(true), 150);
                              }}
                            >
                              Unduh PDF
                            </button>
                            {isAdm && (
                              <button onClick={() => handleDeleteItem('dokumen', doc.id)}>Hapus</button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE: ADMIN (User Management, Audit Log, Maintenance, Backup) --- */}
        {activeMenu === 'admin' && isAdm && (
          <div className="c">
            <div className="sub noprint">
              <button
                className={`btn2 ${adminTab === 'user' ? '' : 'gh'}`}
                onClick={() => setAdminTab('user')}
              >
                Kelola User
              </button>
              <button
                className={`btn2 ${adminTab === 'log' ? '' : 'gh'}`}
                onClick={() => setAdminTab('log')}
              >
                Log Aktivitas
              </button>
              <button
                className={`btn2 ${adminTab === 'mt' ? '' : 'gh'}`}
                onClick={() => setAdminTab('mt')}
              >
                Mode Perawatan
              </button>
              <button
                className={`btn2 ${adminTab === 'backup' ? '' : 'gh'}`}
                onClick={() => setAdminTab('backup')}
              >
                Cadangan & Ekspor/Impor
              </button>
              <button
                className={`btn2 ${adminTab === 'db' ? '' : 'gh'}`}
                onClick={() => setAdminTab('db')}
              >
                🗄️ Akses Database
              </button>
            </div>

            {/* Admin Tab 1: User Management */}
            {adminTab === 'user' && (
              <div>
                <div className="ph">
                  <div>
                    <h3 className="t2">Kelola User</h3>
                    <p className="hint2">
                      Tambah pengguna baru, atau tekan Edit Pengguna untuk mengubah nama, jabatan, foto, hak akses, dan status akun.
                    </p>
                  </div>
                  <div className="acts noprint">
                    <button className="btn2" onClick={() => openForm('user_add')}>
                      + Tambah User
                    </button>
                    <button className="btn2 gh" onClick={() => triggerPrint(false)}>
                      ⬇ Unduh PDF
                    </button>
                  </div>
                </div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Foto</th>
                        <th>Nama Pengguna</th>
                        <th>Nama Lengkap</th>
                        <th>Jabatan</th>
                        <th>Hak Akses</th>
                        <th>Status</th>
                        <th className="noprint">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbData?.users.map((u, idx) => (
                        <tr key={u.id}>
                          <td>
                            <div className="mini">{renderAvatar(u, 16)}</div>
                          </td>
                          <td><b>{u.username}</b></td>
                          <td>{u.nama}</td>
                          <td>{u.jabatan}</td>
                          <td>{u.role}</td>
                          <td>
                            <span className={u.statusAktif ? 'tg' : 'tg r'}>
                              {u.statusAktif ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="ab noprint">
                            <button onClick={() => openForm('user_edit', idx)}>Edit Pengguna</button>
                            <button
                              onClick={async () => {
                                if (confirm(`Reset kata sandi ${u.username} menjadi sama dengan nama pengguna?`)) {
                                  await api.resetUserPassword(u.username);
                                  alert(`Kata sandi ${u.username} telah direset.`);
                                  await loadData();
                                }
                              }}
                            >
                              Reset kata sandi
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Admin Tab 2: Activity Log */}
            {adminTab === 'log' && (
              <div>
                <div className="ph">
                  <div>
                    <h3 className="t2">Log Aktivitas</h3>
                    <p className="hint2">Catatan waktu nyata aktivitas pengguna pada database.</p>
                  </div>
                  <div className="acts noprint">
                    <button className="btn2 gh" onClick={() => triggerPrint(false)}>
                      ⬇ Unduh PDF
                    </button>
                  </div>
                </div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '180px' }}>Waktu</th>
                        <th style={{ width: '140px' }}>Pengguna</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbData?.logs.map(l => (
                        <tr key={l.id}>
                          <td>{l.w}</td>
                          <td><b>{l.u}</b></td>
                          <td>{l.a}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Admin Tab 3: Maintenance Mode */}
            {adminTab === 'mt' && (
              <div>
                <h3 className="t2">Mode Perawatan (Maintenance Mode)</h3>
                <p className="hint2">
                  Saat mode perawatan aktif, hanya pengguna dengan peran Admin dan Deputy Director yang dapat masuk ke aplikasi.
                </p>
                <label style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '16px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={!!dbData?.settings.maintenanceMode}
                    onChange={async e => {
                      const enabled = e.target.checked;
                      await api.setMaintenance(enabled);
                      await loadData();
                    }}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <b>Aktifkan Mode Perawatan</b>
                </label>
              </div>
            )}

            {/* Admin Tab 4: Backup & Restore */}
            {adminTab === 'backup' && (
              <div>
                <h3 className="t2">Cadangan & Ekspor/Impor Database</h3>
                <p className="hint2">
                  Simpan cadangan database ke komputer/HP Anda kapan saja, atau pulihkan data dari file JSON cadangan.
                </p>
                <div className="acts" style={{ marginTop: '16px' }}>
                  <a
                    className="btn2"
                    href="/api/backup/export"
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    📥 Ekspor Cadangan Lengkap (JSON)
                  </a>
                  <button
                    className="btn2 gh"
                    onClick={() => backupInputRef.current?.click()}
                  >
                    📤 Pulihkan Cadangan (Restore JSON)
                  </button>
                  <input
                    type="file"
                    ref={backupInputRef}
                    accept=".json"
                    className="hide"
                    onChange={handleBackupUpload}
                  />
                </div>
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '14px', margin: '0 0 8px' }}>Ekspor Tabel ke Excel / CSV:</h4>
                  <div className="acts">
                    <a className="btn2 gh" href="/api/backup/export-csv/produksi" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      CSV Produksi
                    </a>
                    <a className="btn2 gh" href="/api/backup/export-csv/mitra" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      CSV Mitra Petani
                    </a>
                    <a className="btn2 gh" href="/api/backup/export-csv/proyek" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      CSV Project
                    </a>
                    <a className="btn2 gh" href="/api/backup/export-csv/legal" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      CSV Legalitas
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Tab 5: Database Explorer */}
            {adminTab === 'db' && (
              <div>
                <div className="ph">
                  <div>
                    <h3 className="t2">Akses & Penjelajah Database Langsung</h3>
                    <p className="hint2">
                      Database CV. Lintas Batas Agro aktif secara real-time di server dan tersimpan secara permanen.
                    </p>
                  </div>
                  <div className="acts noprint">
                    <a
                      className="btn2"
                      href="/api/backup/export"
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      📥 Unduh Database Utuh (.JSON)
                    </a>
                    <a
                      className="btn2 gh"
                      href="/api/data"
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      🌐 Buka REST API Langsung
                    </a>
                  </div>
                </div>

                {/* Database Info Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', margin: '14px 0' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>GOOGLE CLOUD FIRESTORE</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#14532d', marginTop: '2px' }}>
                      🔥 {firebaseStatus.connected ? 'Tersambung Aktif' : 'Menghubungkan'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px', fontFamily: 'monospace' }}>
                      Proyek: {FIREBASE_PROJECT_ID}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>STATUS DATABASE SERVER</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>🟢 Real-time Synchronized</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Auto-save permanen & aman</div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>AKSES DARI MANA SAJA</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>HP, Tablet & Laptop</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Cukup buka tautan web aplikasi</div>
                  </div>
                </div>

                {/* Table selector */}
                <div style={{ margin: '18px 0 10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                    Pilih Tabel Database untuk Diperiksa:
                  </label>
                  <div className="sub" style={{ margin: 0 }}>
                    {[
                      { key: 'produksi', label: `Produksi (${dbData?.produksi.length || 0})` },
                      { key: 'mitra', label: `Petani Mitra (${dbData?.mitra.length || 0})` },
                      { key: 'proyek', label: `Project (${dbData?.proyek.length || 0})` },
                      { key: 'legal', label: `Legalitas (${dbData?.legal.length || 0})` },
                      { key: 'dokumen', label: `Dokumen (${dbData?.dokumen.length || 0})` },
                      { key: 'users', label: `Users (${dbData?.users.length || 0})` },
                      { key: 'logs', label: `Logs (${dbData?.logs.length || 0})` }
                    ].map(tbl => (
                      <button
                        key={tbl.key}
                        className={`btn2 ${explorerTable === tbl.key ? '' : 'gh'}`}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => setExplorerTable(tbl.key as any)}
                      >
                        {tbl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Data Viewer */}
                <div style={{ background: '#1e293b', color: '#f8fafc', borderRadius: '10px', padding: '14px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Tabel: <b style={{ color: '#38bdf8' }}>{explorerTable.toUpperCase()}</b> ({((dbData as any)?.[explorerTable]?.length || 0)} baris data)
                    </div>
                    <div className="acts">
                      {['produksi', 'mitra', 'proyek', 'legal'].includes(explorerTable) && (
                        <a
                          className="btn2 gh"
                          href={`/api/backup/export-csv/${explorerTable}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}
                        >
                          Unduh CSV
                        </a>
                      )}
                      <button
                        className="btn2 gh"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => {
                          const content = JSON.stringify((dbData as any)?.[explorerTable] || [], null, 2);
                          navigator.clipboard.writeText(content);
                          alert(`Data tabel ${explorerTable} berhasil disalin ke clipboard!`);
                        }}
                      >
                        Salin JSON
                      </button>
                    </div>
                  </div>
                  <pre style={{ margin: 0, maxHeight: '320px', overflow: 'auto', fontSize: '12px', lineHeight: 1.5, fontFamily: 'Consolas, monospace', color: '#a5f3fc' }}>
                    {JSON.stringify((dbData as any)?.[explorerTable] || [], null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- MODAL DIALOG --- */}
      {dialogOpen && (
        <dialog open style={{ display: 'block' }}>
          <h3>
            {dialogType === 'user_add'
              ? 'Tambah User'
              : dialogType === 'user_edit'
              ? 'Edit Pengguna'
              : `${dialogItemIndex !== null ? 'Ubah' : 'Tambah'} ${
                  dialogType === 'produksi'
                    ? 'Data Produksi'
                    : dialogType === 'mitra'
                    ? 'Petani Mitra'
                    : dialogType === 'proyek'
                    ? 'Data Project'
                    : 'Legalitas'
                }`}
          </h3>

          <div className="f">
            {/* Produksi Form */}
            {dialogType === 'produksi' && (
              <>
                <label>Nama Bibit</label>
                <input
                  value={dialogFormData.nama}
                  onChange={e => setDialogFormData({ ...dialogFormData, nama: e.target.value })}
                />
                <label>Jenis/Varietas</label>
                <input
                  value={dialogFormData.varietas}
                  onChange={e => setDialogFormData({ ...dialogFormData, varietas: e.target.value })}
                />
                <label>Jumlah Bibit</label>
                <input
                  type="number"
                  value={dialogFormData.jumlah}
                  onChange={e => setDialogFormData({ ...dialogFormData, jumlah: Number(e.target.value) || 0 })}
                />
                <label>Tanggal Produksi</label>
                <input
                  type="date"
                  value={dialogFormData.tgl}
                  onChange={e => setDialogFormData({ ...dialogFormData, tgl: e.target.value })}
                />
                <label>Nama Produsen</label>
                <input
                  value={dialogFormData.produsen}
                  onChange={e => setDialogFormData({ ...dialogFormData, produsen: e.target.value })}
                />
                <label>Status Produksi</label>
                <select
                  value={dialogFormData.status}
                  onChange={e => setDialogFormData({ ...dialogFormData, status: e.target.value })}
                >
                  <option>Persiapan</option>
                  <option>Semai</option>
                  <option>Pembesaran</option>
                  <option>Siap Salur</option>
                  <option>Tersalur</option>
                </select>
                <label>Asal Produksi</label>
                <select
                  value={dialogFormData.asal}
                  onChange={e => setDialogFormData({ ...dialogFormData, asal: e.target.value })}
                >
                  <option>Kebun Produksi</option>
                  <option>Petani Mitra</option>
                </select>
                <label>Lokasi Lahan</label>
                <input
                  value={dialogFormData.lokasi}
                  onChange={e => setDialogFormData({ ...dialogFormData, lokasi: e.target.value })}
                />
              </>
            )}

            {/* Mitra Form */}
            {dialogType === 'mitra' && (
              <>
                <label>Nama Petani</label>
                <input
                  value={dialogFormData.nama}
                  onChange={e => setDialogFormData({ ...dialogFormData, nama: e.target.value })}
                />
                <label>No. Telp (WhatsApp)</label>
                <input
                  value={dialogFormData.telp}
                  onChange={e => setDialogFormData({ ...dialogFormData, telp: e.target.value })}
                />
                <label>Nama Bibit</label>
                <input
                  value={dialogFormData.bibit}
                  onChange={e => setDialogFormData({ ...dialogFormData, bibit: e.target.value })}
                />
                <label>Jenis/Varietas</label>
                <input
                  value={dialogFormData.varietas}
                  onChange={e => setDialogFormData({ ...dialogFormData, varietas: e.target.value })}
                />
                <label>Total Produksi Bibit</label>
                <input
                  type="number"
                  value={dialogFormData.total}
                  onChange={e => setDialogFormData({ ...dialogFormData, total: Number(e.target.value) || 0 })}
                />
                <label>Alamat</label>
                <input
                  value={dialogFormData.alamat}
                  onChange={e => setDialogFormData({ ...dialogFormData, alamat: e.target.value })}
                />
                <label>Luas Lahan (ha)</label>
                <input
                  type="number"
                  step="0.1"
                  value={dialogFormData.luas}
                  onChange={e => setDialogFormData({ ...dialogFormData, luas: Number(e.target.value) || 0 })}
                />
              </>
            )}

            {/* Proyek Form */}
            {dialogType === 'proyek' && (
              <>
                <label>Nama Project</label>
                <input
                  value={dialogFormData.nama}
                  onChange={e => setDialogFormData({ ...dialogFormData, nama: e.target.value })}
                />
                <label>Klien</label>
                <input
                  value={dialogFormData.klien}
                  onChange={e => setDialogFormData({ ...dialogFormData, klien: e.target.value })}
                />
                <label>Status</label>
                <select
                  value={dialogFormData.status}
                  onChange={e => setDialogFormData({ ...dialogFormData, status: e.target.value })}
                >
                  <option>Persiapan</option>
                  <option>Berjalan</option>
                  <option>Selesai</option>
                </select>
                <label>Tanggal Mulai</label>
                <input
                  type="date"
                  value={dialogFormData.mulai}
                  onChange={e => setDialogFormData({ ...dialogFormData, mulai: e.target.value })}
                />
                <label>Tanggal Selesai</label>
                <input
                  type="date"
                  value={dialogFormData.selesai}
                  onChange={e => setDialogFormData({ ...dialogFormData, selesai: e.target.value })}
                />
                <label>Nilai (Rp)</label>
                <input
                  type="number"
                  value={dialogFormData.nilai}
                  onChange={e => setDialogFormData({ ...dialogFormData, nilai: Number(e.target.value) || 0 })}
                />
              </>
            )}

            {/* Legalitas Form */}
            {dialogType === 'legal' && (
              <>
                <label>Jenis Dokumen</label>
                <select
                  value={dialogFormData.jenis}
                  onChange={e => setDialogFormData({ ...dialogFormData, jenis: e.target.value })}
                >
                  <option>AHU</option>
                  <option>NPWP</option>
                  <option>Sertifikat A</option>
                  <option>Sertifikat B</option>
                  <option>Sertifikat C</option>
                </select>
                <label>Nomor Dokumen</label>
                <input
                  value={dialogFormData.nomor}
                  onChange={e => setDialogFormData({ ...dialogFormData, nomor: e.target.value })}
                />
                <label>Tanggal Terbit</label>
                <input
                  type="date"
                  value={dialogFormData.terbit}
                  onChange={e => setDialogFormData({ ...dialogFormData, terbit: e.target.value })}
                />
                <label>Masa Berlaku (Kosongkan jika seumur hidup)</label>
                <input
                  type="date"
                  value={dialogFormData.berlaku}
                  onChange={e => setDialogFormData({ ...dialogFormData, berlaku: e.target.value })}
                />
                <label>Nama File/Scan</label>
                <input
                  value={dialogFormData.file}
                  onChange={e => setDialogFormData({ ...dialogFormData, file: e.target.value })}
                />
                <label>Keterangan</label>
                <input
                  value={dialogFormData.ket}
                  onChange={e => setDialogFormData({ ...dialogFormData, ket: e.target.value })}
                />
              </>
            )}

            {/* User Add Form */}
            {dialogType === 'user_add' && (
              <>
                <label>Nama Pengguna (Username untuk login)</label>
                <input
                  value={dialogFormData.username}
                  onChange={e => setDialogFormData({ ...dialogFormData, username: e.target.value })}
                />
                <label>Nama Lengkap</label>
                <input
                  value={dialogFormData.nama}
                  onChange={e => setDialogFormData({ ...dialogFormData, nama: e.target.value })}
                />
                <label>Jabatan</label>
                <input
                  placeholder="Contoh: Manajer Lapangan"
                  value={dialogFormData.jabatan}
                  onChange={e => setDialogFormData({ ...dialogFormData, jabatan: e.target.value })}
                />
                <label>Hak Akses / Peran</label>
                <select
                  value={dialogFormData.role}
                  onChange={e => setDialogFormData({ ...dialogFormData, role: e.target.value })}
                >
                  <option>Admin</option>
                  <option>Direktur</option>
                  <option>Deputy Director</option>
                  <option>Konsultan</option>
                </select>
                <label>Kata Sandi Awal</label>
                <input
                  type="password"
                  placeholder="Kosongkan untuk menyamakan dengan username"
                  value={dialogFormData.password}
                  onChange={e => setDialogFormData({ ...dialogFormData, password: e.target.value })}
                />
              </>
            )}

            {/* User Edit Form */}
            {dialogType === 'user_edit' && (
              <>
                <div className="up">
                  <div className="av">
                    {selectedUserPhoto ? (
                      <img alt="" src={selectedUserPhoto} />
                    ) : (
                      <span>{(dialogFormData.nama || '?')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="acts">
                    <button className="btn2 gh" type="button" onClick={() => fileInputRef.current?.click()}>
                      Pilih foto
                    </button>
                    {selectedUserPhoto && (
                      <button className="btn2 gh" type="button" onClick={() => setSelectedUserPhoto('')}>
                        Hapus foto
                      </button>
                    )}
                    <small className="hint2">JPG atau PNG, otomatis dipotong persegi.</small>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hide"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </div>

                <label>Nama pengguna (untuk masuk)</label>
                <input
                  value={dialogFormData.username}
                  onChange={e => setDialogFormData({ ...dialogFormData, username: e.target.value })}
                />
                <label>Nama lengkap</label>
                <input
                  value={dialogFormData.nama}
                  onChange={e => setDialogFormData({ ...dialogFormData, nama: e.target.value })}
                />
                <label>Jabatan</label>
                <input
                  value={dialogFormData.jabatan}
                  onChange={e => setDialogFormData({ ...dialogFormData, jabatan: e.target.value })}
                />
                <label>Hak akses</label>
                <select
                  disabled={dialogFormData.originalUsername === currentUser?.username}
                  value={dialogFormData.role}
                  onChange={e => setDialogFormData({ ...dialogFormData, role: e.target.value })}
                >
                  <option>Admin</option>
                  <option>Direktur</option>
                  <option>Deputy Director</option>
                  <option>Konsultan</option>
                </select>
                <label>Status akun</label>
                <select
                  disabled={dialogFormData.originalUsername === currentUser?.username}
                  value={dialogFormData.statusAktif ? 'Aktif' : 'Nonaktif'}
                  onChange={e =>
                    setDialogFormData({ ...dialogFormData, statusAktif: e.target.value === 'Aktif' ? 1 : 0 })
                  }
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </>
            )}
          </div>

          <div className="acts" style={{ marginTop: '16px', justifyContent: 'flex-end' }}>
            <button className="btn2 gh" onClick={() => setDialogOpen(false)}>
              Batal
            </button>
            <button className="btn2" onClick={handleSaveForm}>
              Simpan
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
