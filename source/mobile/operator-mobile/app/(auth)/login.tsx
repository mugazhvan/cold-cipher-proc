import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { ShieldCheck } from 'lucide-react-native';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phone || phone.length < 10) return;
    
    setLoading(true);
    try {
      await login(phone, 'CENTRE_OPERATOR');
    } catch (error) {
      console.error(error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <ShieldCheck size={48} color="#E67E22" />
        <Text style={styles.title}>KisanFlow</Text>
        <Text style={styles.subtitle}>Mandi Operator Terminal</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Operator Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 10 digit number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
        />

        <TouchableOpacity 
          style={[styles.button, (!phone || phone.length < 10) && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading || !phone || phone.length < 10}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Secure Login</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.hint}>Mock Login: Use Operator Number (1234567890)</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    marginTop: 8,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 24,
    backgroundColor: '#F8F9F9',
  },
  button: {
    backgroundColor: '#E67E22',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#95A5A6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    marginTop: 20,
    textAlign: 'center',
    color: '#95A5A6',
    fontSize: 14,
  }
});
