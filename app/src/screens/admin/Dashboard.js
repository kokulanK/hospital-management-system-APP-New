import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { getGreeting } from '../../utils/helpers';
import { useNavigation } from '@react-navigation/native';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState({ users: 0, appointments: 0, feedback: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, appsRes, fbRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/appointments'),
        api.get('/admin/feedback'),
      ]);
      setStats({
        users: usersRes.data.length,
        appointments: appsRes.data.length,
        feedback: fbRes.data.length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Updated quick actions in the required order
  const quickActions = [
    { name: 'Manage Users', icon: 'people', screen: 'Users' },
    { name: 'Pending Approvals', icon: 'hourglass', screen: 'PendingApprovals' },
    { name: 'Appointments', icon: 'calendar', screen: 'Appointments' },
    { name: 'Feedback', icon: 'star', screen: 'Feedback' },
    { name: 'Supplies', icon: 'cube', screen: 'SupplyRequests' },
    { name: 'Profile', icon: 'person', screen: 'Profile' },
  ];

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: 'people', color: '#3b82f6' },
    { label: 'Appointments', value: stats.appointments, icon: 'calendar', color: '#f59e0b' },
    { label: 'Feedback', value: stats.feedback, icon: 'star', color: '#10b981' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>{getGreeting()}, Admin {user?.name?.split(' ')[0]}</Text>
      <Text style={styles.subGreeting}>Full control over the system.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
      ) : (
        <>
          {/* Stats */}
          <View style={styles.statsContainer}>
            {statCards.map((stat, idx) => (
              <View key={idx} style={styles.statCard}>
                <Ionicons name={stat.icon} size={28} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '30%', // 3 items per row
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionLabel: { fontSize: 12, fontWeight: '500', marginTop: 8, color: '#374151', textAlign: 'center' },
});