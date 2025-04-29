// Chart.js utility functions for visualization

/**
 * Creates a portfolio equity chart
 * @param {string} canvasId - The ID of the canvas element
 * @param {Array} portfolioValues - Array of portfolio values
 * @param {Array} dates - Array of dates (optional)
 * @param {object} options - Additional chart options
 * @returns {Chart} The created Chart.js instance
 */
function createEquityChart(canvasId, portfolioValues, dates, options = {}) {
    // Get canvas context
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            },
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: dates ? 'Date' : 'Time'
                },
                ticks: {
                    maxTicksLimit: 10
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Value ($)'
                },
                beginAtZero: false
            }
        }
    };
    
    // Merge options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Create labels based on dates or default to day numbers
    const labels = dates || portfolioValues.map((_, i) => `Day ${i + 1}`);
    
    // Create the chart
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value',
                data: portfolioValues,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: chartOptions
    });
}

/**
 * Creates a comparison chart for multiple strategies
 * @param {string} canvasId - The ID of the canvas element
 * @param {Array} strategies - Array of strategy objects with portfolio values
 * @param {object} options - Additional chart options
 * @returns {Chart} The created Chart.js instance
 */
function createComparisonChart(canvasId, strategies, options = {}) {
    // Get canvas context
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Default options
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            },
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Time'
                },
                ticks: {
                    maxTicksLimit: 10
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Value'
                }
            }
        }
    };
    
    // Merge options
    const chartOptions = { ...defaultOptions, ...options };
    
    // Colors for different strategies
    const colors = [
        'rgba(75, 192, 192, 1)',  // Teal
        'rgba(255, 99, 132, 1)',  // Pink
        'rgba(54, 162, 235, 1)',  // Blue
        'rgba(255, 206, 86, 1)',  // Yellow
        'rgba(153, 102, 255, 1)'  // Purple
    ];
    
    // Create datasets
    const datasets = strategies.map((strategy, index) => {
        const color = colors[index % colors.length];
        
        return {
            label: strategy.name || `Strategy ${index + 1}`,
            data: strategy.portfolioValues,
            borderColor: color,
            backgroundColor: color.replace('1)', '0.2)'),
            tension: 0.1,
            fill: false
        };
    });
    
    // Find the maximum length of portfolioValues
    const maxLength = Math.max(...strategies.map(s => s.portfolioValues.length));
    
    // Create labels (Day 1, Day 2, etc.)
    const labels = Array.from({ length: maxLength }, (_, i) => `Day ${i + 1}`);
    
    // Create the chart
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Creates a metrics radar chart to compare strategy performance
 * @param {string} canvasId - The ID of the canvas element
 * @param {Array} strategies - Array of strategy objects with metrics
 * @returns {Chart} The created Chart.js instance
 */
function createMetricsRadarChart(canvasId, strategies) {
    // Get canvas context
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Colors for different strategies
    const colors = [
        'rgba(75, 192, 192, 1)',  // Teal
        'rgba(255, 99, 132, 1)',  // Pink
        'rgba(54, 162, 235, 1)',  // Blue
        'rgba(255, 206, 86, 1)',  // Yellow
        'rgba(153, 102, 255, 1)'  // Purple
    ];
    
    // Define metrics to display
    const metrics = [
        { key: 'totalReturn', label: 'Total Return', scale: 1 },   // As is
        { key: 'sharpeRatio', label: 'Sharpe Ratio', scale: 10 },  // Multiply by 10 for visibility
        { key: 'winRate', label: 'Win Rate', scale: 1 },           // As is
        { key: 'maxDrawdown', label: 'Max Drawdown (inv)', scale: -1 }, // Invert (lower is better)
        { key: 'tradesPerYear', label: 'Activity', scale: 0.1 }    // Divide by 10 for visibility
    ];
    
    // Create datasets
    const datasets = strategies.map((strategy, index) => {
        const color = colors[index % colors.length];
        
        // Map metrics to radar values
        const data = metrics.map(metric => {
            const value = strategy.metrics[metric.key] || 0;
            return value * metric.scale;
        });
        
        return {
            label: strategy.name || `Strategy ${index + 1}`,
            data: data,
            borderColor: color,
            backgroundColor: color.replace('1)', '0.2)'),
            borderWidth: 2
        };
    });
    
    // Create the chart
    return new Chart(ctx, {
        type: 'radar',
        data: {
            labels: metrics.map(m => m.label),
            datasets: datasets
        },
        options: {
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                r: {
                    ticks: {
                        backdropColor: 'rgba(0, 0, 0, 0)'
                    }
                }
            }
        }
    });
}

/**
 * Creates a trading activity chart showing trades over time
 * @param {string} canvasId - The ID of the canvas element
 * @param {Array} trades - Array of trade objects
 * @param {Array} portfolioValues - Array of portfolio values
 * @param {Array} dates - Array of dates
 * @returns {Chart} The created Chart.js instance
 */
function createTradeActivityChart(canvasId, trades, portfolioValues, dates) {
    // Get canvas context
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Create labels based on dates or default to day numbers
    const labels = dates || portfolioValues.map((_, i) => `Day ${i + 1}`);
    
    // Map trades to chart points
    const buyPoints = [];
    const sellPoints = [];
    
    trades.forEach(trade => {
        // Find the index for this trade date
        const dateIndex = dates ? dates.indexOf(trade.date) : -1;
        
        if (dateIndex >= 0 && dateIndex < portfolioValues.length) {
            if (trade.type === 'entry') {
                buyPoints.push({
                    x: dateIndex,
                    y: portfolioValues[dateIndex]
                });
            } else if (trade.type === 'exit') {
                sellPoints.push({
                    x: dateIndex,
                    y: portfolioValues[dateIndex]
                });
            }
        }
    });
    
    // Create the chart
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Portfolio Value',
                    data: portfolioValues,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Buy',
                    data: buyPoints,
                    pointBackgroundColor: 'rgba(46, 204, 113, 1)',
                    pointBorderColor: 'rgba(46, 204, 113, 1)',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                },
                {
                    label: 'Sell',
                    data: sellPoints,
                    pointBackgroundColor: 'rgba(231, 76, 60, 1)',
                    pointBorderColor: 'rgba(231, 76, 60, 1)',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: dates ? 'Date' : 'Time'
                    },
                    ticks: {
                        maxTicksLimit: 10
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Value ($)'
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

/**
 * Formats a number as a percentage
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
function formatPercentage(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Formats a number as currency
 * @param {number} value - The number to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency
 */
function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(value);
}

/**
 * Creates a color-coded badge based on a value
 * @param {number} value - The value to evaluate
 * @param {boolean} higherIsBetter - Whether higher values are better
 * @returns {string} HTML string for a bootstrap badge
 */
function createMetricBadge(value, higherIsBetter = true) {
    let badgeClass = 'bg-secondary';
    
    if (value === null || value === undefined || isNaN(value)) {
        return `<span class="badge bg-secondary">N/A</span>`;
    }
    
    if (higherIsBetter) {
        if (value > 0) badgeClass = 'bg-success';
        else if (value < 0) badgeClass = 'bg-danger';
    } else {
        if (value < 0) badgeClass = 'bg-success';
        else if (value > 0) badgeClass = 'bg-danger';
    }
    
    return `<span class="badge ${badgeClass}">${value}</span>`;
}
