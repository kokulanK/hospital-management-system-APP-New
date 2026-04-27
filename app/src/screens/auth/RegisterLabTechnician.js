import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterLabTechnician({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState('');
  const { register } = useAuth();

  // Auto-navigate after successful registration with pending approval
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        navigation.navigate('Login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, navigation]);

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 6) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;

    setPasswordStrength(strength);

    if (pwd.length < 6) setPasswordMessage('Password must be at least 6 characters');
    else if (strength < 50) setPasswordMessage('Weak password');
    else if (strength < 75) setPasswordMessage('Moderate password');
    else setPasswordMessage('Strong password');
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    calculatePasswordStrength(text);
  };

  const handleRegister = async () => {
    setError('');
    setMessage('');

    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register({ name, email, password, role: 'labTechnician' });
    setLoading(false);

    if (result.success && result.pending) {
      setMessage('Registration successful. Please wait for admin approval. You will be notified once approved.');
      return;
    }

    if (result.success) {
      // Auto-login handled by AuthContext, no navigation needed
      return;
    }

    setError(result.error);
  };

  const getStrengthColor = () => {
    if (passwordStrength < 50) return '#ff6b6b';
    if (passwordStrength < 75) return '#f1c40f';
    return '#2ecc71';
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
          <View style={styles.card}>
            <Ionicons name="flask-outline" size={60} color="#fff" style={styles.icon} />
            <Text style={styles.headerText}>Register as Lab Technician</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {message ? <Text style={styles.successText}>{message}</Text> : null}

            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.8)" />
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={name}
                onChangeText={setName}
              />
            </View>

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

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.8)" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
              />
            </View>

            {/* Password strength bar */}
            {password.length > 0 && (
              <>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      { width: `${passwordStrength}%`, backgroundColor: getStrengthColor() },
                    ]}
                  />
                </View>
                <Text style={styles.passwordMessage}>{passwordMessage}</Text>
              </>
            )}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2980b9', '#6dd5fa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Registering...' : 'Register'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>
                  Already have an account? <Text style={styles.loginHighlight}>Login</Text>
                </Text>
              </TouchableOpacity>
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
  headerText: {
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
  successText: {
    color: '#2ecc71',
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
  strengthBar: {
    height: 6,
    borderRadius: 5,
    backgroundColor: '#555',
    marginTop: 5,
    marginBottom: 5,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 5,
  },
  passwordMessage: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'left',
  },
  registerButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLink: {
    fontSize: 13,
    color: '#fff',
  },
  loginHighlight: {
    color: '#00c6ff',
    textDecorationLine: 'underline',
  },
});