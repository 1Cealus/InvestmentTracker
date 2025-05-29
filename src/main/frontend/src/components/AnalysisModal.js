// src/components/AnalysisModal.js
import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import './Dashboard.css'; // Reuse existing modal and form styles where applicable

const AnalysisModal = ({ investments, onClose }) => {
  const [projectionYears, setProjectionYears] = useState(10);
  const [annualGrowthRate, setAnnualGrowthRate] = useState(10); // Primary Growth Rate
  const [annualTaxRate, setAnnualTaxRate] = useState(15);
  
  const [calculatedAvgAnnualInvestment, setCalculatedAvgAnnualInvestment] = useState(0);
  const [customAnnualInvestment, setCustomAnnualInvestment] = useState(0);

  // New states for optional growth scenarios
  const [growthRateScenario2, setGrowthRateScenario2] = useState(''); // Empty string means not active
  const [growthRateScenario3, setGrowthRateScenario3] = useState(''); // Empty string means not active


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

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const analysisChartDataAndSummary = useMemo(() => {
    const labels = [];
    const historicalDataValues = [];
    const summary = []; 

    // Datasets for projections
    const projectedPrimary = [];
    const projectedScenario2 = [];
    const projectedScenario3 = [];

    if (investments.length === 0 && parseFloat(customAnnualInvestment) <= 0) {
      return { chartData: { labels, datasets: [] }, summaryTable: [] };
    }

    let runningTotalHistorical = 0;
    let lastHistoricalDate = new Date(); // Default to today if no investments

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
          historicalDataValues.push(runningTotalHistorical);
        });
        if (labels.length > 0) {
            lastHistoricalDate = new Date(labels[labels.length - 1]);
        }
    } else {
        // Start from today if no historical data but there are contributions
        const today = new Date().toISOString().split('T')[0];
        labels.push(today); 
        historicalDataValues.push(0); // Start historical at 0
        runningTotalHistorical = 0; 
        lastHistoricalDate = new Date(today);
    }

    // Initialize projection arrays to align with historical data for Chart.js
    // All projection datasets will start from the last historical value.
    const initialPadding = Array(historicalDataValues.length - 1).fill(null);
    
    projectedPrimary.push(...initialPadding, runningTotalHistorical);
    if (growthRateScenario2 !== '' && !isNaN(parseFloat(growthRateScenario2))) {
        projectedScenario2.push(...initialPadding, runningTotalHistorical);
    }
    if (growthRateScenario3 !== '' && !isNaN(parseFloat(growthRateScenario3))) {
        projectedScenario3.push(...initialPadding, runningTotalHistorical);
    }


    // Projection Calculation Function
    const calculateProjectionYear = (currentValue, growthRate, annualContrib, taxRate) => {
        let val = currentValue + parseFloat(annualContrib);
        const gain = val * (parseFloat(growthRate) / 100);
        const tax = (gain > 0 ? gain : 0) * (parseFloat(taxRate) / 100);
        return val + gain - tax;
    };

    let currentPrimaryValue = runningTotalHistorical;
    let currentScenario2Value = runningTotalHistorical;
    let currentScenario3Value = runningTotalHistorical;

    for (let i = 1; i <= projectionYears; i++) {
      const nextYearDate = new Date(lastHistoricalDate);
      nextYearDate.setFullYear(lastHistoricalDate.getFullYear() + i);
      const yearLabel = nextYearDate.getFullYear().toString(); 
      labels.push(yearLabel); // Add future year label
      historicalDataValues.push(null); // Historical data ends here

      // Primary Projection
      currentPrimaryValue = calculateProjectionYear(currentPrimaryValue, annualGrowthRate, customAnnualInvestment, annualTaxRate);
      projectedPrimary.push(currentPrimaryValue);

      const summaryEntry = {
        year: i,
        dateLabel: yearLabel,
        primaryPostTaxValue: currentPrimaryValue,
      };

      // Scenario 2 Projection
      if (growthRateScenario2 !== '' && !isNaN(parseFloat(growthRateScenario2))) {
        currentScenario2Value = calculateProjectionYear(currentScenario2Value, growthRateScenario2, customAnnualInvestment, annualTaxRate);
        projectedScenario2.push(currentScenario2Value);
        summaryEntry.scenario2PostTaxValue = currentScenario2Value;
      } else {
        projectedScenario2.push(null); // Keep array length consistent
      }

      // Scenario 3 Projection
      if (growthRateScenario3 !== '' && !isNaN(parseFloat(growthRateScenario3))) {
        currentScenario3Value = calculateProjectionYear(currentScenario3Value, growthRateScenario3, customAnnualInvestment, annualTaxRate);
        projectedScenario3.push(currentScenario3Value);
        summaryEntry.scenario3PostTaxValue = currentScenario3Value;
      } else {
        projectedScenario3.push(null); // Keep array length consistent
      }
      summary.push(summaryEntry);
    }
    
    const datasets = [
        {
          label: 'Historical Value ($)',
          data: historicalDataValues,
          borderColor: '#50E3C2', // Teal
          backgroundColor: 'rgba(80, 227, 194, 0.2)',
          fill: historicalDataValues.some(d => d !== null), // Fill only if there's data
          tension: 0.1,
        },
        {
          label: `Projection (${annualGrowthRate}% Growth, Post-Tax) ($)`,
          data: projectedPrimary,
          borderColor: '#4A90E2', // Blue
          borderDash: [5, 5],
          fill: false,
          tension: 0.1,
        }
    ];

    if (growthRateScenario2 !== '' && !isNaN(parseFloat(growthRateScenario2))) {
        datasets.push({
            label: `Scenario 2 (${growthRateScenario2}% Growth, Post-Tax) ($)`,
            data: projectedScenario2,
            borderColor: '#FFC107', // Amber/Yellow
            borderDash: [5, 5],
            fill: false,
            tension: 0.1,
        });
    }
     if (growthRateScenario3 !== '' && !isNaN(parseFloat(growthRateScenario3))) {
        datasets.push({
            label: `Scenario 3 (${growthRateScenario3}% Growth, Post-Tax) ($)`,
            data: projectedScenario3,
            borderColor: '#9C27B0', // Purple
            borderDash: [5, 5],
            fill: false,
            tension: 0.1,
        });
    }
    
    return { chartData: { labels, datasets }, summaryTable: summary };
  }, [investments, projectionYears, annualGrowthRate, annualTaxRate, customAnnualInvestment, growthRateScenario2, growthRateScenario3]); 

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: true, // Connect lines over null data points
    plugins: {
      legend: { position: 'top', labels: { color: '#e0e0e0', boxWidth: 20, padding: 15 } },
      tooltip: {
        mode: 'index', intersect: false,
        callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) { label += ': '; }
                if (context.parsed.y !== null) {
                    label += formatCurrency(context.parsed.y);
                }
                return label;
            }
        }
      },
    },
    scales: {
      x: { ticks: { color: '#b0b0b0' }, grid: { color: 'rgba(255,255,255,0.1)'} },
      y: { 
          ticks: { color: '#b0b0b0', callback: function(value) { return formatCurrency(value); }}, 
          grid: { color: 'rgba(255,255,255,0.1)'} 
      }
    },
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content analysis-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="analysis-modal-header">
          <h2>Portfolio Growth Analysis & Projection</h2>
          <button onClick={onClose} className="close-modal-btn">×</button>
        </div>

        <div className="analysis-modal-body">
            <div className="analysis-controls-pane">
                <div className="analysis-inputs-grid"> 
                    <div className="form-group">
                        <label htmlFor="projectionYears">Projection (Years)</label>
                        <input type="number" id="projectionYears" className="form-group input" value={projectionYears} min="1" max="50" onChange={(e) => setProjectionYears(parseInt(e.target.value) || 1)}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="customAnnualInvestment">Annual Contribution ($)</label>
                        <input type="number" id="customAnnualInvestment" className="form-group input" value={customAnnualInvestment} step="100" min="0" onChange={(e) => setCustomAnnualInvestment(parseFloat(e.target.value) || 0)} title={`Calculated average: ${formatCurrency(calculatedAvgAnnualInvestment)}`}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="annualGrowthRate">Primary Growth Rate (%)</label>
                        <input type="number" id="annualGrowthRate" className="form-group input" value={annualGrowthRate} step="0.1" min="0" max="100" onChange={(e) => setAnnualGrowthRate(parseFloat(e.target.value) || 0)}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="annualTaxRate">Gains Tax Rate (%)</label>
                        <input type="number" id="annualTaxRate" className="form-group input" value={annualTaxRate} step="0.1" min="0" max="100" onChange={(e) => setAnnualTaxRate(parseFloat(e.target.value) || 0)}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="growthRateScenario2">Scenario 2 Growth Rate (%) <small>(Optional)</small></label>
                        <input type="number" id="growthRateScenario2" className="form-group input" value={growthRateScenario2} step="0.1" min="0" max="100" placeholder="e.g., 8" onChange={(e) => setGrowthRateScenario2(e.target.value === '' ? '' : parseFloat(e.target.value))}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="growthRateScenario3">Scenario 3 Growth Rate (%) <small>(Optional)</small></label>
                        <input type="number" id="growthRateScenario3" className="form-group input" value={growthRateScenario3} step="0.1" min="0" max="100" placeholder="e.g., 12" onChange={(e) => setGrowthRateScenario3(e.target.value === '' ? '' : parseFloat(e.target.value))}/>
                    </div>
                </div>
            </div>

            <div className="analysis-results-pane">
                <div className="analysis-chart-container">
                {(investments.length > 0 || parseFloat(customAnnualInvestment) > 0) ? (
                    <Line options={chartOptions} data={analysisChartDataAndSummary.chartData} />
                ) : (
                    <p style={{textAlign: 'center', color: '#777'}}>No investment data to analyze, and no future contributions set.</p>
                )}
                </div>

                {analysisChartDataAndSummary.summaryTable.length > 0 && (
                <div className="projection-summary-container">
                    <h3>Projected Values (End of Year)</h3>
                    <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                    <table className="summary-table">
                        <thead>
                        <tr>
                            <th>Year #</th>
                            <th>Projected Year</th>
                            <th>Primary ({annualGrowthRate}%)</th>
                            {growthRateScenario2 !== '' && !isNaN(parseFloat(growthRateScenario2)) && <th>Scenario 2 ({growthRateScenario2}%)</th>}
                            {growthRateScenario3 !== '' && !isNaN(parseFloat(growthRateScenario3)) && <th>Scenario 3 ({growthRateScenario3}%)</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {analysisChartDataAndSummary.summaryTable.map(item => (
                            <tr key={item.year}>
                            <td>{item.year}</td>
                            <td>{item.dateLabel}</td>
                            <td>{formatCurrency(item.primaryPostTaxValue)}</td>
                            {growthRateScenario2 !== '' && !isNaN(parseFloat(growthRateScenario2)) && <td>{item.scenario2PostTaxValue ? formatCurrency(item.scenario2PostTaxValue) : 'N/A'}</td>}
                            {growthRateScenario3 !== '' && !isNaN(parseFloat(growthRateScenario3)) && <td>{item.scenario3PostTaxValue ? formatCurrency(item.scenario3PostTaxValue) : 'N/A'}</td>}
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