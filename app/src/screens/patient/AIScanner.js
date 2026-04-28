import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, Alert, ScrollView,
  ActivityIndicator, StyleSheet, FlatList, Modal, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../utils/helpers';
import { useLanguage } from '../../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

// ---------- Analysis result processor (same as web) ----------
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

// ---------- Result display component ----------
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
      <View style={[styles.resultCardCustom, { backgroundColor: s.bg, borderColor: s.border }]}>
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
      <View style={[styles.resultCardCustom, { backgroundColor: s.bg, borderColor: s.border }]}>
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
    return (
      <View style={[styles.resultCardCustom, { backgroundColor: s.bg, borderColor: s.border }]}>
        <View style={[styles.resultIcon, { backgroundColor: s.iconBg }]}>
          {result.type === 'safe' ? <Ionicons name="checkmark-circle" size={24} color={s.iconColor} /> : <Ionicons name="warning" size={24} color={s.iconColor} />}
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

  return (
    <View style={[styles.resultCardCustom, { backgroundColor: s.bg, borderColor: s.border }]}>
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
export default function AIScanner() {
  const { t } = useLanguage();
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pastScans, setPastScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Stats
  const totalScans = pastScans.length;
  const analyzedCount = pastScans.filter(s => s.analysisResult).length;
  const highRiskCount = pastScans.filter(s => {
    if (!s.analysisResult) return false;
    const proc = processAnalysisData(s.analysisResult);
    return proc?.type === 'danger' || proc?.riskLevel === 'high';
  }).length;
  const avgConfidence = (() => {
    const confidences = pastScans.map(s => {
      const proc = processAnalysisData(s.analysisResult);
      return proc?.confidence ? proc.confidence : null;
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

  // Copy image to cache to ensure stable URI
  const copyToCache = async (sourceUri) => {
    try {
      const ext = sourceUri.split('.').pop() || 'jpg';
      const fileName = `skin_scan_${Date.now()}.${ext}`;
      const destUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.copyAsync({ from: sourceUri, to: destUri });
      return destUri;
    } catch (error) {
      console.warn('Copy to cache failed, using original URI', error);
      return sourceUri;
    }
  };

  const processSelectedImage = async (asset) => {
    const cachedUri = await copyToCache(asset.uri);
    setImage(cachedUri);
    setImageFile({
      uri: cachedUri,
      name: asset.fileName || 'scan.jpg',
      type: asset.mimeType || 'image/jpeg',
    });
    setResult(null);
    setImageLoadError(false);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        await processSelectedImage(result.assets[0]);
      } else {
        Alert.alert('No image selected', 'Please choose an image to analyze.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open image picker.');
      console.error(error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        await processSelectedImage(result.assets[0]);
      } else {
        Alert.alert('No photo taken', 'Please take a photo to analyze.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open camera.');
      console.error(error);
    }
  };

  const analyzeImage = async () => {
    if (!imageFile) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('image', {
      uri: imageFile.uri,
      name: imageFile.name,
      type: imageFile.type,
    });
    try {
      const { data } = await api.post('/skin-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const analysis = data.analysisResult;
      setResult(processAnalysisData(analysis));
      setImage(null);
      setImageFile(null);
      fetchPastScans();
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image for analysis.');
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

  const renderScanItem = ({ item }) => (
    <TouchableOpacity
      style={styles.scanCard}
      onPress={() => {
        setSelectedScan(item);
        setModalVisible(true);
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.scanImage} />
      <Text style={styles.scanDate}>{formatDate(item.createdAt)}</Text>
      {item.analysisResult && (() => {
        const proc = processAnalysisData(item.analysisResult);
        if (proc?.confidence) {
          return (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{proc.confidence}%</Text>
            </View>
          );
        }
        return null;
      })()}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
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
              <Text>📊 Step 3: View detailed result with confidence & risk.</Text>
              <Text>📁 Step 4: All scans saved in "Past Scans".</Text>
              <Text style={styles.tipText}>💡 Tip: Use good lighting and focus on the area.</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Image Selection Area - fixed height to prevent resize */}
        <View style={styles.imageSection}>
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <TouchableOpacity onPress={() => { setZoomImageUrl(image); setZoomModalVisible(true); }}>
                <Image
                  source={{ uri: image }}
                  style={styles.previewImage}
                  onError={() => setImageLoadError(true)}
                  onLoad={() => setImageLoadError(false)}
                />
                {imageLoadError && (
                  <View style={styles.errorOverlay}>
                    <Text style={styles.errorOverlayText}>Failed to load image. Please try again.</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => { setImage(null); setImageFile(null); setImageLoadError(false); }}>
                <Ionicons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeImage} disabled={loading}>
                  {loading ? <ActivityIndicator color="white" /> : <><Ionicons name="search" size={18} color="white" /><Text style={styles.btnText}>Analyze</Text></>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeAnalyzeBtn} onPress={() => { setImage(null); setImageFile(null); setImageLoadError(false); }}>
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
        </View>

        {/* Analysis Result */}
        {result && <AnalysisResultView result={result} />}

        {/* Past Scans Section */}
        <Text style={styles.sectionTitle}>Past Scans ({totalScans})</Text>
        {pastScans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No past scans yet.</Text>
          </View>
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
      </View>

      {/* Scan Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => { setZoomImageUrl(selectedScan?.imageUrl); setZoomModalVisible(true); }}>
              <Image source={{ uri: selectedScan?.imageUrl }} style={styles.modalImage} />
            </TouchableOpacity>
            <Text style={styles.modalDate}>{selectedScan ? formatDate(selectedScan.createdAt) : ''}</Text>
            {selectedScan?.analysisResult && (
              <AnalysisResultView result={processAnalysisData(selectedScan.analysisResult)} />
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
  statsTitle: { fontSize: 14, fontWeight: '600', marginLeft: 8, color: '#1f2937' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 4 },
  guideCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 },
  guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guideTitle: { fontSize: 14, fontWeight: '600', marginLeft: 8, flex: 1, color: '#1f2937' },
  guideContent: { marginTop: 12, gap: 8 },
  tipText: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  imageSection: { marginBottom: 20, minHeight: 320 },
  uploadArea: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  uploadBtn: { flex: 1, backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  uploadText: { color: '#1d4ed8', fontWeight: '500', marginTop: 8 },
  cameraBtnLarge: { flex: 1, backgroundColor: '#f3e8ff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e9d5ff' },
  cameraText: { color: '#7c3aed', fontWeight: '500', marginTop: 8 },
  imagePreviewContainer: { width: '100%', position: 'relative' },
  previewImage: { width: '100%', height: 250, borderRadius: 12, resizeMode: 'cover' },
  errorOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  errorOverlayText: { color: 'white', backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 20 },
  actionButtons: { flexDirection: 'row', marginTop: 12, gap: 12 },
  analyzeBtn: { flex: 1, backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  removeAnalyzeBtn: { flex: 1, backgroundColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
  btnTextSecondary: { color: '#6b7280', fontWeight: 'bold' },
  resultCardCustom: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
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
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 12, color: '#1f2937' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#9ca3af' },
  scanGrid: { justifyContent: 'space-between', marginBottom: 12 },
  scanCard: { width: '48%', backgroundColor: 'white', borderRadius: 12, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, position: 'relative' },
  scanImage: { width: '100%', height: 120, resizeMode: 'cover' },
  scanDate: { fontSize: 12, color: '#6b7280', textAlign: 'center', padding: 8 },
  confidenceBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  confidenceText: { fontSize: 10, color: 'white', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20, width: '90%', maxWidth: 400, maxHeight: '80%' },
  modalImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12, resizeMode: 'cover' },
  modalDate: { fontSize: 14, color: '#6b7280', marginBottom: 8, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
  deleteModalBtn: { flex: 1, backgroundColor: '#fee2e2', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  deleteModalBtnText: { color: '#ef4444', fontWeight: 'bold' },
  closeModalBtn: { flex: 1, backgroundColor: '#e5e7eb', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  closeModalBtnText: { color: '#374151', fontWeight: 'bold' },
  zoomOverlay: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  zoomClose: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  zoomImage: { width: width, height: height * 0.8, resizeMode: 'contain' },
});
