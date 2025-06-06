import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealItem } from './geminiService';

export const trackMealIntake = async (meal: MealItem, date: string): Promise<void> => {
  try {
    // Get existing meal history
    const historyKey = `mealHistory_${date}`;
    const existingHistory = await AsyncStorage.getItem(historyKey);
    const mealHistory = existingHistory ? JSON.parse(existingHistory) : [];

    // Add the new meal to history
    mealHistory.push({
      ...meal,
      consumedAt: new Date().toISOString()
    });

    // Save updated history
    await AsyncStorage.setItem(historyKey, JSON.stringify(mealHistory));
  } catch (error) {
    console.error('Error tracking meal intake:', error);
    throw error;
  }
}; 