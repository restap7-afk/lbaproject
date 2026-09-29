import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  nama: string;
  jabatan: string;
  role: 'Admin' | 'Direktur' | 'Deputy Director' | 'Konsultan';
  statusAktif: number;
  foto?: string;
  isFirstLogin?: boolean;
}

export interface ProduksiItem {
  id: string;
  nama: string;
  varietas: string;
  jumlah: number;
  tgl: string;
  produsen: string;
  status: string;
  asal: string;
  lokasi: string;
}

export interface MitraItem {
  id: string;
  nama: string;
  telp: string;
  bibit: string;
  varietas: string;
  total: number;
  alamat: string;
  luas: number;
}

export interface ProyekItem {
  id: string;
  nama: string;
  klien: string;
  status: string;
  mulai: string;
  selesai: string;
  nilai: number;
}

export interface LegalItem {
  id: string;
  jenis: string;
  nomor: string;
  terbit: string;
  berlaku: string;
  file: string;
  ket: string;
}

export interface DokumenItem {
  id: string;
  no: string;
  j: string;
  kl: string;
  tg: string;
  T: number;
  items: Array<{ b: string; q: number; h: number }>;
  html: string;
  createdBy?: string;
  createdAt: string;
}

export interface LogItem {
  id: string;
  w: string;
  u: string;
  a: string;
}

export interface ResetRequest {
  id: string;
  username: string;
  waktu: string;
  status: 'Pending' | 'Selesai';
}

export interface Settings {
  namaPerusahaan: string;
  tagline: string;
  alamat: string;
  counterPnw: number;
  counterInv: number;
  counterBast: number;
  maintenanceMode: boolean;
}

export interface DatabaseSchema {
  version: number;
  settings: Settings;
  users: User[];
  produksi: ProduksiItem[];
  mitra: MitraItem[];
  proyek: ProyekItem[];
  legal: LegalItem[];
  dokumen: DokumenItem[];
  logs: LogItem[];
  resetRequests: ResetRequest[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'lba_database.json');

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, user: User): boolean {
  if (!user.salt && user.passwordHash === password) {
    return true;
  }
  const { hash } = hashPassword(password, user.salt);
  return hash === user.passwordHash;
}

