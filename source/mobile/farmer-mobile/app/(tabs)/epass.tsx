import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/lib/api';

export default function EPassScreen() {
  const { user } = useAuth();
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSlot();
  }, []);

  const loadActiveSlot = async () => {
    try {
      const res = await api.get('/slots/my-slots');
      if (res.data.length > 0) {
        setActiveSlot(res.data[0]); // Just pick the first one for demo
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  if (!activeSlot) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No active e-pass available.</Text>
      </View>
    );
  }

  // Generate a mock QR code image URL based on slot ID
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${activeSlot.id}`;

  return (
    <View style={styles.container}>
      <View style={styles.passCard}>
        <Text style={styles.passTitle}>Digital E-Pass</Text>
        
        <View style={styles.qrContainer}>
          <Image source={{ uri: qrUrl }} style={styles.qrImage} />
        </View>

        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.label}>Farmer Name</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Slot ID</Text>
            <Text style={styles.value}>{activeSlot.id.substring(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{new Date(activeSlot.slot_date).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9F9',
    padding: 16,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  passCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  passTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2C3E50',
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495E',
  }
});
