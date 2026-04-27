import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import Dashboard from '../screens/receptionist/Dashboard';
import Appointments from '../screens/receptionist/Appointments';
import AIScanner from '../screens/receptionist/AIScanner';
import CleaningTasks from '../screens/receptionist/CleaningTasks';
import Profile from '../screens/receptionist/Profile';

const Tab = createBottomTabNavigator();

export default function ReceptionistNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Appointments') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Scanner') iconName = focused ? 'camera' : 'camera-outline';
          else if (route.name === 'Cleaning') iconName = focused ? 'broom' : 'broom-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Appointments" component={Appointments} />
      <Tab.Screen name="Scanner" component={AIScanner} />
      <Tab.Screen name="Cleaning" component={CleaningTasks} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}