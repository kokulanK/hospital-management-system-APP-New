import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function PendingApprovals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/admin/pending-users');
      setUsers(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/approve-user/${id}`);
      fetchPending();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    Alert.alert(
      'Reject User',
      'Are you sure you want to reject this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/admin/reject-user/${id}`);
              fetchPending();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Rejection failed');
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
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.role}>{item.role}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleApprove(item._id)} style={styles.approveBtn}>
            <Ionicons name="checkmark-circle" size={28} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleReject(item._id)} style={styles.rejectBtn}>
            <Ionicons name="close-circle" size={28} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No pending approvals.</Text>}
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
  name: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  role: { fontSize: 12, color: '#9ca3af', marginTop: 4, textTransform: 'capitalize' },
  actions: { flexDirection: 'row' },
  approveBtn: { marginRight: 12 },
  rejectBtn: {},
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});