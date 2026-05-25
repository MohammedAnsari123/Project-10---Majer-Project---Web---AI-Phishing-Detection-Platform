import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UrlScanner from './pages/UrlScanner';
import ScanHistory from './pages/ScanHistory';
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Protected Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Fallback redirect to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/url-scanner" element={<UrlScanner />} />
        <Route path="/scan-history" element={<ScanHistory />} />
      </Routes>
    </Router>
  );
}

export default App;
