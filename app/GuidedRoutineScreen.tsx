import { Colors } from '@/constants/Colors';
import { supabase } from '@/constants/supabase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSupabase } from '@/hooks/useSupabase';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GuidedRoutineScreen() {
  const colorScheme = useColorScheme();
  const { user } = useSupabase();
  const [routine, setRoutine] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(60); // 60s per step placeholder
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (user) fetchRoutine();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [user]);

  useEffect(() => {
    if (!isPaused && routine && currentStep < routine.steps.length) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleNext();
            return 60;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current!);
    } else if (isPaused && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [isPaused, currentStep, routine]);

  const fetchRoutine = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error || !data) {
      Alert.alert('No routine found', 'Please generate a routine first.');
      setLoading(false);
      return;
    }
    try {
      const routineJson = typeof data.routine_json === 'string' ? JSON.parse(data.routine_json) : data.routine_json;
      setRoutine(routineJson);
    } catch (e) {
      Alert.alert('Error', 'Failed to parse routine.');
    }
    setLoading(false);
  };

  const handleNext = () => {
    if (routine && currentStep < routine.steps.length - 1) {
      setCurrentStep((s) => s + 1);
      setTimer(60);
    }
  };
  const handlePause = () => setIsPaused((p) => !p);
  const handleFinish = async () => {
    setCurrentStep(routine.steps.length - 1);
    setTimer(0);
    setIsPaused(true);
    
    // Update routine streak with proper missed day handling
    if (user) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if user completed a routine today
        const { data: todayRoutine } = await supabase
          .from('user_routines')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

        // If this is the first routine of the day, update the streak
        if (!todayRoutine || todayRoutine.length === 0) {
          // Save the routine completion record
          await supabase
            .from('user_routines')
            .insert({
              user_id: user.id,
              routine_json: routine,
              completed: true,
            });

          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          // Check if user completed a routine yesterday
          const { data: yesterdayRoutine } = await supabase
            .from('user_routines')
            .select('created_at')
            .eq('user_id', user.id)
            .gte('created_at', yesterday.toISOString())
            .lt('created_at', today.toISOString());

          // Get current streak
          const { data: currentUser } = await supabase
            .from('users')
            .select('routine_streak')
            .eq('id', user.id)
            .single();

          let newStreak: number;

          if (yesterdayRoutine && yesterdayRoutine.length > 0) {
            // Continue streak - user completed routine yesterday
            newStreak = (currentUser?.routine_streak || 0) + 1;
          } else {
            // Start new streak - user missed yesterday or this is their first routine
            newStreak = 1;
          }

          await supabase
            .from('users')
            .update({ routine_streak: newStreak })
            .eq('id', user.id);

          Alert.alert(
            'Routine Complete! 🎉',
            `Great job! Your routine streak is now ${newStreak} day${newStreak > 1 ? 's' : ''}!`
          );
        } else {
          // User already completed a routine today, don't update streak
          Alert.alert(
            'Routine Complete! 🎉',
            'Great job completing your routine!'
          );
        }
      } catch (error) {
        console.error('Error updating routine streak:', error);
        Alert.alert(
          'Routine Complete! 🎉',
          'Great job completing your routine!'
        );
      }
    }
  };

  if (!user) {
    return <View style={[styles.container, { backgroundColor: Colors.light.background }]}><Text style={{ color: Colors.light.text, textAlign: 'center', marginTop: 32 }}>Please sign in to start your routine.</Text></View>;
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!routine) return <View style={styles.center}><Text>No routine found.</Text></View>;

  const progress = ((currentStep + 1) / routine.steps.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}> 
      <Text style={[styles.title, { color: Colors.light.text }]}>Guided Routine</Text>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: Colors.light.tint }]} />
      </View>
      <Text style={[styles.stepCount, { color: Colors.light.text }]}>Step {currentStep + 1} of {routine.steps.length}</Text>
      <View style={styles.stepBox}>
        <Text style={[styles.stepText, { color: Colors.light.text }]}>
          {routine.steps[currentStep]}
        </Text>
        <Text style={[styles.timerText, { color: Colors.light.tint }]}>{timer}s</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlButton, { backgroundColor: Colors.light.tint }]} onPress={handlePause}>
          <Text style={styles.controlButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, { backgroundColor: Colors.light.tint }]} onPress={handleNext}>
          <Text style={styles.controlButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, { backgroundColor: Colors.light.tint }]} onPress={handleFinish}>
          <Text style={styles.controlButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center', lineHeight: 34 },
  progressBarBg: { height: 12, backgroundColor: '#E0E0E0', borderRadius: 6, marginBottom: 24, overflow: 'hidden' },
  progressBar: { height: 12 },
  stepCount: { textAlign: 'center', marginBottom: 16, fontSize: 18, fontWeight: '600', color: '#424242' },
  stepBox: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 32, 
    alignItems: 'center', 
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  stepText: { color: "#424242", fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 16, lineHeight: 28 },
  timerText: { fontSize: 32, fontWeight: '700' },
  controls: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 },
  controlButton: { 
    padding: 20, 
    borderRadius: 12, 
    minWidth: 100, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  controlButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}); 
