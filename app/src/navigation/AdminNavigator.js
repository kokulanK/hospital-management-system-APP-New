import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import all admin screens
import Dashboard from '../screens/admin/Dashboard';
import Users from '../screens/admin/Users';
import PendingApprovals from '../screens/admin/PendingApprovals'; // <-- keep as is
import Appointments from '../screens/admin/Appointments';
import Feedback from '../screens/admin/Feedback';
import SupplyRequests from '../screens/admin/SupplyRequests';   // <-- keep as is
import Profile from '../screens/admin/Profile';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Users') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'PendingApprovals') iconName = focused ? 'hourglass' : 'hourglass-outline';
          else if (route.name === 'Appointments') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Feedback') iconName = focused ? 'star' : 'star-outline';
          else if (route.name === 'SupplyRequests') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Users" component={Users} />
      <Tab.Screen
        name="PendingApprovals"
        component={PendingApprovals}
        options={{ title: 'Pending Approvals' }}   // <-- friendly tab label
      />
      <Tab.Screen name="Appointments" component={Appointments} />
      <Tab.Screen name="Feedback" component={Feedback} />
      <Tab.Screen
        name="SupplyRequests"
        component={SupplyRequests}
        options={{ title: 'Supplies' }}            // <-- friendly tab label
      />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}