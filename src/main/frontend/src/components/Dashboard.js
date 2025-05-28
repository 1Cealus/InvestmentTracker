import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

const initialFormData = {
  date: new Date().toISOString().split('T')[0],
  name: '',
  category: 'Stocks',
  symbol: '',
  quantity: '',
  purchasePrice: '',
  notes: '',
  amount: '0.00'
};

function Dashboard() {
  const [investments, setInvestments] = useState([]);
  const [stats, setStats] = useState({ totalAmount: 0, averageAmount: 0, totalCount: 0, latestDate: null });
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const categories = ['Stocks', 'Crypto', 'Mutual Funds', 'Bonds', 'Real Estate', 'Other'];

  useEffect(() => {
    fetchInvestments();
    fetchStats();
  }, []);

  useEffect(() => {
    const { quantity, purchasePrice } = formData;
    const q = parseFloat(quantity);
    const p = parseFloat(purchasePrice);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setFormData(prev => ({ ...prev, amount: (q * p).toFixed(4) }));
    } else {
      setFormData(prev => ({ ...prev, amount: '0.00'}));
    }
  }, [formData.quantity, formData.purchasePrice]);

  const fetchInvestments = async () => {
    try {
      const response = await api.get('/api/investments');
      setInvestments(response.data);
    } catch (error) {
      handleApiError(error, 'Error loading investments.');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/investments/stats');
      setStats(response.data);
    } catch (error) {
      handleApiError(error, 'Error fetching stats.');
    }
  };

  const handleApiError = (error, defaultMessage) => {
    console.error(defaultMessage, error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      showStatus('Your session has expired. Please log in again.', 'error');
      setTimeout(handleLogout, 2000);
    } else {
      showStatus(error.response?.data?.error || defaultMessage, 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submissionData = { ...formData };

    try {
      if (editingId) {
        await api.put(`/api/investments/${editingId}`, submissionData);
        showStatus('Investment updated successfully! 🔄', 'success');
      } else {
        await api.post('/api/investments', submissionData);
        showStatus('Investment added successfully! 🎉', 'success');
      }
      handleCancelEdit();
      await fetchInvestments();
      await fetchStats();
    } catch (error) {
      handleApiError(error, 'Failed to save investment.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (investment) => {
    setEditingId(investment.id);
    setFormData({
      ...investment,
      date: investment.date ? investment.date.split('T')[0] : new Date().toISOString().split('T')[0],
      symbol: investment.symbol || '',
      quantity: investment.quantity || '',
      purchasePrice: investment.purchasePrice || '',
      notes: investment.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await api.delete(`/api/investments/${id}`);
        showStatus('Investment deleted. 🗑️', 'info');
        await fetchInvestments();
        await fetchStats();
      } catch (error) {
        handleApiError(error, 'Error deleting investment.');
      }
    }
  };
  
  const exportData = () => {
    if (investments.length === 0) {
      showStatus('No data to export', 'error');
      return;
    }
    const headers = ['id', 'name', 'date', 'category', 'symbol', 'quantity', 'purchasePrice', 'notes', 'timestamp'];
    const csvContent = [
      headers.join(','),
      ...investments.map(inv => [
        inv.id,
        `"${(inv.name || '').replace(/"/g, '""')}"`,
        inv.date,
        inv.category,
        inv.symbol || '',
        inv.quantity || '',
        inv.purchasePrice || '',
        `"${(inv.notes || '').replace(/"/g, '""')}"`,
        inv.timestamp
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investments_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('Data exported successfully! 📁', 'success');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvContent = e.target.result;
      const lines = csvContent.split('\n').filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        showStatus('No data found in file to import.', 'error');
        setLoading(false);
        return;
      }
      
      const headers = lines[0].trim().split(',').map(h => h.toLowerCase());
      const requiredHeaders = ['name', 'date', 'category', 'amount'];
      
      if (!requiredHeaders.every(h => headers.includes(h))) {
          showStatus(`CSV must contain at least these headers: ${requiredHeaders.join(', ')}`, 'error');
          setLoading(false);
          return;
      }

      const importedInvestments = lines.slice(1).map(line => {
        const values = line.split(',');
        const investmentData = headers.reduce((obj, header, index) => {
            obj[header] = values[index] ? values[index].replace(/"/g, '') : null;
            return obj;
        }, {});
        return investmentData;
      });

      try {
        await api.post('/api/investments/import', importedInvestments);
        showStatus(`${importedInvestments.length} investments imported successfully! 📄`, 'success');
        await fetchInvestments();
        await fetchStats();
      } catch (error) {
        handleApiError(error, 'Error importing data.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };
  
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL of your investments? This action cannot be undone.')) {
      try {
        await api.delete('/api/investments');
        showStatus('All investments have been deleted.', 'info');
        fetchInvestments();
        fetchStats();
      } catch (error) {
        handleApiError(error, 'Failed to delete all investments.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const showStatus = (message, type = 'info') => {
    setStatusMessage({ text: message, type });
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>💰 Investment Tracker Pro</h1>
          <button onClick={handleLogout} className="btn btn-secondary" style={{position: 'absolute', top: '30px', right: '30px', background: '#c83a54'}}>Logout</button>
        </div>

        <div className="main-content">
          <div className="total-display">
            <h3>Total Portfolio Value</h3>
            <div className="total-amount">{formatCurrency(stats.totalAmount)}</div>
          </div>

          <div className="dashboard">
            <div className="card full-width">
              <h2><span className="icon">{editingId ? '✏️' : '+'}</span>{editingId ? 'Edit Investment' : 'Add New Investment'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group"><label htmlFor="name">Investment Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Apple Stock" required/></div>
                    <div className="form-group"><label htmlFor="date">Purchase Date</label><input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required/></div>
                    <div className="form-group"><label htmlFor="category">Category</label><select id="category" name="category" value={formData.category} onChange={handleInputChange} required>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                    <div className="form-group"><label htmlFor="symbol">Symbol/Ticker</label><input type="text" id="symbol" name="symbol" value={formData.symbol} onChange={handleInputChange} placeholder="e.g., AAPL, BTC"/></div>
                    <div className="form-group"><label htmlFor="quantity">Quantity</label><input type="number" id="quantity" name="quantity" step="any" min="0" value={formData.quantity} onChange={handleInputChange} placeholder="e.g., 10"/></div>
                    <div className="form-group"><label htmlFor="purchasePrice">Price Per Unit ($)</label><input type="number" id="purchasePrice" name="purchasePrice" step="any" min="0" value={formData.purchasePrice} onChange={handleInputChange} placeholder="e.g., 150.25"/></div>
                    <div className="form-group full-width"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional details..."></textarea></div>
                    <div className="form-group full-width"><label>Total Amount ($)</label><input type="text" value={formatCurrency(formData.amount)} disabled readOnly/></div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn" disabled={loading}><span>{editingId ? '💾 Update Investment' : '💾 Add Investment'}</span></button>
                  {editingId && (<button type="button" className="btn btn-secondary" onClick={handleCancelEdit} disabled={loading}><span>❌ Cancel Edit</span></button>)}
                </div>
              </form>
            </div>
          </div>

          <div className="card quick-actions-card">
            <h2><span className="icon">⚡</span>Quick Actions</h2>
            <button type="button" className="btn" onClick={exportData}>
                <span>📥</span> Export Data to CSV
            </button>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} ref={fileInputRef} id="csvFileInput"/>
            <button type="button" className="btn import-btn" onClick={() => fileInputRef.current.click()} disabled={loading}>
                <span>📤</span> {loading ? 'Importing...' : 'Import Data from CSV'}
            </button>
            <button type="button" className="btn clear-btn" onClick={handleClearAll}>
                <span>🗑️</span> Clear All Investments
            </button>
          </div>

          <div className="investments-section">
            <div className="investments-header">
              <h2><span className="icon">📈</span>Investment History</h2>
            </div>
            <div className="investments-list">
              {investments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div><h3>No investments yet</h3><p>Start by adding your first investment above!</p>
                </div>
              ) : (
                investments.map((investment) => (
                  <div key={investment.id} className="investment-item">
                    <div className="investment-main-info">
                      <span className="investment-name">{investment.name} ({investment.symbol ? investment.symbol.toUpperCase() : 'N/A'})</span>
                      <span className="investment-amount">{formatCurrency(investment.amount)}</span>
                    </div>
                    <div className="investment-actions">
                      <button onClick={() => handleEdit(investment)} className="action-btn edit-btn" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(investment.id)} className="action-btn delete-btn" title="Delete">🗑️</button>
                    </div>
                    <div className="investment-details">
                      <span className="detail-item"><strong>Date:</strong> {investment.date ? investment.date.split('T')[0] : 'N/A'}</span>
                      <span className="detail-item"><strong>Category:</strong> {investment.category}</span>
                      {investment.quantity != null && <span className="detail-item"><strong>Qty:</strong> {investment.quantity}</span>}
                      {investment.purchasePrice != null && <span className="detail-item"><strong>Price:</strong> {formatCurrency(investment.purchasePrice)}</span>}
                      {investment.notes && <span className="detail-item full-width"><strong>Notes:</strong> {investment.notes}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {statusMessage && (<div className={`status-bar show ${statusMessage.type}`}>{statusMessage.text}</div>)}
    </div>
  );
}

export default Dashboard;