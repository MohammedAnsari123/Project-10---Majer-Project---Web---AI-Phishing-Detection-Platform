import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Globe, Mail, AlertTriangle, Shield, CheckCircle, Info, RefreshCw, BarChart2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);
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

  // Find max scan count for scaling custom bar chart
  const maxScans = stats.chartData.length > 0 
    ? Math.max(...stats.chartData.map(d => d.scans), 1) 
    : 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-cyan-500 selection:text-slate-950">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:pl-64">
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
            {/* Daily scan activity custom bar chart */}
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
                <div className="flex items-end justify-between h-48 pt-4 pb-2 border-b border-slate-900 gap-1.5 overflow-x-auto min-w-0">
                  {stats.chartData.map((day, idx) => {
                    const pct = (day.scans / maxScans) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group cursor-default min-w-[20px]">
                        {/* Hover Tooltip */}
                        <div className="absolute mb-24 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-800 text-[10px] px-2 py-1 rounded shadow-lg text-slate-200 pointer-events-none z-10 whitespace-nowrap">
                          <div>Date: {day.date}</div>
                          <div className="text-cyan-400">Total Scans: {day.scans}</div>
                          <div className="text-emerald-400">URLs: {day.urls}</div>
                          <div className="text-blue-400">Emails: {day.emails}</div>
                        </div>

                        {/* Visual Bar Stack */}
                        <div className="w-full flex flex-col-reverse justify-start rounded-t-md overflow-hidden bg-slate-900 transition-all duration-300 group-hover:bg-slate-850" style={{ height: `${Math.max(pct, 5)}%` }}>
                          <div className="bg-cyan-500 w-full" style={{ height: `${day.urls > 0 ? (day.urls / (day.scans || 1)) * 100 : 0}%` }} />
                          <div className="bg-blue-500 w-full" style={{ height: `${day.emails > 0 ? (day.emails / (day.scans || 1)) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[8px] text-slate-600 font-mono mt-2 origin-left rotate-45 whitespace-nowrap group-hover:text-slate-400">
                          {day.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Threat Distribution Pie Chart fallback representation */}
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
                <div className="space-y-4">
                  {/* Custom progress distribution bar */}
                  <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(stats.safeUrls / (stats.totalScans || 1)) * 100}%` }} />
                    <div className="bg-amber-500 h-full" style={{ width: `${((stats.totalScans - stats.safeUrls - stats.highRiskCount) / (stats.totalScans || 1)) * 100}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${(stats.highRiskCount / (stats.totalScans || 1)) * 100}%` }} />
                  </div>

                  {/* Legend list */}
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Safe (Low Risk)
                      </span>
                      <span className="font-semibold text-slate-200">{stats.safeUrls}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Suspicious (Medium Risk)
                      </span>
                      <span className="font-semibold text-slate-200">
                        {stats.totalScans - stats.safeUrls - stats.highRiskCount}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Dangerous (High Risk)
                      </span>
                      <span className="font-semibold text-slate-200">{stats.highRiskCount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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
