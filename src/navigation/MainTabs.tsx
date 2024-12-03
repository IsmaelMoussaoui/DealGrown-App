import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import des écrans
import DealsScreen from '../screens/DealsScreen';
import PostDealScreen from '../screens/PostDealScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#5CEAD4',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Deals"
        component={DealsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="fire" size={size} color={color} />
          ),
          tabBarLabel: 'Deals',
        }}
      />

      <Tab.Screen
        name="PostDeal"
        component={PostDealScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="plus-circle" size={32} color={color} />
          ),
          tabBarLabel: 'Poster',
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs; 