function getInitialData(): DatabaseSchema {
  const today = new Date();
  const off = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const initialUsers: Array<{
    username: string;
    pw: string;
    nama: string;
    role: 'Admin' | 'Direktur' | 'Deputy Director' | 'Konsultan';
    jabatan: string;
  }> = [
    { username: 'admin1', pw: 'admin1', nama: 'Budi Santoso', role: 'Admin', jabatan: 'Manajer Operasional & TI' },
    { username: 'direktur1', pw: 'direktur1', nama: 'Direktur Utama', role: 'Direktur', jabatan: 'Direktur' },
    { username: 'deputy1', pw: 'deputy1', nama: 'Wakil Direktur', role: 'Deputy Director', jabatan: 'Deputy Director' },
    { username: 'konsultan1', pw: 'konsultan1', nama: 'Konsultan Lapangan', role: 'Konsultan', jabatan: 'Konsultan Agroforestry' }
  ];

  const hashedUsers: User[] = initialUsers.map((u, i) => {
    const { hash, salt } = hashPassword(u.pw);
    return {
      id: `usr_${i + 1}`,
      username: u.username,
      passwordHash: hash,
      salt,
      nama: u.nama,
      jabatan: u.jabatan,
      role: u.role,
      statusAktif: 1,
      foto: u.username === 'admin1' ? '/src/assets/images/avatar_budi_santoso_1790667350733.jpg' : '',
      isFirstLogin: true
    };
  });

  return {
    version: 1,
    settings: {
      namaPerusahaan: 'CV. Lintas Batas Agro',
      tagline: 'Growing Beyond Limits',
      alamat: 'Lampung, Indonesia',
      counterPnw: 0,
      counterInv: 0,
      counterBast: 0,
      maintenanceMode: false
    },
    users: hashedUsers,
    produksi: [
      {
        id: 'prod_1',
        nama: 'Alpukat',
        varietas: 'Miki',
        jumlah: 42000,
        tgl: off(-40),
        produsen: 'Kebun Produksi LBA',
        status: 'Siap Salur',
        asal: 'Kebun Produksi',
        lokasi: 'Lampung Barat'
      },
      {
        id: 'prod_2',
        nama: 'Durian',
        varietas: 'Okulasi',
        jumlah: 24500,
        tgl: off(-30),
        produsen: 'Slamet',
        status: 'Pembesaran',
        asal: 'Petani Mitra',
        lokasi: 'Tanggamus'
      },
      {
        id: 'prod_3',
        nama: 'Petai',
        varietas: 'Lokal',
        jumlah: 12000,
        tgl: off(-22),
        produsen: 'Sri Wahyuni',
        status: 'Semai',
        asal: 'Petani Mitra',
        lokasi: 'Lampung Barat'
      },
      {
        id: 'prod_4',
        nama: 'Pala',
        varietas: 'Banda',
        jumlah: 9000,
        tgl: off(-15),
        produsen: 'Kebun Produksi LBA',
        status: 'Persiapan',
        asal: 'Kebun Produksi',
        lokasi: 'Tanggamus'
      }
    ],
    mitra: [
      {
        id: 'mitra_1',
        nama: 'Slamet',
        telp: '081200000001',
        bibit: 'Durian',
        varietas: 'Okulasi',
        total: 24500,
        alamat: 'Tanggamus, Lampung',
        luas: 3.5
      },
      {
        id: 'mitra_2',
        nama: 'Sri Wahyuni',
        telp: '081200000002',
        bibit: 'Petai',
        varietas: 'Lokal',
        total: 12000,
        alamat: 'Lampung Barat',
        luas: 2
      },
      {
        id: 'mitra_3',
        nama: 'Joko Prasetyo',
        telp: '081200000003',
        bibit: 'Pala',
        varietas: 'Banda',
        total: 9000,
        alamat: 'Metro, Lampung',
        luas: 1.5
      }
    ],
    proyek: [
      {
        id: 'proy_1',
        nama: 'Program Agroforestry 2026',
        klien: 'Rikolto',
        status: 'Berjalan',
        mulai: off(-60),
        selesai: off(200),
        nilai: 250000000
      },
      {
        id: 'proy_2',
        nama: 'Penyediaan Benih Kakao',
        klien: 'Mitra Kakao',
        status: 'Persiapan',
        mulai: off(10),
        selesai: off(300),
        nilai: 175000000
      }
    ],
    legal: [
      {
        id: 'leg_1',
        jenis: 'AHU',
        nomor: 'AHU-0000000.AH.01',
        terbit: off(-900),
        berlaku: '',
        file: 'ahu.pdf',
        ket: 'Pengesahan Kemenkumham'
      },
      {
        id: 'leg_2',
        jenis: 'NPWP',
        nomor: '00.000.000.0-000.000',
        terbit: off(-900),
        berlaku: '',
        file: 'npwp.pdf',
        ket: 'Nomor Pokok Wajib Pajak Perusahaan'
      },
      {
        id: 'leg_3',
        jenis: 'Sertifikat A',
        nomor: 'SA-001',
        terbit: off(-300),
        berlaku: off(400),
        file: 'sa.pdf',
        ket: 'Sertifikasi Mutu Benih Tanaman'
      },
      {
        id: 'leg_4',
        jenis: 'Sertifikat B',
        nomor: 'SB-001',
        terbit: off(-320),
        berlaku: off(45),
        file: 'sb.pdf',
        ket: 'Segera perpanjang masa berlaku'
      },
      {
        id: 'leg_5',
        jenis: 'Sertifikat C',
        nomor: 'SC-001',
        terbit: off(-100),
        berlaku: off(700),
        file: 'sc.pdf',
        ket: 'Sertifikasi Kelayakan Nursery'
      }
    ],
    dokumen: [],
    logs: [
      {
        id: 'log_1',
        w: new Date().toLocaleString('id-ID'),
        u: 'Sistem',
        a: 'Database otomatis dibuat dan diinisialisasi.'
      }
    ],
    resetRequests: []
  };
}

