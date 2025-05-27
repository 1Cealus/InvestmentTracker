import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';

function App() {
  const [investments, setInvestments] = useState([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    averageAmount: 0,
    totalCount: 0,
    latestDate: null
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    name: ''
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvestments();
    fetchStats();
  }, []);

  const fetchInvestments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/investments`);
      setInvestments(response.data);
    } catch (error) {
      console.error('Error fetching investments:', error);
      showStatus('Error loading investments', 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/investments/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const investmentData = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        name: formData.name.trim()
      };

      await axios.post(`${API_BASE_URL}/api/investments`, investmentData);
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        name: ''
      });

      // Refresh data
      await fetchInvestments();
      await fetchStats();
      
      showStatus('Investment added successfully! 🎉', 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error adding investment';
      showStatus(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all investment data? This cannot be undone.')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/investments`);
        await fetchInvestments();
        await fetchStats();
        showStatus('All data cleared', 'info');
      } catch (error) {
        showStatus('Error clearing data', 'error');
      }
    }
  };

  const exportData = () => {
    if (investments.length === 0) {
      showStatus('No data to export', 'error');
      return;
    }

    const csvContent = [
      ['Date', 'Amount', 'Name', 'Timestamp'],
      ...investments.map(inv => [inv.date, inv.amount, inv.name, inv.timestamp])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showStatus('Data exported successfully! 📁', 'success');
  };

  const showStatus = (message, type = 'info') => {
    setStatusMessage({ text: message, type });
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>💰 Investment Tracker Pro</h1>
          <p>Track your investments with style and precision</p>
        </div>

        <div className="main-content">
          <div className="total-display">
            <h3>Total Portfolio Value</h3>
            <div className="total-amount">{formatCurrency(stats.totalAmount)}</div>
          </div>

          <div className="dashboard">
            <div className="card">
              <h2><span className="icon">+</span>Add Investment</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="amount">Amount ($)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Investment Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Apple Stock, Bitcoin"
                    required
                  />
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  <span>💾</span> {loading ? 'Adding...' : 'Add Investment'}
                </button>
              </form>
            </div>

            <div className="card">
              <h2><span className="icon">📊</span>Quick Stats</h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666' }}>Total Investments:</span>
                  <span style={{ fontWeight: '700', color: '#4facfe' }}>{stats.totalCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666' }}>Latest Investment:</span>
                  <span style={{ fontWeight: '600' }}>{formatDate(stats.latestDate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666' }}>Average Amount:</span>
                  <span style={{ fontWeight: '700', color: '#11998e' }}>{formatCurrency(stats.averageAmount)}</span>
                </div>
                <button type="button" className="btn btn-secondary" onClick={exportData}>
                  <span>📥</span> Export Data
                </button>
              </div>
            </div>
          </div>

          <div className="investments-section">
            <div className="investments-header">
              <h2><span className="icon">📈</span>Investment History</h2>
              <button type="button" className="btn btn-secondary" onClick={clearAllData}>
                <span>🗑️</span> Clear All
              </button>
            </div>
            <div className="investments-list">
              {investments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <h3>No investments yet</h3>
                  <p>Start by adding your first investment above!</p>
                </div>
              ) : (
                investments.map((investment, index) => (
                  <div key={investment.id} className="investment-item animate-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="investment-date">{formatDate(investment.date)}</div>
                    <div className="investment-name">{investment.name}</div>
                    <div className="investment-amount">{formatCurrency(investment.amount)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`status-bar show ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}
    </div>
  );
}

export default App;