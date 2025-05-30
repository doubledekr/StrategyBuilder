import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Strategy } from '../types';

type BacktestRouteProp = RouteProp<RootStackParamList, 'Backtest'>;

const BacktestScreen: React.FC = () => {
  const route = useRoute<BacktestRouteProp>();
  const { strategy } = route.params;
  const screenWidth = Dimensions.get('window').width;

  const results = strategy.backtestResults;

  if (!results) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No backtest results available</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '0',
    },
  };

  const portfolioData = {
    labels: results.dates.filter((_, index) => index % Math.ceil(results.dates.length / 6) === 0),
    datasets: [
      {
        data: results.portfolio_values,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: results.buy_hold_values,
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Strategy', 'Buy & Hold'],
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Backtest Results</Text>
        <Text style={styles.strategyName}>{strategy.name}</Text>
        <Text style={styles.ticker}>{strategy.ticker}</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {formatPercentage(results.total_return)}
          </Text>
          <Text style={styles.metricLabel}>Total Return</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {results.sharpe_ratio.toFixed(2)}
          </Text>
          <Text style={styles.metricLabel}>Sharpe Ratio</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {formatPercentage(results.max_drawdown)}
          </Text>
          <Text style={styles.metricLabel}>Max Drawdown</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {formatPercentage(results.win_rate)}
          </Text>
          <Text style={styles.metricLabel}>Win Rate</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {results.trades_count}
          </Text>
          <Text style={styles.metricLabel}>Total Trades</Text>
        </View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Portfolio Performance</Text>
        <LineChart
          data={portfolioData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.tradesSection}>
        <Text style={styles.sectionTitle}>Recent Trades</Text>
        {results.trades.slice(-10).map((trade, index) => (
          <View key={index} style={styles.tradeRow}>
            <View style={styles.tradeInfo}>
              <Text style={styles.tradeDate}>{trade.date}</Text>
              <Text style={[
                styles.tradeType,
                trade.type === 'buy' ? styles.buyTrade : styles.sellTrade
              ]}>
                {trade.type.toUpperCase()}
              </Text>
            </View>
            <View style={styles.tradeDetails}>
              <Text style={styles.tradePrice}>
                {formatCurrency(trade.price)}
              </Text>
              <Text style={styles.tradeQuantity}>
                Qty: {trade.quantity}
              </Text>
            </View>
            {trade.pnl !== undefined && (
              <Text style={[
                styles.tradePnl,
                trade.pnl >= 0 ? styles.positivePnl : styles.negativePnl
              ]}>
                {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  strategyName: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  ticker: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chartSection: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tradesSection: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 15,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tradeInfo: {
    flex: 1,
  },
  tradeDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  tradeType: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buyTrade: {
    color: '#28a745',
  },
  sellTrade: {
    color: '#dc3545',
  },
  tradeDetails: {
    alignItems: 'flex-end',
    flex: 1,
  },
  tradePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tradeQuantity: {
    fontSize: 12,
    color: '#666',
  },
  tradePnl: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  positivePnl: {
    color: '#28a745',
  },
  negativePnl: {
    color: '#dc3545',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default BacktestScreen;