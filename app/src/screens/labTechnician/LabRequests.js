import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/axios';
import { formatDate } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function LabRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  // Complete form
  const [resultText, setResultText] = useState('');
  const [resultFile, setResultFile] = useState(null);

  // Edit form
  const [editTestType, setEditTestType] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editResultText, setEditResultText] = useState('');
  const [editResultFile, setEditResultFile] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/lab-requests/lab');
      setRequests(data);
    } catch (error) {
      showMessage('error', 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage(`${type}:${text}`);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/lab-requests/${id}/accept`);
      showMessage('success', 'Request accepted');
      fetchRequests();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Accept failed');
    }
  };

  const pickFile = async (setFile) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need gallery permission to upload files.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      setFile(result.assets[0]);
    }
  };

  const handleComplete = async (id) => {
    if (!resultText && !resultFile) {
      showMessage('error', 'Please provide result text or file');
      return;
    }
    setUploadingId(id);
    const formData = new FormData();
    if (resultFile) {
      formData.append('resultFile', {
        uri: resultFile.uri,
        name: resultFile.fileName || 'result',
        type: resultFile.type || 'application/octet-stream',
      });
    }
    if (resultText) formData.append('resultText', resultText);
    try {
      const { data } = await api.put(`/lab-requests/${id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRequests(prev => prev.map(req => req._id === id ? data : req));
      showMessage('success', 'Result uploaded');
      setResultText('');
      setResultFile(null);
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const startEdit = (req) => {
    setEditingId(req._id);
    setEditTestType(req.testType);
    setEditDescription(req.description || '');
    setEditResultText(req.resultText || '');
    setEditResultFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTestType('');
    setEditDescription('');
    setEditResultText('');
    setEditResultFile(null);
  };

  const handleEditSave = async (id) => {
    const formData = new FormData();
    formData.append('testType', editTestType);
    formData.append('description', editDescription);
    if (editResultText) formData.append('resultText', editResultText);
    if (editResultFile) {
      formData.append('resultFile', {
        uri: editResultFile.uri,
        name: editResultFile.fileName || 'result',
        type: editResultFile.type || 'application/octet-stream',
      });
    }
    setUploadingId(id);
    try {
      const { data } = await api.put(`/lab-requests/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRequests(prev => prev.map(req => req._id === id ? data : req));
      showMessage('success', 'Request updated');
      cancelEdit();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Update failed');
    } finally {
      setUploadingId(null);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/lab-requests/${id}`);
              setRequests(prev => prev.filter(req => req._id !== id));
              showMessage('success', 'Request deleted');
            } catch (error) {
              showMessage('error', error.response?.data?.message || 'Delete failed');
            }
          },
        },
      ]
    );
  };

  const openFile = (url) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open file'));
  };

  const isImageUrl = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#fffbeb', textColor: '#d97706' };
      case 'accepted':
        return { bg: '#eff6ff', textColor: '#2563eb' };
      case 'completed':
        return { bg: '#ecfdf5', textColor: '#059669' };
      default:
        return { bg: '#f3f4f6', textColor: '#6b7280' };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    const isEditing = editingId === item._id;

    if (isEditing) {
      return (
        <View style={styles.editCard}>
          <Text style={styles.modalTitle}>Edit Request</Text>
          <Text style={styles.label}>Test Type</Text>
          <TextInput style={styles.input} value={editTestType} onChangeText={setEditTestType} />
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={editDescription} onChangeText={setEditDescription} multiline />
          <Text style={styles.label}>Result Text</Text>
          <TextInput style={[styles.input, styles.textArea]} value={editResultText} onChangeText={setEditResultText} multiline />
          <Text style={styles.label}>Result File (optional)</Text>
          <TouchableOpacity style={styles.pickImageBtn} onPress={() => pickFile(setEditResultFile)}>
            <Ionicons name="image" size={20} color="#3b82f6" />
            <Text style={styles.pickImageText}>{editResultFile ? 'File Selected' : 'Upload New File'}</Text>
          </TouchableOpacity>
          {editResultFile && <Text style={styles.fileName}>{editResultFile.uri.split('/').pop()}</Text>}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={cancelEdit}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={() => handleEditSave(item._id)} disabled={uploadingId === item._id}>
              <Text style={styles.submitBtnText}>{uploadingId === item._id ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.patientName}>{item.patient?.name}</Text>
            <Text style={styles.testType}>Test: {item.testType}</Text>
            <Text style={styles.doctor}>Doctor: {item.doctor?.name}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            {item.acceptedBy && (
              <Text style={styles.acceptedBy}>Accepted by: {item.acceptedBy.name}</Text>
            )}
          </View>
          <View style={styles.right}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.textColor }]}>{item.status}</Text>
            </View>
          </View>
        </View>

        {/* Pending */}
        {item.status === 'pending' && (
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
            <Text style={styles.btnText}>Accept Request</Text>
          </TouchableOpacity>
        )}

        {/* Accepted */}
        {item.status === 'accepted' && (
          <View style={styles.completeContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter result text"
              value={resultText}
              onChangeText={setResultText}
              multiline
            />
            <TouchableOpacity style={styles.pickImageBtn} onPress={() => pickFile(setResultFile)}>
              <Ionicons name="image" size={20} color="#3b82f6" />
              <Text style={styles.pickImageText}>{resultFile ? 'File Selected' : 'Upload File'}</Text>
            </TouchableOpacity>
            {resultFile && <Text style={styles.fileName}>{resultFile.uri.split('/').pop()}</Text>}
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => handleComplete(item._id)}
              disabled={uploadingId === item._id}
            >
              <Text style={styles.btnText}>{uploadingId === item._id ? 'Uploading...' : 'Complete & Upload'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed */}
        {item.status === 'completed' && (
          <View style={styles.resultContainer}>
            {item.resultFile && (
              <View style={styles.filePreview}>
                <Text style={styles.resultLabel}>Result File:</Text>
                {isImageUrl(item.resultFile) ? (
                  <TouchableOpacity onPress={() => openFile(item.resultFile)}>
                    <Image source={{ uri: item.resultFile }} style={styles.resultImage} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.fileLink} onPress={() => openFile(item.resultFile)}>
                    <Ionicons name="document-text" size={20} color="#3b82f6" />
                    <Text style={styles.fileNameLink}>{item.resultFile.split('/').pop()}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {item.resultText && (
              <View style={styles.resultTextBlock}>
                <Text style={styles.resultLabel}>Result Text:</Text>
                <Text style={styles.resultText}>{item.resultText}</Text>
              </View>
            )}
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => startEdit(item)} style={styles.editBtn}>
                <Ionicons name="pencil" size={16} color="#3b82f6" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                <Ionicons name="trash" size={16} color="#ef4444" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

  return (
    <View style={styles.container}>
      {message !== '' && (
        <View style={[styles.toast, message.startsWith('success:') ? styles.toastSuccess : styles.toastError]}>
          <Ionicons name={message.startsWith('success:') ? 'checkmark-circle' : 'close-circle'} size={20} color={message.startsWith('success:') ? '#059669' : '#dc2626'} />
          <Text style={[styles.toastText, message.startsWith('success:') ? styles.toastTextSuccess : styles.toastTextError]}>
            {message.replace(/^(success:|error:)/, '')}
          </Text>
        </View>
      )}
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No lab requests.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  toastSuccess: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  toastError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  toastText: { flex: 1, fontSize: 13 },
  toastTextSuccess: { color: '#065f46' },
  toastTextError: { color: '#b91c1c' },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  editCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  left: { flex: 1, paddingRight: 12 },
  right: { alignItems: 'flex-end' },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  testType: { fontSize: 14, color: '#4b5563', marginTop: 4 },
  doctor: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  desc: { fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' },
  acceptedBy: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  acceptBtn: { backgroundColor: '#3b82f6', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  completeContainer: { marginTop: 12, gap: 10 },
  completeBtn: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  resultContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12 },
  resultLabel: { fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 6 },
  resultImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8, resizeMode: 'contain' },
  filePreview: { marginBottom: 12 },
  fileLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  fileNameLink: { fontSize: 12, color: '#3b82f6', textDecorationLine: 'underline' },
  resultTextBlock: { marginBottom: 12 },
  resultText: { fontSize: 13, color: '#374151' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#eff6ff', borderRadius: 8 },
  editBtnText: { color: '#3b82f6', fontSize: 12, fontWeight: '500' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fee2e2', borderRadius: 8 },
  deleteBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '500' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickImageBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  pickImageText: { color: '#3b82f6', fontSize: 14 },
  fileName: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f3f4f6' },
  cancelBtnText: { color: '#374151', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#3b82f6' },
  submitBtnText: { color: 'white', fontWeight: 'bold' },
});