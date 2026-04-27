import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Image
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../utils/helpers';

export default function PatientDashboard({ navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [pastScans, setPastScans] = useState([]);
  const [tip, setTip] = useState('');
  const [tipLoading, setTipLoading] = useState(true);

  const firstName = user?.name?.split(' ')[0] || 'Patient';
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    fetchData();
    fetchTip();
  }, []);

  const fetchData = async () => {
    try {
      const [appRes, scansRes] = await Promise.all([
        api.get('/appointments/patient'),
        api.get('/skin-images'),
      ]);
      setAppointments(appRes.data);
      setPastScans(scansRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTip = async () => {
    try {
      const { data } = await api.get('/patient/tip');
      setTip(data.tip);
    } catch (err) {
      console.error('Failed to load health tip');
    } finally {
      setTipLoading(false);
    }
  };

  const upcomingAppointments = appointments
    .filter(a => new Date(a.date) >= new Date() && a.status === 'scheduled')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const nextAppointment = upcomingAppointments[0];
  const completedCount = appointments.filter(a => new Date(a.date) < new Date() || a.status === 'completed').length;

  const stats = [
    { label: t.dashboard.statTotalVisits, value: appointments.length, icon: 'calendar', color: '#3b82f6', bg: '#eff6ff' },
    { label: t.dashboard.statUpcoming, value: upcomingAppointments.length, icon: 'time', color: '#f59e0b', bg: '#fffbeb' },
    { label: t.dashboard.statSkinScans, value: pastScans.length, icon: 'camera', color: '#8b5cf6', bg: '#f5f3ff' },
    { label: t.dashboard.completed, value: completedCount, icon: 'checkmark-circle', color: '#10b981', bg: '#ecfdf5' },
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.greeting}>{getGreeting()}, {firstName} 👋</Text>
        <Text style={styles.subGreeting}>{t.dashboard.welcomeBack}</Text>
        {nextAppointment ? (
          <View style={styles.nextAppointment}>
            <View style={styles.pulseDot} />
            <View>
              <Text style={styles.nextLabel}>{t.dashboard.nextAppointment}</Text>
              <Text style={styles.nextText}>
                Dr. {nextAppointment.doctor?.name} – {formatDate(nextAppointment.date)} at {new Date(nextAppointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noAppointment}>
            <Ionicons name="calendar-outline" size={16} color="#bfdbfe" />
            <Text style={styles.noAppointmentText}>{t.dashboard.noUpcoming}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {stats.map((stat, idx) => (
          <View key={idx} style={[styles.statCard, { backgroundColor: stat.bg }]}>
            <Ionicons name={stat.icon} size={24} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Health Tip */}
      {!tipLoading && tip ? (
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color="#d97706" />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ) : null}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>{t.dashboard.quickActions}</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Appointments')}>
          <Ionicons name="calendar" size={32} color="#3b82f6" />
          <Text style={styles.actionLabel}>{t.dashboard.bookAppointment}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Scanner')}>
          <Ionicons name="camera" size={32} color="#8b5cf6" />
          <Text style={styles.actionLabel}>{t.dashboard.aiScanner}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Feedback')}>
          <Ionicons name="star" size={32} color="#10b981" />
          <Text style={styles.actionLabel}>{t.dashboard.feedback}</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t.dashboard.upcomingAppointments}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.seeAll}>{t.dashboard.seeAll}</Text>
          </TouchableOpacity>
        </View>
        {upcomingAppointments.length === 0 ? (
          <Text style={styles.emptyText}>{t.dashboard.noUpcoming}</Text>
        ) : (
          upcomingAppointments.map((app) => (
            <View key={app._id} style={styles.appointmentRow}>
              <View>
                <Text style={styles.doctorName}>Dr. {app.doctor?.name}</Text>
                <Text style={styles.appointmentDate}>{formatDate(app.date)}</Text>
              </View>
              <Text style={styles.appointmentTime}>
                {new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Recent Scans */}
      {pastScans.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t.dashboard.recentScans}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Scanner')}>
              <Text style={styles.seeAll}>{t.dashboard.seeAll}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pastScans.slice(0, 5).map((scan) => (
              <TouchableOpacity key={scan._id} style={styles.scanItem} onPress={() => navigation.navigate('Scanner')}>
                <Image source={{ uri: scan.imageUrl }} style={styles.scanImage} />
                <Text style={styles.scanDate}>{formatDate(scan.createdAt)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ... (keep all existing styles exactly as they were)
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { backgroundColor: '#1e3a5f', borderRadius: 16, padding: 20, marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  subGreeting: { fontSize: 14, color: '#bfdbfe', marginBottom: 12 },
  nextAppointment: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, gap: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  nextLabel: { fontSize: 10, color: '#bfdbfe' },
  nextText: { fontSize: 12, fontWeight: 'bold', color: 'white' },
  noAppointment: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, gap: 8 },
  noAppointmentText: { fontSize: 12, color: '#bfdbfe' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4, color: '#1f2937' },
  statLabel: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  tipCard: { flexDirection: 'row', backgroundColor: '#fef9c3', borderRadius: 12, padding: 12, alignItems: 'center', gap: 8, marginBottom: 20 },
  tipText: { flex: 1, fontSize: 12, color: '#92400e' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  actionCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  actionLabel: { fontSize: 12, fontWeight: '500', marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  seeAll: { fontSize: 12, color: '#3b82f6' },
  appointmentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  doctorName: { fontSize: 14, fontWeight: '500' },
  appointmentDate: { fontSize: 12, color: '#6b7280' },
  appointmentTime: { fontSize: 12, color: '#6b7280' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
  scanItem: { alignItems: 'center', marginRight: 16 },
  scanImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f3f4f6' },
  scanDate: { fontSize: 10, color: '#6b7280', marginTop: 6, textAlign: 'center' },
});