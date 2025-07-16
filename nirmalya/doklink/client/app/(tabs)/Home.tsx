import {useState, useEffect} from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { authService } from '../../services/authService';
import { User } from '../../config/api';

interface HomeProps{
    onLogout: () => void;
    onGoToStartingScreen: () => void;
};

export default function Home({ onLogout, onGoToStartingScreen }: HomeProps) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await authService.getStoredUser();
        setUser(storedUser);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Profile Section */}
        {user ? (
          <>
            <View style={styles.profileSection}>
              <Image
                source={user.profile && typeof user.profile.profile_picture === 'string' && user.profile.profile_picture.length > 0
                  ? { uri: user.profile.profile_picture }
                  : require('../../assets/images/default.png')}
                style={styles.profilePicture}
              />
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.fullName}>{user.first_name} {user.last_name}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={onLogout}
            >
              <Text style={styles.logoutButtonText}>
                Logout
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.loadingText}>Loading profile...</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#374151',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 10,
  },
  fullName: {
    fontSize: 18,
    color: '#E2E8F0',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: '#E2E8F0',
  },
  logoutButton: {
    backgroundColor: '#e53935', // Red shade
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    minWidth: 280,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 18,
    color: '#E2E8F0',
  },
  comingSoonText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
});