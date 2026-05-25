import { useEffect, useState } from 'react';

export default function ScanHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/scan-history');
      const data = await res.json();

      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.log('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">

      <h1 className="text-3xl font-bold mb-6">
        Scan History
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : history.length === 0 ? (
        <p>No scan history found in Supabase.</p>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="p-4 bg-slate-900 rounded-lg border border-slate-800">

              <p><strong>Type:</strong> {item.scan_type}</p>
              <p><strong>Content:</strong> {item.content}</p>
              <p><strong>Result:</strong> {item.result}</p>
              <p><strong>Risk:</strong> {item.risk_level}</p>
              <p><strong>Score:</strong> {item.risk_score}</p>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}