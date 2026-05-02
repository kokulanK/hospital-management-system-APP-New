import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'patient' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'patient' });
    setModalVisible(true);
  };

  const openEdit = (user) => {
    if (user.role === 'admin') {
      Alert.alert('Forbidden', 'Admin accounts cannot be edited.');
      return;
    }
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser._id}`, formData);
        Alert.alert('Success', 'User updated');
      } else {
        await api.post('/admin/users', formData);
        Alert.alert('Success', 'User created');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id, role) => {
    if (role === 'admin') {
      Alert.alert('Forbidden', 'Admin accounts cannot be deleted.');
      return;
    }
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${id}`);
              fetchUsers();
            } catch (error) {
              Alert.alert('Error', 'Delete failed');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={[styles.userRole, { color: item.role === 'admin' ? '#ef4444' : '#3b82f6' }]}>
          {item.role}
        </Text>
      </View>
      {item.role !== 'admin' && (
        <View style={styles.userActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id, item.role)} style={styles.actionBtn}>
            <Ionicons name="trash" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.createBtnText}>New User</Text>
      </TouchableOpacity>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Edit User' : 'Create User'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
            />
            <View style={styles.roleSelect}>
              {['patient', 'doctor', 'receptionist', 'labTechnician', 'cleaningStaff'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    formData.role === role && styles.roleOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, role })}
                >
                  <Text
                    style={[
                      styles.roleText,
                      formData.role === role && styles.roleTextActive,
                    ]}
                  >
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.submitBtn]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitBtnText}>Save</Text>
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
  createBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  userEmail: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  userRole: { fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  userActions: { flexDirection: 'row' },
  actionBtn: { marginLeft: 12 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  roleSelect: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  roleOptionActive: { backgroundColor: '#3b82f6' },
  roleText: { fontSize: 12, color: '#374151' },
  roleTextActive: { color: 'white' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f3f4f6', marginRight: 8 },
  cancelBtnText: { color: '#374151', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#3b82f6', marginLeft: 8 },
  submitBtnText: { color: 'white', fontWeight: 'bold' },
});