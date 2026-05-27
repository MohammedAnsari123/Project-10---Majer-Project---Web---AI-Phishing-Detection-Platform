import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { Mail } from "lucide-react";

export default function EmailAnalyzer() {
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeEmail = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/email-analyzer",
        {
          content
        }
      );

      setResult(response.data);
    } catch (error) {
      console.error(error);

      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-cyan-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64">
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold"> Email Phishing Analyzer</h1>
            <p className="text-xs text-slate-400">Scan Suspicious Emails for Phishing Indicators</p>
          </div>
          <div className="bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-xs font-semibold text-cyan-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> System Secured
          </div>
        </header>
        <main className="flex-1 p-8 space-y-8 max-w-4xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold tracking-tight">Email Phishing Analyzer</h2>
          </div>
          <p className="text-sm text-slate-400">
            Paste suspicious email content here to analyze for phishing indicators.
          </p>

          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
            <textarea
              rows="10"
              placeholder="Paste suspicious email content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"

            />

            <button
              onClick={analyzeEmail}
              disabled={loading}
              className={`mt-4 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-2 cursor-pointer ${loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:scale-[1.02]'
                }`}
            >
              {loading ? "Analyzing..." : "Analyze Email"}
            </button>
          </div>
          {result && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-3">
                Analysis Result
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Risk Level
                  </span>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className={`text-xs font-semibold inline-block py-1 px-2 rounded-full uppercase ${result.riskLevel === 'HIGH'
                            ? 'text-red-400 bg-red-400/10'
                            : result.riskLevel === 'MEDIUM'
                              ? 'text-amber-400 bg-amber-400/10'
                              : 'text-emerald-400 bg-emerald-400/10'
                          }`}>
                          {result.riskLevel}% Match
                        </span>
                      </div>
                    </div>
                    {/* <div className="overflow-hidden h-2.5 text-xs flex rounded bg-slate-800">
                      <div
                        style={{ width: `${result.riskLevel}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${result.riskLevel === 'HIGH'
                            ? 'bg-red-500'
                            : result.riskLevel === 'MEDIUM'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                      />
                    </div> */}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 block"></span>
                </div>

                <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Risk Score
                  </span>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className={`text-xs font-semibold inline-block py-1 px-2 rounded-full uppercase ${result.riskLevel === 'HIGH'
                            ? 'text-red-400 bg-red-400/10'
                            : result.riskScore === 'MEDIUM'
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
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${result.riskLevel === 'HIGH'
                            ? 'bg-red-500'
                            : result.riskScore === 'MEDIUM'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 block"></span>
                </div>
              </div>
              
              {/* <p>
                <strong>Risk Level:</strong> {result.riskLevel}
              </p>

              <p>
                <strong>Risk Score:</strong> {result.riskScore}%
              </p> */}

              <p>
                <strong>Message:</strong> {result.message}
              </p>

              <div className="mt-3">
                <strong>Matched Keywords:</strong>

                <ul className="list-disc ml-6 mt-2">
                  {result.matchedKeywords.map((keyword, index) => (
                    <li key={index}>{keyword}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}