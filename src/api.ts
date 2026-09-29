import { FullDataResponse, User, ProduksiItem, MitraItem, ProyekItem, LegalItem, DokumenItem } from './types';

let authToken = localStorage.getItem('lba_token') || '';

export function setToken(token: string) {
  authToken = token;
  if (token) {
    localStorage.setItem('lba_token', token);
  } else {
    localStorage.removeItem('lba_token');
  }
}

export function getToken(): string {
  return authToken || localStorage.getItem('lba_token') || '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      ...options,
      headers
    });
  } catch (netErr: any) {
    throw new Error('Tidak dapat terhubung ke server backend. Periksa koneksi atau mode offline.');
  }

  const rawText = await res.text();
  let json: any = null;

  if (rawText && rawText.trim().length > 0) {
    try {
      json = JSON.parse(rawText);
    } catch (parseErr) {
      if (!res.ok) {
        throw new Error(`Server error (${res.status}): ${rawText.slice(0, 120)}`);
      }
      throw new Error('Respon server tidak berformat JSON.');
    }
  } else {
    // If empty response body
    if (!res.ok) {
      throw new Error(`Permintaan gagal dengan status HTTP ${res.status}`);
    }
    json = { success: true };
  }

  if (!res.ok || (json && json.success === false)) {
    throw new Error(json?.message || `Terjadi kesalahan saat memproses permintaan (${res.status})`);
  }
  return json as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  resetRequest: (username: string) =>
    request<{ success: boolean; message: string }>('/api/auth/reset-request', {
      method: 'POST',
      body: JSON.stringify({ username })
    }),

  changePassword: (username: string, oldPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ username, oldPassword, newPassword })
    }),

  getFullData: () =>
    request<{ success: boolean; data: FullDataResponse }>('/api/data'),

  getKPI: () =>
    request<{ success: boolean; data: { totalBibit: number; totalMitra: number; proyekAktif: number; legalSegeraHabis: number } }>('/api/kpi'),

  // Produksi
  addProduksi: (data: Omit<ProduksiItem, 'id'>) =>
    request<{ success: boolean; data: ProduksiItem }>('/api/produksi', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateProduksi: (id: string, data: Partial<ProduksiItem>) =>
    request<{ success: boolean; data: ProduksiItem }>(`/api/produksi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteProduksi: (id: string) =>
    request<{ success: boolean }>(`/api/produksi/${id}`, { method: 'DELETE' }),

  // Mitra
  addMitra: (data: Omit<MitraItem, 'id'>) =>
    request<{ success: boolean; data: MitraItem }>('/api/mitra', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateMitra: (id: string, data: Partial<MitraItem>) =>
    request<{ success: boolean; data: MitraItem }>(`/api/mitra/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteMitra: (id: string) =>
    request<{ success: boolean }>(`/api/mitra/${id}`, { method: 'DELETE' }),

  // Proyek
  addProyek: (data: Omit<ProyekItem, 'id'>) =>
    request<{ success: boolean; data: ProyekItem }>('/api/proyek', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateProyek: (id: string, data: Partial<ProyekItem>) =>
    request<{ success: boolean; data: ProyekItem }>(`/api/proyek/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteProyek: (id: string) =>
    request<{ success: boolean }>(`/api/proyek/${id}`, { method: 'DELETE' }),

  // Legal
  addLegal: (data: Omit<LegalItem, 'id'>) =>
    request<{ success: boolean; data: LegalItem }>('/api/legal', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateLegal: (id: string, data: Partial<LegalItem>) =>
    request<{ success: boolean; data: LegalItem }>(`/api/legal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteLegal: (id: string) =>
    request<{ success: boolean }>(`/api/legal/${id}`, { method: 'DELETE' }),

  // Dokumen
  saveDokumen: (data: { no: string; j: string; kl: string; tg: string; T: number; items: any[]; html: string }) =>
    request<{ success: boolean; data: DokumenItem }>('/api/dokumen', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteDokumen: (id: string) =>
    request<{ success: boolean }>(`/api/dokumen/${id}`, { method: 'DELETE' }),

  // Users
  addUser: (data: { username: string; password?: string; nama: string; jabatan: string; role: string; foto?: string }) =>
    request<{ success: boolean; data: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateUser: (username: string, data: Partial<User>) =>
    request<{ success: boolean; data: User }>(`/api/users/${username}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  resetUserPassword: (username: string) =>
    request<{ success: boolean; message: string }>(`/api/users/${username}/reset-password`, {
      method: 'POST'
    }),

  // Settings & Maintenance
  setMaintenance: (enabled: boolean) =>
    request<{ success: boolean; data: any }>('/api/settings/maintenance', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    }),

  // Backup
  importBackup: (backupData: any) =>
    request<{ success: boolean; message: string }>('/api/backup/import', {
      method: 'POST',
      body: JSON.stringify(backupData)
    })
};
