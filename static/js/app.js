// Main app JavaScript for the homepage

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const promptForm = document.getElementById('promptForm');
    const userPromptInput = document.getElementById('userPrompt');
    const generateBtn = document.getElementById('generateBtn');
    const parsedIntentContainer = document.getElementById('parsed-intent-container');
    const loadingContainer = document.getElementById('loading-container');
    const strategiesContainer = document.getElementById('strategies-container');
    const strategyCards = document.getElementById('strategy-cards');
    const editPromptBtn = document.getElementById('editPromptBtn');
    const examplePromptBtns = document.querySelectorAll('.example-prompt-btn');
    
    // Intent display elements
    const intentSummary = document.getElementById('intent-summary');
    const intentGoal = document.getElementById('intent-goal');
    const intentRiskLevel = document.getElementById('intent-risk-level');
    const intentTimeHorizon = document.getElementById('intent-time-horizon');
    const intentStyle = document.getElementById('intent-style');
    
    // Loading messages
    const loadingMessages = [
        "Analyzing market patterns",
        "Examining trading signals",
        "Calculating optimal parameters",
        "Evaluating risk profiles",
        "Generating entry and exit rules",
        "Crafting backtestable strategies"
    ];
    
    // Event Listeners
    promptForm.addEventListener('submit', handlePromptSubmission);
    editPromptBtn.addEventListener('click', editPrompt);
    
    // Example prompt buttons
    examplePromptBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            userPromptInput.value = this.getAttribute('data-prompt');
        });
    });
    
    // Store generated strategies
    let currentStrategies = [];
    let parsedIntent = {};
    
    // Handle prompt submission
    async function handlePromptSubmission(event) {
        event.preventDefault();
        
        const userPrompt = userPromptInput.value.trim();
        
        if (!userPrompt) {
            alert('Please enter a description of your trading strategy.');
            return;
        }
        
        // Update UI for loading state
        showLoadingState();
        
        try {
            // Step 1: Parse user intent
            parsedIntent = await parseUserIntent(userPrompt);
            
            // Display parsed intent
            displayParsedIntent(parsedIntent);
            
            // Update loading message
            updateLoadingMessage("Generating strategies...", "Creating tailored trading strategies based on your request");
            
            // Step 2: Generate strategies based on parsed intent
            currentStrategies = await generateStrategies(parsedIntent);
            
            // Display strategies
            displayStrategies(currentStrategies);
            
            // Hide loading, show strategies
            loadingContainer.style.display = 'none';
            strategiesContainer.style.display = 'block';
            
        } catch (error) {
            console.error('Error:', error);
            loadingContainer.style.display = 'none';
            alert('An error occurred: ' + error.message);
        }
    }
    
    // Parse user intent using API
    async function parseUserIntent(userPrompt) {
        try {
            const response = await fetch('/parse_intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: userPrompt })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to parse intent');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error parsing intent:', error);
            throw error;
        }
    }
    
    // Generate strategies based on parsed intent
    async function generateStrategies(parsedIntent) {
        try {
            const response = await fetch('/generate_strategies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ parsed_intent: parsedIntent })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate strategies');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error generating strategies:', error);
            throw error;
        }
    }
    
    // Show loading state
    function showLoadingState() {
        promptForm.style.display = 'none';
        parsedIntentContainer.style.display = 'none';
        strategiesContainer.style.display = 'none';
        loadingContainer.style.display = 'block';
        
        // Start rotating loading messages
        updateLoadingMessage("Parsing your request...", "Analyzing your trading strategy requirements");
        startLoadingMessageRotation();
    }
    
    // Rotate loading messages
    function startLoadingMessageRotation() {
        let index = 0;
        const loadingSubstatus = document.getElementById('loading-substatus');
        
        const intervalId = setInterval(() => {
            loadingSubstatus.textContent = loadingMessages[index];
            index = (index + 1) % loadingMessages.length;
            
            // Clear interval when loading is done (check if container is hidden)
            if (loadingContainer.style.display === 'none') {
                clearInterval(intervalId);
            }
        }, 3000);
    }
    
    // Update loading message
    function updateLoadingMessage(mainMessage, subMessage) {
        document.getElementById('loading-message').textContent = mainMessage;
        document.getElementById('loading-substatus').textContent = subMessage;
    }
    
    // Display parsed intent
    function displayParsedIntent(intent) {
        intentSummary.textContent = intent.summary || 'Strategy based on your requirements';
        intentGoal.textContent = intent.goal || 'Not specified';
        intentRiskLevel.textContent = intent.risk_level || 'Not specified';
        intentTimeHorizon.textContent = intent.time_horizon || 'Not specified';
        intentStyle.textContent = intent.style || 'Not specified';
        
        parsedIntentContainer.style.display = 'block';
    }
    
    // Display strategies as cards
    function displayStrategies(strategies) {
        // Clear existing cards
        strategyCards.innerHTML = '';
        
        // Get the template
        const template = document.getElementById('strategy-card-template');
        
        strategies.forEach(strategy => {
            // Clone the template
            const clone = document.importNode(template.content, true);
            
            // Fill in data
            clone.querySelector('.strategy-name').textContent = strategy.strategy_name;
            clone.querySelector('.strategy-description').textContent = strategy.description;
            
            // Entry rules
            const entryRulesList = clone.querySelector('.entry-rules');
            if (typeof strategy.entry_rules === 'string') {
                // Handle case where entry_rules is a string
                const li = document.createElement('li');
                li.textContent = strategy.entry_rules;
                entryRulesList.appendChild(li);
            } else if (Array.isArray(strategy.entry_rules)) {
                // Handle case where entry_rules is an array
                strategy.entry_rules.forEach(rule => {
                    const li = document.createElement('li');
                    li.textContent = rule;
                    entryRulesList.appendChild(li);
                });
            }
            
            // Exit rules
            const exitRulesList = clone.querySelector('.exit-rules');
            if (typeof strategy.exit_rules === 'string') {
                const li = document.createElement('li');
                li.textContent = strategy.exit_rules;
                exitRulesList.appendChild(li);
            } else if (Array.isArray(strategy.exit_rules)) {
                strategy.exit_rules.forEach(rule => {
                    const li = document.createElement('li');
                    li.textContent = rule;
                    exitRulesList.appendChild(li);
                });
            }
            
            // Risk management
            const riskManagementList = clone.querySelector('.risk-management');
            if (typeof strategy.risk_management === 'string') {
                const li = document.createElement('li');
                li.textContent = strategy.risk_management;
                riskManagementList.appendChild(li);
            } else if (Array.isArray(strategy.risk_management)) {
                strategy.risk_management.forEach(rule => {
                    const li = document.createElement('li');
                    li.textContent = rule;
                    riskManagementList.appendChild(li);
                });
            }
            
            // Target stocks
            clone.querySelector('.target-stocks').textContent = strategy.target_stocks || 'Any stocks';
            
            // Add action to select button
            const selectBtn = clone.querySelector('.select-strategy-btn');
            selectBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = `/strategy/${strategy.id}`;
            });
            
            // Append the card to the container
            strategyCards.appendChild(clone);
        });
    }
    
    // Edit prompt function
    function editPrompt() {
        parsedIntentContainer.style.display = 'none';
        strategiesContainer.style.display = 'none';
        promptForm.style.display = 'block';
    }
});
