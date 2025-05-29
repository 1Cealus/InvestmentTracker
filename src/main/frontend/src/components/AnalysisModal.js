// src/components/AnalysisModal.js
import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import './Dashboard.css'; // Reuse existing modal and form styles where applicable

const AnalysisModal = ({ investments, onClose }) => {
  const [projectionYears, setProjectionYears] = useState(10);
  const [annualGrowthRate, setAnnualGrowthRate] = useState(10); // Percentage
  const [annualTaxRate, setAnnualTaxRate] = useState(15); // Percentage on gains
  
  const [calculatedAvgAnnualInvestment, setCalculatedAvgAnnualInvestment] = useState(0);
  const [customAnnualInvestment, setCustomAnnualInvestment] = useState(0);

  useEffect(() => {
    if (investments.length > 0) {
      const purchases = investments.filter(inv => inv.amount > 0);
      if (purchases.length === 0) {
        setCalculatedAvgAnnualInvestment(0);
        setCustomAnnualInvestment(0);
        return;
      }

      const sortedPurchases = [...purchases].sort((a,b) => new Date(a.date) - new Date(b.date));
      const firstDate = new Date(sortedPurchases[0].date);
      const lastPurchaseDate = new Date(sortedPurchases[sortedPurchases.length - 1].date);
      const currentDate = new Date();
      const endDateForAvg = lastPurchaseDate > firstDate ? lastPurchaseDate : currentDate;

      const totalInvested = sortedPurchases.reduce((sum, p) => sum + p.amount, 0);
      
      const diffTime = Math.abs(endDateForAvg - firstDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const durationYears = diffDays > 0 ? Math.max(1, diffDays / 365.25) : 1;

      const avg = parseFloat((totalInvested / durationYears).toFixed(2));
      setCalculatedAvgAnnualInvestment(avg);
      setCustomAnnualInvestment(avg); 
    } else {
      setCalculatedAvgAnnualInvestment(0);
      setCustomAnnualInvestment(0);
    }
  }, [investments]);

  const analysisChartDataAndSummary = useMemo(() => {
    const labels = [];
    const historicalData = [];
    const projectedDataPreTax = [];
    const projectedDataPostTax = [];
    const summary = []; 

    if (investments.length === 0 && customAnnualInvestment <=0) {
      return { chartData: { labels, datasets: [] }, summaryTable: [] };
    }

    let runningTotalHistorical = 0;
    if (investments.length > 0) {
        const sortedHistorical = [...investments].sort((a, b) => new Date(a.date) - new Date(b.date));
        const dailyAggregates = sortedHistorical.reduce((acc, transaction) => {
        const date = transaction.date.split('T')[0];
        if (!acc[date]) acc[date] = 0;
        acc[date] += transaction.amount;
        return acc;
        }, {});

        Object.keys(dailyAggregates).forEach(date => {
        labels.push(date);
        runningTotalHistorical += dailyAggregates[date];
        historicalData.push(runningTotalHistorical);
        projectedDataPreTax.push(null); 
        projectedDataPostTax.push(null);
        });
    } else {
        const today = new Date().toISOString().split('T')[0];
        labels.push(today); 
        historicalData.push(0);
        projectedDataPreTax.push(null);
        projectedDataPostTax.push(null);
        runningTotalHistorical = 0; 
    }

    let currentProjectedValuePreTax = runningTotalHistorical;
    let currentProjectedValuePostTax = runningTotalHistorical;
    const lastHistoricalDate = labels.length > 0 ? new Date(labels[labels.length - 1]) : new Date();

    for (let i = 1; i <= projectionYears; i++) {
      const nextYearDate = new Date(lastHistoricalDate);
      nextYearDate.setFullYear(lastHistoricalDate.getFullYear() + i);
      const yearLabel = nextYearDate.getFullYear().toString(); 
      labels.push(yearLabel);
      historicalData.push(null); 

      let yearStartValuePreTax = currentProjectedValuePreTax + parseFloat(customAnnualInvestment); 
      let growthPreTax = yearStartValuePreTax * (annualGrowthRate / 100);
      currentProjectedValuePreTax = yearStartValuePreTax + growthPreTax;
      projectedDataPreTax.push(currentProjectedValuePreTax);

      let yearStartValuePostTax = currentProjectedValuePostTax + parseFloat(customAnnualInvestment); 
      let gainForYear = yearStartValuePostTax * (annualGrowthRate / 100);
      let taxOnGain = (gainForYear > 0 ? gainForYear : 0) * (annualTaxRate / 100); 
      currentProjectedValuePostTax = yearStartValuePostTax + gainForYear - taxOnGain;
      projectedDataPostTax.push(currentProjectedValuePostTax);
      
      summary.push({
          year: i,
          dateLabel: yearLabel,
          preTaxValue: currentProjectedValuePreTax,
          postTaxValue: currentProjectedValuePostTax,
      });
    }
    
    const chartDataObj = {
      labels,
      datasets: [
        {
          label: 'Historical Portfolio Value ($)',
          data: historicalData,
          borderColor: '#50E3C2',
          backgroundColor: 'rgba(80, 227, 194, 0.2)',
          fill: true,
          tension: 0.1,
          pointRadius: historicalData.map(d => d === null ? 0 : 3), // Hide points for null data
        },
        {
          label: 'Projected Value (Pre-Tax) ($)',
          data: projectedDataPreTax,
          borderColor: '#4A90E2',
          borderDash: [5, 5],
          fill: false,
          tension: 0.1,
          pointRadius: projectedDataPreTax.map(d => d === null ? 0 : 3),
        },
        {
          label: 'Projected Value (Post-Tax) ($)',
          data: projectedDataPostTax,
          borderColor: '#e53935',
          borderDash: [5, 5],
          fill: false,
          tension: 0.1,
          pointRadius: projectedDataPostTax.map(d => d === null ? 0 : 3),
        },
      ],
    };
    return { chartData: chartDataObj, summaryTable: summary };
  }, [investments, projectionYears, annualGrowthRate, annualTaxRate, customAnnualInvestment]); 

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
        callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) { label += ': '; }
                if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                }
                return label;
            }
        }
      },
    },
    scales: {
      x: { ticks: { color: '#b0b0b0' }, grid: { color: 'rgba(255,255,255,0.1)'} },
      y: { 
          ticks: { 
              color: '#b0b0b0',
              callback: function(value) { return '$' + value.toLocaleString(); }
          }, 
          grid: { color: 'rgba(255,255,255,0.1)'} 
      }
    },
    elements: {
        line: {
            skipNull: true // Ensure lines connect across null data points
        },
        point: {
            radius: (ctx) => ctx.dataset.data[ctx.dataIndex] === null ? 0 : 3 // Hide points for null data
        }
    }
  };
  
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content analysis-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="analysis-modal-header">
          <h2>Portfolio Growth Analysis & Projection</h2>
          <button onClick={onClose} className="close-modal-btn">×</button>
        </div>

        {/* ✨ NEW TWO-COLUMN LAYOUT BODY ✨ */}
        <div className="analysis-modal-body">
            {/* ✨ CONTROLS PANE (LEFT) ✨ */}
            <div className="analysis-controls-pane">
                <div className="analysis-inputs-grid"> {/* This div already exists, now nested */}
                    <div className="form-group">
                        <label htmlFor="projectionYears">Projection (Years)</label>
                        <input
                        type="number"
                        id="projectionYears"
                        className="form-group input"
                        value={projectionYears}
                        min="1"
                        max="50"
                        onChange={(e) => setProjectionYears(parseInt(e.target.value) || 1)}
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
                        onChange={(e) => setAnnualGrowthRate(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="annualTaxRate">Gains Tax Rate (%)</label>
                        <input
                        type="number"
                        id="annualTaxRate"
                        className="form-group input"
                        value={annualTaxRate}
                        step="0.1"
                        min="0"
                        max="100"
                        onChange={(e) => setAnnualTaxRate(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="customAnnualInvestment">Annual Contribution ($)</label>
                        <input
                        type="number"
                        id="customAnnualInvestment"
                        className="form-group input"
                        value={customAnnualInvestment}
                        step="100"
                        min="0"
                        onChange={(e) => setCustomAnnualInvestment(parseFloat(e.target.value) || 0)}
                        title={`Calculated average: ${formatCurrency(calculatedAvgAnnualInvestment)}`}
                        />
                    </div>
                </div>
            </div>

            {/* ✨ RESULTS PANE (RIGHT) ✨ */}
            <div className="analysis-results-pane">
                <div className="analysis-chart-container">
                {(investments.length > 0 || customAnnualInvestment > 0) ? (
                    <Line options={chartOptions} data={analysisChartDataAndSummary.chartData} />
                ) : (
                    <p style={{textAlign: 'center', color: '#777'}}>No investment data to analyze, and no future contributions set.</p>
                )}
                </div>

                {analysisChartDataAndSummary.summaryTable.length > 0 && (
                <div className="projection-summary-container">
                    <h3>Projected Values (End of Year)</h3>
                    <div style={{maxHeight: '200px', overflowY: 'auto'}}> {/* Scrollable Table Area */}
                    <table className="summary-table">
                        <thead>
                        <tr>
                            <th>Year #</th>
                            <th>Projected Year</th>
                            <th>Est. Value (Pre-Tax)</th>
                            <th>Est. Value (Post-Tax)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {analysisChartDataAndSummary.summaryTable.map(item => (
                            <tr key={item.year}>
                            <td>{item.year}</td>
                            <td>{item.dateLabel}</td>
                            <td>{formatCurrency(item.preTaxValue)}</td>
                            <td>{formatCurrency(item.postTaxValue)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}
            </div>
        </div>
        
        <div className="form-actions" style={{justifyContent: "flex-end", marginTop: '20px'}}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;