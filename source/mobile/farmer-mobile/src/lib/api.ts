import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://kisanflow-backend.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setAuthToken = async (token: string) => {
  await SecureStore.setItemAsync('auth_token', token);
};

export const clearAuthToken = async () => {
  await SecureStore.deleteItemAsync('auth_token');
};
