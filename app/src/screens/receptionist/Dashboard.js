import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { getGreeting } from '../../utils/helpers';
import { useNavigation } from '@react-navigation/native';

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState({ total: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments/all');
      const upcoming = data.filter(a => new Date(a.date) >= new Date()).length;
      setStats({ total: data.length, upcoming });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { name: 'Book Appointment', icon: 'calendar', screen: 'Appointments' },
    { name: 'AI Scanner', icon: 'camera', screen: 'Scanner' },
    { name: 'Cleaning Tasks', icon: 'broom', screen: 'Cleaning' },
  ];

  const statCards = [
    { label: 'Total Appointments', value: stats.total, icon: 'calendar', color: '#3b82f6' },
    { label: 'Upcoming', value: stats.upcoming, icon: 'time', color: '#f59e0b' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0]}</Text>
      <Text style={styles.subGreeting}>Manage appointments and assist patients.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
      ) : (
        <>
          <View style={styles.statsContainer}>
            {statCards.map((stat, idx) => (
              <View key={idx} style={styles.statCard}>
                <Ionicons name={stat.icon} size={28} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen)}
              >
                <Ionicons name={action.icon} size={32} color="#3b82f6" />
                <Text style={styles.actionLabel}>{action.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subGreeting: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  loader: { marginTop: 40 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1f2937' },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: {
    width: '31%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionLabel: { fontSize: 14, fontWeight: '500', marginTop: 8, color: '#374151' },
});