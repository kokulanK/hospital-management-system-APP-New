import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../api/axios';
import { formatDate } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function CleaningSupplyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ itemName: '', quantity: '1', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/supply-requests/my');
      setRequests(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.itemName || !formData.quantity) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/supply-requests', {
        itemName: formData.itemName,
        quantity: parseInt(formData.quantity),
        notes: formData.notes,
      });
      Alert.alert('Success', 'Request submitted');
      setModalVisible(false);
      setFormData({ itemName: '', quantity: '1', notes: '' });
      fetchRequests();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
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
          {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.createBtnText}>New Request</Text>
      </TouchableOpacity>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No supply requests yet.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Supplies</Text>
            <TextInput
              style={styles.input}
              placeholder="Item Name"
              value={formData.itemName}
              onChangeText={(text) => setFormData({ ...formData, itemName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  createBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  createBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
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
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  details: { fontSize: 14, color: '#4b5563', marginTop: 4 },
  notes: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  status: { fontSize: 12, fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f3f4f6', marginRight: 8 },
  cancelBtnText: { color: '#374151', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#3b82f6', marginLeft: 8 },
  submitBtnText: { color: 'white', fontWeight: 'bold' },
});