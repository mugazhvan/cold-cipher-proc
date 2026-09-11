import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';

type Slot = {
  id: string;
  centre_id: string;
  slot_date: string;
  status: string;
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSlots = async () => {
    try {
      const res = await api.get('/slots/my-slots');
      setSlots(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSlots();
    setRefreshing(false);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name || 'Farmer'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Your Active Slots</Text>

      {slots.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You have no active slots.</Text>
          <Text style={styles.emptySubtext}>Go to the Book tab to schedule your harvest drop-off.</Text>
        </View>
      ) : (
        slots.map(slot => (
          <View key={slot.id} style={styles.card}>
            <Text style={styles.date}>{new Date(slot.slot_date).toLocaleDateString()}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{slot.status}</Text>
            </View>
          </View>
        ))
      )}
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
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  statusBadge: {
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#1ABC9C',
    fontWeight: 'bold',
    fontSize: 12,
  }
});
