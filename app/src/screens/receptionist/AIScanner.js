import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput, Image, Alert,
  ScrollView, StyleSheet, ActivityIndicator, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ---------- Analysis helpers (same as patient version) ----------
const processAnalysisData = (rawData) => {
  if (!rawData) return null;
  if (typeof rawData === 'string') {
    const confidenceMatch = rawData.match(/(\d+(?:\.\d+)?)%/);
    const hasRisk = /cancer|malignant|melanoma|high risk|urgent/i.test(rawData);
    return {
      type: 'legacy',
      summary: rawData,
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : null,
      riskLevel: hasRisk ? 'high' : 'low'
    };
  }
  if (typeof rawData === 'object') {
    if (rawData.status === 'rejected') {
      const reason = rawData.gatekeeper?.reason || 'Unknown';
      const detail = rawData.gatekeeper?.detail || '';
      let advice = 'Please retake the photo.';
      const rLower = reason.toLowerCase();
      if (rLower.includes('light') || rLower.includes('bright') || detail.toLowerCase().includes('bright')) {
        advice = 'Too dark or bright. Move to better lighting and turn off camera flash.';
      } else if (rLower.includes('blur')) {
        advice = 'Blurry image. Hold the camera steady and wait for focus.';
      } else if (rLower.includes('skin') || rLower.includes('coverage') || rLower.includes('closeup')) {
        advice = 'Not enough skin recognized. Take a close-up picture of the lesion on bare skin.';
      } else if (rLower.includes('center')) {
        advice = 'The lesion is too close to the edge of the image. Please retake the photo and keep the lesion exactly inside the target circle.';
      }
      return { type: 'rejected', reason, detail, advice };
    }
    if (rawData.status === 'accepted' && rawData.classifier) {
      const confidence = parseFloat(rawData.classifier.confidence);
      const isDanger = rawData.classifier.label === 'Danger' || rawData.classifier.prediction === 'Danger';
      if (confidence < 65) {
        return {
          type: 'uncertain',
          confidence: confidence,
          message: 'Inconclusive Analysis',
          advice: 'The AI is not confident enough to make a definitive classification. We highly recommend a professional dermatologist check this.',
          dominantLabel: isDanger ? 'danger' : 'safe'
        };
      }
      return {
        type: isDanger ? 'danger' : 'safe',
        confidence: confidence,
        message: isDanger ? 'Potential cancer signs detected' : 'No signs of cancer detected',
        advice: isDanger ? 'Please consult a doctor immediately.' : 'Looks clear, but continue to monitor for changes.'
      };
    }
  }
  return { type: 'unknown', summary: 'Analysis returned an unknown format.' };
};

