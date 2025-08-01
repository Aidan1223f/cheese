import { supabase } from '@/constants/supabase';
import { useState } from 'react';
import { useOpenAIChat } from './useOpenAIChat';
import { useSupabase } from './useSupabase';

interface RAGContext {
  userProfile: {
    skinType?: string;
    skinConcerns?: string[];
    skinGoals?: string[];
    allergies?: string;
    age?: number;
  };
  recentCheckins: {
    moodRating: number;
    sleepQuality?: number;
    stressLevel?: number;
    flareUps?: number;
    date: string;
  }[];
  products: {
    name: string;
    type: string;
  }[];
  currentStreaks: {
    daily: number;
    routine: number;
  };
  routineHistory: {
    steps: string[];
    completed: boolean;
    date: string;
  }[];
}

export function useRAGAgent() {
  const { user, getSkinPhotos, getChatHistory } = useSupabase();
  const { sendMessage, loading } = useOpenAIChat('advice');
  const [isLoading, setIsLoading] = useState(false);

  const buildContext = async (): Promise<RAGContext> => {
    if (!user) throw new Error('No user logged in');

    // Get user profile
    const userProfile = {
      skinType: user.skin_type,
      skinConcerns: user.skin_concerns,
      skinGoals: user.skin_goals,
      allergies: user.allergies,
      age: user.age,
    };

    // Get recent check-ins (last 7 days)
    const recentPhotos = await getSkinPhotos(7);
    const recentCheckins = recentPhotos.map(photo => ({
      moodRating: photo.mood_rating,
      sleepQuality: photo.sleep_quality || undefined,
      stressLevel: photo.stress_level || undefined,
      flareUps: photo.flare_ups || undefined,
      date: photo.created_at,
    }));

    // Get user products
    const { data: products } = await supabase
      .from('user_products')
      .select('name, type')
      .eq('user_id', user.id);

    // Get routine history (last 30 days)
    const { data: routines } = await supabase
      .from('user_routines')
      .select('routine_json, completed, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    const routineHistory = routines?.map((routine: any) => ({
      steps: routine.routine_json?.steps || [],
      completed: routine.completed,
      date: routine.created_at,
    })) || [];

    // Get current streaks
    const dailyStreak = user.daily_streak || 0;
    const routineStreak = user.routine_streak || 0;

    return {
      userProfile,
      recentCheckins,
      products: products || [],
      currentStreaks: {
        daily: dailyStreak,
        routine: routineStreak,
      },
      routineHistory,
    };
  };

  const generateContextualAdvice = async (userQuestion: string): Promise<string> => {
    if (!user) throw new Error('No user logged in');

    setIsLoading(true);
    try {
      const context = await buildContext();
      
      // Build context prompt
      const contextPrompt = `
User Profile:
- Skin Type: ${context.userProfile.skinType || 'Not specified'}
- Skin Concerns: ${context.userProfile.skinConcerns?.join(', ') || 'Not specified'}
- Skin Goals: ${context.userProfile.skinGoals?.join(', ') || 'Not specified'}
- Allergies: ${context.userProfile.allergies || 'None'}
- Age: ${context.userProfile.age || 'Not specified'}

Recent Check-ins (last 7 days):
${context.recentCheckins.map(checkin => 
  `- ${new Date(checkin.date).toLocaleDateString()}: Mood ${checkin.moodRating}/5, Sleep ${checkin.sleepQuality || 'N/A'}/5, Stress ${checkin.stressLevel || 'N/A'}/5, Flare-ups ${checkin.flareUps || 'N/A'}/5`
).join('\n')}

Current Products:
${context.products.map(product => `- ${product.name} (${product.type})`).join('\n')}

Current Streaks:
- Daily Check-ins: ${context.currentStreaks.daily} days
- Routine Completion: ${context.currentStreaks.routine} days

Recent Routines:
${context.routineHistory.slice(0, 5).map(routine => 
  `- ${new Date(routine.date).toLocaleDateString()}: ${routine.completed ? 'Completed' : 'Incomplete'} (${routine.steps.length} steps)`
).join('\n')}

User Question: ${userQuestion}

Based on this context, provide personalized, actionable skincare advice. Consider their skin type, concerns, recent patterns, and current products. Be encouraging and specific to their situation.
`;

      const response = await sendMessage(contextPrompt);
      return response || 'I apologize, but I couldn\'t generate advice at the moment. Please try again.';
    } catch (error) {
      console.error('Error generating contextual advice:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickInsights = async (): Promise<string[]> => {
    if (!user) return [];

    try {
      const context = await buildContext();
      const insights: string[] = [];

      // Analyze recent mood patterns
      if (context.recentCheckins.length > 0) {
        const avgMood = context.recentCheckins.reduce((sum, c) => sum + c.moodRating, 0) / context.recentCheckins.length;
        if (avgMood < 3) {
          insights.push('Your recent skin mood has been lower than average. Consider what might be affecting your skin health.');
        } else if (avgMood > 4) {
          insights.push('Great job! Your skin mood has been consistently positive recently.');
        }
      }

      // Analyze sleep patterns
      const sleepData = context.recentCheckins.filter(c => c.sleepQuality !== null);
      if (sleepData.length > 0) {
        const avgSleep = sleepData.reduce((sum, c) => sum + (c.sleepQuality || 0), 0) / sleepData.length;
        if (avgSleep < 3) {
          insights.push('Poor sleep quality can significantly impact skin health. Consider improving your sleep routine.');
        }
      }

      // Analyze stress patterns
      const stressData = context.recentCheckins.filter(c => c.stressLevel !== null);
      if (stressData.length > 0) {
        const avgStress = stressData.reduce((sum, c) => sum + (c.stressLevel || 0), 0) / stressData.length;
        if (avgStress > 3) {
          insights.push('High stress levels detected. Stress management techniques can help improve skin condition.');
        }
      }

      // Product analysis
      if (context.products.length === 0) {
        insights.push('You haven\'t added any products yet. Consider adding your current skincare products for personalized advice.');
      }

      // Streak motivation
      if (context.currentStreaks.daily > 0) {
        insights.push(`Amazing! You're on a ${context.currentStreaks.daily}-day check-in streak. Keep up the great work!`);
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  };

  return {
    generateContextualAdvice,
    getQuickInsights,
    isLoading,
  };
} 