/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  LayoutDashboard, 
  Settings, 
  Wrench, 
  CreditCard, 
  LogOut, 
  User, 
  Menu, 
  X,
  ChevronRight,
  RefreshCcw,
  Network,
  Zap,
  Globe,
  Bell,
  Cpu,
  Database,
  BarChart3,
  ShieldCheck,
  Smartphone,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// --- API LAYER ---
const API = {
  fetch: async (url: string, options: any = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'API Error');
    }
    return res.json();
  },
  login: (data: any) => API.fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => API.fetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => API.fetch('/api/auth/me'),
  getRates: () => API.fetch('/api/currency/rates'),
  selectCurrency: (currency: string) => API.fetch('/api/currency/select', { method: 'POST', body: JSON.stringify({ currency }) }),
  getStatus: () => API.fetch('/api/network/status'),
  getTopology: () => API.fetch('/api/network/topology'),
  getTraffic: () => API.fetch('/api/network/traffic'),
  getDevices: () => API.fetch('/api/network/devices'),
  getTemplates: () => API.fetch('/api/config/templates'),
  getSsids: () => API.fetch('/api/config/ssids'),
  getSchedules: () => API.fetch('/api/schedules'),
  addSchedule: (data: any) => API.fetch('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),
  deleteSchedule: (id: number) => API.fetch(`/api/schedules/${id}`, { method: 'DELETE' }),
  getSites: () => API.fetch('/api/sites'),
  switchSite: (siteId: string) => API.fetch('/api/sites/switch', { method: 'POST', body: JSON.stringify({ siteId }) }),
  getPlans: () => API.fetch('/api/plans'),
  subscribe: (planId: string) => API.fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ planId }) }),
  getSubscription: () => API.fetch('/api/subscription/status'),
};

// --- COMPONENTS ---

const Card = ({ children, title, className = "" }: any) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm ${className}`}>
    {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
    {children}
  </div>
);

const PriceCard = ({ plan, onSubscribe, currentPlan, currency }: any) => (
  <div className={`bg-white rounded-2xl border-2 p-8 transition-all ${currentPlan === plan.id ? 'border-brand-blue ring-4 ring-brand-blue/10 scale-105' : 'border-slate-100'}`}>
    <div className="mb-6">
      <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
      <div className="flex items-baseline mt-2">
        <span className="text-4xl font-extrabold text-slate-900">{currency} {plan.monthly}</span>
        <span className="text-slate-500 ml-1">/mo</span>
      </div>
    </div>
    <ul className="space-y-4 mb-8">
      {plan.features.map((f: string, i: number) => (
        <li key={i} className="flex items-center text-slate-600 text-sm">
          <ShieldCheck className="w-4 h-4 text-brand-blue mr-2 shrink-0" />
          {f}
        </li>
      ))}
    </ul>
    <button 
      onClick={() => onSubscribe(plan.id)}
      className={`w-full py-3 rounded-lg font-semibold transition-colors ${currentPlan === plan.id ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
    >
      {currentPlan === plan.id ? 'Active Plan' : 'Select Plan'}
    </button>
  </div>
);

