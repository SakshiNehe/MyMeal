import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface Reminder {
  id: string;
  mealName: string;
  time: string;
  days: string[];
  enabled: boolean;
}

export class ReminderService {
  private static instance: ReminderService;
  private readonly REMINDERS_KEY = 'meal_reminders';

  private constructor() {
    this.setupNotifications();
  }

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  private async setupNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  public async scheduleReminder(reminder: Reminder): Promise<void> {
    try {
      // Cancel any existing reminder with the same ID
      await this.cancelReminder(reminder.id);

      if (!reminder.enabled) return;

      const [hours, minutes] = reminder.time.split(':').map(Number);
      
      for (const day of reminder.days) {
        const trigger = {
          hour: hours,
          minute: minutes,
          repeats: true,
          weekday: this.getWeekdayNumber(day),
        };

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Meal Time! 🍽️',
            body: `Time for ${reminder.mealName}`,
            sound: true,
          },
          trigger,
          identifier: `${reminder.id}_${day}`,
        });
      }

      // Save reminder to storage
      const reminders = await this.getReminders();
      const existingIndex = reminders.findIndex(r => r.id === reminder.id);
      
      if (existingIndex >= 0) {
        reminders[existingIndex] = reminder;
      } else {
        reminders.push(reminder);
      }

      await AsyncStorage.setItem(this.REMINDERS_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      throw error;
    }
  }

  public async cancelReminder(reminderId: string): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const reminder = reminders.find(r => r.id === reminderId);
      
      if (reminder) {
        for (const day of reminder.days) {
          await Notifications.cancelScheduledNotificationAsync(`${reminderId}_${day}`);
        }
      }
    } catch (error) {
      console.error('Error canceling reminder:', error);
      throw error;
    }
  }

  public async getReminders(): Promise<Reminder[]> {
    try {
      const reminders = await AsyncStorage.getItem(this.REMINDERS_KEY);
      return reminders ? JSON.parse(reminders) : [];
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  public async deleteReminder(reminderId: string): Promise<void> {
    try {
      await this.cancelReminder(reminderId);
      const reminders = await this.getReminders();
      const updatedReminders = reminders.filter(r => r.id !== reminderId);
      await AsyncStorage.setItem(this.REMINDERS_KEY, JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  private getWeekdayNumber(day: string): number {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(day) + 1;
  }
} 