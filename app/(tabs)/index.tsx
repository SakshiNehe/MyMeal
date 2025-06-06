import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getUserPreferences, getUserProfile } from '../../services/userProfileService';
import { LineChart } from 'react-native-chart-kit';
import { GeminiService } from '../../services/geminiService';

const screenWidth = Dimensions.get('window').width;

// User profile interface
interface UserProfile {
  displayName?: string;
  email?: string;
  age?: number;
  height?: number;
  weight?: number;
  preferences?: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
}

// User preferences interface
interface UserPreferences {
  dietaryPreferences?: string[];
  allergies?: string[];
  fitnessGoal?: 'lose' | 'maintain' | 'gain';
  targetCalories?: number;
  mealTypes?: string[];
}

export default function HomeScreen() {
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [todayCalories, setTodayCalories] = useState(0);
  const router = useRouter();
  const geminiService = GeminiService.getInstance();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch user profile from your own logic or AsyncStorage
        // Remove all Firebase/auth logic
        // Example: const profile = await getUserProfileFromStorage();
        // For now, just set a dummy profile
        setUserProfile({ displayName: 'User' });
        setUserPreferences({ targetCalories: 2000 });
        setTodayCalories(1200); // Example value
      } catch (err) {
        setError('Failed to load your profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centeredContent]}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={{ marginTop: 20 }}>Loading your dashboard...</Text>
      </View>
    );
  }

  // Calculate remaining calories for today
  const targetCalories = userPreferences?.targetCalories || 2000;
  const remainingCalories = targetCalories - todayCalories;
  const caloriePercentage = Math.min(100, Math.round((todayCalories / targetCalories) * 100));

  return (
    <SafeAreaView style={styles.safeContainer} edges={['right', 'left', 'bottom']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userProfile?.displayName || 'User'}</Text>
          </View>
        </View>

        {/* Today's Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{targetCalories}</Text>
              <Text style={styles.statLabel}>Calorie Goal</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayCalories}</Text>
              <Text style={styles.statLabel}>Consumed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{remainingCalories}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${caloriePercentage}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>{caloriePercentage}% of daily goal</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    color: '#888',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#E53935',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 10,
    backgroundColor: '#E53935',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
