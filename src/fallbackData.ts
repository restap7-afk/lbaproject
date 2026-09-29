import { FullDataResponse } from './types';

const off = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

export function getDefaultClientData(): FullDataResponse {
  return {
    version: 1,
    settings: {
      namaPerusahaan: 'CV. Lintas Batas Agro',
      tagline: 'Growing Beyond Limits',
      alamat: 'Bandar Lampung, Provinsi Lampung',
      counterPnw: 1,
      counterInv: 1,
      counterBast: 1,
      maintenanceMode: false
    },
    produksi: [
      {
        id: 'prod_1',
        nama: 'Kakao',
        varietas: 'MCC 02',
        jumlah: 45000,
        tgl: off(-45),
        produsen: 'Kebun Produksi LBA',
        status: 'Siap Salur',
        asal: 'Kebun Induk',
        lokasi: 'Tanggamus'
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
        alamat: 'Lampung Barat, Lampung',
        luas: 2.0
      },
      {
        id: 'mitra_3',
        nama: 'Ahmad Fauzi',
        telp: '081200000003',
        bibit: 'Kakao',
        varietas: 'Sulawesi 1',
        total: 18000,
        alamat: 'Pesawaran, Lampung',
        luas: 4.2
      }
    ],
    proyek: [
      {
        id: 'proy_1',
        nama: 'Pengadaan Bibit Rehabilitasi Hutan 2026',
        klien: 'Dinas Kehutanan Prov. Lampung',
        nilai: 185000000,
        mulai: off(-40),
        selesai: off(50),
        status: 'Berjalan'
      },
      {
        id: 'proy_2',
        nama: 'Program Revitalisasi Perkebunan Kakao',
        klien: 'Dinas Perkebunan Kab. Tanggamus',
        nilai: 92000000,
        mulai: off(-20),
        selesai: off(35),
        status: 'Berjalan'
      }
    ],
    legal: [
      {
        id: 'leg_1',
        jenis: 'NIB',
        nomor: '9120301928301',
        terbit: off(-400),
        berlaku: off(1200),
        file: 'nib.pdf',
        ket: 'Nomor Induk Berusaha Perusahaan Aktif'
      },
      {
        id: 'leg_2',
        jenis: 'Izin Usaha Perbenihan',
        nomor: '503/IUP-BENIH/DPMPTSP/2024',
        terbit: off(-300),
        berlaku: off(420),
        file: 'iup.pdf',
        ket: 'Izin resmi pengadaan & penyaluran bibit'
      },
      {
        id: 'leg_3',
        jenis: 'Sertifikat Mutu Benih',
        nomor: 'BPSB-LPG/SM-2025/11',
        terbit: off(-180),
        berlaku: off(185),
        file: 'sa.pdf',
        ket: 'Sertifikasi Mutu Benih Tanaman'
      }
    ],
    dokumen: [],
    users: [
      {
        id: 'usr_1',
        username: 'admin1',
        nama: 'Administrator LBA',
        jabatan: 'Manajer Operasional & Data',
        role: 'Admin',
        statusAktif: 1
      },
      {
        id: 'usr_2',
        username: 'direktur1',
        nama: 'Ir. Ahmad Zulkarnain',
        jabatan: 'Direktur Utama',
        role: 'Direktur',
        statusAktif: 1
      },
      {
        id: 'usr_3',
        username: 'deputy1',
        nama: 'Bambang S., S.Hut',
        jabatan: 'Wakil Direktur',
        role: 'Deputy Director',
        statusAktif: 1
      },
      {
        id: 'usr_4',
        username: 'konsultan1',
        nama: 'Dr. Hendra Wijaya',
        jabatan: 'Konsultan Silvikultur',
        role: 'Konsultan',
        statusAktif: 1
      }
    ],
    logs: [
      {
        id: 'log_init',
        w: new Date().toLocaleString('id-ID'),
        u: 'Sistem',
        a: 'Sistem Manajemen LBA siap digunakan.'
      }
    ],
    resetRequests: []
  };
}
