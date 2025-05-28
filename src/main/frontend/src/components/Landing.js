// src/main/frontend/src/components/Landing.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Auth.css'; // Import our new styles

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-background">
      <div className="auth-container landing-hero">
        <div className="auth-logo">🚀</div> {/* Simple emoji icon */}
        <h1>InvestTrack Pro</h1>
        <p>
          Take control of your financial future. Track assets, visualize growth, and make smarter investment decisions with precision and style.
        </p>
        <div className="landing-actions">
          <button onClick={() => navigate('/login')} className="auth-button secondary">
            Login
          </button>
          <button onClick={() => navigate('/register')} className="auth-button">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;