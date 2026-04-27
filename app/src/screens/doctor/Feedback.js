import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../api/axios';
import { formatDate } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const { data } = await api.get('/feedback/doctor');
      setFeedbacks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.patientName}>{item.patient?.name}</Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.rating}>
          {[1,2,3,4,5].map(star => (
            <Ionicons
              key={star}
              name={star <= item.rating ? 'star' : 'star-outline'}
              size={18}
              color="#fbbf24"
            />
          ))}
          <Text style={styles.ratingText}> ({item.rating}/5)</Text>
        </View>
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
        ListEmptyComponent={<Text style={styles.empty}>No feedback received yet.</Text>}
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
  rating: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  comment: { marginTop: 12, fontSize: 14, color: '#4b5563', fontStyle: 'italic' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});