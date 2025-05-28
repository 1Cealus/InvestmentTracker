// src/main/frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './components/Landing'; // Import the new landing page
import './App.css'; // Main app styles (for dashboard etc.)
// Auth.css is imported directly by Landing, Login, Register components

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} /> {/* Default to Landing page */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* ProtectedRoute handles redirection if not authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        
        {/* Optional: A catch-all to redirect any unknown paths to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
