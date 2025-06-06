import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Switch, List, Avatar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { auth } from '../../config/firebaseConfig';
import { getUserProfile } from '../../services/userProfileService';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

interface UserProfile {
  name: string;
  email: string;
  preferences: {
    dietaryPreferences: string[];
    allergies: string[];
    fitnessGoal: string;
    targetCalories: number;
  };
}

export default function ProfileScreen() {
  const theme = useTheme();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/login');
    } catch (err) {
      console.error('Error signing out:', err);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleEditProfile = () => {
    router.push('/profile-setup');
  };

  const renderUserStats = () => (
    <View style={styles.statsContainer}>
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.statsTitle}>Daily Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>1,200</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>45g</Text>
              <Text style={styles.statLabel}>Protein</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>150g</Text>
              <Text style={styles.statLabel}>Carbs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>35g</Text>
              <Text style={styles.statLabel}>Fat</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => router.replace('/login')}>
            Return to Login
          </Button>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ScrollView>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={80} 
              label={userProfile?.name?.charAt(0) || 'U'} 
              style={styles.avatar}
            />
            <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{userProfile?.email || 'user@example.com'}</Text>
            <Button 
              mode="outlined" 
              onPress={handleEditProfile}
              style={styles.editButton}
            >
              Edit Profile
            </Button>
          </View>

          {/* User Stats */}
          {renderUserStats()}

          {/* Preferences Section */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Preferences</Text>
              
              <List.Item
                title="Dietary Preferences"
                description={userProfile?.preferences?.dietaryPreferences?.join(', ') || 'Not set'}
                left={props => <List.Icon {...props} icon="food" />}
              />
              
              <List.Item
                title="Allergies"
                description={userProfile?.preferences?.allergies?.join(', ') || 'None'}
                left={props => <List.Icon {...props} icon="alert" />}
              />
              
              <List.Item
                title="Fitness Goal"
                description={userProfile?.preferences?.fitnessGoal || 'Not set'}
                left={props => <List.Icon {...props} icon="run" />}
              />
              
              <List.Item
                title="Target Calories"
                description={`${userProfile?.preferences?.targetCalories || 0} kcal/day`}
                left={props => <List.Icon {...props} icon="fire" />}
              />
            </Card.Content>
          </Card>

          {/* Settings Section */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              <List.Item
                title="Notifications"
                description="Receive meal reminders and updates"
                left={props => <List.Icon {...props} icon="bell" />}
                right={props => (
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                  />
                )}
              />
              
              <List.Item
                title="Dark Mode"
                description="Toggle dark theme"
                left={props => <List.Icon {...props} icon="theme-light-dark" />}
                right={props => (
                  <Switch
                    value={darkModeEnabled}
                    onValueChange={setDarkModeEnabled}
                  />
                )}
              />
            </Card.Content>
          </Card>

          {/* Logout Button */}
          <Button 
            mode="contained" 
            onPress={handleLogout}
            style={styles.logoutButton}
            icon="logout"
          >
            Logout
          </Button>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#E53935',
    marginBottom: 16,
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: '#E53935',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  editButton: {
    borderColor: '#E53935',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#f5f5f5',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: '#E53935',
    marginTop: 8,
    marginBottom: 24,
  },
}); 