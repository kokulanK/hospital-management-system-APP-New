import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Auth screens
import Login from '../screens/auth/Login';
import RegisterPatient from '../screens/auth/RegisterPatient';
import RegisterDoctor from '../screens/auth/RegisterDoctor';
import RegisterReceptionist from '../screens/auth/RegisterReceptionist';
import RegisterLabTechnician from '../screens/auth/RegisterLabTechnician';
import RegisterCleaningStaff from '../screens/auth/RegisterCleaningStaff';

// Role-specific navigators (import later)
import PatientNavigator from './PatientNavigator';
import DoctorNavigator from './DoctorNavigator';
import ReceptionistNavigator from './ReceptionistNavigator';
import LabTechnicianNavigator from './LabTechnicianNavigator';
import CleaningStaffNavigator from './CleaningStaffNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null; // or splash screen

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="RegisterPatient" component={RegisterPatient} />
        <Stack.Screen name="RegisterDoctor" component={RegisterDoctor} />
        <Stack.Screen name="RegisterReceptionist" component={RegisterReceptionist} />
        <Stack.Screen name="RegisterLabTechnician" component={RegisterLabTechnician} />
        <Stack.Screen name="RegisterCleaningStaff" component={RegisterCleaningStaff} />
      </Stack.Navigator>
    );
  }

  // Role-based navigator
  switch (user.role) {
    case 'patient':
      return <PatientNavigator />;
    case 'doctor':
      return <DoctorNavigator />;
    case 'receptionist':
      return <ReceptionistNavigator />;
    case 'labTechnician':
      return <LabTechnicianNavigator />;
    case 'cleaningStaff':
      return <CleaningStaffNavigator />;
    case 'admin':
      return <AdminNavigator />;
    default:
      return <PatientNavigator />;
  }
}