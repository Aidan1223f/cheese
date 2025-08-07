import { useEffect, useState } from 'react';
import { useSupabase } from './useSupabase';

export interface UserHabits {
  sleepQuality?: number; // 1-10 scale
  stressLevel?: number; // 1-10 scale
  routineStreak?: number; // days
  dailyStreak?: number; // days
  lastPhotoData?: {
    sleepQuality?: number;
    stressLevel?: number;
    date: string;
  };
}

export function useUserHabits(userId?: string) {
  const { user, getSkinPhotos } = useSupabase();
  const [habits, setHabits] = useState<UserHabits>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && user) {
      fetchUserHabits();
    } else {
      setLoading(false);
    }
  }, [userId, user]);

  const fetchUserHabits = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's routine and daily streaks
      const routineStreak = user?.routine_streak || 0;
      const dailyStreak = user?.daily_streak || 0;

      // Get the most recent photo data for sleep quality and stress level
      const recentPhotos = await getSkinPhotos(5); // Get last 5 photos
      const lastPhoto = recentPhotos.find(photo => 
        photo.sleep_quality !== null || photo.stress_level !== null
      );

      const userHabits: UserHabits = {
        routineStreak,
        dailyStreak,
        lastPhotoData: lastPhoto ? {
          sleepQuality: lastPhoto.sleep_quality || undefined,
          stressLevel: lastPhoto.stress_level || undefined,
          date: lastPhoto.created_at
        } : undefined
      };

      // If we have recent photo data, use it for current habits
      if (lastPhoto) {
        userHabits.sleepQuality = lastPhoto.sleep_quality || undefined;
        userHabits.stressLevel = lastPhoto.stress_level || undefined;
      }

      setHabits(userHabits);
    } catch (err) {
      console.error('Error fetching user habits:', err);
      setError('Failed to load user habits');
    } finally {
      setLoading(false);
    }
  };

  const refreshHabits = () => {
    fetchUserHabits();
  };

  return {
    habits,
    loading,
    error,
    refreshHabits
  };
} 