import { ChatMessage, SkinPhoto, User } from '@/constants/database.types';
import { supabase } from '@/constants/supabase';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';

export function useSupabase() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any existing user state first
    setUser(null);
    setLoading(true);
    
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchUser(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        setUser(null);
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (session?.user) {
          await fetchUser(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user doesn't exist in database, sign them out
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }
      
      setUser(data);
      setLoading(false);
    } catch (error) {
      setUser(null);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create the user row manually after successful signup
      if (data.user) {
        // Wait longer for the auth to be fully established
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          // Use upsert to handle both insert and update cases
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: email,
            }, {
              onConflict: 'id'
            });
          
          if (upsertError) {
            console.error('SignUp upsertError:', upsertError);
            throw new Error(`Failed to create user profile: ${upsertError.message}`);
          }
          
          // Fetch the user data to update the state
          await fetchUser(data.user.id);
        } catch (error) {
          console.error('SignUp error:', error);
          throw error;
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setLoading(false);
    } catch (error) {
      // Handle sign out error silently
    }
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    if (!user) return null;

    try {
      console.log('Uploading photo from URI:', uri);
      
      // Get the file extension from the URI
      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExtension}`;
      console.log('File name:', fileName);

      // Read the file using expo-file-system
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Try reading file as base64 and creating a proper upload
      console.log('Reading file as base64 for proper upload');
      
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('Base64 length:', base64.length);
      
      // Create a proper file object that Supabase can handle
      const file = {
        uri: `data:image/jpeg;base64,${base64}`,
        type: 'image/jpeg',
        name: fileName,
      };
      
      console.log('File object created, attempting upload');

      const { data, error } = await supabase.storage
        .from('skin-photos')
        .upload(fileName, file as any, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('Upload successful, data:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('skin-photos')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const saveSkinPhoto = async (
    photoUrl: string, 
    moodRating: number, 
    additionalData?: {
      sleepQuality?: number | null;
      stressLevel?: number | null;
      flareUps?: number | null;
    }
  ) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Save the photo
      const { data, error } = await supabase
        .from('skin_photos')
        .insert({
          user_id: user.id,
          photo_url: photoUrl,
          mood_rating: moodRating,
          sleep_quality: additionalData?.sleepQuality || null,
          stress_level: additionalData?.stressLevel || null,
          flare_ups: additionalData?.flareUps || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update daily streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if user already checked in today
      const { data: todayPhoto } = await supabase
        .from('skin_photos')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

      // If this is the first check-in of the day, update the streak
      if (!todayPhoto || todayPhoto.length === 1) { // 1 because we just added this photo
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Check if user checked in yesterday
        const { data: yesterdayPhoto } = await supabase
          .from('skin_photos')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString());

        if (yesterdayPhoto && yesterdayPhoto.length > 0) {
          // Continue streak - user checked in yesterday
          const currentStreak = await getDailyStreak();
          await updateDailyStreak(currentStreak + 1);
        } else {
          // Start new streak - user missed yesterday or this is their first check-in
          await updateDailyStreak(1);
        }
      }

      return data;
    } catch (error) {
      console.error('Error saving skin photo:', error);
      throw error;
    }
  };

  const getSkinPhotos = async (limit = 30): Promise<SkinPhoto[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('skin_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching skin photos:', error);
      return [];
    }
  };

  const saveChatMessage = async (message: string, sender: 'user' | 'ai', context: 'checkin' | 'routine' | 'advice') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          message,
          sender,
          context,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving chat message:', error);
      return null;
    }
  };

  const getChatHistory = async (context: 'checkin' | 'routine' | 'advice', limit = 50): Promise<ChatMessage[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('context', context)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local user state
      setUser(data);
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const getStreak = async (): Promise<number> => {
    if (!user) return 0;

    try {
      const { data, error } = await supabase
        .from('skin_photos')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let streak = 0;
      let currentDate = new Date(today);

      // Check each day backwards from today
      while (true) {
        const photoForDate = data.find(photo => {
          const photoDate = new Date(photo.created_at);
          photoDate.setHours(0, 0, 0, 0);
          return photoDate.getTime() === currentDate.getTime();
        });

        if (photoForDate) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          // If we miss a day, streak ends
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  const getDailyStreak = async (): Promise<number> => {
    if (!user) return 0;

    try {
      // First try to get the streak from the user table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('daily_streak')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // If daily_streak is null or undefined, calculate it from photos
      if (userData.daily_streak === null || userData.daily_streak === undefined) {
        const calculatedStreak = await getStreak();
        // Update the user table with the calculated streak
        await updateDailyStreak(calculatedStreak);
        return calculatedStreak;
      }

      return userData.daily_streak || 0;
    } catch (error) {
      console.error('Error getting daily streak:', error);
      return 0;
    }
  };

  const updateDailyStreak = async (newStreak: number): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ daily_streak: newStreak })
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      setUser(prev => prev ? { ...prev, daily_streak: newStreak } : null);
    } catch (error) {
      console.error('Error updating daily streak:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateUser,
    uploadPhoto,
    saveSkinPhoto,
    getSkinPhotos,
    saveChatMessage,
    getChatHistory,
    getStreak,
    getDailyStreak,
    updateDailyStreak,
  };
} 
