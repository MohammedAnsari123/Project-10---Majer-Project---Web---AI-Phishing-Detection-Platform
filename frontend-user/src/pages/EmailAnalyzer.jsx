import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
import { Mail, ShieldAlert, ShieldCheck, AlertCircle, Info, RefreshCw } from "lucide-react";
import API from '../services/api';

export default function EmailAnalyzer() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const analyzeEmail = async () => {
    if (!content.trim()) {
      alert("Please enter some email content to analyze.");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await API.post("/scan/email", {
        content
      });

      if (response.data && response.data.success) {
        setResult(response.data.data);
      } else {
        alert("Analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Email scan error:", error);
      alert(error.response?.data?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-cyan-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64 pt-14 md:pt-0">
        {/* Header */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Email Phishing Analyzer</h1>
            <p className="text-xs text-slate-400">Scan Suspicious Emails for Phishing Indicators</p>
          </div>
          <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-semibold text-cyan-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> System Secured
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 space-y-8 max-w-4xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold tracking-tight">Email Phishing Analyzer</h2>
          </div>
          <p className="text-sm text-slate-400">
            Paste the full text or suspicious segments of an email below. The platform will analyze it against phishing keywords, urgency cues, banking terminology, and scam signals.
          </p>

          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-4">
            <textarea
              rows="8"
              placeholder="Paste suspicious email content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-y"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={analyzeEmail}
                disabled={loading}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-2 cursor-pointer ${
                  loading
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Content...
                  </>
                ) : (
                  "Analyze Email"
                )}
              </button>
              
              <button 
                onClick={() => setContent("")}
                className="text-xs text-slate-500 hover:text-slate-300 font-semibold px-4 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              >
                Clear Input
              </button>
            </div>
          </div>

          {result && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl font-bold text-slate-200 border-b border-slate-900 pb-2">
                Scan Findings & Diagnostics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Score */}
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Risk Score
                    </span>
                    <span className={`text-xl font-extrabold ${
                      result.riskLevel === 'HIGH' ? 'text-red-400' : result.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {result.riskScore}%
                    </span>
                  </div>
                  
                  <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-800">
                    <div
                      style={{ width: `${result.riskScore}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 rounded-full ${
                        result.riskLevel === 'HIGH'
                          ? 'bg-gradient-to-r from-red-600 to-red-400'
                          : result.riskLevel === 'MEDIUM'
                            ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Risk Level Badge */}
                <div className={`p-6 rounded-2xl border flex items-center justify-between bg-slate-900/20 backdrop-blur-sm ${
                  result.riskLevel === 'HIGH'
                    ? 'border-red-500/20 text-red-400'
                    : result.riskLevel === 'MEDIUM'
                      ? 'border-amber-500/20 text-amber-400'
                      : 'border-emerald-500/20 text-emerald-400'
                }`}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Threat Severity
                    </span>
                    <span className="text-2xl font-extrabold tracking-tight">
                      {result.riskLevel}
                    </span>
                  </div>
                  {result.riskLevel === 'HIGH' ? (
                    <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
                  ) : result.riskLevel === 'MEDIUM' ? (
                    <AlertCircle className="w-10 h-10 text-amber-500" />
                  ) : (
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                  )}
                </div>
              </div>

{/* Threat Type Card */}
<div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-950/10 text-slate-300">
  <div className="flex items-center justify-between mb-3">
    <h4 className="font-bold text-sm text-slate-200">
      Threat Classification
    </h4>

    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">
      {result.threatType || 'Unknown'}
    </span>
  </div>

  <div className="space-y-2">
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">
        Threat Type
      </span>

      <span className="text-purple-400 font-semibold">
        {result.threatType || 'No Known Threat Detected'}
      </span>
    </div>

    <div className="flex justify-between text-xs">
      <span className="text-slate-400">
        Detection Score
      </span>

      <span className="text-slate-200">
        {result.threatScore || 0}
      </span>
    </div>
  </div>

  {result.categoryScores && (
    <div className="mt-4 border-t border-slate-700 pt-3">
      <h5 className="text-xs font-semibold text-slate-300 mb-3">
        Threat Category Breakdown
      </h5>

      {Object.entries(result.categoryScores)
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between text-xs text-slate-400 mb-2"
          >
            <span className="capitalize">
              {key.replaceAll('_', ' ')}
            </span>

            <span className="font-medium text-slate-200">
              {value}
            </span>
          </div>
        ))}
    </div>
  )}
</div>

              {/* Recommendation Card */}
              <div className={`p-5 rounded-2xl border flex gap-4 ${
                result.riskLevel === 'HIGH'
                  ? 'border-red-500/20 bg-red-950/10 text-slate-300'
                  : result.riskLevel === 'MEDIUM'
                    ? 'border-amber-500/20 bg-amber-950/10 text-slate-300'
                    : 'border-emerald-500/20 bg-emerald-950/10 text-slate-300'
              }`}>
                {result.riskLevel === 'HIGH' ? (
                  <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                ) : result.riskLevel === 'MEDIUM' ? (
                  <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-200 mb-1">Recommended Action</h4>
                  <p className="text-xs leading-relaxed">{result.recommendation}</p>
                </div>
              </div>

              {/* Detected Keywords */}
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4">
                <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">
                  Phishing Indicators Detected ({result.detectedKeywords.length})
                </h4>
                
                {result.detectedKeywords.length === 0 ? (
                  <p className="text-xs text-slate-500">No suspicious keywords or banking/urgency flags detected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.detectedKeywords.map((word, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-semibold text-cyan-400 hover:border-cyan-500/30 transition-all"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

