import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  LogOut,
  Globe,
  Mail,
  Clock,
  BarChart3,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('User');
  const [scans] = useState({
    total: 12,
    safe: 8,
    danger: 4,
    emails: 5
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    const name = localStorage.getItem('userName');
    if (name) setUserName(name);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-cyan-500 selection:text-slate-950">

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/60 backdrop-blur-md hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyan-400" />
          <span className="font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            SentinelScan AI
          </span>        
          </div>

        {/* ORDERED MENU */}
        <nav className="flex-1 p-4 space-y-1">
          <button
           className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium text-sm transition-all"
            onClick={() => navigate('/dashboard')}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 font-medium text-sm transition-all"
            onClick={() => navigate('/url-scanner')}
          >
            <Globe className="w-4 h-4" />
            Live URL Scanner
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 font-medium text-sm transition-all"
            onClick={() => navigate('/email-analyzer')}
          >
                        <Mail className="w-4 h-4" />
            Email Analyzer
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 font-medium text-sm transition-all"
            onClick={() => navigate('/scan-history')}
          >
                        <Clock className="w-4 h-4" />
            Scan History
          </button>

        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-900 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all font-medium text-sm cursor-pointer"
          >
                        <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
          <h1 className="text-lg font-bold">Threat Intelligence Hub</h1>
          <p className="text-xs text-slate-400">Welcome, {userName}</p>
          </div>
                    <div className="flex items-center gap-4">
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
                <span className="text-3xl font-extrabold">{scans.total}</span>
                <span className="text-xs text-cyan-400 font-semibold">100% Volume</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Safe Items Verified
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400">{scans.safe}</span>
                <span className="text-xs text-emerald-500/80 font-medium">Clean reputation</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Threats Flagged
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-red-400">{scans.danger}</span>
                <span className="text-xs text-red-500/80 font-medium">Phishing/Scams</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Emails Analyzed
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-blue-400">{scans.emails}</span>
                <span className="text-xs text-blue-500/80 font-medium">Deceptive content</span>
              </div>
            </div>

          </div>

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div
              onClick={() => navigate('/url-scanner')}
              className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 lg:col-span-1 space-y-4"
            >
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2">
                Quick Scanners
              </h3>
               <div className="bg-cyan-500/10 p-2.5 rounded-lg border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Scan Suspicious URL</h4>
                  <p className="text-xs text-slate-500">Analyze links for redirection tricks</p>
                </div>
              <p className="text-sm text-slate-400">Detect phishing links</p>
            </div>

            <div
                onClick={() => alert('Email Analyzer coming soon!')}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950 hover:border-blue-500/30 hover:bg-slate-900/20 cursor-pointer transition-all flex items-center gap-4 group"
              >
              <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
              <div>
                  <h4 className="font-bold text-sm">Analyze Email Content</h4>
                  <p className="text-xs text-slate-500">Detect credential theft urgency triggers</p>
                </div>
            </div>

          </div>

          {/* ALERT */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-500 mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-bold text-sm uppercase tracking-wider">
                    Recent Security Alert
                  </h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  We've noted a rise in delivery invoice scam URLs (e.g. USPS, FedEx delivery failure notices). Always verify the domain name structure before providing any login details.
                </p>
              </div>
              <div className="mt-6 border-t border-slate-900/80 pt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Threat Feed Update: Active</span>
                <span className="text-cyan-400 font-semibold hover:underline cursor-pointer">Read advisory</span>
              </div>
            </div>

        </main>
      </div>
    </div>
  );
};

export default Dashboard;