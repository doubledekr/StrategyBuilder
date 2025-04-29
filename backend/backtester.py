import logging
import math
import numpy as np
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def run_backtest(stock_data, strategy_params):
    """
    Run a backtest on historical stock data with given strategy parameters.
    
    Args:
        stock_data (dict): Historical stock data
        strategy_params (dict): Strategy parameters
        
    Returns:
        dict: Backtest results
    """
    logger.debug(f"Running backtest for {stock_data.get('ticker')} with params: {strategy_params}")
    
    # Extract data
    ticker = stock_data.get('ticker', 'Unknown')
    dates = stock_data.get('dates', [])
    prices = stock_data.get('prices', [])
    opens = stock_data.get('opens', [])
    highs = stock_data.get('highs', [])
    lows = stock_data.get('lows', [])
    volumes = stock_data.get('volumes', [])
    
    if not prices:
        raise Exception("No price data available for backtest")
    
    # Initialize trade log and portfolio values
    trades = []
    portfolio_values = [1.0]  # Starting with $1.00 normalized
    cash = 1.0
    position = 0
    position_size = strategy_params.get('position_size', 1.0)
    
    # Calculate indicators based on strategy parameters
    indicators = calculate_indicators(prices, strategy_params)
    
    # Simulate trading day by day
    for i in range(1, len(prices)):
        # Skip if not enough data for indicators
        if i < max(strategy_params.get('ma_fast', 10), strategy_params.get('ma_slow', 50)):
            portfolio_values.append(cash)
            continue
        
        current_price = prices[i]
        current_date = dates[i] if i < len(dates) else None
        
        # Check entry conditions if not in position
        if position == 0:
            if check_entry_conditions(i, prices, indicators, strategy_params):
                # Enter position
                position = position_size / current_price
                cost = position_size
                cash -= cost
                
                trades.append({
                    'type': 'entry',
                    'date': current_date,
                    'price': current_price,
                    'shares': position,
                    'value': cost
                })
                
                logger.debug(f"Entered position: {current_date}, price: {current_price}, shares: {position}")
        
        # Check exit conditions if in position
        elif position > 0:
            if check_exit_conditions(i, prices, indicators, strategy_params, position, current_price):
                # Exit position
                sale_value = position * current_price
                cash += sale_value
                
                trades.append({
                    'type': 'exit',
                    'date': current_date,
                    'price': current_price,
                    'shares': position,
                    'value': sale_value
                })
                
                logger.debug(f"Exited position: {current_date}, price: {current_price}, shares: {position}, value: {sale_value}")
                position = 0
        
        # Calculate portfolio value (cash + position value)
        portfolio_value = cash + (position * current_price)
        portfolio_values.append(portfolio_value)
    
    # Calculate performance metrics
    metrics = calculate_performance_metrics(portfolio_values, trades)
    
    # Calculate buy and hold performance
    buy_hold_values = calculate_buy_hold_performance(prices)
    buy_hold_metrics = calculate_performance_metrics(buy_hold_values, [])
    
    # Calculate strategy vs buy and hold
    strategy_return = metrics['total_return']
    buy_hold_return = buy_hold_metrics['total_return']
    outperformance = strategy_return - buy_hold_return
    
    # Add outperformance to metrics
    metrics['vs_buy_hold'] = round(outperformance, 2)
    
    # Prepare the response
    results = {
        'ticker': ticker,
        'start_date': dates[0] if dates else None,
        'end_date': dates[-1] if dates else None,
        'trades': trades,
        'portfolio_values': portfolio_values,
        'metrics': metrics,
        'buy_hold_values': buy_hold_values,
        'buy_hold_metrics': buy_hold_metrics
    }
    
    logger.debug(f"Backtest completed with {len(trades)} trades and final value: {portfolio_values[-1]}")
    logger.debug(f"Buy and hold final value: {buy_hold_values[-1]}")
    logger.debug(f"Strategy vs Buy and Hold: {outperformance}%")
    return results

