import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';

const LoginScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />
      </View>
      
      <Text style={styles.title}>Bienvenue sur DealGrown</Text>
      <Text style={styles.subtitle}>
        Trouvez les meilleures offres et partagez vos découvertes
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.emailButton]}
          onPress={() => navigation.navigate('EmailLogin')}
        >
          <Text style={styles.buttonText}>Continuer avec Email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={() => {/* Implement Google login */}}
        >
          <Text style={styles.buttonText}>Continuer avec Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.facebookButton]}
          onPress={() => {/* Implement Facebook login */}}
        >
          <Text style={styles.buttonText}>Continuer avec Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.appleButton]}
          onPress={() => {/* Implement Apple login */}}
        >
          <Text style={[styles.buttonText, styles.appleButtonText]}>
            Continuer avec Apple
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.skipButtonText}>Continuer sans compte</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#5CEAD4',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: '#5CEAD4',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  facebookButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButtonText: {
    color: '#fff',
  },
  skipButton: {
    marginTop: 30,
    padding: 10,
  },
  skipButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default LoginScreen;

