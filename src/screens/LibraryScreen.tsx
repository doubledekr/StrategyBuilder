import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { TradingApi } from '../services/api';
import { Strategy } from '../types';
import StrategyCard from '../components/StrategyCard';

type LibraryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeTabs'>;

const LibraryScreen: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigation = useNavigation<LibraryScreenNavigationProp>();

  const loadStrategies = async () => {
    try {
      const response = await TradingApi.getUserStrategies();
      
      if (response.success && response.data) {
        setStrategies(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to load strategies');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadStrategies();
  };

  const handleStrategySelect = (strategy: Strategy) => {
    navigation.navigate('StrategyDetail', { strategy });
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStrategies();
    }, [])
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your strategies...</Text>
      </View>
    );
  }

  if (strategies.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Strategies Yet</Text>
          <Text style={styles.emptyText}>
            Create your first trading strategy by going to the Home tab and describing your strategy idea.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Strategies</Text>
        <Text style={styles.subtitle}>{strategies.length} saved strategies</Text>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default LibraryScreen;