import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function NotFound() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>Page not found</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.btnText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 48, fontWeight: 'bold', color: '#ef4444' },
  subtitle: { fontSize: 18, color: '#6b7280', marginTop: 8, marginBottom: 20 },
  btn: { backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
});