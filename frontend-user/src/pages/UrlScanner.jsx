import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function UrlScanner() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/api/scan-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          userEmail: localStorage.getItem('userEmail') || 'guest@example.com'
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        alert(data.message || 'Scan failed');
      }

    } catch (error) {
      console.log(error);
      alert('Server error');
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
            Paste a link below to analyze its structure, protocol, length, and keyword safety.
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
              {loading ? 'Analyzing URL Structure...' : 'Scan URL'}
            </button>
          </div>

          {result && (
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="font-bold text-base">Analysis Report</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  result.riskLevel === 'HIGH'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : result.riskLevel === 'MEDIUM'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {result.riskLevel} RISK
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block mb-1">DETECTION STATUS</span>
                  <span className="font-medium text-slate-100">{result.result}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-1">RISK RATING</span>
                  <span className="font-medium text-cyan-400">{result.riskScore}% Match Score</span>
                </div>
              </div>

              <div className="border-t border-slate-900/60 pt-4">
                <h4 className="font-bold text-sm text-slate-300 mb-2">Detection Findings</h4>
                {result.reasons && result.reasons.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-slate-400 space-y-1.5">
                    {result.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">No red flags identified in this URL structure.</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}