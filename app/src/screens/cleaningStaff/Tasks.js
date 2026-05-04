import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../api/axios';
import { formatDate, formatTime } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function CleaningTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/cleaning-tasks/my');
      setTasks(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/cleaning-tasks/${id}/complete`);
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark task as complete');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.area}>{item.area}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
        </View>
        <View style={styles.actions}>
          {item.status === 'pending' && (
            <TouchableOpacity onPress={() => handleComplete(item._id)} style={styles.completeBtn}>
              <Ionicons name="checkmark-circle" size={28} color="#10b981" />
            </TouchableOpacity>
          )}
          <Text style={[styles.status, { color: item.status === 'completed' ? '#10b981' : '#f59e0b' }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No tasks assigned.</Text>}
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
  info: { flex: 1 },
  area: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  date: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  desc: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  actions: { alignItems: 'flex-end' },
  completeBtn: { marginBottom: 8 },
  status: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});