const HeatmapModal = ({ onClose }: any) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
    >
      <div className="bg-brand-blue p-6 flex justify-between items-center text-white">
        <div>
          <h2 className="text-xl font-bold">Signal Heatmap</h2>
          <p className="text-sm opacity-80">Click grid to simulate AP placement</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
      </div>
      <div className="p-8 grid grid-cols-5 gap-2 bg-slate-50">
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div 
            key={i} 
            whileHover={{ scale: 1.05 }}
            className={`aspect-square rounded-lg flex items-center justify-center cursor-pointer border shadow-sm ${
              i % 7 === 0 ? 'bg-red-400/20 text-red-600 border-red-200' : 
              i % 3 === 0 ? 'bg-yellow-400/20 text-yellow-600 border-yellow-200' : 
              'bg-green-400/20 text-green-600 border-green-200'
            }`}
          >
            <Wifi className="w-5 h-5 opacity-40" />
          </motion.div>
        ))}
      </div>
      <div className="p-6 bg-slate-100 flex justify-between items-center">
        <div className="flex gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Strong</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-sm"></div> Medium</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Weak</span>
        </div>
        <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium">Done</button>
      </div>
    </motion.div>
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [currency, setCurrentCurrency] = useState('USD');
  const [rates, setRates] = useState<any>({});
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const me = await API.getMe();
      setUser(me);
      setCurrentCurrency(me.preferredCurrency);
      const r = await API.getRates();
      setRates(r);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    setView('dashboard');
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-brand-blue">
        <RefreshCcw size={48} />
      </motion.div>
    </div>
  );

  if (!user) return <AuthPage onAuth={init} />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shrink-0 overflow-hidden`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-brand-blue p-2 rounded-lg">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">OMADA <span className="text-brand-blue">SDN</span></span>}
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-2">
          <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} open={isSidebarOpen} />
          <SidebarItem icon={<Settings />} label="Services" active={view === 'services'} onClick={() => setView('services')} open={isSidebarOpen} />
          <SidebarItem icon={<Wrench />} label="Maintenance" active={view === 'maintenance'} onClick={() => setView('maintenance')} open={isSidebarOpen} />
          <SidebarItem icon={<CreditCard />} label="Pricing" active={view === 'pricing'} onClick={() => setView('pricing')} open={isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 text-slate-400 mb-2">
            <User className="w-5 h-5" />
            {isSidebarOpen && <span className="text-sm truncate font-medium">{user.email}</span>}
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 capitalize">{view}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <select 
                value={currency} 
                onChange={async (e) => {
                  const val = e.target.value;
                  setCurrentCurrency(val);
                  await API.selectCurrency(val);
                }}
                className="text-xs font-bold bg-slate-100 py-1.5 px-3 rounded-full border-none focus:ring-2 focus:ring-brand-blue cursor-pointer"
              >
                {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button className="relative text-slate-500 p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
            </button>
            <SiteSelector />
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {view === 'dashboard' && <DashboardView key="dash" onShowHeatmap={() => setShowHeatmap(true)} />}
              {view === 'services' && <ServicesView key="serv" />}
              {view === 'maintenance' && <MaintenanceView key="main" />}
              {view === 'pricing' && <PricingView key="price" currency={currency} />}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {showHeatmap && <HeatmapModal onClose={() => setShowHeatmap(false)} />}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, open }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
        active 
          ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className="shrink-0">{React.cloneElement(icon, { size: 20 })}</div>
      {open && <span className="text-sm font-semibold whitespace-nowrap">{label}</span>}
    </button>
  );
}

function SiteSelector() {
  const [sites, setSites] = useState<any[]>([]);
  const [currentSite, setCurrentSite] = useState('site1');

  useEffect(() => {
    API.getSites().then(setSites);
  }, []);

  return (
    <select 
      value={currentSite}
      onChange={(e) => {
        setCurrentSite(e.target.value);
        API.switchSite(e.target.value);
      }}
      className="text-sm font-semibold bg-white border border-slate-200 py-1.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue shadow-sm"
    >
      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  );
}

// --- VIEW COMPONENTS ---

function DashboardView({ onShowHeatmap }: any) {
  const [status, setStatus] = useState<any>({});
  const [traffic, setTraffic] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([API.getStatus(), API.getTraffic(), API.getDevices()]).then(([s, t, d]) => {
      setStatus(s);
      setTraffic(t);
      setDevices(d);
    });
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Devices Online" value={status.devicesOnline} icon={<Server className="text-brand-blue" />} />
        <StatCard title="Active Clients" value={status.activeClients} icon={<Smartphone className="text-green-500" />} />
        <StatCard title="Today's Traffic" value={status.trafficToday} icon={<Zap className="text-yellow-500" />} />
        <StatCard title="System Health" value={status.health} icon={<ShieldCheck className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Topology & Charts */}
        <Card title="Traffic Overview (7 Days)" className="lg:col-span-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={traffic}>
                <defs>
                  <linearGradient id="colorDn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005bb7" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#005bb7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="download" stroke="#005bb7" fillOpacity={1} fill="url(#colorDn)" strokeWidth={3} />
                <Area type="monotone" dataKey="upload" stroke="#94a3b8" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Topology Simulation */}
        <Card title="Network Topology" className="flex flex-col">
          <div className="flex-1 bg-slate-50 rounded-lg p-6 relative overflow-hidden flex items-center justify-center border border-slate-100">
             <div className="flex flex-col items-center gap-12 z-10">
                <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xl"><Globe size={32} /></div>
                <div className="p-4 bg-brand-blue text-white rounded-xl shadow-xl flex gap-12 relative">
                   <div className="absolute h-12 w-0.5 bg-slate-300 top-[-48px] left-1/2"></div>
                   <div className="absolute h-12 w-0.5 bg-slate-300 bottom-[-48px] left-4"></div>
                   <div className="absolute h-12 w-0.5 bg-slate-300 bottom-[-48px] right-4"></div>
                   <Server size={24} />
                   <Smartphone size={24} />
                </div>
             </div>
             <div className="absolute inset-0 opacity-10 pointer-events-none">
                <Network className="w-full h-full text-brand-blue" />
             </div>
          </div>
          <button 
            onClick={onShowHeatmap}
            className="mt-6 w-full py-3 bg-slate-800 text-white rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-slate-700 transition-colors"
          >
            <Wifi size={18} /> Open Heatmap Simulator
          </button>
        </Card>
      </div>

      {/* Connected Clients */}
      <Card title="Connected Devices" className="overflow-hidden">
        <div className="overflow-x-auto mt-[-1.5rem] mx-[-1.5rem]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-y border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Device Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">IP Address</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Signal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {devices.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-3">
                    <Smartphone size={16} className="text-slate-400" /> {d.name}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{d.ip}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`w-1.5 h-3 rounded-full ${i <= (Math.abs(d.signal) < 50 ? 4 : 2) ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{d.signal} dBm</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${d.status === 'Online' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <Card className="flex items-center gap-4 border-none shadow-md">
      <div className="p-4 bg-slate-50 rounded-2xl">
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold font-mono">{value}</p>
      </div>
    </Card>
  );
}

