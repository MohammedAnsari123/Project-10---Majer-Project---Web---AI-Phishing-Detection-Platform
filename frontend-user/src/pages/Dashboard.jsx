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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 hidden md:flex flex-col">

        <div className="p-6 border-b border-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyan-400" />
          <span className="font-bold">SentinelScan AI</span>
        </div>

        {/* ORDERED MENU */}
        <nav className="flex-1 p-4 space-y-2 flex flex-col">

          <button
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-900"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </button>

          <button
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-900"
            onClick={() => navigate('/url-scanner')}
          >
            Live URL Scanner
          </button>

          <button
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-900"
            onClick={() => navigate('/email-analyzer')}
          >
            Email Analyzer
          </button>

          <button
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-900"
            onClick={() => navigate('/scan-history')}
          >
            Scan History
          </button>

        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-500/10"
          >
            Sign Out
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <header className="border-b border-slate-900 px-8 py-4">
          <h1 className="text-lg font-bold">Threat Intelligence Hub</h1>
          <p className="text-xs text-slate-400">Welcome, {userName}</p>
        </header>

        {/* BODY */}
        <main className="p-8 space-y-8">

          {/* STATS */}
          <div className="grid grid-cols-4 gap-6">

            <div className="p-6 rounded-xl bg-slate-900/30">
              <p>Total Scans</p>
              <h2 className="text-2xl">{scans.total}</h2>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/30">
              <p>Safe</p>
              <h2 className="text-2xl">{scans.safe}</h2>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/30">
              <p>Threats</p>
              <h2 className="text-2xl">{scans.danger}</h2>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/30">
              <p>Emails</p>
              <h2 className="text-2xl">{scans.emails}</h2>
            </div>

          </div>

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-2 gap-6">

            <div
              onClick={() => navigate('/url-scanner')}
              className="p-6 rounded-xl bg-slate-900 cursor-pointer hover:bg-slate-800"
            >
              <Globe className="mb-2" />
              <h3 className="font-bold">Scan URL</h3>
              <p className="text-sm text-slate-400">Detect phishing links</p>
            </div>

            <div
              onClick={() => navigate('/email-analyzer')}
              className="p-6 rounded-xl bg-slate-900 cursor-pointer hover:bg-slate-800"
            >
              <Mail className="mb-2" />
              <h3 className="font-bold">Email Analysis</h3>
              <p className="text-sm text-slate-400">Detect scam emails</p>
            </div>

          </div>

          {/* ALERT */}
          <div className="p-6 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <AlertCircle />
              <h3>Security Alert</h3>
            </div>
            <p className="text-sm mt-2 text-slate-300">
              Delivery scam URLs are increasing. Always verify domains before login.
            </p>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Dashboard;