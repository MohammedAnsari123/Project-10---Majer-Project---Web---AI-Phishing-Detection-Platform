import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  RefreshCw,
  Download,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Activity,
  ChevronDown,
  ChevronUp,
  Globe,
  Mail,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [expandedReportId, setExpandedReportId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchReports();
  }, [navigate, selectedRisk, selectedType, selectedDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Map filters to backend API query params (Day 20 Python engine)
      const res = await API.get('/reports', {
        params: {
          search: searchTerm || undefined,
          risk: selectedRisk !== 'ALL' ? selectedRisk : undefined,
          type: selectedType !== 'ALL' ? selectedType : undefined,
          date: selectedDate !== 'ALL' ? selectedDate : undefined
        }
      });
      if (res.data && res.data.success) {
        setReports(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    if (expandedReportId === id) {
      setExpandedReportId(null);
    } else {
      setExpandedReportId(id);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchReports();
    }
  };

  const totalReportsCount = reports.length;
  const highRiskCount = reports.filter((r) => {
    const rLvl = r.details?.risk_level || 'LOW';
    return rLvl === 'HIGH';
  }).length;
  const mediumRiskCount = reports.filter((r) => {
    const rLvl = r.details?.risk_level || 'LOW';
    return rLvl === 'MEDIUM';
  }).length;
  const safeCount = reports.filter((r) => {
    const rLvl = r.details?.risk_level || 'LOW';
    return rLvl === 'LOW';
  }).length;

  const handleExport = () => {
    const headers = ['Report ID,Type,User,Risk Level,Date,Summary'];
    const rows = reports.map((item) => {
      const type = item.report_type;
      const email = item.user_email || 'guest';
      const risk = item.details?.risk_level || 'LOW';
      const date = new Date(item.created_at).toLocaleString();
      const summary = type === 'URL' 
        ? (item.details?.status || 'Scanned URL') 
        : `Email containing ${item.details?.detected_keywords?.length || 0} indicators`;
      return `"${item.id}","${type}","${email}","${risk}","${date}","${summary.replace(/"/g, '""')}"`;
    });
    const csvContent = [...headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinelscan_security_reports_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-cyan-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64">
        {/* Header */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Threat Intelligence Hub</h1>
            <p className="text-xs text-slate-400">
              Detailed security reports and diagnostics logs
            </p>
          </div>
          <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-semibold text-cyan-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            System Secured
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 space-y-8 max-w-6xl w-full mx-auto">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold tracking-tight">Threat Reports</h2>
              </div>
              <p className="text-sm text-slate-400">
                Detailed diagnostic intelligence reports for every scan request.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchReports}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:text-cyan-400 transition-all text-slate-400 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <p className="text-xs uppercase text-slate-500 font-bold">Total Reports</p>
              </div>
              <h2 className="text-3xl font-extrabold text-cyan-400">{totalReportsCount}</h2>
            </div>

            <div className="p-5 rounded-2xl border border-red-500/10 bg-red-500/5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldX className="w-4 h-4 text-red-400" />
                <p className="text-xs uppercase text-slate-500 font-bold">High Risk Threat</p>
              </div>
              <h2 className="text-3xl font-extrabold text-red-400">{highRiskCount}</h2>
            </div>

            <div className="p-5 rounded-2xl border border-amber-500/10 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <p className="text-xs uppercase text-slate-500 font-bold">Suspicious</p>
              </div>
              <h2 className="text-3xl font-extrabold text-amber-400">{mediumRiskCount}</h2>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <p className="text-xs uppercase text-slate-500 font-bold">Safe Scans</p>
              </div>
              <h2 className="text-3xl font-extrabold text-emerald-400">{safeCount}</h2>
            </div>
          </div>

          {/* Search + Filter Panel */}
          <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Bar */}
              <div className="relative md:col-span-2">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  placeholder="Search keywords, domains, reasons..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                />
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-cyan-500 outline-none transition-all cursor-pointer"
              >
                <option value="ALL">All Scan Types</option>
                <option value="URL">URLs Only</option>
                <option value="EMAIL">Emails Only</option>
              </select>

              {/* Date Filter */}
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-cyan-500 outline-none transition-all cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="7DAYS">Last 7 Days</option>
                <option value="30DAYS">Last 30 Days</option>
              </select>
            </div>

            {/* Risk Selection Row */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Severity Filter:</span>
              <div className="flex bg-slate-950 border border-slate-800/80 p-1 rounded-xl w-64">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
                  <button
                    key={risk}
                    onClick={() => setSelectedRisk(risk)}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg uppercase transition-all cursor-pointer ${
                      selectedRisk === risk
                        ? 'bg-slate-850 text-cyan-400 shadow-sm border border-slate-800'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <span className="text-sm text-slate-500 animate-pulse">
                Analyzing and loading reports...
              </span>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-900 bg-slate-900/10">
              <p className="text-sm text-slate-500">No threat intelligence reports match your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const details = report.details || {};
                const isExpanded = expandedReportId === report.id;
                const riskLevel = details.risk_level || 'LOW';
                
                return (
                  <div 
                    key={report.id}
                    className={`rounded-2xl border transition-all ${
                      isExpanded 
                        ? 'border-slate-800 bg-slate-900/20' 
                        : 'border-slate-900 bg-slate-900/5 hover:border-slate-800 hover:bg-slate-900/10'
                    }`}
                  >
                    {/* Collapsed Header Summary */}
                    <div 
                      onClick={() => toggleExpand(report.id)}
                      className="p-5 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-2.5 rounded-xl border ${
                          report.report_type === 'URL' 
                            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {report.report_type === 'URL' ? <Globe className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              {report.report_type} Scan Report
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">
                              #{report.id.slice(0, 8)}
                            </span>
                          </div>
                          
                          <p className="text-xs font-mono text-slate-300 truncate mt-1 max-w-sm md:max-w-xl">
                            {report.report_type === 'URL' 
                              ? (details.status || 'URL Scan results') 
                              : (details.preview || 'Email analysis findings')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${
                          riskLevel === 'HIGH'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {riskLevel}
                        </span>
                        
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium justify-end">
                            <Calendar className="w-3 h-3" />
                            {new Date(report.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-[9px] text-slate-600 font-mono mt-0.5">
                            {new Date(report.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>

                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="px-5 pb-6 border-t border-slate-900/60 pt-5 space-y-6 animate-fadeIn">
                        {/* Report Header Metadata */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-900 pb-4 text-xs">
                          <div>
                            <span className="text-slate-500 block">Scan Type:</span>
                            <span className="font-semibold text-slate-300">{report.report_type} Scanner</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Scan Date / Time:</span>
                            <span className="font-semibold text-slate-300">{new Date(report.created_at).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Scanned User Email:</span>
                            <span className="font-semibold text-slate-300 truncate block">{report.user_email || 'Guest Operator'}</span>
                          </div>
                        </div>

                        {/* Risk Summary Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Risk Score</span>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-2xl font-extrabold ${
                                riskLevel === 'HIGH' ? 'text-red-400' : riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                              }`}>{details.risk_score || 0}%</span>
                              <span className="text-[10px] text-slate-500">Threat Match</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Risk Level</span>
                            <span className={`text-xl font-extrabold tracking-tight block ${
                              riskLevel === 'HIGH' ? 'text-red-400' : riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>{riskLevel} SEVERITY</span>
                          </div>

                          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status Flags</span>
                            <span className="text-sm font-bold text-slate-300 block truncate">{details.status || 'Report Logged'}</span>
                          </div>
                        </div>

                        {/* Findings Details Section */}
                        <div className="space-y-4">
                          <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Findings & Evidence</h4>
                          
                          {report.report_type === 'URL' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              {/* VirusTotal Findings */}
                              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 space-y-2">
                                <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">VirusTotal Engine</span>
                                <p className="text-slate-300 font-semibold">
                                  {details.virusTotalStats?.malicious ? (
                                    <span className="text-red-400 flex items-center gap-1.5">
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                      Flagged by {details.virusTotalStats.malicious} antivirus vendor(s)
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400 flex items-center gap-1.5">
                                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                      Antivirus engines flagged as Clean
                                    </span>
                                  )}
                                </p>
                              </div>
                              
                              {/* Google Safe Browsing Findings */}
                              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 space-y-2">
                                <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">Google Safe Browsing</span>
                                <p className="text-slate-300 font-semibold">
                                  {details.googleSafeBrowsingStats?.flagged ? (
                                    <span className="text-red-400 flex items-center gap-1.5">
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                      Flagged as {details.googleSafeBrowsingStats.threatType || 'Dangerous site'}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400 flex items-center gap-1.5">
                                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                      Safe Browsing flagged as Clean
                                    </span>
                                  )}
                                </p>
                              </div>

                              {/* Heuristics reasons */}
                              {details.reasons && details.reasons.length > 0 && (
                                <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 col-span-1 sm:col-span-2 space-y-2">
                                  <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">Heuristic Detection Rules Triggered</span>
                                  <ul className="list-disc ml-4 space-y-1.5 text-slate-300 font-mono text-[11px]">
                                    {details.reasons.map((reason, rIdx) => (
                                      <li key={rIdx}>{reason}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4 text-xs">
                              {/* Pasted Preview */}
                              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 space-y-2">
                                <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">Email Text Preview</span>
                                <p className="text-slate-400 font-mono leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-900/60 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                  {details.preview || 'No email snippet stored.'}
                                </p>
                              </div>

                              {/* Keyword flags */}
                              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 space-y-2">
                                <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">Pasted Phishing Keywords Match</span>
                                {details.detected_keywords && details.detected_keywords.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {details.detected_keywords.map((kw, kwIdx) => (
                                      <span key={kwIdx} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400 font-semibold">
                                        {kw}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-500 font-semibold">No phishing keywords matched.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Recommendation */}
                        <div className={`p-4 rounded-xl border flex gap-3 ${
                          riskLevel === 'HIGH'
                            ? 'bg-red-950/15 border-red-500/20 text-slate-300'
                            : riskLevel === 'MEDIUM'
                              ? 'bg-amber-950/15 border-amber-500/20 text-slate-300'
                              : 'bg-emerald-950/15 border-emerald-500/20 text-slate-300'
                        }`}>
                          <div className={`p-1.5 rounded-lg ${
                            riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-400' : riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {riskLevel === 'HIGH' ? <ShieldX className="w-5 h-5" /> : riskLevel === 'MEDIUM' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-slate-200">Recommended Security Guardrail</h5>
                            <p className="text-[11px] mt-1 leading-relaxed">{details.recommendation || 'No custom recommendation generated for this log.'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}