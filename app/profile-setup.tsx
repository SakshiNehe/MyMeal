import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, TextInput, Button, Chip, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { auth } from '../config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

interface UserPreferences {
  dietaryPreferences: string[];
  allergies: string[];
  fitnessGoal: string;
  targetCalories: number;
  mealTypes: string[];
}

export default function ProfileSetupScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryPreferences: [],
    allergies: [],
    fitnessGoal: 'maintain',
    targetCalories: 2000,
    mealTypes: ['breakfast', 'lunch', 'dinner']
  });

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo'
  ];

  const allergyOptions = [
    'Peanuts',
    'Tree Nuts',
    'Milk',
    'Eggs',
    'Soy',
    'Wheat',
    'Fish',
    'Shellfish'
  ];

  const fitnessGoals = [
    { label: 'Lose Weight', value: 'lose' },
    { label: 'Maintain Weight', value: 'maintain' },
    { label: 'Gain Muscle', value: 'gain' }
  ];

  const handleSaveProfile = async () => {
    if (!auth.currentUser) {
      setError('No user logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        preferences: preferences
      }, { merge: true });

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDietaryPreference = (preference: string) => {
    setPreferences(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(p => p !== preference)
        : [...prev.dietaryPreferences, preference]
    }));
  };

  const toggleAllergy = (allergy: string) => {
    setPreferences(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  const setFitnessGoal = (goal: string) => {
    setPreferences(prev => ({
      ...prev,
      fitnessGoal: goal
    }));
  };

  const updateTargetCalories = (calories: string) => {
    const numCalories = parseInt(calories);
    if (!isNaN(numCalories) && numCalories > 0) {
      setPreferences(prev => ({
        ...prev,
        targetCalories: numCalories
      }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Help us personalize your meal plans and recommendations
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
            <View style={styles.chipsContainer}>
              {dietaryOptions.map(option => (
                <Chip
                  key={option}
                  selected={preferences.dietaryPreferences.includes(option)}
                  onPress={() => toggleDietaryPreference(option)}
                  style={styles.chip}
                >
                  {option}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergies</Text>
            <View style={styles.chipsContainer}>
              {allergyOptions.map(allergy => (
                <Chip
                  key={allergy}
                  selected={preferences.allergies.includes(allergy)}
                  onPress={() => toggleAllergy(allergy)}
                  style={styles.chip}
                >
                  {allergy}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Goal</Text>
            <View style={styles.chipsContainer}>
              {fitnessGoals.map(goal => (
                <Chip
                  key={goal.value}
                  selected={preferences.fitnessGoal === goal.value}
                  onPress={() => setFitnessGoal(goal.value)}
                  style={styles.chip}
                >
                  {goal.label}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Calories</Text>
            <TextInput
              label="Daily Calorie Target"
              value={preferences.targetCalories.toString()}
              onChangeText={updateTargetCalories}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            mode="contained"
            onPress={handleSaveProfile}
            loading={loading}
            style={styles.button}
          >
            Complete Setup
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
  header: {
    marginTop: 48,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: '#E53935',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#E53935',
    marginTop: 8,
    marginBottom: 24,
  },
}); 