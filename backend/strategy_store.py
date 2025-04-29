import os
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def save_strategy(user_id, strategy_data):
    """
    Save a strategy to the user's library.
    
    Args:
        user_id (str): User's unique ID
        strategy_data (dict): Strategy data to save
        
    Returns:
        bool: Success status
    """
    logger.debug(f"Saving strategy for user: {user_id}")
    
    try:
        # Ensure data directory exists
        if not os.path.exists('data'):
            os.makedirs('data')
        
        # Load existing user strategies
        user_strategies = {}
        
        if os.path.exists('data/user_strategies.json'):
            with open('data/user_strategies.json', 'r') as f:
                user_strategies = json.load(f)
        
        # Initialize user entry if it doesn't exist
        if user_id not in user_strategies:
            user_strategies[user_id] = []
        
        # Add timestamp if not already present
        if 'saved_at' not in strategy_data:
            strategy_data['saved_at'] = datetime.now().isoformat()
        
        # Add the strategy to the user's list
        user_strategies[user_id].append(strategy_data)
        
        # Write back to the file
        with open('data/user_strategies.json', 'w') as f:
            json.dump(user_strategies, f, indent=2)
        
        logger.debug(f"Strategy saved successfully for user {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving strategy: {str(e)}")
        raise Exception(f"Failed to save strategy: {str(e)}")

def get_user_strategies(user_id):
    """
    Get all strategies for a specific user.
    
    Args:
        user_id (str): User's unique ID
        
    Returns:
        list: User's saved strategies
    """
    logger.debug(f"Getting strategies for user: {user_id}")
    
    try:
        # Check if data file exists
        if not os.path.exists('data/user_strategies.json'):
            logger.debug(f"No strategies file found for user {user_id}")
            return []
        
        # Load user strategies
        with open('data/user_strategies.json', 'r') as f:
            user_strategies = json.load(f)
        
        # Return user's strategies or empty list if none found
        return user_strategies.get(user_id, [])
        
    except Exception as e:
        logger.error(f"Error getting user strategies: {str(e)}")
        return []

def get_all_strategies():
    """
    Get all generated strategies.
    
    Returns:
        list: All strategies
    """
    logger.debug("Getting all strategies")
    
    try:
        # Check if data file exists
        if not os.path.exists('data/all_strategies.json'):
            logger.debug("No strategies file found")
            return []
        
        # Load all strategies
        with open('data/all_strategies.json', 'r') as f:
            all_strategies = json.load(f)
        
        return all_strategies
        
    except Exception as e:
        logger.error(f"Error getting all strategies: {str(e)}")
        return []

def delete_strategy(user_id, strategy_id):
    """
    Delete a strategy from the user's library.
    
    Args:
        user_id (str): User's unique ID
        strategy_id (str): Strategy ID to delete
        
    Returns:
        bool: Success status
    """
    logger.debug(f"Deleting strategy {strategy_id} for user: {user_id}")
    
    try:
        # Check if data file exists
        if not os.path.exists('data/user_strategies.json'):
            logger.debug(f"No strategies file found for user {user_id}")
            return False
        
        # Load user strategies
        with open('data/user_strategies.json', 'r') as f:
            user_strategies = json.load(f)
        
        # Check if user exists
        if user_id not in user_strategies:
            logger.debug(f"No strategies found for user {user_id}")
            return False
        
        # Filter out the strategy to delete
        user_strategies[user_id] = [s for s in user_strategies[user_id] if s.get('id') != strategy_id]
        
        # Write back to the file
        with open('data/user_strategies.json', 'w') as f:
            json.dump(user_strategies, f, indent=2)
        
        logger.debug(f"Strategy {strategy_id} deleted successfully for user {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error deleting strategy: {str(e)}")
        return False
