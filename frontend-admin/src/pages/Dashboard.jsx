import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, UserMinus, FileText, RefreshCw, BarChart2, Shield } from 'lucide-react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [loading, setLoading] = useState(true);
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
  
  // Custom mock analytics data computed for charts (Day 19 Python engine backend)
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
      
      // Also fetch analytics from python proxy for visual charting
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

  // Find max scan count for scaling chart
  const maxScans = chartData.length > 0 
    ? Math.max(...chartData.map(d => d.scans), 1) 
    : 1;

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
            {/* Daily Scans Bar Chart */}
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
                <div className="flex items-end justify-between h-48 pt-4 pb-2 border-b border-slate-900 gap-1.5 overflow-x-auto">
                  {chartData.map((day, idx) => {
                    const pct = (day.scans / maxScans) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group cursor-default min-w-[20px]">
                        {/* Tooltip */}
                        <div className="absolute mb-24 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-800 text-[10px] px-2 py-1 rounded shadow-lg text-slate-200 pointer-events-none z-10 whitespace-nowrap">
                          <div>Date: {day.date}</div>
                          <div className="text-cyan-400">Total Scans: {day.scans}</div>
                          <div className="text-emerald-400">URLs: {day.urls}</div>
                          <div className="text-blue-400">Emails: {day.emails}</div>
                        </div>

                        {/* Visual Stack */}
                        <div className="w-full flex flex-col-reverse justify-start rounded-t-md overflow-hidden bg-slate-900 transition-all duration-300 group-hover:bg-slate-850" style={{ height: `${Math.max(pct, 5)}%` }}>
                          <div className="bg-cyan-500 w-full" style={{ height: `${day.urls > 0 ? (day.urls / (day.scans || 1)) * 100 : 0}%` }} />
                          <div className="bg-red-500 w-full" style={{ height: `${day.emails > 0 ? (day.emails / (day.scans || 1)) * 100 : 0}%` }} />
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

            {/* Classification Pie representation */}
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
                <div className="space-y-4">
                  {/* Custom progress segment */}
                  <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(stats.urlScans - stats.highRiskScans > 0 ? ((stats.urlScans + stats.emailScans - stats.highRiskScans) / stats.totalScans) * 100 : 70)}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${(stats.highRiskScans / (stats.totalScans || 1)) * 100}%` }} />
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
                    {threatDistribution.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-slate-400">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            item.name.includes('Safe') ? 'bg-emerald-500' : item.name.includes('Suspicious') ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          {item.name}
                        </span>
                        <span className="font-semibold text-slate-200">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

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
                  <UserMinus className="w-5 h-5" />
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