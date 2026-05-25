import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Activity, Users, FileText, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'System Overview', icon: Activity },
    { path: '/users', label: 'User Accounts', icon: Users, disabled: true },
    { path: '/logs', label: 'Scan Logs', icon: FileText, disabled: true },
    { path: '/keywords', label: 'Keyword Config', icon: Settings, disabled: true }
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 border-r border-slate-900 bg-slate-950/60 backdrop-blur-md hidden md:flex flex-col z-30">
      <div className="p-6 border-b border-slate-900 flex items-center gap-2">
        <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
        <span className="font-bold tracking-tight bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
          SentinelAdmin
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) {
                  alert(`${item.label} coming soon!`);
                } else {
                  navigate(item.path);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

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
  );
};

export default Sidebar;
