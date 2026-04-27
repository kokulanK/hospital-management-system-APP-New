import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Ionicons name="medical" size={80} color="#3b82f6" />
      <Text style={styles.title}>Hospital Management System</Text>
      <Text style={styles.subtitle}>Your health, our priority</Text>
      <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginBtnText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('RegisterPatient')}>
        <Text style={styles.registerBtnText}>Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, textAlign: 'center', color: '#1f2937' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 8, textAlign: 'center', marginBottom: 40 },
  loginBtn: { backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8, marginBottom: 12, width: '80%', alignItems: 'center' },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  registerBtn: { backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', width: '80%', alignItems: 'center' },
  registerBtnText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 16 },
});