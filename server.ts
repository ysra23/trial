import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'omada-secret-key-2024';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

// --- IN-MEMORY DATABASE ---
  const db = {
    users: [] as any[],
    schedules: [] as any[],
    subscriptions: [] as any[],
    _id: 1,
    get: async (query: string, params: any[]) => {
      if (query.includes('FROM users WHERE email = ?')) {
        return db.users.find(u => u.email === params[0]);
      }
      if (query.includes('FROM users WHERE id = ?')) {
        return db.users.find(u => u.id === params[0]);
      }
      if (query.includes('FROM subscriptions WHERE userId = ?')) {
        return db.subscriptions.find(s => s.userId === params[0]);
      }
      return null;
    },
    run: async (query: string, params: any[]) => {
      if (query.includes('INSERT INTO users')) {
        const id = db._id++;
        db.users.push({ id, email: params[0], password: params[1], companyName: params[2], preferredCurrency: 'USD' });
        return { lastID: id };
      }
      if (query.includes('UPDATE users SET preferredCurrency')) {
        const user = db.users.find(u => u.id === params[1]);
        if (user) user.preferredCurrency = params[0];
      }
      if (query.includes('INSERT INTO schedules')) {
        db.schedules.push({ id: db._id++, userId: params[0], type: params[1], time: params[2], target: params[3] });
      }
      if (query.includes('DELETE FROM schedules')) {
        db.schedules = db.schedules.filter(s => !(s.id === params[0] && s.userId === params[1]));
      }
      if (query.includes('INSERT INTO subscriptions')) {
        db.subscriptions.push({ userId: params[0], planId: params[1], status: params[2] });
      }
      if (query.includes('DELETE FROM subscriptions')) {
        db.subscriptions = db.subscriptions.filter(s => s.userId === params[0]);
      }
    },
    all: async (query: string, params: any[]) => {
      if (query.includes('FROM schedules WHERE userId = ?')) {
        return db.schedules.filter(s => s.userId === params[0]);
      }
      return [];
    }
  };

  // --- MIDDLEWARE ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = user;
      next();
    });
  };

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, companyName } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.run('INSERT INTO users (email, password, companyName) VALUES (?, ?, ?)', [email, hashedPassword, companyName]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      res.cookie('token', token, { httpOnly: true });
      res.json({ token, user: { id: user.id, email: user.email, companyName: user.companyName } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    const user = await db.get('SELECT id, email, companyName, preferredCurrency FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  });

  // --- CURRENCY ROUTES ---
  const EXCHANGE_RATES: any = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.36,
    AUD: 1.52,
    INR: 83.50,
    JPY: 150.20
  };

  app.get('/api/currency/rates', (req, res) => {
    res.json(EXCHANGE_RATES);
  });

  app.post('/api/currency/select', authenticateToken, async (req: any, res) => {
    const { currency } = req.body;
    await db.run('UPDATE users SET preferredCurrency = ? WHERE id = ?', [currency, req.user.id]);
    res.json({ success: true });
  });

  // --- NETWORK ROUTES (DASHBOARD) ---
  app.get('/api/network/status', authenticateToken, (req, res) => {
    res.json({
      devicesOnline: 24,
      activeClients: 142,
      trafficToday: '1.2 TB',
      health: 'Good'
    });
  });

  app.get('/api/network/topology', authenticateToken, (req, res) => {
    res.json({
      nodes: [
        { id: 'gateway', label: 'Gateway', type: 'router' },
        { id: 'switch1', label: 'Main Switch', type: 'switch' },
        { id: 'ap1', label: 'Lobby AP', type: 'ap' },
        { id: 'ap2', label: 'Office AP', type: 'ap' }
      ],
      links: [
        { from: 'gateway', to: 'switch1' },
        { from: 'switch1', to: 'ap1' },
        { from: 'switch1', to: 'ap2' }
      ]
    });
  });

  app.get('/api/network/traffic', authenticateToken, (req, res) => {
    const data = Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      download: Math.floor(Math.random() * 500) + 200,
      upload: Math.floor(Math.random() * 200) + 50,
    }));
    res.json(data);
  });

  app.get('/api/network/devices', authenticateToken, (req, res) => {
    res.json([
      { id: 'd1', name: 'MacBook Pro', ip: '192.168.1.15', status: 'Online', signal: -45 },
      { id: 'd2', name: 'iPhone 15', ip: '192.168.1.22', status: 'Online', signal: -62 },
      { id: 'd3', name: 'Smart TV', ip: '192.168.1.45', status: 'Offline', signal: 0 },
    ]);
  });

  app.post('/api/network/scan', authenticateToken, (req, res) => {
    res.json({ message: 'Discovery complete. 3 new devices found.' });
  });

  app.post('/api/network/firmware/upgrade', authenticateToken, (req, res) => {
    res.json({ message: 'Firmware upgrade scheduled for 02:00 AM' });
  });

  // --- CONFIG ROUTES ---
  app.get('/api/config/templates', authenticateToken, (req, res) => {
    res.json([
      { id: 'retail', name: 'Retail Store', desc: 'Optimized for guest Wi-Fi and high client density.' },
      { id: 'office', name: 'Corporate Office', desc: 'Prioritizes security and balanced throughput.' },
      { id: 'warehouse', name: 'Large Warehouse', desc: 'Maximum range and hand-off optimization.' }
    ]);
  });

  app.get('/api/config/ssids', authenticateToken, (req, res) => {
    res.json(['OMADA_GUEST', 'OMADA_STAFF', 'OMADA_IOT']);
  });

  app.post('/api/config/apply', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Settings applied successfully' });
  });

  // --- SCHEDULES ---
  app.get('/api/schedules', authenticateToken, async (req: any, res) => {
    const items = await db.all('SELECT * FROM schedules WHERE userId = ?', [req.user.id]);
    res.json(items);
  });

  app.post('/api/schedules', authenticateToken, async (req: any, res) => {
    const { type, time, target } = req.body;
    await db.run('INSERT INTO schedules (userId, type, time, target) VALUES (?, ?, ?, ?)', [req.user.id, type, time, target]);
    res.json({ success: true });
  });

  app.delete('/api/schedules/:id', authenticateToken, async (req: any, res) => {
    await db.run('DELETE FROM schedules WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  });

  // --- SITES ---
  app.get('/api/sites', authenticateToken, (req, res) => {
    res.json([
      { id: 'site1', name: 'Main Office' },
      { id: 'site2', name: 'Warehouse A' },
      { id: 'site3', name: 'Remote Cabin' }
    ]);
  });

  app.post('/api/sites/switch', authenticateToken, (req, res) => {
    res.json({ success: true, currentSite: req.body.siteId });
  });

  // --- PLANS ---
  const BASE_PLANS = [
    { id: 'basic', name: 'Basic Link', monthly: 49, yearly: 470, features: ['Local Control', 'Standard Support', 'Up to 10 Devices'] },
    { id: 'pro', name: 'Pro Bridge', monthly: 99, yearly: 950, features: ['Cloud Control', 'Priority Support', 'Up to 50 Devices', 'AI Analytics'] },
    { id: 'enterprise', name: 'Enterprise SDN', monthly: 199, yearly: 1910, features: ['Full Automation', '24/7 VIP Support', 'Unlimited Devices', 'Advanced Security'] }
  ];

  app.get('/api/plans', async (req: any, res) => {
    // Check query param first, then user preference
    let currency = (req.query.currency as string) || 'USD';
    
    if (!req.query.currency) {
      const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
      if (token) {
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          const user = await db.get('SELECT preferredCurrency FROM users WHERE id = ?', [decoded.id]);
          if (user) currency = user.preferredCurrency;
        } catch (e) {}
      }
    }

    const rate = EXCHANGE_RATES[currency] || 1;
    const convertedPlans = BASE_PLANS.map(p => ({
      ...p,
      monthly: Math.round(p.monthly * rate),
      yearly: Math.round(p.yearly * rate),
      currency
    }));
    res.json(convertedPlans);
  });

  app.post('/api/subscribe', authenticateToken, async (req: any, res) => {
    const { planId } = req.body;
    await db.run('DELETE FROM subscriptions WHERE userId = ?', [req.user.id]);
    await db.run('INSERT INTO subscriptions (userId, planId, status) VALUES (?, ?, ?)', [req.user.id, planId, 'active']);
    res.json({ success: true });
  });

  app.get('/api/subscription/status', authenticateToken, async (req: any, res) => {
    const sub = await db.get('SELECT * FROM subscriptions WHERE userId = ?', [req.user.id]);
    res.json(sub || { status: 'none' });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
