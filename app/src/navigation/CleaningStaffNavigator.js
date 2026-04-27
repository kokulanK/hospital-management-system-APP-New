import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import Dashboard from '../screens/cleaningStaff/Dashboard';
import Tasks from '../screens/cleaningStaff/Tasks';
import SupplyRequests from '../screens/cleaningStaff/SupplyRequests';
import Profile from '../screens/cleaningStaff/Profile';

const Tab = createBottomTabNavigator();

export default function CleaningStaffNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Tasks') iconName = focused ? 'clipboard' : 'clipboard-outline';
          else if (route.name === 'Supplies') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Tasks" component={Tasks} />
      <Tab.Screen name="Supplies" component={SupplyRequests} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}