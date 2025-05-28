import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../Auth.css'; 

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await axios.post(`${API_BASE_URL}/api/auth/register`, { username, password });
            setMessage('Registration successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError('Registration failed. Username might be taken.');
            setLoading(false);
        }
    };

    return (
        <div className="auth-background">
            <div className="auth-container">
                <h2>Create Your Account</h2>
                <form onSubmit={handleRegister} className="auth-form">
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Username"
                        className="auth-input"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password (min. 6 characters)"
                        className="auth-input"
                        required
                    />
                    {error && <p className="auth-error">{error}</p>}
                    {message && <p style={{color: 'green'}}>{message}</p>}
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <p className="auth-toggle-link">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;