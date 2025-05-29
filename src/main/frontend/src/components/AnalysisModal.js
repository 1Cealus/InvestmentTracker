// src/components/AnalysisModal.js
import React, { useState, useMemo, useEffect } from 'react';
import { Line }
from 'react-chartjs-2'; // Chart.js is already registered in Dashboard.js
import './Dashboard.css'; // Reuse existing modal and form styles where applicable

const AnalysisModal = ({ investments, onClose }) => {
  const [projectionYears, setProjectionYears] = useState(10);
  const [annualGrowthRate, setAnnualGrowthRate] = useState(10); // Percentage
  const [annualTaxRate, setAnnualTaxRate] = useState(15); // Percentage on gains
  const [averageAnnualInvestment, setAverageAnnualInvestment] = useState(0);

  // Calculate Average Annual Investment
  useEffect(() => {
    if (investments.length > 0) {
      const purchases = investments.filter(inv => inv.amount > 0);
      if (purchases.length === 0) {
        setAverageAnnualInvestment(0);
        return;
      }

      const sortedPurchases = [...purchases].sort((a,b) => new Date(a.date) - new Date(b.date));
      const firstDate = new Date(sortedPurchases[0].date);
      const lastDate = new Date(sortedPurchases[sortedPurchases.length - 1].date);

      const totalInvested = sortedPurchases.reduce((sum, p) => sum + p.amount, 0);
      
      // Calculate duration in years. If less than a year, treat as 1 year for annualizing.
      const diffTime = Math.abs(lastDate - firstDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const durationYears = diffDays > 0 ? Math.max(1, diffDays / 365.25) : 1;

      setAverageAnnualInvestment(totalInvested / durationYears);
    } else {
      setAverageAnnualInvestment(0);
    }
  }, [investments]);


  const analysisChartData = useMemo(() => {
    const labels = [];
    const historicalData = [];
    const projectedDataPreTax = [];
    const projectedDataPostTax = [];

    if (investments.length === 0) {
      return { labels, datasets: [] };
    }

    // 1. Historical Data (Aggregated by Day)
    const sortedHistorical = [...investments].sort((a, b) => new Date(a.date) - new Date(b.date));
    const dailyAggregates = sortedHistorical.reduce((acc, transaction) => {
      const date = transaction.date.split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += transaction.amount;
      return acc;
    }, {});

    let runningTotalHistorical = 0;
    Object.keys(dailyAggregates).forEach(date => {
      labels.push(date);
      runningTotalHistorical += dailyAggregates[date];
      historicalData.push(runningTotalHistorical);
      projectedDataPreTax.push(null); // Pad with nulls for historical part
      projectedDataPostTax.push(null); // Pad with nulls for historical part
    });

    // 2. Projection Data
    let currentProjectedValuePreTax = runningTotalHistorical;
    let currentProjectedValuePostTax = runningTotalHistorical;
    const lastHistoricalDate = labels.length > 0 ? new Date(labels[labels.length - 1]) : new Date();

    for (let i = 1; i <= projectionYears; i++) {
      const nextYearDate = new Date(lastHistoricalDate);
      nextYearDate.setFullYear(lastHistoricalDate.getFullYear() + i);
      labels.push(nextYearDate.toISOString().split('T')[0]);
      historicalData.push(null); // Pad with nulls for projected part

      // Pre-Tax Projection
      let yearStartValuePreTax = currentProjectedValuePreTax + averageAnnualInvestment;
      let growthPreTax = yearStartValuePreTax * (annualGrowthRate / 100);
      currentProjectedValuePreTax = yearStartValuePreTax + growthPreTax;
      projectedDataPreTax.push(currentProjectedValuePreTax);

      // Post-Tax Projection
      let yearStartValuePostTax = currentProjectedValuePostTax + averageAnnualInvestment;
      let gainForYear = yearStartValuePostTax * (annualGrowthRate / 100);
      let taxOnGain = gainForYear * (annualTaxRate / 100);
      currentProjectedValuePostTax = yearStartValuePostTax + gainForYear - taxOnGain;
      projectedDataPostTax.push(currentProjectedValuePostTax);
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Historical Portfolio Value ($)',
          data: historicalData,
          borderColor: '#50E3C2',
          backgroundColor: 'rgba(80, 227, 194, 0.2)',
          fill: true,
          tension: 0.1,
        },
        {
          label: 'Projected Value (Pre-Tax) ($)',
          data: projectedDataPreTax,
          borderColor: '#4A90E2',
          borderDash: [5, 5], // Dashed line for projection
          fill: false,
          tension: 0.1,
        },
        {
          label: 'Projected Value (Post-Tax) ($)',
          data: projectedDataPostTax,
          borderColor: '#e53935', // Red for post-tax
          borderDash: [5, 5],
          fill: false,
          tension: 0.1,
        },
      ],
    };
  }, [investments, projectionYears, annualGrowthRate, annualTaxRate, averageAnnualInvestment]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e0e0e0' }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: { ticks: { color: '#b0b0b0' }, grid: { color: 'rgba(255,255,255,0.1)'} },
      y: { ticks: { color: '#b0b0b0' }, grid: { color: 'rgba(255,255,255,0.1)'} }
    },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content analysis-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="analysis-modal-header">
          <h2>Portfolio Growth Analysis & Projection</h2>
          <button onClick={onClose} className="close-modal-btn">×</button>
        </div>

        <div className="analysis-inputs-grid">
          <div className="form-group">
            <label htmlFor="projectionYears">Projection (Years)</label>
            <input
              type="number"
              id="projectionYears"
              className="form-group input" // Ensure this class exists or use a generic input style
              value={projectionYears}
              min="1"
              max="50"
              onChange={(e) => setProjectionYears(parseInt(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="annualGrowthRate">Annual Growth Rate (%)</label>
            <input
              type="number"
              id="annualGrowthRate"
              className="form-group input"
              value={annualGrowthRate}
              step="0.1"
              min="0"
              max="100"
              onChange={(e) => setAnnualGrowthRate(parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="annualTaxRate">Capital Gains Tax Rate (%)</label>
            <input
              type="number"
              id="annualTaxRate"
              className="form-group input"
              value={annualTaxRate}
              step="0.1"
              min="0"
              max="100"
              onChange={(e) => setAnnualTaxRate(parseFloat(e.target.value))}
            />
          </div>
           <div className="form-group">
            <label>Avg. Annual Investment</label>
            <input
              type="text"
              className="form-group input"
              value={`$${averageAnnualInvestment.toFixed(2)}`}
              disabled
              readOnly
            />
          </div>
        </div>

        <div className="analysis-chart-container">
          {investments.length > 0 ? (
            <Line options={chartOptions} data={analysisChartData} />
          ) : (
            <p style={{textAlign: 'center', color: '#777'}}>No investment data to analyze.</p>
          )}
        </div>
        
        <div className="form-actions" style={{justifyContent: "flex-end"}}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;