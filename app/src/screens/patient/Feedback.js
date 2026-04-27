import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, FlatList,
  TextInput, Alert, StyleSheet, ActivityIndicator
} from 'react-native';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../utils/helpers';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PatientFeedback() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appRes, fbRes] = await Promise.all([
        api.get('/appointments/completed-without-feedback'),
        api.get('/feedback/patient')
      ]);
      setAppointments(appRes.data);
      setFeedbacks(fbRes.data);
    } catch (err) {
      setMessage('error:' + (t.feedback?.loadError || 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingFeedback(null);
    setSelectedAppointment(null);
    setRating(5);
    setComment('');
    setModalVisible(true);
  };

  const openEdit = (fb) => {
    setEditingFeedback(fb);
    setSelectedAppointment(fb.appointment);
    setRating(fb.rating);
    setComment(fb.comment || '');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!editingFeedback && !selectedAppointment) {
      Alert.alert('Error', t.feedback?.errorSelect || 'Please select an appointment');
      return;
    }
    setSubmitting(true);
    try {
      if (editingFeedback) {
        await api.put(`/feedback/${editingFeedback._id}`, { rating, comment });
        setMessage('success:' + (t.feedback?.successUpdate || 'Feedback updated'));
      } else {
        await api.post('/feedback', {
          appointmentId: selectedAppointment._id,
          rating,
          comment
        });
        setMessage('success:' + (t.feedback?.successSubmit || 'Feedback submitted'));
      }
      setModalVisible(false);
      fetchData();
    } catch (err) {
      setMessage('error:' + (err.response?.data?.message || t.feedback?.errorSubmit || 'Failed to submit'));
    } finally {
      setSubmitting(false);
    }
  };

  const msgType = message.startsWith('success:') ? 'success' : 'error';
  const msgText = message.replace(/^(success:|error:)/, '');

  const totalFeedbacks = feedbacks.length;
  const avgRating = totalFeedbacks > 0
    ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedbacks).toFixed(1)
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroBadge}>{t.feedback?.heroBadge || 'YOUR VOICE MATTERS'}</Text>
        <Text style={styles.heroTitle}>{t.feedback?.title || 'Patient Feedback'}</Text>
        <Text style={styles.heroSubtitle}>{t.feedback?.subtitle || 'Share your experience to help us improve'}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Feedback</Text>
          <Text style={styles.statValue}>{totalFeedbacks}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Average Rating</Text>
          <Text style={styles.statValue}>{avgRating} ★</Text>
        </View>
      </View>

      {/* Toast */}
      {message !== '' && (
        <View style={[styles.toast, msgType === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Ionicons name={msgType === 'success' ? 'checkmark-circle' : 'close-circle'} size={20} color={msgType === 'success' ? '#059669' : '#dc2626'} />
          <Text style={[styles.toastText, msgType === 'success' ? styles.toastTextSuccess : styles.toastTextError]}>{msgText}</Text>
          <TouchableOpacity onPress={() => setMessage('')}>
            <Ionicons name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      )}

      {/* Give Feedback Button */}
      <TouchableOpacity style={styles.giveButton} onPress={openCreate}>
        <Ionicons name="star" size={20} color="white" />
        <Text style={styles.giveButtonText}>{t.feedback?.giveFeedback || 'Give Feedback'}</Text>
      </TouchableOpacity>

      {/* Previous Feedback List */}
      <Text style={styles.sectionTitle}>{t.feedback?.myPreviousFeedback || 'My Previous Feedback'} ({feedbacks.length})</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" />
      ) : feedbacks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#e5e7eb" />
          <Text style={styles.emptyText}>{t.feedback?.noFeedback || 'No feedback given yet.'}</Text>
        </View>
      ) : (
        feedbacks.map((fb) => (
          <View key={fb._id} style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <View>
                <Text style={styles.doctorName}>Dr. {fb.appointment?.doctor?.name}</Text>
                <Text style={styles.feedbackDate}>{formatDate(fb.createdAt)}</Text>
              </View>
              <View style={styles.ratingStars}>
                {[1,2,3,4,5].map(star => (
                  <Ionicons key={star} name={star <= fb.rating ? 'star' : 'star-outline'} size={14} color="#fbbf24" />
                ))}
                <TouchableOpacity onPress={() => openEdit(fb)} style={styles.editBtn}>
                  <Ionicons name="create-outline" size={16} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
            {fb.comment ? <Text style={styles.comment}>"{fb.comment}"</Text> : null}
          </View>
        ))
      )}

      {/* Modal for New/Edit Feedback */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingFeedback ? t.feedback?.editFeedback || 'Edit Feedback' : t.feedback?.newFeedback || 'New Feedback'}</Text>
            {!editingFeedback && (
              <View>
                <Text style={styles.label}>{t.feedback?.selectAppointment || 'Select Appointment'}</Text>
                <FlatList
                  horizontal
                  data={appointments}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.appointmentOption, selectedAppointment?._id === item._id && styles.appointmentOptionActive]}
                      onPress={() => setSelectedAppointment(item)}
                    >
                      <Text style={[styles.appointmentText, selectedAppointment?._id === item._id && styles.appointmentTextActive]}>
                        Dr. {item.doctor?.name} - {formatDate(item.date)}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
            <Text style={styles.label}>{t.feedback?.rating || 'Rating'}</Text>
            <View style={styles.ratingSelect}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Ionicons name={(hoverRating >= star || rating >= star) ? 'star' : 'star-outline'} size={32} color="#fbbf24" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t.feedback?.commentOptional || 'Comment (optional)'}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text>{t.common?.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.modalSubmitText}>{submitting ? (editingFeedback ? 'Updating...' : 'Submitting...') : (editingFeedback ? 'Update' : 'Submit')}</Text>
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
  hero: { backgroundColor: '#1e3a5f', borderRadius: 16, padding: 20, marginBottom: 16 },
  heroBadge: { color: '#93c5fd', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#bfdbfe' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  toast: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8 },
  toastSuccess: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  toastError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  toastText: { flex: 1, fontSize: 13 },
  toastTextSuccess: { color: '#065f46' },
  toastTextError: { color: '#b91c1c' },
  giveButton: { flexDirection: 'row', backgroundColor: '#3b82f6', padding: 14, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 20 },
  giveButtonText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  emptyCard: { backgroundColor: 'white', borderRadius: 12, padding: 32, alignItems: 'center' },
  emptyText: { color: '#9ca3af', marginTop: 8 },
  feedbackCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  doctorName: { fontSize: 14, fontWeight: 'bold' },
  feedbackDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  ratingStars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtn: { marginLeft: 8 },
  comment: { fontSize: 12, color: '#4b5563', fontStyle: 'italic', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  appointmentOption: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  appointmentOptionActive: { backgroundColor: '#3b82f6' },
  appointmentText: { fontSize: 12, color: '#374151' },
  appointmentTextActive: { color: 'white' },
  ratingSelect: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modalSubmitBtn: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modalSubmitText: { color: 'white', fontWeight: 'bold' },
});