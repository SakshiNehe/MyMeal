import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { GeminiService } from '../services/geminiService';
import { ReminderService } from '../services/reminderService';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

interface UserPreferences {
  targetCalories: number;
  dietaryRestrictions: string[];
  allergies: string[];
  fitnessGoal: 'lose' | 'maintain' | 'gain';
  activityLevel: string;
  mealPreference: string[];
  budget: {
    daily: number;
    currency: string;
  };
  cuisinePreference?: string[];
  isIndianSpecific?: boolean;
}

interface ReminderModalProps {
  visible: boolean;
  onClose: () => void;
  mealName: string;
  onSave: (reminder: any) => void;
  colors: any;
}

const ReminderModal: React.FC<ReminderModalProps> = ({
  visible,
  onClose,
  mealName,
  onSave,
  colors,
}) => {
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = () => {
    onSave({
      id: Date.now().toString(),
      mealName,
      time: `${time.getHours()}:${time.getMinutes()}`,
      days: selectedDays,
      enabled,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Set Reminder for {mealName}</Text>
          
          <TouchableOpacity
            style={[styles.timeButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.buttonText}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleTimeChange}
            />
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Repeat on:</Text>
          <View style={styles.daysContainer}>
            {days.map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: selectedDays.includes(day) ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.dayButtonText, { color: colors.text }]}>
                  {day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Enable Reminder</Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const MealPlanScreen: React.FC = () => {
  const { colors, isDark, theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);

  const geminiService = GeminiService.getInstance();
  const reminderService = ReminderService.getInstance();

  // Example user preferences - replace with actual user preferences from your app
  const userPreferences: UserPreferences = {
    targetCalories: 2000,
    dietaryRestrictions: ['vegetarian'],
    allergies: ['nuts'],
    fitnessGoal: 'maintain',
    activityLevel: 'moderate',
    mealPreference: ['indian', 'mediterranean'],
    budget: {
      daily: 30,
      currency: 'USD'
    },
    isIndianSpecific: true
  };

  const generateMealPlan = async () => {
    try {
      setLoading(true);
      const plan = await geminiService.generateMealPlan(userPreferences, 'lunch');
      setMealPlan(plan);
      await geminiService.saveMealPlanToHistory(plan);
    } catch (error) {
      console.error('Error generating meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyPlan = async () => {
    try {
      setLoading(true);
      const plan = await geminiService.generateWeeklyMealPlan(userPreferences);
      setWeeklyPlan(plan);
      // Save each day's plan to history
      for (const dayPlan of plan) {
        await geminiService.saveMealPlanToHistory(dayPlan);
      }
    } catch (error) {
      console.error('Error generating weekly plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMealHistory = async () => {
    if (!searchQuery.trim()) return;
    try {
      const results = await geminiService.searchMealHistory(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching meal history:', error);
    }
  };

  const getBudgetAnalysis = async () => {
    try {
      const analysis = await geminiService.getBudgetAnalysis();
      setBudgetAnalysis(analysis);
    } catch (error) {
      console.error('Error getting budget analysis:', error);
    }
  };

  useEffect(() => {
    getBudgetAnalysis();
    loadReminders();
  }, []);

  const loadReminders = async () => {
    const savedReminders = await reminderService.getReminders();
    setReminders(savedReminders);
  };

  const handleSetReminder = (meal: any) => {
    setSelectedMeal(meal);
    setReminderModalVisible(true);
  };

  const handleSaveReminder = async (reminder: any) => {
    try {
      await reminderService.scheduleReminder(reminder);
      await loadReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  const renderMealCard = (meal: any) => (
    <View style={[styles.mealCard, { backgroundColor: colors.card }]} key={meal.name}>
      <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
      <Text style={[styles.mealDetails, { color: colors.text }]}>
        Calories: {meal.calories} | Protein: {meal.protein}g | Carbs: {meal.carbs}g | Fat: {meal.fat}g
      </Text>
      <Text style={[styles.mealCost, { color: colors.primary }]}>
        Estimated Cost: {meal.estimatedCost} {userPreferences.budget.currency}
      </Text>
      <Text style={[styles.mealCuisine, { color: colors.text }]}>Cuisine: {meal.cuisine}</Text>
      <Text style={[styles.mealDifficulty, { color: colors.text }]}>Difficulty: {meal.difficulty}</Text>
      <Text style={[styles.mealTime, { color: colors.text }]}>Prep Time: {meal.preparationTime} minutes</Text>
      
      <TouchableOpacity
        style={[styles.reminderButton, { backgroundColor: colors.primary }]}
        onPress={() => handleSetReminder(meal)}
      >
        <Text style={styles.buttonText}>Set Reminder</Text>
      </TouchableOpacity>

      {reminders.find(r => r.mealName === meal.name) && (
        <View style={styles.reminderInfo}>
          <Text style={[styles.reminderText, { color: colors.text }]}>
            Reminder set for {reminders.find(r => r.mealName === meal.name)?.time}
          </Text>
        </View>
      )}
    </View>
  );

  const renderBudgetChart = () => {
    if (!weeklyPlan.length) return null;

    const data = {
      labels: weeklyPlan.map(plan => plan.date.split('-')[2]), // Show day of month
      datasets: [{
        data: weeklyPlan.map(plan => plan.totalCost)
      }]
    };

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Budget Analysis</Text>
        <LineChart
          data={data}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: colors.card,
            backgroundGradientFrom: colors.card,
            backgroundGradientTo: colors.card,
            decimalPlaces: 2,
            color: (opacity = 1) => colors.primary,
            style: {
              borderRadius: 16
            },
            propsForLabels: {
              fill: colors.text
            }
          }}
          style={styles.chart}
        />
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Image
            source={require('../assets/images/MyIcon.png')}
            style={styles.headerIcon}
          />
          <Text style={[styles.title, { color: colors.text }]}>Meal Planner</Text>
        </View>
        <View style={styles.themeContainer}>
          <Text style={[styles.themeText, { color: colors.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Search meal history..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchMealHistory}
          />
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: colors.primary }]} 
            onPress={searchMealHistory}
          >
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={generateMealPlan}
        >
          <Text style={styles.buttonText}>Generate Today's Meal</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={generateWeeklyPlan}
        >
          <Text style={styles.buttonText}>Generate Weekly Plan</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color={colors.primary} />}

      {budgetAnalysis && (
        <View style={[styles.budgetContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.budgetTitle, { color: colors.text }]}>Budget Analysis</Text>
          <Text style={{ color: colors.text }}>
            Total Spent: {budgetAnalysis.totalSpent} {userPreferences.budget.currency}
          </Text>
          <Text style={{ color: colors.text }}>
            Average Cost per Meal: {budgetAnalysis.averageCostPerMeal.toFixed(2)} {userPreferences.budget.currency}
          </Text>
        </View>
      )}

      {renderBudgetChart()}

      {mealPlan && (
        <View style={styles.planContainer}>
          <Text style={[styles.planTitle, { color: colors.text }]}>Today's Meal Plan</Text>
          {mealPlan.meals.map(renderMealCard)}
        </View>
      )}

      {weeklyPlan.length > 0 && (
        <View style={styles.planContainer}>
          <Text style={[styles.planTitle, { color: colors.text }]}>Weekly Meal Plan</Text>
          {weeklyPlan.map((dayPlan, index) => (
            <View key={dayPlan.date}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>
                Day {index + 1} - {dayPlan.date}
              </Text>
              {dayPlan.meals.map(renderMealCard)}
            </View>
          ))}
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.planContainer}>
          <Text style={[styles.planTitle, { color: colors.text }]}>Search Results</Text>
          {searchResults.map(result => (
            <View key={result.date}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>{result.date}</Text>
              {result.meals.map(renderMealCard)}
            </View>
          ))}
        </View>
      )}

      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
        mealName={selectedMeal?.name || ''}
        onSave={handleSaveReminder}
        colors={colors}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  themeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  themeText: {
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchButton: {
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  mealCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mealDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  mealCost: {
    fontSize: 14,
    marginBottom: 4,
  },
  mealCuisine: {
    fontSize: 14,
    marginBottom: 4,
  },
  mealDifficulty: {
    fontSize: 14,
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
  },
  planContainer: {
    marginTop: 20,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  budgetContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayButton: {
    width: '13%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  dayButtonText: {
    fontSize: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  reminderButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  reminderInfo: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  reminderText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MealPlanScreen; 