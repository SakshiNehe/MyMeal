import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, IconButton, List, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { geminiService, type MealItem } from '../../services/geminiService';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { auth } from '../../config/firebaseConfig';
import { getUserProfile } from '../../services/userProfileService';

interface UserPreferences {
  dietaryPreferences: string[];
  allergies: string[];
}

export default function RecipesScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<MealItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<MealItem | null>(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [suggestedIngredients, setSuggestedIngredients] = useState([
    'Paneer', 'Chickpeas', 'Lentils', 'Rice', 'Potatoes', 'Spinach', 
    'Cauliflower', 'Tomatoes', 'Onions', 'Ginger', 'Garlic'
  ]);

  // Fetch user preferences on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userProfile = await getUserProfile(user.uid);
          setUserPreferences({
            dietaryPreferences: userProfile?.preferences?.dietaryPreferences || [],
            allergies: userProfile?.preferences?.allergies || []
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    
    fetchUserData();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery && selectedFilters.length === 0) {
      setError('Please enter ingredients or select some suggested ingredients');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Combine search query and selected ingredients
      const searchTerms = [...selectedFilters];
      if (searchQuery) {
        searchTerms.push(searchQuery);
        setSearchQuery('');
      }
      
      const fetchedRecipes = await geminiService.getRecipeSuggestions(
        searchTerms,
        {
          dietaryRestrictions: userPreferences?.dietaryPreferences || [],
          allergies: userPreferences?.allergies || [],
        }
      );
      
      setRecipes(fetchedRecipes);
      
      if (fetchedRecipes.length === 0) {
        setError('No recipes found. Try different ingredients.');
      }
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to fetch recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSelect = (ingredient: string) => {
    if (selectedFilters.includes(ingredient)) {
      setSelectedFilters(selectedFilters.filter(item => item !== ingredient));
    } else {
      setSelectedFilters([...selectedFilters, ingredient]);
    }
  };

  const handleRecipeSelect = (recipe: MealItem) => {
    setSelectedRecipe(recipe);
    setRecipeModalVisible(true);
  };
  
  const renderRecipeCard = (recipe: MealItem) => (
    <Card style={styles.recipeCard} key={recipe.meal}>
      <Card.Content>
        <Text style={styles.recipeTitle}>{recipe.meal}</Text>
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{recipe.calories}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{recipe.protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{recipe.carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{recipe.fat}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
        <Text style={styles.prepTime}>
          <Ionicons name="time-outline" size={14} color="#666" /> {recipe.preparationTime} mins
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => handleRecipeSelect(recipe)}
          style={styles.viewButton}
        >
          View Recipe
        </Button>
      </Card.Actions>
    </Card>
  );

  // Function to render the selected recipe details
  const renderRecipeDetails = () => {
    if (!selectedRecipe) return null;
    
    return (
      <View style={styles.recipeDetailsContainer}>
        <IconButton
          icon="close"
          style={styles.closeButton}
          onPress={() => setRecipeModalVisible(false)}
        />
        
        <ScrollView>
          <Text style={styles.detailsTitle}>{selectedRecipe.meal}</Text>
          <Text style={styles.detailsDescription}>{selectedRecipe.description}</Text>
          
          <View style={styles.nutritionCard}>
            <Text style={styles.sectionTitle}>Nutrition Information</Text>
            <View style={styles.macrosGrid}>
              <View style={styles.macroGridItem}>
                <Text style={styles.macroGridValue}>{selectedRecipe.calories}</Text>
                <Text style={styles.macroGridLabel}>Calories</Text>
              </View>
              <View style={styles.macroGridItem}>
                <Text style={styles.macroGridValue}>{selectedRecipe.protein}g</Text>
                <Text style={styles.macroGridLabel}>Protein</Text>
              </View>
              <View style={styles.macroGridItem}>
                <Text style={styles.macroGridValue}>{selectedRecipe.carbs}g</Text>
                <Text style={styles.macroGridLabel}>Carbs</Text>
              </View>
              <View style={styles.macroGridItem}>
                <Text style={styles.macroGridValue}>{selectedRecipe.fat}g</Text>
                <Text style={styles.macroGridLabel}>Fat</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preparation Time</Text>
            <Text style={styles.prepTimeDetail}>
              <Ionicons name="time-outline" size={16} color="#666" /> {selectedRecipe.preparationTime} minutes
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {selectedRecipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#E53935" />
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {selectedRecipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>{index + 1}</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <Text style={styles.headerTitle}>Indian Recipe Finder</Text>
        <Text style={styles.headerSubtitle}>Discover delicious Indian recipes using ingredients you have</Text>
        
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Enter ingredients"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          <Button 
            mode="contained" 
            onPress={handleSearch}
            style={styles.searchButton}
            loading={loading}
          >
            Search
          </Button>
        </View>
        
        {/* Selected filters */}
        {selectedFilters.length > 0 && (
          <View style={styles.selectedFiltersContainer}>
            <Text style={styles.filtersTitle}>Selected Ingredients:</Text>
            <View style={styles.chipsContainer}>
              {selectedFilters.map(filter => (
                <Chip 
                  key={filter}
                  onClose={() => handleFilterSelect(filter)}
                  style={styles.selectedChip}
                  textStyle={styles.chipText}
                >
                  {filter}
                </Chip>
              ))}
            </View>
          </View>
        )}
        
        {/* Suggested ingredients */}
        <View style={styles.suggestedContainer}>
          <Text style={styles.suggestedTitle}>Suggested Ingredients:</Text>
          <View style={styles.chipsContainer}>
            {suggestedIngredients.map(ingredient => (
              <Chip
                key={ingredient}
                selected={selectedFilters.includes(ingredient)}
                onPress={() => handleFilterSelect(ingredient)}
                style={styles.suggestedChip}
                textStyle={styles.chipText}
              >
                {ingredient}
              </Chip>
            ))}
          </View>
        </View>
        
        {/* Recipe list */}
        <View style={styles.recipesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E53935" />
              <Text style={styles.loadingText}>Finding recipes...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : recipes.length > 0 ? (
            recipes.map(recipe => renderRecipeCard(recipe))
          ) : (
            <Text style={styles.emptyText}>No recipes found. Try searching with different ingredients.</Text>
          )}
        </View>
      </ThemedView>
      
      {/* Recipe details modal */}
      {recipeModalVisible && renderRecipeDetails()}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#E53935',
  },
  selectedFiltersContainer: {
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    backgroundColor: '#E53935',
  },
  suggestedChip: {
    backgroundColor: '#f5f5f5',
  },
  chipText: {
    color: '#fff',
  },
  suggestedContainer: {
    marginBottom: 24,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recipesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: '#E53935',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
  recipeCard: {
    marginBottom: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
  },
  prepTime: {
    fontSize: 14,
    color: '#666',
  },
  viewButton: {
    backgroundColor: '#E53935',
  },
  recipeDetailsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1001,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 48,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  detailsDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  nutritionCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    marginBottom: 24,
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
  macroGridItem: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  macroGridValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  macroGridLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  prepTimeDetail: {
    fontSize: 16,
    color: '#666',
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
});
