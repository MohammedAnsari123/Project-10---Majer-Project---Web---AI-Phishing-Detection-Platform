import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UrlScanner from './pages/UrlScanner';
import ScanHistory from './pages/ScanHistory';
import Reports from './pages/Reports';
import EmailAnalyzer from "./pages/EmailAnalyzer";
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* User Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/url-scanner" element={<UrlScanner />} />
        <Route path="/scanner/url" element={<UrlScanner />} />
        <Route path="/history" element={<ScanHistory />} />
        <Route path="/scan-history" element={<ScanHistory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/email-analyzer" element={<EmailAnalyzer />} />
        <Route path="/scanner/email" element={<EmailAnalyzer />} />

        {/* Fallback redirect to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
