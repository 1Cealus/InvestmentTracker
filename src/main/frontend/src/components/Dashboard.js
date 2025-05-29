import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'; // Added useCallback
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import AnalysisModal from './AnalysisModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const initialFormData = {
  date: new Date().toISOString().split('T')[0],
  name: '',
  category: 'Stocks',
  symbol: '',
  quantity: '',
  purchasePrice: '',
  notes: '',
  amount: '0.00',
  transactionType: 'Purchase',
};

const SortableHeader = ({ children, name, sortConfig, requestSort }) => {
    const isSorted = sortConfig.key === name;
    const directionIcon = isSorted ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : '';
    return (
        <button onClick={() => requestSort(name)} className="sortable-header">
            {children}{directionIcon}
        </button>
    );
};

function Dashboard() {
  const [investments, setInvestments] = useState([]);
  const [stats, setStats] = useState({ totalAmount: 0 });
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isViewAllModalOpen, setViewAllModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const categories = ['Stocks', 'Crypto', 'Mutual Funds', 'Bonds', 'Real Estate', 'Other'];

  const showStatus = useCallback((message, type = 'info') => {
    setStatusMessage({ text: message, type });
    setTimeout(() => setStatusMessage(''), 4000);
  }, []); // setStatusMessage is stable

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]); // navigate is stable

  const handleApiError = useCallback((error, defaultMessage) => {
    console.error(defaultMessage, error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      showStatus('Your session has expired. Please log in again.', 'error');
      setTimeout(handleLogout, 2000);
    } else {
      showStatus(error.response?.data?.error || defaultMessage, 'error');
    }
  }, [showStatus, handleLogout]);

  const fetchInvestments = useCallback(async () => {
    try {
      const response = await api.get('/api/investments');
      setInvestments(response.data);
    } catch (error) {
      handleApiError(error, 'Error loading investments.');
    }
  }, [handleApiError]); // Depends on handleApiError

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/investments/stats');
      setStats(response.data);
    } catch (error) {
      handleApiError(error, 'Error fetching stats.');
    }
  }, [handleApiError]); // Depends on handleApiError
  
  // useEffect at original line 75
  useEffect(() => {
    fetchInvestments();
    fetchStats();
  }, [fetchInvestments, fetchStats]); // Now using memoized functions

  // useEffect at original line 89
  useEffect(() => {
    const { quantity, purchasePrice, transactionType } = formData;
    const q = parseFloat(quantity);
    const p = parseFloat(purchasePrice);

    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      const totalAmount = q * p;
      const finalAmount = transactionType === 'Sale' ? -totalAmount : totalAmount;
      setFormData(prev => ({ ...prev, amount: finalAmount.toFixed(4) }));
    } else {
      setFormData(prev => ({ ...prev, amount: '0.00' }));
    }
  }, [formData]); // ESLint prefers the whole object if destructuring inside

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTransactionTypeChange = (type) => {
    setFormData(prev => ({...prev, transactionType: type}));
  };

  const closeAddModal = useCallback(() => {
    setAddModalOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  }, []); // Relies only on setters and initialFormData (constant)


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const submissionData = { ...formData, amount: parseFloat(formData.amount) };

    try {
      if (editingId) {
        await api.put(`/api/investments/${editingId}`, submissionData);
        showStatus('Transaction updated successfully! 🔄', 'success');
      } else {
        await api.post('/api/investments', submissionData);
        showStatus('Transaction added successfully! 🎉', 'success');
      }
      closeAddModal(); // This is now memoized
      await fetchInvestments(); // This is now memoized
      await fetchStats(); // This is now memoized
    } catch (error) {
      handleApiError(error, 'Failed to save transaction.'); // Memoized
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (investment) => {
    setEditingId(investment.id);
    setFormData({
      ...investment,
      transactionType: investment.amount < 0 ? 'Sale' : 'Purchase',
      purchasePrice: Math.abs(investment.purchasePrice) || '',
      quantity: Math.abs(investment.quantity) || '',
      date: investment.date ? investment.date.split('T')[0] : new Date().toISOString().split('T')[0],
      symbol: investment.symbol || '',
      notes: investment.notes || ''
    });
    setAddModalOpen(true);
  };
  
  const openDeleteModal = (id) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = useCallback(() => {
    setDeletingId(null);
    setDeleteModalOpen(false);
  }, []); // Relies only on setters

  const confirmDelete = async () => {
    if (!deletingId) return;
    setLoading(true);
    try {
      await api.delete(`/api/investments/${deletingId}`);
      showStatus('Transaction deleted successfully.', 'info'); // Memoized
      await fetchInvestments(); // Memoized
      await fetchStats(); // Memoized
    } catch (error) {
      handleApiError(error, 'Error deleting transaction.'); // Memoized
    } finally {
      setLoading(false);
      closeDeleteModal(); // Memoized
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setAddModalOpen(true);
  };
  
  const exportData = useCallback(() => {
    if (investments.length === 0) {
      showStatus('No data to export', 'error'); // Memoized
      return;
    }
    // ... rest of exportData logic (it doesn't depend on component state that changes often)
    const headers = ['id', 'name', 'date', 'category', 'symbol', 'quantity', 'purchasePrice', 'amount', 'notes'];
    const csvContent = [
      headers.join(','),
      ...investments.map(inv => [
        inv.id,
        `"${(inv.name || '').replace(/"/g, '""')}"`,
        inv.date.split('T')[0],
        inv.category,
        inv.symbol || '',
        inv.quantity || '',
        inv.purchasePrice || '',
        inv.amount || '',
        `"${(inv.notes || '').replace(/"/g, '""')}"`,
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
    showStatus('Data exported successfully! 📁', 'success'); // Memoized
  }, [investments, showStatus]); // Depends on investments and memoized showStatus

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const sortedInvestments = useMemo(() => {
      return [...investments].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [investments]);

  const portfolioHistoryMainChart = useMemo(() => {
    if (investments.length === 0) {
      return { labels: [], data: [] };
    }
    const sorted = [...investments].sort((a, b) => new Date(a.date) - new Date(b.date));
    const dailyAggregates = sorted.reduce((acc, transaction) => {
      const date = transaction.date.split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += transaction.amount;
      return acc;
    }, {});

    let runningTotal = 0;
    const labels = Object.keys(dailyAggregates); 
    const data = labels.map(date => {
      runningTotal += dailyAggregates[date]; 
      return runningTotal; 
    });
    return { labels, data };
  }, [investments]);

  const mainChartData = {
    labels: portfolioHistoryMainChart.labels,
    datasets: [
      {
        label: 'Total Portfolio Value ($)',
        data: portfolioHistoryMainChart.data,
        fill: true,
        backgroundColor: 'rgba(80, 227, 194, 0.2)',
        borderColor: '#50E3C2',
        tension: 0.3
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: { ticks: { color: '#b0b0b0' } },
        y: { ticks: { color: '#b0b0b0' } }
    }
  };

  const requestSort = useCallback((key) => {
    setSortConfig((prevSortConfig) => {
        let direction = 'ascending';
        if (prevSortConfig.key === key && prevSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        return { key, direction };
    });
  }, []); // setSortConfig is stable

  const filteredAndSortedInvestments = useMemo(() => {
    let sortableItems = [...investments];
    if (searchTerm) {
        sortableItems = sortableItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.date.split('T')[0].includes(searchTerm)
        );
    }
    if (sortConfig.key) { // Ensure sortConfig.key is not null
        sortableItems.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }
    return sortableItems;
  }, [investments, searchTerm, sortConfig]);


  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>💰 Investment Tracker Pro</h1>
          <div className="header-actions">
            <button className="btn" onClick={openAddModal}>+ New Transaction</button>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ background: '#c83a54' }}>Logout</button>
          </div>
        </header>

        <main className="main-content">
           <div id="total-portfolio" className="card">
            <h2><span className="icon">💼</span>Total Portfolio Value</h2>
            <div className="total-amount">{formatCurrency(stats.totalAmount)}</div>
             <div style={{ marginTop: '20px' }}>
                <p>Quick Actions:</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn import-btn" onClick={() => fileInputRef.current.click()} disabled={loading}>
                         <span>📤</span> {loading ? 'Importing...' : 'Import'}
                    </button>
                    <input type="file" accept=".csv" style={{ display: 'none' }} ref={fileInputRef} id="csvFileInput"/>
                    <button type="button" className="btn" onClick={exportData}>
                        <span>📥</span> Export
                    </button>
                    <button type="button" className="btn analyze-btn" onClick={() => setAnalysisModalOpen(true)}>
                        <span>🔬</span> Analyze
                    </button>
                    <button type="button" className="btn clear-btn">
                        <span>🗑️</span> Clear All
                    </button>
                </div>
            </div>
          </div>

          <div id="investment-chart" className="card">
            <h2><span className="icon">📊</span>Portfolio Value Over Time</h2>
            <div style={{ height: '250px' }}>
                <Line options={chartOptions} data={mainChartData} />
            </div>
          </div>

          <div id="investment-history" className="card">
            <div className="investments-header">
              <h2><span className="icon">📈</span>Recent Transaction History</h2>
              <button className="btn btn-secondary" onClick={() => setViewAllModalOpen(true)}>View All</button>
            </div>
            <div className="investments-list">
              {sortedInvestments.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📊</div><h3>No transactions yet</h3><p>Start by adding your first transaction!</p></div>
              ) : (
                sortedInvestments.slice(0, 5).map((investment) => (
                  <div key={investment.id} className="investment-item">
                    <span className="investment-name">{investment.name} ({investment.symbol ? investment.symbol.toUpperCase() : 'N/A'})</span>
                    <span className="investment-category">{investment.category}</span>
                    <span className="investment-date">{investment.date ? investment.date.split('T')[0] : 'N/A'}</span>
                    <span className={`investment-amount-display ${investment.amount < 0 ? 'negative' : ''}`}>{formatCurrency(investment.amount)}</span>
                    <div className="investment-actions">
                        <button onClick={() => handleEdit(investment)} className="action-btn edit-btn" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => openDeleteModal(investment.id)} className="action-btn delete-btn" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Transaction' : 'Manage Transaction'}</h2>
              <button onClick={closeAddModal} className="close-modal-btn">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="transaction-type-toggle">
                <button type="button" className={`toggle-btn ${formData.transactionType === 'Purchase' ? 'active' : ''}`} onClick={() => handleTransactionTypeChange('Purchase')}>Purchase</button>
                <button type="button" className={`toggle-btn ${formData.transactionType === 'Sale' ? 'active' : ''}`} onClick={() => handleTransactionTypeChange('Sale')}>Sale</button>
              </div>
              <div className="form-grid">
                <div className="form-group"><label htmlFor="name">Investment Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Apple Stock" required/></div>
                <div className="form-group"><label htmlFor="date">{formData.transactionType} Date</label><input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required/></div>
                <div className="form-group"><label htmlFor="category">Category</label><select id="category" name="category" value={formData.category} onChange={handleInputChange} required>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div className="form-group"><label htmlFor="symbol">Symbol/Ticker</label><input type="text" id="symbol" name="symbol" value={formData.symbol} onChange={handleInputChange} placeholder="e.g., AAPL, BTC"/></div>
                <div className="form-group"><label htmlFor="quantity">Quantity</label><input type="number" id="quantity" name="quantity" step="any" min="0" value={formData.quantity} onChange={handleInputChange} placeholder="e.g., 10"/></div>
                <div className="form-group"><label htmlFor="purchasePrice">Price Per Unit ($)</label><input type="number" id="purchasePrice" name="purchasePrice" step="any" min="0" value={formData.purchasePrice} onChange={handleInputChange} placeholder="e.g., 150.25"/></div>
                <div className="form-group full-width"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional details..."></textarea></div>
                <div className="form-group full-width"><label>Total Transaction Value ($)</label><input type="text" value={formatCurrency(formData.amount)} disabled readOnly/></div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeAddModal}>Cancel</button>
                <button type="submit" className="btn" disabled={loading}>{editingId ? 'Update' : 'Add Transaction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewAllModalOpen && (
        <div className="modal-overlay comprehensive-list-modal" onClick={() => setViewAllModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>All Transactions</h2>
                    <input type="text" placeholder="Search by name or date..." className="form-group-input" style={{marginLeft: '20px', width: '300px'}} onChange={(e) => setSearchTerm(e.target.value)} />
                    <button onClick={() => setViewAllModalOpen(false)} className="close-modal-btn" style={{marginLeft: 'auto'}}>×</button>
                </div>
                <div className="investments-list-header">
                    <SortableHeader name="name" sortConfig={sortConfig} requestSort={requestSort}>Name</SortableHeader>
                    <SortableHeader name="category" sortConfig={sortConfig} requestSort={requestSort}>Category</SortableHeader>
                    <SortableHeader name="date" sortConfig={sortConfig} requestSort={requestSort}>Date</SortableHeader>
                    <span style={{textAlign: 'right'}}><SortableHeader name="amount" sortConfig={sortConfig} requestSort={requestSort}>Amount</SortableHeader></span>
                    <span style={{textAlign: 'right'}}>Actions</span>
                </div>
                <div className="investments-list" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                    {filteredAndSortedInvestments.length > 0 ? (
                        filteredAndSortedInvestments.map(investment => (
                            <div key={investment.id} className="investment-item">
                                <span className="investment-name">{investment.name}</span>
                                <span className="investment-category">{investment.category}</span>
                                <span className="investment-date">{investment.date.split('T')[0]}</span>
                                <span className={`investment-amount-display ${investment.amount < 0 ? 'negative' : ''}`}>{formatCurrency(investment.amount)}</span>
                                <div className="investment-actions">
                                    <button onClick={() => { setViewAllModalOpen(false); handleEdit(investment); }} className="action-btn edit-btn" title="Edit">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                                    </button>
                                    <button onClick={() => openDeleteModal(investment.id)} className="action-btn delete-btn" title="Delete">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{textAlign: 'center', padding: '20px'}}>No transactions match your search.</p>
                    )}
                </div>
            </div>
        </div>
      )}
      
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="icon">!</div>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to permanently delete this transaction? This action cannot be undone.</p>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={closeDeleteModal} disabled={loading}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAnalysisModalOpen && (
        <AnalysisModal 
          investments={investments} 
          onClose={() => setAnalysisModalOpen(false)} 
        />
      )}

      {statusMessage && (<div className={`status-bar show ${statusMessage.type}`}>{statusMessage.text}</div>)}
    </div>
  );
}

export default Dashboard;