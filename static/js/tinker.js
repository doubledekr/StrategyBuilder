// Strategy tinkering and backtest JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const strategyParamsForm = document.getElementById('strategy-params-form');
    const paramsContainer = document.getElementById('params-container');
    const tickerInput = document.getElementById('ticker-input');
    const tickerSearch = document.getElementById('ticker-search');
    const tickerSuggestions = document.getElementById('ticker-suggestions');
    const runBacktestBtn = document.getElementById('run-backtest-btn');
    const optimizeBtn = document.getElementById('optimize-btn');
    const saveStrategyForm = document.getElementById('save-strategy-form');
    const saveStrategyCard = document.getElementById('save-strategy-card');
    
    // Backtest result elements
    const backtestLoading = document.getElementById('backtest-loading');
    const backtestResults = document.getElementById('backtest-results');
    const noBacktestMessage = document.getElementById('no-backtest-message');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    // Performance metrics elements
    const metricTotalReturn = document.getElementById('metric-total-return');
    const metricCagr = document.getElementById('metric-cagr');
    const metricSharpe = document.getElementById('metric-sharpe');
    const metricDrawdown = document.getElementById('metric-drawdown');
    const metricWinrate = document.getElementById('metric-winrate');
    const metricTrades = document.getElementById('metric-trades');
    
    // Trade history table
    const tradeHistory = document.getElementById('trade-history');
    
    // Chart
    let equityChart = null;
    
    // Current strategy and backtest results
    let currentStrategy = null;
    let currentBacktestResults = null;
    
    // Get strategy from URL
    const strategyId = window.location.pathname.split('/').pop();
    
    // Load strategy on page load
    loadStrategy(strategyId);
    
    // Event Listeners
    strategyParamsForm.addEventListener('submit', runBacktest);
    optimizeBtn.addEventListener('click', optimizeStrategy);
    saveStrategyForm.addEventListener('submit', saveStrategy);
    tickerSearch.addEventListener('click', searchTicker);
    tickerInput.addEventListener('input', function() {
        if (this.value.length >= 2) {
            searchTicker();
        } else {
            tickerSuggestions.style.display = 'none';
        }
    });
    
    // Fetch and display strategy details
    async function loadStrategy(strategyId) {
        try {
            // We'll query the DOM for this info since we're using server-side rendering
            const strategyName = document.getElementById('strategy-name');
            const strategyDescription = document.getElementById('strategy-description');
            
            // Extract strategy info from the DOM structure or from the server
            // This assumes the strategy is already rendered in the HTML by the server
            
            // If we need to fetch the strategy from the server
            const response = await fetch(`/api/strategies/${strategyId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).catch(error => {
                console.log('Strategy will be extracted from page data, API fetch not implemented yet');
                return { ok: false };
            });
            
            // If we have a direct API, use it
            if (response && response.ok) {
                currentStrategy = await response.json();
                renderStrategy(currentStrategy);
            } else {
                // Otherwise, try to extract from the page data
                // This is a workaround since the strategy details should have been 
                // rendered server-side by Flask in the strategy_detail template
                
                // Get strategy data from a script tag (commonly done for page data)
                const scriptData = document.querySelector('script#strategy-data');
                if (scriptData) {
                    currentStrategy = JSON.parse(scriptData.textContent);
                    renderStrategy(currentStrategy);
                } else {
                    // Fallback to whatever we have available
                    // This is not ideal, but should work for demonstrative purposes
                    currentStrategy = window.strategyData || {
                        id: strategyId,
                        strategy_name: strategyName.textContent,
                        description: strategyDescription.textContent,
                        parameters: {} // This would normally come from the server
                    };
                    
                    // For demo purposes, if we don't have parameters
                    if (!currentStrategy.parameters || Object.keys(currentStrategy.parameters).length === 0) {
                        currentStrategy.parameters = {
                            ma_fast: { default: 10, min: 2, max: 50, step: 1, description: "Fast Moving Average Period" },
                            ma_slow: { default: 50, min: 10, max: 200, step: 1, description: "Slow Moving Average Period" },
                            rsi_period: { default: 14, min: 2, max: 30, step: 1, description: "RSI Period" },
                            rsi_oversold: { default: 30, min: 10, max: 40, step: 1, description: "RSI Oversold Level" },
                            rsi_overbought: { default: 70, min: 60, max: 90, step: 1, description: "RSI Overbought Level" },
                            stop_loss_pct: { default: 5, min: 1, max: 20, step: 0.5, description: "Stop Loss Percentage" },
                            take_profit_pct: { default: 10, min: 2, max: 50, step: 0.5, description: "Take Profit Percentage" },
                            position_size: { default: 1.0, min: 0.1, max: 1, step: 0.1, description: "Position Size (0.1-1.0)" }
                        };
                    }
                    
                    renderStrategy(currentStrategy);
                }
            }
        } catch (error) {
            console.error('Error loading strategy:', error);
            showError(`Error loading strategy: ${error.message}`);
        }
    }
    
    // Render strategy details and parameter controls
    function renderStrategy(strategy) {
        // Update strategy details
        document.getElementById('strategy-name').textContent = strategy.strategy_name || 'Strategy Details';
        document.getElementById('strategy-description').textContent = strategy.description || 'No description available';
        
        // Render parameter controls
        renderParameterControls(strategy.parameters);
        
        // Update strategy save name default
        document.getElementById('strategy-save-name').value = strategy.strategy_name || '';
    }
    
    // Render parameter controls based on strategy parameters
    function renderParameterControls(parameters) {
        // Clear existing controls
        paramsContainer.innerHTML = '';
        
        // Get template
        const template = document.getElementById('param-template');
        
        // Create controls for each parameter
        Object.entries(parameters).forEach(([paramName, paramConfig]) => {
            // Skip parameter if it doesn't have necessary properties
            if (!paramConfig.default || !paramConfig.min || !paramConfig.max) {
                return;
            }
            
            // Clone template
            const paramControl = document.importNode(template.content, true);
            
            // Set unique IDs
            const controlId = `param-${paramName}`;
            
            // Update label
            const label = paramControl.querySelector('.param-label');
            label.textContent = formatParamName(paramName);
            label.setAttribute('for', controlId);
            
            // Update slider
            const slider = paramControl.querySelector('.param-slider');
            slider.id = controlId;
            slider.setAttribute('min', paramConfig.min);
            slider.setAttribute('max', paramConfig.max);
            slider.setAttribute('step', paramConfig.step || 1);
            slider.setAttribute('value', paramConfig.default);
            slider.setAttribute('data-param-name', paramName);
            
            // Update value input
            const valueInput = paramControl.querySelector('.param-value');
            valueInput.id = `${controlId}-value`;
            valueInput.setAttribute('min', paramConfig.min);
            valueInput.setAttribute('max', paramConfig.max);
            valueInput.setAttribute('step', paramConfig.step || 1);
            valueInput.value = paramConfig.default;
            valueInput.setAttribute('data-param-name', paramName);
            
            // Update description
            const description = paramControl.querySelector('.param-description');
            description.textContent = paramConfig.description || '';
            
            // Sync slider and input
            slider.addEventListener('input', function() {
                valueInput.value = this.value;
            });
            
            valueInput.addEventListener('input', function() {
                slider.value = this.value;
            });
            
            // Add to container
            paramsContainer.appendChild(paramControl);
        });
    }
    
    // Format parameter name for display
    function formatParamName(paramName) {
        return paramName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    // Search for ticker symbols
    async function searchTicker() {
        const query = tickerInput.value.trim();
        
        if (query.length < 2) {
            tickerSuggestions.style.display = 'none';
            return;
        }
        
        try {
            const response = await fetch(`/search_stock?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to search stocks');
            }
            
            const results = await response.json();
            
            // Clear suggestions
            tickerSuggestions.innerHTML = '';
            
            if (results.length === 0) {
                tickerSuggestions.style.display = 'none';
                return;
            }
            
            // Get template
            const template = document.getElementById('ticker-suggestion-template');
            
            // Add suggestions
            results.forEach(stock => {
                // Clone template
                const suggestion = document.importNode(template.content, true);
                
                // Fill data
                suggestion.querySelector('.ticker-symbol').textContent = stock.symbol;
                suggestion.querySelector('.ticker-name').textContent = stock.name;
                suggestion.querySelector('.ticker-exchange').textContent = stock.exchange;
                
                // Add click handler
                const button = suggestion.querySelector('.ticker-suggestion');
                button.addEventListener('click', function() {
                    tickerInput.value = stock.symbol;
                    tickerSuggestions.style.display = 'none';
                });
                
                // Add to container
                tickerSuggestions.appendChild(suggestion);
            });
            
            // Show suggestions
            tickerSuggestions.style.display = 'block';
            
        } catch (error) {
            console.error('Error searching stocks:', error);
            // Continue without showing suggestions
            tickerSuggestions.style.display = 'none';
        }
    }
    
    // Run backtest with current parameters
    async function runBacktest(event) {
        event.preventDefault();
        
        const ticker = tickerInput.value.trim().toUpperCase();
        
        if (!ticker) {
            showError('Please enter a stock ticker symbol.');
            return;
        }
        
        // Show loading state
        showBacktestLoading();
        
        try {
            // Collect parameter values
            const strategyParams = collectStrategyParams();
            
            // Add ticker to params
            strategyParams.ticker = ticker;
            
            // Run backtest
            const response = await fetch('/backtest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticker: ticker,
                    strategy_params: strategyParams
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to run backtest');
            }
            
            const results = await response.json();
            
            // Store current results
            currentBacktestResults = results;
            
            // Display results
            displayBacktestResults(results);
            
            // Show save strategy card
            saveStrategyCard.style.display = 'block';
            
        } catch (error) {
            console.error('Error running backtest:', error);
            showError(`Error running backtest: ${error.message}`);
        }
    }
    
    // Collect strategy parameters from form
    function collectStrategyParams() {
        const params = {};
        
        // Get all parameter inputs
        const paramInputs = document.querySelectorAll('.param-value');
        
        // Collect values
        paramInputs.forEach(input => {
            const paramName = input.getAttribute('data-param-name');
            const paramValue = parseFloat(input.value);
            params[paramName] = paramValue;
        });
        
        return params;
    }
    
    // Optimize strategy parameters using AI
    async function optimizeStrategy() {
        const ticker = tickerInput.value.trim().toUpperCase();
        
        if (!ticker) {
            showError('Please enter a stock ticker symbol before optimizing.');
            return;
        }
        
        // Show loading state
        showBacktestLoading();
        
        try {
            // Collect current parameters
            const strategyParams = collectStrategyParams();
            
            // Call optimize endpoint
            const response = await fetch('/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticker: ticker,
                    strategy_params: strategyParams,
                    optimization_goal: 'sharpe'  // Default to Sharpe ratio
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to optimize strategy');
            }
            
            const optimizedParams = await response.json();
            
            // Update form with optimized parameters
            updateParamsWithOptimized(optimizedParams);
            
            // Hide loading
            hideBacktestLoading();
            
            // Show success message
            alert('Strategy optimized! Parameters have been updated. Click "Run Backtest" to see the results.');
            
        } catch (error) {
            console.error('Error optimizing strategy:', error);
            showError(`Error optimizing strategy: ${error.message}`);
        }
    }
    
    // Update form parameters with optimized values
    function updateParamsWithOptimized(optimizedParams) {
        // For each optimized parameter
        Object.entries(optimizedParams).forEach(([paramName, paramValue]) => {
            // Find the corresponding slider and value input
            const slider = document.querySelector(`.param-slider[data-param-name="${paramName}"]`);
            const valueInput = document.querySelector(`.param-value[data-param-name="${paramName}"]`);
            
            // Update if found
            if (slider && valueInput) {
                slider.value = paramValue;
                valueInput.value = paramValue;
            }
        });
    }
    
    // Save strategy to user library
    async function saveStrategy(event) {
        event.preventDefault();
        
        // Check if we have backtest results
        if (!currentBacktestResults) {
            showError('Please run a backtest before saving the strategy.');
            return;
        }
        
        const strategyName = document.getElementById('strategy-save-name').value.trim();
        const strategyNotes = document.getElementById('strategy-save-notes').value.trim();
        
        if (!strategyName) {
            showError('Please enter a name for your strategy.');
            return;
        }
        
        // Create strategy data object
        const strategyData = {
            ...currentStrategy,
            strategy_name: strategyName,
            notes: strategyNotes,
            parameters: collectStrategyParams(),
            ticker: tickerInput.value.trim().toUpperCase(),
            backtest_results: currentBacktestResults
        };
        
        try {
            // Save strategy
            const response = await fetch('/save_strategy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(strategyData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save strategy');
            }
            
            const result = await response.json();
            
            // Show success message and redirect to library
            alert('Strategy saved successfully!');
            window.location.href = '/library';
            
        } catch (error) {
            console.error('Error saving strategy:', error);
            showError(`Error saving strategy: ${error.message}`);
        }
    }
    
    // Display backtest results
    function displayBacktestResults(results) {
        // Update performance metrics
        metricTotalReturn.textContent = `${results.metrics.total_return}%`;
        metricCagr.textContent = `${results.metrics.cagr}%`;
        metricSharpe.textContent = results.metrics.sharpe_ratio;
        metricDrawdown.textContent = `${results.metrics.max_drawdown}%`;
        metricWinrate.textContent = `${results.metrics.win_rate}%`;
        metricTrades.textContent = results.metrics.num_trades;
        
        // Add Buy and Hold comparison metric if available
        if (results.metrics.vs_buy_hold !== undefined) {
            const vsBuyHoldElement = document.getElementById('metric-vs-buy-hold');
            if (vsBuyHoldElement) {
                vsBuyHoldElement.textContent = `${results.metrics.vs_buy_hold}%`;
                vsBuyHoldElement.className = results.metrics.vs_buy_hold >= 0 ? 'text-success' : 'text-danger';
            }
        }
        
        // Color-code metrics
        metricTotalReturn.className = results.metrics.total_return >= 0 ? 'text-success' : 'text-danger';
        metricCagr.className = results.metrics.cagr >= 0 ? 'text-success' : 'text-danger';
        
        // Update trade history
        populateTradeHistory(results.trades);
        
        // Update equity chart with buy and hold comparison
        createEquityChartWithBuyHold(results.portfolio_values, results.buy_hold_values, results.dates);
        
        // Show results
        hideBacktestLoading();
        backtestResults.style.display = 'block';
        noBacktestMessage.style.display = 'none';
        errorMessage.style.display = 'none';
    }
    
    // Populate trade history table
    function populateTradeHistory(trades) {
        // Clear existing rows
        tradeHistory.innerHTML = '';
        
        // Add trade rows
        trades.forEach(trade => {
            const row = document.createElement('tr');
            
            // Type cell with badge
            const typeCell = document.createElement('td');
            const typeBadge = document.createElement('span');
            typeBadge.classList.add('badge', trade.type === 'entry' ? 'bg-success' : 'bg-danger');
            typeBadge.textContent = trade.type === 'entry' ? 'Buy' : 'Sell';
            typeCell.appendChild(typeBadge);
            row.appendChild(typeCell);
            
            // Date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = trade.date || 'N/A';
            row.appendChild(dateCell);
            
            // Price cell
            const priceCell = document.createElement('td');
            priceCell.textContent = trade.price ? `$${trade.price.toFixed(2)}` : 'N/A';
            row.appendChild(priceCell);
            
            // Shares cell
            const sharesCell = document.createElement('td');
            sharesCell.textContent = trade.shares ? trade.shares.toFixed(4) : 'N/A';
            row.appendChild(sharesCell);
            
            // Value cell
            const valueCell = document.createElement('td');
            valueCell.textContent = trade.value ? `$${trade.value.toFixed(2)}` : 'N/A';
            row.appendChild(valueCell);
            
            // Add row to table
            tradeHistory.appendChild(row);
        });
    }
    
    // Create equity chart with buy and hold comparison
    function createEquityChartWithBuyHold(portfolioValues, buyHoldValues, dates) {
        // Convert dates for chart if they exist
        const chartLabels = dates || portfolioValues.map((_, i) => `Day ${i+1}`);
        
        // Destroy existing chart if it exists
        if (equityChart) {
            equityChart.destroy();
        }
        
        // Get chart context
        const ctx = document.getElementById('equity-chart').getContext('2d');
        
        // Datasets configuration
        const datasets = [
            {
                label: 'Strategy Performance',
                data: portfolioValues,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }
        ];
        
        // Add buy and hold dataset if available
        if (buyHoldValues && buyHoldValues.length) {
            datasets.push({
                label: 'Buy & Hold',
                data: buyHoldValues,
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                tension: 0.1,
                fill: false,
                borderDash: [5, 5]
            });
        }
        
        // Create chart
        equityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: datasets
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
                            text: 'Date'
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
    
    // Legacy function for compatibility
    function createEquityChart(portfolioValues, dates) {
        createEquityChartWithBuyHold(portfolioValues, null, dates);
    }
    
    // Show loading state for backtest
    function showBacktestLoading() {
        backtestLoading.style.display = 'block';
        backtestResults.style.display = 'none';
        noBacktestMessage.style.display = 'none';
        errorMessage.style.display = 'none';
    }
    
    // Hide loading state for backtest
    function hideBacktestLoading() {
        backtestLoading.style.display = 'none';
    }
    
    // Show error message
    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        backtestLoading.style.display = 'none';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});