def calculate_indicators(prices, params):
    """
    Calculate technical indicators based on strategy parameters.
    
    Args:
        prices (list): Historical prices
        params (dict): Strategy parameters
        
    Returns:
        dict: Calculated indicators
    """
    indicators = {}
    
    # Moving Averages
    ma_fast_period = params.get('ma_fast', 10)
    ma_slow_period = params.get('ma_slow', 50)
    
    indicators['ma_fast'] = calculate_ma(prices, ma_fast_period)
    indicators['ma_slow'] = calculate_ma(prices, ma_slow_period)
    
    # RSI
    rsi_period = params.get('rsi_period', 14)
    indicators['rsi'] = calculate_rsi(prices, rsi_period)
    
    # Bollinger Bands
    bb_period = params.get('bb_period', 20)
    bb_std = params.get('bb_std', 2)
    indicators['bb_upper'], indicators['bb_middle'], indicators['bb_lower'] = calculate_bollinger_bands(prices, bb_period, bb_std)
    
    # MACD
    macd_fast = params.get('macd_fast', 12)
    macd_slow = params.get('macd_slow', 26)
    macd_signal = params.get('macd_signal', 9)
    indicators['macd'], indicators['macd_signal'], indicators['macd_hist'] = calculate_macd(prices, macd_fast, macd_slow, macd_signal)
    
    return indicators

def calculate_ma(prices, period):
    """Calculate a simple moving average."""
    if not prices or period <= 0:
        return [None] * len(prices)
    
    ma = [None] * (period - 1)
    for i in range(period - 1, len(prices)):
        ma.append(sum(prices[i-period+1:i+1]) / period)
    
    return ma

def calculate_rsi(prices, period=14):
    """Calculate Relative Strength Index."""
    if not prices or period <= 0 or len(prices) <= period:
        return [None] * len(prices)
    
    # Calculate price changes
    deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    
    # Initialize gains and losses
    gains = [max(0, d) for d in deltas]
    losses = [max(0, -d) for d in deltas]
    
    # Prepend initial None values
    rsi = [None] * period
    
    # Calculate first average gain and loss
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    # Calculate RSI values
    for i in range(period, len(prices)):
        # Update average gain and loss using smoothing
        avg_gain = (avg_gain * (period - 1) + gains[i-1]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i-1]) / period
        
        if avg_loss == 0:
            rsi.append(100)
        else:
            rs = avg_gain / avg_loss
            rsi.append(100 - (100 / (1 + rs)))
    
    return rsi

def calculate_bollinger_bands(prices, period=20, std_dev=2):
    """Calculate Bollinger Bands."""
    if not prices or period <= 0 or len(prices) <= period:
        return [None] * len(prices), [None] * len(prices), [None] * len(prices)
    
    # Initialize arrays
    middle_band = [None] * period
    upper_band = [None] * period
    lower_band = [None] * period
    
    # Calculate bands
    for i in range(period, len(prices)):
        window = prices[i-period:i]
        sma = sum(window) / period
        std = math.sqrt(sum((x - sma) ** 2 for x in window) / period)
        
        middle_band.append(sma)
        upper_band.append(sma + (std_dev * std))
        lower_band.append(sma - (std_dev * std))
    
    return upper_band, middle_band, lower_band

def calculate_macd(prices, fast_period=12, slow_period=26, signal_period=9):
    """Calculate MACD indicator."""
    if not prices or len(prices) <= slow_period + signal_period:
        return [None] * len(prices), [None] * len(prices), [None] * len(prices)
    
    # Calculate EMAs
    ema_fast = calculate_ema(prices, fast_period)
    ema_slow = calculate_ema(prices, slow_period)
    
    # Calculate MACD line
    macd_line = [None] * slow_period
    for i in range(slow_period, len(prices)):
        macd_line.append(ema_fast[i] - ema_slow[i])
    
    # Calculate signal line (EMA of MACD line)
    signal_line = [None] * (slow_period + signal_period - 1)
    
    # Calculate first EMA of MACD
    first_valid_macd = macd_line[slow_period:slow_period+signal_period]
    signal = sum(first_valid_macd) / signal_period
    signal_line.append(signal)
    
    # Calculate remaining signal line values
    alpha = 2 / (signal_period + 1)
    for i in range(slow_period + signal_period, len(prices)):
        signal = macd_line[i] * alpha + signal_line[-1] * (1 - alpha)
        signal_line.append(signal)
    
    # Calculate histogram
    histogram = [None] * len(signal_line)
    for i in range(len(signal_line)):
        if signal_line[i] is not None and i < len(macd_line) and macd_line[i] is not None:
            histogram[i] = macd_line[i] - signal_line[i]
    
    return macd_line, signal_line, histogram

def calculate_ema(prices, period):
    """Calculate Exponential Moving Average."""
    if not prices or period <= 0:
        return [None] * len(prices)
    
    # Initialize EMA with SMA
    ema = [None] * (period - 1)
    ema.append(sum(prices[:period]) / period)
    
    # Calculate multiplier
    multiplier = 2 / (period + 1)
    
    # Calculate EMA values
    for i in range(period, len(prices)):
        ema.append((prices[i] * multiplier) + (ema[-1] * (1 - multiplier)))
    
    return ema

