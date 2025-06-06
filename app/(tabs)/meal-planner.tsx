import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, Dimensions, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Button, Card, Avatar, Chip, TouchableRipple, Text, IconButton, useTheme, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth } from '../../config/firebaseConfig';
import { getUserPreferences, getUserProfile } from '../../services/userProfileService';
import { GeminiService, type MealItem, type MealPlanResponse } from '../../services/geminiService';
import { trackMealIntake } from '../../services/aiMealService';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

// Updated UserPreferences interface to match the actual data structure
interface UserPreferences {
  mealTypes: string[];
  allergies: string[];
  fitnessGoal: string;
  targetCalories: number;
  dietaryPreferences: string[];
  likes?: string[];
  dislikes?: string[];
  cuisinePreferences?: string[];
  mealPrepTime?: 'quick' | 'medium' | 'any';
}

function getValidFitnessGoal(goal: string | undefined): "maintain" | "lose" | "gain" {
  if (goal === "maintain" || goal === "lose" || goal === "gain") {
    return goal;
  }
  return "maintain"; // default fallback
}

export default function MealPlannerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);
  const [mealDetailsModalVisible, setMealDetailsModalVisible] = useState(false);
  const [mealConsumed, setMealConsumed] = useState(false);

  // Fetch user preferences and meal plan on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (user) {
          console.log("User is authenticated:", user.uid);
          
          // First try to load the complete user profile
          const userProfile = await getUserProfile(user.uid);
          console.log("User profile loaded:", userProfile);
        
          // Get user preferences
          const preferences = await userProfile?.preferences;
          console.log("User preferences loaded:", preferences);
          setUserPreferences(preferences as UserPreferences);
          
          // Try to load saved meal plan for the date
          const savedPlan = await AsyncStorage.getItem(`mealPlan_${selectedDate.toISOString().split('T')[0]}`);
          if (savedPlan) {
            setMealPlan(JSON.parse(savedPlan));
          }
        } else {
          console.log("No authenticated user found");
          setError("Please sign in to view your meal plans");
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your meal plan. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    console.log('userPreferences', userPreferences);
  }, [selectedDate]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleMealSelect = (meal: MealItem) => {
    setSelectedMeal(meal);
    setMealConsumed(false);
    setMealDetailsModalVisible(true);
  };

  const handleMealDone = async () => {
    if (!selectedMeal) return;
    
    try {
      // Mark the meal as consumed
      await trackMealIntake(selectedMeal, selectedDate.toISOString().split('T')[0]);
      setMealConsumed(true);
      
      // You can optionally close the modal after a short delay
      setTimeout(() => {
        setMealDetailsModalVisible(false);
      }, 1500);
    } catch (error) {
      console.error('Error marking meal as done:', error);
    }
  };

  const handleGenerateMealPlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      if (!userPreferences) {
        setError('User preferences not found. Please update your profile.');
        return;
      }

      const geminiService = GeminiService.getInstance();
      const generatedPlan = await geminiService.generateMealPlan({
        dietaryRestrictions: userPreferences.dietaryPreferences || [],
        targetCalories: userPreferences.targetCalories || 2000,
        allergies: userPreferences.allergies || [],
        fitnessGoal: getValidFitnessGoal(userPreferences.fitnessGoal),
        likes: userPreferences.likes || [],
        dislikes: userPreferences.dislikes || [],
        cuisinePreference: userPreferences.cuisinePreferences || [],
        mealPrepTime: userPreferences.mealPrepTime || 'any'
      });

      // Add the selected date to the plan
      const planWithDate = {
        ...generatedPlan,
        date: selectedDate.toISOString().split('T')[0]
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        `mealPlan_${selectedDate.toISOString().split('T')[0]}`,
        JSON.stringify(planWithDate)
      );

      setMealPlan(planWithDate);
    } catch (err) {
      console.error('Error generating meal plan:', err);
      setError('Failed to generate meal plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const renderMealSection = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', title: string) => {
    let mealData: MealItem | MealItem[] | null = null;
    
    if (mealPlan) {
      switch (mealType) {
        case 'breakfast':
          mealData = mealPlan.breakfast;
          break;
        case 'lunch':
          mealData = mealPlan.lunch;
          break;
        case 'dinner':
          mealData = mealPlan.dinner;
          break;
        case 'snacks':
          mealData = mealPlan.snacks;
          break;
      }
    }
    
    const renderMealItem = (meal: MealItem) => (
      <TouchableRipple onPress={() => handleMealSelect(meal)}>
        <View style={styles.mealItem}>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal.meal}</Text>
            <Text style={styles.mealDescription}>{meal.description}</Text>
            <Text style={styles.mealMacros}>
              {meal.calories} cal • {meal.protein}g protein • {meal.carbs}g carbs • {meal.fat}g fat
            </Text>
            <Text style={styles.prepTime}>
              <Ionicons name="time-outline" size={14} /> {meal.preparationTime} mins
            </Text>
          </View>
          <IconButton icon="chevron-right" size={24} />
        </View>
      </TouchableRipple>
    );
    
    return (
      <Card style={styles.mealCard}>
        <Card.Title 
          title={title}
          left={(props) => <Ionicons name={
            mealType === 'breakfast' ? 'sunny-outline' :
            mealType === 'lunch' ? 'restaurant-outline' :
            mealType === 'dinner' ? 'moon-outline' :
            'cafe-outline'
          } size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          {mealData ? (
            Array.isArray(mealData) ? 
              mealData.map((meal, index) => (
                <View key={index}>
                  {index > 0 && <View style={styles.divider} />}
                  {renderMealItem(meal)}
                </View>
              )) :
              renderMealItem(mealData)
          ) : (
            <Text style={styles.emptyMealText}>No meal planned</Text>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centeredContent]}>
        <ActivityIndicator size="large" color="#E53935" />
        <ThemedText style={{ marginTop: 20 }}>Loading your meal plan...</ThemedText>
      </ThemedView>
    );
  }
  
  if (!userPreferences) {
    return (
      <ThemedView style={[styles.container, styles.centeredContent]}>
        <ThemedText style={{ marginBottom: 20 }}>Please set up your profile preferences first.</ThemedText>
        <Button 
          mode="contained" 
          onPress={() => router.push('/profile-setup')}
          style={{ backgroundColor: '#E53935' }}
        >
          Set Up Profile
        </Button>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={() => handleDateChange(-1)}
          />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={() => handleDateChange(1)}
          />
        </View>

        {/* Generate Meal Plan Button */}
        {!mealPlan && (
          <Button
            mode="contained"
            onPress={handleGenerateMealPlan}
            loading={generating}
            disabled={generating}
            style={styles.generateButton}
          >
            {generating ? 'Generating...' : 'Generate Meal Plan'}
          </Button>
        )}

        {/* Meal Sections */}
        {mealPlan && (
          <>
            {renderMealSection('breakfast', 'Breakfast')}
            {renderMealSection('lunch', 'Lunch')}
            {renderMealSection('dinner', 'Dinner')}
            {renderMealSection('snacks', 'Snacks')}
          </>
        )}

        {/* Meal Details Modal */}
        <Modal
          visible={mealDetailsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setMealDetailsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedMeal && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedMeal.meal}</Text>
                    <IconButton
                      icon="close"
                      size={24}
                      onPress={() => setMealDetailsModalVisible(false)}
                    />
                  </View>
                  
                  <ScrollView style={styles.modalScroll}>
                    <Text style={styles.modalDescription}>{selectedMeal.description}</Text>
                    
                    <View style={styles.nutritionSection}>
                      <Text style={styles.sectionTitle}>Nutrition Information</Text>
                      <View style={styles.macrosGrid}>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{selectedMeal.calories}</Text>
                          <Text style={styles.macroLabel}>Calories</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{selectedMeal.protein}g</Text>
                          <Text style={styles.macroLabel}>Protein</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{selectedMeal.carbs}g</Text>
                          <Text style={styles.macroLabel}>Carbs</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{selectedMeal.fat}g</Text>
                          <Text style={styles.macroLabel}>Fat</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.ingredientsSection}>
                      <Text style={styles.sectionTitle}>Ingredients</Text>
                      {selectedMeal.ingredients.map((ingredient, index) => (
                        <View key={index} style={styles.ingredientItem}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#E53935" />
                          <Text style={styles.ingredientText}>{ingredient}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.instructionsSection}>
                      <Text style={styles.sectionTitle}>Instructions</Text>
                      {selectedMeal.instructions.map((instruction, index) => (
                        <View key={index} style={styles.instructionItem}>
                          <Text style={styles.instructionNumber}>{index + 1}</Text>
                          <Text style={styles.instructionText}>{instruction}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  
                  <Button
                    mode="contained"
                    onPress={handleMealDone}
                    loading={mealConsumed}
                    disabled={mealConsumed}
                    style={styles.doneButton}
                  >
                    {mealConsumed ? 'Meal Completed!' : 'Mark as Done'}
                  </Button>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  generateButton: {
    marginBottom: 20,
    backgroundColor: '#E53935',
  },
  mealCard: {
    marginBottom: 16,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mealMacros: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  prepTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  emptyMealText: {
    textAlign: 'center',
    color: '#888',
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScroll: {
    flex: 1,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  nutritionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroItem: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientText: {
    marginLeft: 8,
    fontSize: 16,
  },
  instructionsSection: {
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#E53935',
    color: '#fff',
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  doneButton: {
    marginTop: 16,
    backgroundColor: '#E53935',
  },
}); 