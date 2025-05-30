import axios from 'axios';
import { Strategy, ParsedIntent, BacktestResults, ApiResponse, StockData } from '../types';

// Use your Flask backend URL - adjust if needed
const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class TradingApi {
  static async parseIntent(prompt: string): Promise<ApiResponse<ParsedIntent>> {
    try {
      const response = await api.post('/parse_intent', { user_prompt: prompt });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to parse intent' 
      };
    }
  }

  static async generateStrategies(parsedIntent: ParsedIntent): Promise<ApiResponse<Strategy[]>> {
    try {
      const response = await api.post('/create_strategies', parsedIntent);
      return { success: true, data: response.data.strategies };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to generate strategies' 
      };
    }
  }

  static async backtest(
    ticker: string, 
    strategyParams: any
  ): Promise<ApiResponse<BacktestResults>> {
    try {
      const response = await api.post('/backtest', {
        ticker,
        strategy_params: strategyParams,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Backtest failed' 
      };
    }
  }

  static async optimizeStrategy(
    ticker: string,
    strategyParams: any,
    goal: string = 'sharpe'
  ): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/optimize', {
        ticker,
        strategy_params: strategyParams,
        optimization_goal: goal,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Optimization failed' 
      };
    }
  }

  static async saveStrategy(strategyData: Strategy): Promise<ApiResponse<boolean>> {
    try {
      await api.post('/save_user_strategy', { strategy_data: strategyData });
      return { success: true, data: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to save strategy' 
      };
    }
  }

  static async getUserStrategies(): Promise<ApiResponse<Strategy[]>> {
    try {
      const response = await api.get('/user_library');
      return { success: true, data: response.data.strategies };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to load strategies' 
      };
    }
  }

  static async searchStock(query: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`/search_stock?q=${encodeURIComponent(query)}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Stock search failed' 
      };
    }
  }
}