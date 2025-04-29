import os
import requests
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# TwelveData API
TWELVEDATA_API_KEY = os.environ.get("TWELVEDATA_API_KEY")
TWELVEDATA_BASE_URL = "https://api.twelvedata.com"

def get_stock_data(ticker, years=5, interval="1day"):
    """
    Fetch historical stock data from TwelveData API.
    
    Args:
        ticker (str): Stock ticker symbol
        years (int): Number of years of historical data to fetch
        interval (str): Data interval (1day, 1week, 1month)
        
    Returns:
        dict: Historical stock data
    """
    logger.debug(f"Fetching {years} years of {interval} data for {ticker}")
    
    # Calculate start date
    end_date = datetime.now()
    start_date = end_date - timedelta(days=years*365)
    
    # Format dates for API
    end_date_str = end_date.strftime("%Y-%m-%d")
    start_date_str = start_date.strftime("%Y-%m-%d")
    
    # Determine how many data points we need
    outputsize = years * 252  # ~252 trading days per year
    
    # Build API endpoint
    endpoint = f"{TWELVEDATA_BASE_URL}/time_series"
    
    # Build parameters
    params = {
        "symbol": ticker,
        "interval": interval,
        "start_date": start_date_str,
        "end_date": end_date_str,
        "outputsize": outputsize,
        "apikey": TWELVEDATA_API_KEY
    }
    
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if "values" not in data:
            logger.error(f"API response missing values: {data}")
            raise Exception(f"Failed to get historical data for {ticker}: {data.get('message', 'Unknown error')}")
        
        # Transform data into a more usable format
        prices = []
        dates = []
        opens = []
        highs = []
        lows = []
        volumes = []
        
        for bar in data["values"]:
            dates.append(bar["datetime"])
            prices.append(float(bar["close"]))
            opens.append(float(bar["open"]))
            highs.append(float(bar["high"]))
            lows.append(float(bar["low"]))
            volumes.append(float(bar["volume"]) if "volume" in bar else 0)
        
        # Reverse arrays so they're in chronological order
        dates.reverse()
        prices.reverse()
        opens.reverse()
        highs.reverse()
        lows.reverse()
        volumes.reverse()
        
        return {
            "ticker": ticker,
            "start_date": dates[0] if dates else None,
            "end_date": dates[-1] if dates else None,
            "dates": dates,
            "prices": prices,
            "opens": opens,
            "highs": highs,
            "lows": lows,
            "volumes": volumes
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"API request error: {str(e)}")
        raise Exception(f"Error fetching data from API: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing stock data: {str(e)}")
        raise Exception(f"Failed to process stock data: {str(e)}")

def search_stock(query):
    """
    Search for stocks by name or symbol.
    
    Args:
        query (str): Search query
        
    Returns:
        list: Matching stocks
    """
    logger.debug(f"Searching for stocks matching: {query}")
    
    # Build API endpoint
    endpoint = f"{TWELVEDATA_BASE_URL}/symbol_search"
    
    # Build parameters
    params = {
        "symbol": query,
        "outputsize": 10,
        "apikey": TWELVEDATA_API_KEY
    }
    
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if "data" not in data:
            logger.error(f"API response missing data: {data}")
            return []
        
        # Extract relevant info
        results = []
        for item in data["data"]:
            results.append({
                "symbol": item.get("symbol", ""),
                "name": item.get("instrument_name", ""),
                "exchange": item.get("exchange", ""),
                "type": item.get("type", "")
            })
        
        return results
        
    except requests.exceptions.RequestException as e:
        logger.error(f"API request error: {str(e)}")
        raise Exception(f"Error searching stocks: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing search results: {str(e)}")
        raise Exception(f"Failed to process search results: {str(e)}")
