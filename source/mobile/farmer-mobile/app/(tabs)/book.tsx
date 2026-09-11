import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../src/lib/api';
import { useRouter } from 'expo-router';

export default function BookSlotScreen() {
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadCentres();
  }, []);

  const loadCentres = async () => {
    try {
      const res = await api.get('/centres/');
      setCentres(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const bookSlot = async (centreId: string) => {
    setBooking(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await api.post('/slots/', {
        centre_id: centreId,
        slot_date: tomorrow.toISOString().split('T')[0]
      });
      
      Alert.alert('Success', 'Slot booked successfully!', [
        { text: 'OK', onPress: () => router.push('/(tabs)') }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to book slot.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Select a Mandi Centre</Text>
      
      {centres.map(centre => (
        <View key={centre.id} style={styles.card}>
          <Text style={styles.name}>{centre.name}</Text>
          <Text style={styles.location}>{centre.location}</Text>
          <Text style={styles.capacity}>Capacity: {centre.capacity} vehicles/day</Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => bookSlot(centre.id)}
            disabled={booking}
          >
            <Text style={styles.buttonText}>Book for Tomorrow</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9F9',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495E',
  },
  location: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  capacity: {
    fontSize: 14,
    color: '#27AE60',
    marginTop: 4,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#2ECC71',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
