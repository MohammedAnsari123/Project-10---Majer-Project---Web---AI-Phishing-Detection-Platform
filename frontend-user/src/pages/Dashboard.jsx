import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Globe, Mail, AlertTriangle, Shield, CheckCircle, Info, RefreshCw, BarChart2, Radio } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { io } from 'socket.io-client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);
  const [liveThreats, setLiveThreats] = useState([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    safeUrls: 0,
    dangerousUrls: 0,
    emailScans: 0,
    highRiskCount: 0,
    chartData: [],
    threatDistribution: []
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const name = localStorage.getItem('userName');
    if (name) setUserName(name);

    fetchStats();

    // Initialize WebSockets for Live Telemetry
    const socket = io('http://localhost:5000');

    socket.on('newThreat', (threat) => {
      console.log('Real-time threat captured:', threat);
      setLiveThreats((prev) => [threat, ...prev].slice(0, 5));
      fetchStats();
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await API.get('/analytics');
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error loading dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-cyan-500 selection:text-slate-950">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:pl-64 pt-14 md:pt-0">
        {/* HEADER */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Threat Intelligence Hub</h1>
            <p className="text-xs text-slate-400">Welcome, {userName}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-all border border-slate-900 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="md:hidden p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-semibold text-cyan-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> System Secured
            </div>
          </div>
        </header>

        {/* BODY */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Total Scans Run
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{stats.totalScans}</span>
                <span className="text-xs text-cyan-400 font-semibold">100% Volume</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Safe URLs Detected
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400">{stats.safeUrls}</span>
                <span className="text-xs text-emerald-500/80 font-medium">Safe Reputations</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Threat Flags
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-red-400">{stats.highRiskCount}</span>
                <span className="text-xs text-red-500/80 font-medium">Dangerous flagged</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Email Analysis Run
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-400">{stats.emailScans}</span>
                <span className="text-xs text-blue-500/80 font-medium">Deceptive content</span>
              </div>
            </div>
          </div>

          {/* VISUAL telemetry (CHARTS) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Daily scan activity area chart */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  Daily Scan Activity (Last 14 Days)
                </h3>
                <p className="text-xs text-slate-500 mb-6">Volume of automated url scanners and email analyze requests</p>
              </div>

              {stats.chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-600 text-xs">
                  No scan activity data available.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} labelClassName="text-slate-400 text-xs" />
                      <Area type="monotone" dataKey="scans" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Threat Distribution Pie Chart */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Threat Distribution
                </h3>
                <p className="text-xs text-slate-500 mb-6">Scan results segmented by classification</p>
              </div>

              {stats.totalScans === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-600 text-xs">
                  No scanning metrics recorded yet.
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-56">
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Safe (Low)', value: stats.safeUrls },
                          { name: 'Suspicious (Medium)', value: stats.totalScans - stats.safeUrls - stats.highRiskCount },
                          { name: 'Dangerous (High)', value: stats.highRiskCount }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend list */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] w-full pt-4 border-t border-slate-900">
                    <div className="text-center">
                      <span className="block text-emerald-400 font-bold">{stats.safeUrls}</span>
                      <span className="text-slate-500">Safe</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-amber-500 font-bold">{stats.totalScans - stats.safeUrls - stats.highRiskCount}</span>
                      <span className="text-slate-500">Suspicious</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-red-500 font-bold">{stats.highRiskCount}</span>
                      <span className="text-slate-500">Dangerous</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GEOLOCATION THREAT MAP */}
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Real-Time Global Threat Map
              </h3>
              <p className="text-xs text-slate-500 mb-6">Visualizing IP coordinate scans and origins of active phishing hosts</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Map visualization */}
              <div className="md:col-span-2 relative h-48 bg-slate-950/40 rounded-xl border border-slate-900/80 flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full opacity-20 pointer-events-none" viewBox="0 0 1000 500">
                  <path d="M50,250 H950 M500,50 V450" stroke="#06b6d4" strokeWidth="1" strokeDasharray="5,5" />
                  <circle cx="500" cy="250" r="100" stroke="#06b6d4" strokeWidth="0.5" fill="none" strokeDasharray="3,3" />
                  <circle cx="500" cy="250" r="200" stroke="#06b6d4" strokeWidth="0.5" fill="none" strokeDasharray="3,3" />
                  
                  {/* North America */}
                  <path d="M150,120 Q180,110 210,130 T250,150 T200,200 Z" fill="#38bdf8" />
                  {/* South America */}
                  <path d="M220,250 Q240,280 260,350 T280,420 T230,300 Z" fill="#38bdf8" />
                  {/* Eurasia */}
                  <path d="M450,100 Q650,80 800,120 T900,180 T750,250 T500,200 Z" fill="#38bdf8" />
                  {/* Africa */}
                  <path d="M480,220 Q540,240 560,300 T580,380 T500,320 Z" fill="#38bdf8" />
                  {/* Australia */}
                  <circle cx="800" cy="350" r="35" fill="#38bdf8" />
                </svg>
                
                {(() => {
                  const countryCoordinates = {
                    'US': { x: 200, y: 140 },
                    'DE': { x: 520, y: 130 },
                    'CN': { x: 750, y: 170 },
                    'NL': { x: 500, y: 120 },
                    'SG': { x: 780, y: 280 },
                    'GB': { x: 480, y: 115 },
                    'IN': { x: 680, y: 200 },
                    'RU': { x: 650, y: 95 },
                    'FR': { x: 495, y: 135 },
                    'CA': { x: 180, y: 95 }
                  };
                  
                  const activeCountryCodes = Array.from(new Set([
                    ...liveThreats.map(t => t.country_code),
                    ...(stats.recentGeolocations || []).map(t => t.country_code)
                  ].filter(Boolean)));
                  
                  return activeCountryCodes.map(code => {
                    const coords = countryCoordinates[code] || countryCoordinates['US'];
                    return (
                      <div 
                        key={code}
                        className="absolute pointer-events-auto group cursor-help"
                        style={{ left: `${coords.x / 10}%`, top: `${coords.y / 5}%` }}
                      >
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                        </span>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-5 hidden group-hover:block bg-slate-950 border border-slate-800 text-[10px] px-2 py-1 rounded text-cyan-400 font-mono whitespace-nowrap z-30 shadow-xl">
                          Active Threat Node: {code}
                        </div>
                      </div>
                    );
                  });
                })()}
                
                <div className="absolute bottom-2 left-4 text-[9px] text-slate-500 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Live Geo-Targeting Vector Feed Active
                </div>
              </div>
              
              {/* Map stats legend */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phishing Host Densities</h4>
                <div className="space-y-2">
                  {(() => {
                    const counts = {};
                    (stats.recentGeolocations || []).forEach(g => {
                      counts[g.country_name] = (counts[g.country_name] || 0) + g.count;
                    });
                    liveThreats.forEach(t => {
                      if (t.country_name) {
                        counts[t.country_name] = (counts[t.country_name] || 0) + 1;
                      }
                    });
                    
                    const displayDensities = Object.entries(counts)
                      .sort((a,b) => b[1] - a[1])
                      .slice(0, 3);
                    
                    if (displayDensities.length === 0) {
                      return <div className="text-xs text-slate-500 italic">No geolocation data recorded yet.</div>;
                    }
                    
                    return displayDensities.map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-500/80" />
                          {country}
                        </span>
                        <span className="text-slate-300 font-bold">{count} scan(s)</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* REAL-TIME THREAT LOGS */}
          {liveThreats.length > 0 && (
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-950/5 animate-pulse">
              <h3 className="font-bold text-xs uppercase text-red-400 tracking-wider mb-4 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-ping" />
                Live Incident Detection Feed
              </h3>
              <div className="space-y-3">
                {liveThreats.map((threat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${threat.type === 'URL' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {threat.type}
                      </span>
                      <span className="font-mono text-slate-300 truncate max-w-md">{threat.url || threat.content}</span>
                    </div>
                    <span className="text-[10px] text-red-400 font-semibold">{threat.risk_level} Risk ({threat.risk_score}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              onClick={() => navigate('/url-scanner')}
              className="p-5 rounded-2xl border border-slate-900 bg-slate-900/5 hover:border-cyan-500/20 hover:bg-slate-900/20 transition-all flex items-center gap-4 group cursor-pointer"
            >
              <div className="bg-cyan-500/10 p-3.5 rounded-xl border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200">Scan Suspicious URL</h4>
                <p className="text-xs text-slate-500 mt-1">Submit links for real-time safety inspection against reputation feeds</p>
              </div>
            </div>

            <div
              onClick={() => navigate('/scanner/email')}
              className="p-5 rounded-2xl border border-slate-900 bg-slate-900/5 hover:border-blue-500/20 hover:bg-slate-900/20 transition-all flex items-center gap-4 group cursor-pointer"
            >
              <div className="bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200">Analyze Email Content</h4>
                <p className="text-xs text-slate-500 mt-1">Audit email text bodies against credential theft triggers and panic markers</p>
              </div>
            </div>
          </div>

          {/* SECURITY WARNING */}
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-500 mb-4">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  Recent Threat Advisory
                </h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                We've observed a substantial surge in text message and email phishing scams masquerading as delivery service companies (e.g. USPS, FedEx, UPS) prompting immediate tracking link verification. Always audit the root domain before clicking. Official domains will always end with <span className="font-mono text-cyan-400">.gov</span> or <span className="font-mono text-cyan-400">.com</span> without excessive hyphenation or look-alike subdomains.
              </p>
            </div>
            <div className="mt-6 border-t border-slate-900/80 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Security Database Engine Version: 1.4.0</span>
              <span className="text-cyan-400 font-semibold hover:underline cursor-pointer">Security Feed</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


