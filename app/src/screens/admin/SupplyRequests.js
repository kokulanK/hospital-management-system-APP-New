import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../api/axios';
import { formatDate } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSupplyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/supply-requests');
      setRequests(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load supply requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/supply-requests/${id}`, { status: newStatus });
      fetchRequests();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Update failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#3b82f6';
      case 'delivered': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <Text style={styles.details}>Quantity: {item.quantity}</Text>
          <Text style={styles.staff}>Requested by: {item.staff?.name}</Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.actions}>
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
          {item.status === 'pending' && (
            <TouchableOpacity
              onPress={() => handleStatusUpdate(item._id, 'approved')}
              style={styles.approveBtn}
            >
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          )}
          {item.status === 'approved' && (
            <TouchableOpacity
              onPress={() => handleStatusUpdate(item._id, 'delivered')}
              style={styles.deliverBtn}
            >
              <Text style={styles.deliverText}>Deliver</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No supply requests.</Text>}
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
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  details: { fontSize: 14, color: '#4b5563', marginTop: 4 },
  staff: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  actions: { alignItems: 'flex-end' },
  status: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  approveBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  approveText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  deliverBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  deliverText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});