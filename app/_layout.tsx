import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import { 
  Provider as PaperProvider, 
  MD3LightTheme, 
  MD3DarkTheme,
  configureFonts,
  MD3TypescaleKey
} from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { auth, isFirebaseInitialized, reinitializeFirebase } from '../config/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { initializeNotifications } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Define font configuration according to MD3 specifications
const fontConfig: Record<MD3TypescaleKey, {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing: number;
  lineHeight: number;
}> = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

// Custom theme for React Native Paper
const customTheme = {
  light: {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#E53935',
      secondary: '#FF8A65',
      error: '#B00020',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      onSurface: '#1A1A1A',
    },
    fonts: configureFonts({ config: { default: fontConfig } }),
  },
  dark: {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#E53935',
      secondary: '#FF8A65',
      error: '#CF6679',
      background: '#121212',
      surface: '#1E1E1E',
      onSurface: '#FFFFFF',
    },
    fonts: configureFonts({ config: { default: fontConfig } }),
  },
};

export default function RootLayout() {
  const { user, setUser } = useAuth();
  const colorScheme = useColorScheme();
  const [initializing, setInitializing] = useState(true);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const segments = useSegments();
  const router = useRouter();
  const isMounted = useRef(true);
  
  // Initialize Firebase and notifications
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ensure Firebase is initialized
        if (!isFirebaseInitialized) {
          await reinitializeFirebase();
        }

        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (isMounted.current) {
            setUser(user);
            setInitializing(false);
          }
        });

        // Initialize notifications
        await initializeNotifications();

        // Clean up auth listener on unmount
        return () => {
          isMounted.current = false;
          unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // Handle auth state changes and routing
  useEffect(() => {
    if (!initializing) {
      const inAuthGroup = segments[0] === '(auth)';
      
      if (!user && !inAuthGroup) {
        // Redirect to the sign-in page if not signed in
        router.replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        // Redirect to the home page if signed in
        router.replace('/(tabs)');
      }
    }
  }, [user, segments, initializing]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || initializing) {
    return null;
  }

  return (
    <PaperProvider theme={colorScheme === 'dark' ? customTheme.dark : customTheme.light}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={styles.container}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <View style={styles.content}>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
            </Stack>
          </View>
        </View>
      </ThemeProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