class DatabaseManager {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load database file, creating fresh database:', e);
    }

    const initData = getInitialData();
    this.saveDatabase(initData);
    return initData;
  }

  private saveDatabase(data?: DatabaseSchema): void {
    const dataToSave = data || this.db;
    this.ensureDataDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public getData(): DatabaseSchema {
    return this.db;
  }

  public logActivity(user: string, action: string) {
    const log: LogItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      w: new Date().toLocaleString('id-ID'),
      u: user || 'Anonim',
      a: action
    };
    this.db.logs.unshift(log);
    if (this.db.logs.length > 500) {
      this.db.logs = this.db.logs.slice(0, 500);
    }
    this.saveDatabase();
    return log;
  }

  // Users
  public getUsers() {
    return this.db.users.map(({ passwordHash, salt, ...rest }) => rest);
  }

  public findUserByUsername(username: string): User | undefined {
    return this.db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public addUser(userData: {
    username: string;
    password?: string;
    nama: string;
    jabatan: string;
    role: 'Admin' | 'Direktur' | 'Deputy Director' | 'Konsultan';
    foto?: string;
  }, actor: string): User {
    const { hash, salt } = hashPassword(userData.password || userData.username);
    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: userData.username.trim().toLowerCase(),
      passwordHash: hash,
      salt,
      nama: userData.nama.trim(),
      jabatan: userData.jabatan.trim() || userData.role,
      role: userData.role,
      statusAktif: 1,
      foto: userData.foto || '',
      isFirstLogin: true
    };
    this.db.users.push(newUser);
    this.logActivity(actor, `Menambah user baru: ${newUser.username} (${newUser.role})`);
    this.saveDatabase();
    return newUser;
  }

  public updateUser(
    oldUsername: string,
    updates: {
      username?: string;
      nama?: string;
      jabatan?: string;
      role?: 'Admin' | 'Direktur' | 'Deputy Director' | 'Konsultan';
      statusAktif?: number;
      foto?: string;
    },
    actor: string
  ): User | null {
    const user = this.findUserByUsername(oldUsername);
    if (!user) return null;

    if (updates.username && updates.username.toLowerCase() !== oldUsername.toLowerCase()) {
      user.username = updates.username.trim().toLowerCase();
    }
    if (updates.nama !== undefined) user.nama = updates.nama.trim();
    if (updates.jabatan !== undefined) user.jabatan = updates.jabatan.trim();
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.statusAktif !== undefined) user.statusAktif = updates.statusAktif;
    if (updates.foto !== undefined) user.foto = updates.foto;

    this.logActivity(actor, `Mengedit data user: ${user.username}`);
    this.saveDatabase();
    return user;
  }

  public resetPassword(username: string, actor: string): boolean {
    const user = this.findUserByUsername(username);
    if (!user) return false;
    const { hash, salt } = hashPassword(user.username);
    user.passwordHash = hash;
    user.salt = salt;
    user.isFirstLogin = true;
    this.logActivity(actor, `Reset kata sandi user: ${username}`);
    this.saveDatabase();
    return true;
  }

  public changePassword(username: string, newPassword: string): boolean {
    const user = this.findUserByUsername(username);
    if (!user) return false;
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    user.isFirstLogin = false;
    this.logActivity(username, 'Mengubah kata sandi akun');
    this.saveDatabase();
    return true;
  }

  public requestReset(username: string): ResetRequest {
    const req: ResetRequest = {
      id: `rst_${Date.now()}`,
      username: username.trim().toLowerCase(),
      waktu: new Date().toLocaleString('id-ID'),
      status: 'Pending'
    };
    this.db.resetRequests.unshift(req);
    this.logActivity(username, 'Mengajukan permintaan reset kata sandi');
    this.saveDatabase();
    return req;
  }

  // Generic CRUD
  public getTable<K extends 'produksi' | 'mitra' | 'proyek' | 'legal' | 'dokumen'>(table: K) {
    return this.db[table];
  }

  public insertItem<K extends 'produksi' | 'mitra' | 'proyek' | 'legal'>(
    table: K,
    data: any,
    actor: string
  ) {
    const item = {
      ...data,
      id: `${table}_${Date.now()}`
    };
    (this.db[table] as any[]).push(item);
    this.logActivity(actor, `Menambah data pada ${table}: ${item.nama || item.jenis || item.id}`);
    this.saveDatabase();
    return item;
  }

  public updateItem<K extends 'produksi' | 'mitra' | 'proyek' | 'legal'>(
    table: K,
    id: string,
    data: any,
    actor: string
  ) {
    const list = this.db[table] as any[];
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, id };
    this.logActivity(actor, `Mengubah data pada ${table}: ${list[idx].nama || list[idx].jenis || id}`);
    this.saveDatabase();
    return list[idx];
  }

  public deleteItem<K extends 'produksi' | 'mitra' | 'proyek' | 'legal' | 'dokumen'>(
    table: K,
    id: string,
    actor: string
  ) {
    const list = this.db[table] as any[];
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return false;
    const removed = list.splice(idx, 1)[0];
    this.logActivity(actor, `Menghapus data pada ${table}: ${removed.nama || removed.jenis || removed.no || id}`);
    this.saveDatabase();
    return true;
  }

  // Documents
  public addDokumen(docData: Omit<DokumenItem, 'id' | 'createdAt'>, actor: string): DokumenItem {
    const doc: DokumenItem = {
      ...docData,
      id: `doc_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (docData.j === 'Penawaran') this.db.settings.counterPnw++;
    else if (docData.j === 'Invoice') this.db.settings.counterInv++;
    else if (docData.j === 'BAST') this.db.settings.counterBast++;

    this.db.dokumen.unshift(doc);
    this.logActivity(actor, `Membuat dokumen ${doc.j} nomor ${doc.no}`);
    this.saveDatabase();
    return doc;
  }

  // Settings
  public updateSettings(settings: Partial<Settings>, actor: string) {
    this.db.settings = { ...this.db.settings, ...settings };
    this.logActivity(actor, 'Mengubah pengaturan sistem / mode perawatan');
    this.saveDatabase();
    return this.db.settings;
  }

  public restoreBackup(data: DatabaseSchema, actor: string) {
    if (!data.users || !data.produksi) {
      throw new Error('Format backup tidak valid');
    }
    this.db = data;
    this.logActivity(actor, 'Memulihkan cadangan database (Restore)');
    this.saveDatabase();
    return true;
  }
}

export const dbManager = new DatabaseManager();
