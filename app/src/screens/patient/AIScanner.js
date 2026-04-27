import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, Alert, ScrollView,
  ActivityIndicator, StyleSheet, FlatList, Modal, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../../Final_app/src/api/axios';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../../../Final_app/src/utils/helpers';
import { useLanguage } from '../../../../Final_app/src/contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

export default function AIScanner() {
  const { t } = useLanguage();
  const [image, setImage] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [pastScans, setPastScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  // Stats
  const totalScans = pastScans.length;
  const analyzedCount = pastScans.filter(s => s.analysisResult).length;
  const highRiskCount = pastScans.filter(s => {
    if (!s.analysisResult) return false;
    return /cancer|malignant|melanoma|high risk|urgent/i.test(s.analysisResult);
  }).length;
  const avgConfidence = (() => {
    const confidences = pastScans.map(s => {
      const match = s.analysisResult?.match(/(\d+(?:\.\d+)?)%/);
      return match ? parseFloat(match[1]) : null;
    }).filter(c => c !== null);
    if (confidences.length === 0) return null;
    return (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(1);
  })();

  useEffect(() => {
    fetchPastScans();
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    })();
  }, []);

  const fetchPastScans = async () => {
    try {
      const { data } = await api.get('/skin-images');
      setPastScans(data);
    } catch (error) {
      console.error('Failed to fetch scans', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult('');
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult('');
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('image', {
      uri: image,
      name: 'scan.jpg',
      type: 'image/jpeg',
    });
    try {
      const { data } = await api.post('/skin-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.analysisResult || 'Analysis saved.');
      setImage(null);
      fetchPastScans();
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to delete this scan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/skin-images/${id}`);
              fetchPastScans();
              setModalVisible(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete scan');
            }
          },
        },
      ]
    );
  };

  const parseAnalysisResult = (analysisText) => {
    const confidenceMatch = analysisText.match(/(\d+(?:\.\d+)?)%/);
    const hasRisk = /cancer|malignant|melanoma|high risk|urgent/i.test(analysisText);
    const hasLowRisk = /benign|low risk|harmless|normal/i.test(analysisText);
    let riskLevel = 'unknown';
    if (hasRisk && !hasLowRisk) riskLevel = 'high';
    else if (hasLowRisk) riskLevel = 'low';
    return {
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : null,
      riskLevel,
    };
  };

  const getRiskBadge = (riskLevel) => {
    if (riskLevel === 'high') {
      return <View style={styles.riskBadgeHigh}><Text style={styles.riskText}>⚠️ High Risk</Text></View>;
    } else if (riskLevel === 'low') {
      return <View style={styles.riskBadgeLow}><Text style={styles.riskText}>✅ Low Risk</Text></View>;
    }
    return null;
  };

  const renderScanItem = ({ item }) => {
    const parsed = item.analysisResult ? parseAnalysisResult(item.analysisResult) : null;
    return (
      <TouchableOpacity
        style={styles.scanCard}
        onPress={() => {
          setSelectedScan(item);
          setModalVisible(true);
        }}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.scanImage} />
        <Text style={styles.scanDate}>{formatDate(item.createdAt)}</Text>
        {parsed?.confidence && (
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{parsed.confidence}%</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroBadge}>{t.scanner?.aiPowered || 'AI-POWERED ANALYSIS'}</Text>
        <Text style={styles.title}>{t.scanner?.title || 'Skin Analyzer'}</Text>
        <Text style={styles.subtitle}>{t.scanner?.subtitle || 'Upload or capture a skin image for instant AI analysis'}</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Ionicons name="time-outline" size={20} color="#3b82f6" />
          <Text style={styles.statsTitle}>Scan History Summary</Text>
        </View>
        <View style={styles.statsGrid}>
          <View><Text style={styles.statLabel}>Total Scans</Text><Text style={styles.statValue}>{totalScans}</Text></View>
          <View><Text style={styles.statLabel}>Analyzed</Text><Text style={styles.statValue}>{analyzedCount}</Text></View>
          <View><Text style={styles.statLabel}>High Risk</Text><Text style={[styles.statValue, { color: '#ef4444' }]}>{highRiskCount}</Text></View>
          <View><Text style={styles.statLabel}>Avg. Confidence</Text><Text style={styles.statValue}>{avgConfidence ? `${avgConfidence}%` : '—'}</Text></View>
        </View>
      </View>

      {/* User Guide Toggle */}
      <TouchableOpacity style={styles.guideCard} onPress={() => setShowGuide(!showGuide)}>
        <View style={styles.guideHeader}>
          <Ionicons name="information-circle-outline" size={20} color="#8b5cf6" />
          <Text style={styles.guideTitle}>User Guide</Text>
          <Ionicons name={showGuide ? "chevron-up" : "chevron-down"} size={18} color="#6b7280" />
        </View>
        {showGuide && (
          <View style={styles.guideContent}>
            <Text>📸 Step 1: Upload an image or take a photo.</Text>
            <Text>🤖 Step 2: Click "Analyze" – AI examines the skin.</Text>
            <Text>📊 Step 3: View result with confidence & risk.</Text>
            <Text>📁 Step 4: All scans saved in "Past Scans".</Text>
            <Text style={styles.tipText}>💡 Tip: Use good lighting and focus on the area.</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Image Preview or Upload Area */}
      {image ? (
        <View style={styles.imagePreviewContainer}>
          <TouchableOpacity onPress={() => { setZoomImageUrl(image); setZoomModalVisible(true); }}>
            <Image source={{ uri: image }} style={styles.previewImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(null)}>
            <Ionicons name="close-circle" size={28} color="#ef4444" />
          </TouchableOpacity>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeImage} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <><Ionicons name="search" size={18} color="white" /><Text style={styles.btnText}>Analyze</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeAnalyzeBtn} onPress={() => setImage(null)}>
              <Ionicons name="close" size={18} color="#6b7280" /><Text style={styles.btnTextSecondary}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.uploadArea}>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Ionicons name="images" size={24} color="#3b82f6" />
            <Text style={styles.uploadText}>Upload Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cameraBtnLarge} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color="#8b5cf6" />
            <Text style={styles.cameraText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Analysis Result */}
      {result !== '' && (
        <View style={styles.resultCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <View style={styles.resultTextContainer}>
            <Text style={styles.resultTitle}>Analysis Result</Text>
            <Text style={styles.resultText}>{result}</Text>
            {(() => {
              const parsed = parseAnalysisResult(result);
              return (
                <>
                  {parsed.riskLevel && getRiskBadge(parsed.riskLevel)}
                  {parsed.confidence && (
                    <View style={styles.confidenceRow}>
                      <Ionicons name="stats-chart" size={14} color="#3b82f6" />
                      <Text style={styles.confidenceLabel}>Confidence: {parsed.confidence}%</Text>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        </View>
      )}

      {/* Past Scans Section */}
      <Text style={styles.sectionTitle}>Past Scans ({totalScans})</Text>
      {pastScans.length === 0 ? (
        <Text style={styles.emptyText}>No past scans yet.</Text>
      ) : (
        <FlatList
          data={pastScans}
          keyExtractor={(item) => item._id}
          renderItem={renderScanItem}
          numColumns={2}
          columnWrapperStyle={styles.scanGrid}
          scrollEnabled={false}
        />
      )}

      {/* Scan Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => { setZoomImageUrl(selectedScan?.imageUrl); setZoomModalVisible(true); }}>
              <Image source={{ uri: selectedScan?.imageUrl }} style={styles.modalImage} />
            </TouchableOpacity>
            <Text style={styles.modalDate}>{selectedScan ? formatDate(selectedScan.createdAt) : ''}</Text>
            {selectedScan?.analysisResult && (
              <>
                <Text style={styles.modalResult}>{selectedScan.analysisResult}</Text>
                {(() => {
                  const parsed = parseAnalysisResult(selectedScan.analysisResult);
                  return (
                    <>
                      {parsed.riskLevel && getRiskBadge(parsed.riskLevel)}
                      {parsed.confidence && <Text style={styles.modalConfidence}>Confidence: {parsed.confidence}%</Text>}
                    </>
                  );
                })()}
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.deleteModalBtn} onPress={() => handleDelete(selectedScan?._id)}>
                <Text style={styles.deleteModalBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeModalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Zoom Modal */}
      <Modal visible={zoomModalVisible} transparent={true} animationType="fade">
        <View style={styles.zoomOverlay}>
          <TouchableOpacity style={styles.zoomClose} onPress={() => setZoomModalVisible(false)}>
            <Ionicons name="close-circle" size={40} color="white" />
          </TouchableOpacity>
          {zoomImageUrl && (
            <Image source={{ uri: zoomImageUrl }} style={styles.zoomImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  hero: { backgroundColor: '#1e3a5f', borderRadius: 16, padding: 20, marginBottom: 20 },
  heroBadge: { color: '#93c5fd', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#bfdbfe' },
  statsCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statsTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#1f2937' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 4 },
  guideCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 },
  guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guideTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8, flex: 1, color: '#1f2937' },
  guideContent: { marginTop: 12, gap: 8 },
  tipText: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  uploadArea: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  uploadBtn: { flex: 1, backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  uploadText: { color: '#1d4ed8', fontWeight: '500', marginTop: 8 },
  cameraBtnLarge: { flex: 1, backgroundColor: '#f3e8ff', padding: 16, borderRadius: 12, alignItems: 'center', marginLeft: 8, borderWidth: 1, borderColor: '#e9d5ff' },
  cameraText: { color: '#7c3aed', fontWeight: '500', marginTop: 8 },
  imagePreviewContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  previewImage: { width: '100%', height: 250, borderRadius: 12, resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 20 },
  actionButtons: { flexDirection: 'row', marginTop: 12, gap: 12 },
  analyzeBtn: { flex: 1, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  removeAnalyzeBtn: { flex: 1, backgroundColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
  btnTextSecondary: { color: '#6b7280', fontWeight: 'bold' },
  resultCard: { flexDirection: 'row', backgroundColor: '#f0fdf4', padding: 16, borderRadius: 12, width: '100%', marginBottom: 20 },
  resultTextContainer: { marginLeft: 12, flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: 'bold', color: '#065f46' },
  resultText: { fontSize: 13, color: '#374151', marginTop: 4 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  confidenceLabel: { fontSize: 12, color: '#3b82f6', marginLeft: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', alignSelf: 'flex-start', marginTop: 20, marginBottom: 12, color: '#1f2937' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
  scanGrid: { justifyContent: 'space-between', marginBottom: 12 },
  scanCard: { width: '48%', backgroundColor: 'white', borderRadius: 12, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, position: 'relative' },
  scanImage: { width: '100%', height: 120, resizeMode: 'cover' },
  scanDate: { fontSize: 12, color: '#6b7280', textAlign: 'center', padding: 8 },
  confidenceBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  confidenceText: { fontSize: 10, color: 'white', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20, width: '90%', maxWidth: 400, alignItems: 'center' },
  modalImage: { width: '100%', height: 250, borderRadius: 8, marginBottom: 12 },
  modalDate: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  modalResult: { fontSize: 14, color: '#374151', textAlign: 'center', marginBottom: 8 },
  modalConfidence: { fontSize: 12, color: '#3b82f6', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  deleteModalBtn: { flex: 1, backgroundColor: '#fee2e2', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginRight: 6 },
  deleteModalBtnText: { color: '#ef4444', fontWeight: 'bold' },
  closeModalBtn: { flex: 1, backgroundColor: '#e5e7eb', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginLeft: 6 },
  closeModalBtnText: { color: '#374151', fontWeight: 'bold' },
  riskBadgeHigh: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start', marginTop: 6 },
  riskBadgeLow: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start', marginTop: 6 },
  riskText: { fontSize: 10, fontWeight: 'bold' },
  zoomOverlay: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  zoomClose: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  zoomImage: { width: width, height: height * 0.8, resizeMode: 'contain' },
});