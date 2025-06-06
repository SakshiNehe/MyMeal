import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MealPlan {
  date: string;
  meals: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    estimatedCost: number;
    cuisine: string;
    difficulty: string;
    preparationTime: number;
  }>;
  totalCost: number;
}

export interface MealItem {
  meal: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  preparationTime: number;
  ingredients: string[];
  instructions: string[];
  estimatedCost?: number;
  cuisine?: string;
  difficulty?: string;
}

export interface MealPlanResponse {
  breakfast: MealItem | MealItem[];
  lunch: MealItem | MealItem[];
  dinner: MealItem | MealItem[];
  snacks: MealItem | MealItem[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  date?: string;
}

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
  likes?: string[];
  dislikes?: string[];
}

export class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenerativeAI;
  private model: any;

  private constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private async generatePrompt(preferences: UserPreferences, mealType: string): Promise<string> {
    const prompt = `
      Generate a detailed meal plan for ${mealType} based on the following preferences:
      - Target Calories: ${preferences.targetCalories}
      - Dietary Restrictions: ${preferences.dietaryRestrictions.join(', ')}
      - Allergies: ${preferences.allergies.join(', ')}
      - Fitness Goal: ${preferences.fitnessGoal}
      - Activity Level: ${preferences.activityLevel}
      - Meal Preferences: ${preferences.mealPreference.join(', ')}
      - Daily Budget: ${preferences.budget.daily} ${preferences.budget.currency}
      ${preferences.cuisinePreference ? `- Cuisine Preferences: ${preferences.cuisinePreference.join(', ')}` : ''}
      ${preferences.isIndianSpecific ? '- Focus on Indian cuisine' : ''}

      Please provide the response in the following JSON format:
      {
        "date": "YYYY-MM-DD",
        "meals": [
          {
            "name": "string",
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "estimatedCost": number,
            "cuisine": "string",
            "difficulty": "string",
            "preparationTime": number
          }
        ],
        "totalCost": number
      }
    `;
    return prompt;
  }

  public async generateMealPlan(preferences: UserPreferences): Promise<MealPlanResponse> {
    try {
      const prompt = await this.generatePrompt(preferences, 'daily');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const rawPlan = JSON.parse(text);

      // Transform the raw plan into the expected MealPlanResponse format
      const transformedPlan: MealPlanResponse = {
        breakfast: rawPlan.meals.filter((meal: any) => meal.type === 'breakfast'),
        lunch: rawPlan.meals.filter((meal: any) => meal.type === 'lunch'),
        dinner: rawPlan.meals.filter((meal: any) => meal.type === 'dinner'),
        snacks: rawPlan.meals.filter((meal: any) => meal.type === 'snacks'),
        totalNutrition: {
          calories: rawPlan.meals.reduce((sum: number, meal: any) => sum + meal.calories, 0),
          protein: rawPlan.meals.reduce((sum: number, meal: any) => sum + meal.protein, 0),
          carbs: rawPlan.meals.reduce((sum: number, meal: any) => sum + meal.carbs, 0),
          fat: rawPlan.meals.reduce((sum: number, meal: any) => sum + meal.fat, 0)
        }
      };

      return transformedPlan;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw error;
    }
  }

  public async generateWeeklyMealPlan(preferences: UserPreferences): Promise<MealPlanResponse[]> {
    try {
      const weeklyPlan: MealPlanResponse[] = [];
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (const day of days) {
        const mealPlan = await this.generateMealPlan(preferences);
        weeklyPlan.push(mealPlan);
      }
      
      return weeklyPlan;
    } catch (error) {
      console.error('Error generating weekly meal plan:', error);
      throw error;
    }
  }

  public async saveMealPlanToHistory(mealPlan: MealPlanResponse): Promise<void> {
    try {
      const history = await this.getMealHistory();
      history.unshift(mealPlan);
      await AsyncStorage.setItem('mealHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving meal plan to history:', error);
      throw error;
    }
  }

  public async getMealHistory(): Promise<MealPlanResponse[]> {
    try {
      const history = await AsyncStorage.getItem('mealHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting meal history:', error);
      return [];
    }
  }

  public async searchMealHistory(query: string): Promise<MealPlanResponse[]> {
    try {
      const history = await this.getMealHistory();
      return history.filter(plan => 
        (Array.isArray(plan.breakfast) ? plan.breakfast : [plan.breakfast]).some(meal => 
          meal.meal.toLowerCase().includes(query.toLowerCase())
        ) ||
        (Array.isArray(plan.lunch) ? plan.lunch : [plan.lunch]).some(meal => 
          meal.meal.toLowerCase().includes(query.toLowerCase())
        ) ||
        (Array.isArray(plan.dinner) ? plan.dinner : [plan.dinner]).some(meal => 
          meal.meal.toLowerCase().includes(query.toLowerCase())
        ) ||
        (Array.isArray(plan.snacks) ? plan.snacks : [plan.snacks]).some(meal => 
          meal.meal.toLowerCase().includes(query.toLowerCase())
        )
      );
    } catch (error) {
      console.error('Error searching meal history:', error);
      return [];
    }
  }

  public async getBudgetAnalysis(): Promise<{
    totalSpent: number;
    averageCostPerMeal: number;
  }> {
    try {
      const history = await this.getMealHistory();
      const totalSpent = history.reduce((sum, plan) => {
        const allMeals = [
          ...(Array.isArray(plan.breakfast) ? plan.breakfast : [plan.breakfast]),
          ...(Array.isArray(plan.lunch) ? plan.lunch : [plan.lunch]),
          ...(Array.isArray(plan.dinner) ? plan.dinner : [plan.dinner]),
          ...(Array.isArray(plan.snacks) ? plan.snacks : [plan.snacks])
        ];
        return sum + allMeals.reduce((mealSum, meal) => mealSum + (meal.estimatedCost || 0), 0);
      }, 0);
      const totalMeals = history.reduce((count, plan) => {
        const allMeals = [
          ...(Array.isArray(plan.breakfast) ? plan.breakfast : [plan.breakfast]),
          ...(Array.isArray(plan.lunch) ? plan.lunch : [plan.lunch]),
          ...(Array.isArray(plan.dinner) ? plan.dinner : [plan.dinner]),
          ...(Array.isArray(plan.snacks) ? plan.snacks : [plan.snacks])
        ];
        return count + allMeals.length;
      }, 0);
      const averageCostPerMeal = totalSpent / (totalMeals || 1);
      
      return {
        totalSpent,
        averageCostPerMeal
      };
    } catch (error) {
      console.error('Error getting budget analysis:', error);
      return {
        totalSpent: 0,
        averageCostPerMeal: 0
      };
    }
  }
} 