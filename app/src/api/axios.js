import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.100:5000/api';

const instance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

instance.interceptors.request.use(
  async (config) => {
    console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;