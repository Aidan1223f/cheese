import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) {
      return;
    }
    
    if (user) {
      // Check if onboarding is completed
      if (user.onboarding_completed) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding');
      }
    } else {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  // Show loading indicator while authentication state is being determined
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
} 
