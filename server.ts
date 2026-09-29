import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { dbManager, verifyPassword, User } from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Simple token / actor resolver
  const getActor = (req: Request): { username: string; role: string; nama: string } => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = Buffer.from(authHeader.slice(7), 'base64').toString('utf-8');
        const [username] = decoded.split(':');
        const user = dbManager.findUserByUsername(username);
        if (user) {
          return { username: user.username, role: user.role, nama: user.nama };
        }
      } catch (e) {
        // ignore
      }
    }
    const queryUser = (req.query.actor as string) || (req.body?.actor as string);
    if (queryUser) {
      const user = dbManager.findUserByUsername(queryUser);
      if (user) {
        return { username: user.username, role: user.role, nama: user.nama };
      }
      return { username: queryUser, role: 'User', nama: queryUser };
    }
    return { username: 'Sistem', role: 'System', nama: 'Sistem LBA' };
  };

  // --- Auth APIs ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Nama pengguna dan kata sandi wajib diisi.' });
    }

    const user = dbManager.findUserByUsername(username);
    if (!user || !user.statusAktif || !verifyPassword(password, user)) {
      return res.status(401).json({ success: false, message: 'Nama pengguna atau kata sandi salah.' });
    }

    const settings = dbManager.getData().settings;
    if (settings.maintenanceMode && user.role !== 'Admin' && user.role !== 'Deputy Director') {
      return res.status(403).json({
        success: false,
        message: 'Aplikasi sedang dalam Mode Perawatan. Hanya Admin dan Deputy Director yang dapat masuk.'
      });
    }

    dbManager.logActivity(user.username, 'Masuk ke dalam aplikasi');

    // Simple session token
    const token = Buffer.from(`${user.username}:${Date.now()}`).toString('base64');
    const { passwordHash, salt, ...safeUser } = user;

    res.json({
      success: true,
      token,
      user: safeUser
    });
  });

  app.post('/api/auth/reset-request', (req: Request, res: Response) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Nama pengguna wajib diisi.' });
    }
    const reqItem = dbManager.requestReset(username);
    res.json({ success: true, message: 'Permintaan reset berhasil dikirim ke Admin.', data: reqItem });
  });

  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
    }
    const user = dbManager.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    if (oldPassword && !verifyPassword(oldPassword, user)) {
      return res.status(401).json({ success: false, message: 'Kata sandi lama salah.' });
    }

    dbManager.changePassword(username, newPassword);
    res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
  });

  // --- Full Data Snapshot for Live Real-time Sync ---
  app.get('/api/data', (req: Request, res: Response) => {
    const data = dbManager.getData();
    const safeUsers = data.users.map(({ passwordHash, salt, ...rest }) => rest);
    res.json({
      success: true,
      data: {
        ...data,
        users: safeUsers
      }
    });
  });

  // --- KPI / Stats ---
  app.get('/api/kpi', (req: Request, res: Response) => {
    const data = dbManager.getData();
    const totalBibit = data.produksi.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
    const totalMitra = data.mitra.length;
    const proyekAktif = data.proyek.filter(p => p.status === 'Berjalan').length;
    const now = new Date();
    const legalSegeraHabis = data.legal.filter(l => {
      if (!l.berlaku) return false;
      const diffDays = Math.ceil((new Date(l.berlaku).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 90;
    }).length;

    res.json({
      success: true,
      data: {
        totalBibit,
        totalMitra,
        proyekAktif,
        legalSegeraHabis
      }
    });
  });

  // --- Produksi CRUD ---
  app.get('/api/produksi', (req: Request, res: Response) => {
    res.json({ success: true, data: dbManager.getTable('produksi') });
  });

  app.post('/api/produksi', (req: Request, res: Response) => {
    const actor = getActor(req);
    const item = dbManager.insertItem('produksi', req.body, actor.username);
    res.json({ success: true, data: item });
  });

  app.put('/api/produksi/:id', (req: Request, res: Response) => {
    const actor = getActor(req);
    const item = dbManager.updateItem('produksi', req.params.id, req.body, actor.username);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: item });
  });

  app.delete('/api/produksi/:id', (req: Request, res: Response) => {
    const actor = getActor(req);
    const ok = dbManager.deleteItem('produksi', req.params.id, actor.username);
    res.json({ success: ok });
  });

  // --- Petani Mitra CRUD ---
  app.get('/api/mitra', (req: Request, res: Response) => {
    res.json({ success: true, data: dbManager.getTable('mitra') });
  });

  app.post('/api/mitra', (req: Request, res: Response) => {
    const actor = getActor(req);
    const item = dbManager.insertItem('mitra', req.body, actor.username);
    res.json({ success: true, data: item });
  });

  app.put('/api/mitra/:id', (req: Request, res: Response) => {
    const actor = getActor(req);
    const item = dbManager.updateItem('mitra', req.params.id, req.body, actor.username);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: item });
  });

  app.delete('/api/mitra/:id', (req: Request, res: Response) => {
    const actor = getActor(req);
    const ok = dbManager.deleteItem('mitra', req.params.id, actor.username);
    res.json({ success: ok });
  });

  // --- Proyek CRUD ---
  app.get('/api/proyek', (req: Request, res: Response) => {
    res.json({ success: true, data: dbManager.getTable('proyek') });
  });

  app.post('/api/proyek', (req: Request, res: Response) => {
    const actor = getActor(req);
    const item = dbManager.insertItem('proyek', req.body, actor.username);
    res.json({ success: true, data: item });
  });

  app.put('/api/proyek/:id', (req: Request, res: Response) => {
    const actor = getActor(req);
    const item = dbManager.updateItem('proyek', req.params.id, req.body, actor.username);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: item });
  });

  app.delete('/api/proyek/:id', (req: Request, res: Response) => {
    const actor = getActor(req);
    const ok = dbManager.deleteItem('proyek', req.params.id, actor.username);
    res.json({ success: ok });
  });

  // --- Legalitas CRUD ---
  app.get('/api/legal', (req: Request, res: Response) => {
    res.json({ success: true, data: dbManager.getTable('legal') });
  });

  app.post('/api/legal', (req: Request, res: Response) => {
    const actor = getActor(req);
    const item = dbManager.insertItem('legal', req.body, actor.username);
    res.json({ success: true, data: item });
  });

  app.put('/api/legal/:id', (req: Request, res: Response) => {
    const actor = getActor(req);
    const item = dbManager.updateItem('legal', req.params.id, req.body, actor.username);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: item });
  });

  app.delete('/api/legal/:id', (req: Request, res: Response) => {
    const actor = getActor(req);
    const ok = dbManager.deleteItem('legal', req.params.id, actor.username);
    res.json({ success: ok });
  });

  // --- Dokumen (Penawaran, Invoice, BAST) ---
  app.get('/api/dokumen', (req: Request, res: Response) => {
    res.json({ success: true, data: dbManager.getTable('dokumen') });
  });

  app.post('/api/dokumen', (req: Request, res: Response) => {
    const actor = getActor(req);
    const doc = dbManager.addDokumen(
      {
        no: req.body.no,
        j: req.body.j,
        kl: req.body.kl,
        tg: req.body.tg,
        T: Number(req.body.T) || 0,
        items: req.body.items || [],
        html: req.body.html || '',
        createdBy: actor.nama
      },
      actor.username
    );
    res.json({ success: true, data: doc });
  });

  app.delete('/api/dokumen/:id', (req: Request, res: Response) => {
    const actor = getActor(req);
    const ok = dbManager.deleteItem('dokumen', req.params.id, actor.username);
    res.json({ success: ok });
  });

  // --- Users Management ---
  app.get('/api/users', (req: Request, res: Response) => {
    res.json({ success: true, data: dbManager.getUsers() });
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const actor = getActor(req);
    const { username, password, nama, jabatan, role, foto } = req.body;
    if (!username || !nama || !role) {
      return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi.' });
    }
    const existing = dbManager.findUserByUsername(username);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Nama pengguna sudah digunakan.' });
    }
    const newUser = dbManager.addUser({ username, password, nama, jabatan, role, foto }, actor.username);
    const { passwordHash, salt, ...safe } = newUser;
    res.json({ success: true, data: safe });
  });

  app.put('/api/users/:username', (req: Request, res: Response) => {
    const actor = getActor(req);
    const updated = dbManager.updateUser(req.params.username, req.body, actor.username);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    const { passwordHash, salt, ...safe } = updated;
    res.json({ success: true, data: safe });
  });

  app.post('/api/users/:username/reset-password', (req: Request, res: Response) => {
    const actor = getActor(req);
    const ok = dbManager.resetPassword(req.params.username, actor.username);
    if (!ok) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.json({ success: true, message: `Kata sandi ${req.params.username} telah direset sama dengan username.` });
  });

  // --- Settings & Logs ---
  app.get('/api/logs', (req: Request, res: Response) => {
    res.json({ success: true, data: dbManager.getData().logs });
  });

  app.post('/api/settings/maintenance', (req: Request, res: Response) => {
    const actor = getActor(req);
    const { enabled } = req.body;
    const settings = dbManager.updateSettings({ maintenanceMode: !!enabled }, actor.username);
    res.json({ success: true, data: settings });
  });

  // --- Backup & Export/Import ---
  app.get('/api/backup/export', (req: Request, res: Response) => {
    const data = dbManager.getData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=LBA_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    res.send(JSON.stringify(data, null, 2));
  });

  app.post('/api/backup/import', (req: Request, res: Response) => {
    const actor = getActor(req);
    try {
      dbManager.restoreBackup(req.body, actor.username);
      res.json({ success: true, message: 'Database berhasil dipulihkan.' });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message || 'Gagal memulihkan database' });
    }
  });

  app.get('/api/backup/export-csv/:table', (req: Request, res: Response) => {
    const table = req.params.table as 'produksi' | 'mitra' | 'proyek' | 'legal';
    const valid = ['produksi', 'mitra', 'proyek', 'legal'];
    if (!valid.includes(table)) {
      return res.status(400).send('Tabel tidak ditemukan');
    }
    const items = dbManager.getTable(table);
    if (!items.length) {
      return res.send('');
    }
    const headers = Object.keys(items[0]);
    const csvRows = [headers.join(',')];
    for (const item of items) {
      const values = headers.map(h => {
        const val = (item as any)[h] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${table}_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csvRows.join('\n'));
  });

  // --- Firebase Info API ---
  app.get('/api/firebase/info', (req: Request, res: Response) => {
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return res.json({
          configured: true,
          projectId: config.projectId,
          firestoreDatabaseId: config.firestoreDatabaseId,
          authDomain: config.authDomain,
          status: 'Connected'
        });
      }
    } catch (e) {
      // ignore
    }
    return res.json({ configured: false, status: 'Not Configured' });
  });

  // --- Frontend Setup ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server Sistem Manajemen Project LBA running on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
