import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../../src/lib/api';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    setProcessing(true);
    
    try {
      // API call to verify the slot/QR code
      // We assume `data` contains the slot ID
      const response = await api.get(`/slots/${data}`);
      
      const slot = response.data;
      Alert.alert(
        'E-Pass Verified ✅',
        `Farmer ID: ${slot.farmer_id}\nDate: ${new Date(slot.slot_date).toLocaleDateString()}`,
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );

    } catch (error) {
      console.error(error);
      Alert.alert('Invalid E-Pass ❌', 'This QR code is invalid or expired.', [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
      </CameraView>
      
      {processing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#E67E22" />
          <Text style={styles.processingText}>Verifying securely...</Text>
        </View>
      )}

      {scanned && !processing && (
        <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
          <Text style={styles.rescanText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#E67E22',
    backgroundColor: 'transparent',
  },
  processingContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    marginTop: 8,
    fontWeight: 'bold',
  },
  rescanButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#E67E22',
    padding: 16,
    borderRadius: 8,
  },
  rescanText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
