import { Colors } from '@/constants/Colors';
import { supabase } from '@/constants/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOpenAIChat } from '@/hooks/useOpenAIChat';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Add type for routine result
interface RoutineResult {
  steps: string[];
  missing?: string[];
}

export default function RoutineScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user } = useSupabase();
  const { sendMessage } = useOpenAIChat('routine');
  const [isLoading, setIsLoading] = useState(false);
  const [routineResult, setRoutineResult] = useState<RoutineResult | null>(null);
  // Use onboarding fields from user
  const [skinType, setSkinType] = useState(user?.skin_type ?? '');
  const [skinConcerns, setSkinConcerns] = useState(Array.isArray(user?.skin_concerns) ? user.skin_concerns : []);
  const [skinGoals, setSkinGoals] = useState(Array.isArray(user?.skin_goals) ? user.skin_goals : []);

  // Helper to fetch user products
  const fetchProducts = async (): Promise<any[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', user.id);
    if (error) throw error;
    return data || [];
  };

  // Helper to compare product snapshots
  function areProductSnapshotsEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    const sortFn = (x: any, y: any) => (x.id > y.id ? 1 : -1);
    const aSorted = [...a].sort(sortFn);
    const bSorted = [...b].sort(sortFn);
    return aSorted.every((prod, idx) =>
      prod.id === bSorted[idx].id &&
      prod.name === bSorted[idx].name &&
      prod.type === bSorted[idx].type
    );
  }

  // Full routine generation logic
  const handleGenerateRoutine = async () => {
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to generate a routine.');
      return;
    }
    setIsLoading(true);
    setRoutineResult(null);
    try {
      // 1. Fetch latest routine
      const { data: existingRoutine } = await supabase
        .from('user_routines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (existingRoutine && existingRoutine.routine_json) {
        setRoutineResult(existingRoutine.routine_json);
        setIsLoading(false);
        return;
      }
      // 2. Fetch products
      const products = await fetchProducts();
      if (!products.length) {
        setIsLoading(false);
        Alert.alert('No products found', 'Please input your products first.');
        return;
      }
      // 3. Get skin type, concerns, and goals
      let currentSkinType = user?.skin_type ?? '';
      let currentSkinConcerns = Array.isArray(user?.skin_concerns) ? user.skin_concerns : [];
      let currentSkinGoals = Array.isArray(user?.skin_goals) ? user.skin_goals : [];
      if (!currentSkinType || currentSkinConcerns.length === 0 || currentSkinGoals.length === 0) {
        setIsLoading(false);
        Alert.alert('Missing profile info', 'Please complete your onboarding (skin type, concerns, and goals) before generating a routine.');
        return;
      }
      // 4. Call GPT-4o
      const userMessage = `My skin type is ${currentSkinType}. My main skin concerns are: ${currentSkinConcerns.join(', ')}. My skincare goals are: ${currentSkinGoals.join(', ')}. Here are my products: ${products.map(p => `${p.name} (${p.type})`).join(', ')}. Please generate a step-by-step skincare routine using my products. If any product is missing for a complete routine, suggest what I should add.`;
      const aiResponse = await sendMessage(userMessage);
      if (!aiResponse) throw new Error('No response from AI');
      // 5. Parse AI response (simple: split steps, look for missing)
      const steps = aiResponse.split(/\n|\d+\./).map(s => s.trim()).filter(Boolean);
      const missing = aiResponse.toLowerCase().includes('missing') ? ['(see AI suggestion)'] : [];
      const routineJson = { steps, missing };
      // 6. Save to Supabase
      await supabase.from('user_routines').insert({
        user_id: user.id,
        routine_json: routineJson,
        products_snapshot: products.map((p: any) => ({ id: p.id, name: p.name, type: p.type })),
      });
      setRoutineResult(routineJson);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate routine.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}> 
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors.light.text }]}>Your Routine</Text>
          <Text style={[styles.subtitle, { color: Colors.light.text }]}>Manage and start your skincare routine</Text>
          {user?.routine_streak && user.routine_streak > 0 && (
            <Text style={[styles.streakText, { color: Colors.light.text }]}>
              {`${user.routine_streak} day${user.routine_streak > 1 ? 's' : ''} routine streak! 🔥`}
            </Text>
          )}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: Colors.light.tint }]}
            onPress={() => router.push('/InputProductsScreen')}
          >
            <Text style={styles.buttonText}>Input Products</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: Colors.light.tint }]}
            onPress={handleGenerateRoutine}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate Routine</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: Colors.light.tint }]}
            onPress={() => router.push('/GuidedRoutineScreen')}
          >
            <Text style={styles.buttonText}>Start a Routine</Text>
          </TouchableOpacity>
        </View>
        {routineResult && (
          <View style={[styles.routineResult, { backgroundColor: Colors.light.cardBackground }]}>
            <Text style={[styles.resultTitle, { color: Colors.light.text }]}>Routine Steps:</Text>
            {routineResult.steps.map((step: string, idx: number) => (
              <Text key={idx} style={[styles.resultStep, { color: Colors.light.text }]}>{idx + 1}. {step}</Text>
            ))}
            {routineResult.missing && routineResult.missing.length > 0 && (
              <Text style={[styles.missingText, { color: Colors.light.error }]}>Missing products: {routineResult.missing.join(', ')}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Add some padding at the bottom for the last element
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
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
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButton: {
    paddingVertical: 24,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginVertical: 16,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  routineResult: {
    marginTop: 32,
    paddingHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  resultStep: {
    fontSize: 16,
    marginBottom: 4,
  },
  missingText: {
    marginTop: 8,
    fontWeight: '600',
  },
  streakText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
}); 
