import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import Dashboard from '../screens/labTechnician/Dashboard';
import LabRequests from '../screens/labTechnician/LabRequests';
import Profile from '../screens/labTechnician/Profile';

const Tab = createBottomTabNavigator();

export default function LabTechnicianNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Requests') iconName = focused ? 'flask' : 'flask-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Home" component={Dashboard} />
            <Tab.Screen name="Requests" component={LabRequests} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
}