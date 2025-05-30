export interface Strategy {
  id: string;
  name: string;
  description: string;
  ticker: string;
  timeframe: string;
  indicators: string[];
  entry_conditions: string[];
  exit_conditions: string[];
  risk_management: {
    stop_loss: number;
    take_profit: number;
    position_size: number;
  };
  parameters: {
    [key: string]: number;
  };
  backtestResults?: BacktestResults;
}

export interface BacktestResults {
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  trades_count: number;
  portfolio_values: number[];
  buy_hold_values: number[];
  dates: string[];
  trades: Trade[];
}

export interface Trade {
  date: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  pnl?: number;
}

export interface ParsedIntent {
  action: string;
  ticker: string;
  timeframe: string;
  strategy_type: string;
  indicators: string[];
  risk_tolerance: string;
  investment_horizon: string;
  market_conditions: string;
}

export interface StockData {
  symbol: string;
  prices: number[];
  dates: string[];
  volume: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}