import { PhotoUpload } from '@/components/PhotoUpload';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOpenAIChat } from '@/hooks/useOpenAIChat';
import { useSupabase } from '@/hooks/useSupabase';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CheckInScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [moodRating, setMoodRating] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [flareUps, setFlareUps] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  
  const colorScheme = useColorScheme();
  const { user, uploadPhoto, saveSkinPhoto, getDailyStreak } = useSupabase();
  const { sendMessage, loading: aiLoading } = useOpenAIChat('checkin');
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (user) {
      loadStreak();
    }
  }, [user]);

  const loadStreak = async () => {
    const currentStreak = await getDailyStreak();
    setStreak(currentStreak);
  };

  const handlePhotoTaken = (uri: string) => {
    setPhotoUri(uri);
  };

  const handleRetakePhoto = () => {
    setPhotoUri(null);
    setMoodRating(null);
    setSleepQuality(null);
    setStressLevel(null);
    setFlareUps(null);
    setAiMessage(null);
  };

  const handleMoodRating = (rating: number) => {
    setMoodRating(rating);
  };

  const handleSleepQuality = (rating: number) => {
    setSleepQuality(rating);
  };

  const handleStressLevel = (rating: number) => {
    setStressLevel(rating);
  };

  const handleFlareUps = (rating: number) => {
    setFlareUps(rating);
  };

  const handleSubmit = async () => {
    if (!photoUri || moodRating === null) {
      Alert.alert('Error', 'Please take a photo and rate your mood');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photo to Supabase Storage
      const photoUrl = await uploadPhoto(photoUri);
      if (!photoUrl) {
        throw new Error('Failed to upload photo');
      }

      // Save to database with enhanced data
      const savedPhoto = await saveSkinPhoto(photoUrl, moodRating, {
        sleepQuality,
        stressLevel,
        flareUps,
      });
      if (!savedPhoto) {
        throw new Error('Failed to save photo data');
      }

      // Get AI encouragement with enhanced context
      const context = `User took a daily photo and rated their skin mood as ${moodRating}/5`;
      const additionalContext = [
        sleepQuality !== null && `Sleep quality: ${sleepQuality}/5`,
        stressLevel !== null && `Stress level: ${stressLevel}/5`,
        flareUps !== null && `Flare-ups: ${flareUps}/5`,
      ].filter(Boolean).join(', ');
      
      const aiResponse = await sendMessage(
        `${context}${additionalContext ? `. Additional factors: ${additionalContext}` : ''}. Give them personalized encouragement and tips based on their ratings.`
      );

      if (aiResponse) {
        setAiMessage(aiResponse);
      }

      // Update streak
      await loadStreak();

      Alert.alert('Success', 'Daily check-in completed! ✨');
    } catch (error) {
      console.error('Error submitting check-in:', error);
      Alert.alert('Error', 'Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodEmoji = (rating: number) => {
    const emojis = ['😔', '😕', '😖', '🙂', '😊'];
    return emojis[rating - 1] || '😐';
  };

  const getSleepEmoji = (rating: number) => {
    const emojis = ['😴', '😪', '😴', '😌', '😊'];
    return emojis[rating - 1] || '😴';
  };

  const getStressEmoji = (rating: number) => {
    const emojis = ['😊', '😌', '😐', '😨', '😰'];
    return emojis[rating - 1] || '😐';
  };

  const getFlareUpEmoji = (rating: number) => {
    const emojis = ['😊', '🙂', '😐', '😣', '😖'];
    return emojis[rating - 1] || '😐';
  };

  const renderRatingSection = (
    title: string,
    rating: number | null,
    onRating: (rating: number) => void,
    getEmoji: (rating: number) => string,
    labels: string[]
  ) => (
    <View style={styles.ratingSection}>
      <Text style={[styles.ratingTitle, { color: Colors.light.text }]}>
        {title}
      </Text>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.ratingButton,
              rating === r && styles.ratingButtonSelected,
              { borderColor: Colors.light.tint, borderWidth: 2, backgroundColor: rating === r ? Colors.light.tint : 'rgba(0,0,0,0.05)' }
            ]}
            onPress={() => onRating(r)}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={[styles.ratingEmoji, { color: rating === r ? '#fff' : Colors.light.text }]}>
              {getEmoji(r)}
            </Text>
            <Text style={[styles.ratingText, { color: rating === r ? '#fff' : Colors.light.text }]}>
              {r}
            </Text>
            <Text style={[styles.ratingLabel, { color: rating === r ? '#fff' : Colors.light.text }]}>
              {labels[r - 1]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors.light.text }]}>
            Daily Check-In
          </Text>
          <Text style={[styles.subtitle, { color: Colors.light.text }]}>
            {streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} streak! 🔥` : 'Start your journey today'}
          </Text>
        </View>

        <View style={[styles.photoSection, { marginBottom: 20, paddingVertical: 10, backgroundColor: Colors.light.background }]}>
          <Text style={[styles.sectionTitle, { color: Colors.light.text }]}>
            Take Your Daily Photo
          </Text>
          {!photoUri && (
            <View style={[styles.photoContainer, { height: Math.max(500, width * 0.8), minHeight: 450, maxHeight: 700 }]}>
              <PhotoUpload
                onPhotoTaken={handlePhotoTaken}
                onRetake={handleRetakePhoto}
                photoUri={photoUri || undefined}
                disabled={isSubmitting}
              />
            </View>
          )}
        </View>

        {photoUri && (
          <>
            <View style={styles.photoPreviewContainer}>
              <Text style={[styles.photoPreviewTitle, { color: Colors.light.text }]}>
                Your Photo
              </Text>
              <View style={styles.photoPreview}>
                <Image
                  source={{ uri: photoUri }}
                  style={{ width: '100%', height: '100%', borderRadius: 12 }}
                />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={handleRetakePhoto}
                  disabled={isSubmitting}
                >
                  <IconSymbol name="arrow.clockwise" size={16} color="#fff" />
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>

            {renderRatingSection(
              "How's your skin feeling today?",
              moodRating,
              handleMoodRating,
              getMoodEmoji,
              ['Poor', 'Fair', 'Okay', 'Good', 'Great']
            )}

            {renderRatingSection(
              "How was your sleep quality?",
              sleepQuality,
              handleSleepQuality,
              getSleepEmoji,
              ['Poor', 'Fair', 'Okay', 'Good', 'Great']
            )}

            {renderRatingSection(
              "What's your stress level?",
              stressLevel,
              handleStressLevel,
              getStressEmoji,
              ['None', 'Low', 'Normal', 'High', 'Severe']
            )}

            {renderRatingSection(
              "Any skin flare-ups?",
              flareUps,
              handleFlareUps,
              getFlareUpEmoji,
              ['None', 'Slight', 'Mild', 'Moderate', 'Severe']
            )}
          </>
        )}

        {aiMessage && (
          <View style={styles.aiMessageContainer}>
            <View style={[styles.aiMessage, { backgroundColor: Colors.light.cardBackground }]}>
              <IconSymbol name="sparkles" size={20} color={Colors.light.tint} />
              <Text style={[styles.aiMessageText, { color: Colors.light.text }]}>
                {aiMessage}
              </Text>
            </View>
          </View>
        )}

        {photoUri && moodRating !== null && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: Colors.light.tint, borderColor: Colors.light.text, borderWidth: 1, paddingVertical: Math.max(16, width * 0.04), borderRadius: Math.max(12, width * 0.03) },
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                <Text style={[styles.submitButtonText, { fontSize: Math.max(18, width * 0.05), color: '#fff', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 }]}>Complete Check-In</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  photoSection: {
    marginBottom: 32,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingSection: {
    marginBottom: 32,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  ratingButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    width: 60,
    height: 80,
    marginHorizontal: 4,
  },
  ratingButtonSelected: {
    transform: [{ scale: 1.05 }],
  },
  ratingEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ratingLabel: {
    fontSize: 8,
    textAlign: 'center',
  },
  aiMessageContainer: {
    marginVertical: 20,
  },
  aiMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  aiMessageText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 30,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    marginBottom: 25,
    paddingVertical: 10,
    alignItems: 'center',
  },
  photoPreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  photoPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: 300,
    minHeight: 150,
    maxHeight: 300,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
}); 
