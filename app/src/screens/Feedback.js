import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../api/axios';
import { formatDate } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data } = await api.get('/admin/feedback');
      setFeedbacks(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to delete this feedback?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/feedback/${id}`);
              fetchFeedbacks();
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
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= item.rating ? 'star' : 'star-outline'}
            size={18}
            color="#fbbf24"
          />
        ))}
        <Text style={styles.ratingText}> ({item.rating}/5)</Text>
      </View>
      {item.comment && <Text style={styles.comment}>"{item.comment}"</Text>}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={feedbacks}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No feedback found.</Text>}
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
  date: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  comment: { fontSize: 14, color: '#4b5563', marginTop: 12, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});