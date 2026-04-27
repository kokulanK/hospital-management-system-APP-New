import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, Alert,
  StyleSheet, ActivityIndicator, ScrollView, TextInput
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../../Final_app/src/api/axios';
import { formatDate, formatTime } from '../../../../Final_app/src/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../Final_app/src/contexts/LanguageContext';

export default function Appointments() {
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingMode, setBookingMode] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Reschedule state
  const [rescheduling, setRescheduling] = useState(null);
  const [rescheduleNewDate, setRescheduleNewDate] = useState(new Date());
  const [showRescheduleDatePicker, setShowRescheduleDatePicker] = useState(false);
  const [rescheduleNewSlot, setRescheduleNewSlot] = useState(null);
  const [availableSlotsForReschedule, setAvailableSlotsForReschedule] = useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/appointments/doctors');
      setDoctors(data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const { data } = await api.get('/appointments/patient');
      setAppointments(data);
      setFetchError('');
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setFetchError(t.appointments?.loadError || 'Failed to load appointments.');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    setLoadingSlots(true);
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const { data } = await api.get(`/availability/doctor/${doctorId}?date=${formattedDate}`);
      setSlots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchRescheduleSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    setLoadingRescheduleSlots(true);
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const { data } = await api.get(`/availability/doctor/${doctorId}?date=${formattedDate}`);
      setAvailableSlotsForReschedule(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const filteredDoctors = doctors.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (filteredDoctors.length === 1) {
      setSelectedDoctor(filteredDoctors[0]);
      fetchSlots(filteredDoctors[0]._id, selectedDate);
    } else {
      setSlots([]);
      setSelectedDoctor(null);
    }
  }, [searchQuery, selectedDate, doctors]);

  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    fetchSlots(doc._id, selectedDate);
    setSearchQuery(doc.name);
  };

  const handleBook = async () => {
    if (!confirmation) return;
    try {
      await api.post('/appointments', {
        doctorId: confirmation.doctor._id,
        startTime: confirmation.slot.start
      });
      setBookingMessage('success:' + (t.appointments?.bookingSuccess || 'Appointment booked successfully!'));
      setConfirmation(null);
      await fetchAppointments();
      fetchSlots(confirmation.doctor._id, selectedDate);
    } catch (err) {
      setBookingMessage('error:' + (err.response?.data?.message || t.appointments?.bookingFailed || 'Booking failed.'));
    }
  };

  const upcomingAppointments = appointments
    .filter(a => new Date(a.date) >= new Date() && a.status === 'scheduled')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastAppointments = appointments
    .filter(a => new Date(a.date) < new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');

  const msgType = bookingMessage.startsWith('success:') ? 'success' : 'error';
  const msgText = bookingMessage.replace(/^(success:|error:)/, '');

  const handleCancel = async (id) => {
    Alert.alert(
      'Cancel Appointment',
      t.appointments?.cancelConfirm || 'Are you sure you want to cancel this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/appointments/${id}/cancel`);
              setBookingMessage('success:' + (t.appointments?.appointmentCancelled || 'Appointment cancelled.'));
              await fetchAppointments();
              if (selectedDoctor) {
                fetchSlots(selectedDoctor._id, selectedDate);
              }
            } catch (err) {
              setBookingMessage('error:' + (err.response?.data?.message || t.appointments?.cancelFailed || 'Cancellation failed.'));
            }
          },
        },
      ]
    );
  };

  const handleReschedule = (appointment) => {
    setRescheduling(appointment);
    setRescheduleNewDate(new Date());
    fetchRescheduleSlots(appointment.doctor._id, new Date());
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduling || !rescheduleNewSlot) return;
    try {
      await api.put(`/appointments/${rescheduling._id}/reschedule`, {
        newStartTime: rescheduleNewSlot.start
      });
      setBookingMessage('success:' + (t.appointments?.appointmentRescheduled || 'Appointment rescheduled.'));
      setRescheduling(null);
      setRescheduleNewSlot(null);
      await fetchAppointments();
      if (selectedDoctor) {
        fetchSlots(selectedDoctor._id, selectedDate);
      }
    } catch (err) {
      setBookingMessage('error:' + (err.response?.data?.message || t.appointments?.rescheduleFailed || 'Rescheduling failed.'));
    }
  };

  const stats = {
    upcoming: upcomingAppointments.length,
    total: appointments.length,
    completed: pastAppointments.length,
    cancelled: cancelledAppointments.length
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroBadge}>{t.appointments?.heroBadge || 'EASY SCHEDULING'}</Text>
        <Text style={styles.heroTitle}>{t.appointments?.title || 'Appointments'}</Text>
        <Text style={styles.heroSubtitle}>{t.appointments?.subtitle || 'Book, reschedule, or manage your doctor visits'}</Text>
      </View>

      {/* Stats & Guide */}
      <View style={styles.statsGuideRow}>
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="time-outline" size={18} color="#3b82f6" />
            <Text style={styles.statsTitle}>Appointment Summary</Text>
          </View>
          <View style={styles.statsGrid}>
            <View><Text style={styles.statLabel}>Upcoming</Text><Text style={styles.statValue}>{stats.upcoming}</Text></View>
            <View><Text style={styles.statLabel}>Total Visits</Text><Text style={styles.statValue}>{stats.total}</Text></View>
            <View><Text style={styles.statLabel}>Completed</Text><Text style={styles.statValue}>{stats.completed}</Text></View>
            <View><Text style={styles.statLabel}>Cancelled</Text><Text style={styles.statValue}>{stats.cancelled}</Text></View>
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
              <Text>📅 Search for a doctor by name.</Text>
              <Text>🕒 Pick a date and select an available time slot.</Text>
              <Text>✅ Confirm booking.</Text>
              <Text>✏️ View upcoming appointments to reschedule or cancel.</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, bookingMode && styles.activeTab]}
          onPress={() => setBookingMode(true)}
        >
          <Text style={[styles.tabText, bookingMode && styles.activeTabText]}>{t.appointments?.bookTab || 'Book Appointment'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, !bookingMode && styles.activeTab]}
          onPress={() => setBookingMode(false)}
        >
          <Text style={[styles.tabText, !bookingMode && styles.activeTabText]}>{t.appointments?.myAppointmentsTab || 'My Appointments'}</Text>
        </TouchableOpacity>
      </View>

      {/* Toast Message */}
      {bookingMessage !== '' && (
        <View style={[styles.toast, msgType === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Ionicons name={msgType === 'success' ? 'checkmark-circle' : 'close-circle'} size={20} color={msgType === 'success' ? '#059669' : '#dc2626'} />
          <Text style={[styles.toastText, msgType === 'success' ? styles.toastTextSuccess : styles.toastTextError]}>{msgText}</Text>
          <TouchableOpacity onPress={() => setBookingMessage('')}>
            <Ionicons name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      )}

      {bookingMode ? (
        // BOOKING MODE
        <>
          <View style={styles.searchCard}>
            <Text style={styles.sectionTitle}>{t.appointments?.findDoctor || 'Find a Doctor'}</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t.appointments?.searchPlaceholder || "Doctor's name..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text style={styles.dateButtonText}>{selectedDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
                minimumDate={new Date()}
              />
            )}
          </View>

          {filteredDoctors.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="medical-outline" size={48} color="#e5e7eb" />
              <Text style={styles.emptyText}>{t.appointments?.noDoctors || 'No doctors found.'}</Text>
            </View>
          ) : (
            filteredDoctors.map((doc) => (
              <TouchableOpacity
                key={doc._id}
                style={[styles.doctorCard, selectedDoctor?._id === doc._id && styles.doctorCardSelected]}
                onPress={() => handleDoctorSelect(doc)}
              >
                <View style={styles.doctorHeader}>
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorInitial}>{doc.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>Dr. {doc.name}</Text>
                    <View style={styles.rating}>
                      {[1,2,3,4,5].map(star => (
                        <Ionicons key={star} name={star <= Math.round(doc.averageRating) ? 'star' : 'star-outline'} size={12} color="#fbbf24" />
                      ))}
                      <Text style={styles.ratingText}>({doc.averageRating?.toFixed(1) || '0.0'})</Text>
                    </View>
                  </View>
                  {selectedDoctor?._id === doc._id && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedText}>Selected</Text>
                    </View>
                  )}
                </View>
                <View style={styles.slotsContainer}>
                  <View style={[styles.slotsLabel, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <Ionicons name="time-outline" size={12} color="#6b7280" />
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{t.appointments?.availableSlots || 'Available Slots'}</Text>
                  </View>
                  {selectedDoctor?._id !== doc._id ? (
                    <Text style={styles.clickToSee}>{t.appointments?.clickToSee || 'Click to see slots'}</Text>
                  ) : loadingSlots ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : slots.length === 0 ? (
                    <Text style={styles.noSlots}>{t.appointments?.noSlots || 'No available slots on this day.'}</Text>
                  ) : (
                    <View style={styles.slotsGrid}>
                      {slots.map((slot, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.slotButton}
                          onPress={() => setConfirmation({ doctor: doc, slot })}
                        >
                          <Text style={styles.slotTime}>{formatTime(slot.start)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </>
      ) : (
        // MY APPOINTMENTS MODE
        <>
          {fetchError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{fetchError}</Text>
            </View>
          ) : null}

          {/* Upcoming */}
          <View style={styles.appointmentSection}>
            <Text style={styles.sectionTitle}>
              {t.appointments?.upcomingAppointments || 'Upcoming Appointments'} ({upcomingAppointments.length})
            </Text>
            {loadingAppointments ? (
              <ActivityIndicator size="large" color="#3b82f6" />
            ) : upcomingAppointments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={48} color="#e5e7eb" />
                <Text style={styles.emptyText}>{t.appointments?.noUpcoming || 'No upcoming appointments.'}</Text>
                <TouchableOpacity onPress={() => setBookingMode(true)}>
                  <Text style={styles.bookNowLink}>{t.appointments?.bookNow || 'Book now'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              upcomingAppointments.map((app) => (
                <View key={app._id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentAvatar}>
                      <Text style={styles.appointmentInitial}>{app.doctor?.name?.[0]?.toUpperCase() || 'D'}</Text>
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentDoctor}>Dr. {app.doctor?.name}</Text>
                      <Text style={styles.appointmentDate}>{formatDate(app.date)}</Text>
                      <Text style={styles.appointmentTime}>{formatTime(app.date)}</Text>
                    </View>
                    <View style={styles.upcomingBadge}>
                      <Text style={styles.upcomingBadgeText}>{t.appointments?.upcoming || 'Upcoming'}</Text>
                    </View>
                  </View>
                  <View style={styles.appointmentActions}>
                    <TouchableOpacity onPress={() => handleReschedule(app)} style={styles.rescheduleBtn}>
                      <Ionicons name="create-outline" size={16} color="#3b82f6" />
                      <Text style={styles.rescheduleText}>{t.appointments?.reschedule || 'Reschedule'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleCancel(app._id)} style={styles.cancelBtn}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      <Text style={styles.cancelText}>{t.appointments?.cancelAppointment || 'Cancel'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Past Visits */}
          {pastAppointments.length > 0 && (
            <View style={styles.appointmentSection}>
              <Text style={styles.sectionTitle}>{t.appointments?.pastVisits || 'Past Visits'} ({pastAppointments.length})</Text>
              {pastAppointments.map((app) => (
                <View key={app._id} style={[styles.appointmentCard, styles.pastCard]}>
                  <View style={styles.appointmentHeader}>
                    <View style={[styles.appointmentAvatar, styles.pastAvatar]}>
                      <Text style={styles.appointmentInitial}>{app.doctor?.name?.[0]?.toUpperCase() || 'D'}</Text>
                    </View>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentDoctor}>Dr. {app.doctor?.name}</Text>
                      <Text style={styles.appointmentDate}>{formatDate(app.date)}</Text>
                      <Text style={styles.appointmentTime}>{formatTime(app.date)}</Text>
                    </View>
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>{t.appointments?.completed || 'Completed'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal visible={!!confirmation} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="calendar" size={40} color="#3b82f6" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>{t.appointments?.confirmBooking || 'Confirm Booking'}</Text>
            <View style={styles.confirmDetails}>
              <Text>Doctor: Dr. {confirmation?.doctor.name}</Text>
              <Text>Date: {selectedDate.toLocaleDateString()}</Text>
              <Text>Time: {confirmation?.slot ? formatTime(confirmation.slot.start) : ''}</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setConfirmation(null)}>
                <Text style={styles.modalCancelText}>{t.common?.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleBook}>
                <Text style={styles.modalConfirmText}>{t.appointments?.confirm || 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal visible={!!rescheduling} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.appointments?.rescheduleTitle || 'Reschedule Appointment'}</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowRescheduleDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text>{rescheduleNewDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showRescheduleDatePicker && (
              <DateTimePicker
                value={rescheduleNewDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowRescheduleDatePicker(false);
                  if (date) {
                    setRescheduleNewDate(date);
                    fetchRescheduleSlots(rescheduling?.doctor._id, date);
                  }
                }}
                minimumDate={new Date()}
              />
            )}
            <Text style={styles.slotsLabel}>Select new time:</Text>
            {loadingRescheduleSlots ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : availableSlotsForReschedule.length === 0 ? (
              <Text>{t.appointments?.noRescheduleSlots || 'No available slots on this day.'}</Text>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlotsForReschedule.map((slot, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.slotButton, rescheduleNewSlot?.start === slot.start && styles.slotButtonActive]}
                    onPress={() => setRescheduleNewSlot(slot)}
                  >
                    <Text style={[styles.slotTime, rescheduleNewSlot?.start === slot.start && styles.slotTimeActive]}>{formatTime(slot.start)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRescheduling(null)}>
                <Text>{t.common?.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleRescheduleConfirm} disabled={!rescheduleNewSlot}>
                <Text style={styles.modalConfirmText}>{t.appointments?.confirm || 'Confirm'}</Text>
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
  statsGuideRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statsCard: { flex: 2, backgroundColor: 'white', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statsTitle: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 10, color: '#6b7280' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  guideCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, justifyContent: 'center' },
  guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guideTitle: { fontSize: 14, fontWeight: '600', marginLeft: 6, flex: 1 },
  guideContent: { marginTop: 8, gap: 4 },
  tabContainer: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb' },
  activeTab: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabText: { fontWeight: '500', color: '#6b7280' },
  activeTabText: { color: 'white' },
  toast: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8 },
  toastSuccess: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  toastError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  toastText: { flex: 1, fontSize: 13 },
  toastTextSuccess: { color: '#065f46' },
  toastTextError: { color: '#b91c1c' },
  searchCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16 },
  searchInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12 },
  dateButtonText: { fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  emptyCard: { backgroundColor: 'white', borderRadius: 12, padding: 32, alignItems: 'center' },
  emptyText: { color: '#9ca3af', marginTop: 8 },
  doctorCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  doctorCardSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  doctorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#bfdbfe', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  doctorInitial: { fontSize: 20, fontWeight: 'bold', color: '#1e3a5f' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: 'bold' },
  rating: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 10, color: '#6b7280', marginLeft: 4 },
  selectedBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  selectedText: { fontSize: 10, color: '#1d4ed8', fontWeight: 'bold' },
  slotsContainer: { marginTop: 8 },
  slotsLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  clickToSee: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },
  noSlots: { fontSize: 12, color: '#ef4444' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotButton: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  slotButtonActive: { backgroundColor: '#3b82f6' },
  slotTime: { fontSize: 12, color: '#374151' },
  slotTimeActive: { color: 'white' },
  appointmentSection: { marginBottom: 20 },
  appointmentCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 },
  pastCard: { opacity: 0.7 },
  appointmentHeader: { flexDirection: 'row', alignItems: 'center' },
  appointmentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#bfdbfe', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  pastAvatar: { backgroundColor: '#e5e7eb' },
  appointmentInitial: { fontSize: 18, fontWeight: 'bold', color: '#1e3a5f' },
  appointmentInfo: { flex: 1 },
  appointmentDoctor: { fontSize: 14, fontWeight: 'bold' },
  appointmentDate: { fontSize: 12, color: '#6b7280' },
  appointmentTime: { fontSize: 12, color: '#6b7280' },
  upcomingBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  upcomingBadgeText: { fontSize: 10, color: '#065f46', fontWeight: 'bold' },
  completedBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  completedBadgeText: { fontSize: 10, color: '#6b7280', fontWeight: 'bold' },
  appointmentActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 16 },
  rescheduleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rescheduleText: { color: '#3b82f6', fontSize: 12 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cancelText: { color: '#ef4444', fontSize: 12 },
  bookNowLink: { marginTop: 8, color: '#3b82f6', fontWeight: 'bold' },
  errorCard: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#b91c1c' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '85%', alignItems: 'center' },
  modalIcon: { marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  confirmDetails: { gap: 4, marginBottom: 20, alignItems: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  modalCancelBtn: { flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { color: '#374151', fontWeight: '500' },
  modalConfirmBtn: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modalConfirmText: { color: 'white', fontWeight: 'bold' },
});