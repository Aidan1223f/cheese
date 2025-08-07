
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  type: 'routine';
  route: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { user, getDailyStreak } = useSupabase();
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [todayCompleted, setTodayCompleted] = useState({
    routine: false,
  });
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    if (user) {
      loadHomeData();
    }
  }, [user]);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      // Load streak from user object or calculate if not available
      const currentStreak = user?.daily_streak || await getDailyStreak();
      setStreak(currentStreak);
      
      // Check today's completion status
      await checkTodayCompletion();
      
      // Create todo items
      createTodoItems();
      
      // Calculate current day based on user's account creation date
      if (user) {
        const accountCreationDate = new Date(user.created_at);
        const today = new Date();
        const daysSinceCreation = Math.floor((today.getTime() - accountCreationDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentDayNumber = Math.min(daysSinceCreation + 1, 5); // Cap at 5 days for the tips
        setCurrentDay(currentDayNumber);
      } else {
        setCurrentDay(1);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      // Set default values on error
      setStreak(0);
      setTodayCompleted({
        routine: false,
      });
      createTodoItems();
      // Calculate current day based on user's account creation date
      if (user) {
        const accountCreationDate = new Date(user.created_at);
        const today = new Date();
        const daysSinceCreation = Math.floor((today.getTime() - accountCreationDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentDayNumber = Math.min(daysSinceCreation + 1, 5); // Cap at 5 days for the tips
        setCurrentDay(currentDayNumber);
      } else {
        setCurrentDay(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkTodayCompletion = async () => {
    // For now, we'll assume items are not completed
    // In a real implementation, you'd check the database for today's entries
    setTodayCompleted({
      routine: false,
    });
  };

  const createTodoItems = () => {
    const items: TodoItem[] = [
      {
        id: 'routine',
        title: 'Skincare Routine',
        completed: todayCompleted.routine,
        type: 'routine',
        route: 'routine',
      },
    ];
    setTodoItems(items);
  };

  const handleTodoPress = (item: TodoItem) => {
    if (item.type === 'routine') {
      router.push('/(tabs)/routine' as any);
    }
  };

  const getGoalEmoji = (goal: string) => {
    const goalEmojis: { [key: string]: string } = {
      'clear acne': '🧴',
      'reduce wrinkles': '✨',
      'even skin tone': '🎨',
      'hydrate skin': '💧',
      'reduce dark spots': '🌟',
      'anti-aging': '🕰️',
      'brighten skin': '☀️',
      'reduce redness': '🌿',
    };
    return goalEmojis[goal.toLowerCase()] || '🎯';
  };

  const getGreetingFontSize = (name: string) => {
    const baseFontSize = 28;
    const nameLength = name.length;
    
    // Adjust font size based on name length
    if (nameLength <= 10) {
      return baseFontSize;
    } else if (nameLength <= 15) {
      return baseFontSize - 2;
    } else if (nameLength <= 20) {
      return baseFontSize - 4;
    } else if (nameLength <= 25) {
      return baseFontSize - 6;
    } else {
      return baseFontSize - 8;
    }
  };

  const getDailyTip = (day: number) => {
    const tips = {
      1: {
        title: "Day 1: Consistency is Key",
        content: "How consistency matters more than ingredients. Building a routine you can stick to daily is more effective than using expensive products sporadically.",
        emoji: "🎯"
      },
      2: {
        title: "Day 2: Less is More",
        content: "Why overdoing actives backfires. Using too many active ingredients at once can irritate your skin and slow down results.",
        emoji: "⚖️"
      },
      3: {
        title: "Day 3: Know Your Ingredients",
        content: "Ingredient deep dive based on your products. Understanding what each ingredient does helps you make better choices.",
        emoji: "🔬"
      },
      4: {
        title: "Day 4: Sun Protection",
        content: "SPF is your skin's best friend. Daily sunscreen prevents premature aging and protects against skin damage.",
        emoji: "☀️"
      },
      5: {
        title: "Day 5: Hydration Matters",
        content: "Proper hydration keeps your skin barrier healthy. Drink water and use hydrating products for plump, healthy skin.",
        emoji: "💧"
      }
    };
    return tips[day as keyof typeof tips] || tips[1];
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={[styles.loadingText, { color: Colors.light.text }]}>
            Loading your home...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <View style={styles.emptyContainer}>
          <IconSymbol name="person.circle" size={60} color="#007AFF" />
          <Text style={[styles.emptyTitle, { color: Colors.light.text }]}>
            Welcome to Glow
          </Text>
          <Text style={[styles.emptyText, { color: Colors.light.text }]}>
            Sign in to start your skincare journey
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text 
            style={[
              styles.greeting, 
              { 
                color: Colors.light.text,
                fontSize: getGreetingFontSize(user.first_name || 'there')
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.first_name || 'there'}! ✨
          </Text>
          <Text style={[styles.subtitle, { color: Colors.light.text }]}>
            Let's take care of your skin today
          </Text>
        </View>

        {/* Streak Card */}
        <View style={[styles.streakCard, { backgroundColor: Colors.light.cardBackground }]}>
          <View style={styles.streakHeader}>
            <IconSymbol name="flame.fill" size={24} color={Colors.light.accent} />
            <Text style={[styles.streakTitle, { color: Colors.light.text }]}>
              Your Streak
            </Text>
          </View>
          <Text style={[styles.streakNumber, { color: Colors.light.text }]}>
            {streak} day{streak > 1 ? 's' : ''}
          </Text>
          <Text style={[styles.streakSubtext, { color: Colors.light.text }]}>
            Keep up the great work! 🔥
          </Text>
        </View>

        {/* Progress Bar */}
        <TouchableOpacity 
          style={styles.progressContainer}
          onPress={() => router.push('/(tabs)/30_days' as any)}
        >
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: Colors.light.text }]}>
              Progress to 30 Days
            </Text>
            <Text style={[styles.progressText, { color: Colors.light.text }]}>
              {streak}/30
            </Text>
          </View>
                                           <View style={[styles.progressBarBackground, { backgroundColor: '#8B4513' }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    flex: Math.min((streak / 30), 1),
                    backgroundColor: Colors.light.tint
                  }
                ]} 
              />
            </View>
        </TouchableOpacity>

        {/* To-Do List */}
        <View style={styles.todoSection}>
          <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>
            Today's Tasks
          </Text>
          {todoItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.todoItem,
                { backgroundColor: Colors.light.cardBackground },
                item.completed && styles.todoItemCompleted
              ]}
              onPress={() => handleTodoPress(item)}
            >
              <View style={styles.todoContent}>
                <IconSymbol 
                  name="heart.fill"
                  size={20} 
                  color={item.completed ? Colors.light.success : Colors.light.tint} 
                />
                <Text style={[
                  styles.todoText, 
                  { color: Colors.light.text },
                  item.completed && styles.todoTextCompleted
                ]}>
                  {item.title}
                </Text>
              </View>
              <IconSymbol 
                name={item.completed ? 'checkmark.circle.fill' : 'chevron.right'} 
                size={20} 
                color={item.completed ? Colors.light.success : Colors.light.text} 
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Tip */}
        <View style={styles.dailyTipSection}>
          <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>
            Daily Tip
          </Text>
          <View style={[styles.dailyTipCard, { backgroundColor: Colors.light.cardBackground }]}>
            <View style={styles.dailyTipHeader}>
              <Text style={styles.dailyTipEmoji}>{getDailyTip(currentDay).emoji}</Text>
              <Text style={[styles.dailyTipTitle, { color: Colors.light.text }]}>
                {getDailyTip(currentDay).title}
              </Text>
            </View>
            <Text style={[styles.dailyTipContent, { color: Colors.light.text }]}>
              {getDailyTip(currentDay).content}
            </Text>
          </View>
        </View>

        {/* Skin Goals */}
        {user.skin_goals && user.skin_goals.length > 0 && (
          <View style={styles.goalsSection}>
            <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>
              Your Skin Goals
            </Text>
            <View style={styles.goalsContainer}>
              {user.skin_goals.map((goal, index) => (
                <View key={index} style={[styles.goalChip, { backgroundColor: Colors.light.cardBackground }]}>
                  <Text style={styles.goalEmoji}>{getGoalEmoji(goal)}</Text>
                  <Text style={[styles.goalText, { color: Colors.light.text }]}>
                    {goal}
                  </Text>
                </View>
              ))}
            </View>
          </View>
                 )}

         {/* Quick Actions */}
         <View style={styles.quickActionsSection}>
           <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>
             Quick Actions
           </Text>
           <View style={styles.quickActionsContainer}>
             <TouchableOpacity 
               style={[styles.quickAction, { backgroundColor: Colors.light.cardBackground }]}
               onPress={() => router.push('/(tabs)/advice' as any)}
             >
               <IconSymbol name="message.fill" size={24} color={Colors.light.tint} />
               <Text style={[styles.quickActionText, { color: Colors.light.text }]}>
                 Ask Advice
               </Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.quickAction, { backgroundColor: Colors.light.cardBackground }]}
               onPress={() => router.push('/(tabs)/progress' as any)}
             >
               <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={Colors.light.tint} />
               <Text style={[styles.quickActionText, { color: Colors.light.text }]}>
                 View Progress
               </Text>
             </TouchableOpacity>
           </View>
         </View>



       </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  streakCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  streakSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  todoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  todoItemCompleted: {
    opacity: 0.6,
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
  },
  dailyTipSection: {
    marginBottom: 32,
  },
  dailyTipCard: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dailyTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dailyTipEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  dailyTipTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dailyTipContent: {
    fontSize: 14,
    opacity: 0.8,
  },
  goalsSection: {
    marginBottom: 32,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  goalEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
    goalText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
 }); 
