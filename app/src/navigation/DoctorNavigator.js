import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Dashboard from '../screens/doctor/Dashboard';
import Availability from '../screens/doctor/Availability';
import Appointments from '../screens/doctor/Appointments';
import Feedback from '../screens/doctor/Feedback';
import LabRequests from '../screens/doctor/LabRequests';
import Profile from '../screens/doctor/Profile';

const Tab = createBottomTabNavigator();

export default function DoctorNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Availability') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'Appointments') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Feedback') iconName = focused ? 'star' : 'star-outline';
          else if (route.name === 'Lab') iconName = focused ? 'flask' : 'flask-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Availability" component={Availability} />
      <Tab.Screen name="Appointments" component={Appointments} />
      <Tab.Screen name="Feedback" component={Feedback} />
      <Tab.Screen name="Lab" component={LabRequests} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}