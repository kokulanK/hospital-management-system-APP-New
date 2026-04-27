import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Image, Alert, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function ReceptionistAIScanner() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    searchPatients('');
  }, []);

  const searchPatients = async (query) => {
    try {
      const { data } = await api.get(`/users/patients?search=${query}`);
      setPatients(data);
    } catch (error) {
      console.error(error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permission to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageFile(result.assets[0]);
      setResult('');
    }
  };

  const handleCreatePatient = async () => {
    if (!newPatient.name || !newPatient.email || !newPatient.password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/users/patients', newPatient);
      setSelectedPatient(data);
      setShowCreateModal(false);
      setNewPatient({ name: '', email: '', password: '' });
      Alert.alert('Success', 'Patient created');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile || !selectedPatient) {
      Alert.alert('Error', 'Please select a patient and upload an image');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      name: 'scan.jpg',
      type: 'image/jpeg',
    });
    // No dummy analysisResult – backend will generate real AI prediction
    formData.append('patientId', selectedPatient._id);
    try {
      const { data } = await api.post('/skin-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.analysisResult || 'Analysis saved.');
    } catch (error) {
      Alert.alert('Error', 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI Skin Scanner for Patients</Text>
      <Text style={styles.subtitle}>Upload a photo for a patient</Text>

      {/* Patient Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Patient</Text>
        <TextInput
          style={styles.input}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            searchPatients(text);
          }}
        />
        <View style={styles.patientsList}>
          {patients.map((p) => (
            <TouchableOpacity
              key={p._id}
              style={[styles.patientCard, selectedPatient?._id === p._id && styles.patientCardActive]}
              onPress={() => setSelectedPatient(p)}
            >
              <Text style={styles.patientName}>{p.name}</Text>
              <Text style={styles.patientEmail}>{p.email}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.createPatientBtn} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createPatientBtnText}>Create New Patient</Text>
        </TouchableOpacity>
        {selectedPatient && (
          <View style={styles.selectedPatient}>
            <Text>Selected: {selectedPatient.name}</Text>
            <TouchableOpacity onPress={() => setSelectedPatient(null)}>
              <Ionicons name="close" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Image Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Skin Image</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Ionicons name="images" size={24} color="white" />
          <Text style={styles.uploadBtnText}>Select from Gallery</Text>
        </TouchableOpacity>
        {image && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity onPress={() => { setImage(null); setImageFile(null); }} style={styles.removeImageBtn}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.analyzeBtn, (!imageFile || !selectedPatient) && styles.disabledBtn]}
          onPress={handleAnalyze}
          disabled={loading || !imageFile || !selectedPatient}
        >
          <Text style={styles.analyzeBtnText}>{loading ? 'Analyzing...' : 'Analyze & Save'}</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>Analysis Result:</Text>
          <Text>{result}</Text>
        </View>
      )}

      {/* Create Patient Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Patient</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newPatient.name}
              onChangeText={(text) => setNewPatient({ ...newPatient, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={newPatient.email}
              onChangeText={(text) => setNewPatient({ ...newPatient, email: text })}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={newPatient.password}
              onChangeText={(text) => setNewPatient({ ...newPatient, password: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowCreateModal(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleCreatePatient} disabled={submitting}>
                <Text style={styles.submitBtnText}>{submitting ? 'Creating...' : 'Create'}</Text>
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  section: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  patientsList: { marginBottom: 12 },
  patientCard: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 8 },
  patientCardActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  patientName: { fontSize: 16, fontWeight: '500' },
  patientEmail: { fontSize: 12, color: '#6b7280' },
  createPatientBtn: { flexDirection: 'row', backgroundColor: '#10b981', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  createPatientBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  selectedPatient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 },
  uploadBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  imagePreview: { position: 'relative', marginBottom: 16 },
  image: { width: '100%', height: 200, borderRadius: 8 },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 20 },
  analyzeBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#9ca3af' },
  analyzeBtnText: { color: 'white', fontWeight: 'bold' },
  resultSection: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, marginTop: 8 },
  resultTitle: { fontWeight: 'bold', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  cancelBtn: { backgroundColor: '#f3f4f6' },
  submitBtn: { backgroundColor: '#3b82f6' },
  submitBtnText: { color: 'white', fontWeight: 'bold' },
});