import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CleaningProfile() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'CS';

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    setError('');
    setMessage('');

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.put('/users/profile', {
        name: formData.name,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      // Update stored user
      const updatedUser = { ...user, name: data.name };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setMessage('Profile updated successfully');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Navigation will be handled by AuthContext / AppNavigator
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#0f172a', '#1e3a5f', '#1d4ed8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <View style={styles.avatarRing}>
              <LinearGradient
                colors={['#60a5fa', '#a78bfa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </LinearGradient>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroRole}>Cleaning Staff Account</Text>
              <Text style={styles.heroName}>{user?.name || 'Staff'}</Text>
              <Text style={styles.heroEmail}>{user?.email}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Toast Messages */}
        {message ? (
          <View style={[styles.toast, styles.toastSuccess]}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.toastTextSuccess}>{message}</Text>
            <TouchableOpacity onPress={() => setMessage('')}>
              <Ionicons name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.toast, styles.toastError]}>
            <Ionicons name="close-circle" size={20} color="#dc2626" />
            <Text style={styles.toastTextError}>{error}</Text>
            <TouchableOpacity onPress={() => setError('')}>
              <Ionicons name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="create-outline" size={18} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Personal Information</Text>
              <Text style={styles.cardSubtitle}>
                Update your name and account details
              </Text>
            </View>
          </View>

          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor="#9ca3af"
                  value={formData.name}
                  onChangeText={(text) => handleChange('name', text)}
                />
              </View>
            </View>

            {/* Email (disabled) */}
            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={user?.email || ''}
                  editable={false}
                />
              </View>
              <Text style={styles.helperText}>Email address cannot be changed.</Text>
            </View>

            <View style={styles.divider} />

            {/* Change Password Section */}
            <View style={styles.passwordHeader}>
              <Ionicons name="lock-closed-outline" size={14} color="#6b7280" />
              <Text style={styles.passwordTitle}>Change Password</Text>
              <Text style={styles.passwordHelper}>(leave blank to keep current)</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={formData.currentPassword}
                  onChangeText={(text) => handleChange('currentPassword', text)}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={formData.newPassword}
                  onChangeText={(text) => handleChange('newPassword', text)}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleChange('confirmPassword', text)}
                />
              </View>
              {formData.newPassword && formData.confirmPassword && (
                formData.newPassword !== formData.confirmPassword ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="close-circle" size={10} color="#dc2626" />
                    <Text style={styles.matchError}>Passwords do not match</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={10} color="#059669" />
                    <Text style={styles.matchSuccess}>Passwords match</Text>
                  </View>
                )
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1d4ed8', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                <Text style={styles.saveButtonText}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Logout Button */}
            <View style={styles.logoutSeparator} />
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  hero: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarRing: {
    borderRadius: 9999,
    padding: 3,
  },
  avatarGradient: {
    borderRadius: 9999,
    padding: 1,
  },
  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroText: {
    flex: 1,
  },
  heroRole: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#bfdbfe',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  heroEmail: {
    fontSize: 12,
    color: '#bfdbfe',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  toastSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  toastError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  toastTextSuccess: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#065f46',
  },
  toastTextError: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#b91c1c',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 11,
    paddingRight: 12,
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
  },
  helperText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 6,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  passwordTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  passwordHelper: {
    fontSize: 11,
    color: '#9ca3af',
  },
  matchError: {
    fontSize: 11,
    color: '#dc2626',
    marginTop: 6,
    marginLeft: 4,
  },
  matchSuccess: {
    fontSize: 11,
    color: '#059669',
    marginTop: 6,
    marginLeft: 4,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutSeparator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
});