const AnalysisResultView = ({ result }) => {
  if (!result) return null;
  const getStyles = () => {
    switch (result.type) {
      case 'rejected': return { bg: '#fffbeb', border: '#fde68a', iconBg: '#ffedd5', iconColor: '#d97706', titleColor: '#92400e' };
      case 'safe': return { bg: '#f0fdf4', border: '#bbf7d0', iconBg: '#dcfce7', iconColor: '#10b981', titleColor: '#166534' };
      case 'danger': return { bg: '#fef2f2', border: '#fecaca', iconBg: '#fee2e2', iconColor: '#ef4444', titleColor: '#991b1b' };
      case 'uncertain': return { bg: '#fefce8', border: '#fde047', iconBg: '#fef9c3', iconColor: '#eab308', titleColor: '#854d0e' };
      default: return { bg: '#eff6ff', border: '#bfdbfe', iconBg: '#dbeafe', iconColor: '#3b82f6', titleColor: '#1e3a8a' };
    }
  };
  const s = getStyles();

  if (result.type === 'rejected') {
    return (
      <View style={[styles.resultCard, { backgroundColor: s.bg, borderColor: s.border }]}>
        <View style={[styles.resultIcon, { backgroundColor: s.iconBg }]}>
          <Ionicons name="alert-circle" size={24} color={s.iconColor} />
        </View>
        <View style={styles.resultTextContainer}>
          <Text style={[styles.resultTitle, { color: s.titleColor }]}>Image Rejected: {result.reason}</Text>
          <Text style={styles.resultText}>{result.advice}</Text>
          <Text style={[styles.resultDetail, { color: s.iconColor }]}>{result.detail}</Text>
        </View>
      </View>
    );
  }

  if (result.type === 'uncertain') {
    const dangerProb = result.dominantLabel === 'danger' ? result.confidence : 100 - result.confidence;
    const safeProb = 100 - dangerProb;
    return (
      <View style={[styles.resultCard, { backgroundColor: s.bg, borderColor: s.border }]}>
        <View style={[styles.resultIcon, { backgroundColor: s.iconBg }]}>
          <Ionicons name="alert-circle" size={24} color={s.iconColor} />
        </View>
        <View style={styles.resultTextContainer}>
          <Text style={[styles.resultTitle, { color: s.titleColor }]}>{result.message}</Text>
          <Text style={styles.resultText}>{result.advice}</Text>
          <View style={styles.barContainer}>
            <Text style={styles.barLabel}>Malignant (Danger)</Text>
            <Text style={styles.barValue}>{dangerProb.toFixed(1)}%</Text>
            <View style={styles.barBg}><View style={[styles.barFill, { width: `${dangerProb}%`, backgroundColor: '#ef4444' }]} /></View>
          </View>
          <View style={styles.barContainer}>
            <Text style={styles.barLabel}>Benign (Safe)</Text>
            <Text style={styles.barValue}>{safeProb.toFixed(1)}%</Text>
            <View style={styles.barBg}><View style={[styles.barFill, { width: `${safeProb}%`, backgroundColor: '#10b981' }]} /></View>
          </View>
        </View>
      </View>
    );
  }

  if (result.type === 'safe' || result.type === 'danger') {
    const dangerProb = result.type === 'danger' ? result.confidence : 100 - result.confidence;
    const safeProb = 100 - dangerProb;
    const iconName = result.type === 'safe' ? 'checkmark-circle' : 'warning';
    return (
      <View style={[styles.resultCard, { backgroundColor: s.bg, borderColor: s.border }]}>
        <View style={[styles.resultIcon, { backgroundColor: s.iconBg }]}>
          <Ionicons name={iconName} size={24} color={s.iconColor} />
        </View>
        <View style={styles.resultTextContainer}>
          <Text style={[styles.resultTitle, { color: s.titleColor }]}>{result.message}</Text>
          <Text style={styles.resultText}>{result.advice}</Text>
          <View style={styles.barContainer}>
            <Text style={styles.barLabel}>Malignant (Danger)</Text>
            <Text style={styles.barValue}>{dangerProb.toFixed(1)}%</Text>
            <View style={styles.barBg}><View style={[styles.barFill, { width: `${dangerProb}%`, backgroundColor: '#ef4444' }]} /></View>
          </View>
          <View style={styles.barContainer}>
            <Text style={styles.barLabel}>Benign (Safe)</Text>
            <Text style={styles.barValue}>{safeProb.toFixed(1)}%</Text>
            <View style={styles.barBg}><View style={[styles.barFill, { width: `${safeProb}%`, backgroundColor: '#10b981' }]} /></View>
          </View>
        </View>
      </View>
    );
  }

  // legacy / unknown
  return (
    <View style={[styles.resultCard, { backgroundColor: s.bg, borderColor: s.border }]}>
      <View style={[styles.resultIcon, { backgroundColor: s.iconBg }]}>
        <Ionicons name="information-circle" size={24} color={s.iconColor} />
      </View>
      <View style={styles.resultTextContainer}>
        <Text style={[styles.resultTitle, { color: s.titleColor }]}>Analysis Complete</Text>
        <Text style={styles.resultText}>{result.summary || 'Details unavailable'}</Text>
      </View>
    </View>
  );
};

