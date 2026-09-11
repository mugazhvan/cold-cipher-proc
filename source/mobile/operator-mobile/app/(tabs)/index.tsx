import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      // Mock stats for dashboard
      setStats({
        expectedVehicles: 45,
        arrived: 12,
        processed: 8
      });
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Operator Terminal</Text>
        <Text style={styles.name}>{user?.name || 'Operator'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Today's Overview</Text>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderLeftColor: '#3498DB' }]}>
            <Text style={styles.statLabel}>Expected Today</Text>
            <Text style={styles.statValue}>{stats.expectedVehicles}</Text>
          </View>
          
          <View style={[styles.statCard, { borderLeftColor: '#F1C40F' }]}>
            <Text style={styles.statLabel}>Arrived at Gate</Text>
            <Text style={styles.statValue}>{stats.arrived}</Text>
          </View>
          
          <View style={[styles.statCard, { borderLeftColor: '#2ECC71' }]}>
            <Text style={styles.statLabel}>Processed</Text>
            <Text style={styles.statValue}>{stats.processed}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Scans</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No recent activity</Text>
        <Text style={styles.emptySubtext}>Use the scanner to verify E-Passes</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9F9',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  welcome: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 12,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  }
});
