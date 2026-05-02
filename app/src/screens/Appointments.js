import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../api/axios';
import { formatDate, formatTime, getStatusColor } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/admin/appointments');
      setAppointments(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/appointments/${id}`);
              fetchAppointments();
            } catch (error) {
              Alert.alert('Error', 'Delete failed');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.patientName}>{item.patient?.name}</Text>
          <Text style={styles.doctorName}>Dr. {item.doctor?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.details}>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
        <Text style={styles.time}>{formatTime(item.date)}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No appointments found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  doctorName: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  details: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  date: { fontSize: 13, color: '#6b7280' },
  time: { fontSize: 13, color: '#6b7280' },
  status: { fontSize: 13, fontWeight: '500' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});