import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLanguage } from '../../../../Final_app/src/contexts/LanguageContext';
import { useAuth } from '../../../../Final_app/src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Settings() {
  const { t, language, changeLanguage } = useLanguage();
  const { logout } = useAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleLanguageChange = (lng) => {
    changeLanguage(lng);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    Alert.alert(
      t.alerts?.logoutTitle || 'Logout',
      t.alerts?.logoutMessage || 'Are you sure you want to logout?',
      [
        { text: t.common?.cancel || 'Cancel', style: 'cancel' },
        { text: t.common?.logout || 'Logout', onPress: () => logout() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroBadge}>{t.settings?.preferences || 'PREFERENCES'}</Text>
        <Text style={styles.heroTitle}>{t.settings?.title || 'Settings'}</Text>
        <Text style={styles.heroSubtitle}>{t.settings?.subtitle || 'Customise your experience'}</Text>
      </View>

      {/* Stats & Guide */}
      <View style={styles.statsGuideRow}>
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="time-outline" size={18} color="#3b82f6" />
            <Text style={styles.statsTitle}>Settings Summary</Text>
          </View>
          <View style={styles.statsGrid}>
            <View><Text style={styles.statLabel}>Active Language</Text><Text style={styles.statValue}>{language === 'en' ? 'English' : language === 'si' ? 'සිංහල' : 'தமிழ்'}</Text></View>
            <View><Text style={styles.statLabel}>App Version</Text><Text style={styles.statValue}>v2.0.0</Text></View>
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
              <Text>🌐 Select your preferred language.</Text>
              <Text>⚡ Changes take effect immediately.</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Language Selection */}
      <View style={styles.settingsCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="globe-outline" size={20} color="#3b82f6" />
          <Text style={styles.cardTitle}>{t.settings?.language || 'Language'}</Text>
        </View>
        <TouchableOpacity style={[styles.langOption, language === 'en' && styles.activeLang]} onPress={() => handleLanguageChange('en')}>
          <View><Text style={styles.langName}>English</Text><Text style={styles.langSub}>English (US)</Text></View>
          {language === 'en' && <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.langOption, language === 'si' && styles.activeLang]} onPress={() => handleLanguageChange('si')}>
          <View><Text style={styles.langName}>සිංහල</Text><Text style={styles.langSub}>Sinhala</Text></View>
          {language === 'si' && <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.langOption, language === 'ta' && styles.activeLang]} onPress={() => handleLanguageChange('ta')}>
          <View><Text style={styles.langName}>தமிழ்</Text><Text style={styles.langSub}>Tamil</Text></View>
          {language === 'ta' && <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />}
        </TouchableOpacity>
      </View>

      {/* Coming Soon */}
      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonText}>🔧 More settings (notifications, privacy, theme) will be available in a future update.</Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutButtonText}>{t.common?.logout || 'Logout'}</Text>
      </TouchableOpacity>

      {/* Toast */}
      {saved && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={20} color="#059669" />
          <Text style={styles.toastText}>Language updated</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  hero: { backgroundColor: '#1e3a5f', borderRadius: 16, padding: 20, marginBottom: 16 },
  heroBadge: { color: '#93c5fd', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#bfdbfe' },
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
  settingsCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  activeLang: { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 12, marginHorizontal: -12 },
  langName: { fontSize: 14, fontWeight: '500' },
  langSub: { fontSize: 11, color: '#6b7280' },
  comingSoon: { backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  comingSoonText: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 20,
  },
  logoutButtonText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  toast: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#ecfdf5', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#a7f3d0' },
  toastText: { flex: 1, fontSize: 13, color: '#065f46' },
});