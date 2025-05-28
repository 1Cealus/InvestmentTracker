// src/main/frontend/src/components/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // Keep axios for direct auth calls if not using global interceptor here
import '../Auth.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Using direct axios call for login
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password });
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid username or password.');
            setLoading(false);
        }
        // setLoading(false) should be in a finally block if you want it to always run
        // but here, we only stop loading on error, success navigates away.
    };

    return (
        <div className="auth-background">
            <div className="auth-container">
                <div className="auth-logo">🔑</div>
                <h2>Welcome Back!</h2>
                <p style={{color: '#4a5568', marginTop: '-20px', marginBottom: '30px', fontSize: '0.95rem'}}>
                    Login to access your investment dashboard.
                </p>
                <form onSubmit={handleLogin} className="auth-form">
                    <div className="auth-input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            className="auth-input"
                            required
                        />
                    </div>
                    <div className="auth-input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="auth-input"
                            required
                        />
                    </div>
                    {error && <p className="auth-error">{error}</p>}
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                </form>
                <p className="auth-toggle-link">
                  Don't have an account? <Link to="/register">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;