import os
import logging
import uuid
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session, redirect, url_for

# Import backend modules
from backend.intent_parser import parse_user_prompt
from backend.ai_agent import generate_strategies, optimize_strategy
from backend.data_fetcher import get_stock_data, search_stock
from backend.backtester import run_backtest
from backend.strategy_store import save_strategy, get_user_strategies, get_all_strategies

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

# Ensure data directory exists
if not os.path.exists('data'):
    os.makedirs('data')
    
# Initialize data files if they don't exist
if not os.path.exists('data/all_strategies.json'):
    with open('data/all_strategies.json', 'w') as f:
        json.dump([], f)
        
if not os.path.exists('data/user_strategies.json'):
    with open('data/user_strategies.json', 'w') as f:
        json.dump({}, f)

# User session management
@app.before_request
def check_user_session():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
        logger.debug(f"New user session created: {session['user_id']}")

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/parse_intent', methods=['POST'])
def parse_intent():
    user_prompt = request.json.get('prompt', '')
    try:
        parsed_intent = parse_user_prompt(user_prompt)
        return jsonify(parsed_intent)
    except Exception as e:
        logger.error(f"Error parsing intent: {str(e)}")
        return jsonify({"error": f"Failed to parse intent: {str(e)}"}), 500

@app.route('/generate_strategies', methods=['POST'])
def create_strategies():
    parsed_intent = request.json.get('parsed_intent', {})
    try:
        strategies = generate_strategies(parsed_intent)
        return jsonify(strategies)
    except Exception as e:
        logger.error(f"Error generating strategies: {str(e)}")
        return jsonify({"error": f"Failed to generate strategies: {str(e)}"}), 500

@app.route('/strategy/<strategy_id>')
def strategy_detail(strategy_id):
    strategies = get_all_strategies()
    strategy = next((s for s in strategies if s.get('id') == strategy_id), None)
    
    if not strategy:
        # Try to get from user strategies
        user_strategies = get_user_strategies(session['user_id'])
        strategy = next((s for s in user_strategies if s.get('id') == strategy_id), None)
    
    if strategy:
        return render_template('strategy_detail.html', strategy=strategy)
    return redirect(url_for('index'))

@app.route('/backtest', methods=['POST'])
def backtest():
    data = request.json
    ticker = data.get('ticker', '')
    strategy_params = data.get('strategy_params', {})
    
    try:
        # Get historical data
        stock_data = get_stock_data(ticker, years=5)
        
        # Run backtest
        results = run_backtest(stock_data, strategy_params)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error running backtest: {str(e)}")
        return jsonify({"error": f"Failed to run backtest: {str(e)}"}), 500

@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.json
    ticker = data.get('ticker', '')
    strategy_params = data.get('strategy_params', {})
    optimization_goal = data.get('optimization_goal', 'sharpe')
    
    try:
        # Get historical data
        stock_data = get_stock_data(ticker, years=5)
        
        # Optimize strategy
        optimized_params = optimize_strategy(stock_data, strategy_params, optimization_goal)
        return jsonify(optimized_params)
    except Exception as e:
        logger.error(f"Error optimizing strategy: {str(e)}")
        return jsonify({"error": f"Failed to optimize strategy: {str(e)}"}), 500

@app.route('/save_strategy', methods=['POST'])
def save_user_strategy():
    strategy_data = request.json
    user_id = session['user_id']
    
    # Add metadata
    strategy_data['user_id'] = user_id
    strategy_data['saved_at'] = datetime.now().isoformat()
    strategy_data['id'] = str(uuid.uuid4())
    
    try:
        save_strategy(user_id, strategy_data)
        return jsonify({"success": True, "strategy_id": strategy_data['id']})
    except Exception as e:
        logger.error(f"Error saving strategy: {str(e)}")
        return jsonify({"error": f"Failed to save strategy: {str(e)}"}), 500

@app.route('/library')
def user_library():
    user_id = session['user_id']
    strategies = get_user_strategies(user_id)
    
    # Check if JSON format is requested
    if request.args.get('format') == 'json':
        return jsonify(strategies)
    
    return render_template('user_library.html', strategies=strategies)

@app.route('/search_stock', methods=['GET'])
def search_stock_endpoint():
    query = request.args.get('query', '')
    try:
        results = search_stock(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error searching stock: {str(e)}")
        return jsonify({"error": f"Failed to search stock: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
