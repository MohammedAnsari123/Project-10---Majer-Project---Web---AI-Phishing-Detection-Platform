import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/UsersList';
import DetectionLogs from './pages/DetectionLogs';
import Keywords from './pages/Keywords';
import BlacklistWhitelist from './pages/BlacklistWhitelist';
import SecurityCenter from './pages/SecurityCenter';

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Dashboard Protected Route */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/logs" element={<DetectionLogs />} />
        <Route path="/keywords" element={<Keywords />} />
        <Route path="/blacklist-whitelist" element={<BlacklistWhitelist />} />
        <Route path="/security-center" element={<SecurityCenter />} />

        {/* Fallback redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