function ServicesView() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [ssids, setSsids] = useState<any[]>([]);
  const [isScanning, setScanning] = useState(false);

  useEffect(() => {
    API.getTemplates().then(setTemplates);
    API.getSsids().then(setSsids);
  }, []);

  const handleScan = () => {
    setScanning(true);
    setTimeout(async () => {
      const res = await API.getStatus(); // refresh logic simulation
      alert("Scan complete! 3 new devices discovered.");
      setScanning(false);
    }, 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card title="Quick Templates">
             <div className="grid gap-4">
                {templates.map(t => (
                  <button key={t.id} className="text-left p-4 rounded-xl border border-slate-100 hover:border-brand-blue hover:bg-brand-blue/5 transition-all group flex items-start gap-4">
                     <div className="p-3 bg-slate-100 group-hover:bg-brand-blue group-hover:text-white rounded-lg transition-colors">
                        <Database size={20} />
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-800">{t.name}</h4>
                        <p className="text-xs text-slate-500">{t.desc}</p>
                     </div>
                     <ChevronRight className="ml-auto mt-2 text-slate-300" />
                  </button>
                ))}
             </div>
          </Card>

          <Card title="Network Controls">
             <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                   <div className="flex items-center gap-3">
                      <Zap className="text-brand-blue" />
                      <div>
                        <p className="font-bold text-sm">ZTP (Zero-Touch Provisioning)</p>
                        <p className="text-xs text-slate-500">Auto-adopt new Omada assets</p>
                      </div>
                   </div>
                   <Toggle />
                </div>

                <div className="space-y-3">
                   <p className="text-sm font-bold text-slate-600">Active SSIDs</p>
                   <div className="grid grid-cols-2 gap-2">
                      {ssids.map(s => (
                        <div key={s} className="flex items-center gap-2 p-3 border border-slate-100 rounded-lg text-sm bg-white">
                           <input type="checkbox" defaultChecked className="rounded text-brand-blue" /> {s}
                        </div>
                      ))}
                      <button className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 rounded-lg text-sm text-slate-400 hover:border-brand-blue hover:text-brand-blue">
                         + Add SSID
                      </button>
                   </div>
                </div>

                <button 
                  onClick={handleScan}
                  disabled={isScanning}
                  className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-brand-blue/30 disabled:opacity-50"
                >
                  <RefreshCcw className={isScanning ? 'animate-spin' : ''} /> {isScanning ? 'Scanning...' : 'Scan for Devices'}
                </button>
             </div>
          </Card>
       </div>
    </motion.div>
  );
}

