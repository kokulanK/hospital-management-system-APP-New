import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Alert, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api/axios';
import { formatDate, formatTime } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorAvailability() {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAvailability(); }, []);

  const fetchAvailability = async () => {
    try {
      const { data } = await api.get('/availability');
      setAvailabilities(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const roundToNearest30 = (date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
    const newHours = date.getHours() + (minutes >= 45 ? 1 : 0);
    const roundedDate = new Date(date);
    roundedDate.setHours(newHours, roundedMinutes, 0, 0);
    return roundedDate;
  };

  const handleDateChange = (event, val) => { setShowDatePicker(Platform.OS === 'ios'); if (val) setSelectedDate(val); };
  const handleStartTimeChange = (event, val) => { setShowStartTimePicker(Platform.OS === 'ios'); if (val) setStartTime(roundToNearest30(val)); };
  const handleEndTimeChange = (event, val) => { setShowEndTimePicker(Platform.OS === 'ios'); if (val) setEndTime(roundToNearest30(val)); };

  const handleAdd = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate < today) { Alert.alert('Error', 'Date cannot be in the past'); return; }
    const start = new Date(selectedDate); start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const end = new Date(selectedDate); end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    if (end <= start) { Alert.alert('Error', 'End time must be after start time'); return; }
    setSubmitting(true);
    try {
      await api.post('/availability', { startTime: start, endTime: end });
      Alert.alert('Success', 'Availability added');
      setModalVisible(false);
      setSelectedDate(new Date()); setStartTime(new Date()); setEndTime(new Date());
      fetchAvailability();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete Slot', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/availability/${id}`); fetchAvailability(); }
        catch { Alert.alert('Error', 'Delete failed'); }
      }},
    ]);
  };

  const grouped = availabilities.reduce((acc, item) => {
    const dateKey = new Date(item.startTime).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addBtnText}>Add Availability</Text>
      </TouchableOpacity>

      {Object.keys(grouped).length === 0 ? (
        <Text style={styles.empty}>No availability set.</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {Object.entries(grouped).map(([dateKey, slots]) => (
            <View key={dateKey} style={styles.dateGroup}>
              <Text style={styles.groupDate}>{formatDate(slots[0].startTime)}</Text>
              {slots.map(item => (
                <View key={item._id} style={styles.card}>
                  <View style={styles.row}>
                    <View>
                      <Text style={styles.timeSlot}>{formatTime(item.startTime)} – {formatTime(item.endTime)}</Text>
                      <Text style={styles.duration}>{Math.round((new Date(item.endTime) - new Date(item.startTime)) / 60000)} min</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item._id)}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="time-outline" size={28} color="#3b82f6" />
              <Text style={styles.modalTitle}>Add New Slot</Text>
              <Text style={styles.modalSubtitle}>Times must be on the hour or half-hour</Text>
            </View>
            <View style={styles.inputGroup}>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <Text style={styles.pickerText}>{selectedDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} minimumDate={new Date()} />}

              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStartTimePicker(true)}>
                <Ionicons name="time-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <Text style={styles.pickerText}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
              {showStartTimePicker && <DateTimePicker value={startTime} mode="time" display="default" onChange={handleStartTimeChange} minuteInterval={30} />}

              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowEndTimePicker(true)}>
                <Ionicons name="time-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <Text style={styles.pickerText}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
              {showEndTimePicker && <DateTimePicker value={endTime} mode="time" display="default" onChange={handleEndTimeChange} minuteInterval={30} />}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAdd} disabled={submitting}>
              {submitting ? <ActivityIndicator color="white" /> : <><Ionicons name="add" size={20} color="white" /><Text style={styles.submitButtonText}>Add Availability</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  addBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  dateGroup: { marginBottom: 20 },
  groupDate: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeSlot: { fontSize: 14, color: '#374151' },
  duration: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '85%', maxWidth: 400, alignItems: 'center' },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginTop: 8 },
  modalSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  inputGroup: { width: '100%', marginBottom: 24 },
  pickerButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12, backgroundColor: 'white' },
  pickerText: { marginLeft: 8, fontSize: 16, color: '#1f2937' },
  inputIcon: { marginRight: 8 },
  submitButton: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 12 },
  submitButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  cancelButton: { paddingVertical: 10, alignItems: 'center' },
  cancelButtonText: { color: '#6b7280', fontWeight: '500', fontSize: 14 },
});