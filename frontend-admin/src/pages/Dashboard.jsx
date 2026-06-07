import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, UserMinus, FileText, RefreshCw, BarChart2, Shield, Radio, Globe } from 'lucide-react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
import { io } from 'socket.io-client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [loading, setLoading] = useState(true);
  const [liveThreats, setLiveThreats] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalScans: 0,
    highRiskScans: 0,
    emailScans: 0,
    urlScans: 0,
    detectionRate: '0%'
  });
  const [recentActivity, setRecentActivity] = useState({
    users: [],
    urlScans: [],
    emailScans: [],
    reports: []
  });
  
  const [chartData, setChartData] = useState([]);
  const [threatDistribution, setThreatDistribution] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const name = localStorage.getItem('adminName');
    if (name) {
      setAdminName(name);
    }

    fetchDashboardStats();

    // WebSockets integration for admin logs stream
    const socket = io('http://localhost:5000');

    socket.on('newThreat', (threat) => {
      console.log('Real-time scan event captured by Admin:', threat);
      setLiveThreats((prev) => [threat, ...prev].slice(0, 5));
      fetchDashboardStats();
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/dashboard');
      if (response.data && response.data.success) {
        const { stats: fetchedStats, recentActivity: fetchedActivity } = response.data.data;
        setStats(fetchedStats);
        setRecentActivity(fetchedActivity);
      }
      
      const analyticsResponse = await API.get('/analytics');
      if (analyticsResponse.data && analyticsResponse.data.success) {
        setChartData(analyticsResponse.data.data.chartData || []);
        setThreatDistribution(analyticsResponse.data.data.threatDistribution || []);
      }
    } catch (error) {
      console.error('Error fetching admin dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compile recent threats across URL & Email
  const recentThreats = [];
  recentActivity.urlScans.forEach(item => {
    if (item.risk_level === 'HIGH' || item.risk_level === 'MEDIUM') {
      recentThreats.push({
        id: item.id,
        type: 'URL',
        content: item.content,
        risk_level: item.risk_level,
        created_at: item.created_at
      });
    }
  });
  recentActivity.emailScans.forEach(item => {
    if (item.risk_level === 'HIGH' || item.risk_level === 'MEDIUM') {
      recentThreats.push({
        id: item.id,
        type: 'EMAIL',
        content: item.content.length > 60 ? item.content.substring(0, 60) + '...' : item.content,
        risk_level: item.risk_level,
        created_at: item.created_at
      });
    }
  });
  const sortedRecentThreats = recentThreats.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-red-500 selection:text-slate-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Header */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">System Administration</h1>
            <p className="text-xs text-slate-400">Security Operator: {adminName}</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchDashboardStats}
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
            <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-semibold text-red-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Live Audit Active
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Total Registrations
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{stats.totalUsers}</span>
                <span className="text-xs text-slate-500">Active accounts</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                System Scan Queries
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-cyan-400">{stats.totalScans}</span>
                <span className="text-xs text-cyan-500">URLs & Emails</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Average Threat Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-500">{stats.detectionRate}</span>
                <span className="text-xs text-amber-500/80">Positives flagged</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Critical Attacks Flagged
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-red-500">{stats.highRiskScans}</span>
                <span className="text-xs text-red-500/80">Urgent risks blocked</span>
              </div>
            </div>
          </div>

          {/* VISUAL CHARTS (Day 19 Analytics) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Daily Scans Area Chart */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  Automated Security Scan Logs (Last 14 Days)
                </h3>
                <p className="text-xs text-slate-500 mb-6">Total audit query volume compiled by analytics engine</p>
              </div>

              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-600 text-xs">
                  No scan analytics recorded yet.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAdminScans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} labelClassName="text-slate-400 text-xs" />
                      <Area type="monotone" dataKey="scans" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAdminScans)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Severity Distribution Pie Chart */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Severity Distribution
                </h3>
                <p className="text-xs text-slate-500 mb-6">Proportion of scan logs classification levels</p>
              </div>

              {stats.totalScans === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-600 text-xs">
                  No scan distributions mapped.
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-56">
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={threatDistribution.filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {threatDistribution.map((entry, index) => {
                          const colors = {
                            "Safe (Low)": "#10b981",
                            "Suspicious (Medium)": "#f59e0b",
                            "Dangerous (High)": "#ef4444"
                          };
                          const col = colors[entry.name] || "#3b82f6";
                          return <Cell key={`cell-${index}`} fill={col} />;
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend list */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] w-full pt-4 border-t border-slate-900">
                    {threatDistribution.map((item, idx) => (
                      <div key={idx} className="text-center">
                        <span className={`block font-bold ${
                          item.name.includes('Safe') ? 'text-emerald-400' : item.name.includes('Suspicious') ? 'text-amber-500' : 'text-red-500'
                        }`}>{item.value}</span>
                        <span className="text-slate-500 truncate block">{item.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GEOLOCATION THREAT MAP */}
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm animate-fadeIn">
            <div>
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-red-500" />
                Operator Threat Geolocation Matrix
              </h3>
              <p className="text-xs text-slate-500 mb-6">Visualizing real-time and historical threat coordinates</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Map visualization */}
              <div className="md:col-span-2 relative h-48 bg-slate-950/40 rounded-xl border border-slate-900/80 flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full opacity-20 pointer-events-none" viewBox="0 0 1000 500">
                  <path d="M50,250 H950 M500,50 V450" stroke="#ef4444" strokeWidth="1" strokeDasharray="5,5" />
                  <circle cx="500" cy="250" r="100" stroke="#ef4444" strokeWidth="0.5" fill="none" strokeDasharray="3,3" />
                  <circle cx="500" cy="250" r="200" stroke="#ef4444" strokeWidth="0.5" fill="none" strokeDasharray="3,3" />
                  
                  {/* North America */}
                  <path d="M150,120 Q180,110 210,130 T250,150 T200,200 Z" fill="#ef4444" />
                  {/* South America */}
                  <path d="M220,250 Q240,280 260,350 T280,420 T230,300 Z" fill="#ef4444" />
                  {/* Eurasia */}
                  <path d="M450,100 Q650,80 800,120 T900,180 T750,250 T500,200 Z" fill="#ef4444" />
                  {/* Africa */}
                  <path d="M480,220 Q540,240 560,300 T580,380 T500,320 Z" fill="#ef4444" />
                  {/* Australia */}
                  <circle cx="800" cy="350" r="35" fill="#ef4444" />
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
                    ...(recentActivity?.urlScans || []).map(t => t.country_code)
                  ].filter(Boolean)));
                  
                  const displayCountries = activeCountryCodes.length > 0 ? activeCountryCodes : ['US', 'NL', 'DE'];
                  
                  return displayCountries.map(code => {
                    const coords = countryCoordinates[code] || countryCoordinates['US'];
                    return (
                      <div 
                        key={code}
                        className="absolute pointer-events-auto group cursor-help"
                        style={{ left: `${coords.x / 10}%`, top: `${coords.y / 5}%` }}
                      >
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-5 hidden group-hover:block bg-slate-950 border border-slate-800 text-[10px] px-2 py-1 rounded text-red-400 font-mono whitespace-nowrap z-30 shadow-xl">
                          Active Incident node: {code}
                        </div>
                      </div>
                    );
                  });
                })()}
                
                <div className="absolute bottom-2 left-4 text-[9px] text-slate-500 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Live Geo-Targeting Vector Feed Active
                </div>
              </div>
              
              {/* Map stats legend */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phishing Host Densities</h4>
                <div className="space-y-2">
                  {(() => {
                    const counts = {};
                    [...liveThreats, ...(recentActivity?.urlScans || [])].forEach(t => {
                      if (t.country_name) {
                        counts[t.country_name] = (counts[t.country_name] || 0) + 1;
                      }
                    });
                    
                    const sorted = Object.entries(counts)
                      .sort((a,b) => b[1] - a[1])
                      .slice(0, 3);
                      
                    const displayDensities = sorted.length > 0 ? sorted : [
                      ['United States', 6],
                      ['Netherlands', 3],
                      ['Germany', 2]
                    ];
                    
                    return displayDensities.map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500/80" />
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

          {/* REAL-TIME THREAT LOGS (Socket Stream) */}
          {liveThreats.length > 0 && (
            <div className="p-6 rounded-2xl border border-red-500/25 bg-red-950/5 animate-fadeIn">
              <h3 className="font-bold text-xs uppercase text-red-400 tracking-wider mb-4 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-ping" />
                Live Incident Scan Activity
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

          {/* Logs + Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 lg:col-span-2">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Recent Security Flags
              </h3>

              <div className="space-y-3">
                {sortedRecentThreats.length === 0 ? (
                  <p className="text-xs text-slate-500 p-3">No suspicious or high-risk threats detected recently.</p>
                ) : (
                  sortedRecentThreats.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                          item.type === 'URL' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {item.type}
                        </span>
                        <span className="truncate font-mono max-w-xs md:max-w-md">{item.content}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                        item.risk_level === 'HIGH' 
                          ? 'text-red-400 bg-red-950/20 border border-red-500/10'
                          : 'text-amber-400 bg-amber-950/20 border border-amber-500/10'
                      }`}>
                        {item.risk_level}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 lg:col-span-1 space-y-4">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2">
                Operator Controls
              </h3>

              <button
                onClick={() => navigate('/users')}
                className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-red-500/30 hover:bg-slate-900/20 transition-all flex items-center gap-4 group cursor-pointer text-left"
              >
                <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-200">
                    Review User Accounts
                  </h4>
                  <p className="text-xs text-slate-500">
                    Suspend offending accounts
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate('/logs')}
                className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-cyan-500/30 hover:bg-slate-900/20 transition-all flex items-center gap-4 group cursor-pointer text-left"
              >
                <div className="bg-cyan-500/10 p-2.5 rounded-lg border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-200">
                    Review Scan Logs
                  </h4>
                  <p className="text-xs text-slate-500">
                    Audit system scan activity
                  </p>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;