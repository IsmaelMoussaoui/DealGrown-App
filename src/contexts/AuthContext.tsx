import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  isAuthenticated: boolean;
  userToken: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier s'il y a un token stocké au démarrage
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setUserToken(token);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Erreur lors de la restauration du token:', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const signIn = async (token: string) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      setIsAuthenticated(true);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du token:', e);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
      setIsAuthenticated(false);
    } catch (e) {
      console.error('Erreur lors de la suppression du token:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userToken,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 