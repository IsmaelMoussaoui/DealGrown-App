import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

const ProfileScreen = () => {
  const { signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/users/me');
      setUserData(response.data.data.user);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la déconnexion');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5CEAD4" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.username}>{userData?.username || 'Utilisateur'}</Text>
        <Text style={styles.email}>{userData?.email}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData?.createdDeals?.length || 0}</Text>
          <Text style={styles.statLabel}>Deals postés</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData?.karma || 0}</Text>
          <Text style={styles.statLabel}>Karma</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData?.savedDeals?.length || 0}</Text>
          <Text style={styles.statLabel}>Deals sauvés</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => {/* Navigation vers EditProfile */}}
      >
        <Text style={styles.buttonText}>Modifier le profil</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => {/* Navigation vers MyDeals */}}
      >
        <Text style={styles.buttonText}>Mes deals</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => {/* Navigation vers Settings */}}
      >
        <Text style={styles.buttonText}>Paramètres</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={[styles.buttonText, styles.logoutButtonText]}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#5CEAD4',
    padding: 20,
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5CEAD4',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#5CEAD4',
    padding: 15,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#5CEAD4',
  },
  logoutButtonText: {
    color: '#5CEAD4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;