def check_entry_conditions(index, prices, indicators, params):
    """
    Check if entry conditions are met.
    
    Args:
        index (int): Current index in the price array
        prices (list): Historical prices
        indicators (dict): Calculated indicators
        params (dict): Strategy parameters
        
    Returns:
        bool: True if entry conditions are met
    """
    # Strategy type determines entry logic
    strategy_type = params.get('strategy_type', 'ma_crossover')
    
    if strategy_type == 'ma_crossover':
        # Moving Average Crossover
        if (index > 0 and 
            indicators['ma_fast'][index] is not None and 
            indicators['ma_slow'][index] is not None and
            indicators['ma_fast'][index-1] is not None and 
            indicators['ma_slow'][index-1] is not None):
            
            # Check if fast MA crosses above slow MA
            if (indicators['ma_fast'][index-1] <= indicators['ma_slow'][index-1] and 
                indicators['ma_fast'][index] > indicators['ma_slow'][index]):
                return True
    
    elif strategy_type == 'rsi_oversold':
        # RSI Oversold Bounce
        rsi_oversold = params.get('rsi_oversold', 30)
        
        if (index > 0 and 
            indicators['rsi'][index] is not None and 
            indicators['rsi'][index-1] is not None):
            
            # Check if RSI crosses above oversold threshold
            if (indicators['rsi'][index-1] <= rsi_oversold and 
                indicators['rsi'][index] > rsi_oversold):
                return True
    
    elif strategy_type == 'bollinger_bounce':
        # Bollinger Band Bounce
        if (index > 0 and 
            indicators['bb_lower'][index] is not None and 
            prices[index-1] is not None):
            
            # Check if price bounces off lower band
            if prices[index-1] <= indicators['bb_lower'][index-1] and prices[index] > indicators['bb_lower'][index]:
                return True
    
    elif strategy_type == 'macd_crossover':
        # MACD Crossover
        if (index > 0 and 
            indicators['macd_hist'][index] is not None and 
            indicators['macd_hist'][index-1] is not None):
            
            # Check if MACD histogram crosses above zero
            if (indicators['macd_hist'][index-1] <= 0 and 
                indicators['macd_hist'][index] > 0):
                return True
    
    return False

def check_exit_conditions(index, prices, indicators, params, position, current_price):
    """
    Check if exit conditions are met.
    
    Args:
        index (int): Current index in the price array
        prices (list): Historical prices
        indicators (dict): Calculated indicators
        params (dict): Strategy parameters
        position (float): Current position size
        current_price (float): Current price
        
    Returns:
        bool: True if exit conditions are met
    """
    # Check stop loss
    stop_loss_pct = params.get('stop_loss_pct', 5) / 100
    entry_price = None
    
    # Find the entry price for the current position
    for i in range(index-1, -1, -1):
        if i < len(prices) and prices[i] > 0 and position > 0:
            entry_price = prices[i]
            break
    
    if entry_price and current_price < entry_price * (1 - stop_loss_pct):
        logger.debug(f"Stop loss triggered at price {current_price}")
        return True
    
    # Check take profit
    take_profit_pct = params.get('take_profit_pct', 10) / 100
    
    if entry_price and current_price > entry_price * (1 + take_profit_pct):
        logger.debug(f"Take profit triggered at price {current_price}")
        return True
    
    # Strategy type determines exit logic
    strategy_type = params.get('strategy_type', 'ma_crossover')
    
    if strategy_type == 'ma_crossover':
        # Moving Average Crossover
        if (index > 0 and 
            indicators['ma_fast'][index] is not None and 
            indicators['ma_slow'][index] is not None and
            indicators['ma_fast'][index-1] is not None and 
            indicators['ma_slow'][index-1] is not None):
            
            # Check if fast MA crosses below slow MA
            if (indicators['ma_fast'][index-1] >= indicators['ma_slow'][index-1] and 
                indicators['ma_fast'][index] < indicators['ma_slow'][index]):
                return True
    
    elif strategy_type == 'rsi_oversold':
        # RSI Overbought Exit
        rsi_overbought = params.get('rsi_overbought', 70)
        
        if (indicators['rsi'][index] is not None and 
            indicators['rsi'][index] > rsi_overbought):
            return True
    
    elif strategy_type == 'bollinger_bounce':
        # Exit when price reaches middle band
        if (indicators['bb_middle'][index] is not None and 
            prices[index-1] < indicators['bb_middle'][index-1] and 
            prices[index] >= indicators['bb_middle'][index]):
            return True
    
    elif strategy_type == 'macd_crossover':
        # MACD Crossover
        if (index > 0 and 
            indicators['macd_hist'][index] is not None and 
            indicators['macd_hist'][index-1] is not None):
            
            # Check if MACD histogram crosses below zero
            if (indicators['macd_hist'][index-1] >= 0 and 
                indicators['macd_hist'][index] < 0):
                return True
    
    # Maximum holding period
    max_hold_days = params.get('max_hold_days', 30)
    
    if index - max_hold_days > 0:
        for i in range(index-1, index-max_hold_days-1, -1):
            if i >= 0 and i < len(prices):
                # Check if we've held the position longer than max_hold_days
                # (This is a simplified check)
                return True
    
    return False

