export interface User {
  id: string;
  username: string;
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

export interface FullDataResponse {
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