function MaintenanceView() {
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    API.getSchedules().then(setSchedules);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card title="Firmware Management">
             <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center mx-auto">
                   <Cpu size={32} />
                </div>
                <div>
                   <h4 className="font-bold text-lg">System Up to Date</h4>
                   <p className="text-sm text-slate-500">Last checked: 10 mins ago</p>
                </div>
                <button className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors">Check for Updates</button>
             </div>
          </Card>

          <Card title="Maintenance Schedules">
             <div className="space-y-4">
                {schedules.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                           {s.type === 'Reboot' ? <RefreshCcw size={18} /> : <Zap size={18} />}
                        </div>
                        <div>
                           <p className="font-bold text-sm">{s.type} - {s.target}</p>
                           <p className="text-xs text-slate-500">Every {s.time}</p>
                        </div>
                     </div>
                     <button onClick={() => API.deleteSchedule(s.id).then(() => setSchedules(schedules.filter(x => x.id !== s.id)))} className="p-2 hover:bg-red-50 text-red-400 rounded-lg">
                        <LogOut size={16} />
                     </button>
                  </div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-medium hover:border-brand-blue hover:text-brand-blue transition-all">
                  + Create New Schedule
                </button>
             </div>
          </Card>
       </div>
    </motion.div>
  );
}

function PricingView({ currency }: any) {
  const [plans, setPlans] = useState<any[]>([]);
  const [sub, setSub] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    API.getPlans().then(setPlans);
    API.getSubscription().then(setSub);
  }, [currency]);

  const handleSubscribe = async (id: string) => {
    await API.subscribe(id);
    const s = await API.getSubscription();
    setSub(s);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
       <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Flexible SDN Plans</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Scale your network from a single room to multiple campuses with our professional cloud-managed subscriptions.</p>
          
          <div className="flex items-center justify-center gap-4 mt-8">
             <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-brand-blue' : 'text-slate-400'}`}>Monthly</span>
             <button onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} className="w-12 h-6 bg-slate-200 rounded-full relative p-1 transition-colors">
                <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-sm ${billingCycle === 'yearly' ? 'translate-x-6' : ''}`}></div>
             </button>
             <span className={`text-sm font-semibold ${billingCycle === 'yearly' ? 'text-brand-blue' : 'text-slate-400'}`}>Yearly <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full ml-1">Save 20%</span></span>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(p => (
            <PriceCard 
              key={p.id} 
              plan={{ ...p, monthly: billingCycle === 'monthly' ? p.monthly : Math.round(p.yearly / 12) }} 
              onSubscribe={handleSubscribe}
              currentPlan={sub?.planId}
              currency={currency}
            />
          ))}
       </div>
    </motion.div>
  );
}

function AuthPage({ onAuth }: any) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', companyName: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        const { token } = await API.login(form);
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      } else {
        await API.register(form);
        setMode('login');
        return;
      }
      onAuth();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-dark overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#005bb755,transparent)] opacity-20"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-12 rounded-[2rem] w-full max-w-md relative z-10"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="bg-brand-blue p-2 rounded-xl">
              <Wifi size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">OMADA<span className="text-brand-blue font-light">WI-FI</span></h2>
        </div>

        <div className="space-y-6">
          <div className="flex border-b border-white/10 mb-8">
            <button onClick={() => setMode('login')} className={`flex-1 pb-4 text-sm font-bold ${mode === 'login' ? 'text-white border-b-2 border-brand-blue' : 'text-slate-500'}`}>Login</button>
            <button onClick={() => setMode('register')} className={`flex-1 pb-4 text-sm font-bold ${mode === 'register' ? 'text-white border-b-2 border-brand-blue' : 'text-slate-500'}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Company Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="ACME Corp"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white/10 transition-all"
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="admin@omada.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white/10 transition-all"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white/10 transition-all"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error && <p className="text-red-400 text-xs font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}

            <button className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-blue/30 hover:scale-[1.02] transition-transform active:scale-[0.98]">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function Toggle() {
  const [on, setOn] = useState(true);
  return (
    <button onClick={() => setOn(!on)} className={`w-12 h-6 rounded-full relative p-1 transition-colors ${on ? 'bg-brand-blue' : 'bg-slate-300'}`}>
       <div className={`w-4 h-4 bg-white rounded-full transition-all ${on ? 'translate-x-6' : ''}`}></div>
    </button>
  );
}
