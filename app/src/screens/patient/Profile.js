import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Alert,
  StyleSheet, Modal
} from 'react-native';
import { useAuth } from '../../../../Final_app/src/contexts/AuthContext';
import { useLanguage } from '../../../../Final_app/src/contexts/LanguageContext';
import api from '../../../../Final_app/src/api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function PatientProfile() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'P';
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' }) : 'January 2025';

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setError(t.profile?.passwordsDoNotMatch || 'Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/users/profile', {
        name,
        currentPassword,
        newPassword,
      });
      const updatedUser = { ...user, name: data.name };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setMessage(t.profile?.updateSuccess || 'Profile updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || t.profile?.updateFailed || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete('/users/profile');
      await logout();
    } catch (err) {
      setError(err.response?.data?.message || t.profile?.deleteFailed || 'Account deletion failed');
      setShowDeleteModal(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroRole}>MY ACCOUNT</Text>
          <Text style={styles.heroName}>{user?.name || 'Patient'}</Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Stats & Guide */}
      <View style={styles.statsGuideRow}>
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="time-outline" size={18} color="#3b82f6" />
            <Text style={styles.statsTitle}>Account Summary</Text>
          </View>
          <View style={styles.statsGrid}>
            <View><Text style={styles.statLabel}>Member since</Text><Text style={styles.statValue}>{memberSince}</Text></View>
            <View><Text style={styles.statLabel}>Account type</Text><Text style={styles.statValue}>{user?.role || 'Patient'}</Text></View>
          </View>
        </View>

        <TouchableOpacity style={styles.guideCard} onPress={() => setShowGuide(!showGuide)}>
          <View style={styles.guideHeader}>
            <Ionicons name="information-circle-outline" size={18} color="#8b5cf6" />
            <Text style={styles.guideTitle}>User Guide</Text>
            <Ionicons name={showGuide ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
          </View>
          {showGuide && (
            <View style={styles.guideContent}>
              <Text>✏️ Update your name.</Text>
              <Text>🔒 Change password using current + new.</Text>
              <Text>⚠️ Delete account permanently removes all data.</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {message ? (
        <View style={[styles.toast, styles.toastSuccess]}>
          <Ionicons name="checkmark-circle" size={20} color="#059669" />
          <Text style={styles.toastText}>{message}</Text>
          <TouchableOpacity onPress={() => setMessage('')}><Ionicons name="close" size={18} color="#9ca3af" /></TouchableOpacity>
        </View>
      ) : null}
      {error ? (
        <View style={[styles.toast, styles.toastError]}>
          <Ionicons name="close-circle" size={20} color="#dc2626" />
          <Text style={styles.toastText}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')}><Ionicons name="close" size={18} color="#9ca3af" /></TouchableOpacity>
        </View>
      ) : null}

      {/* Form */}
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Ionicons name="create-outline" size={20} color="#3b82f6" />
          <Text style={styles.formTitle}>Personal Information</Text>
        </View>
        <Text style={styles.label}>{t.profile?.fullName || 'Full Name'}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />

        <Text style={styles.label}>{t.profile?.emailAddress || 'Email Address'}</Text>
        <TextInput style={[styles.input, styles.disabledInput]} value={user?.email} editable={false} />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>{t.profile?.changePassword || 'Change Password'}</Text>
        <Text style={styles.helperText}>{t.profile?.leaveBlank || '(leave blank to keep current)'}</Text>

        <Text style={styles.label}>{t.profile?.currentPassword || 'Current Password'}</Text>
        <TextInput style={styles.input} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" />

        <Text style={styles.label}>{t.profile?.newPassword || 'New Password'}</Text>
        <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="New password" />

        <Text style={styles.label}>{t.profile?.confirmPassword || 'Confirm New Password'}</Text>
        <TextInput style={styles.input} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" />
        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <Text style={styles.matchError}>Passwords do not match</Text>
        )}
        {newPassword && confirmPassword && newPassword === confirmPassword && (
          <Text style={styles.matchSuccess}>Passwords match</Text>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveButtonText}>{loading ? 'Saving...' : t.profile?.saveChanges || 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
          <Text style={styles.deleteButtonText}>{t.profile?.deleteAccount || 'Delete Account'}</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.modalTitle}>{t.profile?.deleteConfirmTitle || 'Delete Account?'}</Text>
            <Text style={styles.modalText}>{t.profile?.deleteWarning || 'This will permanently delete your account and all data. This action cannot be undone.'}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text>{t.common?.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleDelete}>
                <Text style={styles.modalConfirmText}>{t.common?.yes || 'Yes, Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  hero: { backgroundColor: '#1e3a5f', borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarRing: { borderRadius: 9999, padding: 3, backgroundColor: '#60a5fa' },
  avatarInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  heroText: { flex: 1 },
  heroRole: { fontSize: 10, fontWeight: '600', color: '#bfdbfe', letterSpacing: 1, marginBottom: 2 },
  heroName: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  heroEmail: { fontSize: 12, color: '#bfdbfe' },
  statsGuideRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statsCard: { flex: 2, backgroundColor: 'white', borderRadius: 12, padding: 12 },
  statsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statsTitle: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 10, color: '#6b7280' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  guideCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, justifyContent: 'center' },
  guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guideTitle: { fontSize: 14, fontWeight: '600', marginLeft: 6, flex: 1 },
  guideContent: { marginTop: 8, gap: 4 },
  toast: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8 },
  toastSuccess: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  toastError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  toastText: { flex: 1, fontSize: 13 },
  formCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 20 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 12 },
  formTitle: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 14 },
  disabledInput: { backgroundColor: '#f9fafb', color: '#9ca3af' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#1f2937' },
  helperText: { fontSize: 11, color: '#9ca3af', marginBottom: 12 },
  matchError: { fontSize: 11, color: '#dc2626', marginTop: -12, marginBottom: 12 },
  matchSuccess: { fontSize: 11, color: '#059669', marginTop: -12, marginBottom: 12 },
  saveButton: { backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  deleteButton: { borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16, backgroundColor: '#fef2f2' },
  deleteButtonText: { color: '#ef4444', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  modalText: { textAlign: 'center', marginBottom: 20, color: '#6b7280' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  modalCancelBtn: { flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modalConfirmBtn: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modalConfirmText: { color: 'white', fontWeight: 'bold' },
});