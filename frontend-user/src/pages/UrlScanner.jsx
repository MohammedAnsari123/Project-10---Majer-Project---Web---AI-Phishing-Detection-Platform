import { useState } from 'react';

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
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-8">URL Phishing Scanner</h1>

      <div className="bg-zinc-900 p-6 rounded-xl max-w-3xl">
        <input
          type="text"
          placeholder="Enter suspicious URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-4 rounded-lg bg-zinc-800 border border-zinc-700"
        />

        <button
          onClick={handleScan}
          disabled={loading}
          className={`mt-4 px-6 py-3 rounded-lg ${
            loading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Scanning...' : 'Scan URL'}
        </button>
      </div>

      {result && (
        <div className="bg-zinc-900 p-6 rounded-xl max-w-3xl mt-8">
          <h2 className="text-2xl font-bold mb-4">Scan Result</h2>

          <p><strong>Result:</strong> {result.result}</p>
          <p><strong>Risk Level:</strong> {result.riskLevel}</p>
          <p><strong>Risk Score:</strong> {result.riskScore}%</p>

          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Detection Reasons</h3>
            <ul className="list-disc pl-6">
              {result.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}