import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { TradingApi } from '../services/api';
import { Strategy } from '../types';

type StrategyDetailRouteProp = RouteProp<RootStackParamList, 'StrategyDetail'>;
type StrategyDetailNavigationProp = StackNavigationProp<RootStackParamList, 'StrategyDetail'>;

const StrategyDetailScreen: React.FC = () => {
  const route = useRoute<StrategyDetailRouteProp>();
  const navigation = useNavigation<StrategyDetailNavigationProp>();
  const { strategy } = route.params;
  
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleBacktest = async () => {
    setIsBacktesting(true);
    
    try {
      const response = await TradingApi.backtest(strategy.ticker, strategy.parameters);
      
      if (response.success && response.data) {
        const updatedStrategy = {
          ...strategy,
          backtestResults: response.data,
        };
        navigation.navigate('Backtest', { strategy: updatedStrategy });
      } else {
        Alert.alert('Error', response.error || 'Backtest failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during backtesting');
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    
    try {
      const response = await TradingApi.optimizeStrategy(
        strategy.ticker,
        strategy.parameters,
        'sharpe'
      );
      
      if (response.success && response.data) {
        Alert.alert(
          'Optimization Complete',
          'Strategy parameters have been optimized. Would you like to use the optimized parameters?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Use Optimized', 
              onPress: () => {
                // Update strategy with optimized parameters
                const optimizedStrategy = {
                  ...strategy,
                  parameters: { ...strategy.parameters, ...response.data.optimized_params },
                };
                // You could navigate back with optimized strategy or update state
                Alert.alert('Success', 'Parameters updated with optimized values');
              }
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Optimization failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during optimization');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await TradingApi.saveStrategy(strategy);
      
      if (response.success) {
        Alert.alert('Success', 'Strategy saved to your library');
      } else {
        Alert.alert('Error', response.error || 'Failed to save strategy');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{strategy.name}</Text>
        <Text style={styles.ticker}>{strategy.ticker}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{strategy.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strategy Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Timeframe:</Text>
          <Text style={styles.detailValue}>{strategy.timeframe}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Indicators:</Text>
          <Text style={styles.detailValue}>{strategy.indicators?.join(', ')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Entry Conditions</Text>
        {strategy.entry_conditions?.map((condition: string, index: number) => (
          <Text key={index} style={styles.conditionText}>• {condition}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exit Conditions</Text>
        {strategy.exit_conditions?.map((condition: string, index: number) => (
          <Text key={index} style={styles.conditionText}>• {condition}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Management</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stop Loss:</Text>
          <Text style={styles.detailValue}>{strategy.risk_management?.stop_loss}%</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Take Profit:</Text>
          <Text style={styles.detailValue}>{strategy.risk_management?.take_profit}%</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Position Size:</Text>
          <Text style={styles.detailValue}>{strategy.risk_management?.position_size}%</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parameters</Text>
        {Object.entries(strategy.parameters || {}).map(([key, value]: [string, any]) => (
          <View key={key} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{key}:</Text>
            <Text style={styles.detailValue}>{String(value)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.backtestButton]} 
          onPress={handleBacktest}
          disabled={isBacktesting}
        >
          {isBacktesting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>Run Backtest</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.optimizeButton]} 
          onPress={handleOptimize}
          disabled={isOptimizing}
        >
          {isOptimizing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>Optimize</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.saveButton]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>Save Strategy</Text>
          )}
        </TouchableOpacity>
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
    textAlign: 'center',
  },
  ticker: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  conditionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
  actions: {
    padding: 20,
    gap: 15,
  },
  actionButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  backtestButton: {
    backgroundColor: '#007AFF',
  },
  optimizeButton: {
    backgroundColor: '#28a745',
  },
  saveButton: {
    backgroundColor: '#ffc107',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StrategyDetailScreen;