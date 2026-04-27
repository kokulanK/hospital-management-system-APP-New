import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { getGreeting } from '../../utils/helpers';

export default function LabTechnicianDashboard({ navigation }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.name?.split(' ')[0] || 'Technician';
  const greeting = getGreeting();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/lab-requests/lab');
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const acceptedCount = requests.filter(r => r.status === 'accepted').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  const stats = [
    { label: 'Pending', value: pendingCount, icon: 'time-outline', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Accepted', value: acceptedCount, icon: 'checkmark-circle-outline', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Completed', value: completedCount, icon: 'flask-outline', color: '#10b981', bg: '#ecfdf5' },
  ];

  const recentRequests = requests.slice(0, 5);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#fffbeb', textColor: '#d97706' };
      case 'accepted':
        return { bg: '#eff6ff', textColor: '#2563eb' };
      case 'completed':
        return { bg: '#ecfdf5', textColor: '#059669' };
      default:
        return { bg: '#f3f4f6', textColor: '#6b7280' };
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Gradient (matches web version) */}
      <LinearGradient
        colors={['#0f172a', '#1e3a5f', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroBadge}>
          {greeting}, Lab Technician
        </Text>
        <Text style={styles.heroTitle}>{firstName}</Text>
        <Text style={styles.heroDescription}>
          Manage lab requests, process samples, and upload results.
        </Text>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {stats.map((stat, idx) => (
          <View key={idx} style={[styles.statCard, { backgroundColor: stat.bg }]}>
            <Ionicons name={stat.icon} size={28} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent Lab Requests Section */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Lab Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1d4ed8" style={styles.loader} />
        ) : recentRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={48} color="#e5e7eb" />
            <Text style={styles.emptyText}>No lab requests yet.</Text>
          </View>
        ) : (
          recentRequests.map((req) => {
            const statusStyle = getStatusStyle(req.status);
            return (
              <View key={req._id} style={styles.requestRow}>
                <View>
                  <Text style={styles.patientName}>{req.patient?.name}</Text>
                  <Text style={styles.testType}>{req.testType}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
                    {req.status}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  hero: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 20,
  },
  heroBadge: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#bfdbfe',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  heroDescription: {
    fontSize: 14,
    color: '#bfdbfe',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  recentSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3b82f6',
  },
  loader: {
    marginVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  testType: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});