// ---------- Main Component ----------
export default function ReceptionistAIScanner() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    searchPatients('');
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    })();
  }, []);

  const searchPatients = async (query) => {
    try {
      const { data } = await api.get(`/users/patients?search=${query}`);
      setPatients(data);
    } catch (error) {
      console.error(error);
    }
  };

  const copyToCache = async (sourceUri) => {
    try {
      const ext = sourceUri.split('.').pop() || 'jpg';
      const fileName = `skin_scan_${Date.now()}.${ext}`;
      const destUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.copyAsync({ from: sourceUri, to: destUri });
      return destUri;
    } catch (error) {
      console.warn('Copy to cache failed', error);
      return sourceUri;
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,         // no cropping
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const cachedUri = await copyToCache(result.assets[0].uri);
      setImage(cachedUri);
      setImageFile({
        uri: cachedUri,
        name: result.assets[0].fileName || 'scan.jpg',
        type: result.assets[0].mimeType || 'image/jpeg',
      });
      setResult(null);
      setImageLoadError(false);
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
      setMessage('success:Patient created and selected');
    } catch (error) {
      setMessage('error:' + (error.response?.data?.message || 'Creation failed'));
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
      name: imageFile.name,
      type: imageFile.type,
    });
    formData.append('patientId', selectedPatient._id);
    try {
      const { data } = await api.post('/skin-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const analysis = data.analysisResult;
      setResult(processAnalysisData(analysis));
      setMessage('success:Analysis completed');
      // clear image after success (optional)
      setImage(null);
      setImageFile(null);
    } catch (error) {
      console.error('Upload failed', error);
      setMessage('error:Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const msgType = message.startsWith('success:') ? 'success' : 'error';
  const msgText = message.replace(/^(success:|error:)/, '');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroBadge}>AI POWERED • RECEPTIONIST MODE</Text>
          <Text style={styles.title}>Skin Scanner for Patients</Text>
          <Text style={styles.subtitle}>Upload a photo, assign to a patient, and receive instant AI analysis</Text>
        </View>

        {/* Toast message */}
        {message !== '' && (
          <View style={[styles.toast, msgType === 'success' ? styles.toastSuccess : styles.toastError]}>
            <Ionicons name={msgType === 'success' ? 'checkmark-circle' : 'close-circle'} size={20} color={msgType === 'success' ? '#059669' : '#dc2626'} />
            <Text style={[styles.toastText, msgType === 'success' ? styles.toastTextSuccess : styles.toastTextError]}>{msgText}</Text>
            <TouchableOpacity onPress={() => setMessage('')}>
              <Ionicons name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        )}

        {/* Patient Selection Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Patient</Text>
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
                style={[styles.patientItem, selectedPatient?._id === p._id && styles.patientItemActive]}
                onPress={() => setSelectedPatient(p)}
              >
                <Text style={styles.patientName}>{p.name}</Text>
                <Text style={styles.patientEmail}>{p.email}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.createBtnText}>Create New Patient</Text>
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

        {/* Image Upload Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upload Skin Image</Text>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: image }}
                style={styles.previewImage}
                onError={() => setImageLoadError(true)}
                onLoad={() => setImageLoadError(false)}
              />
              <TouchableOpacity style={styles.removeBtn} onPress={() => { setImage(null); setImageFile(null); setImageLoadError(false); }}>
                <Ionicons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Ionicons name="images" size={24} color="#3b82f6" />
              <Text style={styles.uploadBtnText}>Select from Gallery</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.analyzeBtn, (!imageFile || !selectedPatient) && styles.disabledBtn]}
            onPress={handleAnalyze}
            disabled={loading || !imageFile || !selectedPatient}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.analyzeBtnText}>Analyze & Save</Text>}
          </TouchableOpacity>
          {!selectedPatient && imageFile && (
            <Text style={styles.warningText}>Please select a patient first.</Text>
          )}
        </View>

        {/* Analysis Result */}
        {result && <AnalysisResultView result={result} />}
      </View>

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
              autoCapitalize="none"
              value={newPatient.email}
              onChangeText={(text) => setNewPatient({ ...newPatient, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={newPatient.password}
              onChangeText={(text) => setNewPatient({ ...newPatient, password: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelModalBtn]} onPress={() => setShowCreateModal(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.submitModalBtn]} onPress={handleCreatePatient} disabled={submitting}>
                <Text style={styles.submitModalBtnText}>{submitting ? 'Creating...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  hero: { backgroundColor: '#1e3a5f', borderRadius: 16, padding: 20, marginBottom: 20 },
  heroBadge: { color: '#93c5fd', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#bfdbfe' },
  toast: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 16, gap: 8 },
  toastSuccess: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  toastError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  toastText: { flex: 1, fontSize: 13 },
  toastTextSuccess: { color: '#065f46' },
  toastTextError: { color: '#b91c1c' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 16 },
  patientsList: { marginBottom: 12 },
  patientItem: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginBottom: 8 },
  patientItemActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  patientName: { fontSize: 16, fontWeight: '500' },
  patientEmail: { fontSize: 12, color: '#6b7280' },
  createBtn: { flexDirection: 'row', backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  createBtnText: { color: 'white', fontWeight: 'bold' },
  selectedPatient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10 },
  uploadBtn: { flexDirection: 'row', backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  uploadBtnText: { color: '#1d4ed8', fontWeight: '500', fontSize: 16 },
  imagePreviewContainer: { position: 'relative', marginBottom: 16 },
  previewImage: { width: '100%', height: 250, borderRadius: 12, resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 20 },
  analyzeBtn: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  disabledBtn: { backgroundColor: '#9ca3af' },
  analyzeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  warningText: { marginTop: 8, fontSize: 12, color: '#ef4444', textAlign: 'center' },
  resultCard: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  resultIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  resultTextContainer: { flex: 1 },
  resultTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  resultText: { fontSize: 14, color: '#374151', marginBottom: 8 },
  resultDetail: { fontSize: 12, marginTop: 4 },
  barContainer: { marginTop: 8 },
  barLabel: { fontSize: 12, fontWeight: '500', color: '#4b5563' },
  barValue: { fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  barBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginTop: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelModalBtn: { backgroundColor: '#f3f4f6' },
  submitModalBtn: { backgroundColor: '#3b82f6' },
  submitModalBtnText: { color: 'white', fontWeight: 'bold' },
});