import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator,
  StyleSheet, Linking, Alert
} from 'react-native';
import api from '../../../../Final_app/src/api/axios';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../../../Final_app/src/utils/helpers';
import { useLanguage } from '../../../../Final_app/src/contexts/LanguageContext';

export default function LabReports() {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/lab-requests/patient');
      setReports(data);
    } catch (err) {
      setError(t.labReports.loadError);
    } finally {
      setLoading(false);
    }
  };

  const isImageUrl = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  const openFile = (url) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', t.labReports.downloadFile));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroBadge}>{t.labReports.heroBadge || 'LAB RESULTS'}</Text>
        <Text style={styles.heroTitle}>{t.labReports.title}</Text>
        <Text style={styles.heroSubtitle}>{t.labReports.subtitle}</Text>
      </View>

      {/* Stats & Guide */}
      <View style={styles.statsGuideRow}>
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="time-outline" size={18} color="#3b82f6" />
            <Text style={styles.statsTitle}>{t.labReports.summaryTitle || 'Lab Reports Summary'}</Text>
          </View>
          <View style={styles.statsGrid}>
            <View>
              <Text style={styles.statLabel}>{t.labReports.totalReports || 'Total Reports'}</Text>
              <Text style={styles.statValue}>{reports.length}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>{t.labReports.uniqueTests || 'Unique Tests'}</Text>
              <Text style={styles.statValue}>{[...new Set(reports.map(r => r.testType))].length}</Text>
            </View>
          </View>
          {reports.length > 0 && (
            <Text style={styles.lastReport}>{t.labReports.lastReport || 'Last report'}: {new Date(reports[0].completedAt).toLocaleDateString()}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.guideCard} onPress={() => setShowGuide(!showGuide)}>
          <View style={styles.guideHeader}>
            <Ionicons name="information-circle-outline" size={18} color="#8b5cf6" />
            <Text style={styles.guideTitle}>{t.labReports.userGuide || 'User Guide'}</Text>
            <Ionicons name={showGuide ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
          </View>
          {showGuide && (
            <View style={styles.guideContent}>
              <Text>{t.labReports.guide1 || '📋 Lab reports appear here once completed.'}</Text>
              <Text>{t.labReports.guide2 || '🔍 Tap on an image to view full report.'}</Text>
              <Text>{t.labReports.guide3 || '💾 Tap on file to open.'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={24} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={48} color="#e5e7eb" />
          <Text style={styles.emptyText}>{t.labReports.noReports}</Text>
        </View>
      ) : (
        reports.map((report) => (
          <View key={report._id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Ionicons name="flask" size={20} color="#3b82f6" />
              <Text style={styles.testType}>{report.testType}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="person" size={12} color="#6b7280" />
                <Text>Dr. {report.doctor?.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="calendar" size={12} color="#6b7280" />
                <Text>{formatDate(report.completedAt)}</Text>
              </View>
            </View>
            {report.resultText && (
              <View style={styles.resultTextContainer}>
                <Text style={styles.resultLabel}>{t.labReports.result}</Text>
                <Text>{report.resultText}</Text>
              </View>
            )}
            {report.resultFile && (
              <View style={styles.fileContainer}>
                <Text style={styles.fileLabel}>{t.labReports.attachedFile}</Text>
                {isImageUrl(report.resultFile) ? (
                  <TouchableOpacity onPress={() => openFile(report.resultFile)}>
                    <Image source={{ uri: report.resultFile }} style={styles.imagePreview} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => openFile(report.resultFile)} style={styles.fileLink}>
                    <Ionicons name="document-text" size={20} color="#3b82f6" />
                    <Text style={styles.fileName}>{report.resultFile.split('/').pop()}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ... (keep all existing styles exactly as they were)
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { backgroundColor: '#1e3a5f', borderRadius: 16, padding: 20, marginBottom: 16 },
  heroBadge: { color: '#93c5fd', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#bfdbfe' },
  statsGuideRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statsCard: { flex: 2, backgroundColor: 'white', borderRadius: 12, padding: 12 },
  statsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statsTitle: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statLabel: { fontSize: 10, color: '#6b7280' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  lastReport: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  guideCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, justifyContent: 'center' },
  guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guideTitle: { fontSize: 14, fontWeight: '600', marginLeft: 6, flex: 1 },
  guideContent: { marginTop: 8, gap: 4 },
  errorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, gap: 8 },
  errorText: { color: '#b91c1c', flex: 1 },
  emptyCard: { backgroundColor: 'white', borderRadius: 12, padding: 32, alignItems: 'center' },
  emptyText: { color: '#9ca3af', marginTop: 8 },
  reportCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  testType: { fontSize: 16, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  resultTextContainer: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, marginBottom: 12 },
  resultLabel: { fontWeight: 'bold', marginBottom: 4 },
  fileContainer: { marginTop: 8 },
  fileLabel: { fontWeight: 'bold', marginBottom: 4 },
  imagePreview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8, resizeMode: 'contain' },
  fileLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  fileName: { fontSize: 12, color: '#3b82f6', textDecorationLine: 'underline' },
});