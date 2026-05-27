import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Shield, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

export default function UrlScanner() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Authenticated route protection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleScan = async () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await API.post('/scan/url', { url });

      if (response.data && response.data.success) {
        setResult(response.data.data);
      } else {
        alert(response.data.message || 'Scan failed');
      }

    } catch (error) {
      console.error('Scan Request Failed:', error);
      alert(error.response?.data?.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-cyan-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64">
        {/* Header */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Threat Intelligence Hub</h1>
            <p className="text-xs text-slate-400">Scan suspicious URLs for phishing risk</p>
          </div>
          <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-semibold text-cyan-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> System Secured
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 space-y-8 max-w-4xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold tracking-tight">Live URL Scanner</h2>
          </div>
          <p className="text-sm text-slate-400">
            Paste a link below to analyze its safety using combined heuristic audits, Google Safe Browsing, and VirusTotal databases.
          </p>

          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
            <input
              type="text"
              placeholder="e.g. http://secure-paypal-login-free.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
            />

            <button
              onClick={handleScan}
              disabled={loading}
              className={`mt-4 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-2 cursor-pointer ${
                loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:scale-[1.02]'
              }`}
            >
              {loading ? 'Analyzing Cyber Reputation...' : 'Scan URL'}
            </button>
          </div>

          {!result && !loading && (
            <div className="p-12 text-center rounded-2xl border border-slate-900 bg-slate-900/10">
              <Globe className="w-10 h-10 text-slate-800 mx-auto mb-4 animate-pulse" />
              <p className="text-sm text-slate-500 font-medium">Enter a URL to begin scanning.</p>
            </div>
          )}

          {loading && (
            <div className="p-12 text-center rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500">Querying VirusTotal & Google Safe Browsing nodes...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Core metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Risk Score Meter */}
                <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Risk Score
                  </span>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className={`text-xs font-semibold inline-block py-1 px-2 rounded-full uppercase ${
                          result.riskLevel === 'HIGH' 
                            ? 'text-red-400 bg-red-400/10' 
                            : result.riskLevel === 'MEDIUM' 
                            ? 'text-amber-400 bg-amber-400/10' 
                            : 'text-emerald-400 bg-emerald-400/10'
                        }`}>
                          {result.riskScore}% Match
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2.5 text-xs flex rounded bg-slate-800">
                      <div
                        style={{ width: `${result.riskScore}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                          result.riskLevel === 'HIGH' 
                            ? 'bg-red-500' 
                            : result.riskLevel === 'MEDIUM' 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 block">Capped relative composite score</span>
                </div>

                {/* 2. Threat Status Card */}
                <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Threat Status
                  </span>
                  <div className="flex items-center gap-3">
                    {result.riskLevel === 'HIGH' ? (
                      <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
                    ) : result.riskLevel === 'MEDIUM' ? (
                      <AlertTriangle className="w-8 h-8 text-amber-500" />
                    ) : (
                      <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    )}
                    <div>
                      <h4 className={`font-extrabold text-base uppercase ${
                        result.riskLevel === 'HIGH' ? 'text-red-400' : result.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {result.riskLevel} RISK
                      </h4>
                      <p className="text-xs text-slate-400">{result.status}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 block">Global classification</span>
                </div>

                {/* 3. Recommendation Box */}
                <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Recommendation
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{result.recommendation}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {result.riskLevel === 'HIGH' 
                        ? 'Dangerous elements detected. Avoid visiting and do not enter credentials.' 
                        : result.riskLevel === 'MEDIUM' 
                        ? 'Potential threats identified. Proceed carefully.' 
                        : 'No suspicious indicators found. Safe to continue.'}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 block">System advice</span>
                </div>

              </div>

              {/* Security API detections details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Detection Breakdown */}
                <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-300 border-b border-slate-900 pb-2">
                    Security API Detections
                  </h3>
                  <div className="space-y-3 text-xs text-slate-400">
                    <div className="flex justify-between items-center">
                      <span>HTTPS Secure Protocol</span>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${result.checks.https ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {result.checks.https ? 'Valid HTTPS' : 'Missing HTTPS'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Suspicious Keyword Presence</span>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${result.checks.keywords ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {result.checks.keywords ? 'Detected' : 'Clean'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>VirusTotal Threat Intel</span>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${result.checks.virusTotal ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {result.checks.virusTotal 
                          ? `Malicious (${result.virusTotalStats.malicious} vendors)` 
                          : 'Clean / Undetected'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Google Safe Browsing</span>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${result.checks.googleSafeBrowsing ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {result.checks.googleSafeBrowsing 
                          ? `Unsafe (${result.googleSafeBrowsingStats.threatType || 'Social Engineering'})` 
                          : 'Clean'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specific reasons */}
                <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-300 border-b border-slate-900 pb-2">
                    Security Heuristic Details
                  </h3>
                  {result.reasons && result.reasons.length > 0 ? (
                    <ul className="list-disc pl-5 text-xs text-slate-400 space-y-2">
                      {result.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No dangerous heuristic markers detected.</p>
                  )}
                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
