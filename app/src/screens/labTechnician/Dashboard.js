import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { getGreeting } from '../../utils/helpers';
import { useNavigation } from '@react-navigation/native';

export default function LabTechnicianDashboard() {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [stats, setStats] = useState({ pending: 0, accepted: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/lab-requests/lab');
            const pending = data.filter(r => r.status === 'pending').length;
            const accepted = data.filter(r => r.status === 'accepted').length;
            const completed = data.filter(r => r.status === 'completed').length;
            setStats({ pending, accepted, completed });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Pending', value: stats.pending, icon: 'time', color: '#f59e0b' },
        { label: 'Accepted', value: stats.accepted, icon: 'checkmark-circle', color: '#3b82f6' },
        { label: 'Completed', value: stats.completed, icon: 'checkmark-done', color: '#10b981' },
    ];

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0]}</Text>
            <Text style={styles.subGreeting}>Manage lab requests and upload results.</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
            ) : (
                <>
                    <View style={styles.statsContainer}>
                        {statCards.map((stat, idx) => (
                            <View key={idx} style={styles.statCard}>
                                <Ionicons name={stat.icon} size={28} color={stat.color} />
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => navigation.navigate('Requests')}
                    >
                        <Text style={styles.viewBtnText}>View All Requests</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
    subGreeting: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
    loader: { marginTop: 40 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    statCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#1f2937' },
    statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
    viewBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    viewBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});