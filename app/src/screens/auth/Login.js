import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../Final_app/src/contexts/AuthContext';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    // Navigation handled by AppNavigator based on auth state
  };

  return (
    <LinearGradient
      colors={['#1f4068', '#2980b9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Card */}
          <View style={styles.card}>
            <Ionicons name="log-in-outline" size={60} color="#fff" style={styles.icon} />
            <Text style={styles.welcomeText}>Welcome Back</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.8)" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.8)" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2980b9', '#6dd5fa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Logging in...' : 'Login'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>REGISTER</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Registration Links */}
            <View style={styles.registerSection}>
              {/* Row 1: Patient alone */}
              <View style={styles.registerRow}>
                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={() => navigation.navigate('RegisterPatient')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerLinkText}>Patient</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2: Doctor & Receptionist */}
              <View style={styles.registerRow}>
                <TouchableOpacity
                  style={[styles.registerLink, styles.registerLinkHalf]}
                  onPress={() => navigation.navigate('RegisterDoctor')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerLinkText}>Doctor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.registerLink, styles.registerLinkHalf]}
                  onPress={() => navigation.navigate('RegisterReceptionist')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerLinkText}>Receptionist</Text>
                </TouchableOpacity>
              </View>

              {/* Row 3: Cleaning Staff & Lab Technician */}
              <View style={styles.registerRow}>
                <TouchableOpacity
                  style={[styles.registerLink, styles.registerLinkHalf]}
                  onPress={() => navigation.navigate('RegisterCleaningStaff')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerLinkText}>Cleaning Staff</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.registerLink, styles.registerLinkHalf]}
                  onPress={() => navigation.navigate('RegisterLabTechnician')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerLinkText}>Lab Technician</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.37,
    shadowRadius: 32,
    elevation: 8,
  },
  icon: {
    textAlign: 'center',
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
    fontSize: 14,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#fff',
    padding: 0,
  },
  loginButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    fontSize: 12,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  registerSection: {
    marginTop: 16,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  registerLink: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  registerLinkHalf: {
    flex: 1,
    marginHorizontal: 6,
  },
  registerLinkText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});