import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { getGreeting } from '../../utils/helpers';
import { useNavigation } from '@react-navigation/native';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState({ upcoming: 0, total: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appRes, fbRes] = await Promise.all([
        api.get('/appointments/doctor'),
        api.get('/feedback/doctor'),
      ]);
      const appointments = appRes.data;
      const upcoming = appointments.filter(a => a.status === 'scheduled' && new Date(a.startTime || a.date) >= new Date()).length;
      const total = appointments.length;
      const avgRating = fbRes.data.length
        ? (fbRes.data.reduce((sum, f) => sum + f.rating, 0) / fbRes.data.length).toFixed(1)
        : 0;
      setStats({ upcoming, total, avgRating });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { name: 'Availability', icon: 'time', screen: 'Availability' },
    { name: 'Appointments', icon: 'calendar', screen: 'Appointments' },
    { name: 'Feedback', icon: 'star', screen: 'Feedback' },
    { name: 'Lab Requests', icon: 'flask', screen: 'Lab' },
  ];

  const statCards = [
    { label: 'Upcoming', value: stats.upcoming, icon: 'calendar', color: '#3b82f6' },
    { label: 'Total Appointments', value: stats.total, icon: 'checkmark-circle', color: '#10b981' },
    { label: 'Avg Rating', value: stats.avgRating, icon: 'star', color: '#f59e0b' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>{getGreeting()}, Dr. {user?.name?.split(' ')[0]}</Text>
      <Text style={styles.subGreeting}>Manage your practice and patient care.</Text>

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
    backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center',
    flex: 1, marginHorizontal: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1f2937' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: {
    width: '48%', backgroundColor: 'white', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  actionLabel: { fontSize: 14, fontWeight: '500', marginTop: 8, color: '#374151' },
});