def calculate_buy_hold_performance(prices):
    """
    Calculate the performance of a buy and hold strategy.
    
    Args:
        prices (list): Historical prices
        
    Returns:
        list: Daily portfolio values for buy and hold
    """
    if not prices or len(prices) < 2:
        return [1.0]
    
    # Initialize with $1 normalized
    initial_price = prices[0]
    shares = 1.0 / initial_price
    
    # Calculate daily values
    buy_hold_values = [shares * price for price in prices]
    
    # Normalize to start at 1.0
    buy_hold_values = [value / buy_hold_values[0] for value in buy_hold_values]
    
    return buy_hold_values

def calculate_performance_metrics(portfolio_values, trades):
    """
    Calculate performance metrics from the backtest results.
    
    Args:
        portfolio_values (list): Daily portfolio values
        trades (list): List of trades
        
    Returns:
        dict: Performance metrics
    """
    if not portfolio_values or len(portfolio_values) < 2:
        return {
            'total_return': 0,
            'cagr': 0,
            'sharpe_ratio': 0,
            'max_drawdown': 0,
            'win_rate': 0,
            'num_trades': 0
        }
    
    # Total return
    initial_value = portfolio_values[0]
    final_value = portfolio_values[-1]
    total_return = (final_value - initial_value) / initial_value * 100
    
    # Compound Annual Growth Rate (CAGR)
    years = len(portfolio_values) / 252  # ~252 trading days per year
    cagr = (final_value / initial_value) ** (1 / years) - 1 if years > 0 else 0
    cagr *= 100  # Convert to percentage
    
    # Daily returns for Sharpe ratio
    daily_returns = [(portfolio_values[i] / portfolio_values[i-1]) - 1 for i in range(1, len(portfolio_values))]
    
    # Sharpe ratio (assuming risk-free rate of 0 for simplicity)
    mean_daily_return = np.mean(daily_returns) if daily_returns else 0
    std_daily_return = np.std(daily_returns) if daily_returns else 1e-10  # Avoid division by zero
    sharpe_ratio = (mean_daily_return / std_daily_return) * (252 ** 0.5)  # Annualized
    
    # Maximum drawdown
    max_drawdown = 0
    peak = portfolio_values[0]
    
    for value in portfolio_values:
        if value > peak:
            peak = value
        drawdown = (peak - value) / peak
        max_drawdown = max(max_drawdown, drawdown)
    
    max_drawdown *= 100  # Convert to percentage
    
    # Win rate
    if not trades:
        win_rate = 0
    else:
        # Group trades into entry/exit pairs
        entry_trades = [t for t in trades if t['type'] == 'entry']
        exit_trades = [t for t in trades if t['type'] == 'exit']
        
        # Count winning trades
        winning_trades = 0
        
        for i in range(min(len(entry_trades), len(exit_trades))):
            entry_price = entry_trades[i]['price']
            exit_price = exit_trades[i]['price']
            
            if exit_price > entry_price:
                winning_trades += 1
        
        win_rate = winning_trades / len(entry_trades) * 100 if entry_trades else 0
    
    # Number of trades (entries only)
    num_trades = len([t for t in trades if t['type'] == 'entry'])
    
    return {
        'total_return': round(total_return, 2),
        'cagr': round(cagr, 2),
        'sharpe_ratio': round(sharpe_ratio, 2),
        'max_drawdown': round(max_drawdown, 2),
        'win_rate': round(win_rate, 2),
        'num_trades': num_trades
    }
