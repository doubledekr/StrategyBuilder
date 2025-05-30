import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { TradingApi } from '../services/api';
import { Strategy, ParsedIntent } from '../types';
import StrategyCard from '../components/StrategyCard';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeTabs'>;

const HomeScreen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [currentStep, setCurrentStep] = useState<'input' | 'parsed' | 'strategies'>('input');

  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a trading strategy prompt');
      return;
    }

    setIsLoading(true);
    
    try {
      // Parse the user intent
      const parseResponse = await TradingApi.parseIntent(prompt);
      
      if (!parseResponse.success || !parseResponse.data) {
        Alert.alert('Error', parseResponse.error || 'Failed to parse your request');
        return;
      }

      setParsedIntent(parseResponse.data);
      setCurrentStep('parsed');

      // Generate strategies
      const strategiesResponse = await TradingApi.generateStrategies(parseResponse.data);
      
      if (!strategiesResponse.success || !strategiesResponse.data) {
        Alert.alert('Error', strategiesResponse.error || 'Failed to generate strategies');
        return;
      }

      setStrategies(strategiesResponse.data);
      setCurrentStep('strategies');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrategySelect = (strategy: Strategy) => {
    navigation.navigate('StrategyDetail', { strategy });
  };

  const handleEditPrompt = () => {
    setCurrentStep('input');
    setParsedIntent(null);
    setStrategies([]);
  };

  const renderInputStep = () => (
    <View style={styles.container}>
      <Text style={styles.title}>AI Trading Strategy Builder</Text>
      <Text style={styles.subtitle}>
        Describe your trading strategy in plain language
      </Text>
      
      <TextInput
        style={styles.textInput}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="e.g., Create a momentum strategy for AAPL using RSI and moving averages..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      
      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Generate Strategies</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderParsedIntent = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Understanding Your Request</Text>
      
      <View style={styles.intentCard}>
        <Text style={styles.intentLabel}>Action:</Text>
        <Text style={styles.intentValue}>{parsedIntent?.action}</Text>
        
        <Text style={styles.intentLabel}>Ticker:</Text>
        <Text style={styles.intentValue}>{parsedIntent?.ticker}</Text>
        
        <Text style={styles.intentLabel}>Strategy Type:</Text>
        <Text style={styles.intentValue}>{parsedIntent?.strategy_type}</Text>
        
        <Text style={styles.intentLabel}>Indicators:</Text>
        <Text style={styles.intentValue}>{parsedIntent?.indicators.join(', ')}</Text>
        
        <Text style={styles.intentLabel}>Risk Tolerance:</Text>
        <Text style={styles.intentValue}>{parsedIntent?.risk_tolerance}</Text>
      </View>
      
      <TouchableOpacity style={styles.editButton} onPress={handleEditPrompt}>
        <Text style={styles.editButtonText}>Edit Prompt</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStrategies = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Generated Strategies</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditPrompt}>
          <Text style={styles.editButtonText}>New Search</Text>
        </TouchableOpacity>
      </View>
      
      {strategies.map((strategy, index) => (
        <StrategyCard
          key={strategy.id || index}
          strategy={strategy}
          onPress={() => handleStrategySelect(strategy)}
        />
      ))}
    </ScrollView>
  );

  if (isLoading && currentStep === 'input') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing your request...</Text>
      </View>
    );
  }

  switch (currentStep) {
    case 'input':
      return renderInputStep();
    case 'parsed':
      return renderParsedIntent();
    case 'strategies':
      return renderStrategies();
    default:
      return renderInputStep();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  intentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  intentLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  intentValue: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  editButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default HomeScreen;