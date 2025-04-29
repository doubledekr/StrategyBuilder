// Library page JavaScript for managing saved strategies

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const strategiesContainer = document.getElementById('strategies-container');
    const strategyCards = document.getElementById('strategy-cards');
    const strategiesLoading = document.getElementById('strategies-loading');
    const noStrategiesMessage = document.getElementById('no-strategies-message');
    const strategySearch = document.getElementById('strategy-search');
    const searchBtn = document.getElementById('search-btn');
    const sessionIdEl = document.getElementById('session-id');
    const totalStrategiesEl = document.getElementById('total-strategies');
    const lastCreatedEl = document.getElementById('last-created');
    
    // Deletion modal elements
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    const deleteStrategyName = document.getElementById('delete-strategy-name');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    // Performance chart
    let performanceChart = null;
    
    // Store all loaded strategies
    let userStrategies = [];
    let selectedStrategies = [];
    
    // Initialize
    loadUserStrategies();
    displaySessionInfo();
    
    // Event Listeners
    searchBtn.addEventListener('click', filterStrategies);
    strategySearch.addEventListener('input', filterStrategies);
    confirmDeleteBtn.addEventListener('click', deleteSelectedStrategy);
    
    // Load user strategies
    async function loadUserStrategies() {
        try {
            // Simulate fetch from server (already rendered by Flask in the template)
            const response = await fetch('/library?format=json', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).catch(error => {
                console.log('Using DOM-embedded strategies, API fetch not implemented yet');
                return { ok: false };
            });
            
            // If API is available, use it
            if (response && response.ok) {
                userStrategies = await response.json();
                renderStrategies(userStrategies);
            } else {
                // Otherwise try to get data from a script tag (common pattern)
                const scriptData = document.querySelector('script#library-data');
                if (scriptData) {
                    userStrategies = JSON.parse(scriptData.textContent);
                    renderStrategies(userStrategies);
                } else {
                    // Fallback to just making a direct API call
                    const libraryData = await fetchUserStrategies();
                    userStrategies = libraryData;
                    renderStrategies(userStrategies);
                }
            }
            
            // Update statistics
            updateStatistics(userStrategies);
            
        } catch (error) {
            console.error('Error loading strategies:', error);
            showNoStrategies();
        }
    }
    
    // Fetch user strategies directly from API
    async function fetchUserStrategies() {
        try {
            const response = await fetch('/api/user-strategies', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).catch(error => {
                console.log('Using mock strategies for development');
                return { ok: false };
            });
            
            if (response && response.ok) {
                return await response.json();
            } else {
                // In a production environment, we would show an error
                // For now, we'll just show empty state
                return [];
            }
        } catch (error) {
            console.error('Error fetching user strategies:', error);
            return [];
        }
    }
    
    // Render strategy cards
    function renderStrategies(strategies) {
        // Hide loading state
        strategiesLoading.style.display = 'none';
        
        // Show empty message if no strategies
        if (!strategies || strategies.length === 0) {
            showNoStrategies();
            return;
        }
        
        // Show strategies container
        strategiesContainer.style.display = 'block';
        
        // Clear existing cards
        strategyCards.innerHTML = '';
        
        // Get the template
        const template = document.getElementById('library-card-template');
        
        // Create a card for each strategy
        strategies.forEach(strategy => {
            // Clone the template
            const clone = document.importNode(template.content, true);
            
            // Set unique ID on container
            const container = clone.querySelector('.strategy-card-container');
            container.id = `strategy-${strategy.id}`;
            container.setAttribute('data-strategy-id', strategy.id);
            
            // Fill in data
            clone.querySelector('.strategy-name').textContent = strategy.strategy_name || 'Unnamed Strategy';
            clone.querySelector('.strategy-description').textContent = strategy.description || 'No description available';
            
            // Set ticker and date if available
            const tickerBadge = clone.querySelector('.strategy-ticker');
            const dateBadge = clone.querySelector('.strategy-date');
            
            if (strategy.ticker) {
                tickerBadge.textContent = strategy.ticker;
                tickerBadge.style.display = 'inline-block';
            } else {
                tickerBadge.style.display = 'none';
            }
            
            if (strategy.saved_at) {
                const date = new Date(strategy.saved_at);
                dateBadge.textContent = formatDate(date);
                dateBadge.style.display = 'inline-block';
            } else {
                dateBadge.style.display = 'none';
            }
            
            // Set performance metrics if available
            const returnValue = clone.querySelector('.strategy-return');
            const sharpeValue = clone.querySelector('.strategy-sharpe');
            const tradesValue = clone.querySelector('.strategy-trades');
            
            if (strategy.backtest_results && strategy.backtest_results.metrics) {
                const metrics = strategy.backtest_results.metrics;
                
                returnValue.textContent = `${metrics.total_return}%`;
                returnValue.className = `highlight-value ${metrics.total_return >= 0 ? 'text-success' : 'text-danger'}`;
                
                sharpeValue.textContent = metrics.sharpe_ratio;
                
                tradesValue.textContent = metrics.num_trades;
            } else {
                returnValue.textContent = 'N/A';
                sharpeValue.textContent = 'N/A';
                tradesValue.textContent = 'N/A';
            }
            
            // Add event listeners
            const viewBtn = clone.querySelector('.view-strategy');
            viewBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = `/strategy/${strategy.id}`;
            });
            
            const deleteBtn = clone.querySelector('.delete-strategy');
            deleteBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showDeleteModal(strategy);
            });
            
            const compareCheckbox = clone.querySelector('.compare-checkbox');
            compareCheckbox.value = strategy.id;
            compareCheckbox.addEventListener('change', function() {
                toggleCompareStrategy(strategy, this.checked);
            });
            
            // Append the card to the container
            strategyCards.appendChild(clone);
        });
    }
    
    // Show "no strategies" message
    function showNoStrategies() {
        strategiesLoading.style.display = 'none';
        strategiesContainer.style.display = 'none';
        noStrategiesMessage.style.display = 'block';
    }
    
    // Filter strategies based on search input
    function filterStrategies() {
        const searchTerm = strategySearch.value.toLowerCase().trim();
        
        if (!searchTerm) {
            // If no search term, show all strategies
            renderStrategies(userStrategies);
            return;
        }
        
        // Filter strategies that match the search term
        const filteredStrategies = userStrategies.filter(strategy => {
            const name = (strategy.strategy_name || '').toLowerCase();
            const description = (strategy.description || '').toLowerCase();
            const ticker = (strategy.ticker || '').toLowerCase();
            
            return name.includes(searchTerm) || 
                   description.includes(searchTerm) || 
                   ticker.includes(searchTerm);
        });
        
        // Render filtered strategies
        renderStrategies(filteredStrategies);
    }
    
    // Show delete confirmation modal
    function showDeleteModal(strategy) {
        deleteStrategyName.textContent = strategy.strategy_name || 'Unnamed Strategy';
        
        // Set the current strategy ID on the confirm button
        confirmDeleteBtn.setAttribute('data-strategy-id', strategy.id);
        
        // Show the modal
        deleteModal.show();
    }
    
    // Delete the selected strategy
    async function deleteSelectedStrategy() {
        const strategyId = confirmDeleteBtn.getAttribute('data-strategy-id');
        
        if (!strategyId) {
            console.error('No strategy ID found');
            return;
        }
        
        try {
            // Make API call to delete strategy
            const response = await fetch(`/delete_strategy/${strategyId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Close the modal
            deleteModal.hide();
            
            if (response.ok) {
                // Remove the strategy from our list
                userStrategies = userStrategies.filter(s => s.id !== strategyId);
                
                // Remove the strategy card from the DOM
                const card = document.querySelector(`.strategy-card-container[data-strategy-id="${strategyId}"]`);
                if (card) {
                    card.remove();
                }
                
                // Update the performance chart if needed
                selectedStrategies = selectedStrategies.filter(s => s.id !== strategyId);
                updatePerformanceChart();
                
                // Update statistics
                updateStatistics(userStrategies);
                
                // Show "no strategies" message if no strategies left
                if (userStrategies.length === 0) {
                    showNoStrategies();
                }
                
                // Show success notification
                alert('Strategy deleted successfully');
            } else {
                throw new Error('Failed to delete strategy');
            }
        } catch (error) {
            console.error('Error deleting strategy:', error);
            alert('Error deleting strategy: ' + error.message);
        }
    }
    
    // Toggle strategy for comparison in chart
    function toggleCompareStrategy(strategy, isSelected) {
        if (isSelected) {
            // Add to selected strategies
            selectedStrategies.push(strategy);
        } else {
            // Remove from selected strategies
            selectedStrategies = selectedStrategies.filter(s => s.id !== strategy.id);
        }
        
        // Update the performance chart
        updatePerformanceChart();
    }
    
    // Update the performance comparison chart
    function updatePerformanceChart() {
        // Check if we have strategies to compare
        if (selectedStrategies.length === 0) {
            // No strategies selected
            if (performanceChart) {
                performanceChart.destroy();
                performanceChart = null;
            }
            
            document.getElementById('chart-info').textContent = 'Select strategies to compare their performance';
            return;
        }
        
        // Prepare data for the chart
        const datasets = [];
        const colors = [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)'
        ];
        
        // Create a dataset for each selected strategy
        selectedStrategies.forEach((strategy, index) => {
            // Skip if no backtest results
            if (!strategy.backtest_results || !strategy.backtest_results.portfolio_values) {
                return;
            }
            
            const color = colors[index % colors.length];
            const portfolioValues = strategy.backtest_results.portfolio_values;
            
            datasets.push({
                label: strategy.strategy_name || `Strategy ${index + 1}`,
                data: portfolioValues,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.2)'),
                tension: 0.1,
                fill: false
            });
        });
        
        // No valid datasets
        if (datasets.length === 0) {
            document.getElementById('chart-info').textContent = 'No performance data available for selected strategies';
            return;
        }
        
        // Create/update the chart
        const ctx = document.getElementById('performance-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (performanceChart) {
            performanceChart.destroy();
        }
        
        // Create new chart
        performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: generateTimeLabels(Math.max(...selectedStrategies.map(s => 
                    s.backtest_results && s.backtest_results.portfolio_values ? 
                    s.backtest_results.portfolio_values.length : 0))),
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
            }
        });
        
        // Update info text
        document.getElementById('chart-info').textContent = `Comparing ${datasets.length} strategies`;
    }
    
    // Generate time labels for the chart
    function generateTimeLabels(length) {
        const labels = [];
        for (let i = 0; i < length; i++) {
            labels.push(`Day ${i + 1}`);
        }
        return labels;
    }
    
    // Display session information
    function displaySessionInfo() {
        // Display session ID (get from a data attribute, cookie, or server-rendered variable)
        const sessionId = document.querySelector('meta[name="session-id"]')?.getAttribute('content') || 
                        getCookie('user_session_id') || 
                        'Anonymous';
        
        sessionIdEl.textContent = sessionId.substring(0, 8) + '...';
    }
    
    // Update statistics
    function updateStatistics(strategies) {
        // Total strategies
        totalStrategiesEl.textContent = strategies.length;
        
        // Last created
        if (strategies.length > 0) {
            // Sort by saved_at date
            const sortedStrategies = [...strategies].sort((a, b) => {
                const dateA = a.saved_at ? new Date(a.saved_at) : new Date(0);
                const dateB = b.saved_at ? new Date(b.saved_at) : new Date(0);
                return dateB - dateA;
            });
            
            const latestStrategy = sortedStrategies[0];
            
            if (latestStrategy.saved_at) {
                const date = new Date(latestStrategy.saved_at);
                lastCreatedEl.textContent = formatDate(date);
            } else {
                lastCreatedEl.textContent = 'N/A';
            }
        } else {
            lastCreatedEl.textContent = 'N/A';
        }
    }
    
    // Format date
    function formatDate(date) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    }
    
    // Helper to get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
});
