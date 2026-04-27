import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

// Import all patient screens
import Dashboard from '../screens/patient/Dashboard';
import Appointments from '../screens/patient/Appointments';
import Feedback from '../screens/patient/Feedback';
import AIScanner from '../screens/patient/AIScanner';
import LabReports from '../screens/patient/LabReports';
import Profile from '../screens/patient/Profile';
import Settings from '../screens/patient/Settings';
import Chatbot from '../screens/patient/Chatbot';

const Tab = createBottomTabNavigator();

export default function PatientNavigator() {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Appointments') iconName = focused ? 'calendar' : 'calendar-outline';
            else if (route.name === 'Feedback') iconName = focused ? 'star' : 'star-outline';
            else if (route.name === 'Scanner') iconName = focused ? 'camera' : 'camera-outline';
            else if (route.name === 'Lab Reports') iconName = focused ? 'flask' : 'flask-outline';
            else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
            else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: 'gray',
          headerTitleAlign: 'center',
        })}
      >
        <Tab.Screen
          name="Home"
          component={Dashboard}
          options={{ title: t.dashboard.home }}
        />
        <Tab.Screen
          name="Appointments"
          component={Appointments}
          options={{ title: t.dashboard.appointments }}
        />
        <Tab.Screen
          name="Feedback"
          component={Feedback}
          options={{ title: t.dashboard.feedback }}
        />
        <Tab.Screen
          name="Scanner"
          component={AIScanner}
          options={{ title: t.dashboard.aiScanner }}
        />
        <Tab.Screen
          name="Lab Reports"
          component={LabReports}
          options={{ title: t.dashboard.labReports }}
        />
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{ title: t.dashboard.profile }}
        />
        <Tab.Screen
          name="Settings"
          component={Settings}
          options={{ title: t.dashboard.settings }}
        />
      </Tab.Navigator>

      {/* Chatbot appears on all screens */}
      <Chatbot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});