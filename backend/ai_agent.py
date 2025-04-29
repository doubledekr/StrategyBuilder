import os
import json
import logging
import uuid
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai = OpenAI(api_key=OPENAI_API_KEY)

def generate_strategies(parsed_intent):
    """
    Generate three trading strategies based on the parsed intent.
    
    Args:
        parsed_intent (dict): The structured fields from the intent parser
        
    Returns:
        list: Three trading strategies as JSON
    """
    logger.debug(f"Generating strategies for intent: {parsed_intent}")
    
    system_message = """
    You are an expert financial analyst and algorithmic trading specialist.
    Based on the user's trading strategy intent, generate three distinct, practical, and backtestable trading strategies.
    
    For each strategy, provide the following in a JSON format:
    1. strategy_name: A catchy, descriptive name
    2. description: A brief explanation of the strategy (2-3 sentences)
    3. entry_rules: Specific, quantifiable conditions for entering a position (at least 2-3 rules)
    4. exit_rules: Specific, quantifiable conditions for exiting a position (at least 2-3 rules)
    5. risk_management: Rules for managing risk (stop loss, position sizing, etc.)
    6. target_stocks: Description of suitable stock types for this strategy
    7. expected_behavior: How the strategy is expected to perform in different market conditions
    8. parameters: A JSON object containing adjustable parameters with reasonable defaults:
       - Include at least 5-8 parameters that can be modified
       - Each parameter should have a default value, min, max, and step
       - Parameter types: moving averages periods, RSI levels, profit targets, stop losses, etc.
       - For example: {"ma_fast": {"default": 10, "min": 5, "max": 50, "step": 1}, ...}
    
    Generate three distinct strategies that align with the user's goal, risk level, time horizon, and style.
    Make the strategies actually implementable with clear, quantifiable rules that can be backtested.
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": json.dumps(parsed_intent)}
            ],
            response_format={"type": "json_object"}
        )
        
        strategies_data = json.loads(response.choices[0].message.content)
        
        # Ensure we have strategies property with an array
        if not isinstance(strategies_data, dict) or not strategies_data.get('strategies'):
            if isinstance(strategies_data, list):
                strategies_data = {"strategies": strategies_data}
            else:
                strategies_data = {"strategies": [strategies_data]}
        
        # Add unique IDs to each strategy
        for strategy in strategies_data['strategies']:
            strategy['id'] = str(uuid.uuid4())
        
        # Save to all_strategies.json
        try:
            with open('data/all_strategies.json', 'r') as f:
                all_strategies = json.load(f)
            
            all_strategies.extend(strategies_data['strategies'])
            
            with open('data/all_strategies.json', 'w') as f:
                json.dump(all_strategies, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving generated strategies: {str(e)}")
        
        logger.debug(f"Generated {len(strategies_data['strategies'])} strategies")
        return strategies_data['strategies']
        
    except Exception as e:
        logger.error(f"Error generating strategies: {str(e)}")
        raise Exception(f"Failed to generate strategies: {str(e)}")

def optimize_strategy(stock_data, strategy_params, optimization_goal='sharpe'):
    """
    Optimize the strategy parameters based on historical data.
    
    Args:
        stock_data (dict): Historical stock data
        strategy_params (dict): Current strategy parameters
        optimization_goal (str): Metric to optimize for (sharpe, return, drawdown)
        
    Returns:
        dict: Optimized strategy parameters
    """
    logger.debug(f"Optimizing strategy with goal: {optimization_goal}")
    
    system_message = f"""
    You are an expert in algorithmic trading and strategy optimization.
    Based on the provided historical stock data summary and the current strategy parameters,
    suggest optimized parameters to maximize the {optimization_goal} ratio.
    
    Current strategy parameters: {json.dumps(strategy_params)}
    
    Analyze the data patterns and suggest improved parameter values that would likely 
    enhance the strategy's performance for the optimization goal.
    
    Respond with a JSON object containing the optimized parameters, maintaining the same
    structure as the input parameters but with improved values.
    """
    
    # Create a summary of the stock data for the prompt
    data_summary = {
        "ticker": stock_data.get("ticker", "Unknown"),
        "period": f"{stock_data.get('start_date', 'Unknown')} to {stock_data.get('end_date', 'Unknown')}",
        "data_points": len(stock_data.get("prices", [])),
        "price_range": {
            "min": min(stock_data.get("prices", [0])) if stock_data.get("prices") else 0,
            "max": max(stock_data.get("prices", [0])) if stock_data.get("prices") else 0
        },
        "trends": "The data shows typical market cycles with both uptrends and downtrends."
    }
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": json.dumps(data_summary)}
            ],
            response_format={"type": "json_object"}
        )
        
        optimized_params = json.loads(response.choices[0].message.content)
        logger.debug(f"Optimized parameters generated: {optimized_params}")
        
        return optimized_params
        
    except Exception as e:
        logger.error(f"Error optimizing strategy: {str(e)}")
        raise Exception(f"Failed to optimize strategy: {str(e)}")
