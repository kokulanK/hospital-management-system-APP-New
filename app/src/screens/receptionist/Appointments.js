import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api/axios';
import { formatDate, formatTime, getStatusColor } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [bookingData, setBookingData] = useState({ patientName: '', patientEmail: '', doctorId: '', startTime: '' });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slots, setSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments/all');
      setAppointments(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/appointments/doctors');
      setDoctors(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (bookingData.doctorId && selectedDate) {
      fetchSlots(bookingData.doctorId, selectedDate);
    } else {
      setSlots([]);
    }
  }, [bookingData.doctorId, selectedDate]);

  const fetchSlots = async (doctorId, date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const { data } = await api.get(`/availability/doctor/${doctorId}?date=${formattedDate}`);
      setSlots(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDateChange = (event, selectedDateValue) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDateValue) {
      setSelectedDate(selectedDateValue);
    }
  };

  const handleBook = async () => {
    if (!bookingData.patientName || !bookingData.patientEmail || !bookingData.doctorId || !bookingData.startTime) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/appointments/receptionist', bookingData);
      Alert.alert('Success', 'Appointment booked');
      setModalVisible(false);
      setBookingData({ patientName: '', patientEmail: '', doctorId: '', startTime: '' });
      fetchAppointments();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.patientName}>{item.patient?.name}</Text>
          <Text style={styles.doctorName}>Dr. {item.doctor?.name}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
          <Text style={styles.time}>{formatTime(item.date)}</Text>
        </View>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.bookBtn} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.bookBtnText}>Book Appointment</Text>
      </TouchableOpacity>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No appointments found.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <TextInput
              style={styles.input}
              placeholder="Patient Name"
              value={bookingData.patientName}
              onChangeText={(text) => setBookingData({ ...bookingData, patientName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Patient Email"
              value={bookingData.patientEmail}
              onChangeText={(text) => setBookingData({ ...bookingData, patientEmail: text })}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.selectRow}>
              <Text style={styles.label}>Doctor:</Text>
              <FlatList
                horizontal
                data={doctors}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setBookingData({ ...bookingData, doctorId: item._id })}
                    style={[
                      styles.doctorOption,
                      bookingData.doctorId === item._id && styles.doctorOptionActive,
                    ]}
                  >
                    <Text style={[styles.doctorText, bookingData.doctorId === item._id && styles.doctorTextActive]}>
                      Dr. {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Date Picker Button */}
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <Text style={styles.pickerText}>
                {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            <Text style={styles.label}>Available Slots:</Text>
            {slots.length === 0 ? (
              <Text style={styles.noSlots}>No slots available for this date.</Text>
            ) : (
              <View style={styles.slotsRow}>
                {slots.map((slot, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setBookingData({ ...bookingData, startTime: slot.start })}
                    style={[
                      styles.slotBtn,
                      bookingData.startTime === slot.start && styles.slotBtnActive,
                    ]}
                  >
                    <Text style={[styles.slotText, bookingData.startTime === slot.start && styles.slotTextActive]}>
                      {formatTime(slot.start)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleBook} disabled={submitting}>
                <Text style={styles.submitBtnText}>{submitting ? 'Booking...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bookBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bookBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  doctorName: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  date: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  time: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  status: { fontSize: 12, fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  selectRow: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  doctorOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  doctorOptionActive: { backgroundColor: '#3b82f6' },
  doctorText: { fontSize: 12, color: '#374151' },
  doctorTextActive: { color: 'white' },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  pickerText: { marginLeft: 8, fontSize: 16, color: '#1f2937' },
  inputIcon: { marginRight: 8 },
  noSlots: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  slotBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8, marginBottom: 8 },
  slotBtnActive: { backgroundColor: '#3b82f6' },
  slotText: { fontSize: 12, color: '#374151' },
  slotTextActive: { color: 'white' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f3f4f6', marginRight: 8 },
  cancelBtnText: { color: '#374151', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#3b82f6', marginLeft: 8 },
  submitBtnText: { color: 'white', fontWeight: 'bold' },
});