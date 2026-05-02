import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Modal, TextInput,
    Alert, StyleSheet, ActivityIndicator, Image, ScrollView
} from 'react-native';
import api from '../../api/axios';
import { formatDate } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function LabRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

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
            Alert.alert('Error', 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id) => {
        try {
            await api.put(`/lab-requests/${id}/accept`);
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', 'Accept failed');
        }
    };

    // Complete request (for accepted)
    const pickImageForComplete = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need camera roll permission to upload results.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, // allow PDFs etc.
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled) {
            setResultFile(result.assets[0]);
        }
    };

    const handleComplete = async () => {
        if (!resultText && !resultFile) {
            Alert.alert('Error', 'Please provide result text or file');
            return;
        }
        setUploadingId(selectedRequest._id);
        const formData = new FormData();
        if (resultFile) {
            const fileType = resultFile.type || 'application/octet-stream';
            formData.append('resultFile', {
                uri: resultFile.uri,
                name: resultFile.fileName || 'result',
                type: fileType,
            });
        }
        if (resultText) formData.append('resultText', resultText);
        try {
            await api.put(`/lab-requests/${selectedRequest._id}/complete`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Alert.alert('Success', 'Result uploaded');
            setModalVisible(false);
            setResultText('');
            setResultFile(null);
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingId(null);
        }
    };

    // Edit request (for completed or accepted)
    const openEditModal = (request) => {
        setSelectedRequest(request);
        setEditTestType(request.testType);
        setEditDescription(request.description || '');
        setEditResultText(request.resultText || '');
        setEditResultFile(null);
        setEditModalVisible(true);
    };

    const pickImageForEdit = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need camera roll permission to upload results.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled) {
            setEditResultFile(result.assets[0]);
        }
    };

    const handleEditSave = async () => {
        if (!editTestType) {
            Alert.alert('Error', 'Test type is required');
            return;
        }
        setUploadingId(selectedRequest._id);
        const formData = new FormData();
        formData.append('testType', editTestType);
        formData.append('description', editDescription);
        formData.append('resultText', editResultText);
        if (editResultFile) {
            const fileType = editResultFile.type || 'application/octet-stream';
            formData.append('resultFile', {
                uri: editResultFile.uri,
                name: editResultFile.fileName || 'result',
                type: fileType,
            });
        }
        try {
            await api.put(`/lab-requests/${selectedRequest._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Alert.alert('Success', 'Request updated');
            setEditModalVisible(false);
            fetchRequests();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Update failed');
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
                            Alert.alert('Success', 'Request deleted');
                            fetchRequests();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Delete failed');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.left}>
                    <Text style={styles.patientName}>{item.patient?.name}</Text>
                    <Text style={styles.testType}>Test: {item.testType}</Text>
                    <Text style={styles.doctor}>Doctor: {item.doctor?.name}</Text>
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                    {item.acceptedBy && (
                        <Text style={styles.acceptedBy}>Accepted by: {item.acceptedBy.name}</Text>
                    )}
                </View>
                <View style={styles.right}>
                    <Text style={[styles.status, getStatusColor(item.status)]}>
                        {item.status}
                    </Text>
                    {item.status === 'pending' && (
                        <TouchableOpacity onPress={() => handleAccept(item._id)} style={styles.acceptBtn}>
                            <Text style={styles.btnText}>Accept</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'accepted' && (
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedRequest(item);
                                setResultText('');
                                setResultFile(null);
                                setModalVisible(true);
                            }}
                            style={styles.completeBtn}
                        >
                            <Text style={styles.btnText}>Complete</Text>
                        </TouchableOpacity>
                    )}
                    {(item.status === 'accepted' || item.status === 'completed') && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
                                <Ionicons name="pencil" size={16} color="#3b82f6" />
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                                <Ionicons name="trash" size={16} color="#ef4444" />
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {item.status === 'completed' && (
                <View style={styles.resultContainer}>
                    {item.resultFile && (
                        <>
                            <Text style={styles.resultLabel}>Result File:</Text>
                            <Image source={{ uri: item.resultFile }} style={styles.resultImage} />
                            <TouchableOpacity onPress={() => {/* open file */ }} style={styles.downloadBtn}>
                                <Ionicons name="download" size={16} color="#3b82f6" />
                                <Text style={styles.downloadText}>Open</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {item.resultText && (
                        <View style={styles.resultTextBlock}>
                            <Text style={styles.resultLabel}>Result Text:</Text>
                            <Text style={styles.resultText}>{item.resultText}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return { color: '#f59e0b' };
            case 'accepted': return { color: '#3b82f6' };
            case 'completed': return { color: '#10b981' };
            default: return { color: '#6b7280' };
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={requests}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.empty}>No lab requests.</Text>}
            />

            {/* Complete Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Upload Result</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Result Text"
                            value={resultText}
                            onChangeText={setResultText}
                            multiline
                        />
                        <TouchableOpacity onPress={pickImageForComplete} style={styles.pickImageBtn}>
                            <Ionicons name="image" size={20} color="#3b82f6" />
                            <Text style={styles.pickImageText}>{resultFile ? 'Image Selected' : 'Upload Image/File'}</Text>
                        </TouchableOpacity>
                        {resultFile && <Text style={styles.fileName}>{resultFile.uri.split('/').pop()}</Text>}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleComplete} disabled={uploadingId !== null}>
                                <Text style={styles.submitBtnText}>{uploadingId === selectedRequest?._id ? 'Uploading...' : 'Submit'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal visible={editModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 20 }}>
                        <Text style={styles.modalTitle}>Edit Request</Text>
                        <Text style={styles.label}>Test Type</Text>
                        <TextInput
                            style={styles.input}
                            value={editTestType}
                            onChangeText={setEditTestType}
                            placeholder="Test Type"
                        />
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholder="Description"
                            multiline
                        />
                        <Text style={styles.label}>Result Text</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={editResultText}
                            onChangeText={setEditResultText}
                            placeholder="Result Text"
                            multiline
                        />
                        <Text style={styles.label}>Result File (optional)</Text>
                        <TouchableOpacity onPress={pickImageForEdit} style={styles.pickImageBtn}>
                            <Ionicons name="image" size={20} color="#3b82f6" />
                            <Text style={styles.pickImageText}>{editResultFile ? 'File Selected' : 'Upload New File'}</Text>
                        </TouchableOpacity>
                        {editResultFile && <Text style={styles.fileName}>{editResultFile.uri.split('/').pop()}</Text>}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setEditModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleEditSave} disabled={uploadingId !== null}>
                                <Text style={styles.submitBtnText}>{uploadingId === selectedRequest?._id ? 'Saving...' : 'Save'}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    left: { flex: 1, paddingRight: 12 },
    right: { alignItems: 'flex-end' },
    patientName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    testType: { fontSize: 14, color: '#4b5563', marginTop: 4 },
    doctor: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    date: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
    acceptedBy: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
    status: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize', marginBottom: 8 },
    acceptBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginTop: 4 },
    completeBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginTop: 4 },
    actionButtons: { flexDirection: 'row', marginTop: 8, gap: 8 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#eff6ff', borderRadius: 6 },
    editBtnText: { color: '#3b82f6', fontSize: 12 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fee2e2', borderRadius: 6 },
    deleteBtnText: { color: '#ef4444', fontSize: 12 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    resultContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12 },
    resultLabel: { fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 4 },
    resultImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    downloadText: { color: '#3b82f6', fontSize: 12 },
    resultTextBlock: { marginTop: 8 },
    resultText: { fontSize: 14, color: '#374151' },
    empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20, width: '90%', maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#374151' },
    pickImageBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    pickImageText: { marginLeft: 8, color: '#3b82f6' },
    fileName: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#f3f4f6', marginRight: 8 },
    cancelBtnText: { color: '#374151', fontWeight: 'bold' },
    submitBtn: { backgroundColor: '#3b82f6', marginLeft: 8 },
    submitBtnText: { color: 'white', fontWeight: 'bold' },
});