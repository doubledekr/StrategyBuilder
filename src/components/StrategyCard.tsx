import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Strategy } from '../types';

interface StrategyCardProps {
  strategy: Strategy;
  onPress: () => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{strategy.name}</Text>
        <Text style={styles.ticker}>{strategy.ticker}</Text>
      </View>
      
      <Text style={styles.description}>{strategy.description}</Text>
      
      <View style={styles.indicators}>
        <Text style={styles.indicatorsLabel}>Indicators:</Text>
        <Text style={styles.indicatorsText}>
          {strategy.indicators?.join(', ') || 'N/A'}
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.timeframe}>Timeframe: {strategy.timeframe}</Text>
        {strategy.backtestResults && (
          <View style={styles.metrics}>
            <Text style={styles.metric}>
              Return: {(strategy.backtestResults.total_return * 100).toFixed(2)}%
            </Text>
            <Text style={styles.metric}>
              Sharpe: {strategy.backtestResults.sharpe_ratio.toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ticker: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  indicators: {
    marginBottom: 10,
  },
  indicatorsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  indicatorsText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeframe: {
    fontSize: 12,
    color: '#666',
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#28a745',
  },
});

export default StrategyCard;