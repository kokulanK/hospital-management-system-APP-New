import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../api/axios';
import { formatDate } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function ReceptionistCleaningTasks() {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({ assignedTo: '', area: '', date: '', description: '', status: 'pending' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchStaff();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/cleaning-tasks');
      setTasks(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/users/cleaning-staff');
      setStaff(data);
    } catch (error) {
      console.error(error);
    }
  };

  const openCreate = () => {
    setEditingTask(null);
    setFormData({ assignedTo: '', area: '', date: new Date().toISOString().split('T')[0], description: '', status: 'pending' });
    setModalVisible(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setFormData({
      assignedTo: task.assignedTo?._id || '',
      area: task.area,
      date: new Date(task.date).toISOString().split('T')[0],
      description: task.description || '',
      status: task.status,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.assignedTo || !formData.area || !formData.date) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      if (editingTask) {
        await api.put(`/cleaning-tasks/${editingTask._id}`, formData);
        Alert.alert('Success', 'Task updated');
      } else {
        await api.post('/cleaning-tasks', formData);
        Alert.alert('Success', 'Task created');
      }
      setModalVisible(false);
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/cleaning-tasks/${id}`);
            fetchTasks();
          } catch (error) {
            Alert.alert('Error', 'Delete failed');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.area}>{item.area}</Text>
          <Text style={styles.staff}>Assigned to: {item.assignedTo?.name}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
        </View>
        <View style={styles.actions}>
          <Text style={[styles.status, { color: item.status === 'completed' ? '#10b981' : '#f59e0b' }]}>
            {item.status}
          </Text>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
            <Ionicons name="pencil" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
            <Ionicons name="trash" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.createBtnText}>New Task</Text>
      </TouchableOpacity>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No cleaning tasks.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Area"
              value={formData.area}
              onChangeText={(text) => setFormData({ ...formData, area: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />
            <View style={styles.selectRow}>
              <Text style={styles.label}>Assign to:</Text>
              <FlatList
                horizontal
                data={staff}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, assignedTo: item._id })}
                    style={[
                      styles.staffOption,
                      formData.assignedTo === item._id && styles.staffOptionActive,
                    ]}
                  >
                    <Text style={[styles.staffText, formData.assignedTo === item._id && styles.staffTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            {editingTask && (
              <View style={styles.selectRow}>
                <Text style={styles.label}>Status:</Text>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, status: 'pending' })}
                  style={[styles.statusOption, formData.status === 'pending' && styles.statusOptionActive]}
                >
                  <Text style={formData.status === 'pending' ? styles.statusTextActive : styles.statusText}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, status: 'completed' })}
                  style={[styles.statusOption, formData.status === 'completed' && styles.statusOptionActive]}
                >
                  <Text style={formData.status === 'completed' ? styles.statusTextActive : styles.statusText}>Completed</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.submitBtnText}>{submitting ? 'Saving...' : 'Save'}</Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  area: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  staff: { fontSize: 14, color: '#4b5563', marginTop: 4 },
  date: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  desc: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  actions: { alignItems: 'flex-end' },
  status: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize', marginBottom: 8 },
  editBtn: { marginBottom: 8 },
  deleteBtn: {},
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  selectRow: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  staffOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  staffOptionActive: { backgroundColor: '#3b82f6' },
  staffText: { fontSize: 12, color: '#374151' },
  staffTextActive: { color: 'white' },
  statusOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  statusOptionActive: { backgroundColor: '#3b82f6' },
  statusText: { fontSize: 12, color: '#374151' },
  statusTextActive: { color: 'white' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f3f4f6', marginRight: 8 },
  cancelBtnText: { color: '#374151', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#3b82f6', marginLeft: 8 },
  submitBtnText: { color: 'white', fontWeight: 'bold' },
});